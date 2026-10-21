import { createContainer, isDescendant } from '../entities/container.js'
import { timestamp } from '../support/time.js'

export { createContainer, isDescendant }

/**
 * Returns every descendant id of a container (the container itself excluded).
 * Cycle safe: a corrupted parent chain cannot hang the UI.
 *
 * @param {object[]} containers
 * @param {string} containerId
 * @returns {string[]}
 */
export function collectDescendants(containers, containerId) {
  const byParent = new Map()
  for (const container of containers) {
    const key = container.parentId ?? '__root__'
    if (!byParent.has(key)) byParent.set(key, [])
    byParent.get(key).push(container.id)
  }

  const result = []
  const seen = new Set([containerId])
  const queue = [containerId]

  while (queue.length > 0) {
    const current = queue.shift()
    for (const child of byParent.get(current) ?? []) {
      if (seen.has(child)) continue
      seen.add(child)
      result.push(child)
      queue.push(child)
    }
  }

  return result
}

/**
 * A container can only be nested under a container that is not itself
 * nor one of its descendants.
 */
export function canNest(containers, containerId, parentId) {
  if (!parentId) return true
  if (containerId === parentId) return false
  return !isDescendant(containers, parentId, containerId)
}

export function renameContainer(container, name, options = {}) {
  const next = String(name ?? '').trim()
  if (!next) throw new Error('A container needs a name')
  return { ...container, name: next, updatedAt: timestamp(options.now) }
}

export function setContainerParent(container, parentId, options = {}) {
  const { containers = [] } = options
  if (!canNest(containers, container.id, parentId)) {
    throw new Error('A container cannot be nested inside itself')
  }
  return { ...container, parentId: parentId ?? null, updatedAt: timestamp(options.now) }
}

/**
 * Removes a container without losing anything.
 *
 * The container disappears, its children move up to where it was, and every
 * note that lived inside it (or inside one of its descendants) becomes
 * unclassified instead of pointing at a container that no longer exists.
 *
 * @param {object[]} containers
 * @param {object[]} notes
 * @param {string} containerId
 * @returns {{containers: object[], notes: object[]}}
 */
export function removeContainer(containers, notes, containerId) {
  const target = containers.find((container) => container.id === containerId)
  if (!target) throw new Error(`Container not found: ${containerId}`)

  const parentId = target.parentId ?? null
  const removed = new Set([containerId, ...collectDescendants(containers, containerId)])

  const nextContainers = containers
    .filter((container) => container.id !== containerId)
    .map((container) =>
      container.parentId === containerId ? { ...container, parentId } : container,
    )

  const nextNotes = notes.map((note) =>
    note.containerId && removed.has(note.containerId) ? { ...note, containerId: null } : note,
  )

  return { containers: nextContainers, notes: nextNotes }
}
