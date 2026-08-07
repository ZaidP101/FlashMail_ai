import { z } from 'zod'

export const EmailReqSchema = z
  .object({
    emailContent: z.string().optional(),
    tone: z.string().optional(),
    rawReply: z.string().optional(),
    formatId: z.string().uuid().optional(),
    customInputs: z.string().optional(),
    senderName: z.string().optional(),
    mode: z.enum(['reply', 'compose']).optional(),
  })
  .refine((data) => data.mode === 'compose' || (data.emailContent && data.emailContent.length > 0), {
    message: 'Email content is required',
    path: ['emailContent'],
  })

export const EmailResSchema = z.object({
  reply: z.string(),
})
