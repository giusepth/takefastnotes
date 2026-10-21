import { newId } from './id.js'
import { timestamp } from '../support/time.js'
import { DEFAULT_KIND, normalizeKind } from '../policies/kinds.js'
import { DEFAULT_STATUS, normalizeStatus } from '../policies/statuses.js'
import { normalizeTags } from '../policies/tags.js'

export const TITLE_MAX_LENGTH = 80

/**
 * Derives a title from the first meaningful line of a body.
 *
 * @param {string} body
 * @returns {string}
 */
export function deriveTitle(body) {
  const line = String(body ?? '')
    .split('\n')
    .map((part) => part.trim())
    .find((part) => part.length > 0)

  if (!line) return ''
  if (line.length <= TITLE_MAX_LENGTH) return line
  return `${line.slice(0, TITLE_MAX_LENGTH - 1).trimEnd()}…`
}

/**
 * Builds a valid note. Titles are optional: when absent they are derived
 * from the body, so capturing never requires more than one keystroke.
 *
 * @param {object} input
 * @returns {object} note
 */
export function createNote(input = {}) {
  const body = String(input.body ?? '')
  const title = String(input.title ?? '').trim() || deriveTitle(body)

  if (!body.trim() && !title.trim()) {
    throw new Error('A note needs a body or a title')
  }

  const now = timestamp(input.now)

  return {
    id: input.id ?? newId(),
    title,
    body,
    kind: normalizeKind(input.kind ?? DEFAULT_KIND),
    status: normalizeStatus(input.status ?? DEFAULT_STATUS),
    tags: normalizeTags(input.tags),
    containerId: input.containerId ?? null,
    pinned: Boolean(input.pinned),
    archived: Boolean(input.archived),
    createdAt: timestamp(input.createdAt ?? now),
    updatedAt: timestamp(input.updatedAt ?? now),
  }
}
