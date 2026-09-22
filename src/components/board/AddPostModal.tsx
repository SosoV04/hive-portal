import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '../Button'
import { ColumnDot } from '../shared/ColumnDot'
import { cn } from '../../lib/cn'
import { BOARD_COLUMNS, type BoardColumn, type BoardPost } from '../../data/mock/board-posts'
import { COLUMN_PROMPTS, COLUMN_TITLES } from './columns'

/**
 * Add-post dialog. In-memory only — it hands a finished BoardPost back to the
 * Board, which prepends it to state. No backend, no optimistic anything.
 */

const MAX = 300
/** Where the counter stops being neutral, and where it starts warning. */
const SOFT = 240
const HARD = 280

const FOCUSABLE = 'button, input, select, textarea, [href], [tabindex]:not([tabindex="-1"])'

export interface AddPostModalProps {
  column: BoardColumn
  teams: string[]
  onClose: () => void
  onSubmit: (post: BoardPost) => void
}

/** "Second Helping" -> "SH", "Knuckle" -> "KN". */
function initialsFor(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '??'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

const FIELD =
  'w-full rounded-xl border border-border bg-white px-3 py-2 font-sans text-body text-black ' +
  'transition-colors duration-200 ease-out placeholder:text-ink/40 focus:border-gold-deep'

export function AddPostModal({ column, teams, onClose, onSubmit }: AddPostModalProps) {
  const dialog = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<BoardColumn>(column)
  const [team, setTeam] = useState(teams[0] ?? '')
  const [newTeam, setNewTeam] = useState('')
  const [newInitials, setNewInitials] = useState('')
  const [author, setAuthor] = useState('')
  const [body, setBody] = useState('')

  const addingTeam = team === '__new'

  // Focus the first field, then keep Tab inside the dialog.
  useEffect(() => {
    const node = dialog.current
    if (!node) return

    const items = () =>
      [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
      )
    items()[0]?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = items()
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || !node.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  const resolvedTeam = addingTeam ? newTeam.trim() : team
  const valid = body.trim().length > 0 && author.trim().length > 0 && resolvedTeam.length > 0

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!valid) return
    onSubmit({
      id: `post-new-${Date.now()}`,
      column: selected,
      author: author.trim(),
      authorInitials: initialsFor(author),
      team: resolvedTeam,
      teamInitials: (addingTeam && newInitials.trim()
        ? newInitials.trim()
        : initialsFor(resolvedTeam)
      )
        .slice(0, 2)
        .toUpperCase(),
      timestamp: new Date().toISOString(),
      // Kept verbatim: trailing spaces go, nothing else is touched.
      body: body.trim(),
      reactions: { bee: 0, heart: 0 },
    })
  }

  const countClass = body.length >= HARD ? 'text-warning' : body.length >= SOFT ? 'text-gold-deep' : 'text-ink/50'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        data-modal-backdrop=""
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-post-title"
        data-add-post-modal=""
        className="relative max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-md"
      >
        <h2 id="add-post-title" className="font-sans text-body-lg font-semibold text-black">
          Post to the board
        </h2>

        <form onSubmit={submit} className="mt-5 flex flex-col gap-5">
          <fieldset>
            <legend className="mb-2 font-sans text-caption font-semibold uppercase text-ink/60">
              Column
            </legend>
            <div className="inline-flex flex-wrap gap-1 rounded-full border border-border bg-cream p-1">
              {BOARD_COLUMNS.map((option) => {
                const active = selected === option
                return (
                  <button
                    key={option}
                    type="button"
                    data-modal-column={option}
                    aria-pressed={active}
                    onClick={() => setSelected(option)}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-sans text-body-sm font-medium transition-colors duration-200 ease-out',
                      active ? 'bg-white text-black shadow-sm' : 'text-ink/70 hover:text-gold-deep',
                    )}
                  >
                    <ColumnDot column={option} />
                    {COLUMN_TITLES[option]}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <div>
            <label
              htmlFor="add-post-team"
              className="mb-2 block font-sans text-caption font-semibold uppercase text-ink/60"
            >
              Team
            </label>
            <select
              id="add-post-team"
              data-modal-team=""
              value={team}
              onChange={(event) => setTeam(event.target.value)}
              className={FIELD}
            >
              {teams.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              <option value="__new">Add new team…</option>
            </select>

            {addingTeam ? (
              <div className="mt-2 flex gap-2">
                <input
                  data-modal-new-team=""
                  aria-label="New team name"
                  placeholder="Team name"
                  value={newTeam}
                  onChange={(event) => setNewTeam(event.target.value)}
                  className={cn(FIELD, 'flex-1')}
                />
                <input
                  data-modal-new-initials=""
                  aria-label="New team initials"
                  placeholder="AB"
                  maxLength={2}
                  value={newInitials}
                  onChange={(event) => setNewInitials(event.target.value.toUpperCase())}
                  className={cn(FIELD, 'w-20 uppercase')}
                />
              </div>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="add-post-author"
              className="mb-2 block font-sans text-caption font-semibold uppercase text-ink/60"
            >
              Your name
            </label>
            <input
              id="add-post-author"
              data-modal-author=""
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              placeholder="who is posting?"
              className={FIELD}
            />
          </div>

          <div>
            <label
              htmlFor="add-post-body"
              className="mb-2 block font-sans text-caption font-semibold uppercase text-ink/60"
            >
              Post
            </label>
            <textarea
              id="add-post-body"
              data-modal-body=""
              rows={4}
              maxLength={MAX}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={COLUMN_PROMPTS[selected]}
              className={cn(FIELD, 'resize-y')}
            />
            <p data-modal-count="" className={cn('mt-1.5 text-right text-caption', countClass)}>
              {body.length} / {MAX}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              data-modal-cancel=""
              onClick={onClose}
              className="rounded-full px-5 py-3 font-sans text-body font-semibold text-ink transition-colors duration-200 ease-out hover:bg-cream hover:text-black"
            >
              Cancel
            </button>
            <Button type="submit" disabled={!valid} data-modal-submit="">
              Post to the board
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
