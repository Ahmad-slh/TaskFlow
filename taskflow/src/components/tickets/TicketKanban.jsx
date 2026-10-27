import { useState } from 'react'
import { ChevronDown, ChevronUp, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TicketCard } from '@/components/tickets/TicketCard'
import { useTranslation } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'
import { KANBAN_COLUMNS, developerAction, nextStatus, statusForColumn } from '@/lib/ticketTransitions'

const DOT = {
  blue: 'bg-tone-blue',
  amber: 'bg-tone-amber',
  green: 'bg-tone-green',
  gray: 'bg-tone-gray',
}

/**
 * Status board.
 *
 * @param canMove        developers who own the tickets can move them forward (drag or menu)
 * @param onMove         (ticket, nextStatus) => void
 * @param movingId       id of the ticket currently being updated
 * @param getPersonName  (ticket) => string, the creator / assignee shown on each card
 */
export function TicketKanban({ tickets, canMove = false, onMove, movingId, getPersonName }) {
  const { t } = useTranslation()
  const [dragged, setDragged] = useState(null)
  const [overColumn, setOverColumn] = useState(null)
  const [showCancelled, setShowCancelled] = useState(false)

  function targetFor(columnId) {
    return dragged && canMove ? statusForColumn(dragged, columnId) : null
  }

  function endDrag() {
    setDragged(null)
    setOverColumn(null)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t(canMove ? 'kanban.hintMove' : 'kanban.hintReadOnly')}
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {KANBAN_COLUMNS.map((column) => {
          const items = tickets.filter((tk) => column.statuses.includes(tk.status))
          const isCancelled = column.id === 'cancelled'
          const collapsed = isCancelled && !showCancelled
          const validTarget = targetFor(column.id)
          const dragging = !!dragged

          return (
            <section
              key={column.id}
              aria-label={t(`status.${column.titleStatus}`)}
              onDragOver={(e) => {
                if (validTarget) {
                  e.preventDefault()
                  setOverColumn(column.id)
                }
              }}
              onDragLeave={() => setOverColumn((c) => (c === column.id ? null : c))}
              onDrop={(e) => {
                e.preventDefault()
                if (dragged && validTarget) onMove?.(dragged, validTarget)
                endDrag()
              }}
              className={cn(
                'flex min-h-[120px] flex-col gap-3 rounded-xl border bg-muted/40 p-3 transition-colors',
                dragging && validTarget && 'border-primary/50 bg-primary/5',
                overColumn === column.id && 'ring-2 ring-primary/50',
                dragging && !validTarget && 'opacity-60'
              )}
            >
              <header className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn('h-2.5 w-2.5 rounded-full', DOT[column.tone])}
                    aria-hidden="true"
                  />
                  <h3 className="text-sm font-semibold">{t(`status.${column.titleStatus}`)}</h3>
                  <span className="rounded-full bg-card px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                {isCancelled && items.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setShowCancelled((v) => !v)}
                    aria-expanded={showCancelled}
                    aria-label={t(`status.${column.titleStatus}`)}
                  >
                    {showCancelled ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </header>

              {!collapsed &&
                (items.length === 0 ? (
                  <p className="rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                    {t(validTarget ? 'kanban.dropHere' : 'kanban.empty')}
                  </p>
                ) : (
                  items.map((ticket) => {
                    const action = canMove ? developerAction(ticket.status) : null
                    const movable = !!action && ticket.id !== movingId
                    return (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        showStatus={column.id === 'todo'}
                        personName={getPersonName?.(ticket)}
                        className={cn(
                          movable && 'cursor-grab active:cursor-grabbing',
                          ticket.id === movingId && 'opacity-50',
                          dragged?.id === ticket.id && 'opacity-40'
                        )}
                        dragProps={
                          movable
                            ? {
                                draggable: true,
                                onDragStart: (e) => {
                                  e.dataTransfer.effectAllowed = 'move'
                                  e.dataTransfer.setData('text/plain', ticket.id)
                                  setDragged(ticket)
                                },
                                onDragEnd: endDrag,
                              }
                            : undefined
                        }
                        actions={
                          movable ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  aria-label={t('kanban.actions')}
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                // Menu content is portaled, but React events still bubble to the card.
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              >
                                <DropdownMenuItem onSelect={() => onMove?.(ticket, nextStatus(ticket.status))}>
                                  <action.icon className="h-4 w-4" />
                                  {t(action.labelKey)}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : null
                        }
                      />
                    )
                  })
                ))}
            </section>
          )
        })}
      </div>
    </div>
  )
}
