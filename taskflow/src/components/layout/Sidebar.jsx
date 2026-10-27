import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  Ticket,
  Inbox,
  Building2,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

const EMPLOYEE_NAV = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/create-ticket', labelKey: 'nav.createTicket', icon: PlusCircle },
  { to: '/my-tickets', labelKey: 'nav.myTickets', icon: Ticket },
  { to: '/customers', labelKey: 'nav.customers', icon: Building2 },
]

const DEVELOPER_NAV = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/assigned', labelKey: 'nav.assigned', icon: Inbox },
]

export function Sidebar({ open, onClose }) {
  const { role } = useAuth()
  const { t } = useTranslation()
  const nav = role === 'developer' ? DEVELOPER_NAV : EMPLOYEE_NAV

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/40 lg:hidden',
          open ? 'block' : 'hidden'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          'fixed inset-y-0 start-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:!translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Ticket className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold text-sidebar-active">
              {t('sidebar.appName')}
            </span>
          </div>
          <button
            className="text-sidebar-foreground lg:hidden"
            onClick={onClose}
            aria-label={t('sidebar.closeSidebar')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map(({ to, labelKey, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-sidebar-active'
                    : 'text-sidebar-foreground hover:bg-white/5 hover:text-sidebar-active'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {t(labelKey)}
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-4 text-xs text-sidebar-foreground/60">
          {t('sidebar.tagline')}
        </div>
      </aside>
    </>
  )
}
