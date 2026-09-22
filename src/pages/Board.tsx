import { useCallback, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { AddPostModal } from '../components/board/AddPostModal'
import { BoardHeader, type BoardView } from '../components/board/BoardHeader'
import { ColumnsView } from '../components/board/ColumnsView'
import { FilterBar } from '../components/board/FilterBar'
import { WallView } from '../components/board/WallView'
import type { ReactionKind } from '../components/board/PostCard'
import {
  DEFAULT_FILTERS,
  filterPosts,
  isFiltered,
  type BoardFilters,
  type Timeframe,
} from '../components/board/filters'
import {
  boardPosts,
  uniqueTeams,
  type BoardColumn,
  type BoardPost,
} from '../data/mock/board-posts'

const EASE_HIVE = [0.22, 1, 0.36, 1] as const

/**
 * The Board — the digital version of the physical pulse board.
 *
 * All state lives here: no context, no store. Filtering is a derived value
 * computed on every render rather than an effect writing a second copy of the
 * list, which is the usual way a filtered feed starts lying about its counts.
 */
export default function Board() {
  // A copy, not the import: reacting to a post and posting a new one both
  // write to state, and mutating the mock module would leak into the Home
  // preview (and into whichever test ran next).
  const [posts, setPosts] = useState<BoardPost[]>(() => boardPosts.map((post) => ({ ...post })))
  const [view, setView] = useState<BoardView>('columns')
  const [visibleColumns, setVisibleColumns] = useState(DEFAULT_FILTERS.visibleColumns)
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [timeframe, setTimeframe] = useState<Timeframe>('month')
  const [modalOpen, setModalOpen] = useState<false | { column: BoardColumn }>(false)
  const [reacted, setReacted] = useState<Record<string, { bee: boolean; heart: boolean }>>({})
  const [newPostIds, setNewPostIds] = useState<string[]>([])

  /** Whatever opened the modal, so focus can go back to it on close. */
  const trigger = useRef<HTMLElement | null>(null)
  const reduceMotion = useReducedMotion()

  const filters: BoardFilters = { visibleColumns, selectedTeams, timeframe }
  const visible = filterPosts(posts, filters)
  const teams = useMemo(() => uniqueTeams(posts), [posts])

  const toggleColumn = (column: BoardColumn) =>
    setVisibleColumns((current) => ({ ...current, [column]: !current[column] }))

  const toggleTeam = (team: string) =>
    setSelectedTeams((current) =>
      current.includes(team) ? current.filter((name) => name !== team) : [...current, team],
    )

  const clearFilters = () => {
    setVisibleColumns(DEFAULT_FILTERS.visibleColumns)
    setSelectedTeams([])
    setTimeframe(DEFAULT_FILTERS.timeframe)
  }

  const openModal = (column: BoardColumn) => {
    trigger.current = document.activeElement as HTMLElement | null
    setModalOpen({ column })
  }

  const closeModal = useCallback(() => {
    const previous = trigger.current
    setModalOpen(false)
    // After the dialog unmounts, or the focus call lands on a dead node.
    requestAnimationFrame(() => previous?.focus())
  }, [])

  const react = useCallback(
    (postId: string, kind: ReactionKind) => {
      const mine = reacted[postId]?.[kind] ?? false
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? {
                ...post,
                reactions: { ...post.reactions, [kind]: post.reactions[kind] + (mine ? -1 : 1) },
              }
            : post,
        ),
      )
      setReacted((current) => {
        const existing = current[postId] ?? { bee: false, heart: false }
        return { ...current, [postId]: { ...existing, [kind]: !mine } }
      })
    },
    [reacted],
  )

  const addPost = (post: BoardPost) => {
    setPosts((current) => [post, ...current])
    // A post you just wrote must not land behind a filter you forgot about.
    setVisibleColumns((current) => ({ ...current, [post.column]: true }))
    setSelectedTeams((current) =>
      current.length === 0 || current.includes(post.team) ? current : [...current, post.team],
    )
    setNewPostIds((current) => [...current, post.id])
    window.setTimeout(() => {
      setNewPostIds((current) => current.filter((id) => id !== post.id))
    }, 700)
    closeModal()
  }

  return (
    <>
      <BoardHeader
        view={view}
        onViewChange={setView}
        onAddPost={() => openModal('high-five')}
      />

      <FilterBar
        filters={filters}
        teams={teams}
        shown={visible.length}
        total={posts.length}
        dirty={isFiltered(filters)}
        onToggleColumn={toggleColumn}
        onToggleTeam={toggleTeam}
        onClearTeams={() => setSelectedTeams([])}
        onTimeframe={setTimeframe}
        onClear={clearFilters}
      />

      <section className="container-hive py-10 md:py-12">
        <div id="board-body" role="tabpanel" aria-labelledby={`board-view-${view}`}>
          {/*
            One 300ms fade-and-settle on the incoming view. Card positions are
            deliberately not animated across the swap — with sixteen posts the
            per-card layout animation stutters and reads as a glitch.
          */}
          <motion.div
            key={view}
            // `initial={false}` under reduced motion, not just duration 0: a
            // zero-length animation still paints one frame of the initial
            // state, and one frame at opacity 0 is a flash, not an instant
            // swap. Starting from the target values skips it.
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE_HIVE }}
          >
            {view === 'columns' ? (
              <ColumnsView
                posts={visible}
                visibleColumns={visibleColumns}
                reacted={reacted}
                newPostIds={newPostIds}
                onReact={react}
                onAddPost={openModal}
              />
            ) : (
              <WallView
                posts={visible}
                visibleColumns={visibleColumns}
                reacted={reacted}
                onReact={react}
              />
            )}
          </motion.div>
        </div>
      </section>

      {modalOpen ? (
        <AddPostModal
          column={modalOpen.column}
          teams={teams}
          onClose={closeModal}
          onSubmit={addPost}
        />
      ) : null}
    </>
  )
}
