# ArchLucid Assessment – (A) Headline Readiness: 80.33%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding explicitly deferred items (V1.1, V2).

## Executive Summary

### (A) Overall Headline Readiness
The core V1 architecture is remarkably solid, featuring robust tenant isolation, a clean persistence model, and a well-defined operator happy path. The primary drag on the headline score (80.33%) is the incomplete V1 AI/Agent foundation. While the infrastructure is in place, the lack of a fully realized RAG pipeline (TB-021) and precise LLM token dimensions (TB-015) limits the faithfulness and cost-predictability of the "AI co-architect" value proposition.

### (B) Procurement/Market-Motion Realism
Enterprise procurement will encounter friction. The absence of a CPA-issued SOC 2 report, the deferral of third-party penetration testing to V2, and the manual nature of the Tier 1 Azure extractor will trigger extended security reviews. While these are explicitly deferred and do not penalize the `(A)` score, they represent real-world hurdles for enterprise buyers.

### Commercial Picture
The commercial foundation is strong, anchored by a clear focus on ROI visibility (`ExecutiveRoiSummaryService`) and a pragmatic, sales-led V1 motion. The Azure extractor (Tier 1) enables rapid time-to-value without requiring vendor credentials, which is a significant advantage for early pilots. However, missing marketing attribution and structured data (TB-019, TB-020) will hamper organic and paid acquisition efficiency.

### Enterprise Picture
Enterprise adoption is supported by V1 GA commitments to SAML/OIDC and robust audit/governance features. The manual Tier 1 extractor means enterprise operators will face a slightly higher operational burden in V1 than they might expect from a mature SaaS product, but this is mitigated by the lack of vendor credential requirements.

### Engineering Picture
The engineering architecture is highly maintainable, utilizing Dapper for workflow data access and a clear separation of authority persistence. The system is designed for reliability with circuit breakers and resilient SQL connections. The immediate engineering risks lie in the incomplete implementation of the RAG foundation (TB-021) and context ingestion coupling (TB-008), which must be addressed to ensure the AI agents produce trustworthy, grounded outputs.

---

## Weighted Quality Assessment

Qualities are ranked from most urgent to least urgent based on their weighted deficiency signal.

### 1. Cutting-Edge AI Technology
- **Score:** 70/100
- **Weight:** 8
- **Weighted deficiency signal:** 240
- **Justification:** The product uses Azure OpenAI, but the current implementation relies heavily on standard LLM completions and basic retrieval. Advanced agentic patterns (HyDE, rerank, graph-RAG) are explicitly deferred to V2.
- **Tradeoffs:** Deferring advanced AI techniques ensures V1 stability and predictable costs, but risks the product feeling like a basic wrapper rather than a cutting-edge "AI co-architect."
- **Improvement recommendations:** Complete the V1 RAG foundation (TB-021) to maximize the value of the existing retrieval infrastructure before attempting V2 advanced patterns.
- **Status:** Fixable in V1 (via TB-021). Advanced patterns are V2.

### 2. AI/Agent Readiness
- **Score:** 75/100
- **Weight:** 8
- **Weighted deficiency signal:** 200
- **Justification:** The "Authority pipeline" is well-structured, but the agents currently lack the full RAG foundation necessary for high faithfulness and citation density. The absence of a platform docs corpus and tenant prior-manifest corpus limits the agent's contextual awareness.
- **Tradeoffs:** Shipping without the full RAG foundation allowed for faster core pipeline development, but risks hallucinations and inconsistent cross-run findings.
- **Improvement recommendations:** Implement RAG-V1-002 (tenant prior-manifest corpus), RAG-V1-004 (platform docs corpus), and RAG-V1-005 (faithfulness eval harness).
- **Status:** Fixable in V1 (via TB-021).

### 3. Adoption Friction
- **Score:** 80/100
- **Weight:** 6
- **Weighted deficiency signal:** 120
- **Justification:** The Tier 1 Azure extractor is a clever workaround for credential friction, but it still requires the customer to manually execute a PowerShell script and upload a ZIP file. This human-in-the-loop requirement introduces friction compared to automated SaaS integrations.
- **Tradeoffs:** The Tier 1 approach drastically reduces security review time (no vendor credentials required), but sacrifices the seamless experience of automated polling.
- **Improvement recommendations:** Streamline the Tier 1 upload UX and prepare the documentation for the Tier 2 automated polling (V1.x).
- **Status:** Tier 1 is V1 GA. Tier 2 automation is V1.x/post-V1 GA.

