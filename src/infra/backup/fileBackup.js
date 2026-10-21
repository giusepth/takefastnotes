import { IMPORT_MAX_BYTES } from '../../domain/usecases/backup.js'

/**
 * Triggers a browser download of a JSON payload.
 *
 * @param {string} filename
 * @param {unknown} data
 */
export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()

  URL.revokeObjectURL(url)
}

/**
 * Reads and parses a backup file, refusing oversized payloads before
 * spending memory on them.
 *
 * @param {File} file
 * @param {{maxBytes?: number}} [options]
 * @returns {Promise<unknown>} parsed payload
 */
export async function readJsonFile(file, options = {}) {
  const maxBytes = options.maxBytes ?? IMPORT_MAX_BYTES

  if (file.size > maxBytes) {
    throw new Error('The file is too large to be a backup')
  }

  const text = await file.text()
  return JSON.parse(text)
}
