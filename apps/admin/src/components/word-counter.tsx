'use client'

import { cn } from '@/lib/utils'

export const MAX_FORMAT_WORDS = 500

export function countWords(value: string): number {
  return value.trim().split(/\s+/).filter(Boolean).length
}

type WordCounterProps = {
  value: string
  maxWords?: number
}

export function WordCounter({ value, maxWords = MAX_FORMAT_WORDS }: WordCounterProps) {
  const count = countWords(value)
  const over = count > maxWords
  return (
    <span className={cn('text-xs', over ? 'text-destructive font-medium' : 'text-muted-foreground')}>
      {count} / {maxWords} words
    </span>
  )
}
