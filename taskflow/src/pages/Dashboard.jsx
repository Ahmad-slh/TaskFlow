import { Link } from 'react-router-dom'
import { Ticket, CircleDot, Loader2, CheckCircle2, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TicketTable } from '@/components/tickets/TicketTable'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { useMyTickets, useAssignedTickets } from '@/hooks/useTickets'
import { cn } from '@/lib/utils'

function StatCard({ label, value, icon: Icon, accent, loading }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-10" />
          ) : (
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          )}
        </div>
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', accent)}>
          <Icon className="h-5 w-5" />
        </div>
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
    open: tickets.filter((t) => t.status === 'Open').length,
    inProgress: tickets.filter((t) => t.status === 'In Progress').length,
    done: tickets.filter((t) => t.status === 'Done').length,
  }

  const recent = tickets.slice(0, 5)

  const personColumn = isDeveloper
    ? { header: t('dashboard.createdBy'), getName: (row) => row.creator_profile?.name }
    : { header: t('dashboard.assignedTo'), getName: (row) => row.assigned_profile?.name }

  const viewAllLink = isDeveloper ? '/assigned' : '/my-tickets'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {profile?.name
            ? t('dashboard.welcomeNamed', { name: profile.name.split(' ')[0] })
            : t('dashboard.welcome')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isDeveloper
            ? t('dashboard.subtitleDeveloper')
            : t('dashboard.subtitleEmployee')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={isDeveloper ? t('dashboard.totalAssigned') : t('dashboard.totalCreated')}
          value={stats.total}
          icon={Ticket}
          accent="bg-primary/10 text-primary"
          loading={loading}
        />
        <StatCard
          label={t('dashboard.open')}
          value={stats.open}
          icon={CircleDot}
          accent="bg-blue-100 text-blue-700"
          loading={loading}
        />
        <StatCard
          label={t('dashboard.inProgress')}
          value={stats.inProgress}
          icon={Loader2}
          accent="bg-yellow-100 text-yellow-700"
          loading={loading}
        />
        <StatCard
          label={t('dashboard.done')}
          value={stats.done}
          icon={CheckCircle2}
          accent="bg-green-100 text-green-700"
          loading={loading}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('dashboard.recentTickets')}</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to={viewAllLink}>
              {t('dashboard.viewAll')}
              <ArrowRight className="h-4 w-4 ltr:ml-1 rtl:mr-1 rtl:rotate-180" />
            </Link>
          </Button>
        </div>

        <TicketTable
          tickets={recent}
          loading={loading}
          personColumn={personColumn}
          emptyState={
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                {t('dashboard.noTickets')}
              </CardContent>
            </Card>
          }
        />
      </div>
    </div>
  )
}
