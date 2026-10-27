import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

/** All customers (optionally only the active ones, for the ticket form). */
export function useCustomers({ activeOnly = false, enabled = true } = {}) {
  return useQuery({
    queryKey: ['customers', { activeOnly }],
    enabled,
    queryFn: async () => {
      let query = supabase.from('customers').select('*, tickets(count)').order('name', { ascending: true })
      if (activeOnly) query = query.eq('status', 'Active')
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

/** A single customer together with the tickets opened for them. */
export function useCustomer(customerId) {
  return useQuery({
    queryKey: ['customer', customerId],
    enabled: !!customerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select(
          `
          *,
          tickets(*, assigned_profile:profiles!assigned_to(id, name), customer:customers(id, name, company))
        `
        )
        .eq('id', customerId)
        .single()
      if (error) throw error
      return data
    },
  })
}

/** Normalise form values: empty strings become null. */
function toRow(values) {
  const row = {}
  for (const [key, value] of Object.entries(values)) {
    row[key] = typeof value === 'string' && value.trim() === '' ? null : value
  }
  return row
}

export function useCreateCustomer() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from('customers')
        .insert({ ...toRow(values), created_by: user.id })
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }) => {
      const { data, error } = await supabase
        .from('customers')
        .update({ ...toRow(values), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('*')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      queryClient.invalidateQueries({ queryKey: ['customer', variables.id] })
    },
  })
}
