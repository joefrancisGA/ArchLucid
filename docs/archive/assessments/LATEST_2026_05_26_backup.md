# ArchLucid Assessment – (A) Headline Readiness: 89.18%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, evaluating the solution strictly from first principles based on the available codebase, and explicitly excluding all deferred V1.1/V2 items (such as AWS/GCP multi-cloud analysis, Jira/ServiceNow/Confluence connectors, multi-region failover, Slack interactive actions, and automated trial catalog teardown) from penalization.

## Executive Summary

**Headline Readiness (A):** The platform is fundamentally sound, mature, and commercially viable for V1. At **89.18%** readiness, the core paths (Pilot execution, governance, API structure, UI artifacts) are highly maintainable and well-tested. Batches 1–2 RAG/ROI work and Batch 4 ops probes (OIDC startup warning, bulk evidence batching, LLM rate warnings, SAML rotation runbook) shipped in this cycle; remaining `(A)` gaps are narrow (sandbox seed polish, UI chart binding) rather than systemic architectural flaws.

**Procurement/Market-Motion Realism (B):** Enterprise adoption will face moderate friction. While technical isolation (Row-Level Security, separate catalogs) and compliance narratives (SOC 2 self-attestation, Tier 1 zero-credential extraction) are strong, the absence of a CPA-issued SOC 2 report will cause prolonged procurement cycles with tier-1 enterprise security reviewers. The V1 Azure-only stance is intentional, and AWS/GCP customers represent a V1.1 buyer segment.

**Commercial Picture:** Monetization is sales-led and highly actionable. Time-to-value is excellent through the Core Pilot Checklist. ROI is proven natively within the product via the Executive ROI summary and Azure Retail Prices integration. The deferred Stripe live-keys flip means immediate self-serve checkout is on hold, but the underlying mechanisms (wallet, trial funnel) are robustly engineered.

**Enterprise Picture:** The identity and governance posture is enterprise-ready, supporting Entra ID, JWT, ApiKey, and an incoming SAML SP. The pre-commit governance gates and 23 bundled policy packs provide immediate enterprise value. 

**Engineering Picture:** Engineering hygiene is exceptional. Architecture invariants (INV-001 through INV-015), Roslyn analyzers, durable orchestration, and explicit FinOps token metering create a highly maintainable and supportable codebase. The primary engineering risks lie in the edge cases of LLM token overflow (partially mitigated), RAG citation hallucinations, and the eventual need to scale out the orchestrator.

## Weighted Quality Assessment

Qualities are ranked below from most urgent to least urgent, based on their weighted deficiency (Weight × (100 - Score)).

### 1. Cutting-Edge AI Technology
- **Score:** 80
- **Weight:** 8
- **Weighted Deficiency:** 160
- **Justification:** Modern LLMs and structured outputs are in place. **`IRetrievalReranker`** + **`AzureAiSearchSemanticRetrievalReranker`** shipped (lexical fallback in Development; semantic ranker when Azure Search is configured). Graph-RAG implementation remains V2; embedding strategy pre-locked in ADR 0036.
- **Tradeoffs:** Azure AI Search semantic ranker trades ~3–5 nDCG@10 vs Cohere direct API for zero new subprocessors, private endpoints, and single Azure FinOps — the right trade for V1 enterprise posture.
- **Improvement Recommendations:** Revisit Cohere via Foundry only if golden-cohort citation precision stays below 0.80 for two consecutive weeks after reranker + faithfulness harness baselines.

### 2. AI/Agent Readiness
- **Score:** 88
- **Weight:** 8
- **Weighted Deficiency:** 96
- **Justification:** Quality gates and agent trace pipelines are strong. RAG-V1 foundation (corpus seam, policy-pack / prior-manifest / platform-docs indexing, citation formatter), semantic rerank wiring, **`scripts/ci/eval_agent_faithfulness.py`**, and **`GraphSnapshot` v1** stability declaration (ADR 0036) are shipped. Graph-RAG retrieval remains V2 (`RAG-V2-001`).
- **Tradeoffs:** Strict JSON schema extraction guarantees stability; reranking + faithfulness CI closes the citation-hallucination gap without opening a second vendor data plane.
- **Improvement Recommendations:** Monitor golden-cohort faithfulness baselines; promote Graph-RAG only if V1 harness fails the floor for two consecutive weeks.

### 3. Adoption Friction
- **Score:** 88
- **Weight:** 6
- **Weighted Deficiency:** 72
- **Justification:** The Azure extractor's Tier 1 posture (no vendor credentials) significantly lowers friction. OIDC authority startup probe and batched bulk evidence uploads (`paginationToken`) reduce integration and large-upload friction.
- **Tradeoffs:** Strict tenant isolation (database-per-tenant) increases deployment and scaling friction but ensures bulletproof security guarantees for enterprises.
- **Improvement Recommendations:** Surface OIDC probe results on the operator diagnostics dashboard if not already linked from admin health APIs.

