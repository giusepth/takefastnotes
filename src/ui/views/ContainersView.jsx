import { useMemo, useState } from 'react'
import { ContainerTree, containerNoteCounts } from '../components/ContainerTree.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { IconFolder, IconTrash } from '../icons/index.jsx'
import { userMessage } from '../lib/errors.js'

const KIND_SUGGESTIONS = [
  'repositorio',
  'documento',
  'carpeta',
  'cliente',
  'servicio',
  'proyecto',
]

const EXAMPLES = [
  {
    key: 'repo',
    label: 'un repositorio con su URL',
    name: 'takefastnotes',
    kind: 'repositorio',
    url: 'https://github.com/giusepth/takefastnotes',
  },
  {
    key: 'doc',
    label: 'un documento, sin URL',
    name: 'arquitectura',
    kind: 'documento',
    url: '',
  },
]

export function ContainersView({
  containers = [],
  notes = [],
  onCreate = () => {},
  onDelete = () => {},
  onUpdate = () => {},
  onNest = () => {},
  onSelect = () => {},
  activeContainerId = null,
}) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState('')
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  // The selection is global: the sidebar and this page read the same
  // preference, so they can never disagree about what is selected.
  const handleUpdate = onUpdate
  const handleNest = onNest
  const handleSelect = onSelect
  const selectionId = activeContainerId

  const counts = useMemo(() => containerNoteCounts(containers, notes), [containers, notes])

  // The flat list is a register: the same containers, one per line and
  // sorted by name, so the reader can find a row without reading the tree.
  const sortedContainers = useMemo(
    () =>
      [...containers].sort((a, b) =>
        a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }),
      ),
    [containers],
  )

  const selected = useMemo(
    () => containers.find((container) => container.id === selectionId) ?? null,
    [containers, selectionId],
  )

  async function handleSubmit(event) {
    event.preventDefault()
    if (!name.trim() || busy) return

    setBusy(true)
    setError(null)

    try {
      await onCreate({ name: name.trim(), kind: kind.trim(), url: url.trim() || null })
      setName('')
      setKind('')
      setUrl('')
    } catch (submitError) {
      setError(userMessage(submitError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="view" aria-labelledby="containers-title">
      <div className="view-header">
        <h2 className="view-heading" id="containers-title">
          Contenedores
        </h2>
        <span className="view-count">{containers.length}</span>
      </div>

      <div className="about-section">
        <p>
          Un contenedor es <strong>el contexto de una nota</strong>: un repositorio, un documento, una
          carpeta, un cliente, un servicio. Sirve para agrupar notas que hablan de lo mismo sin
          depender de un proyecto en concreto.
        </p>
        <p>
          Un contenedor puede vivir dentro de otro: la jerarquía se edita desde el árbol. Una nota se
          vincula a un contenedor de dos maneras: escribiendo <code className="syntax-token">@nombre</code>{' '}
          al capturarla, o eligiéndolo en el editor de la nota. Los contenedores viven en este
          navegador, igual que las notas: no se sincronizan y no se comparten.
        </p>
      </div>

      {containers.length > 0 ? (
        <section className="tree-panel" aria-labelledby="tree-title">
          <div className="tree-panel-head">
            <h3 className="tree-panel-title" id="tree-title">
              Jerarquía
            </h3>
            <p className="tree-panel-hint">
              El número cuenta las notas del contenedor y las de sus subcontenedores.
            </p>
          </div>

          <div className="tree-body">
            <ContainerTree
              containers={containers}
              notes={notes}
              activeContainerId={selectionId}
              onSelect={handleSelect}
              onUpdate={handleUpdate}
              onDelete={onDelete}
              onNest={handleNest}
            />
          </div>

          {selected ? (
            <div className="tree-selection">
              <span className="tree-selection-label">Seleccionado</span>
              <span className="tree-selection-name">{selected.name}</span>
              {selected.kind ? (
                <span className="tree-selection-kind">{selected.kind}</span>
              ) : null}
              <span className="tree-selection-count">
                {counts.total.get(selected.id) ?? 0}{' '}
                {(counts.total.get(selected.id) ?? 0) === 1 ? 'nota' : 'notas'}
              </span>
              {selected.url ? (
                <a
                  className="tree-selection-url"
                  href={selected.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {selected.url}
                </a>
              ) : null}
              <button
                type="button"
                className="button button-quiet tree-selection-clear"
                onClick={() => handleSelect(null)}
              >
                Quitar selección
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <form className="container-form" onSubmit={handleSubmit}>
        <div className="container-form-field">
          <label htmlFor="container-name">Nombre</label>
          <input
            id="container-name"
            type="text"
            value={name}
            placeholder="takefastnotes"
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <div className="container-form-field">
          <label htmlFor="container-kind">Tipo</label>
          <input
            id="container-kind"
            type="text"
            list="container-kind-options"
            value={kind}
            placeholder="repositorio"
            onChange={(event) => setKind(event.target.value)}
          />
          <datalist id="container-kind-options">
            {KIND_SUGGESTIONS.map((suggestion) => (
              <option key={suggestion} value={suggestion} />
            ))}
          </datalist>
        </div>

        <div className="container-form-field container-form-field--wide">
          <label htmlFor="container-url">Dirección (opcional)</label>
          <input
            id="container-url"
            type="url"
            value={url}
            placeholder="https://github.com/usuario/repositorio"
            onChange={(event) => setUrl(event.target.value)}
          />
        </div>

        <button className="button button-primary" type="submit" disabled={busy || !name.trim()}>
          Crear contenedor
        </button>
      </form>

      {error ? (
        <p className="capture-error" role="alert">
          {error}
        </p>
      ) : null}

      {containers.length === 0 ? (
        <EmptyState
          title="Todavía no hay contenedores"
          hint="Crea el primero arriba: un repositorio, un documento, una carpeta. Después puedes vincular notas con @nombre."
          examples={EXAMPLES}
          onExample={(example) => {
            setName(example.name)
            setKind(example.kind)
            setUrl(example.url)
          }}
          showVocabulary={false}
        />
      ) : (
        <>
          <h3 className="section-label">Todos los contenedores</h3>
          <ul className="container-list">
            {sortedContainers.map((container) => {
              const count = counts.total.get(container.id) ?? 0
              return (
                <li className="container-item" key={container.id}>
                  <span className="container-item-mark" aria-hidden="true">
                    <IconFolder width={15} height={15} />
                  </span>

                  <div className="container-item-body">
                    <h3 className="container-item-name">
                      {container.name}
                      {' · '}
                      <span className="container-item-kind">{container.kind || 'sin tipo'}</span>
                    </h3>
                    {container.url ? (
                      <a
                        className="container-item-url"
                        href={container.url}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        {container.url}
                      </a>
                    ) : null}
                  </div>

                  <span className="container-item-count">
                    {count} {count === 1 ? 'nota' : 'notas'}
                  </span>

                  <button
                    type="button"
                    className="row-actions"
                    aria-label={`Eliminar el contenedor ${container.name}`}
                    title="Eliminar el contenedor (sus notas quedan sin contenedor)"
                    onClick={() => onDelete(container.id)}
                  >
                    <IconTrash width={14} height={14} />
                  </button>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
