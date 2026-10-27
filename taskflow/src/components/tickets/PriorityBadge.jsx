import { Flame } from 'lucide-react'
import { Pill } from '@/components/ui/pill'
import { useTranslation } from '@/context/LanguageContext'

const PRIORITY_TONES = {
  Low: 'gray',
  Medium: 'amber',
  High: 'orange',
  Critical: 'red',
}

export function PriorityBadge({ priority, className }) {
  const { t } = useTranslation()
  const critical = priority === 'Critical'
  return (
    <Pill
      tone={PRIORITY_TONES[priority] || 'gray'}
      solid={critical}
      icon={critical ? Flame : undefined}
      className={className}
    >
      {t(`priority.${priority}`)}
    </Pill>
  )
}
