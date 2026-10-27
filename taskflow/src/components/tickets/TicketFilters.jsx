import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTranslation } from '@/context/LanguageContext'
import { isOverdue } from '@/lib/utils'

const STATUS_OPTIONS = ['All', 'Open', 'In Progress', 'Done', 'Cancelled', 'Reopened']
const PRIORITY_OPTIONS = ['All', 'Low', 'Medium', 'High', 'Critical']
const TYPE_OPTIONS = ['All', 'Bug', 'Task', 'Request']

/** Unique { id, name } options taken from a list of tickets. */
export function collectOptions(tickets, getOption) {
  const map = new Map()
  for (const ticket of tickets) {
    const option = getOption(ticket)
    if (option?.id && !map.has(option.id)) map.set(option.id, option)
  }
  return [...map.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)))
}

/**
 * @param tickets       the unfiltered tickets (used to build the customer / person options)
 * @param personLabel   label for the "person" filter (e.g. Assigned To / Created By)
 * @param getPerson     (ticket) => { id, name } | null — the person this page lists
 */
export function TicketFilters({ filters, onChange, tickets = [], personLabel, getPerson }) {
  const { t } = useTranslation()
  // Local search value for debouncing.
  const [searchInput, setSearchInput] = useState(filters.search)

  useEffect(() => {
    const handle = setTimeout(() => {
      onChange({ ...filters, search: searchInput })
    }, 300)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const customers = useMemo(() => collectOptions(tickets, (tk) => tk.customer), [tickets])
  const people = useMemo(
    () => (getPerson ? collectOptions(tickets, getPerson) : []),
    [tickets, getPerson]
  )

  function setField(field, value) {
    onChange({ ...filters, [field]: value })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:min-w-[200px]">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('filters.searchPlaceholder')}
            className="ps-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <Select value={filters.status} onValueChange={(v) => setField('status', v)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder={t('filters.status')} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                {s === 'All' ? t('filters.allStatuses') : t(`status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.priority} onValueChange={(v) => setField('priority', v)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder={t('filters.priority')} />
          </SelectTrigger>
          <SelectContent>
            {PRIORITY_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {p === 'All' ? t('filters.allPriorities') : t(`priority.${p}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.type} onValueChange={(v) => setField('type', v)}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder={t('filters.type')} />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === 'All' ? t('filters.allTypes') : t(`type.${opt}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        {customers.length > 0 && (
          <Select value={filters.customer} onValueChange={(v) => setField('customer', v)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={t('filters.customer')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t('filters.allCustomers')}</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {people.length > 0 && (
          <Select value={filters.person} onValueChange={(v) => setField('person', v)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder={personLabel || t('filters.person')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">{t('filters.allPeople')}</SelectItem>
              {people.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center gap-2">
          <Label htmlFor="due-from" className="text-xs text-muted-foreground">
            {t('filters.dueFrom')}
          </Label>
          <Input
            id="due-from"
            type="date"
            className="w-[150px]"
            value={filters.dueFrom}
            onChange={(e) => setField('dueFrom', e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="due-to" className="text-xs text-muted-foreground">
            {t('filters.dueTo')}
          </Label>
          <Input
            id="due-to"
            type="date"
            className="w-[150px]"
            value={filters.dueTo}
            onChange={(e) => setField('dueTo', e.target.value)}
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input accent-primary"
            checked={filters.overdueOnly}
            onChange={(e) => setField('overdueOnly', e.target.checked)}
          />
          {t('filters.overdueOnly')}
        </label>
      </div>
    </div>
  )
}

export const DEFAULT_FILTERS = {
  search: '',
  status: 'All',
  priority: 'All',
  type: 'All',
  customer: 'All',
  person: 'All',
  dueFrom: '',
  dueTo: '',
  overdueOnly: false,
}

export function applyTicketFilters(tickets, filters) {
  const search = filters.search?.toLowerCase()
  return tickets.filter((t) => {
    if (filters.status !== 'All' && t.status !== filters.status) return false
    if (filters.priority !== 'All' && t.priority !== filters.priority) return false
    if (filters.type !== 'All' && t.type !== filters.type) return false
    if (filters.customer !== 'All' && t.customer_id !== filters.customer) return false
    if (
      filters.person !== 'All' &&
      t.assigned_to !== filters.person &&
      t.created_by !== filters.person
    )
      return false
    if (filters.overdueOnly && !isOverdue(t)) return false
    if (filters.dueFrom && (!t.due_date || t.due_date < filters.dueFrom)) return false
    if (filters.dueTo && (!t.due_date || t.due_date > filters.dueTo)) return false
    if (search) {
      const haystack = [t.title, t.ticket_number, t.customer?.name].join(' ').toLowerCase()
      if (!haystack.includes(search)) return false
    }
    return true
  })
}
