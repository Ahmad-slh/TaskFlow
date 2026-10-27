import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
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

// Filters that live inside the "Filters" popover (search + status stay visible).
const ADVANCED = ['priority', 'type', 'customer', 'person', 'dueFrom', 'dueTo', 'overdueOnly']

/** Unique { id, name } options taken from a list of tickets. */
export function collectOptions(tickets, getOption) {
  const map = new Map()
  for (const ticket of tickets) {
    const option = getOption(ticket)
    if (option?.id && !map.has(option.id)) map.set(option.id, option)
  }
  return [...map.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)))
}

function FilterSelect({ label, value, onChange, children }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </div>
  )
}

/**
 * @param tickets       the unfiltered tickets (used to build the customer / person options)
 * @param personLabel   label for the "person" filter (e.g. Assigned To / Created By)
 * @param getPerson     (ticket) => { id, name } | null — the person this page lists
 */
export function TicketFilters({ filters, onChange, tickets = [], personLabel, getPerson }) {
  const { t } = useTranslation()
  const [searchInput, setSearchInput] = useState(filters.search)
  const latest = useRef(filters)
  latest.current = filters

  // Debounced push of the search box into the filters (and URL).
  useEffect(() => {
    if (searchInput === latest.current.search) return
    const handle = setTimeout(() => {
      onChange({ ...latest.current, search: searchInput })
    }, 300)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  // Keep the box in sync when filters change from outside (clear, back button).
  useEffect(() => {
    setSearchInput(filters.search)
  }, [filters.search])

  const customers = useMemo(() => collectOptions(tickets, (tk) => tk.customer), [tickets])
  const people = useMemo(
    () => (getPerson ? collectOptions(tickets, getPerson) : []),
    [tickets, getPerson]
  )

  const advancedActive = ADVANCED.filter((key) => filters[key] !== DEFAULT_FILTERS[key]).length
  const anyActive =
    advancedActive > 0 || filters.status !== 'All' || filters.search !== ''

  function setField(field, value) {
    onChange({ ...filters, [field]: value })
  }

  function clearAll() {
    setSearchInput('')
    onChange({ ...DEFAULT_FILTERS })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:min-w-[220px]">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t('filters.searchPlaceholder')}
          aria-label={t('filters.searchPlaceholder')}
          className="ps-9"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <Select value={filters.status} onValueChange={(v) => setField('status', v)}>
        <SelectTrigger className="w-full sm:w-[170px]" aria-label={t('filters.status')}>
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

      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative w-full sm:w-auto">
            <SlidersHorizontal className="h-4 w-4" />
            {t('filters.more')}
            {advancedActive > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                {advancedActive}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(92vw,22rem)] space-y-4">
          <FilterSelect
            label={t('filters.priority')}
            value={filters.priority}
            onChange={(v) => setField('priority', v)}
          >
            {PRIORITY_OPTIONS.map((p) => (
              <SelectItem key={p} value={p}>
                {p === 'All' ? t('filters.allPriorities') : t(`priority.${p}`)}
              </SelectItem>
            ))}
          </FilterSelect>

          <FilterSelect
            label={t('filters.type')}
            value={filters.type}
            onChange={(v) => setField('type', v)}
          >
            {TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt === 'All' ? t('filters.allTypes') : t(`type.${opt}`)}
              </SelectItem>
            ))}
          </FilterSelect>

          {customers.length > 0 && (
            <FilterSelect
              label={t('filters.customer')}
              value={filters.customer}
              onChange={(v) => setField('customer', v)}
            >
              <SelectItem value="All">{t('filters.allCustomers')}</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </FilterSelect>
          )}

          {people.length > 0 && (
            <FilterSelect
              label={personLabel || t('filters.person')}
              value={filters.person}
              onChange={(v) => setField('person', v)}
            >
              <SelectItem value="All">{t('filters.allPeople')}</SelectItem>
              {people.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </FilterSelect>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="due-from" className="text-xs text-muted-foreground">
                {t('filters.dueFrom')}
              </Label>
              <Input
                id="due-from"
                type="date"
                value={filters.dueFrom}
                onChange={(e) => setField('dueFrom', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due-to" className="text-xs text-muted-foreground">
                {t('filters.dueTo')}
              </Label>
              <Input
                id="due-to"
                type="date"
                value={filters.dueTo}
                onChange={(e) => setField('dueTo', e.target.value)}
              />
            </div>
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
        </PopoverContent>
      </Popover>

      {anyActive && (
        <Button variant="ghost" onClick={clearAll} className="text-muted-foreground">
          <X className="h-4 w-4" />
          {t('filters.clear')}
        </Button>
      )}
    </div>
  )
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
