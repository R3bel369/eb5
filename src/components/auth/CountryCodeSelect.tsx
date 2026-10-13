// Country codes for phone auth
const COUNTRY_CODES = [
  { code: '+1',   label: '🇺🇸 +1  (US/CA)' },
  { code: '+44',  label: '🇬🇧 +44 (UK)' },
  { code: '+91',  label: '🇮🇳 +91 (India)' },
  { code: '+86',  label: '🇨🇳 +86 (China)' },
  { code: '+971', label: '🇦🇪 +971 (UAE)' },
  { code: '+966', label: '🇸🇦 +966 (KSA)' },
  { code: '+65',  label: '🇸🇬 +65 (Singapore)' },
  { code: '+852', label: '🇭🇰 +852 (HK)' },
  { code: '+82',  label: '🇰🇷 +82 (Korea)' },
  { code: '+81',  label: '🇯🇵 +81 (Japan)' },
  { code: '+49',  label: '🇩🇪 +49 (Germany)' },
  { code: '+33',  label: '🇫🇷 +33 (France)' },
  { code: '+7',   label: '🇷🇺 +7  (Russia)' },
  { code: '+55',  label: '🇧🇷 +55 (Brazil)' },
  { code: '+61',  label: '🇦🇺 +61 (Australia)' },
  { code: '+64',  label: '🇳🇿 +64 (New Zealand)' },
  { code: '+27',  label: '🇿🇦 +27 (South Africa)' },
  { code: '+20',  label: '🇪🇬 +20 (Egypt)' },
  { code: '+234', label: '🇳🇬 +234 (Nigeria)' },
  { code: '+92',  label: '🇵🇰 +92 (Pakistan)' },
  { code: '+880', label: '🇧🇩 +880 (Bangladesh)' },
  { code: '+90',  label: '🇹🇷 +90 (Turkey)' },
]

interface CountryCodeSelectProps {
  value: string
  onChange: (code: string) => void
}

export function CountryCodeSelect({ value, onChange }: CountryCodeSelectProps) {
  return (
    <select
      id="country-code-select"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="input-field w-32 flex-shrink-0 cursor-pointer"
      aria-label="Country code"
    >
      {COUNTRY_CODES.map(c => (
        <option key={c.code} value={c.code}>{c.label}</option>
      ))}
    </select>
  )
}
