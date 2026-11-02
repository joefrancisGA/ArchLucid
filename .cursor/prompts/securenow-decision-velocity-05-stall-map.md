# SN-DV-05 — Map each stall step to a surface that already exists

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-DV prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_DECISION_VELOCITY_COMPOSER_PROMPTS.md`

## Goal

The decision-cycle list tells a person where each stall step is reviewed. The source log stays blank.

## Why

Decision Velocity is **66** (weight 2). **SN-DV-01–04** shipped in PR #5860. `#decision-cycle` lists Qualify, Scope, Review, Decide change, Verify, and Close as plain text. The move toward **70** is still the owner walk **M-314**. This prompt only points each name at an existing surface.

## Read first

- `docs/securenow/DECISION_CYCLE_LOG.md`
- `archlucid-ui/src/lib/product-line/securenow-pilot-decision-copy.ts`
- `archlucid-ui/src/app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView.tsx`
- `archlucid-ui/src/app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView.test.tsx`
- `.cursor/prompts/securenow-decision-velocity-hold.md`

## What to build

1. Branch `sn-dv/05-stall-map` from current `master`. Do not redo SN-DV-01–04.
2. Change `SECURENOW_DECISION_CYCLE_STALL_STEPS` from a string list to objects `{ label, href, note }` in this order:
    - Qualify — `/administration/securenow-first-hour` — `Confirm the review is worth opening.`
    - Scope — `/integrations/cloud-connections` — `Collection status, including a gap.`
    - Review — `/security/remediation-factory` — `One ranked path in Path inspect.`
    - Decide change — `/administration/securenow-pilot-decision#securenow-pilot-decision-outcomes-heading` — `The outcome on this page stays unselected.`
    - Verify — `/security/remediation-instances` — `A later capture. Not verified stays not verified.`
    - Close — the existing `SECURENOW_DECISION_CYCLE_LOG_PATH` — `Write times only on a private copy. Leave the source log blank.`
3. Render each row as a link whose accessible name is the label, plus the note. Keep `id="decision-cycle"`.
4. Update the page test for the six hrefs. Assert the source file `docs/securenow/DECISION_CYCLE_LOG.md` is not modified and still contains `BLANK` on the `SYNTHETIC FIXTURE` row.
5. Do not write a UTC timestamp, a customer name, or a selected outcome into `DECISION_CYCLE_LOG.md` or `PILOT_DECISION_RECORD.md`.

## Tests

From `archlucid-ui`:

`npx vitest run src/app/(operator)/administration/securenow-pilot-decision/SecureNowPilotDecisionPageView.test.tsx`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not add a timer or a form post.
- Do not perform the **M-314** walk.
- Do not commit.

## Done when

Each stall step is a link to an existing surface, and the synthetic fixture row in source is still blank.
