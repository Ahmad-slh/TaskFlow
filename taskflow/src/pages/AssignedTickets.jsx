import { useMemo, useState } from 'react'
import { Inbox } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { TicketTable } from '@/components/tickets/TicketTable'
import {
  TicketFilters,
  DEFAULT_FILTERS,
  applyTicketFilters,
} from '@/components/tickets/TicketFilters'
import { useAssignedTickets } from '@/hooks/useTickets'

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
      <div>
        <h1 className="text-2xl font-semibold">Assigned to Me</h1>
        <p className="text-sm text-muted-foreground">Tickets assigned to you to work on.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <StatPill label="Open" count={counts.open} className="bg-blue-500" />
        <StatPill label="In Progress" count={counts.inProgress} className="bg-yellow-500" />
        <StatPill label="Done" count={counts.done} className="bg-green-500" />
      </div>

      {hasNoTickets ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <Inbox className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No tickets assigned to you yet</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <TicketFilters filters={filters} onChange={setFilters} />
          <TicketTable
            tickets={filtered}
            loading={isLoading}
            personColumn={{ header: 'Created By', getName: (t) => t.creator_profile?.name }}
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
    </div>
  )
}
