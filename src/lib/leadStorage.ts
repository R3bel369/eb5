// ─── Local Lead Storage & Fallback Manager ────────────────────────────────────
// Ensures lead submissions are never lost and are directly accessible in Admin
// even when backend connectivity is offline or placeholder.

import type { Lead } from '../types/database'

const LEADS_STORAGE_KEY = 'shoora_local_leads'

// Initial seed leads for demonstration if database is empty
const INITIAL_DEMO_LEADS: Lead[] = [
  {
    id: 'lead-demo-1',
    auth_user_id: null,
    full_name: 'Rajesh Sharma',
    verified_email: 'rajesh.sharma@example.com',
    verified_phone: '+1 (408) 555-0192',
    country_of_residence: 'India',
    preferred_contact_method: 'email',
    interest_category: 'Rural TEA Investment',
    investment_timeframe: 'within_6_months',
    optional_budget_range: '$800,000 - $1,000,000',
    investment_capacity: '800k_1m',
    source_of_funds: 'Sale of residential property in Mumbai + personal savings',
    current_visa_status: 'H-1B',
    lead_status: 'consultation_requested',
    lead_source: 'ai_chatbot',
    engagement_score: 85,
    consultation_requested: true,
    follow_up_consent: true,
    marketing_email_consent: true,
    marketing_sms_consent: false,
    assigned_advisor: 'Elena Vance',
    admin_notes: 'Interested in Rural TEA set-aside category to file concurrent I-485 while on H-1B.',
    created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    last_interaction_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
  {
    id: 'lead-demo-2',
    auth_user_id: null,
    full_name: 'David Wei Chen',
    verified_email: 'david.chen@example.com',
    verified_phone: '+1 (650) 555-8371',
    country_of_residence: 'United States',
    preferred_contact_method: 'phone',
    interest_category: 'High Unemployment Area TEA',
    investment_timeframe: 'immediately',
    optional_budget_range: '$1,000,000+',
    investment_capacity: '1m_plus',
    source_of_funds: 'Tech company equity distribution & liquid securities',
    current_visa_status: 'F-1 OPT',
    lead_status: 'new_inquiry',
    lead_source: 'ai_chatbot',
    engagement_score: 92,
    consultation_requested: true,
    follow_up_consent: true,
    marketing_email_consent: false,
    marketing_sms_consent: false,
    assigned_advisor: null,
    admin_notes: 'OPT expires in 8 months, urgently reviewing TEA regional center options for concurrent filing.',
    created_at: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    last_interaction_at: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
  },
  {
    id: 'lead-demo-3',
    auth_user_id: null,
    full_name: 'Ananya Patel',
    verified_email: 'ananya.p@example.com',
    verified_phone: '+971 50 123 4567',
    country_of_residence: 'United Arab Emirates',
    preferred_contact_method: 'either',
    interest_category: 'Infrastructure Projects',
    investment_timeframe: '6_to_12_months',
    optional_budget_range: '$800,000 - $1,000,000',
    investment_capacity: '800k_1m',
    source_of_funds: 'Family business dividends',
    current_visa_status: null,
    lead_status: 'follow_up_required',
    lead_source: 'direct_portal',
    engagement_score: 70,
    consultation_requested: false,
    follow_up_consent: true,
    marketing_email_consent: false,
    marketing_sms_consent: false,
    assigned_advisor: 'Marcus Thorne',
    admin_notes: 'Requested informational brochures on Infrastructure projects.',
    created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    last_interaction_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
]

export function getLocalLeads(): Lead[] {
  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_LEADS))
      return INITIAL_DEMO_LEADS
    }
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
    }
  } catch (err) {
    console.warn('Failed to parse local leads:', err)
  }
  return INITIAL_DEMO_LEADS
}

function cleanPhoneDigits(phone?: string | null): string {
  if (!phone) return ''
  return phone.replace(/\D/g, '').slice(-10)
}

export async function syncLeadToServer(lead: Lead) {
  // 1. Post to /api/leads
  try {
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    })
  } catch (err) {
    // Silently continue if offline
  }
}

