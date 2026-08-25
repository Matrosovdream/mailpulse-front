import { request, requestPage } from '../client'
import type {
  CreateMailAccountRequest,
  FolderResponse,
  MailAccountResponse,
  MailSyncRunResponse,
  OAuthAuthorizeResponse,
  Page,
  SyncMailAccountResponse,
  UpdateMailAccountRequest,
  VerifyMailAccountResponse,
} from '../types'

export type ListMailAccountsQuery = {
  page?: number
  size?: number
  status?: string
  provider?: string
}

export function listMailAccounts(query: ListMailAccountsQuery = {}): Promise<Page<MailAccountResponse>> {
  return requestPage<MailAccountResponse>('/api/mail-accounts', { query })
}

export function getMailAccount(accountId: string): Promise<MailAccountResponse> {
  return request<MailAccountResponse>(`/api/mail-accounts/${accountId}`)
}

export function createMailAccount(body: CreateMailAccountRequest): Promise<MailAccountResponse> {
  return request<MailAccountResponse>('/api/mail-accounts', { method: 'POST', body })
}

export function updateMailAccount(
  accountId: string,
  body: UpdateMailAccountRequest,
): Promise<MailAccountResponse> {
  return request<MailAccountResponse>(`/api/mail-accounts/${accountId}`, { method: 'PATCH', body })
}

export function deleteMailAccount(accountId: string): Promise<boolean> {
  return request<boolean>(`/api/mail-accounts/${accountId}`, { method: 'DELETE' })
}

/** Checks the stored credentials against the mail server. */
export function verifyMailAccount(accountId: string): Promise<VerifyMailAccountResponse> {
  return request<VerifyMailAccountResponse>(`/api/mail-accounts/${accountId}/_verify`, {
    method: 'POST',
  })
}

/** Runs a sync immediately rather than waiting for the next poll. */
export function syncMailAccount(accountId: string): Promise<SyncMailAccountResponse> {
  return request<SyncMailAccountResponse>(`/api/mail-accounts/${accountId}/_sync`, {
    method: 'POST',
  })
}

export function listFolders(accountId: string): Promise<FolderResponse[]> {
  return request<FolderResponse[]>(`/api/mail-accounts/${accountId}/folders`)
}

export function listSyncRuns(
  accountId: string,
  query: { page?: number; size?: number } = {},
): Promise<Page<MailSyncRunResponse>> {
  return requestPage<MailSyncRunResponse>(`/api/mail-accounts/${accountId}/sync-runs`, { query })
}

/**
 * Starts an OAuth connect flow. The response carries the provider's consent URL
 * to send the browser to; the provider then calls the public `_callback`
 * endpoint, which is why that one needs no session.
 */
export function authorizeOAuth(provider: string): Promise<OAuthAuthorizeResponse> {
  return request<OAuthAuthorizeResponse>(`/api/mail-accounts/oauth/${provider}/_authorize`)
}
