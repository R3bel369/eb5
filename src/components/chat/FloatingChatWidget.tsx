import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { MessageSquare, X, Sparkles, ChevronUp, Bot, ExternalLink } from 'lucide-react'
import { Avatar } from '../common/Avatar'
import { getAvatarSettings, type AvatarSettings } from '../../lib/avatarConfig'

export function FloatingChatWidget() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [avatarSettings, setAvatarSettings] = useState<AvatarSettings>(getAvatarSettings())
  const [showTooltip, setShowTooltip] = useState(true)

  useEffect(() => {
    const handleUpdate = () => setAvatarSettings(getAvatarSettings())
    window.addEventListener('shoora_avatar_change', handleUpdate)
    return () => window.removeEventListener('shoora_avatar_change', handleUpdate)
  }, [])

  // Auto-hide tooltip after 8s
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 8000)
    return () => clearTimeout(timer)
  }, [])

  // Do not render on full conversation page or widget page to avoid recursion
  if (
    location.pathname.startsWith('/conversation') ||
    location.pathname.startsWith('/widget') ||
    location.pathname.startsWith('/admin')
  ) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[410px] h-[620px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-120px)] rounded-2xl shadow-2xl border border-gold-400/40 bg-white overflow-hidden flex flex-col z-50 animate-scale-in">
          {/* Iframe loading standalone widget */}
          <iframe
            src="/widget"
            title="Shoora EB-5 AI Advisor"
            className="w-full h-full border-none flex-1"
          />
        </div>
      )}

      {/* Tooltip Prompt Callout */}
      {showTooltip && !isOpen && (
        <div
          onClick={() => {
            setShowTooltip(false)
            setIsOpen(true)
          }}
          className="absolute bottom-20 right-0 w-72 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 text-white border border-gold-400/50 shadow-2xl rounded-2xl p-3.5 text-xs cursor-pointer animate-fade-in hover:border-gold-300 transition-all backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-gold-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]" />
              <span>{avatarSettings.assistantName} • EB-5 Advisor</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowTooltip(false)
              }}
              className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 text-navy-300 hover:text-white flex items-center justify-center text-[10px]"
            >
              ✕
            </button>
          </div>
          <p className="text-navy-200 text-xs leading-relaxed">
            Have questions on <strong>EB-5 Green Cards</strong>, investments, or wait times? Let's chat!
          </p>
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-navy-900 border-r border-b border-gold-400/50 rotate-45" />
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen)
          setShowTooltip(false)
        }}
        className="w-16 h-16 rounded-full bg-[radial-gradient(circle_at_35%_30%,#17386d_0%,#091a38_65%,#051024_100%)] border-2 border-gold-400 text-white shadow-[0_14px_34px_-4px_rgba(5,16,36,0.55),0_6px_18px_rgba(201,168,76,0.38)] hover:shadow-[0_20px_42px_-4px_rgba(5,16,36,0.65),0_8px_24px_rgba(201,168,76,0.55)] hover:border-gold-300 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center relative group"
        aria-label="Toggle AI Advisor Chatbot"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white transition-transform duration-300 rotate-90" />
        ) : (
          <>
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-gold-400 group-hover:text-gold-300 transition-colors" />
              <Sparkles className="w-3.5 h-3.5 text-gold-300 absolute -top-1.5 -right-1.5 fill-gold-400 animate-pulse" />
            </div>
            {/* Online Pulse Radar Beacon */}
            <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-navy-950 shadow-[0_0_8px_#10b981]" />
            </span>
          </>
        )}
      </button>
    </div>
  )
}
