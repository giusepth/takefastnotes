import { describe, expect, it } from 'vitest'
import { createNote, deriveTitle } from './note.js'

describe('deriveTitle', () => {
  it('uses the first meaningful line', () => {
    expect(deriveTitle('\n\n  first line  \nsecond line')).toBe('first line')
  })

  it('truncates long titles', () => {
    const title = deriveTitle('x'.repeat(200))

    expect(title).toHaveLength(80)
    expect(title.endsWith('…')).toBe(true)
  })
})

describe('createNote', () => {
  it('requires a body or a title', () => {
    expect(() => createNote({ body: '   ' })).toThrow(/body or a title/)
  })

  it('applies the defaults', () => {
    const note = createNote({ body: 'hello', now: '2026-10-20T10:00:00.000Z' })

    expect(note.kind).toBe('note')
    expect(note.status).toBe('inbox')
    expect(note.tags).toEqual([])
    expect(note.containerId).toBeNull()
    expect(note.pinned).toBe(false)
    expect(note.archived).toBe(false)
    expect(note.createdAt).toBe('2026-10-20T10:00:00.000Z')
  })

  it('normalizes tags', () => {
    const note = createNote({ body: 'hello', tags: ['#Backend', 'backend', ' api '] })

    expect(note.tags).toEqual(['backend', 'api'])
  })
})
