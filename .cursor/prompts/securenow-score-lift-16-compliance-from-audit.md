# SN-LIFT-16 — Link duty split from audit evidence

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-LIFT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE_LIFT_COMPOSER_PROMPTS.md`

## Goal

Audit evidence links the compliance notes page.

## Why

Compliance Readiness is 68 (weight 2). The duty-split page exists. Audit evidence is the place an operator already looks.

## Read first

- `archlucid-ui/src/app/(operator)/governance/audit-evidence`
- `archlucid-ui/src/lib/product-line/securenow-compliance-home-copy.ts`

## What to build

1. Branch `sn-lift/16-compliance-from-audit` from current `master`.
2. On the SecureNow audit-evidence landing or empty state, add a link labeled `Duty split` to `/administration/securenow-compliance-notes`.
3. The link summary or adjacent text must include `Not a certification`.
4. Do not add a numeric compliance score or edit the SOC 2 self-assessment.
5. Update the audit-evidence test that renders that landing state.

## Tests

From `archlucid-ui`: run the audit-evidence landing test.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/securenow-score-lift-hold.md` before editing.
- Do not commit.

## Done when

Audit evidence links Duty split and says it is not a certification.
