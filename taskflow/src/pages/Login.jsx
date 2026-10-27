import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Ticket,
  Loader2,
  Eye,
  EyeOff,
  Languages,
  Moon,
  Sun,
  Zap,
  Users,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { useTheme } from '@/context/ThemeContext'
import { toast } from '@/components/ui/sonner'
import { friendlyError } from '@/lib/utils'

const schema = z.object({
  email: z.string().min(1, 'login.emailRequired').email('login.emailInvalid'),
  password: z.string().min(8, 'login.passwordMin'),
})

const FEATURES = [
  { icon: Zap, key: 'login.feature1' },
  { icon: Users, key: 'login.feature2' },
  { icon: BarChart3, key: 'login.feature3' },
]

export default function Login() {
  const { signIn } = useAuth()
  const { t, toggleLanguage } = useTranslation()
  const { resolved, toggleTheme } = useTheme()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(values) {
    try {
      await signIn(values.email, values.password)
      // Redirect is handled by the route guards once the session updates.
    } catch (error) {
      toast.error(friendlyError(error, t('login.failed')))
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="surface-gradient relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute -end-24 -top-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -start-16 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-3">
          <div className="brand-gradient flex h-11 w-11 items-center justify-center rounded-xl shadow-lg shadow-primary/40">
            <Ticket className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">{t('login.appName')}</span>
        </div>

        <div className="relative space-y-8">
          <div className="space-y-3">
            <h2 className="text-4xl font-bold leading-tight tracking-tight">
              {t('login.heroTitle')}
            </h2>
            <p className="max-w-md text-lg text-white/70">{t('login.tagline')}</p>
          </div>
          <ul className="space-y-4">
            {FEATURES.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-center gap-3 text-white/85">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/50">{t('sidebar.tagline')}</p>
      </aside>

      {/* Form */}
      <main className="relative flex items-center justify-center px-4 py-12">
        <div className="absolute end-4 top-4 flex items-center gap-1">
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
            {t('language.switchTo')}
          </Button>
        </div>

        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="brand-gradient mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg shadow-primary/30">
              <Ticket className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold">{t('login.appName')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('login.tagline')}</p>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-soft sm:p-8">
            <h2 className="text-2xl font-bold tracking-tight">{t('login.title')}</h2>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">{t('login.subtitle')}</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">{t('login.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  placeholder={t('login.emailPlaceholder')}
                  autoComplete="email"
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                />
                {errors.email && (
                  <p id="email-error" role="alert" className="text-sm text-destructive">
                    {t(errors.email.message)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('login.password')}</Label>
                <div className="relative" dir="ltr">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    dir="ltr"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="pe-11"
                    aria-invalid={errors.password ? true : undefined}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={t(showPassword ? 'login.hidePassword' : 'login.showPassword')}
                    aria-pressed={showPassword}
                    className="absolute end-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" role="alert" className="text-sm text-destructive">
                    {t(errors.password.message)}
                  </p>
                )}
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('login.submit')}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
