# FC-32 — Sponsor Summary Feasibility Honesty

**Wave:** false-confidence-career (**FC**). **Do not fork** owners listed below unless this file names a leftover only.

## Goal

Sponsor summary includes feasibility class + trail excerpt

## Why

Career artifacts (stamp, finalize, sponsor PDF, print, ADR export, decision receipt, audit CSV) are what architects take into ARBs and procurement. False confidence is when the artifact looks **more certain** than the desk gate allows — omitted trail, implied demotion, Ready tags on decision-grade, simulator packaged as Real, or exports cleaner than the review. R4 liability requires asserted/inferred/skipped visibility; ADR 0070/0073 require classification and trail gates.

## Context

- `docs/ARCHITECTURE_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R5
- ADR 0050 (trail shape), 0070 (density control), 0073 (trail gate)
- `archlucid-ui/src/lib/career-export-coverage-honesty.ts`
- `archlucid-ui/src/lib/career-export-finding-inventory.ts`
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md`
- Owners (do not re-implement): sponsor-review-coverage-honesty

## What to build

1. Implement the goal on **Working** career paths first; Guided may keep shorter copy but **must not** strip honesty on finalize/export.
2. Reuse shared helpers from FC-02/FC-03 when they exist; if not yet landed, add a local helper and a TODO to consolidate in FC-02.
3. Fail closed: missing honesty → disable export CTA or render explicit blocked reason (TB-2005 on forms; inline block on exports).
4. Add focused Vitest and/or C# tests proving the artifact **cannot** render the overclaim. Register new UI paths in `career-export-mounted-ui-paths` (FC-04).
5. Do **not** change `DeterministicInsightDensityGate` demotion predicate or add a 40th engine.

## Acceptance criteria

- A screenshot of the affected artifact cannot read as complete/Ready/decision-grade without the matching honesty clause visible in the same viewport or export header.
- Guided/demo/sample exports remain labeled; they must not bypass Working fail-closed rules when `isProductionEvalChrome()` is false on a live tenant export.
- Residual risk called out in PR summary if any grandfather path remains.

## Constraints

- **Forbidden:** `DemotionThreshold` on typed engines; unsealing sealed records; desktop review tab **More** menu; GTM cohorts M-90/M-44/M-91/M-92; reopen TB-135/TB-136.
- TB-645 vocabulary. Sentence case. Carbon density. No ghost/link Button.
- Working-tree safety: `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<file>'` before editing tracked files.
- Scoped compile only when C# changes. No full-solution builds unless prompt requires.
