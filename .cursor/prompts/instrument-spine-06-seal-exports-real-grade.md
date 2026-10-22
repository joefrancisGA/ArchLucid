# IS-06 — Stamp, print, and export use real classification

**Depends on IS-05.** **Do not fork CD-05, CD-06, CD-07, CD-15, or FD-07.** Those added honesty lines while the gate still promoted. This file makes the **stamp and exports** show checklist vs decision-grade as first-class, not a footnote.

## Goal

Finalize / print / sealed JSON / ADR export / sponsor PDF / copy-as-work-item report **counts and labels** from `FindingClassification` after the gate. A package that is mostly checklist cannot screenshot as an all-clear Decision-grade review. Skipped MUST still blocks seal (PT-17 / existing scorecard). Quiet engines still must not read as “no findings” (WD-03).

## Why

If livelihoods depend on the sealed record, the artifact that leaves the building is the product. Honesty in the SPA that disappears in the PDF is an evaluator pattern.

## Context

- `archlucid-ui/src/lib/package-print-view.ts`
- `archlucid-ui/src/lib/copy-finding-as-work-item-coverage-honesty.ts`
- `archlucid-ui/src/lib/findings/findings-snapshot-insight-density.ts`
- Decision-receipt / stamp band (`WA-13`, `FD-05` trail — keep trail; add grade counts)
- Sealed export / ADR export builders (grep `FindingClassification` / `DecisionGradeFinding`)
- `docs/library/PUBLIC_CLAIM_BOUNDARY_GUIDE.md`

## What to build

1. Stamp / receipt first viewport: counts of Decision-grade vs checklist vs skipped MUST / quiet engines. Do not use `StatusTag` Ready for Decision-grade (FD-13 already moved the chip — do not regress).
2. Print / meeting packet: same counts above the finding list; checklist section labeled checklist.
3. Sealed JSON / ADR export: persist classification; omit nothing that would make a downstream reader think every row is decision-grade.
4. Copy-as-work-item: include classification; do not paste “decision-grade” for demoted rows.
5. Vitest on formatters + one print/receipt component. Scoped C# tests if export DTOs change.

## Acceptance criteria

- A reviewer can seal a package and see, without opening a disclosure, that most rows are checklist when that is true.
- Print/PDF cannot be cleaner than the review (CD-15 residual, now load-bearing).
- Trail at stamp remains (do not fork FD-05).

## Constraints

- Do not unseal. Do not change `typed-engine` persistence shape except to store classification already on the finding.
- Do not implement GTM **M-39** proof packets as a substitute.
