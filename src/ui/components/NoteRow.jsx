import { useState } from 'react'
import { IconArchive, IconClose, IconEdit, IconFolder, IconMore, IconUnarchive } from '../icons/index.jsx'
import { userMessage } from '../lib/errors.js'
import { formatFullTime, formatNoteTime } from '../lib/format.js'
import {
  KIND_LABELS,
  KIND_MEANINGS,
  KINDS,
  STATUS_LABELS,
  STATUS_MARKS,
  STATUS_MEANINGS,
  STATUS_STAGES,
  STATUSES,
} from '../lib/vocabulary.js'
import { hashHref, noteRoute } from '../lib/useHashRoute.js'
import { Menu } from './Menu.jsx'
import { NoteEditor } from './NoteEditor.jsx'

const PREVIEW_LENGTH = 180

/**
 * One line of the register: what it is, what it says, where it is.
 *
 * The row is not a card. It is a record in a sheet: the kind sits in an
 * aligned column so it can be scanned, the title carries the weight, and
 * everything else is quiet. Kind and stage are live controls — a note is
 * classified after it is captured, not before — and each one explains
 * itself in the menu it opens.
 *
 * The row also carries the two actions a note needs to stay alive: it can
 * be edited in place, and it can be archived. Archiving is not deleting:
 * the note leaves the working lists and stays recoverable.
 */
export function NoteRow({
  note,
  containerName = null,
  containers = [],
  links = [],
  notes = [],
  onUpdateNote,
  onCreateLink,
  onRemoveLink,
  onError = null,
}) {
  const [editing, setEditing] = useState(false)

  const kind = note.kind
  const status = note.status
  const stage = STATUS_STAGES[status] ?? 'pending'
  const StageMark = STATUS_MARKS[status]
  const preview = buildPreview(note)

  const kindItems = KINDS.map((id) => ({
    id,
    label: KIND_LABELS[id],
    hint: KIND_MEANINGS[id],
    leading: <span className={`kind-swatch kind-swatch--${id}`} aria-hidden="true" />,
  }))

  const statusItems = STATUSES.map((id) => {
    const Mark = STATUS_MARKS[id]
    return {
      id,
      label: STATUS_LABELS[id],
      hint: STATUS_MEANINGS[id],
      leading: <Mark />,
    }
  })

  const actionItems = [
    {
      id: 'edit',
      label: 'Editar nota',
      hint: 'Cambiar el texto y el contenedor',
      leading: <IconEdit width={13} height={13} />,
    },
    note.archived
      ? {
          id: 'restore',
          label: 'Restaurar',
          hint: 'Volver a la lista de notas',
          leading: <IconUnarchive width={13} height={13} />,
        }
      : {
          id: 'archive',
          label: 'Archivar',
          hint: 'Sacarla de las listas sin borrarla',
          leading: <IconArchive width={13} height={13} />,
        },
  ]

  /**
   * A change that is not the content of the note: kind, state, archive.
   *
   * The store rolls the row back when the write fails, so the failure has
   * to be said out loud: nobody sees a change that silently did not happen.
   *
   * The message also goes to the parent. An archived note leaves the
   * register and the row goes with it, so a message that only lives in this
   * row dies with the row and the failure goes back to being silent.
   */
  async function update(patch) {
    // The banner above the register is the single voice for a failed write:
    // a row-level failure can take the row out of the register (archiving it,
    // or moving it out of the inbox scope), and a message that lives only in
    // this row dies with the row. Reporting from one place avoids saying the
    // same thing twice.
    if (onError) onError(null)
    try {
      await onUpdateNote(note.id, patch)
    } catch (updateError) {
      if (onError) onError(userMessage(updateError))
    }
  }

  function handleAction(id) {
    if (id === 'edit') {
      setEditing(true)
      return
    }
    if (id === 'archive') update({ archived: true })
    if (id === 'restore') update({ archived: false })
  }

  return (
    <li className={`note-row${editing ? ' is-editing' : ''}${note.archived ? ' is-archived' : ''}`}>
      <div className="note-kind-cell">
        <Menu
          triggerClassName="kind-cell"
          triggerLabel={`Tipo: ${KIND_LABELS[kind]}. Cambiar el tipo`}
          triggerTitle={`${KIND_LABELS[kind]} — ${KIND_MEANINGS[kind]}`}
          align="start"
          headLabel="Tipo — qué es esta nota"
          items={kindItems}
          selectedId={kind}
          onSelect={(next) => update({ kind: next })}
          trigger={
            <>
              <span className={`kind-swatch kind-swatch--${kind}`} aria-hidden="true" />
              <span className="kind-label">{KIND_LABELS[kind]}</span>
            </>
          }
        />
      </div>

      <div className="note-body">
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
              // write keeps it open, with the text and the message. The
              // editor says what went wrong by itself, so the row does not
              // report it a second time.
              await onUpdateNote(note.id, changes)
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <h3 className="note-title">
              <a className="note-title-link" href={hashHref(noteRoute(note.id))}>
                {note.title}
              </a>
            </h3>
            {preview ? <p className="note-preview">{preview}</p> : null}

            {note.tags.length > 0 || containerName ? (
              <ul className="note-meta">
                {note.tags.map((tag) => (
                  <li key={tag}>
                    <button
                      type="button"
                      className="tag-chip"
                      aria-label={`Quitar la etiqueta ${tag}`}
                      title={`Quitar la etiqueta #${tag}`}
                      onClick={() => update({ removeTags: [tag] })}
                    >
                      #{tag}
                      <IconClose className="tag-remove" />
                    </button>
                  </li>
                ))}
                {containerName ? (
                  <li>
                    <span className="chip-static" title={`Vinculada a ${containerName}`}>
                      <IconFolder />
                      @{containerName}
                    </span>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </>
        )}

      </div>

      <div className="note-side">
        <div className="note-side-row">
          <Menu
            triggerClassName={`status-cell status-cell--${stage}`}
            triggerLabel={`Estado: ${STATUS_LABELS[status]}. Cambiar el estado`}
            triggerTitle={`${STATUS_LABELS[status]} — ${STATUS_MEANINGS[status]}`}
            headLabel="Estado — en qué punto está esta nota"
            items={statusItems}
            selectedId={status}
            onSelect={(next) => update({ status: next })}
            trigger={
              <>
                {StageMark ? <StageMark /> : null}
                {STATUS_LABELS[status]}
              </>
            }
          />

          <Menu
            triggerClassName="row-actions"
            triggerLabel="Acciones de la nota"
            triggerTitle="Editar, archivar o restaurar"
            headLabel="Acciones"
            items={actionItems}
            selectedId={null}
            onSelect={handleAction}
            trigger={<IconMore width={14} height={14} />}
          />
        </div>

        <time className="note-time" dateTime={note.createdAt} title={formatFullTime(note.createdAt)}>
          {formatNoteTime(note.createdAt)}
        </time>
      </div>
    </li>
  )
}

/**
 * The preview is what the note says beyond its title, so the first line
 * is not repeated in the row.
 */
function buildPreview(note) {
  const body = note.body ?? ''
  const title = note.title ?? ''
  let rest = body

  if (title && rest.startsWith(title)) rest = rest.slice(title.length).trim()
  if (!rest) return ''

  return rest.length > PREVIEW_LENGTH ? `${rest.slice(0, PREVIEW_LENGTH)}…` : rest
}
