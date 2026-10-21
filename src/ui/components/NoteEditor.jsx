import { useEffect, useRef, useState } from 'react'
import { IconCheck, IconClose } from '../icons/index.jsx'
import { userMessage } from '../lib/errors.js'
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
  const [error, setError] = useState(null)
  const [hint, setHint] = useState(null)
  const [saving, setSaving] = useState(false)
  const bodyRef = useRef(null)

  const visibleNotes = notes ?? []
  const visibleLinks = links ?? []
  const createLink = onCreateLink
  const removeLink = onRemoveLink

  useEffect(() => {
    bodyRef.current?.focus()
  }, [])

  /**
   * The editor owns the write: it stays open until the note is stored, and
   * if the write fails it says so instead of letting the typed text
   * disappear. The parent closes the editor only when this resolves.
   */
  async function submit() {
    if (saving) return

    setSaving(true)
    setError(null)
    setHint(null)

    try {
      await onSave({ title, body, containerId: containerId || null })
    } catch (submitError) {
      setError(userMessage(submitError))
    } finally {
      setSaving(false)
      // The hint belongs to the write that was running: when that write is
      // over, the hint is over too.
      setHint(null)
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      if (saving) {
        // The write is already on its way. Closing the editor now would
        // store a change the reader tried to abandon, so the key is
        // ignored and the editor says why.
        setHint('Hay un guardado en curso: la nota se guarda igual cuando termine.')
        return
      }
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

      {error ? (
        <p className="note-editor-error" role="alert">
          {error}
        </p>
      ) : null}

      {hint ? (
        <p className="note-editor-hint" role="status">
          {hint}
        </p>
      ) : null}

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
          <button type="button" className="button button-quiet" onClick={onCancel} disabled={saving}>
            <IconClose width={13} height={13} />
            Cancelar
          </button>
          <button type="button" className="button button-primary" onClick={submit} disabled={saving}>
            <IconCheck width={13} height={13} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
