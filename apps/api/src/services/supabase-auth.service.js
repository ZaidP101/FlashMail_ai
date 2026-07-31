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

function mapAuthData(data, fallbackEmail) {
  const expiresAt =
    data.expires_at ??
    (data.expires_in ? Math.floor(Date.now() / 1000) + data.expires_in : null)

  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    email: data.user?.email || fallbackEmail,
    name: data.user?.user_metadata?.name || fallbackEmail,
    userId: data.user?.id,
    refreshToken: data.refresh_token,
    expiresAt,
  }
}

export async function signup(email, password, name) {
  const data = await supabaseFetch('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  return mapAuthData(data, name || email)
}

export async function login(email, password) {
  const data = await supabaseFetch('/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

  return mapAuthData(data, email)
}

export async function refresh(refreshToken) {
  const data = await supabaseFetch('/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  return mapAuthData(data, data.user?.email)
}

export async function getProfile(accessToken) {
  return supabaseFetch('/user', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })
}
