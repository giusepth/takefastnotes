import { describe, expect, it } from 'vitest'
import { createLink } from '../entities/link.js'
import { linkEntities, linksFor, unlinkEntity } from './links.js'

const input = {
  sourceType: 'note',
  sourceId: 'n1',
  targetType: 'note',
  targetId: 'n2',
  relation: 'blocks',
}

describe('linkEntities', () => {
  it('creates a link', () => {
    const link = linkEntities([], input)

    expect(link.relation).toBe('blocks')
    expect(link.sourceId).toBe('n1')
    expect(link.targetId).toBe('n2')
  })

  it('rejects a self link', () => {
    expect(() => linkEntities([], { ...input, targetId: 'n1' })).toThrow(/cannot link to itself/)
  })

  it('rejects a duplicated link', () => {
    const existing = [createLink(input)]

    expect(() => linkEntities(existing, input)).toThrow(/already exists/)
  })

  it('allows the same pair with a different relation', () => {
    const existing = [createLink(input)]

    expect(() => linkEntities(existing, { ...input, relation: 'refines' })).not.toThrow()
  })
})

describe('unlinkEntity', () => {
  it('removes the link', () => {
    const link = createLink(input)

    expect(unlinkEntity([link], link.id)).toEqual([])
  })
})

describe('linksFor', () => {
  it('finds links in both directions', () => {
    const outgoing = createLink(input)
    const incoming = createLink({ ...input, sourceId: 'n3', targetId: 'n1' })

    expect(linksFor([outgoing, incoming], 'n1')).toHaveLength(2)
  })
})
