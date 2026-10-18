# SN-PERF-23 — Remediation instance list seals runs in one batch

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

`RemediationInstanceQueryService.ListInstancesAsync` fail-closes on sealed manifests with one pass over the distinct findings, assessments, and runs on the page. It does not repeat that lookup once per instance.

## Why

The list loads instances, then calls `RemediationInstanceSealedManifestHashGuard.EnsureFindingLinkedRunSealedManifestHashOrThrowAsync` inside a `foreach`. Each call loads the finding, then the assessment’s architecture links, then checks one run. Instances that share a finding or an assessment repeat the same reads. The check stays fail-closed: a sealed run still throws.

## Read first

- `ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceQueryService.cs` (`ListInstancesAsync`)
- `ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceSealedManifestHashGuard.cs`
- `GovernanceDispositionSealedManifestGuard.EnsureRunSealedManifestHashOrThrowAsync`

## What to build

1. Branch `sn-perf/23-instance-list-seal-batch` from current `master`.
2. After the instance list is loaded, collect distinct finding ids. Load those findings in one scoped read (a new batch method, or the existing list filtered to those ids). Skip findings with no assessment id, as the guard does today.
3. Load architecture links once per distinct assessment id. Take the first non-empty run id the same way the guard does (`FirstOrDefault` on the link list order the repository already returns).
4. Call the sealed-manifest run check once per distinct run id.
5. Leave single-instance `TryGetInstanceAsync` on the existing per-finding guard. Do not weaken a throw into a skip.

## Tests

1. Two instances that share a finding call the finding read once for the list, and the run check once.
2. A sealed run still fails the list the same way a single guard call fails today.
3. An instance whose finding has no assessment id is still returned.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: finding and link reads stay inside the caller’s project scope. Do not seal-check a run from another tenant.
- Scalability: distinct findings, assessments, and runs, not one round trip per instance.
- Reliability: pass `CancellationToken`. Fail closed.
- Cost: no new index and no cache.
- Do not commit.

## Done when

The instance list still refuses a sealed linked run, and it does not query the finding and the assessment links once per row.
