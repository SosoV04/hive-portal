import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Hex } from './Hex'
import { cn } from '../lib/cn'

const LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Board', to: '/board' },
  { label: 'Schedule', to: '/schedule' },
  { label: 'Resources', to: '/resources' },
  { label: 'Directory', to: '/directory' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'text-body-sm font-medium transition-colors duration-200 ease-out',
    isActive ? 'text-black' : 'text-ink hover:text-gold-deep',
  )

export function Nav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-cream/90 backdrop-blur">
      <div className="container-hive flex h-16 items-center justify-between md:h-20">
        {/* Logo frame — a sanctioned hexagon use. */}
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Hex size={36} variant="filled">
            <span className="font-display text-[0.7rem] font-black tracking-tight text-black">
              H
            </span>
          </Hex>
          <span className="flex flex-col leading-none">
            <span className="font-display text-body-lg font-black tracking-tight text-black">
              HIVE
            </span>
            <span className="text-[0.6rem] uppercase tracking-[0.08em] text-ink">Purdue</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          className="text-black md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open ? (
        <nav className="border-t border-border bg-cream md:hidden" aria-label="Primary mobile">
          <div className="container-hive flex flex-col gap-1 py-4">
            {LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-body font-medium transition-colors duration-200 ease-out',
                    isActive ? 'bg-gold-soft text-black' : 'text-ink hover:bg-gold-soft',
                  )
                }
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  )
}
