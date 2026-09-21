import { Link } from 'react-router-dom'

// No bees, no hexagons down here.

// TODO: replace the '#' placeholders with real URLs — see README.
const PROGRAM_LINKS = [
  { label: 'BuildPurdue', href: '#' },
  { label: 'Anvil', href: '#' },
  { label: 'Purdue Innovates', href: '#' },
]

const FOLLOW_LINKS = [
  { label: 'LinkedIn', href: '#' },
  { label: 'Instagram', href: '#' },
]

const SPACE_LINKS = [
  { label: 'Guidelines', to: '/space#guidelines' },
  { label: 'Feedback', to: '/space#feedback' },
  { label: 'Supplies', to: '/space#supplies' },
  { label: 'Space info', to: '/space' },
]

// font-sans overrides the base h2 rule, which is Fraunces.
const columnHeading = 'font-sans text-caption font-semibold uppercase text-gold'
const itemLink =
  'text-body-sm text-cream/70 transition-colors duration-200 ease-out hover:text-gold'

export function Footer() {
  return (
    <footer className="mt-auto bg-black text-cream">
      <div className="container-hive grid grid-cols-2 gap-x-8 gap-y-12 py-16 md:grid-cols-4 md:py-20">
        <div>
          <h2 className={columnHeading}>Space</h2>
          <ul className="mt-5 flex flex-col gap-3">
            {SPACE_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className={itemLink}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={columnHeading}>Programs</h2>
          <ul className="mt-5 flex flex-col gap-3">
            {PROGRAM_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} className={itemLink} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={columnHeading}>Follow</h2>
          <ul className="mt-5 flex flex-col gap-3">
            {FOLLOW_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} className={itemLink} target="_blank" rel="noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className={columnHeading}>Contact</h2>
          <ul className="mt-5 flex flex-col gap-3">
            <li>
              <a href="mailto:HIVE@purdue.edu" className={itemLink}>
                HIVE@purdue.edu
              </a>
            </li>
          </ul>
          <p className="mt-6 max-w-[22ch] text-body-sm leading-relaxed text-cream/50">
            Hub for Innovation, Ventures, and Entrepreneurship.
          </p>
        </div>
      </div>

      <div className="border-t border-cream/10">
        <div className="container-hive py-6">
          <p className="text-caption uppercase text-cream/50">Purdue HIVE — 2026</p>
        </div>
      </div>
    </footer>
  )
}