### 4. Time-to-Value
- **Score:** 85/100
- **Weight:** 7
- **Weighted deficiency signal:** 105
- **Justification:** The core pilot path is concise (6 steps) and the 23 bundled policy packs provide immediate governance value. The primary delay is the manual execution of the Azure extractor.
- **Tradeoffs:** Bundling policy packs increases the initial payload but guarantees immediate baseline value without requiring the user to author rules from scratch.
- **Improvement recommendations:** Implement warm tenant catalogs in elastic pools (TB-018) to reduce signup latency and accelerate the first-run experience.
- **Status:** Fixable in V1.

### 5. Executive Value Visibility
- **Score:** 85/100
- **Weight:** 4
- **Weighted deficiency signal:** 60
- **Justification:** The `ArchitectureReviewBoardExportService` and the Executive ROI summary panel provide strong visibility. However, the lack of precise LLM token dimensions (TB-015) makes it difficult to provide executives with accurate, granular cost attribution for the AI operations themselves.
- **Tradeoffs:** Using estimated costs for LLM operations simplifies early development but reduces trust when executives demand precise FinOps reporting.
- **Improvement recommendations:** Implement TB-015 (bounded dimensions on token counters) to provide accurate, per-agent cost visibility.
- **Status:** Fixable in V1.

### 6. Maintainability
- **Score:** 85/100
- **Weight:** 4
- **Weighted deficiency signal:** 60
- **Justification:** The codebase is highly modular with a clear separation between HTTP workflow data access (Dapper) and authority persistence. The primary maintainability risk is the cross-connector coupling in context ingestion (TB-008 Phase 4).
- **Tradeoffs:** The dual persistence model (Dapper vs. Authority ports) requires developers to understand two patterns, but ensures the authority chain remains pristine and decoupled from UI concerns.
- **Improvement recommendations:** Complete TB-008 Phase 3 and 4 to decouple context ingestion connectors and introduce typed enrichers.
- **Status:** Fixable in V1.

### 7. Proof-of-ROI Readiness
- **Score:** 90/100
- **Weight:** 5
- **Weighted deficiency signal:** 50
- **Justification:** The system explicitly tracks estimated USD savings and integrates Azure Retail Prices. The cross-run deduplication for the executive summary ensures ROI numbers are not artificially inflated by duplicate findings.
- **Tradeoffs:** Relying on Azure Retail Prices provides a defensible baseline but may not reflect a customer's specific negotiated enterprise discounts.
- **Improvement recommendations:** Ensure the Azure Retail Prices structured retrieval (RAG-V1-003) is robustly tested and clearly cited in all exported artifacts.
- **Status:** Strong in V1.

### 8. Reliability
- **Score:** 80/100
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Justification:** The system employs resilient SQL connections, circuit breakers for LLMs, and a robust `AuthorityRunOrchestrator`. Multi-region active/active is explicitly deferred to V1.1, which is acceptable for V1 GA but limits overall reliability scores.
- **Tradeoffs:** Single-region V1 GA reduces infrastructure complexity and cost, but requires customers to accept a lower availability tier during the initial rollout.
- **Improvement recommendations:** Ensure the undocumented replay-rate semantics (TB-023) and OTel `double` cast precision loss (TB-025) are annotated to prevent operational confusion.
- **Status:** Strong in V1. Multi-region is V1.1.

### 9. Supportability
- **Score:** 90/100
- **Weight:** 1
- **Weighted deficiency signal:** 10
- **Justification:** Excellent supportability features including health checks, correlation IDs, CLI diagnostics, and a durable append-only audit trail.
- **Tradeoffs:** The append-only audit trail increases storage costs but is non-negotiable for enterprise compliance and support diagnostics.
- **Improvement recommendations:** Complete the documentation library audience split (TB-013) to ensure support teams and customers can easily find relevant runbooks.
- **Status:** Very strong in V1.

---

## Top 12 Most Important Weaknesses
*(Note: Excludes items explicitly deferred to V1.1 or V2)*

1. Incomplete RAG V1 foundation (TB-021) limits citation density and agent faithfulness.
2. Lack of an automated evaluation harness for RAG (RAG-V1-005) prevents CI-driven quality assurance.
3. Missing tenant prior-manifest corpus (RAG-V1-002) risks inconsistent findings across sequential runs.
4. Missing platform docs corpus (RAG-V1-004) limits the Ask service's ability to explain system behaviors.
5. Manual execution of the Tier 1 Azure extractor introduces human-in-the-loop friction for every architecture update.
6. Lack of per-agent/per-invoke-kind LLM token dimensions (TB-015) prevents accurate FinOps attribution.
7. Context ingestion connectors lack meaningful delta computation and typed enrichers (TB-008 Phase 3).
8. Cross-connector coupling in context ingestion (TB-008 Phase 4) creates maintainability bottlenecks.
9. Replay-rate semantics in `LlmCostEstimator` are undocumented (TB-023), risking confusion during audits.
10. Potential precision loss in OTel `double` cast for LLM cost (TB-025) compromises monitoring accuracy.
11. Documentation library audience split is incomplete (TB-013 Phase 2/3), causing cognitive load for new users.
12. Missing first-touch marketing attribution (TB-019) hinders the measurement of paid acquisition efforts.

