import { request, requestPage } from '../client'
import type {
  CreateNotifierRequest,
  NotifierResponse,
  Page,
  TestNotifierResponse,
  UpdateNotifierRequest,
  VerifyNotifierResponse,
} from '../types'

export type ListNotifiersQuery = {
  page?: number
  size?: number
  type?: string
  status?: string
}

export function listNotifiers(query: ListNotifiersQuery = {}): Promise<Page<NotifierResponse>> {
  return requestPage<NotifierResponse>('/api/notifiers', { query })
}

export function getNotifier(notifierId: string): Promise<NotifierResponse> {
  return request<NotifierResponse>(`/api/notifiers/${notifierId}`)
}

export function createNotifier(body: CreateNotifierRequest): Promise<NotifierResponse> {
  return request<NotifierResponse>('/api/notifiers', { method: 'POST', body })
}

export function updateNotifier(
  notifierId: string,
  body: UpdateNotifierRequest,
): Promise<NotifierResponse> {
  return request<NotifierResponse>(`/api/notifiers/${notifierId}`, { method: 'PATCH', body })
}

export function deleteNotifier(notifierId: string): Promise<boolean> {
  return request<boolean>(`/api/notifiers/${notifierId}`, { method: 'DELETE' })
}

/**
 * Two-step channel verification.
 *
 * Called with no code, the server issues one and returns it in
 * `verification_code` for the user to send to the channel. Called with the code
 * the user received out of band, it confirms the channel.
 */
export function verifyNotifier(
  notifierId: string,
  code?: string,
): Promise<VerifyNotifierResponse> {
  return request<VerifyNotifierResponse>(`/api/notifiers/${notifierId}/_verify`, {
    method: 'POST',
    body: code ? { code } : {},
  })
}

/** Sends a real message through the channel. */
export function testNotifier(notifierId: string): Promise<TestNotifierResponse> {
  return request<TestNotifierResponse>(`/api/notifiers/${notifierId}/_test`, { method: 'POST' })
}
