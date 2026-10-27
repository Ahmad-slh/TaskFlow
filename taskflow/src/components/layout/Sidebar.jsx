import { Link, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  PlusCircle,
  Ticket,
  Inbox,
  Building2,
  UserCircle,
  X,
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { useMyTickets, useAssignedTickets } from '@/hooks/useTickets'
import { cn, getInitials } from '@/lib/utils'

const CLOSED = ['Done', 'Cancelled']

const EMPLOYEE_NAV = [
  {
    sectionKey: 'nav.sections.main',
    items: [
      { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
      { to: '/create-ticket', labelKey: 'nav.createTicket', icon: PlusCircle },
      { to: '/my-tickets', labelKey: 'nav.myTickets', icon: Ticket, counter: true },
    ],
  },
  {
    sectionKey: 'nav.sections.manage',
    items: [{ to: '/customers', labelKey: 'nav.customers', icon: Building2 }],
  },
]

const DEVELOPER_NAV = [
  {
    sectionKey: 'nav.sections.main',
    items: [
      { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
      { to: '/assigned', labelKey: 'nav.assigned', icon: Inbox, counter: true },
    ],
  },
]

/**
 * @param open       mobile drawer state
 * @param collapsed  desktop icon-only mode
 */
export function Sidebar({ open, onClose, collapsed }) {
  const { role, profile } = useAuth()
  const { t } = useTranslation()
  const isDeveloper = role === 'developer'
  const sections = isDeveloper ? DEVELOPER_NAV : EMPLOYEE_NAV

  // Open-ticket counter shown next to the main list.
  const mine = useMyTickets()
  const assigned = useAssignedTickets()
  const source = isDeveloper ? assigned.data : mine.data
  const openCount = (source ?? []).filter((tk) => !CLOSED.includes(tk.status)).length

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          'surface-gradient fixed inset-y-0 start-0 z-40 flex w-64 flex-col text-sidebar-foreground transition-all duration-200 lg:static lg:!translate-x-0',
          collapsed && 'lg:w-[76px]',
          open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center justify-between px-5',
            collapsed && 'lg:justify-center lg:px-0'
          )}
        >
          <Link to="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
            <div className="brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-lg shadow-primary/30">
              <Ticket className="h-5 w-5" />
            </div>
            <span
              className={cn(
                'text-lg font-bold tracking-tight text-sidebar-active',
                collapsed && 'lg:hidden'
              )}
            >
              {t('sidebar.appName')}
            </span>
          </Link>
          <button
            className="rounded-md p-1 text-sidebar-foreground hover:text-sidebar-active lg:hidden"
            onClick={onClose}
            aria-label={t('sidebar.closeSidebar')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label={t('sidebar.appName')}>
          {sections.map((section) => (
            <div key={section.sectionKey} className="space-y-1">
              <p
                className={cn(
                  'px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/60',
                  collapsed && 'lg:hidden'
                )}
              >
                {t(section.sectionKey)}
              </p>
              {section.items.map(({ to, labelKey, icon: Icon, counter }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  title={collapsed ? t(labelKey) : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      collapsed && 'lg:justify-center lg:px-0',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-active before:absolute before:inset-y-2 before:start-0 before:w-1 before:rounded-full before:bg-primary'
                        : 'hover:bg-sidebar-accent/70 hover:text-sidebar-active'
                    )
                  }
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                  <span className={cn('flex-1 truncate', collapsed && 'lg:hidden')}>
                    {t(labelKey)}
                  </span>
                  {counter && openCount > 0 && (
                    <span
                      className={cn(
                        'rounded-full bg-primary/90 px-2 py-0.5 text-[11px] font-bold text-white',
                        collapsed && 'lg:hidden'
                      )}
                    >
                      {openCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <NavLink
            to="/profile"
            onClick={onClose}
            title={collapsed ? t('nav.profile') : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-sidebar-accent/70',
                collapsed && 'lg:justify-center',
                isActive && 'bg-sidebar-accent'
              )
            }
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-primary/20 text-xs font-semibold text-sidebar-active">
                {getInitials(profile?.name)}
              </AvatarFallback>
            </Avatar>
            <div className={cn('min-w-0 flex-1', collapsed && 'lg:hidden')}>
              <p className="truncate text-sm font-semibold text-sidebar-active">
                {profile?.name || '—'}
              </p>
              <p className="truncate text-xs">{role ? t(`roles.${role}`) : ''}</p>
            </div>
            <UserCircle className={cn('h-4 w-4 shrink-0 opacity-60', collapsed && 'lg:hidden')} />
          </NavLink>
        </div>
      </aside>
    </>
  )
}
