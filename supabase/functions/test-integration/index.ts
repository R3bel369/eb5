// Supabase Edge Function: test-integration
// Tests connectivity to Excel or Google Sheets without creating data
// Deploy: supabase functions deploy test-integration

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const { provider } = await req.json()

    if (provider === 'excel') {
      const tenantId     = Deno.env.get('MICROSOFT_TENANT_ID')
      const clientId     = Deno.env.get('MICROSOFT_CLIENT_ID')
      const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET')
      const driveId      = Deno.env.get('MICROSOFT_DRIVE_ID')
      const workbookId   = Deno.env.get('MICROSOFT_WORKBOOK_ITEM_ID')

      if (!tenantId || !clientId || !clientSecret || !driveId || !workbookId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Microsoft Excel integration is not configured. See .env.example for required variables.',
        }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
      }

      // Get token
      const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
          scope: 'https://graph.microsoft.com/.default',
        }),
      })
      if (!tokenRes.ok) {
        return new Response(JSON.stringify({ success: false, error: `Token request failed: ${tokenRes.status}` }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        })
      }
      const { access_token } = await tokenRes.json()

      // Check workbook exists
      const wbRes = await fetch(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${workbookId}`,
        { headers: { Authorization: `Bearer ${access_token}` } }
      )
      if (!wbRes.ok) {
        return new Response(JSON.stringify({ success: false, error: `Workbook not accessible: ${wbRes.status}` }), {
          headers: { ...CORS, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({ success: true, message: 'Excel connection successful.' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })

    } else if (provider === 'google_sheets') {
      const spreadsheetId = Deno.env.get('GOOGLE_SPREADSHEET_ID')
      if (!spreadsheetId) {
        return new Response(JSON.stringify({
          success: false,
          error: 'GOOGLE_SPREADSHEET_ID is not configured.',
        }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
      }

      // Try a simple metadata read (public API key or service account)
      const saJson = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS')
      if (!saJson) {
        return new Response(JSON.stringify({
          success: false,
          error: 'GOOGLE_SERVICE_ACCOUNT_CREDENTIALS not configured.',
        }), { headers: { ...CORS, 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({ success: true, message: 'Google Sheets credentials found. Full connection test requires OAuth token exchange.' }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })

    } else {
      return new Response(JSON.stringify({ success: false, error: `Unknown provider: ${provider}` }), {
        status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
