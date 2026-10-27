import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import en from '@/i18n/en'
import arDict from '@/i18n/ar'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/** Current language as stored by LanguageContext (defaults to English). */
function currentLang() {
  if (typeof window === 'undefined') return 'en'
  return window.localStorage.getItem('lang') === 'ar' ? 'ar' : 'en'
}

/** date-fns locale for the active language (English is the library default). */
function dateLocale() {
  return currentLang() === 'ar' ? { locale: ar } : undefined
}

/**
 * Format a date as: "Jun 25, 2026 · 3:42 PM" (localized).
 */
export function formatDate(value) {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return format(date, "MMM d, yyyy '·' h:mm a", dateLocale())
}

/**
 * Relative time, e.g. "3 hours ago" (localized).
 */
export function timeAgo(value) {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return formatDistanceToNow(date, { addSuffix: true, ...dateLocale() })
}

/**
 * Compact elapsed time between two instants, e.g. "2h 15m", "3d 4h", "45m".
 * Returns "—" when either bound is missing/invalid. Unit labels and digits are
 * localized to the active language.
 */
export function formatDurationShort(start, end) {
  if (!start || !end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (!Number.isFinite(ms) || ms < 0) return '—'

  const lang = currentLang()
  const dict = lang === 'ar' ? arDict : en
  const num = (n) => new Intl.NumberFormat(lang === 'ar' ? 'ar' : 'en').format(n)

  const totalMin = Math.floor(ms / 60000)
  if (totalMin < 1) return dict.duration.lessThanMinute

  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60

  const parts = []
  if (d) parts.push(`${num(d)}${dict.duration.d}`)
  if (h) parts.push(`${num(h)}${dict.duration.h}`)
  // Show minutes only when under a day, to keep the label to two units.
  if (m && !d) parts.push(`${num(m)}${dict.duration.m}`)
  return parts.join(' ') || `${num(0)}${dict.duration.m}`
}

/**
 * Initials from a name, e.g. "Jane Doe" -> "JD"
 */
export function getInitials(name) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Turn a raw Supabase/network error into a friendly, localized message.
 * Known Supabase messages are translated via the active dictionary; the
 * caller-supplied `fallback` should already be translated.
 */
export function friendlyError(error, fallback) {
  const dict = currentLang() === 'ar' ? arDict : en
  const resolvedFallback = fallback ?? dict.errors.fallback
  if (!error) return resolvedFallback
  const message = typeof error === 'string' ? error : error.message
  if (!message) return resolvedFallback

  return dict.errors[message] || message
}

const CLOSED = ['Done', 'Cancelled']

/** Local YYYY-MM-DD for "today" (matches a Postgres `date` column). */
export function todayISO() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** A ticket is overdue when its due date has passed and it is still open. */
export function isOverdue(ticket) {
  return !!ticket?.due_date && !CLOSED.includes(ticket.status) && ticket.due_date < todayISO()
}

/** Format a `date` column value (YYYY-MM-DD) without timezone shifts. */
export function formatDay(value) {
  if (!value) return '—'
  const [y, m, d] = String(value).split('-').map(Number)
  if (!y || !m || !d) return '—'
  return format(new Date(y, m - 1, d), 'MMM d, yyyy', dateLocale())
}

/** Priority sort rank — higher is more urgent. */
export const PRIORITY_RANK = { Critical: 4, High: 3, Medium: 2, Low: 1 }
