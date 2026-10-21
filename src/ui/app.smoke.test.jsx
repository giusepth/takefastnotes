// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from '../App.jsx'
import { openDatabase } from '../infra/indexeddb/db.js'
import { createRepositories } from '../infra/indexeddb/index.js'

beforeEach(() => {
  // jsdom has no object URL implementation; the backup download needs one.
  globalThis.URL.createObjectURL = () => 'blob:mock'
  globalThis.URL.revokeObjectURL = () => {}
  // jsdom ignores the `download` attribute and tries to navigate.
  globalThis.HTMLAnchorElement.prototype.click = () => {}
  // The hash route survives between tests in the same file, and jsdom keeps
  // one window for all of them.
  window.location.hash = ''
})

afterEach(() => {
  cleanup()
})

describe('vertical slice', () => {
  it('captures a note, persists it and survives a reload', async () => {
    const db = await openDatabase({ name: 'smoke-slice' })
    const repositories = createRepositories(db)

    render(<App repositories={repositories} />)

    const input = await screen.findByLabelText('Captura rápida')

    fireEvent.change(input, { target: { value: 'feature: agregar reintentos al webhook #backend' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await screen.findByText('agregar reintentos al webhook')

    const stored = await repositories.notes.all()
    expect(stored).toHaveLength(1)
    expect(stored[0].kind).toBe('feature')
    expect(stored[0].tags).toEqual(['backend'])
    expect(stored[0].status).toBe('inbox')

    cleanup()

    const reopenedDb = await openDatabase({ name: 'smoke-slice' })
    const reopenedRepositories = createRepositories(reopenedDb)

    render(<App repositories={reopenedRepositories} />)

    await screen.findByText('agregar reintentos al webhook')
    expect((await reopenedRepositories.notes.all())).toHaveLength(1)
  })

  it('shows an empty inbox before anything is captured', async () => {
    const db = await openDatabase({ name: 'smoke-empty' })
    const repositories = createRepositories(db)

    render(<App repositories={repositories} />)

    await screen.findByText('La bandeja está vacía')
  })
})

describe('about section', () => {
  it('explains the objective, the usage and the data policy', async () => {
    const db = await openDatabase({ name: 'smoke-about' })
    const repositories = createRepositories(db)

    render(<App repositories={repositories} />)

    fireEvent.click(await screen.findByRole('link', { name: 'Acerca de' }))

    await screen.findByText('Qué es y para qué sirve')
    expect(screen.getByText('Cómo se usa')).toBeTruthy()
    expect(screen.getByText('Dónde están tus datos')).toBeTruthy()
    expect(screen.getByText('Qué sale de tu dispositivo')).toBeTruthy()
    expect(screen.getByText('Cómo se pueden perder los datos')).toBeTruthy()
    expect(screen.getByText('Cómo protegerlos')).toBeTruthy()

    // The policy is a claim the app has to keep: it states that nothing leaves.
    expect(
      screen.getByText(/no hace ninguna petición de red/i),
    ).toBeTruthy()
  })

  it('downloads a backup and records when it ran', async () => {
    const db = await openDatabase({ name: 'smoke-export' })
    const repositories = createRepositories(db)

    render(<App repositories={repositories} />)

    const input = await screen.findByLabelText('Captura rápida')
    fireEvent.change(input, { target: { value: 'idea: una idea para probar la copia' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await screen.findByText('una idea para probar la copia')

    fireEvent.click(await screen.findByRole('link', { name: 'Acerca de' }))
    fireEvent.click(await screen.findByRole('button', { name: /Descargar copia de seguridad/ }))

    await screen.findByText(/Copia descargada: 1 notas/)

    const prefs = await repositories.prefs.all()
    expect(typeof prefs.lastExportAt).toBe('string')
  })
})

describe('editing and archiving', () => {
  it('edits a note in place and persists the change', async () => {
    const db = await openDatabase({ name: 'smoke-edit' })
    const repositories = createRepositories(db)

    render(<App repositories={repositories} />)

    const input = await screen.findByLabelText('Captura rápida')
    fireEvent.change(input, { target: { value: 'idea: una idea cualquiera' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await screen.findByText('una idea cualquiera')

    fireEvent.click(screen.getByRole('button', { name: 'Acciones de la nota' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Editar nota/ }))

    const body = await screen.findByLabelText('Texto de la nota')
    fireEvent.change(body, { target: { value: 'una idea cualquiera, mejorada' } })
    const editor = body.closest('.note-editor')
    fireEvent.click(within(editor).getByRole('button', { name: /Guardar/ }))

    // The row goes back to reading mode and the title is untouched: the
    // body is what changed, and the title is edited on its own field.
    await waitFor(() =>
      expect(screen.queryByLabelText('Texto de la nota')).toBeNull(),
    )
    await screen.findByText('una idea cualquiera, mejorada')

    const stored = await repositories.notes.all()
    expect(stored[0].body).toBe('una idea cualquiera, mejorada')
    // The title was derived from the body, so it follows it.
    expect(stored[0].title).toBe('una idea cualquiera, mejorada')
  })

  it('archives a note and restores it', async () => {
    const db = await openDatabase({ name: 'smoke-archive' })
    const repositories = createRepositories(db)

    render(<App repositories={repositories} />)

    const input = await screen.findByLabelText('Captura rápida')
    fireEvent.change(input, { target: { value: 'fix: algo que se va a archivar' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await screen.findByText('algo que se va a archivar')

    fireEvent.click(screen.getByRole('button', { name: 'Acciones de la nota' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Archivar/ }))

    await screen.findByText('La bandeja está vacía')

    fireEvent.click(screen.getByRole('button', { name: /Archivadas/ }))
    await screen.findByText('algo que se va a archivar')

    fireEvent.click(screen.getByRole('button', { name: 'Acciones de la nota' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Restaurar/ }))

    await waitFor(() => expect(repositories.notes.all()).resolves.toHaveLength(1))
    const stored = await repositories.notes.all()
    expect(stored[0].archived).toBe(false)
  })
})

describe('containers', () => {
  it('creates a container and files a note under it', async () => {
    const db = await openDatabase({ name: 'smoke-containers' })
    const repositories = createRepositories(db)

    render(<App repositories={repositories} />)

    fireEvent.click(await screen.findByRole('link', { name: 'Contenedores' }))
    await screen.findByText('Todavía no hay contenedores')

    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'takefastnotes' } })
    fireEvent.change(screen.getByLabelText('Tipo'), { target: { value: 'repositorio' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear contenedor' }))

    await screen.findByText('takefastnotes')
    expect((await repositories.containers.all())).toHaveLength(1)

    // The container is now usable from the capture grammar.
    fireEvent.click(screen.getByRole('link', { name: 'Notas' }))
    const input = await screen.findByLabelText('Captura rápida')
    fireEvent.change(input, { target: { value: 'feature: algo @takefastnotes' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await screen.findByText('@takefastnotes')

    const stored = await repositories.notes.all()
    expect(stored[0].containerId).toBe((await repositories.containers.all())[0].id)
  })
})

describe('search and container filter', () => {
  async function seedTwoNotes(repositories) {
    const input = await screen.findByLabelText('Captura rápida')
    fireEvent.change(input, { target: { value: 'feature: agregar reintentos al webhook' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await screen.findByText('agregar reintentos al webhook')

    fireEvent.change(input, { target: { value: 'decision: dejar el pipeline como está' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await screen.findByText('dejar el pipeline como está')
  }

  it('filters the list as the query is typed', async () => {
    const db = await openDatabase({ name: 'smoke-search' })
    const repositories = createRepositories(db)

    render(<App repositories={repositories} />)
    await seedTwoNotes(repositories)

    const search = screen.getByLabelText('Buscar notas')
    fireEvent.change(search, { target: { value: 'webhook' } })

    await screen.findByText('agregar reintentos al webhook')
    expect(screen.queryByText('dejar el pipeline como está')).toBeNull()
  })

  it('filters the list by the container selected in the sidebar', async () => {
    const db = await openDatabase({ name: 'smoke-filter' })
    const repositories = createRepositories(db)

    render(<App repositories={repositories} />)

    // A container to file one note under.
    fireEvent.click(await screen.findByRole('link', { name: 'Contenedores' }))
    fireEvent.change(await screen.findByLabelText('Nombre'), { target: { value: 'takefastnotes' } })
    fireEvent.click(screen.getByRole('button', { name: 'Crear contenedor' }))
    await screen.findByText('takefastnotes')

    fireEvent.click(screen.getByRole('link', { name: 'Notas' }))
    const input = await screen.findByLabelText('Captura rápida')
    fireEvent.change(input, { target: { value: 'feature: algo del repo @takefastnotes' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await screen.findByText('algo del repo')

    fireEvent.change(input, { target: { value: 'idea: una idea suelta' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    await screen.findByText('una idea suelta')

    // The tree in the sidebar selects the container.
    fireEvent.click(await screen.findByText('takefastnotes'))

    await screen.findByText('algo del repo')
    await waitFor(() => expect(screen.queryByText('una idea suelta')).toBeNull())
    expect(screen.getByText('Contenedor')).toBeTruthy()
  })

  it('reaches the search with the keyboard', async () => {
    const db = await openDatabase({ name: 'smoke-shortcut' })
    const repositories = createRepositories(db)

    render(<App repositories={repositories} />)
    await screen.findByLabelText('Captura rápida')

    const search = screen.getByLabelText('Buscar notas')
    search.focus()
    expect(document.activeElement).toBe(search)
  })
})
