import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateTicket } from '@/hooks/useTickets'
import { useDevelopers } from '@/hooks/useProfiles'
import { useTranslation } from '@/context/LanguageContext'
import { toast } from '@/components/ui/sonner'
import { friendlyError } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(5, 'createTicket.titleMin'),
  description: z.string().min(10, 'createTicket.descriptionMin'),
  type: z.enum(['Bug', 'Task', 'Request'], { required_error: 'createTicket.typeRequired' }),
  priority: z.enum(['Low', 'Medium', 'High'], { required_error: 'createTicket.priorityRequired' }),
  assigned_to: z.string().min(1, 'createTicket.assigneeRequired'),
})

export default function CreateTicket() {
  const navigate = useNavigate()
  const createTicket = useCreateTicket()
  const { data: developers = [], isLoading: loadingDevs } = useDevelopers()
  const { t } = useTranslation()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      type: undefined,
      priority: undefined,
      assigned_to: '',
    },
  })

  async function onSubmit(values) {
    try {
      const ticket = await createTicket.mutateAsync(values)
      toast.success(t('createTicket.success', { number: ticket.ticket_number }))
      navigate('/my-tickets')
    } catch (error) {
      console.error('Create ticket failed:', error)
      toast.error(friendlyError(error, t('createTicket.failed')))
    }
  }

  function onInvalid() {
    toast.error(t('createTicket.invalid'))
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t('createTicket.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('createTicket.subtitle')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('createTicket.detailsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="title">{t('createTicket.ticketTitle')}</Label>
              <Input
                id="title"
                placeholder={t('createTicket.titlePlaceholder')}
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{t(errors.title.message)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('createTicket.description')}</Label>
              <Textarea
                id="description"
                rows={5}
                placeholder={t('createTicket.descriptionPlaceholder')}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{t(errors.description.message)}</p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('createTicket.type')}</Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('createTicket.selectType')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bug">{t('type.Bug')}</SelectItem>
                        <SelectItem value="Task">{t('type.Task')}</SelectItem>
                        <SelectItem value="Request">{t('type.Request')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-sm text-destructive">{t(errors.type.message)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>{t('createTicket.priority')}</Label>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('createTicket.selectPriority')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">{t('priority.Low')}</SelectItem>
                        <SelectItem value="Medium">{t('priority.Medium')}</SelectItem>
                        <SelectItem value="High">{t('priority.High')}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.priority && (
                  <p className="text-sm text-destructive">{t(errors.priority.message)}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('createTicket.assignTo')}</Label>
              <Controller
                control={control}
                name="assigned_to"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingDevs
                            ? t('createTicket.loadingDevelopers')
                            : t('createTicket.selectDeveloper')
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {developers.map((dev) => (
                        <SelectItem key={dev.id} value={dev.id}>
                          {dev.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.assigned_to && (
                <p className="text-sm text-destructive">{t(errors.assigned_to.message)}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={createTicket.isPending}
              >
                {t('createTicket.cancel')}
              </Button>
              <Button type="submit" disabled={createTicket.isPending}>
                {createTicket.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('createTicket.submit')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
