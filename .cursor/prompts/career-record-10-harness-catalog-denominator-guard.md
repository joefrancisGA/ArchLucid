# CR-10 — Harness vs catalog denominator is CI-pinned

**Do not fork SD-03** (register remaining engines / absent-with-reason inventory). **Do not add a 40th coverage-shaped engine.** **Do not capture live frontier transcripts.** This file is leftover **CI guard**: `BuiltInFindingEngineTypeCatalog.EngineTypeIds` vs `GoldenCorpusHarness.CreateEngines()` length can drift without a failing test.

## Goal

A Decisioning test (or extend `GoldenCorpusHarnessEngineTests`) fails if an engine is in the catalog but neither registered in `CreateEngines()` nor listed in the SD-03 absent-with-reason inventory. Miss-clause / distribution header counts must match that inventory. Reasons are not a forever waiver.

## Why

SD-03 can add engines in one PR while the next engine registration forgets the harness. A livelihood tool cannot have an unmeasured majority of engines presented as the career corpus. The denominator must be mechanically honest.

## Context

- `ArchLucid.Decisioning/Plugins/BuiltInFindingEngineTypeCatalog.cs` (~39 ids)
- `ArchLucid.Decisioning.Tests/GoldenCorpus/GoldenCorpusHarness.cs` `CreateEngines()` (currently a minority slice)
- `GoldenCorpusHarnessEngineTests.cs` / `BuiltInFindingEngineTypeCatalogTests.cs`
- SD-03 inventory module or markdown table — if SD-03 has not landed, create a minimal absent-reason table **and** the guard; do not stub fake findings
- `docs/quality/HOLD_NO_COVERAGE_ENGINES.md` — still holds
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md` corpus-limit paragraph

## What to build

1. If SD-03 inventory exists, pin it in a test: catalog = registered ∪ absent. If not, add `GoldenCorpusHarnessAbsentEngineInventory` (name as needed) with one-line reasons (effectful, needs cloud inventory, cross-run diff, etc.).
2. Test uses `Category!=Slow` unless the existing harness test is already Slow — then add a **fast** count-only test.
3. Update miss-clause counts to match. Do not change demotion threshold.
4. `.\scripts\ci\agent-compile-check.ps1` on the Decisioning test project.

## Acceptance criteria

- Adding a catalog engine without harness or absent-reason fails CI.
- No new engine type. No fake frontier JSON. No `ConfigureAwait(false)` in tests.

## Constraints

- Do not implement G-REAL-06 proof runs.
- Do not delete engines from the product to shrink the denominator.
- Do not edit `DeterministicInsightDensityGate.cs`.
