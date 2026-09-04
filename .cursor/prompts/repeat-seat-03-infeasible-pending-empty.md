# RS-03 — Infeasible pending empty is not “signed deliverables after you finalize”

**Do not fork LI-02 or PT-16.** `RunDetailInfeasibleDecisionLead` and `RUN_DETAIL_DECISION_RECEIPT_EMPTY_COMPACT` already exist. This file is the leftover: **pre-finalize deliverables empty still talks as if a successful yes is coming**.

## Goal

When the feasibility verdict is exportable infeasible (`SoftInfeasible` / `HardInfeasible`), the deliverables / package empty state must not say “Signed deliverables appear here after you finalize.” The deliverable **is** the decision receipt. Pipeline-failure chrome stays only for actual load/execute failures.

## Why

A working architect’s job includes walking into a board with a costed, cited **no**. LI-02 shipped a dignified empty preset (`RUN_DETAIL_DECISION_RECEIPT_EMPTY_COMPACT`) and a lead section. `RunDetailArtifactsExportsSection` still spreads `RUN_DELIVERABLES_PENDING_FINALIZE_COMPACT` (“Signed deliverables appear here after you finalize the review…”) on the pending path. If that preset wins while a negative verdict is already on the payload, infeasible reads as an unfinished success.

## Context

- `archlucid-ui/src/lib/enterprise-compact-empty-state-presets-reviews.ts` — `RUN_DELIVERABLES_PENDING_FINALIZE_COMPACT`, `RUN_DETAIL_DECISION_RECEIPT_EMPTY_COMPACT`
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection.tsx` — `showDecisionReceipt` vs pending empty
- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailInfeasibleDecisionLead.tsx`
- `archlucid-ui/src/lib/decision-receipt-export.ts` — `isExportableDecisionVerdict`
- `archlucid-ui/src/lib/feasibility/resolve-feasibility-verdict-for-display.ts`

## What to build

1. When `isExportableDecisionVerdict` is true, do **not** render `RUN_DELIVERABLES_PENDING_FINALIZE_COMPACT`. Use the decision-receipt empty (or the lead + export button already on the section). Primary export is the decision receipt.
2. Grep other “signed deliverables appear after you finalize” / success-empty presets on review-detail. If a receipt can be generated, those strings must not be the only story.
3. Hard infeasible: keep citation requirement; do not invent a law. If citation missing, show the existing defect — do not relabel as Hard.
4. Execute/load failures stay `OperatorErrorRecoveryContract` — do not reuse infeasible styling for 500s.
5. Vitest: infeasible fixture does not mount `run-deliverables-pending-finalize-empty-state`; mounts decision-receipt empty or export CTA; feasible pending still uses pending-finalize; failure fixture unchanged.

## Acceptance criteria

- An architect with a reasoned “no” does not see “signed deliverables appear after you finalize” as the deliverables story.
- Infeasible is not visually a broken pipeline.
- Hard without citation cannot appear as Hard.
- Cost figures on the receipt stay SAQ-011 estimates (`DECISION_RECEIPT_COST_ESTIMATE_LABEL`).

## Constraints

- Do not invent a second PDF stack; reuse receipt JSON/download.
- Do not silently relax invariants.
- Do not change `typed-engine-protected`.
- Do not collapse review tabs.
