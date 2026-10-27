import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, MapPin, Pencil, Phone, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { TicketTable } from '@/components/tickets/TicketTable'
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog'
import { CustomerStatusBadge } from '@/components/customers/CustomerStatusBadge'
import { useCustomer } from '@/hooks/useCustomers'
import { useTranslation } from '@/context/LanguageContext'
import { cn, getInitials, isOverdue } from '@/lib/utils'

function Contact({ icon: Icon, label, children, ltr }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium break-words" dir={ltr ? 'ltr' : undefined}>
          {children || '—'}
        </dd>
      </div>
    </div>
  )
}

function Stat({ label, value, alert }) {
  return (
    <div className="rounded-xl border bg-card px-4 py-3 text-center shadow-soft">
      <p className={cn('text-2xl font-bold', alert && value > 0 && 'text-destructive')}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

export default function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { data: customer, isLoading, isError } = useCustomer(id)
  const [editing, setEditing] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (isError || !customer) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
          <p className="font-medium">{t('customers.notFound')}</p>
          <Button variant="outline" onClick={() => navigate('/customers')}>
            {t('customers.back')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const tickets = [...(customer.tickets ?? [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )
  const stats = {
    total: tickets.length,
    open: tickets.filter((tk) => !['Done', 'Cancelled'].includes(tk.status)).length,
    done: tickets.filter((tk) => tk.status === 'Done').length,
    overdue: tickets.filter(isOverdue).length,
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/customers')}
        className="ltr:-ml-2 rtl:-mr-2"
      >
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
        {t('customers.back')}
      </Button>

      <Card className="overflow-hidden">
        <div className="brand-gradient h-20" aria-hidden="true" />
        <CardContent className="-mt-10 space-y-6 p-5 sm:p-6 sm:pt-0">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <Avatar className="h-20 w-20 border-4 border-card shadow-soft">
                <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">
                  {getInitials(customer.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
                  <CustomerStatusBadge status={customer.status} />
                </div>
                {customer.company && (
                  <p className="text-sm text-muted-foreground">{customer.company}</p>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" />
              {t('customers.edit')}
            </Button>
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Contact icon={User} label={t('customers.contactPerson')}>
              {customer.contact_person}
            </Contact>
            <Contact icon={Phone} label={t('customers.phone')} ltr>
              {customer.phone && (
                <a href={`tel:${customer.phone}`} className="text-primary hover:underline">
                  {customer.phone}
                </a>
              )}
            </Contact>
            <Contact icon={Mail} label={t('customers.email')} ltr>
              {customer.email && (
                <a href={`mailto:${customer.email}`} className="text-primary hover:underline">
                  {customer.email}
                </a>
              )}
            </Contact>
            <Contact icon={MapPin} label={t('customers.city')}>
              {[customer.city, customer.address].filter(Boolean).join(' — ')}
            </Contact>
          </dl>

          {customer.notes && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs font-semibold text-muted-foreground">{t('customers.notes')}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{customer.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t('customers.ticketCount')} value={stats.total} />
        <Stat label={t('dashboard.open')} value={stats.open} />
        <Stat label={t('dashboard.done')} value={stats.done} />
        <Stat label={t('dashboard.overdue')} value={stats.overdue} alert />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('customers.ticketsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketTable
            tickets={tickets}
            showCustomer={false}
            personColumn={{
              header: t('dashboard.assignedTo'),
              getName: (row) => row.assigned_profile?.name,
            }}
            emptyState={<p className="text-sm text-muted-foreground">{t('customers.noTickets')}</p>}
          />
        </CardContent>
      </Card>

      <CustomerFormDialog open={editing} onOpenChange={setEditing} customer={customer} />
    </div>
  )
}
