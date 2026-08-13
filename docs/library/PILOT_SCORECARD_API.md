> **Scope:** Contributor-reference — What exists today for **pilot scorecard** and **ROI baselines** in product vs manual spreadsheets.

# Pilot scorecard and ROI baselines

**Last reviewed:** 2026-06-06

## Shipped API (tenant-scoped, authenticated)

| Method | Route | Role |
|--------|-------|------|
| `GET` | `/v1/pilots/outcome-summary` | Trailing 30-day rollup (`PilotScorecardResponse`) for the current tenant. Emits `periodScopeCode` / `periodScopeDescription`. |
| `POST` | `/v1/pilots/scorecard` | JSON scorecard for a custom UTC window (`periodStart` / `periodEnd` in body). |
| `GET` | `/v1/architecture/review/{runId}/roi` | Per-run directional analyst-hour estimate (`RunRoiScorecardDto`); multipliers **`Architecture:RunRoiEstimator`**. Complements tenant scorecard rollups; does not replace them. |
| `GET` | `/v1/roi/sponsor-summary` | **Cross-run sponsor ROI summary** for the current tenant ([`ExecutiveRoiSummaryService`](../../ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs)). Architect workspace: Home dashboard **`ExecutiveRoiSummarySection`**. **Headline:** `totalEstimatedUsdSavings` = disposition-aware **open + needs-evidence** USD (`headlineSavingsScopeCode`). **Per-system rows:** pre-disposition snapshot potential (`systemRowSavingsScopeCode`) — rows do **not** sum to the headline. **Top systemic issues:** dedupe by stable `FindingId` across latest runs per system. **Scope labels (T2-6):** [`RoiSponsorFacingScopeCodes`](../../ArchLucid.Contracts/Roi/RoiSponsorFacingScopeCodes.cs). **KPI semantics (TB-168):** [`EXECUTIVE_KPI_SEMANTIC_CONTRACT.json`](EXECUTIVE_KPI_SEMANTIC_CONTRACT.json). |
| `GET` | `/v1/roi/cross-tenant-portfolio-summary` | Multi-tenant portfolio (k â‰¥ 5). Uses the **same disposition-aware headline basis** per tenant (`cross-tenant-portfolio-headline`). |
| `GET` | `/v1/reports/sponsor-summary` | Reports rollup: `totalCostSavingsUsd` aliases sponsor headline; `totalRiskReductionScore` = trailing 30-day resolved findings (not pending governance). |
| `POST` | `/v1/value-report/generate` | Activity-window hours + ROI-model annualized USD (`tenant-activity-window-hours-roi-model`) — distinct from sponsor USD headline. |

Implementation aggregates from `IRunRepository` in scope (runs in period, count with committed manifest). See `PilotScorecardBuilder` and `PilotsController` in the API project.

**Run-level `/roi`:** computed on read by `RunRoiEstimator` (`ArchLucid.Application`) from the same `ArchitectureRunDetail` aggregate as `GET /v1/architecture/review/{runId}` — **no** separate scorecard table.

**Named `PilotBaselines` as a first-class persisted table** is **not** required for the above — sponsor ROI **manual baselines** (review hours, people per review) are stored on the **tenant** model for the ROI calculator (`DapperTenantRepository.UpdateBaseline*`). Use those fields for pilot "before" numbers; re-measure with the scorecard for "after" run volumes.

## Operations

- Broader pilot narrative: [`CORE_PILOT.md`](../CORE_PILOT.md)
- ROI model: [`PILOT_ROI_MODEL.md`](PILOT_ROI_MODEL.md)
- If you add durable baseline snapshots in a future version, keep them **tenant-scoped** and **append-only** in line with the audit model.
