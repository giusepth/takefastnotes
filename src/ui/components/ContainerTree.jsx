import { useEffect, useMemo, useRef, useState } from 'react'
import { Menu } from './Menu.jsx'
import { IconChevronDown, IconEdit, IconFolder, IconMore, IconTrash } from '../icons/index.jsx'

/**
 * The container tree.
 *
 * CONTRACT (owned by the shell, do not change the props):
 *   containers          object[]  every container, flat
 *   notes               object[]  used for the note counts
 *   activeContainerId   string|null  the container whose notes are shown
 *   onSelect(id|null)   void  select a container, or null for "all"
 *   onUpdate(id, patch) void  rename, change kind or address
 *   onDelete(id)        void  remove the container
 *   onNest(id, parentId) void  move it under another one, or null to unnest
 *
 * The tree is the hierarchy the whole product is built around, so it is
 * drawn like a register: one line per container, hairline rules, the depth
 * expressed by indentation and by a guide line — never by a colour.
 *
 * The number next to a container is the rollup: the notes filed in it plus
 * the notes filed in its descendants. A container that only holds subtrees
 * is therefore not empty, and the reader sees the weight of a branch at a
 * glance.
 */
export function ContainerTree({
  containers = [],
  notes = [],
  activeContainerId = null,
  onSelect = () => {},
  onUpdate = () => {},
  onDelete = () => {},
  onNest = () => {},
  variant = 'full',
}) {
  const [collapsedIds, setCollapsedIds] = useState(() => new Set())
  const [renamingId, setRenamingId] = useState(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [movingId, setMovingId] = useState(null)
  const movePanelRef = useRef(null)

  const index = useMemo(() => buildIndex(containers), [containers])
  const counts = useMemo(() => computeCounts(index, notes), [index, notes])
  const depths = useMemo(() => computeDepths(index), [index])

  const candidates = useMemo(() => {
    if (!movingId) return []
    const excluded = new Set([movingId, ...collectDescendants(index, movingId)])
    return index.order
      .filter((id) => !excluded.has(id))
      .map((id) => ({
        id,
        name: index.byId.get(id).name,
        kind: index.byId.get(id).kind,
        depth: depths.get(id) ?? 0,
      }))
  }, [movingId, index, depths])

  // The move panel is a list of buttons: the first one takes the focus when
  // the panel opens, so the whole action is reachable with the keyboard.
  useEffect(() => {
    if (!movingId) return
    const first = movePanelRef.current?.querySelector('button')
    first?.focus()
  }, [movingId])

  function toggleCollapsed(containerId) {
    setCollapsedIds((current) => {
      const next = new Set(current)
      if (next.has(containerId)) next.delete(containerId)
      else next.add(containerId)
      return next
    })
  }

  function startRename(container) {
    setMovingId(null)
    setRenamingId(container.id)
    setRenameDraft(container.name)
  }

  function commitRename(container) {
    const next = renameDraft.trim()
    setRenamingId(null)
    if (next && next !== container.name) onUpdate(container.id, { name: next })
  }

  function cancelRename() {
    setRenamingId(null)
  }

  function handleAction(container, action) {
    if (action === 'rename') {
      startRename(container)
      return
    }
    if (action === 'move') {
      setRenamingId(null)
      setMovingId(container.id)
      return
    }
    if (action === 'delete') {
      setRenamingId(null)
      setMovingId(null)
      onDelete(container.id)
    }
  }

  function renderNode(container, depth) {
    const children = index.children.get(container.id) ?? []
    const hasChildren = children.length > 0
    const collapsed = collapsedIds.has(container.id)
    const isActive = container.id === activeContainerId
    const count = counts.total.get(container.id) ?? 0
    const isRenaming = renamingId === container.id
    const isMoving = movingId === container.id

    const actionItems = [
      {
        id: 'rename',
        label: 'Renombrar',
        hint: 'Cambiar el nombre del contenedor',
        leading: <IconEdit width={13} height={13} />,
      },
      {
        id: 'move',
        label: 'Mover dentro de…',
        hint: 'Anidarlo en otro contenedor',
        leading: <IconNest width={13} height={13} />,
      },
      {
        id: 'delete',
        label: 'Eliminar',
        hint: 'Sus notas quedan sin contenedor',
        leading: <IconTrash width={13} height={13} />,
      },
    ]

    return (
      <li key={container.id} className={`tree-node${depth > 0 ? ' tree-node--child' : ''}`}>
        <div
          className={`tree-row${isActive ? ' is-active' : ''}${count === 0 ? ' is-empty' : ''}`}
        >
          {hasChildren ? (
            <button
              type="button"
              className="tree-toggle"
              aria-expanded={!collapsed}
              aria-label={`${collapsed ? 'Desplegar' : 'Plegar'} ${container.name}`}
              title={collapsed ? 'Desplegar' : 'Plegar'}
              onClick={() => toggleCollapsed(container.id)}
            >
              <IconChevronDown className="tree-chevron" width={13} height={13} />
            </button>
          ) : (
            <span className="tree-toggle tree-toggle--empty" aria-hidden="true" />
          )}

          {isRenaming ? (
            <input
              className="tree-rename"
              value={renameDraft}
              autoFocus
              aria-label={`Nuevo nombre de ${container.name}`}
              onChange={(event) => setRenameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  commitRename(container)
                }
                if (event.key === 'Escape') {
                  event.preventDefault()
                  cancelRename()
                }
              }}
              onBlur={() => commitRename(container)}
            />
          ) : (
            <button
              type="button"
              className="tree-row-label"
              aria-current={isActive ? 'true' : undefined}
              title={
                isActive
                  ? 'Contenedor seleccionado. Pulsa de nuevo para quitar la selección.'
                  : `Ver las notas de ${container.name}`
              }
              onClick={() => onSelect(isActive ? null : container.id)}
            >
              <IconFolder className="tree-row-mark" width={13} height={13} />
              <span className="tree-row-name" title={container.name}>
                {container.name}
              </span>
              {container.kind && variant === 'full' ? (
                <span className="tree-row-kind">{container.kind}</span>
              ) : null}
              <span
                className="tree-row-count"
                title={`${count} ${count === 1 ? 'nota' : 'notas'}, incluidas las de sus subcontenedores`}
              >
                {count}
              </span>
            </button>
          )}

          <Menu
            triggerClassName="row-actions"
            triggerLabel={`Acciones de ${container.name}`}
            triggerTitle="Renombrar, mover o eliminar"
            headLabel="Acciones del contenedor"
            items={actionItems}
            selectedId={null}
            onSelect={(action) => handleAction(container, action)}
            trigger={<IconMore width={14} height={14} />}
          />
        </div>

        {isMoving ? (
          <ul
            className="tree-move"
            ref={movePanelRef}
            aria-label={`Mover ${container.name} dentro de…`}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                setMovingId(null)
              }
            }}
          >
            <li className="tree-move-item">
              <button
                type="button"
                className="tree-move-button"
                disabled={!container.parentId}
                onClick={() => {
                  setMovingId(null)
                  onNest(container.id, null)
                }}
              >
                <span className="tree-move-label">Nivel superior</span>
                <span className="tree-move-hint">Sacar de su contenedor actual</span>
              </button>
            </li>

            {candidates.map((candidate) => (
              <li
                key={candidate.id}
                className={`tree-move-item tree-move-item--depth-${Math.min(candidate.depth, 5)}`}
              >
                <button
                  type="button"
                  className="tree-move-button"
                  onClick={() => {
                    setMovingId(null)
                    onNest(container.id, candidate.id)
                  }}
                >
                  <span className="tree-move-label">{candidate.name}</span>
                  {candidate.kind ? (
                    <span className="tree-move-hint">{candidate.kind}</span>
                  ) : null}
                </button>
              </li>
            ))}

            <li className="tree-move-item">
              <button
                type="button"
                className="tree-move-button"
                onClick={() => setMovingId(null)}
              >
                <span className="tree-move-label">Cancelar</span>
              </button>
            </li>
          </ul>
        ) : null}

        {hasChildren && !collapsed ? (
          <ul className="tree-children">{children.map((child) => renderNode(child, depth + 1))}</ul>
        ) : null}
      </li>
    )
  }

  if (containers.length === 0) {
    return <p className="tree-empty">Todavía no hay contenedores.</p>
  }

  return (
    <ul className="tree-list">{index.roots.map((root) => renderNode(root, 0))}</ul>
  )
}

