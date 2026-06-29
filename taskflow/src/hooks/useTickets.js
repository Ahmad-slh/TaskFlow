import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const CLOSED_STATUSES = ['Done', 'Cancelled']

/** Tickets created by the current user (employee). */
export function useMyTickets() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['tickets', 'created', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, assigned_profile:profiles!assigned_to(id, name)')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

/** Tickets assigned to the current user (developer). */
export function useAssignedTickets() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['tickets', 'assigned', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, creator_profile:profiles!created_by(id, name)')
        .eq('assigned_to', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

/** Single ticket with all relations. */
export function useTicket(ticketId) {
  return useQuery({
    queryKey: ['ticket', ticketId],
    enabled: !!ticketId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(
          `
          *,
          creator:profiles!created_by(id, name),
          assignee:profiles!assigned_to(id, name),
          comments(*, commenter:profiles!user_id(id, name)),
          attachments(*)
        `
        )
        .eq('id', ticketId)
        .single()
      if (error) throw error
      return data
    },
  })
}

/** Create a ticket. ticket_number + assignee notification are handled by DB triggers. */
export function useCreateTicket() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (values) => {
      const { data, error } = await supabase
        .from('tickets')
        .insert({
          title: values.title,
          description: values.description,
          type: values.type,
          priority: values.priority,
          status: 'Open',
          created_by: user.id,
          assigned_to: values.assigned_to,
        })
        .select('id, ticket_number')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

/** Update a ticket's status (with closed_at / updated_at bookkeeping). */
export function useUpdateTicketStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, status }) => {
      const now = new Date().toISOString()
      const payload = {
        status,
        updated_at: now,
        closed_at: CLOSED_STATUSES.includes(status) ? now : null,
        // Stamp the start of work each time the ticket (re)enters "In Progress".
        ...(status === 'In Progress' ? { started_at: now } : {}),
      }
      const { data, error } = await supabase
        .from('tickets')
        .update(payload)
        .eq('id', ticketId)
        .select('id')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

/** Upload a file to the `attachments` bucket, then record it in the table. */
export function useUploadAttachment() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, file }) => {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
      const path = `${ticketId}/${Date.now()}-${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(path, file)
      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('attachments').getPublicUrl(path)

      const { error: insertError } = await supabase.from('attachments').insert({
        ticket_id: ticketId,
        file_url: publicUrl,
        file_name: file.name,
        uploaded_by: user.id,
      })
      if (insertError) throw insertError
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] })
    },
  })
}
