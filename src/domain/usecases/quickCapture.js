import { createNote } from '../entities/note.js'
import { DEFAULT_KIND, KINDS } from '../policies/kinds.js'
import { normalizeTags } from '../policies/tags.js'

const KIND_PREFIX = /^\s*(note|idea|feature|fix|decision|question)\s*:\s*/i
const TAG_TOKEN = /(^|\s)#([\p{L}\p{N}_/-]+(?:\.[\p{L}\p{N}_/-]+)*)/gu

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
 * Matches the longest known container name right after an `@` token.
 * A container is never created implicitly: an unknown token stays in the body.
 *
 * @param {string} text
 * @param {number} tokenIndex
 * @param {object[]} containers
 * @returns {{container: object, length: number} | null}
 */
function matchContainer(text, tokenIndex, containers) {
  const rest = text.slice(tokenIndex + 1)
  const candidates = [...containers].sort((a, b) => b.name.length - a.name.length)

  for (const container of candidates) {
    const name = container.name.toLowerCase()
    if (!rest.toLowerCase().startsWith(name)) continue

    const next = rest[container.name.length]
    if (next === undefined || /[\s,.;:!?)\]]/.test(next)) {
      return { container, length: container.name.length }
    }
  }

  return null
}

/**
 * Parses a raw capture into its structured parts.
 *
 * Syntax:
 *   `feature:`        → kind (prefix only)
 *   `#tag`            → tag
 *   `@container`      → container (existing ones only)
 *
 * @param {string} input
 * @param {{containers?: object[], currentContainerId?: string | null}} [options]
 * @returns {{kind: string, tags: string[], containerId: string | null, body: string}}
 */
export function parseCapture(input, options = {}) {
  const { containers = [], currentContainerId = null } = options

  let text = String(input ?? '')
  let kind = DEFAULT_KIND

  const kindMatch = text.match(KIND_PREFIX)
  if (kindMatch) {
    const candidate = kindMatch[1].toLowerCase()
    if (KINDS.includes(candidate)) {
      kind = candidate
      text = text.slice(kindMatch[0].length)
    }
  }

  let containerId = currentContainerId

  const tokenIndex = findContainerToken(text)
  if (tokenIndex !== -1) {
    const match = matchContainer(text, tokenIndex, containers)
    if (match) {
      containerId = match.container.id
      text = `${text.slice(0, tokenIndex)} ${text.slice(tokenIndex + 1 + match.length)}`
    }
  }

  const tags = []
  text = text.replace(TAG_TOKEN, (_match, lead, tag) => {
    tags.push(tag)
    return lead
  })

  const body = text.replace(/[ \t]{2,}/g, ' ').trim()

  return { kind, tags: normalizeTags(tags), containerId, body }
}

/**
 * Turns a raw capture into a persisted-ready note.
 *
 * @param {string} input
 * @param {{containers?: object[], currentContainerId?: string | null, now?: string}} [options]
 * @returns {object} note
 */
export function quickCapture(input, options = {}) {
  const parsed = parseCapture(input, options)

  if (!parsed.body) {
    throw new Error('Nothing to capture')
  }

  return createNote({
    body: parsed.body,
    kind: parsed.kind,
    tags: parsed.tags,
    containerId: parsed.containerId,
    now: options.now,
  })
}
