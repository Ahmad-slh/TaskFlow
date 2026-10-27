import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

/**
 * Update the signed-in user's display name. The `role` column is protected by a
 * database trigger (see supabase/profiles_protect_role.sql), so only `name` is sent.
 */
export function useUpdateProfile() {
  const { user, refreshProfile } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ name }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ name })
        .eq('id', user.id)
        .select('id, name')
        .single()
      if (error) throw error
      return data
    },
    onSuccess: async () => {
      await refreshProfile()
      // The developer picker and creator/assignee names come from profiles.
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

/** Change the signed-in user's password. */
export function useChangePassword() {
  return useMutation({
    mutationFn: async ({ password }) => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
    },
  })
}
