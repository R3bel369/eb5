import { useState, useEffect, useRef } from 'react'
import {
  Send, RefreshCw, X, Minus, ExternalLink, Bot, User,
  CheckCircle2, Sparkles, Shield, Lock, ShieldCheck
} from 'lucide-react'
import { useChat } from '../contexts/ChatContext'
import { useAuth } from '../contexts/AuthContext'
import { Avatar } from '../components/common/Avatar'
import { getAvatarSettings, type AvatarSettings } from '../lib/avatarConfig'
import { LeadOnboardingCard } from '../components/chat/LeadOnboardingCard'
import { QuestionInsightsBar } from '../components/chat/QuestionInsightsBar'
import { ChatOtpVerificationCard } from '../components/chat/ChatOtpVerificationCard'
import { cn, formatDateTime } from '../lib/utils'
import type { ChatMessage } from '../types/database'

function WidgetMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex gap-2.5 mb-3 animate-slide-up', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar role={isUser ? 'user' : 'assistant'} size="sm" />
      <div className={cn('flex flex-col gap-0.5 max-w-[85%]', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed',
            isUser
              ? 'bg-navy-900 text-white rounded-br-xs'
              : 'bg-white text-navy-900 border border-navy-100 shadow-xs rounded-bl-xs'
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          {message.sources && message.sources.length > 0 && (
            <div className="mt-2 pt-2 border-t border-navy-100">
              <p className="text-[10px] text-navy-400 font-medium mb-1">Sources:</p>
              {message.sources.map((src, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[10px] text-navy-600 mr-2">
                  <ExternalLink className="w-2.5 h-2.5" />
                  {src}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="text-navy-400 text-[9px] px-1">{formatDateTime(message.timestamp)}</span>
      </div>
    </div>
  )
}

function WidgetTypingIndicator() {
  return (
    <div className="flex gap-2 mb-3 items-center">
      <Avatar role="assistant" size="sm" />
      <div className="bg-white border border-navy-100 px-3 py-2 rounded-2xl flex items-center gap-1 shadow-xs">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-navy-300 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}

export function WidgetChatPage() {
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

  const { isAdmin } = useAuth()
  const [avatarSettings, setAvatarSettings] = useState<AvatarSettings>(getAvatarSettings())
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleUpdate = () => setAvatarSettings(getAvatarSettings())
    window.addEventListener('shoora_avatar_change', handleUpdate)
    return () => window.removeEventListener('shoora_avatar_change', handleUpdate)
  }, [])

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

  const handleCloseWidget = () => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'shoora_close_widget' }, '*')
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-ivory-50 text-navy-900 font-sans select-none overflow-hidden">
      {/* Widget Header */}
      <header className="bg-navy-950 text-white px-4 py-3 flex items-center justify-between border-b border-navy-800 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Avatar role="assistant" size="md" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-navy-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-display font-semibold text-xs text-white">
                {avatarSettings.assistantName}
              </h2>
              <span className="text-[9px] bg-gold-500/20 text-gold-300 font-semibold px-1.5 py-0.2 rounded">
                AI Advisor
              </span>
            </div>
            <p className="text-[10px] text-navy-300 flex items-center gap-1">
              Shoora EB-5 • <span className="text-emerald-400">Online</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isAdmin ? (
            <a
              href={`${typeof window !== 'undefined' ? window.location.origin : ''}/admin`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gold-400 hover:text-gold-300 rounded-lg hover:bg-navy-800/80 transition-colors"
              title="Open Admin Dashboard"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </a>
          ) : (
            <a
              href={`${typeof window !== 'undefined' ? window.location.origin : ''}/sign-in`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-navy-400 hover:text-gold-400 rounded-lg hover:bg-navy-800/80 transition-colors"
              title="Admin Portal Login"
            >
              <Lock className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={startNewConversation}
            className="p-1.5 text-navy-300 hover:text-white rounded-lg hover:bg-navy-800/80 transition-colors"
            title="Reset conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCloseWidget}
            className="p-1.5 text-navy-300 hover:text-white rounded-lg hover:bg-navy-800/80 transition-colors"
            title="Close chatbot"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Trust & Educational Notice */}
      <div className="bg-gold-50 border-b border-gold-200/70 px-3 py-1.5 text-center flex-shrink-0">
        <p className="text-gold-800 text-[10px] flex items-center justify-center gap-1">
          <Shield className="w-3 h-3 text-gold-600 flex-shrink-0" />
          Educational EB-5 Information • Reform and Integrity Act (RIA 2022)
        </p>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2 scrollbar-thin">
        {messages.map((msg) => (
          <WidgetMessageBubble key={msg.id} message={msg} />
        ))}

        {onboardingStep === 'ask_name' && !loading && (
          <div className="my-2">
            <LeadOnboardingCard
              onSubmit={submitOnboardingDetails}
              onSkip={skipOnboarding}
            />
          </div>
        )}

        {onboardingStep === 'verify_phone_otp' && !loading && (
          <div className="my-2">
            <ChatOtpVerificationCard
              phone={otpState.phone}
              email={otpState.email}
              externalError={otpState.error}
              onVerify={verifyOtpCode}
              onResend={resendOtpCode}
              onChangePhone={changeOtpContact}
            />
          </div>
        )}

        {loading && <WidgetTypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Question Insights & FAQs */}
      <QuestionInsightsBar
        onSelectQuestion={(q) => sendMessage(q)}
        disabled={loading}
        compact
      />

      {/* Bottom Input Bar */}
      <div className="bg-white border-t border-navy-100 p-2.5 flex-shrink-0 shadow-lg">
        <div className="flex items-end gap-2 bg-ivory-50 border border-navy-200 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-gold-500 focus-within:border-gold-500 transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              onboardingStep === 'verify_phone_otp'
                ? 'Enter 6-digit SMS code...'
                : 'Ask anything about EB-5 investments...'
            }
            rows={1}
            className="flex-1 bg-transparent border-none resize-none text-xs text-navy-900 placeholder:text-navy-400 focus:outline-none max-h-24 py-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-1.5 rounded-lg bg-gold-500 text-white hover:bg-gold-600 disabled:opacity-40 transition-colors flex-shrink-0"
            title="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center justify-between text-[9px] text-navy-400 mt-1.5 px-1">
          <span>Powered by Shoora EB-5 AI</span>
          <span>Press Enter to send</span>
        </div>
      </div>
    </div>
  )
}
