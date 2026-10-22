# LD-14 — Insights evidence graph is list-first in Working

**Do not fork LI-15 or WD-12** for the finding-graph outline default or Working teaching-chrome fail-closed. This file is **`/insights/evidence-graph` still canvas-first**.

## Goal

Working-mode Insights evidence graph defaults to a **keyboard-reachable list/outline**; the canvas is optional. Guided may default to canvas. Outline is a real list (links/buttons), not a screenshot of nodes. VPAT honest limits stay honest — do not claim full screen-reader coverage.

## Why

LI-15 defaulted the **finding** evidence graph to outline in Working. The Insights route (`GraphInteractiveCanvas`, `GraphLoadedExperience`) is still a canvas work surface. All-day keyboard use is list + predictable focus. Complex graphics may pass axe and still fail as a desk. Sample-mode banners on that route must not become the live recovery path (LD-02).

## Context

- `archlucid-ui/src/app/(operator)/insights/evidence-graph/_sections/GraphInteractiveCanvas.tsx`
- `archlucid-ui/src/app/(operator)/insights/evidence-graph/_sections/GraphLoadedExperience.tsx`
- `archlucid-ui/src/components/findings/FindingEvidenceGraphOutline.tsx` — **reuse** if the outline model fits; otherwise a route-local list of nodes/edges from the existing view model
- `graphViewModelToJsonSnapshot` / type filter already on the page
- `docs/security/VPAT_2_5_WCAG_2_1_AA.md`
- `.cursor/rules/no-collapse-workspace-tabs.mdc`

## What to build

1. Working: evidence-graph **defaults to outline/list**. Canvas behind an explicit control. Guided may default to canvas.
2. Outline rows are focusable controls that select the same node the canvas would. Keyboard next/prev may reuse existing graph key handlers if they already exist.
3. Keep skip link + post-navigation focus to `#main-content`.
4. Sample-mode banner stays labeled sample; live empty state is “pick a review,” not Claims Intake canvas.
5. Vitest: Working default is outline (test id); Guided may be canvas; do not claim VPAT “Supports” upgrades without evidence.

## Acceptance criteria

- Keyboard-only Working user can triage evidence-graph nodes from the outline without using the canvas.
- Finding-graph Working outline default from LI-15 does not regress.
- Desktop review tabs remain a full strip (this route is Insights, not the review strip).
- VPAT remarks stay accurate.

## Constraints

- Do not collapse desktop tabs to reduce focus stops.
- Do not use native `title` for help (TB-2147 / design system).
- Do not implement a full screen-reader audit program in this prompt.
- Help links stay in-app `/help/{topic}`, not GitHub blob URLs.
