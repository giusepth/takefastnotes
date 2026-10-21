import { requestToPromise } from './db.js'

/**
 * Notes repository (IndexedDB adapter for the NoteRepository port).
 *
 * @param {IDBDatabase} db
 */
export function createNotesRepository(db) {
  const store = (mode = 'readonly') => db.transaction('notes', mode).objectStore('notes')

  return {
    async all() {
      return requestToPromise(store().getAll())
    },

    async byId(id) {
      return requestToPromise(store().get(id))
    },

    async create(note) {
      await requestToPromise(store('readwrite').put(note))
      return note
    },

    async update(id, patch) {
      const current = await requestToPromise(store().get(id))
      if (!current) throw new Error(`Note not found: ${id}`)

      const next = { ...current, ...patch, id: current.id }
      await requestToPromise(store('readwrite').put(next))
      return next
    },

    async remove(id) {
      await requestToPromise(store('readwrite').delete(id))
    },

    async count() {
      return requestToPromise(store().count())
    },

    async bulkPut(notes) {
      const transaction = db.transaction('notes', 'readwrite')
      const objectStore = transaction.objectStore('notes')
      for (const note of notes) objectStore.put(note)
      await transactionDone(transaction)
    },
  }
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Transaction failed'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Transaction aborted'))
  })
}
