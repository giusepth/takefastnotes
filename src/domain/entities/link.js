import { newId } from './id.js'
import { timestamp } from '../support/time.js'

export const LINK_RELATION_DEFAULT = 'relates-to'

export const ENTITY_TYPES = Object.freeze(['note', 'container'])

export function normalizeRelation(relation) {
  const value = String(relation ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
  return value || LINK_RELATION_DEFAULT
}

/**
 * A typed relation between two entities of the app.
 */
export function createLink(input = {}) {
  const { sourceType, sourceId, targetType, targetId } = input

  if (!ENTITY_TYPES.includes(sourceType) || !ENTITY_TYPES.includes(targetType)) {
    throw new Error('A link needs a note or container on both sides')
  }
  if (!sourceId || !targetId) {
    throw new Error('A link needs a source and a target')
  }
  if (sourceId === targetId) {
    throw new Error('An entity cannot link to itself')
  }

  return {
    id: input.id ?? newId(),
    sourceType,
    sourceId,
    targetType,
    targetId,
    relation: normalizeRelation(input.relation),
    createdAt: timestamp(input.now),
  }
}

/**
 * Identity of a link for duplicate detection.
 */
export function linkKey(link) {
  return [link.sourceType, link.sourceId, link.targetType, link.targetId, link.relation].join('|')
}
