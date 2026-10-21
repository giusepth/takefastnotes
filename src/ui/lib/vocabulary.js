import { KINDS } from '../../domain/policies/kinds.js'
import { STATUSES } from '../../domain/policies/statuses.js'
import {
  IconStageBacklog,
  IconStageDoing,
  IconStageDone,
  IconStageDropped,
  IconStageInbox,
  IconStagePlanned,
} from '../icons/index.jsx'

/**
 * El vocabulario que la interfaz enseña.
 *
 * El dominio guarda los identificadores canónicos (`feature`, `inbox`); las
 * etiquetas que ve la persona son de la interfaz y viven acá. Esta frontera
 * es lo que permite que el copy cambie sin tocar los datos guardados: un
 * archivo exportado lleva `feature`, no "Funcionalidad".
 *
 * No hay código corto para ningún tipo. Un tipo se escribe completo, cada
 * vez, porque quien lee lo está viendo por primera vez y una abreviatura de
 * dos letras necesita un decodificador: exactamente lo contrario de lo que
 * esta pantalla persigue.
 */

export const KIND_LABELS = Object.freeze({
  note: 'Nota',
  idea: 'Idea',
  feature: 'Funcionalidad',
  fix: 'Corrección',
  decision: 'Decisión',
  question: 'Pregunta',
})

export const STATUS_LABELS = Object.freeze({
  inbox: 'Bandeja',
  backlog: 'Pendiente',
  planned: 'Planificada',
  doing: 'En curso',
  done: 'Hecha',
  dropped: 'Descartada',
})

export const KIND_MEANINGS = Object.freeze({
  note: 'Cualquier otra cosa. No necesita clasificación.',
  idea: 'Un pensamiento que vale guardar, pero todavía no es una tarea.',
  feature: 'Algo para construir.',
  fix: 'Algo roto que hay que arreglar.',
  decision: 'Una decisión que ya está tomada.',
  question: 'Algo que todavía no tiene respuesta.',
})

export const STATUS_MEANINGS = Object.freeze({
  inbox: 'Sin clasificar. Llega aquí en el momento de capturarla.',
  backlog: 'En cola, pero sin fecha.',
  planned: 'Comprometida y sin empezar.',
  doing: 'Es la que se está trabajando ahora mismo.',
  done: 'Terminada.',
  dropped: 'No se va a hacer.',
})

/**
 * The four stages a status can be in. Colour and form follow the stage,
 * never the individual status, so the reader learns four signals instead
 * of six arbitrary ones.
 */
export const STATUS_STAGES = Object.freeze({
  inbox: 'pending',
  backlog: 'pending',
  planned: 'pending',
  doing: 'active',
  done: 'done',
  dropped: 'dropped',
})

export const STATUS_MARKS = Object.freeze({
  inbox: IconStageInbox,
  backlog: IconStageBacklog,
  planned: IconStagePlanned,
  doing: IconStageDoing,
  done: IconStageDone,
  dropped: IconStageDropped,
})

export { KINDS, STATUSES }

export function kindLabel(kind) {
  return KIND_LABELS[kind] ?? kind
}

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status
}

export function kindMeaning(kind) {
  return KIND_MEANINGS[kind] ?? ''
}

export function statusMeaning(status) {
  return STATUS_MEANINGS[status] ?? ''
}
