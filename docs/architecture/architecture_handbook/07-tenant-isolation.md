# 7. Tenant isolation

**Normative model (ADR 0037):** production isolation is **database-per-tenant catalogs**, not SQL RLS. Workspace and project are organizational dimensions within a catalog, not paying-client security boundaries. `SingleCatalog` is fail-fast in production-like hosts.

## Diagram

![Tenant isolation](../architecture_diagrams/archlucid-tenant-isolation.svg)

Trusted scope on production-like hosts comes from JWT/API-key claims or ambient job override — not from `x-tenant-id` headers alone. See `docs/security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`.
