# PC-01 — Stamp names the measurement floor (catalog vs run vs harness)

**Do not fork LK-14** (stamp denominator — extend it). **Do not fork CR-10** (harness/catalog CI guard). **Do not add a 40th engine.** **Do not change** `DeterministicInsightDensityGate` demotion predicate.

## Goal

Working finalize scorecard, sealed stamp, and career JSON export show a **measurement floor** block with three honest counts:

1. **Catalog** — built-in engines in `BuiltInFindingEngineTypeCatalog` (product ceiling).
2. **Measured this run** — distinct engine origins that produced at least one finding on this package snapshot.
3. **Harness regression slice** — engines in `GoldenCorpusHarness.CreateEngines()` (what CI proves).

Copy must say plainly when (2) ≪ (1): the sealed record is **honest but analytically incomplete**, not “all clear.” Career exports (**PC-13** extends) **refuse** when measured count is below a configured floor **and** the run claims Decision-grade readiness — use existing config pattern, do not invent marketing thresholds.

## Why

Honesty chrome (quiet engines, skipped MUST, trail) prevents a **false screenshot**. It does not prevent a **false yes**: a livelihood depends on knowing the analytical floor was thin. Overlays cannot raise insight density; the stamp must name the gap.

## Context

- `ArchLucid.Core/Findings/BuiltInFindingEngineTypeCatalog.cs`
- `ArchLucid.Decisioning/GoldenCorpus/GoldenCorpusHarness.cs` `CreateEngines`
- `DeterministicInsightDensityGate.cs` (read only)
- `docs/quality/insight-density-engine-distribution.md`
- Stamp / finalize scorecard UI (`RunDetailOverview*`, finalize readiness)
- LK-14 / SD-03 leftovers

## What to build

1. Server: shared helper (one class per file) returning the three counts + human sentence for a `runId`.
2. UI: measurement floor on finalize scorecard **above** the primary CTA; same block on stamp band.
3. Export formatters: include the sentence in JSON metadata; PDF/print one line minimum.
4. Vitest + Application unit tests for null run, zero findings, partial engine coverage.
5. Do **not** demote findings because of floor — presentation and export gate only.

## Acceptance criteria

- A skeptical architect sees “23 of 39 catalog engines produced findings; harness proves 16” before seal.
- Guided/demo may soften copy but must not claim full catalog measurement without evidence.
- No new engine types.

## Constraints

- TB-645 vocabulary. Sentence case. No ghost `Button`.
- Scoped compile when C# changes.
