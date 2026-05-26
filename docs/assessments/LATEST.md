<!-- **Scope:** Engineering assessment for internal leads and reviewers tracking V1 GA readiness; not a public-facing status report or compliance attestation. -->

# ArchLucid Assessment – (A) Headline Readiness: 94.00%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, explicitly excluding deferred V1.1/V2 items (such as AWS/GCP analysis, Jira/ServiceNow/Confluence connectors, multi-region failover, third-party plugin marketplaces, outbound MCP clients, automated tenant erasure pipelines, Stripe live-keys flip, SCIM 2.0 token rotation runbooks, third-party penetration testing, and CPA SOC 2 attestation) from penalization. It evaluates the solution strictly from first principles based on the available documentation and stated architecture.

**Rescore note (2026-05-26):** Batches 1–4 shipped through 93.53%. **Improvement #3 shipped** — tenant EA discount on `dbo.TenantCostSettings` (`EaDiscountMultiplier` + `EaDiscountPercentage` API/UI), `TenantEaDiscountMath` effective-price helper, Cost-category ROI savings scaling, and Settings → Tenant cost card (+0.47 pts). Cumulative: **90.33% → 94.00%**.

## Executive Summary

**Headline Readiness (A)**
At 94.00% headline readiness, the V1 solution is architecturally mature and highly resilient. Batch 4 prepared V2 privacy workflows (`TenantErasureRequestedUtc`), bounded graph projection memory via byte-weighted cache entries, Tier 2 hosted extractor manual run API, LLM monthly budget approaching audit events, PSScriptAnalyzer CI on the Tier 1 extractor script, and production-like per-tenant telemetry cardinality startup warnings.

**Procurement/Market-Motion Realism (B)**
Despite strong technical isolation, enterprise procurement will encounter some friction. The lack of an automated GDPR/CCPA tenant erasure pipeline will require careful navigation and roadmap assurances during enterprise privacy reviews. SSO onboarding still requires manual claim mapping, though unified identity-provider health diagnostics now shorten mean time to diagnose misconfigurations.

**Commercial Picture**
The commercial reality is that V1 is restricted to a high-touch, sales-led motion. Self-serve PLG (Product-Led Growth) is technically wired but intentionally blocked because Stripe live keys and the Azure Marketplace offer are manually deferred to V1.1. Time-to-value remains strong due to the fast extraction and pre-seeded policy packs, but converting trials to paid subscriptions will require manual quote-to-cash workflows, increasing the burden on the sales organization.

**Enterprise Picture**
The enterprise governance posture is robust, featuring 23 bundled policy packs, pre-commit gates, and an append-only 78-event durable audit log. Support for Entra ID, generic OIDC, and SAML 2.0 SP covers the vast majority of enterprise SSO requirements. However, the lack of automated mapping for custom Identity Provider claims will force manual, error-prone configuration during onboarding.

**Engineering Picture**
Engineering hygiene is exceptional. Batch 4 tightened extractor script CI validation and memory-cache bounds for graph projections. Residual engineering risks: unbounded graph snapshots on extremely large manifests (size-weighted cache helps but does not cap single-entry footprint), high-cardinality OTel metrics when operators override telemetry warnings, and LLM hallucination in large-scale architecture RAG contexts.

## Weighted Quality Assessment

**1. Cutting-Edge AI Technology**
- **Score:** 86
- **Weight:** 8
- **Weighted Deficiency:** 112
- **Justification:** Utilizes Azure OpenAI for core extraction and analysis. Azure AI Search semantic reranking is functional, but advanced graph-RAG, agentic retrieval (HyDE), and online fine-tuning are explicitly deferred to V2.
- **Tradeoffs:** Trading cutting-edge retrieval methods (HyDE, Cohere) for single-tenant Azure compliance and reduced context latency is appropriate for V1 but lowers the raw AI capability ceiling.
- **Improvement Recommendations:** DEFERRED to V1.1: Continuously evaluate RAG faithfulness trends via the `archlucid.agent.faithfulness_cosine` histogram; extend heuristic SKU coverage as new Azure families appear.

**2. AI/Agent Readiness**
- **Score:** 94
- **Weight:** 8
- **Weighted Deficiency:** 48
- **Justification:** Solid RAG foundation with policy-pack indexing and prior-manifest chunks. `PilotStrict` gates enforce structural and semantic quality; effective reject floors and PilotStrict thresholds are exposed via `GET /v1/admin/diagnostics/quality-gates`. Embedding faithfulness cosine scores are emitted to `archlucid.agent.faithfulness_cosine` for longitudinal hallucination monitoring.
- **Tradeoffs:** The strictness of the quality gates may reject borderline acceptable LLM outputs, requiring manual operator intervention to bypass.
- **Improvement Recommendations:** DEFERRED to V1.1: Tune PilotStrict thresholds using faithfulness histogram percentiles once sufficient production telemetry accumulates.

