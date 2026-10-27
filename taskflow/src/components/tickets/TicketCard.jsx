import { useNavigate } from 'react-router-dom'
import { CalendarClock, Clock, User } from 'lucide-react'
import { StatusBadge } from '@/components/tickets/StatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { TypeBadge } from '@/components/tickets/TypeBadge'
import { useTranslation } from '@/context/LanguageContext'
import { cn, formatDay, isOverdue } from '@/lib/utils'

/**
 * Compact ticket card used for the mobile list and the Kanban board.
 *
 * @param personName   the "other" person (assignee / creator) shown in the footer
 * @param showStatus   show the status badge (hidden inside Kanban columns)
 * @param actions      optional node rendered top-end (e.g. a "move to" menu)
 * @param dragProps    optional props spread on the root (draggable, onDragStart, ...)
 */
export function TicketCard({ ticket, personName, showStatus = true, actions, dragProps, className }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const overdue = isOverdue(ticket)
  const open = () => navigate(`/tickets/${ticket.id}`)

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter') open()
      }}
      className={cn(
        'group cursor-pointer space-y-3 rounded-xl border bg-card p-4 shadow-soft transition-all duration-150 hover:border-primary/40 hover:shadow-md',
        overdue && 'border-s-4 border-s-destructive',
        className
      )}
      {...dragProps}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground">{ticket.ticket_number}</span>
        <div className="flex items-center gap-1.5">
          <PriorityBadge priority={ticket.priority} />
          {actions}
        </div>
      </div>

      <p className="line-clamp-2 font-semibold leading-snug">{ticket.title}</p>

      {ticket.customer?.name && (
        <p className="truncate text-sm text-muted-foreground">{ticket.customer.name}</p>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <TypeBadge type={ticket.type} />
        {showStatus && <StatusBadge status={ticket.status} />}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {ticket.due_date ? (
          <span
            className={cn(
              'inline-flex items-center gap-1',
              overdue && 'font-semibold text-destructive'
            )}
          >
            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDay(ticket.due_date)}
            {overdue && ` · ${t('table.overdue')}`}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />—
          </span>
        )}
        {personName && (
          <span className="inline-flex min-w-0 items-center gap-1">
            <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{personName}</span>
          </span>
        )}
      </div>
    </div>
  )
}
