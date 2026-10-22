# SD-03 — Golden harness covers remaining built-in engines (measurement)

**Do not fork ID-01–10.** **Do not add a 40th coverage-shaped engine.** **Do not capture live frontier transcripts.** This file is **career-bounding measurement**: `GoldenCorpusHarness.CreateEngines()` still omits most ids in `BuiltInFindingEngineTypeCatalog`. A livelihood tool cannot have an unmeasured majority of engines when people stake a job on the stamp.

## Goal

Every `EngineType` in `BuiltInFindingEngineTypeCatalog.EngineTypeIds` is either (a) registered in `CreateEngines()` and exercised on existing golden graphs, or (b) listed in a generated **absent-from-harness** inventory with a one-line reason (needs cloud-inventory graph, effectful, cross-run diff, etc.). Reasons are not a forever waiver — they are an honest denominator.

Prefer registering engines that can run on **existing** case-01..case-N graphs without new fixtures. Add at most a small bounded fixture set for inventory/reconciliation engines if they otherwise emit nothing — do not invent production architectures.

## Why

Insight-density deficiency is the headline weighted gap. Honesty copy cannot substitute for “we never ran 23 engines on the corpus that is supposed to bound false confidence.” R4’s liability stance needs a measured floor, not a 16-engine slice presented as the product.

## Context

- `ArchLucid.Decisioning/Plugins/BuiltInFindingEngineTypeCatalog.cs`
- `ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusHarness.cs` `CreateEngines()`
- `GoldenCorpusHarnessEngineTests.cs`
- `docs/quality/insight-density-engine-distribution.md` (regenerate after harness change)
- `docs/quality/HOLD_NO_COVERAGE_ENGINES.md` — still holds; this prompt registers **existing** engines
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md` corpus-limit paragraph (update counts)

## What to build

1. Diff catalog ids vs `CreateEngines()` types. Produce an inventory module or markdown table: registered / absent + reason.
2. Register additional **existing** `IFindingEngine` implementations that compile against current golden graphs (mirror WK-06 style: add engines, don’t add a new coverage product).
3. For engines that cannot emit on current graphs, do not stub fake findings. Keep them on the absent list with a reason. Optional: one bounded inventory fixture **only** if an existing test graph already has the required shape.
4. Regeneration of the distribution markdown; header must stay aligned with SD-01 (production demotion, not counterfactual).
5. Scoped Decisioning tests named above. `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Decisioning/ArchLucid.Decisioning.csproj'` (or Core if that is what the harness project references — use the project that compiles the harness). Keep `Category!=Slow` unless an existing Slow trait already covers this harness.

## Acceptance criteria

- A CI-visible inventory lists every catalog `EngineType` as registered or explicitly absent-with-reason.
- `CreateEngines()` length is documented in the miss clause and matches the inventory’s registered count.
- No new engine type. No fake frontier JSON. No `ConfigureAwait(false)` in tests.

## Constraints

- Do not implement G-REAL-06 proof runs.
- Do not change demotion threshold to “look denser.”
- Do not delete engines from the product to shrink the denominator.
