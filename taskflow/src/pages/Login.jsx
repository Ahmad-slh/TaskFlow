import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Ticket, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'
import { toast } from '@/components/ui/sonner'
import { friendlyError } from '@/lib/utils'

const schema = z.object({
  email: z.string().min(1, 'login.emailRequired').email('login.emailInvalid'),
  password: z.string().min(8, 'login.passwordMin'),
})

export default function Login() {
  const { signIn } = useAuth()
  const { t } = useTranslation()
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
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Ticket className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-white">{t('login.appName')}</h1>
          <p className="mt-1 text-sm text-sidebar-foreground">
            {t('login.tagline')}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-6 shadow-xl">
          <h2 className="mb-1 text-lg font-semibold">{t('login.title')}</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            {t('login.subtitle')}
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('login.emailPlaceholder')}
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{t(errors.email.message)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('login.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{t(errors.password.message)}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('login.submit')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
