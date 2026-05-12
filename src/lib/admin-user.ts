import { createClient } from '@/lib/supabase/server'
import type { AdminRole } from '@/types'

export interface CurrentAdmin {
  id:           string
  email:        string
  display_name: string | null
  role:         AdminRole
}

/**
 * Fetch the currently logged-in admin's record.
 * Returns null if not logged in or not in admin_users.
 */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('admin_users')
    .select('id, email, display_name, role')
    .eq('id', user.id)
    .single()

  return data as CurrentAdmin | null
}

/**
 * Quick check if the given admin is a super_admin.
 */
export function isSuperAdmin(admin: CurrentAdmin | null): boolean {
  return admin?.role === 'super_admin'
}
