# MailPulse API — Endpoint Reference

Every endpoint in the MailPulse backend, grouped by tag. Generated from
[`openapi.yaml`](openapi.yaml) — that file is the source of truth; this page is
a navigation aid. See [`../README.md`](../README.md) for conventions
(response envelope, timestamps, auth, pagination).

**74 endpoints across 58 paths.** `Auth` column: `bearer` needs
`Authorization: Bearer <token>`; `public` needs no session.


## Health

Liveness and dependency status.

_1 endpoint(s)._

| Method | Path | Summary | Auth |
|---|---|---|---|
| `GET` | `/api/health` | Service health | public |

## Auth

Registration, login, and password recovery. Unauthenticated.

_4 endpoint(s)._

| Method | Path | Summary | Auth |
|---|---|---|---|
| `POST` | `/api/users` | Register a user | public |
| `POST` | `/api/users/_login` | Log in | public |
| `POST` | `/api/users/_forgot-password` | Request a password reset | public |
| `POST` | `/api/users/_reset-password` | Complete a password reset | public |

## Account

The signed-in user's own profile and active sessions.

_5 endpoint(s)._

| Method | Path | Summary | Auth |
|---|---|---|---|
| `DELETE` | `/api/users` | Log out | bearer |
| `GET` | `/api/users/_current` | Get the signed-in user | bearer |
| `PATCH` | `/api/users/_current` | Update the signed-in user | bearer |
| `GET` | `/api/users/_sessions` | List active sessions | bearer |
| `DELETE` | `/api/users/_sessions/{sessionId}` | Revoke a session | bearer |

## Catalog

Registry-driven descriptors that let a client render its forms from the server's capabilities.

_4 endpoint(s)._

| Method | Path | Summary | Auth |
|---|---|---|---|
| `GET` | `/api/mail-provider-types` | List connectable mail providers | bearer |
| `GET` | `/api/event-types` | List event handler types | bearer |
| `GET` | `/api/notifier-types` | List notifier channel types | bearer |
| `GET` | `/api/filter-fields` | List filterable message fields | bearer |

## Mail Accounts

Connected mailboxes, their credentials, verification and sync history.

_11 endpoint(s)._

| Method | Path | Summary | Auth |
|---|---|---|---|
| `GET` | `/api/mail-accounts` | List connected mail accounts | bearer |
| `POST` | `/api/mail-accounts` | Connect a mail account | bearer |
| `GET` | `/api/mail-accounts/oauth/{provider}/_authorize` | Begin an OAuth connect flow | bearer |
| `GET` | `/api/mail-accounts/oauth/{provider}/_callback` | Complete an OAuth connect flow | public |
| `GET` | `/api/mail-accounts/{accountId}` | Get a mail account | bearer |
| `PATCH` | `/api/mail-accounts/{accountId}` | Update a mail account | bearer |
| `DELETE` | `/api/mail-accounts/{accountId}` | Delete a mail account | bearer |
| `POST` | `/api/mail-accounts/{accountId}/_verify` | Verify credentials | bearer |
| `POST` | `/api/mail-accounts/{accountId}/_sync` | Sync now | bearer |
| `GET` | `/api/mail-accounts/{accountId}/folders` | List mailbox folders | bearer |
| `GET` | `/api/mail-accounts/{accountId}/sync-runs` | List sync history | bearer |

## Notifiers

Delivery channels — Telegram, Slack, Discord, SMS, email, webhook.

_7 endpoint(s)._

| Method | Path | Summary | Auth |
|---|---|---|---|
| `GET` | `/api/notifiers` | List notifiers | bearer |
| `POST` | `/api/notifiers` | Create a notifier | bearer |
| `GET` | `/api/notifiers/{notifierId}` | Get a notifier | bearer |
| `PATCH` | `/api/notifiers/{notifierId}` | Update a notifier | bearer |
| `DELETE` | `/api/notifiers/{notifierId}` | Delete a notifier | bearer |
| `POST` | `/api/notifiers/{notifierId}/_verify` | Verify a notifier | bearer |
| `POST` | `/api/notifiers/{notifierId}/_test` | Send a test notification | bearer |

## Watchers

Rules that match incoming mail on a connected account.

_11 endpoint(s)._

