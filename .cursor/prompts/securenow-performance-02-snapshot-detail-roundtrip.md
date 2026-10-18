# SN-PERF-02 — One round trip for snapshot detail

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

`TryGetCanonicalSnapshotDetailAsync` loads resources, properties, tags, relationships, ADF external sources, role assignments, diagnostics, and Defender summaries in one SQL round trip.

## Why

The method awaits those eight queries one after another on one connection. `SecureNowAnalysisRun.LoadAsync` is the shared input for privilege, reachability, toxic combination, ranking, and neighborhood recompute. `ListWithHopsBySnapshotAsync` already uses `QueryMultiple` for paths and hops. The snapshot read should do the same. Eight separate connections would add pool pressure without a consistency benefit.

## Read first

- `ArchLucid.Persistence/InfraEvidence/SqlAzureInventorySnapshotRepository.Read.cs`
- `ArchLucid.Persistence/InfraEvidence/SqlSecurityEvidencePathRepository.Batch.cs` (`QueryMultiple` pattern)
- `ArchLucid.Application/InfraEvidence/SecureNowArchitect/SecureNowAnalysisSnapshot.cs`
- `ArchLucid.Persistence.Tests/InfraEvidence/SqlAzureInventorySnapshotRepositorySqlIntegrationTests.cs`

## What to build

1. Branch `sn-perf/02-snapshot-detail-roundtrip` from current `master`.
2. Keep the header lookup (`TryGetBySnapshotIdAsync`) first. When the header is missing, return null and do not run the grids.
3. On the open connection, run one `QueryMultiple` whose batches are the eight existing `SELECT`s, in the same column lists and the same `TenantId` + `SnapshotId` filter. Read them in that order into the same `AzureInventorySnapshotDetailReadModel` the method returns today, including the relationship `ProvenanceKind` cast.
4. Leave `SecureNowAnalysisSnapshot`'s read-only copies in place. Sharing the repository lists with later mutation would be a worse bug than the extra arrays.
5. Do not add columns, tables, or a second repository method. Callers of `TryGetSnapshotDetailAsync` and `TryGetCanonicalSnapshotDetailAsync` stay on those methods.

## Tests

1. `SqlAzureInventorySnapshotRepositorySqlIntegrationTests` still returns the same resources, properties, tags, relationships, and the other grids for a seeded snapshot, and still returns null for another tenant.
2. If that suite needs a live SQL Server you cannot start, add a focused test that fails when `TryGetCanonicalSnapshotDetailAsync` issues more than one command after the header lookup. Prefer the existing integration test when SQL is available.
3. A snapshot with an empty relationship grid still returns empty lists, not null.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: every batch keeps `TenantId = @TenantId`. Do not drop the snapshot id predicate.
- Scalability: one round trip, one connection, same rows as today.
- Reliability: cancel the command with the caller's `CancellationToken`. Dispose the grid reader and the connection the way `ListWithHopsBySnapshotAsync` does.
- Cost: no new index and no cache.
- Do not commit.

## Done when

A canonical snapshot detail contains the same eight collections, and those collections come from one command after the header lookup.
