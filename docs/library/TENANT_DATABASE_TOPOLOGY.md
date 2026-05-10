> **Scope:** Pre-release launch architecture for Azure SQL: one **system** database (tenant routing, provisioning state, authoritative directory for cross-tenant queries) and one **product** database per tenant (runs, artifacts, governance, billing tables tied to local `dbo.Tenants`, RLS, workspaces). No backfill of production customer data.

## Objective

Establish a clear **cut line** between **system-plane** and **tenant-plane** data so ArchLucid can run **database-per-tenant** with elastic pools while keeping Dapper + DbUp and Terraform-representable infra.

## Assumptions

- Greenfield / pre-release only: unreleased shared-catalog assumptions may be replaced without long-lived compatibility shims.
- `TenantId`, `WorkspaceId`, and `ProjectId` remain on tenant-scoped rows for export integrity and application-layer scope enforcement.
- In `SystemWithPerTenantCatalogs` mode the **database boundary is the primary and sufficient tenant isolation mechanism**. RLS is not required for defense-in-depth and ships disabled (`STATE = OFF`) by default. It is available as optional configuration but is not a production requirement.
- Each **tenant catalog** still contains a **`dbo.Tenants` row (mirror)** so existing FKs (`TenantWorkspaces`, `TenantTrialSeatOccupants`, billing, SCIM links to runs, etc.) continue without a multi-year DDL rewrite in phase 1.
- **Hosted trial and hosted commercial tenants share the same supported cut line:** each organization gets **its own product SQL catalog** (bindings + provisioning). **There is no supported model** where multiple trial tenants co-reside in **one shared product database** for isolation—that pattern is explicitly out of scope.

## Non-goals (this pass)

- No customer data migration from a shared catalog into split catalogs.
- **No** removal of `TenantId` / workspace / project columns.
- **No** removal of RLS policies.
- **No** introduction of EF Core or non-Azure primary data stores.

## System vs tenant table ownership (by family)

| Table family | Plane | Notes |
|--------------|--------|--------|
| `TenantDatabaseBindings`, `TenantDatabaseProvisioningJobs` | **System** | Routing, provisioning lifecycle, no tenant `TenantId` FK to product tables. |
| `dbo.Tenants` (authoritative directory columns) | **System** | Slug uniqueness, suspension for routing, tier for commercial filter, list-all-tenants admin paths. |
| `dbo.Tenants` (mirror row) | **Tenant** | Same `Id` as system; satisfies FKs for workspace, trial seats, lifecycle transitions, billing ledger, SCIM-local linkage. Synced at provisioning (insert mirror after migrate) and on key catalog mutations where required. |
| `TenantWorkspaces` | **Tenant** | Product scope; RLS by `TenantId`. |
| Runs, manifests, graph/findings, authority pipeline, artifacts | **Tenant** | Core product. |
| Audit (pipeline / product) | **Tenant** | Tenant-local audit events. |
| Alerts, advisory, conversations, recommendations | **Tenant** | Product plane. |
| Billing ledger / subscriptions (SQL tables) | **Tenant** | FK to local `Tenants`; commercial truth still coordinated with system directory. |
| Marketing / quote requests (if present) | **System** | Cross-tenant GTM; if a deployment co-locates in tenant DB today, treat as transitional—target system for global funnel. |
| SCIM directory (`ScimUsers`, `ScimGroups`, tokens) | **Tenant** (default) | Keeps FK graph with tenant-local `Tenants`; SCIM provisioning jobs may reference system bindings. |
| Host leader leases | **System** (global coordination) or **Tenant** (tenant-scoped jobs)—deployment choice; default **system** for single coordinator unless lease is per-tenant job partition. |
| Usage events, ROI aggregates | **Tenant** / **System** split by whether aggregation is cross-tenant; default **tenant** for metered product rows. |
| Trial funnel operational stores | **Tenant** where tied to runs/workspaces; **System** for cross-tenant metrics snapshots if introduced. |
| Onboarding / first-session hooks (state tables) | **Tenant** | Scoped to tenant workspace. |
| ITSM correlations | **Tenant** | Scoped to findings/runs. |
| Notifications preferences / webhooks | **Tenant** | Scoped configuration. |

