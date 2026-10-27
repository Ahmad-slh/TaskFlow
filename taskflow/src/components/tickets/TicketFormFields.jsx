import { useState } from 'react'
import { Controller } from 'react-hook-form'
import { z } from 'zod'
import { Plus } from 'lucide-react'
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
import { CustomerFormDialog } from '@/components/customers/CustomerFormDialog'
import { useCustomers } from '@/hooks/useCustomers'
import { useDevelopers } from '@/hooks/useProfiles'
import { useAuth } from '@/context/AuthContext'
import { useTranslation } from '@/context/LanguageContext'

export const ticketSchema = z.object({
  title: z.string().min(5, 'createTicket.titleMin'),
  description: z.string().min(10, 'createTicket.descriptionMin'),
  type: z.enum(['Bug', 'Task', 'Request'], { required_error: 'createTicket.typeRequired' }),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical'], {
    required_error: 'createTicket.priorityRequired',
  }),
  assigned_to: z.string().min(1, 'createTicket.assigneeRequired'),
  customer_id: z.string().optional(),
  due_date: z.string().optional(),
  estimated_hours: z
    .string()
    .optional()
    .refine((v) => !v || (Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) < 10000), {
      message: 'createTicket.estimatedHoursInvalid',
    }),
})

// Radix Select cannot hold an empty-string item value, so "no customer" uses a sentinel.
const NO_CUSTOMER = '__none__'

/**
 * The shared ticket form body (create + edit).
 * @param form  the object returned by react-hook-form's useForm()
 */
export function TicketFormFields({ form }) {
  const { t } = useTranslation()
  const { role } = useAuth()
  const { register, control, setValue, formState: { errors } } = form
  const { data: developers = [], isLoading: loadingDevs } = useDevelopers()
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers({ activeOnly: true })
  const [addingCustomer, setAddingCustomer] = useState(false)
  const canAddCustomer = role === 'employee'

  const error = (name) =>
    errors[name] && <p className="text-sm text-destructive">{t(errors[name].message)}</p>

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">{t('createTicket.ticketTitle')}</Label>
        <Input id="title" placeholder={t('createTicket.titlePlaceholder')} {...register('title')} />
        {error('title')}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('createTicket.description')}</Label>
        <Textarea
          id="description"
          rows={5}
          placeholder={t('createTicket.descriptionPlaceholder')}
          {...register('description')}
        />
        {error('description')}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t('createTicket.customer')}</Label>
          {canAddCustomer && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0"
              onClick={() => setAddingCustomer(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              {t('createTicket.addCustomer')}
            </Button>
          )}
        </div>
        <Controller
          control={control}
          name="customer_id"
          render={({ field }) => (
            <Select
              value={field.value || undefined}
              onValueChange={(v) => field.onChange(v === NO_CUSTOMER ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    loadingCustomers
                      ? t('createTicket.loadingCustomers')
                      : t('createTicket.selectCustomer')
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CUSTOMER}>{t('createTicket.noCustomer')}</SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.company ? `${c.name} — ${c.company}` : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
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
          {error('type')}
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
                  <SelectItem value="Critical">{t('priority.Critical')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {error('priority')}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="due_date">{t('createTicket.dueDate')}</Label>
          <Input id="due_date" type="date" {...register('due_date')} />
          {error('due_date')}
        </div>
        <div className="space-y-2">
          <Label htmlFor="estimated_hours">{t('createTicket.estimatedHours')}</Label>
          <Input
            id="estimated_hours"
            type="number"
            min="0"
            step="0.25"
            inputMode="decimal"
            {...register('estimated_hours')}
          />
          {error('estimated_hours')}
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
        {error('assigned_to')}
      </div>

      {canAddCustomer && (
        <CustomerFormDialog
          open={addingCustomer}
          onOpenChange={setAddingCustomer}
          onSaved={(customer) => setValue('customer_id', customer.id, { shouldDirty: true })}
        />
      )}
    </>
  )
}
