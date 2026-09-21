import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '../lib/cn'

export const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Board', to: '/board' },
  { label: 'Schedule', to: '/schedule' },
  { label: 'Resources', to: '/resources' },
  { label: 'Directory', to: '/directory' },
]

const EASE_HIVE = [0.22, 1, 0.36, 1] as const

function Wordmark({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      to="/"
      onClick={onClick}
      aria-label="Purdue HIVE — home"
      className="font-display text-[1.6rem] font-black leading-none tracking-[-0.02em] text-black"
    >
      HIVE
    </Link>
  )
}

export function Nav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // Close the drawer on navigation.
  useEffect(() => setOpen(false), [pathname])

  // Lock body scroll and wire Escape while the drawer is open.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-white">
        <div className="container-hive flex h-[72px] items-center justify-between">
          <Wordmark />

          <nav className="hidden items-center gap-10 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className="relative py-2 font-sans text-body-sm font-medium text-ink transition-colors duration-200 ease-out hover:text-black aria-[current=page]:text-black"
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive ? (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute -bottom-px left-0 right-0 h-[2px] rounded-full bg-gold"
                        transition={{ duration: 0.35, ease: EASE_HIVE }}
                      />
                    ) : null}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="-mr-2 p-2 text-black md:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Full-screen mobile drawer. */}
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-50 bg-cream md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="container-hive flex h-[72px] items-center justify-between">
              <Wordmark onClick={() => setOpen(false)} />
              <button
                type="button"
                className="-mr-2 p-2 text-black"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <nav className="container-hive flex flex-col gap-2 pt-8" aria-label="Primary mobile">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.04 * i, ease: EASE_HIVE }}
                >
                  <NavLink
                    to={link.to}
                    end={link.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'block border-b border-border py-5 font-display text-display-md font-semibold transition-colors duration-200 ease-out',
                        isActive ? 'text-gold-deep' : 'text-black',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}
