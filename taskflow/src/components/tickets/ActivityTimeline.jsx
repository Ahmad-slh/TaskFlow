import { History } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useTicketActivity } from '@/hooks/useTickets'
import { useTranslation } from '@/context/LanguageContext'
import { formatDay, timeAgo } from '@/lib/utils'

/** Translate a stored old/new value according to the kind of change. */
function useDisplayValue() {
  const { t } = useTranslation()
  return (action, value) => {
    if (value === null || value === undefined || value === '') return t('activity.none')
    if (action === 'status_changed') return t(`status.${value}`)
    if (action === 'priority_changed') return t(`priority.${value}`)
    if (action === 'due_date_changed') return formatDay(value)
    return value
  }
}

export function ActivityTimeline({ ticketId }) {
  const { t } = useTranslation()
  const { data: events = [], isLoading } = useTicketActivity(ticketId)
  const display = useDisplayValue()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          <span className="flex items-center gap-2">
            <History className="h-4 w-4" />
            {t('ticketDetail.activity')}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('ticketDetail.noActivity')}</p>
        ) : (
          <ol className="relative space-y-4 border-s ps-5">
            {events.map((event) => (
              <li key={event.id} className="relative">
                <span className="absolute -start-[25px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                <p className="text-sm">
                  <span className="font-medium">
                    {event.actor?.name || t('activity.someone')}
                  </span>{' '}
                  {t(`activity.${event.action}`, {
                    old: display(event.action, event.old_value),
                    new: display(event.action, event.new_value),
                  })}
                </p>
                <p className="text-xs text-muted-foreground">{timeAgo(event.created_at)}</p>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
