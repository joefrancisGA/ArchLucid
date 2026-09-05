# FD-04 — The open review offers the sibling in-flight queue

**Do not fork LI-08, WD-06, or LD-11** for Overview/hub in-flight lists. **Do not fork RS-05** for “findings are not all-clear while analysis runs.” **Do not fork AD-02** for in-flight **Cancel** confirm. This file is leftover chrome: the open package has no **sibling** escape. The architect still babysits this tab.

## Goal

While this review’s analysis is in flight, Working review-detail shows a compact strip of **other** in-flight packages (title, discrete `stepLabel`, link) from the existing operations store. Deep-link uses `?reviewTab=` default landing only. No new progress URL. No fake percent. No toast-spam on other routes.

## Why

Livelihood throughput is blocked by waiting. The hub queue is useless if the open review is a modal spinner. A daily driver works *while* two reviews run.

## Context

- `docs/library/LONG_RUNNING_OPERATIONS_CONTRACT.md` (TB-2072)
- `archlucid-ui/src/hooks/use-shell-in-flight-operations.ts`
- `archlucid-ui/src/lib/operations/in-flight-operations-store.ts`
- `ReviewsHubInFlightAnalysisDesk` / Overview `in-flight` section — **reuse** the mapper
- `ReviewWorkspaceStaleBanner.tsx` — keep on this review
- Review-detail sticky actions / `RunDetailWorkspaceStickyActions.tsx`

## What to build

1. Working in-flight: a one-row sibling list (exclude the current `runId`) using the existing store. Empty sibling list: one sentence + link to reviews hub in-flight, not a sample CTA.
2. Keep stale banner. Do not poll a second way.
3. Copy: analysis is running; do not imply this package is ready to seal.
4. Vitest: two in-flight fixtures on review A show review B in the strip; no `%`; no `GET /v1/runs/{runId}/progress`.

## Acceptance criteria

- Working user on a running package can open the other running package without Overview archaeology.
- Desktop tabs stay a full strip (strip is extra chrome, not a tab replacement).

## Constraints

- Do not collapse tabs to “make the queue simpler.”
- Do not implement **M-90**.
- Do not start a long-lived dev server.
