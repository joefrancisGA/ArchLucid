# SD-01 — Density contract docs match the landed gate

**Do not fork IS-05** (gate method). **Do not fork LS-03** (customer UI strings + Vitest inventory). **Do not fork ID-11.** This file is **library, quality, and generated measurement docs** that still teach `typed-engine-protected` → always Promote after the gate already scores typed engines.

## Goal

Every non-UI contract that describes insight-density production behavior agrees with `DeterministicInsightDensityGate` and `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md`: typed-engine rows stay on the package; **classification** follows the demotion predicate (Decision-grade vs checklist); `typed-engine-scored` is origin telemetry, not a Promote short-circuit.

## Why

An architect whose livelihood depends on the stamp will read the engine reference, configuration table, and distribution report when a sponsor asks “why is this Decision-grade?” Those pages still recite the old miss clause. That is a career-defense failure even when the method is honest.

## Context

- `ArchLucid.Core/Findings/DeterministicInsightDensityGate.cs` — **read only** (`typed-engine-scored`, demote predicate)
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md` — already names production demotion; align others to it
- `docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md` (still “always promote”)
- `docs/library/CONFIGURATION_REFERENCE.md` (`DemotionThreshold` row still “advisory for engines”)
- `docs/library/FINDING_STREAM_PRODUCT_OF_RECORD.md` (still points at ID-11 / typed-engine-protected)
- `docs/library/AGENT_EVAL_CORPUS.md` (`WouldDemoteIfUnprotectedCount` still called counterfactual)
- `docs/quality/insight-density-engine-distribution.md` (header still “not a control”; engine counts may be stale vs harness)

## What to build

1. Inventory the files above (and grep `docs/library` + `docs/quality` for `typed-engine-protected` / “not a control” / “always promote”). Do not scan `docs/archive/`.
2. Rewrite production-behavior sentences to match the miss clause. Keep measurement-vs-miss distinction: filters still cannot raise miss.
3. Regeneration: if the distribution markdown is generated, re-run the existing generator after copy changes so the header cannot drift. Update engine-count sentences to the current `CreateEngines()` length.
4. Guard test or doc-assert (prefer an existing Decisioning markdown test) that those paths no longer contain “always promote” / “score is advisory for engines.”
5. Do not change UI copy here (LS-03). Do not change the gate.

## Acceptance criteria

- Grep of `docs/library` + `docs/quality` (excluding archive) for `Typed engine findings always promote` is empty.
- `CONFIGURATION_REFERENCE.md` `DemotionThreshold` row describes typed-engine demotion the same way as the miss clause.
- Distribution report header does not call `WouldDemoteIfUnprotectedCount` a counterfactual.
- No 40th engine. No fake frontier transcripts.

## Constraints

- Do not edit `DeterministicInsightDensityGate.cs`.
- Do not implement G-REAL-06.
- Do not claim CPA SOC 2 or third-party pen test.
