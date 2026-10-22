# CR-09 — Remaining infeasible empty states are not pending success

**Do not fork LS-02** (review-detail deliverables / infeasible lead). **Do not fork RS-03** (infeasible-as-package). **Do not fork IS-06** (stamp/export). This file is leftover **empty presets and help** that still say signed artifacts appear after you finalize — including when the verdict is a cited no.

## Goal

Working empty states for deliverables, evidence graph, compare, and sealed-record lists distinguish: (a) in-progress review, (b) **infeasible package** (receipt / unsat-core is the deliverable), (c) no reviews yet. Do not tell an architect with a reasoned no to finalize to get “signed artifacts.”

## Why

R13: a cited no is the product. Residual copy in `enterprise-compact-empty-state-presets-reviews.ts` and contextual-help `whyEmpty` still sells finalize as the path out of empty. That trains survivorship-bias UX on the paying desk.

## Context

- `archlucid-ui/src/lib/enterprise-compact-empty-state-presets-reviews.ts` (“Signed deliverables appear here after you finalize…”)
- `archlucid-ui/src/lib/contextual-help/evidence-graph-rows.ts` / `governance-rows.ts` / `comparison-replay-rows.ts` / `insights-rows.ts`
- `review-packages-help-export-copy.ts`
- `RunDetailArtifactsExportsSection.test.tsx` — LS-02 already covers review-detail; extend presets/help only
- Decision-receipt empty for soft infeasible — reuse copy constants, do not fork LS-02 components

## What to build

1. Inventory those empty/whyEmpty strings. Split in-progress vs infeasible vs none.
2. Infeasible: point at the decision receipt / feasibility verdict, not “finalize to get signed artifacts.”
3. “No reviews yet” may still say a sealed record appears after a successful finalize — that is honest for empty tenants.
4. Vitest on the copy modules. Guided may keep simpler empty teaching; it must not call a hard no “not finished.”

## Acceptance criteria

- Working reviews empty preset no longer uses a single “after you finalize” sentence for both in-progress and infeasible.
- Evidence-graph `whyEmpty` does not require a sample graph when a last-open infeasible package exists (link the package; LS-05 resolver may already supply the id).
- Stamp/PDF not restyled here.

## Constraints

- Do not claim CPA SOC 2.
- Do not implement G-REAL-06.
