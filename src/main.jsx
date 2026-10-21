import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { BootstrapFailure } from './ui/components/BootstrapFailure.jsx'
import { createRepositories, openDatabase } from './infra/indexeddb/index.js'
import './styles/fonts.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/shell.css'
import './styles/capture.css'
import './styles/records.css'
import './styles/states.css'
import './styles/about.css'
import './styles/containers.css'
import './styles/links.css'

/**
 * The dev server ships the same strict CSP as production (`style-src
 * 'self'`), and Vite injects CSS through a `<style>` tag, which that
 * policy blocks. A same-origin `<link>` to the very same files is allowed,
 * so the dev server renders exactly what the production build renders.
 * The production build needs none of this: Vite extracts the CSS into one
 * file and links it from index.html.
 */
if (import.meta.env.DEV) {
  for (const sheet of ['fonts', 'tokens', 'base', 'shell', 'capture', 'records', 'states']) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `/src/styles/${sheet}.css?direct`
    document.head.append(link)
  }
}

async function bootstrap() {
  const root = createRoot(document.getElementById('root'))

  try {
    const db = await openDatabase()
    const repositories = createRepositories(db)
    root.render(
      <StrictMode>
        <App repositories={repositories} />
      </StrictMode>,
    )
  } catch (error) {
    root.render(<BootstrapFailure error={error} />)
  }
}

bootstrap()
