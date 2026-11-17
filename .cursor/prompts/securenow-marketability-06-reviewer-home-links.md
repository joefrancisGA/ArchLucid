# SN-MKT-06 — SecureNow Home links for reviewers

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-MKT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MARKETABILITY_COMPOSER_PROMPTS.md`

## Goal

SecureNow Home shows a "For reviewers" section with three links: the draft overview, the reviewer-packet anchor, and the existing conversation mailto. Marketing navigation still does not link `/why-securenow`.

## Why

SN-MKT-04 makes the draft reachable by URL. A champion on Home still has no next step that stays inside claim discipline. The section is an operator link, not a Buy button and not a marketing-nav item.

## Read first

- `archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.tsx`
- `archlucid-ui/src/components/product-line/SecureNowHomeDestinationSection.tsx`
- `archlucid-ui/src/lib/product-line/securenow-security-home-copy.ts` (pattern only; do not change the Security lead or `recommendedFirst`)
- `archlucid-ui/src/lib/marketing/why-securenow-draft-copy.ts`
- `archlucid-ui/src/app/(marketing)/why-securenow/WhySecureNowDraftView.tsx`
- `archlucid-ui/src/app/(marketing)/why-securenow/WhySecureNowDraftView.test.tsx`
- `archlucid-ui/src/components/marketing/MarketingResourcesMenu.tsx`

## What to build

1. Branch `sn-mkt/06-reviewer-home-links` from current `master` after SN-MKT-04 is present.
2. Add these constants to `why-securenow-draft-copy.ts`:
   - `WHY_SECURENOW_REVIEWER_PACK_HEADING = "What a reviewer can ask for"`.
   - `WHY_SECURENOW_REVIEWER_PACK_BODY = "A reviewer can ask for the procurement evidence index, the quote cover, and the controlled pilot proposal. Those documents stay with the owner until buyer communication is approved. This page does not publish a price."`
3. In `WhySecureNowDraftView`, after the refusals and before the mailto, render a section with `id="reviewer-pack"` and `aria-labelledby="why-securenow-reviewer-pack-heading"`. Use the two constants. Do not add links to repo markdown from this page.
4. Add `archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.ts`:
   - Heading `For reviewers`.
   - Lead `Internal drafts for a champion. Not an approved offer. SecureNow beta remains NO_GO.`
   - Three rows, none with `recommendedFirst`:

| href | label | summary |
|---|---|---|
| `/why-securenow` | Draft overview | Who it is for, the six-step workflow, and the refusals. |
| `/why-securenow#reviewer-pack` | Reviewer packet | Ask for the procurement index, the quote cover, and the pilot proposal. Fees stay off this page. |
| `mailto:support@archlucid.net?subject=SecureNow%20conversation` | Request a conversation | Same intake as the draft page. Not a signup. |

5. Add `SecureNowReviewerHomeSection.tsx` that renders those rows through `SecureNowHomeDestinationSection`. `sectionTestId` is `securenow-reviewer-home-section`.
6. Mount it in `InfrastructureOverviewClient` only when `secureNowHome` is true, after `SecureNowHomeWorkSummary` and before `SecureNowFindingsHomeSection`. Do not mount it on the architecture-review infrastructure hub.
7. Do not add a sidebar item, a header item, or a marketing-menu item.

## Tests

Extend `WhySecureNowDraftView.test.tsx` to expect the reviewer-pack body and `id="reviewer-pack"`.

Add `securenow-reviewer-home-copy.test.ts`. It expects the heading, the lead, the three labels, and no `recommendedFirst`. The joined copy does not contain `Start trial`, `Buy`, or `$`.

The existing assertion that `MarketingResourcesMenu` has no `href="/why-securenow"` still passes.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `SECURENOW_HOME_PAGE_LEAD`, `SECURENOW_HOME_CLAIM_DISCIPLINE`, or `SECURENOW_SECURITY_HOME_SECTION_LEAD`.
- Do not check any owner checklist box.
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

SecureNow Home shows the three reviewer links, the draft page has a `reviewer-pack` anchor, and the marketing menu still has no `/why-securenow` link.
