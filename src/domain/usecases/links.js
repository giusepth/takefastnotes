import { createLink, linkKey } from '../entities/link.js'

export { createLink, linkKey }

/**
 * Creates a relation between two entities, rejecting self-links and
 * duplicated pairs.
 *
 * @param {object[]} existingLinks
 * @param {{sourceType: string, sourceId: string, targetType: string, targetId: string, relation?: string}} input
 * @returns {object} link
 */
export function linkEntities(existingLinks, input) {
  const link = createLink(input)
  const key = linkKey(link)

  const duplicated = existingLinks.some((item) => linkKey(item) === key)
  if (duplicated) {
    throw new Error('That link already exists')
  }

  return link
}

/**
 * Removes a link and returns the updated collection.
 *
 * @param {object[]} links
 * @param {string} linkId
 * @returns {object[]}
 */
export function unlinkEntity(links, linkId) {
  return links.filter((link) => link.id !== linkId)
}

/**
 * All links where the given entity takes part, in any direction.
 *
 * @param {object[]} links
 * @param {string} entityId
 * @returns {object[]}
 */
export function linksFor(links, entityId) {
  return links.filter(
    (link) =>
      (link.sourceType === 'note' && link.sourceId === entityId) ||
      (link.targetType === 'note' && link.targetId === entityId),
  )
}
