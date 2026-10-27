import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Inbox, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  TicketFilters,
  DEFAULT_FILTERS,
  applyTicketFilters,
} from '@/components/tickets/TicketFilters'
import { useMyTickets, useUpdateTicketStatus } from '@/hooks/useTickets'
import { useTranslation } from '@/context/LanguageContext'
import { toast } from '@/components/ui/sonner'
import { friendlyError } from '@/lib/utils'
import { exportTicketsCsv } from '@/lib/ticketCsv'

const getAssignee = (ticket) => ticket.assigned_profile

export default function MyTickets() {
  const { data: tickets = [], isLoading } = useMyTickets()
  const updateStatus = useUpdateTicketStatus()
  const { t } = useTranslation()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t('myTickets.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('myTickets.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={!filtered.length}
            onClick={() =>
              exportTicketsCsv(t, filtered, t('myTickets.assignedTo'), (r) => r.assigned_profile?.name)
            }
          >
            <Download className="h-4 w-4" />
            {t('table.exportCsv')}
          </Button>
          <Button asChild>
            <Link to="/create-ticket">
              <PlusCircle className="h-4 w-4" />
              {t('myTickets.createTicket')}
            </Link>
          </Button>
        </div>
      </div>

      {hasNoTickets ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">{t('myTickets.emptyTitle')}</p>
              <p className="text-sm text-muted-foreground">
                {t('myTickets.emptySubtitle')}
              </p>
            </div>
            <Button asChild>
              <Link to="/create-ticket">
                <PlusCircle className="h-4 w-4" />
                {t('myTickets.createFirst')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <TicketFilters
            filters={filters}
            onChange={setFilters}
            tickets={tickets}
            personLabel={t('myTickets.assignedTo')}
            getPerson={getAssignee}
          />
          <TicketTable
            tickets={filtered}
            loading={isLoading}
            personColumn={{
              header: t('myTickets.assignedTo'),
              getName: (row) => row.assigned_profile?.name,
            }}
            onCancel={(row) => setTicketToCancel(row)}
            cancellingId={updateStatus.isPending ? ticketToCancel?.id : null}
            emptyState={
              <Card>
                <CardContent className="p-10 text-center text-sm text-muted-foreground">
                  {t('myTickets.noMatches')}
                </CardContent>
              </Card>
            }
          />
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
