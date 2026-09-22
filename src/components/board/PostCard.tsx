import { useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Hex } from '../Hex'
import { cn } from '../../lib/cn'
import { timeAgo, timeAgoShort } from '../../lib/dates'
import type { BoardPost } from '../../data/mock/board-posts'
import { useDismiss } from './useDismiss'

/**
 * One Board post.
 *
 * TWO VARIANTS, one component, because the Home preview and the Board page
 * must not drift apart:
 *
 *   'full'    — the Board's Columns view. Team-first top row, right-aligned
 *               timestamp, full body, reactions and a ⋯ menu.
 *   'preview' — the Home BoardPreview. Author-first line, two-line clamp, no
 *               reactions. Markup is byte-for-byte what prompt 2 shipped: the
 *               brief called for a component swap, not a redesign of the
 *               preview, so the preview's layout is deliberately unchanged.
 */

export type ReactionKind = 'bee' | 'heart'

export interface PostCardProps {
  post: BoardPost
  variant?: 'full' | 'preview'
  /** Which reactions this viewer has already given. */
  reacted?: { bee: boolean; heart: boolean }
  onReact?: (postId: string, kind: ReactionKind) => void
  /** Just submitted from the modal — plays the 400ms slide-in once. */
  isNew?: boolean
  className?: string
}

const REACTIONS: { kind: ReactionKind; glyph: string; label: string }[] = [
  { kind: 'bee', glyph: '🐝', label: 'bee' },
  { kind: 'heart', glyph: '🤍', label: 'heart' },
]

function PostMenu({ post }: { post: BoardPost }) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  useDismiss(open, () => setOpen(false), wrap)

  return (
    <div className="relative" ref={wrap}>
      <button
        type="button"
        data-post-menu-trigger={post.id}
        aria-label={`Post options for ${post.team}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((was) => !was)}
        className="rounded-full p-1.5 text-ink/50 transition-colors duration-200 ease-out hover:bg-gold-soft hover:text-gold-deep"
      >
        <MoreHorizontal size={18} aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          data-post-menu={post.id}
          className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              window.alert('Link copied. (Mock — the Board has no backend yet.)')
            }}
            className="block w-full px-3 py-2 text-left text-body-sm text-ink transition-colors duration-200 ease-out hover:bg-gold-soft hover:text-gold-deep"
          >
            Copy link
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block w-full px-3 py-2 text-left text-body-sm text-ink transition-colors duration-200 ease-out hover:bg-gold-soft hover:text-gold-deep"
          >
            Report
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function PostCard({
  post,
  variant = 'full',
  reacted = { bee: false, heart: false },
  onReact,
  isNew = false,
  className,
}: PostCardProps) {
  if (variant === 'preview') {
    return (
      <article data-board-post={post.id} className={cn('flex gap-3', className)}>
        <Hex size={36} variant="filled" color="var(--gold-soft)">
          <span className="font-display text-[0.65rem] font-black leading-none text-gold-deep">
            {post.authorInitials}
          </span>
        </Hex>

        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-semibold text-black">
            {post.author}
            <span className="font-normal text-ink/70"> · {post.team}</span>
          </p>
          <p className="text-caption uppercase text-ink/50">{timeAgo(post.timestamp)}</p>
          <p className="mt-2 line-clamp-2 text-body text-ink" title={post.body}>
            {post.body}
          </p>
        </div>
      </article>
    )
  }

  return (
    <article
      data-board-post={post.id}
      data-column={post.column}
      // `group` (unnamed) on purpose: it is what drives <Hex>'s own
      // group-hover, so the avatar's edge comes up to gold-deep with the card.
      className={cn(
        'group rounded-2xl border border-border bg-white p-5 shadow-sm',
        'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md',
        // Reduced motion keeps the colour response and drops the movement.
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        isNew && 'post-enter',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Hex size={36} variant="filled" color="var(--gold-soft)">
          <span className="font-display text-[0.65rem] font-black leading-none text-gold-deep transition-colors duration-200 ease-out group-hover:text-cream">
            {post.teamInitials}
          </span>
        </Hex>

        <p className="min-w-0 flex-1 text-body-sm font-semibold text-black">
          {post.team}
          <span className="font-normal text-ink/70"> · {post.author}</span>
        </p>

        <p data-post-time className="shrink-0 pt-0.5 text-caption uppercase text-ink/60">
          {timeAgoShort(post.timestamp)}
        </p>
      </div>

      {/*
        The founder voice is the content. No capitalize, no first-letter
        transform, no prose tidying — whitespace-pre-line only, so a post that
        was typed with a line break keeps it.
      */}
      <p data-post-body className="mt-3 whitespace-pre-line text-body-lg text-black">
        {post.body}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {REACTIONS.map(({ kind, glyph, label }) => {
            const count = post.reactions[kind]
            const mine = reacted[kind]
            return (
              <button
                key={kind}
                type="button"
                data-reaction={kind}
                data-post={post.id}
                aria-pressed={mine}
                aria-label={`${mine ? 'Remove' : 'Add'} ${label} reaction, currently ${count}`}
                onClick={() => onReact?.(post.id, kind)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-body-sm transition-colors duration-200 ease-out',
                  mine
                    ? 'border-gold bg-gold-soft font-semibold text-gold-deep'
                    : 'border-border bg-white text-ink/70 hover:border-gold hover:text-gold-deep',
                )}
              >
                <span aria-hidden="true">{glyph}</span>
                <span data-reaction-count={kind} aria-hidden="true">
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <PostMenu post={post} />
      </div>
    </article>
  )
}
