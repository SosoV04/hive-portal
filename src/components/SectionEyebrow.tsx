import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/** Small uppercase gold section label. Caption scale, Inter 600, --gold-deep. */
export function SectionEyebrow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={cn('font-sans text-caption font-semibold uppercase text-gold-deep', className)}>
      {children}
    </p>
  )
}
