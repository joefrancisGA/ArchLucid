# SN-PERF-24 — Snapshot list seals cited runs in one batch

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

`InfraEvidenceDriftWorkbenchQueryService.ListSnapshotsAsync` fail-closes on run-cited snapshots with one read of run ids for the page, then one seal check per distinct run. It does not call `ListRunIdsBySnapshotAsync` once per row.

## Why

The snapshot page loops `InfraEvidenceSnapshotSealedManifestHashGuard.EnsureRunCitedSnapshotSealedOrThrowAsync`. Each call loads run ids for that snapshot, then checks each run. A page of 20 snapshots is 20 reconciliation reads even when several snapshots cite the same run.

## Read first

- `ArchLucid.Application/InfraEvidence/InfraEvidenceDriftWorkbenchQueryService.cs` (`ListSnapshotsAsync`)
- `ArchLucid.Application/InfraEvidence/Mermaid/InfraEvidenceSnapshotSealedManifestHashGuard.cs`
- `ArchLucid.Persistence/Architecture/SqlArchitectureDiagramReconciliationRepository.cs` (`ListRunIdsBySnapshotAsync`)

## What to build

1. Branch `sn-perf/24-snapshot-list-seal-batch` from current `master`.
2. Add a scoped read that returns run ids for a set of snapshot ids in the caller’s tenant (workspace and project filters if the existing single-snapshot query has them). Empty snapshot ids return no rows.
3. In `ListSnapshotsAsync` only, load run ids for the page’s snapshot ids in that one read. Ignore `Guid.Empty`. Call `GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync` once per distinct run id.
4. Leave the single-snapshot guard on diff detail, inventory rows, mermaid export, and drift classification. Those paths still call the existing method.
5. A snapshot with no citing runs stays on the page, as today.

## Tests

1. A page of two snapshots that cite the same run checks that run once.
2. A sealed run still fails the list.
3. A snapshot with no reconciliation rows is still returned.
4. `ListSnapshotsAsync` does not call `ListRunIdsBySnapshotAsync` once per row.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: run ids come from the tenant’s reconciliation rows. Do not check another tenant’s runs, and do not skip a sealed run.
- Scalability: one reconciliation read per snapshot page, then one seal check per distinct run.
- Reliability: pass `CancellationToken`. Fail closed.
- Cost: no new index and no cache.
- Do not commit.

## Done when

The snapshot list still refuses a sealed cited run, and it does not load reconciliation run ids once per snapshot row.
