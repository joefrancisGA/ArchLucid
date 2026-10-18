# SN-PERF-29 — Path detail hypotheses without every hop

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

`SecurityEvidencePathInspectorQueryService` path detail builds the same hypotheses for one path without loading every hop of every path on the snapshot.

## Why

Detail already loads the requested path’s hops, cut points, and routing. It then calls `ListWithHopsBySnapshotAsync` and runs `SecureNowHypothesisAnalyzer` over every path, keeping hypotheses whose `CitedPathIds` contain the requested path. Diagnostic hypotheses (`ExternalReachability`, `PrivilegeEscalation`, `SensitiveExposure`) cite only that one path. Common-mode hypotheses group hops whose edge type is the shared-control fan-out and cite every path in the group. The other hops on unrelated paths are not read by that grouping.

## Read first

- `ArchLucid.Application/InfraEvidence/SecurityEvidencePathInspectorQueryService.cs` (path detail)
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/SecureNowHypothesisAnalyzer.cs` (`Analyze`, `AnalyzeCommonModeDependencies`)
- `ArchLucid.Persistence/InfraEvidence/SqlSecurityEvidencePathRepository.cs` (`ListWithHopsBySnapshotAsync`)
- **SN-PERF-14** already batched finding ids. Do not undo that.

## What to build

1. Branch `sn-perf/29-path-detail-hypothesis-hops` from current `master`.
2. Build diagnostic hypotheses from the hops already loaded for the requested path. Do not load other paths for those three kinds.
3. Load shared-control fan-out hops for the snapshot in one scoped read (path id, hop fields the analyzer reads, and the path header fields `AnalyzeCommonModeDependencies` reads: snapshot id, path id, confidence band). Include the requested path’s fan-out hops in that set.
4. Run the common-mode grouping on that fan-out set. Keep a hypothesis only when its cited path ids contain the requested path, as today.
5. Do not call `ListWithHopsBySnapshotAsync` from path detail. List and other engines that still need full hops stay on that method.
6. Leave hypothesis ids, status, reason, cited finding ids, and evidence references unchanged.

## Tests

1. A diagnostic hypothesis for the requested path still appears, and a diagnostic hypothesis that would cite only another path does not.
2. A common-mode hypothesis that cites the requested path and one other path still cites both. A common-mode group that does not include the requested path is absent.
3. Path detail does not call `ListWithHopsBySnapshotAsync`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: fan-out hops stay inside the caller’s project scope and snapshot. Do not cite a path from another tenant.
- Scalability: one path’s hops plus one fan-out hop read, not every hop on the snapshot.
- Reliability: pass `CancellationToken`.
- Cost: no new index and no cache.
- Do not commit.

## Done when

Path detail hypotheses match today’s filter, and the snapshot-wide hop list is not loaded.
