import {
  Calculator,
  Code,
  Compass,
  Cpu,
  Handshake,
  Layers,
  MessagesSquare,
  Scale,
  Settings2,
  TrendingUp,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * The ten HIVE resource tracks. LOCKED — slugs, names, taglines and icons are
 * fixed. Rendered by the Resources landing page and routed individually at
 * /resources/:slug.
 */

export type TrackIconName =
  | 'Code'
  | 'Layers'
  | 'MessagesSquare'
  | 'Handshake'
  | 'TrendingUp'
  | 'Calculator'
  | 'Settings2'
  | 'Cpu'
  | 'Scale'
  | 'Compass'

export interface Track {
  slug: string
  name: string
  tagline: string
  description: string
  iconName: TrackIconName
}

/** Name -> component, so icons stay statically imported and tree-shakeable. */
export const trackIcons: Record<TrackIconName, LucideIcon> = {
  Code,
  Layers,
  MessagesSquare,
  Handshake,
  TrendingUp,
  Calculator,
  Settings2,
  Cpu,
  Scale,
  Compass,
}

export const tracks: Track[] = [
  {
    slug: 'software-engineering',
    name: 'Software & Engineering',
    tagline: 'Ship faster, build cleaner.',
    description:
      "For the track where you're writing the code yourself, or trying to tell whether the code you paid someone else for is any good. Stacks, architecture, deployment, and the small habits that keep a two-person codebase from collapsing in month four.",
    iconName: 'Code',
  },
  {
    slug: 'product-ux',
    name: 'Product & UX',
    tagline: 'Design what people actually want.',
    description:
      'For when the thing works but nobody can figure out how to use it. Wireframes, user flows, interface patterns, and how to run a usability test that tells you something you did not already believe.',
    iconName: 'Layers',
  },
  {
    slug: 'customer-discovery',
    name: 'Customer Discovery',
    tagline: 'Talk to users before you build.',
    description:
      'Start here if you have a strong hunch and no evidence. How to find people worth interviewing, ask questions that do not lead them, and hear the difference between polite encouragement and a real buying signal.',
    iconName: 'MessagesSquare',
  },
  {
    slug: 'sales-bd',
    name: 'Sales & BD',
    tagline: 'Find your first ten customers.',
    description:
      'For founders who feel deeply weird about selling and have to do it anyway. Cold outreach, discovery calls, pricing conversations, pilot agreements, and how to follow up without sounding desperate.',
    iconName: 'Handshake',
  },
  {
    slug: 'marketing-growth',
    name: 'Marketing & Growth',
    tagline: 'Sharpen your story, grow your reach.',
    description:
      'For when you can explain your product to a friend but not to a stranger. Positioning, landing pages, content, launches, and which channels are actually worth your time when you are also carrying fifteen credit hours.',
    iconName: 'TrendingUp',
  },
  {
    slug: 'finance-business-model',
    name: 'Finance & Business Model',
    tagline: 'Pressure-test your unit economics.',
    description:
      'For the spreadsheet you have been avoiding. Pricing, margins, burn, runway, and how to build a model that holds up when someone asks where each number came from.',
    iconName: 'Calculator',
  },
  {
    slug: 'operations-automation',
    name: 'Operations & Automation',
    tagline: 'Turn manual work into leverage.',
    description:
      'For the founder doing the same task by hand for the fortieth time. Tooling, workflows, no-code automation, and learning to tell which processes are worth systematizing and which you should just keep doing.',
    iconName: 'Settings2',
  },
  {
    slug: 'hardware-prototyping',
    name: 'Hardware & Prototyping',
    tagline: 'From napkin sketch to working prototype.',
    description:
      'For anything physical — devices, mechanisms, materials. CAD, fabrication, the machines you can actually get access to on campus, and the gap between a demo that survives one pitch and a design that survives manufacturing.',
    iconName: 'Cpu',
  },
  {
    slug: 'legal-ip-regulatory',
    name: 'Legal, IP & Regulatory',
    tagline: 'Set your foundation on solid ground.',
    description:
      'For the questions that get expensive if you answer them late. Entity formation, founder equity and vesting, what the University does and does not own of your work, provisionals and patents, and the rules specific to your industry.',
    iconName: 'Scale',
  },
  {
    slug: 'founder-strategy',
    name: 'Founder Strategy',
    tagline: 'Think through the hard, messy problems.',
    description:
      'For the decisions with no obviously right answer. Co-founder conflict, when to pivot, splitting your attention between a startup and a degree, raising versus bootstrapping, and how to tell the difference between a rough patch and a dead end.',
    iconName: 'Compass',
  },
]
