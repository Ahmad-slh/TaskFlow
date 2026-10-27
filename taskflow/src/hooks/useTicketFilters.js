import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DEFAULT_FILTERS } from '@/components/tickets/TicketFilters'

// filter field -> URL query param
const PARAMS = {
  search: 'q',
  status: 'status',
  priority: 'priority',
  type: 'type',
  customer: 'customer',
  person: 'person',
  dueFrom: 'from',
  dueTo: 'to',
  overdueOnly: 'overdue',
}

/**
 * Ticket filters + table/board view, stored in the URL so they survive reloads,
 * can be shared as links and work with the browser back button.
 */
export function useTicketFilters() {
  const [params, setParams] = useSearchParams()

  const filters = useMemo(() => {
    const result = { ...DEFAULT_FILTERS }
    for (const [field, param] of Object.entries(PARAMS)) {
      const value = params.get(param)
      if (value === null) continue
      result[field] = field === 'overdueOnly' ? value === '1' : value
    }
    return result
  }, [params])

  const setFilters = useCallback(
    (next) => {
      setParams(
        (prev) => {
          const out = new URLSearchParams(prev)
          for (const [field, param] of Object.entries(PARAMS)) {
            const value = next[field]
            const isDefault = value === DEFAULT_FILTERS[field]
            if (isDefault || value === '' || value === false) out.delete(param)
            else out.set(param, field === 'overdueOnly' ? '1' : value)
          }
          return out
        },
        { replace: true }
      )
    },
    [setParams]
  )

  const view = params.get('view') === 'board' ? 'board' : 'table'
  const setView = useCallback(
    (next) => {
      setParams(
        (prev) => {
          const out = new URLSearchParams(prev)
          if (next === 'board') out.set('view', 'board')
          else out.delete('view')
          return out
        },
        { replace: true }
      )
    },
    [setParams]
  )

  return { filters, setFilters, view, setView }
}
