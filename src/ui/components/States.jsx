import { IconAlert, IconReload } from '../icons/index.jsx'
import { userMessage } from '../lib/errors.js'

/**
 * Loading and failure states.
 *
 * The database opens locally and fast, so the skeleton is brief and
 * shaped like the register it will become. A failure names the problem
 * and the way out — no raw error as the headline.
 */
export function LoadingState() {
  return (
    <div className="skeleton-rows" role="status" aria-label="Abriendo la base de datos local">
      {[0, 1, 2].map((row) => (
        <div className="skeleton-row" key={row}>
          <div className="skeleton-block skeleton-block--short" />
          <div>
            <div className="skeleton-block skeleton-block--mid" />
            <div className="skeleton-block skeleton-block--short" />
          </div>
          <div className="skeleton-block skeleton-block--short" />
        </div>
      ))}
    </div>
  )
}

export function ErrorState({ error }) {
  return (
    <div className="state-panel state-panel--danger" role="alert">
      <h2 className="state-title">
        <IconAlert width={16} height={16} /> No se pudo abrir la base de datos local
      </h2>
      <p className="state-hint">
        No se cargó nada y no se borró nada: todas tus notas siguen guardadas en este navegador.
        Esto suele pasar cuando el navegador bloquea el almacenamiento local. Recarga para
        reintentar.
      </p>
      <p className="state-detail">{userMessage(error)}</p>
      <button type="button" className="button button-quiet" onClick={() => window.location.reload()}>
        <IconReload width={14} height={14} />
        Recargar
      </button>
    </div>
  )
}
