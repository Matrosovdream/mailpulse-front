import type { components } from './schema'

export type Schemas = components['schemas']

export type RoleSlug = Schemas['RoleSlug']
export type UserResponse = Schemas['UserResponse']
export type LoginResponse = Schemas['LoginResponse']
export type SessionResponse = Schemas['SessionResponse']
export type PageMetadata = Schemas['PageMetadata']

// ---- catalog
export type Schema = Schemas['Schema']
export type SchemaField = Schemas['SchemaField']
export type MailProviderResponse = Schemas['MailProviderResponse']
export type EventTypeResponse = Schemas['EventTypeResponse']
export type NotifierTypeResponse = Schemas['NotifierTypeResponse']
export type FilterFieldResponse = Schemas['FilterFieldResponse']
export type JSONObject = Schemas['JSONObject']

// ---- mail accounts
export type MailAccountResponse = Schemas['MailAccountResponse']
export type CreateMailAccountRequest = Schemas['CreateMailAccountRequest']
export type UpdateMailAccountRequest = Schemas['UpdateMailAccountRequest']
export type FolderResponse = Schemas['FolderResponse']
export type VerifyMailAccountResponse = Schemas['VerifyMailAccountResponse']
export type SyncMailAccountResponse = Schemas['SyncMailAccountResponse']
export type MailSyncRunResponse = Schemas['MailSyncRunResponse']
export type OAuthAuthorizeResponse = Schemas['OAuthAuthorizeResponse']
export type MailAccountStatus = Schemas['MailAccountStatus']
export type AuthMode = Schemas['AuthMode']
export type SyncStatus = Schemas['SyncStatus']

// ---- notifiers
export type NotifierResponse = Schemas['NotifierResponse']
export type CreateNotifierRequest = Schemas['CreateNotifierRequest']
export type UpdateNotifierRequest = Schemas['UpdateNotifierRequest']
export type VerifyNotifierResponse = Schemas['VerifyNotifierResponse']
export type TestNotifierResponse = Schemas['TestNotifierResponse']
export type NotifierStatus = Schemas['NotifierStatus']

// ---- watchers
export type WatcherResponse = Schemas['WatcherResponse']
export type CreateWatcherRequest = Schemas['CreateWatcherRequest']
export type UpdateWatcherRequest = Schemas['UpdateWatcherRequest']
export type WatcherFilterResponse = Schemas['WatcherFilterResponse']
export type WatcherFilterRequest = Schemas['WatcherFilterRequest']
export type ReplaceFiltersRequest = Schemas['ReplaceFiltersRequest']
export type TestWatcherResponse = Schemas['TestWatcherResponse']
export type WatcherStatsResponse = Schemas['WatcherStatsResponse']
export type WatcherStatus = Schemas['WatcherStatus']
export type MatchMode = Schemas['MatchMode']
export type FilterField = Schemas['FilterField']
export type FilterOperator = Schemas['FilterOperator']

// ---- watcher events
export type WatcherEventResponse = Schemas['WatcherEventResponse']
export type CreateWatcherEventRequest = Schemas['CreateWatcherEventRequest']
export type UpdateWatcherEventRequest = Schemas['UpdateWatcherEventRequest']
export type RunMode = Schemas['RunMode']

// ---- activity
export type MatchedEmailResponse = Schemas['MatchedEmailResponse']
export type EventRunResponse = Schemas['EventRunResponse']
export type DeliveryResponse = Schemas['DeliveryResponse']
export type DashboardSummaryResponse = Schemas['DashboardSummaryResponse']
export type AckRunResponse = Schemas['AckRunResponse']
export type CancelRunResponse = Schemas['CancelRunResponse']
export type RunStatus = Schemas['RunStatus']
export type DeliveryStatus = Schemas['DeliveryStatus']
export type StatusCounts = Schemas['StatusCounts']

/**
 * Every JSON response from the API is wrapped in this envelope. `data` is absent
 * on errors; `errors` is a plain string and is then the only field present.
 */
export interface WebResponse<T> {
  data?: T
  paging?: PageMetadata
  errors?: string
}

/** A list response, after the envelope is unwrapped but with paging preserved. */
export interface Page<T> {
  items: T[]
  paging?: PageMetadata
}

/**
 * Timestamps in this API are integer milliseconds since the Unix epoch, never
 * RFC 3339 strings. The alias exists to make that visible at call sites.
 */
export type EpochMillis = number
