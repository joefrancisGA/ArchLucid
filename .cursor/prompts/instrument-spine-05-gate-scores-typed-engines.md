# IS-05 — Gate: typed engines follow the density predicate

**Depends on IS-04.** **Do not fork WD-03** (that prompt required an empty diff on this file). **Do not re-run ID-02.** This is the load-bearing code change.

## Goal

`DeterministicInsightDensityGate.Score` no longer returns early with `Treatment = Promote` / `Classification = DecisionGradeFinding` solely because `!IsAgentArchitectureFinding`. Typed-engine findings use the **same** score, demotion predicate, and category-protect path as agent findings. Keep findings on the snapshot. Update Core tests that currently assert “never demotes typed engine outputs.” Update miss-clause and distribution markdown so `WouldDemoteIfUnprotectedCount` is production behavior, not a counterfactual.

## Why

ADR 0070 is paper until this method changes. Honesty copy cannot earn R4. An architect whose livelihood depends on the stamp needs the grade to be real.

## Context

- `ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs` (lines 85–96 short-circuit)
- `ArchLucid.Core.Tests/Findings/DeterministicInsightDensityGateTests.cs` (`Score_never_demotes_typed_finding_engine_outputs`)
- `InsightDensityGateOptions.DemotionThreshold`
- `InsightDensityAgentCategoryRules.IsDemotionEligibleCategory`
- `ArchLucid.Decisioning/Findings/InsightDensityEngineDistribution*.cs`
- `archlucid-ui` honesty strings that say typed-engine scores “do not hide findings” / “stay on the package regardless of score” — those become “checklist when the gate demotes”
- `FindingInsightDensityLlmJudgmentApplicator` — still must not demote typed engines *via judge*; the **deterministic** gate may

## What to build

1. Remove the early return. Always compute `score` and `penaltyReasons`. If `!IsAgentArchitectureFinding`, add `typed-engine-scored` (or keep `typed-engine-protected` **only** as a label that origin was an engine — it must not force Promote).
2. Apply existing `demote` predicate + category-protect to all candidates.
3. Replace `Score_never_demotes_typed_finding_engine_outputs` with tests:
   - Generic typed finding, no anchor, no evidence → DemoteToChecklist + ChecklistCoverage.
   - Typed finding with architecture anchor or concrete evidence citation → Promote + DecisionGradeFinding even if phrasing is generic.
   - Category-protected typed finding behaves like the agent test.
4. Update `INSIGHT_DENSITY_MISS_CLAUSE.md`: production demotion for typed engines is in; miss still requires new information.
5. Update distribution report copy: no longer “not a control.”
6. Scoped `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Core/ArchLucid.Core.csproj'` plus Core + Decisioning tests named above. Grep UI copy for “regardless of insight-density score” and fix strings in this PR **or** leave a failing-string list for IS-06/07 — prefer fix the gate-facing one-liners here so the product does not lie for a day.

## Acceptance criteria

- A generic “Enable MFA for all user accounts” typed finding is ChecklistCoverage.
- A cited, architecture-anchored typed finding stays Decision-grade.
- Golden-corpus / distribution tests that asserted the short-circuit are updated, not deleted without replacement.
- No 40th engine. No judge-forced demotion of engines.

## Constraints

- R5: when uncertain, do not classify HARD; analog here: when evidence or anchor exists, do not demote.
- Tenant isolation unchanged.
- No `ConfigureAwait(false)` in tests.
