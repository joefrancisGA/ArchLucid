# IS-04 — ADR 0070: insight density is a control, not an advisory overlay

**Do not re-run ID-01–11.** Measurement and distribution reports stay. **Do not fork WD-03** (honesty-only; empty diff on the gate). This file **authorizes** changing production treatment/classification for typed engines. **Do not apply the gate in this prompt** — that is IS-05.

## Goal

Write **ADR 0070**: the computed insight-density score **controls** `FindingClassification` (and the existing demotion predicate) for typed-engine findings as well as agent findings. R5 stands: false-hard is worse than noisy coverage — category-protected categories and findings with a concrete evidence citation **or** architecture-specific anchor stay Decision-grade / Promote. Typed-engine rows are **not deleted** from the package when they fail the gate; they become `ChecklistCoverage`. Update `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md` **after** IS-05, or in this prompt mark the forbid-list as superseded by 0070 without claiming the gate already moved.

## Why

Livelihood failure: an architect stamps a record that looks Decision-grade while `DeterministicInsightDensityGate` discarded the score for every non-agent engine (`typed-engine-protected` short-circuit). Honesty lines do not earn R4’s liability stance. The assessment still ranks Insight Density as the largest weighted deficiency because the analytical floor never became a control.

A filter still cannot raise **miss**. This ADR does not claim it does. It changes **dismiss / package**: the sealed record must not screenshot generic typed-engine output as Decision-grade.

## Context

- `ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs` (do not edit here)
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md` — current “Forbidden without owner decision”
- `docs/quality/insight-density-engine-distribution.md` — counterfactual `WouldDemoteIfUnprotectedCount`
- `docs/architecture/INSIGHT_DENSITY_COMPOSER_PROMPTS.md` ID-02 (advisory)
- `docs/ARCHLUCID_FOUNDATIONAL_DESIGN_DEBATE.md` R4 / R5
- `docs/architecture/adrs/template.md`

## What to build

1. `docs/architecture/adrs/0070-insight-density-controls-typed-engines.md` with required sections. Status Proposed.
2. Decision points:
   - Same demotion predicate already used for agent findings: `score < DemotionThreshold && !hasArchitectureAnchor && !hasConcreteEvidence`, then `category-protected` may undo demotion.
   - Typed engines that fail the predicate: `Treatment = DemoteToChecklist`, `Classification = ChecklistCoverage`. They remain in the snapshot.
   - Penalty reason `typed-engine-protected` **stops meaning Promote**. Replace with a telemetry reason such as `typed-engine-scored` if you still need to distinguish engine vs agent in reports.
   - Do not apply LLM judge demotion as a substitute for this gate.
   - Do not add a coverage engine to “raise density.”
3. README row. Pointer from miss-clause: “superseded for production gate by ADR 0070; implementation IS-05.”
4. Do not change golden-corpus engines in this prompt.

## Acceptance criteria

- Owner-decision forbid-list is no longer the reason the gate is a no-op — 0070 is the new contract.
- R5 false-hard rule is written as a constraint, not a slogan.
- ID-02 distribution report remains valid as a measurement; 0070 says it must stop being *only* counterfactual after IS-05.

## Constraints

- Do not rewrite ADR 0067/0068.
- Do not implement G-REAL-06.
- Do not check in fake frontier transcripts.
