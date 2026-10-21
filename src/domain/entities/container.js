import { newId } from './id.js'
import { timestamp } from '../support/time.js'

/**
 * A container is the generic thing a note can belong to: a GitHub repository,
 * a document, a folder, a client, a service. The domain never knows about
 * GitHub — `kind` is a free-form label and `url` is optional.
 */
export function normalizeContainerName(name) {
  return String(name ?? '').trim()
}

export function createContainer(input = {}) {
  const name = normalizeContainerName(input.name)

  if (!name) throw new Error('A container needs a name')

  const now = timestamp(input.now)

  return {
    id: input.id ?? newId(),
    name,
    kind: String(input.kind ?? '').trim(),
    url: input.url ? String(input.url).trim() : null,
    parentId: input.parentId ?? null,
    archived: Boolean(input.archived),
    createdAt: timestamp(input.createdAt ?? now),
    updatedAt: timestamp(input.updatedAt ?? now),
  }
}

/**
 * Walks the parent chain upwards, so it is safe against cycles in a
 * corrupted dataset.
 *
 * @param {object[]} containers
 * @param {string} containerId candidate container
 * @param {string} ancestorId expected ancestor
 * @returns {boolean} true when candidate lives inside ancestor
 */
export function isDescendant(containers, containerId, ancestorId) {
  if (!containerId || !ancestorId || containerId === ancestorId) return false

  const byId = new Map(containers.map((container) => [container.id, container]))
  const seen = new Set()
  let current = byId.get(containerId)

  while (current && current.parentId) {
    if (current.parentId === ancestorId) return true
    if (seen.has(current.parentId)) return false
    seen.add(current.parentId)
    current = byId.get(current.parentId)
  }

  return false
}
