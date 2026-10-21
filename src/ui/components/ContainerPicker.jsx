import { useMemo } from 'react'

/**
 * Picks the container a note belongs to.
 *
 * CONTRACT (owned by the note editor, do not change the props):
 *   containers  object[]  every container, flat
 *   value       string    the selected container id, or '' for none
 *   onChange    (id: string) => void  '' means "no container"
 *
 * It is a native control: the editor keeps a keyboard-first flow and the
 * browser does the work. The hierarchy is shown by indenting the labels —
 * a select cannot style its options, so the depth is written into the text
 * of the option.
 */
export function ContainerPicker({ containers = [], value = '', onChange = () => {} }) {
  const options = useMemo(() => buildOptions(containers), [containers])

  return (
    <select
      className="note-editor-select"
      value={value}
      aria-label="Contenedor"
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Sin contenedor</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

/**
 * Flattens the forest into the order the reader expects: depth first, so
 * a child always follows its parent.
 */
function buildOptions(containers) {
  const byId = new Map()
  for (const container of containers) byId.set(container.id, container)

  const children = new Map()
  for (const container of containers) children.set(container.id, [])

  const roots = []
  for (const container of containers) {
    const parentId =
      container.parentId && container.parentId !== container.id && byId.has(container.parentId)
        ? container.parentId
        : null
    if (parentId) children.get(parentId).push(container)
    else roots.push(container)
  }

  const seen = new Set()
  const visit = (node) => {
    if (seen.has(node.id)) return
    seen.add(node.id)
    for (const child of children.get(node.id)) visit(child)
  }
  for (const root of roots) visit(root)
  for (const container of containers) {
    if (!seen.has(container.id)) {
      roots.push(container)
      visit(container)
    }
  }

  const byName = (a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  roots.sort(byName)
  for (const list of children.values()) list.sort(byName)

  const options = []
  const walk = (node, depth) => {
    options.push({
      id: node.id,
      label: `${'— '.repeat(depth)}${node.name}${node.kind ? ` (${node.kind})` : ''}`,
    })
    for (const child of children.get(node.id)) walk(child, depth + 1)
  }
  for (const root of roots) walk(root, 0)

  return options
}
