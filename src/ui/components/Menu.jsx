import { useEffect, useRef, useState } from 'react'

/**
 * A small keyboard-first menu.
 *
 * Standard web affordances only: a button that opens a list of choices,
 * arrow keys to move, Escape to dismiss, click outside to dismiss. No
 * portal, no positioning maths — the panel is anchored to the control and
 * the ancestors never clip it.
 */
export function Menu({
  trigger,
  triggerClassName = '',
  triggerLabel,
  triggerTitle,
  align = 'end',
  headLabel,
  items,
  selectedId,
  onSelect,
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const itemRefs = useRef([])

  useEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    const index = items.findIndex((item) => item.id === selectedId)
    const start = index >= 0 ? index : 0
    setActiveIndex(start)
    itemRefs.current[start]?.focus()
  }, [open, items, selectedId])

  function close(returnFocus = false) {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }

  function handleKeyDown(event) {
    const count = items.length
    if (count === 0) return

    let next = activeIndex

    if (event.key === 'ArrowDown') next = (activeIndex + 1) % count
    else if (event.key === 'ArrowUp') next = (activeIndex - 1 + count) % count
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = count - 1
    else if (event.key === 'Escape') {
      event.preventDefault()
      close(true)
      return
    } else if (event.key === 'Tab') {
      close(false)
      return
    } else {
      return
    }

    event.preventDefault()
    setActiveIndex(next)
    itemRefs.current[next]?.focus()
  }

  return (
    <span className="menu-root" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className={triggerClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={triggerLabel}
        title={triggerTitle}
        onClick={() => setOpen((value) => !value)}
      >
        {trigger}
      </button>

      {open ? (
        <div
          className={`menu-panel${align === 'start' ? ' menu-panel--start' : ''}`}
          role="menu"
          aria-label={triggerLabel}
          onKeyDown={handleKeyDown}
        >
          {headLabel ? <p className="menu-head">{headLabel}</p> : null}
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              role="menuitemradio"
              aria-checked={item.id === selectedId}
              className="menu-item"
              ref={(node) => {
                itemRefs.current[index] = node
              }}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => {
                close(true)
                onSelect(item.id)
              }}
            >
              {item.leading}
              <span className="menu-item-text">
                <span className="menu-item-label">{item.label}</span>
                {item.hint ? <span className="menu-item-hint">{item.hint}</span> : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </span>
  )
}
