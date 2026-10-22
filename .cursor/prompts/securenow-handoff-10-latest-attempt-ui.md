# SN-HAND-10 — Show the latest remediation attempt on Audit evidence

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md`

**Depends on:** SN-HAND-09 on `master`. If lineage does not return `latestRemediationAttempt`, stop and say so.

## Goal

Audit evidence shows the latest remediation attempt under the spine when the lineage payload includes one. The row names the instance and the real status. It does not mark the control as evidenced.

## Why

SN-HAND-09 returns the id. The analyst still cannot see it. SN-HAND-08 already lists verified associations. This row is the attempt that has no association row: a failed check, a check still waiting, or a verified instance that never wrote an association.

## Read first

- `archlucid-ui/src/app/(operator)/governance/audit-evidence/[assessmentId]/snapshots/[snapshotId]/controls/[controlId]/AuditEvidenceLineageSpine.tsx`
- `archlucid-ui/src/lib/audit-evidence-lineage-types.ts`
- `archlucid-ui/src/lib/audit-evidence-lineage-parse.ts`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-workbench-url.ts` (`buildRemediationWorkbenchHref`)
- `docs/securenow/ENGINEER_ANALYST_HANDOFF.md` gap 4 and "What not to build"

## What to build

Branch from current `master` as `cursor/sn-hand-10-latest-attempt-ui`. If the session requires a branch suffix, append it.

**Audit evidence lineage.** When `latestRemediationAttempt` is non-null, render one row under the spine, after the verified-remediation rows from SN-HAND-08 (or in that same spot when that list is empty).

- Heading: `Latest remediation attempt`.
- Status label, sentence case, from the returned status only:
  - `VerificationFailed` → `Verification failed`
  - `ChangeImplemented` → `Awaiting verification`
  - `Verified` → `Verified`
- Link the instance id to Remediation tracker with `instanceId` set, using `buildRemediationWorkbenchHref`.
- When `latestRemediationAttempt` is null or missing, render nothing in that spot.
- Do not repeat an instance id that is already listed under `verifiedRemediationAssociations`. If the payload repeats one, show the association row only.

Do not check the positive checkbox. Do not change `ReadyForPositiveCheckbox` copy. Do not say the control is evidenced, attested, or checked. Do not add a findings list. Do not change Remediation tracker in this session.

Map the field in the existing lineage parser. Null or a missing property means no row.

## Tests

1. A `VerificationFailed` attempt renders `Verification failed`, the instance id, and a Remediation tracker link. The positive checkbox is not checked.
2. A `ChangeImplemented` attempt renders `Awaiting verification`.
3. A null attempt does not render the latest-attempt block.
4. An instance id already present in `verifiedRemediationAssociations` is not rendered twice.

From `archlucid-ui`, run `AuditEvidenceLineageSpine.test.tsx`. Run `npx tsc --noEmit -p tsconfig.json`.

## Concerns

- **Security.** The link uses the instance id the lineage response already returned. No new API.
- **Scale.** One object on the lineage payload. Do not fetch every instance in the tenant.
- **Reliability.** A missing field renders the page as it does today.
- **Cost.** No extra evidence download.

## Constraints

- Before editing a tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Do not hide a review workspace tab behind a More menu.
- Do not call Azure or apply Terraform.
- Do not commit.

## Done when

An analyst opening Audit evidence for a control with a failed or still-open check sees that instance and its status, and a control with only a verified association still shows that association once.
