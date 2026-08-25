Form controls shared across the dashboard.

The four catalog endpoints (`/api/mail-provider-types`, `/api/event-types`,
`/api/notifier-types`, `/api/filter-fields`) each return a `config_schema`
describing that plug-in's fields. The connect, event, notifier and filter forms
are meant to be **rendered from those schemas**, not hard-coded per provider —
that is what lets the backend add a provider without a frontend release.

The schema-driven renderer belongs here, alongside the primitive controls it
dispatches to.