/**
 * A "move into" mark, drawn on the same grid and with the same stroke as
 * the authored icon set (16 × 16, one 1.5 stroke).
 */
function IconNest(props) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M8 2.6v4.4" />
      <path d="m6 5 2 2 2-2" />
      <path d="M3.4 9.6v2.6a1 1 0 0 0 1 1h7.2a1 1 0 0 0 1-1V9.6" />
    </svg>
  )
}

/* ---------- the shape of the tree ---------- */

function compareNames(a, b) {
  const byName = a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  if (byName !== 0) return byName
  return String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''))
}

/**
 * The note rollup of every container: the notes filed in it plus the notes
 * filed in its descendants. The tree and the flat list share it, so the two
 * views never disagree about how many notes a container holds.
 *
 * @param {object[]} containers
 * @param {object[]} notes
 * @returns {{direct: Map<string, number>, total: Map<string, number>}}
 */
export function containerNoteCounts(containers = [], notes = []) {
  const index = buildIndex(containers)
  return computeCounts(index, notes)
}

/**
 * Turns the flat list into a forest.
 *
 * A container whose parent does not exist (or points at itself) becomes a
 * root, and a corrupted cycle is broken instead of hanging the render: every
 * container is reachable from the root list exactly once.
 */
function buildIndex(containers) {
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

  roots.sort(compareNames)
  for (const list of children.values()) list.sort(compareNames)

  // The order the reader sees: depth first, so the tree and any list of
  // containers share the same reading order.
  const order = []
  const walk = (node) => {
    order.push(node.id)
    for (const child of children.get(node.id)) walk(child)
  }
  for (const root of roots) walk(root)

  return { byId, children, roots, order }
}

