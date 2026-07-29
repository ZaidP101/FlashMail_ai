import { z } from 'zod'

export const EmailReqSchema = z.object({
  emailContent: z.string().min(1, 'Email content is required'),
  tone: z.string().optional(),
  rawReply: z.string().optional(),
})

export const EmailResSchema = z.object({
  reply: z.string(),
})
