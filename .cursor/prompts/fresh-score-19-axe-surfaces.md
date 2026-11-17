# FS-19 — Run axe on Path inspect and diagrams

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

Path inspect and the diagram surface pass the same jest-axe bar as the operator accessibility page.

## Why

Accessibility is **64** (weight 1). Axe covers the operator accessibility page and the public draft. It does not cover Path inspect or diagrams.

## Read first

- `archlucid-ui/src/accessibility/securenow-accessibility-axe.test.tsx`
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx`
- The diagrams client for `/infrastructure/diagrams`
- `docs/securenow/ACCESSIBILITY_SCOPE.md`

## What to build

1. Branch `fresh-score/19-axe-surfaces` from current `master`.
2. Add two cases to `securenow-accessibility-axe.test.tsx`: Path inspect with one path loaded, and the diagram surface with one path's hops.
3. Use the same `axe` expect as the existing cases. Fix serious violations in those two surfaces only.
4. Add one sentence to `ACCESSIBILITY_SCOPE.md`: Path inspect and the diagram surface are in the axe set. This is not a WCAG certification and not an assistive-technology user study.
5. Do not restyle unrelated pages.

## Tests

From `archlucid-ui`, run `src/accessibility/securenow-accessibility-axe.test.tsx`.

## Done when

Both new axe cases pass, and the scope note names those surfaces without claiming certification.

## Constraints

- Before editing a tracked file, run `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- If the done-when text is already present, stop and report that. Do not add a second copy.
- Read `.cursor/prompts/fresh-score-hold.md` before editing.
- Do not implement another FS prompt in this session.
- Do not commit.
- Beta remains **NO_GO**. Do not publish a fee, a public list price, a CPA SOC 2 report, or a third-party pen-test claim.
- Do not write a customer result, a timed SLA, or a minutes-to-value claim.
- Do not hide review workspace tabs behind a More menu.
- Do not call `PathRankingEngine` or change rank weights.
