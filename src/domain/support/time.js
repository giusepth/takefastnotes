/**
 * Timestamp helper.
 *
 * Every timestamp in the system is an ISO-8601 string: the raw IndexedDB
 * content stays human-readable, diff-friendly and sortable as text.
 *
 * @param {string | Date | undefined} now
 * @returns {string} ISO-8601 timestamp
 */
export function timestamp(now) {
  if (typeof now === 'string') return now
  if (now instanceof Date) return now.toISOString()
  return new Date().toISOString()
}
