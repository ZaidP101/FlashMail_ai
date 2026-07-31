'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormatForm, type FormatFormValues } from '@/components/format-form'
import { getFormat, updateFormat, deleteFormat, createFormat } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'

export default function EditFormatPage() {
  const { session } = useAuth()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [initial, setInitial] = useState<Partial<FormatFormValues> | undefined>(undefined)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!session || !params.id) return
    getFormat(params.id, session.access_token)
      .then((f) => setInitial({ name: f.name, mode: f.mode, tone: f.tone, content: f.content }))
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load format'))
  }, [session, params.id])

  const handleSubmit = async (values: FormatFormValues) => {
    setSaving(true)
    try {
      await updateFormat(params.id, values, session?.access_token)
      toast.success('Format updated')
      router.push('/formats')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update format')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this format?')) return
    try {
      await deleteFormat(params.id, session?.access_token)
      toast.success('Format deleted')
      router.push('/formats')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete format')
    }
  }

  const handleDuplicate = async () => {
    if (!initial?.mode || !initial.tone) return
    try {
      await createFormat(
        {
          name: `${initial.name} (copy)`,
          mode: initial.mode,
          tone: initial.tone,
          content: initial.content ?? '',
        },
        session?.access_token,
      )
      toast.success('Format duplicated')
      router.push('/formats')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate format')
    }
  }

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Edit Format</CardTitle>
            <CardDescription>Update the template, tone, or mode.</CardDescription>
          </CardHeader>
          <CardContent>
            {initial ? (
              <FormatForm initial={initial} submitLabel="Save Changes" onSubmit={handleSubmit} loading={saving} />
            ) : (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDuplicate}>
            Duplicate
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
