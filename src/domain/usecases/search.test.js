import { describe, expect, it } from 'vitest'
import { createNote } from '../entities/note.js'
import { searchNotes } from './search.js'

const notes = [
  createNote({
    id: 'n1',
    body: 'the body mentions nothing useful',
    title: 'Deploy checklist',
    updatedAt: '2026-10-19T10:00:00.000Z',
  }),
  createNote({
    id: 'n2',
    body: 'deploy the new version tonight',
    title: 'Release tonight',
    updatedAt: '2026-10-20T10:00:00.000Z',
  }),
  createNote({
    id: 'n3',
    body: 'unrelated',
    tags: ['deploy'],
    updatedAt: '2026-10-18T10:00:00.000Z',
  }),
]

describe('searchNotes', () => {
  it('ranks title matches first', () => {
    const result = searchNotes(notes, { query: 'deploy' })

    expect(result[0].id).toBe('n1')
    expect(result.map((note) => note.id)).toEqual(['n1', 'n3', 'n2'])
  })

  it('is case insensitive', () => {
    expect(searchNotes(notes, { query: 'DEPLOY' })).toHaveLength(3)
  })

  it('filters by status and kind', () => {
    expect(searchNotes(notes, { status: 'inbox' })).toHaveLength(3)
    expect(searchNotes(notes, { status: 'done' })).toHaveLength(0)
    expect(searchNotes(notes, { kind: 'note' })).toHaveLength(3)
  })

  it('filters by tag', () => {
    expect(searchNotes(notes, { tag: 'deploy' }).map((note) => note.id)).toEqual(['n3'])
  })

  it('hides archived notes unless asked', () => {
    const withArchived = [...notes, createNote({ id: 'n4', body: 'archived deploy', archived: true })]

    expect(searchNotes(withArchived, { query: 'deploy' }).map((note) => note.id)).not.toContain('n4')
    expect(
      searchNotes(withArchived, { query: 'deploy', includeArchived: true }).map((note) => note.id),
    ).toContain('n4')
  })

  it('returns everything when there is no query', () => {
    expect(searchNotes(notes)).toHaveLength(3)
  })
})
