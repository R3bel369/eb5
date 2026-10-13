import { useEffect, useState } from 'react'
import { Users, MessageSquare, Clock, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDateTime, statusLabel, statusVariant, syncStatusVariant } from '../../lib/utils'
import { getLocalLeads, fetchRemoteLeads } from '../../lib/leadStorage'
import type { Lead, SpreadsheetSyncJob } from '../../types/database'
import { Link } from 'react-router-dom'

interface DashboardStats {
  totalLeads: number
  newLeads: number
  consultationRequests: number
  followUpsRequired: number
}

export function AdminDashboardHome() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0, newLeads: 0, consultationRequests: 0, followUpsRequired: 0,
  })
  const [recentLeads, setRecentLeads]     = useState<Lead[]>([])
  const [failedJobs, setFailedJobs]       = useState<SpreadsheetSyncJob[]>([])
  const [integrations, setIntegrations]   = useState<{ provider: string; configuration_status: string }[]>([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { count: total },
        { count: newCount },
        { count: consultCount },
        { count: followUpCount },
        { data: leads },
        { data: failed },
        { data: integs },
      ] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('lead_status', 'new_inquiry'),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('consultation_requested', true),
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('lead_status', 'follow_up_required'),
        supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('spreadsheet_sync_jobs').select('*').eq('sync_status', 'failed').limit(10),
        supabase.from('spreadsheet_integrations').select('provider, configuration_status, last_success_at, last_error_at'),
      ])

      const localLeads = getLocalLeads()
      const remoteLeads = (leads ?? []) as Lead[]
      const allLeads = [...remoteLeads]

      // Merge serverless /api/leads
      try {
        const apiLeads = await fetchRemoteLeads()
        for (const al of apiLeads) {
          if (!allLeads.some(l => l.id === al.id || (l.verified_email && l.verified_email === al.verified_email))) {
            allLeads.push(al)
          }
        }
      } catch {}

      for (const loc of localLeads) {
        if (!allLeads.some(l => l.id === loc.id || (l.verified_email && l.verified_email === loc.verified_email))) {
          allLeads.push(loc)
        }
      }
      allLeads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      const finalTotal = Math.max(total ?? 0, allLeads.length)
      const finalNew = allLeads.filter(l => l.lead_status === 'new_inquiry').length
      const finalConsult = allLeads.filter(l => l.consultation_requested).length
      const finalFollowUp = allLeads.filter(l => l.lead_status === 'follow_up_required').length

      setStats({
        totalLeads:           finalTotal,
        newLeads:             finalNew,
        consultationRequests: finalConsult,
        followUpsRequired:    finalFollowUp,
      })
      setRecentLeads(allLeads.slice(0, 5))
      setFailedJobs((failed ?? []) as SpreadsheetSyncJob[])
      setIntegrations((integs ?? []) as unknown as { provider: string; configuration_status: string }[])
      setLoading(false)
    }

    load()

    const handleUpdate = () => { load() }
    window.addEventListener('shoora_leads_update', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    window.addEventListener('focus', handleUpdate)

    const interval = setInterval(load, 4000)

    return () => {
      window.removeEventListener('shoora_leads_update', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
      window.removeEventListener('focus', handleUpdate)
      clearInterval(interval)
    }
  }, [])

  const statCards = [
    { label: 'Total Leads',            value: stats.totalLeads,           icon: Users,         color: 'text-navy-600',    bg: 'bg-navy-50' },
    { label: 'New Inquiries',          value: stats.newLeads,             icon: TrendingUp,    color: 'text-blue-600',    bg: 'bg-blue-50' },
    { label: 'Consultation Requests',  value: stats.consultationRequests, icon: CheckCircle,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Follow-Ups Due',         value: stats.followUpsRequired,    icon: Clock,         color: 'text-amber-600',   bg: 'bg-amber-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-navy-900">Dashboard</h1>
        <p className="text-navy-500 text-sm mt-1">Welcome to the Shoora EB-5 admin center.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <div key={s.label} className="card">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className={`font-display text-3xl font-bold ${loading ? 'animate-pulse-soft text-navy-200' : 'text-navy-900'}`}>
              {loading ? '—' : s.value}
            </div>
            <div className="text-navy-500 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Leads */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-navy-900">Recent Leads</h2>
            <Link to="/admin/leads" className="text-xs text-gold-600 hover:text-gold-700 font-medium">
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 bg-navy-50 rounded-xl animate-pulse-soft" />
              ))}
            </div>
          ) : recentLeads.length === 0 ? (
            <p className="text-navy-400 text-sm text-center py-8">No leads yet.</p>
          ) : (
            <div className="space-y-2">
              {recentLeads.map(lead => (
                <Link
                  key={lead.id}
                  to={`/admin/leads/${lead.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-navy-50 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center flex-shrink-0 text-navy-700 font-semibold text-sm">
                    {(lead.full_name || lead.verified_email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-navy-900 font-medium text-sm truncate">{lead.full_name || lead.verified_email || 'Unknown'}</p>
                    <p className="text-navy-400 text-xs">{formatDateTime(lead.created_at)}</p>
                  </div>
                  <span className={statusVariant(lead.lead_status)}>
                    {statusLabel(lead.lead_status)}
                  </span>
                  <div className="text-navy-400 text-xs font-bold">{lead.engagement_score}</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Integration Status */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-navy-900">Integration Status</h2>
            <Link to="/admin/integrations" className="text-xs text-gold-600 hover:text-gold-700 font-medium">
              Manage →
            </Link>
          </div>
          <div className="space-y-3">
            {(['excel', 'google_sheets'] as const).map(provider => {
              const integ = integrations.find(i => i.provider === provider)
              return (
                <div key={provider} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-sm">
                    {provider === 'excel' ? '📊' : '📋'}
                  </div>
                  <div className="flex-1">
                    <p className="text-navy-900 text-sm font-medium">
                      {provider === 'excel' ? 'Microsoft Excel' : 'Google Sheets'}
                    </p>
                    <p className="text-navy-400 text-xs capitalize">
                      {integ?.configuration_status === 'configured' ? 'Connected' : integ ? 'Check required' : 'Not configured'}
                    </p>
                  </div>
                  {integ?.configuration_status === 'configured'
                    ? <div className="status-dot-green" />
                    : integ
                    ? <div className="status-dot-yellow" />
                    : <div className="status-dot-gray" />
                  }
                </div>
              )
            })}
          </div>

          {failedJobs.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <p className="text-red-700 text-sm font-medium">{failedJobs.length} failed sync jobs</p>
              </div>
              <Link to="/admin/integrations" className="text-red-600 text-xs font-medium hover:underline">
                Review and retry →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
