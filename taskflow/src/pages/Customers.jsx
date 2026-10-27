import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Download, Eye, Pencil, Phone, Plus, Search, SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog'
import { CustomerStatusBadge } from '@/components/customers/CustomerStatusBadge'
import { useCustomers } from '@/hooks/useCustomers'
import { useTranslation } from '@/context/LanguageContext'
import { downloadCsv } from '@/lib/csv'
import { getInitials } from '@/lib/utils'

const ticketCount = (c) => c.tickets?.[0]?.count ?? 0

export default function Customers() {
  const { data: customers = [], isLoading } = useCustomers()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const [dialog, setDialog] = useState({ open: false, customer: null })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return customers.filter((c) => {
      if (status !== 'All' && c.status !== status) return false
      if (!q) return true
      return [c.name, c.company, c.phone, c.email, c.city, c.contact_person].some((v) =>
        v?.toLowerCase().includes(q)
      )
    })
  }, [customers, search, status])

  function exportCsv() {
    downloadCsv('customers.csv', filtered, [
      { header: t('customers.name'), value: (c) => c.name },
      { header: t('customers.company'), value: (c) => c.company },
      { header: t('customers.phone'), value: (c) => c.phone },
      { header: t('customers.email'), value: (c) => c.email },
      { header: t('customers.city'), value: (c) => c.city },
      { header: t('customers.address'), value: (c) => c.address },
      { header: t('customers.contactPerson'), value: (c) => c.contact_person },
      { header: t('customers.status'), value: (c) => t(`customerStatus.${c.status}`) },
      { header: t('customers.ticketCount'), value: ticketCount },
    ])
  }

  const hasNone = !isLoading && customers.length === 0
  const addButton = (
    <Button onClick={() => setDialog({ open: true, customer: null })}>
      <Plus className="h-4 w-4" />
      {t('customers.add')}
    </Button>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('customers.title')}
        description={t('customers.subtitle')}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{t('table.exportCsv')}</span>
            </Button>
            {addButton}
          </>
        }
      />

      {hasNone ? (
        <EmptyState
          icon={Building2}
          title={t('customers.empty')}
          className="bg-card"
          action={addButton}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:min-w-[220px]">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                className="ps-9"
                placeholder={t('customers.searchPlaceholder')}
                aria-label={t('customers.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-[170px]" aria-label={t('customers.status')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">{t('customers.allStatuses')}</SelectItem>
                <SelectItem value="Active">{t('customerStatus.Active')}</SelectItem>
                <SelectItem value="Inactive">{t('customerStatus.Inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={SearchX} title={t('customers.noMatches')} className="bg-card" />
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="space-y-3 md:hidden">
                {filtered.map((c) => (
                  <div
                    key={c.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => navigate(`/customers/${c.id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/customers/${c.id}`)}
                    className="cursor-pointer space-y-3 rounded-xl border bg-card p-4 shadow-soft transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                            {getInitials(c.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{c.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {[c.company, c.city].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </div>
                      </div>
                      <CustomerStatusBadge status={c.status} />
                    </div>
                    <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                      {c.phone ? (
                        <a
                          href={`tel:${c.phone}`}
                          dir="ltr"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {c.phone}
                        </a>
                      ) : (
                        <span>—</span>
                      )}
                      <span>
                        {t('customers.ticketCount')}: {ticketCount(c)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={t('customers.edit')}
                        onClick={(e) => {
                          e.stopPropagation()
                          setDialog({ open: true, customer: c })
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: table */}
              <div className="hidden overflow-hidden rounded-xl border bg-card shadow-soft md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('customers.name')}</TableHead>
                      <TableHead>{t('customers.company')}</TableHead>
                      <TableHead>{t('customers.phone')}</TableHead>
                      <TableHead>{t('customers.city')}</TableHead>
                      <TableHead>{t('customers.status')}</TableHead>
                      <TableHead>{t('customers.ticketCount')}</TableHead>
                      <TableHead className="text-end">{t('table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer"
                        onClick={() => navigate(`/customers/${c.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                {getInitials(c.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{c.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{c.company || '—'}</TableCell>
                        <TableCell className="text-muted-foreground" dir="ltr">
                          <span className="inline-block">{c.phone || '—'}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{c.city || '—'}</TableCell>
                        <TableCell>
                          <CustomerStatusBadge status={c.status} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{ticketCount(c)}</TableCell>
                        <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                              <Link to={`/customers/${c.id}`}>
                                <Eye className="h-4 w-4" />
                                {t('customers.view')}
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9"
                              aria-label={t('customers.edit')}
                              onClick={() => setDialog({ open: true, customer: c })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </>
      )}

      <CustomerFormDialog
        open={dialog.open}
        customer={dialog.customer}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
    </div>
  )
}
