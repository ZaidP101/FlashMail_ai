import type { z } from 'zod'
import type { EmailReqSchema, EmailResSchema } from '@flashmail/schemas'

type EmailReq = z.input<typeof EmailReqSchema>
type EmailRes = z.input<typeof EmailResSchema>

export async function generateEmail(data: EmailReq, token?: string): Promise<EmailRes> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch('/api/email/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || 'Failed to generate email')
  }
  const text = await res.text()
  return { reply: text }
}
