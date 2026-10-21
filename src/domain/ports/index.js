/**
 * Ports: the contract the domain expects from storage.
 *
 * The domain never imports the IndexedDB adapter. The adapter implements
 * these shapes, which keeps the storage technology replaceable (Dexie, a
 * REST API, a file) without touching a single use case.
 *
 * @typedef {object} NoteRepository
 * @property {() => Promise<object[]>} all
 * @property {(id: string) => Promise<object | undefined>} byId
 * @property {(note: object) => Promise<object>} create
 * @property {(id: string, patch: object) => Promise<object>} update
 * @property {(id: string) => Promise<void>} remove
 * @property {() => Promise<number>} count
 * @property {(notes: object[]) => Promise<void>} bulkPut
 *
 * @typedef {object} ContainerRepository
 * @property {() => Promise<object[]>} all
 * @property {(id: string) => Promise<object | undefined>} byId
 * @property {(container: object) => Promise<object>} create
 * @property {(id: string, patch: object) => Promise<object>} update
 * @property {(id: string) => Promise<void>} remove
 *
 * @typedef {object} LinkRepository
 * @property {() => Promise<object[]>} all
 * @property {(link: object) => Promise<object>} create
 * @property {(id: string) => Promise<void>} remove
 *
 * @typedef {object} PrefsRepository
 * @property {() => Promise<Record<string, unknown>>} all
 * @property {(key: string, value: unknown) => Promise<void>} set
 *
 * @typedef {object} Repositories
 * @property {NoteRepository} notes
 * @property {ContainerRepository} containers
 * @property {LinkRepository} links
 * @property {PrefsRepository} prefs
 */

export {}
