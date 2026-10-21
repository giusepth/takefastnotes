import { useState } from 'react'
import { AppStoreProvider, useAppStore } from './ui/state/appStore.jsx'
import { QuickCapture } from './ui/components/QuickCapture.jsx'
import { SearchBox } from './ui/components/SearchBox.jsx'
import { ContainerTree } from './ui/components/ContainerTree.jsx'
import { InboxView } from './ui/views/InboxView.jsx'
import { ContainersView } from './ui/views/ContainersView.jsx'
import { AboutView } from './ui/views/AboutView.jsx'
import { ErrorBoundary } from './ui/components/ErrorBoundary.jsx'
import { ErrorState, LoadingState } from './ui/components/States.jsx'
import { IconChevronDown, IconDrive } from './ui/icons/index.jsx'
import { ROUTES, isKnownRoute, useHashRoute } from './ui/lib/useHashRoute.js'

const NAV = [
  { href: ROUTES.notes, label: 'Notas' },
  { href: ROUTES.containers, label: 'Contenedores' },
  { href: ROUTES.about, label: 'Acerca de' },
]

export default function App({ repositories }) {
  return (
    <ErrorBoundary>
      <AppStoreProvider repositories={repositories}>
        <Shell />
      </AppStoreProvider>
    </ErrorBoundary>
  )
}

function Shell() {
  const { state, actions } = useAppStore()
  const [draft, setDraft] = useState('')
  const [focusSignal, setFocusSignal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const route = useHashRoute()
  const active = isKnownRoute(route) ? route : ROUTES.notes

  function loadExample(example) {
    setDraft(example?.label ?? example ?? '')
    setFocusSignal((value) => value + 1)
  }

  const count = state.status === 'ready' ? state.notes.length : null
  const selectedContainerId = state.prefs.currentContainerId ?? null

  // The sidebar and the containers page both show the tree — the sidebar as
  // the navigation spine, the page as the management surface. Showing both
  // at once would put the same names twice on the same screen, so the
  // sidebar steps aside on that route.
  const sidebarVisible = active !== ROUTES.containers

  function selectContainer(containerId) {
    actions.selectContainer(containerId)
    if (containerId) setSidebarOpen(false)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="identity">
            <span className="brand-name">TakeFastNotes</span>
            <p className="brand-statement">
              Captura rápida de notas que se quedan en este dispositivo.
            </p>
          </div>

          <SearchBox value={searchQuery} onChange={setSearchQuery} />

          <div className="header-meta">
            <nav className="app-nav-links" aria-label="Secciones">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={`#${item.href}`}
                  className={`app-nav-link${item.href === active ? ' is-active' : ''}`}
                  aria-current={item.href === active ? 'page' : undefined}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <span className="local-chip">
              <IconDrive width={13} height={13} />
              Solo local
            </span>
            <span className="note-count">
              {count === null ? '—' : `${count} ${count === 1 ? 'nota' : 'notas'}`}
            </span>
          </div>

          {sidebarVisible ? (
            <button
              type="button"
              className="sidebar-toggle"
              aria-expanded={sidebarOpen}
              aria-controls="app-sidebar"
              onClick={() => setSidebarOpen((open) => !open)}
            >
              Contenedores
              <IconChevronDown width={12} height={12} className="sidebar-toggle-chevron" />
            </button>
          ) : null}

          <QuickCapture
            value={draft}
            onChange={setDraft}
            onSubmit={actions.capture}
            disabled={state.status !== 'ready'}
            containers={state.containers}
            currentContainerId={selectedContainerId}
            focusSignal={focusSignal}
          />
        </div>
      </header>

      <div className={`app-body${sidebarVisible ? '' : ' app-body--single'}`}>
        {sidebarVisible ? (
          <aside
            className={`app-sidebar${sidebarOpen ? ' is-open' : ''}`}
            id="app-sidebar"
            aria-label="Contenedores"
          >
            <div className="sidebar-block">
              <h2 className="sidebar-title">Contenedores</h2>
              <ContainerTree
                containers={state.containers}
                notes={state.notes}
                activeContainerId={selectedContainerId}
                onSelect={selectContainer}
                onUpdate={actions.updateContainer}
                onDelete={actions.deleteContainer}
                onNest={actions.nestContainer}
                variant="compact"
              />
              {state.containers.length > 0 ? (
                <a className="sidebar-all-notes" href={`#${ROUTES.containers}`}>
                  Ver todos los contenedores
                </a>
              ) : null}
            </div>
          </aside>
        ) : null}

        <main className="app-main">
          {state.status === 'loading' ? <LoadingState /> : null}
          {state.status === 'error' ? <ErrorState error={state.error} /> : null}
          {state.status === 'ready' ? (
            active === ROUTES.about ? (
              <AboutView
                notes={state.notes}
                containers={state.containers}
                links={state.links}
                prefs={state.prefs}
                onExport={actions.exportBackup}
                onImport={actions.importBackup}
              />
            ) : active === ROUTES.containers ? (
              <ContainersView
                containers={state.containers}
                notes={state.notes}
                activeContainerId={selectedContainerId}
                onCreate={actions.createContainer}
                onDelete={actions.deleteContainer}
                onUpdate={actions.updateContainer}
                onNest={actions.nestContainer}
                onSelect={selectContainer}
              />
            ) : (
              <InboxView
                notes={state.notes}
                containers={state.containers}
                links={state.links}
                onUpdateNote={actions.updateNote}
                onCreateLink={actions.createLink}
                onRemoveLink={actions.removeLink}
                onExample={loadExample}
                searchQuery={searchQuery}
                containerFilter={selectedContainerId}
                onClearContainer={() => selectContainer(null)}
              />
            )
          ) : null}
        </main>
      </div>

      <footer className="app-footer">
        <div className="app-footer-inner">
          <span className="footer-note">
            <IconDrive width={13} height={13} />
            Todo lo que captures se queda en este navegador. Sin cuenta, sin servidor, sin
            sincronización.
          </span>
          <span className="footer-next">Próximo: notas enlazadas en la lista, filtros por tipo y etiqueta.</span>
        </div>
      </footer>
    </div>
  )
}
