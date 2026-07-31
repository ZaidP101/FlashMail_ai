import { z } from 'zod'

export const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  tokenType: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  userId: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.number().optional(),
})
