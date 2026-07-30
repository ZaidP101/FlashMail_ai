import { z } from 'zod'

const envSchema = z.object({
  HF_TOKEN: z.string().min(1, 'HF_TOKEN is required'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().optional(),
})

export function loadEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    console.error(' Invalid environment variables:', result.error.flatten().fieldErrors)
    process.exit(1)
  }
  return result.data
}
