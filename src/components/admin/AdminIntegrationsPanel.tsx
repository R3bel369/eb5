import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Settings, Wifi } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatDateTime, syncStatusVariant } from '../../lib/utils'
import type { SpreadsheetIntegration, SpreadsheetSyncJob } from '../../types/database'
import toast from 'react-hot-toast'

// ─── Integration card ─────────────────────────────────────────────────────────

interface IntegrationCardProps {
  provider: 'excel' | 'google_sheets'
  integration: SpreadsheetIntegration | null
  onTest: () => Promise<void>
  onRefresh: () => void
}

function IntegrationCard({ provider, integration, onTest, onRefresh }: IntegrationCardProps) {
  const [testing, setTesting] = useState(false)

  const name  = provider === 'excel' ? 'Microsoft Excel' : 'Google Sheets'
  const emoji = provider === 'excel' ? '📊' : '📋'
  const file  = provider === 'excel' ? 'Shoora_EB5_Leads.xlsx' : 'Shoora EB5 Leads'
  const sheet = 'Customer Leads'

  const handleTest = async () => {
    setTesting(true)
    try {
      await onTest()
      onRefresh()
    } catch {
      // handled inside onTest
    } finally {
      setTesting(false)
    }
  }

  const statusColor = {
    not_configured: 'text-gray-400',
    configured:     'text-emerald-600',
    error:          'text-red-600',
  }

  return (
    <div className="card space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
          {emoji}
        </div>
        <div className="flex-1">
          <h2 className="font-display font-semibold text-navy-900">{name}</h2>
          <p className="text-navy-400 text-xs">Target: {file} → {sheet}</p>
        </div>
        <div className="flex items-center gap-2">
          {integration?.configuration_status === 'configured' && (
            <div className="status-dot-green" />
          )}
          {integration?.configuration_status === 'error' && (
            <div className="status-dot-red" />
          )}
          {(!integration || integration.configuration_status === 'not_configured') && (
            <div className="status-dot-gray" />
          )}
          <span className={`text-xs font-medium ${statusColor[integration?.configuration_status ?? 'not_configured']}`}>
            {integration?.configuration_status === 'configured' ? 'Connected'
             : integration?.configuration_status === 'error' ? 'Error'
             : 'Not Configured'}
          </span>
        </div>
      </div>

      {/* Status detail */}
      {integration && (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-navy-400 text-xs">Last Success</p>
            <p className="text-navy-900 font-medium">{formatDateTime(integration.last_success_at)}</p>
          </div>
          <div>
            <p className="text-navy-400 text-xs">Last Error</p>
            <p className="text-red-600 font-medium">{formatDateTime(integration.last_error_at)}</p>
          </div>
          {integration.last_error_message && (
            <div className="col-span-2">
              <p className="text-navy-400 text-xs mb-0.5">Error Detail</p>
              <p className="text-red-600 text-xs bg-red-50 p-2 rounded-lg font-mono">
                {integration.last_error_message}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Config note */}
      {!integration || integration.configuration_status === 'not_configured' ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-700 text-sm font-medium">Integration Not Configured</p>
              <p className="text-amber-600 text-xs mt-1">
                {provider === 'excel'
                  ? 'Set MICROSOFT_TENANT_ID, MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_DRIVE_ID, and MICROSOFT_WORKBOOK_ITEM_ID in your server environment.'
                  : 'Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_SPREADSHEET_ID (or GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) in your server environment.'
                }
              </p>
              <p className="text-amber-600 text-xs mt-1">See SETUP_GUIDE.md for step-by-step instructions.</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          id={`test-${provider}-btn`}
          onClick={handleTest}
          disabled={testing}
          className="btn-secondary text-sm py-2 flex-1"
        >
          {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
          {testing ? 'Testing…' : 'Test Connection'}
        </button>
      </div>
    </div>
  )
}

// ─── Failed Jobs Table ────────────────────────────────────────────────────────

interface FailedJobsTableProps {
  jobs: SpreadsheetSyncJob[]
  onRetry: (jobId: string) => Promise<void>
  onRetryAll: () => Promise<void>
}

function FailedJobsTable({ jobs, onRetry, onRetryAll }: FailedJobsTableProps) {
  const [retrying, setRetrying] = useState<string | null>(null)
  const [retryingAll, setRetryingAll] = useState(false)

  const handleRetry = async (id: string) => {
    setRetrying(id)
    await onRetry(id)
    setRetrying(null)
  }

  const handleRetryAll = async () => {
    setRetryingAll(true)
    await onRetryAll()
    setRetryingAll(false)
  }

  if (jobs.length === 0) {
    return (
      <div className="card text-center py-10">
        <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
        <p className="text-navy-600 font-medium">All sync jobs are healthy</p>
        <p className="text-navy-400 text-sm mt-1">No failed synchronization jobs.</p>
      </div>
    )
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-navy-100">
        <div className="flex items-center gap-2">
          <XCircle className="w-5 h-5 text-red-500" />
          <h2 className="font-semibold text-navy-900">{jobs.length} Failed Sync Jobs</h2>
        </div>
        <button
          id="retry-all-jobs-btn"
          onClick={handleRetryAll}
          disabled={retryingAll}
          className="btn-secondary text-xs py-1.5 px-3"
        >
          {retryingAll ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Retry All
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {['Lead ID', 'Provider', 'Operation', 'Attempts', 'Last Error', 'Created', ''].map(h => (
                <th key={h} className="text-left text-xs font-semibold text-navy-500 px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs.map(job => (
              <tr key={job.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-navy-600">{job.lead_id.slice(0, 8)}…</td>
                <td className="px-4 py-3">
                  <span className="text-sm">{job.provider === 'excel' ? '📊 Excel' : '📋 Sheets'}</span>
                </td>
                <td className="px-4 py-3 capitalize text-navy-600">{job.operation_type}</td>
                <td className="px-4 py-3 text-navy-600">{job.attempt_count}</td>
                <td className="px-4 py-3 text-red-600 text-xs max-w-xs truncate">{job.last_error ?? '—'}</td>
                <td className="px-4 py-3 text-navy-400 text-xs whitespace-nowrap">{formatDateTime(job.created_at)}</td>
                <td className="px-4 py-3">
                  <button
                    id={`retry-job-${job.id}-btn`}
                    onClick={() => handleRetry(job.id)}
                    disabled={retrying === job.id}
                    className="btn-secondary text-xs py-1 px-2"
                  >
                    {retrying === job.id
                      ? <RefreshCw className="w-3 h-3 animate-spin" />
                      : 'Retry'
                    }
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function AdminIntegrationsPanel() {
  const [integrations, setIntegrations] = useState<SpreadsheetIntegration[]>([])
  const [failedJobs, setFailedJobs]     = useState<SpreadsheetSyncJob[]>([])
  const [loading, setLoading]           = useState(true)

  const load = useCallback(async () => {
    const [{ data: integs }, { data: jobs }] = await Promise.all([
      supabase.from('spreadsheet_integrations').select('*'),
      supabase.from('spreadsheet_sync_jobs').select('*').in('sync_status', ['failed', 'retry_scheduled']).order('created_at', { ascending: false }),
    ])
    setIntegrations((integs ?? []) as SpreadsheetIntegration[])
    setFailedJobs((jobs ?? []) as SpreadsheetSyncJob[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const testConnection = async (provider: 'excel' | 'google_sheets') => {
    try {
      const { data, error } = await supabase.functions.invoke('test-integration', {
        body: { provider },
      })
      if (error || !data?.success) {
        toast.error(`${provider === 'excel' ? 'Excel' : 'Google Sheets'} connection test failed: ${error?.message || data?.error || 'Unknown error'}`)
      } else {
        toast.success(`${provider === 'excel' ? 'Excel' : 'Google Sheets'} connection successful!`)
      }
    } catch (err) {
      toast.error('Connection test failed. Ensure the integration is configured.')
    }
  }

  const retryJob = async (jobId: string) => {
    const { error } = await supabase
      .from('spreadsheet_sync_jobs')
      .update({ sync_status: 'pending', next_attempt_at: new Date().toISOString() })
      .eq('id', jobId)
    if (!error) {
      toast.success('Sync job queued for retry.')
      setFailedJobs(js => js.filter(j => j.id !== jobId))
      supabase.functions.invoke('process-sync-jobs').catch(console.warn)
    } else {
      toast.error('Failed to queue retry.')
    }
  }

  const retryAll = async () => {
    const ids = failedJobs.map(j => j.id)
    const { error } = await supabase
      .from('spreadsheet_sync_jobs')
      .update({ sync_status: 'pending', next_attempt_at: new Date().toISOString() })
      .in('id', ids)
    if (!error) {
      toast.success(`${ids.length} jobs queued for retry.`)
      setFailedJobs([])
      supabase.functions.invoke('process-sync-jobs').catch(console.warn)
    } else {
      toast.error('Failed to queue retries.')
    }
  }

  if (loading) return <div className="py-10 text-center text-navy-400">Loading integrations…</div>

  const excel  = integrations.find(i => i.provider === 'excel') ?? null
  const sheets = integrations.find(i => i.provider === 'google_sheets') ?? null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Integrations</h1>
          <p className="text-navy-500 text-sm mt-1">Manage Microsoft Excel and Google Sheets synchronization.</p>
        </div>
        <button onClick={load} className="btn-ghost text-xs py-1.5 px-3">
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Integration cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <IntegrationCard
          provider="excel"
          integration={excel}
          onTest={() => testConnection('excel')}
          onRefresh={load}
        />
        <IntegrationCard
          provider="google_sheets"
          integration={sheets}
          onTest={() => testConnection('google_sheets')}
          onRefresh={load}
        />
      </div>

      {/* Architecture note */}
      <div className="card bg-navy-50 border-navy-200">
        <div className="flex gap-3">
          <Settings className="w-5 h-5 text-navy-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-navy-900 text-sm">Sync Architecture</h3>
            <p className="text-navy-500 text-xs mt-1 leading-relaxed">
              Each new or updated lead creates independent sync jobs for Excel and Google Sheets.
              Jobs are processed by a background worker with exponential backoff.
              Supabase remains the authoritative data source — spreadsheet edits do not overwrite database records.
              Retrying a failed job will never create duplicate rows (idempotent by Lead ID).
            </p>
          </div>
        </div>
      </div>

      {/* Failed jobs */}
      <div>
        <h2 className="font-display text-lg font-semibold text-navy-900 mb-4">Sync Queue</h2>
        <FailedJobsTable jobs={failedJobs} onRetry={retryJob} onRetryAll={retryAll} />
      </div>
    </div>
  )
}
