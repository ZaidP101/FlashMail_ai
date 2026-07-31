import { buildEmailPrompt, buildFormatPrompt } from '@flashmail/utils'
import { createFormatQueries } from '@flashmail/models'
import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'

const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions'
const HF_MODEL = 'Qwen/Qwen3-0.6B:featherless-ai'

function getUserIdFromToken(accessToken) {
  try {
    const payload = accessToken.split('.')[1]
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return decoded.sub || null
  } catch {
    return null
  }
}

async function loadFormat(accessToken, formatId) {
  const userId = getUserIdFromToken(accessToken)
  if (!userId) return null
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return createFormatQueries(supabase).findById(formatId, userId)
}

async function callHuggingFace(prompt) {
  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: HF_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    throw new Error(`Hugging Face API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

export async function generateReply(emailContent, tone, rawReply) {
  const prompt = buildEmailPrompt(emailContent, tone, rawReply)
  return callHuggingFace(prompt)
}

export async function generateWithFormat({ formatId, customInputs, tone, emailContent, rawReply }, accessToken) {
  const format = await loadFormat(accessToken, formatId)
  if (!format) throw new Error('Format not found')

  const prompt = buildFormatPrompt({
    mode: format.mode,
    content: format.content,
    customInputs,
    tone: tone || format.tone,
    emailContent: format.mode === 'reply' ? emailContent : null,
    rawReply,
  })

  return callHuggingFace(prompt)
}
