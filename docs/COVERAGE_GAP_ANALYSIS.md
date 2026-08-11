> **Scope:** Coverage gap analysis (merged Cobertura) - tables from the Cobertura file named under **Data source**; stale or partial local merges (or leftover shards under `coverage-gap-1a`) produce misleading percentages — clean the folder before `dotnet test` or use the CI **`coverage-merged-cobertura`** artifact.
>
> **Spine doc:** [`START_HERE.md`](START_HERE.md). Read this file only if you have a specific reason beyond those five entry documents.

# Coverage gap analysis (merged Cobertura)

## Objective

Describe how **line/branch coverage** is collected in CI, how to reproduce reports locally, and interpret trends vs CI gates.

## Recommended workflow: Persistence and strict gates (CI-first)

**Merged line / branch / per-package floors** (including **`ArchLucid.Persistence`** at **≥ 63%** line for its assembly) are enforced **only** in GitHub Actions on the merged Cobertura from the full solution test run with SQL — job id **`dotnet-full-regression`**, display name **`.NET: full regression (SQL)`** in **`.github/workflows/ci.yml`**. That job sets **`ARCHLUCID_SQL_TEST`**, runs **`dotnet test ArchLucid.sln`** with **`coverage.runsettings`**, merges reports, then runs **`scripts/ci/assert_merged_line_coverage_min.py`**. **Treat that result and the uploaded artifact `coverage-merged-cobertura` (`Cobertura.xml`) as authoritative** when debugging a red coverage gate.

**Local default (fast iteration).** When adding **`ArchLucid.Persistence.Tests`**, verify behavior without Coverlet so runs stay short:

- **Cross-platform:** `scripts/ci/test-persistence-local-fast.sh`
- **Windows:** `scripts/ci/test-persistence-local-fast.ps1`

Or manually:

```bash
dotnet test ArchLucid.Persistence.Tests/ArchLucid.Persistence.Tests.csproj -c Release
```

Many SQL-backed tests **skip** unless **`ARCHLUCID_SQL_TEST`** points at a reachable database (same idea as CI). A green local **InMemory-only** run does **not** prove the strict merged package percentages; **push and rely on `dotnet-full-regression`** (or run the full solution test + merge flow locally only when you intentionally reproduce CI).

**Optional local strict reproduction.** To approximate CI before push: Release-build the solution, set **`ARCHLUCID_SQL_TEST`** to a local SQL instance, run **`dotnet test ArchLucid.sln -c Release --settings coverage.runsettings --collect:"XPlat Code Coverage"`**, merge Cobertura with ReportGenerator, then run **`assert_merged_line_coverage_min.py`** with the same arguments as the workflow. Expect **long** wall time; this path is for deep debugging, not every edit.

## Strict profile (product target)

The **V1.1** merge-blocking target (ratchet goal) for merged line + ratchet is:

- **Merged line ≥ 95%**
- **Merged branch ≥ 63%**
- **Per-product-package line ≥ 63%** for every gated **`ArchLucid.*`** assembly with coverable lines

**Compliance status:** **`.github/workflows/ci.yml`** (`dotnet-coverage-merge` after **`dotnet-full-regression`**) enforces **merged line**, **merged branch**, and **per-product-package line** on merged Cobertura. **Merged line** uses **`assert_merged_line_coverage_min.py`** with **`78`** minimum (job is warn-only via **`continue-on-error`**). **`assert_coverage_floor_ratchet.py`** runs in the same job against **`.coverage-floor`**.

To verify **CI parity**, run **`assert_merged_line_coverage_min.py`** on merged **`Cobertura.xml`** with **`77`**, **`--min-branch-pct 62`**, **`--min-package-line-pct 89`** (same as CI; include the workflow **`--skip-package-line-gate`** list). For the **strict-profile / V1.1** dry run, use **`95`** instead of **`77`** and **`assert_coverage_floor_ratchet.py`**.

## Current merge-blocking gates

The merge step in **`.github/workflows/ci.yml`** (`dotnet-coverage-merge`) enforces:

- **Merged line ≥ 76%**
- **Branch coverage ≥ 60%**
- **Per-product-package line ≥ 89%** for every gated **`ArchLucid.*`** assembly with coverable lines (see **`scripts/ci/assert_merged_line_coverage_min.py`** invocation in the workflow)

**Merged line ≥ 95%** (tighter than the **76%** CI floor) and the **ratchet** are deferred to **V1.1** (see **`docs/library/V1_DEFERRED.md`**).

**Advisory (non-blocking):** the advisory band is **inactive** today — **`--warn-below-package-line-pct 70`** sits below the **89%** package floor, so no package can pass the floor and still land in the band (see workflow).

**Fast core + full regression merge:** ReportGenerator **`-reports:`** is built with **`find … -name coverage.cobertura.xml`** (semicolon-separated list). GitHub’s bash often has **`globstar` off**, so a literal **`**/coverage.cobertura.xml`** shell glob can fail to expand; **`find`** avoids silent empty merges.

**Weakening gates** (lowering percentages or adding **`--skip-package-line-gate`**) requires explicit product / maintainer sign-off and doc updates in this file and **`docs/library/coverage-exclusions.md`**.

## RC23 merged package snapshot (authoritative gate posture)

