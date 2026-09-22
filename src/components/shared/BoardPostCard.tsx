import { Hex } from '../Hex'
import type { BoardPost } from '../../data/mock/board-posts'
import { timeAgo } from '../../lib/dates'
import { cn } from '../../lib/cn'

/**
 * One Board post. The Home preview clamps the body to two lines; the Board
 * page (prompt 3) shows it in full, hence the `clamp` switch and the shared/
 * location.
 */
export function BoardPostCard({
  post,
  clamp = false,
  className,
}: {
  post: BoardPost
  clamp?: boolean
  className?: string
}) {
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
        <p
          className={cn('mt-2 text-body text-ink', clamp && 'line-clamp-2')}
          // line-clamp needs no plugin in Tailwind 3.3+, but the title keeps
          // the full text reachable when it is truncated.
          title={clamp ? post.body : undefined}
        >
          {post.body}
        </p>
      </div>
    </article>
  )
}
