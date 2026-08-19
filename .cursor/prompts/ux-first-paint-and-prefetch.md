# UX: First-Paint Budget + Step Prefetch

## Goal
Make every demo step transition feel instant — especially on a hotel/conference Wi-Fi. Measure and optimize the executive landing first-paint (Step 1), and prefetch the next step's route as soon as the user lands on any step.

## Context
- Next.js 15 with App Router and Turbopack is in use (`next: "^15.5.18"`).
- The golden journey has five steps with fixed routes (see `BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS` in `archlucid-ui/src/lib/buyer-golden-journey-nav.ts`).
- The tour overlay's Back/Next buttons use `<Link href={...}>` — make sure those `<Link>` elements prefetch.
- Key files:
  - `archlucid-ui/src/components/BuyerCtoDemoTourOverlay.tsx` — Back/Next `<Link>` elements
  - `archlucid-ui/src/lib/buyer-golden-journey-nav.ts` — step definitions and hrefs
  - `archlucid-ui/src/components/executive/CtoDemoExecutiveAboveFold.tsx` — Step 1 above-fold
  - `archlucid-ui/src/app/(operator)/layout.tsx` — App shell layout

## What to build

### 1. Prefetch all five journey routes on shell mount
In `AppShellClient.tsx` (or in `BuyerCtoDemoTourOverlay.tsx` on mount), when the CTO demo tour is active, programmatically prefetch all five step routes using Next.js router:

```typescript
import { useRouter } from "next/navigation";

useEffect(() => {
  if (!active) return;

  for (const step of BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS) {
    router.prefetch(step.href);
  }
}, [active, router]);
```

This causes Next.js to download the JS bundle + RSC payload for all five routes in the background immediately after Step 1 loads.

### 2. Ensure Back/Next `<Link>` elements have `prefetch` enabled
In `BuyerCtoDemoTourOverlay.tsx`, the Back and Next navigation `<Link>` elements:
- Verify they do NOT have `prefetch={false}`.
- Next.js 15 with App Router prefetches `<Link>` elements in the viewport by default — confirm they are in the DOM (they are, as the overlay is always mounted).
- Add `prefetch={true}` explicitly to the Next and Back `<Link>` elements to be explicit.

Also in `CtoDemoJourneyCaptionBar.tsx` and `LayerContextStrip.tsx` (the step strip in the header) — any `<Link>` pointing to journey steps should have `prefetch={true}`.

### 3. Skeleton screens on all five demo routes
Verify that each of the five demo pages has a `loading.tsx` file (Next.js App Router convention) that shows a layout-stable skeleton. If missing, create them:

Routes to check:
- `archlucid-ui/src/app/(operator)/executive/reviews/[runId]/loading.tsx`
- `archlucid-ui/src/app/(operator)/manifests/[manifestId]/loading.tsx`
- `archlucid-ui/src/app/(operator)/graph/loading.tsx`
- `archlucid-ui/src/app/(operator)/governance/loading.tsx`
- `archlucid-ui/src/app/(operator)/audit/loading.tsx`

Each `loading.tsx` must:
- Match the layout dimensions of the actual page (no layout shift when content arrives).
- Use `animate-pulse` skeleton blocks matching the page's primary cards.
- Render the sidebar and header immediately (they come from the shell layout, not the page `loading.tsx`).

### 4. Executive landing above-fold optimization (Step 1)
In `CtoDemoExecutiveAboveFold.tsx`:
- Identify any data fetches that block the above-fold render.
- Move non-critical sections (ROI metrics, history, secondary charts) to `<Suspense>` with a skeleton fallback so the verdict + top findings appear immediately.
- The CTO's first visual — the executive verdict and top 3 findings — must render within a single RSC pass (no client-side fetch required for above-fold content).

If the executive page currently does a client-side `fetch` for the showcase run detail, consider moving it to a Server Component with static rendering for the showcase run ID (`SHOWCASE_STATIC_DEMO_RUN_ID`).

### 5. Add a `CtoDemoLatencyBudgetIndicator` usage note
`CtoDemoLatencyBudgetIndicator.tsx` already exists. Verify it:
- Is mounted during the tour.
- Logs or displays a warning if any step's Time-to-First-Paint exceeds 1500ms (as measured by `performance.now()` or `PerformanceObserver`).
- In presenter layer (see the overlay de-densify prompt), the latency indicator should appear in the presenter-only section.

## Acceptance criteria
- All five journey step routes are prefetched within 2 seconds of the tour activating.
- Back/Next `<Link>` elements have `prefetch={true}`.
- All five demo routes have `loading.tsx` files with layout-stable skeletons.
- The executive landing above-fold verdict renders without a client-side loading spinner (SSR or static).
- No layout shift (`CLS < 0.05`) on any of the five step transitions.
- Existing E2E tests in `e2e/buyer-golden-path.smoke.spec.ts` continue to pass.

## Constraints
- Do not introduce new performance-monitoring libraries (use native `PerformanceObserver`).
- Static rendering for the showcase route ID only — do not statically render arbitrary run IDs.
- Skeleton blocks must use existing Tailwind `animate-pulse` utility, not a third-party skeleton library.
