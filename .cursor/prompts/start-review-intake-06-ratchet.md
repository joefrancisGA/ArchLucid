# SRI-06 — Ratchet the empty screen and the parent rule

**Wave:** start-review-intake (**SRI**). **Depends on:** SRI-01 through SRI-05. Run last.

Follow [`.cursor/prompts/start-review-intake-00-index.md`](start-review-intake-00-index.md) global constraints.

## Goal

One test module fails if a later session puts the empty picker back, drops the upload or the required name, breaks template `path`, or starts a review with no architecture id.

## Why

`ReviewsNewRouteBody.test.tsx` currently locks the non-empty picker only. That test is how AO-22's empty branch survived. Slice tests from SRI-01–05 can be deleted one file at a time. This prompt is the single regression net.

## Context

- Route: `ReviewsNewRouteBody.tsx` and `ReviewsNewRouteBody.test.tsx`.
- Wizard: `SocraticIntakeWizardStepScope.tsx`, `GuidedIntakeEvidenceSection.tsx`.
- Templates: `ReviewsNewStarterTemplateGallery.tsx`.
- Shell rail: `ReviewsNewPageShell.tsx`.
- Prompt files: `.cursor/prompts/start-review-intake-*.md`.

## What to build

1. Add `archlucid-ui/src/lib/start-review-intake-prompt-inventory.test.ts`. It lists `.cursor/prompts/start-review-intake-*.md` and requires:
   - `start-review-intake-00-index.md`
   - `start-review-intake-01` through `start-review-intake-06` (one file each)
   - `start-review-intake-07-hold.md`
   Assert the numbered implementation files are exactly six.

2. Add or extend one route-level Vitest (the route body test file is the home) that, with the list query mocked, asserts all of the following:
   - Empty list, Working, `path=guided-intake`, no source: guided-questions panel present; picker test id absent; picker title string absent; evidence section present; System Name field present.
   - Non-empty list, same URL: picker present; row href is the nested start-review path; picker title present.
   - No `path`: working redirect, not the wizard.
   - Featured template hrefs include `path=guided-intake` and a `preset`.
   - Working page shell does not render the path-chooser vocabulary rail.

3. Add or extend one submit-level test: empty-workspace continue is disabled without a valid System Name; the start payload's architecture id is non-empty when continue is allowed. Nested start does not create a second architecture.

4. If SRI-02 through SRI-05 are not on the branch yet, write the assertions anyway and leave them failing with the missing behavior named in the test title. Do not weaken the assertions to match the old picker.

## Acceptance criteria

- `npx vitest run src/lib/start-review-intake-prompt-inventory.test.ts src/app/(operator)/architecture/reviews/new/ReviewsNewRouteBody.test.tsx` from `archlucid-ui/` passes once SRI-01–05 are merged.
- A branch that only has the old picker fails the empty-list assertion.

## Constraints

- **Do not** delete the existing non-empty picker test. Extend it.
- **Do not** add a Playwright spec in this prompt.
- **Do not** change product behavior beyond what the assertions require. If an assertion fails because a slice is missing, report the slice. Do not re-implement 01–05 inside this prompt except to fill a hole the assertion already specified.

## Done when

The inventory test and the route ratchet exist, and they fail on the pre-SRI empty picker.