### 4. Time-to-Value
- **Score:** 93
- **Weight:** 7
- **Weighted Deficiency:** 49
- **Justification:** The 6-step pilot path is extremely fast. **`GET /v1/ask/templates`** ships five starter prompts; platform-docs corpus indexing is live for Ask intent detection.
- **Tradeoffs:** A flexible, unopinionated advisory prompt interface allows broad queries but provides no initial guidance for new users to find value instantly.
- **Improvement Recommendations:** Wire operator UI chips to the templates endpoint (if not already surfaced in the current UI branch).

### 5. Proof-of-ROI Readiness
- **Score:** 92
- **Weight:** 5
- **Weighted Deficiency:** 40
- **Justification:** The dedicated `GET /v1/roi/executive-summary` endpoint and Azure Retail Prices integration are best-in-class for proving direct financial impact.
- **Tradeoffs:** Using Azure Retail Prices provides an objective baseline, but it may not reflect the customer's negotiated enterprise discounts, making savings appear illustrative rather than exact.
- **Improvement Recommendations:** Implement cross-run deduplication for systemic issues so overlapping findings don't inflate ROI sums.

### 6. Executive Value Visibility
- **Score:** 95
- **Weight:** 4
- **Weighted Deficiency:** 20
- **Justification:** Export features (DOCX, Markdown), compliance drift tracking, and the knowledge graph provide excellent executive visibility. **`ExecutiveRoiSummaryResponse.HistoricalTrends`** ships six-month top-five systemic issue series for charting.
- **Tradeoffs:** The lack of a polished, single-page PDF board pack means executives must view the UI or read text-heavy exports.
- **Improvement Recommendations:** Add a dashboard chart component bound to `HistoricalTrends` (UI follow-on).

### 7. Maintainability
- **Score:** 93
- **Weight:** 4
- **Weighted Deficiency:** 28
- **Justification:** Engineering discipline is exceptionally high. Execution mode persistence, webhook ordering tests (INV-015), and LLM negative/zero rate startup warnings are in place.
- **Tradeoffs:** Strict invariant enforcement (like blocking composition root violations) slows down rapid prototyping but prevents long-term spaghetti code.
- **Improvement Recommendations:** Extend NetArchTest static-state guard beyond Application if any new mutable singletons appear.

### 8. Reliability
- **Score:** 92
- **Weight:** 2
- **Weighted Deficiency:** 16
- **Justification:** DbUp migrations, transaction outboxes, and `ArchLucid.Worker` provide solid reliability out of the box. Multi-region failover and automated elastic pool teardown are intentionally V2, while warm catalog provisioning supports initial trial SLA.
- **Tradeoffs:** Using in-process memory caching instead of mandatory Redis drastically simplifies the initial deployment topology for single-node setups.
- **Improvement Recommendations:** Implement warm pool provisioning to eliminate DbUp migration latency on trial signups.

### 9. Supportability
- **Score:** 94
- **Weight:** 1
- **Weighted Deficiency:** 6
- **Justification:** Extensive diagnostics (`/health`, `/version`, `doctor`), OIDC startup warnings, SAML rotation runbook generator, and OpenTelemetry integration make supportability strong.
- **Tradeoffs:** High observability telemetry (token tracking, tracing) can bloat database size and metrics ingestion costs if not sampled correctly.
- **Improvement Recommendations:** Automate SAML rotation plan generation in release pipelines when certificate expiry is within 30 days.

## Top 12 Most Important Weaknesses
1. Golden-cohort faithfulness baselines need soak time before merge-blocking CI enforcement (`--enforce` on `eval_agent_faithfulness.py`).
2. Azure AI Search semantic ranker path requires production `IAzureSearchClient` implementation (Development uses lexical fallback).
3. Operator UI may not yet surface Ask template chips despite `GET /v1/ask/templates`.
4. Execution mode (Real vs Simulator) persistence is ambiguous in edge-case traces.
5. Executive ROI historical trends need a dashboard visualization component.
6. Missing OTel histograms obscure per-agent token consumption limits.
7. OIDC configuration failures fail silently until runtime, rather than at host startup.
8. Webhook middleware processing order lacks strict pipeline enforcement.
9. Bulk evidence uploads lack pagination streaming, risking API memory pressure.
10. Missing reasoning-token test coverage limits billing confidence under edge cases.
11. Negative rate guards on LlmDeploymentUsdRates are incomplete, risking corrupted cost estimates from configuration typos.
12. Trial signups experience slow latency during on-demand DbUp schema migrations because warm catalogs are not yet provisioned.

## Top 6 Monetization Blockers
1. Stripe live-keys flip is manually deferred, preventing self-serve checkout.
2. Azure Marketplace SaaS offer is not yet in the `Published` state.
3. Absence of a signed, public reference customer reduces organic conversion rates.
4. Cross-run ROI double-counting could undermine trust in the financial savings claims.
5. Trial signup marketing attribution drops parameters before server-side conversion, muddying CAC analysis.
6. Lack of a guided product tour prevents trial users from reaching the "Aha!" moment without sales assistance.

