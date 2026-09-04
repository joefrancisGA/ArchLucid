# WA-05 — Ask, Compare, and graph from nav require an open package (honest empty)

**Do not fork RS-08 or LD-09** for keyboard chords that pass `runId` from review-detail. Those shipped. This file is **nav / palette / header entry with no package in context**: Working empty states must not look like a blank tool or a sample.

## Goal

When a Working user opens Ask, Compare two reviews, or Evidence graph from the sidebar with **no** current review, the empty state says to pick a package (link Reviews / sealed records / New review). It does not load Claims Intake, does not imply the graph is their architecture, and does not show an enabled primary CTA that cannot succeed (TB-2005).

## Why

RS-08 fixed chords *from an open package*. The same surfaces from nav are still “type two GUIDs” or illustrative sample graph (`AskRunIdPicker` live copy leftover if LD-02 missed a path). Casual products always have a demo dataset. A livelihood desk does not pretend work exists.

## Context

- `archlucid-ui/src/components/AskRunIdPicker.tsx`
- `archlucid-ui/src/lib/compare-two-reviews-route.ts` / Compare page empty
- Insights evidence-graph empty (`use-graph-page-state.ts` already uses production eval chrome — keep)
- `isLiveOperatorShellRecoveryContext()` — live never sample (LD-02)
- Reviews list / `WORKING_MODE_NEW_REVIEW_ROUTE`

## What to build

1. Working + live + no `runId`: Ask/Compare/graph empty uses TB-2155-style next step (pick a package / start a review). Disable primary “run compare” until two ids exist (TB-2005).
2. Sample graph / showcase ids only when demo/static is actually on, labeled sample.
3. If a last-opened review id is already in session/prefs, offer **Continue with {title}** — do not silently bind a showcase UUID.
4. Vitest: live Working Ask empty has no Claims Intake href; Compare primary disabled without two ids.

## Acceptance criteria

- Working nav → Ask with no packages does not open an illustrative graph as “your” architecture.
- Guided/demo sample empty may remain labeled sample.
- Keyboard-from-open-package (RS-08) still prefills.
- No fake compare against empty manifests (R12 gate stays: committed packages only).

## Constraints

- Do not invent `GET /v1/runs/{runId}/progress`.
- Do not collapse review tabs.
- Do not disable static demo for Playwright mock jobs.
