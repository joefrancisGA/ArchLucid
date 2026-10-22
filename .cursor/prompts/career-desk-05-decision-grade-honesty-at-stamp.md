# CD-05 — Stamp and snapshot cannot screenshot false decision-grade

**Do not fork WA-07 or WA-08** for Ask or sponsor KPI honesty helpers. This file is the **stamp / findings snapshot**: `formatInsightDensityCurationMessage` still says ArchLucid “retained N decision-grade findings” while the next sentence admits typed-engine-protected. A board screenshot of the first clause is the career event. Do not change `DeterministicInsightDensityGate`.

## Goal

Working Finalize band, findings snapshot banner, and sealed-review lead cannot present density curation as if typed engines were demoted. The typed-engine-protected clause is **first**, not a trailing footnote. Quiet engines / skipped MUST already on the seal desk stay visible next to that sentence. Hide-generic stays opt-in.

## Why

If livelihoods depend on ArchLucid, “decision-grade” is a legal-sounding word. The miss clause (`docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md`) is explicit: scores do not demote production engine output. Copy that leads with “retained decision-grade findings” then whispers the gate is evaluator packaging.

## Context

- `archlucid-ui/src/lib/findings/findings-snapshot-insight-density.ts` — `formatInsightDensityCurationMessage`
- `archlucid-ui/src/components/usability/InsightDensityCurationBanner.tsx`
- `RunDetailReviewPackageDecisionReceiptStrip.tsx` (WA-13 — keep placement; add honesty)
- `ActorDependentFindingsQuietEnginesHint` — reuse
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md` / `HOLD_NO_COVERAGE_ENGINES.md`
- `INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE`

## What to build

1. Rewrite curation messages so the protected-gate fact is the lead clause, not a suffix. Do not use “decision-grade” as the headline count unless the honesty line is equally visible (same element, not a collapsed disclosure).
2. Stamp band: if quiet engines or skipped MUST, reuse existing hints beside the receipt — do not invent a second density scale.
3. Vitest: snapshot copy tests fail if “decision-grade” appears without `typed-engine-protected` / the shipped honesty constant in the same string. `DeterministicInsightDensityGate.cs` empty diff.

## Acceptance criteria

- A Working stamp screenshot cannot read as “density curated this package” without the gate.
- Generic typed-engine rows remain unless hide-generic is on.
- Guided may keep a shorter hint; do not strip honesty.

## Constraints

- **Forbidden:** applying `DemotionThreshold` to typed engines; adding a 40th coverage engine.
- Do not collapse review tabs.
- Do not send users to guided intake to “fix” quiet engines (RS-01).
