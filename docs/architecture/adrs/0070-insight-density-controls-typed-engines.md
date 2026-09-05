> **Scope:** ADR 0070 — insight-density score controls classification for typed-engine findings.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0070: Insight density controls typed-engine classification

- **Status:** Accepted
- **Date:** 2026-09-05
- **Implemented:** 2026-09-05 (IS-05)

## Context

`DeterministicInsightDensityGate` computes a score for every finding. Until this decision, non-agent (`typed-engine`) findings short-circuited with `typed-engine-protected` → always `Promote` / `DecisionGradeFinding`, discarding the score for presentation and sealed-record classification. Honesty copy in the SPA (WD-03, CD-12) labeled the behavior advisory; exports and stamps could still screenshot generic checklist text as decision-grade.

Insight-density **measurement** (ID-01–10) remains advisory for distribution reports. This ADR changes **production gate behavior** for classification and demotion — not miss detection (filters cannot raise miss; new engines/parsers still required).

R5 stands: false-hard is worse than noisy coverage — category-protected categories and findings with concrete evidence citation **or** architecture-specific anchor stay Decision-grade.

**Related:** ADR 0050 (feasibility / R4–R5), `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md` (superseded for gate), IS-05 implementation.

## Decision

1. The computed insight-density score **controls** `FindingClassification` and the demotion predicate for **typed-engine** findings the same way it does for agent findings.
2. **Demotion predicate (unchanged shape):** `score < DemotionThreshold && !hasArchitectureAnchor && !hasConcreteEvidence`, then `category-protected` may undo demotion via `InsightDensityAgentCategoryRules.IsDemotionEligibleCategory`.
3. **Typed engines that fail the predicate:** `Treatment = DemoteToChecklist`, `Classification = ChecklistCoverage`. Rows **remain on the package snapshot** — not deleted.
4. **Penalty telemetry:** `typed-engine-protected` no longer means Promote. Use `typed-engine-scored` to distinguish engine origin in reports when needed.
5. **LLM judge** demotion does not substitute for this deterministic gate on typed engines.
6. **No 40th coverage engine** to raise density scores.

## Trade-offs

**Gains:** Sealed record and export artifacts can show real decision-grade vs checklist counts; architects defending livelihood decisions see grades that match analytical floor; counterfactual `WouldDemoteIfUnprotectedCount` becomes production behavior.

**Sacrifices:** Packages with many generic typed-engine rows will show more checklist coverage — potentially alarming sponsors until triage habits adjust; golden-corpus and distribution tests must be updated; UI must show two bands (IS-07) so checklist is not confused with "no findings."

**Rejected:** Deleting typed-engine rows that fail the gate (violates package completeness); applying LLM judge demotion instead of deterministic gate (non-reproducible); leaving gate advisory-only (failed R4 livelihood test).

## Constraints

- R5 false-hard rule: when concrete evidence or architecture anchor exists, do not demote.
- Tenant isolation unchanged (ADR 0037).
- Sealed-manifest immutability unchanged — demotion applies at gate time before seal; sealed records are not rewritten.
- Do not implement G-REAL-06 or fake frontier transcripts.
- Judge applicator must not demote typed engines via LLM path; deterministic gate may.

## Expected impact

**System:** `DeterministicInsightDensityGate.Score` removes early return for `!IsAgentArchitectureFinding`. Stamp, print, JSON export, and findings desk read `FindingClassification` (IS-06/07).

**Security:** No authz change; classification is already on `ArchitectureFinding` wire.

**Operations:** Core unit tests replace `Score_never_demotes_typed_finding_engine_outputs` with demote/promote matrix tests. Distribution markdown updated from counterfactual to production.

**Cost:** No infra cost; possible support questions when checklist band count rises on legacy packages re-run through gate.

**Teams:** Buyer-facing copy drops "regardless of insight-density score" for typed engines; procurement sees honest checklist counts on stamps.

## Consequences

- **Positive:** Liability stance (R4) matches sealed artifact; density assessment deficiency closes for typed engines.
- **Negative:** Historical packages re-scored may shift band mix; sponsor PDFs need IS-06 formatter pass.
- **Follow-ups:** IS-06/07 UI and exports; `INSIGHT_DENSITY_MISS_CLAUSE.md` production paragraph.

## Implementation (2026-09-05)

- `ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs` — `typed-engine-scored` telemetry; demotion predicate applies to typed-engine findings.
- `ArchLucid.Core.Tests/Findings/DeterministicInsightDensityGateTests.cs` — demote/promote matrix for typed engines.
- `ArchLucid.Decisioning/Findings/InsightDensityEngineDistributionMarkdown.cs` — production demotion header (ADR 0070).
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md` — production gate paragraph.
