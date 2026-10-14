import { useState } from 'react'
import { UserCheck, Mail, Phone, User, ArrowRight, ShieldCheck, ChevronDown } from 'lucide-react'
import { isValidEmail } from '../../lib/utils'
import toast from 'react-hot-toast'

interface LeadOnboardingCardProps {
  onSubmit: (details: { name: string; email: string; phone?: string }) => void
  onSkip: () => void
}

const COUNTRY_CODES = [
  { code: '+91', label: 'India', flag: '🇮🇳' },
  { code: '+1',  label: 'United States / Canada', flag: '🇺🇸' },
  { code: '+971', label: 'UAE', flag: '🇦🇪' },
  { code: '+44',  label: 'United Kingdom', flag: '🇬🇧' },
  { code: '+65',  label: 'Singapore', flag: '🇸🇬' },
  { code: '+61',  label: 'Australia', flag: '🇦🇺' },
  { code: '+86',  label: 'China', flag: '🇨🇳' },
]

export function LeadOnboardingCard({ onSubmit, onSkip }: LeadOnboardingCardProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [phoneDigits, setPhoneDigits] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Please enter your full name.')
      return
    }
    if (!email.trim() || !isValidEmail(email.trim())) {
      toast.error('Please enter a valid email address.')
      return
    }
    const cleanDigits = phoneDigits.trim().replace(/[\s\-\(\)\.]/g, '')
    if (!cleanDigits) {
      toast.error('Please enter your mobile phone number.')
      return
    }

    let fullPhone = cleanDigits
    if (fullPhone.startsWith('+')) {
      // Fix accidental double-1 (e.g. +11...)
      if (fullPhone.startsWith('+11') && fullPhone.length === 13) {
        fullPhone = `+1${fullPhone.slice(3)}`
      }
    } else if (countryCode === '+1') {
      // If user typed 11 digits starting with 1 (e.g. 14155550199)
      if (cleanDigits.length === 11 && cleanDigits.startsWith('1')) {
        fullPhone = `+${cleanDigits}`
      } else {
        fullPhone = `+1${cleanDigits}`
      }
    } else if (countryCode === '+91') {
      if (cleanDigits.length === 12 && cleanDigits.startsWith('91')) {
        fullPhone = `+${cleanDigits}`
      } else {
        fullPhone = `+91${cleanDigits}`
      }
    } else {
      fullPhone = `${countryCode}${cleanDigits}`
    }

    onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: fullPhone,
    })
    toast.success('Dispatching SMS verification code via Firebase...')
  }

  return (
    <div className="my-4 card border border-gold-300 bg-white shadow-md p-5 rounded-2xl max-w-xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-3 border-b border-navy-100 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gold-100 text-gold-700 flex items-center justify-center flex-shrink-0">
          <UserCheck className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-display font-bold text-navy-900 text-sm">
            EB-5 Investor Consultation Details
          </h3>
          <p className="text-[11px] text-navy-500">
            Share your details to connect with an advisor. We'll verify your mobile number via SMS OTP:
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Full Name */}
        <div>
          <label className="block text-[11px] font-semibold text-navy-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center gap-2.5 px-3 py-2 border border-navy-200 rounded-xl bg-ivory-50/40 focus-within:ring-2 focus-within:ring-gold-500 focus-within:border-gold-500 focus-within:bg-white transition-all shadow-sm">
            <User className="w-4 h-4 text-navy-400 flex-shrink-0" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alexander Wright"
              className="w-full bg-transparent border-none outline-none text-xs text-navy-900 placeholder:text-navy-400 font-sans"
              required
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-[11px] font-semibold text-navy-700 mb-1">
            Email Address <span className="text-red-500">*</span>{' '}
            <span className="text-navy-400 font-normal">(for prospectus & updates)</span>
          </label>
          <div className="flex items-center gap-2.5 px-3 py-2 border border-navy-200 rounded-xl bg-ivory-50/40 focus-within:ring-2 focus-within:ring-gold-500 focus-within:border-gold-500 focus-within:bg-white transition-all shadow-sm">
            <Mail className="w-4 h-4 text-navy-400 flex-shrink-0" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alexander@investor.com"
              className="w-full bg-transparent border-none outline-none text-xs text-navy-900 placeholder:text-navy-400 font-sans"
              required
            />
          </div>
        </div>

        {/* Mobile Phone Number with Country Dropdown */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-navy-700">
              Mobile Phone Number <span className="text-red-500">*</span>{' '}
              <span className="text-navy-400 font-normal">(for SMS code)</span>
            </label>
            {/* Quick Country Switcher pills */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCountryCode('+91')}
                className={`text-[10px] px-1.5 py-0.5 rounded transition-all ${
                  countryCode === '+91'
                    ? 'bg-gold-100 text-gold-900 font-bold border border-gold-300'
                    : 'text-navy-400 hover:text-navy-700'
                }`}
              >
                🇮🇳 +91
              </button>
              <button
                type="button"
                onClick={() => setCountryCode('+1')}
                className={`text-[10px] px-1.5 py-0.5 rounded transition-all ${
                  countryCode === '+1'
                    ? 'bg-gold-100 text-gold-900 font-bold border border-gold-300'
                    : 'text-navy-400 hover:text-navy-700'
                }`}
              >
                🇺🇸 +1
              </button>
            </div>
          </div>

          <div className="flex items-center border border-navy-200 rounded-xl bg-ivory-50/40 focus-within:ring-2 focus-within:ring-gold-500 focus-within:border-gold-500 focus-within:bg-white transition-all shadow-sm overflow-hidden">
            {/* Country Selector Dropdown */}
            <div className="flex items-center pl-2.5 pr-2 py-2 border-r border-navy-200 bg-white/70 flex-shrink-0 relative">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-transparent text-xs font-semibold text-navy-800 outline-none cursor-pointer pr-4 appearance-none"
                aria-label="Country Code"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={`${c.code}-${c.label}`} value={c.code}>
                    {c.flag} {c.code} ({c.label})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-navy-400 pointer-events-none absolute right-1.5 top-3" />
            </div>

            {/* Phone digits input */}
            <div className="flex-1 flex items-center gap-2 px-3 py-2">
              <Phone className="w-3.5 h-3.5 text-navy-400 flex-shrink-0" />
              <input
                type="tel"
                value={phoneDigits}
                onChange={(e) => setPhoneDigits(e.target.value)}
                placeholder={countryCode === '+91' ? '98765 43210' : '(415) 555-0199'}
                className="w-full bg-transparent border-none outline-none text-xs text-navy-900 placeholder:text-navy-400 font-sans tracking-wide"
                required
              />
            </div>
          </div>
          <p className="text-[10px] text-navy-400 mt-1">
            Selected: <span className="font-semibold text-navy-600">{countryCode}</span>. Toll-free official SMS line: <span className="text-navy-600">+1 866-454-3090</span>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={onSkip}
            className="text-[11px] text-navy-400 hover:text-navy-700 font-medium transition-colors"
          >
            Skip for now →
          </button>

          <button
            type="submit"
            className="btn-primary text-xs py-2 px-4 shadow-sm flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
            <span>Send SMS Code</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  )
}
