// Supabase Edge Function: sync-lead
// Queues spreadsheet sync jobs for a lead (transactional outbox pattern)
// Deploy: supabase functions deploy sync-lead

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { lead_id, operation_type = 'insert' } = await req.json()
    if (!lead_id) return new Response(JSON.stringify({ error: 'lead_id required' }), { status: 400, headers: CORS })

    // Fetch enabled integrations
    const { data: integrations } = await supabase
      .from('spreadsheet_integrations')
      .select('provider, enabled, configuration_status')
      .eq('enabled', true)

    const results: Record<string, string> = {}

    for (const integ of integrations ?? []) {
      if (integ.configuration_status === 'not_configured') {
        results[integ.provider] = 'disabled'
        continue
      }

      // Check for existing pending/processing job (idempotency)
      const { data: existing } = await supabase
        .from('spreadsheet_sync_jobs')
        .select('id, sync_status')
        .eq('lead_id', lead_id)
        .eq('provider', integ.provider)
        .in('sync_status', ['pending', 'processing'])
        .maybeSingle()

      if (existing) {
        results[integ.provider] = 'already_queued'
        continue
      }

      // Create sync job
      const { error } = await supabase
        .from('spreadsheet_sync_jobs')
        .insert({
          lead_id,
          provider:        integ.provider,
          operation_type,
          sync_status:     'pending',
          attempt_count:   0,
          created_at:      new Date().toISOString(),
          updated_at:      new Date().toISOString(),
        })

      results[integ.provider] = error ? `error: ${error.message}` : 'queued'
    }

    // Trigger the processor
    if (Object.values(results).some(r => r === 'queued')) {
      // Fire-and-forget the processor
      fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-sync-jobs`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type':  'application/json',
          },
          body: JSON.stringify({}),
        }
      ).catch(err => console.warn('Failed to invoke processor:', err))
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('sync-lead error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: CORS,
    })
  }
})
