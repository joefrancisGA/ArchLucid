# WD-06 — In-flight analysis is a desk, not a spinner on one tab

## Goal

Working-mode Overview and the reviews hub treat **in-flight analysis** as resumable work: which packages are running, what step they are on (honest discrete labels, not fake percent), stale-vs-live on the open review, and a way to continue other work without losing the queue. Do not call missing `GET /v1/runs/{runId}/progress`.

## Why

The durable object is a review you create, wait for, triage, and seal. Livelihood throughput is blocked by waiting. `ReviewWorkspaceStaleBanner` exists on review chrome. Home Working composition already prefers unfinished work. There is still no first-class **in-flight queue** across packages, and the LRO contract forbids inventing a progress URL (`docs/library/LONG_RUNNING_OPERATIONS_CONTRACT.md`). A daily driver works *while* it runs.

## Context

- `docs/library/LONG_RUNNING_OPERATIONS_CONTRACT.md` (TB-2072) — operations poll / SSE after TB-2074; **no** `GET /v1/runs/{runId}/progress`
- `archlucid-ui/src/components/reviews/ReviewWorkspaceStaleBanner.tsx`
- `archlucid-ui/src/lib/compose-operator-home-sections.ts` — Working unfinished / recent
- Reviews hub: `archlucid-ui/src/app/(operator)/architecture/reviews/`
- Shell activity / operation indicators (grep `operations/` poll, SSE, `stepLabel`, `heartbeatUtc`)
- `docs/library/API_CONTRACTS.md`

## What to build

1. Working Overview: an **In flight** (or reuse Unfinished) slice listing analysis-in-progress packages with discrete `state` / `stepLabel` from the **existing** operations/run summary payload. No invented percentages.
2. Reviews hub: default Working filter or grouping that surfaces in-progress above completed eval samples. Guided may keep current default.
3. Keep stale banner on the open review. If the user is on another route, do not toast-spam; the desk list is the signal.
4. Deep link from a queue row to the review with `?reviewTab=` landing on Activity while analysis runs — **default tab only**, not tab visibility/order changes (WD-10 / no-collapse rule).
5. Copy: analysis is running; do not imply the package is ready to seal.
6. Vitest for section composition and mapping from existing DTOs. No new progress endpoint.

## Acceptance criteria

- Working user with two in-flight reviews sees both on Overview/hub without opening each spinner tab.
- Progress labels are discrete and honest; no fake `%`.
- No call to a non-existent run progress URL.
- Desktop tabs stay fully visible in stable order.

## Constraints

- Do not start a long-lived dev server or `gh pr checks --watch`.
- Do not implement GTM **M-90**.
- Do not collapse tabs to “make the queue simpler.”
