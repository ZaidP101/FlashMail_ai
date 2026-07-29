import { createClient } from '@supabase/supabase-js'

let adminClient = null

export function getSupabaseAdmin(url, serviceKey) {
  if (!adminClient) {
    adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return adminClient
}

export function getSupabaseClient(url, anonKey) {
  return createClient(url, anonKey)
}
