> **Scope:** Normative tenant isolation model for production — **no SQL RLS**. Do not cite RLS as a deployed control without [ADR 0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Tenant isolation — defense in depth (without RLS)

**Status:** Accepted per [ADR 0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md) (2026-06-06).

**Audience:** Engineers, security reviewers, architecture assessments, coding agents.

## Decision summary

| Question | Answer |
|----------|--------|
| Is SQL RLS required in production? | **No.** Removed by migration 148; do not reinstate without a new ADR. |
| What is the primary isolation mechanism? | **Database-per-tenant** (`SystemWithPerTenantCatalogs`) + connection routing. |
| What if app code omits scope predicates in SQL? | **No cross-tenant exposure** when catalog routing is correct (each paying client has a dedicated catalog). Workspace/project are **not** security boundaries within a tenant — missing predicates there are product/UX concerns, not paying-client isolation defects. |
| Are workspace/project security boundaries within a tenant? | **No** (2026-06-06). Organizational/product dimensions only; do not score within-catalog workspace/project bleed as a security gap. |
| Is `SingleCatalog` allowed in prod? | **No** — startup fail-fast in production-like hosts. |

## Layer model

```mermaid
flowchart TB
  subgraph L1["Layer B — Identity & scope"]
    JWT[Entra JWT / API key]
    SC[ScopeContext tenant workspace project]
  end
  subgraph L2["Layer C — HTTP ingress"]
    RT[Route tenant binding filter]
    IDOR[IDOR / scope integration tests]
  end
  subgraph L3["Layer A — Catalog boundary"]
    RES[ITenantDatabaseResolver]
    CAT[(Dedicated tenant SQL catalog)]
  end
  subgraph L4["Layer D — Persistence"]
    REP[Scoped Dapper repositories]
  end
  subgraph L5["Layer E — Blobs & aux"]
    BLOB[ArtifactBlobTenantPaths prefix]
  end
  JWT --> SC --> RT --> REP
  SC --> RES --> CAT
  REP --> CAT
  REP --> BLOB
```

### Layer A — Catalog boundary (primary)

- **Config:** `ArchLucid:SqlTopology:Mode=SystemWithPerTenantCatalogs`
- **Routing:** `ScopedRoutingSqlConnectionFactory`, `ITenantDatabaseResolver`, `TenantDatabaseBindings`
- **Guard:** `ProductionSafetyRules.CollectSingleCatalogDisallowedInProductionLike`
- **Docs:** [`TENANT_DATABASE_TOPOLOGY.md`](../library/TENANT_DATABASE_TOPOLOGY.md), [`TENANT_SQL_TOPOLOGY_RUNBOOK.md`](../operations/TENANT_SQL_TOPOLOGY_RUNBOOK.md)

### Layer B — Identity and typed scope

- Scope derived **once** at host boundary; deeper layers use `IScopeContextProvider` / method parameters — not raw `HttpContext` (see **ARCH001** `TenantIdentityBoundaryAnalyzer`).
- **PA / engineering matrix:** [`TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md`](../library/TENANT_IDENTITY_SINGLE_DERIVATION_CONTRACT.md) (**TB-999**).
- **Invariant:** [INV-001](../library/ARCHITECTURE_INVARIANTS.md#inv-001-tenant-identity-boundary)
- **Fail-closed derivation (TB-304 / ADR 0041):** On production-like hosts, `ScopeResolutionGuardMiddleware` rejects requests whose tenant/workspace/project scope is not bound to **identity claims** or an explicit **ambient job override**. Header-only and `ScopeIds.Default*` resolution return **403** unless the route is marked `[AllowUnscopedRoute]`.

#### Trusted scope sources (production-like)

| Source | Trusted? | Notes |
|--------|----------|-------|
| JWT / API-key `tenant_id`, `workspace_id`, `project_id` claims | Yes | Primary production binding |
| `AmbientScopeContext` override | Yes | Background jobs; must not use `ScopeIds.Default*` |
| `x-tenant-id` / `x-workspace-id` / `x-project-id` headers | **No** | Rejected on production-like (claims win when both present) |
| `ScopeIds.Default*` fallback | **No** | Development/CI only |

#### Allow-list contract

- **`[AllowUnscopedRoute]`** — marketing, registration, webhooks, version probe, and other legitimately scope-free controllers/actions.
- **`/internal/*` path skip** — documented fallback for operator diagnostics (still require operator auth).
- **Health / OpenAPI minimal routes** — skipped by path prefix in middleware.

- Startup: `ProductionSafetyRules.CollectScopeDerivationUnsafeInProductionLike` rejects `DevelopmentBypass` auth mode and `AllowTestActorHeaders` on production-like hosts.

### Layer C — HTTP ingress

- `{tenantId}` route binding: `RouteTenantScopeBindingFilter`
- CI: `scripts/ci/assert_route_tenant_scope_guard.py`
- Integration: `ArchLucid.Api.Tests/Security/TenantIsolationSmokeTests.cs`, route-tenant P1 batches
- **Within-tenant workspace/project posture (V1):** [`V1_WORKSPACE_PROJECT_AUTHORIZATION_POSTURE.md`](V1_WORKSPACE_PROJECT_AUTHORIZATION_POSTURE.md) — organizational scope with IDOR regression on high-value routes; not a paying-client isolation boundary.

### Layer D — Persistence

- Repositories take `ScopeContext` or explicit `tenantId` parameters where **tenant-scoped** tables are listed in [`TENANT_SCOPED_TABLES_INVENTORY.md`](../library/TENANT_SCOPED_TABLES_INVENTORY.md).
- **Build-time guard:** `TenantScopedQueryScopeBindingAnalyzer` (**ARCH006**) on `ArchLucid.Persistence` — scoped tables from [`tenant_scoped_tables.v1.json`](../../scripts/ci/data/tenant_scoped_tables.v1.json) (parity with [`TENANT_TABLE_ISOLATION_CLASSIFICATION.md`](TENANT_TABLE_ISOLATION_CLASSIFICATION.md)); see ADR **0047**.
- **Within-tenant workspace/project predicates** are optional product discipline — not a security requirement for paying-client isolation (see decision summary above).
- SQL integration tests under `ArchLucid.Persistence.Tests` (`*ScopeIsolationSqlIntegrationTests`) primarily guard **SingleCatalog dev/CI** fidelity and repository regressions; they do not substitute for the catalog boundary in production.

### Layer E — Blob and auxiliary stores

- `ArtifactBlobTenantPaths` — tenant prefix on blob keys
- Vector index / Azure AI Search / Ask / Graph-RAG: mandatory scope `$filter` + fail-closed upsert + scoped Graph-RAG expand — see [`RETRIEVAL_TENANCY_HIT_GUARANTEE_CONTRACT.md`](../library/RETRIEVAL_TENANCY_HIT_GUARANTEE_CONTRACT.md) (**TB-1001**); retrieval architecture tests

### Layer F — Platform cross-tenant (explicit exception)

- Cross-tenant rollups and internal analytics: **`PlatformCrossTenantReadAuthority`** / **`PlatformOperator`** only
- Not a substitute for product-path isolation; documented in [`INTERNAL_CROSS_TENANT_ANALYTICS.md`](../runbooks/INTERNAL_CROSS_TENANT_ANALYTICS.md)

## Explicit non-controls

- **`SESSION_CONTEXT` + RLS** — historical; see [`MULTI_TENANT_RLS.md`](MULTI_TENANT_RLS.md) for legacy design only
- **`RlsSessionContextInfrastructureHealthCheck`** — probes deprecated `TenantId` key; not evidence of active RLS
- **`SqlRowLevelSecurityBypassAmbient`** — legacy break-glass; irrelevant when RLS policies absent

## Architecture review checklist

When scoring tenant isolation **do not** ask “is RLS enabled?” Instead verify:

1. Production topology is `SystemWithPerTenantCatalogs` (config + startup rules).
2. Binding provisioning marks tenants active only after catalog migrate + mirror.
3. Route-tenant and IDOR tests pass; ARCH001 and ARCH006 analyzers enabled on product assemblies.
4. No product code path uses system catalog connection for tenant-scoped reads without explicit design.
5. Cross-tenant admin endpoints require platform operator authority.

**Do not** treat missing workspace/project SQL predicates or within-catalog single-key lookups as paying-client isolation defects.

### Catalog-binding verification (automated)

| Control | Location | Test coverage |
|---------|----------|---------------|
| `SingleCatalog` banned in Production/Staging | `ProductionSafetyRules.CollectSingleCatalogDisallowedInProductionLike` | `ArchLucid.Api.Tests/ArchLucidConfigurationRulesTests` (`CollectErrors_WhenProductionAndSingleCatalogTopology_*`) |
| Per-tenant connection resolution | `TenantDatabaseResolver`, `TenantDatabaseBindings` | `ArchLucid.Persistence.Tests/TenantDatabaseResolverUnitTests` |
| Tenant-scoped request must not hit system catalog | `ScopedRoutingSqlConnectionFactory`, `SqlCatalogRoutingGuard` | `ScopedRoutingSqlConnectionFactoryUnitTests`, `SqlTopologyPlaneIsolationSqlIntegrationTests` |
| ADR 0037 wiring drift guard | Architecture tests | `ArchLucid.Architecture.Tests/TenantIsolationDefenseInDepthArchitectureTests` |

## Related ADRs and migrations

- [ADR 0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md) — **current decision**
- [`redirects.md`](../redirects.md#historical-adrs-removed-2026-08-02) — ADR 0003 (SQL RLS) removed 2026-08-02
- `148_RemoveRowLevelSecurity.sql` — DDL removal
