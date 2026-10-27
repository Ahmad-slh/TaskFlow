import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

const CLOSED_STATUSES = ['Done', 'Cancelled']
const CUSTOMER_JOIN = 'customer:customers(id, name, company)'

/** Tickets created by the current user (employee). */
export function useMyTickets() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['tickets', 'created', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`*, assigned_profile:profiles!assigned_to(id, name), ${CUSTOMER_JOIN}`)
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
        .select(`*, creator_profile:profiles!created_by(id, name), ${CUSTOMER_JOIN}`)
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
          customer:customers(id, name, company),
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

/** Convert optional form values into DB-ready values ('' -> null, string -> number). */
function optionalFields(values) {
  return {
    customer_id: values.customer_id || null,
    due_date: values.due_date || null,
    estimated_hours:
      values.estimated_hours === '' || values.estimated_hours == null
        ? null
        : Number(values.estimated_hours),
  }
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
          ...optionalFields(values),
        })
        .select('id, ticket_number')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['customer'] })
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })
}

/**
 * Edit a ticket's details / reassign it. Changes are recorded in
 * `ticket_activity` and the new assignee is notified by a DB trigger.
 */
export function useUpdateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, values }) => {
      const payload = { updated_at: new Date().toISOString() }
      for (const key of ['title', 'description', 'type', 'priority', 'assigned_to']) {
        if (key in values) payload[key] = values[key]
      }
      if ('customer_id' in values || 'due_date' in values || 'estimated_hours' in values) {
        const optional = optionalFields(values)
        for (const key of Object.keys(optional)) {
          if (key in values) payload[key] = optional[key]
        }
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
      queryClient.invalidateQueries({ queryKey: ['ticket-activity', variables.ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['customer'] })
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
      queryClient.invalidateQueries({ queryKey: ['ticket-activity', variables.ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      queryClient.invalidateQueries({ queryKey: ['customer'] })
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

/** Activity timeline for one ticket, oldest first. */
export function useTicketActivity(ticketId) {
  return useQuery({
    queryKey: ['ticket-activity', ticketId],
    enabled: !!ticketId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ticket_activity')
        .select('*, actor:profiles!actor_id(id, name)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data
    },
  })
}

/**
 * Keep ticket lists / details live. Row Level Security already limits which
 * rows are delivered, so we simply invalidate the cached queries on any change.
 */
export function useTicketsRealtime() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`tickets:${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload) => {
        const id = payload.new?.id ?? payload.old?.id
        queryClient.invalidateQueries({ queryKey: ['tickets'] })
        queryClient.invalidateQueries({ queryKey: ['customer'] })
        if (id) queryClient.invalidateQueries({ queryKey: ['ticket', id] })
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ticket_activity' },
        (payload) => {
          const id = payload.new?.ticket_id
          if (id) queryClient.invalidateQueries({ queryKey: ['ticket-activity', id] })
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments' },
        (payload) => {
          const id = payload.new?.ticket_id
          if (id) queryClient.invalidateQueries({ queryKey: ['ticket', id] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])
}
