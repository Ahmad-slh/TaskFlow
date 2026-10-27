import { useMemo, useState } from 'react'
import { Inbox, Download, Table2, Kanban, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TicketTable } from '@/components/tickets/TicketTable'
import { TicketKanban } from '@/components/tickets/TicketKanban'
import { TicketFilters, applyTicketFilters } from '@/components/tickets/TicketFilters'
import { useAssignedTickets, useUpdateTicketStatus } from '@/hooks/useTickets'
import { useTicketFilters } from '@/hooks/useTicketFilters'
import { useTranslation } from '@/context/LanguageContext'
import { toast } from '@/components/ui/sonner'
import { friendlyError } from '@/lib/utils'
import { exportTicketsCsv } from '@/lib/ticketCsv'

const getCreator = (ticket) => ticket.creator_profile
const getCreatorName = (ticket) => ticket.creator_profile?.name

const PILL_DOT = {
  blue: 'bg-tone-blue',
  amber: 'bg-tone-amber',
  green: 'bg-tone-green',
}

function StatPill({ label, count, tone }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-2 shadow-soft">
      <span className={`h-2.5 w-2.5 rounded-full ${PILL_DOT[tone]}`} aria-hidden="true" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-bold">{count}</span>
    </div>
  )
}

export default function AssignedTickets() {
  const { data: tickets = [], isLoading } = useAssignedTickets()
  const updateStatus = useUpdateTicketStatus()
  const { t } = useTranslation()
  const { filters, setFilters, view, setView } = useTicketFilters()
  const [movingId, setMovingId] = useState(null)

  const filtered = useMemo(() => applyTicketFilters(tickets, filters), [tickets, filters])

  const counts = {
    open: tickets.filter((tk) => tk.status === 'Open' || tk.status === 'Reopened').length,
    inProgress: tickets.filter((tk) => tk.status === 'In Progress').length,
    done: tickets.filter((tk) => tk.status === 'Done').length,
  }

  const hasNoTickets = !isLoading && tickets.length === 0

  async function moveTicket(ticket, status) {
    setMovingId(ticket.id)
    try {
      await updateStatus.mutateAsync({ ticketId: ticket.id, status })
      toast.success(t('kanban.moved', { status: t(`status.${status}`) }))
    } catch (error) {
      toast.error(friendlyError(error, t('ticketDetail.statusFailed')))
    } finally {
      setMovingId(null)
    }
  }

  const noMatches = (
    <EmptyState icon={SearchX} title={t('assigned.noMatches')} className="bg-card" />
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('assigned.title')}
        description={t('assigned.subtitle')}
        actions={
          <Button
            variant="outline"
            disabled={!filtered.length}
            onClick={() => exportTicketsCsv(t, filtered, t('assigned.createdBy'), getCreatorName)}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">{t('table.exportCsv')}</span>
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        <StatPill label={t('assigned.open')} count={counts.open} tone="blue" />
        <StatPill label={t('assigned.inProgress')} count={counts.inProgress} tone="amber" />
        <StatPill label={t('assigned.done')} count={counts.done} tone="green" />
      </div>

      {hasNoTickets ? (
        <EmptyState icon={Inbox} title={t('assigned.empty')} className="bg-card" />
      ) : (
        <>
          <TicketFilters
            filters={filters}
            onChange={setFilters}
            tickets={tickets}
            personLabel={t('assigned.createdBy')}
            getPerson={getCreator}
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {t('dashboard.ticketsCount', { count: filtered.length })}
            </p>
            <Tabs value={view} onValueChange={setView}>
              <TabsList>
                <TabsTrigger value="table">
                  <Table2 />
                  {t('view.table')}
                </TabsTrigger>
                <TabsTrigger value="board">
                  <Kanban />
                  {t('view.board')}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {view === 'board' ? (
            filtered.length || isLoading ? (
              <TicketKanban
                tickets={filtered}
                canMove
                onMove={moveTicket}
                movingId={movingId}
                getPersonName={getCreatorName}
              />
            ) : (
              noMatches
            )
          ) : (
            <TicketTable
              tickets={filtered}
              loading={isLoading}
              personColumn={{ header: t('assigned.createdBy'), getName: getCreatorName }}
              emptyState={noMatches}
            />
          )}
        </>
      )}
    </div>
  )
}
