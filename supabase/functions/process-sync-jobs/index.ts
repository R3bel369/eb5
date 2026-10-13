// Supabase Edge Function: process-sync-jobs
// Processes pending spreadsheet sync jobs with exponential backoff
// Deploy: supabase functions deploy process-sync-jobs
// Can also be triggered on a schedule via pg_cron or Supabase cron.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_ATTEMPTS = 5
const BACKOFF_BASE_MS = 30_000 // 30 seconds base

function nextAttemptTime(attemptCount: number): string {
  const delayMs = BACKOFF_BASE_MS * Math.pow(2, attemptCount)
  return new Date(Date.now() + delayMs).toISOString()
}

// ─── Lead data formatter ──────────────────────────────────────────────────────

function leadToRow(lead: Record<string, unknown>): unknown[][] {
  return [[
    lead.id,
    lead.created_at,
    lead.full_name ?? '',
    lead.verified_email ?? '',
    lead.verified_phone ?? '',
    lead.country_of_residence ?? '',
    lead.preferred_contact_method ?? '',
    lead.interest_category ?? '',
    lead.investment_timeframe ?? '',
    lead.optional_budget_range ?? '',
    lead.lead_status ?? '',
    lead.engagement_score ?? 0,
    lead.consultation_requested ? 'Yes' : 'No',
    lead.follow_up_consent ? 'Yes' : 'No',
    lead.last_interaction_at ?? '',
    lead.lead_source ?? '',
    lead.assigned_advisor ?? '',
    lead.admin_notes ?? '',
    'Synced',
  ]]
}

// ─── Microsoft Excel sync ─────────────────────────────────────────────────────

