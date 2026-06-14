> **Scope:** V1 release posture for **within-tenant** workspace and project scope — product correctness and pilot trust, not paying-client isolation (see [TENANT_ISOLATION_DEFENSE_IN_DEPTH.md](TENANT_ISOLATION_DEFENSE_IN_DEPTH.md)).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# V1 workspace / project authorization posture

**Audience:** release owners, security reviewers, regulated-pilot sponsors.

**Status:** Accepted for V1 RC (2026-06-14). Resolves **SAQ-006** / **TB-317**.

## Decision summary

| Question | V1 posture |
|----------|------------|
| Are workspace and project **paying-client isolation** boundaries? | **No.** Database-per-tenant routing is the primary isolation control ([ADR 0037](../architecture/adrs/0037-tenant-isolation-without-rls-defense-in-depth.md)). |
| Must high-value product routes enforce workspace/project scope? | **Yes** on the V1 pilot happy path — scope is derived fail-closed on production-like hosts ([ADR 0041](../architecture/adrs/0041-fail-closed-scope-derivation.md)). |
| Is cross-workspace access within a tenant always blocked everywhere? | **No.** V1 guarantees **representative regression coverage** on high-value read/export routes, not exhaustive enumeration of every controller action. |
| What happens when scope is wrong? | **403/404** on covered routes; audit events where mutating paths apply. Residual gaps are **documented limitation**, not hidden security claims. |

## Enforcement layers

1. **Scope derivation** — JWT/API-key claims or ambient job override; header-only scope rejected on production-like hosts.
2. **Repository predicates** — tenant-scoped tables include `TenantId`; workspace/project predicates are applied on run-scoped reads where product semantics require them.
3. **Automated regression** — `ArchLucid.Api.Tests/Security/WorkspaceProjectScopeIdorIntegrationTests.cs` guards wrong-workspace access on run detail, artifacts, ROI, pilot deltas, explain aggregate, and export ZIP routes (SQL-backed when integration SQL env is set).
4. **RC evidence** — strict RC signoff treats missing IDOR regression signal as an attention item; this doc is the buyer-safe limitation statement when exhaustive matrix coverage is not claimed.

## Residual risk (accepted for V1)

- Routes **outside** the IDOR regression matrix may still return cross-workspace data within a tenant until a concrete defect is found or a route is added to the matrix.
- Workspace/project segmentation is an **organizational** dimension for pilot workflows — not a substitute for tenant catalog isolation.
- Expansion of the regression matrix is **TB-317** follow-up; do not imply full matrix coverage in sponsor materials unless CI artifacts show PASS on the attached suite.

## Release checklist pointers

- Run SQL integration IDOR suite before RC when `ARCHLUCID_API_INTEGRATION_SQL` (or persistence equivalent) is available.
- Attach `architecture-invariant-rc-summary.json` from `scripts/ci/report_architecture_invariant_enforcement.py`.
- Reference this doc in procurement / trust responses when sponsors ask about workspace segmentation.

## Related

- [`TENANT_ISOLATION_DEFENSE_IN_DEPTH.md`](TENANT_ISOLATION_DEFENSE_IN_DEPTH.md)
- [`TENANT_TABLE_ISOLATION_CLASSIFICATION.md`](TENANT_TABLE_ISOLATION_CLASSIFICATION.md)
- [`SONNET_ARCHITECTURE_DESIGN_QUESTIONS.md`](../library/SONNET_ARCHITECTURE_DESIGN_QUESTIONS.md) — **SAQ-006**
- [`V1_RELEASE_CHECKLIST.md`](../library/V1_RELEASE_CHECKLIST.md)
