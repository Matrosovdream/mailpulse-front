import { request } from '../client'
import type { LoginResponse, SessionResponse, UserResponse } from '../types'

/**
 * Auth and account endpoints.
 *
 * Note the shape of `/api/users`: POST registers and DELETE logs out. Same path,
 * different verb, different tag in the spec — easy to misread as a pair.
 */

export function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/users/_login', {
    method: 'POST',
    body: { email, password },
    anonymous: true,
  })
}

export function register(input: {
  email: string
  /** Required by the spec, despite reading like an optional profile field. */
  name: string
  password: string
  timezone?: string
}): Promise<UserResponse> {
  return request<UserResponse>('/api/users', {
    method: 'POST',
    body: input,
    anonymous: true,
  })
}

export function forgotPassword(email: string): Promise<boolean> {
  return request<boolean>('/api/users/_forgot-password', {
    method: 'POST',
    body: { email },
    anonymous: true,
  })
}

export function resetPassword(token: string, password: string): Promise<boolean> {
  return request<boolean>('/api/users/_reset-password', {
    method: 'POST',
    body: { token, password },
    anonymous: true,
  })
}

/** Revokes the session behind the presented token, server-side. */
export function logout(): Promise<boolean> {
  return request<boolean>('/api/users', { method: 'DELETE' })
}

export function currentUser(): Promise<UserResponse> {
  return request<UserResponse>('/api/users/_current')
}

export function updateCurrentUser(input: {
  name?: string
  timezone?: string
  password?: string
}): Promise<UserResponse> {
  return request<UserResponse>('/api/users/_current', { method: 'PATCH', body: input })
}

export function listSessions(): Promise<SessionResponse[]> {
  return request<SessionResponse[]>('/api/users/_sessions')
}

export function revokeSession(sessionId: string): Promise<boolean> {
  return request<boolean>(`/api/users/_sessions/${sessionId}`, { method: 'DELETE' })
}
