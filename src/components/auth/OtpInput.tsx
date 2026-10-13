import { useRef, useEffect } from 'react'
import { cn } from '../../lib/utils'

interface OtpInputProps {
  value: string
  onChange: (val: string) => void
  onComplete?: () => void
  disabled?: boolean
  length?: number
}

export function OtpInput({ value, onChange, onComplete, disabled = false, length = 6 }: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const focusCell = (idx: number) => {
    inputRefs.current[Math.max(0, Math.min(idx, length - 1))]?.focus()
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[idx]) {
        const arr = value.split('')
        arr[idx] = ''
        onChange(arr.join('').replace(/\s/g, ''))
      } else {
        focusCell(idx - 1)
      }
    } else if (e.key === 'ArrowLeft') {
      focusCell(idx - 1)
    } else if (e.key === 'ArrowRight') {
      focusCell(idx + 1)
    } else if (e.key === 'Enter' && value.length === length) {
      onComplete?.()
    }
  }

  const handleChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (!raw) return

    // Handle paste of full OTP
    if (raw.length >= length) {
      onChange(raw.slice(0, length))
      focusCell(length - 1)
      if (raw.length === length) setTimeout(() => onComplete?.(), 100)
      return
    }

    const digit = raw[raw.length - 1]
    const arr = (value + ' '.repeat(length)).split('').slice(0, length)
    arr[idx] = digit
    const next = arr.join('').replace(/ /g, '')
    onChange(next)
    if (idx < length - 1) focusCell(idx + 1)
    if (next.length === length) setTimeout(() => onComplete?.(), 100)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pasted) {
      onChange(pasted)
      focusCell(Math.min(pasted.length, length - 1))
      if (pasted.length === length) setTimeout(() => onComplete?.(), 100)
    }
  }

  return (
    <div className="flex justify-center gap-3" role="group" aria-label="OTP input">
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={el => { inputRefs.current[idx] = el }}
          id={`otp-cell-${idx}`}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[idx] || ''}
          onChange={e => handleChange(idx, e)}
          onKeyDown={e => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          onClick={() => focusCell(idx)}
          disabled={disabled}
          className={cn(
            'otp-cell',
            value[idx] && 'border-navy-600 bg-navy-50 text-navy-900',
            disabled && 'opacity-50 cursor-not-allowed',
          )}
          autoComplete="one-time-code"
          aria-label={`Digit ${idx + 1} of ${length}`}
        />
      ))}
    </div>
  )
}
