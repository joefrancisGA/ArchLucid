# CR-01 — Density distribution tests match the landed gate

**Do not fork IS-05** (gate method). **Do not fork SD-01** (library / quality / generated *prose*). **Do not fork LS-03** (customer UI strings). This file is the leftover **test and generator pin**: Decisioning markdown tests and the generated distribution header still certify `typed-engine-protected` → always Promote after the gate already scores typed engines.

## Goal

`docs/quality/insight-density-engine-distribution.md` and the tests that snapshot its header agree with `DeterministicInsightDensityGate` and `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md`: typed-engine rows stay on the package; **classification** follows the demotion predicate; `WouldDemoteIfUnprotectedCount` is not described as a counterfactual once production demotion exists.

## Why

An architect whose livelihood depends on the stamp will be asked “why is this Decision-grade?” CI still greenlights a report that says the score is not a control. That is a career-defense failure even when the method is honest.

## Context

- `ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs` — **read only** (`typed-engine-scored`, demote predicate)
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md` — production demotion paragraph
- `docs/quality/insight-density-engine-distribution.md` — header still `typed-engine-protected` / “not a control”
- `ArchLucid.Decisioning.Tests/Findings/InsightDensityEngineDistributionMarkdownTests.cs`
- `ArchLucid.Decisioning.Tests/GoldenCorpus/InsightDensityEngineDistributionReportTests.cs`

## What to build

1. Read the gate and miss clause. Inventory the two test files and the generated markdown header for `typed-engine-protected`, “not a control”, “always promote”, and “counterfactual.”
2. If SD-01 has not rewritten the markdown yet, rewrite the **header** to match the miss clause (do not restyle the engine table). If SD-01 already did, only fix tests that still assert the old sentences.
3. Regeneration: re-run the existing generator so the header cannot drift. Update engine-count sentences to the current `CreateEngines()` length (CR-10 owns the CI denominator guard).
4. Flip the markdown tests to assert production-demotion language. Keep measurement-vs-miss distinction: filters still cannot raise miss.

## Acceptance criteria

- Those two test files no longer require the substring `typed-engine-protected` as a Promote short-circuit.
- Distribution header does not call `WouldDemoteIfUnprotectedCount` a counterfactual.
- Gate method unchanged. No 40th engine. No fake frontier transcripts.

## Constraints

- Do not edit `DeterministicInsightDensityGate.cs`.
- Do not rescore `docs/assessments/LATEST_GPT55.md`.
- Do not implement G-REAL-06.
