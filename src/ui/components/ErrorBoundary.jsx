import { Component } from 'react'
import { userMessage } from '../lib/errors.js'

/**
 * Keeps a runtime failure from leaving a blank page. IndexedDB can be
 * unavailable (private mode, blocked storage), and the app must say so
 * instead of showing nothing.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    const { error } = this.state
    const { children } = this.props

    if (!error) return children

    return (
      <div className="app-fatal">
        <h1 className="app-fatal-title">Algo falló</h1>
        <p className="app-fatal-message">{userMessage(error)}</p>
        <p className="app-fatal-hint">
          Tus notas siguen en la base de datos local. Recarga la página para intentarlo de nuevo.
        </p>
      </div>
    )
  }
}
