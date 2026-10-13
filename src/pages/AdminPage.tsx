import { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, MessageSquare, Table2,
  Settings, LogOut, Menu, X, RefreshCw, AlertTriangle,
  CheckCircle, Clock, XCircle, ChevronRight, BookOpen,
  UserCheck, Code2, Bot
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { AdminLeadsPanel } from '../components/admin/AdminLeadsPanel'
import { AdminIntegrationsPanel } from '../components/admin/AdminIntegrationsPanel'
import { AdminConversationsPanel } from '../components/admin/AdminConversationsPanel'
import { AdminDashboardHome } from '../components/admin/AdminDashboardHome'
import { AdminKnowledgeBasePanel } from '../components/admin/AdminKnowledgeBasePanel'
import { AdminAvatarsPanel } from '../components/admin/AdminAvatarsPanel'
import { AdminEmbedWidgetPanel } from '../components/admin/AdminEmbedWidgetPanel'
import { cn, formatDateTime } from '../lib/utils'
import type { SpreadsheetSyncJob } from '../types/database'

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const SIDEBAR_LINKS = [
  { href: '/admin',                label: 'Overview',           icon: LayoutDashboard, end: true },
  { href: '/admin/leads',          label: 'Leads',              icon: Users },
  { href: '/admin/knowledge-base', label: 'Knowledge Base',     icon: BookOpen },
  { href: '/admin/avatars',        label: 'Avatars & Branding', icon: UserCheck },
  { href: '/admin/embed',          label: 'Embed & Widget',     icon: Code2 },
  { href: '/admin/conversations',  label: 'Conversations',      icon: MessageSquare },
  { href: '/admin/integrations',   label: 'Integrations',       icon: Table2 },
  { href: '/admin/settings',       label: 'Settings',           icon: Settings },
]

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const location = useLocation()
  const { user, signOut } = useAuth()

  const isActive = (href: string, end?: boolean) =>
    end ? location.pathname === href : location.pathname.startsWith(href)

  return (
    <>
      {/* Overlay (mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-navy-950 z-40 flex flex-col transition-transform duration-300',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-navy-800">
          <div className="w-8 h-8 rounded-lg bg-gold-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm font-display">S</span>
          </div>
          <div>
            <div className="text-white font-display font-bold text-sm">Shoora EB-5</div>
            <div className="text-gold-400 text-xs font-medium">Admin</div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto lg:hidden p-1 text-navy-400 hover:text-white"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Admin navigation">
          {SIDEBAR_LINKS.map(link => (
            <Link
              key={link.href}
              to={link.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive(link.href, link.end)
                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/30'
                  : 'text-navy-400 hover:bg-navy-800 hover:text-white'
              )}
            >
              <link.icon className="w-4 h-4 flex-shrink-0" />
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-navy-800 space-y-2.5">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-gold-500/15 hover:bg-gold-500/25 text-gold-300 border border-gold-500/30 text-xs font-semibold transition-all shadow-2xs"
          >
            <Bot className="w-4 h-4 text-gold-400" />
            <span>Open AI Chatbot</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-white text-xs font-semibold">
              {(user?.email || 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.email}</p>
              <p className="text-navy-400 text-xs">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-navy-400 hover:bg-navy-800 hover:text-white text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}

// ─── Admin Layout ─────────────────────────────────────────────────────────────

export function AdminPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center gap-4 px-4 lg:px-6 flex-shrink-0">
          <button
            id="sidebar-toggle"
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <SyncStatusBadge />
        </header>

        {/* Routes */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Routes>
            <Route index                    element={<AdminDashboardHome />} />
            <Route path="leads/*"           element={<AdminLeadsPanel />} />
            <Route path="knowledge-base"    element={<AdminKnowledgeBasePanel />} />
            <Route path="avatars"           element={<AdminAvatarsPanel />} />
            <Route path="embed"             element={<AdminEmbedWidgetPanel />} />
            <Route path="conversations"     element={<AdminConversationsPanel />} />
            <Route path="integrations"      element={<AdminIntegrationsPanel />} />
            <Route path="settings"          element={<AdminSettingsPlaceholder />} />
            <Route path="*"                 element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

// ─── Sync status badge in header ──────────────────────────────────────────────

function SyncStatusBadge() {
  const [failedCount, setFailedCount] = useState(0)

  useEffect(() => {
    supabase
      .from('spreadsheet_sync_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('sync_status', 'failed')
      .then(({ count }) => setFailedCount(count ?? 0))
  }, [])

  if (failedCount === 0) return null

  return (
    <Link
      to="/admin/integrations"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium hover:bg-red-100 transition-colors"
    >
      <AlertTriangle className="w-3.5 h-3.5" />
      {failedCount} sync {failedCount === 1 ? 'failure' : 'failures'}
    </Link>
  )
}

// ─── Settings placeholder ─────────────────────────────────────────────────────

function AdminSettingsPlaceholder() {
  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-navy-900">Admin Settings & Customization</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/admin/avatars"
          className="card hover:border-gold-400 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 text-gold-600 flex items-center justify-center mb-3">
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="font-display font-semibold text-navy-900 text-base mb-1">
              Chatbot & Investor Avatars
            </h2>
            <p className="text-navy-500 text-xs leading-relaxed">
              Configure executive portrait presets, names, titles, or upload custom branding images for both the AI Advisor and Investor.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-gold-600 flex items-center gap-1 group-hover:gap-2 transition-all">
            Customize Avatars <ChevronRight className="w-4 h-4" />
          </span>
        </Link>

        <Link
          to="/admin/embed"
          className="card hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Code2 className="w-5 h-5" />
            </div>
            <h2 className="font-display font-semibold text-navy-900 text-base mb-1">
              Embeddable Chatbot Widget
            </h2>
            <p className="text-navy-500 text-xs leading-relaxed">
              Get 1-line script tags, inline iFrames, and React snippets to embed the EB-5 chatbot on any external website.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-emerald-600 flex items-center gap-1 group-hover:gap-2 transition-all">
            Get Embed Code <ChevronRight className="w-4 h-4" />
          </span>
        </Link>

        <Link
          to="/admin/knowledge-base"
          className="card hover:border-navy-400 hover:shadow-md transition-all group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-navy-100 text-navy-700 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="font-display font-semibold text-navy-900 text-base mb-1">
              Knowledge Base & AI Replies
            </h2>
            <p className="text-navy-500 text-xs leading-relaxed">
              Manage EB-5 questions, guidelines, upload training documents, and test customer replies with the live simulator.
            </p>
          </div>
          <span className="mt-4 text-xs font-semibold text-navy-700 flex items-center gap-1 group-hover:gap-2 transition-all">
            Manage Knowledge Base <ChevronRight className="w-4 h-4" />
          </span>
        </Link>
      </div>

      <div className="card bg-gray-50/70 border border-navy-100">
        <h3 className="font-display font-semibold text-navy-800 text-sm mb-1">System & Database Integrations</h3>
        <p className="text-navy-500 text-xs">
          Supabase database credentials, Microsoft Graph Excel credentials, and Google Sheets Service Account credentials are securely managed via environment variables and the Integrations panel.
        </p>
      </div>
    </div>
  )
}
