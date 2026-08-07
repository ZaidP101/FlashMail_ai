import { buildEmailPrompt, buildFormatPrompt, buildComposePrompt } from '@flashmail/utils'
import { createFormatQueries } from '@flashmail/models'
import { createClient } from '@supabase/supabase-js'
import { env } from '../config/env.js'

const AI_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'

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

async function callAi(prompt) {
  const response = await fetch(AI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.AI_MODEL || DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  return content.replace(/^\s* thinking[\s\S]*?<\/think>\s*/, '').trim()
}

export async function generateReply(emailContent, tone, rawReply, senderName) {
  const prompt = buildEmailPrompt(emailContent, tone, rawReply, senderName)
  return callAi(prompt)
}

export async function generateCompose(draft, tone, senderName) {
  const output = await callAi(buildComposePrompt(draft, tone, senderName))
  const match = output.match(/^Subject:\s*(.*)$/im)
  let subject = ''
  let body = output
  if (match) {
    subject = match[1].trim()
    body = output.slice(match[0].length).replace(/^\n+/, '').trim()
  }
  return { subject, reply: body }
}

export async function generateWithFormat(
  { formatId, customInputs, tone, emailContent, rawReply, senderName },
  accessToken
) {
  const format = await loadFormat(accessToken, formatId)
  if (!format) throw new Error('Format not found')

  const prompt = buildFormatPrompt({
    mode: format.mode,
    content: format.content,
    customInputs,
    tone: tone || format.tone,
    emailContent: format.mode === 'reply' ? emailContent : null,
    rawReply,
    senderName,
  })

  return callAi(prompt)
}