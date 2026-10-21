import { createNotesRepository } from './notesRepo.js'
import { createContainersRepository } from './containersRepo.js'
import { createLinksRepository } from './linksRepo.js'
import { createPrefsRepository } from './prefsRepo.js'

/**
 * Composition root of the persistence layer: builds every repository
 * against a single database handle.
 *
 * @param {IDBDatabase} db
 * @returns {import('../../domain/ports/index.js').Repositories}
 */
export function createRepositories(db) {
  return {
    notes: createNotesRepository(db),
    containers: createContainersRepository(db),
    links: createLinksRepository(db),
    prefs: createPrefsRepository(db),
  }
}

export { openDatabase, DB_NAME, DB_VERSION } from './db.js'
