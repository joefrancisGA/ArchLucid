# SN-A11Y-02 — SecureNow operator accessibility page

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-A11Y prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ACCESSIBILITY_COMPOSER_PROMPTS.md`

## Goal

An operator page at `/administration/securenow-accessibility` states the same scope as the note. SecureNow Home links to it. The page is not under the marketing layout, so the security product line does not redirect it.

## Why

`/accessibility` is a marketing route. SN-MKT-04 left that prefix blocked. A SecureNow operator still needs a page they can open. Putting the page under `/administration` keeps it off the marketing redirect.

## Read first

- `docs/securenow/ACCESSIBILITY_SCOPE.md`
- `archlucid-ui/src/app/(operator)/administration/security-trust/page.tsx` (operator page pattern only)
- `archlucid-ui/src/lib/product-line/securenow-reviewer-home-copy.ts`
- `archlucid-ui/src/components/product-line/SecureNowReviewerHomeSection.tsx`
- `archlucid-ui/src/lib/product-line/securenow-marketing-route-policy.ts` (do not remove `/accessibility`)

## What to build

1. Branch `sn-a11y/02-operator-page` from current `master` after SN-A11Y-01 is present.
2. Add `archlucid-ui/src/lib/product-line/securenow-accessibility-copy.ts` with:
   - Heading `Accessibility`.
   - Lead `SecureNow uses the platform WCAG 2.2 Level AA target. This page is not a certification.`
   - Body that includes the sentence `On the security product line, /accessibility redirects home. This page is the SecureNow note.`
   - The five surface names from the scope note: SecureNow Home, Priorities & waves, Path inspect, Question queue, Remediation tracker.
   - Mailto constant `mailto:accessibility@archlucid.net` and label `Report an accessibility barrier`.
   - Refusal sentence `This page does not record assistive-technology user testing.`
3. Add `archlucid-ui/src/app/(operator)/administration/securenow-accessibility/page.tsx` and a view beside it.
   - Render an `h1` with the heading.
   - `data-testid="securenow-accessibility-page"`.
   - A list of the surfaces.
   - A link with the mailto and the label above.
   - Do not import marketing header, footer, or `AccessibilityMarketingPublicView`.
4. Add one row to `SECURENOW_REVIEWER_HOME_ROWS` after the conversation row. No `recommendedFirst`.

| href | label | summary |
|---|---|---|
| `/administration/securenow-accessibility` | Accessibility | Shared WCAG target and how to report a barrier. |

5. Do not add a sidebar item or a marketing-menu item.
6. Leave `SECURENOW_HOME_PAGE_LEAD` and `SECURENOW_SECURITY_HOME_SECTION_LEAD` unchanged.

## Tests

Vitest renders the view and expects the heading, `WCAG 2.2`, `Report an accessibility barrier`, and the refusal sentence. The rendered text has no `$` and does not contain `WCAG certified` or `VPAT`.

Extend `securenow-reviewer-home-copy.test.ts` so the labels include `Accessibility` and none of the rows set `recommendedFirst`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not create `src/app/(operator)/accessibility/page.tsx`. That URL collides with the marketing statement.
- Do not edit `check_securenow_marketability.py` in this session. Extra Home rows are allowed; the existing reviewer labels must remain.
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

`/administration/securenow-accessibility` renders the note, and SecureNow Home links to it from For reviewers.
