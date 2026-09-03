# PT-02 — Live failures never recover into sample or demo data

## Goal

On authenticated **live** tenants, error recovery, empty states, and first-run rails never navigate into showcase/static-demo packages as if they were the user’s work. Sample remains an explicit Guided/eval action, labeled sample.

## Why

A livelihood tool cannot afford one mis-click that treats Claims Intake as *your* architecture. `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/error.tsx` still branches on `isBuyerPolishedOperatorShellEnv()` (always true today) into **“Sample review unavailable”** plus **Open sample review** / **View sample review** using `SHOWCASE_STATIC_DEMO_RUN_ID` / `SHOWCASE_STATIC_DEMO_MANIFEST_ID`. The honest live path (“Review could not be loaded”, Back to reviews / Retry / Help) is unreachable in production.

First-review-guide loading already omits the sample href when `isLiveOperatorShellRecoveryContext()` is true — keep that. Do not regress it. Other recovery views may still import showcase ids.

## Context

- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/error.tsx` — **primary defect**
- `archlucid-ui/src/lib/live-operator-shell-recovery.ts`
- `archlucid-ui/src/hooks/use-first-review-guide-state.ts` (already live-gated — do not re-add sample on live)
- `archlucid-ui/src/components/ReviewPackageLoadFailureView.tsx`
- `archlucid-ui/src/lib/error-recovery-contract-copy.ts` (TB-2155)
- `archlucid-ui/src/lib/showcase-static-demo.ts`
- PT-01 (buyer-polish identity). If PT-01 has not landed, still gate this file on `isLiveOperatorShellRecoveryContext()` so live Working users never see sample recovery even while the env function stays true.

## What to build

1. Inventory every operator-shell CTA/href that uses `SHOWCASE_STATIC_DEMO_*` or “Open sample” / “View sample review” **inside the authenticated workspace** (not marketing `/why`).
2. `error.tsx` for `/architecture/reviews/[reviewId]`:
   - If `isLiveOperatorShellRecoveryContext()`, always take the **Review could not be loaded** path (retry, reviews list, Help, Report Problem). **No** showcase run/manifest id, **no** “Sample review unavailable”.
   - Sample recovery only when demo/static fallback is actually on.
3. `ReviewPackageLoadFailureView` / `OperatorErrorRecoveryContract`: never add a sample-package link on live. Intact-line must not imply demo data is the user’s data.
4. Guard test: a small inventory (pattern-match or explicit list) fails CI if a live-shell recovery view imports showcase static demo ids. Extend `live-operator-shell-recovery.test.ts`.
5. Marketing `/why` may keep “Open sample architecture package.”

## Acceptance criteria

- Live Working user whose review 404s or whose review-detail segment throws is sent to retry / reviews list / Help, not Claims Intake.
- The words “Sample review unavailable” do not render when `isLiveOperatorShellRecoveryContext()` is true.
- First-review guide live loading/error states still omit the showcase UUID.
- Mock/demo E2E that *intentionally* uses showcase ids still pass.
- Recovery copy remains the three-line TB-2155 contract.

## Constraints

- Do not disable static demo for Playwright mock jobs.
- Do not remove the sample workspace from Guided Overview when sample-reviews preference is on.
- Do not collapse nav to hide sample links — label them.
- Do not treat PT-01 as a prerequisite if you can gate on `isLiveOperatorShellRecoveryContext()` alone.
