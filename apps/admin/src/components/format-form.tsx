'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { TONES } from '@/components/tone-selector'
import { WordCounter, MAX_FORMAT_WORDS } from '@/components/word-counter'
import { cn } from '@/lib/utils'

export type FormatFormValues = {
  name: string
  mode: 'email' | 'reply'
  tone: string
  content: string
}

type FormatFormProps = {
  initial?: Partial<FormatFormValues>
  submitLabel: string
  onSubmit: (values: FormatFormValues) => Promise<void> | void
  loading?: boolean
}

export function FormatForm({ initial, submitLabel, onSubmit, loading }: FormatFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [mode, setMode] = useState<'email' | 'reply'>(initial?.mode ?? 'email')
  const [tone, setTone] = useState(initial?.tone ?? 'Formal')
  const [content, setContent] = useState(initial?.content ?? '')

  const overLimit = content.trim().split(/\s+/).filter(Boolean).length > MAX_FORMAT_WORDS
  const canSubmit = name.trim().length > 0 && !overLimit

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({ name: name.trim(), mode, tone, content })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          placeholder="e.g. Quotation"
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Mode</Label>
        <div className="flex gap-2">
          {(['email', 'reply'] as const).map((m) => (
            <Button
              key={m}
              type="button"
              variant={mode === m ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode(m)}
            >
              {m === 'email' ? 'Email' : 'Reply'}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {mode === 'email'
            ? 'Compose a fresh email from scratch.'
            : 'Reply to an existing email — the AI also receives the original email content.'}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tone">Default Tone</Label>
        <Select id="tone" value={tone} onChange={(e) => setTone(e.target.value)}>
          {TONES.filter((t) => t.value).map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="content">Format Content</Label>
          <WordCounter value={content} />
        </div>
        <Textarea
          id="content"
          rows={10}
          placeholder="Write the format template / instructions the AI should follow..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={cn(overLimit && 'border-destructive focus-visible:ring-destructive')}
        />
        <p className="text-xs text-muted-foreground">
          Instructions for the AI, up to {MAX_FORMAT_WORDS} words.
        </p>
      </div>

      <Button onClick={handleSubmit} disabled={loading || !canSubmit} className="w-full">
        {loading ? 'Saving...' : submitLabel}
      </Button>
    </div>
  )
}
