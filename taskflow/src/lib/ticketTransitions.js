import { Play, CheckCircle2, RotateCcw } from 'lucide-react'

// The statuses a developer may move a ticket to from its current status.
const NEXT = {
  Open: 'In Progress',
  Reopened: 'In Progress',
  'In Progress': 'Done',
  Done: 'Reopened',
}

const ACTION_META = {
  'In Progress': { labelKey: 'ticketDetail.startWorking', icon: Play },
  Done: { labelKey: 'ticketDetail.markAsDone', icon: CheckCircle2 },
  Reopened: { labelKey: 'ticketDetail.reopen', icon: RotateCcw },
}

/** The single next status for a ticket, or null when it is final (Cancelled). */
export function nextStatus(status) {
  return NEXT[status] ?? null
}

/** Developer action descriptor ({ labelKey, next, icon }) for a ticket status, or null. */
export function developerAction(status) {
  const next = nextStatus(status)
  return next ? { next, ...ACTION_META[next] } : null
}

// Kanban columns. "todo" groups Open + Reopened; Cancelled is a read-only archive column.
export const KANBAN_COLUMNS = [
  { id: 'todo', statuses: ['Open', 'Reopened'], titleStatus: 'Open', tone: 'blue' },
  { id: 'progress', statuses: ['In Progress'], titleStatus: 'In Progress', tone: 'amber' },
  { id: 'done', statuses: ['Done'], titleStatus: 'Done', tone: 'green' },
  { id: 'cancelled', statuses: ['Cancelled'], titleStatus: 'Cancelled', tone: 'gray' },
]

/**
 * The status a ticket would get if dropped on `columnId`, or null when that move is not allowed.
 * Only the single forward step from `nextStatus` is allowed, same as the detail page buttons.
 */
export function statusForColumn(ticket, columnId) {
  const next = nextStatus(ticket.status)
  if (!next) return null
  const column = KANBAN_COLUMNS.find((c) => c.id === columnId)
  if (!column || column.statuses.includes(ticket.status)) return null
  return column.statuses.includes(next) ? next : null
}
