# LK-13 — Infeasible is a first-class package, not pending success

**Do not fork LI-02, PT-16, RS-03, LS-02, or CR-09** if deliverables empty-state already swaps to the decision receipt — this file is the leftover **information architecture**: Home, reviews hub, and start/resume still treat infeasible as an unfinished execute. R13: a reasoned **no** is the product.

## Goal

When the feasibility verdict is exportable infeasible (`SoftInfeasible` / `HardInfeasible` with R5 citation rules), Working surfaces it as a **complete decision package**: list/hub filter or status, Home resume, and review-detail deliverables use the receipt — never “signed deliverables appear after you finalize” and never a broken-pipeline chrome. Feasible-but-not-yet-finalized may keep pending-finalize empty. Execute/load failures stay recovery chrome.

## Why

If the hub and Home still sort infeasible next to failed runs, the seatholder cannot find the artifact they will take to the board. Empty-state-only fixes are overlay.

## Context

- `RunDetailArtifactsExportsSection.tsx` / `RUN_DELIVERABLES_PENDING_FINALIZE_COMPACT`
- `isExportableDecisionVerdict` / `decision-receipt-export.ts`
- `resolve-feasibility-verdict-for-display.ts`
- Reviews hub inventory filters
- Working start / continue last (IS-03 / LS-08) — infeasible should resume the receipt, not offer Start review as if nothing exists
- ADR 0052 decision-as-product

## What to build

1. Close LS-02 empty-state residual if still in code.
2. Hub/Home: exportable infeasible is not lumped with execute failure. Reuse existing status vocabulary (TB-645); do not invent “Rejected idea” marketing copy.
3. Working resume: last-open infeasible package opens the review receipt, not a new draft.
4. Vitest: infeasible fixture does not mount pending-finalize empty; hub filter or status distinguishes it from failed execute; Hard without citation is not labeled Hard.

## Acceptance criteria

- An architect with a reasoned no can find and export it from Home/hub without seeing unfinished-success copy.
- Receipt cost figures stay estimates.

## Constraints

- Do not invent a second PDF stack.
- Do not change the density gate.
- Do not collapse review tabs.
