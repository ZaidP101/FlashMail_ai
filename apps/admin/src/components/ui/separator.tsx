import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

const Separator = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('shrink-0 bg-border h-[1px] w-full', className)} {...props} />
  ),
)
Separator.displayName = 'Separator'

export { Separator }
