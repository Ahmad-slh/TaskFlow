import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STATUS_OPTIONS = ['All', 'Open', 'In Progress', 'Done', 'Cancelled', 'Reopened']
const PRIORITY_OPTIONS = ['All', 'Low', 'Medium', 'High']
const TYPE_OPTIONS = ['All', 'Bug', 'Task', 'Request']

export function TicketFilters({ filters, onChange }) {
  // Local search value for debouncing.
  const [searchInput, setSearchInput] = useState(filters.search)

  useEffect(() => {
    const handle = setTimeout(() => {
      onChange({ ...filters, search: searchInput })
    }, 300)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  function setField(field, value) {
    onChange({ ...filters, [field]: value })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by title…"
          className="pl-9"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <Select value={filters.status} onValueChange={(v) => setField('status', v)}>
        <SelectTrigger className="w-full sm:w-[160px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((s) => (
            <SelectItem key={s} value={s}>
              {s === 'All' ? 'All Statuses' : s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.priority} onValueChange={(v) => setField('priority', v)}>
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          {PRIORITY_OPTIONS.map((p) => (
            <SelectItem key={p} value={p}>
              {p === 'All' ? 'All Priorities' : p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.type} onValueChange={(v) => setField('type', v)}>
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          {TYPE_OPTIONS.map((t) => (
            <SelectItem key={t} value={t}>
              {t === 'All' ? 'All Types' : t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export const DEFAULT_FILTERS = {
  search: '',
  status: 'All',
  priority: 'All',
  type: 'All',
}

export function applyTicketFilters(tickets, filters) {
  return tickets.filter((t) => {
    if (filters.status !== 'All' && t.status !== filters.status) return false
    if (filters.priority !== 'All' && t.priority !== filters.priority) return false
    if (filters.type !== 'All' && t.type !== filters.type) return false
    if (filters.search && !t.title?.toLowerCase().includes(filters.search.toLowerCase()))
      return false
    return true
  })
}
