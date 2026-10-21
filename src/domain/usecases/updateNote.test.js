import { describe, expect, it } from 'vitest'
import { createNote } from '../entities/note.js'
import { addTag, editNote, moveNote, removeTag, setKind, setStatus } from './updateNote.js'

const note = createNote({ body: 'a note', now: '2026-10-20T10:00:00.000Z' })

describe('updateNote', () => {
  it('rejects an unknown status', () => {
    expect(() => setStatus(note, 'nope')).toThrow(/Unknown status/)
  })

  it('rejects an unknown kind', () => {
    expect(() => setKind(note, 'nope')).toThrow(/Unknown kind/)
  })

  it('touches the updatedAt timestamp', () => {
    const updated = setStatus(note, 'doing', { now: '2026-10-21T10:00:00.000Z' })

    expect(updated.status).toBe('doing')
    expect(updated.updatedAt).toBe('2026-10-21T10:00:00.000Z')
    expect(note.status).toBe('inbox')
  })

  it('normalizes tags when adding and removing them', () => {
    const tagged = addTag(note, '#Backend')

    expect(tagged.tags).toEqual(['backend'])
    expect(removeTag(tagged, 'BACKEND').tags).toEqual([])
  })

  it('refuses to move a note to an unknown container', () => {
    expect(() => moveNote(note, 'ghost', { containers: [] })).toThrow(/Unknown container/)
  })

  it('moves a note to a container or to unclassified', () => {
    const containers = [{ id: 'c1', name: 'Repo' }]

    expect(moveNote(note, 'c1', { containers }).containerId).toBe('c1')
    expect(moveNote(note, null, { containers }).containerId).toBeNull()
  })
})

describe('editNote', () => {
  it('changes the body and carries the title along', () => {
    const edited = editNote(note, { body: 'otro texto' }, { now: '2026-10-21T10:00:00.000Z' })

    expect(edited.body).toBe('otro texto')
    // The title was never written by hand — it was derived from the body,
    // so it keeps describing the note.
    expect(edited.title).toBe('otro texto')
    expect(edited.updatedAt).toBe('2026-10-21T10:00:00.000Z')
  })

  it('derives the title when it is emptied', () => {
    const edited = editNote(note, { title: '', body: 'primera linea\nsegunda' })

    expect(edited.title).toBe('primera linea')
  })

  it('refuses a note without content', () => {
    expect(() => editNote(note, { title: '', body: '   ' })).toThrow(/body or a title/)
  })

  it('follows the body while the title was never written by hand', () => {
    const derived = createNote({ body: 'titulo viejo\nmas texto' })
    const edited = editNote(derived, { title: derived.title, body: 'titulo nuevo\nmas texto' })

    expect(edited.title).toBe('titulo nuevo')
  })

  it('keeps a title the writer wrote by hand', () => {
    const handwritten = { ...note, title: 'mi titulo' }
    const edited = editNote(handwritten, { title: 'mi titulo', body: 'otro cuerpo' })

    expect(edited.title).toBe('mi titulo')
  })
})
