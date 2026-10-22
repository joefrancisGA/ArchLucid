# SN-PERF-14 — Path inspector finding ids in one read

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

`SecurityEvidencePathInspectorQueryService.TryGetPathDetailAsync` loads citing finding ids for every path in the snapshot in one query.

## Why

**SN-PERF-06** already loads hops with `ListWithHopsBySnapshotAsync`. The inspector still calls `ListFindingIdsByPathIdInScopeAsync` once per other path while building hypotheses. That is one round trip per path on the snapshot.

## Read first

- `ArchLucid.Application/InfraEvidence/SecurityEvidencePathInspectorQueryService.cs`
- `ArchLucid.Persistence/InfraEvidence/SqlOperationalSecurityFindingRepository.cs` (`ListFindingIdsByPathIdInScopeAsync`)
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/SecureNowHypothesisAnalyzer.cs` (consumes the finding-id map; do not change hypothesis rules)
- `ArchLucid.Application.Tests/InfraEvidence/SecurityEvidencePathInspectorQueryServiceTests.cs`

## What to build

1. Branch `sn-perf/14-inspector-finding-ids` from current `master`.
2. Add `ListFindingIdsBySnapshotInScopeAsync` (name may match nearby methods) on the finding repository. SQL joins findings to `dbo.SecurityEvidencePaths` for the snapshot and returns finding ids grouped by `PathId`. Filter tenant, workspace, and project. Order each path’s ids by `LastObservedUtc DESC`, then `FindingId`, matching `ListFindingIdsByPathIdInScopeAsync`.
3. In `TryGetPathDetailAsync`, call that method once. Keep the already-loaded hops map from **SN-PERF-06**. The requested path’s citing ids must still appear even if the batch omits that path; fall back to the single-path read only for that path id.
4. Do not change hypothesis text, cited-path filtering, or the detail JSON shape.

## Tests

1. Inspector tests still return the same citing ids and the same hypotheses for a snapshot with two paths.
2. A unit test shows the batch method is used and `ListFindingIdsByPathIdInScopeAsync` is not called once per snapshot path.
3. `ProjectScopeSqlPushdownBoundaryTests` includes the new SQL method.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: join on tenant and project. A path in another project contributes no finding ids.
- Scalability: one finding query per detail request.
- Reliability: pass `CancellationToken`.
- Cost: no new index and no cache.
- Do not commit.

## Done when

Path detail hypotheses cite the same finding ids, and the inspector does not query finding ids once per path.
