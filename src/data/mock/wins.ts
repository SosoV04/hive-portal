import { daysAgo } from '../../lib/dates'

/**
 * Recent member wins for the Home strip.
 *
 * PLACEHOLDER CONTENT — invented teams and milestones, written small and
 * concrete on purpose. A win that reads like a press release ("excited to
 * announce our strategic partnership") is the wrong register for this wall.
 */

export type WinKind =
  | 'FIRST CUSTOMER'
  | 'PROTOTYPE SHIPPED'
  | 'PILOT SIGNED'
  | 'FIRST HIRE'
  | 'GRANT AWARDED'

export interface Win {
  id: string
  teamName: string
  /** Two letters for the hex logo. */
  teamInitials: string
  /** ISO timestamp — rendered as "4 days ago". */
  postedAt: string
  /** The win itself, in the founder's own words. */
  body: string
  kind: WinKind
}

export const wins: Win[] = [
  {
    id: 'win-knuckle-first-customer',
    teamName: 'Knuckle',
    teamInitials: 'KN',
    postedAt: daysAgo(2, 21, 40),
    body: 'Sold six splints off a folding table at open climb. $40 each, cash and Venmo, no website involved. Two of them came back the next day for a second finger.',
    kind: 'FIRST CUSTOMER',
  },
  {
    id: 'win-wabash-weld-pilot',
    teamName: 'Wabash Weld',
    teamInitials: 'WW',
    postedAt: daysAgo(5, 14, 10),
    body: 'Lafayette Parks said yes to a free pilot — we map 40 miles of trail with the rover through October and they give us the drainage data.',
    kind: 'PILOT SIGNED',
  },
  {
    id: 'win-rehearsal-prototype',
    teamName: 'Rehearsal',
    teamInitials: 'RH',
    postedAt: daysAgo(9, 23, 5),
    body: 'v2 of the practice room finder is live in Pao Hall. It now notices when somebody leaves early instead of trusting the sign-up sheet, which nobody has ever trusted.',
    kind: 'PROTOTYPE SHIPPED',
  },
  {
    id: 'win-tailwater-grant',
    teamName: 'Tailwater',
    teamInitials: 'TW',
    postedAt: daysAgo(13, 16, 30),
    body: 'Elevate Ventures diligence call went well. The $20k Community Ideation Grant is at the paperwork stage, which I am told is the slow part.',
    kind: 'GRANT AWARDED',
  },
  {
    id: 'win-second-helping-hire',
    teamName: 'Second Helping',
    teamInitials: 'SH',
    postedAt: daysAgo(18, 11, 15),
    body: 'Hired someone who is not a cofounder. Ben starts Monday, he is taking over all the CAD, and I get my weekends back.',
    kind: 'FIRST HIRE',
  },
]
