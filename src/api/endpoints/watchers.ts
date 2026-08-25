import { request, requestPage } from '../client'
import type {
  CreateWatcherRequest,
  Page,
  ReplaceFiltersRequest,
  TestWatcherResponse,
  UpdateWatcherRequest,
  WatcherFilterResponse,
  WatcherResponse,
  WatcherStatsResponse,
} from '../types'

export type ListWatchersQuery = {
  page?: number
  size?: number
  status?: string
  mail_account_id?: string
  q?: string
}

export function listWatchers(query: ListWatchersQuery = {}): Promise<Page<WatcherResponse>> {
  return requestPage<WatcherResponse>('/api/watchers', { query })
}

/** Single reads include the account, filters and events; list rows do not. */
export function getWatcher(watcherId: string): Promise<WatcherResponse> {
  return request<WatcherResponse>(`/api/watchers/${watcherId}`)
}

export function createWatcher(body: CreateWatcherRequest): Promise<WatcherResponse> {
  return request<WatcherResponse>('/api/watchers', { method: 'POST', body })
}

/** Metadata only — filters and events have their own endpoints. */
export function updateWatcher(
  watcherId: string,
  body: UpdateWatcherRequest,
): Promise<WatcherResponse> {
  return request<WatcherResponse>(`/api/watchers/${watcherId}`, { method: 'PATCH', body })
}

export function deleteWatcher(watcherId: string): Promise<boolean> {
  return request<boolean>(`/api/watchers/${watcherId}`, { method: 'DELETE' })
}

type Lifecycle = '_archive' | '_restore' | '_pause' | '_resume'

function lifecycle(watcherId: string, action: Lifecycle): Promise<WatcherResponse> {
  return request<WatcherResponse>(`/api/watchers/${watcherId}/${action}`, { method: 'POST' })
}

export const archiveWatcher = (id: string) => lifecycle(id, '_archive')
export const restoreWatcher = (id: string) => lifecycle(id, '_restore')
export const pauseWatcher = (id: string) => lifecycle(id, '_pause')
export const resumeWatcher = (id: string) => lifecycle(id, '_resume')

/** Dry run against recent messages, without firing any events. */
export function testWatcher(watcherId: string, sampleSize?: number): Promise<TestWatcherResponse> {
  return request<TestWatcherResponse>(`/api/watchers/${watcherId}/_test`, {
    method: 'POST',
    body: sampleSize ? { sample_size: sampleSize } : {},
  })
}

export function getWatcherStats(watcherId: string, days?: number): Promise<WatcherStatsResponse> {
  return request<WatcherStatsResponse>(`/api/watchers/${watcherId}/stats`, {
    query: { days },
  })
}

export function listFilters(watcherId: string): Promise<WatcherFilterResponse[]> {
  return request<WatcherFilterResponse[]>(`/api/watchers/${watcherId}/filters`)
}

/**
 * Replaces the watcher's entire filter set — this is a PUT, not a patch, so the
 * array sent is the complete set and anything omitted is deleted.
 */
export function replaceFilters(
  watcherId: string,
  body: ReplaceFiltersRequest,
): Promise<WatcherFilterResponse[]> {
  return request<WatcherFilterResponse[]>(`/api/watchers/${watcherId}/filters`, {
    method: 'PUT',
    body,
  })
}
