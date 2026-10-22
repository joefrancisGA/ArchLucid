# SN-PERF-26 — Verification reads one resource, not two snapshots

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug. Do not implement another SN-PERF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_PERFORMANCE_LUNA_PROMPTS.md`

## Goal

`RemediationInstanceService.VerifyAsync` decides chronology from snapshot headers and evaluates property queries from the target resource. It does not load either snapshot’s full detail, and it does not list every evidence path when the path-hash check cannot run.

## Why

`VerifyAsync` calls `TryGetSnapshotDetailAsync` for the execution snapshot and again for the verification snapshot. The evaluator uses the execution snapshot only for `Header.CapturedUtc`. On the verification snapshot it uses header chronology plus the resource whose `CloudResourceId` matches the instance, and that resource’s properties for `property:` queries. `snapshot.resource.present` is the same resource. When a path narrative exists, the method also calls `ListBySnapshotAsync` for every path on the verification snapshot, then builds a context with `PathAnalysisCompleted = false`. The evaluator returns the “path analysis did not complete” failure before it reads `VerificationSnapshotPaths`.

## Read first

- `ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceService.cs` (`VerifyAsync`)
- `ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceVerificationEvaluator.cs`
- The resource and property reads from **SN-PERF-20** / **SN-PERF-22** if they are already on `master`. Reuse them. Leave preflight alone. That is **SN-PERF-22**.

## What to build

1. Branch `sn-perf/26-verification-resource-slice` from current `master`.
2. Load the execution snapshot with the header read (`TryGetBySnapshotIdAsync`). Missing header stays `Execution inventory snapshot was not found.`
3. Load the verification snapshot header the same way. Missing header stays `Verification inventory snapshot was not found.`
4. Load the one verification resource for the instance’s cloud resource id, and that row’s properties. A missing resource still fails `snapshot.resource.present` and property queries the same way. Redacted property values stay omitted from the comparison the same way a full detail read omits them today only if the current property query already ignores `IsRedacted`; do not change the match rule.
5. While the context passed to the evaluator keeps `PathAnalysisCompleted` false, do not call `ListBySnapshotAsync`. Keep that flag and the failure text.
6. If a later edit sets `PathAnalysisCompleted` true, replace the full path list with one scoped existence check on `CanonicalHopHashSha256` for that snapshot. Do not flip the flag in this prompt.
7. Do not change preflight.

## Tests

1. A property query on the instance resource still passes or fails with the same text.
2. A property that exists only on another resource in the verification snapshot does not satisfy the query.
3. Chronology still uses both headers’ capture times. Reusing the execution snapshot id still fails.
4. With `PathAnalysisCompleted` false, verification does not call `ListBySnapshotAsync` or `TryGetSnapshotDetailAsync`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'` (Cloud Agent: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`). Stop on exit code 2.
- Security: tenant-scoped header, resource, and property reads.
- Scalability: two header reads and, when the instance has a cloud resource id, one resource lookup and one property lookup.
- Reliability: pass `CancellationToken`. The sealed-manifest guard stays.
- Cost: no new index and no cache.
- Do not commit.

## Done when

Verification results match today’s evaluator, and the two full snapshot detail reads are not on that path.
