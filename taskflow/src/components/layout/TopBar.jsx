import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  Menu,
  LogOut,
  User,
  Languages,
  Search,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationPanel } from '@/components/notifications/NotificationPanel'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { useTheme } from '@/context/ThemeContext'
import { useNotifications } from '@/hooks/useNotifications'
import { getInitials } from '@/lib/utils'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export function TopBar({ onMenuClick, onSearchClick, collapsed, onToggleCollapse }) {
  const { profile, signOut } = useAuth()
  const { t, toggleLanguage } = useTranslation()
  const { resolved, toggleTheme } = useTheme()
  const { data: notifications = [] } = useNotifications()
  const [panelOpen, setPanelOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const CollapseIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-card/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/70 lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onMenuClick}
        aria-label={t('topbar.openMenu')}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={onToggleCollapse}
        aria-label={t(collapsed ? 'sidebar.expand' : 'sidebar.collapse')}
        title={t(collapsed ? 'sidebar.expand' : 'sidebar.collapse')}
      >
        <CollapseIcon className="h-5 w-5 rtl:-scale-x-100" />
      </Button>

      <button
        type="button"
        onClick={onSearchClick}
        aria-label={t('topbar.search')}
        className="group flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg border bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:max-w-sm sm:flex-none sm:basis-80"
      >
        <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate text-start">{t('topbar.search')}</span>
        <kbd
          dir="ltr"
          className="hidden rounded border bg-muted px-1.5 py-0.5 font-sans text-[11px] font-medium sm:inline-block"
        >
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </button>

      <div className="ms-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={t('theme.toggle')}
          title={t('theme.toggle')}
        >
          {resolved === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={toggleLanguage}
          aria-label={t('language.toggleAria')}
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{t('language.switchTo')}</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setPanelOpen(true)}
          aria-label={t('topbar.notifications')}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="ms-1 flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={profile?.name}
            >
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 font-semibold text-primary">
                  {getInitials(profile?.name)}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{profile?.name}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {profile?.role ? t(`roles.${profile.role}`) : ''}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile">
                <User className="h-4 w-4" />
                {t('topbar.profile')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={signOut} className="text-destructive">
              <LogOut className="h-4 w-4" />
              {t('topbar.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <NotificationPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </header>
  )
}
