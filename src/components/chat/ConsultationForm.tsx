import { useState } from 'react'
import {
  X, Loader2, CheckCircle2, MessageSquare, Calendar, Clock,
  Video, PhoneCall, MessageCircle, ShieldCheck, User, Mail,
  Phone, Globe, Sparkles, ChevronRight, ArrowRight, Download, ExternalLink
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { useChat } from '../../contexts/ChatContext'
import { isValidEmail } from '../../lib/utils'
import { saveLocalLead } from '../../lib/leadStorage'
import toast from 'react-hot-toast'

interface ConsultationFormProps {
  onClose: () => void
}

const CONSULTATION_TOPICS = [
  { id: 'rural-tea', label: '$800K Rural TEA (Priority Set-Aside)', icon: '🏔️' },
  { id: 'concurrent-filing', label: 'Concurrent Filing (H-1B / F-1 EAD in 60-180 days)', icon: '⚡' },
  { id: 'urban-tea', label: '$800K High Unemployment TEA Project', icon: '🏢' },
  { id: 'source-of-funds', label: 'Source-of-Funds Structuring & Gift Deeds', icon: '🛡️' },
  { id: 'family-protection', label: 'Family Green Cards & CSPA Child Protection', icon: '👥' },
  { id: 'general-feasibility', label: 'General EB-5 Feasibility & Strategy', icon: '🎯' },
]

const MEETING_MODES = [
  { id: 'video', label: 'Video Call', sub: 'Zoom / Google Meet', icon: Video },
  { id: 'phone', label: 'Phone Call', sub: 'Direct line', icon: PhoneCall },
  { id: 'whatsapp', label: 'WhatsApp', sub: 'Chat / Voice', icon: MessageCircle },
]

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning', hours: '09:00 AM – 12:00 PM' },
  { id: 'afternoon', label: 'Afternoon', hours: '12:00 PM – 04:00 PM' },
  { id: 'evening', label: 'Evening', hours: '04:00 PM – 08:00 PM' },
]

const TIMEZONES = [
  { id: 'US/Eastern', label: 'US Eastern (ET)' },
  { id: 'US/Central', label: 'US Central (CT)' },
  { id: 'US/Pacific', label: 'US Pacific (PT)' },
  { id: 'Asia/Kolkata', label: 'India Standard (IST)' },
  { id: 'Asia/Dubai', label: 'UAE Standard (GST)' },
  { id: 'Europe/London', label: 'London (GMT/BST)' },
  { id: 'Asia/Singapore', label: 'Singapore (SGT)' },
]

