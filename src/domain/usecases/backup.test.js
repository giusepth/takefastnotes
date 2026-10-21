import { describe, expect, it } from 'vitest'
import { createNote } from '../entities/note.js'
import { exportData, importData, validateImport } from './backup.js'

const note = createNote({ id: 'n1', body: 'hello', updatedAt: '2026-10-20T10:00:00.000Z' })
const container = { id: 'c1', name: 'Repo', kind: 'repo', url: null, parentId: null }

describe('exportData', () => {
  it('builds a versioned payload', () => {
    const payload = exportData({ notes: [note], containers: [container], links: [], prefs: {} })

    expect(payload.version).toBe(1)
    expect(payload.notes).toHaveLength(1)
    expect(payload.containers).toHaveLength(1)
    expect(typeof payload.exportedAt).toBe('string')
  })
})

describe('validateImport', () => {
  it('rejects a payload that is not an object', () => {
    expect(() => validateImport('nope')).toThrow(/not a valid backup/)
  })

  it('rejects a payload without collections', () => {
    expect(() => validateImport({ notes: [] })).toThrow(/missing notes or containers/)
  })

  it('rejects prototype polluting keys', () => {
    const payload = JSON.parse('{"notes":[],"containers":[],"__proto__":{"polluted":true}}')

    expect(() => validateImport(payload)).toThrow(/forbidden keys/)
  })

  it('drops unknown fields', () => {
    const sanitized = validateImport({
      notes: [{ id: 'n1', body: 'hi', title: 'hi', evil: 'payload' }],
      containers: [],
    })

    expect(sanitized.notes[0].evil).toBeUndefined()
    expect(sanitized.notes[0].status).toBe('inbox')
  })

  it('rejects a note without content', () => {
    expect(() => validateImport({ notes: [{ id: 'n1', body: '' }], containers: [] })).toThrow(
      /is empty/,
    )
  })
})

describe('importData', () => {
  it('merges new records', () => {
    const result = importData({ notes: [], containers: [], links: [], prefs: {} }, validateImport({
      notes: [note],
      containers: [container],
      links: [],
      prefs: {},
    }))

    expect(result.notes).toHaveLength(1)
    expect(result.containers).toHaveLength(1)
    expect(result.report.added).toBe(2)
  })

  it('keeps the newer version of a duplicated record', () => {
    const older = createNote({ id: 'n1', body: 'older', updatedAt: '2026-10-19T10:00:00.000Z' })
    const newer = createNote({ id: 'n1', body: 'newer', updatedAt: '2026-10-21T10:00:00.000Z' })

    const result = importData(
      { notes: [older], containers: [], links: [], prefs: {} },
      validateImport({ notes: [newer], containers: [] }),
    )

    expect(result.notes).toHaveLength(1)
    expect(result.notes[0].body).toBe('newer')
    expect(result.report.updated).toBe(1)
  })

  it('replaces everything when asked', () => {
    const result = importData(
      { notes: [note], containers: [], links: [], prefs: {} },
      validateImport({ notes: [], containers: [] }),
      { mode: 'replace' },
    )

    expect(result.notes).toHaveLength(0)
  })
})
