import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * The address the app is published at.
 *
 * It is a single value in a single place because the share tags need an
 * absolute URL: WhatsApp, X and Slack do not resolve relative paths when
 * they fetch the preview image. Override it at build time with the
 * SITE_URL environment variable (a different domain, a preview, a mirror).
 */
const SITE_URL = process.env.SITE_URL ?? 'https://takefastnotes.vercel.app'

function siteMeta() {
  return {
    name: 'site-meta',
    transformIndexHtml(html) {
      return html.replaceAll('%SITE_URL%', SITE_URL)
    },
  }
}

// The production CSP lives in vercel.json and is strict: no inline styles,
// no inline scripts, no network at all.
//
// The dev server needs three relaxations caused by the tooling itself:
//   - script-src 'unsafe-inline': Vite injects an inline preamble for React Fast Refresh
//   - style-src 'unsafe-inline':   Vite injects <style> tags at runtime for CSS HMR.
//                                   Without this, style hot-reload and the error
//                                   overlay are silently dead in dev.
//   - connect-src ws:/wss::        the HMR websocket
//
// The app's own code is still held to the strict rule: it must not rely on
// inline styles. That is enforced by grep and by the production build.
const DEV_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' ws: wss:",
  "object-src 'none'",
  "base-uri 'none'",
  "frame-ancestors 'none'",
  "form-action 'none'",
].join('; ')

export default defineConfig({
  plugins: [react(), siteMeta()],
  server: {
    headers: {
      'Content-Security-Policy': DEV_CSP,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
