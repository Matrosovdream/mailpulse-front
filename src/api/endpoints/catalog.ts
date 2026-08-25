import { request } from '../client'
import type {
  EventTypeResponse,
  FilterFieldResponse,
  MailProviderResponse,
  NotifierTypeResponse,
} from '../types'

/**
 * Registry-driven descriptors.
 *
 * Each of these returns a `config_schema` describing the fields its plug-in
 * accepts. The connect, notifier and event forms are rendered from those
 * schemas rather than hard-coded, so a provider or handler added on the server
 * shows up here without a frontend release.
 */

export function listMailProviderTypes(): Promise<MailProviderResponse[]> {
  return request<MailProviderResponse[]>('/api/mail-provider-types')
}

export function listEventTypes(): Promise<EventTypeResponse[]> {
  return request<EventTypeResponse[]>('/api/event-types')
}

export function listNotifierTypes(): Promise<NotifierTypeResponse[]> {
  return request<NotifierTypeResponse[]>('/api/notifier-types')
}

export function listFilterFields(): Promise<FilterFieldResponse[]> {
  return request<FilterFieldResponse[]>('/api/filter-fields')
}
