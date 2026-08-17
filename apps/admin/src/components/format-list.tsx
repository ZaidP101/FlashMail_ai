'use client'

import { Pencil, Copy, Trash2, Square, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { countWords } from '@/components/word-counter'
import type { FormatOption } from '@/components/format-picker'

export type FormatItem = FormatOption & {
  content: string
}

type FormatListProps = {
  formats: FormatItem[]
  selectedIds?: string[]
  onToggleSelect?: (id: string) => void
  onOpen: (id: string) => void
  onEdit: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

export function FormatList({
  formats,
  selectedIds = [],
  onToggleSelect,
  onOpen,
  onEdit,
  onDuplicate,
  onDelete,
}: FormatListProps) {
  if (formats.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">No formats yet.</p>
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {formats.map((format) => {
        const selected = selectedIds.includes(format.id)
        return (
        <Card
          key={format.id}
          role="button"
          tabIndex={0}
          className={selected ? 'cursor-pointer ring-2 ring-primary/60' : 'cursor-pointer transition-colors hover:bg-accent'}
          onClick={() => onOpen(format.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onOpen(format.id)
            }
          }}
        >
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-tight">{format.name}</h3>
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                {onToggleSelect && (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={selected ? 'Deselect' : 'Select'}
                    onClick={() => onToggleSelect(format.id)}
                  >
                    {selected ? <CheckSquare className="text-primary" /> : <Square />}
                  </Button>
                )}
                <Badge variant={format.mode === 'email' ? 'default' : 'secondary'}>{format.mode}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Tone: {format.tone}</span>
              <span>{countWords(format.content)} words</span>
            </div>
            <div
              className="flex gap-1 pt-1"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <Button variant="ghost" size="sm" onClick={() => onEdit(format.id)}>
                <Pencil /> Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDuplicate(format.id)}>
                <Copy /> Duplicate
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(format.id)}>
                <Trash2 /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
        )
      })}
    </div>
  )
}