export async function fetchRemoteLeads(): Promise<Lead[]> {
  try {
    const res = await fetch('/api/leads')
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data.leads)) {
        return data.leads
      }
    }
  } catch {
    // Ignore offline errors
  }
  return []
}

export function saveLocalLead(leadData: Partial<Lead>): Lead {
  const current = getLocalLeads()
  const targetEmail = leadData.verified_email?.trim().toLowerCase()
  const targetPhoneDigits = cleanPhoneDigits(leadData.verified_phone)

  const existingIdx = current.findIndex(l => {
    if (leadData.id && l.id === leadData.id) return true
    if (targetEmail && l.verified_email && l.verified_email.trim().toLowerCase() === targetEmail) return true
    if (targetPhoneDigits && l.verified_phone && cleanPhoneDigits(l.verified_phone) === targetPhoneDigits) return true
    return false
  })

  const now = new Date().toISOString()
  let finalLead: Lead

  if (existingIdx !== -1) {
    finalLead = {
      ...current[existingIdx],
      ...leadData,
      // Merge contact info without overwriting with null
      full_name: (leadData.full_name && leadData.full_name !== 'Prospective Investor')
        ? leadData.full_name
        : current[existingIdx].full_name,
      verified_email: leadData.verified_email || current[existingIdx].verified_email,
      verified_phone: leadData.verified_phone || current[existingIdx].verified_phone,
      updated_at: now,
      last_interaction_at: now,
    } as Lead
    current[existingIdx] = finalLead
  } else {
    finalLead = {
      id: leadData.id || `lead-${Date.now()}`,
      auth_user_id: leadData.auth_user_id ?? null,
      full_name: leadData.full_name ?? 'Prospective Investor',
      verified_email: leadData.verified_email ?? null,
      verified_phone: leadData.verified_phone ?? null,
      country_of_residence: leadData.country_of_residence ?? null,
      preferred_contact_method: leadData.preferred_contact_method ?? 'email',
      interest_category: leadData.interest_category ?? 'EB-5 Investor Visa',
      investment_timeframe: leadData.investment_timeframe ?? 'within_12_months',
      optional_budget_range: leadData.optional_budget_range ?? '$800,000 - $1,050,000',
      investment_capacity: leadData.investment_capacity ?? '800k_1m',
      source_of_funds: leadData.source_of_funds ?? null,
      current_visa_status: leadData.current_visa_status ?? null,
      lead_status: leadData.lead_status ?? 'new_inquiry',
      lead_source: leadData.lead_source ?? 'ai_chatbot',
      engagement_score: leadData.engagement_score ?? 70,
      consultation_requested: leadData.consultation_requested ?? true,
      follow_up_consent: leadData.follow_up_consent ?? true,
      marketing_email_consent: leadData.marketing_email_consent ?? true,
      marketing_sms_consent: leadData.marketing_sms_consent ?? true,
      assigned_advisor: leadData.assigned_advisor ?? null,
      admin_notes: leadData.admin_notes ?? 'Lead captured via chat.',
      created_at: now,
      updated_at: now,
      last_interaction_at: now,
    }
    current.unshift(finalLead)
  }

  try {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(current))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('shoora_leads_update', { detail: finalLead }))
      try {
        window.dispatchEvent(new StorageEvent('storage', { key: LEADS_STORAGE_KEY }))
      } catch {}
    }
  } catch (err) {
    console.warn('LocalStorage save notice:', err)
  }

  // Trigger background sync to server & database
  syncLeadToServer(finalLead)

  return finalLead
}

export function updateLocalLead(id: string, updates: Partial<Lead>): Lead | null {
  const current = getLocalLeads()
  const idx = current.findIndex(l => l.id === id)
  if (idx === -1) return null

  const updated: Lead = {
    ...current[idx],
    ...updates,
    updated_at: new Date().toISOString(),
  }
  current[idx] = updated
  localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(current))

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('shoora_leads_update', { detail: updated }))
  }
  syncLeadToServer(updated)

  return updated
}

export function deleteLocalLead(id: string): boolean {
  const current = getLocalLeads()
  const filtered = current.filter(l => l.id !== id)
  if (filtered.length === current.length) return false
  localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(filtered))

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('shoora_leads_update', { detail: { id, deleted: true } }))
  }
  return true
}
