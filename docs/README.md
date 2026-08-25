# MailPulse Frontend — Docs

Reference material for building the MailPulse client. Start here.

| File | What it is |
|---|---|
| [`api/openapi.yaml`](api/openapi.yaml) | The full OpenAPI 3.1 spec. Source of truth for every request and response. |
| [`api/endpoints.md`](api/endpoints.md) | All 74 endpoints in one table, grouped by tag. Navigation aid. |

## Where the spec comes from

The spec is **owned by the backend repo**, not this one:

```
../mailpulse-golang/api/openapi.yaml   →   docs/api/openapi.yaml
```

`docs/api/openapi.yaml` is a **copy**. When the backend changes, re-sync it:

```sh
cp ../mailpulse-golang/api/openapi.yaml docs/api/openapi.yaml
```

Do not hand-edit the copy — changes belong upstream, or they get overwritten on
the next sync.

## API surface at a glance

- **Base URL** — `http://localhost:3000` in development.
- **74 endpoints / 58 paths / 79 schemas**, spanning auth, mail accounts,
  notifiers, watchers (filters + events), activity, and admin.
- Action endpoints use a leading underscore: `POST /api/watchers/{id}/_pause`,
  `POST /api/mail-accounts/{id}/_verify`.

## Conventions that affect every client call

### Response envelope

Every JSON response is wrapped in the same envelope:

```json
{ "data": "<payload>", "paging": { }, "errors": "..." }
```

- `data` — the payload. Absent on errors.
- `paging` — only on paginated list endpoints.
- `errors` — only on failures, and is then the **sole** field. A string, not an
  object or array.

Unwrap `data` in one shared HTTP layer rather than at each call site.

### Timestamps

Every timestamp is an **integer count of milliseconds since the Unix epoch** —
never an RFC 3339 string. The `from` and `to` filters on list endpoints take the
same unit. Convert at the display boundary.

### Authentication

Send the session token from `POST /api/users/_login` as a bearer token:

```
Authorization: Bearer <token>
```

The auth middleware also accepts the bare token with no `Bearer ` prefix. Tokens
are cached in Redis against their hash; revoking a session or changing a user's
roles evicts the cached entry immediately, so a revoked token stops working at
once rather than at TTL.

Seven endpoints need no session — health, register, login, the two
password-reset calls, the OAuth callback, and the Telegram webhook. Everything
else returns `401` without a valid token.

Admin endpoints additionally require the `superadmin` role.

### Configuration-driven forms

This one shapes the frontend architecture. The four catalog endpoints —
`/api/mail-provider-types`, `/api/event-types`, `/api/notifier-types`,
`/api/filter-fields` — each return a `config_schema` describing that plug-in's
fields.

**Render the connect, event, notifier and filter forms from those schemas
rather than hard-coding the fields.** Adding a provider or handler on the server
then needs no client release. Building a static form per provider gives up the
main design benefit of the API.

## Rate limits

Login is rate limited per IP — 30 attempts per 5 minutes by default
(`SECURITY_RATELIMIT_LOGIN_ATTEMPTS` / `_WINDOW`). Handle `429` on the login
path.
