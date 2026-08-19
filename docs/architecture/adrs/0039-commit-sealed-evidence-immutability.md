> **Scope:** ADR 0039 — commit-sealed evidence immutability (TB-303).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0039: Commit-sealed evidence immutability

- **Status:** Accepted
- **Date:** 2026-06-06
- **Supersedes:** *(none)*
- **Superseded by:** *(none)*
- **Amends:** *(none)*

## Context

ArchLucid sells durable, auditable proof. `dbo.AuditEvents` already enforces append-only semantics for the runtime SQL principal (`[ArchLucidApp]`) via migration 051 and a production-like startup probe. Other commit artifacts — manifests, bundles, agent results, evidence packages, snapshots, decision traces — could still be rewritten after commit (for example `AgentResultRepository` delete-then-insert on retry).

Regulated reviewers ask: *“Show me nothing changed after commit.”* Without a single enforced boundary, the honest answer was application convention plus partial SQL permissions.

**Alternatives considered**

| Alternative | Outcome |
|-------------|---------|
| **Versioned rows per artifact** | Rejected for V1 — no product “new version” concept for most sealed tables; adds read-path complexity and storage churn without buyer-facing benefit. |
| **Application-only guards** | Rejected — bypassable by ad-hoc SQL, break-glass mistakes, or future code paths. |
| **DENY UPDATE/DELETE on sealed tables + overlay for legitimate post-commit enrichments** | **Accepted for V1** — mirrors audit pattern; fail-closed startup probe; enrichments in mutable overlay table. |
| **Seal `dbo.Runs` header** | Deferred — status fields remain mutable; FK chain protects child evidence transitively; FK repoint detection is item #6. |

## Decision

1. **Commit point:** A run is *committed* when `AuthorityRunOrchestrator.FinalizeCommittedPipelineAsync` completes successfully inside the authority unit of work. Rows written in that transaction (and child evidence linked by `RunId`) are **commit-sealed**.

2. **V1 sealed tables:** All tables listed in `SealedEvidenceTableRegistry` (migration 247 / `ArchLucid.sql`) — audit, agent results, evidence packages, decision traces, context/graph/findings snapshots, golden manifests, artifact bundles and child tables, `DecisioningTraces`.

3. **Enforcement:** `DENY UPDATE` and `DENY DELETE` on each sealed table **to `[ArchLucidApp]`** when the role exists (same pattern as migration 051). `dbo` / `db_owner` retain break-glass correction.

4. **Post-commit agent-result enrichments:** Calibration, IaC stubs, and evidence-proposal promotion write to **`dbo.AgentResultEnrichments`** (not sealed). Base `dbo.AgentResults` is insert-only; reads merge overlay via `AgentResultEnrichmentMerger`.

5. **Retry semantics:** `CreateManyAsync` on agent results no longer delete-then-insert; duplicate `(RunId, TaskId)` throws `AgentResultDuplicateConflictException` (UoW rollback handles retries). `AgentEvidencePackageRepository` is insert-only with unique `RunId`.

6. **Startup guard:** `SqlSealedEvidenceImmutabilityRules` extends shared `SqlDatabaseImmutabilityProbeHelpers`; production-like SQL hosts fail closed if DENY permissions are missing or the connected principal can UPDATE/DELETE sealed tables.

7. **Canonical inventory:** [`docs/library/EVIDENCE_IMMUTABILITY.md`](../../library/EVIDENCE_IMMUTABILITY.md).

## Trade-offs

**Gains:** Single demonstrable contract for “nothing changed after commit” on evidence artifacts; reuse of audit probe infrastructure; Terraform-aligned migrations (permissions expressed in DDL, role membership documented for operators).

**Sacrifices:** Post-commit enrichments require overlay table and merged reads; break-glass still possible as `dbo`; no cryptographic hash chain (item #6 / later TB).

## Constraints

- **Security:** Runtime principal must use `[ArchLucidApp]`, not owner-level accounts, in production-like hosts (probe enforces effective permissions).
- **Scalability:** DENY is O(1) per statement; overlay MERGE is keyed by `ResultId`; no hot-path table scans added beyond existing reads.
- **Reliability:** Fail-closed startup prevents silent deployment without permissions; duplicate-key conflicts surface retry bugs early.
- **Cost:** One narrow overlay table; no extra storage tier in V1.

## V1 vs V1.1

| In V1 | Deferred |
|-------|----------|
| DENY on full sealed set in registry | Versioned rows where product needs explicit revisions |
| `AgentResultEnrichments` overlay | Seal / immutability rules on `dbo.Runs` header |
| Startup probe + architecture/SQL tests | Cryptographic hash-linked lineage (#6 — [ADR 0040](0040-tamper-evident-lineage-without-worm-storage.md); WORM out of scope) |
| Insert-only agent results & evidence packages | FK repoint detection |

## Consequences

- **Positive:** Aligns product thesis with enforced DB permissions; audit pattern extended consistently.
- **Negative:** Operators must create `[ArchLucidApp]` and apply migration 247 (see `MANAGED_IDENTITY_SQL_BLOB.md`).
- **Follow-ups:** Item #6 hash-linked lineage per [ADR 0040](0040-tamper-evident-lineage-without-worm-storage.md) (WORM out of scope); optional CI script mirroring registry ↔ migration parity (architecture test covers today).

## Links

- TB-303 in [`TECH_BACKLOG.md`](../../library/TECH_BACKLOG.md)
- [`EVIDENCE_IMMUTABILITY.md`](../../library/EVIDENCE_IMMUTABILITY.md)
- [ADR 0037](0037-tenant-isolation-without-rls-defense-in-depth.md) (tenancy)
- [ADR 0038](0038-run-durability-multi-store-outbox-production-secrets.md) (durability)
- Migration `247_CommitSealedEvidenceImmutability.sql`
