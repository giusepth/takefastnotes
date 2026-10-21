// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContainerPicker } from './ContainerPicker.jsx'
import { ContainerTree } from './ContainerTree.jsx'

const CONTAINERS = [
  {
    id: 'c-root',
    name: 'takefastnotes',
    kind: 'repositorio',
    url: 'https://github.com/giusepth/takefastnotes',
    parentId: null,
    createdAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'c-child',
    name: 'backend',
    kind: 'carpeta',
    url: null,
    parentId: 'c-root',
    createdAt: '2026-01-02T10:00:00.000Z',
  },
  {
    id: 'c-grandchild',
    name: 'consultas',
    kind: '',
    url: null,
    parentId: 'c-child',
    createdAt: '2026-01-03T10:00:00.000Z',
  },
  {
    id: 'c-other',
    name: 'documentos',
    kind: 'documento',
    url: null,
    parentId: null,
    createdAt: '2026-01-04T10:00:00.000Z',
  },
]

const NOTES = [
  { id: 'n1', containerId: 'c-root' },
  { id: 'n2', containerId: 'c-child' },
  { id: 'n3', containerId: 'c-grandchild' },
  { id: 'n4', containerId: null },
  { id: 'n5', containerId: 'c-other' },
]

function renderTree(props = {}) {
  const handlers = {
    onSelect: vi.fn(),
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onNest: vi.fn(),
  }

  const view = render(
    <ContainerTree
      containers={CONTAINERS}
      notes={NOTES}
      activeContainerId={null}
      {...handlers}
      {...props}
    />,
  )

  return { ...view, ...handlers }
}

function rowOf(name) {
  return screen.getByRole('button', { name: new RegExp(`^${name}`) })
}

function openActions(name) {
  fireEvent.click(screen.getByRole('button', { name: `Acciones de ${name}` }))
}

afterEach(() => {
  cleanup()
})

describe('el árbol de contenedores', () => {
  it('dibuja la jerarquía: el padre y sus hijos, con los hijos marcados', () => {
    const { container } = renderTree()

    expect(rowOf('takefastnotes')).toBeTruthy()
    expect(rowOf('backend')).toBeTruthy()
    expect(rowOf('consultas')).toBeTruthy()
    expect(rowOf('documentos')).toBeTruthy()

    // The two nested containers are marked as children of another container.
    const children = container.querySelectorAll('.tree-node--child')
    expect(children).toHaveLength(2)

    // And they live inside the branch of their parent, not next to it.
    const childRow = rowOf('backend')
    expect(childRow.closest('.tree-node--child')).toBeTruthy()
    expect(childRow.closest('.tree-children')).toBeTruthy()
  })

  it('muestra cuántas notas hay en cada contenedor', () => {
    renderTree()

    // The number is the rollup: the notes of the container and the ones of
    // its descendants.
    expect(within(rowOf('takefastnotes')).getByText('3')).toBeTruthy()
    expect(within(rowOf('backend')).getByText('2')).toBeTruthy()
    expect(within(rowOf('consultas')).getByText('1')).toBeTruthy()
    expect(within(rowOf('documentos')).getByText('1')).toBeTruthy()
  })

  it('selecciona un contenedor y quita la selección al volver a pulsarlo', () => {
    const { onSelect, rerender } = renderTree()

    fireEvent.click(rowOf('takefastnotes'))
    expect(onSelect).toHaveBeenCalledWith('c-root')

    onSelect.mockClear()

    rerender(
      <ContainerTree
        containers={CONTAINERS}
        notes={NOTES}
        activeContainerId="c-root"
        onSelect={onSelect}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onNest={vi.fn()}
      />,
    )

    fireEvent.click(rowOf('takefastnotes'))
    expect(onSelect).toHaveBeenCalledWith(null)
  })

  it('no ofrece como destino el propio contenedor ni sus descendientes', () => {
    const { container } = renderTree()

    openActions('takefastnotes')
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Mover dentro de/ }))

    const panel = container.querySelector('.tree-move')
    expect(panel).toBeTruthy()

    // Neither itself nor its descendants can hold it.
    expect(within(panel).queryByRole('button', { name: 'takefastnotes' })).toBeNull()
    expect(within(panel).queryByRole('button', { name: 'backend' })).toBeNull()
    expect(within(panel).queryByRole('button', { name: 'consultas' })).toBeNull()

    // A container outside the branch can.
    expect(within(panel).getByRole('button', { name: /documentos/ })).toBeTruthy()
  })

  it('renombra un contenedor', () => {
    const { onUpdate } = renderTree()

    openActions('takefastnotes')
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Renombrar/ }))

    const input = screen.getByLabelText('Nuevo nombre de takefastnotes')
    fireEvent.change(input, { target: { value: 'notas' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(onUpdate).toHaveBeenCalledWith('c-root', { name: 'notas' })
  })

  it('elimina un contenedor', () => {
    const { onDelete } = renderTree()

    openActions('takefastnotes')
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Eliminar/ }))

    expect(onDelete).toHaveBeenCalledWith('c-root')
  })

  it('mueve un contenedor dentro de otro', () => {
    const { container, onNest } = renderTree()

    openActions('documentos')
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Mover dentro de/ }))

    const panel = container.querySelector('.tree-move')
    fireEvent.click(within(panel).getByRole('button', { name: /takefastnotes/ }))

    expect(onNest).toHaveBeenCalledWith('c-other', 'c-root')
  })

  it('pliega y despliega una rama', () => {
    const { container } = renderTree()

    expect(rowOf('backend')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Plegar takefastnotes' }))
    expect(screen.queryByRole('button', { name: /^backend/ })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Desplegar takefastnotes' }))
    expect(rowOf('backend')).toBeTruthy()
    expect(container.querySelectorAll('.tree-node')).toHaveLength(4)
  })
})

describe('el selector de contenedores', () => {
  it('muestra la jerarquía y mantiene "Sin contenedor"', () => {
    const onChange = vi.fn()
    render(<ContainerPicker containers={CONTAINERS} value="" onChange={onChange} />)

    const select = screen.getByLabelText('Contenedor')
    const options = within(select).getAllByRole('option')

    expect(options[0].textContent).toBe('Sin contenedor')
    expect(options.map((option) => option.textContent)).toEqual([
      'Sin contenedor',
      'documentos (documento)',
      'takefastnotes (repositorio)',
      '— backend (carpeta)',
      '— — consultas',
    ])
  })

  it('devuelve el identificador del contenedor elegido', () => {
    const onChange = vi.fn()
    render(<ContainerPicker containers={CONTAINERS} value="" onChange={onChange} />)

    fireEvent.change(screen.getByLabelText('Contenedor'), { target: { value: 'c-child' } })
    expect(onChange).toHaveBeenCalledWith('c-child')
  })
})