## Top 6 Enterprise Adoption Blockers
1. Absence of a CPA-issued SOC 2 report will stall InfoSec reviews.
2. Missing third-party penetration test summary restricts trust for highly regulated buyers.
3. Setup friction for integrating internal SAML/OIDC identity providers without auto-discovery.
4. Tier-2 hosted Azure extractor requires cross-tenant federated identity setup which InfoSec may scrutinize heavily.
5. Lack of bulk upload pagination limits capability to ingest massive enterprise architecture evidence sets.
6. Ambiguous execution mode (Real vs Simulator) in traces could cause audit failures during enterprise compliance checks.

## Top 6 Engineering Risks
1. RAG hallucination and unfaithful citations degrading trust in the AI output.
2. In-memory caching bottlenecks when horizontally scaling the API fleet before Redis is mandated.
3. Silent API memory exhaustion from unpaginated bulk evidence uploads.
4. LLM token aggregator precision loss or overflow if the recent `long` cast fixes miss DTOs.
5. Corrupted state from out-of-order webhook processing from Stripe or ITSM vendors.
6. Silent OIDC metadata discovery failures masking configuration drift until user login errors.

## Most Important Truth
ArchLucid is highly engineered, secure, and operationally rigorous, but its near-term success hinges on finalizing the AI RAG faithfulness and adoption smoothing, as the foundational architecture is already robust enough to scale.

## Top Improvement Opportunities

1. **RAG CorpusKind Seam and Policy Pack Indexing (TB-021 Slice 1) — SHIPPED**
   - **Why it matters:** Foundation for context-aware, faithful AI responses.
   - **Expected impact:** Directly improves AI/Agent Readiness (+2-4 pts), Cutting-Edge AI Technology (+1-2 pts). Weighted readiness impact: +0.3-0.5%.
   - **Affected qualities:** AI/Agent Readiness, Cutting-Edge AI Technology.
   - **Actionable now:** Yes.
   - **Prompt:** Read `docs/library/RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md`. Implement the `CorpusKind` enum and the policy-pack indexer in `ArchLucid.Retrieval`. Update `AskService` to accept and filter by `CorpusKind`. Ensure compliance retrieval is wired up. Add unit tests for the indexer and retrieval service. Do not change existing outbox logic. Acceptance criteria: `CorpusKind` seam exists, policy-pack indexer parses and stores documents, and `AskService` can filter by corpus.

2. **OTel Histogram for Token Counters (TB-015 Phase A) — SHIPPED**
   - **Why it matters:** Provides fine-grained observability into LLM token consumption by agent type, necessary for FinOps.
   - **Expected impact:** Directly improves Supportability (+5-8 pts), Maintainability (+1-2 pts). Weighted readiness impact: +0.2-0.3%.
   - **Affected qualities:** Supportability, Maintainability.
   - **Actionable now:** Yes.
   - **Prompt:** Edit `ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs` and `ArchLucid.AgentRuntime/LlmCompletionAccountingClient.cs` to add a `Histogram<long>` for `archlucid.llm.completion_tokens` alongside existing counters. Introduce an `AsyncLocal<LlmAccountingInvocationScope>` struct for `AgentKind` and `InvokeKind`. Update `RealAgentExecutor` to scope the invocation. Ensure existing additive counters are kept intact. Acceptance criteria: Histogram metrics emitted with `archlucid.llm.consume_role` and `archlucid.llm.invoke_kind` labels.

3. **Executive ROI Summary Cross-Run Deduplication — SHIPPED**
   - **Why it matters:** Ensures ROI estimates are truthful and do not double-count repeated findings.
   - **Expected impact:** Directly improves Proof-of-ROI Readiness (+5-7 pts), Executive Value Visibility (+3-5 pts). Weighted readiness impact: +0.6-0.8%.
   - **Affected qualities:** Proof-of-ROI Readiness, Executive Value Visibility.
   - **Actionable now:** Yes.
   - **Prompt:** Modify `ExecutiveRoiSummaryService.cs`. When aggregating the latest committed runs per system for `GET /v1/roi/executive-summary`, group by `FindingId` and deduplicate overlapping findings before summing the estimated USD savings. Ensure it does not raw-sum duplicate CI reruns. Add unit tests for the deduplication logic. Acceptance criteria: Repeated findings across runs of the same system contribute to the ROI sum only once.

4. **Architecture Invariant Wave B: Execution Mode Persistence (TB-011) — SHIPPED**
   - **Why it matters:** Prevents ambiguity between simulated and real LLM runs in the audit trail.
   - **Expected impact:** Directly improves Maintainability (+5-7 pts), Reliability (+2-4 pts). Weighted readiness impact: +0.5-0.7%.
   - **Affected qualities:** Maintainability, Reliability.
   - **Actionable now:** Yes.
   - **Prompt:** Implement INV-002 and INV-004 constraints. Ensure execution mode (`Simulator`, `Real`, `Mixed`) is persisted durably on the `ArchitectureRun` entity and returned in DTOs. Update DbUp SQL scripts to add an `ExecutionMode` column if missing. Enforce that replay scope isolation respects this mode. Acceptance criteria: Database schema stores the mode, and API responses accurately reflect it.

