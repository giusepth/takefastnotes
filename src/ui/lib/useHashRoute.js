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

/** A single note has its own address: `#/nota/<id>`. */
export const NOTE_ROUTE_PREFIX = '/nota/'

export function noteRoute(noteId) {
  return `${NOTE_ROUTE_PREFIX}${noteId}`
}

/**
 * Turns a route into an href.
 *
 * The fragment is what makes the route a route: without the `#` the
 * browser would treat it as a path and leave the app.
 */
export function hashHref(route) {
  return `#${route}`
}

export function noteIdFromRoute(route) {
  if (!route || !route.startsWith(NOTE_ROUTE_PREFIX)) return null
  const id = route.slice(NOTE_ROUTE_PREFIX.length)
  return id.length > 0 ? id : null
}

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
