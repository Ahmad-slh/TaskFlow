import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

const TYPE_STYLES = {
  Bug: 'bg-red-50 text-red-500',
  Task: 'bg-blue-50 text-blue-500',
  Request: 'bg-green-50 text-green-500',
}

export function TypeBadge({ type, className }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        TYPE_STYLES[type] || 'bg-gray-50 text-gray-500',
        className
      )}
    >
      {t(`type.${type}`)}
    </span>
  )
}
