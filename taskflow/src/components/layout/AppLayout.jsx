import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { useNotificationsRealtime } from '@/hooks/useNotifications'
import { useTicketsRealtime } from '@/hooks/useTickets'
import { CommandPalette } from '@/components/command/CommandPalette'

const COLLAPSE_KEY = 'sidebar-collapsed'

function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { pathname } = useLocation()

  // Subscribe to realtime notifications / tickets for the whole authenticated app.
  useNotificationsRealtime()
  useTicketsRealtime()

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      try {
        window.localStorage.setItem(COLLAPSE_KEY, prev ? '0' : '1')
      } catch {
        // Persisting the preference is best-effort.
      }
      return !prev
    })
  }, [])

  // Global Ctrl/⌘ + K opens the command palette.
  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} collapsed={collapsed} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          onSearchClick={() => setPaletteOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
        <main className="flex-1 p-4 lg:p-8">
          <div key={pathname} className="mx-auto w-full max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  )
}
