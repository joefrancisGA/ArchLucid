# SN-HAND-09 — Return the latest remediation attempt on audit evidence lineage

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md`

**Depends on:** SN-HAND-07 and SN-HAND-08 on `master`. If lineage does not already return `verifiedRemediationAssociations`, stop and say so. Do not implement SN-HAND-10 in this session.

## Goal

The existing audit evidence lineage read returns one nullable `latestRemediationAttempt`: the remediation instance that last tried this control and does not already have a verified association row on this response. It does not score the control and it does not mark the control evidenced.

## Why

Gap 5 shows a passed check only when an association row exists. A failed check, or a check still waiting on a later snapshot, leaves the analyst with an open control and no instance id on Audit evidence. Gap 4 is that missing id and status. Home already counts `VerificationFailed`. This read names the instance.

## Read first

- `docs/securenow/ENGINEER_ANALYST_HANDOFF.md` gap 4 and "What not to build"
- `ArchLucid.Application/InfraEvidence/AuditEvidence/AuditEvidenceLineageService.cs`
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/AuditEvidenceLineageRecord.cs`
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/RemediationInstanceRecord.cs` (`ControlId`, `AssessmentId`, `Status`, `UpdatedUtc`)
- `ArchLucid.Core/InfraEvidence/RemediationInstanceStatus.cs`
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/IRemediationInstanceRepository.cs`
- `.cursor/prompts/securenow-handoff-hold.md`

## What to build

Branch from current `master` as `cursor/sn-hand-09-latest-attempt`. If the session requires a branch suffix, append it.

On `GET /v1/infra-evidence/audit-assessments/{assessmentId}/snapshots/{snapshotId}/controls/{controlId}/lineage`:

1. Keep the current lineage body, including `verifiedRemediationAssociations` and `ReadyForPositiveCheckbox`.
2. Add `latestRemediationAttempt`: `null`, or one object with `instanceId`, `status`, `controlId`, and `updatedUtc`.
3. A candidate is a remediation instance in the lineage project scope whose `ControlId` equals this lineage control id.
4. When the instance `AssessmentId` is non-null, it must equal this lineage assessment id. A null `AssessmentId` may still match on `ControlId` alone. Do not match through pack rule text, finding category, or `policyRuleId`.
5. The instance status must be `ChangeImplemented`, `VerificationFailed`, or `Verified`. Earlier statuses (`Classified` through `Executed`, and `Closed`) are not an attempt to satisfy the control.
6. Drop any candidate whose `instanceId` is already in this response's `verifiedRemediationAssociations`. Gap 5 remains the only place a verified association is listed.
7. When more than one candidate remains, keep the one with the latest `UpdatedUtc`. Break ties by `instanceId` ascending so the choice is stable.
8. When no candidate remains, return `null`. Do not invent an instance. Do not require an inventory-snapshot link. Gap 5 still requires that link for association rows.
9. Another tenant still receives the current not-found result. Do not leak instance ids.

Do not add a table. Read existing remediation instances. Add a scoped list-by-control query on the existing repository (SQL and in-memory). Do not scan the tenant in the HTTP handler and filter in memory when a control-id query can do it.

Do not change `ReadyForPositiveCheckbox`, `ChainComplete`, evaluation outcome, or human disposition. Do not copy `VerificationResultJson` or snapshot bytes. Do not add a score, a rank, or an "evidenced" flag.

Regenerate OpenAPI and the UI client types with `ARCHLUCID_REGENERATE_UI_API_TYPES=1 bash scripts/ci/update_openapi_contract_snapshot.sh`. Do not hand-edit the generated JSON. Do not change the lineage page in this session.

## Tests

1. `VerificationFailed` with `ControlId` equal to the lineage control returns that instance id and status. `ReadyForPositiveCheckbox` is unchanged.
2. `ChangeImplemented` is eligible. `Executed` and `Classified` are not.
3. `Verified` with no association row is eligible. `Verified` already present in `verifiedRemediationAssociations` is omitted, and `latestRemediationAttempt` is `null` when that was the only candidate.
4. Two eligible instances: the newer `UpdatedUtc` wins. Equal timestamps: the smaller `instanceId` wins.
5. An instance whose `AssessmentId` is a different assessment is omitted. An instance with a null `AssessmentId` and the same `ControlId` is eligible.
6. A different control id returns `null`.
7. Another tenant does not receive the instance id.

## Concerns

- **Security.** The lookup uses the lineage scope. No new route and no cross-tenant id.
- **Scale.** One control in one project. Return one object, not every instance in the tenant.
- **Reliability.** No candidate yields `null`. The lineage call still succeeds.
- **Cost.** Identifiers and a status. No second copy of verification JSON.

## Constraints

- Before editing a tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Explicit types over `var`. Null-check inputs. A blank line before `if` and `foreach` unless it is the first line in the method. No `ConfigureAwait(false)` in tests.
- Do not implement SN-HAND-10. Do not render the attempt on Audit evidence in this session.
- Do not re-implement gaps 1–3 or SN-HAND-05–08.
- Do not let the response say the control is evidenced, attested, or checked.
- Do not call Azure or apply Terraform.
- Do not commit.

## Done when

Lineage for a control with a failed or still-open check returns that instance id and status, and a control whose only verified instance is already in `verifiedRemediationAssociations` returns `latestRemediationAttempt: null`.
