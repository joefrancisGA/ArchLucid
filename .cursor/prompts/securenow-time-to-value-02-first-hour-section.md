# SN-TTV-02 — Show the first useful answer on the first-hour page

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-TTV prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_SCORE66_COMPOSER_PROMPTS.md`

## Goal

The first-hour operator page states the three facts and sends step 4 to the existing question queue on Diagrams.

## Why

SN-TTV-01 names the answer in a markdown note. The operator page still ends at Stop with no link to the place a review question is named.

## Read first

- `docs/securenow/FIRST_USEFUL_ANSWER.md`
- `archlucid-ui/src/lib/product-line/securenow-first-hour-copy.ts`
- `archlucid-ui/src/app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.tsx`
- `archlucid-ui/src/app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.test.tsx`

## What to build

1. Branch `sn-ttv/02-first-hour-section` from current `master` after SN-TTV-01 is present.
2. In `securenow-first-hour-copy.ts`, add:
    - `SECURENOW_FIRST_USEFUL_ANSWER_HEADING` = `First useful answer`.
    - `SECURENOW_FIRST_USEFUL_ANSWER_BODY` = `The first useful answer is collection status, one ranked path in Path inspect, and one review question on Diagrams. A missing capture still counts as status. This is not a timed SLA.`
    - `SECURENOW_FIRST_USEFUL_ANSWER_DIAGRAMS_PATH` = `/infrastructure/diagrams`.
3. Step 4 keeps the title `4 — Stop`. Append to its body: `Name that question in the question queue on Diagrams.` Set its `href` to `/infrastructure/diagrams`.
4. Step 3 still has no `href`.
5. On `SecureNowFirstHourPageView.tsx`, after the four steps and before Terms, add a section with `id="first-useful-answer"` and `data-testid="securenow-first-useful-answer"`. Render the heading and body constants. Render one link named `Open question queue` to the diagrams path.
6. Update `SecureNowFirstHourPageView.test.tsx`. `Open in product` links become three: cloud connections, the remediation factory, and `/infrastructure/diagrams`. The page still has one factory link. `document.getElementById("first-useful-answer")` exists. The question-queue link is present.

## Tests

From `archlucid-ui`:

`npx vitest run 'src/app/(operator)/administration/securenow-first-hour/SecureNowFirstHourPageView.test.tsx'`

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. On Linux, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit Home **Start here** rows.
- Do not add a timer or a new route.
- Do not commit.

## Done when

The first-hour page shows the three facts, step 4 opens Diagrams, and step 3 still does not open the factory a second time.