Measured from RC23 merged Cobertura (`dotnet-coverage-merge`, run [30882961646](https://github.com/joefrancisGA/ArchLucid/actions/runs/30882961646)); floors re-aligned to CI **#2911** ([31054746164](https://github.com/joefrancisGA/ArchLucid/actions/runs/31054746164)) measured merged line/branch. **Gate** = subject to the **89%** per-package line floor; **skipped** = interim **`--skip-package-line-gate`** in **`.github/workflows/ci.yml`**.

| Package | Line % | Branch % | Gate |
| --- | --- | --- | --- |
| `ArchLucid.Backfill.Cli` | 19.29 | 7.02 | skipped |
| `ArchLucid.Api` | 49.73 | 40.10 | skipped |
| `ArchLucid.Cli` | 75.21 | 64.81 | skipped |
| `ArchLucid.Persistence` | 75.33 | 61.35 | skipped |
| `ArchLucid.Host.Core` | 76.72 | 67.06 | skipped |
| `ArchLucid.Application` | 78.47 | 60.16 | skipped |
| `ArchLucid.AgentRuntime` | 78.83 | 64.00 | skipped |
| `ArchLucid.Host.Composition` | 79.24 | 62.47 | skipped |
| `ArchLucid.Integrations.AzureDevOps` | 81.42 | 67.32 | OK |
| `ArchLucid.Analyzers` | 81.57 | 65.70 | OK |
| `ArchLucid.Retrieval` | 81.96 | 65.33 | OK |
| `ArchLucid.Core` | 82.44 | 62.33 | OK |
| `ArchLucid.AgentSimulator` | 82.93 | 54.55 | OK |
| `ArchLucid.ArtifactSynthesis` | 83.28 | 69.02 | OK |
| `ArchLucid.Mcp` | 83.33 | 62.50 | skipped |
| `ArchLucid.Contracts` | 84.91 | 41.98 | OK |
| `ArchLucid.KnowledgeGraph` | 86.51 | 77.86 | OK |
| `ArchLucid.Decisioning` | 90.12 | 79.76 | OK |
| `ArchLucid.Integrations.AzureExtractor` | 91.27 | 63.33 | OK |
| `ArchLucid.ContextIngestion` | 92.36 | 73.15 | OK |
| `ArchLucid.Provenance` | 94.61 | 89.71 | OK |
| `ArchLucid.Notifications` | 95.06 | 83.78 | OK |
| `ArchLucid.Capabilities.Cost` | 95.06 | 83.33 | OK |
| `ArchLucid.Integrations.GcpExtractor` | 98.73 | 66.67 | OK |
| `ArchLucid.Api.Client` | 100.00 | 100.00 | OK |
| `ArchLucid.Integrations.AwsExtractor` | 100.00 | 100.00 | OK |
| `ArchLucid.Jobs.Cli` | 100.00 | 100.00 | OK |
| `ArchLucid.Notifications.Email.RazorLight` | 100.00 | 100.00 | OK |

**RC23 uplift focus:** gated packages at or just above the **81%** floor — `ArchLucid.Integrations.AzureDevOps`, `ArchLucid.Analyzers`, `ArchLucid.Retrieval`, `ArchLucid.Core`, `ArchLucid.AgentSimulator` (see `*PackageCoverageBatchRc23Tests` in matching test projects). Skipped packages remain tracked until each clears the active floor and its skip flag is removed with sign-off.

**RC24 uplift (unit batches):** `ApplicationPackageCoverageBatchRc24Tests` (DOCX supplemental/OpenXML primitives, policy-pack before/after composer+snapshot, cloud inventory citations, finding/sponsor mappers, trial lifecycle outbox publish), `PersistencePackageCoverageBatchRc24Tests` (`PolicyFilteredComplianceRulePackProvider`), `HostCorePackageCoverageBatchRc24Tests` (trial lifecycle email integration handler + jobs/recurrence options).

## Local run (merged HTML)

From repo root (after a **Release** build of tests):

```bash
dotnet test ArchLucid.sln -c Release --settings coverage.runsettings --collect:"XPlat Code Coverage" --results-directory ./coverage-raw
dotnet tool run reportgenerator "-reports:./coverage-raw/**/coverage.cobertura.xml" "-targetdir:./coverage-report" "-reporttypes:HtmlSummary"
```

Open **`coverage-report/index.html`**.

## Exclusions

See **`docs/library/coverage-exclusions.md`** and **`coverage.runsettings`** (generated OpenAPI client, templates, etc.).

## Hotspots and backlog hooks

Class-level rankings (uncovered line entries, partial types merged) and **test-backfill notes** are maintained in the tables below. Highest-impact themes aligned with the snapshot:

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
| **Cost** | Full merges are expensive wall-clock; use **`scripts/ci/test-persistence-local-fast.ps1`** (Windows) / **`.sh`** for tight loops, then **`dotnet-full-regression`** for gate truth. |

---

## Snapshot Data

**Data source:** `coverage-report-merged\Cobertura.xml` (file mtime **2026-07-12 05:52:23 UTC**). For CI gate parity, prefer the **`coverage-merged-cobertura`** artifact from job **`.NET: merge coverage + gates`** (copy **`Cobertura.xml`** and run **`python scripts/ci/coverage_gap_analysis.py --cobertura <path>`**). See **`docs/COVERAGE_GAP_ANALYSIS.md`** — local merges without **`ARCHLUCID_SQL_TEST`** under-count SQL-only paths.

**Measurement:** Production `ArchLucid.*` assemblies only; excludes `*.Tests`, TestSupport, Benchmarks, and `ArchLucid.Worker` (`Program.cs` omitted per **`coverage.runsettings`** **`ExcludeByFile`**).

## All assemblies by line coverage (lowest first)

| Assembly | Line coverage % | Coverable lines (approx.) |
|----------|-----------------|---------------------------|
| ArchLucid.Api | 27.98 | 16812 |
| ArchLucid.Persistence | 33.84 | 11201 |
| ArchLucid.Application | 52.54 | 17865 |
| ArchLucid.ArtifactSynthesis | 56.54 | 2738 |
| ArchLucid.Retrieval | 58.55 | 610 |
| ArchLucid.Host.Core | 62.47 | 8949 |
| ArchLucid.ContextIngestion | 69.42 | 1380 |
| ArchLucid.Persistence.Alerts | 75.73 | 1920 |
| ArchLucid.Persistence.Runtime | 76.03 | 1865 |
| ArchLucid.AgentRuntime | 76.40 | 6125 |
| ArchLucid.Host.Composition | 78.04 | 2843 |
| ArchLucid.Persistence.Coordination | 79.33 | 5824 |
| ArchLucid.Persistence.Advisory | 81.22 | 1406 |
| ArchLucid.Core | 82.61 | 3216 |
| ArchLucid.Cli | 86.70 | 1940 |
| ArchLucid.Coordinator | 88.28 | 478 |
| ArchLucid.Contracts | 89.29 | 2001 |
| ArchLucid.Decisioning | 89.48 | 10404 |
| ArchLucid.KnowledgeGraph | 92.88 | 730 |
| ArchLucid.AgentSimulator | 96.45 | 564 |
| ArchLucid.Provenance | 96.70 | 666 |
| ArchLucid.Persistence.Integration | 99.19 | 494 |
| ArchLucid.Jobs.Cli | 100.00 | 36 |

## Per-assembly class gaps (by line coverage %)

Per Cobertura **class** aggregate `<lines>` rows. **Line coverage %** is **(coverable − uncovered) / coverable** for that class. **Partial types** merged by **class name + file**. Sort order: **lowest assembly line % first**, **except** **`ArchLucid.Decisioning`** — that assembly is placed **near the bottom** (after **`ArchLucid.AgentSimulator`**, before **`100.00%`** assemblies) because its class list is large.

**Prior attempt?** — **Yes** if the fully-qualified type name (or its short name, length ≥ **8**) appears as a substring in `docs/COVERAGE_GAP_ANALYSIS.md` (heuristic; very short names are not matched on their own).

### ArchLucid.Api (27.98% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Api.Auth.Services.ExternalIdIssuerPatterns` | `ArchLucid.Api\Auth\Services\ExternalIdIssuerPatterns.cs` | 0.00 | 4 | No |
| 2 | `ArchLucid.Api.Auth.Services.LocalTrialJwtIssuer` | `ArchLucid.Api\Auth\Services\LocalTrialJwtIssuer.cs` | 0.00 | 47 | No |
| 3 | `ArchLucid.Api.Auth.Services.TrialExternalIdJwtBearerSupport` | `ArchLucid.Api\Auth\Services\TrialExternalIdJwtBearerSupport.cs` | 0.00 | 10 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Api.Auth.Services.ExternalIdIssuerPatterns` | `ArchLucid.Api\Auth\Services\ExternalIdIssuerPatterns.cs` | 0.00 | 4 | No |
| 2 | `ArchLucid.Api.Auth.Services.LocalTrialJwtIssuer` | `ArchLucid.Api\Auth\Services\LocalTrialJwtIssuer.cs` | 0.00 | 47 | No |
| 3 | `ArchLucid.Api.Auth.Services.TrialExternalIdJwtBearerSupport` | `ArchLucid.Api\Auth\Services\TrialExternalIdJwtBearerSupport.cs` | 0.00 | 10 | No |
| 4 | `ArchLucid.Api.Controllers.Admin.AdminArchiveRunsBatchRequest` | `ArchLucid.Api\Controllers\Admin\AdminArchiveRunsBatchRequest.cs` | 0.00 | 1 | No |
| 5 | `ArchLucid.Api.Controllers.Admin.AdminArchiveRunsByIdsRequest` | `ArchLucid.Api\Controllers\Admin\AdminArchiveRunsByIdsRequest.cs` | 0.00 | 1 | No |
| 6 | `ArchLucid.Api.Controllers.Admin.AdminController` | `ArchLucid.Api\Controllers\Admin\AdminController.cs` | 0.00 | 63 | No |
| 7 | `ArchLucid.Api.Controllers.Admin.AsyncAuthorityPipelineFeatureState` | `ArchLucid.Api\Controllers\Admin\AdminController.cs` | 0.00 | 1 | No |
| 8 | `ArchLucid.Api.Controllers.Admin.AuditController` | `ArchLucid.Api\Controllers\Admin\AuditController.cs` | 0.00 | 72 | No |
| 9 | `ArchLucid.Api.Controllers.Admin.DiagnosticsController` | `ArchLucid.Api\Controllers\Admin\DiagnosticsController.cs` | 0.00 | 21 | No |
| 10 | `ArchLucid.Api.Controllers.Admin.TenantProvisionAdminRequest` | `ArchLucid.Api\Controllers\Admin\TenantProvisionAdminRequest.cs` | 0.00 | 3 | No |
| 11 | `ArchLucid.Api.Controllers.Admin.TenantsAdminController` | `ArchLucid.Api\Controllers\Admin\TenantsAdminController.cs` | 0.00 | 24 | No |
| 12 | `ArchLucid.Api.Controllers.Advisory.AdvisoryController` | `ArchLucid.Api\Controllers\Advisory\AdvisoryController.cs` | 0.00 | 143 | No |
| 13 | `ArchLucid.Api.Controllers.Advisory.AdvisorySchedulingController` | `ArchLucid.Api\Controllers\Advisory\AdvisorySchedulingController.cs` | 0.00 | 79 | No |
| 14 | `ArchLucid.Api.Controllers.Advisory.DigestSubscriptionsController` | `ArchLucid.Api\Controllers\Advisory\DigestSubscriptionsController.cs` | 0.00 | 83 | No |
| 15 | `ArchLucid.Api.Controllers.Advisory.LearningController` | `ArchLucid.Api\Controllers\Advisory\LearningController.cs` | 0.00 | 126 | No |
| 16 | `ArchLucid.Api.Controllers.Advisory.ProductLearningController` | `ArchLucid.Api\Controllers\Advisory\ProductLearningController.cs` | 0.00 | 166 | No |
| 17 | `ArchLucid.Api.Controllers.Advisory.RecommendationLearningController` | `ArchLucid.Api\Controllers\Advisory\RecommendationLearningController.cs` | 0.00 | 27 | No |
| 18 | `ArchLucid.Api.Controllers.Alerts.AlertRoutingSubscriptionsController` | `ArchLucid.Api\Controllers\Alerts\AlertRoutingSubscriptionsController.cs` | 0.00 | 72 | No |
| 19 | `ArchLucid.Api.Controllers.Alerts.AlertRulesController` | `ArchLucid.Api\Controllers\Alerts\AlertRulesController.cs` | 0.00 | 37 | No |
| 20 | `ArchLucid.Api.Controllers.Alerts.AlertsAcknowledgeBatchItemResult` | `ArchLucid.Api\Controllers\Alerts\AlertsAcknowledgeBatchResponse.cs` | 0.00 | 3 | No |
| 21 | `ArchLucid.Api.Controllers.Alerts.AlertsAcknowledgeBatchRequest` | `ArchLucid.Api\Controllers\Alerts\AlertsAcknowledgeBatchRequest.cs` | 0.00 | 2 | No |
| 22 | `ArchLucid.Api.Controllers.Alerts.AlertsAcknowledgeBatchResponse` | `ArchLucid.Api\Controllers\Alerts\AlertsAcknowledgeBatchResponse.cs` | 0.00 | 1 | No |
| 23 | `ArchLucid.Api.Controllers.Alerts.AlertsController` | `ArchLucid.Api\Controllers\Alerts\AlertsController.cs` | 0.00 | 98 | No |
| 24 | `ArchLucid.Api.Controllers.Alerts.AlertSimulationController` | `ArchLucid.Api\Controllers\Alerts\AlertSimulationController.cs` | 0.00 | 81 | No |
| 25 | `ArchLucid.Api.Controllers.Alerts.AlertTuningController` | `ArchLucid.Api\Controllers\Alerts\AlertTuningController.cs` | 0.00 | 45 | No |
| 26 | `ArchLucid.Api.Controllers.Alerts.CompositeAlertRulesController` | `ArchLucid.Api\Controllers\Alerts\CompositeAlertRulesController.cs` | 0.00 | 38 | No |
| 27 | `ArchLucid.Api.Controllers.Auth.TrialLocalIdentityAuthController` | `ArchLucid.Api\Controllers\Auth\TrialLocalIdentityAuthController.cs` | 0.00 | 102 | No |
| 28 | `ArchLucid.Api.Controllers.Authority.ArtifactExportController` | `ArchLucid.Api\Controllers\Authority\ArtifactExportController.cs` | 0.00 | 110 | No |
| 29 | `ArchLucid.Api.Controllers.Authority.AuthorityQueryController` | `ArchLucid.Api\Controllers\Authority\AuthorityQueryController.cs` | 0.00 | 117 | No |
| 30 | `ArchLucid.Api.Controllers.Authority.AuthorityReplayController` | `ArchLucid.Api\Controllers\Authority\AuthorityReplayController.cs` | 0.00 | 51 | No |
| 31 | `ArchLucid.Api.Controllers.Authority.AuthorityRunEventsController` | `ArchLucid.Api\Controllers\Authority\AuthorityRunEventsController.cs` | 0.00 | 65 | No |
| 32 | `ArchLucid.Api.Controllers.Authority.RunAgentEvaluationController` | `ArchLucid.Api\Controllers\Authority\RunAgentEvaluationController.cs` | 0.00 | 49 | No |
| 33 | `ArchLucid.Api.Controllers.Authority.RunComparisonController` | `ArchLucid.Api\Controllers\Authority\RunComparisonController.cs` | 0.00 | 93 | No |
| 34 | `ArchLucid.Api.Controllers.Authority.RunsController` | `ArchLucid.Api\Controllers\Authority\RunsController.cs` | 0.00 | 149 | No |
| 35 | `ArchLucid.Api.Controllers.Authority.RunsController` | `ArchLucid.Api\obj\Release\net10.0\Microsoft.Gen.Logging\Microsoft.Gen.Logging.LoggingGenerator\Logging.g.cs` | 0.00 | 144 | No |
| 36 | `ArchLucid.Api.Controllers.Billing.BillingMarketplaceWebhookController` | `ArchLucid.Api\Controllers\Billing\BillingMarketplaceWebhookController.cs` | 0.00 | 45 | No |
| 37 | `ArchLucid.Api.Controllers.Billing.BillingStripeWebhookController` | `ArchLucid.Api\Controllers\Billing\BillingStripeWebhookController.cs` | 0.00 | 18 | No |
| 38 | `ArchLucid.Api.Controllers.E2e.E2EHarnessController` | `ArchLucid.Api\Controllers\E2e\E2eHarnessController.cs` | 0.00 | 73 | No |
| 39 | `ArchLucid.Api.Controllers.Evolution.EvolutionController` | `ArchLucid.Api\Controllers\Evolution\EvolutionController.cs` | 0.00 | 130 | No |
| 40 | `ArchLucid.Api.Controllers.Governance.AssignPolicyPackRequest` | `ArchLucid.Api\Controllers\Governance\AssignPolicyPackRequest.cs` | 0.00 | 3 | No |
| 41 | `ArchLucid.Api.Controllers.Governance.CreatePolicyPackRequest` | `ArchLucid.Api\Controllers\Governance\CreatePolicyPackRequest.cs` | 0.00 | 4 | No |
| 42 | `ArchLucid.Api.Controllers.Governance.GovernanceApprovalBatchReviewRequest` | `ArchLucid.Api\Controllers\Governance\GovernanceApprovalBatchReviewRequest.cs` | 0.00 | 4 | No |
| 43 | `ArchLucid.Api.Controllers.Governance.GovernanceBatchReviewItemResult` | `ArchLucid.Api\Controllers\Governance\GovernanceBatchReviewResponse.cs` | 0.00 | 4 | No |
| 44 | `ArchLucid.Api.Controllers.Governance.GovernanceBatchReviewResponse` | `ArchLucid.Api\Controllers\Governance\GovernanceBatchReviewResponse.cs` | 0.00 | 1 | No |
| 45 | `ArchLucid.Api.Controllers.Governance.GovernancePreviewController` | `ArchLucid.Api\Controllers\Governance\GovernancePreviewController.cs` | 0.00 | 36 | No |
| 46 | `ArchLucid.Api.Controllers.Governance.GovernanceResolutionController` | `ArchLucid.Api\Controllers\Governance\GovernanceResolutionController.cs` | 0.00 | 57 | No |
| 47 | `ArchLucid.Api.Controllers.Governance.ManifestsController` | `ArchLucid.Api\Controllers\Governance\ManifestsController.cs` | 0.00 | 232 | No |
| 48 | `ArchLucid.Api.Controllers.Governance.PolicyPacksController` | `ArchLucid.Api\Controllers\Governance\PolicyPacksController.cs` | 0.00 | 94 | No |
| 49 | `ArchLucid.Api.Controllers.Governance.PublishPolicyPackVersionRequest` | `ArchLucid.Api\Controllers\Governance\PublishPolicyPackVersionRequest.cs` | 0.00 | 2 | No |
| 50 | `ArchLucid.Api.Controllers.Planning.AskController` | `ArchLucid.Api\Controllers\Planning\AskController.cs` | 0.00 | 28 | No |
| 51 | `ArchLucid.Api.Controllers.Planning.ComparisonController` | `ArchLucid.Api\Controllers\Planning\ComparisonController.cs` | 0.00 | 18 | No |
| 52 | `ArchLucid.Api.Controllers.Planning.ComparisonsController` | `ArchLucid.Api\Controllers\Planning\ComparisonsController.cs` | 0.00 | 294 | No |
| 53 | `ArchLucid.Api.Controllers.Planning.ConversationController` | `ArchLucid.Api\Controllers\Planning\ConversationController.cs` | 0.00 | 38 | No |
| 54 | `ArchLucid.Api.Controllers.Planning.ExplanationController` | `ArchLucid.Api\Controllers\Planning\ExplanationController.cs` | 0.00 | 88 | No |
| 55 | `ArchLucid.Api.Controllers.Planning.GraphController` | `ArchLucid.Api\Controllers\Planning\GraphController.cs` | 0.00 | 64 | No |
| 56 | `ArchLucid.Api.Controllers.Planning.ProvenanceController` | `ArchLucid.Api\Controllers\Planning\ProvenanceController.cs` | 0.00 | 22 | No |
| 57 | `ArchLucid.Api.Controllers.Planning.ProvenanceQueryController` | `ArchLucid.Api\Controllers\Planning\ProvenanceQueryController.cs` | 0.00 | 23 | No |
| 58 | `ArchLucid.Api.Controllers.RegistrationController` | `ArchLucid.Api\Controllers\RegistrationController.cs` | 0.00 | 101 | No |
| 59 | `ArchLucid.Api.Filters.TrialLimitExceededAuditFilter` | `ArchLucid.Api\Filters\TrialLimitExceededAuditFilter.cs` | 0.00 | 3 | No |
| 60 | `ArchLucid.Api.Learning.LearningPlanningQueryParser` | `ArchLucid.Api\Learning\LearningPlanningQueryParser.cs` | 0.00 | 47 | No |
| 61 | `ArchLucid.Api.Mapping.ComparisonResponseMapper` | `ArchLucid.Api\Mapping\ComparisonResponseMapper.cs` | 0.00 | 25 | No |
| 62 | `ArchLucid.Api.Mapping.ConsultingDocxExportAuditMapper` | `ArchLucid.Api\Mapping\ConsultingDocxExportAuditMapper.cs` | 0.00 | 34 | No |
| 63 | `ArchLucid.Api.Mapping.ConsultingDocxJobPayloadMapper` | `ArchLucid.Api\Mapping\ConsultingDocxJobPayloadMapper.cs` | 0.00 | 24 | No |
| 64 | `ArchLucid.Api.Mapping.RunResponseMapper` | `ArchLucid.Api\Mapping\RunResponseMapper.cs` | 0.00 | 35 | No |
| 65 | `ArchLucid.Api.Models.Auth.TrialLocalRegisterRequest` | `ArchLucid.Api\Models\Auth\TrialLocalIdentityRequests.cs` | 0.00 | 2 | No |
| 66 | `ArchLucid.Api.Models.Auth.TrialLocalRegisterResponse` | `ArchLucid.Api\Models\Auth\TrialLocalIdentityRequests.cs` | 0.00 | 2 | No |
| 67 | `ArchLucid.Api.Models.Auth.TrialLocalTokenRequest` | `ArchLucid.Api\Models\Auth\TrialLocalIdentityRequests.cs` | 0.00 | 5 | No |
| 68 | `ArchLucid.Api.Models.Auth.TrialLocalTokenResponse` | `ArchLucid.Api\Models\Auth\TrialLocalIdentityRequests.cs` | 0.00 | 3 | No |
| 69 | `ArchLucid.Api.Models.Auth.TrialLocalVerifyEmailRequest` | `ArchLucid.Api\Models\Auth\TrialLocalIdentityRequests.cs` | 0.00 | 2 | No |
| 70 | `ArchLucid.Api.Models.ComparisonReplayCostEstimateResponse` | `ArchLucid.Api\Models\ComparisonReplayCostEstimateResponse.cs` | 0.00 | 20 | No |
| 71 | `ArchLucid.Api.Models.E2e.E2eHarnessBillingSimulatePostRequest` | `ArchLucid.Api\Models\E2e\E2eHarnessBillingSimulatePostRequest.cs` | 0.00 | 6 | No |
| 72 | `ArchLucid.Api.Models.E2e.E2eHarnessTrialExpiresPostRequest` | `ArchLucid.Api\Models\E2e\E2eHarnessTrialExpiresPostRequest.cs` | 0.00 | 2 | No |
| 73 | `ArchLucid.Api.Models.Evolution.EvolutionCandidateChangeSetListResponse` | `ArchLucid.Api\Models\Evolution\EvolutionCandidateChangeSetListResponse.cs` | 0.00 | 1 | No |
| 74 | `ArchLucid.Api.Models.Evolution.EvolutionCandidateChangeSetResponse` | `ArchLucid.Api\Models\Evolution\EvolutionCandidateChangeSetResponse.cs` | 0.00 | 8 | No |
| 75 | `ArchLucid.Api.Models.Evolution.EvolutionCandidateChangeSetResponseMapper` | `ArchLucid.Api\Models\Evolution\EvolutionCandidateChangeSetResponseMapper.cs` | 0.00 | 21 | No |
| 76 | `ArchLucid.Api.Models.Evolution.EvolutionCandidateDetailResponse` | `ArchLucid.Api\Models\Evolution\EvolutionCandidateDetailResponse.cs` | 0.00 | 3 | No |
| 77 | `ArchLucid.Api.Models.Evolution.EvolutionResultsResponse` | `ArchLucid.Api\Models\Evolution\EvolutionResultsResponse.cs` | 0.00 | 3 | No |
| 78 | `ArchLucid.Api.Models.Evolution.EvolutionShadowEvaluateResponse` | `ArchLucid.Api\Models\Evolution\EvolutionShadowEvaluateResponse.cs` | 0.00 | 1 | No |
| 79 | `ArchLucid.Api.Models.Evolution.EvolutionSimulateResponse` | `ArchLucid.Api\Models\Evolution\EvolutionSimulateResponse.cs` | 0.00 | 2 | No |
| 80 | `ArchLucid.Api.Models.Evolution.EvolutionSimulationRunResponse` | `ArchLucid.Api\Models\Evolution\EvolutionSimulationRunResponse.cs` | 0.00 | 7 | No |
| 81 | `ArchLucid.Api.Models.Learning.LearningPlanDetailResponse` | `ArchLucid.Api\Models\Learning\LearningPlanDetailResponse.cs` | 0.00 | 12 | No |
| 82 | `ArchLucid.Api.Models.Learning.LearningPlanEvidenceCountsResponse` | `ArchLucid.Api\Models\Learning\LearningPlanEvidenceCountsResponse.cs` | 0.00 | 3 | No |
| 83 | `ArchLucid.Api.Models.Learning.LearningPlanListItemResponse` | `ArchLucid.Api\Models\Learning\LearningPlanListItemResponse.cs` | 0.00 | 9 | No |
| 84 | `ArchLucid.Api.Models.Learning.LearningPlansListResponse` | `ArchLucid.Api\Models\Learning\LearningPlansListResponse.cs` | 0.00 | 2 | No |
| 85 | `ArchLucid.Api.Models.Learning.LearningPlanStepResponse` | `ArchLucid.Api\Models\Learning\LearningPlanStepResponse.cs` | 0.00 | 4 | No |
| 86 | `ArchLucid.Api.Models.Learning.LearningSummaryResponse` | `ArchLucid.Api\Models\Learning\LearningSummaryResponse.cs` | 0.00 | 6 | No |
| 87 | `ArchLucid.Api.Models.Learning.LearningThemeResponse` | `ArchLucid.Api\Models\Learning\LearningThemeResponse.cs` | 0.00 | 15 | No |
| 88 | `ArchLucid.Api.Models.Learning.LearningThemesListResponse` | `ArchLucid.Api\Models\Learning\LearningThemesListResponse.cs` | 0.00 | 2 | No |
| 89 | `ArchLucid.Api.Models.PagingParameters` | `ArchLucid.Api\Models\PagingParameters.cs` | 0.00 | 10 | No |
| 90 | `ArchLucid.Api.Models.Tenancy.TenantRegistrationRequest` | `ArchLucid.Api\Models\Tenancy\TenantRegistrationRequest.cs` | 0.00 | 3 | No |
| 91 | `ArchLucid.Api.Models.Tenancy.TenantTrialConvertRequest` | `ArchLucid.Api\Models\Tenancy\TenantTrialConvertRequest.cs` | 0.00 | 1 | No |
| 92 | `ArchLucid.Api.Services.Admin.AdminDiagnosticsService` | `ArchLucid.Api\Services\Admin\AdminDiagnosticsService.cs` | 0.00 | 237 | No |
| 93 | `ArchLucid.Api.Services.Admin.AdminOutboxSnapshot` | `ArchLucid.Api\Services\Admin\AdminOutboxSnapshot.cs` | 0.00 | 5 | No |
| 94 | `ArchLucid.Api.Services.Admin.DataConsistencyOrphanCounts` | `ArchLucid.Api\Services\Admin\DataConsistencyOrphanCounts.cs` | 0.00 | 5 | No |
| 95 | `ArchLucid.Api.Services.Admin.OrphanComparisonRemediationResult` | `ArchLucid.Api\Services\Admin\OrphanComparisonRemediationResult.cs` | 0.00 | 4 | No |
| 96 | `ArchLucid.Api.Services.Admin.OrphanFindingsSnapshotRemediationResult` | `ArchLucid.Api\Services\Admin\OrphanFindingsSnapshotRemediationResult.cs` | 0.00 | 4 | No |
| 97 | `ArchLucid.Api.Services.Admin.OrphanGoldenManifestRemediationResult` | `ArchLucid.Api\Services\Admin\OrphanGoldenManifestRemediationResult.cs` | 0.00 | 4 | No |
| 98 | `ArchLucid.Api.Services.BatchReplayZipPathSanitizer` | `ArchLucid.Api\Services\BatchReplayZipPathSanitizer.cs` | 0.00 | 5 | No |
| 99 | `ArchLucid.Api.Services.LearningPlanningReadService` | `ArchLucid.Api\Services\LearningPlanningReadService.cs` | 0.00 | 130 | No |
| 100 | `ArchLucid.Api.Swagger.AlertExamplesOperationFilter` | `ArchLucid.Api\Swagger\AlertExamplesOperationFilter.cs` | 0.00 | 20 | No |
| 101 | `ArchLucid.Api.Swagger.ArchitectureRequestExamplesOperationFilter` | `ArchLucid.Api\Swagger\ArchitectureRequestExamplesOperationFilter.cs` | 0.00 | 17 | No |
| 102 | `ArchLucid.Api.Swagger.ComparisonHistoryQueryOperationFilter` | `ArchLucid.Api\Swagger\ComparisonHistoryQueryOperationFilter.cs` | 0.00 | 14 | No |
| 103 | `ArchLucid.Api.Swagger.OpenApiAuthAnonymousDetection` | `ArchLucid.Api\Swagger\OpenApiAuthAnonymousDetection.cs` | 0.00 | 8 | No |
| 104 | `ArchLucid.Api.Swagger.PolicyPackContentDocumentSchemaFilter` | `ArchLucid.Api\Swagger\PolicyPackContentDocumentSchemaFilter.cs` | 0.00 | 8 | No |
| 105 | `ArchLucid.Api.Swagger.PolicyPackExamplesOperationFilter` | `ArchLucid.Api\Swagger\PolicyPackExamplesOperationFilter.cs` | 0.00 | 22 | No |
| 106 | `ArchLucid.Api.Swagger.ProblemDetailsResponsesOperationFilter` | `ArchLucid.Api\Swagger\ProblemDetailsResponsesOperationFilter.cs` | 0.00 | 13 | No |
| 107 | `ArchLucid.Api.Swagger.ReplayExamplesOperationFilter` | `ArchLucid.Api\Swagger\ReplayExamplesOperationFilter.cs` | 0.00 | 24 | No |
| 108 | `ArchLucid.Api.Validators.ApproveGovernanceRequestValidator` | `ArchLucid.Api\Validators\ApproveGovernanceRequestValidator.cs` | 0.00 | 8 | No |
| 109 | `ArchLucid.Api.Validators.ArchitectureAnalysisRequestValidator` | `ArchLucid.Api\Validators\ArchitectureAnalysisRequestValidator.cs` | 0.00 | 21 | No |
| 110 | `ArchLucid.Api.Validators.ArchitectureRequestValidator` | `ArchLucid.Api\Validators\ArchitectureRequestValidator.cs` | 0.00 | 56 | No |
| 111 | `ArchLucid.Api.Validators.AssignPolicyPackRequestValidator` | `ArchLucid.Api\Validators\AssignPolicyPackRequestValidator.cs` | 0.00 | 12 | No |
| 112 | `ArchLucid.Api.Validators.BatchReplayComparisonRequestValidator` | `ArchLucid.Api\Validators\BatchReplayComparisonRequestValidator.cs` | 0.00 | 20 | No |
| 113 | `ArchLucid.Api.Validators.ComparisonHistoryQueryValidator` | `ArchLucid.Api\Validators\ComparisonHistoryQueryValidator.cs` | 0.00 | 32 | No |
| 114 | `ArchLucid.Api.Validators.ConsultingDocxExportRequestValidator` | `ArchLucid.Api\Validators\ConsultingDocxValidators.cs` | 0.00 | 21 | No |
| 115 | `ArchLucid.Api.Validators.ConsultingDocxProfileRecommendationRequestValidator` | `ArchLucid.Api\Validators\ConsultingDocxValidators.cs` | 0.00 | 4 | No |
| 116 | `ArchLucid.Api.Validators.CreateGovernanceActivationRequestValidator` | `ArchLucid.Api\Validators\CreateGovernanceActivationRequestValidator.cs` | 0.00 | 14 | No |
| 117 | `ArchLucid.Api.Validators.CreateGovernanceApprovalRequestValidator` | `ArchLucid.Api\Validators\CreateGovernanceApprovalRequestValidator.cs` | 0.00 | 29 | No |
| 118 | `ArchLucid.Api.Validators.CreateGovernanceEnvironmentComparisonRequestValidator` | `ArchLucid.Api\Validators\CreateGovernanceEnvironmentComparisonRequestValidator.cs` | 0.00 | 16 | No |
| 119 | `ArchLucid.Api.Validators.CreateGovernancePreviewRequestValidator` | `ArchLucid.Api\Validators\CreateGovernancePreviewRequestValidator.cs` | 0.00 | 14 | No |
| 120 | `ArchLucid.Api.Validators.CreateGovernancePromotionRequestValidator` | `ArchLucid.Api\Validators\CreateGovernancePromotionRequestValidator.cs` | 0.00 | 32 | No |
| 121 | `ArchLucid.Api.Validators.CreatePolicyPackRequestValidator` | `ArchLucid.Api\Validators\CreatePolicyPackRequestValidator.cs` | 0.00 | 15 | No |
| 122 | `ArchLucid.Api.Validators.InfrastructureDeclarationRequestValidator` | `ArchLucid.Api\Validators\InfrastructureDeclarationRequestValidator.cs` | 0.00 | 18 | No |
| 123 | `ArchLucid.Api.Validators.PolicyPackRequestValidationRules` | `ArchLucid.Api\Validators\PolicyPackRequestValidationRules.cs` | 0.00 | 19 | No |
| 124 | `ArchLucid.Api.Validators.PublishPolicyPackVersionRequestValidator` | `ArchLucid.Api\Validators\PublishPolicyPackVersionRequestValidator.cs` | 0.00 | 12 | No |
| 125 | `ArchLucid.Api.Validators.RejectGovernanceRequestValidator` | `ArchLucid.Api\Validators\RejectGovernanceRequestValidator.cs` | 0.00 | 8 | No |
| 126 | `ArchLucid.Api.Validators.ReplayComparisonRequestValidator` | `ArchLucid.Api\Validators\ReplayComparisonRequestValidator.cs` | 0.00 | 13 | No |
| 127 | `ArchLucid.Api.Validators.RunPairQueryValidator` | `ArchLucid.Api\Validators\RunPairQueryValidator.cs` | 0.00 | 11 | No |
| 128 | `ArchLucid.Api.Swagger.OpenApiAuthDocumentMutator` | `ArchLucid.Api\Swagger\OpenApiAuthDocumentMutator.cs` | 6.98 | 40 | No |
| 129 | `ArchLucid.Api.Swagger.OpenApiAuthSecurityOperationFilter` | `ArchLucid.Api\Swagger\OpenApiAuthSecurityOperationFilter.cs` | 11.11 | 8 | No |
| 130 | `ArchLucid.Api.Controllers.Authority.AuthorityCompareController` | `ArchLucid.Api\Controllers\Authority\AuthorityCompareController.cs` | 15.09 | 45 | No |
| 131 | `ArchLucid.Api.Services.Evolution.EvolutionSimulationService` | `ArchLucid.Api\Services\Evolution\EvolutionSimulationService.cs` | 19.90 | 165 | No |
| 132 | `ArchLucid.Api.Controllers.Authority.RunQueryController` | `ArchLucid.Api\Controllers\Authority\RunQueryController.cs` | 22.33 | 80 | No |
| 133 | `ArchLucid.Api.Controllers.Authority.AnalysisReportsController` | `ArchLucid.Api\Controllers\Authority\AnalysisReportsController.cs` | 22.49 | 162 | No |
| 134 | `ArchLucid.Api.Controllers.Governance.GovernanceController` | `ArchLucid.Api\Controllers\Governance\GovernanceController.cs` | 23.62 | 207 | No |
| 135 | `ArchLucid.Api.ApiFileResults` | `ArchLucid.Api\ApiFileResults.cs` | 25.00 | 3 | No |
| 136 | `ArchLucid.Api.Services.ReplayArtifactResponseFactory` | `ArchLucid.Api\Services\ReplayArtifactResponseFactory.cs` | 28.57 | 20 | No |
| 137 | `ArchLucid.Api.ProductLearning.ProductLearningQueryParser` | `ArchLucid.Api\ProductLearning\ProductLearningQueryParser.cs` | 32.50 | 54 | No |
| 138 | `ArchLucid.Api.OpenApi.MicrosoftOpenApiAnonymousSecurityOperationTransformer` | `ArchLucid.Api\OpenApi\MicrosoftOpenApiAnonymousSecurityOperationTransformer.cs` | 33.33 | 6 | No |
| 139 | `ArchLucid.Api.Swagger.OpenApiAuthSecurityDocumentFilter` | `ArchLucid.Api\Swagger\OpenApiAuthSecurityDocumentFilter.cs` | 33.33 | 2 | No |
| 140 | `ArchLucid.Api.Models.ComparisonHistoryQuery` | `ArchLucid.Api\Models\ComparisonHistoryQuery.cs` | 42.86 | 16 | No |
| 141 | `ArchLucid.Api.ProblemDetails.ProblemDetailsExtensions` | `ArchLucid.Api\ProblemDetails\ProblemDetailsExtensions.cs` | 44.44 | 60 | No |
| 142 | `ArchLucid.Api.Controllers.Tenancy.TenantTrialController` | `ArchLucid.Api\Controllers\Tenancy\TenantTrialController.cs` | 52.69 | 44 | No |
| 143 | `ArchLucid.Api.Models.Evolution.EvolutionOutcomeShadowReader` | `ArchLucid.Api\Models\Evolution\EvolutionOutcomeShadowReader.cs` | 53.85 | 12 | No |
| 144 | `ArchLucid.Api.Startup.SwaggerExtensions` | `ArchLucid.Api\Startup\SwaggerExtensions.cs` | 54.00 | 23 | No |
| 145 | `ArchLucid.Api.Controllers.Admin.ClientErrorTelemetryController` | `ArchLucid.Api\Controllers\Admin\ClientErrorTelemetryController.cs` | 56.41 | 17 | No |
| 146 | `ArchLucid.Api.ProblemDetails.TrialLimitProblemResponse` | `ArchLucid.Api\ProblemDetails\TrialLimitProblemResponse.cs` | 57.38 | 26 | No |
| 147 | `ArchLucid.Api.Startup.PipelineExtensions` | `ArchLucid.Api\Startup\PipelineExtensions.cs` | 57.50 | 51 | No |
| 148 | `ArchLucid.Api.Controllers.Authority.ExportsController` | `ArchLucid.Api\Controllers\Authority\ExportsController.cs` | 64.62 | 46 | No |
| 149 | `ArchLucid.Api.Filters.TrialLimitAuthorizationHandler` | `ArchLucid.Api\Filters\TrialLimitFilter.cs` | 65.00 | 7 | No |
| 150 | `ArchLucid.Api.Middleware.ApiDeprecationHeadersMiddleware` | `ArchLucid.Api\Middleware\ApiDeprecationHeadersMiddleware.cs` | 66.67 | 9 | No |
| 151 | `ArchLucid.Api.Auth.Services.AuthServiceCollectionExtensions` | `ArchLucid.Api\Auth\Services\AuthServiceCollectionExtensions.cs` | 67.74 | 30 | No |
| 152 | `ArchLucid.Api.ProblemDetails.ProblemCorrelation` | `ArchLucid.Api\ProblemDetails\ProblemCorrelation.cs` | 75.00 | 2 | No |
| 153 | `ArchLucid.Api.Startup.MvcExtensions` | `ArchLucid.Api\Startup\MvcExtensions.cs` | 76.27 | 14 | No |
| 154 | `ArchLucid.Api.Mapping.ReplayComparisonRequestMapper` | `ArchLucid.Api\Mapping\ReplayComparisonRequestMapper.cs` | 76.47 | 8 | No |
| 155 | `ArchLucid.Api.FileWithRangeResult` | `ArchLucid.Api\FileWithRangeResult.cs` | 77.05 | 14 | No |
| 156 | `ArchLucid.Api.Startup.InfrastructureExtensions` | `ArchLucid.Api\Startup\InfrastructureExtensions.cs` | 78.63 | 28 | No |
| 157 | `ArchLucid.Api.Configuration.ApiWebLayerServiceCollectionExtensions` | `ArchLucid.Api\Configuration\ApiWebLayerServiceCollectionExtensions.cs` | 80.00 | 2 | No |
| 158 | `ArchLucid.Api.Filters.TrialLimitAuthorizationResultHandler` | `ArchLucid.Api\Filters\TrialLimitFilter.cs` | 80.00 | 2 | No |
| 159 | `ArchLucid.Api.Startup.RateLimitingRolePartitionBuilder` | `ArchLucid.Api\Startup\RateLimitingRolePartitionBuilder.cs` | 80.65 | 6 | No |
| 160 | `ArchLucid.Api.Controllers.Billing.BillingCheckoutController` | `ArchLucid.Api\Controllers\Billing\BillingCheckoutController.cs` | 81.19 | 19 | No |
| 161 | `ArchLucid.Api.Formatters.AuditEventCsvFormatter` | `ArchLucid.Api\Formatters\AuditEventCsvFormatter.cs` | 81.25 | 12 | No |
| 162 | `ArchLucid.Api.ProblemDetails.ApiProblemDetailsExceptionFilter` | `ArchLucid.Api\ProblemDetails\ApiProblemDetailsExceptionFilter.cs` | 85.71 | 1 | No |
| 163 | `ArchLucid.Api.Models.Evolution.EvolutionOutcomeParser` | `ArchLucid.Api\Models\Evolution\EvolutionOutcomeParser.cs` | 86.36 | 6 | No |
| 164 | `ArchLucid.Api.Services.Evolution.EvolutionSimulationReportMarkdownFormatter` | `ArchLucid.Api\Services\Evolution\EvolutionSimulationReportMarkdownFormatter.cs` | 86.72 | 17 | No |
| 165 | `ArchLucid.Api.Controllers.Authority.DocxExportController` | `ArchLucid.Api\Controllers\Authority\DocxExportController.cs` | 88.06 | 8 | No |
| 166 | `ArchLucid.Api.ProblemDetails.ApplicationProblemMapper` | `ArchLucid.Api\ProblemDetails\ApplicationProblemMapper.cs` | 88.12 | 19 | No |
| 167 | `ArchLucid.Api.Controllers.Notifications.CustomerNotificationChannelPreferencesController` | `ArchLucid.Api\Controllers\Notifications\CustomerNotificationChannelPreferencesController.cs` | 88.46 | 6 | No |
| 168 | `ArchLucid.Api.Authentication.ApiKeyAuthenticationHandler` | `ArchLucid.Api\Authentication\ApiKeyAuthenticationHandler.cs` | 88.61 | 9 | No |
| 169 | `ArchLucid.Api.Services.Evolution.EvolutionSimulationReportBuilder` | `ArchLucid.Api\Services\Evolution\EvolutionSimulationReportBuilder.cs` | 88.89 | 12 | No |
| 170 | `ArchLucid.Api.Auth.Services.ArchLucidRoleClaimsTransformation` | `ArchLucid.Api\Auth\Services\ArchLucidRoleClaimsTransformation.cs` | 90.24 | 4 | No |

### ArchLucid.Persistence (33.84% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.ArtifactBundles.ArtifactBundleRelationalRead` | `ArchLucid.Persistence\ArtifactBundles\ArtifactBundleRelationalRead.cs` | 0.00 | 177 | No |
| 2 | `ArchLucid.Persistence.ArtifactBundles.ArtifactBundleTraceJsonReader` | `ArchLucid.Persistence\ArtifactBundles\ArtifactBundleTraceJsonReader.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Persistence.Audit.NoOpAuditEventChangeFeedHandler` | `ArchLucid.Persistence\Audit\NoOpAuditEventChangeFeedHandler.cs` | 0.00 | 1 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.ArtifactBundles.ArtifactBundleRelationalRead` | `ArchLucid.Persistence\ArtifactBundles\ArtifactBundleRelationalRead.cs` | 0.00 | 177 | No |
| 2 | `ArchLucid.Persistence.ArtifactBundles.ArtifactBundleTraceJsonReader` | `ArchLucid.Persistence\ArtifactBundles\ArtifactBundleTraceJsonReader.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Persistence.Audit.NoOpAuditEventChangeFeedHandler` | `ArchLucid.Persistence\Audit\NoOpAuditEventChangeFeedHandler.cs` | 0.00 | 1 | No |
| 4 | `ArchLucid.Persistence.Billing.BillingTrialConversionGate` | `ArchLucid.Persistence\Billing\BillingTrialConversionGate.cs` | 0.00 | 14 | No |
| 5 | `ArchLucid.Persistence.Billing.SqlBillingLedger` | `ArchLucid.Persistence\Billing\SqlBillingLedger.cs` | 0.00 | 163 | No |
| 6 | `ArchLucid.Persistence.BlobStore.ArtifactBundlePayloadBlobEnvelope` | `ArchLucid.Persistence\BlobStore\ArtifactBundlePayloadBlobEnvelope.cs` | 0.00 | 36 | No |
| 7 | `ArchLucid.Persistence.BlobStore.ArtifactBundlePersistContext` | `ArchLucid.Persistence\BlobStore\ArtifactBundlePersistContext.cs` | 0.00 | 1 | No |
| 8 | `ArchLucid.Persistence.Concurrency.SqlSessionDistributedCreateRunIdempotencyLock` | `ArchLucid.Persistence\Concurrency\SqlSessionDistributedCreateRunIdempotencyLock.cs` | 0.00 | 55 | No |
| 9 | `ArchLucid.Persistence.Connections.SqlPrimaryMirroredReadReplicaConnectionFactory` | `ArchLucid.Persistence\Connections\SqlPrimaryMirroredReadReplicaConnectionFactory.cs` | 0.00 | 4 | No |
| 10 | `ArchLucid.Persistence.ContextSnapshots.ContextSnapshotRelationalRead` | `ArchLucid.Persistence\ContextSnapshots\ContextSnapshotRelationalRead.cs` | 0.00 | 168 | No |
| 11 | `ArchLucid.Persistence.Cosmos.AgentTraceDocument` | `ArchLucid.Persistence\Cosmos\AgentTraceDocument.cs` | 0.00 | 6 | No |
| 12 | `ArchLucid.Persistence.Cosmos.AuditEventDocument` | `ArchLucid.Persistence\Cosmos\AuditEventDocument.cs` | 0.00 | 13 | No |
| 13 | `ArchLucid.Persistence.Cosmos.GraphSnapshotDocument` | `ArchLucid.Persistence\Cosmos\GraphSnapshotDocument.cs` | 0.00 | 9 | No |
| 14 | `ArchLucid.Persistence.Data.Infrastructure.ExternalDbConnection` | `ArchLucid.Persistence\Data\Infrastructure\ExternalDbConnection.cs` | 0.00 | 9 | No |
| 15 | `ArchLucid.Persistence.Data.Infrastructure.GreenfieldBaselineMigrationRunner` | `ArchLucid.Persistence\obj\Release\net10.0\System.Text.RegularExpressions.Generator\System.Text.RegularExpressions.Generator.RegexGenerator\RegexGenerator.g.cs` | 0.00 | 1 | No |
| 16 | `ArchLucid.Persistence.Data.Infrastructure.MigrationCatalogMutexScope` | `ArchLucid.Persistence\Data\Infrastructure\MigrationCatalogMutexScope.cs` | 0.00 | 33 | No |
| 17 | `ArchLucid.Persistence.Data.Repositories.ArchitectureRunListItem` | `ArchLucid.Persistence\Data\Repositories\ArchitectureRunListItem.cs` | 0.00 | 7 | No |
| 18 | `ArchLucid.Persistence.Data.Repositories.BackgroundJobRow` | `ArchLucid.Persistence\Data\Repositories\BackgroundJobRow.cs` | 0.00 | 12 | No |
| 19 | `ArchLucid.Persistence.Data.Repositories.ComparisonRecordSearchPredicateBuilder` | `ArchLucid.Persistence\Data\Repositories\ComparisonRecordSearchPredicateBuilder.cs` | 0.00 | 34 | No |
| 20 | `ArchLucid.Persistence.Data.Repositories.HostLeaderLeaseSnapshot` | `ArchLucid.Persistence\Data\Repositories\HostLeaderLeaseSnapshot.cs` | 0.00 | 3 | No |
| 21 | `ArchLucid.Persistence.Data.Repositories.NoOpAgentOutputEvaluationResultRepository` | `ArchLucid.Persistence\Data\Repositories\NoOpAgentOutputEvaluationResultRepository.cs` | 0.00 | 3 | No |
| 22 | `ArchLucid.Persistence.Data.Repositories.QueuedBackgroundJobPrepareResult` | `ArchLucid.Persistence\Data\Repositories\QueuedBackgroundJobPrepareResult.cs` | 0.00 | 5 | No |
| 23 | `ArchLucid.Persistence.Findings.FindingsSnapshotRelationalRead` | `ArchLucid.Persistence\Findings\FindingsSnapshotRelationalRead.cs` | 0.00 | 185 | No |
| 24 | `ArchLucid.Persistence.GoldenManifests.GoldenManifestPhase1RelationalRead` | `ArchLucid.Persistence\GoldenManifests\GoldenManifestPhase1RelationalRead.cs` | 0.00 | 258 | No |
| 25 | `ArchLucid.Persistence.Governance.CachingPolicyPackRepository` | `ArchLucid.Persistence\Governance\CachingPolicyPackRepository.cs` | 0.00 | 16 | No |
| 26 | `ArchLucid.Persistence.Governance.SqlExternalConnection` | `ArchLucid.Persistence\Governance\SqlExternalConnection.cs` | 0.00 | 11 | No |
| 27 | `ArchLucid.Persistence.GraphSnapshots.GraphSnapshotRelationalRead` | `ArchLucid.Persistence\GraphSnapshots\GraphSnapshotRelationalRead.cs` | 0.00 | 198 | No |
| 28 | `ArchLucid.Persistence.Identity.InMemoryNoTrialIdentityUserRepository` | `ArchLucid.Persistence\Identity\InMemoryNoTrialIdentityUserRepository.cs` | 0.00 | 7 | No |
| 29 | `ArchLucid.Persistence.Identity.SqlTrialIdentityUserRepository` | `ArchLucid.Persistence\Identity\SqlTrialIdentityUserRepository.cs` | 0.00 | 71 | No |
| 30 | `ArchLucid.Persistence.Notifications.DapperSentEmailLedger` | `ArchLucid.Persistence\Notifications\DapperSentEmailLedger.cs` | 0.00 | 18 | No |
| 31 | `ArchLucid.Persistence.Notifications.Email.AzureCommunicationEmailApi` | `ArchLucid.Persistence\Notifications\Email\AzureCommunicationEmailApi.cs` | 0.00 | 35 | No |
| 32 | `ArchLucid.Persistence.Notifications.Email.NoopEmailProvider` | `ArchLucid.Persistence\Notifications\Email\NoopEmailProvider.cs` | 0.00 | 2 | No |
| 33 | `ArchLucid.Persistence.Notifications.Email.SmtpEmailProvider` | `ArchLucid.Persistence\Notifications\Email\SmtpEmailProvider.cs` | 0.00 | 30 | No |
| 34 | `ArchLucid.Persistence.Notifications.InMemorySentEmailLedger` | `ArchLucid.Persistence\Notifications\InMemorySentEmailLedger.cs` | 0.00 | 5 | No |
| 35 | `ArchLucid.Persistence.Provenance.ProvenanceQueryService` | `ArchLucid.Persistence\Provenance\ProvenanceQueryService.cs` | 0.00 | 38 | No |
| 36 | `ArchLucid.Persistence.Queries.DapperArtifactQueryService` | `ArchLucid.Persistence\Queries\DapperArtifactQueryService.cs` | 0.00 | 11 | No |
| 37 | `ArchLucid.Persistence.Queries.InMemoryArtifactQueryService` | `ArchLucid.Persistence\Queries\InMemoryArtifactQueryService.cs` | 0.00 | 11 | No |
| 38 | `ArchLucid.Persistence.RelationalRead.SqlRelationalScalarCount` | `ArchLucid.Persistence\RelationalRead\SqlRelationalScalarCount.cs` | 0.00 | 3 | No |
| 39 | `ArchLucid.Persistence.Repositories.CachingGoldenManifestRepository` | `ArchLucid.Persistence\Repositories\CachingGoldenManifestRepository.cs` | 0.00 | 22 | No |
| 40 | `ArchLucid.Persistence.Repositories.RunConcurrencyConflictException` | `ArchLucid.Persistence\Repositories\RunConcurrencyConflictException.cs` | 0.00 | 4 | No |
| 41 | `ArchLucid.Persistence.Scoping.EmptyPersistenceScopeContextProvider` | `ArchLucid.Persistence\Scoping\EmptyPersistenceScopeContextProvider.cs` | 0.00 | 6 | No |
| 42 | `ArchLucid.Persistence.Sql.SqlSchemaBootstrapper` | `ArchLucid.Persistence\Sql\SqlSchemaBootstrapper.cs` | 0.00 | 14 | No |
| 43 | `ArchLucid.Persistence.Tenancy.DapperTenantRepository` | `ArchLucid.Persistence\Tenancy\DapperTenantRepository.cs` | 0.00 | 342 | No |
| 44 | `ArchLucid.Persistence.Tenancy.DapperTenantTrialEmailContactLookup` | `ArchLucid.Persistence\Tenancy\DapperTenantTrialEmailContactLookup.cs` | 0.00 | 14 | No |
| 45 | `ArchLucid.Persistence.Tenancy.DapperUsageEventRepository` | `ArchLucid.Persistence\Tenancy\DapperUsageEventRepository.cs` | 0.00 | 118 | No |
| 46 | `ArchLucid.Persistence.Tenancy.Diagnostics.DapperTrialFunnelOperationalMetricsReader` | `ArchLucid.Persistence\Tenancy\Diagnostics\DapperTrialFunnelOperationalMetricsReader.cs` | 0.00 | 14 | No |
| 47 | `ArchLucid.Persistence.Tenancy.NoOpTenantHardPurgeService` | `ArchLucid.Persistence\Tenancy\NoOpTenantHardPurgeService.cs` | 0.00 | 1 | No |
| 48 | `ArchLucid.Persistence.Tenancy.NullTenantTrialEmailContactLookup` | `ArchLucid.Persistence\Tenancy\NullTenantTrialEmailContactLookup.cs` | 0.00 | 1 | No |
| 49 | `ArchLucid.Persistence.Tenancy.SqlFirstSessionLifecycleHook` | `ArchLucid.Persistence\Tenancy\SqlFirstSessionLifecycleHook.cs` | 0.00 | 10 | No |
| 50 | `ArchLucid.Persistence.Tenancy.SqlTenantHardPurgeService` | `ArchLucid.Persistence\Tenancy\SqlTenantHardPurgeService.cs` | 0.00 | 263 | No |
| 51 | `ArchLucid.Persistence.Tenancy.SqlTenantOnboardingStateRepository` | `ArchLucid.Persistence\Tenancy\SqlTenantOnboardingStateRepository.cs` | 0.00 | 8 | No |
| 52 | `ArchLucid.Persistence.Tenancy.SqlTrialFunnelCommitHook` | `ArchLucid.Persistence\Tenancy\SqlTrialFunnelCommitHook.cs` | 0.00 | 37 | No |
| 53 | `ArchLucid.Persistence.Tenancy.TenantTierSql` | `ArchLucid.Persistence\Tenancy\TenantTierSql.cs` | 0.00 | 14 | No |
| 54 | `ArchLucid.Persistence.Tenancy.UsageMeterKindSql` | `ArchLucid.Persistence\Tenancy\UsageMeterKindSql.cs` | 0.00 | 20 | No |
| 55 | `System.Text.RegularExpressions.Generated` | `ArchLucid.Persistence\obj\Release\net10.0\System.Text.RegularExpressions.Generator\System.Text.RegularExpressions.Generator.RegexGenerator\RegexGenerator.g.cs` | 0.00 | 57 | No |
| 56 | `System.Text.RegularExpressions.Generated.<RegexGenerator_g>F784EB680C21B4686F463E7BD9AB24CC1A1B996DCF3A8FED908D40FD2DF951F37__MigrationNumberRegex_0` | `ArchLucid.Persistence\obj\Release\net10.0\System.Text.RegularExpressions.Generator\System.Text.RegularExpressions.Generator.RegexGenerator\RegexGenerator.g.cs` | 0.00 | 54 | No |
| 57 | `ArchLucid.Persistence.Tenancy.InMemoryUsageEventRepository` | `ArchLucid.Persistence\Tenancy\InMemoryUsageEventRepository.cs` | 3.57 | 27 | No |
| 58 | `ArchLucid.Persistence.Billing.Stripe.StripeBillingProvider` | `ArchLucid.Persistence\Billing\Stripe\StripeBillingProvider.cs` | 9.66 | 131 | No |
| 59 | `ArchLucid.Persistence.Data.Infrastructure.DatabaseMigrator` | `ArchLucid.Persistence\Data\Infrastructure\DatabaseMigrator.cs` | 12.50 | 42 | No |
| 60 | `ArchLucid.Persistence.Billing.BillingWebhookTrialActivator` | `ArchLucid.Persistence\Billing\BillingWebhookTrialActivator.cs` | 17.78 | 37 | No |
| 61 | `ArchLucid.Persistence.Data.Infrastructure.GreenfieldBaselineMigrationRunner` | `ArchLucid.Persistence\Data\Infrastructure\GreenfieldBaselineMigrationRunner.cs` | 20.75 | 126 | No |
| 62 | `ArchLucid.Persistence.Billing.InMemoryBillingLedger` | `ArchLucid.Persistence\Billing\InMemoryBillingLedger.cs` | 22.97 | 57 | No |
| 63 | `ArchLucid.Persistence.Governance.InMemoryPolicyPackVersionRepository` | `ArchLucid.Persistence\Governance\InMemoryPolicyPackVersionRepository.cs` | 25.45 | 41 | No |
| 64 | `ArchLucid.Persistence.Billing.AzureMarketplace.MicrosoftMarketplaceJwtVerifier` | `ArchLucid.Persistence\Billing\AzureMarketplace\MicrosoftMarketplaceJwtVerifier.cs` | 26.47 | 25 | No |
| 65 | `ArchLucid.Persistence.Repositories.GraphSnapshotEdgeRow` | `ArchLucid.Persistence\Repositories\GraphSnapshotEdgeIndexer.cs` | 28.57 | 5 | No |
| 66 | `ArchLucid.Persistence.Tenancy.InMemoryTenantRepository` | `ArchLucid.Persistence\Tenancy\InMemoryTenantRepository.cs` | 32.30 | 174 | No |
| 67 | `ArchLucid.Persistence.Metering.UsageMeteringService` | `ArchLucid.Persistence\Metering\UsageMeteringService.cs` | 33.33 | 14 | No |
| 68 | <code>ArchLucid.Persistence.Options.FixedOptionsMonitor`1</code> | `ArchLucid.Persistence\Options\FixedOptionsMonitor.cs` | 33.33 | 4 | No |
| 69 | `ArchLucid.Persistence.Caching.HotPathCacheEviction` | `ArchLucid.Persistence\Caching\HotPathCacheEviction.cs` | 35.71 | 9 | No |
| 70 | `ArchLucid.Persistence.BlobStore.LargePayloadOffloadEvaluator` | `ArchLucid.Persistence\BlobStore\LargePayloadOffloadEvaluator.cs` | 41.67 | 7 | No |
| 71 | `ArchLucid.Persistence.Repositories.CachingRunRepository` | `ArchLucid.Persistence\Repositories\CachingRunRepository.cs` | 43.75 | 27 | No |
| 72 | `ArchLucid.Persistence.Billing.AzureMarketplace.AzureMarketplaceBillingProvider` | `ArchLucid.Persistence\Billing\AzureMarketplace\AzureMarketplaceBillingProvider.cs` | 49.24 | 100 | No |
| 73 | `ArchLucid.Persistence.Serialization.GraphNodeJsonConverter` | `ArchLucid.Persistence\Serialization\GraphNodeJsonConverter.cs` | 57.14 | 21 | No |
| 74 | `ArchLucid.Persistence.Data.Repositories.InMemoryComparisonRecordRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryComparisonRecordRepository.cs` | 57.63 | 75 | No |
| 75 | `ArchLucid.Persistence.Serialization.GraphEdgeJsonConverter` | `ArchLucid.Persistence\Serialization\GraphEdgeJsonConverter.cs` | 62.50 | 15 | No |
| 76 | `ArchLucid.Persistence.Data.Repositories.NoOpHostLeaderLeaseRepository` | `ArchLucid.Persistence\Data\Repositories\NoOpHostLeaderLeaseRepository.cs` | 66.67 | 1 | No |
| 77 | `ArchLucid.Persistence.Caching.HotPathCacheKeys` | `ArchLucid.Persistence\Caching\HotPathCacheKeys.cs` | 70.00 | 3 | No |
| 78 | `ArchLucid.Persistence.Queries.DapperAuthorityQueryService` | `ArchLucid.Persistence\Queries\DapperAuthorityQueryService.cs` | 72.73 | 15 | No |
| 79 | `ArchLucid.Persistence.Queries.InMemoryAuthorityQueryService` | `ArchLucid.Persistence\Queries\InMemoryAuthorityQueryService.cs` | 72.73 | 15 | No |
| 80 | `ArchLucid.Persistence.Queries.RunSummaryDto` | `ArchLucid.Persistence\Queries\RunSummaryDto.cs` | 75.00 | 4 | No |
| 81 | `ArchLucid.Persistence.Findings.FindingPayloadJsonCodec` | `ArchLucid.Persistence\Findings\FindingPayloadJsonCodec.cs` | 78.95 | 4 | No |
| 82 | `ArchLucid.Persistence.Data.Repositories.InMemoryAgentEvaluationRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryAgentEvaluationRepository.cs` | 80.77 | 5 | No |
| 83 | `ArchLucid.Persistence.BlobStore.GoldenManifestPayloadBlobEnvelope` | `ArchLucid.Persistence\BlobStore\GoldenManifestPayloadBlobEnvelope.cs` | 82.35 | 15 | No |
| 84 | `ArchLucid.Persistence.Notifications.Email.AzureCommunicationServicesEmailProvider` | `ArchLucid.Persistence\Notifications\Email\AzureCommunicationServicesEmailProvider.cs` | 85.19 | 4 | No |
| 85 | `ArchLucid.Persistence.Connections.SqlReadReplicaConnectionStringResolver` | `ArchLucid.Persistence\Connections\SqlReadReplicaConnectionStringResolver.cs` | 87.50 | 2 | No |
| 86 | `ArchLucid.Persistence.Billing.BillingProviderRegistry` | `ArchLucid.Persistence\Billing\BillingProviderRegistry.cs` | 88.24 | 2 | No |
| 87 | `ArchLucid.Persistence.Data.Repositories.InMemoryAgentResultRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryAgentResultRepository.cs` | 88.57 | 4 | No |
| 88 | `ArchLucid.Persistence.Findings.FindingsSnapshotLegacyJsonReader` | `ArchLucid.Persistence\Findings\FindingsSnapshotLegacyJsonReader.cs` | 88.89 | 1 | No |
| 89 | `ArchLucid.Persistence.Connections.ReadReplicaRoutedConnectionFactory` | `ArchLucid.Persistence\Connections\ReadReplicaRoutedConnectionFactory.cs` | 90.48 | 2 | No |
| 90 | `ArchLucid.Persistence.Data.Repositories.InMemoryDecisionNodeRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryDecisionNodeRepository.cs` | 91.67 | 2 | No |
| 91 | `ArchLucid.Persistence.Data.Repositories.InMemoryArchitectureRequestRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryArchitectureRequestRepository.cs` | 92.86 | 1 | No |
| 92 | `ArchLucid.Persistence.Governance.InMemoryPolicyPackChangeLogRepository` | `ArchLucid.Persistence\Governance\InMemoryPolicyPackChangeLogRepository.cs` | 92.86 | 4 | No |
| 93 | `ArchLucid.Persistence.Data.Repositories.InMemoryCoordinatorGoldenManifestRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryCoordinatorGoldenManifestRepository.cs` | 93.33 | 1 | No |
| 94 | `ArchLucid.Persistence.Data.Repositories.InMemoryRunExportRecordRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryRunExportRecordRepository.cs` | 93.55 | 2 | No |
| 95 | `ArchLucid.Persistence.Data.Repositories.InMemoryGovernanceApprovalRequestRepository` | `ArchLucid.Persistence\Data\Repositories\InMemoryGovernanceApprovalRequestRepository.cs` | 93.75 | 6 | No |
| 96 | `ArchLucid.Persistence.Repositories.InMemoryRunRepository` | `ArchLucid.Persistence\Repositories\InMemoryRunRepository.cs` | 94.35 | 7 | No |
| 97 | `ArchLucid.Persistence.Conversation.InMemoryConversationMessageRepository` | `ArchLucid.Persistence\Conversation\InMemoryConversationMessageRepository.cs` | 94.74 | 1 | No |

### ArchLucid.Application (52.54% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Application.Analysis.ComparisonAuditService` | `ArchLucid.Application\Analysis\ComparisonAuditService.cs` | 0.00 | 59 | No |
| 2 | `ArchLucid.Application.Analysis.ComparisonDriftReportExportService` | `ArchLucid.Application\Analysis\ComparisonDriftReportExportService.cs` | 0.00 | 26 | No |
| 3 | `ArchLucid.Application.Analysis.ComparisonRecordPayloadRehydrator` | `ArchLucid.Application\Analysis\ComparisonRecordPayloadRehydrator.cs` | 0.00 | 22 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Application.Analysis.ComparisonAuditService` | `ArchLucid.Application\Analysis\ComparisonAuditService.cs` | 0.00 | 59 | No |
| 2 | `ArchLucid.Application.Analysis.ComparisonDriftReportExportService` | `ArchLucid.Application\Analysis\ComparisonDriftReportExportService.cs` | 0.00 | 26 | No |
| 3 | `ArchLucid.Application.Analysis.ComparisonRecordPayloadRehydrator` | `ArchLucid.Application\Analysis\ComparisonRecordPayloadRehydrator.cs` | 0.00 | 22 | No |
| 4 | `ArchLucid.Application.Analysis.ComparisonReplayService` | `ArchLucid.Application\Analysis\ComparisonReplayService.cs` | 0.00 | 191 | No |
| 5 | `ArchLucid.Application.Analysis.ConsultingDocxArchitectureAnalysisExportService` | `ArchLucid.Application\Analysis\ConsultingDocxArchitectureAnalysisExportService.cs` | 0.00 | 13 | No |
| 6 | `ArchLucid.Application.Analysis.ConsultingDocxCoverPageBuilder` | `ArchLucid.Application\Analysis\ConsultingDocxCoverPageBuilder.cs` | 0.00 | 27 | No |
| 7 | `ArchLucid.Application.Analysis.ConsultingDocxExportProfileSelector` | `ArchLucid.Application\Analysis\ConsultingDocxExportProfileSelector.cs` | 0.00 | 22 | No |
| 8 | `ArchLucid.Application.Analysis.ConsultingDocxFindingsSectionBuilder` | `ArchLucid.Application\Analysis\ConsultingDocxFindingsSectionBuilder.cs` | 0.00 | 24 | No |
| 9 | `ArchLucid.Application.Analysis.ConsultingDocxOpenXmlComposer` | `ArchLucid.Application\Analysis\ConsultingDocxOpenXmlComposer.cs` | 0.00 | 46 | No |
| 10 | `ArchLucid.Application.Analysis.ConsultingDocxOpenXmlPrimitives` | `ArchLucid.Application\Analysis\ConsultingDocxOpenXmlPrimitives.cs` | 0.00 | 175 | No |
| 11 | `ArchLucid.Application.Analysis.ConsultingDocxProfileRecommendation` | `ArchLucid.Application\Analysis\ConsultingDocxProfileRecommendation.cs` | 0.00 | 4 | No |
| 12 | `ArchLucid.Application.Analysis.ConsultingDocxProfileRecommendationRequest` | `ArchLucid.Application\Analysis\ConsultingDocxProfileRecommendationRequest.cs` | 0.00 | 7 | No |
| 13 | `ArchLucid.Application.Analysis.ConsultingDocxRecommendationsSectionBuilder` | `ArchLucid.Application\Analysis\ConsultingDocxRecommendationsSectionBuilder.cs` | 0.00 | 7 | No |
| 14 | `ArchLucid.Application.Analysis.ConsultingDocxSupplementalSections` | `ArchLucid.Application\Analysis\ConsultingDocxSupplementalSections.cs` | 0.00 | 185 | No |
| 15 | `ArchLucid.Application.Analysis.ConsultingDocxTemplateOptions` | `ArchLucid.Application\Analysis\ConsultingDocxTemplateOptions.cs` | 0.00 | 33 | No |
| 16 | `ArchLucid.Application.Analysis.ConsultingDocxTemplateProfileCatalog` | `ArchLucid.Application\Analysis\ConsultingDocxTemplateProfileCatalog.cs` | 0.00 | 1 | No |
| 17 | `ArchLucid.Application.Analysis.ConsultingDocxTemplateProfileInfo` | `ArchLucid.Application\Analysis\ConsultingDocxTemplateProfileCatalog.cs` | 0.00 | 3 | No |
| 18 | `ArchLucid.Application.Analysis.ConsultingDocxTemplateRecommendationService` | `ArchLucid.Application\Analysis\ConsultingDocxTemplateRecommendationService.cs` | 0.00 | 55 | No |
| 19 | `ArchLucid.Application.Analysis.DefaultConsultingDocxTemplateOptionsProvider` | `ArchLucid.Application\Analysis\DefaultConsultingDocxTemplateOptionsProvider.cs` | 0.00 | 2 | No |
| 20 | `ArchLucid.Application.Analysis.DefaultConsultingDocxTemplateProfileResolver` | `ArchLucid.Application\Analysis\DefaultConsultingDocxTemplateProfileResolver.cs` | 0.00 | 30 | No |
| 21 | `ArchLucid.Application.Analysis.DocxArchitectureAnalysisExportService` | `ArchLucid.Application\Analysis\DocxArchitectureAnalysisExportService.cs` | 0.00 | 119 | No |
| 22 | `ArchLucid.Application.Analysis.DriftReportDocxExport` | `ArchLucid.Application\Analysis\DriftReportDocxExport.cs` | 0.00 | 25 | No |
| 23 | `ArchLucid.Application.Analysis.ExportRecordDiffExportService` | `ArchLucid.Application\Analysis\ExportRecordDiffExportService.cs` | 0.00 | 32 | No |
| 24 | `ArchLucid.Application.Analysis.ExportRecordDiffService` | `ArchLucid.Application\Analysis\ExportRecordDiffService.cs` | 0.00 | 73 | No |
| 25 | `ArchLucid.Application.Analysis.MarkdownArchitectureAnalysisExportService` | `ArchLucid.Application\Analysis\MarkdownArchitectureAnalysisExportService.cs` | 0.00 | 239 | No |
| 26 | `ArchLucid.Application.Analysis.MarkdownEndToEndReplayComparisonSummaryFormatter` | `ArchLucid.Application\Analysis\MarkdownEndToEndReplayComparisonSummaryFormatter.cs` | 0.00 | 45 | No |
| 27 | `ArchLucid.Application.Analysis.OpenXmlDocxDocumentBuilder` | `ArchLucid.Application\Analysis\OpenXmlDocxDocumentBuilder.cs` | 0.00 | 107 | No |
| 28 | `ArchLucid.Application.Analysis.ResolvedConsultingDocxExportProfile` | `ArchLucid.Application\Analysis\ResolvedConsultingDocxExportProfile.cs` | 0.00 | 4 | No |
| 29 | `ArchLucid.Application.Analysis.RunExportAuditService` | `ArchLucid.Application\Analysis\RunExportAuditService.cs` | 0.00 | 41 | No |
| 30 | `ArchLucid.Application.Determinism.DeterminismVersionConstants` | `ArchLucid.Application\Determinism\DeterminismVersionConstants.cs` | 0.00 | 1 | No |
| 31 | `ArchLucid.Application.Diagrams.MermaidDiagramGenerator` | `ArchLucid.Application\Diagrams\MermaidDiagramGenerator.cs` | 0.00 | 24 | No |
| 32 | `ArchLucid.Application.Diffs.MarkdownAgentResultDiffSummaryFormatter` | `ArchLucid.Application\Diffs\MarkdownAgentResultDiffSummaryFormatter.cs` | 0.00 | 44 | No |
| 33 | `ArchLucid.Application.Diffs.MarkdownManifestDiffExportService` | `ArchLucid.Application\Diffs\MarkdownManifestDiffExportService.cs` | 0.00 | 36 | No |
| 34 | `ArchLucid.Application.Diffs.MarkdownManifestDiffSummaryFormatter` | `ArchLucid.Application\Diffs\MarkdownManifestDiffSummaryFormatter.cs` | 0.00 | 51 | No |
| 35 | `ArchLucid.Application.Evidence.DefaultEvidenceBuilder` | `ArchLucid.Application\Evidence\DefaultEvidenceBuilder.cs` | 0.00 | 142 | No |
| 36 | `ArchLucid.Application.Evidence.MarkdownEvidenceSummaryFormatter` | `ArchLucid.Application\Evidence\MarkdownEvidenceSummaryFormatter.cs` | 0.00 | 85 | No |
| 37 | `ArchLucid.Application.Explanation.RunRationaleService` | `ArchLucid.Application\Explanation\RunRationaleService.cs` | 0.00 | 169 | No |
| 38 | `ArchLucid.Application.Identity.TrialBootstrapEmailVerificationPolicy` | `ArchLucid.Application\Identity\TrialBootstrapEmailVerificationPolicy.cs` | 0.00 | 17 | No |
| 39 | `ArchLucid.Application.Identity.TrialEmailNormalizer` | `ArchLucid.Application\Identity\TrialEmailNormalizer.cs` | 0.00 | 3 | No |
| 40 | `ArchLucid.Application.Identity.TrialEmailVerificationTokenHasher` | `ArchLucid.Application\Identity\TrialEmailVerificationTokenHasher.cs` | 0.00 | 3 | No |
| 41 | `ArchLucid.Application.Identity.TrialLocalAuthResult` | `ArchLucid.Application\Identity\ITrialLocalIdentityService.cs` | 0.00 | 3 | No |
| 42 | `ArchLucid.Application.Identity.TrialLocalIdentityService` | `ArchLucid.Application\Identity\TrialLocalIdentityService.cs` | 0.00 | 81 | No |
| 43 | `ArchLucid.Application.Identity.TrialLocalRegistrationResult` | `ArchLucid.Application\Identity\ITrialLocalIdentityService.cs` | 0.00 | 2 | No |
| 44 | `ArchLucid.Application.Jobs.BackgroundJobWorkUnitExecutor` | `ArchLucid.Application\Jobs\BackgroundJobWorkUnitExecutor.cs` | 0.00 | 51 | No |
| 45 | `ArchLucid.Application.Notifications.Email.TrialLifecycleEmailDispatcher` | `ArchLucid.Application\Notifications\Email\TrialLifecycleEmailDispatcher.cs` | 0.00 | 184 | No |
| 46 | `ArchLucid.Application.Notifications.Email.TrialLifecycleEmailIntegrationEnvelope` | `ArchLucid.Application\Notifications\Email\TrialLifecycleEmailIntegrationEnvelope.cs` | 0.00 | 7 | No |
| 47 | `ArchLucid.Application.Notifications.Email.TrialLifecycleIntegrationEventPublisher` | `ArchLucid.Application\Notifications\Email\TrialLifecycleIntegrationEventPublisher.cs` | 0.00 | 21 | No |
| 48 | `ArchLucid.Application.Summaries.MarkdownManifestSummaryGenerator` | `ArchLucid.Application\Summaries\MarkdownManifestSummaryGenerator.cs` | 0.00 | 113 | No |
| 49 | `ArchLucid.Application.Notifications.Email.TrialScheduledLifecycleEmailScanner` | `ArchLucid.Application\Notifications\Email\TrialScheduledLifecycleEmailScanner.cs` | 17.22 | 125 | No |
| 50 | `ArchLucid.Application.Analysis.EndToEndReplayComparisonExportService` | `ArchLucid.Application\Analysis\EndToEndReplayComparisonExportService.cs` | 21.43 | 319 | No |
| 51 | `ArchLucid.Application.Jobs.AnalysisReportDocxJobPayload` | `ArchLucid.Application\Jobs\AnalysisReportDocxJobPayload.cs` | 27.91 | 31 | No |
| 52 | `ArchLucid.Application.Governance.GovernanceLineageService` | `ArchLucid.Application\Governance\GovernanceLineageService.cs` | 28.05 | 59 | No |
| 53 | `ArchLucid.Application.Analysis.ArchitectureAnalysisService` | `ArchLucid.Application\Analysis\ArchitectureAnalysisService.cs` | 39.18 | 59 | No |
| 54 | `ArchLucid.Application.Analysis.EndToEndComparisonExportProfile` | `ArchLucid.Application\Analysis\EndToEndComparisonExportProfile.cs` | 50.00 | 3 | No |
| 55 | `ArchLucid.Application.Analysis.ExportRecordRequestDiff` | `ArchLucid.Application\Analysis\ExportRecordRequestDiff.cs` | 50.00 | 2 | No |
| 56 | `ArchLucid.Application.Audit.RunPipelineTimelineItemDto` | `ArchLucid.Application\Audit\RunPipelineTimelineItemDto.cs` | 50.00 | 3 | No |
| 57 | `ArchLucid.Application.ConflictException` | `ArchLucid.Application\ConflictException.cs` | 50.00 | 2 | No |
| 58 | `ArchLucid.Application.ReplayAuthorityRunRecordFactory` | `ArchLucid.Application\ReplayAuthorityRunRecordFactory.cs` | 51.85 | 13 | No |
| 59 | `ArchLucid.Application.Governance.ApprovalSlaMonitor` | `ArchLucid.Application\Governance\ApprovalSlaMonitor.cs` | 52.94 | 40 | No |
| 60 | `ArchLucid.Application.Analysis.ComparisonReplayCostEstimator` | `ArchLucid.Application\Analysis\ComparisonReplayCostEstimator.cs` | 54.12 | 39 | No |
| 61 | `ArchLucid.Application.Runs.Orchestration.RunCreateIdempotencyGateCache` | `ArchLucid.Application\Runs\Orchestration\RunCreateIdempotencyGateCache.cs` | 57.58 | 14 | No |
| 62 | `ArchLucid.Application.Runs.Orchestration.ArchitectureRunCommitOrchestrator` | `ArchLucid.Application\Runs\Orchestration\ArchitectureRunCommitOrchestrator.cs` | 60.26 | 184 | No |
| 63 | `ArchLucid.Application.Decisions.DefaultAgentEvaluationService` | `ArchLucid.Application\Decisions\DefaultAgentEvaluationService.cs` | 64.29 | 5 | No |
| 64 | `ArchLucid.Application.Tenancy.TrialLifecycleTransitionEngine` | `ArchLucid.Application\Tenancy\TrialLifecycleTransitionEngine.cs` | 64.95 | 34 | No |
| 65 | `ArchLucid.Application.Analysis.ComparisonVerificationFailedException` | `ArchLucid.Application\Analysis\ComparisonVerificationFailedException.cs` | 66.67 | 2 | No |
| 66 | `ArchLucid.Application.Diagrams.DiagramIdSanitizer` | `ArchLucid.Application\Diagrams\DiagramIdSanitizer.cs` | 66.67 | 3 | No |
| 67 | `ArchLucid.Application.Notifications.Email.RazorLightEmailTemplateRenderer` | `ArchLucid.Application\Notifications\Email\RazorLightEmailTemplateRenderer.cs` | 66.67 | 5 | No |
| 68 | `ArchLucid.Application.Tenancy.TrialLifecyclePolicy` | `ArchLucid.Application\Tenancy\TrialLifecyclePolicy.cs` | 68.25 | 20 | No |
| 69 | `ArchLucid.Application.Manifests.ManifestPresentation` | `ArchLucid.Application\Manifests\ManifestPresentation.cs` | 68.42 | 6 | No |
| 70 | `ArchLucid.Application.Runs.Orchestration.ArchitectureRunCreateOrchestrator` | `ArchLucid.Application\Runs\Orchestration\ArchitectureRunCreateOrchestrator.cs` | 69.38 | 94 | No |
| 71 | `ArchLucid.Application.Analysis.ArchitectureAnalysisReport` | `ArchLucid.Application\Analysis\ArchitectureAnalysisReport.cs` | 70.00 | 3 | No |
| 72 | `ArchLucid.Application.Runs.Orchestration.ArchitectureRunExecuteOrchestrator` | `ArchLucid.Application\Runs\Orchestration\ArchitectureRunExecuteOrchestrator.cs` | 70.28 | 85 | No |
| 73 | `ArchLucid.Application.Architecture.ArchitectureRunProvenanceService` | `ArchLucid.Application\Architecture\ArchitectureRunProvenanceService.cs` | 71.64 | 97 | No |
| 74 | `ArchLucid.Application.Analysis.ComparisonReplayRequestParsing` | `ArchLucid.Application\Analysis\ComparisonReplayRequestParsing.cs` | 72.22 | 5 | No |
| 75 | `ArchLucid.Application.Architecture.CommittedManifestTraceabilityRules` | `ArchLucid.Application\Architecture\CommittedManifestTraceabilityRules.cs` | 75.00 | 7 | No |
| 76 | `ArchLucid.Application.Tenancy.TrialTenantBootstrapService` | `ArchLucid.Application\Tenancy\TrialTenantBootstrapService.cs` | 76.00 | 24 | No |
| 77 | `ArchLucid.Application.Analysis.MarkdownDriftReportFormatter` | `ArchLucid.Application\Analysis\MarkdownDriftReportFormatter.cs` | 77.08 | 11 | No |
| 78 | `ArchLucid.Application.ReplayRunService` | `ArchLucid.Application\ReplayRunService.cs` | 78.16 | 38 | No |
| 79 | `ArchLucid.Application.Governance.Preview.GovernancePreviewService` | `ArchLucid.Application\Governance\Preview\GovernancePreviewService.cs` | 78.43 | 22 | No |
| 80 | `ArchLucid.Application.Determinism.DeterminismCheckService` | `ArchLucid.Application\Determinism\DeterminismCheckService.cs` | 80.00 | 16 | No |
| 81 | `ArchLucid.Application.Evolution.SimulationEvaluationRequest` | `ArchLucid.Application\Evolution\SimulationEvaluationRequest.cs` | 80.00 | 1 | No |
| 82 | `ArchLucid.Application.Analysis.ReplayComparisonResult` | `ArchLucid.Application\Analysis\ReplayComparisonResult.cs` | 82.35 | 3 | No |
| 83 | `ArchLucid.Application.Runs.Orchestration.CoordinatorRunFailedDurableAudit` | `ArchLucid.Application\Runs\Orchestration\CoordinatorRunFailedDurableAudit.cs` | 83.33 | 4 | No |
| 84 | `ArchLucid.Application.Analysis.EndToEndReplayComparisonService` | `ArchLucid.Application\Analysis\EndToEndReplayComparisonService.cs` | 83.96 | 17 | No |
| 85 | `ArchLucid.Application.Billing.MarketplaceChangeQuantityWebhookMutationHandler` | `ArchLucid.Application\Billing\MarketplaceChangeQuantityWebhookMutationHandler.cs` | 84.21 | 3 | No |
| 86 | `ArchLucid.Application.Diffs.ManifestDiffService` | `ArchLucid.Application\Diffs\ManifestDiffService.cs` | 85.15 | 15 | No |
| 87 | `ArchLucid.Application.Runs.Mapping.RunRecordToArchitectureRunMapper` | `ArchLucid.Application\Runs\Mapping\RunRecordToArchitectureRunMapper.cs` | 85.19 | 4 | No |
| 88 | `ArchLucid.Application.Billing.MarketplaceChangePlanWebhookMutationHandler` | `ArchLucid.Application\Billing\MarketplaceChangePlanWebhookMutationHandler.cs` | 85.71 | 3 | No |
| 89 | `ArchLucid.Application.Governance.GovernanceApprovalReviewConflictException` | `ArchLucid.Application\Governance\GovernanceApprovalReviewConflictException.cs` | 85.71 | 2 | No |
| 90 | `ArchLucid.Application.Identity.PwnedPasswordRangeClient` | `ArchLucid.Application\Identity\PwnedPasswordRangeClient.cs` | 85.71 | 6 | No |
| 91 | `ArchLucid.Application.Tenancy.TenantSlugNormalizer` | `ArchLucid.Application\Tenancy\TenantSlugNormalizer.cs` | 85.71 | 3 | No |
| 92 | `ArchLucid.Application.RunDetailQueryService` | `ArchLucid.Application\RunDetailQueryService.cs` | 85.90 | 11 | No |
| 93 | `ArchLucid.Application.Tenancy.TenantProvisioningService` | `ArchLucid.Application\Tenancy\TenantProvisioningService.cs` | 86.59 | 11 | No |
| 94 | `ArchLucid.Application.Tenancy.TrialLimitGate` | `ArchLucid.Application\Tenancy\TrialLimitGate.cs` | 86.79 | 7 | No |
| 95 | `ArchLucid.Application.Governance.Preview.GovernanceManifestComparer` | `ArchLucid.Application\Governance\Preview\GovernanceManifestComparer.cs` | 87.04 | 7 | No |
| 96 | `ArchLucid.Application.Evolution.SimulationEvaluationService` | `ArchLucid.Application\Evolution\SimulationEvaluationService.cs` | 87.50 | 22 | No |
| 97 | `ArchLucid.Application.Governance.GovernanceDashboardService` | `ArchLucid.Application\Governance\GovernanceDashboardService.cs` | 87.88 | 4 | No |
| 98 | `ArchLucid.Application.Diagrams.ManifestDiagramService` | `ArchLucid.Application\Diagrams\ManifestDiagramService.cs` | 88.57 | 12 | No |
| 99 | `ArchLucid.Application.Tenancy.TrialSeatAccountant` | `ArchLucid.Application\Tenancy\TrialSeatAccountant.cs` | 88.89 | 1 | No |
| 100 | `ArchLucid.Application.Governance.GovernanceWorkflowService` | `ArchLucid.Application\Governance\GovernanceWorkflowService.cs` | 88.94 | 51 | No |
| 101 | `ArchLucid.Application.Common.BaselineMutationAuditService` | `ArchLucid.Application\Common\BaselineMutationAuditService.cs` | 89.47 | 2 | No |
| 102 | `ArchLucid.Application.Jobs.BackgroundJobInfo` | `ArchLucid.Application\Jobs\BackgroundJobInfo.cs` | 90.91 | 1 | No |
| 103 | `ArchLucid.Application.Analysis.ArchitectureAnalysisRequest` | `ArchLucid.Application\Analysis\ArchitectureAnalysisRequest.cs` | 92.86 | 1 | No |
| 104 | `ArchLucid.Application.Governance.GovernanceRationaleService` | `ArchLucid.Application\Governance\GovernanceRationaleService.cs` | 93.02 | 3 | No |
| 105 | `ArchLucid.Application.Notifications.Email.TrialEmailIdempotencyKeys` | `ArchLucid.Application\Notifications\Email\TrialEmailIdempotencyKeys.cs` | 94.44 | 1 | No |
| 106 | `ArchLucid.Application.Runs.ArchitectureRunAuthorityReader` | `ArchLucid.Application\Runs\ArchitectureRunAuthorityReader.cs` | 94.74 | 1 | No |

### ArchLucid.ArtifactSynthesis (56.54% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.ArtifactSynthesis.Generators.ArchitectureNarrativeArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\ArchitectureNarrativeArtifactGenerator.cs` | 0.00 | 76 | No |
| 2 | `ArchLucid.ArtifactSynthesis.Generators.ComplianceMatrixArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\ComplianceMatrixArtifactGenerator.cs` | 0.00 | 27 | No |
| 3 | `ArchLucid.ArtifactSynthesis.Generators.CostSummaryArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\CostSummaryArtifactGenerator.cs` | 0.00 | 20 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.ArtifactSynthesis.Generators.ArchitectureNarrativeArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\ArchitectureNarrativeArtifactGenerator.cs` | 0.00 | 76 | No |
| 2 | `ArchLucid.ArtifactSynthesis.Generators.ComplianceMatrixArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\ComplianceMatrixArtifactGenerator.cs` | 0.00 | 27 | No |
| 3 | `ArchLucid.ArtifactSynthesis.Generators.CostSummaryArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\CostSummaryArtifactGenerator.cs` | 0.00 | 20 | No |
| 4 | `ArchLucid.ArtifactSynthesis.Generators.CoverageSummaryArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\CoverageSummaryArtifactGenerator.cs` | 0.00 | 23 | No |
| 5 | `ArchLucid.ArtifactSynthesis.Generators.DiagramAstGenerator` | `ArchLucid.ArtifactSynthesis\Generators\DiagramAstGenerator.cs` | 0.00 | 53 | No |
| 6 | `ArchLucid.ArtifactSynthesis.Generators.ReferenceArchitectureMarkdownGenerator` | `ArchLucid.ArtifactSynthesis\Generators\ReferenceArchitectureMarkdownGenerator.cs` | 0.00 | 76 | No |
| 7 | `ArchLucid.ArtifactSynthesis.Generators.UnresolvedIssuesArtifactGenerator` | `ArchLucid.ArtifactSynthesis\Generators\UnresolvedIssuesArtifactGenerator.cs` | 0.00 | 24 | No |
| 8 | `ArchLucid.ArtifactSynthesis.Models.ComplianceMatrixArtifactModel` | `ArchLucid.ArtifactSynthesis\Models\ComplianceMatrixArtifactModel.cs` | 0.00 | 1 | No |
| 9 | `ArchLucid.ArtifactSynthesis.Models.CostSummaryArtifactModel` | `ArchLucid.ArtifactSynthesis\Models\CostSummaryArtifactModel.cs` | 0.00 | 3 | No |
| 10 | `ArchLucid.ArtifactSynthesis.Models.CoverageSummaryArtifactModel` | `ArchLucid.ArtifactSynthesis\Models\CoverageSummaryArtifactModel.cs` | 0.00 | 6 | No |
| 11 | `ArchLucid.ArtifactSynthesis.Models.UnresolvedIssueArtifactItem` | `ArchLucid.ArtifactSynthesis\Models\UnresolvedIssueArtifactItem.cs` | 0.00 | 4 | No |
| 12 | `ArchLucid.ArtifactSynthesis.Models.UnresolvedIssuesArtifactModel` | `ArchLucid.ArtifactSynthesis\Models\UnresolvedIssuesArtifactModel.cs` | 0.00 | 1 | No |
| 13 | `ArchLucid.ArtifactSynthesis.Renderers.MermaidDiagramRenderer` | `ArchLucid.ArtifactSynthesis\Renderers\MermaidDiagramRenderer.cs` | 0.00 | 10 | No |
| 14 | `ArchLucid.ArtifactSynthesis.Repositories.InMemoryArtifactBundleRepository` | `ArchLucid.ArtifactSynthesis\Repositories\InMemoryArtifactBundleRepository.cs` | 11.76 | 15 | No |
| 15 | `ArchLucid.ArtifactSynthesis.Docx.DocxExportService` | `ArchLucid.ArtifactSynthesis\Docx\DocxExportService.cs` | 51.25 | 156 | No |
| 16 | `ArchLucid.ArtifactSynthesis.Docx.Builders.WordDocumentBuilder` | `ArchLucid.ArtifactSynthesis\Docx\Builders\WordDocumentBuilder.cs` | 56.83 | 60 | No |
| 17 | `ArchLucid.ArtifactSynthesis.Services.ArtifactSynthesisService` | `ArchLucid.ArtifactSynthesis\Services\ArtifactSynthesisService.cs` | 69.64 | 17 | No |
| 18 | `ArchLucid.ArtifactSynthesis.Services.ArtifactBundleValidator` | `ArchLucid.ArtifactSynthesis\Services\ArtifactBundleValidator.cs` | 81.82 | 4 | No |
| 19 | `ArchLucid.ArtifactSynthesis.Docx.Helpers.ImageHelper` | `ArchLucid.ArtifactSynthesis\Docx\Helpers\ImageHelper.cs` | 86.96 | 9 | No |
| 20 | `ArchLucid.ArtifactSynthesis.Docx.TemplateLoader` | `ArchLucid.ArtifactSynthesis\Docx\TemplateLoader.cs` | 92.86 | 1 | No |
| 21 | `ArchLucid.ArtifactSynthesis.Packaging.ArtifactPackagingService` | `ArchLucid.ArtifactSynthesis\Packaging\ArtifactPackagingService.cs` | 94.53 | 7 | No |

### ArchLucid.Retrieval (58.55% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Retrieval.Chunking.SimpleTextChunker` | `ArchLucid.Retrieval\Chunking\SimpleTextChunker.cs` | 0.00 | 12 | No |
| 2 | `ArchLucid.Retrieval.Embedding.FakeEmbeddingService` | `ArchLucid.Retrieval\Embedding\FakeEmbeddingService.cs` | 0.00 | 8 | No |
| 3 | `ArchLucid.Retrieval.Indexing.RetrievalDocumentBuilder` | `ArchLucid.Retrieval\Indexing\RetrievalDocumentBuilder.cs` | 0.00 | 70 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Retrieval.Chunking.SimpleTextChunker` | `ArchLucid.Retrieval\Chunking\SimpleTextChunker.cs` | 0.00 | 12 | No |
| 2 | `ArchLucid.Retrieval.Embedding.FakeEmbeddingService` | `ArchLucid.Retrieval\Embedding\FakeEmbeddingService.cs` | 0.00 | 8 | No |
| 3 | `ArchLucid.Retrieval.Indexing.RetrievalDocumentBuilder` | `ArchLucid.Retrieval\Indexing\RetrievalDocumentBuilder.cs` | 0.00 | 70 | No |
| 4 | `ArchLucid.Retrieval.Indexing.RetrievalRunCompletionIndexer` | `ArchLucid.Retrieval\Indexing\RetrievalRunCompletionIndexer.cs` | 12.50 | 21 | No |
| 5 | `ArchLucid.Retrieval.Embedding.CircuitBreakingOpenAiEmbeddingClient` | `ArchLucid.Retrieval\Embedding\CircuitBreakingOpenAiEmbeddingClient.cs` | 75.61 | 10 | No |
| 6 | `ArchLucid.Retrieval.Models.RetrievalDocument` | `ArchLucid.Retrieval\Models\RetrievalDocument.cs` | 91.67 | 1 | No |

### ArchLucid.Host.Core (62.47% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Host.Core.Configuration.DataConsistencyEnforcementOptions` | `ArchLucid.Host.Core\Configuration\DataConsistencyEnforcementOptions.cs` | 0.00 | 6 | No |
| 2 | `ArchLucid.Host.Core.Configuration.DataConsistencyProbeOptions` | `ArchLucid.Host.Core\Configuration\DataConsistencyProbeOptions.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Host.Core.Configuration.Secrets.EnvironmentVariableSecretProvider` | `ArchLucid.Host.Core\Configuration\Secrets\EnvironmentVariableSecretProvider.cs` | 0.00 | 6 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Host.Core.Configuration.DataConsistencyEnforcementOptions` | `ArchLucid.Host.Core\Configuration\DataConsistencyEnforcementOptions.cs` | 0.00 | 6 | No |
| 2 | `ArchLucid.Host.Core.Configuration.DataConsistencyProbeOptions` | `ArchLucid.Host.Core\Configuration\DataConsistencyProbeOptions.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Host.Core.Configuration.Secrets.EnvironmentVariableSecretProvider` | `ArchLucid.Host.Core\Configuration\Secrets\EnvironmentVariableSecretProvider.cs` | 0.00 | 6 | No |
| 4 | `ArchLucid.Host.Core.Configuration.Secrets.KeyVaultSecretProvider` | `ArchLucid.Host.Core\Configuration\Secrets\KeyVaultSecretProvider.cs` | 0.00 | 21 | No |
| 5 | `ArchLucid.Host.Core.Health.BlobStorageHealthCheck` | `ArchLucid.Host.Core\Health\BlobStorageHealthCheck.cs` | 0.00 | 16 | No |
| 6 | `ArchLucid.Host.Core.Health.ComplianceRulePackHealthCheck` | `ArchLucid.Host.Core\Health\ComplianceRulePackHealthCheck.cs` | 0.00 | 7 | No |
| 7 | `ArchLucid.Host.Core.Health.ProcessTempDirectoryHealthCheck` | `ArchLucid.Host.Core\Health\ProcessTempDirectoryHealthCheck.cs` | 0.00 | 16 | No |
| 8 | `ArchLucid.Host.Core.Health.RunGoldenManifestConsistencyHealthCheck` | `ArchLucid.Host.Core\Health\RunGoldenManifestConsistencyHealthCheck.cs` | 0.00 | 23 | No |
| 9 | `ArchLucid.Host.Core.Health.SchemaFilesHealthCheck` | `ArchLucid.Host.Core\Health\SchemaFilesHealthCheck.cs` | 0.00 | 33 | No |
| 10 | `ArchLucid.Host.Core.Integration.IntegrationEventServiceBusMessageDispatch` | `ArchLucid.Host.Core\Integration\IntegrationEventServiceBusMessageDispatch.cs` | 0.00 | 50 | No |
| 11 | `ArchLucid.Host.Core.Integration.ProcessMessageEventArgsSettlement` | `ArchLucid.Host.Core\Integration\IntegrationEventPeekLockSettlements.cs` | 0.00 | 3 | No |
| 12 | `ArchLucid.Host.Core.Integration.ServiceBusReceiverSettlement` | `ArchLucid.Host.Core\Integration\IntegrationEventPeekLockSettlements.cs` | 0.00 | 3 | No |
| 13 | `ArchLucid.Host.Core.Integration.TrialLifecycleEmailIntegrationEventHandler` | `ArchLucid.Host.Core\Integration\TrialLifecycleEmailIntegrationEventHandler.cs` | 0.00 | 26 | No |
| 14 | `ArchLucid.Host.Core.Jobs.AzureBlobBackgroundJobResultBlobAccessor` | `ArchLucid.Host.Core\Jobs\AzureBlobBackgroundJobResultBlobAccessor.cs` | 0.00 | 34 | No |
| 15 | `ArchLucid.Host.Core.Jobs.AzureStorageQueueBackgroundJobNotifySender` | `ArchLucid.Host.Core\Jobs\AzureStorageQueueBackgroundJobNotifySender.cs` | 0.00 | 6 | No |
| 16 | `ArchLucid.Host.Core.Jobs.BackgroundJobPersistenceMapper` | `ArchLucid.Host.Core\Jobs\BackgroundJobPersistenceMapper.cs` | 0.00 | 15 | No |
| 17 | `ArchLucid.Host.Core.Jobs.BackgroundJobQueueAddress` | `ArchLucid.Host.Core\Jobs\BackgroundJobQueueAddress.cs` | 0.00 | 11 | No |
| 18 | `ArchLucid.Host.Core.Jobs.BackgroundJobQueueProcessorHostedService` | `ArchLucid.Host.Core\Jobs\BackgroundJobQueueProcessorHostedService.cs` | 0.00 | 102 | No |
| 19 | `ArchLucid.Host.Core.Jobs.DurableBackgroundJobQueue` | `ArchLucid.Host.Core\Jobs\DurableBackgroundJobQueue.cs` | 0.00 | 46 | No |
| 20 | `ArchLucid.Host.Core.Services.Ask.AskService` | `ArchLucid.Host.Core\Services\Ask\AskService.cs` | 0.00 | 220 | No |
| 21 | `ArchLucid.Host.Core.Services.Ask.ContextBuilder` | `ArchLucid.Host.Core\Services\Ask\ContextBuilder.cs` | 0.00 | 82 | No |
| 22 | `ArchLucid.Host.Core.Services.ComparisonReplayApiService` | `ArchLucid.Host.Core\Services\ComparisonReplayApiService.cs` | 0.00 | 58 | No |
| 23 | `ArchLucid.Host.Core.Startup.WorkerHostPipelineExtensions` | `ArchLucid.Host.Core\Startup\WorkerHostPipelineExtensions.cs` | 0.00 | 68 | No |
| 24 | `ArchLucid.Host.Core.Services.Delivery.CloudEventsWrappingWebhookPoster` | `ArchLucid.Host.Core\Services\Delivery\CloudEventsWrappingWebhookPoster.cs` | 8.33 | 33 | No |
| 25 | `ArchLucid.Host.Core.DataConsistency.DataConsistencyOrphanProbeExecutor` | `ArchLucid.Host.Core\DataConsistency\DataConsistencyOrphanProbeExecutor.cs` | 9.70 | 149 | No |
| 26 | `ArchLucid.Host.Core.Services.Delivery.FakeEmailSender` | `ArchLucid.Host.Core\Services\Delivery\FakeEmailSender.cs` | 14.29 | 6 | No |
| 27 | `ArchLucid.Host.Core.Hosted.AuthorityPipelineWorkProcessor` | `ArchLucid.Host.Core\Hosted\AuthorityPipelineWorkProcessor.cs` | 15.22 | 78 | No |
| 28 | `ArchLucid.Host.Core.Hosted.DataConsistencyOrphanProbeHostedService` | `ArchLucid.Host.Core\Hosted\DataConsistencyOrphanProbeHostedService.cs` | 31.25 | 22 | No |
| 29 | `ArchLucid.Host.Core.Notifications.Email.TrialLifecycleEmailPublishingAuditDecorator` | `ArchLucid.Host.Core\Notifications\Email\TrialLifecycleEmailPublishingAuditDecorator.cs` | 32.56 | 58 | No |
| 30 | `ArchLucid.Host.Core.Startup.Validation.Rules.E2EHarnessRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\E2eHarnessRules.cs` | 33.33 | 6 | No |
| 31 | `ArchLucid.Host.Core.Jobs.ServiceBusIntegrationEventsArchLucidJob` | `ArchLucid.Host.Core\Jobs\ServiceBusIntegrationEventsArchLucidJob.cs` | 36.00 | 48 | No |
| 32 | `ArchLucid.Host.Core.Services.ReplayDiagnosticsEntry` | `ArchLucid.Host.Core\Services\ReplayDiagnosticsEntry.cs` | 41.67 | 7 | No |
| 33 | `ArchLucid.Host.Core.Startup.ArchLucidPersistenceStartup` | `ArchLucid.Host.Core\Startup\ArchLucidPersistenceStartup.cs` | 45.24 | 23 | No |
| 34 | `ArchLucid.Host.Core.Services.AuditRetryDrainHostedService` | `ArchLucid.Host.Core\Services\AuditRetryDrainHostedService.cs` | 48.39 | 16 | No |
| 35 | `ArchLucid.Host.Core.Configuration.E2EHarnessOptions` | `ArchLucid.Host.Core\Configuration\E2eHarnessOptions.cs` | 50.00 | 1 | No |
| 36 | `ArchLucid.Host.Core.Configuration.ObservabilityTracingOptions` | `ArchLucid.Host.Core\Configuration\ObservabilityTracingOptions.cs` | 50.00 | 1 | No |
| 37 | `ArchLucid.Host.Core.Integration.NullIntegrationEventPublisher` | `ArchLucid.Host.Core\Integration\NullIntegrationEventPublisher.cs` | 50.00 | 3 | No |
| 38 | `ArchLucid.Host.Core.Services.PolicyPacksAppService` | `ArchLucid.Host.Core\Services\PolicyPacksAppService.cs` | 50.77 | 32 | No |
| 39 | `ArchLucid.Host.Core.Startup.LlmPromptRedactionProductionWarningPostConfigure` | `ArchLucid.Host.Core\Startup\LlmPromptRedactionProductionWarningPostConfigure.cs` | 52.63 | 9 | No |
| 40 | `ArchLucid.Host.Core.Configuration.ArchLucidLegacyConfigurationWarnings` | `ArchLucid.Host.Core\Configuration\ArchLucidLegacyConfigurationWarnings.cs` | 57.89 | 8 | No |
| 41 | `ArchLucid.Host.Core.Integration.LoggingIntegrationEventHandler` | `ArchLucid.Host.Core\Integration\LoggingIntegrationEventHandler.cs` | 61.11 | 7 | No |
| 42 | `ArchLucid.Host.Core.Startup.Validation.Rules.HostLeaderElectionRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\HostLeaderElectionRules.cs` | 68.42 | 6 | No |
| 43 | `ArchLucid.Host.Core.Jobs.JobRunTelemetry` | `ArchLucid.Host.Core\Jobs\JobRunTelemetry.cs` | 70.59 | 15 | No |
| 44 | `ArchLucid.Host.Core.Startup.RlsBypassPolicyBootstrap` | `ArchLucid.Host.Core\Startup\RlsBypassPolicyBootstrap.cs` | 72.22 | 5 | No |
| 45 | `ArchLucid.Host.Core.Startup.Validation.Rules.BackgroundJobsRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\BackgroundJobsRules.cs` | 75.00 | 6 | No |
| 46 | `ArchLucid.Host.Core.Startup.ObservabilityExtensions` | `ArchLucid.Host.Core\Startup\ObservabilityExtensions.cs` | 75.25 | 25 | No |
| 47 | `ArchLucid.Host.Core.Services.ArchitectureApplicationService` | `ArchLucid.Host.Core\Services\ArchitectureApplicationService.cs` | 76.13 | 37 | No |
| 48 | `ArchLucid.Host.Core.Startup.Validation.Rules.DataArchivalRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\DataArchivalRules.cs` | 76.92 | 3 | No |
| 49 | `ArchLucid.Host.Core.ProblemDetails.ProblemErrorCodes` | `ArchLucid.Host.Core\ProblemDetails\ProblemErrorCodes.cs` | 77.08 | 11 | No |
| 50 | `ArchLucid.Host.Core.Hosted.TrialLifecycleEmailScanHostedService` | `ArchLucid.Host.Core\Hosted\TrialLifecycleEmailScanHostedService.cs` | 78.57 | 6 | No |
| 51 | `ArchLucid.Host.Core.Startup.Validation.Rules.LlmTokenQuotaRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\LlmTokenQuotaRules.cs` | 80.00 | 4 | No |
| 52 | `ArchLucid.Host.Core.Hosted.TrialLifecycleSchedulerHostedService` | `ArchLucid.Host.Core\Hosted\TrialLifecycleSchedulerHostedService.cs` | 80.56 | 7 | No |
| 53 | `ArchLucid.Host.Core.Jobs.InMemoryBackgroundJobQueue` | `ArchLucid.Host.Core\Jobs\InMemoryBackgroundJobQueue.cs` | 81.25 | 24 | No |
| 54 | `ArchLucid.Host.Core.ProblemDetails.ProblemSupportHints` | `ArchLucid.Host.Core\ProblemDetails\ProblemSupportHints.cs` | 81.40 | 8 | No |
| 55 | `ArchLucid.Host.Core.Hosted.IntegrationEventOutboxHostedService` | `ArchLucid.Host.Core\Hosted\IntegrationEventOutboxHostedService.cs` | 81.48 | 5 | No |
| 56 | `ArchLucid.Host.Core.Jobs.AuditEventChangeFeedArchLucidJob` | `ArchLucid.Host.Core\Jobs\AuditEventChangeFeedArchLucidJob.cs` | 82.61 | 4 | No |
| 57 | `ArchLucid.Host.Core.Hosted.TenantHealthScoringHostedService` | `ArchLucid.Host.Core\Hosted\TenantHealthScoringHostedService.cs` | 82.86 | 6 | No |
| 58 | `ArchLucid.Host.Core.Startup.Diagnostics.StartupConfigurationFactsReader` | `ArchLucid.Host.Core\Startup\Diagnostics\StartupConfigurationFacts.cs` | 82.93 | 7 | No |
| 59 | `ArchLucid.Host.Core.Health.SqlConnectionHealthCheck` | `ArchLucid.Host.Core\Health\SqlConnectionHealthCheck.cs` | 83.33 | 3 | No |
| 60 | `ArchLucid.Host.Core.Hosted.OutboxOperationalMetricsHostedService` | `ArchLucid.Host.Core\Hosted\OutboxOperationalMetricsHostedService.cs` | 83.33 | 7 | No |
| 61 | `ArchLucid.Host.Core.Startup.Validation.Rules.ContentSafetyRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\ContentSafetyRules.cs` | 83.33 | 3 | No |
| 62 | `ArchLucid.Host.Core.Diagnostics.FakeAgentResultFactory` | `ArchLucid.Host.Core\Diagnostics\FakeAgentResultFactory.cs` | 83.38 | 57 | No |
| 63 | `ArchLucid.Host.Core.Jobs.DataArchivalArchLucidJob` | `ArchLucid.Host.Core\Jobs\DataArchivalArchLucidJob.cs` | 83.87 | 5 | No |
| 64 | `ArchLucid.Host.Core.Middleware.PrometheusScrapeAuthMiddleware` | `ArchLucid.Host.Core\Middleware\PrometheusScrapeAuthMiddleware.cs` | 86.79 | 7 | No |
| 65 | `ArchLucid.Host.Core.Jobs.ArchLucidJobsOffload` | `ArchLucid.Host.Core\Jobs\ArchLucidJobsOffload.cs` | 87.50 | 1 | No |
| 66 | `ArchLucid.Host.Core.Hosted.HostLeaderElectionCoordinator` | `ArchLucid.Host.Core\Hosted\HostLeaderElectionCoordinator.cs` | 87.65 | 10 | No |
| 67 | `ArchLucid.Host.Core.Jobs.TrialLifecycleArchLucidJob` | `ArchLucid.Host.Core\Jobs\TrialLifecycleArchLucidJob.cs` | 88.00 | 3 | No |
| 68 | `ArchLucid.Host.Core.Jobs.OrphanProbeArchLucidJob` | `ArchLucid.Host.Core\Jobs\OrphanProbeArchLucidJob.cs` | 88.24 | 2 | No |
| 69 | `ArchLucid.Host.Core.Jobs.AdvisoryScanArchLucidJob` | `ArchLucid.Host.Core\Jobs\AdvisoryScanArchLucidJob.cs` | 90.00 | 2 | No |
| 70 | `ArchLucid.Host.Core.Jobs.TrialEmailScanArchLucidJob` | `ArchLucid.Host.Core\Jobs\TrialEmailScanArchLucidJob.cs` | 90.00 | 2 | No |
| 71 | `ArchLucid.Host.Core.Startup.Validation.Rules.ContainerJobsOffloadRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\ContainerJobsOffloadRules.cs` | 90.48 | 2 | No |
| 72 | `ArchLucid.Host.Core.Startup.Validation.Rules.LlmCompletionCacheRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\LlmCompletionCacheRules.cs` | 90.62 | 3 | No |
| 73 | `ArchLucid.Host.Core.Hosted.DataArchivalHostedService` | `ArchLucid.Host.Core\Hosted\DataArchivalHostedService.cs` | 91.89 | 3 | No |
| 74 | `ArchLucid.Host.Core.Hosted.AuthorityPipelineWorkHostedService` | `ArchLucid.Host.Core\Hosted\AuthorityPipelineWorkHostedService.cs` | 92.59 | 2 | No |
| 75 | `ArchLucid.Host.Core.Hosted.RetrievalIndexingOutboxHostedService` | `ArchLucid.Host.Core\Hosted\RetrievalIndexingOutboxHostedService.cs` | 92.59 | 2 | No |
| 76 | `ArchLucid.Host.Core.Authority.FeatureManagementAuthorityPipelineModeResolver` | `ArchLucid.Host.Core\Authority\FeatureManagementAuthorityPipelineModeResolver.cs` | 92.86 | 1 | No |
| 77 | `ArchLucid.Host.Core.Startup.Validation.Rules.SchemaValidationRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\SchemaValidationRules.cs` | 92.86 | 2 | No |
| 78 | `ArchLucid.Host.Core.Startup.Validation.Rules.AgentExecutionRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\AgentExecutionRules.cs` | 93.10 | 2 | No |
| 79 | `ArchLucid.Host.Core.Startup.Validation.Rules.ApiDeprecationRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\ApiDeprecationRules.cs` | 93.75 | 1 | No |
| 80 | `ArchLucid.Host.Core.Startup.Validation.Rules.CosmosPolyglotRules` | `ArchLucid.Host.Core\Startup\Validation\Rules\CosmosPolyglotRules.cs` | 94.12 | 1 | No |
| 81 | `ArchLucid.Host.Core.Services.CircuitBreakerAuditBridge` | `ArchLucid.Host.Core\Services\CircuitBreakerAuditBridge.cs` | 94.19 | 5 | No |
| 82 | `ArchLucid.Host.Core.Hosted.DataArchivalHostIteration` | `ArchLucid.Host.Core\Hosted\DataArchivalHostIteration.cs` | 94.29 | 2 | No |

### ArchLucid.ContextIngestion (69.42% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.ContextIngestion.Connectors.InlineRequirementsConnector` | `ArchLucid.ContextIngestion\Connectors\InlineRequirementsConnector.cs` | 0.00 | 23 | No |
| 2 | `ArchLucid.ContextIngestion.Connectors.SecurityBaselineHintsConnector` | `ArchLucid.ContextIngestion\Connectors\SecurityBaselineHintsConnector.cs` | 0.00 | 24 | No |
| 3 | `ArchLucid.ContextIngestion.Connectors.StaticRequestContextConnector` | `ArchLucid.ContextIngestion\Connectors\StaticRequestContextConnector.cs` | 0.00 | 23 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.ContextIngestion.Connectors.InlineRequirementsConnector` | `ArchLucid.ContextIngestion\Connectors\InlineRequirementsConnector.cs` | 0.00 | 23 | No |
| 2 | `ArchLucid.ContextIngestion.Connectors.SecurityBaselineHintsConnector` | `ArchLucid.ContextIngestion\Connectors\SecurityBaselineHintsConnector.cs` | 0.00 | 24 | No |
| 3 | `ArchLucid.ContextIngestion.Connectors.StaticRequestContextConnector` | `ArchLucid.ContextIngestion\Connectors\StaticRequestContextConnector.cs` | 0.00 | 23 | No |
| 4 | `ArchLucid.ContextIngestion.Infrastructure.ContextConnectorPipeline` | `ArchLucid.ContextIngestion\Infrastructure\ContextConnectorPipeline.cs` | 0.00 | 18 | No |
| 5 | `ArchLucid.ContextIngestion.Infrastructure.ContextDocumentParserPipeline` | `ArchLucid.ContextIngestion\Infrastructure\ContextDocumentParserPipeline.cs` | 0.00 | 6 | No |
| 6 | `ArchLucid.ContextIngestion.Repositories.InMemoryContextSnapshotRepository` | `ArchLucid.ContextIngestion\Repositories\InMemoryContextSnapshotRepository.cs` | 26.92 | 19 | No |
| 7 | `ArchLucid.ContextIngestion.Connectors.InfrastructureDeclarationConnector` | `ArchLucid.ContextIngestion\Connectors\InfrastructureDeclarationConnector.cs` | 41.38 | 17 | No |
| 8 | `ArchLucid.ContextIngestion.Canonicalization.CanonicalInfrastructureEnricher` | `ArchLucid.ContextIngestion\Canonicalization\CanonicalInfrastructureEnricher.cs` | 50.00 | 20 | No |
| 9 | `ArchLucid.ContextIngestion.Infrastructure.JsonInfrastructureDeclarationParser` | `ArchLucid.ContextIngestion\Infrastructure\JsonInfrastructureDeclarationParser.cs` | 65.45 | 19 | No |
| 10 | `ArchLucid.ContextIngestion.Canonicalization.CanonicalDeduplicator` | `ArchLucid.ContextIngestion\Canonicalization\CanonicalDeduplicator.cs` | 66.67 | 5 | No |
| 11 | `ArchLucid.ContextIngestion.Connectors.PolicyReferenceConnector` | `ArchLucid.ContextIngestion\Connectors\PolicyReferenceConnector.cs` | 70.27 | 11 | No |
| 12 | `ArchLucid.ContextIngestion.Connectors.TopologyHintsConnector` | `ArchLucid.ContextIngestion\Connectors\TopologyHintsConnector.cs` | 72.73 | 9 | No |
| 13 | `ArchLucid.ContextIngestion.Models.RawContextPayload` | `ArchLucid.ContextIngestion\Models\RawContextPayload.cs` | 85.71 | 1 | No |
| 14 | `ArchLucid.ContextIngestion.Infrastructure.TerraformShowJsonInfrastructureDeclarationParser` | `ArchLucid.ContextIngestion\Infrastructure\TerraformShowJsonInfrastructureDeclarationParser.cs` | 86.14 | 14 | No |

### ArchLucid.Persistence.Alerts (75.73% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.Simulation.AlertSimulationContextProvider` | `ArchLucid.Persistence.Alerts\Simulation\AlertSimulationContextProvider.cs` | 33.75 | 53 | No |
| 2 | `ArchLucid.Persistence.AlertService` | `ArchLucid.Persistence.Alerts\AlertService.cs` | 51.20 | 61 | No |
| 3 | `ArchLucid.Persistence.Simulation.RuleSimulationService` | `ArchLucid.Persistence.Alerts\Simulation\RuleSimulationService.cs` | 55.17 | 104 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.Simulation.AlertSimulationContextProvider` | `ArchLucid.Persistence.Alerts\Simulation\AlertSimulationContextProvider.cs` | 33.75 | 53 | No |
| 2 | `ArchLucid.Persistence.AlertService` | `ArchLucid.Persistence.Alerts\AlertService.cs` | 51.20 | 61 | No |
| 3 | `ArchLucid.Persistence.Simulation.RuleSimulationService` | `ArchLucid.Persistence.Alerts\Simulation\RuleSimulationService.cs` | 55.17 | 104 | No |
| 4 | `ArchLucid.Persistence.AlertSuppressionPolicy` | `ArchLucid.Persistence.Alerts\AlertSuppressionPolicy.cs` | 82.35 | 9 | No |
| 5 | `ArchLucid.Persistence.InMemoryAlertRuleRepository` | `ArchLucid.Persistence.Alerts\InMemoryAlertRuleRepository.cs` | 93.94 | 2 | No |

### ArchLucid.Persistence.Runtime (76.03% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.BlobStore.AzureBlobArtifactBlobStore` | `ArchLucid.Persistence.Runtime\BlobStore\AzureBlobArtifactBlobStore.cs` | 0.00 | 29 | No |
| 2 | `ArchLucid.Persistence.BlobStore.NullArtifactBlobStore` | `ArchLucid.Persistence.Runtime\BlobStore\NullArtifactBlobStore.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Persistence.Caching.DistributedHotPathReadCache` | `ArchLucid.Persistence.Runtime\Caching\DistributedHotPathReadCache.cs` | 0.00 | 56 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.BlobStore.AzureBlobArtifactBlobStore` | `ArchLucid.Persistence.Runtime\BlobStore\AzureBlobArtifactBlobStore.cs` | 0.00 | 29 | No |
| 2 | `ArchLucid.Persistence.BlobStore.NullArtifactBlobStore` | `ArchLucid.Persistence.Runtime\BlobStore\NullArtifactBlobStore.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Persistence.Caching.DistributedHotPathReadCache` | `ArchLucid.Persistence.Runtime\Caching\DistributedHotPathReadCache.cs` | 0.00 | 56 | No |
| 4 | `ArchLucid.Persistence.Orchestration.AuthorityPipelineWorkOutboxEntry` | `ArchLucid.Persistence.Runtime\Orchestration\AuthorityPipelineWorkOutboxEntry.cs` | 0.00 | 7 | No |
| 5 | `ArchLucid.Persistence.Transactions.InMemoryArchLucidUnitOfWork` | `ArchLucid.Persistence.Runtime\Transactions\InMemoryArchLucidUnitOfWork.cs` | 0.00 | 6 | No |
| 6 | `ArchLucid.Persistence.Transactions.InMemoryArchLucidUnitOfWorkFactory` | `ArchLucid.Persistence.Runtime\Transactions\InMemoryArchLucidUnitOfWorkFactory.cs` | 0.00 | 1 | No |
| 7 | `ArchLucid.Persistence.Orchestration.InMemoryAuthorityPipelineWorkRepository` | `ArchLucid.Persistence.Runtime\Orchestration\InMemoryAuthorityPipelineWorkRepository.cs` | 28.57 | 20 | No |
| 8 | `ArchLucid.Persistence.Orchestration.AuthorityPipelineWorkPayloadJson` | `ArchLucid.Persistence.Runtime\Orchestration\AuthorityPipelineWorkPayloadJson.cs` | 50.00 | 3 | No |
| 9 | `ArchLucid.Persistence.BlobStore.InMemoryArtifactBlobStore` | `ArchLucid.Persistence.Runtime\BlobStore\InMemoryArtifactBlobStore.cs` | 57.14 | 3 | No |
| 10 | `ArchLucid.Persistence.BlobStore.LocalFileArtifactBlobStore` | `ArchLucid.Persistence.Runtime\BlobStore\LocalFileArtifactBlobStore.cs` | 84.21 | 9 | No |
| 11 | `ArchLucid.Persistence.BlobStore.ArtifactBlobTenantPaths` | `ArchLucid.Persistence.Runtime\BlobStore\ArtifactBlobTenantPaths.cs` | 84.38 | 5 | No |
| 12 | `ArchLucid.Persistence.Orchestration.AuthorityRunOrchestrator` | `ArchLucid.Persistence.Runtime\Orchestration\AuthorityRunOrchestrator.cs` | 85.52 | 42 | No |
| 13 | `ArchLucid.Persistence.Orchestration.Pipeline.AuthorityPipelineStagesExecutor` | `ArchLucid.Persistence.Runtime\Orchestration\Pipeline\AuthorityPipelineStagesExecutor.cs` | 90.51 | 24 | No |

### ArchLucid.AgentRuntime (76.40% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.AgentRuntime.AgentResultSchemaViolationAudit` | `ArchLucid.AgentRuntime\AgentResultSchemaViolationAudit.cs` | 0.00 | 42 | No |
| 2 | `ArchLucid.AgentRuntime.CostAgentHandler` | `ArchLucid.AgentRuntime\CostAgentHandler.cs` | 0.00 | 10 | No |
| 3 | `ArchLucid.AgentRuntime.DistributedLlmCompletionResponseStore` | `ArchLucid.AgentRuntime\DistributedLlmCompletionResponseStore.cs` | 0.00 | 21 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.AgentRuntime.AgentResultSchemaViolationAudit` | `ArchLucid.AgentRuntime\AgentResultSchemaViolationAudit.cs` | 0.00 | 42 | No |
| 2 | `ArchLucid.AgentRuntime.CostAgentHandler` | `ArchLucid.AgentRuntime\CostAgentHandler.cs` | 0.00 | 10 | No |
| 3 | `ArchLucid.AgentRuntime.DistributedLlmCompletionResponseStore` | `ArchLucid.AgentRuntime\DistributedLlmCompletionResponseStore.cs` | 0.00 | 21 | No |
| 4 | `ArchLucid.AgentRuntime.Evaluation.AgentOutputTraceEvaluationHook` | `ArchLucid.AgentRuntime\Evaluation\AgentOutputTraceEvaluationHook.cs` | 0.00 | 5 | No |
| 5 | `ArchLucid.AgentRuntime.Evaluation.ReferenceCases.AgentOutputReferenceCaseCatalog` | `ArchLucid.AgentRuntime\Evaluation\ReferenceCases\AgentOutputReferenceCaseCatalog.cs` | 0.00 | 63 | No |
| 6 | `ArchLucid.AgentRuntime.LlmTelemetryLabelOptions` | `ArchLucid.AgentRuntime\LlmTelemetryLabelOptions.cs` | 0.00 | 2 | No |
| 7 | `ArchLucid.AgentRuntime.LlmCompletionAccountingClient` | `ArchLucid.AgentRuntime\LlmCompletionAccountingClient.cs` | 22.68 | 75 | No |
| 8 | `ArchLucid.AgentRuntime.AgentPromptActivityTags` | `ArchLucid.AgentRuntime\AgentPromptActivityTags.cs` | 40.00 | 6 | No |
| 9 | `ArchLucid.AgentRuntime.Evaluation.ReferenceCases.AgentExecutionReferenceEvaluationOptions` | `ArchLucid.AgentRuntime\Evaluation\ReferenceCases\AgentExecutionReferenceEvaluationOptions.cs` | 50.00 | 1 | No |
| 10 | `ArchLucid.AgentRuntime.Safety.ContentSafetyEnabledButUnconfiguredGuard` | `ArchLucid.AgentRuntime\Safety\ContentSafetyEnabledButUnconfiguredGuard.cs` | 50.00 | 1 | No |
| 11 | `ArchLucid.AgentRuntime.Evaluation.ReferenceCases.AgentOutputReferenceCaseRunEvaluator` | `ArchLucid.AgentRuntime\Evaluation\ReferenceCases\AgentOutputReferenceCaseRunEvaluator.cs` | 55.74 | 54 | No |
| 12 | `ArchLucid.AgentRuntime.AgentCompletionTokenUsage` | `ArchLucid.AgentRuntime\AgentCompletionTokenUsage.cs` | 57.14 | 3 | No |
| 13 | `ArchLucid.AgentRuntime.TopologyAgentHandler` | `ArchLucid.AgentRuntime\TopologyAgentHandler.cs` | 57.96 | 66 | No |
| 14 | `ArchLucid.AgentRuntime.Safety.AzureContentSafetyGuard` | `ArchLucid.AgentRuntime\Safety\AzureContentSafetyGuard.cs` | 60.42 | 19 | No |
| 15 | `ArchLucid.AgentRuntime.CriticAgentHandler` | `ArchLucid.AgentRuntime\CriticAgentHandler.cs` | 62.82 | 58 | No |
| 16 | `ArchLucid.AgentRuntime.ComplianceAgentHandler` | `ArchLucid.AgentRuntime\ComplianceAgentHandler.cs` | 63.29 | 58 | No |
| 17 | `ArchLucid.AgentRuntime.Evaluation.AgentOutputEvaluationRecorder` | `ArchLucid.AgentRuntime\Evaluation\AgentOutputEvaluationRecorder.cs` | 64.06 | 23 | No |
| 18 | `ArchLucid.AgentRuntime.AgentResultSchemaViolationException` | `ArchLucid.AgentRuntime\AgentResultSchemaViolationException.cs` | 80.00 | 2 | No |
| 19 | `ArchLucid.AgentRuntime.LlmProviderDescriptor` | `ArchLucid.AgentRuntime\LlmProviderDescriptor.cs` | 80.56 | 7 | No |
| 20 | `ArchLucid.AgentRuntime.Explanation.ExplanationService` | `ArchLucid.AgentRuntime\Explanation\ExplanationService.cs` | 81.29 | 29 | No |
| 21 | `ArchLucid.AgentRuntime.LlmCallResilienceDefaults` | `ArchLucid.AgentRuntime\LlmCallResilienceDefaults.cs` | 81.67 | 11 | No |
| 22 | `ArchLucid.AgentRuntime.AgentExecutionTraceRecorder` | `ArchLucid.AgentRuntime\AgentExecutionTraceRecorder.cs` | 82.11 | 68 | No |
| 23 | `ArchLucid.AgentRuntime.AgentResultParser` | `ArchLucid.AgentRuntime\AgentResultParser.cs` | 83.08 | 11 | No |
| 24 | `ArchLucid.AgentRuntime.FallbackAgentCompletionClient` | `ArchLucid.AgentRuntime\FallbackAgentCompletionClient.cs` | 83.33 | 6 | No |
| 25 | `ArchLucid.AgentRuntime.Evaluation.AgentOutputEvaluationHarness` | `ArchLucid.AgentRuntime\Evaluation\AgentOutputEvaluationHarness.cs` | 84.75 | 9 | No |
| 26 | `ArchLucid.AgentRuntime.Explanation.DeterministicExplanationService` | `ArchLucid.AgentRuntime\Explanation\DeterministicExplanationService.cs` | 85.64 | 28 | No |
| 27 | `ArchLucid.AgentRuntime.Explanation.CachingRunExplanationSummaryService` | `ArchLucid.AgentRuntime\Explanation\CachingRunExplanationSummaryService.cs` | 87.80 | 5 | No |
| 28 | `ArchLucid.AgentRuntime.LlmTokenQuotaWindowTracker` | `ArchLucid.AgentRuntime\LlmTokenQuotaWindowTracker.cs` | 89.13 | 5 | No |
| 29 | `ArchLucid.AgentRuntime.Explanation.RunExplanationCitationBuilder` | `ArchLucid.AgentRuntime\Explanation\RunExplanationCitationBuilder.cs` | 90.00 | 2 | No |
| 30 | `ArchLucid.AgentRuntime.MemoryLlmCompletionResponseStore` | `ArchLucid.AgentRuntime\MemoryLlmCompletionResponseStore.cs` | 90.48 | 2 | No |
| 31 | `ArchLucid.AgentRuntime.LlmCostEstimator` | `ArchLucid.AgentRuntime\LlmCostEstimator.cs` | 90.91 | 1 | No |
| 32 | `ArchLucid.AgentRuntime.Explanation.RunExplanationSummaryService` | `ArchLucid.AgentRuntime\Explanation\RunExplanationSummaryService.cs` | 91.73 | 11 | No |
| 33 | `ArchLucid.AgentRuntime.RealAgentExecutor` | `ArchLucid.AgentRuntime\RealAgentExecutor.cs` | 92.24 | 9 | No |
| 34 | `ArchLucid.AgentRuntime.CircuitBreakingAgentCompletionClient` | `ArchLucid.AgentRuntime\CircuitBreakingAgentCompletionClient.cs` | 93.33 | 2 | No |
| 35 | `ArchLucid.AgentRuntime.Prompts.CachedAgentSystemPromptCatalog` | `ArchLucid.AgentRuntime\Prompts\CachedAgentSystemPromptCatalog.cs` | 94.59 | 2 | No |

### ArchLucid.Host.Composition (78.04% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.CosmosPolyglotPersistence.cs` | 17.86 | 23 | No |
| 2 | `ArchLucid.Host.Composition.Configuration.ArchLucidStorageServiceCollectionExtensions` | `ArchLucid.Host.Composition\Configuration\ArchLucidStorageServiceCollectionExtensions.cs` | 57.32 | 67 | No |
| 3 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.DataHealthAndJobs.cs` | 62.12 | 25 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.CosmosPolyglotPersistence.cs` | 17.86 | 23 | No |
| 2 | `ArchLucid.Host.Composition.Configuration.ArchLucidStorageServiceCollectionExtensions` | `ArchLucid.Host.Composition\Configuration\ArchLucidStorageServiceCollectionExtensions.cs` | 57.32 | 67 | No |
| 3 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.DataHealthAndJobs.cs` | 62.12 | 25 | No |
| 4 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.AgentsGovernanceRetrieval.cs` | 69.35 | 152 | No |
| 5 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.TenancyMeteringSecrets.cs` | 76.92 | 9 | No |
| 6 | `ArchLucid.Host.Composition.Configuration.SqlStorageProviderRegistrar` | `ArchLucid.Host.Composition\Configuration\SqlStorageProviderRegistrar.cs` | 88.24 | 16 | No |
| 7 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.SchedulingAndAlerts.cs` | 90.18 | 11 | No |
| 8 | `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` | `ArchLucid.Host.Composition\Startup\ServiceCollectionExtensions.CoordinatorAndArtifacts.cs` | 91.86 | 7 | No |

### ArchLucid.Persistence.Coordination (79.33% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.Coordination.Compliance.PolicyFilteredComplianceRulePackProvider` | `ArchLucid.Persistence.Coordination\Compliance\PolicyFilteredComplianceRulePackProvider.cs` | 0.00 | 11 | No |
| 2 | `ArchLucid.Persistence.Coordination.Evolution.InMemoryEvolutionCandidateChangeSetRepository` | `ArchLucid.Persistence.Coordination\Evolution\InMemoryEvolutionCandidateChangeSetRepository.cs` | 0.00 | 49 | No |
| 3 | `ArchLucid.Persistence.Coordination.Evolution.InMemoryEvolutionSimulationRunRepository` | `ArchLucid.Persistence.Coordination\Evolution\InMemoryEvolutionSimulationRunRepository.cs` | 0.00 | 20 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.Coordination.Compliance.PolicyFilteredComplianceRulePackProvider` | `ArchLucid.Persistence.Coordination\Compliance\PolicyFilteredComplianceRulePackProvider.cs` | 0.00 | 11 | No |
| 2 | `ArchLucid.Persistence.Coordination.Evolution.InMemoryEvolutionCandidateChangeSetRepository` | `ArchLucid.Persistence.Coordination\Evolution\InMemoryEvolutionCandidateChangeSetRepository.cs` | 0.00 | 49 | No |
| 3 | `ArchLucid.Persistence.Coordination.Evolution.InMemoryEvolutionSimulationRunRepository` | `ArchLucid.Persistence.Coordination\Evolution\InMemoryEvolutionSimulationRunRepository.cs` | 0.00 | 20 | No |
| 4 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ProductLearningImprovementPlanSignalLinkSqlRow` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ProductLearningPlanningSqlRows.cs` | 0.00 | 3 | No |
| 5 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ProductLearningImprovementThemeSqlRow` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ProductLearningPlanningSqlRows.cs` | 0.00 | 18 | No |
| 6 | `ArchLucid.Persistence.Coordination.Compare.AuthorityCompareService` | `ArchLucid.Persistence.Coordination\Compare\AuthorityCompareService.cs` | 16.92 | 167 | No |
| 7 | `ArchLucid.Persistence.Coordination.Retrieval.InMemoryRetrievalIndexingOutboxRepository` | `ArchLucid.Persistence.Coordination\Retrieval\InMemoryRetrievalIndexingOutboxRepository.cs` | 30.00 | 21 | No |
| 8 | `ArchLucid.Persistence.Coordination.Compare.ManifestComparisonResult` | `ArchLucid.Persistence.Coordination\Compare\ManifestComparisonResult.cs` | 50.00 | 4 | No |
| 9 | `ArchLucid.Persistence.Coordination.Retrieval.RetrievalIndexingOutboxProcessor` | `ArchLucid.Persistence.Coordination\Retrieval\RetrievalIndexingOutboxProcessor.cs` | 56.72 | 29 | No |
| 10 | `ArchLucid.Persistence.Coordination.ProductLearning.ProductLearningOpportunityScoring` | `ArchLucid.Persistence.Coordination\ProductLearning\ProductLearningOpportunityScoring.cs` | 62.71 | 22 | No |
| 11 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ProductLearningPlanningRepositoryValidation` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ProductLearningPlanningRepositoryValidation.cs` | 70.97 | 36 | No |
| 12 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ImprovementThemeDetailJsonAnnotations` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ImprovementThemeDetailJsonAnnotations.cs` | 77.78 | 8 | No |
| 13 | `ArchLucid.Persistence.Coordination.Replay.AuthorityReplayService` | `ArchLucid.Persistence.Coordination\Replay\AuthorityReplayService.cs` | 78.64 | 22 | No |
| 14 | `ArchLucid.Persistence.Coordination.ProductLearning.ProductLearningTriageReportBuilder` | `ArchLucid.Persistence.Coordination\ProductLearning\ProductLearningTriageReportBuilder.cs` | 81.48 | 20 | No |
| 15 | `ArchLucid.Persistence.Coordination.ProductLearning.ProductLearningDashboardService` | `ArchLucid.Persistence.Coordination\ProductLearning\ProductLearningDashboardService.cs` | 82.96 | 23 | No |
| 16 | `ArchLucid.Persistence.Coordination.ProductLearning.ProductLearningImprovementOpportunityService` | `ArchLucid.Persistence.Coordination\ProductLearning\ProductLearningImprovementOpportunityService.cs` | 85.19 | 8 | No |
| 17 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ImprovementThemeExtractionService` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ImprovementThemeExtractionService.cs` | 85.28 | 44 | No |
| 18 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ImprovementPlanningService` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ImprovementPlanningService.cs` | 86.67 | 42 | No |
| 19 | `ArchLucid.Persistence.Coordination.Replay.ReplayValidationResult` | `ArchLucid.Persistence.Coordination\Replay\ReplayValidationResult.cs` | 88.89 | 1 | No |
| 20 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.InMemoryProductLearningPlanningRepository` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\InMemoryProductLearningPlanningRepository.cs` | 89.78 | 23 | No |
| 21 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.LearningPlanningReportMarkdownFormatter` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\LearningPlanningReportMarkdownFormatter.cs` | 90.59 | 8 | No |
| 22 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.LearningPlanningReportBuilder` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\LearningPlanningReportBuilder.cs` | 93.75 | 7 | No |
| 23 | `ArchLucid.Persistence.Coordination.ProductLearning.Planning.ProductLearningPlanningJsonSerializer` | `ArchLucid.Persistence.Coordination\ProductLearning\Planning\ProductLearningPlanningJsonSerializer.cs` | 94.44 | 1 | No |

### ArchLucid.Persistence.Advisory (81.22% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.InMemoryDigestDeliveryAttemptRepository` | `ArchLucid.Persistence.Advisory\InMemoryDigestDeliveryAttemptRepository.cs` | 6.90 | 27 | No |
| 2 | `ArchLucid.Persistence.InMemoryAdvisoryScanExecutionRepository` | `ArchLucid.Persistence.Advisory\InMemoryAdvisoryScanExecutionRepository.cs` | 10.53 | 17 | No |
| 3 | `ArchLucid.Persistence.RecommendationLearningService` | `ArchLucid.Persistence.Advisory\RecommendationLearningService.cs` | 33.33 | 8 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.InMemoryDigestDeliveryAttemptRepository` | `ArchLucid.Persistence.Advisory\InMemoryDigestDeliveryAttemptRepository.cs` | 6.90 | 27 | No |
| 2 | `ArchLucid.Persistence.InMemoryAdvisoryScanExecutionRepository` | `ArchLucid.Persistence.Advisory\InMemoryAdvisoryScanExecutionRepository.cs` | 10.53 | 17 | No |
| 3 | `ArchLucid.Persistence.RecommendationLearningService` | `ArchLucid.Persistence.Advisory\RecommendationLearningService.cs` | 33.33 | 8 | No |
| 4 | `ArchLucid.Persistence.AdvisoryScanRunner` | `ArchLucid.Persistence.Advisory\AdvisoryScanRunner.cs` | 76.43 | 74 | No |

### ArchLucid.Core (82.61% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Core.Ask.AskRequest` | `ArchLucid.Core\Ask\AskRequest.cs` | 0.00 | 5 | No |
| 2 | `ArchLucid.Core.Ask.AskResponse` | `ArchLucid.Core\Ask\AskResponse.cs` | 0.00 | 5 | No |
| 3 | `ArchLucid.Core.Authority.DisabledAsyncAuthorityPipelineModeResolver` | `ArchLucid.Core\Authority\DisabledAsyncAuthorityPipelineModeResolver.cs` | 0.00 | 1 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Core.Ask.AskRequest` | `ArchLucid.Core\Ask\AskRequest.cs` | 0.00 | 5 | No |
| 2 | `ArchLucid.Core.Ask.AskResponse` | `ArchLucid.Core\Ask\AskResponse.cs` | 0.00 | 5 | No |
| 3 | `ArchLucid.Core.Authority.DisabledAsyncAuthorityPipelineModeResolver` | `ArchLucid.Core\Authority\DisabledAsyncAuthorityPipelineModeResolver.cs` | 0.00 | 1 | No |
| 4 | `ArchLucid.Core.Billing.BillingConversionBlockedException` | `ArchLucid.Core\Billing\BillingConversionBlockedException.cs` | 0.00 | 2 | No |
| 5 | `ArchLucid.Core.Configuration.LlmTelemetryOptions` | `ArchLucid.Core\Configuration\LlmTelemetryOptions.cs` | 0.00 | 1 | No |
| 6 | `ArchLucid.Core.Configuration.MeteringOptions` | `ArchLucid.Core\Configuration\MeteringOptions.cs` | 0.00 | 1 | No |
| 7 | `ArchLucid.Core.Diagnostics.OutboxDepthGaugeValues` | `ArchLucid.Core\Diagnostics\OutboxDepthGaugeValues.cs` | 0.00 | 7 | No |
| 8 | `ArchLucid.Core.Explanation.DecisionTraceEntry` | `ArchLucid.Core\Explanation\DecisionTraceEntry.cs` | 0.00 | 5 | No |
| 9 | `ArchLucid.Core.Explanation.FindingRationale` | `ArchLucid.Core\Explanation\FindingRationale.cs` | 0.00 | 9 | No |
| 10 | `ArchLucid.Core.Explanation.FindingTraceCompletenessScore` | `ArchLucid.Core\Explanation\FindingTraceCompletenessScore.cs` | 0.00 | 9 | No |
| 11 | `ArchLucid.Core.Explanation.RunRationale` | `ArchLucid.Core\Explanation\RunRationale.cs` | 0.00 | 7 | No |
| 12 | `ArchLucid.Core.Identity.TrialIdentityUserRecord` | `ArchLucid.Core\Identity\TrialIdentityUserRecord.cs` | 0.00 | 13 | No |
| 13 | `ArchLucid.Core.Metering.NullUsageMeteringService` | `ArchLucid.Core\Metering\NullUsageMeteringService.cs` | 0.00 | 3 | No |
| 14 | `ArchLucid.Core.Notifications.SentEmailLedgerEntry` | `ArchLucid.Core\Notifications\SentEmailLedgerEntry.cs` | 0.00 | 6 | No |
| 15 | `ArchLucid.Core.Secrets.ArchLucidSecretOptions` | `ArchLucid.Core\Secrets\ArchLucidSecretOptions.cs` | 0.00 | 3 | No |
| 16 | `ArchLucid.Core.Tenancy.TenantHardPurgeOptions` | `ArchLucid.Core\Tenancy\TenantHardPurgeOptions.cs` | 0.00 | 2 | No |
| 17 | `ArchLucid.Core.Tenancy.TenantHardPurgeResult` | `ArchLucid.Core\Tenancy\TenantHardPurgeResult.cs` | 0.00 | 3 | No |
| 18 | `ArchLucid.Core.Tenancy.TrialFirstManifestCommitOutcome` | `ArchLucid.Core\Tenancy\TrialFirstManifestCommitOutcome.cs` | 0.00 | 2 | No |
| 19 | `ArchLucid.Core.Diagnostics.AgentExecutionLlmCallAccumulator` | `ArchLucid.Core\Diagnostics\ArchLucidInstrumentation.cs` | 25.00 | 3 | No |
| 20 | `ArchLucid.Core.Billing.BillingTierCode` | `ArchLucid.Core\Billing\BillingTierCode.cs` | 28.57 | 10 | No |
| 21 | `ArchLucid.Core.Audit.InMemoryAuditRetryQueue` | `ArchLucid.Core\Audit\InMemoryAuditRetryQueue.cs` | 29.17 | 34 | No |
| 22 | `ArchLucid.Core.Configuration.ArchLucidPersistenceOptions` | `ArchLucid.Core\Configuration\ArchLucidPersistenceOptions.cs` | 50.00 | 1 | No |
| 23 | `ArchLucid.Core.Audit.DurableAuditLogRetry` | `ArchLucid.Core\Audit\DurableAuditLogRetry.cs` | 57.14 | 12 | No |
| 24 | `ArchLucid.Core.Llm.Redaction.PromptRedactor` | `ArchLucid.Core\Llm\Redaction\PromptRedactor.cs` | 62.16 | 28 | No |
| 25 | `ArchLucid.Core.Identity.RunId` | `ArchLucid.Core\Identity\RunId.cs` | 71.43 | 2 | No |
| 26 | `ArchLucid.Core.Resilience.CircuitBreakerOptions` | `ArchLucid.Core\Resilience\CircuitBreakerOptions.cs` | 71.43 | 2 | No |
| 27 | `ArchLucid.Core.Identity.RunIdJsonConverter` | `ArchLucid.Core\Identity\RunIdJsonConverter.cs` | 75.00 | 2 | No |
| 28 | `ArchLucid.Core.Billing.AzureMarketplace.MarketplaceWebhookPayloadParser` | `ArchLucid.Core\Billing\AzureMarketplace\MarketplaceWebhookPayloadParser.cs` | 78.26 | 5 | No |
| 29 | `ArchLucid.Core.Integration.IntegrationEventServiceBusApplicationProperties` | `ArchLucid.Core\Integration\IntegrationEventServiceBusApplicationProperties.cs` | 78.85 | 11 | No |
| 30 | `ArchLucid.Core.Billing.BillingWebhookHandleResult` | `ArchLucid.Core\Billing\BillingWebhookHandleResult.cs` | 80.00 | 3 | No |
| 31 | <code>ArchLucid.Core.Pagination.PagedResponse`1</code> | `ArchLucid.Core\Pagination\PagedResponse.cs` | 80.00 | 1 | No |
| 32 | `ArchLucid.Core.Safety.ContentSafetyResult` | `ArchLucid.Core\Safety\ContentSafetyResult.cs` | 80.00 | 1 | No |
| 33 | `ArchLucid.Core.Integration.IntegrationEventTypes` | `ArchLucid.Core\Integration\IntegrationEventTypes.cs` | 83.33 | 1 | No |
| 34 | `ArchLucid.Core.Configuration.TrialAuthModeConstants` | `ArchLucid.Core\Configuration\TrialAuthModeConstants.cs` | 85.71 | 1 | No |
| 35 | `ArchLucid.Core.Audit.AuditEventFilter` | `ArchLucid.Core\Audit\AuditEventFilter.cs` | 87.50 | 1 | No |
| 36 | `ArchLucid.Core.Diagnostics.ArchLucidInstrumentation` | `ArchLucid.Core\Diagnostics\ArchLucidInstrumentation.cs` | 87.84 | 49 | No |
| 37 | `ArchLucid.Core.Resilience.CircuitBreakerGate` | `ArchLucid.Core\Resilience\CircuitBreakerGate.cs` | 87.97 | 19 | No |
| 38 | `ArchLucid.Core.Explanation.ExplanationResult` | `ArchLucid.Core\Explanation\ExplanationResult.cs` | 90.91 | 1 | No |
| 39 | `ArchLucid.Core.Audit.AuditEvent` | `ArchLucid.Core\Audit\AuditEvent.cs` | 92.31 | 1 | No |
| 40 | `ArchLucid.Core.Tenancy.TrialLimitExceededException` | `ArchLucid.Core\Tenancy\TrialLimitExceededException.cs` | 94.12 | 1 | No |

### ArchLucid.Cli (86.70% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Cli.Commands.TraceCommand` | `ArchLucid.Cli\Commands\TraceCommand.cs` | 43.55 | 35 | No |
| 2 | `ArchLucid.Cli.Support.SupportBundleArchiveWriter` | `ArchLucid.Cli\Support\SupportBundleArchiveWriter.cs` | 61.29 | 24 | No |
| 3 | `ArchLucid.Cli.Support.SupportBundleCollector` | `ArchLucid.Cli\Support\SupportBundleCollector.cs` | 83.51 | 31 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Cli.Commands.TraceCommand` | `ArchLucid.Cli\Commands\TraceCommand.cs` | 43.55 | 35 | No |
| 2 | `ArchLucid.Cli.Support.SupportBundleArchiveWriter` | `ArchLucid.Cli\Support\SupportBundleArchiveWriter.cs` | 61.29 | 24 | No |
| 3 | `ArchLucid.Cli.Support.SupportBundleCollector` | `ArchLucid.Cli\Support\SupportBundleCollector.cs` | 83.51 | 31 | No |
| 4 | `ArchLucid.Cli.ArchLucidProjectScaffolder` | `ArchLucid.Cli\ArchLucidProjectScaffolder.cs` | 88.46 | 27 | No |
| 5 | `ArchLucid.Cli.Commands.CliCommandShared` | `ArchLucid.Cli\Commands\CliCommandShared.cs` | 90.54 | 7 | No |
| 6 | `ArchLucid.Cli.Support.SupportBundleRedactor` | `ArchLucid.Cli\Support\SupportBundleRedactor.cs` | 92.73 | 4 | No |

### ArchLucid.Coordinator (88.28% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Coordinator.Services.CoordinatorService` | `ArchLucid.Coordinator\Services\CoordinatorService.cs` | 71.28 | 27 | No |
| 2 | `ArchLucid.Coordinator.Services.RunStarterTaskFactory` | `ArchLucid.Coordinator\Services\RunStarterTaskFactory.cs` | 99.28 | 1 | No |
| 3 | `ArchLucid.Coordinator.Services.CoordinationResult` | `ArchLucid.Coordinator\Services\CoordinationResult.cs` | 100.00 | 0 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Coordinator.Services.CoordinatorService` | `ArchLucid.Coordinator\Services\CoordinatorService.cs` | 71.28 | 27 | No |

### ArchLucid.Contracts (89.29% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Contracts.Agents.AgentOutputEvaluationSummary` | `ArchLucid.Contracts\Agents\AgentOutputEvaluationSummary.cs` | 0.00 | 6 | No |
| 2 | `ArchLucid.Contracts.Evolution.SimulationEvaluationOptions` | `ArchLucid.Contracts\Evolution\SimulationEvaluationOptions.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Contracts.Explanation.FindingExplainabilityResult` | `ArchLucid.Contracts\Explanation\FindingExplainabilityResult.cs` | 0.00 | 17 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Contracts.Agents.AgentOutputEvaluationSummary` | `ArchLucid.Contracts\Agents\AgentOutputEvaluationSummary.cs` | 0.00 | 6 | No |
| 2 | `ArchLucid.Contracts.Evolution.SimulationEvaluationOptions` | `ArchLucid.Contracts\Evolution\SimulationEvaluationOptions.cs` | 0.00 | 3 | No |
| 3 | `ArchLucid.Contracts.Explanation.FindingExplainabilityResult` | `ArchLucid.Contracts\Explanation\FindingExplainabilityResult.cs` | 0.00 | 17 | No |
| 4 | `ArchLucid.Contracts.Governance.GovernanceLineageFindingSummary` | `ArchLucid.Contracts\Governance\GovernanceLineageDtos.cs` | 0.00 | 6 | No |
| 5 | `ArchLucid.Contracts.ProductLearning.LearningPlanningReportExportResponse` | `ArchLucid.Contracts\ProductLearning\LearningPlanningReportExportResponse.cs` | 0.00 | 3 | No |
| 6 | `ArchLucid.Contracts.ProductLearning.Planning.LearningPlanningReportArtifactRef` | `ArchLucid.Contracts\ProductLearning\Planning\LearningPlanningReportArtifactRef.cs` | 0.00 | 4 | No |
| 7 | `ArchLucid.Contracts.ProductLearning.ProductLearningArtifactOutcomeTrendsResponse` | `ArchLucid.Contracts\ProductLearning\ProductLearningArtifactOutcomeTrendsResponse.cs` | 0.00 | 2 | No |
| 8 | `ArchLucid.Contracts.ProductLearning.ProductLearningDashboardSummaryResponse` | `ArchLucid.Contracts\ProductLearning\ProductLearningDashboardSummaryResponse.cs` | 0.00 | 11 | No |
| 9 | `ArchLucid.Contracts.ProductLearning.ProductLearningImprovementOpportunitiesResponse` | `ArchLucid.Contracts\ProductLearning\ProductLearningImprovementOpportunitiesResponse.cs` | 0.00 | 2 | No |
| 10 | `ArchLucid.Contracts.ProductLearning.ProductLearningReportExportResponse` | `ArchLucid.Contracts\ProductLearning\ProductLearningReportExportResponse.cs` | 0.00 | 3 | No |
| 11 | `ArchLucid.Contracts.ProductLearning.ProductLearningTriageQueueResponse` | `ArchLucid.Contracts\ProductLearning\ProductLearningTriageQueueResponse.cs` | 0.00 | 2 | No |
| 12 | `ArchLucid.Contracts.Common.AgentTypeKeys` | `ArchLucid.Contracts\Common\AgentTypeKeys.cs` | 39.13 | 14 | No |
| 13 | `ArchLucid.Contracts.Governance.GovernanceLineageRunSummary` | `ArchLucid.Contracts\Governance\GovernanceLineageDtos.cs` | 60.00 | 2 | No |
| 14 | `ArchLucid.Contracts.Evolution.SimulationReadProfile` | `ArchLucid.Contracts\Evolution\SimulationReadProfile.cs` | 62.86 | 13 | No |
| 15 | `ArchLucid.Contracts.DecisionTraces.DecisionTrace` | `ArchLucid.Contracts\DecisionTraces\DecisionTrace.cs` | 66.67 | 2 | No |
| 16 | `ArchLucid.Contracts.Agents.AgentOutputEvaluationScore` | `ArchLucid.Contracts\Agents\AgentOutputEvaluationScore.cs` | 71.43 | 2 | No |
| 17 | `ArchLucid.Contracts.ProductLearning.Planning.ImprovementThemeEvidence` | `ArchLucid.Contracts\ProductLearning\Planning\ImprovementThemeEvidence.cs` | 71.43 | 2 | No |
| 18 | `ArchLucid.Contracts.ProductLearning.ProductLearningPilotSignalRecord` | `ArchLucid.Contracts\ProductLearning\ProductLearningPilotSignalRecord.cs` | 76.47 | 4 | No |
| 19 | `ArchLucid.Contracts.Governance.PreCommitGovernanceGateOptions` | `ArchLucid.Contracts\Governance\PreCommitGovernanceGateOptions.cs` | 80.00 | 1 | No |
| 20 | `ArchLucid.Contracts.DecisionTraces.DecisionTraceJsonConverter` | `ArchLucid.Contracts\DecisionTraces\DecisionTraceJsonConverter.cs` | 81.25 | 6 | No |
| 21 | `ArchLucid.Contracts.Requests.RequestConstraintClassifier` | `ArchLucid.Contracts\Requests\RequestConstraintClassifier.cs` | 86.67 | 2 | No |

### ArchLucid.KnowledgeGraph (92.88% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.KnowledgeGraph.Models.GraphSnapshotIndexedEdge` | `ArchLucid.KnowledgeGraph\Models\GraphSnapshotIndexedEdge.cs` | 50.00 | 3 | No |
| 2 | `ArchLucid.KnowledgeGraph.Repositories.InMemoryGraphSnapshotRepository` | `ArchLucid.KnowledgeGraph\Repositories\InMemoryGraphSnapshotRepository.cs` | 75.00 | 8 | No |
| 3 | `ArchLucid.KnowledgeGraph.Inference.DefaultGraphEdgeInferer` | `ArchLucid.KnowledgeGraph\Inference\DefaultGraphEdgeInferer.cs` | 87.50 | 15 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.KnowledgeGraph.Models.GraphSnapshotIndexedEdge` | `ArchLucid.KnowledgeGraph\Models\GraphSnapshotIndexedEdge.cs` | 50.00 | 3 | No |
| 2 | `ArchLucid.KnowledgeGraph.Repositories.InMemoryGraphSnapshotRepository` | `ArchLucid.KnowledgeGraph\Repositories\InMemoryGraphSnapshotRepository.cs` | 75.00 | 8 | No |
| 3 | `ArchLucid.KnowledgeGraph.Inference.DefaultGraphEdgeInferer` | `ArchLucid.KnowledgeGraph\Inference\DefaultGraphEdgeInferer.cs` | 87.50 | 15 | No |

### ArchLucid.AgentSimulator (96.45% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.AgentSimulator.Scenarios.EnterpriseRagScenarioProvider` | `ArchLucid.AgentSimulator\Scenarios\EnterpriseRagScenarioProvider.cs` | 0.00 | 7 | No |
| 2 | `ArchLucid.AgentSimulator.Services.DeterministicAgentSimulator` | `ArchLucid.AgentSimulator\Services\DeterministicAgentSimulator.cs` | 86.36 | 3 | No |
| 3 | `ArchLucid.AgentSimulator.Services.FakeScenarioFactory` | `ArchLucid.AgentSimulator\Services\FakeScenarioFactory.cs` | 100.00 | 0 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.AgentSimulator.Scenarios.EnterpriseRagScenarioProvider` | `ArchLucid.AgentSimulator\Scenarios\EnterpriseRagScenarioProvider.cs` | 0.00 | 7 | No |
| 2 | `ArchLucid.AgentSimulator.Services.DeterministicAgentSimulator` | `ArchLucid.AgentSimulator\Services\DeterministicAgentSimulator.cs` | 86.36 | 3 | No |

### ArchLucid.Provenance (96.70% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Provenance.Services.ProvenanceGraphAlgorithms` | `ArchLucid.Provenance\Services\ProvenanceGraphAlgorithms.cs` | 85.71 | 11 | No |
| 2 | `ArchLucid.Provenance.Analysis.ProvenanceCompletenessAnalyzer` | `ArchLucid.Provenance\Analysis\ProvenanceCompletenessAnalyzer.cs` | 100.00 | 0 | No |
| 3 | `ArchLucid.Provenance.Analysis.ProvenanceCompletenessResult` | `ArchLucid.Provenance\Analysis\ProvenanceCompletenessResult.cs` | 100.00 | 0 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Provenance.Services.ProvenanceGraphAlgorithms` | `ArchLucid.Provenance\Services\ProvenanceGraphAlgorithms.cs` | 85.71 | 11 | No |

### ArchLucid.Persistence.Integration (99.19% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Persistence.OutboxAwareIntegrationEventPublishing` | `ArchLucid.Persistence.Integration\OutboxAwareIntegrationEventPublishing.cs` | 97.22 | 1 | No |
| 2 | `ArchLucid.Persistence.InMemoryIntegrationEventOutboxRepository` | `ArchLucid.Persistence.Integration\InMemoryIntegrationEventOutboxRepository.cs` | 99.08 | 1 | No |
| 3 | `ArchLucid.Persistence.IntegrationEventOutboxDeadLetterRow` | `ArchLucid.Persistence.Integration\IntegrationEventOutboxDeadLetterRow.cs` | 100.00 | 0 | No |

#### All classes below 95% line coverage

_No classes below 95% line coverage in Cobertura for this assembly._

### ArchLucid.Decisioning (89.48% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Decisioning.Governance.Resolution.PolicyAssignmentPrecedence` | `ArchLucid.Decisioning\Governance\Resolution\PolicyAssignmentPrecedence.cs` | 0.00 | 5 | No |
| 2 | `ArchLucid.Decisioning.Plugins.FindingEnginePluginDiscovery` | `ArchLucid.Decisioning\Plugins\FindingEnginePluginDiscovery.cs` | 8.54 | 75 | No |
| 3 | `ArchLucid.Decisioning.Advisory.Delivery.DigestEmailDeliveryChannel` | `ArchLucid.Decisioning\Advisory\Delivery\DigestEmailDeliveryChannel.cs` | 10.00 | 9 | No |

#### All classes below 95% line coverage

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Decisioning.Governance.Resolution.PolicyAssignmentPrecedence` | `ArchLucid.Decisioning\Governance\Resolution\PolicyAssignmentPrecedence.cs` | 0.00 | 5 | No |
| 2 | `ArchLucid.Decisioning.Plugins.FindingEnginePluginDiscovery` | `ArchLucid.Decisioning\Plugins\FindingEnginePluginDiscovery.cs` | 8.54 | 75 | No |
| 3 | `ArchLucid.Decisioning.Advisory.Delivery.DigestEmailDeliveryChannel` | `ArchLucid.Decisioning\Advisory\Delivery\DigestEmailDeliveryChannel.cs` | 10.00 | 9 | No |
| 4 | `ArchLucid.Decisioning.Merge.DecisionNodeManifestMerger` | `ArchLucid.Decisioning\Merge\DecisionNodeManifestMerger.cs` | 20.27 | 59 | No |
| 5 | `ArchLucid.Decisioning.Validation.ServiceCollectionExtensions` | `ArchLucid.Decisioning\Validation\ServiceCollectionExtensions.cs` | 57.14 | 3 | No |
| 6 | `ArchLucid.Decisioning.Compliance.Loaders.ComplianceRulePackValidator` | `ArchLucid.Decisioning\Compliance\Loaders\ComplianceRulePackValidator.cs` | 64.71 | 6 | No |
| 7 | `ArchLucid.Decisioning.Alerts.Delivery.AlertSeverityComparer` | `ArchLucid.Decisioning\Alerts\Delivery\AlertSeverityComparer.cs` | 66.67 | 3 | No |
| 8 | `ArchLucid.Decisioning.Validation.PassthroughSchemaValidationService` | `ArchLucid.Decisioning\Validation\PassthroughSchemaValidationService.cs` | 66.67 | 2 | No |
| 9 | `ArchLucid.Decisioning.Governance.Resolution.EffectiveGovernanceResolver` | `ArchLucid.Decisioning\Governance\Resolution\EffectiveGovernanceResolver.cs` | 67.73 | 91 | No |
| 10 | `ArchLucid.Decisioning.Analysis.GraphCoverageAnalyzer` | `ArchLucid.Decisioning\Analysis\GraphCoverageAnalyzer.cs` | 71.28 | 27 | No |
| 11 | `ArchLucid.Decisioning.Merge.ManifestGovernanceMerger` | `ArchLucid.Decisioning\Merge\ManifestGovernanceMerger.cs` | 72.00 | 21 | No |
| 12 | `ArchLucid.Decisioning.Models.FindingsSnapshot` | `ArchLucid.Decisioning\Models\FindingsSnapshot.cs` | 78.57 | 3 | No |
| 13 | `ArchLucid.Decisioning.Findings.TraceConfidenceLabels` | `ArchLucid.Decisioning\Findings\TraceConfidenceLabels.cs` | 80.00 | 1 | No |
| 14 | `ArchLucid.Decisioning.Manifest.AuthorityManifestRiskPosture` | `ArchLucid.Decisioning\Manifest\AuthorityManifestRiskPosture.cs` | 81.48 | 5 | No |
| 15 | `ArchLucid.Decisioning.Findings.Serialization.FindingJsonConverter` | `ArchLucid.Decisioning\Findings\Serialization\FindingJsonConverter.cs` | 81.58 | 14 | No |
| 16 | `ArchLucid.Decisioning.Validation.SchemaValidationService` | `ArchLucid.Decisioning\Validation\SchemaValidationService.cs` | 82.22 | 24 | No |
| 17 | `ArchLucid.Decisioning.Manifest.Builders.DefaultGoldenManifestBuilder` | `ArchLucid.Decisioning\Manifest\Builders\DefaultGoldenManifestBuilder.cs` | 82.37 | 61 | No |
| 18 | `ArchLucid.Decisioning.Services.FindingsOrchestrator` | `ArchLucid.Decisioning\Services\FindingsOrchestrator.cs` | 84.15 | 13 | No |
| 19 | `ArchLucid.Decisioning.Services.FindingPayloadValidator` | `ArchLucid.Decisioning\Services\FindingPayloadValidator.cs` | 87.18 | 5 | No |
| 20 | `ArchLucid.Decisioning.Alerts.Composite.CompositeAlertRuleEvaluator` | `ArchLucid.Decisioning\Alerts\Composite\CompositeAlertRuleEvaluator.cs` | 87.50 | 4 | No |
| 21 | `ArchLucid.Decisioning.Findings.ExplanationFaithfulnessChecker` | `ArchLucid.Decisioning\Findings\ExplanationFaithfulnessChecker.cs` | 87.63 | 12 | No |
| 22 | `ArchLucid.Decisioning.Services.RuleBasedDecisionEngine` | `ArchLucid.Decisioning\Services\RuleBasedDecisionEngine.cs` | 87.76 | 6 | No |
| 23 | `ArchLucid.Decisioning.Advisory.Services.RecommendationGenerator` | `ArchLucid.Decisioning\Advisory\Services\RecommendationGenerator.cs` | 88.54 | 11 | No |
| 24 | `ArchLucid.Decisioning.Governance.PolicyPacks.PolicyPackManagementService` | `ArchLucid.Decisioning\Governance\PolicyPacks\PolicyPackManagementService.cs` | 89.16 | 22 | No |
| 25 | `ArchLucid.Decisioning.Merge.AgentProposalManifestMerger` | `ArchLucid.Decisioning\Merge\AgentProposalManifestMerger.cs` | 89.18 | 21 | No |
| 26 | `ArchLucid.Decisioning.Compliance.Loaders.FileComplianceRulePackLoader` | `ArchLucid.Decisioning\Compliance\Loaders\FileComplianceRulePackLoader.cs` | 89.19 | 4 | No |
| 27 | `ArchLucid.Decisioning.Repositories.InMemoryFindingsSnapshotRepository` | `ArchLucid.Decisioning\Repositories\InMemoryFindingsSnapshotRepository.cs` | 89.47 | 2 | No |
| 28 | `ArchLucid.Decisioning.Advisory.Scheduling.AdvisoryScanExecution` | `ArchLucid.Decisioning\Advisory\Scheduling\AdvisoryScanExecution.cs` | 90.00 | 1 | No |
| 29 | `ArchLucid.Decisioning.Findings.Factories.FindingPayloadConverter` | `ArchLucid.Decisioning\Findings\Factories\FindingPayloadConverter.cs` | 90.32 | 3 | No |
| 30 | `ArchLucid.Decisioning.Comparison.ComparisonService` | `ArchLucid.Decisioning\Comparison\ComparisonService.cs` | 90.73 | 14 | No |
| 31 | `ArchLucid.Decisioning.Services.ManifestHashService` | `ArchLucid.Decisioning\Services\ManifestHashService.cs` | 91.49 | 4 | No |
| 32 | `ArchLucid.Decisioning.Findings.FindingPayloadRegistry` | `ArchLucid.Decisioning\Findings\FindingPayloadRegistry.cs` | 93.33 | 1 | No |
| 33 | `ArchLucid.Decisioning.Merge.DecisionEngineService` | `ArchLucid.Decisioning\Merge\DecisionEngineService.cs` | 93.48 | 3 | No |
| 34 | `ArchLucid.Decisioning.Findings.FindingTraceConfidenceMapper` | `ArchLucid.Decisioning\Findings\FindingTraceConfidenceMapper.cs` | 93.75 | 1 | No |
| 35 | `ArchLucid.Decisioning.Repositories.InMemoryGoldenManifestRepository` | `ArchLucid.Decisioning\Repositories\InMemoryGoldenManifestRepository.cs` | 94.44 | 1 | No |

### ArchLucid.Jobs.Cli (100.00% line coverage)

#### Top 3 classes by lowest line coverage %

| Rank | Class | File | Line coverage % | Uncovered lines | Prior attempt? |
|------|-------|------|-----------------|-----------------|----------------|
| 1 | `ArchLucid.Jobs.Cli.JobsCommandLine` | `ArchLucid.Jobs.Cli\JobsCommandLine.cs` | 100.00 | 0 | No |

#### All classes below 95% line coverage

_No classes below 95% line coverage in Cobertura for this assembly._

## Merged totals (reference)

- **Merged line coverage:** 60.04%
- **Merged branch coverage:** 48.18%

## TB-301 persistence scope-isolation probes (SQL integration)

**TB-301** tracks tenant/workspace/project scope isolation for high-risk persistence reads. SQL integration probes (wrong-scope denial) target:

- `SqlRunRepository.GetByIdAsync`
- `DapperAuditRepository.GetFilteredAsync`
- `SqlGoldenManifestRepository.GetByIdAsync`
- `GovernanceApprovalRequestRepository.GetByIdAsync`
- `SqlDecisionTraceRepository.GetByIdAsync`

See `ArchLucid.Persistence.Tests/*ScopeIsolationSqlIntegrationTests.cs` for probe implementations.

## How to refresh

```powershell
# Remove old shards so ReportGenerator does not merge stale + new Cobertura files.
Remove-Item -Recurse -Force .\coverage-gap-1a -ErrorAction SilentlyContinue
dotnet test ArchLucid.sln -c Release --settings coverage.runsettings `
  --collect:"XPlat Code Coverage" --results-directory .\coverage-gap-1a
dotnet tool restore
dotnet reportgenerator "-reports:coverage-gap-1a/**/coverage.cobertura.xml" "-targetdir:coverage-gap-1a/merged" "-reporttypes:Cobertura"
python scripts/ci/coverage_gap_analysis.py
# Or: gh run download <run-id> -n coverage-merged-cobertura -D .\ci-cov
#     python scripts/ci/coverage_gap_analysis.py --cobertura .\ci-cov\Cobertura.xml
```
