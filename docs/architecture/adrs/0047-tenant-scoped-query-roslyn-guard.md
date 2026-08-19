# ADR 0047: Tenant-scoped persistence SQL Roslyn guard (ARCH006)

- **Status:** Accepted
- **Date:** 2026-06-07
- **Supersedes:** *(none)*
- **Superseded by:** *(none)*
- **Amends:** [ADR 0037](0037-tenant-isolation-without-rls-defense-in-depth.md)

## Context

ADR 0037 removed SQL RLS and relies on database-per-tenant catalogs plus application-layer scope predicates (Layer D). Repository SQL discipline was enforced only by code review and spot integration tests. ADR 0037 listed a Roslyn/CI expansion for repository SQL scope predicates as follow-up work.

## Decision

1. Add **`TenantScopedQueryScopeBindingAnalyzer` (`ARCH006`)** in `ArchLucid.Analyzers`, enabled on **`ArchLucid.Persistence`** only.
2. Source of truth for tenant-scoped tables is **`scripts/ci/data/tenant_scoped_tables.v1.json`**, generated from the **`scope-triple-on-row`** and **`tenant-id-on-row`** buckets in `docs/security/TENANT_TABLE_ISOLATION_CLASSIFICATION.md`. A parity architecture test prevents drift.
3. **Fail-closed** on unanalyzable SQL against scoped tables unless a recognized scope helper (`PersistenceTenantScope`, `RunChildRunScopeSql`, `RepositoryScopePredicate`) or **`[TenantScopeExempt]`** is present. Repositories call **`PersistenceTenantScope`**; the other two remain recognized because the façade delegates to them.
4. **`[TenantScopeExempt]`** (`ArchLucid.Core.Tenancy`) documents finite exemptions aligned to classification buckets (`AcceptedResidual`, `SystemPlaneOnly`, `Operational`).
5. v1 analyzer accepts, within a tenant catalog:
   - explicit triple/`TenantId` predicates,
   - INSERT rows carrying `TenantId`,
   - MERGE `ON` tenant keys,
   - surrogate-key reads/writes (`Id = @Id`, optional `IS NULL` guards),
   - tenant-id + additional `AND` predicates on triple-scoped tables.

## Alternatives considered

| Alternative | Outcome |
|-------------|---------|
| Reintroduce RLS | Rejected per ADR 0037 |
| Architecture test only (reflection scan at test time) | Rejected — no IDE/build per-call-site feedback |
| Hard-coded C# table list in analyzer | Rejected — duplicates classification matrix |

## Consequences

- **Positive:** Build-breaking guard for missing scope on scoped tables; complements ARCH001 and CI classification guards.
- **Negative:** Dynamic SQL must use helpers or explicit exemptions; surrogate-key acceptance is catalog-bound, not workspace-IDOR-proof.
- **Follow-ups:** Optional child-via-parent bucket in a future analyzer revision; tighten admin/worker paths when scope context is threaded into jobs.

## Links

- `docs/security/TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`
- `docs/security/TENANT_TABLE_ISOLATION_CLASSIFICATION.md`
- `scripts/ci/generate_tenant_scoped_tables_json.py`