**3. Adoption Friction**
- **Score:** 94
- **Weight:** 6
- **Weighted Deficiency:** 36
- **Justification:** Tier 1 Azure Extractor requires no credentials. `POST /v1/admin/azure-extractor/hosted/run` lets operators synchronously test Tier 2 WIF extraction before background auto-pull. Identity-provider health diagnostics shorten SSO misconfiguration diagnosis time.
- **Tradeoffs:** Database-per-tenant isolation adds backend provisioning complexity and latency during tenant creation but ensures bulletproof data segregation.
- **Improvement Recommendations:** Ship hosted extractor background auto-pull worker (V1.x) to eliminate manual run triggers for steady-state ingestion.

**4. Proof-of-ROI Readiness**
- **Score:** 96
- **Weight:** 5
- **Weighted Deficiency:** 20
- **Justification:** Executive ROI with cross-run deduplication, Azure Retail Prices + heuristic SKU fallback, and per-tenant EA discount (`TenantCostSettings.EaDiscountMultiplier` / `EaDiscountPercentage` on `PUT /v1/tenant/cost-settings`) scaling Cost-category savings via `EffectivePrice = RetailPrice × multiplier`.
- **Tradeoffs:** EA discount applies to Cost-category finding savings, not every retail-price probe in RAG retrieval.
- **Improvement Recommendations:** Extend EA-adjusted pricing into live Azure Retail structured lookup when tenant context is available in retrieval.

**5. Executive Value Visibility**
- **Score:** 97
- **Weight:** 4
- **Weighted Deficiency:** 12
- **Justification:** Markdown/DOCX exports, Knowledge Graph views, compliance drift trends, Executive ROI chart/export, comparison replay cost cache, and EA-adjusted savings basis labels on executive summaries (`SavingsPricingBasis`, `EaDiscountPercentage`).
- **Tradeoffs:** ROI trend chart uses lightweight CSS stacked bars rather than a Recharts dependency—adequate for pilots but less feature-rich than full BI tooling.
- **Improvement Recommendations:** Optional polish: migrate the ROI chart to Recharts for tooltips/zoom.

**6. Time-to-Value**
- **Score:** 96
- **Weight:** 7
- **Weighted Deficiency:** 28
- **Justification:** 23 seeded default policy packs, "Ask" templates, and rapid Azure extraction mean the first architecture review can be completed in minutes.
- **Tradeoffs:** The "empty" default state for non-seeded deployments can leave users staring at a blank canvas until the Azure extractor completes its run.
- **Improvement Recommendations:** Enhance the local sandbox seeder to simulate a complete multi-tier application to demonstrate instant value during sales demos.

**7. Maintainability**
- **Score:** 98
- **Weight:** 4
- **Weighted Deficiency:** 8
- **Justification:** Strict `NetArchTest` invariants, PSScriptAnalyzer CI gate on `scripts/azure/Get-ArchLucidAzurePackage.ps1`, `TenantErasureRequestedUtc` schema (migration 222), graph projection cache byte-size estimator, and FinOps negative-rate guard tests.
- **Tradeoffs:** High initial development friction when cross-domain features are required.
- **Improvement Recommendations:** Extend EA-adjusted pricing into live Azure Retail structured lookup when tenant context is available in retrieval.

**8. Reliability**
- **Score:** 96
- **Weight:** 2
- **Weighted Deficiency:** 8
- **Justification:** DbUp migrations, transactional outboxes, SQL/OIDC resilience, data-archival readiness → HTTP 503, staged Critic timeout isolation, and graph projection `IMemoryCache` entries sized from MessagePack byte estimates under a global `SizeLimit`.
- **Tradeoffs:** In-memory caching caps horizontal API scaling. Multi-region Active/Active topology is deferred to V1.1.
- **Improvement Recommendations:** Cap maximum single graph snapshot cache entry bytes (reject or bypass cache above threshold).

