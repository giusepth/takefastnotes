/**
 * Renders the share image (Open Graph) from its template.
 *
 * The template is drawn with the app's own tokens and typefaces, so the
 * preview a person sees when they share the link is the app itself and
 * not a picture that drifts away from the design.
 *
 * usage: node scripts/render-og-image.mjs
 */
import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

const WIDTH = 1200
const HEIGHT = 630

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  join(process.env.HOME ?? '', '.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'),
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean)

function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    if (existsSync(candidate)) return candidate
  }
  throw new Error(
    'No se encontró un navegador para renderizar la miniatura. Set CHROME_PATH.',
  )
}

const template = join(here, 'og-image.html')
const output = join(root, 'public', 'og-image.png')

mkdirSync(dirname(output), { recursive: true })

const chrome = findChrome()

await run(chrome, [
  '--headless',
  '--no-sandbox',
  '--disable-gpu',
  '--hide-scrollbars',
  '--allow-file-access-from-files',
  '--force-device-scale-factor=1',
  `--window-size=${WIDTH},${HEIGHT}`,
  '--virtual-time-budget=3000',
  `--screenshot=${output}`,
  `file://${template}`,
])

const { size } = statSync(output)
console.log(`og-image.png — ${WIDTH}×${HEIGHT}, ${(size / 1024).toFixed(1)} kB`)
