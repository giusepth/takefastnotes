import { useEffect, useState } from 'react'

/**
 * Hash routing.
 *
 * The fragment never reaches the server, so the same build works on any
 * static host without a rewrite rule. It also keeps the app's state
 * addressable: a view can be linked, and the back button behaves.
 */
export const ROUTES = Object.freeze({
  notes: '/notas',
  containers: '/contenedores',
  about: '/acerca',
})

function readHash() {
  if (typeof window === 'undefined') return ROUTES.notes
  const hash = window.location.hash.replace(/^#/, '')
  return hash || ROUTES.notes
}

export function useHashRoute() {
  const [route, setRoute] = useState(readHash)

  useEffect(() => {
    function handleChange() {
      setRoute(readHash())
    }

    window.addEventListener('hashchange', handleChange)
    return () => window.removeEventListener('hashchange', handleChange)
  }, [])

  return route
}

export function isKnownRoute(route) {
  return Object.values(ROUTES).includes(route)
}
