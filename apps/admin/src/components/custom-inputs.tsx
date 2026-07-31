'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { WordCounter, MAX_FORMAT_WORDS } from '@/components/word-counter'

type CustomInputsProps = {
  value: string
  onChange: (value: string) => void
}

export function CustomInputs({ value, onChange }: CustomInputsProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="custom-inputs">Custom Inputs</Label>
        <WordCounter value={value} />
      </div>
      <Textarea
        id="custom-inputs"
        rows={6}
        maxLength={MAX_FORMAT_WORDS * 12}
        placeholder="Paste any details the AI should use: company name, amounts, dates, product info..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        These inputs are combined with your format to generate the final email.
      </p>
    </div>
  )
}
