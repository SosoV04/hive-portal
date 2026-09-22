import { nextWeekday } from '../../lib/dates'

/**
 * HIVE calendar. Home shows the next three; the Schedule page uses all eight.
 *
 * PLACEHOLDER CONTENT — plausible formats, real buildings, invented hosts and
 * exact times. Internal events sit in BHEE (Birck Hall / the HIVE space);
 * cross-campus and external ones name the actual room where they would happen.
 */

export type EventType = 'internal' | 'cross-campus' | 'external'

export interface HiveEvent {
  id: string
  title: string
  type: EventType
  /** ISO start timestamp. */
  starts: string
  /** ISO end timestamp. */
  ends: string
  location: string
  hostName: string
  /** Two letters for the host's hex avatar. */
  hostInitials: string
  /** One line for the Schedule page; Home shows only title, time and place. */
  blurb: string
}

// Weekday constants, so the intent of each nextWeekday() call is readable.
const MON = 1
const TUE = 2
const WED = 3
const THU = 4
const FRI = 5

const unsorted: HiveEvent[] = [
  {
    id: 'evt-hive-table',
    title: 'HIVE Table',
    type: 'internal',
    starts: nextWeekday(THU, 1, 18, 30),
    ends: nextWeekday(THU, 1, 20, 0),
    location: 'BHEE 270',
    hostName: 'Jessica Lam',
    hostInitials: 'JL',
    blurb: 'Cohort dinner. One long table, no agenda, food ordered at 6.',
  },
  {
    id: 'evt-pitch-pizza',
    title: 'Pitch & Pizza',
    type: 'internal',
    starts: nextWeekday(TUE, 1, 17, 30),
    ends: nextWeekday(TUE, 1, 19, 0),
    location: 'BHEE 280',
    hostName: 'Marcus Reyes',
    hostInitials: 'MR',
    blurb: 'Five minutes each, five minutes of teardown. Sign-up sheet is on the fridge.',
  },
  {
    id: 'evt-founder-hot-seat',
    title: 'Founder Hot Seat',
    type: 'internal',
    starts: nextWeekday(WED, 6, 16, 0),
    ends: nextWeekday(WED, 6, 17, 30),
    location: 'BHEE 270',
    hostName: 'Priya Raghunathan',
    hostInitials: 'PR',
    blurb: 'One founder, one problem, forty minutes of the room picking it apart.',
  },
  {
    id: 'evt-builders-founders',
    title: 'Builders × Founders — mixer with EPICS',
    type: 'cross-campus',
    starts: nextWeekday(THU, 8, 17, 0),
    ends: nextWeekday(THU, 8, 19, 0),
    location: 'Armstrong Hall 1109',
    hostName: 'Devon Michaels',
    hostInitials: 'DM',
    blurb: 'EPICS teams have hardware and no customers. You have customers and no hardware.',
  },
  {
    id: 'evt-builders-finance',
    title: 'Builders × Finance — with Brock-Wilson',
    type: 'cross-campus',
    starts: nextWeekday(MON, 13, 18, 0),
    ends: nextWeekday(MON, 13, 19, 30),
    location: 'Rawls Hall 1062',
    hostName: 'Aisha Bennett',
    hostInitials: 'AB',
    blurb: 'Bring a cap table you do not understand. Leave understanding slightly more of it.',
  },
  {
    id: 'evt-anvil-workshop',
    title: 'Anvil workshop — customer discovery that is not a survey',
    type: 'external',
    starts: nextWeekday(WED, 2, 19, 0),
    ends: nextWeekday(WED, 2, 20, 30),
    location: 'The Anvil, 320 North St',
    hostName: 'Tomas Herrera',
    hostInitials: 'TH',
    blurb: 'Run by Anvil staff. Open to anyone, but they cap the room at 30.',
  },
  {
    id: 'evt-elevate-pitch-night',
    title: 'Elevate Ventures pitch night',
    type: 'external',
    starts: nextWeekday(THU, 15, 18, 0),
    ends: nextWeekday(THU, 15, 21, 0),
    location: 'The Union 525, Indianapolis',
    hostName: 'Kendra Olusola',
    hostInitials: 'KO',
    blurb: 'Carpool leaves BHEE at 4:15. Applications closed, but spectating is open.',
  },
  {
    id: 'evt-svbig-dinner',
    title: 'SVBIG dinner — Boilermakers back from the Bay',
    type: 'external',
    starts: nextWeekday(FRI, 16, 18, 30),
    ends: nextWeekday(FRI, 16, 21, 0),
    location: 'Purdue Memorial Union, Anniversary Drawing Room',
    hostName: 'Ray Whitfield',
    hostInitials: 'RW',
    blurb: 'Alumni dinner. Dress is nicer than you think and the conversations are worth it.',
  },
]

// Sorted once here, so every consumer can trust index order is chronological.
export const events: HiveEvent[] = [...unsorted].sort(
  (a, b) => new Date(a.starts).getTime() - new Date(b.starts).getTime(),
)

/** The next `count` events. Home shows three; the Schedule page shows all. */
export function upcomingEvents(count = events.length) {
  return events.slice(0, count)
}