## Top 6 Monetization Blockers

1. **Opaque LLM Token Dimensions (TB-015):** Without per-agent token tracking, it is impossible to accurately model COGS or defend pricing tiers to enterprise procurement.
2. **Incomplete RAG Foundation (TB-021):** If agents hallucinate or fail to cite sources due to poor retrieval, prospects will fail the pilot phase, blocking conversion.
3. **Manual Azure Extractor Friction:** If prospects are delayed by internal security reviews required to run the Tier 1 PowerShell script, the sales cycle will stall.
4. **Missing Marketing Attribution (TB-019):** Inability to track first-touch attribution prevents the efficient scaling of paid marketing spend.
5. **Lack of Public Structured Data (TB-020):** Missing JSON-LD on marketing pages reduces organic search visibility, limiting the top of the funnel.
6. **Undocumented Replay-Rate Semantics (TB-023):** If a customer audits their LLM spend and finds discrepancies between stored traces and recomputed aggregates, it could trigger billing disputes.

## Top 6 Enterprise Adoption Blockers

1. **Manual Tier 1 Extractor:** Enterprise teams prefer automated, API-driven integrations (Tier 2) over running manual scripts, increasing the perceived operational burden.
2. **Lack of Automated RAG Evaluation (RAG-V1-005):** Enterprise risk teams will demand proof of AI faithfulness; the lack of a CI-driven eval harness makes this difficult to demonstrate.
3. **Incomplete Context Ingestion (TB-008):** If the system cannot accurately compute deltas or resolve topology overlaps, the resulting architecture graphs will be noisy and untrusted by enterprise architects.
4. **Missing Platform Docs Corpus (RAG-V1-004):** Enterprise operators expect the system's "Ask" feature to explain its own governance and architecture rules; currently, it cannot.
5. **Incomplete Documentation Split (TB-013):** Mixing contributor internals with buyer-facing guides confuses enterprise evaluators trying to understand the product's value.
6. **Opaque LLM Costs (TB-015):** Enterprise FinOps teams require granular chargeback data (e.g., cost per agent type), which is currently unavailable.

## Top 6 Engineering Risks

1. **RAG Faithfulness Gap (TB-021):** The current basic retrieval implementation risks generating ungrounded or hallucinated findings, undermining the core product value.
2. **Context Ingestion Coupling (TB-008 Phase 4):** Duplicated overlap logic across policy and topology stages creates a high risk of regression when adding new connectors.
3. **Runaway LLM Costs (TB-015):** Without granular token dimensions, a rogue agent prompt could silently consume the tenant budget without engineers knowing which agent is responsible.
4. **Monitoring Precision Loss (TB-025):** The `decimal` to `double` cast in OTel metrics introduces rounding errors that will frustrate SREs attempting to reconcile dashboards with database records.
5. **Data Consistency in Replays (TB-023):** The divergence between stored per-trace costs and recomputed aggregates risks undermining the integrity of the audit trail.
6. **Signup Latency Spikes (TB-018):** Running DbUp migrations on-demand during signup will cause unacceptable latency spikes during marketing events; warm catalogs are required.

## Most Important Truth
The core V1 architecture is exceptionally well-designed for enterprise isolation and auditability, but the "AI co-architect" value proposition is currently constrained by an incomplete V1 RAG foundation (TB-021) and opaque LLM token telemetry (TB-015), which must be resolved to ensure trustworthy, cost-predictable agent outputs.

---

## Top Improvement Opportunities

The following 22 improvements are ranked by highest leverage. Actionable items include concrete Cursor prompts.

### 1. Implement RAG-V1-002: Tenant prior-manifest corpus
**Why it matters:** Ensures agents have context of previous decisions, preventing contradictory findings across sequential runs.
**Expected impact:** Directly improves AI/Agent Readiness (+5-8 pts) and Maintainability (+2-3 pts). Weighted readiness impact: +0.5-0.8%.
**Affected qualities:** AI/Agent Readiness, Maintainability.
**Status:** Actionable now.
```text
Implement RAG-V1-002: Tenant prior-manifest corpus.
1. Extend `RetrievalDocumentBuilder` and `RetrievalRunCompletionIndexer` to emit chunks for each committed decision and finding.
2. Tag chunks with `decisionId` and `findingId`.
3. Ensure mandatory tenant/workspace/project scope filters on index and query.
4. Add integration tests to verify no cross-tenant leakage.
Files: `ArchLucid.Retrieval/Indexing/RetrievalDocumentBuilder.cs`, `ArchLucid.Retrieval/Indexing/RetrievalRunCompletionIndexer.cs`.
Acceptance: Second run on similar brief retrieves prior decision chunk in Ask top-K.
Constraints: Do not change existing RuleBasedDecisionEngine logic.
```

