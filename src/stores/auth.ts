import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { config } from '@/config'
import * as authApi from '@/api/endpoints/auth'
import { ApiError } from '@/api/errors'
import type { EpochMillis, RoleSlug, UserResponse } from '@/api/types'

const STORAGE_KEY = 'mailpulse.session'

interface StoredSession {
  token: string
  expiresAt: EpochMillis
  user: UserResponse
}

/**
 * Reads the persisted session.
 *
 * The token lives in localStorage because the API is bearer-only — its CORS
 * middleware sets AllowCredentials:false and the backend documents that a
 * session here is "a bearer token in the Authorization header, not a cookie".
 * An httpOnly cookie is therefore not available to us, and since the API has no
 * refresh endpoint, holding the token in memory alone would force a fresh login
 * on every page reload.
 *
 * The consequence is worth stating plainly: script running on this origin can
 * read the token, so an XSS bug is a session compromise. The defences that
 * matter are a strict CSP, never rendering server-derived strings with v-html,
 * and dependency hygiene — not the choice of storage key.
 */
function readStored(): StoredSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<StoredSession>
    if (!parsed.token || !parsed.expiresAt || !parsed.user) return null

    return parsed as StoredSession
  } catch {
    // Private-browsing modes and blocked site data both throw here. Treat it as
    // "no session" rather than letting it break boot.
    return null
  }
}

function writeStored(session: StoredSession | null): void {
  try {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Storage unavailable — the session still works for this tab, it just will
    // not survive a reload. Not worth failing the login over.
  }
}

export const useAuthStore = defineStore('auth', () => {
  const stored = readStored()

  const token = ref<string | null>(stored?.token ?? null)
  const expiresAt = ref<EpochMillis | null>(stored?.expiresAt ?? null)
  const user = ref<UserResponse | null>(stored?.user ?? null)

  const roles = computed<RoleSlug[]>(() => user.value?.roles ?? [])
  const isSuperadmin = computed(() => roles.value.includes('superadmin'))

  /**
   * True while a usable token is held.
   *
   * The expiry is checked with a grace window so a request is not fired with a
   * token that expires mid-flight. This is a client-side convenience only: the
   * server decides what a token is worth, and this flag never gates data.
   */
  const isAuthenticated = computed(() => {
    if (!token.value || !expiresAt.value) return false
    return Date.now() < expiresAt.value - config.sessionExpiryGraceMs
  })

  function setSession(session: StoredSession): void {
    token.value = session.token
    expiresAt.value = session.expiresAt
    user.value = session.user
    writeStored(session)
  }

  function clearSession(): void {
    token.value = null
    expiresAt.value = null
    user.value = null
    writeStored(null)
  }

  async function login(email: string, password: string): Promise<void> {
    const response = await authApi.login(email, password)
    setSession({
      token: response.token,
      expiresAt: response.expires_at,
      user: response.user,
    })
  }

  async function logout(): Promise<void> {
    try {
      // Revoke server-side so the token stops working immediately rather than
      // at TTL. A failure here must not strand the user in a logged-in UI.
      await authApi.logout()
    } catch {
      // Already invalid, or the API is unreachable. Either way, drop it locally.
    } finally {
      clearSession()
    }
  }

  /** Refreshes the cached user, picking up a role or status change server-side. */
  async function refreshUser(): Promise<void> {
    const fresh = await authApi.currentUser()
    user.value = fresh

    if (token.value && expiresAt.value) {
      writeStored({ token: token.value, expiresAt: expiresAt.value, user: fresh })
    }
  }

  let verifying: Promise<void> | null = null

  /**
   * Handles a 401 from any request.
   *
   * A 401 does not reliably mean "session expired". The backend mounts its auth
   * middleware on the entire `/api` group, so an unmatched path — a typo in an
   * endpoint URL — answers 401 too. Tearing the session down on that would log
   * the user out because of a frontend bug.
   *
   * So confirm against a known-good endpoint first, and only clear the session
   * when that one also rejects the token. Concurrent 401s share the single
   * in-flight check rather than each firing their own.
   */
  function handleUnauthorized(): void {
    if (!token.value || verifying) return

    verifying = authApi
      .currentUser()
      .then(() => {
        // The token is fine; the 401 came from an unmatched path. Leave the
        // session alone — the failing call surfaces its own error.
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.isUnauthorized) clearSession()
      })
      .finally(() => {
        verifying = null
      })
  }

  return {
    token,
    expiresAt,
    user,
    roles,
    isSuperadmin,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    clearSession,
    handleUnauthorized,
  }
})
