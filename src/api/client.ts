import { config } from '@/config'
import { ApiError, NetworkError } from './errors'
import type { Page, WebResponse } from './types'

/** Supplies the bearer token. Set by the auth store so this module stays free
 *  of a store import, which would otherwise be circular. */
type TokenReader = () => string | null
/** Called on a rejected session, so the app can tear it down once. */
type UnauthorizedHandler = () => void

let readToken: TokenReader = () => null
let onUnauthorized: UnauthorizedHandler = () => {}

export function configureClient(options: {
  readToken: TokenReader
  onUnauthorized: UnauthorizedHandler
}): void {
  readToken = options.readToken
  onUnauthorized = options.onUnauthorized
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** JSON request body. Serialised here; do not pre-stringify. */
  body?: unknown
  /** Appended as a query string. `undefined` and `null` values are dropped. */
  query?: Record<string, string | number | boolean | undefined | null>
  /** Send without the Authorization header, for the public endpoints. */
  anonymous?: boolean
  signal?: AbortSignal
}

function buildUrl(path: string, query: RequestOptions['query']): string {
  const url = new URL(config.apiBaseUrl + path)

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

/**
 * Performs the call and returns the whole envelope, so both the single-value and
 * the list wrappers can share the transport, error mapping and 401 handling.
 *
 * Only `Authorization` and `Content-Type` may be sent: the backend's CORS
 * allowlist names exactly those two, so adding a custom header here would fail
 * preflight rather than being quietly ignored.
 */
async function send<T>(path: string, options: RequestOptions): Promise<WebResponse<T>> {
  const { method = 'GET', body, query, anonymous = false, signal } = options

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  if (!anonymous) {
    const token = readToken()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })
  } catch (cause) {
    // An aborted request is the caller's own doing, not a network failure.
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new NetworkError(cause)
  }

  const text = await response.text()

  let envelope: WebResponse<T> = {}
  if (text) {
    try {
      envelope = JSON.parse(text) as WebResponse<T>
    } catch {
      // A non-JSON body means the response came from something other than the
      // API's error handler — a proxy or gateway in front of it. Surface the
      // status, because the body is not going to be a useful message.
      throw new ApiError(
        response.status,
        response.ok
          ? 'The API returned a response that was not valid JSON.'
          : `Unexpected ${response.status} response from the API.`,
      )
    }
  }

  if (!response.ok) {
    const retryAfter = response.headers.get('Retry-After')
    const error = new ApiError(
      response.status,
      envelope.errors || `Request failed with status ${response.status}.`,
      retryAfter ? Number(retryAfter) : undefined,
    )

    // Hand 401s to the app once, so a burst of parallel failures does not
    // trigger a burst of logouts and redirects.
    if (error.isUnauthorized && !anonymous) onUnauthorized()

    throw error
  }

  return envelope
}

/** One request against the API, returning the unwrapped `data` payload. */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const envelope = await send<T>(path, options)
  return envelope.data as T
}

/** A list endpoint, keeping the paging metadata alongside the items. */
export async function requestPage<T>(path: string, options: RequestOptions = {}): Promise<Page<T>> {
  const envelope = await send<T[]>(path, options)
  return { items: envelope.data ?? [], paging: envelope.paging }
}
