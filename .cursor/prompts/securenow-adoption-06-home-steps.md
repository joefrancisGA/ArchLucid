# SN-ADOPT-06 — Start here lists the four steps

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-ADOPT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ADOPTION_FRICTION_COMPOSER_PROMPTS.md`

## Goal

SecureNow Home **Start here** lists the four first-hour steps as separate rows. The preparation page stays linked. Row hrefs are unique.

## Why

Home currently has one row, **First hour path**, aimed at the preparation page. The operator still has to open that page before any of the work. `SecureNowHomeDestinationSection` keys rows by `href`, so two rows cannot share a destination.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-first-hour-home-copy.ts`
- `archlucid-ui/src/lib/product-line/securenow-first-hour-home-copy.test.ts`
- `archlucid-ui/src/components/product-line/SecureNowFirstHourHomeSection.tsx` (do not change the section chrome)
- `archlucid-ui/src/components/product-line/SecureNowHomeDestinationSection.tsx` (href is the row key; do not change it)
- `archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.securenow.test.tsx`
- `docs/securenow/FIRST_HOUR.md`

## What to build

1. Branch `sn-adopt/06-home-steps` from current `master` after SN-ADOPT-05 is present.
2. Keep the heading `Start here`.
3. Set the lead to: `A missing or stale capture is the current step. A blank ranking is not a clean result. This is not a timed SLA. SecureNow beta remains NO_GO.`
4. Replace the single row with these five rows, in this order. Only row 1 has `recommendedFirst: true`.
   - `Scope and freshness` → `/integrations/cloud-connections`. Summary: `Open cloud connections when Home says no collection yet or the capture needs attention.`
   - `One ranked path` → `/security/remediation-factory`. Summary: `Open one ranked row and read the cited hops. Do not treat the path as an exploit.`
   - `Path inspect` → `/administration/securenow-first-hour#path-inspect`. Summary: `Select that ranked row. Path inspect is the panel on the row, not a separate page.`
   - `Stop` → `/administration/securenow-first-hour#stop`. Summary: `Do not open verification or sponsor packaging until the sponsor names the review question.`
   - `First hour page` → `/administration/securenow-first-hour`. Summary: `Read the four steps and the terms in one place.`
5. Update `securenow-first-hour-home-copy.test.ts` for five rows, the lead sentence, and these hrefs.
6. Update `InfrastructureOverviewClient.securenow.test.tsx` so it still finds the Start here section and the link to `/administration/securenow-first-hour`. Assert the scope row and the ranked-path row by their hrefs. Do not require the old single label `First hour path`.

## Tests

From `archlucid-ui`:

`npx vitest run src/lib/product-line/securenow-first-hour-home-copy.test.ts src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.securenow.test.tsx`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not hide a Home section behind More.
- Do not add a sidebar item.
- Do not commit.

## Done when

Start here shows five unique destinations, the first step is the recommended row, and the blocked-collection sentence is in the lead.
