import { getSupabaseAdmin } from '@flashmail/configs'
import { env } from '../config/env.js'

function getClient() {
  return getSupabaseAdmin(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
}

export async function signup(email, password, name) {
  const { data, error } = await getClient().auth.admin.createUser({
    email,
    password,
    user_metadata: name ? { name } : undefined,
  })

  if (error) throw new Error(error.message)
  return { user: data.user }
}

export async function login(email, password) {
  const { data, error } = await getClient().auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw new Error(error.message)
  return { user: data.user, session: data.session }
}

export async function getProfile(userId) {
  const { data, error } = await getClient().auth.admin.getUserById(userId)
  if (error) throw new Error(error.message)
  return data.user
}
