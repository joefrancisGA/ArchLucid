# LS-02 — Infeasible is not “signed deliverables after you finalize”

**Do not fork LI-02, PT-16, or RS-03.** Decision-receipt lead and `RUN_DETAIL_DECISION_RECEIPT_EMPTY_COMPACT` exist. This file is the leftover **still in product code**: `RunDetailArtifactsExportsSection` still spreads `RUN_DELIVERABLES_PENDING_FINALIZE_COMPACT` on the pending path.

## Goal

When the feasibility verdict is exportable infeasible (`SoftInfeasible` / `HardInfeasible`), do **not** render “Signed deliverables appear here after you finalize.” The deliverable **is** the decision receipt. Feasible-but-not-yet-finalized may keep the pending-finalize empty. Execute/load failures stay recovery chrome.

## Why

R13: a reasoned **no** is the product. If the pending empty wins while a negative verdict is already on the payload, infeasible reads as an unfinished success. That is evaluator theater. A working architect walks into a board with a costed, cited no.

## Context

- `archlucid-ui/src/app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailArtifactsExportsSection.tsx` (spreads `RUN_DELIVERABLES_PENDING_FINALIZE_COMPACT`)
- `archlucid-ui/src/lib/enterprise-compact-empty-state-presets-reviews.ts`
- `RunDetailInfeasibleDecisionLead.tsx`
- `isExportableDecisionVerdict` / `decision-receipt-export.ts`
- `resolve-feasibility-verdict-for-display.ts`

## What to build

1. Gate the pending-finalize empty on “no exportable verdict yet,” not merely “not finalized.”
2. When `isExportableDecisionVerdict` is true, show receipt empty + export CTA (existing compact), not signed-deliverables-after-finalize.
3. Grep other “appear after you finalize” presets on review-detail. Same rule.
4. Hard without a law citation must not be labeled Hard (R5). Do not invent a law.
5. Vitest: infeasible fixture does not mount `run-deliverables-pending-finalize-empty-state`; feasible pending still does; 500/load failure unchanged.

## Acceptance criteria

- An architect with a reasoned no does not see unfinished-success copy as the deliverables story.
- Infeasible is not styled as a broken pipeline.
- Receipt cost figures stay estimates (`DECISION_RECEIPT_COST_ESTIMATE_LABEL`).

## Constraints

- Do not invent a second PDF stack.
- Do not change `DeterministicInsightDensityGate` (IS-05).
- Do not collapse review tabs.
