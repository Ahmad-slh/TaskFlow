import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

const STATUS_STYLES = {
  Open: 'bg-blue-100 text-blue-700',
  'In Progress': 'bg-yellow-100 text-yellow-700',
  Done: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
  Reopened: 'bg-purple-100 text-purple-700',
}

export function StatusBadge({ status, className }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        STATUS_STYLES[status] || 'bg-gray-100 text-gray-700',
        className
      )}
    >
      {t(`status.${status}`)}
    </span>
  )
}
