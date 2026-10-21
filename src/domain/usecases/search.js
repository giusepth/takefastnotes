/**
 * In-memory search over the loaded notes.
 *
 * At the scale this app targets (thousands of notes) a full scan is faster
 * and simpler than maintaining an index. Ranking: title > tag > body.
 *
 * @param {object[]} notes
 * @param {{query?: string, status?: string, kind?: string, tag?: string, containerId?: string | null, includeArchived?: boolean}} [filters]
 * @returns {object[]} ranked notes
 */
export function searchNotes(notes, filters = {}) {
  const {
    query = '',
    status,
    kind,
    tag,
    containerId,
    includeArchived = false,
  } = filters

  const needle = String(query ?? '').trim().toLowerCase()

  const matched = []

  for (const note of notes) {
    if (!includeArchived && note.archived) continue
    if (status && note.status !== status) continue
    if (kind && note.kind !== kind) continue
    if (tag && !note.tags.includes(tag)) continue
    if (containerId !== undefined && containerId !== null && note.containerId !== containerId) {
      continue
    }

    if (!needle) {
      matched.push({ note, rank: 3 })
      continue
    }

    const title = note.title.toLowerCase()
    const body = note.body.toLowerCase()
    const tags = note.tags.join(' ').toLowerCase()

    if (title.includes(needle)) matched.push({ note, rank: 0 })
    else if (tags.includes(needle)) matched.push({ note, rank: 1 })
    else if (body.includes(needle)) matched.push({ note, rank: 2 })
  }

  return matched
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank
      return b.note.updatedAt.localeCompare(a.note.updatedAt)
    })
    .map((entry) => entry.note)
}
