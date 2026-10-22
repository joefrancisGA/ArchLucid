# SN-VF-01 — Verification chronology and capture status

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SN-VF-02 in this session.

**Repo:** `c:\ArchLucid`

## Goal

A remediation instance must not pass verification unless the verification inventory snapshot was captured strictly later than the execution snapshot, and that capture succeeded.

## Why

`RemediationInstanceVerificationEvaluator.Evaluate` rejects only the same snapshot ID. An older snapshot with a different ID passes. `CapturedUtc` and `CaptureStatus` are already on `AzureInventorySnapshotRecord` and are not consulted. `VerifyAsync` does not load the execution snapshot, so it cannot supply the missing comparison.

## Read first

- `docs/securenow/OPENAI_ASTRA_SGS_REVIEW_2026-09-27_AND_RESPONSE.md` (Part 2, Better #1 chronology row)
- `ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceVerificationEvaluator.cs`
- `ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceService.cs` (`VerifyAsync`)
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/AzureInventorySnapshotRecord.cs`
- `ArchLucid.Core/InfraEvidence/AzureInventoryCaptureStatus.cs`
- `ArchLucid.Application.Tests/InfraEvidence/RemediationInstanceVerificationEvaluatorPathTests.cs`

## What to build

Extend `Evaluate` so the caller passes the execution snapshot `CapturedUtc` (`DateTime?`). Do not hide that value inside the verification snapshot.

Fail verification when any of these is true:

1. The verification snapshot ID equals the execution snapshot ID. Keep this check.
2. The execution `CapturedUtc` is null.
3. The verification `CapturedUtc` is null.
4. The verification `CapturedUtc` is less than or equal to the execution `CapturedUtc`.
5. The verification `CaptureStatus` is not `Succeeded`. `Pending`, `Partial`, and `Failed` all fail.

Compare `CapturedUtc` only. Do not use `CreatedUtc`.

In `VerifyAsync`, load the execution snapshot. If it cannot be loaded, return the existing failed operation result and do not call `Evaluate`. Pass its `CapturedUtc` into `Evaluate`.

Name each failure so a reviewer can tell chronology apart from capture status.

## Tests

Update `CreateSnapshot` and the existing passing tests so the verification `CapturedUtc` is strictly later than the execution `CapturedUtc` you pass, and `CaptureStatus` stays `Succeeded`.

Add tests that fail for:

- an older verification snapshot with a different ID
- a null verification `CapturedUtc`
- a null execution `CapturedUtc`
- `Partial`, `Failed`, and `Pending`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Do not add `ChangeImplemented`. Do not change `path:hash-absent=` behavior. Do not change the UI.
- Do not renumber `RemediationInstanceStatus`.
- One class per file. No `ConfigureAwait(false)` in tests.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- Run the verification evaluator tests and any `VerifyAsync` test you had to change.
- Do not commit.

## Done when

An older snapshot, a same-ID snapshot, a null `CapturedUtc`, and any capture that is not `Succeeded` all fail verification, and a later `Succeeded` snapshot still reaches the existing query checks.
