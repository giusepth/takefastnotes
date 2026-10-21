import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { quickCapture } from '../../domain/usecases/quickCapture.js'
import {
  addTag,
  editNote,
  moveNote,
  removeTag,
  setArchived,
  setKind,
  setStatus,
} from '../../domain/usecases/updateNote.js'
import {
  createContainer as buildContainer,
  removeContainer as removeContainerUseCase,
  setContainerParent,
} from '../../domain/usecases/containers.js'
import { linkEntities, unlinkEntity } from '../../domain/usecases/links.js'
import { exportData, importData as mergeImport, validateImport } from '../../domain/usecases/backup.js'
import { downloadJson, readJsonFile } from '../../infra/backup/fileBackup.js'

const AppStoreContext = createContext(null)

const initialState = {
  status: 'loading',
  error: null,
  notes: [],
  containers: [],
  links: [],
  prefs: {},
}

function reducer(state, action) {
  switch (action.type) {
    case 'hydrated':
      return {
        ...state,
        status: 'ready',
        notes: action.notes,
        containers: action.containers,
        links: action.links,
        prefs: action.prefs,
      }
    case 'failed':
      return { ...state, status: 'error', error: action.error }
    case 'noteAdded':
      return { ...state, notes: [action.note, ...state.notes] }
    case 'noteUpdated':
      return {
        ...state,
        notes: state.notes.map((note) => (note.id === action.note.id ? action.note : note)),
      }
    case 'prefsChanged':
      return { ...state, prefs: action.prefs }
    case 'containerAdded':
      return { ...state, containers: [...state.containers, action.container] }
    case 'containersReplaced':
      return { ...state, containers: action.containers }
    case 'notesReplaced':
      return { ...state, notes: action.notes }
    case 'containerReplaced':
      return {
        ...state,
        containers: state.containers.map((container) =>
          container.id === action.container.id ? action.container : container,
        ),
      }
    case 'linkAdded':
      return { ...state, links: [...state.links, action.link] }
    case 'linksReplaced':
      return { ...state, links: action.links }
    default:
      return state
  }
}

/**
 * Single source of truth for the UI.
 *
 * Reads are synchronous from the store; writes go through a use case, then
 * the repository, then back into the store. The UI never touches IndexedDB.
 */
