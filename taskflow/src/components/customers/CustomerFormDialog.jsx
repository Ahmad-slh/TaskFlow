import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers'
import { useTranslation } from '@/context/LanguageContext'
import { toast } from '@/components/ui/sonner'
import { friendlyError } from '@/lib/utils'

const schema = z.object({
  name: z.string().trim().min(2, 'customers.nameMin'),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.literal(''), z.string().email('customers.emailInvalid')]).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  contact_person: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['Active', 'Inactive']),
})

const EMPTY = {
  name: '',
  company: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  contact_person: '',
  notes: '',
  status: 'Active',
}

function valuesFor(customer) {
  if (!customer) return EMPTY
  return Object.fromEntries(Object.keys(EMPTY).map((key) => [key, customer[key] ?? EMPTY[key]]))
}

/**
 * Add / edit a customer.
 * @param customer   existing customer to edit; omit to create
 * @param onSaved    optional (customer) => void, called with the saved row
 */
export function CustomerFormDialog({ open, onOpenChange, customer, onSaved }) {
  const { t } = useTranslation()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const isEdit = !!customer
  const pending = createCustomer.isPending || updateCustomer.isPending

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: valuesFor(customer) })

  useEffect(() => {
    if (open) reset(valuesFor(customer))
  }, [open, customer, reset])

  async function onSubmit(values) {
    try {
      const saved = isEdit
        ? await updateCustomer.mutateAsync({ id: customer.id, values })
        : await createCustomer.mutateAsync(values)
      toast.success(t(isEdit ? 'customers.updated' : 'customers.created'))
      onOpenChange(false)
      onSaved?.(saved)
    } catch (error) {
      console.error('Save customer failed:', error)
      toast.error(friendlyError(error, t('customers.failed')))
    }
  }

  function field(name, labelKey, props = {}) {
    return (
      <div className="space-y-2">
        <Label htmlFor={`customer-${name}`}>{t(labelKey)}</Label>
        <Input id={`customer-${name}`} {...register(name)} {...props} />
        {errors[name] && <p className="text-sm text-destructive">{t(errors[name].message)}</p>}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t(isEdit ? 'customers.edit' : 'customers.add')}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            // The dialog is portaled but React events still bubble to a parent <form>.
            e.stopPropagation()
            return handleSubmit(onSubmit)(e)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field('name', 'customers.name')}
            {field('company', 'customers.company')}
            {field('phone', 'customers.phone', { type: 'tel', dir: 'ltr' })}
            {field('email', 'customers.email', { type: 'email', dir: 'ltr' })}
            {field('city', 'customers.city')}
            {field('contact_person', 'customers.contactPerson')}
          </div>
          {field('address', 'customers.address')}
          <div className="space-y-2">
            <Label htmlFor="customer-notes">{t('customers.notes')}</Label>
            <Textarea id="customer-notes" rows={3} {...register('notes')} />
          </div>
          <div className="space-y-2">
            <Label>{t('customers.status')}</Label>
            <Controller
              control={control}
              name="status"
              render={({ field: f }) => (
                <Select value={f.value} onValueChange={f.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">{t('customerStatus.Active')}</SelectItem>
                    <SelectItem value="Inactive">{t('customerStatus.Inactive')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              {t('customers.cancel')}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('customers.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
