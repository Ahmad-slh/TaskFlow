import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function isValidUrl(value) {
  try {
    return Boolean(new URL(value))
  } catch {
    return false
  }
}

const hasValidConfig = isValidUrl(supabaseUrl) && !!supabaseAnonKey

if (!hasValidConfig) {
  // Surface misconfiguration early; fall back to a placeholder so the app still
  // renders the login screen instead of crashing on import.
  console.error(
    'Missing or invalid Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  )
}

export const supabase = createClient(
  hasValidConfig ? supabaseUrl : 'https://placeholder.supabase.co',
  hasValidConfig ? supabaseAnonKey : 'placeholder-anon-key'
)
