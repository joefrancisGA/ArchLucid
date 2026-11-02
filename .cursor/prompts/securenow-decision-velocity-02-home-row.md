# SN-DV-02 — Sponsor Home decision-cycle row

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-DV prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_DECISION_VELOCITY_COMPOSER_PROMPTS.md`

## Goal

SecureNow Home, in the existing sponsor section, links to the decision-cycle block on the operator page.

## Why

The cycle log from SN-DV-01 is easy to miss. Sponsors already have a Home section. One more row points at the timer without a second Home section.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-sponsor-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-sponsor-home-copy.test.ts` (it expects three rows)
- `archlucid-ui/src/components/product-line/SecureNowSponsorHomeSection.tsx` (do not change the section chrome)
- `docs/securenow/DECISION_CYCLE_LOG.md`

## What to build

1. Branch `sn-dv/02-home-row` from current `master` after SN-DV-01 is present.
2. Append one row to `SECURENOW_SPONSOR_HOME_ROWS`:
   - `href`: `/administration/securenow-pilot-decision#decision-cycle`
   - `label`: `Decision cycle`
   - `summary`: `Record qualify start, close, and the step that stalled. Leave the outcome blank until a person selects it.`
3. Do not set `recommendedFirst` on that row. The existing three rows stay in their current order.
4. Update `securenow-sponsor-home-copy.test.ts` so it expects four rows and expects the new href on the fourth row.

## Tests

From `archlucid-ui`:

`npx vitest run src/lib/product-line/securenow-sponsor-home-copy.test.ts`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add a new Home section.
- Do not hide a workspace tab behind More.
- Do not commit.

## Done when

The sponsor Home section has a fourth row, Decision cycle, aimed at `#decision-cycle`.
