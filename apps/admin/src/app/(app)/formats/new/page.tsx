'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FormatForm } from '@/components/format-form'
import { createFormat } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'
import { useState } from 'react'

export default function NewFormatPage() {
  const { session } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (values: { name: string; mode: 'email' | 'reply'; tone: string; content: string }) => {
    setSaving(true)
    try {
      await createFormat(values, session?.access_token)
      toast.success('Format created')
      router.push('/formats')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create format')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>New Format</CardTitle>
            <CardDescription>Create a reusable template for AI-generated emails or replies.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormatForm submitLabel="Create Format" onSubmit={handleSubmit} loading={saving} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
