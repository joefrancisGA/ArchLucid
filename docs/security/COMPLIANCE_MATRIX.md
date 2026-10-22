> **Scope:** Map SOC 2 self-assessment themes to concrete repository evidence.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Compliance evidence matrix (SOC 2 alignment)

This table links **control themes** from [`SOC2_SELF_ASSESSMENT_2026.md`](SOC2_SELF_ASSESSMENT_2026.md) to **verifiable artifacts** in-repo.

| Theme | Evidence path | Notes |
|-------|----------------|-------|
| Authentication / authorization | [`ArchLucid.Host.Core/Startup/AuthSafetyGuard.cs`](../../ArchLucid.Host.Core/Startup/AuthSafetyGuard.cs), `ArchLucid.Api/Program.cs`, [`SECURITY.md`](../library/contributor-reference/SECURITY.md) | Fail-closed defaults |
| Tenant isolation | [`TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](TENANT_ISOLATION_DEFENSE_IN_DEPTH.md), [ADR 0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md), SQL migrations under `ArchLucid.Persistence/Migrations/` | Production = database-per-tenant + app predicates; [`MULTI_TENANT_RLS.md`](MULTI_TENANT_RLS.md) is historical only |
| API contract hardening | `.github/workflows/ci.yml` (`api-schemathesis-light`), `.github/workflows/schemathesis-scheduled.yml` | PR vs scheduled coverage |
| Audit trail | `docs/AUDIT_COVERAGE_MATRIX.md`, `ArchLucid.Api/Controllers/Admin/AuditController.cs` | Append-only events |
| Operational readiness | `docs/runbooks/*`, `docs/runbooks/COORDINATOR_TO_AUTHORITY_PARITY.md` | Parity evidence for ADR 0021 |

## Related

- [`SOC2_SELF_ASSESSMENT_2026.md`](SOC2_SELF_ASSESSMENT_2026.md)
- [`../go-to-market/trust-center.md`](../go-to-market/trust-center.md)
