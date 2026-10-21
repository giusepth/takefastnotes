import { useState } from 'react'
import { IconArchive, IconClose, IconEdit, IconFolder, IconMore, IconUnarchive } from '../icons/index.jsx'
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

  function handleAction(id) {
    if (id === 'edit') {
      setEditing(true)
      return
    }
    if (id === 'archive') onUpdateNote(note.id, { archived: true })
    if (id === 'restore') onUpdateNote(note.id, { archived: false })
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
          onSelect={(next) => onUpdateNote(note.id, { kind: next })}
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
            onSave={(changes) => {
              setEditing(false)
              onUpdateNote(note.id, changes)
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
                      onClick={() => onUpdateNote(note.id, { removeTags: [tag] })}
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
            onSelect={(next) => onUpdateNote(note.id, { status: next })}
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
