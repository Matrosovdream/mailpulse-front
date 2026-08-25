/**
 * A failed API call. The backend's error handler emits `{"errors": "<message>"}`
 * with the matching status, so `message` is the server's own text where there
 * was one, and a fallback where the failure happened below that layer.
 */
export class ApiError extends Error {
  readonly status: number
  /** Seconds to wait, from the Retry-After header. Only ever set on a 429. */
  readonly retryAfterSeconds?: number

  constructor(status: number, message: string, retryAfterSeconds?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
  }

  /**
   * The session is missing, expired, or revoked.
   *
   * Careful: the backend mounts its auth middleware on the whole `/api` group,
   * so an unmatched path answers 401 rather than 404. A typo in an endpoint URL
   * is indistinguishable from an expired session by status alone — which is why
   * the session teardown in the auth store confirms with `/api/users/_current`
   * before logging anyone out.
   */
  get isUnauthorized(): boolean {
    return this.status === 401
  }

  /** Authenticated, but the role is not allowed here. Not a session problem. */
  get isForbidden(): boolean {
    return this.status === 403
  }

  get isRateLimited(): boolean {
    return this.status === 429
  }
}

/** Raised when the request never reached the server. */
export class NetworkError extends Error {
  constructor(cause: unknown) {
    super('Could not reach the MailPulse API. Check your connection and that the API is running.')
    this.name = 'NetworkError'
    this.cause = cause
  }
}
