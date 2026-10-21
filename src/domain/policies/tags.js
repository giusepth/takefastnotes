/**
 * Tags are free-form and case-insensitive. There is no fixed vocabulary:
 * a note about a repo may use `#gh-actions`, another one `#release/2.0`.
 */
export function normalizeTag(raw) {
  return String(raw ?? '')
    .trim()
    .replace(/^#+/, '')
    .toLowerCase()
}

export function normalizeTags(tags = []) {
  const result = []
  for (const tag of tags) {
    const normalized = normalizeTag(tag)
    if (normalized && !result.includes(normalized)) result.push(normalized)
  }
  return result
}
