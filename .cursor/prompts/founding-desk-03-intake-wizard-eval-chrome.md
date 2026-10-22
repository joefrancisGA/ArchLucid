# FD-03 — Intake wizard leaves the eval-chrome grandfather list

**Do not fork WA-01** for the resolver or CI inventory. **Do not fork CD-04** for print / inspect / run-detail / reviews list. This file is the **intake cluster** still on `PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS`: `SocraticIntakeWizard.tsx`, `NewRunWizardStepBody.tsx`, `ReviewsNewHeaderActions.tsx`, `ReviewsNewPageShell.tsx`.

## Goal

Those files use `useProductionEvalChrome` / `resolveProductionEvalChrome` for eval vs desk chrome — not `isBuyerPolishedOperatorShellEnv()` alone. Working + live tenant → desk start (draft editor / Working start href). Guided / demo / trial → wizard eval chrome. Remove migrated paths from the grandfather list.

## Why

The daily start path is where the evaluator product reasserts itself. A paying architect who hits Alt+N should not get buyer-polish banners, sample recovery, or first-session theater because the wizard still branches on the old env helper.

## Context

- `archlucid-ui/src/lib/production-desk-chrome-eval-inventory.ts`
- `archlucid-ui/src/lib/production-desk-chrome.ts`
- `archlucid-ui/src/app/(operator)/architecture/reviews/new/SocraticIntakeWizard.tsx`
- `ReviewsNewHeaderActions.tsx`, `ReviewsNewPageShell.tsx`, `NewRunWizardStepBody.tsx`
- `WORKING_MODE_NEW_REVIEW_ROUTE` / `WORKING_NEW_REVIEW_LABEL`
- `archlucid-ui/src/lib/production-desk-chrome-eval-guard.test.ts`

## What to build

1. Migrate the intake cluster only. Classify each call: eval chrome vs vocabulary vs engineer widget.
2. Delete those paths from `PRODUCTION_DESK_CHROME_EVAL_GRANDFATHERED_PATHS`.
3. Vitest: Working + env-unset on `/architecture/reviews/new` does not take sample/buyer fallback that still keys off buyer-polish alone. Guard still fails if a *new* operator file skips the resolver.

## Acceptance criteria

- Intake wizard files no longer appear on the grandfather list.
- Guided/demo still get eval chrome via the resolver.
- Alt+N Working still opens the draft editor (`WORKING_MODE_NEW_REVIEW_ROUTE`).
- No thirteenth env flag.

## Constraints

- Do not drain the entire grandfather list in this session.
- Do not delete the guided intake **route**.
- Do not collapse review tabs.