function collectDescendants(index, containerId) {
  const result = []
  const seen = new Set([containerId])
  const queue = [containerId]

  while (queue.length > 0) {
    const current = queue.shift()
    for (const child of index.children.get(current) ?? []) {
      if (seen.has(child.id)) continue
      seen.add(child.id)
      result.push(child.id)
      queue.push(child.id)
    }
  }

  return result
}

/**
 * The rollup: a container counts the notes filed in it and the notes filed
 * in its descendants.
 */
function computeCounts(index, notes) {
  const direct = new Map()
  for (const note of notes) {
    if (!note.containerId) continue
    direct.set(note.containerId, (direct.get(note.containerId) ?? 0) + 1)
  }

  const total = new Map()
  const visiting = new Set()

  const compute = (containerId) => {
    if (total.has(containerId)) return total.get(containerId)
    if (visiting.has(containerId)) return 0
    visiting.add(containerId)

    let sum = direct.get(containerId) ?? 0
    for (const child of index.children.get(containerId) ?? []) sum += compute(child.id)

    visiting.delete(containerId)
    total.set(containerId, sum)
    return sum
  }

  for (const containerId of index.byId.keys()) compute(containerId)

  return { direct, total }
}

function computeDepths(index) {
  const depths = new Map()

  const visit = (node, depth) => {
    if (depths.has(node.id)) return
    depths.set(node.id, depth)
    for (const child of index.children.get(node.id) ?? []) visit(child, depth + 1)
  }

  for (const root of index.roots) visit(root, 0)
  return depths
}
