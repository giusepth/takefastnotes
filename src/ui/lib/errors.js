/**
 * Traducción de errores para quien los lee.
 *
 * El dominio lanza mensajes en inglés porque son identificadores estables:
 * los tests los verifican y no dependen del idioma. La interfaz es la que
 * los traduce, porque es la única capa que conoce el idioma de la persona
 * que está delante de la pantalla.
 */

const MESSAGES = [
  ['Nothing to capture', 'No hay nada que guardar.'],
  ['A note needs a body or a title', 'La nota necesita un texto o un título.'],
  ['Could not open the database', 'No se pudo abrir la base de datos.'],
  [
    'Database upgrade blocked by another tab',
    'Otra pestaña tiene abierta una versión anterior de la base de datos.',
  ],
  ['The file is not a valid backup', 'El archivo no es una copia válida.'],
  ['The backup is missing notes or containers', 'A la copia le faltan notas o contenedores.'],
  ['The file contains forbidden keys', 'El archivo contiene claves no permitidas.'],
  ['The file is too large to be a backup', 'El archivo es demasiado grande para ser una copia.'],
  ['An entity cannot link to itself', 'Un elemento no puede vincularse consigo mismo.'],
  ['That link already exists', 'Ese vínculo ya existe.'],
]

/**
 * Returns a message a person can act on.
 *
 * @param {unknown} error
 * @returns {string}
 */
export function userMessage(error) {
  const message = typeof error === 'string' ? error : (error?.message ?? '')

  for (const [pattern, translation] of MESSAGES) {
    if (message.includes(pattern)) return translation
  }

  if (message.startsWith('Note not found')) return 'No se encontró la nota.'
  if (message.startsWith('Container not found')) return 'No se encontró el contenedor.'
  if (message.startsWith('Unknown container')) return 'El contenedor no existe.'

  return message || 'Error desconocido.'
}
