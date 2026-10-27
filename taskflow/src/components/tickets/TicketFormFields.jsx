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
import { cn } from '@/lib/utils'

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

const PRIORITIES = [
  { value: 'Low', active: 'border-tone-gray bg-tone-gray-bg text-tone-gray-fg' },
  { value: 'Medium', active: 'border-tone-amber bg-tone-amber-bg text-tone-amber-fg' },
  { value: 'High', active: 'border-tone-orange bg-tone-orange-bg text-tone-orange-fg' },
  { value: 'Critical', active: 'border-tone-red bg-tone-red text-white' },
]

function Section({ title, children }) {
  return (
    <fieldset className="space-y-5 rounded-xl border bg-muted/20 p-4 sm:p-5">
      <legend className="px-2 text-sm font-semibold text-foreground">{title}</legend>
      {children}
    </fieldset>
  )
}

/** A label + control + optional helper text + error, wired together for screen readers. */
function Field({ id, label, help, error, children }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {help && !error && (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

/**
 * The shared ticket form body (create + edit).
 * @param form  the object returned by react-hook-form's useForm()
 */
export function TicketFormFields({ form }) {
  const { t } = useTranslation()
  const { role } = useAuth()
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = form
  const { data: developers = [], isLoading: loadingDevs } = useDevelopers()
  const { data: customers = [], isLoading: loadingCustomers } = useCustomers({ activeOnly: true })
  const [addingCustomer, setAddingCustomer] = useState(false)
  const canAddCustomer = role === 'employee'

  const err = (name) => (errors[name] ? t(errors[name].message) : undefined)
  const aria = (name, help) => ({
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : help ? `${name}-help` : undefined,
  })

  return (
    <>
      <Section title={t('createTicket.sectionDetails')}>
        <Field id="title" label={t('createTicket.ticketTitle')} error={err('title')}>
          <Input
            id="title"
            placeholder={t('createTicket.titlePlaceholder')}
            {...aria('title')}
            {...register('title')}
          />
        </Field>

        <Field
          id="description"
          label={t('createTicket.description')}
          error={err('description')}
        >
          <Textarea
            id="description"
            rows={5}
            placeholder={t('createTicket.descriptionPlaceholder')}
            {...aria('description')}
            {...register('description')}
          />
        </Field>
      </Section>

      <Section title={t('createTicket.sectionClassification')}>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
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
                <SelectTrigger aria-label={t('createTicket.customer')}>
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

        <div className="space-y-2">
          <Label id="priority-label">{t('createTicket.priority')}</Label>
          <Controller
            control={control}
            name="priority"
            render={({ field }) => (
              <div
                role="radiogroup"
                aria-labelledby="priority-label"
                aria-invalid={errors.priority ? true : undefined}
                className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              >
                {PRIORITIES.map(({ value, active }) => {
                  const selected = field.value === value
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => field.onChange(value)}
                      className={cn(
                        'h-10 rounded-lg border-2 px-3 text-sm font-semibold transition-colors',
                        selected
                          ? active
                          : 'border-input bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                      )}
                    >
                      {t(`priority.${value}`)}
                    </button>
                  )
                })}
              </div>
            )}
          />
          {errors.priority && (
            <p role="alert" className="text-sm text-destructive">
              {err('priority')}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t('createTicket.type')}</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  aria-label={t('createTicket.type')}
                  aria-invalid={errors.type ? true : undefined}
                >
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
            <p role="alert" className="text-sm text-destructive">
              {err('type')}
            </p>
          )}
        </div>
      </Section>

      <Section title={t('createTicket.sectionAssignment')}>
        <div className="space-y-2">
          <Label>{t('createTicket.assignTo')}</Label>
          <Controller
            control={control}
            name="assigned_to"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  aria-label={t('createTicket.assignTo')}
                  aria-invalid={errors.assigned_to ? true : undefined}
                >
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
            <p role="alert" className="text-sm text-destructive">
              {err('assigned_to')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            id="due_date"
            label={t('createTicket.dueDate')}
            help={t('createTicket.dueDateHelp')}
            error={err('due_date')}
          >
            <Input
              id="due_date"
              type="date"
              {...aria('due_date', true)}
              {...register('due_date')}
            />
          </Field>
          <Field
            id="estimated_hours"
            label={t('createTicket.estimatedHours')}
            help={t('createTicket.estimatedHoursHelp')}
            error={err('estimated_hours')}
          >
            <Input
              id="estimated_hours"
              type="number"
              min="0"
              step="0.25"
              inputMode="decimal"
              {...aria('estimated_hours', true)}
              {...register('estimated_hours')}
            />
          </Field>
        </div>
      </Section>

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
