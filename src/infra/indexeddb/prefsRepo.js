import { requestToPromise } from './db.js'

/**
 * Preferences repository: small key/value store for view state.
 *
 * @param {IDBDatabase} db
 */
export function createPrefsRepository(db) {
  const store = (mode = 'readonly') => db.transaction('prefs', mode).objectStore('prefs')

  return {
    async all() {
      const rows = await requestToPromise(store().getAll())
      return rows.reduce((acc, row) => {
        acc[row.key] = row.value
        return acc
      }, {})
    },

    async get(key) {
      const row = await requestToPromise(store().get(key))
      return row?.value
    },

    async set(key, value) {
      await requestToPromise(store('readwrite').put({ key, value }))
    },
  }
}
