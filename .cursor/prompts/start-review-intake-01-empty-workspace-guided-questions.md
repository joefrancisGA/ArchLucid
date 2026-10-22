# SRI-01 — Empty workspace opens guided questions

**Wave:** start-review-intake (**SRI**). **Depends on:** trunk. **Narrows AO-22** for an empty architecture list only.

Follow [`.cursor/prompts/start-review-intake-00-index.md`](start-review-intake-00-index.md) global constraints.

## Goal

Working `/architecture/reviews/new?path=guided-intake` with no `sourceArchitectureId` and an **empty** architecture list renders guided questions. It does not render "Pick an architecture to start a review" or "No architectures in this workspace yet."

A **non-empty** list still renders the picker. Choosing a row still opens `/architecture/architectures/{id}/reviews/new?path=guided-intake`.

## Why

`ReviewsNewRouteBody` returns `ReviewsNewWorkingArchitecturePicker` before the wizard whenever Working guided-intake has no source architecture. On a first workspace that branch is a dead end. The questions and the upload zone already live on `SocraticIntakeWizardStepScope`.

## Context

- `archlucid-ui/src/app/(operator)/architecture/reviews/new/ReviewsNewRouteBody.tsx` — the empty-source branch.
- `ReviewsNewWorkingArchitecturePicker.tsx` — title `REVIEWS_NEW_WORKING_ARCHITECTURE_PICKER_TITLE`, empty copy, table of Start review links.
- `ReviewsNewRouteBody.test.tsx` — "shows architecture picker when Working guided-intake has no source architecture" uses a non-empty list (`architecture-identity-001`). Keep that behavior. Add the empty-list case.
- Guided / eval chrome (`useProductionEvalChrome`) still renders the path switcher. Do not change it.
- Working URL with **no** `path` still redirects through `resolveWorkingStartHref`. Do not mount the wizard there.

## What to build

1. When the architecture list query succeeds and `items.length === 0`, render the guided-intake wizard (`SocraticIntakeWizard` / the existing guided-intake body), not the picker.

2. When `items.length > 0`, keep the picker and the existing row hrefs.

3. Loading and error states stay on the picker component (or a sibling status line). Do not flash the picker heading during load, and do not flash guided questions before the list returns.

4. Tests in `ReviewsNewRouteBody.test.tsx`:
   - Empty list: `reviews-new-working-architecture-picker` is absent. `guided-intake-primary-panel` (or the wizard test id the guided body already exposes) is present. The strings "Pick an architecture to start a review" and "No architectures in this workspace yet." are absent.
   - Non-empty list: existing picker assertion stays, including the nested href.
   - No `path`: still the working redirect. Eval chrome: still the path switcher.

## Acceptance criteria

- An empty workspace Start review screen is the guided-questions panel.
- A workspace that already has architectures still asks which system the review belongs to before the wizard.

## Constraints

- **Do not** remove `ReviewsNewWorkingArchitecturePicker`.
- **Do not** auto-create an architecture in this prompt. Naming and binding are SRI-02.
- **Do not** move the template gallery. That is SRI-04.

## Done when

Empty list shows guided questions. Non-empty list shows the picker. The no-path redirect and the eval path switcher are unchanged.
