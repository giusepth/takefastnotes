import { KINDS } from '../../domain/policies/kinds.js'

/**
 * What the capture field currently understands.
 *
 * The grammar is owned by the domain (`parseCapture`). This module only
 * *looks* at a draft so the interface can say out loud which parts of the
 * grammar are in play — the grammar strip in the capture bar lights up the
 * token the moment the writer uses it.
 *
 * The rules below mirror the domain rules exactly; `captureTokens.test.js`
 * checks that they never drift apart.
 */

const KIND_PREFIX = new RegExp(`^\\s*(${KINDS.join('|')})\\s*:`, 'i')
const TAG_TOKEN = /(^|\s)#[\p{L}\p{N}_/-]+(?:\.[\p{L}\p{N}_/-]+)*/u

/**
 * Finds the first `@` that starts a token (not an email address).
 *
 * @param {string} text
 * @returns {number} index or -1
 */
function findContainerToken(text) {
  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== '@') continue
    if (index === 0 || /\s/.test(text[index - 1])) return index
  }
  return -1
}

/**
 * A container only counts when the `@` is followed by a container that
 * already exists — the domain never creates one implicitly.
 *
 * @param {string} text
 * @param {object[]} containers
 * @returns {boolean}
 */
function hasKnownContainer(text, containers) {
  const index = findContainerToken(text)
  if (index === -1) return false

  const rest = text.slice(index + 1)
  const candidates = [...containers].sort((a, b) => b.name.length - a.name.length)

  return candidates.some((container) => {
    const name = container.name.toLowerCase()
    if (!rest.toLowerCase().startsWith(name)) return false
    const next = rest[container.name.length]
    return next === undefined || /[\s,.;:!?)\]]/.test(next)
  })
}

/**
 * Reports which parts of the capture grammar a draft uses.
 *
 * @param {string} text
 * @param {{containers?: object[]}} [options]
 * @returns {{kind: boolean, kindName: string | null, tag: boolean, container: boolean}}
 */
export function detectCaptureTokens(text, options = {}) {
  const { containers = [] } = options
  const value = String(text ?? '')

  const kindMatch = value.match(KIND_PREFIX)
  const kindName = kindMatch ? kindMatch[1].toLowerCase() : null

  return {
    kind: Boolean(kindName),
    kindName,
    tag: TAG_TOKEN.test(value),
    container: hasKnownContainer(value, containers),
  }
}
