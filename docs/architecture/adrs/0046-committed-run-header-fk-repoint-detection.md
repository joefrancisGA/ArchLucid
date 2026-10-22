> **Scope:** ADR 0046 — committed run header FK repoint detection (TB-311).

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0046: Committed run header FK repoint detection

- **Status:** Accepted
- **Date:** 2026-06-07
- **Supersedes:** *(none)*
- **Superseded by:** *(none)*
- **Amends:** [ADR 0045](0045-committed-run-header-immutability.md) (closes follow-up #6)

## Context

TB-310 (ADR 0045) freezes evidence-anchor **pointer values** on `dbo.Runs` once `GoldenManifestId` is set. That prevents **post-commit repointing**, but does not prove a committed header was **correct at commit time** or that brownfield data is aligned:

1. **Dangling pointer** — header references a child PK that does not exist.
2. **Cross-run link** — child row exists but its `RunId` belongs to a different run.

Child→parent FKs (`FK_*_Runs_RunId`, migrations 134/147) reject orphans on **new writes** but do not detect header→child **ownership mismatch** (child exists under another run). Many constraints were added `WITH NOCHECK` on brownfield catalogs, so historical drift may remain visible.

**Alternatives considered**

| Alternative | Outcome |
|-------------|---------|
| **`AFTER INSERT/UPDATE` trigger blocking bad pointers** | Rejected for V1 — blocks repair paths; commit orchestrator already writes atomically; brownfield may contain pre-existing drift requiring operator review. |
| **Trusted FK from `dbo.Runs` pointer columns to child PKs** | Rejected — would require composite FK including `RunId` on child tables; large schema change; does not help brownfield `NOCHECK` rows. |
| **Detection-only background probe (reuse orphan probe infra)** | **Accepted** — same operational model as orphan probes; forensic signal without auto-deleting evidence. |

## Decision

1. **Scope:** Committed runs only (`GoldenManifestId IS NOT NULL`). Each non-NULL evidence pointer on `dbo.Runs` is probed:

   | Pointer column | Child table | Child PK | Child RunId |
   |----------------|-------------|----------|-------------|
   | `ContextSnapshotId` | `ContextSnapshots` | `SnapshotId` | `RunId` |
   | `GraphSnapshotId` | `GraphSnapshots` | `GraphSnapshotId` | `RunId` |
   | `FindingsSnapshotId` | `FindingsSnapshots` | `FindingsSnapshotId` | `RunId` |
   | `GoldenManifestId` | `GoldenManifests` | `ManifestId` | `RunId` |
   | `DecisionTraceId` | `DecisioningTraces` | `DecisionTraceId` | `RunId` |
   | `ArtifactBundleId` | `ArtifactBundles` | `BundleId` | `RunId` |

2. **Violation definition:** For a committed run, a pointer is violated when `NOT EXISTS (child WHERE child.PK = header.pointer AND child.RunId = header.RunId)`.

3. **Enforcement:** Detection-only — no auto-delete, no quarantine insert, no write-path block.

4. **Implementation:**
   - Registry: `CommittedRunHeaderFkRepointRegistry` (Core).
   - SQL: `CommittedRunHeaderFkRepointProbeSql` + resolver (Host.Core).
   - Executor: `DataConsistencyOrphanProbeExecutor` runs repoint probes on each orphan probe pass (same `OrphanProbeEnabled` gate).
   - Metrics: `archlucid_data_consistency_header_repoints_detected_total` (label `pointer`).
   - Admin: `GET /admin/diagnostics/data-consistency/header-repoints` → `DataConsistencyHeaderRepointCounts`.
   - CI: `CommittedRunHeaderFkRepointProbeRegistryArchitectureTests` — full pointer coverage.

## Trade-offs

**Gains:** Closes the “can committed evidence pointers reference another run’s rows?” observability gap; complements TB-310 immutability and TB-303 child sealing; reuses existing probe scheduling and admin patterns.

**Sacrifices:** Detection-only — operators must investigate and remediate manually; probe adds six `COUNT_BIG` queries per orphan probe interval (negligible at run-header volume).

## Constraints

- **Security:** Read-only detection; no elevation of write paths.
- **Scalability:** Set-based counts; child PK indexes exist; committed-run filter limits scan to committed headers.
- **Reliability:** Shares orphan probe failure isolation (logged warning, next interval retries).
- **Cost:** No new tables; six SQL counts per probe pass.

## Consequences

- **Positive:** Honest forensic signal for header↔child ownership drift; admin surface matches background probe.
- **Negative:** Does not prevent bad pointers at commit time (orchestrator transaction remains the primary guard); brownfield drift requires operator runbook.

## Links

- TB-311 in [`TECH_BACKLOG.md`](../../library/TECH_BACKLOG.md)
- [`EVIDENCE_IMMUTABILITY.md`](../../library/EVIDENCE_IMMUTABILITY.md)
- [ADR 0045](0045-committed-run-header-immutability.md)
- [ADR 0039](0039-commit-sealed-evidence-immutability.md)
