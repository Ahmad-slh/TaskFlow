import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Download, Eye, Pencil, Plus, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
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

const ticketCount = (c) => c.tickets?.[0]?.count ?? 0

export default function Customers() {
  const { data: customers = [], isLoading } = useCustomers()
  const { t } = useTranslation()
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t('customers.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('customers.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="h-4 w-4" />
            {t('table.exportCsv')}
          </Button>
          <Button onClick={() => setDialog({ open: true, customer: null })}>
            <Plus className="h-4 w-4" />
            {t('customers.add')}
          </Button>
        </div>
      </div>

      {hasNone ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t('customers.empty')}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:min-w-[200px]">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="ps-9"
                placeholder={t('customers.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">{t('customers.allStatuses')}</SelectItem>
                <SelectItem value="Active">{t('customerStatus.Active')}</SelectItem>
                <SelectItem value="Inactive">{t('customerStatus.Inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-card">
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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full max-w-[120px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-10 text-center text-muted-foreground">
                      {t('customers.noMatches')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.company || '—'}</TableCell>
                      <TableCell className="text-muted-foreground" dir="ltr">
                        <span className="inline-block">{c.phone || '—'}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.city || '—'}</TableCell>
                      <TableCell>
                        <CustomerStatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ticketCount(c)}</TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link to={`/customers/${c.id}`}>
                              <Eye className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                              {t('customers.view')}
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDialog({ open: true, customer: c })}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">{t('customers.edit')}</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
