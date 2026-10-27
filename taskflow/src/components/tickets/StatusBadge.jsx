import { Pill } from '@/components/ui/pill'
import { useTranslation } from '@/context/LanguageContext'

const STATUS_TONES = {
  Open: 'blue',
  'In Progress': 'amber',
  Done: 'green',
  Cancelled: 'gray',
  Reopened: 'purple',
}

export function StatusBadge({ status, className }) {
  const { t } = useTranslation()
  return (
    <Pill tone={STATUS_TONES[status] || 'gray'} className={className}>
      {t(`status.${status}`)}
    </Pill>
  )
}
