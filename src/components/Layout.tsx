import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Nav } from './Nav'
import { Footer } from './Footer'

/** Reset scroll on navigation, but honour in-page hash targets. */
function useScrollReset() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
      return
    }
    window.scrollTo({ top: 0 })
  }, [pathname, hash])
}

export function Layout() {
  useScrollReset()

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Nav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
