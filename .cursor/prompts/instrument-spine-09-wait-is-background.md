# IS-09 — Wait is background; the desk keeps working

**Do not fork FD-12** (copy: do not stay on this page). **Do not fork FD-04** (sibling in-flight strip). **Do not fork AD-02** (cancel confirm). This file changes the **job**: Working in-progress is a long-running operation the architect can leave. Home, drafts, other packages, and Ask remain usable. Do not build a fake percent-complete bar.

## Why

VS Code does not make “wait for compile” the IDE. ArchLucid’s core loop is still start-a-run-and-watch. In-flight chrome exists; the product still behaves like a pipeline with a desk bolted on. All-day use requires concurrent work.

## Context

- `ShellInFlightOperationsAffordance.tsx`
- `composeOperatorHomeSections` `in-flight`
- `ReviewDetailSiblingInFlightQueue`
- `docs/library/LONG_RUNNING_OPERATIONS_CONTRACT.md` (TB-2072) — no fake `GET /v1/runs/{id}/progress`
- First-week / in-progress bridge copy
- `ReviewWorkspaceStaleBanner`

## What to build

1. Working in-progress review-detail: primary content is last known architecture / findings / trail, plus an in-flight status that is not a full-page blocker. Activity may be the *default tab* while running (WD-10 already allows default tab change) — do not hide other tabs.
2. Home in-flight list is the escape hatch (already); Working Start (IS-03) prefers another in-flight or last draft rather than creating a second wait screen.
3. Copy: never “stay on this page” in Working (FD-12). Add one line that other packages remain available (not a second sibling-queue implementation — reuse FD-04).
4. Guided may keep a more linear wait for teaching.
5. Vitest: Working in-progress fixture shows main workspace + in-flight affordance; Guided wait copy still allowed to be linear; no invented progress endpoint.

## Acceptance criteria

- A Working architect can open Overview or another package while a review executes without cancelling it.
- Cancel still confirms (AD-02).
- No fake %.

## Constraints

- Do not implement live meeting elicitation (IS-11 / FD-01).
- Do not poll unbounded; reuse existing operations/SSE patterns.
