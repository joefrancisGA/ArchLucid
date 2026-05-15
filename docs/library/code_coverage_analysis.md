> **Scope:** Maintainer-facing code coverage analysis derived from merged Cobertura — interprets trends vs CI gates and names investment priorities; not a substitute for the authoritative **`coverage-merged-cobertura`** artifact from **`dotnet-full-regression`** or class-level hotspot tables in **`docs/COVERAGE_GAP_ANALYSIS.md`**.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.

# Code coverage analysis

## Objective

Summarize **current merged line and branch coverage** for product **`ArchLucid.*`** assemblies, compare against **merge-blocking CI floors**, and highlight **where additional tests yield the most risk reduction**.

## Data source and caveats

| Item | Value |
|------|--------|
| **Cobertura file** | **`coverage-report-final/Cobertura.xml`** (local merged Cobertura; same **72.95%** merged line snapshot as **[`CODE_COVERAGE.md`](CODE_COVERAGE.md)** § strict profile **2026-04-20**) |
| **As-of** | **2026-04-20** (Cobertura timestamp Unix **1776678710**) |
| **Product filter** | Gap-analysis doc uses **`scripts/ci/coverage_gap_analysis.py`** (subset of product packages; omits **`ArchLucid.Worker`** from tables). CI gates use **`scripts/ci/coverage_cobertura.product_packages_for_gate`**. |

**Important:** `coverage-report-final/Cobertura.xml` is a **local** historical merge (source paths were normalized in **`coverage_gap_analysis.py`** for this repo clone). **`docs/COVERAGE_GAP_ANALYSIS.md`** lists every product **package** row from that file — including split **`ArchLucid.Persistence.*`** projects when the merge contains them. Some SQL-backed tests did not match a CI-equivalent session in **`CODE_COVERAGE.md`**; treat workflow artifact **`coverage-merged-cobertura`** as authoritative for gates.

**Exclusions:** See **`coverage.runsettings`** and **`coverage-exclusions.md`** (for example generated OpenAPI XML comments under **`obj/`**, **`ArchLucid.Worker/Program.cs`**). **`ArchLucid.Worker`** may still appear with **low line-rate** for remaining coverable lines in this snapshot.

## Summary vs CI gates

CI (**`.github/workflows/ci.yml`**, job **`.NET: full regression (SQL)`**) enforces on merged Cobertura:

| Metric | This snapshot | CI minimum | Notes |
|--------|---------------:|-----------:|-------|
| **Merged line** | **72.95%** | **≥ 95%** | Strict gate + ratchet (**`.coverage-floor`** baseline **97.00%**, pass when merged ≥ baseline − 2 pp per **`assert_coverage_floor_ratchet.py`**) |
| **Merged branch** | **58.71%** | **≥ 63%** | Branch uplift typically trails line-focused tests |
| **Per-package line** | Several packages **below 63%** (see gap doc) | **≥ 63%** each gated product package with coverable lines | **`scripts/ci/assert_merged_line_coverage_min.py`** |

**Interpretation:** For this Cobertura merge, **all strict thresholds would fail** if asserted against CI arguments — consistent with a **local** slice where some SQL-backed tests did not pass (**`CODE_COVERAGE.md`**). Use the gap-analysis doc for **directional** backlog prioritization; confirm uplift with **`dotnet-full-regression`** or a CI-equivalent local reproduction.

## Product assemblies (line % ascending)

Authoritative **per-package line %, branch %, coverable lines, class hotspots**, and refresh commands live in **[`../COVERAGE_GAP_ANALYSIS.md`](../COVERAGE_GAP_ANALYSIS.md)** (generated from the **Data source** path at the top of that file via **`python scripts/ci/coverage_gap_analysis.py`**). Do not duplicate percentages here — they go stale when someone refreshes only one document.

## Hotspots and backlog hooks

Class-level rankings (uncovered line entries, partial types merged) and **test-backfill notes** are maintained in **`docs/COVERAGE_GAP_ANALYSIS.md`**. Highest-impact themes aligned with the **`coverage-report-final/Cobertura.xml`** snapshot:

1. **`ArchLucid.Persistence`** — lowest line % in that merge (**~40%** for the main **`ArchLucid.Persistence`** package); **`DapperTenantRepository`** and relational read paths dominate uncovered entries.
2. **`ArchLucid.Api`** — **~61%** line; **`AdminDiagnosticsService`**, **`GovernanceController`**, **`EvolutionSimulationService`** drive gaps in the hotspot table.
3. **`ArchLucid.Cli`** — CLI commands and config evaluation remain expensive to cover end-to-end.
4. **`ArchLucid.Host.Core` / `ArchLucid.Host.Composition`** — background processing, DI composition extension methods, and consistency probes carry integration-heavy paths.

## Security, scalability, reliability, cost

| Dimension | Tie-in |
|-----------|--------|
| **Security** | Raising coverage on **auth-adjacent**, **tenant isolation**, and **ingest/export** paths reduces regressions in trust boundaries (maps to Persistence + Api + Host layers above). |
| **Scalability** | Coverage does not replace load tests; focus tests on **queue/back-pressure** and **repository batch** branches where complexity sits (**Host.Core**, Persistence reads/writes). |
| **Reliability** | SQL-backed integration tests (**`ARCHLUCID_SQL_TEST`**) materially change Cobertura for Persistence and Api — missing DB ⇒ **under-count** vs CI. |
| **Cost** | Full merges are expensive wall-clock; use **`scripts/ci/test-persistence-local-fast.ps1`** (Windows) / **`.sh`** for tight loops, then **`dotnet-full-regression`** for gate truth (**`CODE_COVERAGE.md`**). |

## Related

- **[`CODE_COVERAGE.md`](CODE_COVERAGE.md)** — how CI collects coverage and strict-profile reproduction.
- **[`../COVERAGE_GAP_ANALYSIS.md`](../COVERAGE_GAP_ANALYSIS.md)** — merged Cobertura class hotspots and refresh instructions.
- **[`coverage-exclusions.md`](coverage-exclusions.md)** — intentional exclusions and waiver discipline.
