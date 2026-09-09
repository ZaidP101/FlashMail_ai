import { getSupabaseAdmin } from '@flashmail/configs'
import { env } from '../config/env.js'

// Supabase pauses free projects after 7 days without sufficient user database
// activity; a few queries per day keeps it alive. Auth users live in the
// auth.users schema, so they must be read via the Auth Admin API (service
// role), not through PostgREST. The PostgREST read below counts as direct
// user database activity.
const INTERVAL_HOURS = Math.max(1, Number(process.env.KEEPALIVE_INTERVAL_HOURS || 24))

async function pingDatabase(supabase) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 5 })
  if (error) throw error

  const { error: formatsError } = await supabase.from('formats').select('id').limit(1)
  if (formatsError) throw formatsError

  return data.users.length
}

export function startKeepalive() {
  if (!env.SUPABASE_SERVICE_KEY) {
    console.warn('[keepalive] SUPABASE_SERVICE_KEY is not set, keep-alive disabled')
    return
  }

  const supabase = getSupabaseAdmin(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
  const intervalMs = INTERVAL_HOURS * 60 * 60 * 1000

  const run = async () => {
    const at = new Date().toISOString()
    try {
      const usersSeen = await pingDatabase(supabase)
      console.log(`[keepalive] ${at} ok — read ${usersSeen} auth users`)
    } catch (err) {
      console.error(`[keepalive] ${at} failed: ${err.message}`)
    }
  }

  run()
  setInterval(run, intervalMs)
  console.log(`[keepalive] database keep-alive scheduled every ${INTERVAL_HOURS}h`)
}
