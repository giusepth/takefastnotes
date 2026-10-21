import { KIND_LABELS } from '../lib/vocabulary.js'

/**
 * The filter row.
 *
 * Two axes, both free-form: the type of a note and the tags it carries.
 * A chip that is not selected filters when it is clicked; a selected one
 * filters everything *except* itself. Several can be selected at once, and
 * they combine.
 */
export function FilterBar({
  kindCounts = new Map(),
  tagCounts = [],
  selectedKinds = [],
  selectedTags = [],
  onToggleKind,
  onToggleTag,
  onClear,
}) {
  const hasFilters = selectedKinds.length > 0 || selectedTags.length > 0

  if (kindCounts.size === 0 && tagCounts.length === 0) return null

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="filter-group-label">Tipo</span>
        {[...kindCounts.entries()].map(([kind, count]) => {
          const active = selectedKinds.includes(kind)
          return (
            <button
              key={kind}
              type="button"
              className={`filter-chip${active ? ' is-active' : ''}`}
              aria-pressed={active}
              onClick={() => onToggleKind(kind)}
            >
              <span className={`kind-swatch kind-swatch--${kind}`} aria-hidden="true" />
              {KIND_LABELS[kind] ?? kind}
              <span className="filter-chip-count">{count}</span>
            </button>
          )
        })}
      </div>

      {tagCounts.length > 0 ? (
        <div className="filter-group">
          <span className="filter-group-label">Etiquetas</span>
          {tagCounts.map(([tag, count]) => {
            const active = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                className={`filter-chip filter-chip--tag${active ? ' is-active' : ''}`}
                aria-pressed={active}
                onClick={() => onToggleTag(tag)}
              >
                #{tag}
                <span className="filter-chip-count">{count}</span>
              </button>
            )
          })}
        </div>
      ) : null}

      {hasFilters ? (
        <button type="button" className="filter-clear" onClick={onClear}>
          Quitar filtros
        </button>
      ) : null}
    </div>
  )
}
