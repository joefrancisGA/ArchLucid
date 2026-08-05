# Tenant migration fan-out

When a tenant moves between database catalogs or workspaces, ArchLucid uses an orchestrated fan-out so no surface reads stale scope after cutover.

## Fan-out stages

1. **Scope resolution freeze** — block new writes for the tenant during the migration window (maintenance banner in operator shell).
2. **Catalog attach/detach** — database-per-tenant catalog move per `TENANT_DATABASE_TOPOLOGY.md`; connection strings updated in Key Vault references only (no secrets in repo).
3. **Projection refresh** — search indexes, cached nav preferences, and ROI rollups rebuild from committed runs in the target catalog.
4. **Verification** — authorization boundary smoke tests and a single finalized-review read/write probe before reopening writes.

## What operators see

- Maintenance messaging on value-report and governance surfaces during the window.
- Audit events for migration start/complete with actor and correlation id.
- No silent data merge across tenants — fan-out is per-tenant only.

## Related

- [TENANT_LIFECYCLE.md](../library/customer-facing/TENANT_LIFECYCLE.md)
- [DATA_HANDLING.md](../library/customer-facing/DATA_HANDLING.md)

## Engineering backlog (round 3 — 2026-08-04)

| ID | Title |
| --- | --- |
| **TB-2045** | Tenant migration maintenance banner on value-report/governance surfaces |
| **TB-2046** | Post-cutover projection refresh orchestration for tenant catalog moves |
| **TB-2047** | Automated tenant migration verification probe before reopening writes |

Authoritative tracking: [`docs/library/TECH_BACKLOG_OPEN.md`](../library/TECH_BACKLOG_OPEN.md) § TB-2042–TB-2047.
