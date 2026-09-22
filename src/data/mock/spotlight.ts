/**
 * Founder spotlight for the Home hero. Rotates weekly — for the MVP that
 * means "someone edits this file on Mondays".
 *
 * PLACEHOLDER CONTENT. The founder, the company and the four answers are
 * invented. Swap them for a real member before this goes in front of the
 * cohort; the shape is what matters here.
 */

export interface SpotlightPrompt {
  /** Caption label above the answer, e.g. "BUILDING". */
  label: string
  answer: string
}

export interface Spotlight {
  slug: string
  name: string
  /** Year + major, shown under the name. */
  standing: string
  teamName: string
  /** Two letters for the logo hex tucked into the photo. */
  teamInitials: string
  /** One line, sentence case — what the company actually does. */
  teamDescription: string
  photoUrl: string
  photoAlt: string
  prompts: SpotlightPrompt[]
}

export const spotlight: Spotlight = {
  slug: 'nadia-okafor',
  name: 'Nadia Okafor',
  standing: 'Junior, Mechanical Engineering — first-generation Boilermaker',
  teamName: 'Knuckle',
  teamInitials: 'KN',
  teamDescription: 'Custom 3D-printed finger splints, fitted from a phone scan.',
  // Warm, well-lit portrait. Verified 200 OK; swap freely, it is a placeholder.
  photoUrl:
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=760&q=80&auto=format&fit=crop&crop=faces',
  photoAlt: 'Nadia Okafor, founder of Knuckle',
  prompts: [
    {
      label: 'BUILDING',
      answer:
        'The scan-to-print pipeline. Phone video in, printable splint out. Down to 11 minutes, 8 of them mesh cleanup.',
    },
    {
      label: 'EXCITED ABOUT',
      answer:
        'The Co-Rec gave us a table at Thursday open climb. 23 scans in two hours, six people paid on the spot.',
    },
    {
      label: 'NEED HELP WITH',
      answer:
        'Anyone who has been through FDA Class I registration for a splint. Four reads of the guidance and I still cannot tell if we are exempt.',
    },
    {
      label: 'ASK ME ABOUT',
      answer:
        'Printing TPU on a Bambu, and why fitting anything to a hand is a harder shape than it looks.',
    },
  ],
}
