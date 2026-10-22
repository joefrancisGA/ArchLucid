# SN-HAND-06 — Write the association when verification passes

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md`

**Depends on:** SN-HAND-05 on `master`. If the association table is not on `master`, stop and say so. Do not implement SN-HAND-07 in this session.

## Goal

When a remediation instance becomes `Verified`, and it already has both a control id and a verification inventory snapshot id, write one association row. Return that row on the existing instance detail. A failed check writes nothing.

## Why

SN-HAND-05 stores the row and does not write it. The handoff is the moment a passed check cites the control. A failed check leaves the control unevidenced, so it must not create or delete the association.

## Read first

- `ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceService.cs` (the verify method that sets `Verified` or `VerificationFailed`)
- `ArchLucid.Application/InfraEvidence/RemediationInstances/RemediationInstanceQueryService.cs`
- The SN-HAND-05 repository
- `docs/securenow/ENGINEER_ANALYST_HANDOFF.md` gap 5

## What to build

Branch from current `master` as `cursor/sn-hand-06-verified-association`. If the session requires a branch suffix, append it.

In the existing verify success path, after the instance update:

1. If `verification.Passed` is false, do not write an association and do not delete an older one. The instance still becomes `VerificationFailed` as it does today.
2. If `ControlId` is null or `VerificationSnapshotId` is null, verification still succeeds and no association is written. Do not invent a control id.
3. If both ids are present, upsert the association in the same scope. `AssessmentId` is copied from the instance when it is present.
4. If that upsert fails, the verify call fails. Do not leave the instance `Verified` without the row when both ids were present.
5. A second pass of the same instance, snapshot, and control updates the existing row.

Add the association to `RemediationInstanceDetail` as a list of identifier rows: association id, instance id, verification snapshot id, control id, assessment id, created utc, updated utc. Empty when none exist. Do not add payload JSON.

Regenerate OpenAPI and the UI client types with `ARCHLUCID_REGENERATE_UI_API_TYPES=1 bash scripts/ci/update_openapi_contract_snapshot.sh` because the detail response grows. Do not hand-edit the generated JSON. Do not build the lineage or page UI in this session.

## Tests

1. A passing verify with both ids writes one row and the detail lists it.
2. The same verify again does not insert a second row.
3. A passing verify with a new snapshot id inserts a second row.
4. A passing verify with a null control id succeeds and writes no row.
5. A failed verify writes no row and leaves an older row in place.
6. Another tenant's detail does not include the row.

## Concerns

- **Security.** The write uses the same project scope as the instance update. No Azure write.
- **Scale.** One identifier row. The detail list is the rows for that instance only.
- **Reliability.** The association write is part of verify success when both ids exist, so a `Verified` instance is not missing its statement.
- **Cost.** No extra snapshot storage.

## Constraints

- Before editing a tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Explicit types over `var`. Null-check inputs. A blank line before `if` and `foreach` unless it is the first line in the method. No `ConfigureAwait(false)` in tests.
- Do not change `ReadyForPositiveCheckbox`, human disposition, or audit evidence lineage.
- Do not copy snapshot bytes or `VerificationResultJson` onto the association.
- Do not commit.

## Done when

A passed check with a control and a verification snapshot shows that association on instance detail, and a failed check does not create one.