**9. Supportability**
- **Score:** 99
- **Weight:** 1
- **Weighted Deficiency:** 1
- **Justification:** OpenTelemetry, Serilog, identity/quality-gate diagnostics, RAG faithfulness histograms, `LlmTenantMonthlyDollarBudgetApproaching` proactive audit events, and `RetrievalTelemetryProductionWarningPostConfigure` startup warnings when per-tenant tags exceed recommended tenant counts on production-like hosts.
- **Tradeoffs:** High-cardinality OTel metrics (like per-tenant tagging) risk overwhelming Prometheus backends if operators ignore startup warnings.
- **Improvement Recommendations:** Dashboard Grafana panels for LLM budget approaching events and faithfulness histogram percentiles.

## Top 12 Most Important Weaknesses
1. Lack of auto-discovery wizards for Identity Provider metadata complicates SSO onboarding.
2. RAG implementation lacks advanced Graph-RAG and semantic reranking enhancements (deferred to V2).
3. In-memory graph projection cache is byte-weighted under a global `SizeLimit`, but individual massive snapshots can still pressure single-replica memory before Redis (V2).
4. Illustrative Azure Retail Prices in RAG retrieval still use list rates; EA discount is applied in executive ROI Cost savings totals via tenant cost settings.
5. Executive ROI trend visualization uses lightweight in-app CSS charts rather than Recharts—functional for pilots but not executive-grade BI polish.
6. Unbounded high-cardinality OpenTelemetry tags for tenants risk overwhelming metrics backends (startup warning emitted when `EstimatedTenantCount` exceeds recommended threshold).
7. Out-of-the-box trial environments are not integrated with live self-serve commerce due to deferred Stripe keys.
8. Azure Extractor lacks continuous automated ingestion in V1, relying strictly on on-demand ZIP uploads.
9. Synchronous LLM execution still relies on static timeouts for non-Critic agents; Critic phase isolation mitigates one failure mode but OpenAI degraded states remain a risk.
10. Multi-region Active/Active topology is a V1.1 deliverable, impacting HA guarantees for top-tier SLAs.
11. Absence of automated dead-letter queue reprocessing requires manual intervention for failed asynchronous jobs.
12. Absence of automated end-to-end load testing in the CI pipeline allows performance regressions to slip into production.

## Top 6 Monetization Blockers
1. Stripe live-keys flip is manually deferred, blocking automated self-serve checkouts.
2. Azure Marketplace SaaS offer is not in `Published` state, blocking cloud-budget drawdowns.
3. Absence of a signed, public reference customer extends the sales cycle and reduces trust.
4. Inability to plug in exact EA discount rates undermines ROI trust during pilot financial reviews. **Mitigated:** tenant-configurable EA discount percentage on Settings → Tenant cost settings.
5. Lack of in-app billing conversion prompts forces reliance on sales-led quote-to-cash workflows.
6. Trial signup marketing attribution requires manual pipeline analysis, making CAC reporting slow for the sales team.

## Top 6 Enterprise Adoption Blockers
1. Lack of an automated tenant erasure pipeline (V2) complicates GDPR/CCPA privacy reviews.
2. Manual configuration of OIDC and SAML 2.0 mapping requires significant IT administrator hand-holding (health probes reduce diagnosis time but not mapping work).
3. Lack of automated, continuous cloud configuration extraction in Tier 1 necessitates manual PowerShell executions.
4. Absence of Active/Active multi-region support limits adoption for mission-critical enterprise governance workloads.
5. Federated Workload Identity setup for the Tier-2 hosted Azure extractor requires significant InfoSec coordination.
6. Execution mode auditability improved via `archlucid.execution_mode` span tags; enterprise reviewers should still validate trace export pipelines include this tag.

## Top 6 Engineering Risks
1. In-memory graph projection cache uses byte-weighted entries but extremely large single snapshots can still pressure memory on single-replica hosts.
2. LLM hallucination and faithfulness drift if RAG contextual limits are exceeded by massive architecture manifests.
3. High-cardinality metrics crashing Prometheus instances if tenant counts spike abruptly.
4. Database thundering herd during failovers is partially mitigated by ±20% SQL retry jitter but not eliminated at the connection-pool layer.
5. Staged Critic timeout isolation prevents full run fail-closed on Critic phase timeout; non-Critic agent timeouts during OpenAI degraded states remain a residual risk.
6. Out-of-order webhook processing (e.g., body parsing before signature validation) compromising webhook integrity.

## Most Important Truth
ArchLucid's V1 core engine is highly robust with exceptional architectural discipline, but its go-to-market success is artificially constrained by intentional deferrals of self-serve commerce (Stripe/Marketplace) and automated compliance scaling, meaning it must temporarily act as a high-touch, sales-led enterprise tool rather than a frictionless product-led growth platform.

