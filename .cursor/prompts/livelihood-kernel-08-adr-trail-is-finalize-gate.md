# LK-08 — ADR 0073: Transparency trail is a finalize and export gate

**Do not rewrite ADR 0050.** Feasibility classification and the trail *shape* stay there. ADR 0050 said “pipeline wiring is downstream.” This file **changes that bet**: a verdict or sealed export **without** a complete `TransparencyTrail` is a **defect**, not a degraded-but-acceptable stamp.

## Goal

Write **ADR 0073**: Working finalize and career-facing exports fail closed unless the trail has the three ADR 0050 sections populated: `Asserted[]`, `Inferred[]`, `Skipped[]` (empty arrays are legal when there is nothing in that bucket; **omitted/null trail is not**). Hard infeasible still requires a citation (R5) — 0073 does not loosen that.

Guided/demo may show a blocking reason in the UI; they must not emit a career PDF/JSON that looks sealed without a trail.

## Why

R4: “if ArchLucid is wrong, the user got it wrong” is only fair when asserted vs inferred vs skipped MUST/SHOULD questions are visible. If a sponsor PDF can omit the trail, the architect eats the career risk. Honesty copy on a collapsible is evaluator polish.

## Context

- `docs/architecture/adrs/0050-feasibility-classification-transparency-trail.md`
- `docs/architecture/adrs/template.md` + README (next number **0073** after 0071/0072)
- `TransparencyTrail` contract / `archlucid-ui/src/types/feasibility-verdict.ts`
- `export-transparency-trail-section.ts`
- Finalize path / stamp / sponsor PDF / decision-receipt JSON
- `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4

## What to build

1. New ADR 0073 with required sections. Status Proposed; LK-09 implements.
2. Decision: fail closed on finalize (API) and on stamp/print/sponsor JSON/PDF generators when trail is missing. Recovery: do not seal; show which section is missing.
3. Explicitly **not** a filter that raises insight density. Not a 40th engine.
4. README row. Do not implement the gate in this prompt unless a failing test is required for review.

## Acceptance criteria

- ADR 0050 body is not rewritten.
- A reviewer can quote 0073 to refuse a sealed Working export that lacks a trail.
- Empty asserted/inferred/skipped arrays remain legal.

## Constraints

- Do not unseal historical records; apply at new finalize/export time. Optional: exports of old seals without trail get an honesty banner rather than a silent backfill — pick in Trade-offs (prefer banner, not rewrite sealed bytes — ADR 0039).
- Do not claim CPA SOC 2.
