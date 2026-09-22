import { daysAgo } from '../../lib/dates'

/**
 * The Board. Home previews the newest post per column; prompt 3 builds the
 * full feed and the honeycomb Wall from the same array.
 *
 * PLACEHOLDER CONTENT — but the voice is not placeholder. These are written
 * the way the cohort actually types: lowercase starts, missing apostrophes,
 * names of real teammates, specific dollar amounts. Resist the urge to tidy
 * the punctuation; a board that reads like it was copy-edited reads like
 * nobody posts on it.
 */

export type BoardColumn = 'high-five' | 'milestones' | 'this-week'

export interface BoardPost {
  id: string
  column: BoardColumn
  author: string
  /** Two letters for the author's hex avatar. */
  authorInitials: string
  team: string
  /** Two letters for the team's hex logo. */
  teamInitials: string
  /** ISO timestamp — rendered as "2 days ago". */
  timestamp: string
  body: string
}

export const COLUMN_LABELS: Record<BoardColumn, string> = {
  'high-five': 'HIGH FIVE',
  milestones: 'MILESTONES',
  'this-week': 'THIS WEEK',
}

export const boardPosts: BoardPost[] = [
  // ---- High Five -------------------------------------------------------
  {
    id: 'post-hf-1',
    column: 'high-five',
    author: 'Nadia Okafor',
    authorInitials: 'NO',
    team: 'Knuckle',
    teamInitials: 'KN',
    timestamp: daysAgo(1, 9, 20),
    body: 'shoutout to maya for spending 40 min helping me debug our stripe integration last night. hero.',
  },
  {
    id: 'post-hf-2',
    column: 'high-five',
    author: 'Devon Michaels',
    authorInitials: 'DM',
    team: 'Rehearsal',
    teamInitials: 'RH',
    timestamp: daysAgo(3, 15, 45),
    body: 'whoever restocked the good coffee — i noticed. the whole room noticed.',
  },
  {
    id: 'post-hf-3',
    column: 'high-five',
    author: 'Priya Raghunathan',
    authorInitials: 'PR',
    team: 'Tailwater',
    teamInitials: 'TW',
    timestamp: daysAgo(6, 20, 10),
    body: 'ben from second helping drove me to the print shop in muncie at 7am because our resin order got misrouted. he did not have to do that',
  },
  {
    id: 'post-hf-4',
    column: 'high-five',
    author: 'Marcus Reyes',
    authorInitials: 'MR',
    team: 'Wabash Weld',
    teamInitials: 'WW',
    timestamp: daysAgo(8, 13, 0),
    body: 'jessica sat through my pitch four times this week and gave me a different note each time. the fourth one was the one.',
  },

  // ---- Milestones ------------------------------------------------------
  {
    id: 'post-ms-1',
    column: 'milestones',
    author: 'Aisha Bennett',
    authorInitials: 'AB',
    team: 'Second Helping',
    teamInitials: 'SH',
    timestamp: daysAgo(2, 18, 5),
    body: "first paying customer!! she's a piano teacher in noblesville and she just venmo'd us $12",
  },
  {
    id: 'post-ms-2',
    column: 'milestones',
    author: 'Nadia Okafor',
    authorInitials: 'NO',
    team: 'Knuckle',
    teamInitials: 'KN',
    timestamp: daysAgo(4, 22, 30),
    body: 'six splints sold at open climb tonight. printer ran all weekend and did not fail once which honestly is the bigger milestone',
  },
  {
    id: 'post-ms-3',
    column: 'milestones',
    author: 'Marcus Reyes',
    authorInitials: 'MR',
    team: 'Wabash Weld',
    teamInitials: 'WW',
    timestamp: daysAgo(7, 11, 50),
    body: 'rover made it the full 1.2 mi loop at celery bog without getting stuck. last attempt it got 300 ft',
  },
  {
    id: 'post-ms-4',
    column: 'milestones',
    author: 'Devon Michaels',
    authorInitials: 'DM',
    team: 'Rehearsal',
    teamInitials: 'RH',
    timestamp: daysAgo(11, 16, 15),
    body: '200 signups in pao hall. we have 340 practice rooms worth of data now and the music school asked us for a copy, which we did not expect',
  },

  // ---- This Week -------------------------------------------------------
  {
    id: 'post-tw-1',
    column: 'this-week',
    author: 'Jessica Lam',
    authorInitials: 'JL',
    team: 'HIVE',
    teamInitials: 'HV',
    timestamp: daysAgo(0, 8, 40),
    body: 'friday 5pm — cohort dinner in the breakroom, jessica ordered from bruno’s. reply here if you are coming so i order enough',
  },
  {
    id: 'post-tw-2',
    column: 'this-week',
    author: 'Tomas Herrera',
    authorInitials: 'TH',
    team: 'Tailwater',
    teamInitials: 'TW',
    timestamp: daysAgo(2, 10, 5),
    body: 'the laser cutter in BHEE 280 is down until thursday. anvil said we can use theirs if we email first',
  },
  {
    id: 'post-tw-3',
    column: 'this-week',
    author: 'Kendra Olusola',
    authorInitials: 'KO',
    team: 'Second Helping',
    teamInitials: 'SH',
    timestamp: daysAgo(3, 19, 25),
    body: 'carpool to indy for elevate pitch night — i have 3 seats. leaving from the BHEE lot at 4:15, text me',
  },
  {
    id: 'post-tw-4',
    column: 'this-week',
    author: 'Ray Whitfield',
    authorInitials: 'RW',
    team: 'HIVE',
    teamInitials: 'HV',
    timestamp: daysAgo(5, 14, 55),
    body: 'reminder that the space badge readers get reset over fall break. if yours stops working its not personal',
  },
]

/** Newest first within one column. The Home preview takes the first. */
export function postsInColumn(column: BoardColumn) {
  return boardPosts
    .filter((post) => post.column === column)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

/** The three columns in display order. */
export const BOARD_COLUMNS: BoardColumn[] = ['high-five', 'milestones', 'this-week']
