import { timestamp } from '../support/time.js'
import { deriveTitle } from '../entities/note.js'
import { isKind, normalizeKind } from '../policies/kinds.js'
import { isStatus } from '../policies/statuses.js'
import { normalizeTag, normalizeTags } from '../policies/tags.js'

function touch(note, now) {
  return { ...note, updatedAt: timestamp(now) }
}

export function setStatus(note, status, options = {}) {
  if (!isStatus(status)) throw new Error(`Unknown status: ${status}`)
  return touch({ ...note, status }, options.now)
}

export function setKind(note, kind, options = {}) {
  if (!isKind(kind)) throw new Error(`Unknown kind: ${kind}`)
  return touch({ ...note, kind: normalizeKind(kind) }, options.now)
}

export function setPinned(note, pinned, options = {}) {
  return touch({ ...note, pinned: Boolean(pinned) }, options.now)
}

/**
 * Edits the content of a note.
 *
 * A note always keeps a title and a body: emptying the title falls back to
 * the first line of the body, and emptying both is rejected — a note with
 * no content is not a note.
 *
 * The title follows the body only while it was never written by hand: a
 * title that still matches what the body would derive is an artifact, and
 * leaving it behind after an edit would show a stale headline. A title the
 * writer touched is theirs, and the body does not move it.
 *
 * @param {object} note
 * @param {{title?: string, body?: string}} changes
 * @param {{now?: string}} [options]
 * @returns {object} note
 */
export function editNote(note, changes = {}, options = {}) {
  const body = changes.body !== undefined ? String(changes.body) : note.body
  const requestedTitle = changes.title !== undefined ? String(changes.title).trim() : note.title
  const bodyChanged = body !== note.body
  // A title that still matches what the body would derive is an artifact of
  // the body, not something the writer chose. Anything else was written by
  // hand and the body does not get to move it.
  const titleWasDerived = note.title === deriveTitle(note.body)
  const titleChangedInThisEdit =
    changes.title !== undefined && String(changes.title).trim() !== note.title

  let title = requestedTitle

  if (bodyChanged && titleWasDerived && !titleChangedInThisEdit) {
    const derived = deriveTitle(body)
    if (derived) title = derived
  }

  if (!title) title = deriveTitle(body)

  if (!body.trim() && !title.trim()) {
    throw new Error('A note needs a body or a title')
  }

  return touch({ ...note, title, body }, options.now)
}

export function setArchived(note, archived, options = {}) {
  return touch({ ...note, archived: Boolean(archived) }, options.now)
}

export function addTag(note, tag, options = {}) {
  const normalized = normalizeTag(tag)
  if (!normalized) return note
  return touch({ ...note, tags: normalizeTags([...note.tags, normalized]) }, options.now)
}

export function removeTag(note, tag, options = {}) {
  const normalized = normalizeTag(tag)
  return touch({ ...note, tags: note.tags.filter((item) => item !== normalized) }, options.now)
}

/**
 * Moves a note to another container. `null` means unclassified.
 *
 * @param {object} note
 * @param {string | null} containerId
 * @param {{containers?: object[], now?: string}} [options]
 */
export function moveNote(note, containerId, options = {}) {
  const { containers = [] } = options
  const next = containerId ?? null

  if (next !== null && !containers.some((container) => container.id === next)) {
    throw new Error(`Unknown container: ${next}`)
  }

  return touch({ ...note, containerId: next }, options.now)
}
