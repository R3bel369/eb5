import { useState, useRef } from 'react'
import {
  PRESET_AVATARS,
  DEFAULT_AVATAR_SETTINGS,
  getAvatarSettings,
  saveAvatarSettings,
  getAssistantAvatarUrl,
  getUserAvatarUrl,
  type AvatarSettings,
} from '../../lib/avatarConfig'
import { toast } from 'react-hot-toast'
import {
  Sparkles,
  Upload,
  Link as LinkIcon,
  Check,
  RotateCcw,
  Save,
  UserCheck,
  Bot,
  Image as ImageIcon,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react'
import { cn } from '../../lib/utils'

export function AdminAvatarsPanel() {
  const [settings, setSettings] = useState<AvatarSettings>(getAvatarSettings())
  const [saving, setSaving] = useState(false)
  const assistantFileInputRef = useRef<HTMLInputElement>(null)
  const userFileInputRef = useRef<HTMLInputElement>(null)

  const handleSave = () => {
    setSaving(true)
    try {
      saveAvatarSettings(settings)
      toast.success('Avatar branding settings updated successfully!')
    } catch {
      toast.error('Failed to save avatar settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setSettings(DEFAULT_AVATAR_SETTINGS)
    saveAvatarSettings(DEFAULT_AVATAR_SETTINGS)
    toast.success('Reset to default executive avatars')
  }

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'assistant' | 'user'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP, SVG)')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image file must be under 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      if (target === 'assistant') {
        setSettings((prev) => ({
          ...prev,
          assistantAvatarType: 'custom',
          assistantCustomUrl: result,
        }))
      } else {
        setSettings((prev) => ({
          ...prev,
          userAvatarType: 'custom',
          userCustomUrl: result,
        }))
      }
      toast.success(`Custom ${target} avatar image loaded! Click Save to apply.`)
    }
    reader.readAsDataURL(file)
  }

  const currentAssistantUrl = getAssistantAvatarUrl(settings)
  const currentUserUrl = getUserAvatarUrl(settings)

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-gold-100 text-gold-700">
              <UserCheck className="w-5 h-5" />
            </span>
            <h1 className="font-display text-2xl font-bold text-navy-900">
              Chatbot & Investor Avatars
            </h1>
          </div>
          <p className="text-navy-500 text-sm">
            Customize executive portraits, identity labels, or upload custom branding for both the AI
            Advisor and Client in the conversation interface.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleReset}
            className="btn-ghost text-xs py-2 px-3 text-navy-600 hover:text-navy-900 flex items-center gap-1.5"
            title="Restore original executive portraits"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary text-xs py-2 px-4 shadow-sm flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Avatar Settings'}
          </button>
        </div>
      </div>

      {/* Main Grid: Left side controls, Right side live preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column */}
        <div className="lg:col-span-7 space-y-8">
          {/* ── Advisor Avatar Settings ── */}
          <div className="card space-y-5 border border-navy-100 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-navy-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-gold-500/10 text-gold-600 flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <h2 className="font-display font-semibold text-navy-900 text-base">
                  AI Advisor Portrait & Identity
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-gold-700 bg-gold-50 px-2.5 py-1 rounded-full border border-gold-200">
                Replaces Robot Icon
              </span>
            </div>

            {/* Name & Title Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5">
                  Advisor Display Name
                </label>
                <input
                  type="text"
                  value={settings.assistantName}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, assistantName: e.target.value }))
                  }
                  placeholder="e.g. Elena Vance"
                  className="input-field text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5">
                  Advisor Title / Role
                </label>
                <input
                  type="text"
                  value={settings.assistantTitle}
                  onChange={(e) =>
                    setSettings((prev) => ({ ...prev, assistantTitle: e.target.value }))
                  }
                  placeholder="e.g. Senior EB-5 Investment Advisor"
                  className="input-field text-sm"
                />
              </div>
            </div>

            {/* Presets Grid */}
            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-2">
                Choose Executive Advisor Preset
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(PRESET_AVATARS.assistant).map((preset) => {
                  const isSelected = settings.assistantAvatarType === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          assistantAvatarType: preset.id,
                          assistantName: preset.label.split(' (')[0],
                          assistantTitle: preset.title || prev.assistantTitle,
                        }))
                      }
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                        isSelected
                          ? 'border-gold-500 bg-gold-50/50 ring-2 ring-gold-400/20 shadow-xs'
                          : 'border-navy-100 bg-white hover:border-navy-300 hover:bg-gray-50'
                      )}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-gold-400/70 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-navy-900 truncate">
                            {preset.label}
                          </p>
                          {isSelected && <Check className="w-4 h-4 text-gold-600 flex-shrink-0" />}
                        </div>
                        <p className="text-[11px] text-navy-500 truncate">{preset.title}</p>
                      </div>
                    </button>
                  )
                })}

                {/* Custom Avatar Card */}
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, assistantAvatarType: 'custom' }))
                  }
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border text-left transition-all sm:col-span-2',
                    settings.assistantAvatarType === 'custom'
                      ? 'border-gold-500 bg-gold-50/50 ring-2 ring-gold-400/20 shadow-xs'
                      : 'border-navy-100 bg-white hover:border-navy-300 hover:bg-gray-50'
                  )}
                >
                  <div className="w-11 h-11 rounded-full bg-navy-100 border border-dashed border-navy-300 flex items-center justify-center text-navy-600 flex-shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-navy-900">Custom Advisor Avatar</p>
                      {settings.assistantAvatarType === 'custom' && (
                        <Check className="w-4 h-4 text-gold-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-navy-500">
                      Upload any company headshot or paste an external image URL
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Input controls if custom selected */}
            {settings.assistantAvatarType === 'custom' && (
              <div className="p-4 rounded-xl bg-ivory-50 border border-gold-200/80 space-y-3">
                <p className="text-xs font-semibold text-navy-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                  Custom Advisor Image Source
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-4 h-4 absolute left-3 top-3 text-navy-400" />
                    <input
                      type="url"
                      value={settings.assistantCustomUrl}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          assistantCustomUrl: e.target.value,
                        }))
                      }
                      placeholder="https://example.com/advisor-photo.jpg"
                      className="input-field pl-9 text-xs"
                    />
                  </div>
                  <input
                    ref={assistantFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'assistant')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => assistantFileInputRef.current?.click()}
                    className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload File
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── User / Investor Avatar Settings ── */}
          <div className="card space-y-5 border border-navy-100 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-navy-100">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-navy-800 text-white flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <h2 className="font-display font-semibold text-navy-900 text-base">
                  Investor / Client Avatar
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-navy-700 bg-navy-50 px-2.5 py-1 rounded-full border border-navy-200">
                Replaces Contact Silhouette
              </span>
            </div>

            {/* Presets Grid */}
            <div>
              <label className="block text-xs font-semibold text-navy-700 mb-2">
                Choose Investor Profile Preset
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(PRESET_AVATARS.user).map((preset) => {
                  const isSelected = settings.userAvatarType === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          userAvatarType: preset.id,
                        }))
                      }
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                        isSelected
                          ? 'border-navy-800 bg-navy-50/50 ring-2 ring-navy-800/20 shadow-xs'
                          : 'border-navy-100 bg-white hover:border-navy-300 hover:bg-gray-50'
                      )}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-navy-700 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-navy-900 truncate">
                            {preset.label}
                          </p>
                          {isSelected && <Check className="w-4 h-4 text-navy-800 flex-shrink-0" />}
                        </div>
                        <p className="text-[11px] text-navy-500 truncate">{preset.description}</p>
                      </div>
                    </button>
                  )
                })}

                {/* Custom User Avatar Card */}
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({ ...prev, userAvatarType: 'custom' }))
                  }
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border text-left transition-all sm:col-span-2',
                    settings.userAvatarType === 'custom'
                      ? 'border-navy-800 bg-navy-50/50 ring-2 ring-navy-800/20 shadow-xs'
                      : 'border-navy-100 bg-white hover:border-navy-300 hover:bg-gray-50'
                  )}
                >
                  <div className="w-11 h-11 rounded-full bg-navy-100 border border-dashed border-navy-300 flex items-center justify-center text-navy-600 flex-shrink-0">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-navy-900">Custom Investor Avatar</p>
                      {settings.userAvatarType === 'custom' && (
                        <Check className="w-4 h-4 text-navy-800 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-navy-500">
                      Upload your own customer icon, investor badge, or portrait URL
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Input controls if custom selected */}
            {settings.userAvatarType === 'custom' && (
              <div className="p-4 rounded-xl bg-navy-50/50 border border-navy-200 space-y-3">
                <p className="text-xs font-semibold text-navy-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-navy-700" />
                  Custom Investor Image Source
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-4 h-4 absolute left-3 top-3 text-navy-400" />
                    <input
                      type="url"
                      value={settings.userCustomUrl}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          userCustomUrl: e.target.value,
                        }))
                      }
                      placeholder="https://example.com/client-portrait.jpg"
                      className="input-field pl-9 text-xs"
                    />
                  </div>
                  <input
                    ref={userFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'user')}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => userFileInputRef.current?.click()}
                    className="btn-secondary text-xs py-2 px-3 flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload File
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Live Interactive Preview Column */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-4">
          <div className="card p-0 overflow-hidden border border-navy-200/80 shadow-md">
            {/* Header of preview window */}
            <div className="bg-navy-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
                <span className="text-xs font-mono text-navy-300 ml-2">Live Chat Interface Preview</span>
              </div>
              <span className="text-[10px] bg-gold-500/20 text-gold-300 font-semibold px-2 py-0.5 rounded-full border border-gold-500/30">
                Instant Sync
              </span>
            </div>

            {/* Chat Header inside preview */}
            <div className="bg-white border-b border-navy-100 p-3.5 flex items-center gap-3">
              <div className="relative">
                <img
                  src={currentAssistantUrl}
                  alt={settings.assistantName}
                  className="w-10 h-10 rounded-full object-cover object-top ring-2 ring-gold-400 shadow-xs"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full ring-1 ring-emerald-600/20" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display font-bold text-navy-900 text-xs">
                    {settings.assistantName || 'Elena Vance'}
                  </h3>
                  <span className="text-[9px] bg-gold-100 text-gold-800 font-bold px-1.5 py-0.2 rounded-full">
                    AI Advisor
                  </span>
                </div>
                <p className="text-navy-400 text-[11px] font-medium">
                  {settings.assistantTitle || 'Senior EB-5 Investment Advisor'} • Shoora EB-5
                </p>
              </div>
            </div>

            {/* Chat Conversation Canvas */}
            <div className="bg-ivory-50/50 p-4 space-y-4">
              {/* User Message */}
              <div className="flex gap-2.5 flex-row-reverse items-start">
                <img
                  src={currentUserUrl}
                  alt="Investor"
                  className="w-8 h-8 rounded-full object-cover object-top ring-2 ring-navy-700 shadow-xs flex-shrink-0"
                />
                <div className="flex flex-col items-end gap-1 max-w-[85%]">
                  <div className="chat-bubble-user text-xs py-2 px-3 shadow-xs">
                    What is the minimum investment for the EB-5 program?
                  </div>
                  <span className="text-[10px] text-navy-400">Just now</span>
                </div>
              </div>

              {/* Assistant Message */}
              <div className="flex gap-2.5 flex-row items-start">
                <div className="relative flex-shrink-0">
                  <img
                    src={currentAssistantUrl}
                    alt={settings.assistantName}
                    className="w-8 h-8 rounded-full object-cover object-top ring-2 ring-gold-400 shadow-xs"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border border-white rounded-full" />
                </div>
                <div className="flex flex-col items-start gap-1 max-w-[85%]">
                  <div className="chat-bubble-bot text-xs py-2.5 px-3 leading-relaxed shadow-xs">
                    Under the EB-5 Reform and Integrity Act of 2022 (RIA), the minimum qualifying
                    investment is <strong>$800,000</strong> for Targeted Employment Area (TEA) projects,
                    and <strong>$1,050,000</strong> for standard non-TEA projects.
                  </div>
                  <span className="text-[10px] text-navy-400">Just now</span>
                </div>
              </div>
            </div>

            {/* Feature Highlights Footer */}
            <div className="bg-white p-3.5 border-t border-navy-100 flex items-center justify-between text-xs text-navy-500">
              <span className="flex items-center gap-1 text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                High-definition luxury styling
              </span>
              <span className="text-[11px] text-gold-600 font-semibold">
                Updated in real-time
              </span>
            </div>
          </div>

          {/* Helper callout */}
          <div className="p-4 rounded-xl bg-gold-50/60 border border-gold-200 text-xs text-navy-700 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-gold-800">
              <HelpCircle className="w-3.5 h-3.5" />
              How do updates reflect?
            </div>
            <p className="text-[11px] leading-relaxed text-navy-600">
              When you click <strong>Save Avatar Settings</strong>, the new images and advisor names
              propagate instantly across the live customer chat interface at{' '}
              <span className="font-mono bg-white px-1 py-0.5 rounded border border-gold-200">
                /conversation
              </span>{' '}
              without requiring a website reload.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
