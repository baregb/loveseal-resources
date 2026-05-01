import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types'

/**
 * Supabase admin client using the Service Role key.
 * Bypasses Row Level Security — use ONLY in server-side admin operations.
 * NEVER expose this client to the browser.
 */
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
