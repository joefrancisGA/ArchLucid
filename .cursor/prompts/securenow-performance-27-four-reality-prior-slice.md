# SN-PERF-27 — Four-reality drift loads prior properties for path resources

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

`FourRealityDriftEngine.RunAsync` still loads the current snapshot in full. The prior snapshot and the inventory diff contribute only the resources that appear on the privilege and reachability paths being compared, and the diagram reconciliation is one read.

## Why

The engine calls `SecureNowAnalysisRun.LoadAsync` for the current snapshot and again for the prior snapshot, then `ListChangesByDiffIdAsync` for every change on that diff. `FourRealityDriftAnalyzer` uses the prior snapshot only inside `BuildPropertyBag` for cloud resource ids collected from those paths’ hops, and it uses diff rows only when `CloudResourceId` is one of those ids. `TryLoadDiagramReconciliationAsync` lists run ids, then calls `TryGetByRunAndSnapshotAsync` once per run until one result JSON deserializes.

## Read first

- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/FourRealityDriftEngine.cs` (`RunAsync`, `TryLoadDiagramReconciliationAsync`)
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/FourRealityDriftAnalyzer.cs` (`BuildPropertyBag` call sites)
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/FourRealityResourceAccessReader.cs` (`BuildPropertyBag`)

## What to build

1. Branch `sn-perf/27-four-reality-prior-slice` from current `master`.
2. Keep the current snapshot load. Do not change how the prior snapshot id or the diff summary is chosen.
3. After the privilege and reachability paths are known, collect the distinct cloud resource ids `CollectCloudResourceIds` already uses. Load prior resource rows and their properties for those ids only. A missing prior resource still yields an empty property bag.
4. Load diff changes for that same id set in one scoped query, ordered as `ListChangesByDiffIdAsync` orders rows (`AzureResourceId`, `ChangeType`, `Property`) so `FirstOrDefault` on network and permission changes stays stable. An empty id set loads no change rows.
5. Replace the per-run reconciliation loop with one tenant-scoped read of reconciliation rows for that snapshot. Walk them in the same order `ListRunIdsBySnapshotAsync` then `TryGetByRunAndSnapshotAsync` walks today, and return the first result JSON that deserializes. A snapshot with no rows still returns null.
6. Do not change candidate fields, finding ingest, or path insert.

## Tests

1. A prior property on a path resource still drives the same historical posture. A prior property on a resource that is not on those paths is not read.
2. A network or permission change for another cloud resource id is not the related change.
3. Two citing runs still return the first deserializable result, and `TryGetByRunAndSnapshotAsync` is not called once per run.
4. The current snapshot is still loaded through the existing analysis load. The prior snapshot is not.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: prior resources, properties, changes, and reconciliation rows are tenant-scoped. Do not read another tenant’s prior snapshot.
- Scalability: one prior slice and one change query for the path’s resource ids, plus one reconciliation read.
- Reliability: pass `CancellationToken`. A JSON failure still skips that row and tries the next, as today.
- Cost: no new index and no cache.
- Do not commit.

## Done when

Four-reality candidates match today’s analyzer for the same paths, and the prior full snapshot and the unfiltered change list are not loaded.
