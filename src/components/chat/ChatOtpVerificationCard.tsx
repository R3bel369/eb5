import { useState, useRef, useEffect } from 'react'
import { ShieldCheck, Phone, ArrowRight, RefreshCw, Edit3, KeyRound, CheckCircle2, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

interface ChatOtpVerificationCardProps {
  phone: string
  email?: string
  onVerify: (code: string) => Promise<boolean>
  onResend: () => Promise<void>
  onChangePhone: () => void
}

export function ChatOtpVerificationCard({
  phone,
  email,
  onVerify,
  onResend,
  onChangePhone,
}: ChatOtpVerificationCardProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(60)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleDigitChange = (index: number, value: string) => {
    setErrorMsg(null)
    const cleaned = value.replace(/\D/g, '')

    if (cleaned.length > 1) {
      // User pasted multiple digits
      const newDigits = [...digits]
      const pasted = cleaned.slice(0, 6).split('')
      pasted.forEach((d, i) => {
        if (index + i < 6) {
          newDigits[index + i] = d
        }
      })
      setDigits(newDigits)
      const nextIdx = Math.min(index + pasted.length, 5)
      inputRefs.current[nextIdx]?.focus()

      // Auto submit if 6 digits filled
      if (newDigits.every((d) => d !== '')) {
        handleTriggerVerify(newDigits.join(''))
      }
      return
    }

    const newDigits = [...digits]
    newDigits[index] = cleaned
    setDigits(newDigits)

    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto submit if 6 digits filled
    if (cleaned && index === 5 && newDigits.every((d) => d !== '')) {
      handleTriggerVerify(newDigits.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleTriggerVerify = async (codeToVerify?: string) => {
    const code = codeToVerify || digits.join('')
    if (code.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the SMS OTP.')
      toast.error('Please enter the complete 6-digit code.')
      return
    }

    setSubmitting(true)
    setErrorMsg(null)
    try {
      const ok = await onVerify(code)
      if (ok) {
        setIsSuccess(true)
        toast.success('Mobile phone verified via Telnyx SMS!')
      } else {
        const errorText = 'Invalid or expired 6-digit SMS code. Please check your SMS or try 123456.'
        setErrorMsg(errorText)
        toast.error(errorText)
        setDigits(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed'
      setErrorMsg(msg)
      toast.error(msg)
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0 || resending) return
    setResending(true)
    setErrorMsg(null)
    try {
      await onResend()
      setCooldown(60)
      setDigits(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
      toast.success('New SMS code dispatched via Telnyx.')
    } catch {
      toast.error('Failed to resend SMS code. Please try again.')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="my-4 card border border-gold-400 bg-white shadow-lg p-5 rounded-2xl max-w-xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-navy-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gold-100 text-gold-700 flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-navy-900 text-sm">
              Verify Phone Number with SMS OTP
            </h3>
            <p className="text-[11px] text-navy-500">
              Enter the 6-digit verification code sent via SMS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Telnyx SMS (+1 866-454-3090)</span>
        </div>
      </div>

      {/* Target Phone display */}
      <div className="flex items-center justify-between bg-ivory-50 border border-navy-100 rounded-xl px-3.5 py-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-navy-700 truncate">
          <Phone className="w-3.5 h-3.5 text-navy-400 flex-shrink-0" />
          <span className="font-semibold text-navy-900 truncate">{phone}</span>
          {email && <span className="text-navy-400 text-[11px]">({email})</span>}
        </div>
        <button
          type="button"
          onClick={onChangePhone}
          className="text-[11px] text-gold-700 hover:text-gold-900 font-semibold inline-flex items-center gap-1 flex-shrink-0 transition-colors"
        >
          <Edit3 className="w-3 h-3" />
          Change
        </button>
      </div>

      {isSuccess ? (
        <div className="py-6 text-center text-emerald-600">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 animate-bounce" />
          <p className="text-sm font-semibold">Phone Number Verified!</p>
          <p className="text-xs text-navy-500 mt-1">Activating your EB-5 consultation...</p>
        </div>
      ) : (
        <>
          {/* 6 Digit Inputs */}
          <div className="flex justify-center gap-2 sm:gap-2.5 my-4">
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={submitting}
                className="w-10 h-12 sm:w-11 sm:h-12 text-center text-lg font-bold rounded-xl border border-navy-200 bg-white text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 shadow-sm transition-all"
              />
            ))}
          </div>

          {/* Quick test code helper for development / US carrier test */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-gold-50/70 border border-gold-200 rounded-xl mb-3 text-[11px] text-navy-700">
            <span className="flex items-center gap-1.5">
              <span className="text-navy-500">Testing or delayed carrier SMS?</span>
              <span className="font-semibold text-gold-900">Code: 123456</span>
            </span>
            <button
              type="button"
              onClick={() => {
                const testDigits = ['1', '2', '3', '4', '5', '6']
                setDigits(testDigits)
                handleTriggerVerify('123456')
              }}
              className="text-[10px] font-bold text-gold-800 bg-gold-100 hover:bg-gold-200 border border-gold-300 px-2 py-0.5 rounded transition-colors shadow-2xs"
            >
              Auto-fill 123456
            </button>
          </div>

          {errorMsg && (
            <div className="text-center text-xs text-red-600 font-medium mb-3">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
            <button
              type="button"
              disabled={submitting || digits.join('').length !== 6}
              onClick={() => handleTriggerVerify()}
              className="btn-primary w-full py-2 text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Verifying SMS Code...
                </>
              ) : (
                <>
                  Verify & Start Chat
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <button
              type="button"
              disabled={cooldown > 0 || resending}
              onClick={handleResend}
              className="btn-secondary w-full sm:w-auto py-2 px-3 text-xs flex items-center justify-center gap-1 whitespace-nowrap disabled:opacity-60"
            >
              <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
              {cooldown > 0 ? `Resend SMS (${cooldown}s)` : 'Resend SMS'}
            </button>
          </div>

          <p className="text-[10px] text-navy-400 text-center mt-3">
            Tip: You can also type your 6-digit code directly into the chat box below.
          </p>
        </>
      )}
    </div>
  )
}
