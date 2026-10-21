import { describe, expect, it } from 'vitest'
import { createContainer } from '../entities/container.js'
import { canNest, collectDescendants, removeContainer, setContainerParent } from './containers.js'

const tree = [
  createContainer({ id: 'a', name: 'Root' }),
  createContainer({ id: 'b', name: 'Child', parentId: 'a' }),
  createContainer({ id: 'c', name: 'Grandchild', parentId: 'b' }),
  createContainer({ id: 'd', name: 'Other' }),
]

describe('collectDescendants', () => {
  it('collects the whole subtree', () => {
    expect(collectDescendants(tree, 'a').sort()).toEqual(['b', 'c'])
  })

  it('returns nothing for a leaf', () => {
    expect(collectDescendants(tree, 'c')).toEqual([])
  })

  it('survives a cycle in the data', () => {
    const broken = [
      { id: 'x', name: 'X', parentId: 'y' },
      { id: 'y', name: 'Y', parentId: 'x' },
    ]

    expect(collectDescendants(broken, 'x').sort()).toEqual(['y'])
  })
})

describe('canNest', () => {
  it('allows a valid parent', () => {
    expect(canNest(tree, 'a', 'd')).toBe(true)
  })

  it('rejects nesting a container inside itself', () => {
    expect(canNest(tree, 'a', 'a')).toBe(false)
  })

  it('rejects nesting a container inside its own descendant', () => {
    expect(canNest(tree, 'a', 'c')).toBe(false)
  })
})

describe('setContainerParent', () => {
  it('refuses to create a cycle', () => {
    expect(() => setContainerParent(tree[0], 'c', { containers: tree })).toThrow(/inside itself/)
  })

  it('moves a container to a valid parent', () => {
    const moved = setContainerParent(tree[3], 'a', { containers: tree, now: '2026-10-20T10:00:00.000Z' })

    expect(moved.parentId).toBe('a')
    expect(moved.updatedAt).toBe('2026-10-20T10:00:00.000Z')
  })
})

describe('removeContainer', () => {
  const notes = [
    { id: 'n1', containerId: 'b' },
    { id: 'n2', containerId: 'c' },
    { id: 'n3', containerId: 'd' },
  ]

  it('removes the container and lifts its children', () => {
    const result = removeContainer(tree, notes, 'b')

    expect(result.containers.some((container) => container.id === 'b')).toBe(false)
    expect(result.containers.find((container) => container.id === 'c').parentId).toBe('a')
  })

  it('unclassifies the notes that lived inside it', () => {
    const result = removeContainer(tree, notes, 'b')

    expect(result.notes.find((note) => note.id === 'n1').containerId).toBeNull()
    expect(result.notes.find((note) => note.id === 'n2').containerId).toBeNull()
    expect(result.notes.find((note) => note.id === 'n3').containerId).toBe('d')
  })

  it('refuses to remove a container that does not exist', () => {
    expect(() => removeContainer(tree, notes, 'ghost')).toThrow(/not found/)
  })
})
