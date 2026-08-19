> **Scope:** ADR 0045 — committed run header evidence-anchor immutability (TB-310).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0045: Committed run header evidence-anchor immutability

- **Status:** Accepted
- **Date:** 2026-06-06
- **Supersedes:** *(none)*
- **Superseded by:** *(none)*
- **Amends:** [ADR 0039](0039-commit-sealed-evidence-immutability.md) (run header was deferred there)

## Context

TB-303 sealed commit artifacts (manifests, snapshots, agent results, etc.) with `DENY UPDATE/DELETE` on `[ArchLucidApp]`. The **`dbo.Runs`** header row remained fully mutable: it stores both **evidence anchors** (FK pointers to sealed snapshots/manifest/bundle/trace) and **lifecycle metadata** (status, archival, flags, operator governance).

Regulated reviewers ask whether a committed run can repoint its evidence chain after commit. Child tables are sealed, but the header could theoretically be rewritten to reference different snapshot ids unless the header anchors are protected.

**Alternatives considered**

| Alternative | Outcome |
|-------------|---------|
| **Whole-table `DENY UPDATE` on `dbo.Runs`** | Rejected — lifecycle columns (`LegacyRunStatus`, `ArchivedUtc`, `IsPinned`, governance disposition) must remain mutable post-commit. |
| **Split into `dbo.RunEvidenceAnchors` + sealed registry** | Rejected for V1 — strong reuse of TB-303 machinery but large read/write migration across run mapping code. |
| **`AFTER UPDATE` trigger on anchor columns when `GoldenManifestId` is set** | **Accepted** — column-level DB enforcement with minimal schema blast radius; commit transition (NULL → manifest id) remains allowed. |
| **Application-only guard** | Rejected alone — bypassable by ad-hoc SQL; kept as fail-fast complement to trigger. |

## Decision

1. **Commit marker:** A run is *committed* for header sealing when `GoldenManifestId IS NOT NULL` (aligned with TB-303 commit definition and `CK_Runs_CommittedHasManifest`).

2. **Frozen anchor columns** (see `CommittedRunHeaderAnchorRegistry`): `RunId`, `ProjectId`, scope triple (`TenantId`, `WorkspaceId`, `ScopeProjectId`), `CreatedUtc`, snapshot/manifest FKs (`ContextSnapshotId`, `GraphSnapshotId`, `FindingsSnapshotId`, `GoldenManifestId`, `DecisionTraceId`, `ArtifactBundleId`), `CurrentManifestVersion`, `StructuralExecutionMode`, `OtelTraceId`.

3. **Mutable lifecycle columns:** `Description`, `ArchivedUtc`, `LegacyRunStatus`, `CompletedUtc`, showcase/demo/pin/sample flags, retry counters, operator governance disposition, `ArchitectureRequestId` (future candidate for sealing).

4. **Enforcement:**
   - SQL: `TR_Runs_SealCommittedHeader` (`AFTER UPDATE`) raises **50310** when `DELETED.GoldenManifestId IS NOT NULL` and any anchor column value changes (migration 250 / `ArchLucid.sql`).
   - App: `CommittedRunHeaderAnchorGuard` in `SqlRunRepository.UpdateAsync` (and in-memory parity) fail-fast before SQL.
   - Startup: `SqlCommittedRunHeaderImmutabilityRules` — production-like SQL hosts fail closed if trigger is missing.

5. **No-op rewrites:** Existing `UpdateAsync` rewrites all columns; when anchor values are unchanged the trigger permits the update (compares `INSERTED` vs `DELETED`, not SET list).

## Trade-offs

**Gains:** Defense-in-depth on the evidence pointer row; complements TB-303 child-table sealing; no join/read-path rewrite; commit transition unchanged.

**Sacrifices:** New sealing mechanism (trigger) distinct from TB-303 `DENY`; trigger maintenance must stay aligned with `CommittedRunHeaderAnchorRegistry`; break-glass still possible as `dbo`.

## Constraints

- **Security:** Runtime principal should not rely on trigger bypass; app guard + trigger cover `[ArchLucidApp]` and mistaken owner scripts in normal operation.
- **Scalability:** Trigger fires only on `UPDATE dbo.Runs`; O(1) per row; negligible for run-header update volume.
- **Reliability:** Fail-closed startup prevents silent deployment without trigger; SQL error 50310 mapped to `RunEvidenceAnchorImmutableException`.
- **Cost:** No extra tables or storage tier.

## Consequences

- **Positive:** Honest answer to “can committed run evidence pointers change?” is **no** at DB layer.
- **Negative:** Operators must apply migration 250; anchor column list is a second registry to keep in sync (architecture test guards parity).
- **Follow-ups:** Optional seal of `ArchitectureRequestId`; table-split if product needs full `DENY` reuse on a narrow anchor table. FK repoint detection — **Done** (TB-311 / ADR 0046).

## Links

- TB-310 in [`TECH_BACKLOG.md`](../../library/TECH_BACKLOG.md)
- [`EVIDENCE_IMMUTABILITY.md`](../../library/EVIDENCE_IMMUTABILITY.md)
- [ADR 0039](0039-commit-sealed-evidence-immutability.md)
- Migration `259_SealCommittedRunHeader.sql`
