import { KINDS } from '../policies/kinds.js'
import { STATUSES } from '../policies/statuses.js'
import { normalizeTags } from '../policies/tags.js'
import { timestamp } from '../support/time.js'

export const EXPORT_VERSION = 1
export const IMPORT_MAX_BYTES = 20 * 1024 * 1024

const FORBIDDEN_KEYS = ['__proto__', 'constructor', 'prototype']

function hasForbiddenKey(value) {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(hasForbiddenKey)
  return Object.keys(value).some(
    (key) => FORBIDDEN_KEYS.includes(key) || hasForbiddenKey(value[key]),
  )
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Builds the full backup payload.
 */
export function exportData({ notes = [], containers = [], links = [], prefs = {} } = {}) {
  return {
    version: EXPORT_VERSION,
    exportedAt: timestamp(),
    notes,
    containers,
    links,
    prefs,
  }
}

function sanitizeNote(raw, index) {
  if (!isPlainObject(raw)) throw new Error(`Note #${index} is not an object`)
  if (typeof raw.id !== 'string' || !raw.id) throw new Error(`Note #${index} has no id`)

  const body = typeof raw.body === 'string' ? raw.body : ''
  const title = typeof raw.title === 'string' ? raw.title : ''

  if (!body && !title) throw new Error(`Note "${raw.id}" is empty`)

  return {
    id: raw.id,
    title,
    body,
    kind: KINDS.includes(raw.kind) ? raw.kind : 'note',
    status: STATUSES.includes(raw.status) ? raw.status : 'inbox',
    tags: normalizeTags(Array.isArray(raw.tags) ? raw.tags.filter((tag) => typeof tag === 'string') : []),
    containerId: typeof raw.containerId === 'string' ? raw.containerId : null,
    pinned: Boolean(raw.pinned),
    archived: Boolean(raw.archived),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : timestamp(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : timestamp(),
  }
}

function sanitizeContainer(raw, index) {
  if (!isPlainObject(raw)) throw new Error(`Container #${index} is not an object`)
  if (typeof raw.id !== 'string' || !raw.id) throw new Error(`Container #${index} has no id`)
  if (typeof raw.name !== 'string' || !raw.name.trim()) {
    throw new Error(`Container "${raw.id}" has no name`)
  }

  return {
    id: raw.id,
    name: raw.name.trim(),
    kind: typeof raw.kind === 'string' ? raw.kind : '',
    url: typeof raw.url === 'string' ? raw.url : null,
    parentId: typeof raw.parentId === 'string' ? raw.parentId : null,
    archived: Boolean(raw.archived),
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : timestamp(),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : timestamp(),
  }
}

function sanitizeLink(raw, index) {
  if (!isPlainObject(raw)) throw new Error(`Link #${index} is not an object`)
  if (typeof raw.id !== 'string' || !raw.id) throw new Error(`Link #${index} has no id`)
  if (raw.sourceId === raw.targetId) throw new Error(`Link "${raw.id}" points to itself`)

  return {
    id: raw.id,
    sourceType: raw.sourceType === 'container' ? 'container' : 'note',
    sourceId: String(raw.sourceId ?? ''),
    targetType: raw.targetType === 'container' ? 'container' : 'note',
    targetId: String(raw.targetId ?? ''),
    relation: typeof raw.relation === 'string' && raw.relation ? raw.relation : 'relates-to',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : timestamp(),
  }
}

/**
 * Validates a backup payload and returns sanitized entities.
 * Unknown fields are dropped, never spread into the app.
 *
 * @param {unknown} payload
 * @returns {{notes: object[], containers: object[], links: object[], prefs: object}}
 */
export function validateImport(payload) {
  if (!isPlainObject(payload)) {
    throw new Error('The file is not a valid backup')
  }
  if (hasForbiddenKey(payload)) {
    throw new Error('The file contains forbidden keys')
  }
  if (!Array.isArray(payload.notes) || !Array.isArray(payload.containers)) {
    throw new Error('The backup is missing notes or containers')
  }
  if (payload.links !== undefined && !Array.isArray(payload.links)) {
    throw new Error('The backup has an invalid links collection')
  }

  return {
    notes: payload.notes.map(sanitizeNote),
    containers: payload.containers.map(sanitizeContainer),
    links: (payload.links ?? []).map(sanitizeLink),
    prefs: isPlainObject(payload.prefs) ? { ...payload.prefs } : {},
  }
}

/**
 * Merges an incoming backup with the current data.
 *
 * @param {object} existing
 * @param {object} incoming sanitized payload
 * @param {{mode?: 'merge' | 'replace'}} [options]
 * @returns {{notes: object[], containers: object[], links: object[], prefs: object, report: object}}
 */
export function importData(existing, incoming, options = {}) {
  const { mode = 'merge' } = options

  if (mode === 'replace') {
    return {
      notes: incoming.notes,
      containers: incoming.containers,
      links: incoming.links,
      prefs: incoming.prefs,
      report: { added: incoming.notes.length, updated: 0, skipped: 0 },
    }
  }

  const mergeCollection = (current, incomingItems) => {
    const byId = new Map(current.map((item) => [item.id, item]))
    let added = 0
    let updated = 0
    let skipped = 0

    for (const item of incomingItems) {
      const existingItem = byId.get(item.id)
      if (!existingItem) {
        byId.set(item.id, item)
        added += 1
        continue
      }
      if ((item.updatedAt ?? '') > (existingItem.updatedAt ?? '')) {
        byId.set(item.id, item)
        updated += 1
      } else {
        skipped += 1
      }
    }

    return { items: [...byId.values()], added, updated, skipped }
  }

  const notes = mergeCollection(existing.notes ?? [], incoming.notes)
  const containers = mergeCollection(existing.containers ?? [], incoming.containers)
  const links = mergeCollection(existing.links ?? [], incoming.links)

  return {
    notes: notes.items,
    containers: containers.items,
    links: links.items,
    prefs: { ...(existing.prefs ?? {}), ...incoming.prefs },
    report: {
      added: notes.added + containers.added + links.added,
      updated: notes.updated + containers.updated + links.updated,
      skipped: notes.skipped + containers.skipped + links.skipped,
    },
  }
}
