import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format a date to a human-readable string */
export function formatDate(date: string | Date | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(date))
}

/** Format a datetime string with time */
export function formatDateTime(date: string | Date | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date))
}

/** Normalize phone number to E.164 */
export function normalizePhone(countryCode: string, number: string): string {
  const digits = number.replace(/\D/g, '')
  return `${countryCode}${digits}`
}

/** Validate email address */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/** Validate phone number length */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

/** Truncate text */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '…'
}

/** Lead score color class */
export function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600'
  if (score >= 40) return 'text-amber-600'
  return 'text-navy-400'
}

/** Lead status badge variant */
export function statusVariant(status: string): string {
  const map: Record<string, string> = {
    'new_inquiry':            'badge-navy',
    'interested':             'badge-gold',
    'consultation_requested': 'badge-green',
    'follow_up_required':     'badge-yellow',
    'qualified_by_advisor':   'badge-green',
    'contacted':              'badge-gray',
    'closed':                 'badge-gray',
  }
  return map[status] ?? 'badge-gray'
}

/** Human-readable lead status */
export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    'new_inquiry':            'New Inquiry',
    'interested':             'Interested',
    'consultation_requested': 'Consultation Requested',
    'follow_up_required':     'Follow-Up Required',
    'qualified_by_advisor':   'Qualified by Advisor',
    'contacted':              'Contacted',
    'closed':                 'Closed',
  }
  return map[status] ?? status
}

/** Sync status badge variant */
export function syncStatusVariant(status: string): string {
  const map: Record<string, string> = {
    'synced':           'badge-green',
    'pending':          'badge-yellow',
    'processing':       'badge-yellow',
    'retry_scheduled':  'badge-yellow',
    'failed':           'badge-red',
    'disabled':         'badge-gray',
  }
  return map[status] ?? 'badge-gray'
}

/** Delay utility */
export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))
