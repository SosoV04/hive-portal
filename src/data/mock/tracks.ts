/**
 * The ten HIVE resource tracks. Rendered by the Resources landing page and
 * routed individually at /resources/:slug.
 *
 * NOTE: these ten titles are a placeholder founder-journey set — swap them for
 * HIVE's real track names in prompt 5.
 */
export interface Track {
  slug: string
  title: string
  blurb: string
}

export const tracks: Track[] = [
  {
    slug: 'idea-validation',
    title: 'Idea Validation',
    blurb: 'Pressure-test the problem before you build anything.',
  },
  {
    slug: 'customer-discovery',
    title: 'Customer Discovery',
    blurb: 'Find the people who have the problem, and learn how they talk about it.',
  },
  {
    slug: 'building-an-mvp',
    title: 'Building an MVP',
    blurb: 'Scope the smallest thing that proves the thesis.',
  },
  {
    slug: 'legal-and-incorporation',
    title: 'Legal & Incorporation',
    blurb: 'Entity choice, founder agreements, equity splits, and vesting.',
  },
  {
    slug: 'intellectual-property',
    title: 'Intellectual Property',
    blurb: 'Patents, disclosures, and what Purdue ownership means for your work.',
  },
  {
    slug: 'fundraising',
    title: 'Fundraising',
    blurb: 'Pre-seed mechanics: SAFEs, valuations, diligence, and investor intros.',
  },
  {
    slug: 'finance-and-accounting',
    title: 'Finance & Accounting',
    blurb: 'Runway, burn, bookkeeping, and the numbers you must know cold.',
  },
  {
    slug: 'go-to-market',
    title: 'Go to Market',
    blurb: 'Positioning, pricing, and the first hundred customers.',
  },
  {
    slug: 'hiring-and-team',
    title: 'Hiring & Team',
    blurb: 'Co-founders, first hires, interns, and building a culture on purpose.',
  },
  {
    slug: 'pitching-and-storytelling',
    title: 'Pitching & Storytelling',
    blurb: 'Deck structure, demo-day craft, and telling a story that lands.',
  },
]
