import { Pill } from '@/components/ui/pill'
import { useTranslation } from '@/context/LanguageContext'

export function CustomerStatusBadge({ status, className }) {
  const { t } = useTranslation()
  return (
    <Pill tone={status === 'Active' ? 'green' : 'gray'} className={className}>
      {t(`customerStatus.${status}`)}
    </Pill>
  )
}
