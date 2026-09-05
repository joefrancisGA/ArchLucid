# LS-09 — Workbench stays the desk while a review is in flight

**Do not fork IS-09, FD-04, FD-12, or AD-02.** Those own wait-copy, sibling queue, and cancel confirm. This file is the leftover **instrument**: in-progress review-detail can still hydrate **tab-only** or make Activity the only usable surface, so the architect cannot read last-known architecture / findings / trail while the pipeline runs.

## Goal

Working in-progress: split workbench (or last-known Architecture + findings + trail) remains usable. In-flight affordance is a status, not a full-page blocker. Activity may be the default **tab** while running; other tabs and workbench columns stay reachable. Guided may keep a more linear wait.

## Why

VS Code does not make “wait for compile” the IDE. IS-09 says wait is background. If workbench preference is ignored until `Succeeded`, the workday is still sit-on-this-tab.

## Context

- `use-professional-workbench-enabled.ts` — `mounted: true` already; check review-detail **gating** on status
- `ReviewDetailWorkspace.tsx` / `ReviewWorkbenchLayout.tsx`
- `ShellInFlightOperationsAffordance.tsx`
- `composeOperatorHomeSections` `in-flight`
- `docs/library/LONG_RUNNING_OPERATIONS_CONTRACT.md` — no fake %

## What to build

1. Grep review-detail for status gates that unmount workbench or replace main with a wait hero. Working: keep last-known panels; stale banner is allowed (`ReviewWorkspaceStaleBanner`).
2. Default tab may be Activity while running (existing WD-10 allowance). Do not hide Architecture / findings / trail.
3. Cancel still confirms (AD-02). Do not cancel on navigate away.
4. Vitest: Working in-progress fixture shows workbench or last-known architecture panel + in-flight affordance; Guided wait hero still allowed.

## Acceptance criteria

- A Working architect can read last-known findings while a review executes.
- Leaving the page does not cancel the run.
- No invented `GET /v1/runs/{id}/progress`.

## Constraints

- Do not implement LS-06 what-if here.
- Do not implement live meeting (IS-11).
