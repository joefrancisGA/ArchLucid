# DR-03 — Advisory engine failures are first-class on the findings band

**Do not add engines** (`HOLD_NO_COVERAGE_ENGINES.md`). **Do not fork** DR-02 — consume the withheld-band primitive if it already landed; otherwise a dedicated failures strip is OK.

## Goal

When a typed finding engine fails (cost, topology, inventory, …) and the commit classifier currently **allows** commit, Working still shows a **Needs attention** row: engine type id, category, “this engine did not produce findings — the package is incomplete for that category.” Career export (DR-01) treats unsurfaced advisory failures as floor-relevant when the engine is in the product catalog.

Security/Compliance failures already block commit — do not regress that.

## Why

Missing findings look like a clean review. An architect whose livelihood depends on the stamp cannot discover a silent cost-engine crash from a green findings list.

## Context

- `FindingEngineFailureCommitClassifier.cs`
- `RunFindingCoverageProjection`
- `GoldenCorpusHarnessEngineInventory` absent-reason list (honesty only)
- Review findings workspace

## What to build

1. Map commit-allowed engine failures onto the same withheld/failure band as DR-02 (or a sibling “Engines that did not run” strip).
2. Stamp / finalize copy: “N catalog engines failed or did not run” using PC-01 counts.
3. Tests: advisory failure + successful security engine → committable **and** visible failure row; security failure still blocks.
4. Do not auto-demote unrelated findings.

## Acceptance criteria

- Working cannot screenshot “no findings” when an advisory engine threw.
- Classifier block list for Security/Compliance unchanged.

## Constraints

- No 40th engine. TB-645. Scoped C# compile.
