# LD-02 — Live failures never recover into sample data

**Do not fork PT-02 or WD-08.** Review-detail `error.tsx` already gates on `isLiveOperatorShellRecoveryContext()`. First-review guide already omits sample hrefs on live. This file is the **remaining substitutions**.

## Goal

On authenticated **live** tenants, error recovery, empty states, list-grid failures, and “next review” footers never navigate into showcase/static-demo packages as if they were the user’s work. Sample remains an explicit Guided/eval action, labeled sample.

## Why

A livelihood tool cannot afford one crash that treats Claims Intake as *your* architecture. `RunsListAggregateErrorBoundary` still substitutes the Claims Intake row when the live grid throws (“Showing sample run data”). Governance/digest/sponsor **Next review** footers still call `tryStaticDemoRunSummariesPaged`. `AskRunIdPicker` can still send the user to an illustrative Claims Intake graph. `OnboardingStartClient` still offers “Open sample review.” Casual SaaS recovers into a demo. A professional needs retry, what failed, and what is intact (TB-2155).

## Context

- `archlucid-ui/src/lib/live-operator-shell-recovery.ts` — **reuse**
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/error.tsx` — already live-gated; do not regress
- `archlucid-ui/src/components/runs/RunsListAggregateErrorBoundary.tsx` — **primary leftover**
- Grep `tryStaticDemoRunSummariesPaged` under `archlucid-ui/src`
- `archlucid-ui/src/components/AskRunIdPicker.tsx`
- `archlucid-ui/src/components/OnboardingStartClient.tsx`
- `archlucid-ui/src/lib/error-recovery-contract-copy.ts` (TB-2155)
- `archlucid-ui/src/components/ReviewPackageLoadFailureView.tsx`

## What to build

1. Inventory every operator-shell CTA/href that uses `SHOWCASE_STATIC_DEMO_*`, `tryStaticDemoRunSummariesPaged`, or “Open sample” **inside the authenticated workspace** (not marketing `/why`).
2. `RunsListAggregateErrorBoundary`: if `isLiveOperatorShellRecoveryContext()`, show TB-2155 recovery (retry / reviews list / Help / Report Problem). **No** Claims Intake substitution. Sample table only when demo/static fallback is actually on.
3. Next-review footers (governance findings, risk exceptions, recurrence, digests, sponsor ROI): live context must not pick a showcase run as “your next review.”
4. `AskRunIdPicker` empty copy may mention a sample graph only when demo/static is on; live copy points at Start review / existing packages.
5. Guard test: live-shell recovery views must not import showcase static demo ids. Extend `live-operator-shell-recovery.test.ts`.
6. Marketing `/why` may keep “Open sample architecture package.” Guided Overview may keep labeled sample rails.

## Acceptance criteria

- Live Working user whose reviews grid throws is sent to retry / Help, not Claims Intake.
- Live “next review” footers do not deep-link a showcase UUID as the user’s work.
- Review-detail live `error.tsx` and first-review guide live gating stay omitted-sample.
- Mock/demo E2E that *intentionally* uses showcase ids still pass.
- Recovery copy remains the three-line TB-2155 contract.

## Constraints

- Do not disable static demo for Playwright mock jobs.
- Do not remove the sample workspace from Guided Overview when sample-reviews preference is on.
- Do not collapse nav to hide sample links — label them.
- Do not treat LD-01 as a prerequisite if you can gate on `isLiveOperatorShellRecoveryContext()` alone.
