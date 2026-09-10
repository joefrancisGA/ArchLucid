# DR-01 — Career floor fail-closed when measured count is null

**Do not fork PC-01 or PC-13.** Consume `InsightDensityMeasurementFloorPresenter` and the career-export honesty module. **Do not add a 40th engine.** **Do not change** `DeterministicInsightDensityGate` demotion predicate.

## Goal

Working finalize scorecard, stamp, and career exports **refuse** (or require an explicit incomplete confirmation that cannot be screenshot as Ready) when measured engine coverage is **null or unknown**. Today `MeetsCareerExportFloor` is true when `measured is null` — that is fail-open.

```
bool meetsFloor = measured is null || measured.Value >= CareerExportMeasurementFloorMinEngines;
```

Change the predicate so **unknown coverage does not meet the floor**. Guided sample packets stay labeled sample.

## Why

Honesty chrome names the floor. Livelihoods depend on not exporting a Decision-grade package when the system does not know what ran. Null-means-pass is a casual evaluator default.

## Context

- `ArchLucid.Decisioning/Findings/InsightDensityMeasurementFloorPresenter.cs`
- `InsightDensityMeasurementFloorPresenterTests.cs`
- PC-13 career export / print / ADR paths
- `docs/quality/INSIGHT_DENSITY_MISS_CLAUSE.md`

## What to build

1. `MeetsCareerExportFloor` is false when measured is null; `FormatCareerExportBlockedReason` returns an explicit “coverage not measured” sentence.
2. Working UI: finalize primary CTA stays disabled (or confirmation names incompleteness) when the floor fails.
3. Tests: null measured → blocked; measured ≥ harness → allowed; measured < harness → blocked (existing).
4. Do **not** invent a marketing threshold. Reuse harness count as the floor.

## Acceptance criteria

- A reviewer can quote the presenter: null coverage cannot career-export as complete.
- Guided/demo may still export samples with sample labeling.

## Constraints

- TB-645 vocabulary. Sentence case. Scoped compile when C# changes.
