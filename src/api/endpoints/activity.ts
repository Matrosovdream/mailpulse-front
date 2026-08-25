import { request, requestPage } from '../client'
import type {
  AckRunResponse,
  CancelRunResponse,
  DashboardSummaryResponse,
  DeliveryResponse,
  EventRunResponse,
  MatchedEmailResponse,
  Page,
} from '../types'

/** `from` and `to` are Unix milliseconds, like every other timestamp here. */
export type ListMatchesQuery = {
  page?: number
  size?: number
  watcher_id?: string
  mail_account_id?: string
  q?: string
  from?: number
  to?: number
}

export function listMatches(query: ListMatchesQuery = {}): Promise<Page<MatchedEmailResponse>> {
  return requestPage<MatchedEmailResponse>('/api/matches', { query })
}

/** Single reads include the runs this match triggered. */
export function getMatch(matchId: string): Promise<MatchedEmailResponse> {
  return request<MatchedEmailResponse>(`/api/matches/${matchId}`)
}

export type ListRunsQuery = {
  page?: number
  size?: number
  watcher_id?: string
  status?: string
  from?: number
  to?: number
}

export function listRuns(query: ListRunsQuery = {}): Promise<Page<EventRunResponse>> {
  return requestPage<EventRunResponse>('/api/event-runs', { query })
}

/** Single reads include the deliveries this run produced. */
export function getRun(runId: string): Promise<EventRunResponse> {
  return request<EventRunResponse>(`/api/event-runs/${runId}`)
}

export function retryRun(runId: string): Promise<EventRunResponse> {
  return request<EventRunResponse>(`/api/event-runs/${runId}/_retry`, { method: 'POST' })
}

/** Cancels this run's pending occurrences. */
export function cancelRun(runId: string): Promise<CancelRunResponse> {
  return request<CancelRunResponse>(`/api/event-runs/${runId}/_cancel`, { method: 'POST' })
}

/**
 * Acknowledges a run. When the event was created with `stop_on_ack`, this also
 * cancels its remaining occurrences — the count comes back in the response.
 */
export function ackRun(runId: string): Promise<AckRunResponse> {
  return request<AckRunResponse>(`/api/event-runs/${runId}/_ack`, { method: 'POST' })
}

export type ListDeliveriesQuery = {
  page?: number
  size?: number
  event_run_id?: string
  notifier_id?: string
  status?: string
  from?: number
  to?: number
}

export function listDeliveries(query: ListDeliveriesQuery = {}): Promise<Page<DeliveryResponse>> {
  return requestPage<DeliveryResponse>('/api/deliveries', { query })
}

export function getDashboardSummary(): Promise<DashboardSummaryResponse> {
  return request<DashboardSummaryResponse>('/api/dashboard/summary')
}
