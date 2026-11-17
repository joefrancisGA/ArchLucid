# FS-14 — Put five fixture walks on SecureNow Home

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

SecureNow Home offers five labeled fixture walks. Each row opens one short path. An administration list is not the chooser.

## Why

Template and Accelerator Richness is **48** (weight 1). The product has `fixture-path-01` and a storyboard. Home does not offer a set of walks.

## Read first

- `archlucid-ui/src/components/product-line/SecureNowFirstHourHomeSection.tsx`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.tsx`
- `docs/architecture/SECURENOW_SCENARIO_ACCELERATOR_COMPOSER_PROMPTS.md`
- `archlucid-ui/src/lib/marketing/securenow-sample-copy.ts`

## What to build

1. Branch `fresh-score/14-home-chooser` from current `master`.
2. Add a Home section, `data-testid="securenow-home-fixture-chooser"`, with exactly five rows. Each row has a label, the sentence `Synthetic fixture. Not a customer result.`, and one href.
3. Row 1 is `fixture-path-01` and links to `/security/remediation-factory?pathId=fixture-path-01`.
4. Rows 2 through 5 use distinct labels for standing privilege, missing capture, not verified, and advisory cut only. Point them at the existing surface that already demonstrates that limit (`/integrations/cloud-connections`, the first-hour stop anchor, or Path inspect). Do not invent a second fixture tenant.
5. Render the section on SecureNow Home only (`secureNowHome`).
6. Do not add this section only under `/administration`.
7. Test that five rows render and each body contains `Synthetic fixture`.

## Tests

From `archlucid-ui`, run the new chooser test.

## Done when

SecureNow Home shows five synthetic fixture rows, and the first row opens `fixture-path-01`.

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
