/**
 * Runtime configuration, read once from Vite's env and validated at import time.
 *
 * Validating here means a missing or malformed VITE_API_BASE_URL fails loudly at
 * boot with a message naming the variable, rather than surfacing later as
 * requests to `/undefined/api/...` that look like backend 404s.
 */

function readApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL

  if (!raw) {
    throw new Error(
      'VITE_API_BASE_URL is not set. Copy .env.example to .env and set it to the ' +
        'API origin, e.g. http://localhost:3000',
    )
  }

  // A trailing slash would produce `//api/...` once paths are appended. Harmless
  // on most servers, but it makes logged URLs confusing, so normalise it away.
  const trimmed = raw.replace(/\/+$/, '')

  try {
    new URL(trimmed)
  } catch {
    throw new Error(
      `VITE_API_BASE_URL is not a valid URL: "${raw}". Expected an absolute ` +
        'origin including the scheme, e.g. http://localhost:3000',
    )
  }

  if (trimmed.endsWith('/api')) {
    throw new Error(
      `VITE_API_BASE_URL should be the API origin without the /api suffix — the ` +
        `client appends the paths itself. Got "${raw}".`,
    )
  }

  return trimmed
}

export const config = {
  apiBaseUrl: readApiBaseUrl(),
  /**
   * Log the user out this many milliseconds before the token's `expires_at`,
   * so a request is not fired with a token that expires mid-flight.
   */
  sessionExpiryGraceMs: 30_000,
} as const
