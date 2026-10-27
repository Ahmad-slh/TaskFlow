import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Monitor, Moon, Sun, Languages, Mail, CalendarDays, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { PageHeader } from '@/components/ui/page-header'
import { Pill } from '@/components/ui/pill'
import { toast } from '@/components/ui/sonner'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { useTheme } from '@/context/ThemeContext'
import { useChangePassword, useUpdateProfile } from '@/hooks/useProfile'
import { useAssignedTickets, useMyTickets } from '@/hooks/useTickets'
import { cn, formatDate, friendlyError, getInitials, isOverdue } from '@/lib/utils'

const nameSchema = z.object({
  name: z.string().trim().min(2, 'profile.nameMin').max(60, 'profile.nameMax'),
})

const passwordSchema = z
  .object({
    password: z.string().min(8, 'login.passwordMin'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'profile.passwordMismatch',
  })

function Segmented({ label, value, onChange, options }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg bg-muted p-1">
        {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => {
          const selected = value === optionValue
          return (
            <button
              key={optionValue}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(optionValue)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                selected
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
              {optionLabel}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  )
}

export default function Profile() {
  const { user, profile, role } = useAuth()
  const { t, language, setLanguage } = useTranslation()
  const { theme, setTheme } = useTheme()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()

  const isDeveloper = role === 'developer'
  const mine = useMyTickets()
  const assigned = useAssignedTickets()
  const tickets = (isDeveloper ? assigned.data : mine.data) ?? []
  const stats = {
    total: tickets.length,
    open: tickets.filter((tk) => !['Done', 'Cancelled'].includes(tk.status)).length,
    done: tickets.filter((tk) => tk.status === 'Done').length,
    overdue: tickets.filter(isOverdue).length,
  }

  const nameForm = useForm({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: profile?.name ?? '' },
  })
  useEffect(() => {
    nameForm.reset({ name: profile?.name ?? '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.name])

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', confirm: '' },
  })

  async function saveName(values) {
    try {
      await updateProfile.mutateAsync({ name: values.name })
      toast.success(t('profile.nameSaved'))
    } catch (error) {
      toast.error(friendlyError(error, t('profile.nameFailed')))
    }
  }

  async function savePassword(values) {
    try {
      await changePassword.mutateAsync({ password: values.password })
      passwordForm.reset()
      toast.success(t('profile.passwordSaved'))
    } catch (error) {
      toast.error(friendlyError(error, t('profile.passwordFailed')))
    }
  }

  const nameErr = nameForm.formState.errors.name
  const pwErr = passwordForm.formState.errors

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t('profile.title')} description={t('profile.subtitle')} />

      <Card>
        <CardContent className="flex flex-wrap items-center gap-5 p-5 sm:p-6">
          <Avatar className="h-20 w-20">
            <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">
              {getInitials(profile?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">{profile?.name || '—'}</h2>
              {role && (
                <Pill tone="blue" icon={ShieldCheck}>
                  {t(`roles.${role}`)}
                </Pill>
              )}
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground" dir="ltr">
              <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{user?.email}</span>
            </p>
            {profile?.created_at && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                {t('profile.memberSince', { date: formatDate(profile.created_at) })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [t('profile.statTotal'), stats.total, false],
          [t('dashboard.open'), stats.open, false],
          [t('dashboard.done'), stats.done, false],
          [t('dashboard.overdue'), stats.overdue, true],
        ].map(([label, value, alert]) => (
          <div
            key={label}
            className="rounded-xl border bg-card px-4 py-3 text-center shadow-soft"
          >
            <p className={cn('text-2xl font-bold', alert && value > 0 && 'text-destructive')}>
              {value}
            </p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('profile.nameTitle')}</CardTitle>
          <CardDescription>{t('profile.nameHelp')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={nameForm.handleSubmit(saveName)} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="profile-name">{t('profile.name')}</Label>
              <Input
                id="profile-name"
                autoComplete="name"
                aria-invalid={nameErr ? true : undefined}
                aria-describedby={nameErr ? 'profile-name-error' : undefined}
                {...nameForm.register('name')}
              />
              <FieldError id="profile-name-error" message={nameErr && t(nameErr.message)} />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateProfile.isPending || !nameForm.formState.isDirty}
              >
                {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('profile.save')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('profile.preferences')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Segmented
            label={t('profile.language')}
            value={language}
            onChange={setLanguage}
            options={[
              { value: 'en', label: 'English', icon: Languages },
              { value: 'ar', label: 'العربية', icon: Languages },
            ]}
          />
          <Segmented
            label={t('theme.title')}
            value={theme}
            onChange={setTheme}
            options={[
              { value: 'light', label: t('theme.light'), icon: Sun },
              { value: 'dark', label: t('theme.dark'), icon: Moon },
              { value: 'system', label: t('theme.system'), icon: Monitor },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('profile.passwordTitle')}</CardTitle>
          <CardDescription>{t('profile.passwordHelp')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(savePassword)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">{t('profile.newPassword')}</Label>
                <Input
                  id="new-password"
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  aria-invalid={pwErr.password ? true : undefined}
                  aria-describedby={pwErr.password ? 'new-password-error' : undefined}
                  {...passwordForm.register('password')}
                />
                <FieldError
                  id="new-password-error"
                  message={pwErr.password && t(pwErr.password.message)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('profile.confirmPassword')}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  dir="ltr"
                  autoComplete="new-password"
                  aria-invalid={pwErr.confirm ? true : undefined}
                  aria-describedby={pwErr.confirm ? 'confirm-password-error' : undefined}
                  {...passwordForm.register('confirm')}
                />
                <FieldError
                  id="confirm-password-error"
                  message={pwErr.confirm && t(pwErr.confirm.message)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={changePassword.isPending}>
                {changePassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('profile.changePassword')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
