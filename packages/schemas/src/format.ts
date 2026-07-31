import { z } from 'zod'

const MAX_CONTENT_WORDS = 500

const wordCount = (value) => value.trim().split(/\s+/).filter(Boolean).length

export const FormatContentSchema = z
  .string()
  .max(5000, 'Content is too long')
  .refine((value) => wordCount(value) <= MAX_CONTENT_WORDS, {
    message: `Content must be ${MAX_CONTENT_WORDS} words or fewer`,
  })

export const CreateFormatSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name must be 120 characters or fewer'),
  mode: z.enum(['email', 'reply']),
  tone: z.string().trim().min(1).max(50).default('Formal'),
  content: FormatContentSchema.default(''),
})

export const UpdateFormatSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name must be 120 characters or fewer').optional(),
  mode: z.enum(['email', 'reply']).optional(),
  tone: z.string().trim().min(1).max(50).optional(),
  content: FormatContentSchema.optional(),
})

export const FormatSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string(),
  mode: z.enum(['email', 'reply']),
  tone: z.string(),
  content: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
})
