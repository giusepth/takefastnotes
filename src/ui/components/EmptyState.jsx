import { IconInboxTray } from '../icons/index.jsx'
import { VocabularyPanel } from './Vocabulary.jsx'

/**
 * The first-run screen.
 *
 * It is the highest-leverage moment in the app, so it teaches instead of
 * apologising: what this is, what will appear here, the exact syntax that
 * fills it, and what every mark in the list means. The examples below are
 * real — clicking one loads the field, so the reader can try the grammar
 * instead of reading about it.
 */
export function EmptyState({ title, hint, examples = [], onExample, showVocabulary = true }) {
  // `examples` entries are {key, label}: the key identifies the example, the
  // label is what the reader sees and what lands in the field.

  return (
    <div className="empty-state">
      <div className="empty-head">
        <span className="empty-mark" aria-hidden="true">
          <IconInboxTray width={20} height={20} />
        </span>
        <div className="empty-headings">
          <h2 className="empty-title">{title}</h2>
          <p className="empty-hint">{hint}</p>
        </div>
      </div>

      {showVocabulary ? <VocabularyPanel /> : null}

      {examples.length > 0 ? (
        <div className="empty-examples">
            <p className="empty-examples-label">O empieza por una de estas</p>
          <div className="empty-example-list">
            {examples.map((example) => (
              <button
                key={example.key}
                type="button"
                className="example-chip"
                onClick={() => onExample(example)}
              >
                {example.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
