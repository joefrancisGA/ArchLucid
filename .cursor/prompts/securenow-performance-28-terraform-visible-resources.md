# SN-PERF-28 — Advisory Terraform build from visible resources

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

`AdvisoryTerraformRepresentationService.TryBuildFromSnapshotAsync` builds mappings from the same visible resource rows snapshot detail would keep. It does not load tags, role assignments, diagnostics, Defender rows, or ADF sources.

## Why

The service calls `TryGetSnapshotDetailAsync`. `AdvisoryTerraformRepresentationBuilder.Build` reads `Header.SnapshotId` and `Resources` only. Visibility still matters: detail drops NeverShow types and private-link-only NICs. `AzureInventoryPrivateLinkOnlyNicCatalog.BuildOmittedNicArmIdsFromSnapshot` needs resources, relationships, and properties. The other grids are unused.

## Read first

- `ArchLucid.Application/InfraEvidence/AdvisoryTerraformRepresentationService.cs`
- `ArchLucid.Application/InfraEvidence/AdvisoryTerraformRepresentationBuilder.cs`
- `ArchLucid.Core/AzureExtractor/AzureInventoryVisibleSnapshotProjection.cs` (`Apply`)
- `ArchLucid.Core/AzureExtractor/AzureInventoryPrivateLinkOnlyNicCatalog.cs`

## What to build

1. Branch `sn-perf/28-terraform-visible-resources` from current `master`.
2. Load the snapshot header, resources, relationships, and properties for that snapshot. If the header is missing, keep today’s failure (`Snapshot was not found in the current scope.`).
3. Run the same visibility projection detail uses (`retainIdentityDiagramArmTypes` false) and pass that resource list to `AdvisoryTerraformRepresentationBuilder.Build`. Address text, category folder, generation method, and uncertainty notes stay the same.
4. Do not call `TryGetSnapshotDetailAsync` or `TryGetCanonicalSnapshotDetailAsync` from this method.
5. Leave mapping replace and the sealed-manifest guard as they are.

## Tests

1. A NeverShow resource is absent from the mappings. A normal resource is present, ordered by ARM id as today.
2. A private-link-only NIC that detail would omit is absent. A NIC that detail would keep is present.
3. The build method does not call full snapshot detail.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: header, resources, relationships, and properties filter on tenant and snapshot.
- Scalability: four grids, not eight.
- Reliability: pass `CancellationToken`. The sealed-manifest guard stays.
- Cost: no new index and no cache.
- Do not commit.

## Done when

Advisory Terraform mappings match a build from today’s visible resources, and tags, role assignments, diagnostics, Defender, and ADF are not loaded.
