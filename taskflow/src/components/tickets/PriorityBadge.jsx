import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

const PRIORITY_STYLES = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-orange-100 text-orange-600',
  High: 'bg-red-100 text-red-600',
}

export function PriorityBadge({ priority, className }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        PRIORITY_STYLES[priority] || 'bg-gray-100 text-gray-600',
        className
      )}
    >
      {t(`priority.${priority}`)}
    </span>
  )
}
