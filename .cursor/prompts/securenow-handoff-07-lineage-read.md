# SN-HAND-07 — Return the association on audit evidence lineage

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md`

**Depends on:** SN-HAND-06 on `master`. If verify does not write the association, stop and say so. Do not implement SN-HAND-08 in this session.

## Goal

The existing audit evidence lineage read returns the association when the control matches and the audit evidence snapshot is already linked to that verification inventory snapshot. It does not score the control and it does not mark the control evidenced.

## Why

Analysts read Audit evidence, not the remediation instance table. Gap 5 is visible only when this read returns the row. Gap 4, which would return an instance that has no association row, is a different change and is out of this session.

## Read first

- `ArchLucid.Api/Controllers/InfraEvidence/AuditEvidenceLineageController.cs`
- `ArchLucid.Application/InfraEvidence/AuditEvidence/AuditEvidenceLineageService.cs`
- `ArchLucid.Core/Persistence/ApplicationPorts/InfraEvidence/AuditEvidenceLineageRecord.cs`
- `dbo.AuditEvidenceSnapshotInventoryLinks` (`AuditEvidenceSnapshotId` to `AzureInventorySnapshotId`)
- `docs/library/INFRA_EVIDENCE_PLANE.md` §6 and §7

## What to build

Branch from current `master` as `cursor/sn-hand-07-lineage-association`. If the session requires a branch suffix, append it.

On `GET /v1/infra-evidence/audit-assessments/{assessmentId}/snapshots/{snapshotId}/controls/{controlId}/lineage`:

1. Keep the current lineage body.
2. Add `verifiedRemediationAssociations`: a list of identifier rows (association id, instance id, status `Verified`, verification snapshot id, control id).
3. Include a row only when its `ControlId` equals the lineage control and its `VerificationSnapshotId` equals an `AzureInventorySnapshotId` already linked to this audit evidence snapshot in the same scope.
4. When the audit evidence snapshot has no inventory link, return an empty list. Do not guess a snapshot.
5. Order newest `UpdatedUtc` first. Return every match. Do not pick a winner and do not add a score.
6. Another tenant still receives the current not-found result. Do not leak association ids.

Do not change `ReadyForPositiveCheckbox`, `ChainComplete`, evaluation outcome, or human disposition. The association is context on the chain. It is not an auditor conclusion.

Regenerate OpenAPI and the UI client types with `ARCHLUCID_REGENERATE_UI_API_TYPES=1 bash scripts/ci/update_openapi_contract_snapshot.sh`. Do not hand-edit the generated JSON. Do not change the lineage page in this session.

## Tests

1. A linked inventory snapshot and a matching control return the association.
2. The same control with no inventory link returns an empty list and the rest of the lineage is unchanged.
3. A different control id returns an empty list.
4. Two instances for the same snapshot and control both appear, newest first.
5. `ReadyForPositiveCheckbox` is unchanged when an association exists.
6. Another tenant does not receive the row.

## Concerns

- **Security.** The lookup uses the lineage scope. No new route and no cross-tenant id.
- **Scale.** The list is the matches for one control and the linked inventory snapshots, not a tenant-wide scan in the response.
- **Reliability.** A missing inventory link yields an empty list. The lineage call still succeeds.
- **Cost.** No copied evidence rows.

## Constraints

- Before editing a tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Explicit types over `var`. Null-check inputs. A blank line before `if` and `foreach` unless it is the first line in the method. No `ConfigureAwait(false)` in tests.
- Do not implement gap 4. Do not return an instance that has no association row.
- Do not copy snapshot bytes into the response beyond the ids already named here.
- Do not commit.

## Done when

The lineage response lists the matching association ids, and a control without a linked verification snapshot still loads with an empty list.
