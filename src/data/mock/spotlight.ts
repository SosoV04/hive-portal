/** Founder spotlight for the Home hero. Populated in prompt 2. */
export interface Spotlight {
  id: string
  name: string
  venture: string
  quote: string
  photo?: string
}

export const spotlight: Spotlight[] = []