5. **Webhook Middleware Ordering Enforcement (TB-012) — SHIPPED**
   - **Why it matters:** Guarantees webhook payloads are processed deterministically.
   - **Expected impact:** Directly improves Maintainability (+4-6 pts), Reliability (+2-3 pts). Weighted readiness impact: +0.3-0.5%.
   - **Affected qualities:** Maintainability, Reliability.
   - **Actionable now:** Yes.
   - **Prompt:** Implement INV-015 webhook ordering. Create a pipeline or middleware in `ArchLucid.Api` enforcing inbound webhooks (e.g., Stripe, Jira) are ordered before handler bodies execute. Add a `NetArchTest` to prevent static state in `ArchLucid.Application`. Acceptance criteria: Analyzer or test fails if static mutable state is detected, and webhooks pass through the new ordered middleware.

6. **Automated Azure Extractor Tier-2 Scaffold — SHIPPED**
   - **Why it matters:** Transitions customer-run scripts to hosted continuous polling.
   - **Expected impact:** Directly improves Adoption Friction (+5-7 pts). Weighted readiness impact: +0.6-0.8%.
   - **Affected qualities:** Adoption Friction.
   - **Actionable now:** Yes.
   - **Prompt:** Create a scaffold for `AzureExtractorAutoPullHostedService` in `ArchLucid.Worker`. Implement a background pacing loop and discovery logging for continuous polling. Set `AzureExtractor:AutoPull:Enabled=false` by default. Do not wire up the actual ingest. Add `WorkloadIdentityHostedAzureExtractorCredentialFactory` stub for `ClientAssertionCredential`. Acceptance criteria: Background service starts, respects the disabled flag, and logs its pacing loop.

7. **Generic OIDC Auto-Discovery Health Check — SHIPPED 2026-05-26**
   - **Why it matters:** Reduces setup friction by validating identity provider metadata on startup.
   - **Expected impact:** Directly improves Adoption Friction (+3-5 pts), Supportability (+4-6 pts). Weighted readiness impact: +0.4-0.6%.
   - **Affected qualities:** Adoption Friction, Supportability.
   - **Actionable now:** Yes.
   - **Prompt:** Update `ArchLucid.Host.Composition` configuration extensions. When `ArchLucidAuth:Mode=JwtBearer` and a generic `Authority` is configured, add a startup `IHostedService` that probes the `/.well-known/openid-configuration` endpoint. Log a clear warning (via `ArchLucidInstrumentation.RecordStartupConfigWarning`) if unreachable. Acceptance criteria: Startup warns operators of bad OIDC configuration immediately.

8. **Trial Orphaned-Catalog Teardown Script (TB-017) — DEFERRED V2**
   - **Why it matters:** Prevents cloud sprawl and limits hosting costs.
   - **Expected impact:** Directly improves Maintainability (+3-5 pts), Reliability (+1-2 pts). Weighted readiness impact: +0.2-0.3%.
   - **Affected qualities:** Maintainability, Reliability.
   - **Actionable now:** No (V2 cost-control; warm catalogs cover V1 trial SLA).
   - **Prompt:** Create a PowerShell runbook `scripts/ops/teardown-orphaned-trial.ps1`. The script takes a `TenantId`, queries `TenantDatabaseBindings`, drops the Azure SQL Database, removes Key Vault secrets tied to the tenant, and cleans up `dbo.Tenants`. Follow the order in `docs/runbooks/TRIAL_LIFECYCLE.md`. Acceptance criteria: Script safely orchestrates teardown without affecting other tenants.

9. **RAG Faithfulness Evaluation Harness (TB-021 Slice 5) — SHIPPED 2026-05-26**
   - **Why it matters:** Establishes CI metrics for LLM hallucination and groundedness.
   - **Expected impact:** Directly improves AI/Agent Readiness (+3-5 pts). Weighted readiness impact: +0.4-0.6%.
   - **Affected qualities:** AI/Agent Readiness.
   - **Actionable now:** Yes.
   - **Prompt:** Create `scripts/ci/eval_agent_faithfulness.py`. This script should parse the outputs of the golden cohort agents and compare the generated citations against the retrieved context chunks using a lightweight semantic similarity check. Generate a report artifact `faithfulness-report.md`. Acceptance criteria: CI script outputs a measurable faithfulness score.

10. **Bulk Upload Limits and Pagination Support — SHIPPED 2026-05-26**
    - **Why it matters:** Prepares the API for enterprise-scale evidence attachments.
    - **Expected impact:** Directly improves Adoption Friction (+2-4 pts). Weighted readiness impact: +0.2-0.4%.
    - **Affected qualities:** Adoption Friction.
    - **Actionable now:** Yes.
    - **Prompt:** Update the evidence upload endpoints in `ArchLucid.Api` to support chunked multipart uploads. Keep the V1 cap at 30 files, but structure the parsing loop to accept a `PaginationToken` and process files in streaming batches. Add a 413 Payload Too Large explicit return if total size exceeds max. Acceptance criteria: Evidence upload streams efficiently without high memory pressure.

