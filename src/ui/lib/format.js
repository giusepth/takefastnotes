/**
 * Time formatting for the register.
 *
 * Notes are a stream of moments, so the column shows when a note was
 * captured: the clock for today, the day for this year, the date for
 * anything older. No relative "2 minutes ago" — it re-renders itself and
 * tells the reader nothing they can act on.
 */

// The interface speaks Spanish, so the dates do too: pinning the locale
// keeps a Spanish app coherent even on an English browser.
const LOCALE = 'es'

const TIME = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false })
const DAY = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' })
const FULL = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatNoteTime(iso, now = Date.now()) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const moment = new Date(now)
  const sameDay =
    date.getFullYear() === moment.getFullYear() &&
    date.getMonth() === moment.getMonth() &&
    date.getDate() === moment.getDate()

  if (sameDay) return TIME.format(date)
  if (date.getFullYear() === moment.getFullYear()) return DAY.format(date)
  return FULL.format(date)
}

export function formatFullTime(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${FULL.format(date)}, ${TIME.format(date)}`
}

/**
 * Human-readable byte size for the storage report.
 *
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
