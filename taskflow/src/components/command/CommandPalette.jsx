import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import {
  Building2,
  Globe,
  Inbox,
  LayoutDashboard,
  Moon,
  PlusCircle,
  Search,
  Sun,
  Ticket,
  UserCircle,
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { StatusBadge } from '@/components/tickets/StatusBadge'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { useTheme } from '@/context/ThemeContext'
import { useMyTickets, useAssignedTickets } from '@/hooks/useTickets'
import { useCustomers } from '@/hooks/useCustomers'

const ITEM =
  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none data-[selected=true]:bg-primary/10 data-[selected=true]:text-foreground'
const GROUP =
  '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground'

/** Ctrl/⌘ + K quick search: tickets, customers, pages and quick actions. */
export function CommandPalette({ open, onOpenChange }) {
  const navigate = useNavigate()
  const { role } = useAuth()
  const { t, toggleLanguage } = useTranslation()
  const { resolved, toggleTheme } = useTheme()
  const isEmployee = role === 'employee'

  const mine = useMyTickets()
  const assigned = useAssignedTickets()
  const customers = useCustomers({ enabled: isEmployee })

  const tickets = useMemo(
    () => (role === 'developer' ? assigned.data : mine.data)?.slice(0, 100) ?? [],
    [role, assigned.data, mine.data]
  )

  function run(action) {
    onOpenChange(false)
    action()
  }

  const pages = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    ...(isEmployee
      ? [
          { to: '/create-ticket', label: t('nav.createTicket'), icon: PlusCircle },
          { to: '/my-tickets', label: t('nav.myTickets'), icon: Ticket },
          { to: '/customers', label: t('nav.customers'), icon: Building2 },
        ]
      : [{ to: '/assigned', label: t('nav.assigned'), icon: Inbox }]),
    { to: '/profile', label: t('nav.profile'), icon: UserCircle },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-[18%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl [&>button]:hidden">
        <DialogTitle className="sr-only">{t('command.title')}</DialogTitle>
        <DialogDescription className="sr-only">{t('command.description')}</DialogDescription>
        <Command loop className="flex max-h-[70vh] flex-col">
          <div className="flex items-center gap-2 border-b px-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Command.Input
              autoFocus
              placeholder={t('command.placeholder')}
              className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
              Esc
            </kbd>
          </div>

          <Command.List className="scroll-thin flex-1 overflow-y-auto p-2">
            <Command.Empty className="py-10 text-center text-sm text-muted-foreground">
              {t('command.empty')}
            </Command.Empty>

            {tickets.length > 0 && (
              <Command.Group heading={t('command.tickets')} className={GROUP}>
                {tickets.map((tk) => (
                  <Command.Item
                    key={tk.id}
                    value={`${tk.ticket_number} ${tk.title} ${tk.customer?.name ?? ''}`}
                    onSelect={() => run(() => navigate(`/tickets/${tk.id}`))}
                    className={ITEM}
                  >
                    <Ticket className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span className="font-mono text-xs text-muted-foreground">
                      {tk.ticket_number}
                    </span>
                    <span className="flex-1 truncate">{tk.title}</span>
                    {tk.customer?.name && (
                      <span className="hidden max-w-[120px] truncate text-xs text-muted-foreground sm:inline">
                        {tk.customer.name}
                      </span>
                    )}
                    <StatusBadge status={tk.status} />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {isEmployee && (customers.data?.length ?? 0) > 0 && (
              <Command.Group heading={t('command.customers')} className={GROUP}>
                {customers.data.map((c) => (
                  <Command.Item
                    key={c.id}
                    value={`${c.name} ${c.company ?? ''} ${c.city ?? ''} ${c.phone ?? ''}`}
                    onSelect={() => run(() => navigate(`/customers/${c.id}`))}
                    className={ITEM}
                  >
                    <Building2
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate">{c.name}</span>
                    {c.company && (
                      <span className="truncate text-xs text-muted-foreground">{c.company}</span>
                    )}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading={t('command.pages')} className={GROUP}>
              {pages.map(({ to, label, icon: Icon }) => (
                <Command.Item
                  key={to}
                  value={`page ${label}`}
                  onSelect={() => run(() => navigate(to))}
                  className={ITEM}
                >
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  {label}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading={t('command.actions')} className={GROUP}>
              <Command.Item
                value={`action ${t('theme.toggle')}`}
                onSelect={() => run(toggleTheme)}
                className={ITEM}
              >
                {resolved === 'dark' ? (
                  <Sun className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <Moon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                )}
                {t('theme.toggle')}
              </Command.Item>
              <Command.Item
                value={`action ${t('language.switchTo')}`}
                onSelect={() => run(toggleLanguage)}
                className={ITEM}
              >
                <Globe className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                {t('language.switchTo')}
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
