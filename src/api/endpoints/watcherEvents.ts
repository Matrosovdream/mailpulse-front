import { request } from '../client'
import type {
  CreateWatcherEventRequest,
  UpdateWatcherEventRequest,
  WatcherEventResponse,
} from '../types'

export function listEvents(watcherId: string): Promise<WatcherEventResponse[]> {
  return request<WatcherEventResponse[]>(`/api/watchers/${watcherId}/events`)
}

export function createEvent(
  watcherId: string,
  body: CreateWatcherEventRequest,
): Promise<WatcherEventResponse> {
  return request<WatcherEventResponse>(`/api/watchers/${watcherId}/events`, {
    method: 'POST',
    body,
  })
}

export function getEvent(watcherId: string, eventId: string): Promise<WatcherEventResponse> {
  return request<WatcherEventResponse>(`/api/watchers/${watcherId}/events/${eventId}`)
}

/** `type` is immutable — to change it, delete the event and create another. */
export function updateEvent(
  watcherId: string,
  eventId: string,
  body: UpdateWatcherEventRequest,
): Promise<WatcherEventResponse> {
  return request<WatcherEventResponse>(`/api/watchers/${watcherId}/events/${eventId}`, {
    method: 'PATCH',
    body,
  })
}

export function deleteEvent(watcherId: string, eventId: string): Promise<boolean> {
  return request<boolean>(`/api/watchers/${watcherId}/events/${eventId}`, { method: 'DELETE' })
}

/** Every event id, in the order they should execute. */
export function reorderEvents(
  watcherId: string,
  eventIds: string[],
): Promise<WatcherEventResponse[]> {
  return request<WatcherEventResponse[]>(`/api/watchers/${watcherId}/events/_reorder`, {
    method: 'POST',
    body: { event_ids: eventIds },
  })
}

/** Runs the handler for real against a past match. */
export function testEvent(
  watcherId: string,
  eventId: string,
  matchedEmailId?: string,
): Promise<unknown> {
  return request<unknown>(`/api/watchers/${watcherId}/events/${eventId}/_test`, {
    method: 'POST',
    body: matchedEmailId ? { matched_email_id: matchedEmailId } : {},
  })
}
