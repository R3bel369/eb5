import { useState } from 'react'
import {
  Code2, Copy, Check, ExternalLink, Globe, Smartphone,
  Sliders, ShieldCheck, Sparkles, MessageSquare, Terminal, Info
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getAvatarSettings } from '../../lib/avatarConfig'

export function AdminEmbedWidgetPanel() {
  const [copiedScript, setCopiedScript] = useState(false)
  const [copiedIframe, setCopiedIframe] = useState(false)
  const [copiedReact, setCopiedReact] = useState(false)
  const [position, setPosition] = useState<'bottom-right' | 'bottom-left'>('bottom-right')
  const [themeColor, setThemeColor] = useState('#C9A84C')
  const [hostDomain, setHostDomain] = useState(
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
  )

  const avatar = getAvatarSettings()

  const scriptTagCode = `<!-- Shoora EB-5 AI Chatbot Embed Code -->
<script 
  src="${hostDomain}/widget.js" 
  data-position="${position}" 
  data-color="${themeColor}" 
  data-title="Shoora EB-5 • ${avatar.assistantName}"
  async>
</script>`

  const iframeTagCode = `<!-- Shoora EB-5 AI Chatbot Inline iFrame -->
<iframe 
  src="${hostDomain}/widget" 
  width="100%" 
  height="650" 
  frameborder="0" 
  style="border-radius: 16px; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(0,0,0,0.06);"
  title="Shoora EB-5 Advisor Chatbot"
  allow="clipboard-write">
</iframe>`

  const reactCode = `// React / Next.js Embed Component
import { useEffect } from 'react';

export default function ShooraChatbot() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '${hostDomain}/widget.js';
    script.setAttribute('data-position', '${position}');
    script.setAttribute('data-color', '${themeColor}');
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup on unmount
      const launcher = document.getElementById('shoora-widget-launcher');
      const container = document.getElementById('shoora-widget-container');
      if (launcher) launcher.remove();
      if (container) container.remove();
    };
  }, []);

  return null;
}`

  const copyToClipboard = (text: string, type: 'script' | 'iframe' | 'react') => {
    navigator.clipboard.writeText(text)
    if (type === 'script') {
      setCopiedScript(true)
      setTimeout(() => setCopiedScript(false), 2000)
    } else if (type === 'iframe') {
      setCopiedIframe(true)
      setTimeout(() => setCopiedIframe(false), 2000)
    } else {
      setCopiedReact(true)
      setTimeout(() => setCopiedReact(false), 2000)
    }
    toast.success('Embed code copied to clipboard!')
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 text-white rounded-2xl p-6 sm:p-8 border border-gold-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 text-gold-300 text-xs font-semibold mb-3 border border-gold-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Universal Website Integration
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
            Embed AI Chatbot into External Sites
          </h1>
          <p className="text-navy-300 text-xs sm:text-sm leading-relaxed mb-4">
            Embed your <strong>Shoora EB-5 AI Advisor</strong> on any third-party partner website, WordPress blog, Webflow page, or client portal. All visitor leads and conversations synchronize seamlessly into your CRM.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/embed-demo.html"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 shadow-md"
            >
              <Globe className="w-4 h-4" />
              Launch Live Partner Site Demo
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>

            <a
              href="/widget"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-xs py-2 px-4 inline-flex items-center gap-1.5 bg-navy-800 text-white border-navy-700 hover:bg-navy-700"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Preview Standalone Widget
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Grid: Customizer & Code Snippets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Customizer Settings */}
        <div className="lg:col-span-5 space-y-5">
          <div className="card p-5 bg-white border border-navy-100 shadow-sm rounded-2xl">
            <div className="flex items-center gap-2 pb-3 border-b border-navy-100 mb-4">
              <Sliders className="w-4 h-4 text-gold-600" />
              <h2 className="font-display font-bold text-navy-900 text-sm">
                Widget Appearance & Configuration
              </h2>
            </div>

            <div className="space-y-4">
              {/* Position */}
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5">
                  Launcher Position
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPosition('bottom-right')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                      position === 'bottom-right'
                        ? 'border-gold-500 bg-gold-50 text-gold-900 ring-1 ring-gold-500'
                        : 'border-navy-200 text-navy-600 hover:bg-navy-50'
                    }`}
                  >
                    Bottom Right (Default)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosition('bottom-left')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all ${
                      position === 'bottom-left'
                        ? 'border-gold-500 bg-gold-50 text-gold-900 ring-1 ring-gold-500'
                        : 'border-navy-200 text-navy-600 hover:bg-navy-50'
                    }`}
                  >
                    Bottom Left
                  </button>
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1.5">
                  Primary Accent Color
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { color: '#C9A84C', name: 'Imperial Gold' },
                    { color: '#1B365D', name: 'Classic Navy' },
                    { color: '#059669', name: 'Emerald Green' },
                    { color: '#D97706', name: 'Warm Amber' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setThemeColor(c.color)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        themeColor === c.color ? 'scale-110 ring-2 ring-offset-2 ring-navy-900' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: c.color, borderColor: '#ffffff' }}
                      title={c.name}
                    />
                  ))}
                  <input
                    type="text"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="input-field text-xs py-1.5 px-2.5 font-mono w-28 ml-auto"
                  />
                </div>
              </div>

              {/* Host Domain URL */}
              <div>
                <label className="block text-xs font-semibold text-navy-700 mb-1">
                  Host Domain URL
                </label>
                <input
                  type="text"
                  value={hostDomain}
                  onChange={(e) => setHostDomain(e.target.value)}
                  placeholder="https://shoora.com"
                  className="input-field text-xs py-1.5 bg-ivory-50/50"
                />
                <p className="text-[10px] text-navy-400 mt-1">
                  The domain where your Shoora application is hosted.
                </p>
              </div>

              {/* Current Active Advisor */}
              <div className="pt-2 border-t border-navy-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center font-bold text-xs text-navy-700">
                    {avatar.assistantName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-navy-800">{avatar.assistantName}</p>
                    <p className="text-[10px] text-navy-400">{avatar.assistantTitle}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
                  Active
                </span>
              </div>
            </div>
          </div>

          {/* Quick Platform Guides */}
          <div className="card p-5 bg-white border border-navy-100 shadow-sm rounded-2xl">
            <h3 className="font-display font-bold text-navy-900 text-xs mb-3 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-navy-500" />
              Supported Platforms
            </h3>
            <ul className="text-xs text-navy-600 space-y-2">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-navy-800">WordPress:</span>
                <span>Paste script inside Header and Footer Scripts plugin or <code>footer.php</code>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-navy-800">Webflow:</span>
                <span>Add to Project Settings → Custom Code → Before &lt;/body&gt; tag.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-navy-800">Shopify / Wix:</span>
                <span>Add via Custom Code / Tracking Scripts before &lt;/body&gt;.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-navy-800">HTML / React:</span>
                <span>Include in <code>index.html</code> or use the React Component below.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Embed Snippets */}
        <div className="lg:col-span-7 space-y-5">
          {/* Method 1: Floating Widget Script */}
          <div className="card p-5 bg-white border border-navy-100 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-navy-100 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-navy-900 text-sm">
                    Option 1: Floating Chatbot Script
                  </h3>
                  <span className="text-[10px] bg-gold-100 text-gold-800 font-semibold px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-navy-500">
                  Adds the floating circular chat bubble & responsive slide-up window to any site.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(scriptTagCode, 'script')}
                className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-xs"
              >
                {copiedScript ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            <pre className="bg-navy-950 text-gold-300 p-3.5 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-navy-800">
              <code>{scriptTagCode}</code>
            </pre>
          </div>

          {/* Method 2: Inline iFrame */}
          <div className="card p-5 bg-white border border-navy-100 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-navy-100 mb-3">
              <div>
                <h3 className="font-display font-bold text-navy-900 text-sm">
                  Option 2: Inline iFrame Embed
                </h3>
                <p className="text-[11px] text-navy-500">
                  Embeds the chatbot directly into a designated page section or contact container.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(iframeTagCode, 'iframe')}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-xs"
              >
                {copiedIframe ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            <pre className="bg-navy-950 text-navy-200 p-3.5 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-navy-800">
              <code>{iframeTagCode}</code>
            </pre>
          </div>

          {/* Method 3: React / Next.js */}
          <div className="card p-5 bg-white border border-navy-100 shadow-sm rounded-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-navy-100 mb-3">
              <div>
                <h3 className="font-display font-bold text-navy-900 text-sm">
                  Option 3: React / Next.js Component
                </h3>
                <p className="text-[11px] text-navy-500">
                  Ready-to-use component for single-page applications.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(reactCode, 'react')}
                className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-xs"
              >
                {copiedReact ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>

            <pre className="bg-navy-950 text-navy-200 p-3.5 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-navy-800">
              <code>{reactCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
