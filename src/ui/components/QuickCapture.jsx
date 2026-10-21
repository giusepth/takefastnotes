import { useEffect, useMemo, useRef, useState } from 'react'
import { parseCapture } from '../../domain/usecases/quickCapture.js'
import { detectCaptureTokens } from '../lib/captureTokens.js'
import { userMessage } from '../lib/errors.js'
import { CaptureReadout, GrammarStrip } from './Vocabulary.jsx'

/**
 * The capture bar: the primary entry point of the app.
 *
 * Enter saves, Shift+Enter adds a newline. The field keeps the focus after
 * saving so several notes can be fired in a row.
 *
 * The field also reports what it understood. The grammar strip underneath
 * lights up each token the draft uses, and the line below names the kind,
 * the tags and the container it will store — so the syntax is learned by
 * using it, not by reading a manual.
 *
 * Note: no inline styles anywhere in this codebase. The strict CSP does not
 * allow `unsafe-inline`, so layout lives in the stylesheet.
 */
export function QuickCapture({
  value,
  onChange,
  onSubmit,
  disabled = false,
  containers = [],
  currentContainerId = null,
  focusSignal = 0,
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (focusSignal === 0) return
    textareaRef.current?.focus()
  }, [focusSignal])

  useEffect(() => {
    if (!confirmation) return undefined
    const timer = setTimeout(() => setConfirmation(null), 2600)
    return () => clearTimeout(timer)
  }, [confirmation])

  const parsed = useMemo(() => {
    if (!value.trim()) return null
    return parseCapture(value, { containers, currentContainerId })
  }, [value, containers, currentContainerId])

  const tokens = useMemo(
    () => detectCaptureTokens(value, { containers }),
    [value, containers],
  )

  const containerName = useMemo(() => {
    if (!parsed?.containerId) return null
    return containers.find((item) => item.id === parsed.containerId)?.name ?? null
  }, [parsed, containers])

  async function submit() {
    const text = value.trim()
    if (!text || busy) return

    setBusy(true)
    setError(null)

    try {
      const note = await onSubmit(text)
      onChange('')
      setConfirmation(note)
    } catch (submitError) {
      setError(userMessage(submitError))
    } finally {
      setBusy(false)
      textareaRef.current?.focus()
    }
  }

  return (
    <form
      className="capture"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <div className="capture-label-row">
        <label className="label-caps" htmlFor="quick-capture-input">
          Captura rápida
        </label>
        <span className="capture-scope">Enter guarda · Shift + Enter hace una línea nueva</span>
      </div>

      <div className="capture-field-row">
        <textarea
          id="quick-capture-input"
          ref={textareaRef}
          className="quick-capture-input"
          rows={2}
          value={value}
          disabled={disabled || busy}
          placeholder="Escribe una idea y pulsa Enter…"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
        />
        <button className="button button-primary" type="submit" disabled={disabled || busy || !value.trim()}>
          Guardar
        </button>
      </div>

      <div className="capture-foot">
        <GrammarStrip tokens={tokens} />
        <CaptureReadout
          parsed={parsed}
          containerName={containerName}
          confirmation={confirmation}
          error={error}
        />
      </div>
    </form>
  )
}
