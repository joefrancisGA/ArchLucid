# PT-16 — A reasoned “no” is the package, not a failed run

## Goal

When the feasibility verdict is `SoftInfeasible` or `HardInfeasible`, the **Finalized review record** tab (and Overview) lead with that decision: unsat core / envelope, transparency trail, and **decision-receipt export**. Empty “signed deliverables appear after you finalize” copy must not describe an infeasible outcome as a missing success. Pipeline-failure chrome is only for actual load/execute failures.

## Why

R13: a reasoned “no” is a first-class, exportable, cost-quantified artifact. `decision-receipt-export.ts`, `DecisionReceiptExportButton`, and APIs `/v1/artifacts/reviews/{runId}/decision-receipt` already exist. `RunDetailFeasibilityVerdictSection` still sits as a colored appendix. Empty-state presets still talk as if the durable artifact is always a sealed *yes*. The expert leaves the room with a receipt, not an error page.

## Context

- `docs/architecture/adrs/0050-feasibility-classification-transparency-trail.md`
- `docs/architecture/adrs/0052-monetization-posture-decision-as-product.md`
- `archlucid-ui/src/lib/decision-receipt-export.ts` — `isExportableDecisionVerdict`
- `archlucid-ui/src/components/draft-intake/DecisionReceiptExportButton.tsx`
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailFeasibilityVerdictSection.tsx`
- `archlucid-ui/src/lib/enterprise-compact-empty-state-presets-reviews.ts` — `run-detail-decision-receipt-empty-state`
- Review tab `review-package` / Overview
- PT-08 mounts the trail; this prompt owns **hierarchy** when the verdict is infeasible

## What to build

1. If verdict kind is exportable infeasible: Overview and Finalized review record put `RunDetailFeasibilityVerdictSection` (reuse) **above** success-oriented package CTAs. Primary export is the decision receipt; sponsor PDF remains available but is not the only headline.
2. Empty states: if a receipt can be generated, do not show “signed deliverables appear after finalize” as the only story. Honest: “This review’s deliverable is a feasibility decision (not feasible as specified).”
3. Hard infeasible: keep citation requirement; do not invent a law. If citation missing, show the existing defect — do not relabel as Hard.
4. Soft infeasible: envelope + soft assumption stay visible (already on the section).
5. Execute/load failures stay `OperatorErrorRecoveryContract` — do not reuse infeasible styling for 500s.
6. Vitest: infeasible fixture shows receipt CTA and does not show the success-empty preset; feasible fixture unchanged; failure fixture unchanged.

## Acceptance criteria

- An architect can export a dignified “no” from the package tab without hunting the feasibility appendix.
- Infeasible is not visually a broken pipeline.
- Hard without citation cannot appear as Hard.
- Cost figures on the receipt stay SAQ-011 estimates (`DECISION_RECEIPT_COST_ESTIMATE_LABEL`).

## Constraints

- Do not invent a second PDF stack; reuse receipt JSON/download.
- Do not silently relax invariants.
- Do not change `typed-engine-protected`.
