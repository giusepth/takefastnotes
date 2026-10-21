import { useMemo, useState } from 'react'
import { EmptyState } from '../components/EmptyState.jsx'
import { FilterBar } from '../components/FilterBar.jsx'
import { NoteRow } from '../components/NoteRow.jsx'
import { VocabularyPanel } from '../components/Vocabulary.jsx'
import { IconChevronDown, IconClose, IconList } from '../icons/index.jsx'
import { collectDescendants } from '../../domain/usecases/containers.js'
import { searchNotes } from '../../domain/usecases/search.js'

const SCOPES = [
  { id: 'inbox', label: 'Bandeja' },
  { id: 'all', label: 'Todas' },
  { id: 'archived', label: 'Archivadas' },
]

const EXAMPLES = [
  { key: 'feature', label: 'feature: agregar reintentos al webhook #backend' },
  { key: 'fix', label: 'fix: el worker de la cola se come los 503 @takefastnotes' },
  { key: 'decision', label: 'decision: el pipeline de build se queda como está' },
]

export function InboxView({
  notes,
  containers,
  links = [],
  onUpdateNote,
  onCreateLink,
  onRemoveLink,
  onExample,
  searchQuery = '',
  containerFilter = null,
  onClearContainer,
}) {
  const [scope, setScope] = useState('inbox')
  const [vocabularyOpen, setVocabularyOpen] = useState(false)
  const [selectedKinds, setSelectedKinds] = useState([])
  const [selectedTags, setSelectedTags] = useState([])

  const containerNames = useMemo(() => {
    const map = new Map()
    for (const container of containers) map.set(container.id, container.name)
    return map
  }, [containers])

  // A container filter includes its descendants, because the count the tree
  // shows is a rollup: the list and the number have to agree.
  const containerIds = useMemo(() => {
    if (!containerFilter) return null
    return new Set([containerFilter, ...collectDescendants(containers, containerFilter)])
  }, [containers, containerFilter])

  const inScope = useMemo(() => {
    const archived = notes.filter((note) => note.archived)
    const live = notes.filter((note) => !note.archived)
    const byContainer = (list) =>
      containerIds ? list.filter((note) => note.containerId && containerIds.has(note.containerId)) : list

    return {
      inbox: byContainer(live.filter((note) => note.status === 'inbox')),
      all: byContainer(live),
      archived: byContainer(archived),
    }
  }, [notes, containerIds])

  const counts = useMemo(
    () => ({
      inbox: inScope.inbox.length,
      all: inScope.all.length,
      archived: inScope.archived.length,
    }),
    [inScope],
  )

  const kindCounts = useMemo(() => {
    const counts = new Map()
    for (const note of inScope[scope]) {
      counts.set(note.kind, (counts.get(note.kind) ?? 0) + 1)
    }
    return counts
  }, [inScope, scope])

  const tagCounts = useMemo(() => {
    const counts = new Map()
    for (const note of inScope[scope]) {
      for (const tag of note.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12)
  }, [inScope, scope])

  // Los filtros se combinan: con varios tipos seleccionados se quiere ver
  // cualquiera de ellos; con varias etiquetas, todas.
  const filteredNotes = useMemo(() => {
    const source = inScope[scope]
    const byKind =
      selectedKinds.length === 0
        ? source
        : source.filter((note) => selectedKinds.includes(note.kind))
    if (selectedTags.length === 0) return byKind
    return byKind.filter((note) => selectedTags.every((tag) => note.tags.includes(tag)))
  }, [inScope, scope, selectedKinds, selectedTags])

  const visible = useMemo(
    () => searchNotes(filteredNotes, { query: searchQuery, includeArchived: scope === 'archived' }),
    [filteredNotes, searchQuery, scope],
  )

  function toggle(list, value, setter) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
  }

  const empty = visible.length === 0
  const firstRun = notes.length === 0
  const hasFilters =
    Boolean(searchQuery) ||
    Boolean(containerFilter) ||
    selectedKinds.length > 0 ||
    selectedTags.length > 0

  return (
    <section className="view" aria-labelledby="notes-title">
      <div className="view-header">
        <h2 className="visually-hidden" id="notes-title">
          Notas
        </h2>

        <div className="segmented" role="group" aria-label="Alcance">
          {SCOPES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`segmented-button${item.id === scope ? ' is-active' : ''}`}
              aria-pressed={item.id === scope}
              onClick={() => setScope(item.id)}
            >
              {item.label}
              <span className="segmented-count">{counts[item.id]}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="vocabulary-toggle"
          aria-expanded={vocabularyOpen}
          aria-controls="vocabulary-panel"
          onClick={() => setVocabularyOpen((open) => !open)}
        >
          <IconList width={13} height={13} />
          Vocabulario
          <IconChevronDown width={12} height={12} className="vocabulary-chevron" />
        </button>
      </div>

      <FilterBar
        kindCounts={kindCounts}
        tagCounts={tagCounts}
        selectedKinds={selectedKinds}
        selectedTags={selectedTags}
        onToggleKind={(kind) => toggle(selectedKinds, kind, setSelectedKinds)}
        onToggleTag={(tag) => toggle(selectedTags, tag, setSelectedTags)}
        onClear={() => {
          setSelectedKinds([])
          setSelectedTags([])
        }}
      />

      {containerFilter ? (
        <div className="filter-strip">
          <span className="filter-strip-label">Contenedor</span>
          <span className="filter-strip-value">
            {containerNames.get(containerFilter) ?? 'Sin nombre'}
          </span>
          <button
            type="button"
            className="filter-strip-clear"
            onClick={onClearContainer}
            aria-label="Quitar el filtro de contenedor"
          >
            <IconClose width={12} height={12} />
          </button>
        </div>
      ) : null}

      {vocabularyOpen ? (
        <div className="vocabulary-panel" id="vocabulary-panel">
          <VocabularyPanel />
        </div>
      ) : null}

      {empty ? (
        <EmptyState
          title={emptyTitle(scope, hasFilters)}
          hint={emptyHint(scope, firstRun, counts.all, hasFilters)}
          examples={firstRun ? EXAMPLES : []}
          showVocabulary={firstRun}
          onExample={onExample}
        />
      ) : (
        <div className="record-sheet">
          <ol className="record-rows">
            {visible.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                containers={containers}
                links={links}
                notes={notes}
                containerName={note.containerId ? containerNames.get(note.containerId) ?? null : null}
                onUpdateNote={onUpdateNote}
                onCreateLink={onCreateLink}
                onRemoveLink={onRemoveLink}
              />
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

function emptyTitle(scope, filtered) {
  if (filtered) return 'Sin resultados'
  if (scope === 'inbox') return 'La bandeja está vacía'
  if (scope === 'archived') return 'No hay notas archivadas'
  return 'Todavía no hay notas'
}

function emptyHint(scope, firstRun, total, filtered) {
  if (firstRun) {
    return 'Las notas que captures llegan aquí en el momento de pulsar Enter, y se quedan en este navegador. No se envía nada a ninguna parte.'
  }

  if (filtered) {
    return 'Ninguna nota coincide con este filtro. Probá con otras palabras o quitá el filtro de contenedor.'
  }

  if (scope === 'inbox') {
    return `No hay nada pendiente de clasificar. Las ${total} notas de este dispositivo ya tienen un estado.`
  }

  if (scope === 'archived') {
    return 'Las notas que archives quedan guardadas aquí, fuera de la vista de trabajo, y se pueden restaurar en cualquier momento.'
  }

  return 'Todavía no se ha capturado nada en este dispositivo.'
}
