import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TicketFormFields, ticketSchema } from '@/components/tickets/TicketFormFields'
import { useUpdateTicket } from '@/hooks/useTickets'
import { useTranslation } from '@/context/LanguageContext'
import { toast } from '@/components/ui/sonner'
import { friendlyError } from '@/lib/utils'

function valuesFor(ticket) {
  return {
    title: ticket.title ?? '',
    description: ticket.description ?? '',
    type: ticket.type,
    priority: ticket.priority,
    assigned_to: ticket.assigned_to ?? '',
    customer_id: ticket.customer_id ?? '',
    due_date: ticket.due_date ?? '',
    estimated_hours: ticket.estimated_hours != null ? String(ticket.estimated_hours) : '',
  }
}

/** Edit a ticket's details and (re)assign it. Creator only; open tickets only. */
export function EditTicketDialog({ open, onOpenChange, ticket }) {
  const { t } = useTranslation()
  const updateTicket = useUpdateTicket()

  const form = useForm({
    resolver: zodResolver(ticketSchema),
    defaultValues: valuesFor(ticket),
  })

  useEffect(() => {
    if (open) form.reset(valuesFor(ticket))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ticket])

  async function onSubmit(values) {
    try {
      await updateTicket.mutateAsync({ ticketId: ticket.id, values })
      toast.success(t('ticketDetail.updatedOk'))
      onOpenChange(false)
    } catch (error) {
      console.error('Update ticket failed:', error)
      toast.error(friendlyError(error, t('ticketDetail.updateFailed')))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('ticketDetail.editTitle')}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit, () => toast.error(t('createTicket.invalid')))}
          className="space-y-5"
        >
          <TicketFormFields form={form} />
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={updateTicket.isPending}
              onClick={() => onOpenChange(false)}
            >
              {t('createTicket.cancel')}
            </Button>
            <Button type="submit" disabled={updateTicket.isPending}>
              {updateTicket.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('ticketDetail.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
