/**
 * Note types. A note describes WHAT it is, never in which state it is
 * (that is `status`).
 */
export const KINDS = Object.freeze(['note', 'idea', 'feature', 'fix', 'decision', 'question'])

export const DEFAULT_KIND = 'note'

export function isKind(value) {
  return KINDS.includes(value)
}

export function normalizeKind(value) {
  return isKind(value) ? value : DEFAULT_KIND
}
