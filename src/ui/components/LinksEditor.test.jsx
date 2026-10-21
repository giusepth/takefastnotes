// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LinksEditor } from './LinksEditor.jsx'
import { NoteEditor } from './NoteEditor.jsx'

const CURRENT = {
  id: 'n1',
  title: 'Nota actual',
  body: 'nota actual',
  kind: 'note',
  status: 'inbox',
  tags: [],
  containerId: null,
  pinned: false,
  archived: false,
  createdAt: '2026-10-01T10:00:00.000Z',
  updatedAt: '2026-10-01T10:00:00.000Z',
}

const TARGET = {
  id: 'n2',
  title: 'Reintentos del webhook',
  body: 'agregar reintentos al webhook',
  kind: 'feature',
  status: 'inbox',
  tags: ['backend'],
  containerId: null,
  pinned: false,
  archived: false,
  createdAt: '2026-10-02T10:00:00.000Z',
  updatedAt: '2026-10-02T10:00:00.000Z',
}

const SOURCE = {
  id: 'n3',
  title: 'Decisión del pipeline',
  body: 'el pipeline de build se queda como está',
  kind: 'decision',
  status: 'inbox',
  tags: [],
  containerId: null,
  pinned: false,
  archived: false,
  createdAt: '2026-10-03T10:00:00.000Z',
  updatedAt: '2026-10-03T10:00:00.000Z',
}

const NEIGHBOUR = {
  id: 'n4',
  title: 'Notas de arquitectura',
  body: 'notas de arquitectura',
  kind: 'idea',
  status: 'inbox',
  tags: [],
  containerId: null,
  pinned: false,
  archived: false,
  createdAt: '2026-10-06T10:00:00.000Z',
  updatedAt: '2026-10-06T10:00:00.000Z',
}

const NOTES = [CURRENT, TARGET, SOURCE, NEIGHBOUR]

const OUTGOING_LINK = {
  id: 'l1',
  sourceType: 'note',
  sourceId: 'n1',
  targetType: 'note',
  targetId: 'n2',
  relation: 'depends-on',
  createdAt: '2026-10-04T10:00:00.000Z',
}

const INCOMING_LINK = {
  id: 'l2',
  sourceType: 'note',
  sourceId: 'n3',
  targetType: 'note',
  targetId: 'n1',
  relation: 'caused-by',
  createdAt: '2026-10-05T10:00:00.000Z',
}

afterEach(() => {
  cleanup()
})

function renderEditor(overrides = {}) {
  const props = {
    note: CURRENT,
    notes: NOTES,
    links: [],
    onCreateLink: vi.fn(),
    onRemoveLink: vi.fn(),
    ...overrides,
  }

  const utils = render(<LinksEditor {...props} />)
  return { ...utils, props }
}

describe('enlaces salientes', () => {
  it('muestra el título de la nota enlazada y la etiqueta de la relación', () => {
    renderEditor({ links: [OUTGOING_LINK] })

    const outgoing = within(screen.getByRole('list', { name: 'Enlaces salientes' }))
    expect(outgoing.getByText('Reintentos del webhook')).toBeTruthy()
    expect(outgoing.getByText('depende de')).toBeTruthy()
  })

  it('permite quitar un enlace', () => {
    const { props } = renderEditor({ links: [OUTGOING_LINK] })

    fireEvent.click(
      screen.getByRole('button', { name: /Quitar el enlace con Reintentos del webhook/ }),
    )

    expect(props.onRemoveLink).toHaveBeenCalledWith('l1')
  })

  it('no ofrece como destino una nota que ya está enlazada', () => {
    renderEditor({ links: [OUTGOING_LINK] })

    fireEvent.change(screen.getByRole('textbox', { name: /Buscar nota/ }), {
      target: { value: 'Reintentos' },
    })

    const candidates = screen.queryByRole('list', { name: 'Notas candidatas' })
    expect(candidates).toBeNull()
  })
})

describe('enlaces entrantes', () => {
  it('muestra de dónde viene la relación y no permite quitarla', () => {
    renderEditor({ links: [INCOMING_LINK] })

    const incoming = within(screen.getByRole('list', { name: 'Enlaces entrantes' }))
    expect(incoming.getByText('Decisión del pipeline')).toBeTruthy()
    expect(incoming.getByText('causada por')).toBeTruthy()
    expect(
      screen.queryByRole('button', { name: /Quitar el enlace con Decisión del pipeline/ }),
    ).toBeNull()
  })
})