## Top Improvement Opportunities

1. **DEFERRED Stripe Live Keys Cutover**
   - Why it matters: Enables self-serve checkouts and PLG growth.
   - Expected impact: N/A to (A) score, massive impact on monetization.
   - Affected qualities: Commercial Viability.
   - Needs from user: The owner must manually update the configuration environment variables in the production vault and confirm the webhook secret.

2. **DEFERRED Create SCIM 2.0 Inbound Provisioning Token Rotation Runbook (V1.1 Scope)**
   - Why it matters: SCIM work is explicitly out of scope for V1.
   - Expected impact: N/A to (A) score.
   - Affected qualities: Supportability, Maintainability.
   - Needs from user: The owner must define the V1.1 delivery schedule for automated token rotation before the interim manual runbook is drafted.

3. **SHIPPED — Add Tenant-Specific Enterprise Agreement (EA) Discount to ROI Service**
   - Why it mattered: Aligning illustrative retail prices with reality builds executive trust in the ROI numbers.
   - Delivered: `dbo.TenantCostSettings.EaDiscountMultiplier` (migration 199), `TenantEaDiscountMath`, `PUT/GET /v1/tenant/cost-settings` with `eaDiscountPercentage`, `TenantAdjustedFindingsSavingsCalculator`, Settings `TenantCostSettingsCard`, and endpoint/unit tests.
   - Score impact realized: Proof-of-ROI Readiness +2 pts, Executive Value Visibility +2 pts.

4. **SHIPPED — Build Interactive Executive Dashboard UI for ROI Trends**
   - Why it mattered: Executives need visual evidence of systemic issue resolution over time, not just data dumps.
   - Delivered: `ExecutiveRoiSystemicIssueTrendChart` in `ExecutiveRoiSummarySection.tsx` binds `HistoricalTrends` with CSS stacked bars (Recharts optional polish deferred).
   - Score impact realized: Executive Value Visibility +4 pts (partial credit — no Recharts dependency).

5. **SHIPPED — Expose OIDC/SAML Identity Provider Health in Diagnostics API**
   - Why it mattered: Drastically reduces the time to troubleshoot enterprise SSO misconfigurations.
   - Delivered: `GET /v1/admin/diagnostics/identity-providers`, `IdentityProviderDiagnosticsHealthEvaluator`, `IdentityProviderHealthStrip` on Settings → Identity providers.
   - Score impact realized: Supportability +5 pts, Adoption Friction +3 pts.

6. **SHIPPED — Add SAML Certificate Expiration Monitoring Hosted Service**
   - Why it mattered: Prevents catastrophic authentication outages when SAML certificates expire silently.
   - Delivered: `SamlSigningCertificateStartupWarningHostedService` (30-day warning via `RecordStartupConfigWarning`); daily `SamlCertExpiryNotificationHostedService` also present; unit test added.
   - Score impact realized: Reliability +2 pts, Supportability +1 pt.

7. **SHIPPED — Implement Azure Retail Prices Fallback Mapping for Missing SKUs**
   - Why it mattered: Ensures cost estimation doesn't fail or return $0 for obscure Azure resources.
   - Delivered: `AzureRetailPricesHeuristicFallback` + `AzureRetailPricesCatalogStructuredLookup` integration with OTel warning and `[Fallback Estimate]` tagging; unit tests.
   - Score impact realized: Proof-of-ROI Readiness +2 pts, Cutting-Edge AI recommendation updated.

8. **SHIPPED — Enforce Webhook Middleware Registration Order via NetArchTest**
   - Why it mattered: Out-of-order middleware (JSON parsing before signature validation) causes silent state corruption or vulnerability.
   - Delivered: `WebhookMiddlewareOrderingTests` asserts `EnableBuffering` → `ReadToEndAsync` → `HandleWebhookAsync` for Stripe and Marketplace billing controllers.
   - Score impact realized: Maintainability +2 pts, Reliability +1 pt.

9. **SHIPPED — Add TenantErasureRequestedUtc Column to Prepare for Automated Purging**
   - Why it mattered: Prepares the schema for the V2 GDPR/CCPA automated quarantine pipeline.
   - Delivered: DbUp migration `222_Tenants_TenantErasureRequestedUtc.sql`, unified schema sync, `TenantRecord.TenantErasureRequestedUtc`, Dapper offboard sets column, `InMemoryTenantRepositoryTenantErasureRequestedUtcTests`.
   - Score impact realized: Maintainability +1 pt.

