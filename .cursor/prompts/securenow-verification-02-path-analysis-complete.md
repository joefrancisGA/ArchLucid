# SN-VF-02 — Path absence requires completed analysis

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SN-VF-03 in this session.

**Repo:** `c:\ArchLucid`

**Requires:** SN-VF-01 is already in the tree. Keep its chronology and capture-status failures.

## Goal

`path:hash-absent=` must not pass just because the verification snapshot has no stored paths.

## Why

`VerifyAsync` loads `pathRepository.ListBySnapshotAsync` and `EvaluatePathHashAbsentQuery` treats "hash not in that list" as success. If path enumeration never ran, the list is empty and a still-present path looks remediated. That is lost visibility reported as verification.

There is no queryable per-snapshot "path analysis completed" record to reuse. `SecureNowArchitectNeighborhoodRecomputeResult` is an in-memory result. Do not treat an audit event as completion proof in this session.

## Read first

- `ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationPathVerificationContext.cs`
- `ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceVerificationEvaluator.cs` (`EvaluatePathHashAbsentQuery`)
- `ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceService.cs` (`VerifyAsync`)
- `ArchLucid.Application.Tests/InfraEvidence/RemediationInstanceVerificationEvaluatorPathTests.cs`

## What to build

Add `PathAnalysisCompleted` to `RemediationPathVerificationContext`. Default it to `false`.

`EvaluatePathHashAbsentQuery` fails when `PathAnalysisCompleted` is false, including when the hash is absent. The failure text must say path analysis did not complete for the verification snapshot.

`VerifyAsync` sets `PathAnalysisCompleted` to `false`. An empty path list is not completion. Do not add a collector, a path engine, or a new completion table in this session. Fail-closed is the intended ship state until a later session has a real completion signal.

When `PathAnalysisCompleted` is true and the hash is absent, the query still passes. When it is true and the hash is still present, the query still fails.

## Tests

`Evaluate_path_hash_absent_passes_when_equivalent_path_missing` currently passes with an empty path list. Set `PathAnalysisCompleted` true on that context so a completed analysis with a genuinely absent hash still passes.

Add a test: `PathAnalysisCompleted` false, empty path list, same hash query → fail, and the failure mentions analysis did not complete.

Keep the existing test that fails when the hash is still present. That context must set `PathAnalysisCompleted` true so the failure remains "path still present," not the new analysis failure.

Do not weaken SN-VF-01 tests.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Do not default the flag to true anywhere on the production path.
- Do not add `ChangeImplemented`. Do not change the UI.
- One class per file. No `ConfigureAwait(false)` in tests.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- Run the verification evaluator tests.
- Do not commit.

## Done when

A missing path hash passes only when the caller explicitly marks path analysis complete, and `VerifyAsync` does not mark it complete.
