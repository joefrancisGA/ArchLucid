# WA-08 — Sponsor / ROI packet cannot look cleaner than the review

**Do not fork LD-03** for governance queue / inspect / generic package export honesty. This file is **sponsor dashboard KPIs and ROI / value-report exports** that can still screenshot as all-clear when the linked package has quiet engines, skipped MUST, or a soft/hard infeasible verdict.

## Goal

Working-mode sponsor dashboard tiles, ROI summary, and sponsor export serializers include the existing honesty line (reuse trail / quiet-engine / infeasible receipt copy) when those conditions hold. Do not invent a second density scale. Do not merge the six reporting routes (IA-004). Do not imply CPA attestation.

## Why

Architects paste sponsor PDFs into steering decks. LD-03 closed findings-queue/packet lists. KPI heroes can still say healthy/complete while the review is infeasible or uncovered. Casual products optimize the dashboard screenshot. Livelihood tools refuse a lying tile.

## Context

- `archlucid-ui/src/app/(operator)/architecture/sponsor-dashboard/_sections/`
- `archlucid-ui/src/lib/sponsor/sponsor-roi-kpi-display.ts`
- Value report / ROI export serializers (grep sponsor export)
- `DecisionReceiptExportButton` / infeasible empty compact — reuse, do not fork
- `docs/library/ARCHITECTURE_INVARIANTS_ONE_PAGE.md` labeling
- `PUBLIC_CLAIM_BOUNDARY_GUIDE.md`

## What to build

1. When the selected/rolled-up reviews include quiet engines, skipped MUST, or infeasible, the sponsor hero/KPI strip does not read as all-clear. One honesty line; link to the package.
2. Exported sponsor Markdown/PDF includes that line. Do not add a new KPI that claims “coverage 100%” from typed-engine counts.
3. Sample/demo sponsor tiles stay labeled demonstration (existing claim discipline).
4. Vitest: fixture with quiet engines or infeasible cannot render the healthy-only hero copy; density gate file untouched.

## Acceptance criteria

- A Working sponsor screenshot of an uncovered or infeasible package cannot pass as a clean bill of health.
- Reporting routes stay separate; one sentence of honesty, not a seventh dashboard.
- No SOC 2 CPA implication.

## Constraints

- Do not implement GTM proof-packet cohorts (**M-39** human apply stays owner).
- Do not change `typed-engine-protected`.
- Do not collapse review tabs.
