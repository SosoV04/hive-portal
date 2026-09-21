import type { ReactNode } from 'react'
import { Bee } from './Bee'
import { cn } from '../lib/cn'

export interface EmptyStateProps {
  /** Short headline, e.g. "No posts yet". */
  title?: string
  /** Supporting line. Defaults to the house phrase. */
  message?: string
  /** Optional call to action. */
  action?: ReactNode
  className?: string
}

/** One of the three sanctioned bee moments. */
export function EmptyState({
  title = 'Nothing here yet',
  message = 'The hive is quiet.',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-empty-state=""
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-gold-soft/40 px-6 py-16 text-center',
        className,
      )}
    >
      <Bee size={56} />
      <h3 className="font-display text-display-md font-semibold text-black">{title}</h3>
      <p className="max-w-sm text-body text-ink">{message}</p>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  )
}
