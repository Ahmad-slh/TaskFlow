import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TicketFormFields, ticketSchema } from '@/components/tickets/TicketFormFields'
import { useCreateTicket } from '@/hooks/useTickets'
import { useTranslation } from '@/context/LanguageContext'
import { toast } from '@/components/ui/sonner'
import { friendlyError } from '@/lib/utils'

export default function CreateTicket() {
  const navigate = useNavigate()
  const createTicket = useCreateTicket()
  const { t } = useTranslation()

  const form = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: '',
      description: '',
      type: undefined,
      priority: undefined,
      assigned_to: '',
      customer_id: '',
      due_date: '',
      estimated_hours: '',
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
        <p className="text-sm text-muted-foreground">{t('createTicket.subtitle')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('createTicket.detailsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-5">
            <TicketFormFields form={form} />

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
