# SN-PERF-21 — Evidence hub terraform and recent changes for one resource

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

The evidence hub resolves the terraform address and the recent inventory changes for one cloud resource without loading every mapping or every change row on the snapshot diff.

## Why

`ResolveTerraformMappingAsync` calls `ListMappingsBySnapshotIdAsync` and then picks one `CloudResourceId`. `ResolveRecentChangesAsync` calls `ListChangesByDiffIdAsync` and then filters to that cloud resource id, taking 25. Both lists are snapshot-wide.

## Read first

- `ArchLucid.Application/InfraEvidence/CloudResourceEvidenceHubService.cs` (`ResolveTerraformMappingAsync`, `ResolveRecentChangesAsync`)
- `ArchLucid.Persistence/InfraEvidence/SqlAdvisoryTerraformRepresentationRepository.cs` (`ListMappingsBySnapshotIdAsync`)
- `ArchLucid.Persistence/InfraEvidence/SqlAzureInventoryDiffRepository.cs` (`ListChangesByDiffIdAsync`)

## What to build

1. Branch `sn-perf/21-evidence-hub-satellites` from current `master`.
2. Add a scoped lookup that returns the terraform mapping for `TenantId` + `SnapshotId` + `CloudResourceId`, or null when none exists. Use it from `ResolveTerraformMappingAsync`. Keep the same address and generation-method strings.
3. Add a scoped change read for one diff and one `CloudResourceId`, ordered the same way the in-memory filter is stable today, capped at the existing `RecentChangeTake` (25). Use it from `ResolveRecentChangesAsync`. An empty result stays an empty list.
4. Do not change how the prior snapshot or the diff summary is chosen.
5. Leave the full snapshot detail read alone. That is **SN-PERF-20**.

## Tests

1. A mapping that belongs to another cloud resource id is not returned.
2. Recent changes include only the requested cloud resource id, and at most 25 rows.
3. The hub path does not call `ListMappingsBySnapshotIdAsync` or `ListChangesByDiffIdAsync`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: tenant-scoped. A mapping or change in another tenant is not returned.
- Scalability: one mapping lookup and one filtered change query.
- Reliability: pass `CancellationToken`.
- Cost: no new index and no cache.
- Do not commit.

## Done when

Terraform address and recent changes for one resource match today’s hub fields, and the snapshot-wide mapping and change lists are not loaded.
