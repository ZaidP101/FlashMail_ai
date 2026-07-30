import { env } from '../config/env.js'

const SUPABASE_AUTH_URL = `${env.SUPABASE_URL}/auth/v1`

async function supabaseFetch(path, options = {}) {
  const response = await fetch(`${SUPABASE_AUTH_URL}${path}`, {
    ...options,
    headers: {
      'apikey': env.SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(errBody || `Supabase API error: ${response.status}`)
  }

  return response.json()
}

export async function signup(email, password, name) {
  const data = await supabaseFetch('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    email: data.user?.email || email,
    name: name || email,
    userId: data.user?.id,
  }
}

export async function login(email, password) {
  const data = await supabaseFetch('/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    email: data.user?.email || email,
    name: data.user?.user_metadata?.name || email,
    userId: data.user?.id,
  }
}

export async function getProfile(accessToken) {
  return supabaseFetch('/user', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })
}
