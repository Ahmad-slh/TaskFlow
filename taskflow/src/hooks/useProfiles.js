import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

/**
 * Fetch all developers for the "Assign To" dropdown.
 */
export function useDevelopers() {
  return useQuery({
    queryKey: ['profiles', 'developers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('role', 'developer')
        .order('name', { ascending: true })
      if (error) throw error
      return data
    },
  })
}
