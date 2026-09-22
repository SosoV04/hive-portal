import { daysAgo, todayAt } from '../../lib/dates'

/**
 * The Board. Home previews the newest post per column; the Board page builds
 * the full feed and the honeycomb Wall from the same array.
 *
 * PLACEHOLDER CONTENT — but the voice is not placeholder. These are written
 * the way the cohort actually types: lowercase starts, missing apostrophes,
 * names of real teammates, specific dollar amounts. Resist the urge to tidy
 * the punctuation; a board that reads like it was copy-edited reads like
 * nobody posts on it.
 *
 * TIMESTAMPS are spread so the Board's timeframe filter has something to do:
 * two posts today, four more inside the last week, the rest inside the month.
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
  /** Starting reaction counts. Deliberately small — nothing above 15. */
  reactions: { bee: number; heart: number }
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
    timestamp: todayAt(6, 5),
    body: 'shoutout to maya for spending 40 min helping me debug our stripe integration last night. hero.',
    reactions: { bee: 12, heart: 7 },
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
    reactions: { bee: 14, heart: 9 },
  },
  {
    id: 'post-hf-3',
    column: 'high-five',
    author: 'Priya Raghunathan',
    authorInitials: 'PR',
    team: 'Tailwater',
    teamInitials: 'TW',
    timestamp: daysAgo(9, 20, 10),
    body: 'ben from second helping drove me to the print shop in muncie at 7am because our resin order got misrouted. he did not have to do that',
    reactions: { bee: 10, heart: 11 },
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
    reactions: { bee: 6, heart: 8 },
  },
  {
    id: 'post-hf-5',
    column: 'high-five',
    author: 'Aisha Bennett',
    authorInitials: 'AB',
    team: 'Second Helping',
    teamInitials: 'SH',
    timestamp: daysAgo(16, 21, 15),
    body: 'ray stayed till 11 on a friday to get the label printer talking to the laptop again. he does not even work on our team',
    reactions: { bee: 8, heart: 12 },
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
    reactions: { bee: 15, heart: 13 },
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
    reactions: { bee: 11, heart: 5 },
  },
  {
    id: 'post-ms-3',
    column: 'milestones',
    author: 'Marcus Reyes',
    authorInitials: 'MR',
    team: 'Wabash Weld',
    teamInitials: 'WW',
    timestamp: daysAgo(12, 11, 50),
    body: 'rover made it the full 1.2 mi loop at celery bog without getting stuck. last attempt it got 300 ft',
    reactions: { bee: 9, heart: 4 },
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
    reactions: { bee: 13, heart: 6 },
  },
  {
    id: 'post-ms-5',
    column: 'milestones',
    author: 'Tomas Herrera',
    authorInitials: 'TH',
    team: 'Tailwater',
    teamInitials: 'TW',
    timestamp: daysAgo(18, 15, 40),
    body: 'wabash township signed the pilot. one page, one signature, eleven weeks of asking. we start sampling in march',
    reactions: { bee: 12, heart: 7 },
  },
  {
    id: 'post-ms-6',
    column: 'milestones',
    author: 'Kendra Olusola',
    authorInitials: 'KO',
    team: 'Second Helping',
    teamInitials: 'SH',
    timestamp: daysAgo(23, 9, 10),
    body: 'broke even on materials this month. barely, and only because the co-op gave us their bruised stock for free, but the sheet says black',
    reactions: { bee: 7, heart: 5 },
  },

  // ---- This Week -------------------------------------------------------
  {
    id: 'post-tw-1',
    column: 'this-week',
    author: 'Jessica Lam',
    authorInitials: 'JL',
    team: 'HIVE',
    teamInitials: 'HV',
    timestamp: todayAt(8, 40),
    body: 'friday 5pm — cohort dinner in the breakroom, jessica ordered from bruno’s. reply here if you are coming so i order enough',
    reactions: { bee: 10, heart: 6 },
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
    reactions: { bee: 5, heart: 3 },
  },
  {
    id: 'post-tw-3',
    column: 'this-week',
    author: 'Kendra Olusola',
    authorInitials: 'KO',
    team: 'Second Helping',
    teamInitials: 'SH',
    timestamp: daysAgo(10, 19, 25),
    body: 'carpool to indy for elevate pitch night — i have 3 seats. leaving from the BHEE lot at 4:15, text me',
    reactions: { bee: 6, heart: 4 },
  },
  {
    id: 'post-tw-4',
    column: 'this-week',
    author: 'Ray Whitfield',
    authorInitials: 'RW',
    team: 'HIVE',
    teamInitials: 'HV',
    timestamp: daysAgo(13, 14, 55),
    body: 'reminder that the space badge readers get reset over fall break. if yours stops working its not personal',
    reactions: { bee: 4, heart: 3 },
  },
  {
    id: 'post-tw-5',
    column: 'this-week',
    author: 'Jessica Lam',
    authorInitials: 'JL',
    team: 'HIVE',
    teamInitials: 'HV',
    timestamp: daysAgo(26, 12, 30),
    body: 'office hours moved to tuesdays 2-4 for the rest of the month. same room, i just could not hold the thursday slot',
    reactions: { bee: 3, heart: 2 },
  },
]

/** Newest first. The Board sorts its own state copy with this comparator. */
export function byNewest(a: BoardPost, b: BoardPost) {
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
}

/** Newest first within one column. The Home preview takes the first. */
export function postsInColumn(column: BoardColumn) {
  return boardPosts.filter((post) => post.column === column).sort(byNewest)
}

/** Every team that has posted, alphabetical. Feeds the Board's team filter. */
export function uniqueTeams(posts: BoardPost[] = boardPosts) {
  return [...new Set(posts.map((post) => post.team))].sort((a, b) => a.localeCompare(b))
}

/** The three columns in display order. */
export const BOARD_COLUMNS: BoardColumn[] = ['high-five', 'milestones', 'this-week']