11. **"Ask" Feature Default Prompt Templates — SHIPPED 2026-05-26**
    - **Why it matters:** Solves the "blank canvas" problem for new users.
    - **Expected impact:** Directly improves Time-to-Value (+5-7 pts). Weighted readiness impact: +0.6-0.8%.
    - **Affected qualities:** Time-to-Value.
    - **Actionable now:** Yes.
    - **Prompt:** In `ArchLucid.Application/Advisory/AskService.cs`, expose a new endpoint `GET /v1/advisory/ask/templates`. Return a static list of 5 high-value prompt templates (e.g., "Summarize the security boundaries", "List single points of failure"). Wire the operator UI to display these as clickable chips above the chat box. Acceptance criteria: Endpoint returns templates and UI displays them.

12. **Top 5 Systemic Issues Trend Chart Data Source — SHIPPED 2026-05-26**
    - **Why it matters:** Provides visual evidence of risk reduction over time.
    - **Expected impact:** Directly improves Executive Value Visibility (+6-8 pts), Proof-of-ROI Readiness (+3-5 pts). Weighted readiness impact: +0.6-0.8%.
    - **Affected qualities:** Executive Value Visibility, Proof-of-ROI Readiness.
    - **Actionable now:** Yes.
    - **Prompt:** Extend `ExecutiveRoiSummaryService.cs` to return a time-series array of the top 5 systemic issues across the last 6 months. Add a `HistoricalTrends` property to `ExecutiveRoiSummaryResult`. Query the committed runs grouped by month and `FindingId`. Acceptance criteria: API response includes historical issue counts.

13. **SAML SP Certificate Rotation Runbook Generator — SHIPPED 2026-05-26**
    - **Why it matters:** Prevents sudden authentication outages.
    - **Expected impact:** Directly improves Supportability (+6-8 pts), Maintainability (+3-4 pts). Weighted readiness impact: +0.3-0.5%.
    - **Affected qualities:** Supportability, Maintainability.
    - **Actionable now:** Yes.
    - **Prompt:** Create a script `scripts/ops/generate-saml-rotation-plan.ps1`. The script queries `ArchLucidAuth:Saml` config, checks expiration of the current signing certificate, and generates a markdown checklist `SAML_ROTATION_PLAN.md` guiding the operator through metadata exchange. Acceptance criteria: Script accurately extracts certificate expiry and outputs an action plan.

14. **LlmCostEstimator Negative-Rate Guard Expansion — SHIPPED 2026-05-26**
    - **Why it matters:** Ensures cost estimations remain positive and accurate.
    - **Expected impact:** Directly improves Maintainability (+2-4 pts), Proof-of-ROI Readiness (+1-2 pts). Weighted readiness impact: +0.2-0.3%.
    - **Affected qualities:** Maintainability, Proof-of-ROI Readiness.
    - **Actionable now:** Yes.
    - **Prompt:** Ensure that `LlmCostEstimationEffectiveRates` logs a critical warning via `ArchLucidInstrumentation.RecordStartupConfigWarning` if any deployment rate falls to zero or negative. Add a unit test verifying that setting a rate to `-1.0m` logs the warning and falls back to the global default. Acceptance criteria: Negative rates trigger a warning and fall back gracefully.

15. **Simplified DbUp Seeding for Sandbox Environments — SHIPPED** (via `DemoSeedService` / `DemoOptions`)
    - **Why it matters:** Accelerates local development setup.
    - **Expected impact:** Directly improves Maintainability (+5-7 pts), Time-to-Value (+2-3 pts). Weighted readiness impact: +0.4-0.6%.
    - **Affected qualities:** Maintainability, Time-to-Value.
    - **Actionable now:** Yes.
    - **Prompt:** In `ArchLucid.Persistence/DbUp`, create a `SandboxSeeder` class that runs after migrations only if `ASPNETCORE_ENVIRONMENT=Development` or `Sandbox`. It inserts a mock tenant, policy packs, and a sample architecture run. Acceptance criteria: Running locally yields a populated UI automatically.

16. **Signup Marketing Attribution Persistence (TB-019) — SHIPPED**
    - **Why it matters:** Ensures paid acquisition spend is tied to actual tenant conversions, not just impressions.
    - **Expected impact:** Directly improves Proof-of-ROI Readiness (+2-3 pts). Weighted readiness impact: +0.2-0.3%.
    - **Affected qualities:** Proof-of-ROI Readiness.
    - **Actionable now:** Yes.
    - **Prompt:** In `ArchLucid.Application/Tenancy/TenantProvisioningService.cs`, add logic to extract `x-archlucid-first-touch` headers or equivalent marketing attribution payload (utm_source, etc.). Persist this into `dbo.TenantMarketingAttribution` or typed audit events upon successful tenant provisioning. Add a low-cardinality OTel counter for provision successes grouped by attribution medium. Acceptance criteria: Successful trial signups correctly log their acquisition source durably.