async function syncToExcel(lead: Record<string, unknown>, job: Record<string, unknown>): Promise<string> {
  const tenantId      = Deno.env.get('MICROSOFT_TENANT_ID')
  const clientId      = Deno.env.get('MICROSOFT_CLIENT_ID')
  const clientSecret  = Deno.env.get('MICROSOFT_CLIENT_SECRET')
  const driveId       = Deno.env.get('MICROSOFT_DRIVE_ID')
  const workbookId    = Deno.env.get('MICROSOFT_WORKBOOK_ITEM_ID')

  if (!tenantId || !clientId || !clientSecret || !driveId || !workbookId) {
    throw new Error('Microsoft Excel integration not configured. Set MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_DRIVE_ID, MICROSOFT_WORKBOOK_ITEM_ID.')
  }

  // Get access token
  const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     clientId,
      client_secret: clientSecret,
      scope:         'https://graph.microsoft.com/.default',
    }),
  })
  if (!tokenRes.ok) throw new Error(`Token request failed: ${tokenRes.status}`)
  const { access_token } = await tokenRes.json()

  const baseUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${workbookId}/workbook`
  const headers = { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' }

  const existingRowId = job.external_row_identifier as string | null
  const tableRowsUrl  = `${baseUrl}/tables/ShooraLeads/rows`
  const rowData       = leadToRow(lead)

  if (job.operation_type === 'insert' || !existingRowId) {
    // INSERT: append row to table
    const res = await fetch(tableRowsUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ values: rowData }),
    })
    if (!res.ok) throw new Error(`Excel insert failed: ${res.status} ${await res.text()}`)
    const insertedRow = await res.json()
    return insertedRow.index?.toString() ?? 'unknown'

  } else {
    // UPDATE: patch existing row by index
    const res = await fetch(`${tableRowsUrl}/itemAt(index=${existingRowId})`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ values: rowData }),
    })
    if (!res.ok) throw new Error(`Excel update failed: ${res.status} ${await res.text()}`)
    return existingRowId
  }
}

// ─── Google Sheets sync ───────────────────────────────────────────────────────

async function syncToGoogleSheets(lead: Record<string, unknown>, job: Record<string, unknown>): Promise<string> {
  const spreadsheetId = Deno.env.get('GOOGLE_SPREADSHEET_ID')
  const clientId      = Deno.env.get('GOOGLE_CLIENT_ID')
  const clientSecret  = Deno.env.get('GOOGLE_CLIENT_SECRET')
  const serviceAccountJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS')

  if (!spreadsheetId) {
    throw new Error('Google Sheets integration not configured. Set GOOGLE_SPREADSHEET_ID.')
  }

  let accessToken: string

  if (serviceAccountJson) {
    // Service account authentication
    const sa = JSON.parse(serviceAccountJson)
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion:  await createServiceAccountJwt(sa),
      }),
    })
    if (!tokenRes.ok) throw new Error(`Service account token failed: ${tokenRes.status}`)
    const tokenData = await tokenRes.json()
    accessToken = tokenData.access_token

  } else if (clientId && clientSecret) {
    // OAuth2 — requires a stored refresh token (set GOOGLE_REFRESH_TOKEN)
    const refreshToken = Deno.env.get('GOOGLE_REFRESH_TOKEN')
    if (!refreshToken) throw new Error('GOOGLE_REFRESH_TOKEN not set. Complete OAuth flow first.')
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        client_id:     clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    })
    if (!tokenRes.ok) throw new Error(`OAuth token refresh failed: ${tokenRes.status}`)
    const tokenData = await tokenRes.json()
    accessToken = tokenData.access_token

  } else {
    throw new Error('Google Sheets integration not configured. Set GOOGLE_SERVICE_ACCOUNT_CREDENTIALS or GOOGLE_CLIENT_ID/SECRET.')
  }

  const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
  const sheetName = 'Customer Leads'
  const rowData = leadToRow(lead)[0]
  const existingRow = job.external_row_identifier as string | null

  if (job.operation_type === 'insert' || !existingRow) {
    // Append row
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ values: [rowData] }),
      }
    )
    if (!res.ok) throw new Error(`Sheets append failed: ${res.status} ${await res.text()}`)
    const result = await res.json()
    // Extract row number from updatedRange (e.g., "Customer Leads!A5:S5" → "5")
    const range = result.updates?.updatedRange ?? ''
    const match = range.match(/!.*?(\d+):/)
    return match?.[1] ?? 'unknown'

  } else {
    // Update existing row
    const range = `${sheetName}!A${existingRow}:S${existingRow}`
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({ values: [rowData], range }),
      }
    )
    if (!res.ok) throw new Error(`Sheets update failed: ${res.status} ${await res.text()}`)
    return existingRow
  }
}

// Minimal JWT signer for Google service accounts (RS256)
async function createServiceAccountJwt(sa: Record<string, string>): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }))
  const signingInput = `${header}.${payload}`

  // Import the private key
  const pemBody = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')
  const der = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))
  const key = await crypto.subtle.importKey(
    'pkcs8', der.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign']
  )
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  return `${signingInput}.${sigB64}`
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    // Fetch pending jobs (up to 20 at a time)
    const now = new Date().toISOString()
    const { data: jobs, error: jobsErr } = await supabase
      .from('spreadsheet_sync_jobs')
      .select('*')
      .eq('sync_status', 'pending')
      .or(`next_attempt_at.is.null,next_attempt_at.lte.${now}`)
      .lt('attempt_count', MAX_ATTEMPTS)
      .order('created_at', { ascending: true })
      .limit(20)

    if (jobsErr) throw jobsErr

    console.log(`Processing ${jobs?.length ?? 0} pending sync jobs`)

    const results = []

    for (const job of jobs ?? []) {
      // Mark as processing
      await supabase
        .from('spreadsheet_sync_jobs')
        .update({ sync_status: 'processing', last_attempt_at: now, updated_at: now })
        .eq('id', job.id)

      // Fetch lead
      const { data: lead, error: leadErr } = await supabase
        .from('leads')
        .select('*')
        .eq('id', job.lead_id)
        .single()

      if (leadErr || !lead) {
        await supabase.from('spreadsheet_sync_jobs').update({
          sync_status: 'failed',
          last_error: `Lead not found: ${job.lead_id}`,
          updated_at: new Date().toISOString(),
        }).eq('id', job.id)
        continue
      }

      try {
        let externalRowId: string

        if (job.provider === 'excel') {
          externalRowId = await syncToExcel(lead as Record<string, unknown>, job as Record<string, unknown>)
        } else if (job.provider === 'google_sheets') {
          externalRowId = await syncToGoogleSheets(lead as Record<string, unknown>, job as Record<string, unknown>)
        } else {
          throw new Error(`Unknown provider: ${job.provider}`)
        }

        // Success
        await supabase.from('spreadsheet_sync_jobs').update({
          sync_status:            'synced',
          external_row_identifier: externalRowId,
          attempt_count:           job.attempt_count + 1,
          last_error:              null,
          updated_at:              new Date().toISOString(),
        }).eq('id', job.id)

        // Update integration health record
        await supabase.from('spreadsheet_integrations').update({
          last_success_at:     new Date().toISOString(),
          configuration_status: 'configured',
        }).eq('provider', job.provider)

        results.push({ jobId: job.id, provider: job.provider, status: 'synced', externalRowId })

      } catch (syncErr) {
        const errMsg = (syncErr as Error).message
        const newAttemptCount = job.attempt_count + 1
        const isPermanentFailure = newAttemptCount >= MAX_ATTEMPTS

        await supabase.from('spreadsheet_sync_jobs').update({
          sync_status:    isPermanentFailure ? 'failed' : 'retry_scheduled',
          attempt_count:  newAttemptCount,
          last_error:     errMsg,
          next_attempt_at: isPermanentFailure ? null : nextAttemptTime(newAttemptCount),
          updated_at:     new Date().toISOString(),
        }).eq('id', job.id)

        // Update integration error status
        await supabase.from('spreadsheet_integrations').update({
          last_error_at:       new Date().toISOString(),
          last_error_message:  errMsg.slice(0, 500),
          configuration_status: errMsg.includes('not configured') ? 'not_configured' : 'error',
        }).eq('provider', job.provider)

        results.push({ jobId: job.id, provider: job.provider, status: 'failed', error: errMsg })
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('process-sync-jobs error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: CORS,
    })
  }
})
