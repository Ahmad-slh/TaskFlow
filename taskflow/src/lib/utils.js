import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date as: "Jun 25, 2026 · 3:42 PM"
 */
export function formatDate(value) {
  if (!value) return '—'
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return format(date, "MMM d, yyyy '·' h:mm a")
}

/**
 * Relative time, e.g. "3 hours ago"
 */
export function timeAgo(value) {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return ''
  return formatDistanceToNow(date, { addSuffix: true })
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
 * Turn a raw Supabase/network error into a friendly message.
 */
export function friendlyError(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback
  const message = typeof error === 'string' ? error : error.message
  if (!message) return fallback

  const map = {
    'Invalid login credentials': 'Incorrect email or password.',
    'Email not confirmed': 'Please confirm your email before signing in.',
    'Failed to fetch': 'Network error. Check your connection and try again.',
  }
  return map[message] || message
}
