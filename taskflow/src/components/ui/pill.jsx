import { cn } from '@/lib/utils'

// Full class names so Tailwind can see them at build time.
const TONES = {
  blue: { soft: 'bg-tone-blue-bg text-tone-blue-fg', dot: 'bg-tone-blue' },
  amber: { soft: 'bg-tone-amber-bg text-tone-amber-fg', dot: 'bg-tone-amber' },
  green: { soft: 'bg-tone-green-bg text-tone-green-fg', dot: 'bg-tone-green' },
  red: { soft: 'bg-tone-red-bg text-tone-red-fg', dot: 'bg-tone-red' },
  purple: { soft: 'bg-tone-purple-bg text-tone-purple-fg', dot: 'bg-tone-purple' },
  gray: { soft: 'bg-tone-gray-bg text-tone-gray-fg', dot: 'bg-tone-gray' },
  orange: { soft: 'bg-tone-orange-bg text-tone-orange-fg', dot: 'bg-tone-orange' },
}

/**
 * Small status chip. Always pairs the color with a dot or an icon so the meaning
 * never depends on color alone.
 *
 * @param tone   blue | amber | green | red | purple | gray | orange
 * @param icon   optional lucide icon (replaces the dot)
 * @param solid  strong filled variant (used for "Critical")
 */
export function Pill({ tone = 'gray', icon: Icon, solid = false, className, children }) {
  const styles = TONES[tone] ?? TONES.gray
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold',
        solid ? 'bg-tone-red text-white' : styles.soft,
        className
      )}
    >
      {Icon ? (
        <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      ) : (
        <span
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', solid ? 'bg-white' : styles.dot)}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
