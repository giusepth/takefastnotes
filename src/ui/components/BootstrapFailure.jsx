/**
 * Shown when the app cannot even start — the most common cause is a browser
 * blocking IndexedDB (private mode, blocked site data).
 */
export function BootstrapFailure({ error }) {
  return (
    <div className="app-fatal">
      <h1 className="app-fatal-title">El almacenamiento local no está disponible</h1>
      <p className="app-fatal-message">{error?.message ?? 'Error desconocido'}</p>
      <p className="app-fatal-hint">
        TakeFastNotes guarda todo en este navegador. Las ventanas de navegación privada y los
        sitios con el almacenamiento bloqueado lo impiden. Prueba con una ventana normal.
      </p>
    </div>
  )
}
