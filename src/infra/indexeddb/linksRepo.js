import { requestToPromise } from './db.js'

/**
 * Links repository (IndexedDB adapter for the LinkRepository port).
 *
 * @param {IDBDatabase} db
 */
export function createLinksRepository(db) {
  const store = (mode = 'readonly') => db.transaction('links', mode).objectStore('links')

  return {
    async all() {
      return requestToPromise(store().getAll())
    },

    async byId(id) {
      return requestToPromise(store().get(id))
    },

    async create(link) {
      await requestToPromise(store('readwrite').put(link))
      return link
    },

    async remove(id) {
      await requestToPromise(store('readwrite').delete(id))
    },
  }
}