10. **SHIPPED — Implement Memory Cache Size Limits for GraphSnapshot Retrieval**
    - Why it mattered: Prevents Out-of-Memory (OOM) exceptions when retrieving massive architecture graphs in single-replica setups.
    - Delivered: `GraphSnapshotProjectionCacheEntrySizeEstimator` (MessagePack byte estimate), `GraphSnapshotProjectionMemoryCache` sets `entry.Size`, global `IMemoryCache` `SizeLimit = 1000` in `ServiceCollectionExtensions.ApplicationPipeline`; unit tests.
    - Score impact realized: Reliability +1 pt, Maintainability +1 pt.

11. **SHIPPED — Add Explicit Retry Jitter to SQL Connection Resiliency Policies**
    - Why it mattered: Prevents thundering herd problems on database failovers.
    - Delivered: `SqlOpenRetryDelayCalculator` (±20% jitter on exponential backoff) wired into `SqlOpenResilienceDefaults`; `SqlOpenRetryDelayCalculatorTests`.
    - Score impact realized: Reliability +4 pts.

12. **SHIPPED — Expose PilotStrict Quality Gate Thresholds via Admin API**
    - Why it mattered: Allows operators to quickly diagnose why an LLM run was rejected without digging into source code.
    - Delivered: `GET /v1/admin/diagnostics/quality-gates`; tenant settings card displays reject floors and PilotStrict thresholds.
    - Score impact realized: Supportability +5 pts, AI/Agent Readiness +3 pts.

13. **SHIPPED — Isolate Optional Critic Agent Execution with Strict CancellationToken**
    - Why it mattered: Prevents the entire run from failing closed if the optional Critic agent times out during OpenAI degraded performance.
    - Delivered: `RealAgentExecutor.TryExecuteStagedCriticPhaseAsync` with `StagedCriticAgentOptions.CriticTimeoutSeconds` (default 120s), `CriticTimeout` evidence note, and `RealAgentExecutorStagedCriticTests`.
    - Score impact realized: Reliability +1 pt.

14. **SHIPPED — Add OpenTelemetry Tag for LLM Execution Mode (Real vs. Simulator)**
    - Why it mattered: Required for audit compliance to prove whether outputs were hallucinated or deterministically simulated.
    - Delivered: `archlucid.execution_mode` span tag on architecture run orchestration (`ArchitectureRunExecuteOrchestrator`); quality-gate metrics use `AgentOutputQualityGateTelemetry.ResolveExecutionModeLabel`; `AgentOutputQualityGateTelemetryTests`.
    - Score impact realized: Maintainability +1 pt.

15. **SHIPPED — Log Startup Warning for High-Cardinality Per-Tenant Telemetry Risk**
    - Why it mattered: Prevents catastrophic Prometheus instance failures caused by tag cardinality explosion.
    - Delivered: `RetrievalTelemetryProductionWarningPostConfigure` + `StartupValidationWarningRuleNames.RetrievalTelemetryPerTenantTagsProductionLike`; `StartupConfigWarningsInstrumentationTests`.
    - Score impact realized: Supportability +1 pt.

16. **SHIPPED — Implement Strict Production Safety Guard for Dev API Key Bypass**
    - Why it mattered: Prevents critical authentication bypass vulnerabilities in production environments.
    - Delivered: `AuthenticationRules.CollectProductionApiKeyDevelopmentBypassDisallowed` in `ArchLucidConfigurationRules.CollectErrors` (Production-only fail-fast); covered by `ArchLucidConfigurationRulesTests`.
    - Score impact realized: Reliability +2 pts, Maintainability +1 pt.

17. **SHIPPED — Record RAG Cosine Faithfulness Scores via OTel Histogram**
   - Why it mattered: Enables long-term observability of LLM hallucination rates and RAG context quality.
   - Delivered: `ArchLucidInstrumentation.AgentFaithfulnessCosine` (`archlucid.agent.faithfulness_cosine`); recorded in `AgentOutputEvaluationRecorder`; unit tests in `AgentOutputEvaluationRecorderTests` and `AgentOutputQualityGateTelemetryTests`.
   - Score impact realized: AI/Agent Readiness +3 pts, Supportability +1 pt.

18. **SHIPPED — Integrate DataArchivalHostHealthCheck into Readiness Probe**
    - Why it mattered: Prevents the host from reporting healthy if background archival is failing, averting silent database bloat.
    - Delivered: `DataArchivalHostHealthCheck` registered on Combined/Worker with `ReadinessTags.Ready`; `ArchLucidReadinessHealthCheckOptions` maps Degraded → HTTP 503 on `/health/ready`.
    - Score impact realized: Reliability +2 pts, Supportability +1 pt.