export function AppStoreProvider({ repositories, children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      try {
        const [notes, containers, links, prefs] = await Promise.all([
          repositories.notes.all(),
          repositories.containers.all(),
          repositories.links.all(),
          repositories.prefs.all(),
        ])
        if (!cancelled) dispatch({ type: 'hydrated', notes, containers, links, prefs })
      } catch (error) {
        if (!cancelled) dispatch({ type: 'failed', error })
      }
    }

    hydrate()
    return () => {
      cancelled = true
    }
  }, [repositories])

  const capture = useCallback(
    async (text) => {
      const note = quickCapture(text, {
        containers: state.containers,
        currentContainerId: state.prefs.currentContainerId ?? null,
      })

      await repositories.notes.create(note)
      dispatch({ type: 'noteAdded', note })
      return note
    },
    [repositories, state.containers, state.prefs],
  )

  /**
   * Re-classifies a note after it was captured.
   *
   * The domain owns the rules: every change is one of the existing update
   * use cases, applied in order, and persisted through the repository.
   * The patch never carries new fields — only status, kind and tags.
   */
  const updateNote = useCallback(
    async (noteId, patch = {}) => {
      const current = state.notes.find((note) => note.id === noteId)
      if (!current) throw new Error(`Note not found: ${noteId}`)

      let next = current
      if (patch.status !== undefined) next = setStatus(next, patch.status)
      if (patch.kind !== undefined) next = setKind(next, patch.kind)
      if (patch.archived !== undefined) next = setArchived(next, patch.archived)
      if (patch.title !== undefined || patch.body !== undefined) {
        next = editNote(next, { title: patch.title, body: patch.body })
      }
      if (patch.containerId !== undefined) {
        next = moveNote(next, patch.containerId, { containers: state.containers })
      }
      for (const tag of patch.addTags ?? []) next = addTag(next, tag)
      for (const tag of patch.removeTags ?? []) next = removeTag(next, tag)

      // The interface answers first and the write follows: a status change
      // must feel like a keystroke, not like a round trip to the disk. If
      // the write fails, the row goes back to what it was.
      dispatch({ type: 'noteUpdated', note: next })

      try {
        await repositories.notes.update(noteId, next)
      } catch (error) {
        dispatch({ type: 'noteUpdated', note: current })
        throw error
      }

      return next
    },
    [repositories, state.notes, state.containers],
  )

  /**
   * Creates a container: the context a note can be filed under.
   */
  const createContainer = useCallback(
    async (input) => {
      const container = buildContainer(input)
      await repositories.containers.create(container)
      dispatch({ type: 'containerAdded', container })
      return container
    },
    [repositories],
  )

  /**
   * Removes a container. Nothing is lost: its children move up and its notes
   * become unclassified.
   */
  const deleteContainer = useCallback(
    async (containerId) => {
      const result = removeContainerUseCase(state.containers, state.notes, containerId)

      await repositories.containers.remove(containerId)
      for (const container of result.containers) {
        await repositories.containers.create(container)
      }
      const moved = result.notes.filter(
        (note, index) => note.containerId !== state.notes[index].containerId,
      )
      if (moved.length > 0) await repositories.notes.bulkPut(moved)

      dispatch({ type: 'containersReplaced', containers: result.containers })
      dispatch({ type: 'notesReplaced', notes: result.notes })
      return result
    },
    [repositories, state.containers, state.notes],
  )

  /**
   * Selects the container whose notes are being shown.
   *
   * The selection is global: the sidebar and the containers page read the
   * same preference, so they can never disagree about what is selected.
   */
  const selectContainer = useCallback(
    async (containerId) => {
      const next = containerId ?? null
      dispatch({ type: 'prefsChanged', prefs: { ...state.prefs, currentContainerId: next } })
      await repositories.prefs.set('currentContainerId', next)
    },
    [repositories, state.prefs],
  )

  /**
   * Renames a container or changes its kind or address.
   */
  const updateContainer = useCallback(
    async (containerId, patch) => {
      const current = state.containers.find((container) => container.id === containerId)
      if (!current) throw new Error(`Container not found: ${containerId}`)

      const next = { ...current, ...patch, id: current.id, updatedAt: new Date().toISOString() }
      await repositories.containers.update(containerId, patch)
      dispatch({ type: 'containerReplaced', container: next })
      return next
    },
    [repositories, state.containers],
  )

  /**
   * Moves a container under another one, or back to the root.
   */
  const nestContainer = useCallback(
    async (containerId, parentId) => {
      const current = state.containers.find((container) => container.id === containerId)
      if (!current) throw new Error(`Container not found: ${containerId}`)

      const next = setContainerParent(current, parentId, { containers: state.containers })
      await repositories.containers.update(containerId, { parentId: next.parentId })
      dispatch({ type: 'containerReplaced', container: next })
      return next
    },
    [repositories, state.containers],
  )

  /**
   * Creates a typed relation between two notes.
   */
  const createLink = useCallback(
    async (input) => {
      const link = linkEntities(state.links, input)
      await repositories.links.create(link)
      dispatch({ type: 'linkAdded', link })
      return link
    },
    [repositories, state.links],
  )

  /**
   * Removes a relation.
   */
  const removeLink = useCallback(
    async (linkId) => {
      const links = unlinkEntity(state.links, linkId)
      await repositories.links.remove(linkId)
      dispatch({ type: 'linksReplaced', links })
      return links
    },
    [repositories, state.links],
  )

  /**
   * Writes the whole database to a JSON file.
   *
   * There is no cloud copy: this file is the only backup that exists, so
   * the action records when it ran and the About screen shows it.
   */
  const exportBackup = useCallback(async () => {
    const payload = exportData({
      notes: state.notes,
      containers: state.containers,
      links: state.links,
      prefs: state.prefs,
    })

    downloadJson(`takefastnotes-${payload.exportedAt.slice(0, 10)}.json`, payload)

    const prefs = { ...state.prefs, lastExportAt: payload.exportedAt }
    await repositories.prefs.set('lastExportAt', payload.exportedAt)
    dispatch({ type: 'prefsChanged', prefs })

    return payload
  }, [repositories, state.notes, state.containers, state.links, state.prefs])

  /**
   * Restores a backup file.
   *
   * Merge, never replace: a note that exists in both keeps the most recent
   * version, and nothing is deleted. The file is validated field by field
   * before it reaches the database.
   */
  const importBackup = useCallback(
    async (file) => {
      const raw = await readJsonFile(file)
      const incoming = validateImport(raw)

      const merged = mergeImport(
        {
          notes: state.notes,
          containers: state.containers,
          links: state.links,
          prefs: state.prefs,
        },
        incoming,
        { mode: 'merge' },
      )

      await repositories.notes.bulkPut(merged.notes)
      for (const container of merged.containers) {
        await repositories.containers.create(container)
      }
      for (const link of merged.links) {
        await repositories.links.create(link)
      }
      for (const [key, value] of Object.entries(merged.prefs)) {
        await repositories.prefs.set(key, value)
      }

      dispatch({
        type: 'hydrated',
        notes: merged.notes,
        containers: merged.containers,
        links: merged.links,
        prefs: merged.prefs,
      })

      return merged.report
    },
    [repositories, state.notes, state.containers, state.links, state.prefs],
  )

  const value = useMemo(
    () => ({
      state,
      actions: {
        capture,
        updateNote,
        createContainer,
        deleteContainer,
        selectContainer,
        updateContainer,
        nestContainer,
        createLink,
        removeLink,
        exportBackup,
        importBackup,
      },
    }),
    [
      state,
      capture,
      updateNote,
      createContainer,
      deleteContainer,
      selectContainer,
      updateContainer,
      nestContainer,
      createLink,
      removeLink,
      exportBackup,
      importBackup,
    ],
  )

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>
}

export function useAppStore() {
  const value = useContext(AppStoreContext)
  if (!value) throw new Error('useAppStore must be used inside an AppStoreProvider')
  return value
}
