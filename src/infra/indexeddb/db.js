export const DB_NAME = 'takefastnotes'
export const DB_VERSION = 1

/**
 * Schema v1.
 *
 * Timestamps are ISO strings so the raw database stays readable and
 * sortable as text.
 */
function createSchemaV1(db) {
  const notes = db.createObjectStore('notes', { keyPath: 'id' })
  notes.createIndex('by_container', 'containerId')
  notes.createIndex('by_status', 'status')
  notes.createIndex('by_kind', 'kind')
  notes.createIndex('by_updated', 'updatedAt')
  notes.createIndex('by_pinned', 'pinned')
  notes.createIndex('by_tag', 'tags', { multiEntry: true })

  const containers = db.createObjectStore('containers', { keyPath: 'id' })
  containers.createIndex('by_parent', 'parentId')

  const links = db.createObjectStore('links', { keyPath: 'id' })
  links.createIndex('by_source', ['sourceType', 'sourceId'])
  links.createIndex('by_target', ['targetType', 'targetId'])

  db.createObjectStore('prefs', { keyPath: 'key' })
}

/**
 * Migrations are never edited once released: each schema change adds a new
 * entry that upgrades the previous version.
 */
const MIGRATIONS = {
  1: createSchemaV1,
}

/**
 * Opens the database, running every pending migration.
 *
 * @param {{name?: string, version?: number}} [options]
 * @returns {Promise<IDBDatabase>}
 */
export function openDatabase(options = {}) {
  const name = options.name ?? DB_NAME
  const version = options.version ?? DB_VERSION

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version)

    request.onupgradeneeded = (event) => {
      const db = request.result
      for (let target = event.oldVersion + 1; target <= version; target += 1) {
        const migration = MIGRATIONS[target]
        if (!migration) {
          reject(new Error(`Missing migration for schema version ${target}`))
          return
        }
        migration(db)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open the database'))
    request.onblocked = () =>
      reject(new Error('Another tab is holding an older version of the database open'))
  })
}

/**
 * Promise wrapper around an IndexedDB request.
 *
 * @param {IDBRequest} request
 * @returns {Promise<any>}
 */
export function requestToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'))
  })
}

/**
 * Resolves when a transaction commits, rejects when it aborts.
 *
 * @param {IDBTransaction} transaction
 * @returns {Promise<void>}
 */
export function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Transaction failed'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Transaction aborted'))
  })
}
