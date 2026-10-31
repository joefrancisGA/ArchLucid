# SN-STICK-02 — SecureNow Home return section

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-STICK prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_STICKINESS_COMPOSER_PROMPTS.md`

## Goal

SecureNow Home shows a "Come back for" section with four links to work that is already in the product. The section is an operator navigation aid, not a reminder and not a usage metric.

## Why

SN-STICK-01 names the reasons in a document. An operator on Home still has to remember which existing page matches which reason.

## Read first

- `docs/securenow/RETURN_REASONS.md`
- `archlucid-ui/src/components/product-line/SecureNowHomeDestinationSection.tsx`
- `archlucid-ui/src/components/product-line/SecureNowReviewerHomeSection.tsx` (pattern only)
- `archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.ts` (pattern only; do not change it)
- `archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.tsx`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.securenow.test.tsx`
- `archlucid-ui/src/components/product-line/SecureNowHomeWorkSummary.tsx` (hrefs only; do not change the counts)

## What to build

1. Branch `sn-stick/02-home-section` from current `master` after SN-STICK-01 is present.
2. Add `archlucid-ui/src/lib/product-line/securenow-return-home-copy.ts`:
   - Heading `Come back for`.
   - Lead `Open one of these when the work is still unfinished. This is not a reminder and not a usage score. SecureNow beta remains NO_GO.`
   - Four rows, none with `recommendedFirst`:

| href | label | summary |
|---|---|---|
| `/security/remediation-instances` | Awaiting verification | A later capture has not yet confirmed or rejected the condition. |
| `/infrastructure/snapshots-drift` | Recent changes | A newer collection differs from the previous collection. |
| `/infrastructure/diagrams` | Open questions | A diagram question still needs a human answer. |
| `/administration/securenow-pilot-decision` | Sponsor follow-up | A named owner still owes an objection, a decision, or a review date. |

3. Add `SecureNowReturnHomeSection.tsx` that renders those rows through `SecureNowHomeDestinationSection`. `sectionTestId` is `securenow-return-home-section`. `headingId` is `securenow-return-home-heading`. `linkTestIdPrefix` is `securenow-return-home-link`.
4. Mount it in `InfrastructureOverviewClient` only when `secureNowHome` is true, after `SecureNowHomeWorkSummary` and before `SecureNowReviewerHomeSection`. Do not mount it on the architecture-review infrastructure hub.
5. Add `securenow-return-home-copy.test.ts`. Assert the heading, the `NO_GO` lead, the four hrefs in that order, no `recommendedFirst`, no `$`, and no `engagement score`.
6. Update `InfrastructureOverviewClient.securenow.test.tsx` so the grouped-section order includes `securenow-return-home-section` between the work summary and the reviewer section. Assert the awaiting-verification href.

## Tests

```bash
cd archlucid-ui
npm run test:run -- src/lib/product-line/securenow-return-home-copy.test.ts src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.securenow.test.tsx
```

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not change `SecureNowHomeWorkSummary` query logic or copy.
- Do not add a sidebar item, a header item, or a marketing-menu item.
- Do not commit.

## Done when

SecureNow Home shows the four return links in the stated order, and the architecture-review infrastructure hub does not.
