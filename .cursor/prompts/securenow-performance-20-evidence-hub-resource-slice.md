# SN-PERF-20 — Evidence hub loads one resource slice

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

`CloudResourceEvidenceHubService.TryGetHubAsync` loads the current resource, its properties, its tags, the relationships that touch that ARM id, and the role assignments whose scope matches that ARM id. It does not hydrate the rest of the snapshot.

## Why

The hub calls `TryGetSnapshotDetailAsync` and then keeps one resource row, that row’s properties and tags, relationships whose from or to id equals the external resource id, and role assignments whose scope equals the ARM id or starts with `ARM id + "/"`. Properties, tags, relationships, role assignments, Defender rows, diagnostics, and ADF sources for every other resource are read and discarded.

## Read first

- `ArchLucid.Application/InfraEvidence/CloudResourceEvidenceHubService.cs` (`TryGetHubAsync`, `MapCurrentConfiguration`, `MapRbacAssignments`, `MapNetworkRelationships`, `ScopeMatchesResource`)
- `ArchLucid.Persistence/InfraEvidence/SqlAzureInventorySnapshotRepository.ListResourcesPaged.cs` (resource filter by `cloudResourceId` already exists)
- `ArchLucid.Application.Tests` coverage for the evidence hub, if a service test already exists

## What to build

1. Branch `sn-perf/20-evidence-hub-resource-slice` from current `master`.
2. Add scoped reads, or reuse an existing paged resource read, that return:
   - the one resource row for `TenantId` + `SnapshotId` + `CloudResourceId` (missing snapshot or missing resource stays the same as today: configuration, RBAC, and relationships empty)
   - properties for that `ResourceRowId` only, still omitting redacted values in the mapper
   - tags for that `ResourceRowId` only
   - relationships whose `FromAzureResourceId` or `ToAzureResourceId` equals the external resource id, ordinal-ignore-case
   - role assignments whose `Scope` equals the external resource id or starts with that id plus `/`, ordinal-ignore-case
3. Keep `CloudResourceEvidenceHubResponse` fields and the current configuration, RBAC, and relationship shapes.
4. Do not call `TryGetSnapshotDetailAsync` or `TryGetCanonicalSnapshotDetailAsync` from `TryGetHubAsync`.
5. Leave terraform mapping and recent-change loading alone. Those are **SN-PERF-21**.

## Tests

1. A hub test with two resources returns properties and tags only for the requested cloud resource id.
2. A relationship that does not touch the ARM id is absent. A role assignment on another resource is absent. A child scope (`ARM id + "/..."`) is still present.
3. The hub method does not call full snapshot detail.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: every read filters tenant and snapshot. Do not return another tenant’s properties or role assignments.
- Scalability: a handful of queries for one resource, not eight grids for the snapshot.
- Reliability: pass `CancellationToken`. The sealed-manifest guard stays.
- Cost: no new index and no cache.
- Do not commit.

## Done when

The hub JSON for one resource matches today’s configuration, RBAC, and relationships, and the full snapshot detail read is not on that path.