| Method | Path | Summary | Auth |
|---|---|---|---|
| `GET` | `/api/watchers` | List watchers | bearer |
| `POST` | `/api/watchers` | Create a watcher | bearer |
| `GET` | `/api/watchers/{watcherId}` | Get a watcher | bearer |
| `PATCH` | `/api/watchers/{watcherId}` | Update a watcher | bearer |
| `DELETE` | `/api/watchers/{watcherId}` | Delete a watcher | bearer |
| `POST` | `/api/watchers/{watcherId}/_archive` | Archive a watcher | bearer |
| `POST` | `/api/watchers/{watcherId}/_restore` | Restore an archived watcher | bearer |
| `POST` | `/api/watchers/{watcherId}/_pause` | Pause a watcher | bearer |
| `POST` | `/api/watchers/{watcherId}/_resume` | Resume a watcher | bearer |
| `POST` | `/api/watchers/{watcherId}/_test` | Dry-run the filters | bearer |
| `GET` | `/api/watchers/{watcherId}/stats` | Watcher statistics | bearer |

## Watcher Filters

The match conditions on a watcher, edited as a complete set.

_2 endpoint(s)._

| Method | Path | Summary | Auth |
|---|---|---|---|
| `GET` | `/api/watchers/{watcherId}/filters` | List a watcher's filters | bearer |
| `PUT` | `/api/watchers/{watcherId}/filters` | Replace a watcher's filters | bearer |

## Watcher Events

The ordered actions a watcher fires when a message matches.

_7 endpoint(s)._

| Method | Path | Summary | Auth |
|---|---|---|---|
| `GET` | `/api/watchers/{watcherId}/events` | List a watcher's events | bearer |
| `POST` | `/api/watchers/{watcherId}/events` | Add an event to a watcher | bearer |
| `POST` | `/api/watchers/{watcherId}/events/_reorder` | Reorder a watcher's events | bearer |
| `GET` | `/api/watchers/{watcherId}/events/{eventId}` | Get a watcher event | bearer |
| `PATCH` | `/api/watchers/{watcherId}/events/{eventId}` | Update a watcher event | bearer |
| `DELETE` | `/api/watchers/{watcherId}/events/{eventId}` | Delete a watcher event | bearer |
| `POST` | `/api/watchers/{watcherId}/events/{eventId}/_test` | Fire an event once, for real | bearer |

## Activity

Matched emails, event runs, deliveries, and the dashboard rollup.

_9 endpoint(s)._

| Method | Path | Summary | Auth |
|---|---|---|---|
| `GET` | `/api/matches` | List matched emails | bearer |
| `GET` | `/api/matches/{matchId}` | Get a matched email | bearer |
| `GET` | `/api/event-runs` | List event runs | bearer |
| `GET` | `/api/event-runs/{runId}` | Get an event run | bearer |
| `POST` | `/api/event-runs/{runId}/_retry` | Retry a failed run | bearer |
| `POST` | `/api/event-runs/{runId}/_cancel` | Cancel pending runs | bearer |
| `POST` | `/api/event-runs/{runId}/_ack` | Acknowledge a run | bearer |
| `GET` | `/api/deliveries` | List notification deliveries | bearer |
| `GET` | `/api/dashboard/summary` | Dashboard rollup | bearer |

## Admin

Superadmin-only. Requires the `superadmin` role.

_12 endpoint(s)._

| Method | Path | Summary | Auth |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Instance statistics | bearer |
| `GET` | `/api/admin/users` | List all users | bearer |
| `GET` | `/api/admin/users/{userId}` | Get any user | bearer |
| `PATCH` | `/api/admin/users/{userId}` | Update any user | bearer |
| `POST` | `/api/admin/users/{userId}/_suspend` | Suspend a user | bearer |
| `POST` | `/api/admin/users/{userId}/_restore` | Restore a suspended user | bearer |
| `POST` | `/api/admin/users/{userId}/_impersonate` | Impersonate a user | bearer |
| `GET` | `/api/admin/watchers` | List watchers across all users | bearer |
| `GET` | `/api/admin/mail-accounts` | List mail accounts across all users | bearer |
| `GET` | `/api/admin/notifiers` | List notifiers across all users | bearer |
| `GET` | `/api/admin/event-runs` | List event runs across all users | bearer |
| `GET` | `/api/admin/audit-logs` | List audit log entries | bearer |

## Webhooks

Endpoints called by third parties, authenticated by their own payload rather than a session.

_1 endpoint(s)._

| Method | Path | Summary | Auth |
|---|---|---|---|
| `POST` | `/api/webhooks/telegram` | Telegram Bot API webhook | public |
