import type { Lead } from '../src/types/database'

// In-memory lead storage cache for serverless runtime
const serverLeadStore: Map<string, any> = new Map()

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', '*')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  // ── GET /api/leads: Return all leads ──
  if (req.method === 'GET') {
    const list = Array.from(serverLeadStore.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )
    res.status(200).json({ success: true, leads: list })
    return
  }

  // ── POST /api/leads: Upsert a lead ──
  if (req.method === 'POST') {
    try {
      const body = req.body || {}
      const leadData = typeof body === 'string' ? JSON.parse(body) : body

      const now = new Date().toISOString()
      const leadId = leadData.id || `lead-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

      const existing = serverLeadStore.get(leadId)
      const finalLead = {
        id: leadId,
        full_name: leadData.full_name || existing?.full_name || 'Prospective Investor',
        verified_email: leadData.verified_email ?? existing?.verified_email ?? null,
        verified_phone: leadData.verified_phone ?? existing?.verified_phone ?? null,
        country_of_residence: leadData.country_of_residence ?? existing?.country_of_residence ?? null,
        preferred_contact_method: leadData.preferred_contact_method ?? existing?.preferred_contact_method ?? 'email',
        interest_category: leadData.interest_category ?? existing?.interest_category ?? 'EB-5 Investor Visa',
        investment_timeframe: leadData.investment_timeframe ?? existing?.investment_timeframe ?? 'within_12_months',
        optional_budget_range: leadData.optional_budget_range ?? existing?.optional_budget_range ?? '$800,000 - $1,050,000',
        investment_capacity: leadData.investment_capacity ?? existing?.investment_capacity ?? '800k_1m',
        source_of_funds: leadData.source_of_funds ?? existing?.source_of_funds ?? null,
        current_visa_status: leadData.current_visa_status ?? existing?.current_visa_status ?? null,
        lead_status: leadData.lead_status ?? existing?.lead_status ?? 'new_inquiry',
        lead_source: leadData.lead_source ?? existing?.lead_source ?? 'ai_chatbot',
        engagement_score: leadData.engagement_score ?? existing?.engagement_score ?? 75,
        consultation_requested: leadData.consultation_requested ?? existing?.consultation_requested ?? true,
        follow_up_consent: leadData.follow_up_consent ?? existing?.follow_up_consent ?? true,
        marketing_email_consent: leadData.marketing_email_consent ?? existing?.marketing_email_consent ?? true,
        marketing_sms_consent: leadData.marketing_sms_consent ?? existing?.marketing_sms_consent ?? true,
        assigned_advisor: leadData.assigned_advisor ?? existing?.assigned_advisor ?? null,
        admin_notes: leadData.admin_notes ?? existing?.admin_notes ?? 'Lead captured via chat.',
        created_at: existing?.created_at || now,
        updated_at: now,
        last_interaction_at: now,
      }

      serverLeadStore.set(leadId, finalLead)

      // Optionally sync to Supabase if credentials exist
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

      if (supabaseUrl && supabaseKey) {
        try {
          await fetch(`${supabaseUrl}/rest/v1/leads`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'resolution=merge-duplicates',
            },
            body: JSON.stringify([finalLead]),
          })
        } catch (dbErr) {
          console.warn('[Leads API] Supabase sync note:', dbErr)
        }
      }

      res.status(200).json({ success: true, lead: finalLead })
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
    return
  }

  res.status(405).json({ error: 'Method not allowed' })
}
