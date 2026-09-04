# LI-08 — In-flight analysis is a desk, not a spinner on one tab

**WD-06 is the structural owner — implement that residual here; do not invent `GET /v1/runs/{runId}/progress`.** Shell already tracks operations (`use-shell-in-flight-operations.ts`, `in-flight-operations-store.ts`). This file puts that queue on **Overview and the reviews hub**.

## Goal

Working-mode Overview and the reviews hub treat **in-flight analysis** as resumable work: which packages are running, what step they are on (honest discrete labels, not fake percent), stale-vs-live on the open review, and a way to continue other work without losing the queue.

## Why

Livelihood throughput is blocked by waiting. `ReviewWorkspaceStaleBanner` exists on review chrome. Home Working composition already prefers unfinished work. There is still no first-class **in-flight** slice across packages on Overview/hub. A daily driver works *while* it runs. The LRO contract forbids inventing a progress URL (`docs/library/LONG_RUNNING_OPERATIONS_CONTRACT.md`).

## Context

- `docs/library/LONG_RUNNING_OPERATIONS_CONTRACT.md` (TB-2072) — operations poll / SSE after TB-2074
- `archlucid-ui/src/hooks/use-shell-in-flight-operations.ts`
- `archlucid-ui/src/lib/operations/in-flight-operations-store.ts`
- `archlucid-ui/src/components/reviews/ReviewWorkspaceStaleBanner.tsx`
- `archlucid-ui/src/lib/compose-operator-home-sections.ts`
- Reviews hub: `archlucid-ui/src/app/(operator)/architecture/reviews/`
- Existing `state` / `stepLabel` / `heartbeatUtc` on operation payloads

## What to build

1. Working Overview: an **In flight** (or reuse Unfinished) slice listing analysis-in-progress packages with discrete `state` / `stepLabel` from the **existing** operations/run summary payload. No invented percentages. Reuse the in-flight store; do not poll a second way.
2. Reviews hub: default Working filter or grouping that surfaces in-progress above completed eval samples. Guided may keep current default.
3. Keep stale banner on the open review. If the user is on another route, do not toast-spam; the desk list is the signal.
4. Deep link from a queue row to the review with `?reviewTab=` landing on Activity while analysis runs — **default tab only**, not tab visibility/order changes.
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
