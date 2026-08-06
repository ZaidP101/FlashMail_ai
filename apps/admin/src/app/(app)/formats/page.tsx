'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Upload, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FormatList, type FormatItem } from '@/components/format-list'
import { getFormats, createFormat, deleteFormat } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'

type ModeFilter = 'all' | 'email' | 'reply'

export default function FormatsPage() {
  const { session } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formats, setFormats] = useState<FormatItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ModeFilter>('all')

  const load = async () => {
    setLoading(true)
    try {
      const data = await getFormats(session?.access_token)
      setFormats(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load formats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) load()
  }, [session])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return formats.filter((f) => {
      if (filter !== 'all' && f.mode !== filter) return false
      if (q && !f.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [formats, search, filter])

  const handleDuplicate = async (id: string) => {
    const source = formats.find((f) => f.id === id)
    if (!source) return
    try {
      await createFormat(
        { name: `${source.name} (copy)`, mode: source.mode, tone: source.tone, content: source.content },
        session?.access_token,
      )
      toast.success('Format duplicated')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to duplicate format')
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this format?')) return
    try {
      await deleteFormat(id, session?.access_token)
      toast.success('Format deleted')
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete format')
    }
  }

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(formats, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'flashmail-formats.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text())
      const list = Array.isArray(parsed) ? parsed : [parsed]
      for (const item of list) {
        if (!item?.name || !['email', 'reply'].includes(item.mode)) continue
        await createFormat(
          { name: item.name, mode: item.mode, tone: item.tone || 'Formal', content: item.content || '' },
          session?.access_token,
        )
      }
      toast.success(`Imported ${list.length} format(s)`)
      load()
    } catch {
      toast.error('Invalid format file')
    }
  }

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Formats</CardTitle>
              <CardDescription>Reusable templates for AI-generated emails and replies.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport} disabled={formats.length === 0}>
                <Download /> Export
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload /> Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImport(file)
                  e.target.value = ''
                }}
              />
              <Button size="sm" onClick={() => router.push('/formats/new')}>
                <Plus /> New
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                placeholder="Search formats..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="sm:max-w-xs"
              />
              <div className="flex gap-2">
                {(['all', 'email', 'reply'] as const).map((m) => (
                  <Button
                    key={m}
                    variant={filter === m ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter(m)}
                  >
                    {m === 'all' ? 'All' : m === 'email' ? 'Email' : 'Reply'}
                  </Button>
                ))}
              </div>
            </div>
            <FormatList
              formats={visible}
              onOpen={(id) => router.push(`/formats/${id}`)}
              onEdit={(id) => router.push(`/formats/${id}`)}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
