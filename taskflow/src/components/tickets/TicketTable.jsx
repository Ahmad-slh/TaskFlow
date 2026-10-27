import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, XCircle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/tickets/StatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { TypeBadge } from '@/components/tickets/TypeBadge'
import { TicketCard } from '@/components/tickets/TicketCard'
import {
  PRIORITY_RANK,
  cn,
  formatDate,
  formatDay,
  formatDurationShort,
  isOverdue,
} from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'
import { useNow } from '@/hooks/useNow'

const SORTERS = {
  ticket_number: (a, b) =>
    String(a.ticket_number ?? '').localeCompare(String(b.ticket_number ?? ''), undefined, {
      numeric: true,
    }),
  priority: (a, b) => (PRIORITY_RANK[a.priority] ?? 0) - (PRIORITY_RANK[b.priority] ?? 0),
  status: (a, b) => String(a.status ?? '').localeCompare(String(b.status ?? '')),
  // Tickets without a due date always sort last, regardless of direction.
  due_date: (a, b) => String(a.due_date).localeCompare(String(b.due_date)),
  created_at: (a, b) => new Date(a.created_at) - new Date(b.created_at),
}

function SortHead({ sortKey, sort, onSort, children }) {
  const active = sort.key === sortKey
  const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <TableHead>
      <button
        type="button"
        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
        onClick={() => onSort(sortKey)}
      >
        {children}
        <Icon className={cn('h-3.5 w-3.5', !active && 'opacity-40')} />
      </button>
    </TableHead>
  )
}

/**
 * Reusable tickets table.
 *
 * @param tickets         array of ticket rows
 * @param loading         show skeleton rows
 * @param personColumn    { header, getName } — the "Assigned To" / "Created By" column
 * @param showCustomer    show the customer column (default true)
 * @param onCancel        optional (ticket) => void; renders Cancel for Open tickets
 * @param cancellingId    id of the ticket currently being cancelled (disables its button)
 * @param emptyState      node rendered when there are no tickets
 */
export function TicketTable({
  tickets = [],
  loading = false,
  personColumn,
  showCustomer = true,
  onCancel,
  cancellingId,
  emptyState,
}) {
  const { t } = useTranslation()
  const now = useNow()
  const navigate = useNavigate()
  const [sort, setSort] = useState({ key: null, dir: 'asc' })

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }
    )
  }

  const rows = useMemo(() => {
    if (!sort.key) return tickets
    const compare = SORTERS[sort.key]
    const factor = sort.dir === 'asc' ? 1 : -1
    return [...tickets].sort((a, b) => {
      if (sort.key === 'due_date') {
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
      }
      return compare(a, b) * factor
    })
  }, [tickets, sort])

  const columnCount = 9 + (personColumn ? 1 : 0) + (showCustomer ? 1 : 0)

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border bg-card shadow-soft">
        <Table>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: columnCount }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (!tickets.length) {
    return emptyState || null
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {rows.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} personName={personColumn?.getName(ticket)} />
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border bg-card shadow-soft md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <SortHead sortKey="ticket_number" sort={sort} onSort={toggleSort}>
              {t('table.number')}
            </SortHead>
            <TableHead>{t('table.title')}</TableHead>
            {showCustomer && <TableHead>{t('table.customer')}</TableHead>}
            <TableHead>{t('table.type')}</TableHead>
            <SortHead sortKey="priority" sort={sort} onSort={toggleSort}>
              {t('table.priority')}
            </SortHead>
            <SortHead sortKey="status" sort={sort} onSort={toggleSort}>
              {t('table.status')}
            </SortHead>
            {personColumn && <TableHead>{personColumn.header}</TableHead>}
            <SortHead sortKey="due_date" sort={sort} onSort={toggleSort}>
              {t('table.dueDate')}
            </SortHead>
            <SortHead sortKey="created_at" sort={sort} onSort={toggleSort}>
              {t('table.createdAt')}
            </SortHead>
            <TableHead>{t('table.duration')}</TableHead>
            <TableHead className="text-end">{t('table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((ticket) => {
            const overdue = isOverdue(ticket)
            return (
              <TableRow
                key={ticket.id}
                className={cn('cursor-pointer', overdue && 'bg-destructive/5')}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
              >
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {ticket.ticket_number}
                </TableCell>
                <TableCell className="max-w-[260px] truncate font-medium">
                  {ticket.title}
                </TableCell>
                {showCustomer && (
                  <TableCell className="max-w-[160px] truncate text-muted-foreground">
                    {ticket.customer?.name || '—'}
                  </TableCell>
                )}
                <TableCell>
                  <TypeBadge type={ticket.type} />
                </TableCell>
                <TableCell>
                  <PriorityBadge priority={ticket.priority} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={ticket.status} />
                </TableCell>
                {personColumn && (
                  <TableCell className="text-muted-foreground">
                    {personColumn.getName(ticket) || '—'}
                  </TableCell>
                )}
                <TableCell
                  className={cn(
                    'whitespace-nowrap',
                    overdue ? 'font-medium text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {formatDay(ticket.due_date)}
                  {overdue && (
                    <span className="ms-1 text-xs">({t('table.overdue')})</span>
                  )}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(ticket.created_at)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {ticket.status === 'Done'
                    ? formatDurationShort(ticket.started_at, ticket.closed_at)
                    : ticket.status === 'In Progress' && ticket.started_at
                      ? formatDurationShort(ticket.started_at, now)
                      : '—'}
                </TableCell>
                <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/tickets/${ticket.id}`}>
                        <Eye className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                        {t('table.view')}
                      </Link>
                    </Button>
                    {onCancel && ticket.status === 'Open' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        disabled={cancellingId === ticket.id}
                        onClick={() => onCancel(ticket)}
                      >
                        <XCircle className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                        {t('table.cancel')}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      </div>
    </>
  )
}
