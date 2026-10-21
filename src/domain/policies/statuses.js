/**
 * Note status. A fixed lifecycle keeps filters predictable and the UI fast.
 */
export const STATUSES = Object.freeze(['inbox', 'backlog', 'planned', 'doing', 'done', 'dropped'])

export const DEFAULT_STATUS = 'inbox'

export function isStatus(value) {
  return STATUSES.includes(value)
}

export function normalizeStatus(value) {
  return isStatus(value) ? value : DEFAULT_STATUS
}
