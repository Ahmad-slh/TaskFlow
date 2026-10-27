import { cn } from '@/lib/utils'
import { useTranslation } from '@/context/LanguageContext'

const STYLES = {
  Active: 'bg-green-100 text-green-700',
  Inactive: 'bg-gray-100 text-gray-600',
}

export function CustomerStatusBadge({ status, className }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        STYLES[status] || 'bg-gray-100 text-gray-600',
        className
      )}
    >
      {t(`customerStatus.${status}`)}
    </span>
  )
}
