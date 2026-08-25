import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

/**
 * Content-Security-Policy for the dev server.
 *
 * Kept on in development deliberately: a violation that first appears in
 * production is far more expensive to diagnose than one that shows up here.
 *
 * Dev needs exactly two things production does not, both verified rather than
 * assumed:
 *
 *   - `worker-src blob:` — when the HMR socket drops, Vite's client spawns a
 *     SharedWorker from a Blob URL to ping until the server is back, then
 *     reloads. Without this the page stops auto-reloading after every dev
 *     server restart, and the only clue is a CSP error in the console.
 *   - `connect-src ws:` — the HMR socket itself.
 *
 * Note that Vite's dev-time CSS injection does *not* need
 * `style-src 'unsafe-inline'`: it inserts styles through the CSSOM, which the
 * inline-style restriction does not cover. `'unsafe-inline'` is here for Vue
 * `:style` bindings, which do produce real inline style attributes — the same
 * reason production carries it.
 */
function devContentSecurityPolicy(apiOrigin: string): string {
  return [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    `connect-src 'self' ws: ${apiOrigin}`,
    "worker-src 'self' blob:",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join('; ')
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiOrigin = env.VITE_API_BASE_URL ?? ''

  return {
    plugins: [vue(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      // The backend's .env.example ships WEB_CORS_ORIGINS=http://localhost:5173,
      // so this port is what makes CORS work in development with no backend
      // change. strictPort stops Vite silently moving to 5174 when the port is
      // taken, which would fail every request with an opaque CORS error.
      port: 5173,
      strictPort: true,
      // Bind on all interfaces so the server is reachable when it runs inside a
      // container. Without this Vite listens on localhost only, which in a
      // container means the container's own loopback and nothing else.
      host: true,
      headers: {
        'Content-Security-Policy': devContentSecurityPolicy(apiOrigin),
      },
      watch: {
        // Docker bind mounts on macOS and Windows do not deliver inotify
        // events, so the file watcher has to poll to see host edits.
        usePolling: process.env.VITE_USE_POLLING === 'true',
      },
    },
  }
})
