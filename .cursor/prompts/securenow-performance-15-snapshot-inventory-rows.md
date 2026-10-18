# SN-PERF-15 — Snapshot inventory rows without full detail

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

`ListInventoryRowsForSnapshotAsync` lists visible resources from a resource read. It does not load the full snapshot detail.

## Why

`InfraEvidenceDriftWorkbenchQueryService.ListInventoryRowsForSnapshotAsync` calls `TryGetSnapshotDetailAsync` and then uses only `Resources` plus `AzureInventorySnapshotInventoryRowMapper.MapResource`. Properties, tags, and relationships are discarded after the read.

## Read first

- `ArchLucid.Application/InfraEvidence/InfraEvidenceDriftWorkbenchQueryService.cs` (`ListInventoryRowsForSnapshotAsync`)
- `AzureInventorySnapshotInventoryRowMapper`
- The resource-only repository method from **SN-PERF-11** if it is already on `master`. Reuse it. If it is not on `master`, add the same scoped resource list this prompt needs and leave the unchanged-diff branch alone.

## What to build

1. Branch `sn-perf/15-snapshot-inventory-rows` from current `master`.
2. After the sealed-manifest guard, load resources for the snapshot. If the snapshot header is missing, return null as today.
3. Apply the same NeverShow filter, optional `cloudResourceId` filter, ordinal sort, and `MapResource` mapping. Page with `PagedResponseBuilder.Build` as today.
4. Do not call `TryGetSnapshotDetailAsync` or `TryGetCanonicalSnapshotDetailAsync` from this method.

## Tests

1. A service test with two resources (one NeverShow, one visible) returns only the visible row, still ordered by ARM id.
2. A missing snapshot returns null.
3. The method does not call full snapshot detail.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: tenant-scoped resource read. The sealed-manifest guard stays.
- Scalability: one resource query per inventory page request. Do not add SQL paging in this prompt; the response is still paged in memory.
- Reliability: pass `CancellationToken`.
- Cost: no new index and no cache.
- Do not commit.

## Done when

Inventory rows for a snapshot match today’s visible resources, and the full snapshot detail read is not used.
