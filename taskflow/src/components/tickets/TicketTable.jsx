import { Link } from 'react-router-dom'
import { Eye, XCircle } from 'lucide-react'
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
import { formatDate, formatDurationShort } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'
import { useNow } from '@/hooks/useNow'

/**
 * Reusable tickets table.
 *
 * @param tickets         array of ticket rows
 * @param loading         show skeleton rows
 * @param personColumn    { header, getName } — the "Assigned To" / "Created By" column
 * @param onCancel        optional (ticket) => void; renders Cancel for Open tickets
 * @param cancellingId    id of the ticket currently being cancelled (disables its button)
 * @param emptyState      node rendered when there are no tickets
 */
export function TicketTable({
  tickets = [],
  loading = false,
  personColumn,
  onCancel,
  cancellingId,
  emptyState,
}) {
  const { t } = useTranslation()
  const now = useNow()
  if (loading) {
    return (
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.number')}</TableHead>
              <TableHead>{t('table.title')}</TableHead>
              <TableHead>{t('table.type')}</TableHead>
              <TableHead>{t('table.priority')}</TableHead>
              <TableHead>{t('table.status')}</TableHead>
              {personColumn && <TableHead>{personColumn.header}</TableHead>}
              <TableHead>{t('table.createdAt')}</TableHead>
              <TableHead>{t('table.duration')}</TableHead>
              <TableHead className="text-end">{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: personColumn ? 9 : 8 }).map((__, j) => (
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
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('table.number')}</TableHead>
            <TableHead>{t('table.title')}</TableHead>
            <TableHead>{t('table.type')}</TableHead>
            <TableHead>{t('table.priority')}</TableHead>
            <TableHead>{t('table.status')}</TableHead>
            {personColumn && <TableHead>{personColumn.header}</TableHead>}
            <TableHead>{t('table.createdAt')}</TableHead>
            <TableHead>{t('table.duration')}</TableHead>
            <TableHead className="text-end">{t('table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {ticket.ticket_number}
              </TableCell>
              <TableCell className="max-w-[260px] truncate font-medium">
                {ticket.title}
              </TableCell>
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
              <TableCell className="text-end">
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
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
