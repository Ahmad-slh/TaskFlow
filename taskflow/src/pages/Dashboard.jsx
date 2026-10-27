import { Link } from 'react-router-dom'
import {
  Ticket,
  CircleDot,
  Loader2,
  CheckCircle2,
  ArrowRight,
  AlarmClock,
  Flame,
  Timer,
  PlusCircle,
  Kanban,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { TicketTable } from '@/components/tickets/TicketTable'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { useMyTickets, useAssignedTickets } from '@/hooks/useTickets'
import { cn, formatDurationShort, formatToday, isOverdue } from '@/lib/utils'

const CLOSED = ['Done', 'Cancelled']

// Static class names (Tailwind must see them at build time).
const TONES = {
  blue: 'bg-tone-blue-bg text-tone-blue-fg',
  amber: 'bg-tone-amber-bg text-tone-amber-fg',
  green: 'bg-tone-green-bg text-tone-green-fg',
  red: 'bg-tone-red-bg text-tone-red-fg',
  orange: 'bg-tone-orange-bg text-tone-orange-fg',
  purple: 'bg-tone-purple-bg text-tone-purple-fg',
  primary: 'bg-primary/10 text-primary',
}

const SEGMENT_DOT = {
  Open: 'bg-tone-blue',
  'In Progress': 'bg-tone-amber',
  Done: 'bg-tone-green',
  Cancelled: 'bg-tone-gray',
}

/** Count tickets per key and return the top entries, biggest first. */
function countBy(tickets, getKey, limit = 5) {
  const counts = new Map()
  for (const ticket of tickets) {
    const key = getKey(ticket)
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

function StatCard({ label, value, icon: Icon, tone, loading, alert }) {
  return (
    <Card className={cn('transition-shadow hover:shadow-md', alert && 'border-destructive/40')}>
      <CardContent className="flex items-center justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-14" />
          ) : (
            <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
          )}
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
            TONES[tone]
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  )
}

function BarList({ title, rows, emptyLabel, countLabel }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        ) : (
          <ul className="space-y-3.5">
            {rows.map((row) => (
              <li key={row.name} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{row.name}</span>
                  <span className="shrink-0 text-muted-foreground">{countLabel(row.count)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${(row.count / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function StatusBreakdown({ title, segments, total }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {total === 0 ? null : (
          <div
            className="flex h-3 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label={segments.map((s) => `${s.label}: ${s.count}`).join(', ')}
          >
            {segments
              .filter((s) => s.count > 0)
              .map((s) => (
                <div
                  key={s.status}
                  className={cn('h-full transition-all', SEGMENT_DOT[s.status])}
                  style={{ width: `${(s.count / total) * 100}%` }}
                />
              ))}
          </div>
        )}
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          {segments.map((s) => (
            <li key={s.status} className="flex items-center gap-2">
              <span
                className={cn('h-2.5 w-2.5 shrink-0 rounded-full', SEGMENT_DOT[s.status])}
                aria-hidden="true"
              />
              <span className="truncate text-muted-foreground">{s.label}</span>
              <span className="ms-auto font-semibold">{s.count}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { profile, role } = useAuth()
  const { t } = useTranslation()
  const isDeveloper = role === 'developer'

  const myTickets = useMyTickets()
  const assignedTickets = useAssignedTickets()
  const query = isDeveloper ? assignedTickets : myTickets

  const tickets = query.data ?? []
  const loading = query.isLoading

  const stats = {
    total: tickets.length,
    open: tickets.filter((tk) => tk.status === 'Open' || tk.status === 'Reopened').length,
    inProgress: tickets.filter((tk) => tk.status === 'In Progress').length,
    done: tickets.filter((tk) => tk.status === 'Done').length,
    cancelled: tickets.filter((tk) => tk.status === 'Cancelled').length,
    overdue: tickets.filter(isOverdue).length,
    criticalOpen: tickets.filter((tk) => tk.priority === 'Critical' && !CLOSED.includes(tk.status))
      .length,
  }

  // Average time from "In Progress" to "Done".
  const durations = tickets
    .filter((tk) => tk.status === 'Done' && tk.started_at && tk.closed_at)
    .map((tk) => new Date(tk.closed_at) - new Date(tk.started_at))
    .filter((ms) => Number.isFinite(ms) && ms >= 0)
  const avgResolution = durations.length
    ? // Pass Dates: formatDurationShort treats falsy bounds (like epoch 0) as missing.
      formatDurationShort(new Date(0), new Date(durations.reduce((a, b) => a + b, 0) / durations.length))
    : '—'

  const byDeveloper = countBy(tickets, (tk) => tk.assigned_profile?.name)
  const byCustomer = countBy(tickets, (tk) => tk.customer?.name)
  const countLabel = (count) => t('dashboard.ticketsCount', { count })

  const segments = [
    { status: 'Open', count: stats.open },
    { status: 'In Progress', count: stats.inProgress },
    { status: 'Done', count: stats.done },
    { status: 'Cancelled', count: stats.cancelled },
  ].map((s) => ({ ...s, label: t(`status.${s.status}`) }))

  const recent = tickets.slice(0, 5)

  const personColumn = isDeveloper
    ? { header: t('dashboard.createdBy'), getName: (row) => row.creator_profile?.name }
    : { header: t('dashboard.assignedTo'), getName: (row) => row.assigned_profile?.name }

  const viewAllLink = isDeveloper ? '/assigned' : '/my-tickets'

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{formatToday()}</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {profile?.name
              ? t('dashboard.welcomeNamed', { name: profile.name.split(' ')[0] })
              : t('dashboard.welcome')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isDeveloper ? t('dashboard.subtitleDeveloper') : t('dashboard.subtitleEmployee')}
          </p>
        </div>
        {isDeveloper ? (
          <Button asChild variant="soft">
            <Link to="/assigned?view=board">
              <Kanban className="h-4 w-4" />
              {t('view.board')}
            </Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/create-ticket">
              <PlusCircle className="h-4 w-4" />
              {t('nav.createTicket')}
            </Link>
          </Button>
        )}
      </div>

      <section aria-label={t('dashboard.recentTickets')} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label={isDeveloper ? t('dashboard.totalAssigned') : t('dashboard.totalCreated')}
            value={stats.total}
            icon={Ticket}
            tone="primary"
            loading={loading}
          />
          <StatCard
            label={t('dashboard.open')}
            value={stats.open}
            icon={CircleDot}
            tone="blue"
            loading={loading}
          />
          <StatCard
            label={t('dashboard.inProgress')}
            value={stats.inProgress}
            icon={Loader2}
            tone="amber"
            loading={loading}
          />
          <StatCard
            label={t('dashboard.done')}
            value={stats.done}
            icon={CheckCircle2}
            tone="green"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard
            label={t('dashboard.overdue')}
            value={stats.overdue}
            icon={AlarmClock}
            tone="red"
            alert={stats.overdue > 0}
            loading={loading}
          />
          <StatCard
            label={t('dashboard.criticalOpen')}
            value={stats.criticalOpen}
            icon={Flame}
            tone="orange"
            alert={stats.criticalOpen > 0}
            loading={loading}
          />
          <StatCard
            label={t('dashboard.avgResolution')}
            value={avgResolution}
            icon={Timer}
            tone="purple"
            loading={loading}
          />
        </div>
      </section>

      {!loading && tickets.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <StatusBreakdown
              title={t('dashboard.statusBreakdown')}
              segments={segments}
              total={stats.total}
            />
          </div>
          {!isDeveloper && (
            <BarList
              title={t('dashboard.byDeveloper')}
              rows={byDeveloper}
              emptyLabel={t('dashboard.noData')}
              countLabel={countLabel}
            />
          )}
          <BarList
            title={t('dashboard.topCustomers')}
            rows={byCustomer}
            emptyLabel={t('dashboard.noData')}
            countLabel={countLabel}
          />
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('dashboard.recentTickets')}</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to={viewAllLink}>
              {t('dashboard.viewAll')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>

        <TicketTable
          tickets={recent}
          loading={loading}
          personColumn={personColumn}
          emptyState={
            <EmptyState
              icon={Ticket}
              title={t('dashboard.noTickets')}
              className="bg-card"
              action={
                !isDeveloper && (
                  <Button asChild>
                    <Link to="/create-ticket">
                      <PlusCircle className="h-4 w-4" />
                      {t('myTickets.createFirst')}
                    </Link>
                  </Button>
                )
              }
            />
          }
        />
      </section>
    </div>
  )
}
