/**
 * Identifier factory.
 *
 * `crypto.randomUUID` requires a secure context (https or localhost). The
 * fallback keeps the app usable when it is served from a plain http origin
 * (for example a LAN IP during development).
 */
export function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
