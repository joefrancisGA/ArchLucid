# LK-10 — Wait is not the Working desk

**Do not fork FD-12** (copy: do not stay on this page). **Do not fork FD-04** (sibling in-flight strip). **Do not fork AD-02** (cancel confirm). **Do not fork CR-06** (Home / Overview wait heroes). **Do not fork IS-09** if review-detail already keeps workspace tabs usable during in-progress — then close residuals only. This file is authorized to change the **job**: Working in-progress is a long-running operation the architect **leaves**. Home, other packages, drafts, and Ask remain the desk.

## Goal

Working in-progress review-detail primary content is last-known architecture / findings / trail plus an in-flight status that is **not** a full-page blocker. Activity may be the default tab while running; other tabs stay reachable. Home in-flight list is the escape hatch. Copy never says “stay on this page” in Working. Guided may keep a more linear wait for teaching.

No fake percent-complete bar. No new `GET /v1/runs/{id}/progress` (TB-2072).

## Why

VS Code does not make “wait for compile” the IDE. ArchLucid’s core loop is still start-a-run-and-watch. Overlay chrome (in-flight pill) is not the same as an instrument that keeps working.

## Context

- `docs/library/LONG_RUNNING_OPERATIONS_CONTRACT.md`
- `ShellInFlightOperationsAffordance.tsx`
- `ReviewDetailSiblingInFlightQueue`
- `composeOperatorHomeSections` `in-flight`
- `ReviewWorkspaceStaleBanner`
- IS-03 start resolver prefers another in-flight rather than a second wait screen
- LS-09 workbench-during-inflight leftover

## What to build

1. Working in-progress: main workspace visible; in-flight affordance; no full-page “please wait” as the only child.
2. Navigation to Home / other review / draft does not cancel the run.
3. Vitest: Working in-progress fixture shows workspace + in-flight; Guided may stay linear; no invented progress endpoint.
4. Cancel still confirms (AD-02).

## Acceptance criteria

- A Working architect can open Overview or another package while a review executes without cancelling it.
- No fake %.

## Constraints

- Do not implement live meeting elicitation (IS-11 / FD-01).
- Do not poll unbounded; reuse operations/SSE.
- Do not collapse review tabs.