### 2. Implement RAG-V1-004: Platform docs corpus
**Why it matters:** Allows the Ask service to answer questions about the system's own architecture and governance rules.
**Expected impact:** Directly improves Supportability (+5-10 pts) and AI/Agent Readiness (+3-5 pts). Weighted readiness impact: +0.2-0.4%.
**Affected qualities:** Supportability, AI/Agent Readiness.
**Status:** Actionable now.
```text
Implement RAG-V1-004: Platform docs corpus for Ask + Explanation.
1. Create `PlatformDocCorpusIndexer` to index allow-listed platform docs (`docs/architecture/adrs/**`, selected `docs/library/**`).
2. Exclude `docs/go-to-market/**`, `docs/security/pen-test-summaries/**`.
3. Partition as `tenantId = platform` so RLS tenant filters do not hide platform chunks.
Files: `ArchLucid.Retrieval/Indexing/PlatformDocCorpusIndexer.cs`.
Acceptance: Ask integration test about a documented ADR returns chunk citing ADR id.
Constraints: Do not index raw customer data paths.
```

### 3. Implement RAG-V1-005: Faithfulness eval harness for RAG
**Why it matters:** Provides CI-driven proof that agents are citing sources correctly, which is critical for enterprise trust.
**Expected impact:** Directly improves AI/Agent Readiness (+5-8 pts) and Reliability (+3-5 pts). Weighted readiness impact: +0.4-0.6%.
**Affected qualities:** AI/Agent Readiness, Reliability.
**Status:** Actionable now.
```text
Implement RAG-V1-005: Faithfulness eval harness for RAG.
1. Extend `tests/eval-corpus/` with citation-required scenarios (keyword + `evidenceRefs` patterns).
2. Score `RetrievalGroundingTrace.citationCoverage` per agent in simulator mode.
Files: `tests/eval-corpus/`, `scripts/ci/eval_agent_corpus.py`.
Acceptance: CI job fails (or warns) when citation coverage drops below configured floor.
Constraints: Do not break existing eval scenarios.
```

### 4. Implement TB-015 Phase A: Bounded dimensions on token counters
**Why it matters:** Provides granular visibility into LLM costs per agent type, enabling FinOps attribution.
**Expected impact:** Directly improves Executive Value Visibility (+10-15 pts) and Maintainability (+3-5 pts). Weighted readiness impact: +0.5-0.7%.
**Affected qualities:** Executive Value Visibility, Maintainability.
**Status:** Actionable now.
```text
Implement TB-015 Phase A: Bounded dimensions on token counters/histogram.
1. Create `AsyncLocal<LlmAccountingInvocationScope>` struct (`AgentKind`, `InvokeKind`).
2. Scope it in `RealAgentExecutor` around handler body.
3. Update `LlmCompletionAccountingClient` to read `AsyncLocal`, clamp labels, and feed `RecordLlmTokenUsage`.
4. Add `Histogram<long>` (`archlucid.llm.completion_tokens`) with bounded tags.
Files: `ArchLucid.AgentRuntime/RealAgentExecutor.cs`, `ArchLucid.AgentRuntime/LlmCompletionAccountingClient.cs`, `ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs`.
Acceptance: OTel metrics include `archlucid.llm.consume_role` and `archlucid.llm.invoke_kind` labels.
Constraints: Keep existing additive counters for back-compat.
```

### 5. Implement TB-015 Phase B: Unit tests for token dimensions
**Why it matters:** Ensures the token dimension telemetry is accurate and survives refactoring.
**Expected impact:** Directly improves Reliability (+5-8 pts) and Maintainability (+3-5 pts). Weighted readiness impact: +0.2-0.3%.
**Affected qualities:** Reliability, Maintainability.
**Status:** Actionable now.
```text
Implement TB-015 Phase B: Unit tests for token dimensions.
1. Add `MeterListener` tests on `ArchLucid` Meter.
2. Use fake completion client to emit usage and assert tags per handler path.
Files: `ArchLucid.AgentRuntime.Tests/LlmCompletionAccountingClientTests.cs` (or similar).
Acceptance: Tests verify that `consume_role` and `invoke_kind` are correctly applied to metrics.
Constraints: Do not require Azure OpenAI connection for these tests.
```

### 6. Implement TB-015 Phase C: Capture LLM token metrics in CI
**Why it matters:** Provides empirical data on agent token consumption to inform pricing and cost models.
**Expected impact:** Directly improves Proof-of-ROI Readiness (+5-8 pts). Weighted readiness impact: +0.3-0.4%.
**Affected qualities:** Proof-of-ROI Readiness.
**Status:** Actionable now.
```text
Implement TB-015 Phase C: Capture LLM token metrics in CI.
1. Update `.github/workflows/golden-cohort-nightly.yml` to scrape `/metrics` after `golden-cohort drift --strict-real`.
2. Create `scripts/ci/aggregate_llm_token_metrics.py` to parse Prometheus text format and aggregate deltas.
3. Emit `golden-cohort-llm-token-report.md` as a GitHub Actions artifact.
Files: `.github/workflows/golden-cohort-nightly.yml`, `scripts/ci/aggregate_llm_token_metrics.py`.
Acceptance: CI job successfully aggregates and reports LLM token metrics per-consumer and per-invoke_kind.
Constraints: Do not commit secrets or raw token values to the repository.
```

### 7. Implement TB-015 Phase D: Product doc + estimator alignment
**Why it matters:** Aligns customer expectations with empirical cost data, preventing billing surprises.
**Expected impact:** Directly improves Time-to-Value (+3-5 pts) and Adoption Friction (+3-5 pts). Weighted readiness impact: +0.2-0.4%.
**Affected qualities:** Time-to-Value, Adoption Friction.
**Status:** Actionable now.
```text
Implement TB-015 Phase D: Product doc + estimator alignment.
1. Update `docs/library/PER_TENANT_COST_MODEL.md` with measured p50/p95 ranges from the golden cohort.
2. Clarify that `cost-preview` remains estimated until live metrics are fully integrated.
Files: `docs/library/PER_TENANT_COST_MODEL.md`.
Acceptance: Cost model documentation reflects empirical data from real-mode CI runs.
Constraints: Clearly distinguish between measured cohort data and hypothetical estimates.
```

### 8. Implement TB-008 Phase 3: Context ingestion meaningful delta
**Why it matters:** Reduces noise in architecture comparisons by computing true set-diffs instead of literal string comparisons.
**Expected impact:** Directly improves AI/Agent Readiness (+5-8 pts) and Maintainability (+3-5 pts). Weighted readiness impact: +0.4-0.6%.
**Affected qualities:** AI/Agent Readiness, Maintainability.
**Status:** Actionable now.
```text
Implement TB-008 Phase 3: Context ingestion meaningful delta + typed enrichers.
1. Introduce `IConnectorDeltaComputer` with shared default and per-connector overrides.
2. Replace literal-string deltas with set-diff on `SourceId`.
3. Split `CanonicalInfrastructureEnricher` into per-`ObjectType` enrichers behind a composite.
Files: `ArchLucid.ContextIngestion/Delta/IConnectorDeltaComputer.cs`, `ArchLucid.ContextIngestion/Canonicalization/CompositeCanonicalEnricher.cs`.
Acceptance: Delta computation uses `SourceId` set-diff. Enrichers are split by `ObjectType`.
Constraints: Do not break existing Phase 1-2 ingestion logic.
```

### 9. Implement TB-008 Phase 4: Context ingestion cross-connector coupling
**Why it matters:** Removes duplicated overlap logic, making it safer to add new context connectors in the future.
**Expected impact:** Directly improves Maintainability (+8-12 pts). Weighted readiness impact: +0.3-0.5%.
**Affected qualities:** Maintainability.
**Status:** Actionable now.
```text
Implement TB-008 Phase 4: Context ingestion cross-connector coupling.
1. Create `IPolicyTopologyOverlapResolver` to resolve `PolicyReferenceConnector` / topology stable-ID duplication.
2. Consume this resolver in policy and topology stages.
Files: `ArchLucid.ContextIngestion/Topology/IPolicyTopologyOverlapResolver.cs`.
Acceptance: Overlap logic is shared and not replicated across stages.
Constraints: Maintain existing ingestion pipeline order.
```

### 10. Implement TB-023: Document replay-rate semantics
**Why it matters:** Prevents operator confusion and billing disputes by clarifying that replayed costs use current, not historical, rates.
**Expected impact:** Directly improves Supportability (+10-15 pts). Weighted readiness impact: +0.1-0.2%.
**Affected qualities:** Supportability.
**Status:** Actionable now.
```text
Implement TB-023: Document replay-rate semantics in `LlmCostEstimator`.
1. Add `<remarks>` to `ILlmCostEstimator.EstimateUsd` stating estimates reflect currently configured rates.
2. Add `<remarks>` to `AgentExecutionTraceRunLlmCostAggregator.Compute` stating it re-estimates using live rates.
3. Update `docs/library/PER_TENANT_COST_MODEL.md` to explain recomputation behavior.
Files: `ArchLucid.Core/Configuration/ILlmCostEstimator.cs`, `ArchLucid.Application/Agents/AgentExecutionTraceRunLlmCostAggregator.cs`, `docs/library/PER_TENANT_COST_MODEL.md`.
Acceptance: XML docs and markdown docs clearly explain the divergence between stored and recomputed costs.
Constraints: Documentation only, no logic changes.
```

### 11. Implement TB-025: Annotate OTel `double` cast and pretax nature
**Why it matters:** Ensures SREs understand the precision limits of the Prometheus metrics, preventing wasted debugging time.
**Expected impact:** Directly improves Supportability (+5-10 pts) and Reliability (+2-3 pts). Weighted readiness impact: +0.1-0.2%.
**Affected qualities:** Supportability, Reliability.
**Status:** Actionable now.
```text
Implement TB-025: Annotate OTel `double` cast and pretax nature in `LlmCostEstimator`.
1. Update `LlmCostUsdTotal` counter description to state it is pre-tax and subject to IEEE 754 rounding.
2. Add inline comment on `(double)estimatedCostUsd` cast in `RecordLlmCostUsd`.
3. Update `ILlmCostEstimator.EstimateUsd` XML doc to state "returns pre-tax estimated cost."
Files: `ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs`, `ArchLucid.Core/Configuration/ILlmCostEstimator.cs`.
Acceptance: Metrics descriptions and code comments accurately reflect pretax and precision loss caveats.
Constraints: Documentation and string updates only.
```

### 12. Implement TB-013 Phase 2: Documentation library audience split
**Why it matters:** Reduces cognitive load for evaluators by separating buyer-facing concepts from deep engineering internals.
**Expected impact:** Directly improves Adoption Friction (+5-8 pts) and Time-to-Value (+3-5 pts). Weighted readiness impact: +0.4-0.6%.
**Affected qualities:** Adoption Friction, Time-to-Value.
**Status:** Actionable now.
```text
Implement TB-013 Phase 2: Documentation library audience split.
1. Batch-move lightly cross-linked evaluator docs (`CONCEPTS_IN_5_MINUTES`, `FAQ`) to appropriate audience folders (`customer-facing/` or `contributor-reference/`).
2. Create temporary stubs to avoid breaking existing links.
Files: `docs/library/*.md`.
Acceptance: Docs are moved, stubs are in place, and `scripts/ci/assert_start_here_links_valid.py` passes.
Constraints: Do not break existing procurement or UI doc paths.
```

### 13. Implement TB-013 Phase 3: Documentation widely linked references
**Why it matters:** Completes the documentation reorganization, ensuring a clean, professional presentation for enterprise buyers.
**Expected impact:** Directly improves Adoption Friction (+3-5 pts). Weighted readiness impact: +0.2-0.3%.
**Affected qualities:** Adoption Friction.
**Status:** Actionable now.
```text
Implement TB-013 Phase 3: Documentation widely linked references.
1. Migrate widely linked references (`GOVERNANCE`, `SECURITY` operator sections).
2. Regenerate `doc-index.json` and procurement paths.
3. Run repository-wide hyperlink smoke.
Files: `docs/library/*.md`, `scripts/procurement_pack_canonical.json`.
Acceptance: Docs are moved, procurement pack builds successfully, and no broken links remain.
Constraints: Must be coordinated with OpenAPI or client-rule changes if applicable.
```

### 14. Implement TB-019: Signup marketing attribution
**Why it matters:** Enables accurate measurement of paid and organic acquisition channels, critical for GTM scaling.
**Expected impact:** Directly improves Proof-of-ROI Readiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
**Affected qualities:** Proof-of-ROI Readiness.
**Status:** Actionable now.
```text
Implement TB-019: Signup marketing attribution + server-side conversion.
1. Capture normalized first-touch attribution (`utm_source`, etc.) in a first-party cookie or KV.
2. Propagate attribution into the signup API boundary (`TenantProvisioningService`).
3. Persist durability in `dbo.TenantMarketingAttribution`.
Files: `ArchLucid.Application/Tenancy/TenantProvisioningService.cs`, UI signup flow.
Acceptance: First-touch attribution is captured and persisted upon successful tenant provisioning.
Constraints: Ensure GDPR/privacy compliance (no PII in raw metrics).
```

### 15. Implement TB-020: Public marketing structured data
**Why it matters:** Improves organic search visibility and builds trust through transparent, consent-gated analytics.
**Expected impact:** Directly improves Adoption Friction (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
**Affected qualities:** Adoption Friction.
**Status:** Actionable now.
```text
Implement TB-020: Public marketing structured data + consent-gated analytics.
1. Inject `@type: SoftwareApplication` JSON-LD on marketing shells.
2. Add `FAQPage` JSON-LD on `/trust` excerpts.
3. Implement consent-gated Microsoft Clarity analytics with server kill-switch.
Files: `archlucid-ui/src/app/(marketing)/layout.tsx`, `archlucid-ui/next.config.ts`.
Acceptance: JSON-LD is present on marketing pages. Clarity only loads if consent is given.
Constraints: Do not mint fake aggregate ratings or reviews.
```

### 16. Implement TB-018: Warm tenant catalogs in elastic pool
**Why it matters:** Eliminates latency spikes during trial signups, providing a seamless first-run experience.
**Expected impact:** Directly improves Time-to-Value (+5-8 pts) and Adoption Friction (+3-5 pts). Weighted readiness impact: +0.4-0.6%.
**Affected qualities:** Time-to-Value, Adoption Friction.
**Status:** Actionable now.
```text
Implement TB-018: Warm tenant catalogs in elastic pool.
1. Create a replenish worker to maintain a warm pool depth (N) of empty product catalogs.
2. Update signup flow to claim a warm DB (skip `RunTenant` when schema matches) and `MarkActive`.
3. Enqueue replenish task post-claim.
Files: `ArchLucid.Persistence/Tenancy/SqlTenantSqlCatalogProvisioner.cs`.
Acceptance: Signup latency is reduced by claiming warm catalogs instead of running migrations on-demand.
Constraints: Ensure proper invalidation of cached tenant connection strings.
```

### 17. Implement TB-017: Trial orphaned-catalog teardown SOP
**Why it matters:** Provides a safe, documented procedure for operators to reclaim Azure SQL resources from dormant trials.
**Expected impact:** Directly improves Supportability (+5-8 pts) and Maintainability (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
**Affected qualities:** Supportability, Maintainability.
**Status:** Actionable now.
```text
Implement TB-017: Trial orphaned-catalog teardown SOP.
1. Create a typed manual teardown runbook for orphaned trial catalogs.
2. Add a metric/ops query for dormant trials by phase and `TenantDatabaseBindings` state.
Files: `docs/runbooks/TRIAL_ORPHAN_TEARDOWN.md` (new).
Acceptance: Runbook provides clear, safe steps for manual teardown of dormant trial catalogs.
Constraints: Do not implement unattended automated teardown (deferred).
```

### 18. Implement Tier 2 Azure extractor (ArchLucid-hosted automated polling)
**Why it matters:** Eliminates human-in-the-loop friction for enterprise buyers by automatically pulling architecture and cost data, significantly improving the operator experience and adoption velocity.
**Expected impact:** Directly improves Adoption Friction (+8-12 pts) and Time-to-Value (+5-8 pts). Weighted readiness impact: +0.6-0.9%.
**Affected qualities:** Adoption Friction, Time-to-Value.
**Status:** Actionable now (Promoted to V1 GA).
```text
Implement Tier 2 Azure extractor (ArchLucid-hosted automated polling).
1. Implement `WorkloadIdentityHostedAzureExtractorCredentialFactory` using `ClientAssertionCredential` for cross-tenant WIF.
2. Build `HostedAzureExtractorClient` to pull ARM inventory and Cost Management data using Azure SDKs.
3. Add SQL tables/columns to store `{ customerTenantId, customerAppId, subscriptionId, includeCost }`.
4. Wire `AzureExtractorAutoPullHostedService` to iterate tenants, execute pull, and feed the ingest pipeline.
5. Wire `POST /v1/admin/azure-extractor/hosted/run` endpoint for manual triggers.
Files: `ArchLucid.Worker/AzureExtractorAutoPullHostedService.cs`, `ArchLucid.Api/Controllers/Admin/AzureExtractorAdminController.cs`.
Acceptance: Automated polling successfully retrieves Azure data using WIF without storing customer secrets.
Constraints: Do not store customer client secrets. Use federated workload identity.
```

### 19. Implement RAG-V1.1-001: Reference-architecture exemplar retrieval
**Why it matters:** Provides agents with high-quality prior art to guide their architectural recommendations, improving the structural quality of outputs.
**Expected impact:** Directly improves AI/Agent Readiness (+3-5 pts) and Time-to-Value (+2-4 pts). Weighted readiness impact: +0.3-0.5%.
**Affected qualities:** AI/Agent Readiness, Time-to-Value.
**Status:** Actionable now (Promoted to V1 GA).
```text
Implement RAG-V1.1-001: Reference-architecture exemplar retrieval.
1. Index `templates/reference-architectures/**` and `templates/starter-proof-packs/**`.
2. Implement search by request fingerprint.
3. Ensure retrieved exemplars are used as style priors only and never included in the manifest hash.
Files: `ArchLucid.Retrieval/Indexing/ExemplarCorpusIndexer.cs`.
Acceptance: Agents can retrieve and reference exemplar architectures without altering the canonical manifest fingerprint.
Constraints: Style prior only.
```

### 20. Implement RAG-V1.1-002: MCP read-only retrieval tools
**Why it matters:** Exposes the system's rich architectural context to external agents and workflows via the Model Context Protocol, unlocking ecosystem integrations.
**Expected impact:** Directly improves Adoption Friction (+4-6 pts) and Maintainability (+2-3 pts). Weighted readiness impact: +0.3-0.5%.
**Affected qualities:** Adoption Friction, Maintainability.
**Status:** Actionable now (Promoted to V1 GA).
```text
Implement RAG-V1.1-002: MCP read-only retrieval tools.
1. Implement `policy-pack-search`, `prior-decision-search`, and `price-row-lookup` tools per MCP backlog §5.1.
2. Ensure tools respect RLS and tenant boundaries.
Files: `ArchLucid.Mcp/Tools/RetrievalTools.cs`.
Acceptance: External MCP clients can successfully query policy packs, prior decisions, and prices.
Constraints: Read-only tools only. Must enforce tenant isolation.
```

### 21. Implement RAG-V1.1-003: Pilot-feedback retrieval for planning materialize
**Why it matters:** Connects qualitative pilot feedback directly to the planning and materialization process, ensuring roadmap items are grounded in user reality.
**Expected impact:** Directly improves Executive Value Visibility (+3-5 pts) and AI/Agent Readiness (+2-4 pts). Weighted readiness impact: +0.2-0.4%.
**Affected qualities:** Executive Value Visibility, AI/Agent Readiness.
**Status:** Actionable now (Promoted to V1 GA).
```text
Implement RAG-V1.1-003: Pilot-feedback retrieval for planning materialize.
1. Wire retrieval logic into `POST /v1/learning/planning/materialize`.
2. Ensure citable themes are derived from ranked opportunities.
Files: `ArchLucid.Api/Controllers/Advisory/LearningController.cs`, `ArchLucid.Application/Learning/PlanningMaterializationService.cs`.
Acceptance: Materialized plans include citations to specific pilot feedback items.
Constraints: Must tie evidence with pilot signal links only.
```

### 22. Implement RAG-V1.1-004: Cross-tenant pattern library UI
**Why it matters:** Provides immense value to all tenants by surfacing anonymized, aggregated architectural patterns, driving network effects.
**Expected impact:** Directly improves Proof-of-ROI Readiness (+5-8 pts) and Time-to-Value (+3-5 pts). Weighted readiness impact: +0.4-0.6%.
**Affected qualities:** Proof-of-ROI Readiness, Time-to-Value.
**Status:** Actionable now (Promoted to V1 GA).
```text
Implement RAG-V1.1-004: Cross-tenant pattern library UI.
1. Implement nightly k-anon aggregates per ADR 0031.
2. Build the PatternInsights API and corresponding UI components.
Files: `ArchLucid.Application/Analytics/PatternInsightsService.cs`, `archlucid-ui/src/app/(operator)/patterns/page.tsx`.
Acceptance: Users can browse anonymized architectural patterns without exposing any tenant-specific PII or proprietary data.
Constraints: k-anon aggregates only. No cross-tenant embedding-RAG.
```

---

## Prompt Batching Guidance

To optimize context window usage and cost-effectiveness, execute the actionable prompts in the following batches:

**Batch 1: RAG Foundation (High Priority)**
- Run Improvements 1, 2, and 3 together. These all touch `ArchLucid.Retrieval` and the Ask/Eval services. They share significant context around the `CorpusKind` and indexing pipelines.

**Batch 2: LLM Token Dimensions (High Priority)**
- Run Improvements 4, 5, 6, and 7 together. These touch `ArchLucid.AgentRuntime`, `ArchLucid.Core.Diagnostics`, and CI scripts. Grouping them ensures the telemetry pipeline is updated end-to-end.

**Batch 3: Context Ingestion Refactoring**
- Run Improvements 8 and 9 together. Both touch `ArchLucid.ContextIngestion` and involve refactoring the delta computation and topology overlap logic.

**Batch 4: Documentation and Annotations (Low Risk)**
- Run Improvements 10, 11, 12, and 13 together. These are primarily documentation moves, XML doc updates, and string changes. They are low risk and can be executed quickly.

**Batch 5: Marketing and Onboarding**
- Run Improvements 14, 15, 16, and 17 together. These touch the UI, signup flow (`TenantProvisioningService`), and operational runbooks.

**Batch 6: Tier 2 Azure Extractor (Enterprise Automation)**
- Run Improvement 18. This is a medium-to-large effort touching the Worker host, API, and Azure Identity SDKs for cross-tenant WIF.

**Batch 7: V1.1 RAG Expansion (Promoted to V1)**
- Run Improvements 19, 20, 21, and 22 together. This batch extends the retrieval capabilities to include exemplars, MCP tools, pilot feedback, and pattern libraries.

---

## Pending Questions for Later

*No pending questions at this time.*