import { useNavigate } from 'react-router-dom'
import { X, CheckCheck, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '@/hooks/useNotifications'
import { useTranslation } from '@/context/LanguageContext'
import { cn, timeAgo } from '@/lib/utils'

export function NotificationPanel({ open, onClose }) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: notifications = [], isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const hasUnread = notifications.some((n) => !n.is_read)

  function handleClick(notification) {
    if (!notification.is_read) {
      markRead.mutate(notification.id)
    }
    onClose()
    if (notification.ticket_id) {
      navigate(`/tickets/${notification.ticket_id}`)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={cn(
          'fixed end-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-s bg-card shadow-xl transition-transform duration-200',
          open ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-base font-semibold">{t('notifications.title')}</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              disabled={!hasUnread || markAll.isPending}
              onClick={() => markAll.mutate()}
            >
              <CheckCheck className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
              {t('notifications.markAllRead')}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <p className="p-4 text-sm text-muted-foreground">{t('notifications.loading')}</p>
          ) : notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8" />
              <p className="text-sm">{t('notifications.allCaughtUp')}</p>
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => handleClick(n)}
                    className={cn(
                      'flex w-full flex-col items-start gap-1 px-4 py-3 text-left transition-colors hover:bg-muted/60',
                      !n.is_read && 'bg-primary/5'
                    )}
                  >
                    <div className="flex w-full items-start gap-2">
                      {!n.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                      <span className={cn('text-sm', n.is_read && 'ps-4')}>{n.message}</span>
                    </div>
                    <span className="ps-4 text-xs text-muted-foreground">
                      {timeAgo(n.created_at)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  )
}