17. **Marketing Structured Data and Analytics (TB-020) — SHIPPED** (`MarketingJsonLd`, consent-gated Clarity)
    - **Why it matters:** Improves organic SERP placement and gives visibility into marketing funnel conversion safely.
    - **Expected impact:** Directly improves Adoption Friction (+1-3 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Adoption Friction.
    - **Actionable now:** Yes.
    - **Prompt:** In `archlucid-ui/src/app/(marketing)/layout.tsx`, inject JSON-LD `@type: SoftwareApplication` structured data. Ensure `aggregateRating` is NOT included. Add a Microsoft Clarity loader that activates only if `NEXT_PUBLIC_ARCHLUCID_CLARITY_PROJECT_ID` is present and user consent is granted. Acceptance criteria: Marketing pages emit valid SoftwareApplication JSON-LD and Clarity loads conditionally.

18. **RAG Tenant Prior-Manifest Chunks (RAG-V1-002) — SHIPPED**
    - **Why it matters:** Allows the Ask feature to accurately answer questions about past architectural decisions in the current system.
    - **Expected impact:** Directly improves AI/Agent Readiness (+2-4 pts), Time-to-Value (+2-3 pts). Weighted readiness impact: +0.3-0.5%.
    - **Affected qualities:** AI/Agent Readiness, Time-to-Value.
    - **Actionable now:** Yes.
    - **Prompt:** Implement `RAG-V1-002` from the tech backlog. Update the Retrieval ingestion pipeline to chunk and index the 'Decisions' and 'Findings' sections of previously committed manifests for the tenant. Add a scope filter to ensure chunks are strictly tenant-isolated. Acceptance criteria: Previous run decisions are retrievable by the `AskService`.

19. **RAG Azure Retail Prices Lookup (RAG-V1-003) — SHIPPED**
    - **Why it matters:** Grounding cost recommendations in precise, up-to-date retail values rather than LLM memory.
    - **Expected impact:** Directly improves AI/Agent Readiness (+1-3 pts), Proof-of-ROI Readiness (+2-4 pts). Weighted readiness impact: +0.2-0.4%.
    - **Affected qualities:** AI/Agent Readiness, Proof-of-ROI Readiness.
    - **Actionable now:** Yes.
    - **Prompt:** Implement `RAG-V1-003` from the tech backlog. Add a structured, non-embedding retrieval tool to `ArchLucid.Retrieval` that queries the Azure Retail Prices API for specific SKUs mentioned in the architecture. Provide this structured output as context to the agent. Acceptance criteria: Agents can cite accurate, current Azure retail pricing for cost recommendations.

20. **Warm Tenant Catalogs in Elastic Pool (TB-018) — SHIPPED**
    - **Why it matters:** Eliminates slow signup latency caused by running DbUp migrations on-demand.
    - **Expected impact:** Directly improves Reliability (+2-4 pts), Adoption Friction (+2-3 pts). Weighted readiness impact: +0.3-0.5%.
    - **Affected qualities:** Reliability, Adoption Friction.
    - **Actionable now:** Yes.
    - **Prompt:** Implement a background worker to maintain `N` empty, fully migrated logical catalogs in the Azure SQL Elastic Pool. Modify `SqlTenantSqlCatalogProvisioner.ProvisionTenantCatalogAsync` to claim a warm DB from this pool (skipping `DatabaseMigrator.RunTenant` if schema matches) and mark it active. Acceptance criteria: Trial signups complete instantly without waiting for schema migrations.

21. **RAG Citation Formatter and Grounding Trace (RAG-V1-000 Remainder) — SHIPPED**
    - **Why it matters:** Provides transparent, clickable evidence links back to the source documents for AI answers.
    - **Expected impact:** Directly improves AI/Agent Readiness (+3-5 pts), Executive Value Visibility (+2-4 pts). Weighted readiness impact: +0.4-0.6%.
    - **Affected qualities:** AI/Agent Readiness, Executive Value Visibility.
    - **Actionable now:** Yes.
    - **Prompt:** Implement the remainder of `RAG-V1-000`. Introduce a `RetrievalGroundingTrace` payload attached to the Ask feature's response. Add a formatting utility that injects bracketed citations [1], [2] into the LLM stream, linked to the `RetrievalGroundingTrace` chunks. Add an architecture test ensuring Ask traces are properly segregated. Acceptance criteria: Answers include structured citations that trace exactly to the RAG context.

22. **Platform Docs Corpus for Ask Feature (RAG-V1-004)**
    - **Why it matters:** Allows users to Ask about ArchLucid operations directly within the product.
    - **Expected impact:** Directly improves Time-to-Value (+3-5 pts), Adoption Friction (+2-3 pts). Weighted readiness impact: +0.4-0.6%.
    - **Affected qualities:** Time-to-Value, Adoption Friction.
    - **Actionable now:** Yes.
    - **Prompt:** Implement `RAG-V1-004`. Chunk and index the `docs/library/customer-facing/` markdown files into a `PlatformDocs` corpus kind. Expose a toggle in the Ask UI to search platform documentation instead of the tenant's architecture. Acceptance criteria: Users can query the platform docs natively via the Ask service.

23. **Azure AI Search Semantic Reranker (`IRetrievalReranker`) — SHIPPED 2026-05-26**
    - **Why it matters:** Improves RAG precision for Ask and agent prompt-context without adding a Cohere subprocessor or cross-cloud egress. Owner decision (2026-05-26): **primary = Azure AI Search semantic ranker**; **fallback = Cohere Rerank-v3.5 via Azure AI Foundry Models** only if faithfulness eval shows citation precision below 0.80 for two consecutive golden-cohort weeks.
    - **Expected impact:** Directly improves Cutting-Edge AI Technology (+2-3 pts), AI/Agent Readiness (+2-4 pts). Weighted readiness impact: +0.4-0.7% when shipped.
    - **Affected qualities:** Cutting-Edge AI Technology, AI/Agent Readiness.
    - **Actionable now:** Yes.
    - **Cost / latency constraints (binding):** Max **50** candidates per rerank call; **≤ 1** rerank per Ask call; **≤ 3** per agent run (Topology/Cost/Compliance retrievals); **≤ 150ms p95** added latency; platform S1 semantic ranker (~$250/mo shared index, ~$1/1K queries overage); per-tenant opt-out via `Retrieval:Reranking:Enabled` (default `true` in Production, `false` in Development).
    - **Prompt:** Implement contextual reranking per owner decision **2026-05-26**. **Primary path:** Azure AI Search semantic ranker (no new subprocessor; private endpoint + Entra compatible). **Do not** integrate direct Cohere API in V1 unless a follow-on owner decision supersedes this after failed faithfulness gates.

      1. In `ArchLucid.Retrieval`, add `IRetrievalReranker` with `Task<IReadOnlyList<RetrievalChunk>> RerankAsync(string query, IReadOnlyList<RetrievalChunk> candidates, CancellationToken cancellationToken)`.
      2. Add `RetrievalRerankingOptions` in `ArchLucid.Core/Configuration/` with `Enabled` (default `true`), `MaxCandidates` (default `50`), `Provider` (enum: `AzureAiSearchSemantic` only for V1).
      3. Implement `AzureAiSearchSemanticReranker` using the existing Azure AI Search index client; cap candidates at `MaxCandidates`; no fan-out (one rerank per query).
      4. Wire rerank **after** vector/keyword retrieval and **before** prompt assembly in `AskService` and agent prompt-context paths (Topology, Cost, Compliance — max 3 rerank invocations per run).
      5. Emit OTel: extend `LlmAccountingInvocationScope` or add `archlucid.rerank.latency_ms` histogram and `archlucid.llm.invoke_kind = Rerank` (bounded cardinality) so FinOps dashboards include rerank cost alongside completion tokens.
      6. Register in `ArchLucid.Host.Composition` `RegisterContextIngestionAndKnowledgeGraph` (or adjacent retrieval registration). `appsettings.Development.json`: `Retrieval:Reranking:Enabled = false`; `appsettings.Production.json`: `true`.
      7. Unit tests: `AzureAiSearchSemanticRerankerTests` with mocked search client; integration test proving Ask path calls reranker when enabled.
      8. Document constraints in `docs/library/RAG_QUALITY_TECHNICAL_BACKLOG.md` (new subsection "Reranking — V1 decision") and `CONFIGURATION_REFERENCE.md` (`Retrieval:Reranking` keys).

      **Acceptance criteria:** Ask and agent retrieval paths invoke reranker when enabled; disabled in Development by default; p95 rerank latency observable; no direct Cohere API dependency; faithfulness harness (Improvement #9) can measure citation precision before/after rerank.

      **Do not change:** Outbox indexing pipeline, manifest fingerprinting, cross-tenant retrieval rules (ADR 0031), or MCP membrane scope.

24. **GraphSnapshot v1 Schema Stability Declaration + Graph-RAG Embedding Pre-Decision — SHIPPED 2026-05-26**
    - **Why it matters:** Closes the V2 Graph-RAG (`RAG-V2-001`) prerequisite without forcing schema churn later. Investigation (2026-05-26) confirmed `GraphSnapshot` is functionally stable: `SchemaVersion = 1` honored across JSON + MessagePack, stable `Nodes`/`Edges`/`Warnings`, well-known type catalogs (`GraphNodeTypes`, `GraphEdgeTypes`), `GraphSnapshotCanonicalFingerprint` for reuse, full SQL/bulk-copy persistence with relational + JSON-merge integration tests, pagination, and Cytoscape mapping. Embedding technique now locked: **Azure OpenAI `text-embedding-3-small`, one vector per node, 1-hop expansion at query time via existing `GraphSnapshotExtensions`, stored in `AzureAiSearchVectorIndex`, refreshed via ADR 0004 outbox on authority commit, embeddings excluded from manifest fingerprint.** Rejected alternatives: Microsoft GraphRAG community summarization (per-snapshot LLM cost violates wallet model); structural-only embeddings (Node2Vec/GraphSAGE — wrong fit for small semantic graphs).
    - **Expected impact:** Directly improves AI/Agent Readiness (+2-3 pts), Cutting-Edge AI Technology (+1-2 pts), Maintainability (+1-2 pts). Weighted readiness impact: +0.2-0.4%.
    - **Affected qualities:** AI/Agent Readiness, Cutting-Edge AI Technology, Maintainability.
    - **Actionable now:** Yes (schema declaration + embedding decision documentation only — full Graph-RAG implementation remains V2 per `RAG_QUALITY_TECHNICAL_BACKLOG.md` §V2 `RAG-V2-001`).
    - **Prompt:** Formalize the `GraphSnapshot` v1 schema as stable and pre-record the Graph-RAG embedding decision so V2 work can start without re-litigating either.

      1. **Schema stability marker:** Add an XML doc header on `ArchLucid.Contracts/Persistence/Graph/GraphSnapshot.cs` stating: `SchemaVersion 1 shipped and stable as of 2026-05-26. Changes must be additive (new optional fields) or bump SchemaVersion. Field removals, type changes, and rename are breaking and require a new SchemaVersion + migration path.` Apply the same convention header to `GraphNode.cs` and `GraphEdge.cs`.
      2. **Architecture test:** Add `ArchLucid.KnowledgeGraph.Tests/GraphSnapshotSchemaStabilityTests.cs` asserting `new GraphSnapshot().SchemaVersion == 1` and that the public surface of `GraphSnapshot`, `GraphNode`, `GraphEdge` has not regressed (snapshot the property list; fail on diff without explicit `SchemaVersion` bump).
      3. **Reserved annotation prefix:** Document in `docs/library/KNOWLEDGE_GRAPH.md` that `GraphNode.Properties` keys with prefix `embedding:*` (e.g. `embedding:model`, `embedding:dim`, `embedding:hash`) are reserved for future Graph-RAG metadata and must not be used by other features. No code change — convention only, enforced at PR review.
      4. **Embedding decision record:** Add a new ADR `docs/architecture/adrs/0036-graph-rag-embedding-strategy.md` (Status: Proposed) recording the decisions in this improvement: `text-embedding-3-small` (Azure OpenAI, already-wired `AzureOpenAiEmbeddingService`), one vector per node embedding `NodeType + Label + Category + ReasoningTrace`, 1-hop expansion at query time via existing `GraphSnapshotExtensions.GetOutgoing/IncomingTargets`, storage in `AzureAiSearchVectorIndex` (same private-endpoint posture as Ask retrieval), refresh via ADR 0004 outbox on authority commit, embeddings excluded from `GraphSnapshotCanonicalFingerprint` (same rule as RAG retrieval chunks per `RAG_QUALITY_TECHNICAL_BACKLOG.md` normative constraints), per-tenant cost gated by `LlmMonthlyTenantDollarBudgetTracker`. Document the rejection of Microsoft GraphRAG community summarization (per-snapshot LLM cost incompatible with wallet model) and structural-only embeddings (wrong fit for small semantic graphs).
      5. **Update `RAG_QUALITY_TECHNICAL_BACKLOG.md` §V2 `RAG-V2-001`:** Replace "After graph surface stabilises" with "Schema stable as of 2026-05-26 (ADR 0036); promote to V2 implementation only after V1 RAG foundation + reranker + faithfulness harness fail to hit faithfulness floor on two consecutive golden-cohort weeks."

      **Acceptance criteria:** Schema stability XML doc header present on all three contract types; architecture test enforces `SchemaVersion == 1`; reserved `embedding:*` prefix documented; ADR 0036 committed as Proposed with the embedding decisions above; `RAG_QUALITY_TECHNICAL_BACKLOG.md` reflects the new V2 trigger language.

      **Do not change:** Existing `GraphSnapshot`/`GraphNode`/`GraphEdge` fields, `GraphSnapshotCanonicalFingerprint` algorithm, serialization formats, persistence schema, well-known type catalogs, or any agent / decisioning behavior. No new vector index code in this PR — that is V2 `RAG-V2-001`.

25. **DEFERRED: Stripe Live Keys Flip & Commerce Un-hold**
    - **Why it matters:** Enables actual monetization.
    - **Expected impact:** Improves Time-to-Value.
    - **Affected qualities:** Time-to-Value.
    - **Reason it is deferred:** Flipping to live keys requires owner-only Partner Center seller verification.
    - **Input needed:** Please confirm when the business entity verification is complete to remove TEST mode guards.

## Prompt Batching Guidance

- **Batch 1 (RAG & AI Enhancements):** **SHIPPED 2026-05-26** — #1, #9, #18–#22, #23, #24.
- **Batch 2 (API & ROI Features):** **SHIPPED 2026-05-26** — #3, #10, #11, #12.
- **Batch 3 (Integrations & Marketing):** **SHIPPED** — #16 (marketing attribution), #17 (JSON-LD + Clarity).
- **Batch 4 (Ops & Maintainability):** **SHIPPED 2026-05-26** — #2 (prior), #4–#7, #13–#15, #20.

## Pending Questions for Later

- **Stripe Live Keys Flip & Commerce Un-hold:** Is the Partner Center business entity verification complete so we can flip the keys?
- **Cohere rerank fallback (contingency only):** If golden-cohort faithfulness stays below 0.80 for two consecutive weeks after Azure semantic ranker ships, confirm whether to enable Cohere Rerank-v3.5 via Azure AI Foundry Models (not direct Cohere API).
- **Graph-RAG V2 trigger (contingency only):** If V1 RAG foundation + reranker + faithfulness harness fail to hit the faithfulness floor for two consecutive golden-cohort weeks, confirm promotion of `RAG-V2-001` (Graph-RAG implementation, embedding strategy pre-locked per ADR 0036) ahead of other V2 items.