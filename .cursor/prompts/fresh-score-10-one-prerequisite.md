# FS-10 — Show one missing prerequisite on the first-review guide

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another FS prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/FRESH_SCORE_20_COMPOSER_PROMPTS.md`


## Goal

When the first review cannot start, the guide shows one missing prerequisite and one link.

## Why

ArchLucid Adoption Friction is **74** (weight 6). The guide lists optional setup as a group. SSO is already optional. The blocking gap is still a list.

## Read first

- `archlucid-ui/src/lib/buyer-copy/onboarding.ts`
- `archlucid-ui/src/lib/first-week-route-guidance.ts`
- The first-review guide page under `archlucid-ui/src/app/(operator)/architecture/first-review-guide/`

## What to build

1. Branch `fresh-score/10-one-prerequisite` from current `master`.
2. At the top of the first-review guide, add `data-testid="first-review-one-prerequisite"`.
3. Choose the first incomplete item in this order only: sample package selected, policy pack assigned. Skip SSO. `FIRST_REVIEW_GUIDE_SSO_OPTIONAL_COPY` stays.
4. When an item is incomplete, the block is one sentence naming it and one link to the control that completes it.
5. When both are complete, the block says `Sample package and policy pack are selected.` and does not list optional setup.
6. Do not remove the optional-setup disclosure.
7. Test the sample-missing state, the pack-missing state, and the both-ready state.

## Tests

From `archlucid-ui`, run the first-review guide test you extended.

## Done when

The guide shows one missing prerequisite, or says the sample and the policy pack are selected. SSO stays optional.

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
