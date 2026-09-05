# CR-06 — Remaining wait heroes are not the desk

**Do not fork IS-09** (wait-is-background copy). **Do not fork LS-09** (review-detail workbench while in flight). **Do not fork FD-04 / FD-12** (sibling queue / stay-on-this-tab copy). This file is leftover **surfaces besides review-detail** that still make wait-for-this-pipeline the page: Overview wait heroes, first-review-guide in-progress, and Home that replaces the work queue with a spinner.

## Goal

Working Overview / Home / first-review-guide: in-flight is a status + sibling-queue affordance. Last-open package, drafts, and the work queue stay on screen. Guided may keep a more linear wait. Do not cancel on navigate away (AD-02).

## Why

IS-09 / LS-09 can fix the open review while Home still teaches “sit here until the pipeline finishes.” An all-day instrument treats compile as background. Remaining wait heroes undo that bet.

## Context

- `composeOperatorHomeSections` / in-flight strip (FD-04 sibling queue — do not fork)
- First-review-guide in-progress copy (`use-first-review-guide-state.ts`)
- `ShellInFlightOperationsAffordance.tsx`
- `ReviewWorkspaceStaleBanner` — allowed; full-page wait not allowed on Working Home
- `docs/library/LONG_RUNNING_OPERATIONS_CONTRACT.md` — no fake %

## What to build

1. Grep Working Home, Overview, and first-review-guide for full-page wait heroes or copy that forbids leaving the tab. Keep last-known queue + in-flight affordance.
2. Default may highlight the in-flight row. Do not unmount Continue last / drafts / packages.
3. Vitest: Working Home with an in-flight run still shows the work queue or last-open row + in-flight affordance. Guided wait hero still allowed.

## Acceptance criteria

- A Working architect can leave Home for last-open work while a sibling pipeline runs.
- Leaving the page does not cancel the run.
- No invented `GET /v1/runs/{id}/progress`.

## Constraints

- Do not implement LS-06 what-if here.
- Do not implement live meeting (IS-11).
- Do not collapse review tabs.