describe('añadir un enlace', () => {
  it('elige destino y relación y avisa con la nota y la relación elegidas', () => {
    const { props } = renderEditor()

    fireEvent.change(screen.getByRole('textbox', { name: /Buscar nota/ }), {
      target: { value: 'webhook' },
    })

    fireEvent.click(screen.getByRole('button', { name: /Reintentos del webhook/ }))
    fireEvent.change(screen.getByRole('combobox', { name: /Tipo de relación/ }), {
      target: { value: 'blocks' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Añadir enlace' }))

    expect(props.onCreateLink).toHaveBeenCalledTimes(1)
    expect(props.onCreateLink).toHaveBeenCalledWith({
      sourceType: 'note',
      sourceId: 'n1',
      targetType: 'note',
      targetId: 'n2',
      relation: 'blocks',
    })
  })

  it('la nota que se está editando nunca aparece como destino', () => {
    renderEditor()

    fireEvent.change(screen.getByRole('textbox', { name: /Buscar nota/ }), {
      target: { value: 'nota' },
    })

    const candidates = within(screen.getByRole('list', { name: 'Notas candidatas' }))
    expect(candidates.getByText('Notas de arquitectura')).toBeTruthy()
    expect(candidates.queryByText('Nota actual')).toBeNull()
  })

  it('no hace nada mientras no haya un destino elegido', () => {
    const { props } = renderEditor()

    const add = screen.getByRole('button', { name: 'Añadir enlace' })
    expect(add.disabled).toBe(true)

    fireEvent.click(add)
    expect(props.onCreateLink).not.toHaveBeenCalled()
  })

  it('explica el error del dominio cuando el vínculo ya existe', async () => {
    const onCreateLink = vi.fn().mockRejectedValue(new Error('That link already exists'))
    renderEditor({ onCreateLink })

    fireEvent.change(screen.getByRole('textbox', { name: /Buscar nota/ }), {
      target: { value: 'webhook' },
    })
    fireEvent.click(screen.getByRole('button', { name: /Reintentos del webhook/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Añadir enlace' }))

    expect(await screen.findByText('Ese vínculo ya existe.')).toBeTruthy()
  })
})

describe('el editor de nota', () => {
  const CONTAINERS = [
    { id: 'c1', name: 'takefastnotes', kind: 'repositorio', parentId: null },
    { id: 'c2', name: 'backend', kind: 'carpeta', parentId: 'c1' },
  ]

  function renderNoteEditor(overrides = {}) {
    const props = {
      note: CURRENT,
      containers: CONTAINERS,
      onSave: vi.fn(),
      onCancel: vi.fn(),
      ...overrides,
    }

    const utils = render(
      <NoteEditor
        note={props.note}
        containers={props.containers}
        onSave={props.onSave}
        onCancel={props.onCancel}
        links={props.links}
        notes={props.notes}
        onCreateLink={props.onCreateLink}
        onRemoveLink={props.onRemoveLink}
      />,
    )
    return { ...utils, props }
  }

  it('sigue guardando con Ctrl+Enter y cancelling con Escape', () => {
    const { props } = renderNoteEditor()

    fireEvent.keyDown(screen.getByLabelText('Texto de la nota'), { key: 'Enter', ctrlKey: true })
    expect(props.onSave).toHaveBeenCalledWith({
      title: 'Nota actual',
      body: 'nota actual',
      containerId: null,
    })

    fireEvent.keyDown(screen.getByLabelText('Texto de la nota'), { key: 'Escape' })
    expect(props.onCancel).toHaveBeenCalled()
  })

  it('mantiene el selector de contenedores con su contrato', () => {
    renderNoteEditor()

    const picker = screen.getByLabelText('Contenedor')
    const options = within(picker).getAllByRole('option')

    expect(options[0].textContent).toBe('Sin contenedor')
    expect(options.map((option) => option.textContent)).toContain('takefastnotes (repositorio)')
    expect(options.map((option) => option.textContent)).toContain('— backend (carpeta)')
  })

  it('hospeda la sección de enlaces con los datos que le llegan', () => {
    renderNoteEditor({
      notes: NOTES,
      links: [OUTGOING_LINK],
      onCreateLink: vi.fn(),
      onRemoveLink: vi.fn(),
    })

    const outgoing = within(screen.getByRole('list', { name: 'Enlaces salientes' }))
    expect(outgoing.getByText('Reintentos del webhook')).toBeTruthy()
  })
})
