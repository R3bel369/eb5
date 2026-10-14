// ─── SMS & Phone OTP Service (Powered by Firebase Authentication) ───────────────
// Dispatches and verifies SMS OTPs using Firebase Auth with invisible reCAPTCHA

import {
  sendFirebasePhoneOtp,
  verifyFirebasePhoneOtp,
  type SendFirebaseOtpResult,
  type VerifyFirebaseOtpResult,
} from './firebaseAuthOtp'

export interface SendSmsOtpResult {
  success: boolean
  phone?: string
  messageId?: string
  hintCode?: string
  error?: string
  warning?: string
}

export interface VerifySmsOtpResult {
  success: boolean
  verified: boolean
  error?: string
}

/**
 * Dispatches a 6-digit OTP to the recipient's phone number via Firebase SMS.
 */
export async function sendTelnyxSmsOtp(phone: string, name?: string): Promise<SendSmsOtpResult> {
  const result: SendFirebaseOtpResult = await sendFirebasePhoneOtp(phone, name)
  return {
    success: result.success,
    phone: result.formattedPhone || phone,
    messageId: `firebase-auth-${Date.now()}`,
    hintCode: result.hintCode,
    error: result.error,
    warning: result.warning,
  }
}

/**
 * Validates the 6-digit SMS code submitted by the user via Firebase Auth.
 */
export async function verifyTelnyxSmsOtp(
  phone: string,
  code: string,
  hintCode?: string | null
): Promise<VerifySmsOtpResult> {
  const result: VerifyFirebaseOtpResult = await verifyFirebasePhoneOtp(phone, code, hintCode)
  return {
    success: result.success,
    verified: result.verified,
    error: result.error,
  }
}

export { sendFirebasePhoneOtp, verifyFirebasePhoneOtp }
