import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/tickets/StatusBadge'
import { PriorityBadge } from '@/components/tickets/PriorityBadge'
import { TypeBadge } from '@/components/tickets/TypeBadge'
import { formatDate } from '@/lib/utils'

export function TicketCard({ ticket }) {
  return (
    <Link to={`/tickets/${ticket.id}`}>
      <Card className="transition-colors hover:border-primary/40">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">
              {ticket.ticket_number}
            </span>
            <StatusBadge status={ticket.status} />
          </div>
          <p className="line-clamp-2 font-medium">{ticket.title}</p>
          <div className="flex items-center gap-2">
            <TypeBadge type={ticket.type} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <p className="text-xs text-muted-foreground">{formatDate(ticket.created_at)}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
