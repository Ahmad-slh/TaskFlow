import { useEffect, useState } from 'react'

/**
 * Re-renders the caller on an interval; returns the current epoch ms.
 * Used to keep "live" elapsed-time labels (e.g. a ticket's working duration)
 * ticking without a manual refresh.
 */
export function useNow(intervalMs = 60000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
