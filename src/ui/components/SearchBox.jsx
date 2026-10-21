import { useEffect, useRef } from 'react'
import { IconClose, IconList } from '../icons/index.jsx'

/**
 * The search field.
 *
 * It lives in the nav because search is a mode, not a page: the list
 * underneath changes while you type. `Ctrl/Cmd + K` reaches it from
 * anywhere, and `Escape` clears it and gives the focus back to the notes.
 */
export function SearchBox({ value, onChange, resultCount = null }) {
  const inputRef = useRef(null)

  useEffect(() => {
    function handleKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={`search-box${value ? ' is-active' : ''}`}>
      <IconList width={13} height={13} className="search-box-mark" />
      <label className="visually-hidden" htmlFor="search-input">
        Buscar notas
      </label>
      <input
        id="search-input"
        ref={inputRef}
        type="search"
        className="search-input"
        value={value}
        placeholder="Buscar…"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            onChange('')
            inputRef.current?.blur()
          }
        }}
      />
      {value ? (
        <button
          type="button"
          className="search-clear"
          aria-label="Limpiar la búsqueda"
          onClick={() => {
            onChange('')
            inputRef.current?.focus()
          }}
        >
          <IconClose width={12} height={12} />
        </button>
      ) : null}
      {value && resultCount !== null ? (
        <span className="search-count">{resultCount}</span>
      ) : null}
    </div>
  )
}
