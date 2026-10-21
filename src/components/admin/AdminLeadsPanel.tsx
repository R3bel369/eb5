import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Search, Download, RefreshCw, ChevronDown, Edit3, X,
  FileSpreadsheet, FileText, CheckCircle, Clock, Eye, Printer, Calendar
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import {
  formatDateTime, statusLabel, statusVariant, scoreColor, syncStatusVariant
} from '../../lib/utils'
import { getLocalLeads, updateLocalLead, fetchRemoteLeads, syncLeadToServer } from '../../lib/leadStorage'
import type { Lead, LeadStatus, SpreadsheetSyncJob } from '../../types/database'
import toast from 'react-hot-toast'
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom'

const LEAD_STATUSES: LeadStatus[] = [
  'new_inquiry', 'interested', 'consultation_requested',
  'follow_up_required', 'qualified_by_advisor', 'contacted', 'closed',
]

// ─── Lead List Panel ──────────────────────────────────────────────────────────

function LeadList() {
  const [leads, setLeads]           = useState<Lead[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [statusFilter, setFilter]   = useState('')
  const [page, setPage]             = useState(0)
  const [exportOpen, setExportOpen] = useState(false)
  const exportRef                   = useRef<HTMLDivElement>(null)
  const PER_PAGE = 20

  const loadLeads = useCallback(async () => {
    let combinedLeads: Lead[] = []

    // 1. Fetch from Supabase (if available)
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && Array.isArray(data)) {
        combinedLeads = [...data] as Lead[]
      }
    } catch (err) {
      console.warn('Supabase leads load note:', err)
    }

    // 2. Fetch from Serverless /api/leads
    try {
      const remoteLeads = await fetchRemoteLeads()
      for (const remote of remoteLeads) {
        if (!combinedLeads.some(l => l.id === remote.id)) {
          combinedLeads.push(remote)
        }
      }
    } catch {}

    // 3. Merge with local storage leads & auto-sync to Firestore so all domains match
    const localLeads = getLocalLeads()
    for (const local of localLeads) {
      if (!combinedLeads.some(l => l.id === local.id)) {
        combinedLeads.push(local)
        // Auto-sync missing lead to shared Cloud Firestore
        syncLeadToServer(local).catch(() => {})
      }
    }

    // 4. Filter by search
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      combinedLeads = combinedLeads.filter(l =>
        (l.full_name && l.full_name.toLowerCase().includes(q)) ||
        (l.verified_email && l.verified_email.toLowerCase().includes(q)) ||
        (l.country_of_residence && l.country_of_residence.toLowerCase().includes(q)) ||
        (l.verified_phone && l.verified_phone.includes(q))
      )
    }

    // 5. Filter by status
    if (statusFilter) {
      combinedLeads = combinedLeads.filter(l => l.lead_status === statusFilter)
    }

    // Sort by created_at descending
    combinedLeads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setLeads(combinedLeads)
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => {
    loadLeads()

    const handleUpdate = () => {
      loadLeads()
    }

    window.addEventListener('shoora_leads_update', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    window.addEventListener('focus', handleUpdate)

    // Polling interval to auto-fetch leads every 4 seconds
    const interval = setInterval(loadLeads, 4000)

    return () => {
      window.removeEventListener('shoora_leads_update', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
      window.removeEventListener('focus', handleUpdate)
      clearInterval(interval)
    }
  }, [loadLeads])

  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── 1. Export CSV ───────────────────────────────────────────────────────────
  const exportCsv = () => {
    setExportOpen(false)
    if (leads.length === 0) {
      toast.error('No leads available to export.')
      return
    }

    const headers = [
      'Lead ID', 'Created At', 'Full Name', 'Email', 'Phone', 'Country',
      'Status', 'Readiness Score', 'Consultation Requested', 'Investment Timeframe',
      'Investment Capacity', 'Source of Funds', 'Current Visa', 'Assigned Advisor', 'Admin Notes'
    ]

    const escapeCsv = (val: any) => {
      const str = String(val ?? '')
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const rows = leads.map(l => [
      escapeCsv(l.id),
      escapeCsv(formatDateTime(l.created_at)),
      escapeCsv(l.full_name ?? 'N/A'),
      escapeCsv(l.verified_email ?? 'N/A'),
      escapeCsv(l.verified_phone ?? 'N/A'),
      escapeCsv(l.country_of_residence ?? 'N/A'),
      escapeCsv(statusLabel(l.lead_status)),
      escapeCsv(l.engagement_score ?? 60),
      escapeCsv(l.consultation_requested ? 'Yes' : 'No'),
      escapeCsv(l.investment_timeframe ?? 'N/A'),
      escapeCsv(l.investment_capacity ?? 'N/A'),
      escapeCsv(l.source_of_funds ?? 'N/A'),
      escapeCsv(l.current_visa_status ?? 'N/A'),
      escapeCsv(l.assigned_advisor ?? 'Unassigned'),
      escapeCsv(l.admin_notes ?? ''),
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `shoora-eb5-leads-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Leads exported to CSV successfully!')
  }

  // ── 2. Export Excel (.xls) ──────────────────────────────────────────────────
  const exportExcel = () => {
    setExportOpen(false)
    if (leads.length === 0) {
      toast.error('No leads available to export.')
      return
    }

    const rowsHtml = leads.map((l, index) => `
      <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: sans-serif; font-size: 12px;">${l.id}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: sans-serif; font-size: 12px;">${formatDateTime(l.created_at)}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: sans-serif; font-size: 12px; font-weight: bold; color: #081530;">${l.full_name ?? ''}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: sans-serif; font-size: 12px;">${l.verified_email ?? ''}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: sans-serif; font-size: 12px;">${l.verified_phone ?? ''}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: sans-serif; font-size: 12px;">${l.country_of_residence ?? ''}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: sans-serif; font-size: 12px; color: #1e4589;">${statusLabel(l.lead_status)}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: sans-serif; font-size: 12px; text-align: center;">${l.engagement_score ?? 60}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: sans-serif; font-size: 12px; text-align: center;">${l.consultation_requested ? 'Yes' : 'No'}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: sans-serif; font-size: 12px;">${l.investment_timeframe ?? ''}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: sans-serif; font-size: 12px;">${l.investment_capacity ?? ''}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: sans-serif; font-size: 12px;">${l.source_of_funds ?? ''}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: sans-serif; font-size: 12px;">${l.assigned_advisor ?? 'Unassigned'}</td>
        <td style="padding: 8px; border: 1px solid #e2e8f0; font-family: sans-serif; font-size: 12px;">${l.admin_notes ?? ''}</td>
      </tr>
    `).join('')

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Shoora EB-5 Leads</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
      </head>
      <body>
        <table style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th colspan="14" style="background-color: #081530; color: #ffffff; padding: 14px; font-size: 16px; font-family: sans-serif; font-weight: bold; text-align: left;">
                Shoora EB-5 — Investor Leads Directory (Exported on ${new Date().toLocaleDateString()})
              </th>
            </tr>
            <tr style="background-color: #d49a16; color: #ffffff; font-family: sans-serif; font-size: 12px;">
              <th style="padding: 10px; border: 1px solid #b97b10;">Lead ID</th>
              <th style="padding: 10px; border: 1px solid #b97b10;">Created At</th>
              <th style="padding: 10px; border: 1px solid #b97b10;">Full Name</th>
              <th style="padding: 10px; border: 1px solid #b97b10;">Email</th>
              <th style="padding: 10px; border: 1px solid #b97b10;">Phone</th>
              <th style="padding: 10px; border: 1px solid #b97b10;">Country</th>
              <th style="padding: 10px; border: 1px solid #b97b10;">Status</th>
              <th style="padding: 10px; border: 1px solid #b97b10;">Score</th>
              <th style="padding: 10px; border: 1px solid #b97b10;">Consultation</th>
              <th style="padding: 10px; border: 1px solid #b97b10;">Timeframe</th>
              <th style="padding: 10px; border: 1px solid #b97b10;">Capacity</th>
              <th style="padding: 10px; border: 1px solid #b97b10;">Source of Funds</th>
              <th style="padding: 10px; border: 1px solid #b97b10;">Advisor</th>
              <th style="padding: 10px; border: 1px solid #b97b10;">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `shoora-eb5-leads-${new Date().toISOString().slice(0, 10)}.xls`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Leads exported to Excel successfully!')
  }

  // ── 3. Export PDF ───────────────────────────────────────────────────────────
  const exportPdf = () => {
    setExportOpen(false)
    if (leads.length === 0) {
      toast.error('No leads available to export.')
      return
    }

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow popups to generate the printable PDF report.')
      return
    }

    const tableRows = leads.map((l, i) => `
      <tr style="background-color: ${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 600; color: #081530;">${l.full_name || 'Anonymous'}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${l.verified_email || '—'}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${l.verified_phone || '—'}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${l.country_of_residence || '—'}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; text-align: center; font-weight: bold; color: #d49a16;">${l.engagement_score ?? 60}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${l.investment_timeframe || '—'}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px;">${l.assigned_advisor || 'Unassigned'}</td>
      </tr>
    `).join('')

    const pdfHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Shoora EB-5 — Leads Directory Report</title>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none; }
          }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; color: #1e293b; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #081530; padding-bottom: 15px; margin-bottom: 20px; }
          .brand { font-size: 24px; font-weight: bold; color: #081530; }
          .brand span { color: #d49a16; }
          .meta { font-size: 12px; color: #64748b; text-align: right; }
          .stats-bar { display: flex; gap: 20px; background-color: #f1f5f9; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px; }
          .stat { font-size: 12px; font-weight: 500; }
          .stat strong { color: #081530; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #081530; color: #ffffff; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
          .print-btn { background-color: #081530; color: white; padding: 10px 18px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
          .print-btn:hover { background-color: #1e4589; }
          .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 10px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="no-print" style="margin-bottom: 16px;">
          <button class="print-btn" onclick="window.print()">🖨️ Print or Save as PDF</button>
          <span style="font-size: 12px; color: #64748b; margin-left: 10px;">Select "Save as PDF" destination in your browser print dialogue.</span>
        </div>

        <div class="header">
          <div class="brand">Shoora <span>EB-5</span></div>
          <div class="meta">
            <div><strong>Investor Leads Executive Directory</strong></div>
            <div>Generated: ${new Date().toLocaleString()}</div>
            <div>Total Leads: ${leads.length}</div>
          </div>
        </div>

        <div class="stats-bar">
          <div class="stat">Total Leads: <strong>${leads.length}</strong></div>
          <div class="stat">Consultations: <strong>${leads.filter(l => l.consultation_requested).length}</strong></div>
          <div class="stat">High Score (80+): <strong>${leads.filter(l => (l.engagement_score ?? 0) >= 80).length}</strong></div>
          <div class="stat">New Inquiries: <strong>${leads.filter(l => l.lead_status === 'new_inquiry').length}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Investor Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Country</th>
              <th>Score</th>
              <th>Timeframe</th>
              <th>Advisor</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <div class="footer">
          Shoora EB-5 AI CRM Platform • Confidential & Proprietary Document
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(pdfHtml)
    printWindow.document.close()
    toast.success('Printable PDF report generated!')
  }

  const paginatedLeads = leads.slice(page * PER_PAGE, (page + 1) * PER_PAGE)
  const totalPages = Math.ceil(leads.length / PER_PAGE)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Investor Leads</h1>
          <p className="text-xs text-navy-500 mt-0.5">
            {leads.length} total lead{leads.length === 1 ? '' : 's'} captured across AI chatbot & direct inquiries
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={loadLeads} className="btn-ghost text-xs py-2 px-3 border border-gray-200">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          {/* Export Dropdown */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setExportOpen(o => !o)}
              className="btn-primary text-xs py-2 px-3.5 shadow-sm"
              aria-expanded={exportOpen}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Leads</span>
              <ChevronDown className="w-3.5 h-3.5 ml-1" />
            </button>

            {exportOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl shadow-card-hover border border-navy-100 py-1.5 z-50 animate-slide-up text-left">
                <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-semibold text-navy-400 uppercase tracking-wider">
                  Choose Download Format
                </div>
                <button
                  onClick={exportCsv}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-navy-700 hover:bg-navy-50 transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-medium">Download CSV (.csv)</div>
                    <div className="text-[10px] text-navy-400">Standard spreadsheet data</div>
                  </div>
                </button>
                <button
                  onClick={exportExcel}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-navy-700 hover:bg-navy-50 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-medium">Download Excel (.xls)</div>
                    <div className="text-[10px] text-navy-400">Formatted workbook styling</div>
                  </div>
                </button>
                <button
                  onClick={exportPdf}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-navy-700 hover:bg-navy-50 transition-colors"
                >
                  <Printer className="w-4 h-4 text-red-600" />
                  <div>
                    <div className="font-medium">Download PDF Report (.pdf)</div>
                    <div className="text-[10px] text-navy-400">Printable executive document</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card py-3.5 px-4 flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            id="lead-search"
            type="search"
            placeholder="Search by investor name, email, country, phone…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            className="input-field pl-9 text-xs py-2 w-full"
          />
        </div>
      </div>

      {/* Lead Table */}
      <div className="card p-0 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-left">
              <tr>
                <th className="py-3 px-4 font-semibold text-navy-700 text-xs">Investor</th>
                <th className="py-3 px-4 font-semibold text-navy-700 text-xs">Contact Details</th>
                <th className="py-3 px-4 font-semibold text-navy-700 text-xs">Country</th>
                <th className="py-3 px-4 font-semibold text-navy-700 text-xs text-center">Score</th>
                <th className="py-3 px-4 font-semibold text-navy-700 text-xs">Advisor</th>
                <th className="py-3 px-4 font-semibold text-navy-700 text-xs">Created</th>
                <th className="py-3 px-4 font-semibold text-navy-700 text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-navy-400">
                    Loading leads…
                  </td>
                </tr>
              ) : paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-navy-400">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-navy-900 text-gold-400 font-bold flex items-center justify-center text-sm ring-2 ring-gold-400/50 flex-shrink-0 shadow-xs">
                          {(lead.full_name || 'A')[0].toUpperCase()}
                        </div>
                        <div>
                          <Link to={`/admin/leads/${lead.id}`} className="font-semibold text-navy-900 hover:text-gold-600 block">
                            {lead.full_name || 'Anonymous Prospect'}
                          </Link>
                          {lead.consultation_requested && (
                            <div className="mt-0.5 space-y-0.5">
                              <span className="inline-block text-[10px] bg-gold-100 text-gold-900 border border-gold-300 px-1.5 py-0.2 rounded font-medium">
                                📅 {lead.consultation_date ? `Consultation: ${lead.consultation_date}` : 'Consultation Requested'}
                              </span>
                              {lead.consultation_mode && (
                                <span className="block text-[9px] text-navy-500 capitalize">
                                  Mode: {lead.consultation_mode} {lead.booking_id ? `(${lead.booking_id})` : ''}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <div className="text-navy-800 truncate max-w-[180px]">{lead.verified_email || '—'}</div>
                      <div className="text-navy-400">{lead.verified_phone || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-navy-600">
                      {lead.country_of_residence || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${scoreColor(lead.engagement_score ?? 60)}`}>
                        {lead.engagement_score ?? 60}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-navy-600">
                      {lead.assigned_advisor ? (
                        <span className="font-medium text-navy-800">{lead.assigned_advisor}</span>
                      ) : (
                        <span className="text-navy-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-navy-500 whitespace-nowrap">
                      {formatDateTime(lead.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/leads/${lead.id}`}
                        className="inline-flex items-center gap-1 text-xs text-gold-600 hover:text-gold-700 font-semibold px-2 py-1 rounded hover:bg-gold-50"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-navy-500">
            <div>
              Showing {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, leads.length)} of {leads.length} leads
            </div>
            <div className="flex gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
                className="px-2.5 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="px-2.5 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Lead Detail Component ───────────────────────────────────────────────────

function LeadDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [lead, setLead]         = useState<Lead | null>(null)
  const [syncJobs, setSyncJobs] = useState<SpreadsheetSyncJob[]>([])
  const [editing, setEditing]   = useState(false)
  const [notes, setNotes]       = useState('')
  const [status, setStatus]     = useState<LeadStatus>('new_inquiry')
  const [advisor, setAdvisor]   = useState('')
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    if (!id) return

    // 1. Check Supabase
    supabase.from('leads').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setLead(data as Lead)
        setNotes(data.admin_notes ?? '')
        setStatus(data.lead_status as LeadStatus)
        setAdvisor(data.assigned_advisor ?? '')
      } else {
        // Fallback to local storage
        const local = getLocalLeads().find(l => l.id === id)
        if (local) {
          setLead(local)
          setNotes(local.admin_notes ?? '')
          setStatus(local.lead_status as LeadStatus)
          setAdvisor(local.assigned_advisor ?? '')
        }
      }
    })

    // Fetch sync jobs
    supabase.from('spreadsheet_sync_jobs').select('*').eq('lead_id', id).then(({ data }) => {
      setSyncJobs((data ?? []) as SpreadsheetSyncJob[])
    })
  }, [id])

  const handleSave = async () => {
    if (!lead) return
    setSaving(true)

    // Save locally
    updateLocalLead(lead.id, {
      admin_notes: notes,
      lead_status: status,
      assigned_advisor: advisor || null,
    })

    // Save in Supabase
    try {
      await supabase
        .from('leads')
        .update({
          admin_notes: notes,
          lead_status: status,
          assigned_advisor: advisor || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.id)
    } catch (_) {}

    setSaving(false)
    toast.success('Lead details updated successfully!')
    setEditing(false)
    setLead(l => l ? { ...l, admin_notes: notes, lead_status: status, assigned_advisor: advisor || null } : l)
  }

  const handleRetrySync = async (jobId: string) => {
    const { error } = await supabase
      .from('spreadsheet_sync_jobs')
      .update({ sync_status: 'pending', next_attempt_at: new Date().toISOString() })
      .eq('id', jobId)
    if (!error) {
      toast.success('Sync job queued for retry.')
      setSyncJobs(js => js.map(j => j.id === jobId ? { ...j, sync_status: 'pending' } : j))
      supabase.functions.invoke('process-sync-jobs').catch(console.warn)
    }
  }

  if (!lead) return <div className="py-10 text-center text-navy-400">Loading lead details…</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/leads')} className="btn-ghost text-xs py-1 px-2.5">
          ← Back to Leads
        </button>
        <div className="flex-1" />
        <button onClick={() => setEditing(e => !e)} className="btn-secondary text-xs py-1.5 px-3">
          <Edit3 className="w-3.5 h-3.5" />
          {editing ? 'Cancel Editing' : 'Edit Lead Details'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-display text-xl font-bold text-navy-900">{lead.full_name || 'Anonymous Prospect'}</h2>
                <p className="text-xs text-navy-400">Lead ID: {lead.id}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusVariant(lead.lead_status)}`}>
                {statusLabel(lead.lead_status)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-3 border-y border-gray-100 text-xs">
              <div>
                <span className="text-navy-400 block mb-0.5">Verified Email</span>
                <span className="font-semibold text-navy-800">{lead.verified_email || '—'}</span>
              </div>
              <div>
                <span className="text-navy-400 block mb-0.5">Verified Phone</span>
                <span className="font-semibold text-navy-800">{lead.verified_phone || '—'}</span>
              </div>
              <div>
                <span className="text-navy-400 block mb-0.5">Country</span>
                <span className="font-semibold text-navy-800">{lead.country_of_residence || '—'}</span>
              </div>
              <div>
                <span className="text-navy-400 block mb-0.5">Investment Timeframe</span>
                <span className="font-semibold text-navy-800">{lead.investment_timeframe || '—'}</span>
              </div>
              <div>
                <span className="text-navy-400 block mb-0.5">Capital Capacity</span>
                <span className="font-semibold text-navy-800">{lead.investment_capacity || '—'}</span>
              </div>
              <div>
                <span className="text-navy-400 block mb-0.5">Visa Status</span>
                <span className="font-semibold text-navy-800">{lead.current_visa_status || '—'}</span>
              </div>
            </div>

            {lead.source_of_funds && (
              <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                <span className="font-semibold text-navy-800 block mb-1">Source of Funds Information:</span>
                <p className="text-navy-600">{lead.source_of_funds}</p>
              </div>
            )}

            {(lead.consultation_requested || lead.consultation_date) && (
              <div className="mt-4 p-4 rounded-xl bg-gold-50/70 border border-gold-300 text-xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gold-950 flex items-center gap-1.5 text-xs">
                    <Calendar className="w-4 h-4 text-gold-600" />
                    Consultation Booking Reservation
                  </span>
                  {lead.booking_id && (
                    <span className="font-mono bg-gold-200/80 text-gold-900 font-bold px-2 py-0.5 rounded text-[10px]">
                      {lead.booking_id}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-navy-800 border-t border-gold-200/60">
                  <div>
                    <span className="text-navy-500 block text-[10px]">Preferred Date</span>
                    <span className="font-bold">{lead.consultation_date || 'Requested'}</span>
                  </div>
                  <div>
                    <span className="text-navy-500 block text-[10px]">Time Window</span>
                    <span className="font-bold">{lead.consultation_time || 'Anytime'}</span>
                  </div>
                  <div>
                    <span className="text-navy-500 block text-[10px]">Meeting Mode</span>
                    <span className="font-bold capitalize">{lead.consultation_mode || 'Video Call'}</span>
                  </div>
                </div>
                {lead.consultation_topic && (
                  <div className="pt-1 border-t border-gold-200/60">
                    <span className="text-navy-500 block text-[10px]">Consultation Topic / Focus</span>
                    <span className="font-semibold text-navy-900">{lead.consultation_topic}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Edit Form */}
          {editing && (
            <div className="card space-y-4 border-2 border-gold-300">
              <h3 className="font-display font-semibold text-navy-900 text-sm">Update Lead Assignment & Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">Lead Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as LeadStatus)}
                    className="input-field text-xs"
                  >
                    {LEAD_STATUSES.map(s => (
                      <option key={s} value={s}>{statusLabel(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-navy-700 block mb-1">Assigned EB-5 Advisor</label>
                  <input
                    type="text"
                    value={advisor}
                    onChange={e => setAdvisor(e.target.value)}
                    placeholder="e.g., Marcus Thorne"
                    className="input-field text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-navy-700 block mb-1">Admin Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Record advisor notes, follow-up schedule, or case details…"
                  className="input-field text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditing(false)} className="btn-ghost text-xs py-1.5 px-3">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary text-xs py-1.5 px-4">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Status */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-display font-semibold text-navy-900 text-sm mb-3">Engagement & Scoring</h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-navy-500">Readiness Score</span>
                <span className={`px-2 py-0.5 rounded font-bold ${scoreColor(lead.engagement_score ?? 60)}`}>
                  {lead.engagement_score ?? 60} / 100
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-navy-500">Consultation Requested</span>
                <span className="font-semibold text-navy-900">{lead.consultation_requested ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-navy-500">Preferred Method</span>
                <span className="font-semibold text-navy-900 capitalize">{lead.preferred_contact_method || 'Email'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-navy-500">Captured Via</span>
                <span className="font-semibold text-navy-900 capitalize">{lead.lead_source || 'AI Chatbot'}</span>
              </div>
            </div>
          </div>

          {/* Sync Jobs Status */}
          <div className="card">
            <h3 className="font-display font-semibold text-navy-900 text-sm mb-3">Spreadsheet Integrations</h3>
            {syncJobs.length === 0 ? (
              <p className="text-xs text-navy-400">No active spreadsheet sync jobs recorded for this lead.</p>
            ) : (
              <div className="space-y-2">
                {syncJobs.map(job => (
                  <div key={job.id} className="p-2.5 rounded-lg bg-gray-50 text-xs border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-navy-800 capitalize">{job.provider.replace('_', ' ')}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${syncStatusVariant(job.sync_status)}`}>
                        {job.sync_status}
                      </span>
                    </div>
                    {job.sync_status === 'failed' && (
                      <button
                        onClick={() => handleRetrySync(job.id)}
                        className="text-[11px] text-red-600 hover:underline font-medium mt-1 block"
                      >
                        Retry Sync →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Leads Panel Routing ─────────────────────────────────────────────────

export function AdminLeadsPanel() {
  return (
    <Routes>
      <Route index element={<LeadList />} />
      <Route path=":id" element={<LeadDetail />} />
    </Routes>
  )
}
