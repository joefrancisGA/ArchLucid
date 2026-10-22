# SRI-04 — Templates sit under the questions

**Wave:** start-review-intake (**SRI**). **Depends on:** SRI-01.

Follow [`.cursor/prompts/start-review-intake-00-index.md`](start-review-intake-00-index.md) global constraints.

## Goal

The three starter templates remain available under guided questions as a pre-fill shortcut. **Use template** opens the guided-intake wizard with that preset. It does not replace the questions, and it does not drop `path`.

## Why

`ReviewsNewPageShell` renders `ReviewsNewStarterTemplateGallery` under the page body whenever path-tab chrome is off. On the empty workspace that gallery is the only enabled control, because the picker has no rows. **Use template** calls `router.push('/architecture/reviews/new?preset=…')`. `ReviewsNewRouteBody` treats a missing `path` as the desk redirect, so the click leaves Start review.

## Context

- `archlucid-ui/src/components/review-intake/ReviewsNewStarterTemplateGallery.tsx` — featured ids `starter-api-platform-b2b`, `starter-internal-operations-portal`, `starter-payment-adjacent-not-chd`. Button label "Use template".
- `ReviewsNewPageShell.tsx` — gallery renders when `!onPathTab`, after `props.children`.
- `REVIEWS_NEW_GUIDED_INTAKE_HREF` is `/architecture/reviews/new?path=guided-intake`.
- Preset restore already exists: `NewRunWizardTemplateRestore.ts`. Reuse it. Do not add a second preset query name.
- Browse-more link (`REVIEWS_NEW_DETAILED_HREF`, `path=detailed`) may stay. It is not the primary action.

## What to build

1. **Use template** navigates to `/architecture/reviews/new?path=guided-intake&preset=<template.id>`. Keep any other query keys the restore helper already reads. Do not navigate to a preset URL that omits `path`.

2. That URL renders the guided-questions wizard with the template fields filled and still editable. System Name stays on the screen (required when no source architecture — SRI-02). The upload zone stays on the screen (SRI-03). The person can change every prefilled field before continuing.

3. Place the gallery under the wizard, not above it, and not instead of it. On a non-empty picker the gallery may stay below the table as the same shortcut; its buttons still open the wizard with `path=guided-intake`.

4. Tests in `ReviewsNewStarterTemplateGallery.test.tsx` (extend, do not replace):
   - Each featured **Use template** control targets `path=guided-intake` and `preset=<id>`.
   - None of those targets are `?preset=` alone.
   - Empty-workspace route test from SRI-01 still shows the wizard when the gallery is also mounted. The gallery is not the only `button` or link in that view.

## Acceptance criteria

- A template click lands in guided questions with the preset applied.
- The empty workspace can start without choosing a template.

## Constraints

- **Do not** remove the three featured templates or the browse-more link.
- **Do not** skip the name field because a template was chosen.
- **Do not** make template the default selection.

## Done when

Use template keeps `path=guided-intake`, prefills the wizard, and the questions remain the primary surface.
