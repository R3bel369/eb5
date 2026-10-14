// ─── Firebase Phone Authentication & SMS OTP Service ─────────────────────────
// Pure real-world SMS delivery using Firebase Auth Web SDK with invisible RecaptchaVerifier
// and signInWithPhoneNumber / confirmationResult.confirm()

import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type UserCredential,
} from 'firebase/auth'
import { auth } from './firebase'

export interface SendFirebaseOtpResult {
  success: boolean
  phone: string
  formattedPhone: string
  error?: string
  warning?: string
  hintCode?: string
}

export interface VerifyFirebaseOtpResult {
  success: boolean
  verified: boolean
  userCredential?: UserCredential
  error?: string
}

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier | null
    confirmationResult?: ConfirmationResult | null
  }
}

let activeConfirmationResult: ConfirmationResult | null = null

/**
 * Normalizes phone numbers to standard E.164 format (+[country code][number])
 */
export function formatPhoneE164(phone: string): string {
  let cleaned = phone.trim().replace(/[\s\-\(\)\.]/g, '')

  // Correct accidental double country prefix (e.g. +11415...)
  if (cleaned.startsWith('+11') && cleaned.length === 13) {
    cleaned = `+1${cleaned.slice(3)}`
  }

  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      cleaned = `+${cleaned}`
    } else if (cleaned.length === 10) {
      if (/^[6-9]/.test(cleaned)) {
        cleaned = `+91${cleaned}`
      } else {
        cleaned = `+1${cleaned}`
      }
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = `+${cleaned}`
    } else {
      cleaned = `+${cleaned}`
    }
  }

  return cleaned
}

/**
 * Obtains or lazily creates a singleton invisible RecaptchaVerifier
 */
export function getOrCreateRecaptchaVerifier(containerId = 'recaptcha-container'): RecaptchaVerifier {
  if (typeof window !== 'undefined' && window.recaptchaVerifier) {
    return window.recaptchaVerifier
  }

  if (typeof document !== 'undefined') {
    let container = document.getElementById(containerId)
    if (!container) {
      container = document.createElement('div')
      container.id = containerId
      document.body.appendChild(container)
    }
  }

  const verifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {},
  })

  if (typeof window !== 'undefined') {
    window.recaptchaVerifier = verifier
  }

  return verifier
}

/**
 * Dispatches a real 6-digit SMS OTP via Firebase Authentication (signInWithPhoneNumber)
 */
export async function sendFirebasePhoneOtp(
  phone: string,
  _name?: string
): Promise<SendFirebaseOtpResult> {
  const formattedPhone = formatPhoneE164(phone)

  if (!formattedPhone || formattedPhone.length < 8) {
    return {
      success: false,
      phone,
      formattedPhone,
      error: 'Please enter a valid phone number with country code.',
    }
  }

  try {
    const verifier = getOrCreateRecaptchaVerifier()
    const confirmation = await signInWithPhoneNumber(auth, formattedPhone, verifier)
    activeConfirmationResult = confirmation
    if (typeof window !== 'undefined') {
      window.confirmationResult = confirmation
    }

    return {
      success: true,
      phone,
      formattedPhone,
    }
  } catch (err: any) {
    console.warn('[Firebase Auth] signInWithPhoneNumber error:', err)
    let errorMessage = 'Failed to dispatch Firebase SMS verification code.'

    if (err.code === 'auth/invalid-phone-number') {
      errorMessage = 'The provided phone number is invalid. Please check the country code and number.'
    } else if (err.code === 'auth/missing-phone-number') {
      errorMessage = 'Phone number is required.'
    } else if (err.code === 'auth/billing-not-enabled') {
      errorMessage = 'Firebase requires an active Blaze billing account on the project to send carrier SMS.'
    } else if (err.code === 'auth/operation-not-allowed') {
      errorMessage = 'SMS unable to be sent until this country region is enabled in Firebase Console (Settings > SMS Regions policy).'
    } else if (err.code === 'auth/quota-exceeded') {
      errorMessage = 'Firebase daily SMS quota reached. Please try again tomorrow or contact support.'
    } else if (err.code === 'auth/too-many-requests') {
      errorMessage = 'Too many attempts for this phone number. Please wait a few minutes before requesting another code.'
    } else if (err.code === 'auth/captcha-check-failed') {
      errorMessage = 'reCAPTCHA check failed. Please refresh the page and try again.'
    } else if (err.message) {
      errorMessage = err.message
    }

    return {
      success: false,
      phone,
      formattedPhone,
      error: errorMessage,
    }
  }
}

/**
 * Verifies the 6-digit SMS OTP using Firebase Authentication (confirmationResult.confirm)
 */
export async function verifyFirebasePhoneOtp(
  phone: string,
  code: string,
  _hintCode?: string | null
): Promise<VerifyFirebaseOtpResult> {
  const cleanCode = code.trim().replace(/\D/g, '')

  if (cleanCode.length !== 6) {
    return {
      success: false,
      verified: false,
      error: 'Please enter all 6 digits of the SMS verification code.',
    }
  }

  const confirmation = activeConfirmationResult || (typeof window !== 'undefined' ? window.confirmationResult : null)

  if (!confirmation) {
    return {
      success: false,
      verified: false,
      error: 'No active Firebase SMS verification session found. Please click "Resend SMS".',
    }
  }

  try {
    const userCredential = await confirmation.confirm(cleanCode)
    return {
      success: true,
      verified: true,
      userCredential,
    }
  } catch (err: any) {
    console.warn('[Firebase Auth] confirm code error:', err)
    let errorMsg = 'Invalid or expired 6-digit SMS code. Please check your SMS text message and try again.'

    if (err.code === 'auth/invalid-verification-code') {
      errorMsg = 'Incorrect 6-digit code. Please check your text messages.'
    } else if (err.code === 'auth/code-expired') {
      errorMsg = 'This verification code has expired. Please click "Resend SMS".'
    } else if (err.message) {
      errorMsg = err.message
    }

    return {
      success: false,
      verified: false,
      error: errorMsg,
    }
  }
}

/**
 * Resets the active confirmation session
 */
export function resetFirebaseOtpSession(): void {
  activeConfirmationResult = null
  if (typeof window !== 'undefined') {
    window.confirmationResult = null
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear()
      } catch {
        // ignore
      }
      window.recaptchaVerifier = null
    }
  }
}
