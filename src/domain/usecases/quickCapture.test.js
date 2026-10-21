import { describe, expect, it } from 'vitest'
import { parseCapture, quickCapture } from './quickCapture.js'

const containers = [
  { id: 'c-repo', name: 'TakeFastNotes' },
  { id: 'c-doc', name: 'Architecture Docs' },
]

describe('parseCapture', () => {
  it('keeps a plain capture untouched', () => {
    const result = parseCapture('remember to check the build', { containers })

    expect(result.kind).toBe('note')
    expect(result.tags).toEqual([])
    expect(result.containerId).toBeNull()
    expect(result.body).toBe('remember to check the build')
  })

  it('parses the kind prefix, tags and container', () => {
    const result = parseCapture('feature: add webhook retries #backend #GH-Actions @TakeFastNotes', {
      containers,
    })

    expect(result.kind).toBe('feature')
    expect(result.tags).toEqual(['backend', 'gh-actions'])
    expect(result.containerId).toBe('c-repo')
    expect(result.body).toBe('add webhook retries')
  })

  it('never creates a container implicitly', () => {
    const result = parseCapture('ping @unknown-team about it', { containers })

    expect(result.containerId).toBeNull()
    expect(result.body).toBe('ping @unknown-team about it')
  })

  it('does not match a container that is only a prefix of the token', () => {
    const result = parseCapture('see @TakeFastNotesExtra', { containers })

    expect(result.containerId).toBeNull()
    expect(result.body).toBe('see @TakeFastNotesExtra')
  })

  it('ignores an @ inside an email address', () => {
    const result = parseCapture('mail me at giusepth@example.com about it', { containers })

    expect(result.containerId).toBeNull()
    expect(result.body).toBe('mail me at giusepth@example.com about it')
  })

  it('matches container names containing spaces', () => {
    const result = parseCapture('review @Architecture Docs tomorrow', { containers })

    expect(result.containerId).toBe('c-doc')
    expect(result.body).toBe('review tomorrow')
  })

  it('deduplicates and lowercases tags', () => {
    const result = parseCapture('fix #Bug #bug #release/2.0', { containers })

    expect(result.tags).toEqual(['bug', 'release/2.0'])
  })

  it('inherits the current container when no token is present', () => {
    const result = parseCapture('plain note', { containers, currentContainerId: 'c-repo' })

    expect(result.containerId).toBe('c-repo')
  })
})

describe('quickCapture', () => {
  it('derives the title from the body', () => {
    const note = quickCapture('decision: we ship on fridays', { containers })

    expect(note.title).toBe('we ship on fridays')
    expect(note.body).toBe('we ship on fridays')
    expect(note.kind).toBe('decision')
    expect(note.status).toBe('inbox')
    expect(note.containerId).toBeNull()
  })

  it('refuses an empty capture', () => {
    expect(() => quickCapture('   ', { containers })).toThrow(/Nothing to capture/)
  })

  it('creates a note with the parsed metadata', () => {
    const note = quickCapture('fix: crash on empty body #bug @TakeFastNotes', {
      containers,
      now: '2026-10-20T12:00:00.000Z',
    })

    expect(note.kind).toBe('fix')
    expect(note.tags).toEqual(['bug'])
    expect(note.containerId).toBe('c-repo')
    expect(note.createdAt).toBe('2026-10-20T12:00:00.000Z')
    expect(note.updatedAt).toBe('2026-10-20T12:00:00.000Z')
  })
})
