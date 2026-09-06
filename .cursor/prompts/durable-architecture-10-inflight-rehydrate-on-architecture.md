# DA-10 — Rehydrate in-flight operations from the architecture identity

**Do not fork LK-10** (wait is not the desk copy/workbench). **Do not** keep wait heroes. This prompt is **continuity after scope switch / refresh**.

## Goal

The architecture desk (DA-04) and Working Home in-flight strip can **rebuild** “what is still running” from the **server** for the current tenant+architecture, instead of relying only on `sessionStorage` that `clearInFlightOperations()` wipes on `archlucid:operator-scope-changed`.

1. On architecture desk mount (and when scope returns to this workspace), query existing operations/review-status APIs for child runs of this `ArchitectureId` that are not terminal.
2. Merge into the in-flight store **for this scope** without resurrecting another tenant’s ops.
3. If no operations list API can filter by `ArchitectureId`, use child review ids from DA-03 GET + existing run status — do **not** invent `GET /v1/runs/{id}/progress` (`LONG_RUNNING_OPERATIONS_CONTRACT.md` forbids that missing route).
4. Copy already says the server continues (`review-execution-background-safety-copy.ts`) — do not contradict it. Do not add a watchdog that looks like cancel.

## Why

Consultants switching customer workspace mid-day lose the only client tracker. Refresh after a Front Door 60s cutoff already feels like data loss. Livelihood tools rehydrate jobs from the server; casual SPAs forget.

## Context

- `docs/library/LONG_RUNNING_OPERATIONS_CONTRACT.md` (sessionStorage; `clearInFlightOperations` on scope change — **keep clear on switch**, then rehydrate the **new** scope)
- `in-flight-operations-store.ts`
- `use-shell-in-flight-operations.ts`
- DA-03 child `LatestReviewId` / reviews collection
- LK-10 wait chrome — do not restyle wait as the job

## What to build

1. Rehydrate function keyed by tenant/workspace/project + optional `architectureId`.
2. Call from architecture desk and, if cheap, Working Home in-flight strip (existing strip — do not fork CR-06 heroes).
3. Tests: after a simulated scope-change clear, rehydrate brings back a non-terminal child run; other tenant’s run id is ignored.
4. Do not persist Bearer tokens (LK-05).

## Acceptance criteria

- Switching away still clears the old scope’s client tracker (isolation).
- Returning to the architecture shows in-flight children without pressing Keep watching on a dead poll.

## Constraints

- ADR 0037: no cross-tenant rehydrate.
- Do not lengthen client poll watchdog as a substitute (that is still not the desk).
