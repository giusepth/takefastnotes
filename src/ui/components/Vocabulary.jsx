import { IconCheck } from '../icons/index.jsx'
import {
  KIND_LABELS,
  KIND_MEANINGS,
  KINDS,
  STATUS_LABELS,
  STATUS_MEANINGS,
  STATUSES,
  STATUS_MARKS,
} from '../lib/vocabulary.js'

/**
 * El vocabulario, escrito.
 *
 * Dos vocabularios atraviesan la app — los tipos (qué es una nota) y los
 * estados (en qué punto está) — más la gramática de captura que los fija.
 * Nada en este archivo es decorativo: es la explicación que la interfaz le
 * debe a quien nunca vio la app.
 *
 * Se usa dos veces: como cartel de primera vez, donde es toda la pantalla,
 * y como panel que alguien que ya vuelve puede abrir desde la lista.
 */
export function VocabularyPanel() {
  return (
    <div className="vocabulary">
      <section className="vocabulary-column">
        <h3 className="vocabulary-title">Cómo escribir una nota</h3>
        <dl className="vocabulary-list">
          <div className="vocabulary-row">
            <dt>
              <code className="syntax-token">#etiqueta</code>
            </dt>
            <dd>Añade una etiqueta. Vale cualquier palabra: #backend, #release/2.0.</dd>
          </div>
          <div className="vocabulary-row">
            <dt>
              <code className="syntax-token">tipo:</code>
            </dt>
            <dd>
              Fija qué es la nota. Al principio: feature:, fix:, decision:, idea:, question:, note:.
            </dd>
          </div>
          <div className="vocabulary-row">
            <dt>
              <code className="syntax-token">@contenedor</code>
            </dt>
            <dd>Vincula la nota a un contenedor que ya existe.</dd>
          </div>
          <div className="vocabulary-row">
            <dt>
              <code className="syntax-token">Enter</code>
            </dt>
            <dd>Guarda la nota y deja el campo listo para la siguiente.</dd>
          </div>
        </dl>
      </section>

      <section className="vocabulary-column">
        <h3 className="vocabulary-title">Qué significan las marcas</h3>
        <dl className="vocabulary-list">
          {KINDS.map((kind) => (
            <div className="vocabulary-row" key={kind}>
              <dt>
                <span className={`kind-swatch kind-swatch--${kind}`} aria-hidden="true" />
                {KIND_LABELS[kind]}
              </dt>
              <dd>{KIND_MEANINGS[kind]}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="vocabulary-column">
        <h3 className="vocabulary-title">En qué punto está una nota</h3>
        <dl className="vocabulary-list">
          {STATUSES.map((status) => {
            const Mark = STATUS_MARKS[status]
            return (
              <div className="vocabulary-row" key={status}>
                <dt>
                  <span className="vocabulary-mark" aria-hidden="true">
                    <Mark />
                  </span>
                  {STATUS_LABELS[status]}
                </dt>
                <dd>{STATUS_MEANINGS[status]}</dd>
              </div>
            )
          })}
        </dl>
      </section>
    </div>
  )
}

/**
 * The three grammar tokens, in the capture bar, where they are used.
 *
 * Each token lights up the moment the draft uses it, so the syntax is
 * learned by typing rather than by reading a manual. The strip never
 * grows and never covers the notes: it is one quiet line inside the
 * capture control.
 */
export function GrammarStrip({ tokens }) {
  const items = [
    { id: 'tag', code: '#etiqueta', label: 'añade una etiqueta', used: tokens.tag },
    { id: 'kind', code: 'feature:', label: 'fija el tipo', used: tokens.kind },
    { id: 'container', code: '@contenedor', label: 'la vincula', used: tokens.container },
  ]

  return (
    <ul className="grammar-strip">
      {items.map((item) => (
        <li className={`grammar-item${item.used ? ' is-used' : ''}`} key={item.id}>
          <code className="grammar-code">{item.code}</code>
          <span className="grammar-label">{item.label}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * What the draft will become.
 *
 * The same words and marks the note will carry, so the reader can see the
 * capture understood them before they press Enter.
 */
export function CaptureReadout({ parsed, containerName, confirmation, error }) {
  if (error) {
    return (
      <p className="capture-readout" role="alert">
        <span className="capture-error">No se pudo guardar: {error}</span>
      </p>
    )
  }

  if (confirmation) {
    return (
      <p className="capture-readout" role="status">
        <span className="readout-status">
          <IconCheck width={12} height={12} />
          Guardada
        </span>
        <span className="readout-detail">— {confirmation.title}</span>
      </p>
    )
  }

  if (!parsed) {
    return null
  }

  if (!parsed.body) {
    return (
      <p className="capture-readout" role="status">
        <span className="readout-detail">Todavía no hay nada que guardar — escribe unas palabras.</span>
      </p>
    )
  }

  return (
    <p className="capture-readout" role="status">
      <span className="readout-lead">Se guardará como</span>
      <span className="readout-kind">
        <span className={`kind-swatch kind-swatch--${parsed.kind}`} aria-hidden="true" />
        {KIND_LABELS[parsed.kind]}
      </span>
      {parsed.tags.map((tag) => (
        <span className="readout-token" key={tag}>
          #{tag}
        </span>
      ))}
      {containerName ? <span className="readout-token">@{containerName}</span> : null}
    </p>
  )
}
