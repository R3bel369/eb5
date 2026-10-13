import { useState } from 'react'
import {
  Mail,
  Smartphone,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  KeyRound,
} from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { isValidEmail, isValidPhone, normalizePhone } from '../lib/utils'
import toast from 'react-hot-toast'
import type { AuthMethod, AuthStep } from '../types/database'
import { useAuth } from '../contexts/AuthContext'
import { OtpInput } from '../components/auth/OtpInput'
import { CountryCodeSelect } from '../components/auth/CountryCodeSelect'

// ─── Auth Page ────────────────────────────────────────────────────────────────

export function AuthPage() {
  const navigate = useNavigate()
  const { loginAsDemoAdmin, loginWithAdminCredentials } = useAuth()
  const [authPortal, setAuthPortal] = useState<'investor' | 'admin'>('admin')

  // Investor OTP states
  const [method, setMethod] = useState<AuthMethod>('email')
  const [step, setStep] = useState<AuthStep>('method')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+1')
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [showOtpHint, setShowOtpHint] = useState(false)

  // Admin Credentials states
  const [adminEmail, setAdminEmail] = useState('admin@shoora.com')
  const [adminPassword, setAdminPassword] = useState('ShooraAdmin2026!')
  const [showAdminPassword, setShowAdminPassword] = useState(false)
  const [adminLoading, setAdminLoading] = useState(false)

  // Cooldown timer
  const startCooldown = () => {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!adminEmail.trim() || !adminPassword.trim()) {
      toast.error('Please enter both admin email and password.')
      return
    }
    setAdminLoading(true)
    try {
      const res = await loginWithAdminCredentials(adminEmail, adminPassword)
      if (res.success) {
        toast.success('Welcome back, Shoora Administrator!')
        navigate('/admin')
      } else {
        toast.error(res.error || 'Invalid admin credentials.')
      }
    } finally {
      setAdminLoading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!isValidEmail(email)) {
      toast.error('Please enter a valid email address.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
        },
      })
      if (error) throw error
      setStep('verify_otp')
      startCooldown()
      toast.success('A verification code has been sent to your email.')
    } catch (err) {
      const msg = (err as Error).message
      if (msg.includes('rate')) {
        toast.error('Too many requests. Please wait before requesting another code.')
      } else {
        toast.error('Unable to send verification email. Please check your email and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSendSms = async () => {
    const fullPhone = normalizePhone(countryCode, phone)
    if (!isValidPhone(phone)) {
      toast.error('Please enter a valid phone number.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: fullPhone,
      })
      if (error) throw error
      setStep('verify_otp')
      startCooldown()
      toast.success('A verification code has been sent to your phone.')
    } catch (err) {
      const msg = (err as Error).message
      if (msg.includes('rate')) {
        toast.error('Too many requests. Please wait before requesting another code.')
      } else if (msg.includes('phone')) {
        toast.error('SMS provider is not configured. Please contact support or use email instead.')
      } else {
        toast.error('Unable to send SMS. Please check your number and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) {
      toast.error('Please enter the complete 6-digit code.')
      return
    }
    setLoading(true)
    try {
      let error
      if (method === 'email') {
        const result = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otpCode,
          type: 'email',
        })
        error = result.error
      } else {
        const result = await supabase.auth.verifyOtp({
          phone: normalizePhone(countryCode, phone),
          token: otpCode,
          type: 'sms',
        })
        error = result.error
      }
      if (error) throw error

      setStep('complete')
      toast.success('Verification successful! Welcome to Shoora EB-5.')
      setTimeout(() => navigate('/conversation'), 1200)
    } catch (err) {
      const msg = (err as Error).message.toLowerCase()
      if (msg.includes('expired')) {
        toast.error('This code has expired. Please request a new one.')
      } else if (msg.includes('invalid')) {
        toast.error('Incorrect code. Please check and try again.')
      } else {
        toast.error('Verification failed. Please try again.')
      }
      setOtpCode('')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setOtpCode('')
    if (method === 'email') await handleSendEmail()
    else await handleSendSms()
  }

  const goBack = () => {
    if (step === 'verify_otp') {
      setStep('enter_details')
      setOtpCode('')
    } else if (step === 'enter_details') {
      setStep('method')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 px-4 py-12">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-navy-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-navy-100/20">
          {/* Top accent */}
          <div className="h-1.5 bg-gradient-to-r from-navy-600 via-gold-500 to-navy-600" />

          <div className="p-8">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center">
                <span className="text-white font-display font-bold">S</span>
              </div>
              <div>
                <div className="font-display font-bold text-navy-900">Shoora EB-5</div>
                <div className="text-gold-600 text-xs font-medium">Authentication Portal</div>
              </div>
            </div>

            {/* Portal Tab Switcher */}
            <div className="flex bg-navy-50 p-1 rounded-xl mb-6 border border-navy-100">
              <button
                type="button"
                onClick={() => setAuthPortal('investor')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  authPortal === 'investor'
                    ? 'bg-white text-navy-900 shadow-2xs'
                    : 'text-navy-500 hover:text-navy-900'
                }`}
              >
                Investor Portal
              </button>
              <button
                type="button"
                onClick={() => setAuthPortal('admin')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  authPortal === 'admin'
                    ? 'bg-navy-900 text-white shadow-2xs'
                    : 'text-navy-500 hover:text-navy-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
                Admin Login
              </button>
            </div>

            {/* ── ADMIN PORTAL TAB ───────────────────────────────────────── */}
            {authPortal === 'admin' ? (
              <form onSubmit={handleAdminLogin} className="space-y-4 animate-fade-in">
                <div>
                  <h1 className="font-display text-xl font-bold text-navy-900 mb-1">
                    Administrator Sign In
                  </h1>
                  <p className="text-navy-500 text-xs mb-4">
                    Sign in to access lead CRM, live chat transcripts, and knowledge base.
                  </p>
                </div>

                {/* Email Input */}
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1.5">
                    Admin Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-navy-400" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@shoora.com"
                      className="input-field pl-9 text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-navy-700 mb-1.5">
                    Admin Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-navy-400" />
                    <input
                      type={showAdminPassword ? 'text' : 'password'}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="input-field pl-9 pr-9 text-xs"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminPassword((s) => !s)}
                      className="absolute right-3 top-3 text-navy-400 hover:text-navy-700"
                    >
                      {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Credentials reminder callout */}
                <div className="p-3 rounded-xl bg-gold-50/70 border border-gold-200 text-xs text-navy-800 space-y-1">
                  <div className="font-semibold text-gold-900 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px]">
                      <KeyRound className="w-3.5 h-3.5 text-gold-600" />
                      Default Admin Credentials:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminEmail('admin@shoora.com')
                        setAdminPassword('ShooraAdmin2026!')
                        toast.success('Admin credentials auto-filled!')
                      }}
                      className="text-[10px] text-gold-700 hover:underline font-bold"
                    >
                      Auto-Fill
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-navy-700">
                    Email: <strong>admin@shoora.com</strong>
                  </p>
                  <p className="text-[11px] font-mono text-navy-700">
                    Password: <strong>ShooraAdmin2026!</strong>
                  </p>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={adminLoading}
                  className="btn-primary w-full py-2.5 text-xs font-semibold shadow-md flex items-center justify-center gap-2 mt-2"
                >
                  {adminLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  {adminLoading ? 'Signing In…' : 'Sign In to Admin CRM'}
                </button>
              </form>
            ) : (
              /* ── INVESTOR PORTAL TAB (OTP) ─────────────────────────────── */
              <div>
                {/* ── STEP: Method Selection ──────────────────────────────────── */}
                {step === 'method' && (
                  <div className="animate-fade-in">
                    <h1 className="font-display text-xl font-bold text-navy-900 mb-1">
                      Investor Sign In
                    </h1>
                    <p className="text-navy-500 text-xs mb-6">
                      Sign in with dual OTP to save conversations, request consultations, and track your EB-5 inquiry.
                    </p>
                    <div className="space-y-3">
                      <button
                        id="auth-method-email"
                        onClick={() => {
                          setMethod('email')
                          setStep('enter_details')
                        }}
                        className="w-full flex items-center gap-4 p-3.5 rounded-xl border-2 border-navy-100 hover:border-navy-400 hover:bg-navy-50 transition-all duration-200 group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-navy-50 group-hover:bg-navy-100 flex items-center justify-center transition-colors">
                          <Mail className="w-4 h-4 text-navy-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-navy-900 text-xs">Continue with Email</div>
                          <div className="text-navy-400 text-[11px]">Receive a verification code by email</div>
                        </div>
                      </button>
                      <button
                        id="auth-method-phone"
                        onClick={() => {
                          setMethod('phone')
                          setStep('enter_details')
                        }}
                        className="w-full flex items-center gap-4 p-3.5 rounded-xl border-2 border-navy-100 hover:border-navy-400 hover:bg-navy-50 transition-all duration-200 group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-navy-50 group-hover:bg-navy-100 flex items-center justify-center transition-colors">
                          <Smartphone className="w-4 h-4 text-navy-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-semibold text-navy-900 text-xs">Continue with Mobile</div>
                          <div className="text-navy-400 text-[11px]">Receive a verification code by SMS</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── STEP: Enter Details ─────────────────────────────────────── */}
                {step === 'enter_details' && (
                  <div className="animate-fade-in">
                    <button
                      onClick={goBack}
                      className="flex items-center gap-1 text-navy-400 hover:text-navy-700 text-xs mb-4 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>

                    {method === 'email' ? (
                      <>
                        <h1 className="font-display text-xl font-bold text-navy-900 mb-1">
                          Enter Your Email
                        </h1>
                        <p className="text-navy-500 text-xs mb-4">
                          We will send a verification code to your email address.
                        </p>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="auth-email" className="block text-xs font-semibold text-navy-700 mb-1.5">
                              Email Address
                            </label>
                            <input
                              id="auth-email"
                              type="email"
                              autoComplete="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSendEmail()}
                              placeholder="you@example.com"
                              className="input-field text-xs"
                              disabled={loading}
                              autoFocus
                            />
                          </div>
                          <button
                            id="send-email-otp-btn"
                            onClick={handleSendEmail}
                            disabled={loading || !email}
                            className="btn-primary w-full text-xs py-2.5"
                          >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                            {loading ? 'Sending…' : 'Send Verification Code'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h1 className="font-display text-xl font-bold text-navy-900 mb-1">
                          Enter Your Mobile Number
                        </h1>
                        <p className="text-navy-500 text-xs mb-4">
                          We will send a verification code by SMS.
                        </p>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-semibold text-navy-700 mb-1.5">
                              Mobile Number
                            </label>
                            <div className="flex gap-2">
                              <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
                              <input
                                id="auth-phone"
                                type="tel"
                                autoComplete="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendSms()}
                                placeholder="123 456 7890"
                                className="input-field flex-1 text-xs"
                                disabled={loading}
                                autoFocus
                              />
                            </div>
                            <p className="text-navy-400 text-[10px] mt-1">
                              Enter digits only, without the country code
                            </p>
                          </div>
                          <button
                            id="send-sms-otp-btn"
                            onClick={handleSendSms}
                            disabled={loading || phone.length < 7}
                            className="btn-primary w-full text-xs py-2.5"
                          >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                            {loading ? 'Sending…' : 'Send SMS Code'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── STEP: Verify OTP ────────────────────────────────────────── */}
                {step === 'verify_otp' && (
                  <div className="animate-fade-in">
                    <button
                      onClick={goBack}
                      className="flex items-center gap-1 text-navy-400 hover:text-navy-700 text-xs mb-4 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Change {method === 'email' ? 'email' : 'number'}
                    </button>

                    <h1 className="font-display text-xl font-bold text-navy-900 mb-1">
                      Enter Verification Code
                    </h1>
                    <p className="text-navy-500 text-xs mb-1">
                      We sent a 6-digit code to{' '}
                      <strong className="text-navy-700">
                        {method === 'email' ? email : `${countryCode} ${phone}`}
                      </strong>
                    </p>
                    <p className="text-navy-400 text-[11px] mb-6">
                      Check your {method === 'email' ? 'inbox and spam folder' : 'messages'}.
                    </p>

                    <OtpInput
                      value={otpCode}
                      onChange={setOtpCode}
                      onComplete={handleVerifyOtp}
                      disabled={loading}
                    />

                    {/* Show/hide hint */}
                    <button
                      className="flex items-center gap-1 text-[11px] text-navy-400 hover:text-navy-600 mt-4 mx-auto transition-colors"
                      onClick={() => setShowOtpHint((h) => !h)}
                    >
                      {showOtpHint ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {showOtpHint ? 'Hide hint' : 'Where is my code?'}
                    </button>
                    {showOtpHint && (
                      <p className="text-[11px] text-navy-400 text-center mt-2 bg-navy-50 rounded-lg p-2.5">
                        {method === 'email'
                          ? 'Check your email inbox and spam/junk folder. The code expires in 10 minutes.'
                          : 'Check your SMS messages. The code expires in 10 minutes.'}
                      </p>
                    )}

                    <button
                      id="verify-otp-btn"
                      onClick={handleVerifyOtp}
                      disabled={loading || otpCode.length !== 6}
                      className="btn-primary w-full mt-5 text-xs py-2.5"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {loading ? 'Verifying…' : 'Verify Code'}
                    </button>

                    <div className="text-center mt-3">
                      {resendCooldown > 0 ? (
                        <p className="text-navy-400 text-[11px]">Resend available in {resendCooldown}s</p>
                      ) : (
                        <button
                          id="resend-otp-btn"
                          onClick={handleResend}
                          className="text-navy-600 hover:text-navy-800 text-xs font-medium transition-colors"
                        >
                          Didn't receive a code? Resend
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ── STEP: Complete ──────────────────────────────────────────── */}
                {step === 'complete' && (
                  <div className="animate-fade-in text-center py-6">
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h1 className="font-display text-xl font-bold text-navy-900 mb-1">
                      You're Verified!
                    </h1>
                    <p className="text-navy-500 text-xs">Redirecting you to the EB-5 assistant…</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom helper link */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-center text-navy-400 text-xs">
            Return to advisor?{' '}
            <Link
              to="/"
              className="text-gold-400 hover:text-gold-300 font-semibold transition-colors"
            >
              ← Back to AI Chatbot
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
