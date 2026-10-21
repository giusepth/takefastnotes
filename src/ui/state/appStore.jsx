import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
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
      // The action carries only the key that changed: a dispatch that
      // arrives late must not be able to bring back a whole stale
      // preference object and overwrite what was decided after it.
      return { ...state, prefs: { ...state.prefs, ...action.prefs } }
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
 * Decides which container a note points at after an edit.
 *
 * The container the note asks for wins when it exists. The list the store
 * holds is a snapshot from boot, so a container that the list does not know
 * is looked up in the database: it may have been created in another tab of
 * the same origin, and it is alive there. Only when neither the requested
 * container nor the one the note already has can be found does the note
 * become unclassified.
 *
 * @param {{requested: string | null, current: string | null, containers: object[], repositories: object}} input
 * @returns {Promise<{id: string | null, container: object | null}>}
 */
async function resolveContainer({ requested, current, containers, repositories }) {
  const known = async (id) => {
    if (!id) return null
    const inMemory = containers.find((container) => container.id === id)
    if (inMemory) return inMemory
    return (await repositories.containers.byId(id)) ?? null
  }

  // An explicit "sin contenedor" is a decision, not a loss.
  if (requested === null) return { id: null, container: null }

  const requestedContainer = await known(requested)
  if (requestedContainer) return { id: requested, container: requestedContainer }

  const currentContainer = await known(current)
  if (currentContainer) return { id: current, container: currentContainer }

  return { id: null, container: null }
}

/**
 * Single source of truth for the UI.
 *
 * Reads are synchronous from the store; writes go through a use case, then
 * the repository, then back into the store. The UI never touches IndexedDB.
 */
export function AppStoreProvider({ repositories, children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  // The latest state, readable from an action that started before the
  // state changed. A deletion takes a while, and when it finishes it has
  // to decide with the value that is current now, not with the one it
  // found when it started.
  const stateRef = useRef(state)
  stateRef.current = state

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
      // The selection is only inherited while it points at a container that
      // exists: a capture never stores a `containerId` that references
      // nothing.
      const selectedId = state.prefs.currentContainerId ?? null
      const currentContainerId =
        selectedId && state.containers.some((container) => container.id === selectedId)
          ? selectedId
          : null

      const note = quickCapture(text, {
        containers: state.containers,
        currentContainerId,
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
        // The domain refuses a container that does not exist, and it is right
        // to: the rule is about the data, not about the moment. The store is
        // the layer that knows about deleted containers — and about the ones
        // it has not seen yet, because the list it holds is a snapshot from
        // boot. A container created in another tab is alive in the database
        // even when the store does not know it, so a note never loses its
        // classification because of a list that is out of date.
        const { id, container } = await resolveContainer({
          requested: patch.containerId ?? null,
          current: next.containerId ?? null,
          containers: state.containers,
          repositories,
        })
        const known =
          container && !state.containers.some((item) => item.id === container.id)
            ? [...state.containers, container]
            : state.containers
        next = moveNote(next, id, { containers: known })
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

      // The selection cannot keep pointing at a container that no longer
      // exists: the filter would hide every note and the captures would
      // inherit a dangling id. The removed set is the difference between the
      // previous list and the new one — the descendants survive (they move
      // up), so only what was really deleted clears the selection.
      const removedIds = new Set(
        state.containers
          .filter((container) => !result.containers.some((next) => next.id === container.id))
          .map((container) => container.id),
      )

      // The decision is made with the value that is current now, not with
      // the one this action started with: the destructive writes take a
      // while, and the reader may have selected another container in the
      // meantime. A deletion never clears a selection that is newer than
      // itself.
      const freshSelectedId = (await repositories.prefs.get('currentContainerId')) ?? null
      const currentSelectedId = stateRef.current.prefs.currentContainerId ?? null
      const selectionWasReplaced =
        Boolean(currentSelectedId) && !removedIds.has(currentSelectedId)

      if (
        freshSelectedId &&
        removedIds.has(freshSelectedId) &&
        !selectionWasReplaced
      ) {
        await repositories.prefs.set('currentContainerId', null)
        dispatch({ type: 'prefsChanged', prefs: { currentContainerId: null } })
      }

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
      // Only the key that changed travels: a dispatch that carries the whole
      // preference object would bring back a stale value for everything
      // else that moved on while this action was running.
      dispatch({ type: 'prefsChanged', prefs: { currentContainerId: next } })
      await repositories.prefs.set('currentContainerId', next)
    },
    [repositories],
  )

  /**
   * Renames a container or changes its kind or address.
   */
  const updateContainer = useCallback(
    async (containerId, patch) => {
      const current = state.containers.find((container) => container.id === containerId)
      if (!current) throw new Error(`Container not found: ${containerId}`)

      const next = { ...current, ...patch, id: current.id, updatedAt: new Date().toISOString() }
      // The timestamp goes to the database with the patch: otherwise the row
      // keeps the old one and the state contradicts what is stored.
      await repositories.containers.update(containerId, { ...patch, updatedAt: next.updatedAt })
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
      await repositories.containers.update(containerId, {
        parentId: next.parentId,
        updatedAt: next.updatedAt,
      })
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

    const prefs = { lastExportAt: payload.exportedAt }
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
