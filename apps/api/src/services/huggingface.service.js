import { buildEmailPrompt } from '@flashmail/utils'
import { env } from '../config/env.js'

const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions'
const HF_MODEL = 'Qwen/Qwen3-0.6B:featherless-ai'

export async function generateReply(emailContent, tone, rawReply) {
  const prompt = buildEmailPrompt(emailContent, tone, rawReply)

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
