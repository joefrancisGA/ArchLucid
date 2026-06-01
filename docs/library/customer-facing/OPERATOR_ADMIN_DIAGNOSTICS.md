> **Scope:** Operator admin diagnostics — health surfaces and readiness signals. Not a substitute for engineering runbooks.

# Admin diagnostics

Use these checks when an operator symptom points to platform health rather than a single review package.

## Start here

1. Open **System status** (`/health`) in the operator shell — live/ready checks and version identity.
2. On Home, expand **Workspace readiness** — per-area status and next actions.
3. Open **Assistant readiness diagnostics** on Home when LLM or assistant features fail.

## What each signal means

| Signal | Healthy | Needs attention |
|--------|---------|-----------------|
| API readiness | Ready | Open System status; capture correlation id from any failed call |
| SQL / storage | Configured | Check readiness row for database or blob configuration |
| Search index | Ready when enabled | Degraded search may block global search — note scope |
| Assistant / LLM | Within budget | Trial or budget banners on Home explain limits |

## Related Help topics

- **Observability** — metrics and export paths when your role includes them.
- **Projection cache and API replicas** — multi-replica and Redis footguns (advanced).
- **Engineering troubleshooting runbook** — CLI, logs, environment variables, and support bundles.
