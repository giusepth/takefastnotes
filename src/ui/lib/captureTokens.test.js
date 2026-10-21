import { describe, expect, it } from 'vitest'
import { parseCapture } from '../../domain/usecases/quickCapture.js'
import { detectCaptureTokens } from './captureTokens.js'

const containers = [
  { id: 'c1', name: 'takefastnotes' },
  { id: 'c2', name: 'spec' },
]

describe('detectCaptureTokens', () => {
  it('reports the kind prefix only when the draft starts with one', () => {
    expect(detectCaptureTokens('feature: add retries')).toMatchObject({
      kind: true,
      kindName: 'feature',
    })
    expect(detectCaptureTokens('  fix: broken').kindName).toBe('fix')
    expect(detectCaptureTokens('add feature: later').kind).toBe(false)
    expect(detectCaptureTokens('a plain thought').kind).toBe(false)
  })

  it('reports tags exactly like the domain parser', () => {
    const samples = [
      'feature: add webhook retries #backend',
      'no tag here',
      '#leading tag',
      'two #tags and #more',
      'release #release/2.0 candidate',
    ]

    for (const sample of samples) {
      const detected = detectCaptureTokens(sample, { containers })
      const parsed = parseCapture(sample, { containers })

      expect(detected.tag).toBe(parsed.tags.length > 0)
      expect(detected.tag).toBe(Boolean(sample.match(/(^|\s)#[\p{L}\p{N}_/-]+/u)))
    }
  })

  it('reports a container only when the name already exists', () => {
    const samples = [
      'fix: drops 503s @takefastnotes',
      'file it @spec please',
      'mail me @notacontainer',
      'email someone@example.com',
      'no mention at all',
    ]

    for (const sample of samples) {
      const detected = detectCaptureTokens(sample, { containers })
      const parsed = parseCapture(sample, { containers })

      expect(detected.container).toBe(Boolean(parsed.containerId))
    }
  })

  it('keeps the kind name in step with the domain', () => {
    const samples = ['note: plain', 'idea: maybe', 'decision: ship it', 'question: why']

    for (const sample of samples) {
      const detected = detectCaptureTokens(sample)
      const parsed = parseCapture(sample)

      expect(detected.kindName).toBe(parsed.kind)
    }
  })
})
