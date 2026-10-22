# SN-PERF-11 — Unchanged drift rows from resources only

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

When a drift diff is listed with `includeUnchanged`, load only the resource rows of the two snapshots. Do not hydrate properties, tags, relationships, role assignments, diagnostics, or Defender summaries.

## Why

`InfraEvidenceDriftWorkbenchQueryService` calls `TryGetSnapshotDetailAsync` twice when `includeUnchanged` is true. `AzureInventoryDiffUnchangedBuilder` reads only `Resources` (`AzureResourceId`, `ResourceType`, `CloudResourceId`) and the NeverShow filter. The other grids are unused and dominate snapshot size.

## Read first

- `ArchLucid.Application/InfraEvidence/InfraEvidenceDriftWorkbenchQueryService.cs` (`includeUnchanged` branch)
- `ArchLucid.Application/InfraEvidence/AzureInventoryDiffUnchangedBuilder.cs`
- `ArchLucid.Application.Tests/InfraEvidence/AzureInventoryDiffUnchangedBuilderTests.cs`
- `ArchLucid.Persistence/InfraEvidence/SqlAzureInventorySnapshotRepository.ListResourcesPaged.cs` (existing resource `SELECT`; do not replace paging)

## What to build

1. Branch `sn-perf/11-drift-unchanged-resources` from current `master`.
2. Add a scoped repository method that returns the resource rows for one snapshot (`TenantId` + `SnapshotId`), with the same resource columns the builder uses. SQL implementation filters in SQL. The default interface method may filter an existing in-memory list.
3. In the `includeUnchanged` branch, load resources for snapshot A and snapshot B with that method. If either snapshot header is missing, keep today’s null result. Do not call `TryGetSnapshotDetailAsync` or `TryGetCanonicalSnapshotDetailAsync` on that branch.
4. Keep `BuildUnchangedResourceChanges` behavior: same unchanged rows, same deterministic `ChangeId`, same NeverShow omissions, same sort. Adapt the builder to accept resource lists (or a thin wrapper) so it no longer requires a full `AzureInventorySnapshotDetailReadModel`.
5. Leave `ListInventoryRowsForSnapshotAsync` alone. That is **SN-PERF-15**.

## Tests

1. Existing `AzureInventoryDiffUnchangedBuilderTests` still pass after the signature change.
2. A workbench test (or an extended builder test) shows a resource present in both snapshots and absent from the change list becomes `ResourceUnchanged`, and a resource present on only one side does not.
3. The `includeUnchanged` path does not call `TryGetSnapshotDetailAsync`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: the new read is scoped by tenant and snapshot id. Do not return another tenant’s resources.
- Scalability: two resource queries, not two full snapshot hydrations.
- Reliability: pass the caller’s `CancellationToken`.
- Cost: no new index and no cache.
- Do not commit.

## Done when

`includeUnchanged` builds the same unchanged rows from resource lists, and the full snapshot detail read is not on that path.
