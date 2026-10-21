import { requestToPromise } from './db.js'

/**
 * Containers repository (IndexedDB adapter for the ContainerRepository port).
 *
 * @param {IDBDatabase} db
 */
export function createContainersRepository(db) {
  const store = (mode = 'readonly') => db.transaction('containers', mode).objectStore('containers')

  return {
    async all() {
      return requestToPromise(store().getAll())
    },

    async byId(id) {
      return requestToPromise(store().get(id))
    },

    async create(container) {
      await requestToPromise(store('readwrite').put(container))
      return container
    },

    async update(id, patch) {
      const current = await requestToPromise(store().get(id))
      if (!current) throw new Error(`Container not found: ${id}`)

      const next = { ...current, ...patch, id: current.id }
      await requestToPromise(store('readwrite').put(next))
      return next
    },

    async remove(id) {
      await requestToPromise(store('readwrite').delete(id))
    },
  }
}
