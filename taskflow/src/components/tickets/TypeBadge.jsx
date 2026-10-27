import { Bug, CheckSquare, MessageSquare } from 'lucide-react'
import { Pill } from '@/components/ui/pill'
import { useTranslation } from '@/context/LanguageContext'

const TYPES = {
  Bug: { tone: 'red', icon: Bug },
  Task: { tone: 'blue', icon: CheckSquare },
  Request: { tone: 'green', icon: MessageSquare },
}

export function TypeBadge({ type, className }) {
  const { t } = useTranslation()
  const config = TYPES[type] ?? { tone: 'gray' }
  return (
    <Pill tone={config.tone} icon={config.icon} className={className}>
      {t(`type.${type}`)}
    </Pill>
  )
}
