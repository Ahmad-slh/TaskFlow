import { useState } from 'react'
import { Bell, Menu, LogOut, User, Languages } from 'lucide-react'
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
import { useNotifications } from '@/hooks/useNotifications'
import { getInitials } from '@/lib/utils'

export function TopBar({ onMenuClick }) {
  const { profile, signOut } = useAuth()
  const { t, toggleLanguage } = useTranslation()
  const { data: notifications = [] } = useNotifications()
  const [panelOpen, setPanelOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-card px-4 lg:px-6">
      <button
        className="text-muted-foreground lg:hidden"
        onClick={onMenuClick}
        aria-label={t('topbar.openMenu')}
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="ms-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={toggleLanguage}
          aria-label={t('language.toggleAria')}
        >
          <Languages className="h-4 w-4" />
          {t('language.switchTo')}
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
            <button className="flex items-center gap-2 rounded-full outline-none">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary">
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
            <DropdownMenuItem disabled>
              <User className="h-4 w-4" />
              {t('topbar.profile')}
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