export function ConsultationForm({ onClose }: ConsultationFormProps) {
  const { user, profile } = useAuth()
  const { collectedData, conversationId } = useChat()
  const [loading, setLoading] = useState(false)
  const [confirmedBooking, setConfirmedBooking] = useState<{
    bookingId: string
    date: string
    timeSlot: string
    mode: string
    topic: string
    timezone: string
    name: string
    email: string
    phone: string
  } | null>(null)

  // Default to tomorrow's date
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultDateStr = tomorrow.toISOString().split('T')[0]

  const [form, setForm] = useState({
    fullName: profile?.full_name || collectedData.fullName || collectedData.name || '',
    email: profile?.verified_email || collectedData.email || (user?.email || ''),
    phone: profile?.verified_phone || collectedData.phone || '',
    country: profile?.country_of_residence || collectedData.country || '',
    visaStatus: 'H-1B',
    topic: 'rural-tea',
    mode: 'video',
    date: defaultDateStr,
    timeSlot: 'morning',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'US/Eastern',
    timeframe: collectedData.timeframe || 'within_6_months',
    message: '',
    followUpConsent: true,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.fullName.trim()) e.fullName = 'Full name is required.'
    if (!form.email && !form.phone) e.contact = 'Please provide an email or phone number.'
    if (form.email && !isValidEmail(form.email)) e.email = 'Please enter a valid email address.'
    if (!form.date) e.date = 'Please select a preferred date.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)

    const randomSuffix = Math.floor(10000 + Math.random() * 90000)
    const bookingId = `EB5-${randomSuffix}`

    const selectedTopicObj = CONSULTATION_TOPICS.find((t) => t.id === form.topic)
    const topicLabel = selectedTopicObj ? selectedTopicObj.label : form.topic
    const selectedSlotObj = TIME_SLOTS.find((s) => s.id === form.timeSlot)
    const slotLabel = selectedSlotObj ? `${selectedSlotObj.label} (${selectedSlotObj.hours})` : form.timeSlot

    try {
      // 1. Save lead into local storage & Firebase
      saveLocalLead({
        auth_user_id: user?.id ?? null,
        full_name: form.fullName.trim(),
        verified_email: form.email.trim() || null,
        verified_phone: form.phone.trim() || null,
        country_of_residence: form.country.trim() || (form.phone.startsWith('+91') ? 'India' : 'United States'),
        preferred_contact_method: form.mode === 'phone' ? 'phone' : 'email',
        interest_category: topicLabel,
        investment_timeframe: form.timeframe || null,
        current_visa_status: form.visaStatus,
        lead_status: 'consultation_requested',
        lead_source: 'consultation_booking',
        engagement_score: 95,
        consultation_requested: true,
        consultation_date: form.date,
        consultation_time: slotLabel,
        consultation_mode: form.mode,
        consultation_topic: topicLabel,
        booking_id: bookingId,
        admin_notes: `[Booking ${bookingId}] Mode: ${form.mode.toUpperCase()} | Date: ${form.date} (${slotLabel}) | Timezone: ${form.timezone} | Visa: ${form.visaStatus} | Note: ${form.message || 'None'}`,
      })

      // 2. Remote Supabase update if available
      try {
        await supabase.from('leads').upsert(
          {
            auth_user_id: user?.id ?? null,
            full_name: form.fullName.trim(),
            verified_email: form.email.trim() || null,
            verified_phone: form.phone.trim() || null,
            country_of_residence: form.country.trim() || null,
            interest_category: topicLabel,
            investment_timeframe: form.timeframe || null,
            lead_status: 'consultation_requested' as const,
            consultation_requested: true,
            follow_up_consent: form.followUpConsent,
            marketing_email_consent: true,
            marketing_sms_consent: false,
            lead_source: 'consultation_booking',
            engagement_score: 95,
            last_interaction_at: new Date().toISOString(),
          },
          {
            onConflict: user?.id ? 'auth_user_id' : 'verified_email',
            ignoreDuplicates: false,
          }
        )
      } catch (err) {
        console.warn('Supabase remote sync note:', err)
      }

      setConfirmedBooking({
        bookingId,
        date: form.date,
        timeSlot: slotLabel,
        mode: form.mode,
        topic: topicLabel,
        timezone: form.timezone,
        name: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      })

      toast.success('Consultation booked successfully! Reference: ' + bookingId)
    } catch (err) {
      console.error('Consultation booking error:', err)
      toast.error('Failed to book consultation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Generate Google Calendar Link
  const getGoogleCalendarUrl = () => {
    if (!confirmedBooking) return '#'
    const title = encodeURIComponent(`Shoora EB-5 Private Consultation (${confirmedBooking.bookingId})`)
    const details = encodeURIComponent(
      `1-on-1 Confidential EB-5 Advisory Session with Elena Vance & Shoora EB-5 Advisory Team.\n\n` +
      `Booking ID: ${confirmedBooking.bookingId}\n` +
      `Topic: ${confirmedBooking.topic}\n` +
      `Mode: ${confirmedBooking.mode.toUpperCase()}\n` +
      `Investor: ${confirmedBooking.name} (${confirmedBooking.email})\n` +
      `Meeting link or phone details will be sent to your email.`
    )
    const location = encodeURIComponent(
      confirmedBooking.mode === 'phone' ? `Phone: ${confirmedBooking.phone}` : 'Google Meet / Zoom (link emailed)'
    )
    // Basic date parsing for YYYYMMDD
    const dateFormatted = confirmedBooking.date.replace(/-/g, '')
    const dates = `${dateFormatted}T140000Z/${dateFormatted}T144500Z`
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`
  }

  // Download .ics file
  const handleDownloadIcs = () => {
    if (!confirmedBooking) return
    const icsDate = confirmedBooking.date.replace(/-/g, '')
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Shoora EB-5//Advisory Consultation//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `SUMMARY:Shoora EB-5 Private Consultation (${confirmedBooking.bookingId})`,
      `DESCRIPTION:1-on-1 Confidential EB-5 Advisory Session with Elena Vance. Topic: ${confirmedBooking.topic}. Booking ID: ${confirmedBooking.bookingId}`,
      `DTSTART:${icsDate}T140000Z`,
      `DTEND:${icsDate}T144500Z`,
      `LOCATION:${confirmedBooking.mode === 'phone' ? confirmedBooking.phone : 'Google Meet (link emailed)'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.setAttribute('download', `shoora-eb5-consultation-${confirmedBooking.bookingId}.ics`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Calendar event (.ics) downloaded!')
  }

  // ─── Confirmation Screen ──────────────────────────────────────────────────
  if (confirmedBooking) {
    return (
      <div className="fixed inset-0 bg-navy-950/75 backdrop-blur-sm flex items-center justify-center z-[2147483647] p-3 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-6 max-w-md w-full border border-gold-300 text-left animate-slide-up relative max-h-[92vh] overflow-y-auto">
          {/* Top Banner */}
          <div className="text-center pb-4 border-b border-navy-100">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold bg-gold-100 text-gold-900 border border-gold-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Advisory Session Reserved
            </span>
            <h2 className="font-display text-lg font-bold text-navy-900 mt-1.5">
              Consultation Confirmed!
            </h2>
            <p className="text-navy-500 text-xs mt-0.5">
              Booking Ref: <strong className="text-navy-900 font-mono">{confirmedBooking.bookingId}</strong>
            </p>
          </div>

          {/* Details Card */}
          <div className="my-4 bg-ivory-50 rounded-xl p-3.5 border border-navy-100 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-navy-100/70">
              <span className="text-navy-400">Advisor Desk:</span>
              <span className="font-semibold text-navy-900">Elena Vance • Senior EB-5 Desk</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-navy-100/70">
              <span className="text-navy-400">Date & Slot:</span>
              <span className="font-semibold text-navy-900">{confirmedBooking.date} • {confirmedBooking.timeSlot}</span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-navy-100/70">
              <span className="text-navy-400">Meeting Mode:</span>
              <span className="font-semibold text-navy-900 capitalize">
                {confirmedBooking.mode === 'video' ? '📹 Video Call (Google Meet / Zoom)' : confirmedBooking.mode === 'phone' ? '📞 Direct Phone' : '💬 WhatsApp Call'}
              </span>
            </div>
            <div className="flex items-center justify-between pb-2 border-b border-navy-100/70">
              <span className="text-navy-400">Focus Topic:</span>
              <span className="font-semibold text-navy-900 text-right truncate max-w-[200px]">{confirmedBooking.topic}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-navy-400">Confirmation Sent To:</span>
              <span className="font-semibold text-navy-900 truncate max-w-[190px]">{confirmedBooking.email || confirmedBooking.phone}</span>
            </div>
          </div>

          <p className="text-[11px] text-navy-500 text-center mb-4">
            Our Senior Advisory Desk will send the calendar invitation with direct connection details.
          </p>

          {/* Calendar Actions */}
          <div className="space-y-2">
            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-white font-semibold text-xs shadow-xs transition-colors text-center"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Add to Google Calendar</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>

            <button
              onClick={handleDownloadIcs}
              type="button"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-navy-200 bg-white hover:bg-navy-50 text-navy-800 font-semibold text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-navy-500" />
              <span>Download .ICS Calendar Event</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="w-full py-2 text-center text-xs text-navy-500 hover:text-navy-800 transition-colors pt-2 font-medium"
            >
              ← Return to Chat
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Booking Form Screen ──────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-navy-950/75 backdrop-blur-sm flex items-center justify-center z-[2147483647] p-2.5 sm:p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-gold-300 animate-slide-up flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-navy-100 bg-navy-900 text-white flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold-500/20 text-gold-400 flex items-center justify-center flex-shrink-0 border border-gold-400/30">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-display text-xs sm:text-sm font-bold text-white">
                  Book a Private EB-5 Consultation
                </h2>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-semibold px-1.5 py-0.2 rounded">
                  Free • Confidential
                </span>
              </div>
              <p className="text-[10px] text-navy-300">
                1-on-1 guidance with Senior Advisor Elena Vance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800 transition-colors"
            aria-label="Close booking modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto scrollbar-thin flex-1 text-left text-navy-900">
          {/* Mode Selection */}
          <div>
            <label className="block text-[11px] font-bold text-navy-800 mb-1.5">
              1. Select Meeting Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {MEETING_MODES.map((m) => {
                const Icon = m.icon
                const active = form.mode === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, mode: m.id }))}
                    className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      active
                        ? 'border-gold-500 bg-gold-50/70 text-navy-950 font-bold shadow-xs'
                        : 'border-navy-200 bg-white text-navy-600 hover:bg-navy-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-gold-600' : 'text-navy-400'}`} />
                    <span className="text-[11px]">{m.label}</span>
                    <span className="text-[9px] text-navy-400">{m.sub}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Date, Slot & Timezone */}
          <div>
            <label className="block text-[11px] font-bold text-navy-800 mb-1.5">
              2. Preferred Date & Time Window
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <div>
                <label className="block text-[10px] text-navy-500 mb-0.5">Date</label>
                <div className="flex items-center gap-2 px-2.5 py-1.5 border border-navy-200 rounded-xl bg-ivory-50/50 focus-within:ring-2 focus-within:ring-gold-500 focus-within:bg-white transition-all text-xs">
                  <Calendar className="w-3.5 h-3.5 text-navy-400 flex-shrink-0" />
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full bg-transparent border-none outline-none text-xs text-navy-900 font-sans"
                    required
                  />
                </div>
                {errors.date && <p className="text-red-500 text-[10px] mt-0.5">{errors.date}</p>}
              </div>

              <div>
                <label className="block text-[10px] text-navy-500 mb-0.5">Timezone</label>
                <select
                  value={form.timezone}
                  onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
                  className="w-full px-2.5 py-1.5 border border-navy-200 rounded-xl bg-ivory-50/50 text-xs text-navy-900 outline-none focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.id} value={tz.id}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Time Slot Pills */}
            <div className="grid grid-cols-3 gap-1.5">
              {TIME_SLOTS.map((slot) => {
                const active = form.timeSlot === slot.id
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, timeSlot: slot.id }))}
                    className={`px-2 py-1.5 rounded-lg border text-center transition-all ${
                      active
                        ? 'border-gold-500 bg-gold-100 text-navy-950 font-bold'
                        : 'border-navy-200 bg-white text-navy-600 hover:bg-navy-50 text-[10px]'
                    }`}
                  >
                    <div className="text-[10px] font-semibold">{slot.label}</div>
                    <div className="text-[8px] text-navy-400">{slot.hours}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Primary Topic */}
          <div>
            <label className="block text-[11px] font-bold text-navy-800 mb-1">
              3. Consultation Focus / Topic
            </label>
            <select
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              className="w-full px-2.5 py-2 border border-navy-200 rounded-xl bg-ivory-50/50 text-xs text-navy-900 outline-none focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all font-medium"
            >
              {CONSULTATION_TOPICS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Investor Contact Details */}
          <div>
            <label className="block text-[11px] font-bold text-navy-800 mb-1.5">
              4. Investor Contact Information
            </label>
            <div className="space-y-2">
              {/* Full Name */}
              <div>
                <div className="flex items-center gap-2 px-2.5 py-1.5 border border-navy-200 rounded-xl bg-ivory-50/50 focus-within:ring-2 focus-within:ring-gold-500 focus-within:bg-white transition-all text-xs">
                  <User className="w-3.5 h-3.5 text-navy-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                    placeholder="Full Name *"
                    className="w-full bg-transparent border-none outline-none text-xs text-navy-900 placeholder:text-navy-400 font-sans"
                    required
                  />
                </div>
                {errors.fullName && <p className="text-red-500 text-[10px] mt-0.5">{errors.fullName}</p>}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center gap-2 px-2.5 py-1.5 border border-navy-200 rounded-xl bg-ivory-50/50 focus-within:ring-2 focus-within:ring-gold-500 focus-within:bg-white transition-all text-xs">
                    <Mail className="w-3.5 h-3.5 text-navy-400 flex-shrink-0" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="Email Address *"
                      className="w-full bg-transparent border-none outline-none text-xs text-navy-900 placeholder:text-navy-400 font-sans"
                      required
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-[10px] mt-0.5">{errors.email}</p>}
                </div>

                <div>
                  <div className="flex items-center gap-2 px-2.5 py-1.5 border border-navy-200 rounded-xl bg-ivory-50/50 focus-within:ring-2 focus-within:ring-gold-500 focus-within:bg-white transition-all text-xs">
                    <Phone className="w-3.5 h-3.5 text-navy-400 flex-shrink-0" />
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="Phone (e.g. +1 415... or +91...)"
                      className="w-full bg-transparent border-none outline-none text-xs text-navy-900 placeholder:text-navy-400 font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Visa Status & Timeline */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-navy-500 mb-0.5">Current Visa / Status</label>
                  <select
                    value={form.visaStatus}
                    onChange={(e) => setForm((f) => ({ ...f, visaStatus: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-navy-200 rounded-xl bg-ivory-50/50 text-xs text-navy-900 outline-none focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="H-1B">H-1B Worker</option>
                    <option value="H-4 / L-2">H-4 / L-2 Spouse</option>
                    <option value="F-1 / OPT">F-1 Student / OPT</option>
                    <option value="L-1">L-1 Intra-Company</option>
                    <option value="Overseas / No US Visa">Living Outside US</option>
                    <option value="B-1 / B-2">B-1 / B-2 Visitor</option>
                    <option value="Other">Other Visa Status</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-navy-500 mb-0.5">Target Investment Time</label>
                  <select
                    value={form.timeframe}
                    onChange={(e) => setForm((f) => ({ ...f, timeframe: e.target.value }))}
                    className="w-full px-2 py-1.5 border border-navy-200 rounded-xl bg-ivory-50/50 text-xs text-navy-900 outline-none focus:ring-2 focus:ring-gold-500"
                  >
                    <option value="immediate">Immediately (30-60 days)</option>
                    <option value="within_6_months">Within 6 months</option>
                    <option value="within_1_year">Within 1 year</option>
                    <option value="exploring">Still exploring</option>
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Optional questions or context for the advisor (e.g. source of funds, country of birth)..."
                  rows={2}
                  className="w-full px-2.5 py-1.5 border border-navy-200 rounded-xl bg-ivory-50/50 text-xs text-navy-900 placeholder:text-navy-400 outline-none focus:ring-2 focus:ring-gold-500 resize-none font-sans"
                />
              </div>
            </div>
          </div>

          {/* Consent */}
          <label className="flex items-start gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={form.followUpConsent}
              onChange={(e) => setForm((f) => ({ ...f, followUpConsent: e.target.checked }))}
              className="mt-0.5 w-3.5 h-3.5 rounded accent-navy-900"
            />
            <span className="text-[10px] text-navy-500 leading-tight">
              I request a confidential consultation regarding EB-5 investment immigration. Shoora EB-5 protects investor privacy under RIA compliance.
            </span>
          </label>
        </div>

        {/* Footer Submit Button */}
        <div className="p-3 bg-ivory-50 border-t border-navy-100 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-navy-400 hover:text-navy-700 font-medium px-2 py-1 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary text-xs py-2 px-4 shadow-sm flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />}
            <span>{loading ? 'Confirming Reservation…' : 'Confirm Consultation'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
