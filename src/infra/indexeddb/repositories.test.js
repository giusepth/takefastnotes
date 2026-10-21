import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createNote } from '../../domain/entities/note.js'
import { createContainer } from '../../domain/entities/container.js'
import { createLink } from '../../domain/entities/link.js'
import { openDatabase } from './db.js'
import { createRepositories } from './index.js'

let db
let repos
let dbCounter = 0

beforeEach(async () => {
  dbCounter += 1
  db = await openDatabase({ name: `takefastnotes-test-${dbCounter}` })
  repos = createRepositories(db)
})

afterEach(async () => {
  db.close()
})

describe('notes repository', () => {
  it('stores, reads, updates and deletes a note', async () => {
    const note = createNote({ id: 'n1', body: 'hello', now: '2026-10-20T10:00:00.000Z' })

    await repos.notes.create(note)
    expect(await repos.notes.count()).toBe(1)

    const stored = await repos.notes.byId('n1')
    expect(stored.body).toBe('hello')
    expect(stored.createdAt).toBe('2026-10-20T10:00:00.000Z')

    const updated = await repos.notes.update('n1', { status: 'doing' })
    expect(updated.status).toBe('doing')
    expect(updated.body).toBe('hello')

    await repos.notes.remove('n1')
    expect(await repos.notes.count()).toBe(0)
  })

  it('fails loudly when updating a missing note', async () => {
    await expect(repos.notes.update('ghost', { status: 'done' })).rejects.toThrow(/not found/)
  })

  it('bulk inserts notes', async () => {
    await repos.notes.bulkPut([
      createNote({ id: 'n1', body: 'one' }),
      createNote({ id: 'n2', body: 'two' }),
    ])

    expect(await repos.notes.count()).toBe(2)
  })
})

describe('containers repository', () => {
  it('stores and updates a container', async () => {
    const container = createContainer({ id: 'c1', name: 'Repo', kind: 'repo' })

    await repos.containers.create(container)
    expect((await repos.containers.all())).toHaveLength(1)

    const updated = await repos.containers.update('c1', { kind: 'doc' })
    expect(updated.kind).toBe('doc')
    expect(updated.name).toBe('Repo')
  })
})

describe('links repository', () => {
  it('stores and removes a link', async () => {
    const link = createLink({
      sourceType: 'note',
      sourceId: 'n1',
      targetType: 'note',
      targetId: 'n2',
    })

    await repos.links.create(link)
    expect(await repos.links.all()).toHaveLength(1)

    await repos.links.remove(link.id)
    expect(await repos.links.all()).toHaveLength(0)
  })
})

describe('prefs repository', () => {
  it('reads preferences as a plain object', async () => {
    await repos.prefs.set('currentContainerId', 'c1')
    await repos.prefs.set('theme', 'dark')

    expect(await repos.prefs.all()).toEqual({ currentContainerId: 'c1', theme: 'dark' })
    expect(await repos.prefs.get('theme')).toBe('dark')
  })
})

describe('persistence across handles', () => {
  it('keeps the data when the database is reopened', async () => {
    await repos.notes.create(createNote({ id: 'n1', body: 'persisted' }))

    db.close()
    const reopened = await openDatabase({ name: `takefastnotes-test-${dbCounter}` })
    const reopenedRepos = createRepositories(reopened)

    expect((await reopenedRepos.notes.all())[0].body).toBe('persisted')

    reopened.close()
  })
})
