import type { BoardColumn } from '../../data/mock/board-posts'

/**
 * Presentation-side names for the three Board columns.
 *
 * The data module owns COLUMN_LABELS (the uppercase eyebrow form used on the
 * Home preview). These are the sentence-case names the Board itself uses on
 * column headers, filter chips and the Wall legend.
 */
export const COLUMN_TITLES: Record<BoardColumn, string> = {
  'high-five': 'High Fives',
  milestones: 'Milestones',
  'this-week': 'This Week',
}

/** The add-post textarea asks a different question per column. */
export const COLUMN_PROMPTS: Record<BoardColumn, string> = {
  'high-five': 'who deserves a high five today?',
  milestones: 'what did you just ship, sign, or figure out?',
  'this-week': 'what should the cohort know about this week?',
}

/**
 * Wall tile skins — the colour rhythm that stops the honeycomb reading as one
 * flat sheet. Ring is the hex's 2px outer edge, fill is the body.
 */
export const WALL_SKINS: Record<
  BoardColumn,
  { ring: string; fill: string; text: string; chip: string; chipText: string }
> = {
  'high-five': {
    ring: 'bg-gold',
    fill: 'bg-white',
    text: 'text-black',
    chip: 'var(--gold-soft)',
    chipText: 'text-gold-deep',
  },
  milestones: {
    ring: 'bg-gold-deep',
    fill: 'bg-gold-soft',
    text: 'text-black',
    chip: 'var(--white)',
    chipText: 'text-gold-deep',
  },
  'this-week': {
    ring: 'bg-black',
    fill: 'bg-ink',
    text: 'text-cream',
    chip: 'var(--gold)',
    chipText: 'text-black',
  },
}
