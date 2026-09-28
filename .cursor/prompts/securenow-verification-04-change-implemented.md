# SN-VF-04 — Attested change implemented

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement SN-VF-05 in this session.

**Repo:** `c:\ArchLucid`

**Requires:** SN-VF-01, SN-VF-02, and SN-VF-03 are already in the tree. Keep them.

## Goal

Advisory execution and a human attestation that the external change happened are different states. Verification runs only after that attestation, and the verification snapshot must be captured after it.

## Why

`ExecuteAsync` sets `advisoryOnly = true` and stores the pre-change inventory snapshot as `ExecutionSnapshotId`. Nothing in the system records when someone changed Azure. Chronology against that snapshot cannot mean "evidence collected after the actual external change."

## Read first

- `ArchLucid.Core/InfraEvidence/RemediationInstanceStatus.cs`
- `ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceGuard.cs`
- `ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceService.cs` (`ExecuteAsync`, `VerifyAsync`, `CloneInstance`)
- `ArchLucid.Persistence/InfraEvidence/SqlRemediationInstanceRepository.cs`
- `ArchLucid.Persistence/Migrations/360_RemediationInstances.sql`
- `ArchLucid.Persistence/Migrations/384_RemediationInstancePathNarrative.sql` (idempotent column-add shape)
- `ArchLucid.Api/Controllers/InfraEvidence/RemediationInstancesController.cs` (`Execute`, `Verify`)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-remediation-types.ts`

## What to build

Append `ChangeImplemented = 9` on `RemediationInstanceStatus`. Do not renumber values `0` through `8`. Stored rows use the integer.

Transitions in `RemediationInstanceGuard`:

- `Executed` → `ChangeImplemented`
- `ChangeImplemented` → `Verified`
- `ChangeImplemented` → `VerificationFailed`

Remove `Executed` → `Verified` and `Executed` → `VerificationFailed`.

Add `AttestChangeImplementedAsync` on the instance service, next to `ExecuteAsync`. It requires status `Executed`, a non-empty `actorKey`, and then sets status `ChangeImplemented` and `ChangeImplementedUtc` to the current UTC time. The creator may attest. This is a report of an external change, not an approval. Do not change the rule that the creator cannot approve their own instance.

`VerifyAsync` requires status `ChangeImplemented`. It fails when `ChangeImplementedUtc` is null. In addition to the SN-VF-01 rule (verification `CapturedUtc` strictly later than execution `CapturedUtc`), verification `CapturedUtc` must be strictly later than `ChangeImplementedUtc`.

`ExecuteAsync` stays advisory. Do not apply Terraform or call Azure write APIs.

### Persistence

Add nullable `ChangeImplementedUtc DATETIME2` to `dbo.RemediationInstances`.

- New forward script: the next free number under `ArchLucid.Persistence/Migrations/`. Idempotent `COL_LENGTH` guard, same shape as `384_RemediationInstancePathNarrative.sql`.
- Matching rollback under `ArchLucid.Persistence/Migrations/Rollback/`.
- Read and write the column everywhere `SqlRemediationInstanceRepository.cs` already reads or writes `ExecutedUtc`.
- Thread it through the instance record and `CloneInstance`.

### API

Add `POST {instanceId}/attest-change-implemented` beside `Execute` and `Verify` in `RemediationInstancesController`. Same authorization policy as `Verify`. No body is required. Return `MapOperationResult`.

`RemediationInstanceStatus` is in `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json`. Regenerate that contract the way this repo already does:

`ARCHLUCID_REGENERATE_UI_API_TYPES=1 bash scripts/ci/update_openapi_contract_snapshot.sh`

from the repo root. Do not hand-edit the snapshot.

Add `"ChangeImplemented"` to the hand-maintained union in `archlucid-ui/src/lib/infra-evidence/infra-evidence-remediation-types.ts`. Map it to the existing `executed` column so the workbench still compiles. Do not relabel columns. SN-VF-05 owns labels.

## Tests

- Guard: `Executed` cannot go directly to `Verified` or `VerificationFailed`.
- Attest succeeds from `Executed` and records `ChangeImplementedUtc`.
- Verify from `Executed` fails.
- Verify from `ChangeImplemented` fails when verification `CapturedUtc` is not strictly later than `ChangeImplementedUtc`.
- Verify from `ChangeImplemented` still fails SN-VF-01, SN-VF-02, and SN-VF-03 cases.
- A controller test covers the new route's validation or success mapping, following `RemediationInstancesControllerTests`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Do not insert the enum value between `Executed` and `Verified`.
- Do not build workbench labels. Do not add identity collectors.
- One class per file. No `ConfigureAwait(false)` in tests.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- If the controller test project must compile, run one additional compile of `ArchLucid.Api.Tests/ArchLucid.Api.Tests.csproj`.
- Run the new attestation and verification tests only.
- Do not commit.

## Done when

Advisory execute, attested implementation, and verification are three statuses, and verification evidence must be captured after the attestation.
