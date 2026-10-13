import { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import {
  Send, Loader2, MessageSquare, RefreshCw, LogIn,
  ExternalLink, User, Bot, ChevronRight, Lock, ShieldCheck
} from 'lucide-react'
import { useChat } from '../contexts/ChatContext'
import { useAuth } from '../contexts/AuthContext'
import { cn, formatDateTime } from '../lib/utils'
import type { ChatMessage } from '../types/database'
import { ConsultationForm } from '../components/chat/ConsultationForm'

import { Avatar } from '../components/common/Avatar'
import { getAvatarSettings, type AvatarSettings } from '../lib/avatarConfig'
import { LeadOnboardingCard } from '../components/chat/LeadOnboardingCard'
import { QuestionInsightsBar } from '../components/chat/QuestionInsightsBar'
import { ChatOtpVerificationCard } from '../components/chat/ChatOtpVerificationCard'

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex gap-3 mb-4 animate-slide-up', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <Avatar role={isUser ? 'user' : 'assistant'} size="md" />

      {/* Content */}
      <div className={cn('flex flex-col gap-1 max-w-[80%]', isUser ? 'items-end' : 'items-start')}>
        <div className={isUser ? 'chat-bubble-user' : 'chat-bubble-bot'}>
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-navy-100">
              <p className="text-xs text-navy-400 font-medium mb-1">Sources:</p>
              {message.sources.map((src, i) => (
                <a
                  key={i}
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-navy-600 hover:text-gold-600 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  {src}
                </a>
              ))}
            </div>
          )}
        </div>
        <span className="text-navy-400 text-[10px]">{formatDateTime(message.timestamp)}</span>
      </div>
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4 items-center">
      <Avatar role="assistant" size="md" />
      <div className="chat-bubble-bot flex items-center gap-1 py-3">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-navy-300 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Suggested Questions ──────────────────────────────────────────────────────

const QUICK_QUESTIONS = [
  'What is the EB-5 program?',
  'What are the minimum investment amounts?',
  'Can my family be included?',
  'What is a Regional Center?',
  'Can I speak with an advisor?',
]

// ─── Main Chat Page ───────────────────────────────────────────────────────────

export function ChatPage() {
  const {
    messages,
    loading,
    onboardingStep,
    otpState,
    sendMessage,
    submitOnboardingDetails,
    verifyOtpCode,
    resendOtpCode,
    changeOtpContact,
    skipOnboarding,
    startNewConversation,
  } = useChat()
  const { user, isAdmin, signOut } = useAuth()
  const [avatarSettings, setAvatarSettings] = useState<AvatarSettings>(getAvatarSettings())
  const [input, setInput] = useState('')
  const [showConsultation, setShowConsultation] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const handleUpdate = () => setAvatarSettings(getAvatarSettings())
    window.addEventListener('shoora_avatar_change', handleUpdate)
    return () => window.removeEventListener('shoora_avatar_change', handleUpdate)
  }, [])

  // Auto-send query from URL params (e.g., from homepage quick links)
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && messages.length === 1) {
      sendMessage(q)
      navigate('/conversation', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new user/bot messages (avoid pushing initial welcome message out of view)
  useEffect(() => {
    if (messages.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, loading])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    setInput('')
    await sendMessage(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-ivory-50">
      {/* Header */}
      <div className="bg-white border-b border-navy-100 px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xs z-10">
        <div className="flex items-center gap-3">
          <Avatar role="assistant" size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display font-bold text-navy-900 text-sm sm:text-base">
                {avatarSettings.assistantName}
              </h1>
              <span className="text-[10px] bg-gold-100 text-gold-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                AI EB-5 Advisor
              </span>
            </div>
            <p className="text-navy-400 text-xs hidden sm:block">
              {avatarSettings.assistantTitle} • Shoora Immigration Investment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="new-conversation-btn"
            onClick={startNewConversation}
            className="btn-ghost text-xs py-1.5 px-2.5 sm:px-3 flex items-center gap-1.5"
            title="Start new conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>

          {isAdmin ? (
            <div className="flex items-center gap-1.5">
              <Link
                to="/admin"
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-2xs"
                title="Open Admin CRM & Leads"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
                <span>Admin Portal</span>
              </Link>
              <button
                type="button"
                onClick={() => signOut()}
                className="btn-ghost text-[11px] py-1.5 px-2 text-navy-400 hover:text-navy-700"
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              to="/sign-in"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-navy-700 hover:text-navy-900 bg-ivory-100 hover:bg-gold-50 border border-navy-200 rounded-xl transition-all shadow-2xs"
              title="Admin Login to view leads and settings"
            >
              <Lock className="w-3.5 h-3.5 text-gold-600" />
              <span>Admin Login</span>
            </Link>
          )}
        </div>
      </div>

      {/* Disclaimer bar */}
      <div className="bg-gold-50 border-b border-gold-200 px-4 py-2 text-center">
        <p className="text-gold-700 text-xs">
          Educational information only. Not legal or investment advice. Consult qualified professionals before making decisions.
        </p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
        <div className="max-w-3xl mx-auto">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {onboardingStep === 'ask_name' && !loading && (
            <LeadOnboardingCard
              onSubmit={submitOnboardingDetails}
              onSkip={skipOnboarding}
            />
          )}
          {onboardingStep === 'verify_phone_otp' && !loading && (
            <ChatOtpVerificationCard
              phone={otpState.phone}
              email={otpState.email}
              onVerify={verifyOtpCode}
              onResend={resendOtpCode}
              onChangePhone={changeOtpContact}
            />
          )}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Question Insights & FAQs (Always accessible above chat input) */}
      <QuestionInsightsBar
        onSelectQuestion={(q) => sendMessage(q)}
        disabled={loading}
      />

      {/* Input area */}
      <div className="bg-white border-t border-navy-100 px-4 py-3">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-ivory-50 border border-navy-200 rounded-2xl p-3 focus-within:border-navy-400 focus-within:ring-2 focus-within:ring-navy-200 transition-all">
            <textarea
              ref={inputRef}
              id="chat-input"
              value={input}
              onChange={e => {
                setInput(e.target.value)
                // Auto-resize
                e.target.style.height = 'auto'
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about the EB-5 program…"
              className="flex-1 bg-transparent text-navy-900 text-sm placeholder:text-navy-400 resize-none outline-none leading-relaxed min-h-[24px]"
              rows={1}
              disabled={loading}
              aria-label="Chat message input"
            />
            <button
              id="send-message-btn"
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={cn(
                'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                input.trim() && !loading
                  ? 'bg-navy-800 text-white hover:bg-navy-700 shadow-sm'
                  : 'bg-navy-100 text-navy-300 cursor-not-allowed'
              )}
              aria-label="Send message"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-navy-400 text-xs">Press Enter to send • Shift+Enter for new line</p>
            <button
              id="request-consultation-btn"
              onClick={() => setShowConsultation(true)}
              className="text-xs text-gold-600 hover:text-gold-700 font-medium transition-colors"
            >
              Request Consultation →
            </button>
          </div>
        </div>
      </div>

      {/* Consultation modal */}
      {showConsultation && (
        <ConsultationForm onClose={() => setShowConsultation(false)} />
      )}
    </div>
  )
}
