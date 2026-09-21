import { Link } from 'react-router-dom'

// Utility links only. No bees, no hexagons down here.
const UTILITY_LINKS = [
  { label: 'Guidelines', to: '/space#guidelines' },
  { label: 'Feedback', to: '/space#feedback' },
  { label: 'Supplies', to: '/space#supplies' },
  { label: 'Space', to: '/space' },
]

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-cream">
      <div className="container-hive flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-display text-body-lg font-black tracking-tight text-black">
            Purdue HIVE
          </span>
          <span className="text-body-sm text-ink">
            Hub for Innovation, Ventures, and Entrepreneurship
          </span>
        </div>

        <nav aria-label="Utility">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {UTILITY_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="text-body-sm text-ink transition-colors duration-200 ease-out hover:text-gold-deep"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="container-hive py-4">
          <p className="text-caption uppercase text-ink">
            Internal member portal — proof of concept
          </p>
        </div>
      </div>
    </footer>
  )
}
