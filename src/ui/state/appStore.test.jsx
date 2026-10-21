// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createContainer } from '../../domain/entities/container.js'
import { createNote } from '../../domain/entities/note.js'
import { openDatabase } from '../../infra/indexeddb/db.js'
import { createRepositories } from '../../infra/indexeddb/index.js'
import { NoteRow } from '../components/NoteRow.jsx'
import { InboxView } from '../views/InboxView.jsx'
import { AppStoreProvider, useAppStore } from './appStore.jsx'

/**
 * The store, driven the way the interface drives it.
 *
 * The harness is a plain form over the same actions the shell uses: the
 * tests exercise the store, not a mock of it.
 */
function StoreHarness({ containerId = null, parentId = null }) {
  const { state, actions } = useAppStore()

  return (
    <div>
      <output data-testid="status">{state.status}</output>
      <output data-testid="selected">{state.prefs.currentContainerId ?? ''}</output>
      <output data-testid="note-body">{state.notes[0]?.body ?? ''}</output>
      <output data-testid="note-container">{state.notes[0]?.containerId ?? ''}</output>
      <output data-testid="container-updated-at">{state.containers[0]?.updatedAt ?? ''}</output>

      <button type="button" onClick={() => actions.capture('feature: una nota nueva')}>
        capturar
      </button>

      {containerId ? (
        <button type="button" onClick={() => actions.deleteContainer(containerId)}>
          borrar contenedor
        </button>
      ) : null}

      {containerId ? (
        <button type="button" onClick={() => actions.updateContainer(containerId, { name: 'nombre nuevo' })}>
          renombrar contenedor
        </button>
      ) : null}

      {containerId && parentId ? (
        <button type="button" onClick={() => actions.nestContainer(containerId, parentId)}>
          anidar contenedor
        </button>
      ) : null}
    </div>
  )
}

/**
 * One row of the register, wired to the store: the editor inside it is the
 * same one the interface opens.
 */
function RowHarness({ noteId }) {
  const { state, actions } = useAppStore()
  const note = state.notes.find((item) => item.id === noteId) ?? null

  return (
    <div>
      <output data-testid="note-body">{note?.body ?? ''}</output>
      <output data-testid="note-container">{note?.containerId ?? ''}</output>

      <ul>
        {note ? (
          <NoteRow
            note={note}
            containers={state.containers}
            links={state.links}
            notes={state.notes}
            onUpdateNote={actions.updateNote}
            onCreateLink={actions.createLink}
            onRemoveLink={actions.removeLink}
          />
        ) : null}
      </ul>
    </div>
  )
}

async function openStore(name) {
  const db = await openDatabase({ name })
  return createRepositories(db)
}

/**
 * A selection that happens while a deletion is still running.
 *
 * The destructive writes are slow, and the reader does not wait for them:
 * the tree can be navigated while the container is being removed.
 */
function RaceHarness({ containerId, otherId }) {
  const { state, actions } = useAppStore()

  return (
    <div>
      <output data-testid="status">{state.status}</output>
      <output data-testid="selected">{state.prefs.currentContainerId ?? ''}</output>
      <output data-testid="containers">{state.containers.length}</output>

      <button type="button" onClick={() => actions.deleteContainer(containerId)}>
        borrar contenedor
      </button>
      <button type="button" onClick={() => actions.selectContainer(otherId)}>
        seleccionar otro
      </button>
    </div>
  )
}

/**
 * The register as the shell renders it: the view owns the rows, so a
 * failure that outlives a row has somewhere to be said.
 */
function InboxHarness() {
  const { state, actions } = useAppStore()

  return (
    <InboxView
      notes={state.notes}
      containers={state.containers}
      links={state.links}
      onUpdateNote={actions.updateNote}
      onCreateLink={actions.createLink}
      onRemoveLink={actions.removeLink}
      onExample={() => {}}
    />
  )
}

