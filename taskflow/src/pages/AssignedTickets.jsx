import { useMemo, useState } from 'react'
import { Inbox, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { TicketTable } from '@/components/tickets/TicketTable'
import {
  TicketFilters,
  DEFAULT_FILTERS,
  applyTicketFilters,
} from '@/components/tickets/TicketFilters'
import { useAssignedTickets } from '@/hooks/useTickets'
import { useTranslation } from '@/context/LanguageContext'
import { exportTicketsCsv } from '@/lib/ticketCsv'

const getCreator = (ticket) => ticket.creator_profile

function StatPill({ label, count, className }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold">{count}</span>
    </div>
  )
}

export default function AssignedTickets() {
  const { data: tickets = [], isLoading } = useAssignedTickets()
  const { t } = useTranslation()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const filtered = useMemo(() => applyTicketFilters(tickets, filters), [tickets, filters])

  const counts = {
    open: tickets.filter((t) => t.status === 'Open').length,
    inProgress: tickets.filter((t) => t.status === 'In Progress').length,
    done: tickets.filter((t) => t.status === 'Done').length,
  }

  const hasNoTickets = !isLoading && tickets.length === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t('assigned.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('assigned.subtitle')}</p>
        </div>
        <Button
          variant="outline"
          disabled={!filtered.length}
          onClick={() =>
            exportTicketsCsv(t, filtered, t('assigned.createdBy'), (r) => r.creator_profile?.name)
          }
        >
          <Download className="h-4 w-4" />
          {t('table.exportCsv')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <StatPill label={t('assigned.open')} count={counts.open} className="bg-blue-500" />
        <StatPill
          label={t('assigned.inProgress')}
          count={counts.inProgress}
          className="bg-yellow-500"
        />
        <StatPill label={t('assigned.done')} count={counts.done} className="bg-green-500" />
      </div>

      {hasNoTickets ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('assigned.empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <TicketFilters
            filters={filters}
            onChange={setFilters}
            tickets={tickets}
            personLabel={t('assigned.createdBy')}
            getPerson={getCreator}
          />
          <TicketTable
            tickets={filtered}
            loading={isLoading}
            personColumn={{
              header: t('assigned.createdBy'),
              getName: (row) => row.creator_profile?.name,
            }}
            emptyState={
              <Card>
                <CardContent className="p-10 text-center text-sm text-muted-foreground">
                  {t('assigned.noMatches')}
                </CardContent>
              </Card>
            }
          />
        </>
      )}
    </div>
  )
}