19. **SHIPPED — Cache ComparisonReplayCostEstimator Output to Prevent CPU Spikes**
    - Why it mattered: Prevents redundant, heavy calculations when users rapidly refresh the Executive ROI dashboard.
    - Delivered: `ComparisonReplayCostEstimator` injects `IMemoryCache` with 15-minute absolute expiration per comparison id; `ComparisonReplayCostEstimatorTests.TryEstimateAsync_second_call_uses_memory_cache`.
    - Score impact realized: Executive Value Visibility +1 pt.

20. **SHIPPED — Validate Get-ArchLucidAzurePackage.ps1 using PSScriptAnalyzer in CI**
    - Why it mattered: Ensures the Azure Extractor strictly adheres to Tier 1 security boundaries (no credential exfiltration).
    - Delivered: CI job `azure-extractor-pester` runs `Invoke-ScriptAnalyzer` on `scripts/azure/Get-ArchLucidAzurePackage.ps1` (blocks Errors and selected security rules).
    - Score impact realized: Maintainability +1 pt.

21. **SHIPPED — Implement Synchronous Tier 2 Azure Extractor Test API Endpoint**
    - Why it mattered: Precedes the automated polling worker, allowing operators to test Tier 2 credential flow manually.
    - Delivered: `POST /v1/admin/azure-extractor/hosted/run` (`HostedAzureExtractorRunController`, `HostedAzureExtractorRunService`); `HostedAzureExtractorRunServiceTests`, `HostedAzureExtractorRunEndpointTests`.
    - Score impact realized: Adoption Friction +2 pts.

22. **SHIPPED — Implement Retry Policy for OIDC Metadata Discovery**
    - Why it mattered: Prevents transient network failures from permanently marking the OIDC provider as degraded at startup.
    - Delivered: `OidcAuthorityMetadataProbeHttpResilience` (3 Polly retries, exponential backoff + jitter) used by `OidcAuthorityMetadataProbe` and `OidcAuthorityStartupProbeHostedService`; unit tests.
    - Score impact realized: Reliability +2 pts.

23. **SHIPPED — Implement LlmMonthlyTenantDollarBudgetApproaching Event**
    - Why it mattered: Proactively alerts administrators before hard LLM budget cutoffs occur.
    - Delivered: `LlmMonthlyTenantDollarBudgetTracker.TryScheduleWarnAudit` emits `LlmTenantMonthlyDollarBudgetApproaching` once per UTC month at `IncludedUsdPerUtcMonth * WarnFraction`; `LlmMonthlyTenantDollarBudgetTrackerTests`.
    - Score impact realized: Supportability +1 pt (bundled with #15 in pillar rescore).

24. **SHIPPED — Add GraphSnapshot Cytoscape JSON Export**
    - Why it mattered: Allows operators to visualize the knowledge graph in external tools easily.
    - Delivered: `GET /v1/architecture/runs/{runId}/graph/cytoscape`, `GraphSnapshotCytoscapeMapper`, unit tests.
    - Score impact realized: Executive Value Visibility +4 pts (bundled with #4 in pillar rescore).

25. **SHIPPED — Add Unit Test for LlmCostEstimationEffectiveRates Negative Guard**
    - Why it mattered: Proves that FinOps guardrails cannot be bypassed by configuration typos.
    - Delivered: `LlmCostEstimationEffectiveRatesTests` asserts negative USD rates log a warning and fall back to default positive rates.
    - Score impact realized: Maintainability +1 pt (bundled with #14 in pillar rescore).

## Prompt Batching Guidance
- **Batch 1 (High-Value UI & Health) — COMPLETE:** Prompts #4, #5, #12, #24 shipped 2026-05-26.
- **Batch 2 (Core Reliability & Guardrails) — COMPLETE:** Prompts #6, #8, #11, #16, #18, #22 shipped 2026-05-26.
- **Batch 3 (AI Observability & Costs) — COMPLETE:** Prompts #7, #13, #14, #17, #19, #25 shipped 2026-05-26.
- **Batch 4 (Data Prep & Extractor Validation) — COMPLETE:** Prompts #9, #10, #15, #20, #21, #23 shipped 2026-05-26.
- **Remaining actionable improvements:** deferred #1/#2 (Stripe/SCIM) and polish items not in batches.

## Pending Questions for Later
- None at this time.