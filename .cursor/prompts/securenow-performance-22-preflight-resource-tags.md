# SN-PERF-22 — Preflight production tag from one resource

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

Remediation preflight decides the production tag from the target resource and its tags. It does not load the full inventory snapshot.

## Why

`RemediationInstanceService` preflight calls `TryGetSnapshotDetailAsync`. `RemediationInstancePreflightEvaluator.DetectProductionTag` uses only the resource whose `CloudResourceId` matches the instance, then tags on that `ResourceRowId` (`environment=production` or `production=true`, ordinal-ignore-case). The rest of the snapshot is unused.

## Read first

- `ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceService.cs` (preflight snapshot load)
- `ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstancePreflightEvaluator.cs` (`DetectProductionTag`)
- The resource-only read from **SN-PERF-11** / **SN-PERF-20** if it is already on `master`. Reuse a resource lookup by cloud resource id. Add a tag read for that resource row if none exists.

## What to build

1. Branch `sn-perf/22-preflight-resource-tags` from current `master`.
2. On the preflight path, load the one resource and its tags. If the snapshot header is missing, keep today’s failure (`Inventory snapshot was not found.`). If the resource is missing, production-tagged stays false, as today.
3. Keep the same tag rules and the same blocker text.
4. Do not change verification. Verification still loads the execution snapshot and the verification snapshot with `TryGetSnapshotDetailAsync`.

## Tests

1. A production tag on the instance’s resource still blocks or flags the same way the current evaluator does.
2. A production tag on a different resource in the same snapshot does not count.
3. The preflight path does not call full snapshot detail.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: tenant-scoped resource and tag read.
- Scalability: one resource lookup and one tag lookup.
- Reliability: pass `CancellationToken`.
- Cost: no new index and no cache.
- Do not commit.

## Done when

Preflight’s production-tag result matches today’s evaluator, and the full snapshot detail read is not on the preflight path.
