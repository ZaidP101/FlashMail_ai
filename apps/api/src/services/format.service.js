import { createClient } from '@supabase/supabase-js'
import { createFormatQueries } from '@flashmail/models'
import { env } from '../config/env.js'

function getUserIdFromToken(accessToken) {
  try {
    const payload = accessToken.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return decoded.sub || null
  } catch {
    return null
  }
}

function getAuthedClient(accessToken) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function listFormats(accessToken) {
  const userId = getUserIdFromToken(accessToken)
  if (!userId) return []
  const supabase = getAuthedClient(accessToken)
  return createFormatQueries(supabase).findByUserId(userId)
}

export async function getFormat(accessToken, id) {
  const userId = getUserIdFromToken(accessToken)
  if (!userId) return null
  const supabase = getAuthedClient(accessToken)
  return createFormatQueries(supabase).findById(id, userId)
}

export async function createFormat(accessToken, data) {
  const userId = getUserIdFromToken(accessToken)
  if (!userId) throw new Error('Invalid token')
  const supabase = getAuthedClient(accessToken)
  return createFormatQueries(supabase).create({ ...data, user_id: userId })
}

export async function updateFormat(accessToken, id, changes) {
  const userId = getUserIdFromToken(accessToken)
  if (!userId) return null
  const supabase = getAuthedClient(accessToken)
  return createFormatQueries(supabase).update(id, userId, changes)
}

export async function deleteFormat(accessToken, id) {
  const userId = getUserIdFromToken(accessToken)
  if (!userId) return false
  const supabase = getAuthedClient(accessToken)
  return createFormatQueries(supabase).remove(id, userId)
}
