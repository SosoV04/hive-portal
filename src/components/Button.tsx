import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/cn'

export type ButtonVariant = 'primary' | 'secondary'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-full font-sans font-semibold ' +
  'transition-all duration-200 ease-out disabled:cursor-not-allowed disabled:opacity-50'

const VARIANTS: Record<ButtonVariant, string> = {
  // Primary: filled gold, black text.
  primary: 'bg-gold text-black hover:bg-gold-deep hover:text-white',
  // Secondary: outline black, black text.
  secondary: 'border border-black bg-transparent text-black hover:bg-black hover:text-cream',
}

const SIZES = {
  sm: 'px-4 py-2 text-body-sm',
  md: 'px-6 py-3 text-body',
} as const

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: keyof typeof SIZES
  /** Renders a react-router <Link> instead of a <button>. */
  to?: string
  /** Renders an <a> instead of a <button>. */
  href?: string
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  to,
  href,
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], className)

  if (to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer">
        {children}
      </a>
    )
  }

  return (
    <button type="button" className={classes} {...rest}>
      {children}
    </button>
  )
}
