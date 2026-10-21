import { useEffect, useRef, useState } from 'react'
import { IconAlert, IconCheck, IconDownload, IconReload } from '../icons/index.jsx'
import { formatBytes, formatFullTime } from '../lib/format.js'
import { userMessage } from '../lib/errors.js'

/**
 * Acerca de: qué es la app, cómo se usa y dónde viven los datos.
 *
 * Esta pantalla es la respuesta a las tres preguntas que alguien se hace
 * antes de confiarle sus notas: qué hace, cómo se maneja, y qué pasa si
 * se pierden. La política de datos no es un texto decorativo: los botones
 * de abajo son la única red de seguridad que existe, y el estado real de
 * esta copia se muestra tal cual es.
 */
export function AboutView({ notes, containers, links, prefs, onExport, onImport }) {
  const fileInputRef = useRef(null)
  const [storage, setStorage] = useState(null)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function readStorage() {
      try {
        if (!navigator.storage?.estimate) return
        const estimate = await navigator.storage.estimate()
        if (!cancelled) setStorage(estimate)
      } catch {
        // The browser may refuse the estimate; the screen works without it.
      }
    }

    readStorage()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleExport() {
    setStatus({ kind: 'busy', message: 'Preparando la copia…' })
    try {
      const payload = await onExport()
      setStatus({
        kind: 'ok',
        message: `Copia descargada: ${payload.notes.length} notas, ${payload.containers.length} contenedores.`,
      })
    } catch (error) {
      setStatus({ kind: 'error', message: `No se pudo descargar la copia: ${userMessage(error)}` })
    }
  }

  async function handleImport(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setStatus({ kind: 'busy', message: 'Restaurando la copia…' })
    try {
      const report = await onImport(file)
      setStatus({
        kind: 'ok',
        message: `Copia restaurada: ${report.added} nuevos, ${report.updated} actualizados, ${report.skipped} sin cambios.`,
      })
    } catch (error) {
      setStatus({ kind: 'error', message: `No se pudo restaurar la copia: ${userMessage(error)}` })
    }
  }

  const origin = typeof window === 'undefined' ? '' : window.location.origin

  return (
    <section className="view about" aria-labelledby="about-title">
      <header className="about-header">
        <h2 className="about-title" id="about-title">
          Acerca de TakeFastNotes
        </h2>
        <p className="about-lede">
          Qué es, cómo se usa, y dónde están guardadas tus notas.
        </p>
      </header>

      <div className="about-body">
        <article className="about-section">
          <h3 className="about-section-title">Qué es y para qué sirve</h3>
          <p>
            TakeFastNotes es un cuaderno de notas rápidas que funciona por completo dentro de tu
            navegador. Sirve para capturar una idea, una funcionalidad, una corrección o una
            decisión en el momento en que te viene, y clasificarla después sin que clasificar te
            frene al escribir.
          </p>
          <p>
            No es un gestor de proyectos: no hay sprints, ni responsables, ni informes. Es la
            libreta que tienes al lado mientras trabajas — sin cuenta, sin servidor y sin que nadie
            más pueda ver lo que escribes.
          </p>
        </article>

        <article className="about-section">
          <h3 className="about-section-title">Cómo se usa</h3>
          <ol className="about-steps">
            <li>
              Escribe arriba y pulsa <kbd>Enter</kbd>. La nota queda guardada al instante, con
              fecha y hora.
            </li>
            <li>
              Clasifica mientras escribes, con la gramática de la barra de captura:
            </li>
          </ol>
          <table className="about-table">
            <tbody>
              <tr>
                <td>
                  <code className="syntax-token">#etiqueta</code>
                </td>
                <td>Añade una etiqueta. Vale cualquier palabra: #backend, #release/2.0.</td>
              </tr>
              <tr>
                <td>
                  <code className="syntax-token">feature:</code>
                </td>
                <td>
                  Fija el tipo de la nota, al principio de la línea. Valores: feature:, fix:,
                  decision:, idea:, question:, note:.
                </td>
              </tr>
              <tr>
                <td>
                  <code className="syntax-token">@contenedor</code>
                </td>
                <td>
                  Vincula la nota a un contenedor que ya existe. Un contenedor es el contexto: un
                  repositorio, un documento, una carpeta, un cliente.
                </td>
              </tr>
            </tbody>
          </table>
          <ol className="about-steps" start={3}>
            <li>
              Cada nota nace en <strong>Bandeja</strong>. Su estado (Bandeja, Pendiente,
              Planificada, En curso, Hecha, Descartada) se cambia desde el menú de la propia fila, y
              su tipo se cambia desde el menú de la izquierda.
            </li>
            <li>
              Las <strong>etiquetas</strong> son palabras libres: sirven para agrupar lo que quieras
              cruzando contenedores.
            </li>
          </ol>
        </article>

        <article className="about-section">
          <h3 className="about-section-title">Qué son los contenedores</h3>
          <p>
            Un contenedor es <strong>el contexto de una nota</strong>: un repositorio, un
            documento, una carpeta, un cliente, un servicio. La app no sabe qué es un repositorio de
            GitHub — un contenedor es simplemente un nombre, un tipo opcional y una dirección
            opcional, y por eso sirve para cualquier cosa.
          </p>
          <ul className="about-list">
            <li>
              <strong>Se crean</strong> desde la sección{' '}
              <a href="#/contenedores">Contenedores</a>, con un nombre, un tipo y, si querés, una
              dirección.
            </li>
            <li>
              <strong>Se vinculan</strong> escribiendo <code className="syntax-token">@nombre</code>{' '}
              al capturar la nota, o eligiéndolo en el editor de la nota.
            </li>
            <li>
              <strong>No se pierden</strong>: al borrar un contenedor, sus notas quedan sin
              contenedor y las notas siguen ahí.
            </li>
          </ul>
          <p className="about-note">
            Los contenedores son jerárquicos: uno puede contener a otro. Por ahora la app los
            muestra en una lista plana; el árbol anidado es lo siguiente.
          </p>
        </article>

        <article className="about-section">
          <h3 className="about-section-title">Dónde están tus datos</h3>
          <p>
            En la base de datos local de este navegador (IndexedDB), con el nombre{' '}
            <code className="syntax-token">takefastnotes</code>. En ningún servidor: el hosting solo
            distribuye los archivos de la app.
          </p>
          <dl className="about-facts">
            <div className="about-fact">
              <dt>Origen</dt>
              <dd>
                <code>{origin || '—'}</code>
              </dd>
            </div>
            <div className="about-fact">
              <dt>En esta copia</dt>
              <dd>
                {notes.length} {notes.length === 1 ? 'nota' : 'notas'} · {containers.length}{' '}
                {containers.length === 1 ? 'contenedor' : 'contenedores'} · {links.length}{' '}
                {links.length === 1 ? 'enlace' : 'enlaces'}
              </dd>
            </div>
            <div className="about-fact">
              <dt>Espacio usado</dt>
              <dd>
                {storage ? `${formatBytes(storage.usage ?? 0)} de ${formatBytes(storage.quota ?? 0)}` : '—'}
              </dd>
            </div>
            <div className="about-fact">
              <dt>Última copia</dt>
              <dd>{prefs.lastExportAt ? formatFullTime(prefs.lastExportAt) : 'Nunca exportada'}</dd>
            </div>
          </dl>
          <p className="about-note">
            El <strong>origen</strong> importa: los datos pertenecen a esta dirección exacta. Abrir
            la app en <code>localhost</code> o en el dominio público son dos bases distintas, y las
            notas no se mudan solas de una a otra.
          </p>
        </article>

        <article className="about-section">
          <h3 className="about-section-title">Qué sale de tu dispositivo</h3>
          <p>Nada. En concreto:</p>
          <ul className="about-list">
            <li>
              La app <strong>no hace ninguna petición de red</strong> una vez cargada. No hay
              analítica, no hay envío de errores, no hay fuentes ni librerías externas.
            </li>
            <li>No hay cuenta, ni correo, ni token, ni servidor que reciba nada.</li>
            <li>
              Las peticiones que se ven en las herramientas de desarrollo son solo los archivos de la
              app (HTML, JS, CSS y las dos fuentes tipográficas), descargados del hosting.
            </li>
            <li>No hay publicidad, ni rastreadores, ni terceros con acceso a tus notas.</li>
          </ul>
        </article>

        <article className="about-section">
          <h3 className="about-section-title">Cómo se pueden perder los datos</h3>
          <p>
            Esta es la parte importante: <strong>no hay copia en la nube</strong>. Tus notas viven en
            un solo lugar, y ese lugar se puede borrar.
          </p>
          <ul className="about-list">
            <li>
              Si <strong>borras los datos del sitio</strong> en el navegador (ajustes → datos del
              sitio → borrar), las notas se van con ellos.
            </li>
            <li>
              Si usas una <strong>ventana privada</strong>, los datos se borran al cerrarla.
            </li>
            <li>
              Si <strong>cambias de navegador, de perfil o de dispositivo</strong>, no hay nada
              sincronizado: no vas a ver las mismas notas.
            </li>
            <li>
              Si <strong>cambias la dirección</strong> de la app (dominio, puerto, http/https), es
              otra base de datos.
            </li>
            <li>
              Si el <strong>navegador libera espacio</strong>: algunos navegadores borran los datos
              de sitios que no se abren hace tiempo o que ocupan mucho.
            </li>
            <li>Si <strong>desinstalas o limpias el navegador</strong>.</li>
          </ul>
        </article>

        <article className="about-section">
          <h3 className="about-section-title">Cómo protegerlos</h3>
          <p>
            La única red de seguridad es el archivo de copia que genera la propia app. La copia sale en formato JSON:
            texto legible, sin cifrar, que se puede guardar en un Drive, versionar en un repositorio
            o mandarte por correo.
          </p>
          <div className="about-actions">
            <button
              type="button"
              className="button button-primary"
              onClick={handleExport}
              disabled={status?.kind === 'busy'}
            >
              <IconDownload width={14} height={14} />
              Descargar copia de seguridad
            </button>
            <button
              type="button"
              className="button button-quiet"
              onClick={() => fileInputRef.current?.click()}
              disabled={status?.kind === 'busy'}
            >
              <IconReload width={14} height={14} />
              Restaurar desde un archivo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              className="visually-hidden"
              onChange={handleImport}
            />
          </div>
          {status ? (
            <p
              className={`about-status about-status--${status.kind}`}
              role={status.kind === 'error' ? 'alert' : 'status'}
            >
              {status.kind === 'ok' ? <IconCheck width={13} height={13} /> : null}
              {status.kind === 'error' ? <IconAlert width={13} height={13} /> : null}
              {status.message}
            </p>
          ) : null}
          <p className="about-note">
            Al restaurar, la copia se <strong>combina</strong> con lo que ya hay: nunca borra nada y
            cuando una nota existe en los dos lados gana la más reciente. Conviene exportar una vez
            por semana y guardar el archivo en más de un lado.
          </p>
        </article>

        <article className="about-section">
          <h3 className="about-section-title">Atajos de teclado</h3>
          <dl className="about-facts">
            <div className="about-fact">
              <dt>
                <kbd>Enter</kbd>
              </dt>
              <dd>Guarda la nota que se está escribiendo.</dd>
            </div>
            <div className="about-fact">
              <dt>
                <kbd>Shift</kbd> + <kbd>Enter</kbd>
              </dt>
              <dd>Escribe un salto de línea en lugar de guardar.</dd>
            </div>
            <div className="about-fact">
              <dt>
                <kbd>Esc</kbd>
              </dt>
              <dd>Cierra el menú abierto.</dd>
            </div>
            <div className="about-fact">
              <dt>
                <kbd>↑</kbd> <kbd>↓</kbd>
              </dt>
              <dd>Se mueve dentro de un menú abierto.</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  )
}
