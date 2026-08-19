> **Scope:** ADR 0037 — Tenant isolation without SQL RLS — defense-in-depth model for production.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0037: Tenant isolation without SQL RLS — defense-in-depth model

- **Status:** Accepted
- **Date:** 2026-06-06
- **Supersedes:** ADR 0003 *(production posture only; ADR 0003 removed 2026-08-02 — see [`redirects.md`](../../redirects.md#historical-adrs-removed-2026-08-02))*
- **Superseded by:** *(none)*
- **Amends:** *(none)*

## Context

ArchLucid is multi-tenant on Azure SQL. ADR 0003 (2026-04-04, removed 2026-08-02) required RLS + `SESSION_CONTEXT` in Production when `StorageProvider=Sql`. Since then:

- Migration **`148_RemoveRowLevelSecurity.sql`** dropped `rls.ArchLucidTenantScope` and related predicates; RLS is **not deployed** on greenfield or migrated catalogs.
- Production topology is **`SystemWithPerTenantCatalogs`**: one **product SQL catalog per tenant**, resolved via `ITenantDatabaseResolver` and `TenantDatabaseBindings` ([`TENANT_DATABASE_TOPOLOGY.md`](../../library/TENANT_DATABASE_TOPOLOGY.md)).
- Startup validation **blocks** `SingleCatalog` in production-like hosts (`ProductionSafetyRules.CollectSingleCatalogDisallowedInProductionLike`).
- Repeated architecture reviews re-open “should we add RLS back?” despite the catalog boundary being the **intended and sufficient** isolation mechanism for hosted SaaS.

**Alternatives considered**

| Alternative | Outcome |
|-------------|---------|
| **Re-enable RLS** on tenant catalogs as defense-in-depth | Rejected — operational cost (SESSION_CONTEXT on every connection, policy drift, stale health checks), plan regression risk, and **redundant** when each tenant has a dedicated catalog. |
| **RLS on system catalog only** | Rejected — system plane holds routing/provisioning, not tenant product rows; cross-tenant analytics are **explicit platform-operator paths** with separate RBAC. |
| **Application scope only (no catalog split)** | Rejected for production — `SingleCatalog` is dev/CI-only; one missed `TenantId` predicate is catastrophic. |
| **Defense-in-depth without RLS** (this ADR) | **Accepted** — catalog boundary + scoped repositories + HTTP/route guards + CI/analyzers. |

## Decision

1. **Production tenant isolation does not use SQL Row-Level Security.** Do not propose RLS reinstatement in architecture assessments unless this ADR is explicitly reopened via a superseding ADR.

2. **Primary control (Layer A):** **`SystemWithPerTenantCatalogs`** — runtime product SQL connections for `TenantId != Empty` resolve to that tenant’s catalog only (`ScopedRoutingSqlConnectionFactory`).

3. **Defense-in-depth layers (no RLS):**

   | Layer | Control | Enforcement |
   |-------|---------|-------------|
   | **A — Catalog boundary** | Database-per-tenant routing | Startup fail-fast on `SingleCatalog` in prod-like hosts; `ITenantDatabaseResolver` |
   | **B — Identity & scope** | JWT/API key → typed `ScopeContext` once at host boundary | `TenantIdentityBoundaryAnalyzer` (ARCH001); scope headers / route binding |
   | **C — HTTP ingress** | Route `{tenantId}` binding + IDOR guards | `RouteTenantScopeBindingFilter`, `assert_route_tenant_scope_guard.py`, integration tests |
   | **D — Persistence** | Repositories accept scope; parameterized SQL with tenant predicates | Architecture/integration tests (`TenantIsolationSmokeTests`, `*ScopeIsolationSqlIntegrationTests`); code review |
   | **E — Blob / auxiliary stores** | Tenant-prefixed object keys | `ArtifactBlobTenantPaths`; container isolation per deployment |
   | **F — Platform cross-tenant reads** | Separate RBAC (`PlatformCrossTenantReadAuthority` / `PlatformOperator`) | Explicit admin analytics only; never default product path |

4. **Canonical engineering reference:** [`docs/security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md).

5. **`docs/security/MULTI_TENANT_RLS.md`** is **historical / optional RLS design** only; it must not be cited as the **current** production control without pointing to this ADR.

## Trade-offs

**Gains:** Simpler connection lifecycle (no SESSION_CONTEXT applicator on hot path); clearer audit story (“tenant data lives in tenant catalog X”); aligns Terraform/elastic-pool ops with one catalog per customer; avoids dual isolation models (RLS + catalog) that confuse reviewers and tests.

**Sacrifices:** No database-level safety net if application code connects to the **wrong catalog** or omits a `TenantId` predicate **within** a tenant catalog (workspace/project IDOR remains possible). Misconfiguration of `DevelopmentTenantConnectionString` or binding rows becomes a **routing** incident rather than a filtered query. Re-introducing RLS later would require migration work and re-validation of migration 148’s removal.

## Constraints

- **Hosted SaaS production** must use `ArchLucid:SqlTopology:Mode=SystemWithPerTenantCatalogs` (enforced at startup).
- **SingleCatalog** remains allowed only for Development / CI / explicit test hosts.
- **Cross-tenant analytics** stay platform-operator-only; product repositories must not add convenience “list all tenants” queries without explicit system-plane design.
- **Regulated pilots** may still require customer documentation of catalog boundary + app controls; this ADR does **not** claim CPA SOC 2 or third-party pen test (see assessment scope rules).
- **Child tables scoped via `RunId`** remain valid; isolation flows from parent `dbo.Runs` within the same catalog.

## Expected impact

- **Security posture:** Isolation is **demonstrable** as catalog routing + scoped APIs; assessors should verify bindings and connection factory behavior, not RLS policy catalogs. Residual risk shifts to **application bugs within a tenant catalog** and **platform-operator cross-tenant tools** — both covered by tests and RBAC respectively.
- **Operations:** Provisioning and backup are **per catalog**; runbooks in [`TENANT_SQL_TOPOLOGY_RUNBOOK.md`](../../operations/TENANT_SQL_TOPOLOGY_RUNBOOK.md) remain authoritative.
- **Cost:** No RLS predicate evaluation on every query; elastic pool standby catalogs unchanged.
- **Engineering / CI:** Architecture reviews and agent assessments **must not** list “missing RLS” as a headline defect when this ADR applies; instead evaluate layers B–F and binding correctness. CI guard `assert_tenant_isolation_defense_in_depth.py` blocks regression of this decision in docs and pilot copy.

## Consequences

- **Positive:** Single durable answer for “why no RLS?”; aligns code (migration 148), topology doc, and startup guards; reduces repeated review churn.
- **Negative:** Teams familiar with RLS-only SaaS may ask for reinstatement — point to Layer A and [`TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md).
- **Follow-ups:** Optional Roslyn/CI expansion for repository SQL scope predicates (INV-001); remove or repurpose stale SESSION_CONTEXT health checks when touched; keep buyer-facing [`TENANT_ISOLATION.md`](../../go-to-market/TENANT_ISOLATION.md) aligned with Layer A diagram.

## Links

- [`docs/security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](../../security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md)
- [`docs/library/TENANT_DATABASE_TOPOLOGY.md`](../../library/TENANT_DATABASE_TOPOLOGY.md)
- [`docs/library/ARCHITECTURE_INVARIANTS.md`](../../library/ARCHITECTURE_INVARIANTS.md) — INV-001
- Migration `148_RemoveRowLevelSecurity.sql`
- Superseded: ADR 0003 (removed 2026-08-02 — see [`redirects.md`](../../redirects.md#historical-adrs-removed-2026-08-02))
