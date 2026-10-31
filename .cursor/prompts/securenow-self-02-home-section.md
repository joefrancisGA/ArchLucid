# SN-SELF-02 — SecureNow Home "When you are stuck"

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-SELF prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SELF_SUFFICIENCY_COMPOSER_PROMPTS.md`

## Goal

SecureNow Home shows **When you are stuck** with one link to the operator page that SN-SELF-03 will build. The section does not replace **Start here**. It does not set `recommendedFirst`.

## Why

The stuck-state note is invisible until Home points at it. A second recommended-first row would compete with the first-hour path.

## Read first

- `docs/securenow/SELF_SERVICE.md`
- `archlucid-ui/src/components/product-line/SecureNowFirstHourHomeSection.tsx` (pattern)
- `archlucid-ui/src/lib/product-line/securenow-first-hour-home-copy.ts` (pattern; do not change Start here)
- `archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.tsx`
- `archlucid-ui/src/components/product-line/SecureNowHomeDestinationSection.tsx`

## What to build

1. Branch `sn-self/02-home-section` from current `master` after SN-SELF-01 is present.
2. Add `archlucid-ui/src/lib/product-line/securenow-self-service-home-copy.ts`:
   - Heading `When you are stuck`.
   - Lead `Four checks before you email. This is not a support SLA. SecureNow beta remains NO_GO.`
   - Operator path `/administration/securenow-self-service`.
   - One row, no `recommendedFirst`:

| href | label | summary |
| --- | --- | --- |
| `/administration/securenow-self-service` | Stuck-state checks | Collection, connector status, not verified, then email support@archlucid.net. |

3. Add `SecureNowSelfServiceHomeSection.tsx` that renders the row through `SecureNowHomeDestinationSection`. `sectionTestId` is `securenow-self-service-home-section`.
4. Mount it in `InfrastructureOverviewClient` only when `secureNowHome` is true, immediately after `SecureNowFirstHourHomeSection` and before `SecureNowHomeWorkSummary`. Do not mount it on the architecture-review infrastructure hub.
5. Do not add a sidebar item.

## Tests

Add `securenow-self-service-home-copy.test.ts`. Expect the heading, the `NO_GO` lead, the one href, no `recommendedFirst`, no `$`, and no `Start trial`.

Extend the SecureNow home overview test that already asserts Start here so it also finds the heading `When you are stuck`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not change `SECURENOW_FIRST_HOUR_HOME_SECTION_HEADING` or any `recommendedFirst` already set on Home.
- Do not commit.

## Done when

SecureNow Home shows **When you are stuck** under **Start here**, with one link and no recommended-first badge.
