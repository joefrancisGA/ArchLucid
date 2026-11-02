# SN-COMP-07 — Say the lineage download is not an attestation

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-COMP prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_COMPLIANCE_COMPOSER_PROMPTS.md`

## Goal

The **Download control evidence** button on a loaded lineage says the file is the loaded lineage and not an attestation.

## Why

`formatAuditEvidenceControlLineageMarkdown` already starts with `Not a certification. Not an ATO.` The button label is `Download control evidence` with no limit beside it.

## Read first

- `archlucid-ui/src/lib/audit-evidence-control-lineage-markdown.ts`
- `archlucid-ui/src/app/(operator)/governance/audit-evidence/[assessmentId]/snapshots/[snapshotId]/controls/[controlId]/AuditEvidenceControlLineageClient.tsx`
- `scripts/ci/check_securenow_compliance_notes.py`
- `scripts/ci/test_check_securenow_compliance_notes.py`

## What to build

1. Branch `sn-comp/07-download-limit` from current `master` after SN-COMP-06 is present.
2. Export `AUDIT_EVIDENCE_CONTROL_LINEAGE_DOWNLOAD_LIMIT` from `audit-evidence-control-lineage-markdown.ts` with the exact text `This download is the loaded lineage. It is not an attestation.`
3. In `AuditEvidenceControlLineageClient.tsx`, render that text next to the button whose `data-testid` is `audit-evidence-control-lineage-download`. Give the note `data-testid="audit-evidence-control-lineage-download-limit"`. Do not change `formatAuditEvidenceControlLineageMarkdown` status logic.
4. Extend `check_securenow_compliance_notes.py` so the client file must contain `audit-evidence-control-lineage-download-limit` and `It is not an attestation.` Keep the existing formatter check for `Not a certification`.
5. Add a negative unittest that deletes the limit sentence and expects `validate` to fail.
6. If a vitest already renders that download button, assert the limit text there. Otherwise add a one-assertion test that the exported constant equals the sentence above.

## Tests

From `archlucid-ui`, the vitest you added or extended.

From the repo root:

`python3 scripts/ci/check_securenow_compliance_notes.py`

`python3 -m unittest scripts.ci.test_check_securenow_compliance_notes`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add an audit-evidence API, a numeric score, or a certification phrase.
- Do not set `continue-on-error` to false. The CI steps already exist.
- Do not commit.

## Done when

The download button has the limit sentence beside it, and the warn-only checker fails if that sentence disappears.
