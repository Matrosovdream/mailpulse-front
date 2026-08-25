import type { components } from './schema'

export type Schemas = components['schemas']

export type RoleSlug = Schemas['RoleSlug']
export type UserResponse = Schemas['UserResponse']
export type LoginResponse = Schemas['LoginResponse']
export type SessionResponse = Schemas['SessionResponse']
export type PageMetadata = Schemas['PageMetadata']

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