/**
 * A repository whose writes never finish on their own.
 *
 * @param {object} repositories
 * @returns {{repositories: object, release: () => void}}
 */
function withPendingWrites(repositories) {
  let release
  const gate = new Promise((resolve) => {
    release = resolve
  })

  return {
    release,
    repositories: {
      ...repositories,
      notes: {
        ...repositories.notes,
        update: async (id, note) => {
          await gate
          return repositories.notes.update(id, note)
        },
      },
    },
  }
}

afterEach(() => {
  cleanup()
})

describe('C1 — el contenedor seleccionado', () => {
  it('al borrarlo, la selección se limpia y la preferencia deja de apuntar a un contenedor que no existe', async () => {
    const repositories = await openStore('store-c1-delete')

    const container = createContainer({ name: 'takefastnotes', kind: 'repositorio' })
    await repositories.containers.create(container)
    await repositories.prefs.set('currentContainerId', container.id)

    render(
      <AppStoreProvider repositories={repositories}>
        <StoreHarness containerId={container.id} />
      </AppStoreProvider>,
    )

    await screen.findByText('ready')

    fireEvent.click(screen.getByRole('button', { name: 'borrar contenedor' }))

    await waitFor(() => expect(screen.getByTestId('selected').textContent).toBe(''))

    // The preference is gone from the database too: it does not come back
    // on the next reload.
    expect(await repositories.prefs.get('currentContainerId')).toBeNull()
  })

  it('las capturas siguientes no heredan el contenedor borrado', async () => {
    const repositories = await openStore('store-c1-capture')

    const container = createContainer({ name: 'takefastnotes', kind: 'repositorio' })
    await repositories.containers.create(container)
    await repositories.prefs.set('currentContainerId', container.id)

    render(
      <AppStoreProvider repositories={repositories}>
        <StoreHarness containerId={container.id} />
      </AppStoreProvider>,
    )

    await screen.findByText('ready')

    fireEvent.click(screen.getByRole('button', { name: 'borrar contenedor' }))
    await waitFor(() => expect(screen.getByTestId('selected').textContent).toBe(''))

    fireEvent.click(screen.getByRole('button', { name: 'capturar' }))

    await waitFor(async () => {
      const stored = await repositories.notes.all()
      expect(stored).toHaveLength(1)
    })

    const stored = await repositories.notes.all()
    expect(stored[0].containerId).toBeNull()
  })

  it('una captura nunca guarda un contenedor que no existe', async () => {
    const repositories = await openStore('store-c1-dangling')

    // A preference that points at a container which was never there.
    await repositories.prefs.set('currentContainerId', 'c-ghost')

    render(
      <AppStoreProvider repositories={repositories}>
        <StoreHarness />
      </AppStoreProvider>,
    )

    await screen.findByText('ready')

    fireEvent.click(screen.getByRole('button', { name: 'capturar' }))

    await waitFor(async () => {
      const stored = await repositories.notes.all()
      expect(stored).toHaveLength(1)
    })

    const stored = await repositories.notes.all()
    expect(stored[0].containerId).toBeNull()
  })
})

