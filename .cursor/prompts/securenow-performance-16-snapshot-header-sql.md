# SN-PERF-16 — One snapshot header SQL text

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

`TryGetBySnapshotIdAsync` and the header grid inside `TryGetCanonicalSnapshotDetailAsync` share one SQL text for the snapshot header.

## Why

**SN-PERF-09** put the header `SELECT` into the same `QueryMultiple` as the eight grids. That statement was copied from `TryGetBySnapshotIdAsync`. The two copies include the package join and the sibling-subscription `OUTER APPLY`. Editing one and not the other changes subscription id or name on detail reads only.

## Read first

- `ArchLucid.Persistence/InfraEvidence/SqlAzureInventorySnapshotRepository.cs` (`TryGetBySnapshotIdAsync`, `Map`)
- `ArchLucid.Persistence/InfraEvidence/SqlAzureInventorySnapshotRepository.Read.cs` (first grid of `TryGetCanonicalSnapshotDetailAsync`)
- `ArchLucid.Persistence.Tests/InfraEvidence/SqlAzureInventorySnapshotRepositorySqlIntegrationTests.cs`

## What to build

1. Branch `sn-perf/16-snapshot-header-sql` from current `master`.
2. Move the header `SELECT` into one private constant or builder used by both methods. Keep the same columns, joins, status parameters, and `Map` call.
3. `TryGetCanonicalSnapshotDetailAsync` still returns null when the header grid is empty, and still reads the eight grids from that same `QueryMultiple` when the header exists. Do not split the batch back into two round trips.
4. Do not change resource, property, tag, relationship, or the other grid statements.

## Tests

1. Existing snapshot SQL integration tests still load the same header fields and the same grids.
2. A focused test or comment-free assertion shows both call sites reference the shared SQL member (same constant, or the detail batch contains that constant). Do not snapshot the full SQL string in a brittle approval file.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: keep `TenantId`, `WorkspaceId`, `ProjectId`, and `SnapshotId` predicates on the header.
- Scalability: detail stays one round trip.
- Reliability: both paths still pass `CancellationToken`.
- Cost: no new index and no cache.
- Do not commit.

## Done when

There is a single header statement, and canonical detail still returns header plus eight grids from one command.
