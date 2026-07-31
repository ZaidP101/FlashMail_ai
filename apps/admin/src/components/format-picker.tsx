'use client'

import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export type FormatOption = {
  id: string
  name: string
  mode: 'email' | 'reply'
  tone: string
}

type FormatPickerProps = {
  formats: FormatOption[]
  value: string
  onChange: (id: string) => void
}

export function FormatPicker({ formats, value, onChange }: FormatPickerProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="format">Saved Format</Label>
      <Select id="format" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">None</option>
        {formats.map((format) => (
          <option key={format.id} value={format.id}>
            {format.name} ({format.mode})
          </option>
        ))}
      </Select>
    </div>
  )
}
