import { useEffect, useRef, useState } from 'react'
import { IconCheck, IconClose } from '../icons/index.jsx'
import { ContainerPicker } from './ContainerPicker.jsx'
import { LinksEditor } from './LinksEditor.jsx'

/**
 * The inline editor.
 *
 * It opens inside the row it edits, so a note never leaves the register:
 * the reader keeps the surrounding context while they change one line. The
 * content, the container and the tags live in the same place, because they
 * are the same decision.
 *
 * The links section sits beside the container: which notes this one points
 * to, and which ones point back, are part of the same edit.
 */
export function NoteEditor({
  note,
  containers = [],
  onSave,
  onCancel,
  links,
  notes,
  onCreateLink,
  onRemoveLink,
}) {
  const [title, setTitle] = useState(note.title)
  const [body, setBody] = useState(note.body)
  const [containerId, setContainerId] = useState(note.containerId ?? '')
  const bodyRef = useRef(null)

  const visibleNotes = notes ?? []
  const visibleLinks = links ?? []
  const createLink = onCreateLink
  const removeLink = onRemoveLink

  useEffect(() => {
    bodyRef.current?.focus()
  }, [])

  function submit() {
    onSave({ title, body, containerId: containerId || null })
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
      return
    }
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className="note-editor" onKeyDown={handleKeyDown}>
      <label className="visually-hidden" htmlFor={`note-title-${note.id}`}>
        Título
      </label>
      <input
        id={`note-title-${note.id}`}
        className="note-editor-title"
        value={title}
        placeholder="Título"
        onChange={(event) => setTitle(event.target.value)}
      />

      <label className="visually-hidden" htmlFor={`note-body-${note.id}`}>
        Texto de la nota
      </label>
      <textarea
        id={`note-body-${note.id}`}
        ref={bodyRef}
        className="note-editor-body"
        value={body}
        rows={4}
        placeholder="Escribe la nota…"
        onChange={(event) => setBody(event.target.value)}
      />

      <div className="note-editor-foot">
        <label className="note-editor-container">
          <span className="note-editor-container-label">Contenedor</span>
          <ContainerPicker
            containers={containers}
            value={containerId}
            onChange={setContainerId}
          />
        </label>

        <LinksEditor
          note={note}
          notes={visibleNotes}
          links={visibleLinks}
          onCreateLink={createLink}
          onRemoveLink={removeLink}
        />

        <div className="note-editor-actions">
          <button type="button" className="button button-quiet" onClick={onCancel}>
            <IconClose width={13} height={13} />
            Cancelar
          </button>
          <button type="button" className="button button-primary" onClick={submit}>
            <IconCheck width={13} height={13} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
