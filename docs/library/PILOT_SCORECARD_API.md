> **Scope:** What exists today for **pilot scorecard** and **ROI baselines** in product vs manual spreadsheets.

# Pilot scorecard and ROI baselines

**Last reviewed:** 2026-04-27

## Shipped API (tenant-scoped, authenticated)

| Method | Route | Role |
|--------|-------|------|
| `GET` | `/v1/pilots/outcome-summary` | Trailing 30-day rollup (`PilotScorecardResponse`) for the current tenant. |
| `POST` | `/v1/pilots/scorecard` | JSON scorecard for a custom UTC window (`periodStart` / `periodEnd` in body). |
| `GET` | `/v1/architecture/run/{runId}/roi` | Per-run directional analyst-hour estimate (`RunRoiScorecardDto`); multipliers **`Architecture:RunRoiEstimator`**. Complements tenant scorecard rollups; does not replace them. |
| `GET` | `/v1/roi/executive-summary` | **Cross-run executive ROI summary** for the current tenant ([`ExecutiveRoiSummaryService`](../../ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs)). Operator UI: Home dashboard **`ExecutiveRoiSummarySection`**. **V1 aggregation ([V1_SCOPE.md](V1_SCOPE.md) §2.8):** (1) select the **latest committed run per system** (case-insensitive system name; cap 200 systems loaded per request); (2) **sum** `EstimatedUsdSavings` from each included run’s findings snapshot — no per-finding dedup on savings; (3) flatten non-muted findings from those runs, **deduplicate by stable `FindingId`** (case-insensitive) so overlapping CI reruns count once, then group by **(Category, Severity)** for **`TopSystemicIssues`** (top 5 by count). Findings with empty `FindingId` are never deduplicated against each other. |

Implementation aggregates from `IRunRepository` in scope (runs in period, count with committed manifest). See `PilotScorecardBuilder` and `PilotsController` in the API project.

**Run-level `/roi`:** computed on read by `RunRoiEstimator` (`ArchLucid.Application`) from the same `ArchitectureRunDetail` aggregate as `GET /v1/architecture/run/{runId}` — **no** separate scorecard table.

**Named `PilotBaselines` as a first-class persisted table** is **not** required for the above — executive ROI **manual baselines** (review hours, people per review) are stored on the **tenant** model for the ROI calculator (`DapperTenantRepository.UpdateBaseline*`). Use those fields for pilot “before” numbers; re-measure with the scorecard for “after” run volumes.

## Operations

- Broader pilot narrative: [`CORE_PILOT.md`](../CORE_PILOT.md)
- ROI model: [`PILOT_ROI_MODEL.md`](PILOT_ROI_MODEL.md)
- If you add durable baseline snapshots in a future version, keep them **tenant-scoped** and **append-only** in line with the audit model.
