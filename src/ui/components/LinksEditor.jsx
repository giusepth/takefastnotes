import { useMemo, useState } from 'react'
import { IconChevronDown, IconClose } from '../icons/index.jsx'
import { userMessage } from '../lib/errors.js'
import { KIND_LABELS } from '../lib/vocabulary.js'

/**
 * Las relaciones que la interfaz ofrece.
 *
 * El dominio guarda un identificador estable en inglés (`depends-on`)
 * porque es un dato: una copia de seguridad tiene que viajar sin
 * traducción y los tests verifican ese texto. La etiqueta en español es
 * de la interfaz, y solo aparece en pantalla. Es la misma frontera que
 * usan los tipos y los estados: identificador en el dominio, palabra en
 * la pantalla.
 */
export const RELATION_TYPES = Object.freeze([
  { id: 'relates-to', label: 'relacionada con' },
  { id: 'blocks', label: 'bloquea' },
  { id: 'blocked-by', label: 'bloqueada por' },
  { id: 'depends-on', label: 'depende de' },
  { id: 'implements', label: 'implementa' },
  { id: 'caused-by', label: 'causada por' },
  { id: 'refines', label: 'refina' },
  { id: 'duplicate-of', label: 'duplica' },
])

export const RELATION_LABELS = Object.freeze(
  RELATION_TYPES.reduce((labels, type) => {
    labels[type.id] = type.label
    return labels
  }, {}),
)

/** Cuántos destinos se ofrecen a la vez: la lista se lee, no se recorre. */
const MAX_CANDIDATES = 8

/**
 * La sección de enlaces del editor de nota.
 *
 * Una nota puede apuntar a otras (salientes) y otras pueden apuntar a
 * esta (entrantes). Las salientes se editan; las entrantes se leen,
 * porque son la forma de encontrar una nota desde un lugar que no
 * escribiste.
 *
 * El dominio ya impide el vínculo consigo mismo y el vínculo repetido:
 * la interfaz no los ofrece, así que nadie los intenta.
 */
export function LinksEditor({
  note,
  notes = [],
  links = [],
  onCreateLink,
  onRemoveLink,
}) {
  const [query, setQuery] = useState('')
  const [relation, setRelation] = useState('relates-to')
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const outgoing = useMemo(
    () => links.filter((link) => link.sourceType === 'note' && link.sourceId === note.id),
    [links, note.id],
  )

  const incoming = useMemo(
    () => links.filter((link) => link.targetType === 'note' && link.targetId === note.id),
    [links, note.id],
  )

  const titles = useMemo(() => {
    const map = new Map()
    for (const item of notes) map.set(item.id, item.title)
    return map
  }, [notes])

  const candidates = useMemo(() => {
    const term = normalize(query)
    if (!term) return []

    const linked = new Set(outgoing.map((link) => link.targetId))

    return notes
      .filter((candidate) => candidate.id !== note.id)
      .filter((candidate) => !candidate.archived)
      .filter((candidate) => !linked.has(candidate.id))
      .filter((candidate) => normalize(candidate.title).includes(term))
      .slice(0, MAX_CANDIDATES)
  }, [notes, note.id, outgoing, query])

  async function handleAdd() {
    if (!selectedId || busy || !onCreateLink) return

    setBusy(true)
    setError(null)

    try {
      await onCreateLink({
        sourceType: 'note',
        sourceId: note.id,
        targetType: 'note',
        targetId: selectedId,
        relation,
      })
      setSelectedId(null)
      setQuery('')
    } catch (addError) {
      setError(userMessage(addError))
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove(linkId) {
    if (!onRemoveLink) return

    try {
      await onRemoveLink(linkId)
    } catch (removeError) {
      setError(userMessage(removeError))
    }
  }

  function handleSearchKeyDown(event) {
    if (event.key === 'Enter' && selectedId) {
      event.preventDefault()
      handleAdd()
    }
  }

  return (
    <section className="links" aria-label="Enlaces">
      <div className="links-head">
        <span className="links-heading">Enlaces</span>
        <span className="links-count">{outgoing.length + incoming.length}</span>
      </div>

      <div className="links-controls">
        <input
          className="links-search"
          type="text"
          value={query}
          placeholder="Buscar nota…"
          aria-label="Buscar nota para vincular"
          onChange={(event) => {
            setQuery(event.target.value)
            setSelectedId(null)
          }}
          onKeyDown={handleSearchKeyDown}
        />

        <label className="visually-hidden" htmlFor={`links-relation-${note.id}`}>
          Tipo de relación
        </label>
        <select
          id={`links-relation-${note.id}`}
          className="links-relation"
          value={relation}
          onChange={(event) => setRelation(event.target.value)}
        >
          {RELATION_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="button button-quiet links-add"
          onClick={handleAdd}
          disabled={!selectedId || busy || !onCreateLink}
        >
          Añadir enlace
        </button>
      </div>

      {candidates.length > 0 ? (
        <ul className="links-candidates" aria-label="Notas candidatas">
          {candidates.map((candidate) => (
            <li key={candidate.id}>
              <button
                type="button"
                className={`links-candidate${selectedId === candidate.id ? ' is-selected' : ''}`}
                aria-pressed={selectedId === candidate.id}
                onClick={() => setSelectedId(candidate.id)}
              >
                <span
                  className={`kind-swatch kind-swatch--${candidate.kind}`}
                  aria-hidden="true"
                />
                <span className="links-candidate-title">{candidate.title}</span>
                <span className="links-candidate-kind">
                  {KIND_LABELS[candidate.kind] ?? candidate.kind}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p className="links-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="links-block">
        <span className="links-block-label">Salientes</span>
        {outgoing.length === 0 ? (
          <p className="links-empty">Esta nota todavía no apunta a ninguna otra.</p>
        ) : (
          <ul className="links-list" aria-label="Enlaces salientes">
            {outgoing.map((link) => {
              const title = titleOf(titles, link.targetId)
              return (
                <li className="links-item" key={link.id}>
                  <span className="links-relation-chip">{relationLabel(link.relation)}</span>
                  <IconChevronDown className="links-arrow" width={13} height={13} />
                  <span className="links-item-title">{title}</span>
                  <button
                    type="button"
                    className="row-actions"
                    aria-label={`Quitar el enlace con ${title}`}
                    title="Quitar el enlace"
                    onClick={() => handleRemove(link.id)}
                  >
                    <IconClose width={12} height={12} />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="links-block">
        <span className="links-block-label">Entrantes</span>
        {incoming.length === 0 ? (
          <p className="links-empty">Ninguna otra nota apunta a esta.</p>
        ) : (
          <>
            <p className="links-hint">Solo lectura: son vínculos de otras notas.</p>
            <ul className="links-list" aria-label="Enlaces entrantes">
              {incoming.map((link) => {
                const title = titleOf(titles, link.sourceId)
                return (
                <li className="links-item links-item--incoming" key={link.id}>
                  <span className="links-relation-chip">{relationLabel(link.relation)}</span>
                  <IconChevronDown className="links-arrow links-arrow--incoming" width={13} height={13} />
                  <span className="links-item-title">{title}</span>
                </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}

/**
 * La palabra de la relación, o el identificador tal cual cuando el
 * vínculo se creó con una relación libre que la interfaz no conoce.
 */
function relationLabel(relation) {
  return RELATION_LABELS[relation] ?? relation
}

function titleOf(titles, id) {
  return titles.get(id) ?? 'Nota no encontrada'
}

/**
 * Compara sin acentos ni mayúsculas: se escribe como se habla.
 */
function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}
