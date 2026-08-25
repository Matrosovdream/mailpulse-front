import { ApiError, NetworkError } from './errors'

/**
 * Turns a thrown error into something worth showing a user.
 *
 * The backend puts a human-readable string in `errors`, so in most cases the
 * server's own wording is the best available. The cases handled specially are
 * the ones where it is not: a throttled login, where the actionable part is how
 * long to wait, and a transport failure, which has no server message at all.
 */
export function toMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.isRateLimited) {
      const seconds = error.retryAfterSeconds
      return seconds
        ? `Too many attempts. Try again in ${formatWait(seconds)}.`
        : 'Too many attempts. Try again shortly.'
    }
    return error.message
  }

  if (error instanceof NetworkError) return error.message

  return 'Something went wrong. Please try again.'
}

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`

  const minutes = Math.ceil(seconds / 60)
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}
