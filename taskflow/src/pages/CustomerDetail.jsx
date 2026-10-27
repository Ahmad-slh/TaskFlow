import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { TicketTable } from '@/components/tickets/TicketTable'
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog'
import { CustomerStatusBadge } from '@/components/customers/CustomerStatusBadge'
import { useCustomer } from '@/hooks/useCustomers'
import { useTranslation } from '@/context/LanguageContext'

function Info({ label, value, ltr }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium" dir={ltr ? 'ltr' : undefined}>
        {value || '—'}
      </dd>
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{customer.name}</h1>
          <CustomerStatusBadge status={customer.status} />
        </div>
        <Button variant="outline" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" />
          {t('customers.edit')}
        </Button>
      </div>

      <Card>
        <CardContent className="p-5">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Info label={t('customers.company')} value={customer.company} />
            <Info label={t('customers.contactPerson')} value={customer.contact_person} />
            <Info label={t('customers.phone')} value={customer.phone} ltr />
            <Info label={t('customers.email')} value={customer.email} ltr />
            <Info label={t('customers.city')} value={customer.city} />
            <Info label={t('customers.address')} value={customer.address} />
          </dl>
          {customer.notes && (
            <div className="mt-4 border-t pt-4">
              <p className="text-xs text-muted-foreground">{t('customers.notes')}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{customer.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

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
            emptyState={
              <p className="text-sm text-muted-foreground">{t('customers.noTickets')}</p>
            }
          />
        </CardContent>
      </Card>

      <CustomerFormDialog open={editing} onOpenChange={setEditing} customer={customer} />
    </div>
  )
}
