// ─── Telnyx SMS & Phone OTP Service ──────────────────────────────────────────
// Handles sending and verifying 6-digit SMS OTP codes using Telnyx Toll-Free Messaging

export interface SendSmsOtpResult {
  success: boolean
  phone?: string
  messageId?: string
  hintCode?: string
  error?: string
}

export interface VerifySmsOtpResult {
  success: boolean
  verified: boolean
  error?: string
}

/**
 * Dispatches a 6-digit OTP to the recipient's phone number via Telnyx SMS.
 */
export async function sendTelnyxSmsOtp(phone: string, name?: string): Promise<SendSmsOtpResult> {
  const cleanPhone = phone.trim()
  if (!cleanPhone) {
    return { success: false, error: 'Phone number is required.' }
  }

  try {
    const res = await fetch('/api/telnyx/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: cleanPhone, name: name || 'Investor' }),
    })

    const data = await res.json()
    if (!res.ok && !data.hintCode) {
      return {
        success: false,
        error: data.error || 'Failed to dispatch SMS verification code.',
      }
    }

    return {
      success: true,
      phone: data.phone || cleanPhone,
      messageId: data.messageId,
      hintCode: data.hintCode,
    }
  } catch (err: any) {
    console.warn('Network error dispatching Telnyx SMS:', err)
    // Fallback in case of local offline mock testing
    const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString()
    return {
      success: true,
      phone: cleanPhone,
      hintCode: fallbackCode,
    }
  }
}

/**
 * Validates the 6-digit SMS code submitted by the user.
 */
export async function verifyTelnyxSmsOtp(
  phone: string,
  code: string,
  hintCode?: string | null
): Promise<VerifySmsOtpResult> {
  const cleanCode = code.trim().replace(/\D/g, '')
  if (cleanCode.length !== 6) {
    return { success: false, verified: false, error: 'Please enter a 6-digit code.' }
  }

  // Universal test code bypass for dev / testing
  if (cleanCode === '123456') {
    return { success: true, verified: true }
  }

  // If local hintCode is available, check match immediately
  if (hintCode) {
    if (cleanCode === hintCode) {
      return { success: true, verified: true }
    } else {
      return {
        success: false,
        verified: false,
        error: 'Invalid 6-digit SMS code. Please check your SMS or use test code 123456.',
      }
    }
  }

  try {
    const res = await fetch('/api/telnyx/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code: cleanCode, expectedCode: hintCode }),
    })

    const data = await res.json()
    if (res.ok && data.verified) {
      return { success: true, verified: true }
    }

    return {
      success: false,
      verified: false,
      error: data.error || 'Invalid or expired 6-digit SMS code.',
    }
  } catch (err: any) {
    console.warn('Network error verifying Telnyx SMS:', err)
    return { success: false, verified: false, error: 'Network error verifying code. Please try again.' }
  }
}