## Launch cut line

1. **Configuration** exposes `ArchLucid:SqlTopology:Mode` (`SingleCatalog` default vs `SystemWithPerTenantCatalogs`).
2. **System** catalog runs **DbUp scripts under** `Migrations/System/` only (`DatabaseMigrator.RunSystem`).
3. **Tenant** catalogs run **all other embedded migrations** (`DatabaseMigrator.RunTenant`).
4. **API/Worker** resolve product `ISqlConnectionFactory` via `ITenantDatabaseResolver` + scope `TenantId` when in per-tenant mode.
5. **Provisioning** must not mark a tenant **active for product writes** until tenant DB migrations succeed and binding state is **Active** (see application provisioning service).

## Security

- System DB is highest sensitivity for **routing and provisioning**; protect with private endpoints, least-privilege identities, Key Vault–backed secrets.
- Tenant DB credentials scoped per pool/database; provisioning identity separate from runtime app identity where possible.
- Support bundles and logs: **no** full tenant connection strings; redact server/database where appropriate (see ops docs).

## Operational notes

- Health/readiness should distinguish **system** reachability from **sample tenant** DB failure without fan-out to all tenants each request.
- Local dev may use `SingleCatalog` or a small **system + one tenant** SQL pair with explicit binding rows.

### Signup latency: warm catalogs in elastic pools

**Goal:** Hold a small standby of **already-migrated tenant product catalogs** in an elastic pool so a new signup does **not** pay `DatabaseMigrator.RunTenant` latency on the hot path — only binding, optional **logical rename** to match `TenantDatabaseNaming.SqlLogicalNameForTenant(tenantId)`, and **`MirrorTenantRowFromSystemAsync`**.

**Why it fits pooling:** Idle databases in an elastic pool still share compute with other DBs on the pool; provisioning **new** DBs repeatedly competes with **storage + migration time**. Pre-migrated empties amortize DDL over background refill.

**Operational pattern (hosted):**

1. **Background replenish** maintains **N &ge; signup burst** catalogs with schema baseline applied and **no tenant-specific rows** (`dbo.Tenants` empty until claim).
2. **Claim:** On signup, assign the next standby to the tenant: update **`TenantDatabaseBindings`** from a reserved “warm” sentinel to **`Pending` → migrate/mirror/active** semantics (today `SqlTenantSqlCatalogProvisioner` always runs **`RunTenant`**; a fast path **skips** `RunTenant` when the standby is already baseline-equal and jumps to **`MirrorTenantRowFromSystemAsync` + MarkActive`).
3. **Rename** (if desired for operational clarity): rename the standby logical database server-side to match canonical tenant naming (**Azure SQL** supports `ALTER DATABASE … MODIFY NAME` within the logical server).

**Trade-offs**

- **Cost:** Standby catalogs consume **minimum file size/storage** pool-side even when lightly used; sizing **N** is a **signup p95 SLA vs idle storage** knob (spreadsheet belongs in **`CAPACITY_AND_COST_PLAYBOOK.md`**).
- **Safety:** Warm DBs must **never** be routable via **`ITenantDatabaseResolver`** until bindings show **claimed + Active** after control-plane **`dbo.Tenants`** insert succeeds (avoid serving traffic against the wrong standby).
- **Drift:** New migrations ship → either **migrate standbys idle** before claim or expire/rebuild stale warm DBs (`RunTenant` is idempotent; policy choice).

See **TB-018** in **`TECH_BACKLOG.md`** for the implementation slice (provisioner/refill job + IaC knobs).

## Alternatives considered

- **Drop all `FK -> Tenants` in tenant DB** and remove mirror `Tenants` row: reduces duplication but requires broad DDL and regression risk—deferred.
- **Single `Tenants` only on system** and move every child table with FK to system: contradicts database-per-tenant product isolation—rejected for product tables.
