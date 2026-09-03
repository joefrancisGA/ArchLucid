# PT-09 — Live failures never recover into sample or demo data

## Goal

On authenticated **live** tenants, error recovery, empty states, and first-run rails never navigate into showcase/static-demo packages as if they were the user’s work. Sample remains an explicit Guided/eval action, labeled sample.

## Why

A livelihood tool cannot afford one mis-click that treats Claims Intake as *your* architecture. `use-first-review-guide-state.ts` still uses `SHOWCASE_STATIC_DEMO_RUN_ID` as the loading-state **secondaryHref** (“Explore sample review”). Buyer-polished error paths historically offered sample packages (`docs/ux-audits/LINK_ROUTE_INTEGRITY_AUDIT.md`). Static-demo fallback (`isStaticDemoPayloadFallbackEnabled`) can overlay live API misses. That is correct for mock E2E; it is a trust failure in production.

## Context

- `archlucid-ui/src/hooks/use-first-review-guide-state.ts`
- `archlucid-ui/src/components/ReviewPackageLoadFailureView.tsx`
- `archlucid-ui/src/lib/error-recovery-contract-copy.ts` (TB-2155)
- `archlucid-ui/src/lib/operator/operator-static-demo.ts` / `isStaticDemoPayloadFallbackEnabled`
- `archlucid-ui/src/lib/showcase-static-demo.ts`
- Operator empty-state presets

## What to build

1. Inventory every operator-shell CTA/href that uses `SHOWCASE_STATIC_DEMO_*` or “Open sample architecture package” **inside the authenticated workspace** (not marketing `/why`).
2. Live tenant (demo flags off, static fallback off):
   - Error recovery next-step stays in the user’s workspace (retry, reviews list, switch workspace, start new). **No** showcase run/manifest id.
   - First-review guide secondary action is omitted, or points at the user’s own latest run, or is labeled sample **and** only rendered in Guided/eval with demo payloads enabled.
3. `ReviewPackageLoadFailureView` / `OperatorErrorRecoveryContract`: never add a sample-package link. Intact-line must not imply demo data is the user’s data.
4. Guard test: a small inventory (pattern-match or explicit list) fails CI if a live-shell recovery view imports showcase static demo ids.
5. Marketing `/why` may keep “Open sample architecture package.”

## Acceptance criteria

- Live Working user whose review 404s is sent to retries/list/workspace switch, not Claims Intake.
- First-review guide loading/error states do not prefetch a showcase UUID as the secondary action on live.
- Mock/demo E2E that *intentionally* uses showcase ids still pass.
- Recovery copy remains the three-line TB-2155 contract.

## Constraints

- Do not disable static demo for Playwright mock jobs.
- Do not remove the sample workspace from Guided Overview when sample-reviews preference is on.
- Do not collapse nav to hide sample links — label them.
