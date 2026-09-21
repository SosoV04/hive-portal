/** Workshops, office hours, demo days. Populated in prompt 2 / prompt 4. */
export interface HiveEvent {
  id: string
  title: string
  starts: string
  location: string
  kind: string
}

export const events: HiveEvent[] = []
