import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Inbox } from 'lucide-react'
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
import { toast } from '@/components/ui/sonner'
import { friendlyError } from '@/lib/utils'

export default function MyTickets() {
  const { data: tickets = [], isLoading } = useMyTickets()
  const updateStatus = useUpdateTicketStatus()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [ticketToCancel, setTicketToCancel] = useState(null)

  const filtered = useMemo(() => applyTicketFilters(tickets, filters), [tickets, filters])

  const hasNoTickets = !isLoading && tickets.length === 0

  async function confirmCancel() {
    const ticket = ticketToCancel
    setTicketToCancel(null)
    try {
      await updateStatus.mutateAsync({ ticketId: ticket.id, status: 'Cancelled' })
      toast.success(`Ticket #${ticket.ticket_number} cancelled`)
    } catch (error) {
      toast.error(friendlyError(error, 'Failed to cancel ticket.'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Tickets</h1>
          <p className="text-sm text-muted-foreground">Tickets you have created.</p>
        </div>
        <Button asChild>
          <Link to="/create-ticket">
            <PlusCircle className="h-4 w-4" />
            Create Ticket
          </Link>
        </Button>
      </div>

      {hasNoTickets ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <div>
              <p className="font-medium">No tickets yet</p>
              <p className="text-sm text-muted-foreground">
                Create your first ticket to get started.
              </p>
            </div>
            <Button asChild>
              <Link to="/create-ticket">
                <PlusCircle className="h-4 w-4" />
                Create your first ticket
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <TicketFilters filters={filters} onChange={setFilters} />
          <TicketTable
            tickets={filtered}
            loading={isLoading}
            personColumn={{ header: 'Assigned To', getName: (t) => t.assigned_profile?.name }}
            onCancel={(t) => setTicketToCancel(t)}
            cancellingId={updateStatus.isPending ? ticketToCancel?.id : null}
            emptyState={
              <Card>
                <CardContent className="p-10 text-center text-sm text-muted-foreground">
                  No tickets match your filters.
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
            <AlertDialogTitle>Cancel this ticket?</AlertDialogTitle>
            <AlertDialogDescription>
              This will set ticket #{ticketToCancel?.ticket_number} to Cancelled. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Ticket</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmCancel}
            >
              Cancel Ticket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
