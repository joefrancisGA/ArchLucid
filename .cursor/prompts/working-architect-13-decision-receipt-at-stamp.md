# WA-13 — Decision receipt sits at the stamp (yes and no)

**Do not fork LI-02 or PT-16** for infeasible-as-package-lead or empty compact copy. Those shipped. This file is **placement**: `DecisionReceiptExportButton` still lives on feasibility / artifacts appendix chrome, not next to Finalize / sealed-record success.

## Goal

Working-mode Finalize success (feasible yes **and** reasoned no) offers the decision receipt in the same viewport as the stamp — Overview/Finalize band — not only Artifacts. Infeasible pending empty stays RS-03 (do not promise a yes). Reuse `DecisionReceiptExportButton`; do not invent a second PDF stack.

## Why

R13: a reasoned no is the product. If the receipt is behind Artifacts, the meeting leaves with a findings table and no artifact. Casual tools bury export. Livelihood tools put the work product on the file menu at the moment of the decision.

## Context

- `DecisionReceiptExportButton.tsx` / `decision-receipt-export.ts`
- `RunDetailFeasibilityVerdictSection.tsx` / `RunDetailArtifactsExportsSection.tsx`
- Finalize CTA / review-package tab
- Sealed-records list (LD-07) — may link receipt; do not build a second object
- `RUN_DETAIL_DECISION_RECEIPT_EMPTY_COMPACT`

## What to build

1. After a successful seal (or when a sealed record already exists), show the receipt control on the Finalize/Overview stamp band. Keep Artifacts as duplicate, not the only door.
2. Infeasible sealed package: receipt is the lead export (LI-02). Feasible: receipt sits with sponsor handoff, not instead of the package zip.
3. Vitest: sealed fixture renders the receipt control outside the artifacts-only section.

## Acceptance criteria

- Working user who just finalized does not have to discover Artifacts to leave with a receipt.
- Pending (unsealed) empty does not talk as if a yes is coming (RS-03).
- Desktop tabs stay a full strip (do not hide Artifacts behind More).

## Constraints

- Do not merge six sponsor dashboards.
- Do not imply the receipt is a CPA attestation.
- Do not collapse review tabs.
