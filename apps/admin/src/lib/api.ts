import type { z } from 'zod'
import type { EmailReqSchema, EmailResSchema, FormatSchema } from '@flashmail/schemas'

type EmailReq = z.input<typeof EmailReqSchema>
type EmailRes = z.input<typeof EmailResSchema>

type Format = z.output<typeof FormatSchema>
type FormatInput = {
  name: string
  mode: 'email' | 'reply'
  tone: string
  content: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''

async function api<T>(path: string, token: string | undefined, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!res.ok) {
    const text = await res.text()
    let message = text || `Request failed: ${res.status}`
    try {
      const parsed = JSON.parse(text)
      if (parsed.error) {
        message = parsed.error
        if (parsed.details) {
          const detailStr = JSON.stringify(parsed.details)
          console.error(`[api] ${res.status} ${path}: ${parsed.error}`, parsed.details)
          message = `${parsed.error}: ${detailStr}`
        }
      }
    } catch {
      /* keep raw text */
    }
    throw new Error(message)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function generateEmail(data: EmailReq, token?: string): Promise<EmailRes> {
  const res = await api<{ reply: string }>('/api/email/generate', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return { reply: res.reply }
}

export async function getFormats(token: string | undefined): Promise<Format[]> {
  const res = await api<{ formats: Format[] }>('/api/formats', token)
  return res.formats
}

export async function getFormat(id: string, token: string | undefined): Promise<Format> {
  return api<Format>(`/api/formats/${id}`, token)
}

export async function createFormat(data: FormatInput, token: string | undefined): Promise<Format> {
  return api<Format>('/api/formats', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateFormat(id: string, data: Partial<FormatInput>, token: string | undefined): Promise<Format> {
  return api<Format>(`/api/formats/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteFormat(id: string, token: string | undefined): Promise<void> {
  await api<void>(`/api/formats/${id}`, token, { method: 'DELETE' })
}
