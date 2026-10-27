import { downloadCsv } from '@/lib/csv'
import { formatDurationShort } from '@/lib/utils'

/**
 * Export tickets as CSV.
 * @param t              the active translate function
 * @param tickets        rows to export (usually the filtered list)
 * @param personHeader   header of the "other person" column
 * @param getPersonName  (ticket) => string
 */
export function exportTicketsCsv(t, tickets, personHeader, getPersonName) {
  downloadCsv('tickets.csv', tickets, [
    { header: t('table.number'), value: (r) => r.ticket_number },
    { header: t('table.title'), value: (r) => r.title },
    { header: t('table.customer'), value: (r) => r.customer?.name },
    { header: t('table.type'), value: (r) => t(`type.${r.type}`) },
    { header: t('table.priority'), value: (r) => t(`priority.${r.priority}`) },
    { header: t('table.status'), value: (r) => t(`status.${r.status}`) },
    { header: personHeader, value: getPersonName },
    { header: t('table.dueDate'), value: (r) => r.due_date },
    { header: t('ticketDetail.estimatedHours'), value: (r) => r.estimated_hours },
    { header: t('table.createdAt'), value: (r) => r.created_at },
    {
      header: t('table.duration'),
      value: (r) =>
        r.status === 'Done' ? formatDurationShort(r.started_at, r.closed_at) : '',
    },
  ])
}
