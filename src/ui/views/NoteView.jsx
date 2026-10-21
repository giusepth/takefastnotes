import { useMemo, useState } from 'react'
import { IconFolder } from '../icons/index.jsx'
import { KIND_LABELS } from '../lib/vocabulary.js'
import { formatFullTime } from '../lib/format.js'
import { LinksEditor } from '../components/LinksEditor.jsx'
import { hashHref } from '../lib/useHashRoute.js'
import { NoteEditor } from '../components/NoteEditor.jsx'

/**
 * One note, on its own address.
 *
 * A note reached from a link is not a row in a list: it is a document, with
 * its content, its context and the notes that point at it. It can be edited
 * in place, and it can be left behind with the browser's back button.
 */
export function NoteView({
  note,
  notes = [],
  links = [],
  containers = [],
  onUpdateNote,
  onCreateLink,
  onRemoveLink,
}) {
  const [editing, setEditing] = useState(false)

  const container = useMemo(
    () => containers.find((item) => item.id === note?.containerId) ?? null,
    [containers, note],
  )

  // The title is often the first line of the body. On a document the title
  // is already there, so the body starts where the title stops.
  const bodyBeyondTitle = useMemo(() => {
    if (!note) return ''
    const body = note.body ?? ''
    if (note.title && body.startsWith(note.title)) {
      return body.slice(note.title.length).trim()
    }
    return body
  }, [note])

  if (!note) {
    return (
      <section className="view" aria-labelledby="note-title">
        <div className="view-header">
          <h2 className="view-heading" id="note-title">
            La nota no existe
          </h2>
        </div>
        <p className="muted">
          Puede que se haya archivado o borrado. Volvé a{' '}
          <a href={hashHref('/notas')}>las notas</a>.
        </p>
      </section>
    )
  }

  return (
    <section className="view note-view" aria-labelledby="note-title">
      <div className="view-header">
        <a className="note-view-back" href={hashHref('/notas')}>
          ← Notas
        </a>
        <h2 className="visually-hidden" id="note-title">
          {note.title}
        </h2>
        <span className="view-count">
          {formatFullTime(note.createdAt)}
        </span>
      </div>

      {editing ? (
        <NoteEditor
          note={note}
          containers={containers}
          links={links}
          notes={notes}
          onCreateLink={onCreateLink}
          onRemoveLink={onRemoveLink}
          onSave={async (changes) => {
            // The editor closes only when the note is stored: a failed
            // write keeps it open, with the text and the message.
            await onUpdateNote(note.id, changes)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <article className="note-document">
          <header className="note-document-header">
            <span className={`kind-swatch kind-swatch--${note.kind}`} aria-hidden="true" />
            <span className="note-document-kind">{KIND_LABELS[note.kind]}</span>
            {container ? (
              <span className="chip-static">
                <IconFolder />
                @{container.name}
              </span>
            ) : null}
            <button
              type="button"
              className="button button-quiet note-document-edit"
              onClick={() => setEditing(true)}
            >
              Editar
            </button>
          </header>

          <h1 className="note-document-title">{note.title}</h1>
          {bodyBeyondTitle ? <p className="note-document-body">{bodyBeyondTitle}</p> : null}

          {note.tags.length > 0 ? (
            <ul className="note-meta note-document-tags">
              {note.tags.map((tag) => (
                <li key={tag}>
                  <span className="chip chip-tag">#{tag}</span>
                </li>
              ))}
            </ul>
          ) : null}

          <LinksEditor
            note={note}
            notes={notes}
            links={links}
            onCreateLink={onCreateLink}
            onRemoveLink={onRemoveLink}
          />
        </article>
      )}
    </section>
  )
}
