# FD-05 — Transparency trail is in the stamp first viewport

**Do not fork PT-08 or WD-02** for `TransparencyTrailPanel` / Overview mount. **Do not fork WA-13** for receipt-at-stamp placement. **Do not fork CD-05 / CD-06** for density/print honesty. This file is the leftover: the trail can sit on Overview while Finalize / sealed-record first paint shows receipt + Decision-grade without asserted vs inferred vs skipped MUST.

## Goal

Working Finalize band (review-package tab / stamp) shows the compact trail in the **first viewport** next to the receipt (WA-13) and density honesty (CD-05). Do not add a second trail model. Guided may keep a shorter hint; do not strip honesty.

## Why

R4: the transparency record is the precondition that earns the liability stance. A trail in an Overview appendix is evaluator packaging. The career screenshot is the stamp.

## Context

- `archlucid-ui/src/components/reviews/RunDetailOverviewTransparencyTrail.tsx`
- `archlucid-ui/src/components/feasibility/TransparencyTrailPanel.tsx`
- `RunDetailReviewPackageDecisionReceiptStrip.tsx` (WA-13)
- `RunDetailReviewPackageSection.tsx` / finalize band
- `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4

## What to build

1. Mount the existing trail compact variant on the Working stamp/Finalize first section if it is not already there. Reuse Overview data; do not fetch a parallel provenance API.
2. If skipped MUST or quiet engines already have hints on the seal desk, keep them beside the trail — do not invent a second density scale.
3. Vitest: Working stamp fixture includes asserted/inferred/skipped (or the shipped empty-trail sentence). Overview trail still exists. Gate `.cs` empty diff.

## Acceptance criteria

- A Working stamp screenshot includes the trail without scrolling past the receipt.
- Guided may keep trail on Overview only if eval chrome is on — Working must not.

## Constraints

- Do not change `typed-engine-protected`.
- Do not collapse review tabs.
- Do not send users to guided intake to “fix” skipped MUST (RS-01).
