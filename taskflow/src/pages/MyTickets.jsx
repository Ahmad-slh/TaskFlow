import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Inbox, Download, Table2, Kanban, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TicketTable } from '@/components/tickets/TicketTable'
import { TicketKanban } from '@/components/tickets/TicketKanban'
import { TicketFilters, applyTicketFilters } from '@/components/tickets/TicketFilters'
import { useMyTickets, useUpdateTicketStatus } from '@/hooks/useTickets'
import { useTicketFilters } from '@/hooks/useTicketFilters'
import { useTranslation } from '@/context/LanguageContext'
import { toast } from '@/components/ui/sonner'
import { friendlyError } from '@/lib/utils'
import { exportTicketsCsv } from '@/lib/ticketCsv'

const getAssignee = (ticket) => ticket.assigned_profile
const getAssigneeName = (ticket) => ticket.assigned_profile?.name

export default function MyTickets() {
  const { data: tickets = [], isLoading } = useMyTickets()
  const updateStatus = useUpdateTicketStatus()
  const { t } = useTranslation()
  const { filters, setFilters, view, setView } = useTicketFilters()
  const [ticketToCancel, setTicketToCancel] = useState(null)

  const filtered = useMemo(() => applyTicketFilters(tickets, filters), [tickets, filters])
  const hasNoTickets = !isLoading && tickets.length === 0

  async function confirmCancel() {
    const ticket = ticketToCancel
    setTicketToCancel(null)
    try {
      await updateStatus.mutateAsync({ ticketId: ticket.id, status: 'Cancelled' })
      toast.success(t('myTickets.cancelled', { number: ticket.ticket_number }))
    } catch (error) {
      toast.error(friendlyError(error, t('myTickets.cancelFailed')))
    }
  }

  const noMatches = (
    <EmptyState
      icon={SearchX}
      title={t('myTickets.noMatches')}
      className="bg-card"
    />
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('myTickets.title')}
        description={t('myTickets.subtitle')}
        actions={
          <>
            <Button
              variant="outline"
              disabled={!filtered.length}
              onClick={() =>
                exportTicketsCsv(t, filtered, t('myTickets.assignedTo'), getAssigneeName)
              }
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{t('table.exportCsv')}</span>
            </Button>
            <Button asChild>
              <Link to="/create-ticket">
                <PlusCircle className="h-4 w-4" />
                {t('myTickets.createTicket')}
              </Link>
            </Button>
          </>
        }
      />

      {hasNoTickets ? (
        <EmptyState
          icon={Inbox}
          title={t('myTickets.emptyTitle')}
          description={t('myTickets.emptySubtitle')}
          className="bg-card"
          action={
            <Button asChild>
              <Link to="/create-ticket">
                <PlusCircle className="h-4 w-4" />
                {t('myTickets.createFirst')}
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <TicketFilters
            filters={filters}
            onChange={setFilters}
            tickets={tickets}
            personLabel={t('myTickets.assignedTo')}
            getPerson={getAssignee}
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
              <TicketKanban tickets={filtered} getPersonName={getAssigneeName} />
            ) : (
              noMatches
            )
          ) : (
            <TicketTable
              tickets={filtered}
              loading={isLoading}
              personColumn={{
                header: t('myTickets.assignedTo'),
                getName: getAssigneeName,
              }}
              onCancel={(row) => setTicketToCancel(row)}
              cancellingId={updateStatus.isPending ? ticketToCancel?.id : null}
              emptyState={noMatches}
            />
          )}
        </>
      )}

      <AlertDialog
        open={!!ticketToCancel}
        onOpenChange={(open) => !open && setTicketToCancel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('myTickets.cancelTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('myTickets.cancelDescription', { number: ticketToCancel?.ticket_number })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('myTickets.keepTicket')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmCancel}
            >
              {t('myTickets.cancelTicket')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