describe('C2 — editar una nota cuyo contenedor ya no existe', () => {
  it('guarda la edición y deja la nota sin contenedor', async () => {
    const repositories = await openStore('store-c2-edit')

    const note = createNote({ id: 'n1', body: 'texto original', containerId: 'c-ghost' })
    await repositories.notes.create(note)

    render(
      <AppStoreProvider repositories={repositories}>
        <RowHarness noteId="n1" />
      </AppStoreProvider>,
    )

    await screen.findByRole('link', { name: 'texto original' })

    fireEvent.click(screen.getByRole('button', { name: 'Acciones de la nota' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Editar nota/ }))

    const body = await screen.findByLabelText('Texto de la nota')
    fireEvent.change(body, { target: { value: 'texto corregido' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))

    // The editor closes because the write resolved.
    await waitFor(() => expect(screen.queryByLabelText('Texto de la nota')).toBeNull())

    const stored = await repositories.notes.all()
    expect(stored[0].body).toBe('texto corregido')
    expect(stored[0].containerId).toBeNull()
  })
})

describe('W2 — una escritura que falla', () => {
  it('revierte la nota, deja el editor abierto y dice qué pasó', async () => {
    const repositories = await openStore('store-w2-write')

    const note = createNote({ id: 'n1', body: 'texto original' })
    await repositories.notes.create(note)

    const failing = {
      ...repositories,
      notes: {
        ...repositories.notes,
        update: vi.fn(async () => {
          throw new Error('No se pudo escribir en la base de datos')
        }),
      },
    }

    render(
      <AppStoreProvider repositories={failing}>
        <RowHarness noteId="n1" />
      </AppStoreProvider>,
    )

    await screen.findByRole('link', { name: 'texto original' })

    fireEvent.click(screen.getByRole('button', { name: 'Acciones de la nota' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Editar nota/ }))

    const body = await screen.findByLabelText('Texto de la nota')
    fireEvent.change(body, { target: { value: 'texto que no se puede guardar' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))

    // The editor stays open, with the text that was typed.
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('No se pudo escribir en la base de datos')
    expect(screen.getByLabelText('Texto de la nota').value).toBe('texto que no se puede guardar')

    // And the note went back to what it was.
    await waitFor(() => expect(screen.getByTestId('note-body').textContent).toBe('texto original'))
  })
})

describe('W1 — el updatedAt del contenedor', () => {
  it('al renombrarlo, el nuevo timestamp queda en la base de datos', async () => {
    const repositories = await openStore('store-w1-rename')

    const container = createContainer({
      id: 'c1',
      name: 'takefastnotes',
      kind: 'repositorio',
      now: '2026-01-01T10:00:00.000Z',
    })
    await repositories.containers.create(container)

    render(
      <AppStoreProvider repositories={repositories}>
        <StoreHarness containerId={container.id} />
      </AppStoreProvider>,
    )

    await screen.findByText('ready')

    fireEvent.click(screen.getByRole('button', { name: 'renombrar contenedor' }))

    await waitFor(async () => {
      const stored = await repositories.containers.byId('c1')
      expect(stored.name).toBe('nombre nuevo')
    })

    const stored = await repositories.containers.byId('c1')

    // The stored row is not the old one anymore...
    expect(stored.updatedAt).not.toBe('2026-01-01T10:00:00.000Z')
    expect(stored.updatedAt > '2026-01-01T10:00:00.000Z').toBe(true)

    // ...and it is the same one the state holds.
    expect(stored.updatedAt).toBe(screen.getByTestId('container-updated-at').textContent)
  })

  it('al anidarlo, el nuevo timestamp queda en la base de datos', async () => {
    const repositories = await openStore('store-w1-nest')

    const parent = createContainer({ id: 'c-parent', name: 'takefastnotes', now: '2026-01-01T10:00:00.000Z' })
    const child = createContainer({ id: 'c-child', name: 'backend', now: '2026-01-02T10:00:00.000Z' })
    await repositories.containers.create(parent)
    await repositories.containers.create(child)

    render(
      <AppStoreProvider repositories={repositories}>
        <StoreHarness containerId={child.id} parentId={parent.id} />
      </AppStoreProvider>,
    )

    await screen.findByText('ready')

    fireEvent.click(screen.getByRole('button', { name: 'anidar contenedor' }))

    await waitFor(async () => {
      const stored = await repositories.containers.byId('c-child')
      expect(stored.parentId).toBe('c-parent')
    })

    const stored = await repositories.containers.byId('c-child')
    expect(stored.updatedAt).not.toBe('2026-01-02T10:00:00.000Z')
    expect(stored.updatedAt > '2026-01-02T10:00:00.000Z').toBe(true)
  })
})

describe('F1 — el borrado no puede destruir una selección más nueva', () => {
  it('mantiene la selección que se hizo mientras el borrado estaba en marcha', async () => {
    const repositories = await openStore('store-f1-race')

    const deleted = createContainer({ id: 'c-deleted', name: 'takefastnotes', kind: 'repositorio' })
    const kept = createContainer({ id: 'c-kept', name: 'backend', kind: 'servicio' })
    await repositories.containers.create(deleted)
    await repositories.containers.create(kept)
    await repositories.prefs.set('currentContainerId', deleted.id)

    // The destructive writes take a while, and the reader does not wait for
    // them: the removal is held here until the selection has happened.
    let release
    const gate = new Promise((resolve) => {
      release = resolve
    })
    const slow = {
      ...repositories,
      containers: {
        ...repositories.containers,
        remove: async (id) => {
          await gate
          return repositories.containers.remove(id)
        },
      },
    }

    render(
      <AppStoreProvider repositories={slow}>
        <RaceHarness containerId={deleted.id} otherId={kept.id} />
      </AppStoreProvider>,
    )

    await screen.findByText('ready')

    fireEvent.click(screen.getByRole('button', { name: 'borrar contenedor' }))
    fireEvent.click(screen.getByRole('button', { name: 'seleccionar otro' }))

    await waitFor(() => expect(screen.getByTestId('selected').textContent).toBe(kept.id))

    release()

    // The deletion finished: the container is gone.
    await waitFor(() => expect(screen.getByTestId('containers').textContent).toBe('1'))

    // The selection is the one the reader made, not the one the deletion
    // found when it started.
    expect(screen.getByTestId('selected').textContent).toBe(kept.id)
    expect(await repositories.prefs.get('currentContainerId')).toBe(kept.id)
  })
})

describe('F2 — un fallo que la fila no puede contar', () => {
  it('informa de un archivado que falla, aunque la fila se vaya de la lista', async () => {
    const repositories = await openStore('store-f2-archive')

    const note = createNote({ id: 'n1', body: 'texto original' })
    await repositories.notes.create(note)

    const failing = {
      ...repositories,
      notes: {
        ...repositories.notes,
        update: vi.fn(async () => {
          throw new Error('No se pudo escribir en la base de datos')
        }),
      },
    }

    render(
      <AppStoreProvider repositories={failing}>
        <InboxHarness />
      </AppStoreProvider>,
    )

    await screen.findByRole('link', { name: 'texto original' })

    fireEvent.click(screen.getByRole('button', { name: 'Acciones de la nota' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Archivar/ }))

    // The optimistic update takes the note out of the register, so the row
    // goes with it: the message has to survive somewhere else.
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('No se pudo escribir en la base de datos')

    // And the note came back, exactly as it was.
    await waitFor(() => expect(screen.getByRole('link', { name: 'texto original' })).toBeTruthy())
  })

  it('informa de un fallo que pasa con el editor abierto', async () => {
    const repositories = await openStore('store-f2-editing')

    const note = createNote({ id: 'n1', body: 'texto original' })
    await repositories.notes.create(note)

    const failing = {
      ...repositories,
      notes: {
        ...repositories.notes,
        update: vi.fn(async () => {
          throw new Error('No se pudo escribir en la base de datos')
        }),
      },
    }

    render(
      <AppStoreProvider repositories={failing}>
        <InboxHarness />
      </AppStoreProvider>,
    )

    await screen.findByRole('link', { name: 'texto original' })

    fireEvent.click(screen.getByRole('button', { name: 'Acciones de la nota' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Editar nota/ }))

    const body = await screen.findByLabelText('Texto de la nota')
    expect(body).toBeTruthy()

    // The kind control stays live while the editor is open, so a write can
    // fail in that state.
    fireEvent.click(screen.getByRole('button', { name: /Cambiar el tipo/ }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /^Idea/ }))

    const alerts = await screen.findAllByRole('alert')
    expect(alerts.some((alert) => alert.textContent === 'No se pudo escribir en la base de datos')).toBe(
      true,
    )

    // The editor is still open, with the text that was typed.
    expect(screen.getByLabelText('Texto de la nota')).toBeTruthy()
  })

  it('informa de un cambio de estado que falla, aunque la nota salga de la bandeja', async () => {
    const repositories = await openStore('store-f2-status')

    const note = createNote({ id: 'n1', body: 'nota de la bandeja', status: 'inbox' })
    await repositories.notes.create(note)

    const failing = {
      ...repositories,
      notes: {
        ...repositories.notes,
        update: vi.fn(async () => {
          throw new Error('No se pudo escribir en la base de datos')
        }),
      },
    }

    render(
      <AppStoreProvider repositories={failing}>
        <InboxHarness />
      </AppStoreProvider>,
    )

    await screen.findByRole('link', { name: 'nota de la bandeja' })

    // Cambiar el estado de una nota de la bandeja la saca de la lista: el
    // aviso tiene que sobrevivir a la fila, igual que en el archivado.
    fireEvent.click(screen.getByRole('button', { name: /Estado:/ }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /^Hecha/ }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('No se pudo escribir en la base de datos')

    await waitFor(() => expect(screen.getByRole('link', { name: 'nota de la bandeja' })).toBeTruthy())
  })
})

describe('F3 — Escape con una escritura en marcha', () => {
  it('no cancela el editor ni abandona la escritura', async () => {
    const repositories = await openStore('store-f3-escape')

    const note = createNote({ id: 'n1', body: 'texto original' })
    await repositories.notes.create(note)

    const pending = withPendingWrites(repositories)

    render(
      <AppStoreProvider repositories={pending.repositories}>
        <RowHarness noteId="n1" />
      </AppStoreProvider>,
    )

    await screen.findByRole('link', { name: 'texto original' })

    fireEvent.click(screen.getByRole('button', { name: 'Acciones de la nota' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Editar nota/ }))

    const body = await screen.findByLabelText('Texto de la nota')
    fireEvent.change(body, { target: { value: 'texto corregido' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))

    // Escape while the write is on its way.
    fireEvent.keyDown(body, { key: 'Escape' })

    // The editor did not close, and it says why.
    expect(screen.getByLabelText('Texto de la nota')).toBeTruthy()
    expect(screen.getByText(/guardado en curso/)).toBeTruthy()

    pending.release()

    // The write that was not abandoned ends up stored, and only then the
    // editor closes.
    await waitFor(() => expect(screen.queryByLabelText('Texto de la nota')).toBeNull())

    const stored = await repositories.notes.all()
    expect(stored[0].body).toBe('texto corregido')
  })
})

describe('F4 — un contenedor que el store todavía no conoce', () => {
  it('no desclasifica la nota al editarla', async () => {
    const repositories = await openStore('store-f4-container')

    const note = createNote({ id: 'n1', body: 'texto original', containerId: 'c-remote' })
    await repositories.notes.create(note)

    render(
      <AppStoreProvider repositories={repositories}>
        <RowHarness noteId="n1" />
      </AppStoreProvider>,
    )

    await screen.findByRole('link', { name: 'texto original' })

    // Another tab of the same origin created this container after this tab
    // booted: it is alive in the database, but the list the store holds does
    // not know it.
    await repositories.containers.create(
      createContainer({ id: 'c-remote', name: 'backend', kind: 'servicio' }),
    )

    fireEvent.click(screen.getByRole('button', { name: 'Acciones de la nota' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Editar nota/ }))

    const body = await screen.findByLabelText('Texto de la nota')
    fireEvent.change(body, { target: { value: 'texto corregido' } })
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }))

    await waitFor(() => expect(screen.queryByLabelText('Texto de la nota')).toBeNull())

    const stored = await repositories.notes.all()
    expect(stored[0].body).toBe('texto corregido')
    expect(stored[0].containerId).toBe('c-remote')
  })
})
