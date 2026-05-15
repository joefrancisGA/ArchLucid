> **Scope:** Maintainer-facing code coverage analysis derived from merged Cobertura — interprets trends vs CI gates and names investment priorities; not a substitute for the authoritative **`coverage-merged-cobertura`** artifact from **`dotnet-full-regression`** or class-level hotspot tables in **`docs/COVERAGE_GAP_ANALYSIS.md`**.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.

# Code coverage analysis

## Objective

Summarize **current merged line and branch coverage** for product **`ArchLucid.*`** assemblies, compare against **merge-blocking CI floors**, and highlight **where additional tests yield the most risk reduction**.

## Data source and caveats

| Item | Value |
|------|--------|
| **Cobertura file** | `coverage-gap-1a/merged/Cobertura.xml` (ReportGenerator merge of Coverlet outputs) |
| **As-of** | 2026-05-14 (timestamp inside Cobertura: Unix **1778739180**) |
| **Product filter** | Same idea as **`scripts/ci/coverage_cobertura.product_packages_for_gate`**: **`ArchLucid.*`** packages with coverable lines, excluding test/support assemblies |

**Important:** This merge reflects **whatever test assemblies produced the underlying `coverage.cobertura.xml` files**, not necessarily a green **`dotnet test ArchLucid.sln`** with **`ARCHLUCID_SQL_TEST`** (CI **`dotnet-full-regression`**). Percentages **below** CI floors here do **not** automatically mean CI is red — **[`docs/library/CODE_COVERAGE.md`](CODE_COVERAGE.md)** instructs treating workflow artifact **`coverage-merged-cobertura`** as authoritative for gate debugging.

**Exclusions:** See **`coverage.runsettings`** and **`coverage-exclusions.md`** (for example generated OpenAPI XML comments under **`obj/`**, **`ArchLucid.Worker/Program.cs`**). **`ArchLucid.Worker`** may still appear with **low line-rate** for remaining coverable lines in this snapshot.

## Summary vs CI gates

CI (**`.github/workflows/ci.yml`**, job **`.NET: full regression (SQL)`**) enforces on merged Cobertura:

| Metric | This snapshot | CI minimum | Notes |
|--------|---------------:|-----------:|-------|
| **Merged line** | **69.43%** | **≥ 95%** | Strict gate + ratchet (**`.coverage-floor`** baseline **97.00%**, pass when merged ≥ baseline − 2 pp per **`assert_coverage_floor_ratchet.py`**) |
| **Merged branch** | **54.56%** | **≥ 63%** | Branch uplift typically trails line-focused tests |
| **Per-package line** | Several packages **below 63%** (see table) | **≥ 63%** each gated product package with coverable lines | **`scripts/ci/assert_merged_line_coverage_min.py`** |

**Interpretation:** For this Cobertura merge, **all strict thresholds would fail** if asserted against CI arguments — consistent with a **partial or non-SQL-equivalent** local/regression slice. Use this document for **directional** backlog prioritization; confirm uplift with **`dotnet-full-regression`** or a full local reproduction described in **`CODE_COVERAGE.md`**.

## Product assemblies (line % ascending)

Branch % is Cobertura **`branch-rate`** at package scope (may be **`0`** when no branch metadata).

| Assembly | Line % | Branch % | Coverable lines (approx.) |
|----------|-------:|---------:|----------------------------:|
| ArchLucid.Worker | 0.00 | 0.00 | 68 |
| ArchLucid.Persistence | 54.64 | 46.88 | 30360 |
| ArchLucid.Api | 56.41 | 43.48 | 30117 |
| ArchLucid.Cli | 63.65 | 51.83 | 12253 |
| ArchLucid.Host.Core | 67.66 | 60.30 | 12250 |
| ArchLucid.Host.Composition | 71.11 | 44.07 | 5793 |
| ArchLucid.AgentRuntime | 72.86 | 55.80 | 11799 |
| ArchLucid.Application | 73.48 | 54.68 | 41438 |
| ArchLucid.Core | 79.57 | 58.14 | 12297 |
| ArchLucid.ArtifactSynthesis | 81.05 | 68.46 | 3536 |
| ArchLucid.Notifications | 87.50 | 50.00 | 272 |
| ArchLucid.Integrations.AzureDevOps | 90.15 | 74.11 | 671 |
| ArchLucid.KnowledgeGraph | 90.51 | 77.85 | 1124 |
| ArchLucid.Contracts | 90.94 | 43.67 | 6995 |
| ArchLucid.Decisioning | 91.72 | 81.55 | 13455 |
| ArchLucid.ContextIngestion | 93.50 | 75.46 | 2025 |
| ArchLucid.Retrieval | 94.37 | 76.39 | 714 |
| ArchLucid.Provenance | 94.60 | 85.25 | 710 |
| ArchLucid.AgentSimulator | 97.59 | 59.09 | 582 |
| ArchLucid.Capabilities.Cost | 98.36 | 93.75 | 122 |
| ArchLucid.Jobs.Cli | 100.00 | 100.00 | 36 |
| ArchLucid.Api.Client | 100.00 | 100.00 | 32 |

## Hotspots and backlog hooks

Class-level rankings (uncovered line entries, partial types merged) and **test-backfill notes** are maintained in **`docs/COVERAGE_GAP_ANALYSIS.md`**. Highest-impact themes from that doc aligned with this snapshot:

1. **`ArchLucid.Persistence`** — large surface (**~54.6%** line); **`DapperTenantRepository`** and relational read paths dominate uncovered entries.
2. **`ArchLucid.Api`** — **~56.4%** line; significant churn from **generated OpenAPI** XML comments plus **`AdminDiagnosticsService`**, **`QuickStartService`**.
3. **`ArchLucid.Cli`** — **`BuyerProofPackCommand`**, **`TryCommand`**, **`ValidateConfigEvaluator`** drive CLI gaps.
4. **`ArchLucid.Host.Core` / `ArchLucid.Host.Composition`** — background processing, DI composition extension methods, and consistency probes carry integration-heavy branches (**Composition** branch % particularly low vs line %).

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
