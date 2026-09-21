import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds the standard hover treatment: scale 1.02, shadow deepens, 200ms. */
  interactive?: boolean
  children: ReactNode
}

export function Card({ interactive = false, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-white shadow-sm',
        interactive &&
          'cursor-pointer transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-md',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
