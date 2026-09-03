# WD-08 — Live recovery never navigates into sample data

**Do not fork PT-02.** If `error.tsx` is still sample-first, run `professional-tool-02-no-sample-recovery.md`. This file is the residual: **inventory + CI guard** across authenticated recovery views.

## Goal

On authenticated **live** tenants, every error, empty, and first-run recovery path in the operator shell goes to retry / reviews list / Help / Report Problem. Sample Claims Intake stays an explicit Guided/eval action, labeled sample. Inventory must fail CI if a live recovery view imports showcase static demo ids.

## Why

A livelihood tool cannot afford one mis-click that treats Claims Intake as *your* architecture. `error.tsx` for `/architecture/reviews/[reviewId]` still has a sample-first branch (`showSampleRecovery = !isLiveOperatorShellRecoveryContext()`). The live gate is necessary because the **recovery design** still thinks demo is the happy path. Other authenticated views may still import `SHOWCASE_STATIC_DEMO_*`.

## Context

- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/error.tsx`
- `archlucid-ui/src/lib/live-operator-shell-recovery.ts`
- `archlucid-ui/src/components/ReviewPackageLoadFailureView.tsx`
- `archlucid-ui/src/lib/error-recovery-contract-copy.ts` (TB-2155)
- `archlucid-ui/src/lib/showcase-static-demo.ts`
- `use-first-review-guide-state.ts` — already omits sample href on live; **do not regress**
- Grep `SHOWCASE_STATIC_DEMO_` under `archlucid-ui/src` (exclude e2e, marketing `/why`, tests that *assert* the gate)
- PT-02 residual: finish the inventory guard, not only this error.tsx

## What to build

1. Inventory authenticated-workspace CTAs/hrefs that use showcase ids or “Open sample review” / “View sample review.”
2. Live (`isLiveOperatorShellRecoveryContext()`): always the honest load-failure path. **No** showcase run/manifest id, **no** “Sample review unavailable.”
3. Sample recovery only when demo/static fallback is actually on, and copy says it is demo data.
4. CI guard: live-shell recovery views must not import `SHOWCASE_STATIC_DEMO_*`. Extend `live-operator-shell-recovery.test.ts`.
5. Marketing `/why` may keep “Open sample architecture package.”

## Acceptance criteria

- Live Working 404 / segment throw → retry / reviews / Help / Report Problem, not Claims Intake.
- “Sample review unavailable” does not render when live recovery context is true.
- First-review guide live states still omit the showcase UUID.
- Mock/demo E2E that intentionally uses showcase ids still pass.

## Constraints

- Do not disable static demo for Playwright mock jobs.
- Do not remove the sample workspace from Guided Overview when sample-reviews preference is on.
- Do not hide sample links by collapsing nav — label them.
- Recovery copy stays the three-line TB-2155 contract.
