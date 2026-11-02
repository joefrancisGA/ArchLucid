# SN-DV-03 — Operator decision-cycle section

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-DV prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_DECISION_VELOCITY_COMPOSER_PROMPTS.md`

## Goal

`/administration/securenow-pilot-decision` shows where a person records the cycle. The page does not start a timer and does not select an outcome.

## Why

SN-DV-02 links to `#decision-cycle`. That anchor has to exist on the operator page, next to the outcome meanings that are already there.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-pilot-decision-copy.ts`
- `archlucid-ui/src/app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView.tsx`
- `archlucid-ui/src/app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView.test.tsx`
- `docs/securenow/DECISION_CYCLE_LOG.md`
- `docs/securenow/PILOT_DECISION_RECORD.md` (do not edit it)

## What to build

1. Branch `sn-dv/03-operator-section` from current `master` after SN-DV-01 and SN-DV-02 are present.
2. Add copy constants:
   - Heading: `Decision cycle`
   - Lead: `A person writes the qualify start, the close, and one stall step in the decision cycle log. SecureNow beta remains NO_GO.`
   - Stall names, in order: Qualify, Scope, Review, Decide change, Verify, Close.
   - Guard sentence: `Leave the outcome blank until a person selects proceed to commercial discussion, extend with bounded scope, or stop on the pilot decision record.`
3. Render a section with `id="decision-cycle"` and `data-testid="securenow-decision-cycle"` after the existing outcome list.
4. Include a text link to the repo note path `docs/securenow/DECISION_CYCLE_LOG.md` as visible label `Decision cycle log`. Do not invent a route for the markdown file.
5. Extend the page test so it finds `securenow-decision-cycle` and the six stall names.

## Tests

From `archlucid-ui`:

`npx vitest run src/app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView.test.tsx`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add a clock, a form post, or a saved disposition.
- Do not check a proceed, extend, or stop box in source.
- Do not commit.

## Done when

The operator page has a `#decision-cycle` section that names the six stall steps and points at the blank log.
