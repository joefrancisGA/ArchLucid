# SN-VF-03 — Verified requires a substantive postcondition

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SN-VF-04 in this session.

**Repo:** `c:\ArchLucid`

**Requires:** SN-VF-01 and SN-VF-02 are already in the tree. Keep both.

## Goal

Verification fails unless at least one substantive postcondition was evaluated and passed.

## Why

`Evaluate` sets `Passed` from an empty failure list. An instance with no verification queries, and no path narrative queries, passes. `snapshot.resource.present` only proves the resource row exists.

## Read first

- `ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceVerificationEvaluator.cs` (`Evaluate`, `EvaluateQuery`)
- `ArchLucid.Application.Tests/InfraEvidence/RemediationInstanceVerificationEvaluatorPathTests.cs`
- Any other test that calls `RemediationInstanceVerificationEvaluator.Evaluate`

## What to build

After the existing query loop, fail when no substantive query passed.

A query is substantive only when it is one of:

- `property:` and it passed
- `path:hash-absent=` and it passed

`snapshot.resource.present` is not substantive. It may still run and may still fail the instance when the resource is missing. It cannot by itself produce `Passed`.

Whitespace-only queries do not count. An unsupported query still fails, as it does today.

Empty `Execution.VerificationQueries` and no path-narrative queries fail with an explicit failure that a substantive postcondition is required.

One passing `property:` query is enough even if `snapshot.resource.present` is also present. One passing `path:hash-absent=` query is enough, subject to SN-VF-02 (`PathAnalysisCompleted` must already be true for that query to pass).

## Tests

Search every `Evaluate` caller. Tests that expected `Passed` with no substantive query must now expect failure.

Add tests:

- no queries → fail, failure names the missing postcondition
- only `snapshot.resource.present` and the resource exists → fail
- `snapshot.resource.present` plus a passing `property:` query → pass, when SN-VF-01 chronology inputs are valid
- a `property:` query that does not match → fail, and do not also claim the postcondition was satisfied

Keep SN-VF-01 and SN-VF-02 failures. The narrative in `RemediationInstanceVerificationEvaluatorPathTests` already includes a `property:` query and a `path:hash-absent=` query; do not delete those to make a test pass.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Do not add a new query language. Do not add `ChangeImplemented`. Do not change the UI.
- One class per file. No `ConfigureAwait(false)` in tests.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- Run the verification evaluator tests.
- Do not commit.

## Done when

`Passed` is true only when chronology and capture status hold, every evaluated query passed, and at least one substantive query passed.
