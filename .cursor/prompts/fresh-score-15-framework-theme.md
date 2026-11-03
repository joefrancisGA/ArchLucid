# FS-15 — Show the framework theme on Path inspect

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

Path inspect shows one framework theme for the open cut point, and says the theme is not a certification.

## Why

Compliance Readiness is **60** (weight 2). `FRAMEWORK_COVERAGE.md` is a card. The cut point the operator is reading does not cite a theme.

## Read first

- `docs/securenow/FRAMEWORK_COVERAGE.md`
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx`
- `archlucid-ui/src/lib/product-line/securenow-path-inspect-copy.ts`

## What to build

1. Branch `fresh-score/15-framework-theme` from current `master`.
2. On Path inspect, when a cut point is visible, add `data-testid="securenow-path-framework-theme"`.
3. The text is `Framework theme: Microsoft cloud security benchmark. A cited theme is not a certification.`
4. When no cut point is selected, do not render the theme.
5. Do not add a control-pass icon, a score, or a percent.
6. Extend the path-inspect panel test for both states.

## Tests

From `archlucid-ui`, run `SecurityEvidencePathInspectPanel.test.tsx`.

## Done when

A visible cut point shows the Microsoft cloud security benchmark theme and the certification limit. An empty inspect panel does not.

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
