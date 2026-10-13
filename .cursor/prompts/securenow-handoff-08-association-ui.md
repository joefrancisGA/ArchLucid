# SN-HAND-08 — Show the association on Audit evidence and Remediation tracker

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md`

**Depends on:** SN-HAND-07 on `master`. If lineage does not return `verifiedRemediationAssociations`, stop and say so.

## Goal

Audit evidence shows each returned association as a verified remediation, with a link to that instance. Remediation tracker shows the association already on the instance detail. Neither page marks the control as evidenced.

## Why

The row exists and the lineage read returns it. The analyst and the engineer still cannot see it. The design note forbids treating the row as an AI disposition or as a positive audit checkbox.

## Read first

- `archlucid-ui/src/app/(operator)/governance/audit-evidence/[assessmentId]/snapshots/[snapshotId]/controls/[controlId]/AuditEvidenceLineageSpine.tsx`
- `archlucid-ui/src/lib/audit-evidence-lineage-types.ts` and the lineage query hook
- `archlucid-ui/src/app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient.tsx`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-remediation-api.ts`
- `docs/securenow/ENGINEER_ANALYST_HANDOFF.md` "What not to build"
- Sidebar labels in `archlucid-ui/src/lib/product-line/securenow-nav-labels.ts`

## What to build

Branch from current `master` as `cursor/sn-hand-08-association-ui`. If the session requires a branch suffix, append it.

**Audit evidence lineage.** When `verifiedRemediationAssociations` has rows, list them under the existing spine. Each row says `Verified remediation`, the instance id, and the status label `Verified`. Link the instance id to Remediation tracker with `instanceId` set, using the product-line remediation path. Sentence case. When the list is empty, render nothing in that spot. Do not check the positive checkbox. Do not change `ReadyForPositiveCheckbox` copy.

**Remediation tracker.** On the selected instance, when the detail association list is non-empty, show `Framework control` with the control id and `Verification snapshot` with the snapshot id. If `assessmentId` is present, you may link the control id to Audit evidence lookup with the `controlId` query only. Do not build a lineage URL unless the page already has assessment id, audit evidence snapshot id, and control id. Do not invent an audit evidence snapshot id from the inventory snapshot id.

Map the new API fields in the existing client parsers. Null or a missing list means no rows.

## Tests

1. Lineage with one association renders the link to Remediation tracker and does not check the positive checkbox.
2. Lineage with an empty association list does not render the verified-remediation block.
3. Remediation detail with an association shows the control id and the verification snapshot id.
4. Remediation detail with an empty list does not show that block.

From `archlucid-ui`, run the lineage spine Vitest file and `RemediationWorkbenchClient.securenow.test.tsx`. Run `npx tsc --noEmit -p tsconfig.json`.

## Concerns

- **Security.** Links use ids the current response already returned. No new API.
- **Scale.** The list is the lineage or detail payload. Do not fetch every instance in the tenant.
- **Reliability.** A missing list renders the page as it does today.
- **Cost.** No extra evidence download.

## Constraints

- Before editing a tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Do not hide a review workspace tab behind a More menu.
- Do not add a findings list.
- Do not let the page say the control is evidenced, attested, or checked because the association exists.
- Do not call Azure or apply Terraform.
- Do not commit.

## Done when

An analyst opening Audit evidence for a linked control sees the verified instance, and an engineer opening that instance sees the control id and the verification snapshot id.
