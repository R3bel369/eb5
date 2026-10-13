import { useState } from 'react'
import { X, Loader2, CheckCircle, MessageSquare } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useChat } from '../../contexts/ChatContext'
import { isValidEmail, isValidPhone } from '../../lib/utils'
import { saveLocalLead } from '../../lib/leadStorage'
import toast from 'react-hot-toast'

interface ConsultationFormProps {
  onClose: () => void
}

export function ConsultationForm({ onClose }: ConsultationFormProps) {
  const { user, profile } = useAuth()
  const { collectedData, conversationId } = useChat()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState({
    fullName:        profile?.full_name        || collectedData.fullName   || '',
    email:           profile?.verified_email   || collectedData.email      || (user?.email || ''),
    phone:           profile?.verified_phone   || collectedData.phone      || '',
    country:         profile?.country_of_residence || collectedData.country || '',
    timeframe:       collectedData.timeframe   || '',
    message:         '',
    followUpConsent: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required.'
    if (!form.email && !form.phone) e.contact = 'Please provide at least an email or phone number.'
    if (form.email && !isValidEmail(form.email)) e.email = 'Please enter a valid email address.'
    if (form.phone && !isValidPhone(form.phone)) e.phone = 'Please enter a valid phone number.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      // Create or update lead
      const leadPayload = {
        auth_user_id:             user?.id ?? null,
        full_name:                form.fullName.trim(),
        verified_email:           form.email.trim() || null,
        verified_phone:           form.phone.trim() || null,
        country_of_residence:     form.country.trim() || null,
        investment_timeframe:     form.timeframe || null,
        lead_status:              'consultation_requested' as const,
        consultation_requested:   true,
        follow_up_consent:        form.followUpConsent,
        marketing_email_consent:  false,
        marketing_sms_consent:    false,
        lead_source:              'chatbot',
        engagement_score:         70,
        last_interaction_at:      new Date().toISOString(),
      }

      // 1. Always save into local leads storage for immediate admin CRM availability
      saveLocalLead({
        auth_user_id: user?.id ?? null,
        full_name: form.fullName.trim(),
        verified_email: form.email.trim() || null,
        verified_phone: form.phone.trim() || null,
        country_of_residence: form.country.trim() || null,
        preferred_contact_method: 'email',
        investment_timeframe: form.timeframe || null,
        lead_status: 'consultation_requested',
        lead_source: 'ai_chatbot',
        engagement_score: 80,
        consultation_requested: true,
        admin_notes: form.message ? `Consultation note: ${form.message}` : null,
      })

      // 2. Attempt remote Supabase upsert (if configured)
      try {
        const { data: leadData } = await supabase
          .from('leads')
          .upsert(leadPayload, {
            onConflict: user?.id ? 'auth_user_id' : 'verified_email',
            ignoreDuplicates: false,
          })
          .select('id')
          .single()

        if (leadData?.id) {
          // Record follow-up consent
          try {
            await supabase.from('consent_records').insert({
              lead_id:               leadData.id,
              consent_type:          'follow_up',
              consent_status:        form.followUpConsent,
              consent_text_version:  'v1.0',
              recorded_at:           new Date().toISOString(),
            })
          } catch (_) {}

          // Link conversation to lead
          if (conversationId) {
            try {
              await supabase
                .from('conversations')
                .update({ lead_id: leadData.id })
                .eq('id', conversationId)
            } catch (_) {}
          }

          // Trigger spreadsheet sync jobs
          try {
            await supabase.functions.invoke('sync-lead', {
              body: { lead_id: leadData.id, operation_type: 'insert' },
            })
          } catch (_) {}
        }
      } catch (remoteErr) {
        console.warn('Remote Supabase sync skipped or failed (local lead preserved):', remoteErr)
      }

      setDone(true)
      toast.success('Consultation request submitted! Details saved to admin CRM.')
    } catch (err) {
      console.error('Consultation submission error:', err)
      toast.error('Failed to submit your request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center animate-slide-up">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-emerald-600" />
          </div>
          <h2 className="font-display text-xl font-bold text-navy-900 mb-2">Request Submitted!</h2>
          <p className="text-navy-500 text-sm mb-6">
            A member of the Shoora EB-5 team will be in touch with you shortly.
          </p>
          <button onClick={onClose} className="btn-primary w-full">
            <MessageSquare className="w-4 h-4" />
            Continue the Conversation
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg animate-slide-up overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-navy-100">
          <div>
            <h2 className="font-display text-lg font-bold text-navy-900">Request a Consultation</h2>
            <p className="text-navy-400 text-xs mt-0.5">Connect with a Shoora EB-5 advisor</p>
          </div>
          <button
            id="close-consultation-btn"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-navy-50 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-navy-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Full name */}
          <div>
            <label htmlFor="consultation-name" className="block text-sm font-medium text-navy-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="consultation-name"
              type="text"
              value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              placeholder="Your full name"
              className={`input-field ${errors.fullName ? 'input-error' : ''}`}
            />
            {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="consultation-email" className="block text-sm font-medium text-navy-700 mb-1">
              Email Address
            </label>
            <input
              id="consultation-email"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com"
              className={`input-field ${errors.email ? 'input-error' : ''}`}
              readOnly={!!user?.email}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="consultation-phone" className="block text-sm font-medium text-navy-700 mb-1">
              Phone Number
            </label>
            <input
              id="consultation-phone"
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+1 555 000 0000"
              className={`input-field ${errors.phone ? 'input-error' : ''}`}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
          {errors.contact && <p className="text-red-500 text-xs">{errors.contact}</p>}

          {/* Country */}
          <div>
            <label htmlFor="consultation-country" className="block text-sm font-medium text-navy-700 mb-1">
              Country of Residence
            </label>
            <input
              id="consultation-country"
              type="text"
              value={form.country}
              onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
              placeholder="e.g. India, UAE, China"
              className="input-field"
            />
          </div>

          {/* Timeframe */}
          <div>
            <label htmlFor="consultation-timeframe" className="block text-sm font-medium text-navy-700 mb-1">
              Approximate Investment Timeframe
            </label>
            <select
              id="consultation-timeframe"
              value={form.timeframe}
              onChange={e => setForm(f => ({ ...f, timeframe: e.target.value }))}
              className="input-field"
            >
              <option value="">Select a timeframe</option>
              <option value="immediate">Immediately (within 3 months)</option>
              <option value="6_months">Within 6 months</option>
              <option value="1_year">Within 1 year</option>
              <option value="1_2_years">1–2 years</option>
              <option value="exploring">Still exploring, no set timeline</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="consultation-message" className="block text-sm font-medium text-navy-700 mb-1">
              Additional Message <span className="text-navy-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="consultation-message"
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Any specific questions or context you'd like to share…"
              rows={3}
              className="input-field resize-none"
            />
          </div>

          {/* Follow-up consent */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              id="follow-up-consent"
              checked={form.followUpConsent}
              onChange={e => setForm(f => ({ ...f, followUpConsent: e.target.checked }))}
              className="mt-0.5 w-4 h-4 rounded accent-navy-700"
            />
            <span className="text-xs text-navy-500 leading-relaxed">
              I agree to be contacted by the Shoora EB-5 team regarding my inquiry.
              I understand this is not consent to marketing communications.
            </span>
          </label>

          <p className="text-xs text-navy-400">
            By submitting, your information will be securely stored and used only to facilitate your advisor consultation.
          </p>

          <button
            id="submit-consultation-btn"
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Submitting…' : 'Submit Consultation Request'}
          </button>
        </div>
      </div>
    </div>
  )
}
