import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

export function useAddComment() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ ticketId, message }) => {
      const { error } = await supabase.from('comments').insert({
        ticket_id: ticketId,
        user_id: user.id,
        message,
      })
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] })
    },
  })
}
