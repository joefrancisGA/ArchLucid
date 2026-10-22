# V13-03 — Four leftover No-anchor cells: cite product-shaped inventory

**One prompt per chat.** Branch: `cursor/v13-03-no-anchor-golden-citations-97a4`. Model: **Composer 2.5 slow**.

---

## Goal

Drive the v13 distribution report’s leftover **`No-anchor` cells** from **4 → 0** on these engines (1 cell each): `requirement-expectation`, `security-baseline-completeness`, `security-baseline-expectation`, `topology-coverage`. Do **not** invent ARM resource IDs or AWS ARNs.

## Why this is third (token ROI)

v13 Density is **82** (weight 13, **234** deficiency) and Correctness **85**. The four leftover No-anchor cells are the **smallest remaining golden-fixture citation gap** after V12-05 (ObservedFact merge) and V12 leftover 65-band work (now **0** Would-demote). Expected: **Density 82→83**, **Correctness 86→87** after 01, **(A) → ~84.74%**. See `docs/architecture/V13_QUALITY_ROI_COMPOSER_PROMPTS.md`.

## Context

- Assessment: `docs/assessments/LATEST_GPT55.md` (v13) §1, §4, §8 (leftover No-anchor). Distribution: `docs/quality/insight-density-engine-distribution.md`.
- Penalty: `no-architecture-anchor` in `DeterministicInsightDensityGate` when a finding has neither product-shaped inventory nor `HasArchitectureSpecificAnchor`.
- Pattern to **reuse** (do not invent a fifth): `CollectWithProductShapedGraphNodeFallback` / `TryCollectProductShapedGraphNodeCitation` — product-shaped `GraphNode` (`Microsoft.Web/sites`, `AWS::Lambda::Function`, `google_compute_instance`) counts as an architecture-specific citation.
- Re-record: `ARCHLUCID_RECORD_INSIGHT_DENSITY_DISTRIBUTION=1` on `InsightDensityEngineDistributionReportTests`.
- **Do not** add EngineType values or DX-77.

## What to build

1. Reproduce: run `InsightDensityEngineDistributionReportTests` (no record). Confirm 4 leftover No-anchor cells on the four engines above.
2. For **each** of the four engines, find the golden fixture / case that emits the No-anchor cell. Attach a **product-shaped GraphNode** (or existing `Collect*` helper) so `HasArchitectureSpecificAnchor` or the product-shaped fallback is true. Prefer **existing** inventory in that fixture.
3. If the engine already calls `Collect*` but skips product-shaped nodes, add the same fallback V12 used for `data-flow-completeness` / `topology-coverage` leftovers — **do not** hard-code a fake ARM id.
4. Re-record the distribution report. Assert leftover No-anchor **0** on those four engines (or the report’s leftover total is 0 if that is the current contract).
5. Run the golden / density tests that this change touches.

## Acceptance

- Distribution report: **0 leftover No-anchor** on the four named engines.
- No new ARM/ARN strings invented for the sake of the report.
- Density / golden tests green for the touched engines.
- Commit + PR. Do not push `master`.

## Constraints

- **Do not** implement V13-01 (typecheck) or V13-04 (ci.yml) in this PR.
- **Do not** add engines, three-way packs, or a 29th EngineType.
- Own file per class; LINQ; concrete types; blank line before if/foreach; null checks; no `ConfigureAwait(false)` in tests.
- No `git add -A`.
