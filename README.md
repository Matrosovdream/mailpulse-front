# MailPulse — Frontend

Vue 3 SPA for the [MailPulse](../mailpulse-golang) API.

## Setup

```sh
npm install
cp .env.example .env    # set VITE_API_BASE_URL if the API is not on :3000
npm run dev             # http://localhost:5173
```

The dev server is pinned to port **5173** because the backend ships
`WEB_CORS_ORIGINS=http://localhost:5173`. Moving the port means updating that
too, or every request fails preflight.

## Scripts

| Script | |
|---|---|
| `npm run dev` | Dev server on :5173 |
| `npm run build` | Typecheck, then production build to `dist/` |
| `npm run typecheck` | `vue-tsc` only |
| `npm run api:types` | Regenerate `src/api/schema.d.ts` from `docs/api/openapi.yaml` |

Run `api:types` after re-syncing the spec — see [docs/README.md](docs/README.md).

## Layout

```
src/
  api/          client, generated types, per-tag endpoint modules
  config/       env reading + validation
  stores/       pinia — auth session
  router/       routes, guard, role-filtered navigation
  layouts/      public/ · auth/ · dashboard/   ← the three template groups
  views/        public/ · auth/ · dashboard/
  components/   shared UI
  styles/       tailwind theme + per-surface tokens
```

### The three template groups

`public`, `auth` and `dashboard` each have a layout that sets
`data-surface="…"` on its root. That attribute selects a set of semantic CSS
variables in `src/styles/main.css` — surface colours, panel radius, shadow.

Components inside use only the semantic utility (`bg-surface-raised`,
`rounded-panel`, `text-muted`), so the same component resolves to a soft, roomy
card in the auth area and a tight, flat one in the dashboard. This is what keeps
the three areas from converging on one Tailwind look while sharing one component
set.

`public` is a reserved stub for marketing and presentation pages.

## Running with Docker

Two stacks, each with its own compose project name so they can run side by side
without one tearing the other down.

### Development — Vite dev server with HMR

```sh
docker compose -f docker-compose.dev.yml up --build
```

Serves on **:5173** with the source bind-mounted, so host edits hot-reload. File
watching uses polling (`VITE_USE_POLLING=true`, the default here) because Docker
bind mounts on macOS and Windows do not deliver inotify events.

### Production — built bundle behind nginx

```sh
VITE_API_BASE_URL=https://api.example.com \
  docker compose -f docker-compose.prod.yml up --build -d
```

Serves on **:8080** by default (`WEB_PORT` to change it). nginx handles SPA
routing, gzip, cache headers and the security headers below.

### The API is not in either stack — and does not need to be

The SPA's requests are made by the **user's browser**, not by the container. So
`VITE_API_BASE_URL` must be an address the *browser* can reach — the
`http://localhost:3000` your backend stack already publishes. No shared Docker
network is required.

### `VITE_API_BASE_URL` is a build argument, not a runtime one

Vite inlines `import.meta.env` at build time, so the API origin is compiled into
the bundle. Setting it on a running container does nothing; changing it needs a
rebuild, and each image is specific to one environment.

That is the standard tradeoff, and the alternative if you outgrow it is to have
`index.html` load a small generated `config.js` before the bundle, so one image
can be deployed to every environment. Worth doing when you have more than a
couple of environments; not worth the indirection before then.

## Content-Security-Policy

The token lives in `localStorage` (see above), so an XSS bug is a session
compromise. CSP is the mitigation that meaningfully offsets that: it stops
injected script from executing, and stops anything that does execute from
sending the token anywhere.

Production policy is set by nginx in [`docker/nginx.conf.template`](docker/nginx.conf.template);
the dev server sets its own in [`vite.config.ts`](vite.config.ts) so a violation
surfaces during development rather than after deploy.

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self' data:;
connect-src 'self' <API_ORIGIN>; worker-src 'self';
base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'
```

Three things about it are worth knowing before you edit it:

**`connect-src` must name the API.** It is a different origin from the app, so
`'self'` alone blocks every request the SPA makes. Both the bundle and the CSP
take it from the same build argument, so they cannot drift apart.

**`script-src` needs no escape hatch.** The production build emits zero inline
scripts — `dist/index.html` is two external references. That is the strictest
form of the directive and it works here as-is.

**`style-src 'unsafe-inline'` is future-proofing, not a current need.** The build
has no inline styles either, so you could tighten it to `'self'` today. It is
here because Vue `:style` bindings produce real inline style attributes, and the
first one added would otherwise break silently. Tighten it only if you commit to
avoiding `:style`.

Dev additionally allows `worker-src blob:` and `connect-src ws:`. The WebSocket
is HMR; the blob worker is what Vite spawns to ping the server after the socket
drops, so without it the page silently stops auto-reloading after every dev
server restart.

### The nginx trap this config avoids

nginx does **not** inherit `add_header` into a nested block that declares any
`add_header` of its own. A `location /assets/` setting only `Cache-Control`
would therefore drop the CSP and every other security header for all your
JavaScript. The config expresses cache policy with `expires` instead, which is a
different directive and leaves inheritance intact. Verified: assets come back
with the full header set and a one-year cache.

If you ever want `Cache-Control: immutable` on assets, you have to repeat the
whole security header block inside that location.

## How access control works

**The router guard is not the security boundary.** Anyone can edit the store in
devtools and reach `/dashboard`; what they get is an empty shell, because the
API rejects every request it makes.

Enforcement is server-side, structural, and already built — the backend splits
its surface into three route groups:

| Group | Middleware |
|---|---|
| public (7 endpoints) | rate limit only |
| `/api/*` (55) | auth middleware |
| `/api/admin/*` (12) | auth middleware **+** `RequireRole(superadmin)` |

The frontend adds three non-security layers on top:

1. **Guard** (`src/router/index.ts`) — redirects to `/login?next=…`, or
   `/forbidden` on a role mismatch. Keeps honest users out of dead screens.
2. **Client interceptor** (`src/api/client.ts`) — a 401 tears down the session,
   a 403 does not.
3. **Menu filtering** (`src/router/navigation.ts`) — hides admin items. Purely
   cosmetic.

### Two details worth knowing

**A 401 does not reliably mean "session expired".** The backend mounts auth on
the whole `/api` group, so an unmatched path — a typo'd endpoint URL — also
answers 401 rather than 404. `handleUnauthorized` in `src/stores/auth.ts`
therefore confirms against `/api/users/_current` before logging anyone out, so a
frontend bug cannot sign the user out.

**The token is readable by script, unavoidably.** The API is bearer-only:
its CORS middleware sets `AllowCredentials: false` and the backend documents
that a session is "a bearer token in the Authorization header, not a cookie". An
httpOnly cookie is not available to us, and there is no refresh endpoint, so the
token is persisted in `localStorage` (7-day TTL). **An XSS bug is therefore a
session compromise.** The defences that matter are a strict CSP, never rendering
server-derived strings with `v-html`, and dependency hygiene.

## API conventions

Every response is `{ data, paging?, errors? }`; the client unwraps `data` and
raises `ApiError` with the server's own message otherwise. Every timestamp is
**integer epoch milliseconds**, not RFC 3339. Only `Authorization` and
`Content-Type` may be sent — the CORS allowlist names exactly those two.

See [docs/README.md](docs/README.md) and
[docs/api/endpoints.md](docs/api/endpoints.md).
