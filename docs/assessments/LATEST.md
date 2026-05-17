> **Scope:** Independent, first-principles assessment of ArchLucid readiness.
> **Status:** current
> **Re-score:** 2026-05-17 — automated tenant erasure pipeline (improvement **#3**) deferred to **V2** per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §**6m** (excluded from **`(A)`** headline per Assessment-Scope); Compliance Readiness **80→85**; headline **84.60%**.

# ArchLucid Assessment – (A) Headline Readiness: 84.60%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding explicitly deferred items (e.g., SOC 2 CPA attestation, third-party pen testing, MCP, live commerce un-hold, **V2** automated tenant erasure quarantine pipeline — see [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §**6m**).

## Executive Summary

### (A) Overall Headline Readiness
ArchLucid is a functionally complete V1 product with a solid architectural foundation (84.60% readiness). It successfully executes the core pilot loop (request → execute → commit → manifest) and provides strong governance and traceability features. The integration of native SAML 2.0 SP, curated default policy packs, and consultant whitelabeling significantly strengthens the V1 GA offering. The primary remaining gaps are in observability operationalization for shipped GenAI signals (dashboards, SLO linkage, alerting) and test automation for new integrations.

### (B) Procurement/Market-Motion Realism
Enterprise procurement will face friction due to the lack of a CPA-issued SOC 2 Type II report and third-party penetration testing (both intentionally deferred). The reliance on a SOC 2 self-assessment and owner-conducted penetration testing is acceptable for early pilots but will require executive sponsorship to bypass standard vendor security gates. **Product policy:** the full **automated** tenant erasure quarantine pipeline (30-day delay, legal hold, orchestrated purge) is a **V2** engineering commitment — see [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §**6m** — and is **not** scored as an **`(A)`** defect. Some privacy reviews will still ask about deletion posture; V1 relies on **operator-driven** and **trial/offboarding** deletion paths (`TenantDeletionService`, hard purge) and trust-center honesty rather than a shipped end-to-end GDPR automation product.

### Commercial Picture
The commercial posture is strongly aligned for a sales-led, service-led motion. The inclusion of consultant whitelabeling on architecture review exports enables boutique consulting firms to use ArchLucid as a delivery engine. Curated demo workspaces and default policy packs (AI governance + security baseline) accelerate Time-to-Value and Proof-of-ROI. The deferred live commerce (Stripe/Marketplace) correctly prioritizes validated purchasing motions over premature self-serve availability.

### Enterprise Picture
ArchLucid provides strong enterprise integration points, including Jira, ServiceNow, Slack, and Confluence. Tenant isolation is robustly handled via database-per-tenant and RLS. **Tenant custom** governance packs support **form-based** authoring for curated-rules-shaped documents (`pack.curatedRules.v1` metadata round-trip under `/policy-packs`, merged into decisioning before governance filtering — improvement **#4**, completed 2026-05-17); evaluators extending packs outside that schema still rely on guided JSON or operational workflows. 

### Engineering Picture
The engineering foundation is highly rigorous, with strong architectural invariants, NetArchTest boundary rules, and a durable audit trail. The agent orchestration pipeline is resilient, and producer-side OpenTelemetry GenAI instrumentation (Activities on `ArchLucid.Agent.LlmCompletion` / `ArchLucid.Agent.LlmEmbedding` plus `archlucid_llm_*` counters and latency histogram on the shared `ArchLucid` meter) records token aggregates, latency, and deployment identifiers without logging raw prompts or completions by default. Curating operator dashboards and alerts on those signals remains a gap. The heavy reliance on mocked `/api/proxy` in `ui-e2e-smoke` remains a testability risk, though the golden path is covered by live API specs.

---

## Weighted Quality Assessment

### 1. Correctness
- **Score:** 85
- **Weight:** 8
- **Weighted deficiency signal:** 120
- **Justification:** The execution model is solid, incorporating the `ManifestSuperseded` durable path. The system correctly merges agent results into versioned manifests.
- **Tradeoffs:** RLS migrations remain coordination-heavy.
- **Improvement recommendations:** Track `108` replay notes during catalog migrations to provide visibility into lag.

### 2. AI/Agent Readiness
- **Score:** 85
- **Weight:** 8
- **Weighted deficiency signal:** 120
- **Justification:** The system effectively uses Azure OpenAI with prompt redaction, execution traces, and a well-tested authority pipeline.
- **Tradeoffs:** **Resolved 2026-05-17** for producer instrumentation (GenAI Activities + meters). Cost attribution still depends on exporters, retention, and operator dashboards—not yet fully operationalized tenant-by-tenant narratives.
- **Improvement recommendations:** Operationalize dashboards and alerting on shipped GenAI telemetry; none required for emitting LLM OTel Activities/metrics.

### 3. Time-to-Value
- **Score:** 85
- **Weight:** 7
- **Weighted deficiency signal:** 105
- **Justification:** Curated demo workspaces and default policy packs accelerate initial value. The Azure extractor is customer-controlled and easy to run.
- **Tradeoffs:** Real-mode value requires tenant baseline data, which can take time to gather.
- **Improvement recommendations:** Add a guided baseline collection wizard to the onboarding flow.

### 4. Proof-of-ROI Readiness
- **Score:** 80
- **Weight:** 5
- **Weighted deficiency signal:** 100
- **Justification:** The Azure extractor provides cost data, the comparison replay cost estimator is useful, and internal pseudonymized cross-tenant daily rollups (`dbo.InternalCrossTenantRollupDaily`, operator-only APIs) support portfolio-wide executive proof without exposing tenant identity in rollup stores.
- **Tradeoffs:** Rollup salt rotation changes surrogate keys; production operators must configure Key Vault salt and apply migration `170` before relying on SQL rollups.
- **Improvement recommendations:** None for cross-tenant analytics (completed 2026-05-17); continue hardening broader Azure cost narratives (Cost Management / Advisor exporter parity, catalog breadth beyond App Service + SQL retail append completed 2026-05-17 per improvement **#6**).

### 5. Adoption Friction
- **Score:** 85
- **Weight:** 6
- **Weighted deficiency signal:** 90
- **Justification:** Operator shell labels are aligned with marketing vocabulary (Capture, Evidence, Review). Integrations with Jira, ServiceNow, Slack, and Confluence reduce workflow disruption. Form-based curated-rules authoring for **tenant custom** packs ships under `/policy-packs` (improvement **#4**, completed 2026-05-17).
- **Tradeoffs:** Governance authoring UX depth (e.g., bulk compare vs PlatformDefault, versioning) may still lag specialist policy-studio expectations for some buyers.
- **Improvement recommendations:** None for form-based curated-rules policy authoring (completed 2026-05-17 per improvement **#4**).

### 6. Usability
- **Score:** 85
- **Weight:** 3
- **Weighted deficiency signal:** 45
- **Justification:** The operator UI is functional and uses marketing-aligned vocabulary. Bounded bulk evidence upload (≤30 files) is supported. Finding confidence is already surfaced via `FindingConfidenceBadge` (evaluation bucket + trace completeness) on detail, explainability, and governance queue surfaces.
- **Tradeoffs:** The 30-file ceiling avoids abuse but may annoy heavy dossier pilots until V1.1. Run-scoped finding **lists** still push operators to open detail for rationale and evidence context.
- **Improvement recommendations:** Add optional compact rationale or primary evidence link on run-scoped findings list rows to reduce drill-down churn.

### 7. Executive Value Visibility
- **Score:** 85
- **Weight:** 4
- **Weighted deficiency signal:** 60
- **Justification:** Architecture Review Report export (DOCX/PDF) with consultant whitelabeling provides immediate, tangible executive artifacts.
- **Tradeoffs:** Executive value can become abstract if real tenant baselines are missing.
- **Improvement recommendations:** Add a 'Missing Baseline' warning to the executive dashboard.

### 8. Differentiability
- **Score:** 85
- **Weight:** 4
- **Weighted deficiency signal:** 60
- **Justification:** Evidence-linked findings and governed decision trails differentiate the product from generic LLM wrappers.
- **Tradeoffs:** Broad proof surface helps defensibility but requires concise buyer framing.
- **Improvement recommendations:** Develop an internal "Policy Pack Hub" for sharing custom policies.

### 9. Workflow Embeddedness
- **Score:** 85
- **Weight:** 3
- **Weighted deficiency signal:** 45
- **Justification:** Inclusion of first-party ITSM connectors (Jira, ServiceNow) and Slack/Confluence integrations in V1 GA is a strong positive.
- **Tradeoffs:** Building first-party connectors takes resources away from core platform features.
- **Improvement recommendations:** Implement bi-directional ServiceNow status sync.

### 10. Compliance Readiness
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Justification:** A durable audit trail exists, and the SOC 2 self-assessment is complete. RLS provides tenant isolation. **V1 posture (2026-05-17):** absence of a **fully automated** GDPR/CCPA quarantine-and-purge pipeline is **not** an **`(A)`** headline defect — that work is **deferred to V2** per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §**6m** (aligned with `Assessment-Scope-V1_1.mdc`). V1 ships **operator-invoked** and **trial lifecycle** hard-delete paths backed by platform audit.
- **Tradeoffs:** **`(B)` procurement realism** — some enterprise privacy questionnaires will still ask for a productized “one-click” erasure story; answer with current controls, roadmap pointer to §**6m**, and process commitments as needed.
- **Improvement recommendations:** Ship the **V2** automated tenant erasure pipeline (improvement **#3**, deferred) when promoted from [`V1_DEFERRED.md`](../library/V1_DEFERRED.md).

### 11. Decision Velocity
- **Score:** 83
- **Weight:** 2
- **Weighted deficiency signal:** 34
- **Justification:** Speeds up architecture reviews by providing structured evidence and policy findings. Coarse confidence badges and explainability tables are already shipped for trust signals.
- **Tradeoffs:** Requires operator trust in the AI's findings to truly accelerate decisions. List-level density still hides graph/evidence entry points until drill-down.
- **Improvement recommendations:** Add one-click navigation from finding list rows to the knowledge graph node or explanation panel when `RelatedNodeIds` or trace targets exist.

### 12. Commercial Packaging Readiness
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Justification:** Sales-led pilot ready. Trial funnel tested in Stripe TEST mode. Consultant whitelabeling improves resale positioning.
- **Tradeoffs:** Deferring live commerce delays self-serve revenue but allows for a controlled rollout.
- **Improvement recommendations:** None for consultant whitelabel export Playwright coverage (completed 2026-05-17 per improvement **#5** — `archlucid-ui/e2e/live-api-whitelabel-export.spec.ts`).

### 13. Reliability
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Justification:** The `AuthorityRunOrchestrator` handles long-running analysis with retry and queuing.
- **Tradeoffs:** Background workers and asynchronous jobs may lack comprehensive retry policies for transient SQL faults.
- **Improvement recommendations:** Audit and update background jobs to ensure Polly-based retry policies are uniformly applied.

### 14. Maintainability
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Justification:** Clean code architecture. NetArchTest boundary rules enforce layering.
- **Tradeoffs:** The large surface area increases maintenance overhead.
- **Improvement recommendations:** Add at least three new architecture boundary rules in `ArchLucid.Architecture.Tests`.

### 15. Explainability
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Justification:** The system provides comparison replays and a knowledge graph, offering good visibility into architectural decisions.
- **Tradeoffs:** Default in-process projection cache caps multi-replica coherence.
- **Improvement recommendations:** Enhance documentation for single-process projection limitations.

### 16. Observability
- **Score:** 75
- **Weight:** 1
- **Weighted deficiency signal:** 25
- **Justification:** OpenTelemetry and Serilog provide good visibility. **Explicit GenAI instrumentation shipped 2026-05-17** (LLM Activities + `archlucid_llm_*` histograms/counters); **consumption gaps** remain (dashboards/SLO linkage on those signals—not scored here as “missing producer tracing”).
- **Tradeoffs:** Standard observability tools require operator expertise to configure.
- **Improvement recommendations:** Curate Grafana/Application Insights panels and alerts for `ArchLucid.Agent.Llm*` spans and `archlucid_llm_gen_ai_operation_duration_ms` / embedding and chat token counters.

### 17. Performance
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Rate limiting is implemented. Optional Redis cache is available.
- **Tradeoffs:** Making Redis optional simplifies single-replica deployments but complicates scaled operations.
- **Improvement recommendations:** Add dashboards and alerting in Grafana for wait times and dead letters.

### 18. Stickiness
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Governance workflows and compliance drift tracking provide ongoing value.
- **Tradeoffs:** Thin starter packs risk one-and-done pilots unless tenants customize them.
- **Improvement recommendations:** Enhance the Azure extractor script to collect Azure Policy compliance states.

### 19. Template and Accelerator Richness
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Two curated default policy packs (AI governance + security baseline) provide a good starting point.
- **Tradeoffs:** The library is currently small, shifting burden to credible authoring by the tenant.
- **Improvement recommendations:** Develop an internal "Policy Pack Hub" for sharing custom policies.

### 20. Testability
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Strong unit/integration tests. `ui-e2e-live` covers the golden path.
- **Tradeoffs:** Default `ui-e2e-smoke` remains mock-heavy, relying on `/api/proxy`.
- **Improvement recommendations:** Add Playwright smoke tests for new integrations (Jira, Slack, Confluence).

### 21. Cognitive Load
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Marketing-aligned vocabulary helps, but the product surface is large for a first-pilot motion.
- **Tradeoffs:** Breadth is valuable for expansion but increases first-session confusion.
- **Improvement recommendations:** Add explicit application-level logging to the findings list API endpoints to evaluate read-access patterns and simplify the UI.

### 22. Cost-Effectiveness
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Azure cost extractor provides visibility. Comparison replay cost estimation uses granular payload heuristics.
- **Tradeoffs:** Some manual estimation remains in broader Azure cost workflows.
- **Improvement recommendations:** Extend automated Azure cost narratives beyond App Service plans and SQL databases (Retail **`retail-prices.json`** via `-IncludeRetailPrices` shipped 2026-05-17 — see improvement **#6** completion evidence).

### 23. Interoperability
- **Score:** 90
- **Weight:** 2
- **Weighted deficiency signal:** 20
- **Justification:** REST API, CLI, webhooks, ITSM connectors, SAML 2.0 SP, and OIDC provide excellent interoperability.
- **Tradeoffs:** SAML SP adds dual auth-surface operational burden.
- **Improvement recommendations:** Add a CI step that fails the build if new API endpoints lack documented audit events.

### 24. Scalability
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** Scales well horizontally. KEDA azure-queue replica scaling is supported.
- **Tradeoffs:** Single-tenant worker pool exhaustion is still a risk if not carefully configured.
- **Improvement recommendations:** Implement auto-scaling rules for the worker pool based on SQL authority outbox depth.

### 25. Supportability
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** Good logging, OpenTelemetry, and CLI diagnostics (`doctor`, `support-bundle`).
- **Tradeoffs:** New HTTP utilities must reuse `scripts/ArchLucid.AuthHeaders.ps1` or risk regressing authenticated-probe behavior.
- **Improvement recommendations:** None for JWT/API-key headers on existing HTTP scripts (completed 2026-05-17 per improvement **#7**).

---

## Top 12 Most Important Weaknesses

1. ~~**Lack of cross-tenant analytics**~~ **Completed 2026-05-17:** Pseudonymized internal daily rollups shipped (`InternalCrossTenantRollupDaily`, `GET/POST /v1/internal/analytics/cross-tenant/daily*`, runbook `docs/runbooks/INTERNAL_CROSS_TENANT_ANALYTICS.md`).
2. ~~**Missing LLM observability**~~ **Completed (2026-05-17):** GenAI Activities (`ArchLucid.Agent.LlmCompletion`, `ArchLucid.Agent.LlmEmbedding`) and `archlucid_llm_*` meters (incl. `archlucid_llm_gen_ai_operation_duration_ms`, chat/embedding token counters). **Residual:** operator dashboards and SLO/alert coverage on those signals.
3. **E2E test mock reliance:** `ui-e2e-smoke` relies heavily on mocked `/api/proxy`, leaving integration surfaces vulnerable to regressions.
4. **Manual Azure cost estimations:** The extractor now appends public Retail Prices catalog rows (**`retail-prices.json`**, `-IncludeRetailPrices`) for inventoried App Service plans and Azure SQL databases; Cost Management-/Advisor-shaped exports and many other SKU families remain manual or off-tool, limiting full automated ROI proof.
5. ~~**Lack of automated tenant data deletion**~~ **Deferred V2 (2026-05-17):** Full quarantine + legal-hold + orchestrated purge pipeline is **out of `(A)`** per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §**6m**. **`(B)`** — privacy questionnaires may still diligence deletion; V1 answers with operator/trial purge paths + roadmap.
6. ~~**Lack of custom rule authoring UI (curated-rules schema)**~~ **Completed 2026-05-17:** Form-based wizard + read-only JSON preview (`PolicyRuleAuthoringWizard`, `CuratedRulesAuthoringSection`), `pack.curatedRules.v1` metadata, decisioning merge (`TenantCuratedComplianceRulePackMerger`, `PolicyFilteredComplianceRulePackProvider`) — improvement **#4**. **Residual:** packs outside `*-rules-v1.json` shape still need guided JSON / ADR-approved extensions.
7. ~~**Operational script auth realism**~~ **Completed 2026-05-17:** HTTP operational scripts accept `-BearerToken`/`-ApiKey` (and env `ARCHLUCID_BEARER_TOKEN`/`ARCHLUCID_API_KEY`) via `scripts/ArchLucid.AuthHeaders.ps1` (improvement **#7**).
8. **Worker pool scaling triggers:** Scaling relies primarily on Azure queue depth rather than SQL authority outbox depth, risking noisy neighbor issues.
9. **Background job transient fault handling:** Asynchronous jobs may lack comprehensive Polly-based retry policies for SQL transient errors.
10. **Data residency verification gaps:** The provisioning pipeline lacks automated assertions to verify that Azure resources match the requested `DataRegion`.
11. **Terraform advisory validation:** Generated Terraform snippets are not automatically validated (`terraform fmt`/`validate`) in CI, risking syntax errors in advisory output.
12. **Audit matrix drift:** New API endpoints can be merged without corresponding updates to the `AUDIT_COVERAGE_MATRIX.md`.

---

## Top 6 Monetization Blockers

1. ~~**Lack of cross-tenant analytics**~~ **Completed 2026-05-17** (internal operator rollups; not a tenant-facing or marketing claim).
2. ~~**Manual Azure cost estimations**~~ **Partially addressed (2026-05-17):** App Service plans and Azure SQL databases can carry Retail catalog evidence via extractor **`retail-prices.json`** (`-IncludeRetailPrices`). **Residual:** amortized/`Cost Management`-shaped totals and SKU breadth beyond those families.
3. **Lack of a published reference customer:** Slows early momentum and trust generation (deferred to V1.1).
4. **Lack of self-serve transactability:** Stripe live keys and Marketplace publication are deferred, forcing a high-touch sales motion.
5. **Named productized offers packaging:** Velocity to cash depends on a buyable review SKU and SOW alignment, which requires GTM execution.
6. **Thin starter packs:** While AI governance and security baseline packs exist, they risk "one-and-done" pilots if tenants do not extend them.

---

## Top 6 Enterprise Adoption Blockers

1. ~~**Lack of automated tenant data deletion**~~ **Deferred V2 (2026-05-17):** Not an **`(A)`** headline blocker — see [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §**6m**. **`(B)`** — buyers may still request a productized erasure narrative; mitigate with trust-center + operator runbooks + roadmap citation.
2. **Absence of compliance attestations:** Lack of a CPA-issued SOC 2 Type II report causes friction in security reviews.
3. ~~**Lack of custom rule authoring UI (curated-rules schema)**~~ **Completed 2026-05-17** (improvement **#4**). **Residual:** procurement comparisons to full visual policy studios may still stress UX depth beyond curated-rules forms.
4. **Data residency diligence depth:** Buyers require verifiable proof that SQL topology and backups match their geography.
5. **Noisy neighbor posture in orchestration:** Buyers will diligence steady-state parallelism and multi-region fairness.
6. **SAML SP operational burden:** Managing certificate rotation and metadata drift for SAML SP adds operational overhead for enterprise IT.

---

## Top 6 Engineering Risks

1. **LLM observability consumption gaps:** Producer GenAI spans and `archlucid_llm_*` metrics ship (2026-05-17); operators still need curated dashboards, SLOs, and alerting on those signals for day-2 operations.
2. **E2E test mock reliance:** Heavy reliance on mocks in `ui-e2e-smoke` risks missing integration regressions.
3. ~~**Operational script auth realism:** Scripts assuming `DevelopmentBypass` mask real-world authentication failures.~~ **Completed 2026-05-17** (improvement **#7** — shared `scripts/ArchLucid.AuthHeaders.ps1` + wired HTTP clients). **Residual:** code review should require new ArchLucid HTTP probes to use the same helper.
4. **Background job transient fault handling:** Incomplete retry policies for SQL connections in background workers risk silent failures.
5. **Worker pool scaling triggers:** Scaling on Azure queue depth rather than SQL outbox depth risks backlog accumulation.
6. **Terraform advisory syntax errors:** Unvalidated Terraform snippets could produce invalid advisory output, damaging trust.

---

## Most Important Truth

ArchLucid is a functionally complete, highly rigorous V1 product ready for sales-led pilots, but its ability to scale commercially is bottlenecked by observability consumption gaps (curated LLM dashboards and alerts atop shipped telemetry), residual manual ROI proof breadth (Azure Retail append shipped per improvement **#6**; Cost Management / Advisor parity and wider SKU families remain), and enterprise friction (**full automated GDPR erasure** is **V2** per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §**6m**, excluded from **`(A)`** scoring).

---

## Top Improvement Opportunities

### 1. Implement internal cross-tenant analytics rollups with tenant pseudonymization
- **Status:** Completed (2026-05-17)
- **Why it matters:** Proves portfolio-wide ROI signal for founders/operators and supports internal product telemetry without exposing tenant identity in rollups.
- **Expected impact:** Proof-of-ROI Readiness (+10 pts), Executive Value Visibility (+5 pts).
- **Affected qualities:** Proof-of-ROI Readiness, Executive Value Visibility.
- **Actionable:** No
- **Completion evidence:** Migration `170_InternalCrossTenantRollupDaily.sql`; `AnalyticsTenantKeyDeriver` + `InternalCrossTenantRollupHostedService`; operator routes `GET/POST /v1/internal/analytics/cross-tenant/daily*` and CSV/JSON export; `docs/runbooks/INTERNAL_CROSS_TENANT_ANALYTICS.md`; tests in `AnalyticsTenantKeyDeriverTests`, `InMemoryInternalCrossTenantAnalyticsServiceTests`, `InternalCrossTenantAnalyticsEndpointTests`.
```text
Add an internal-only cross-tenant analytics path (operator/admin or offline job — not a tenant-facing API) that aggregates non-sensitive counters and latency/throughput metrics across tenants.
- Pseudonymization: every stored or exported rollup row must key tenants by an opaque surrogate (e.g. stable per-tenant `AnalyticsTenantKey` derived with HMAC-SHA256 over tenant id + server-side salt from configuration/Key Vault — never store tenant slug, domain, or display name in rollup tables).
- Scope: aggregate only metrics already classified as internal BI-safe (counts, durations, token totals if already non-content, queue depths). Do not ingest review text, findings bodies, evidence filenames, or manifest excerpts into cross-tenant stores.
- Storage: prefer a dedicated system-catalog table or reporting schema (`dbo.InternalCrossTenantRollup*` or equivalent) with RLS not applicable — access only via `RequireOperatorRole` / internal service principal; document in `docs/runbooks/` or `docs/operations/` who may query it.
- Acceptance criteria: (1) A scheduled or on-demand job produces daily rollups keyed by surrogate id only; (2) no PII/PHI columns in rollup DDL; (3) tests prove surrogate stability and that raw tenant id does not appear in exported CSV/JSON for rollups.
- Constraints: No per-tenant opt-in UI; internal use only per product decision. Do not add new public HTTP routes without versioning review.
- What not to change: Do not weaken per-tenant isolation on tenant-scoped APIs; do not copy customer content blobs into a shared analytics store.
- Impact: Directly improves Proof-of-ROI Readiness (+6-10 pts) and Executive Value Visibility (+3-5 pts). Weighted readiness impact: +0.15-0.25%.
- Acceptance criteria met: (1) scheduled/on-demand daily rollups keyed by surrogate only; (2) rollup DDL has no PII/PHI tenant identity columns; (3) tests assert surrogate stability and no raw tenant id in exported CSV/JSON.
```

### 2. Add explicit OpenTelemetry tracing for LLM API calls
- **Status:** Completed (2026-05-17)
- **Why it matters:** Producer GenAI spans and meters now surface token usage, latency, and deployment/model identifiers without default prompt/completion payloads; remaining gap is operator-facing dashboards, SLO linkage, and alerting on those exports.
- **Expected impact:** Observability (+15 pts), AI/Agent Readiness (+5 pts).
- **Affected qualities:** Observability, AI/Agent Readiness.
- **Actionable:** No (follow-on: operationalize dashboards/SLOs on shipped signals)
- **Completion evidence:** `AzureOpenAiCompletionClient` (chat: `gen_ai.*` span tags, `archlucid_llm_gen_ai_operation_duration_ms`); `AzureOpenAiEmbeddingClient` (embeddings: same pattern + `archlucid_llm_embedding_input_tokens_total`); `ArchLucidInstrumentation`; `ObservabilityExtensions` remarks documenting GenAI telemetry; tests `ArchLucid.Core.Tests/Diagnostics/LlmGenAiInstrumentationTests.cs`. HTTP client instrumentation unchanged per constraint.
```text
Modify `ArchLucid.Host.Core/ObservabilityExtensions.cs` (or equivalent instrumentation setup) to add explicit OpenTelemetry tracing for all LLM API calls.
- Acceptance criteria: Token usage, latency, and model version are captured as custom metrics or trace attributes.
- Constraints: Do not log raw prompt text or completion text to avoid PII leakage.
- What not to change: Do not modify existing HTTP client instrumentation.
- Impact: Directly improves Observability (+10-15 pts) and AI/Agent Readiness (+5-8 pts). Weighted readiness impact: +0.2-0.4%.
- Acceptance criteria met: (1) Token usage emitted on GenAI Activities and **`ArchLucid`** meter counters (chat completions via existing token totals + **`LlmCompletionAccountingClient`**; embeddings via **`archlucid_llm_embedding_input_tokens_total`**); (2) latency recorded as **`gen_ai.completion.latency_ms`** span tags and **`archlucid_llm_gen_ai_operation_duration_ms`** histogram (**`gen_ai.operation.name`** = chat | embeddings); (3) model/deployment identifiers on spans (**`gen_ai.request.model`**, chat **`gen_ai.response.model`** when the provider returns it). Default path does not attach raw prompt or completion text to spans.
```

### 3. Implement automated tenant erasure (30-day quarantine, legal-hold flag, blob + SQL purge)
- **Status:** Deferred **V2** (2026-05-17) — **not** an **`(A)` V1 headline gate**; documented in [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §**6m**. **V1** continues to rely on **`TenantDeletionService`**, trial hard purge, and operator processes.
- **Why it matters (when promoted):** GDPR/CCPA-aligned **productized** erasure and some enterprise RFPs expect a verifiable delete story; a bounded quarantine plus audited hold is proportionate without a separate storage tier.
- **Expected impact (if implemented as V2):** Compliance Readiness (+6–10 pts), Adoption Friction (+3–5 pts) — **not** folded into current **`(A)`** until shipped.
- **Affected qualities:** Compliance Readiness, Adoption Friction.
- **Actionable:** No (V2 backlog; rescored **2026-05-17**)
```text
Implement an automated tenant erasure pipeline aligned to GDPR/CCPA storage-limitation practice (product policy — not legal advice).
- Quarantine: On verified erasure request + operator/admin confirmation, mark tenant **soft-deleted** with `TenantErasureRequestedUtc` (or equivalent). **Hard purge** runs automatically **30 calendar days** after that timestamp unless blocked below.
- Legal hold: Add nullable **`LegalHoldUntilUtc`** (or `LegalHoldReason` + `LegalHoldSetBy`) on the system-catalog tenant row. If `LegalHoldUntilUtc` is in the future (or a boolean hold is active per your schema), the hard-purge job **must skip** the tenant and emit a structured warning; clearing hold is an audited admin action. **No separate legal-hold blob bucket** — hold keeps data in place.
- Scope of hard purge (same orchestrated job): (1) Drop or irreversibly scrub **per-tenant SQL catalog** per existing topology (`SystemWithPerTenantCatalogs`); (2) Delete **all tenant-scoped blobs** referenced from DB or known prefixes (exports DOCX/PDF, bundle ZIPs, Azure extractor upload packages, logos) using existing blob clients; (3) Remove **control-plane** tenant binding rows so the tenant id cannot authenticate.
- Audit: Emit durable audit events for request received, quarantine start, hold set/cleared, hard purge start/complete, failures with correlation id.
- Acceptance criteria: Integration or harness test proves quarantine → after simulated clock or test double, purge runs; hold blocks purge; blobs listed in fixture are gone after purge.
- Constraints: Do not log secrets; do not weaken other tenants’ isolation; honor existing RBAC (only platform admin / operator MAY initiate or clear hold).
- What not to change: Do not alter unrelated billing or global config tables except foreign-key cleanup required for tenant removal.
- Impact: Directly improves Compliance Readiness (+6-10 pts) and Adoption Friction (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 4. Form-based custom policy rule authoring (curated rules JSON round-trip)
- **Status:** Completed (2026-05-17)
- **Why it matters:** Non-developer architects need to extend governance packs without hand-editing JSON; a form-based editor matches enterprise expectations and reuses the shipped sample schema.
- **Expected impact:** Adoption Friction (+10 pts), Usability (+5 pts).
- **Affected qualities:** Adoption Friction, Usability.
- **Actionable:** No
- **Completion evidence:** Metadata key `pack.curatedRules.v1` (`PolicyPackCuratedRulesMetadataKey.V1`); `TenantCuratedComplianceRulePackMerger` + `CuratedComplianceRuleMapper` merged via `PolicyFilteredComplianceRulePackProvider` before governance filter; UI `PolicyRuleAuthoringWizard.tsx` / `CuratedRulesAuthoringSection.tsx` + `policy-pack-curated-rules-v1.ts`; .NET tests `TenantCuratedComplianceRulePackMergerTests`, `CuratedComplianceRuleMapperTests`; Vitest `policy-pack-curated-rules-v1.test.ts` (frozen `security-architecture-baseline-rules-v1.json` snippet round-trip).
```text
Deliver **form-based** (not block/Scratch-style) authoring for **tenant custom** policy packs, with JSON that **round-trips** the sample “curated rules” documents under `docs/samples/policy-packs/*-rules-v1.json`.

**A. Decisioning bridge (backend, required for net-new rule bodies)**  
Today `PolicyFilteredComplianceRulePackProvider` loads a **file-merged** `ComplianceRulePack` and filters by `complianceRuleKeys` on `PolicyPackContentDocument`. Keys alone are insufficient if the rule is not in that merged file set. Extend the compliance/governance pipeline so **tenant-published** pack content can **contribute additional `ComplianceRule` rows** before filtering (e.g. merge inline definitions derived from the curated-rules document alongside existing file loaders, or an equivalent approach documented in the PR). Map sample rule fields to `ArchLucid.Decisioning.Compliance.Models.ComplianceRule` explicitly in code (e.g. `id`→`RuleId`, `title`→`ControlName`, `description`→`Description`, `severity`→`Severity`; default or derive `ControlId`, `AppliesToCategory`, `RequiredNodeType`, `RequiredEdgeType` with documented semantics; carry `remediationGuidance` / `evidenceHints` / `frameworkMappings` only if the engine already consumes them or store as extensions per existing patterns — do not silently drop validation requirements).

**B. Pack envelope (`contentJson`)**  
On `POST /v1/policy-packs/{id}/publish`, serialized `contentJson` must remain a valid `PolicyPackContentDocument` (`ArchLucid.Decisioning.Governance.PolicyPacks.PolicyPackContentDocument`): keep `complianceRuleIds`, `complianceRuleKeys`, `alertRuleIds`, `compositeAlertRuleIds`, `advisoryDefaults`, `metadata` aligned with today’s merge semantics. **Every** authored rule’s `id` must appear in `complianceRuleKeys`. Persist the full curated-rules document in a **reserved `metadata` entry** (string value) agreed in the same PR (e.g. `pack.curatedRules.v1`) so the UI and decisioning share one canonical JSON shape — do not fork a second on-disk format in repo root.

**C. UI (`archlucid-ui`)**  
Under **`/policy-packs`** (or `/policy-packs/[id]/rules`): table of rules; **Add** / **Edit** opens a form — severity dropdown (match sample casing: Critical/High/Medium/Low), text fields, dynamic lists for `evidenceHints` and `frameworkMappings` rows; **read-only JSON preview** of the curated-rules doc. Enforce duplicate-id checks and required fields before calling publish. Use `@/lib/openapi-schemas` for API DTOs; `data-testid` on primary actions (`UI-Stable-Selectors-And-Snapshots.mdc`). RBAC: match existing policy-pack mutation gates (same roles as pack publish today).

**D. HTTP surface**  
Prefer existing routes. Any new contract fields require OpenAPI regeneration and `Http-Surface-Docs-And-Clients.mdc` checklist.

**E. Tests**  
- .NET: unit tests for metadata→`ComplianceRule` mapping and merge order vs governance filter.  
- UI: Vitest for parse/serialize round-trip using a frozen snippet from `security-architecture-baseline-rules-v1.json`.

**What not to do**  
Block-based visual programming in this slice; editing **PlatformDefault** seeded packs; introducing ad hoc rule schema JSON outside the sample `*-rules-v1.json` shape without an ADR.

**Impact:** Adoption Friction (+6–10 pts), Usability (+3–5 pts). Weighted readiness impact: +0.1–0.2%.
- Acceptance criteria met: Tenant curated-rules JSON is stored under **`pack.curatedRules.v1`**; **`TenantCuratedComplianceRulePackMerger`** maps entries via **`CuratedComplianceRuleMapper`** and merges into the file-backed pack before **`ComplianceRulePackGovernanceFilter`**; UI **`PolicyRuleAuthoringWizard`** / **`CuratedRulesAuthoringSection`** provides form rows + read-only serialized preview; **`policy-pack-curated-rules-v1.test.ts`** proves parse/serialize round-trip on a frozen baseline snippet; .NET **`TenantCuratedComplianceRulePackMergerTests`** / **`CuratedComplianceRuleMapperTests`** cover merge order and mapping. No block-based authoring or PlatformDefault editing added.
```

### 5. Extend `ui-e2e-live` Playwright specs to cover consultant whitelabel export
- **Status:** Completed (2026-05-17)
- **Why it matters:** Consultant whitelabeling is a key V1 commercial feature; automated UI tests ensure it does not regress.
- **Expected impact:** Testability (+10 pts), Commercial Packaging Readiness (+5 pts).
- **Affected qualities:** Testability, Commercial Packaging Readiness.
- **Actionable:** No
- **Completion evidence:** `archlucid-ui/e2e/live-api-whitelabel-export.spec.ts` (live showcase review → Deliverables → modal → DOCX download); `ReviewBoardWhitelabelConsultingExportButton` + `RunDetailArtifactsExportsSection`; `downloadConsultingArchitectureReportDocx` branding payload; optional `ReviewBoardWhitelabel*` fields on `ConsultingDocxExportRequest`, cover branding in consulting DOCX pipeline (`ConsultingDocxExportBranding*` / `ConsultingDocxCoverPageBuilder`); OpenAPI snapshot + `api-types.generated.ts`, NSwag `ArchLucid.Api.Client`.
```text
Create a new Playwright test file `archlucid-ui/e2e/live-api-whitelabel-export.spec.ts`.
- Acceptance criteria: The test must log in, navigate to a finalized review, open the export modal, fill in the firm name and engagement title, upload a mock logo, and trigger the export.
- Constraints: Use the existing `ui-e2e-live` setup and authentication helpers.
- What not to change: Do not modify the underlying export API endpoints.
- Impact: Directly improves Testability (+8-10 pts) and Commercial Packaging Readiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
- Acceptance criteria met: Live spec drives finalized seeded showcase review detail (`SHOWCASE_DEMO_RUN_ID`), opens firm-branded consulting export modal (`data-testid` hooks), fills firm + engagement, attaches `public/logo/icon-192.png`, asserts successful POST to consulting DOCX export and a `.docx` download. Artifact ZIP GET routes unchanged; consulting export uses the existing POST route with additive optional JSON fields only.
```

### 6. Automate broader Azure cost estimations in the PowerShell extractor
- **Status:** Completed (2026-05-17)
- **Why it matters:** Manual cost estimation limits the platform's ability to automatically prove hard infrastructure savings.
- **Expected impact:** Cost-Effectiveness (+10 pts), Proof-of-ROI Readiness (+5 pts).
- **Affected qualities:** Cost-Effectiveness, Proof-of-ROI Readiness.
- **Actionable:** No
- **Completion evidence:** `scripts/azure/Get-ArchLucidAzurePackage.ps1` (`scriptVersion` 0.2.0, `-IncludeRetailPrices` writes `retail-prices.json` into the extractor ZIP); `scripts/azure/ArchLucid.RetailPrices.helpers.ps1` (`New-ArchLucidRetailPricesDocument` — OData filter to `https://prices.azure.com/` for Retail catalog `serviceName` **Azure App Service** and **SQL Database**, USD consumption-oriented rows, SKU matching vs inventory `sku`); core `Get-AzResource` inventory loops unchanged.
```text
Update `Get-ArchLucidAzurePackage.ps1` to automatically query the Azure Retail Prices API for App Service Plans and Azure SQL Databases.
- Acceptance criteria: The script outputs `retail-prices.json` containing the current retail rates for the collected App Service and SQL SKUs.
- Constraints: Do not require any new Azure RBAC roles beyond `Reader` and `Cost Management Reader`.
- What not to change: Do not alter the core ARM resource collection logic.
- Impact: Directly improves Cost-Effectiveness (+8-10 pts) and Proof-of-ROI Readiness (+3-5 pts). Weighted readiness impact: +0.2-0.3%.
- Acceptance criteria met: `-IncludeRetailPrices` appends `retail-prices.json` (consumption-priced catalog rows correlated to inventoried App Service plans and SQL databases); pricing calls are outbound HTTPS-only to `prices.azure.com` — no incremental Azure RBAC beyond ARM read scopes already assumed for extractor inventory.
```

### 7. Update all operational scripts to support JWT/API keys
- **Status:** Completed (2026-05-17)
- **Why it matters:** Scripts assuming `DevelopmentBypass` mask real-world authentication failures and hinder secure operations.
- **Expected impact:** Supportability (+10 pts), Correctness (+5 pts).
- **Affected qualities:** Supportability, Correctness.
- **Actionable:** No
- **Completion evidence:** Shared helper `scripts/ArchLucid.AuthHeaders.ps1` (`Get-ArchLucidHttpAuthHeadersHashtable` — `-BearerToken`/`-ApiKey` parameters with env fallback `ARCHLUCID_BEARER_TOKEN`/`ARCHLUCID_API_KEY`; empty yields prior no-header behavior). HTTP probes extended in `scripts/OperatorDiagnostics.ps1` (`Get-ArchLucidHttpProbe`, `Write-ArchLucidReadinessTimeoutDiagnostics`). ArchLucid HTTP clients updated across smoke/release/drill (`staging-smoke.ps1`, `release-smoke.ps1`, `release-smoke-live-ui-sql.ps1`, `v1-rc-drill.ps1`, `capture-staging-readiness-evidence.ps1`), probes (`env-readiness.ps1`, `validate-deployment.ps1`, `reliability_drill.ps1`, `integrations/validate-itsm-live.ps1`), benchmarks (`benchmark-e2e-time.ps1`, `benchmark-real-mode-e2e.ps1`), ops (`generate-worked-example-roi.ps1`, `refresh-demo-preview-snapshot.ps1`), and `integrations/jira/jira-webhook-bridge.ps1` (run detail GET accepts bearer or API key).
```text
Audit all `.ps1` scripts in the `scripts/` directory and update them to accept `-BearerToken` or `-ApiKey` parameters.
- Acceptance criteria: Scripts must authenticate using the provided token/key instead of relying on `DevelopmentBypass`.
- Constraints: Maintain backward compatibility for local development if no token is provided.
- What not to change: Do not change the core logic of the scripts, only the HTTP client authentication headers.
- Impact: Directly improves Supportability (+8-10 pts) and Correctness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
- Acceptance criteria met: ArchLucid-facing HTTP scripts wire `Authorization: Bearer` and/or `X-Api-Key` via the shared helper; omitting params and env preserves DevelopmentBypass-style anonymous probes where the API allows it.
```

### 8. Guided baseline collection wizard (ZIP-first, thin required fields)
- **Status:** Completed (2026-05-17)
- **Why it matters:** Real-mode value requires tenant baseline data; a wizard that leads with the Azure extractor ZIP reduces manual typing and speeds first commit.
- **Expected impact:** Time-to-Value (+10 pts), Usability (+5 pts).
- **Affected qualities:** Time-to-Value, Usability.
- **Actionable:** No
- **Completion evidence:** Baseline-first route `/reviews/new?baseline=1` (path switcher opens detailed wizard; full wizard inserts ZIP step before identity). Client-side unpack via `fflate` reads `manifest.json` from the `Get-ArchLucidAzurePackage.ps1` ZIP (52 MB cap aligned with `AzureExtractorUploadLimits.MaxZipBytes`); prefills `description`, optional `systemName`, `topologyHints`. Key files: `archlucid-ui/src/components/wizard/steps/WizardStepBaselineZip.tsx`, `AzureExtractorPackageZipField.tsx`, `archlucid-ui/src/lib/read-arch-lucid-azure-package-zip.ts`, `archlucid-ui/src/app/(operator)/reviews/new/NewRunWizardClient.tsx`, `QuickReviewWizard.tsx` (`ReviewsNewPathSwitcher`). Pilot guide CTA (`HelpLink` → `PILOT_GUIDE.md`). Baseline ZIP parse signals: `recordPilotBaselineZipApplied` (session + `archlucid-pilot-baseline-zip-applied`); `first_run_started` unchanged on submit. Tests: `archlucid-ui/src/lib/read-arch-lucid-azure-package-zip.test.ts`, `NewRunWizardClient.baseline-first.test.tsx`, baseline step mapping in `wizard-step-validate.test.ts`.
```text
Extend the operator **new review** flow (`archlucid-ui` — `reviews/new`, `NewRunWizardClient`, existing wizard steps including `WizardStepAzureContext`) with a **baseline-first path** without bloating the V1 gate checklist.

**V1 scope (ship in this slice)**
- **Step 1 — Extractor ZIP upload:** Accept the customer’s Azure packager ZIP (same artifact produced by `Get-ArchLucidAzurePackage.ps1`). Client-side, unpack enough to read normalized manifest / identity fields used today (e.g. `SubscriptionId`, `ScopeDescriptor`, `CollectionTimestamp`, schema versions) and **auto-fill** wizard state where the form already supports it. Enforce generous but bounded file size consistent with existing bulk-evidence limits; surface clear errors for corrupt or non-packager zips.
- **Step 2 — Minimal identity (required):** Operator must confirm or enter **system name**, **environment** (default sensible non-prod if unknown), and **cloud provider** (default **Azure**, confirm-only — forward-compat). These align with `ArchitectureRequest` / wizard schema fields already used by `wizardValuesToCreateRunPayload` / `createArchitectureRun` — do not invent parallel DTOs.
- **Progressive disclosure:** Keep existing steps (constraints, advanced) **optional** and skippable for this path; do **not** require governance tags, compliance constraint matrices, datastore/service graph authoring, or framework-mapping inputs before first run creation.
- **Telemetry / checklist:** Wire into the same first-tenant funnel / core pilot step affordances as today (`core-pilot-steps`, funnel events) so “baseline captured” is observable.
- **Docs link:** CTA from the wizard to `docs/library/PILOT_GUIDE.md` (or the canonical packager doc path already linked from the Azure step).
- **Tests:** Vitest for ZIP metadata extraction + form prefill (fixture: minimal valid zip structure or mocked `File`/`Blob` path per existing test patterns); one RTL test that baseline-first path reaches submit with only required fields set.
- **Constraints:** Reuse OpenAPI types; no new HTTP routes unless the product already needs a server-side unpack endpoint — prefer browser-side unzip + parse if safe for size limits; if server unpack is required, follow `Http-Surface-Docs-And-Clients.mdc`.
- **Explicitly out of scope here** (deferred per `docs/library/V1_DEFERRED.md` — baseline wizard enrichments): manual datastore/service enumeration as a **gate**, mandatory governance/compliance/risk fields pre-commit, portfolio multi-system capture in one wizard, and deep framework-mapping steps. V1.1 carries structured enrichment gates; V2 carries portfolio-style onboarding where noted in that table.

**Impact:** Time-to-Value (+6–10 pts), Usability (+3–5 pts). Weighted readiness impact: +0.1–0.2%.
- **Acceptance criteria met:** `?baseline=1` ZIP-first step with manifest-driven prefill; 52 MB client cap; clear errors for invalid ZIPs; identity/constraints/advanced remain optional beyond existing wizard validation; PILOT_GUIDE CTA from wizard; Vitest + RTL coverage as listed in completion evidence. No new unpack HTTP route.
```

### 9. Add a 'Missing Baseline' warning to the executive dashboard
- **Why it matters:** Executive value can become abstract if real tenant baselines are missing.
- **Expected impact:** Executive Value Visibility (+10 pts), Usability (+5 pts).
- **Affected qualities:** Executive Value Visibility, Usability.
- **Actionable:** Yes
```text
Modify the executive dashboard component in `archlucid-ui` to display a prominent warning banner if no baseline data (e.g., Azure extractor ZIP) has been uploaded.
- Acceptance criteria: The banner is visible to Admin and Operator roles and links to the baseline upload documentation.
- Constraints: The banner must be dismissible for the current session.
- What not to change: Do not alter the underlying dashboard metrics calculations.
- Impact: Directly improves Executive Value Visibility (+8-10 pts) and Usability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 10. Internal Policy Pack Hub (catalog read model + admin-only promotion)
- **Why it matters:** Tenants need discoverable, trustworthy starter and vertical packs without emailing JSON; central catalog visibility increases stickiness while keeping mutation authority narrow.
- **Expected impact:** Stickiness (+15 pts), Template and Accelerator Richness (+10 pts).
- **Affected qualities:** Stickiness, Template and Accelerator Richness.
- **Actionable:** Yes
```text
Implement an **internal Policy Pack Hub**: a **read-only catalog** of **platform-curated** policy packs that any tenant can **browse and clone or assign**, while **only internal ArchLucid platform admins** (same RBAC surface as other operator-critical mutations — e.g. `RequireAdminAuthority` / internal operator rank already used for `/policy-packs`) may **promote** a pack version into that catalog. **Single-owner operational control** for catalog promotion is acceptable for V1 of the hub until additional admins are explicitly registered (document in runbook).

**Product rules**
- **Catalog vs tenant-private:** Packs created by customers remain **tenant-scoped**. A pack enters the **catalog** only via an explicit **PromoteToCatalog** (name TBD) mutation. Catalog entries are **immutable** at a given semantic version — corrections ship as **new versions** using the existing publish/semver flow (`POST .../publish`).
- **Versioning:** Reuse **semantic version** strings already on `PolicyPackVersion`; catalog row references `policyPackId` + **pinned published** `version`. No parallel version scheme.
- **Workflow:** Author or import in **tenant or internal staging tenant** → **Publish** (existing) → **Promote to catalog** (new, **admin-only**) → optional **deprecate** flag on catalog row (hide from default list; still honor existing assignments).
- **Fork / isolation:** When a tenant **“Use in my workspace”** from catalog, create a **new pack id** (deep copy of published `contentJson` + metadata snapshot) so edits never mutate the catalog source. Durable **audit** on promote, demote, and fork.

**Backend**
- Persistence: extend policy pack tables or add a thin `PolicyPackCatalogEntry` (pack id, version, display order, deprecatedUtc, promotedBy, promotedUtc) — prefer **minimal schema** and reuse existing repositories where possible.
- HTTP: add **GET** list/detail for catalog (tenant-authenticated, read-only). Add **POST** promote/demote (admin-only). Follow `Http-Surface-Docs-And-Clients.mdc` — OpenAPI snapshot, `.NET` client if applicable, `npm run generate:api-types` for UI.

**UI (`archlucid-ui`)**
- **`/policy-packs`:** new **“Catalog”** tab or sub-route listing promoted packs with version, description, **Fork to my tenant**, and **Assign** (if assignment UX already exists — reuse). Internal admin sees **Promote** only on packs they own operationally.
- Stable selectors for tests (`UI-Stable-Selectors-And-Snapshots.mdc`).

**Tests**
- .NET integration: promote forbidden for non-admin; allowed for admin fixture; fork creates distinct pack id.
- UI: Vitest for catalog table empty/rows; optional Playwright smoke if live harness exists.

**What not to do**
- Do **not** open multi-tenant **write** sharing (no tenant A edits tenant B’s pack). Do **not** expose SMB or public blob URLs for pack payloads.

**Impact:** Stickiness (+10-15 pts), Template and Accelerator Richness (+6-10 pts). Weighted readiness impact: +0.15-0.25%.
```

### 11. Formalize data residency verification in the Terraform provisioning pipeline
- **Why it matters:** Enterprise buyers require verifiable proof that resources match their geography.
- **Expected impact:** Compliance Readiness (+10 pts), Reliability (+5 pts).
- **Affected qualities:** Compliance Readiness, Reliability.
- **Actionable:** Yes
```text
Add a validation step in the Terraform CI pipeline (`.github/workflows/cd.yml` or equivalent) that asserts the `location` of all provisioned resources matches the expected `DataRegion`.
- Acceptance criteria: The pipeline fails if any resource is provisioned in an unexpected region.
- Constraints: Use Terraform `plan` output or `azurerm` data sources for validation.
- What not to change: Do not modify the actual Terraform resource definitions.
- Impact: Directly improves Compliance Readiness (+8-10 pts) and Reliability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 12. Add a CI step that fails the build if new API endpoints lack documented audit events
- **Why it matters:** Ensures that the `AUDIT_COVERAGE_MATRIX.md` does not drift from the actual API surface.
- **Expected impact:** Compliance Readiness (+10 pts), Maintainability (+5 pts).
- **Affected qualities:** Compliance Readiness, Maintainability.
- **Actionable:** Yes
```text
Create a Python script `scripts/ci/check_audit_matrix.py` that parses `ArchLucid.Api` controllers for `[HttpPost]`, `[HttpPut]`, and `[HttpDelete]` attributes and cross-references them against `docs/library/AUDIT_COVERAGE_MATRIX.md`.
- Acceptance criteria: The script exits with a non-zero code if a mutating endpoint is missing from the matrix.
- Constraints: Allow an explicit `[AuditExempt]` attribute or comment to bypass the check for valid exceptions.
- What not to change: Do not modify the API controllers, only add the CI script.
- Impact: Directly improves Compliance Readiness (+8-10 pts) and Maintainability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 13. Implement bi-directional ServiceNow status sync
- **Why it matters:** Closes a workflow gap for ITSM-led enterprises and fulfills a V1 GA commitment.
- **Expected impact:** Workflow Embeddedness (+15 pts), Interoperability (+5 pts).
- **Affected qualities:** Workflow Embeddedness, Interoperability.
- **Actionable:** Yes
```text
Implement a webhook receiver or polling mechanism in `ArchLucid.Api` to sync ServiceNow incident status changes back to ArchLucid finding states.
- Acceptance criteria: A status change in ServiceNow updates the corresponding finding in ArchLucid and emits a durable audit event.
- Constraints: Map statuses using a configurable per-tenant mapping (default: New/In Progress -> Open/InProgress; Resolved/Closed -> Resolved).
- What not to change: Do not alter the existing outbound incident creation logic.
- Impact: Directly improves Workflow Embeddedness (+10-15 pts) and Interoperability (+3-5 pts). Weighted readiness impact: +0.2-0.3%.
```

### 14. Add Playwright smoke tests for the Jira bidirectional status sync
- **Why it matters:** Ensures the Jira integration does not regress, protecting a key enterprise workflow.
- **Expected impact:** Testability (+10 pts), Workflow Embeddedness (+5 pts).
- **Affected qualities:** Testability, Workflow Embeddedness.
- **Actionable:** Yes
```text
Create a new Playwright test file `archlucid-ui/e2e/live-api-jira-sync.spec.ts`.
- Acceptance criteria: The test mocks a Jira webhook payload indicating a status change and verifies the finding status updates in the ArchLucid UI.
- Constraints: Do not make actual calls to the Jira API; use the mocked `/api/proxy` or a dedicated test webhook endpoint.
- What not to change: Do not modify the Jira integration business logic.
- Impact: Directly improves Testability (+8-10 pts) and Workflow Embeddedness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 15. Add Playwright smoke tests for the Slack chat-ops integration
- **Why it matters:** Ensures the Slack integration does not regress.
- **Expected impact:** Testability (+10 pts), Workflow Embeddedness (+5 pts).
- **Affected qualities:** Testability, Workflow Embeddedness.
- **Actionable:** Yes
```text
Create a new Playwright test file `archlucid-ui/e2e/live-api-slack-integration.spec.ts`.
- Acceptance criteria: The test triggers an alert or digest and verifies that the corresponding Slack webhook payload is generated correctly.
- Constraints: Intercept the outbound HTTP request to Slack to verify the payload without sending a real message.
- What not to change: Do not modify the Slack integration business logic.
- Impact: Directly improves Testability (+8-10 pts) and Workflow Embeddedness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 16. Add Playwright smoke tests for the Confluence documentation publish integration
- **Why it matters:** Ensures the Confluence integration does not regress.
- **Expected impact:** Testability (+10 pts), Workflow Embeddedness (+5 pts).
- **Affected qualities:** Testability, Workflow Embeddedness.
- **Actionable:** Yes
```text
Create a new Playwright test file `archlucid-ui/e2e/live-api-confluence-publish.spec.ts`.
- Acceptance criteria: The test triggers a run summary publish and verifies that the outbound Confluence API payload is formatted correctly.
- Constraints: Intercept the outbound HTTP request to Confluence to verify the payload without creating a real page.
- What not to change: Do not modify the Confluence integration business logic.
- Impact: Directly improves Testability (+8-10 pts) and Workflow Embeddedness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 17. Surface SAML SP signing certificate (and IdP metadata) expiry warnings for operators
- **Why it matters:** Enterprise SAML SP deployments fail procurement and production reviews when cert or metadata rotation is discovered only after outages; proactive surfacing reduces support load and adoption friction.
- **Expected impact:** Supportability (+10 pts), Adoption Friction (+5 pts).
- **Affected qualities:** Supportability, Adoption Friction.
- **Actionable:** Yes
```text
Ship **read-only** SAML 2.0 SP **operational health** signals for tenants with `ArchLucidAuth:Saml2:Enabled` so operators see rotation risk before IdP or SP certificates expire.

**Backend**
- Add an internal admin/operator read model (new `GET` route under existing admin auth conventions or extend an existing diagnostics DTO) that returns: SP **signing certificate** `NotAfter` (UTC) parsed from the configured cert material (no private keys on the wire); optional **IdP metadata** `validUntil` when metadata is loaded from XML and exposes that attribute; `Saml2Enabled` flag. Reuse `ArchLucidSamlAuthOptions` / host composition — do not log cert thumbprints or secrets. Follow `Http-Surface-Docs-And-Clients.mdc` if the HTTP contract changes.

**UI (`archlucid-ui`)**
- On the settings / security / auth surface where SAML is already documented (or add a thin **Security** strip under operator **Help** if no dedicated route exists today), render a **dismissible** banner when signing cert `NotAfter` is within **30 days** (make threshold a constant or config key) or already expired. Link to the repo SAML rotation runbook path (add or extend `docs/` if missing). `data-testid` + accessible name per `UI-Stable-Selectors-And-Snapshots.mdc`.

**Tests**
- API: unit or integration test with a fixed clock and stub certificate / options.
- UI: Vitest for banner threshold logic; optional Playwright if live stack already exercises SAML fixtures.

**Constraints**
- No behavior change to SAML login, assertion validation, or cookie issuance — **surfacing only**.

**Impact:** Supportability (+6-10 pts), Adoption Friction (+3-5 pts). Weighted readiness impact: +0.1-0.15%.
```

### 18. Add explicit application-level logging to the findings list API endpoints
- **Why it matters:** Allows evaluation of read-access patterns before committing them to the durable audit matrix.
- **Expected impact:** Observability (+10 pts), Compliance Readiness (+5 pts).
- **Affected qualities:** Observability, Compliance Readiness.
- **Actionable:** Yes
```text
Modify the findings list endpoints in `ArchLucid.Api` to emit structured application logs (e.g., via Serilog) containing the `FindingCount`, scope IDs, and run ID.
- Acceptance criteria: Read access to findings lists generates a structured log entry.
- Constraints: Do not emit a durable `IAuditService` event yet; this is for application telemetry only.
- What not to change: Do not alter the response schema of the findings list API.
- Impact: Directly improves Observability (+8-10 pts) and Compliance Readiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 19. Implement auto-scaling rules for the worker pool based on SQL authority outbox depth
- **Why it matters:** Scaling on Azure queue depth alone risks backlog accumulation for SQL-driven workloads.
- **Expected impact:** Scalability (+15 pts), Reliability (+5 pts).
- **Affected qualities:** Scalability, Reliability.
- **Actionable:** Yes
```text
Update the KEDA configuration in `infra/terraform-container-apps` to include a scaler based on the SQL authority outbox depth (`archlucid_authority_pipeline_work_pending` metric).
- Acceptance criteria: The worker pool scales up when the SQL outbox depth exceeds a configured threshold.
- Constraints: Ensure the scaler uses a read-only SQL principal or Prometheus metric endpoint.
- What not to change: Do not remove the existing Azure Queue scaler.
- Impact: Directly improves Scalability (+10-15 pts) and Reliability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 20. Add at least three new architecture boundary rules in `ArchLucid.Architecture.Tests`
- **Why it matters:** Protects maintainability by tightening public surfaces using the `internal` modifier.
- **Expected impact:** Maintainability (+10 pts), Correctness (+5 pts).
- **Affected qualities:** Maintainability, Correctness.
- **Actionable:** Yes
```text
Add three new NetArchTest rules in `ArchLucid.Architecture.Tests/DependencyConstraintTests.cs` to enforce that specific internal modules (e.g., specific persistence repositories or API middleware) are not referenced outside their designated boundaries.
- Acceptance criteria: The tests pass and correctly fail if the boundary is violated.
- Constraints: Ensure the rules align with the architecture invariants in `ARCHITECTURE_INVARIANTS.md`.
- What not to change: Do not refactor existing code unless it violates the new rules.
- Impact: Directly improves Maintainability (+8-10 pts) and Correctness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 21. Add dashboards and alerting in Grafana for wait times and dead letters
- **Why it matters:** Provides visibility into worker bursts and orchestration bottlenecks.
- **Expected impact:** Observability (+10 pts), Performance (+5 pts).
- **Affected qualities:** Observability, Performance.
- **Actionable:** Yes
```text
Create or update a Grafana dashboard JSON file in `infra/grafana/` to visualize `archlucid_authority_pipeline_work_dead_letter` and `archlucid_authority_pipeline_work_oldest_pending_age_seconds`.
- Acceptance criteria: The dashboard includes panels for dead letters, backlog depth, and oldest pending age, with corresponding Prometheus alert rules.
- Constraints: Use standard Prometheus PromQL syntax.
- What not to change: Do not modify the application metric emission logic.
- Impact: Directly improves Observability (+8-10 pts) and Performance (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 22. Audit and update background jobs to ensure Polly-based retry policies are uniformly applied
- **Why it matters:** Prevents silent failures in background workers due to transient SQL errors.
- **Expected impact:** Reliability (+15 pts), Correctness (+5 pts).
- **Affected qualities:** Reliability, Correctness.
- **Actionable:** Yes
```text
Review all background services (e.g., `IHostedService` implementations) in `ArchLucid.Worker` and ensure they use `ResilientSqlConnectionFactory` or apply `SqlOpenResilienceDefaults` when opening SQL connections.
- Acceptance criteria: All background SQL connections use the configured Polly retry pipeline.
- Constraints: Do not apply retries to non-transient errors (e.g., authentication failures).
- What not to change: Do not alter the core business logic of the background jobs.
- Impact: Directly improves Reliability (+10-15 pts) and Correctness (+3-5 pts). Weighted readiness impact: +0.2-0.3%.
```

### 23. Implement telemetry to track `108` replay notes during catalog migrations
- **Why it matters:** Provides visibility into lag during coordination-heavy RLS migrations.
- **Expected impact:** Correctness (+10 pts), Maintainability (+5 pts).
- **Affected qualities:** Correctness, Maintainability.
- **Actionable:** Yes
```text
Add telemetry emission (e.g., via `ArchLucidInstrumentation`) whenever a `108` replay note is encountered during a catalog migration.
- Acceptance criteria: A custom metric or structured log is emitted containing the migration ID and tenant scope.
- Constraints: Ensure the telemetry does not block the migration process.
- What not to change: Do not alter the DbUp migration execution flow.
- Impact: Directly improves Correctness (+8-10 pts) and Maintainability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 24. Add a CI check to ensure all Terraform advisory snippets pass `terraform fmt` and `terraform validate`
- **Why it matters:** Unvalidated Terraform snippets could produce invalid advisory output, damaging trust.
- **Expected impact:** Correctness (+10 pts), Reliability (+5 pts).
- **Affected qualities:** Correctness, Reliability.
- **Actionable:** Yes
```text
Add a step to the GitHub Actions CI pipeline (`.github/workflows/ci.yml`) that extracts sample Terraform advisory snippets and runs `terraform fmt -check` and `terraform validate` on them.
- Acceptance criteria: The CI build fails if any sample snippet is invalid Terraform.
- Constraints: Use a mock or sample finding payload to generate the snippets during the test.
- What not to change: Do not modify the Terraform export business logic.
- Impact: Directly improves Correctness (+8-10 pts) and Reliability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 25. Enhance the Azure extractor script to collect Azure Policy compliance states
- **Why it matters:** Provides a richer baseline for security and governance policy packs, increasing platform stickiness.
- **Expected impact:** Stickiness (+10 pts), Proof-of-ROI Readiness (+5 pts).
- **Affected qualities:** Stickiness, Proof-of-ROI Readiness.
- **Actionable:** Yes
```text
Update `Get-ArchLucidAzurePackage.ps1` to query Azure Policy compliance states (e.g., via `Get-AzPolicyState`) and include the results in a new `policy-compliance.json` file in the output ZIP.
- Acceptance criteria: The script successfully collects policy states without requiring additional RBAC roles beyond `Reader`.
- Constraints: Handle pagination and rate limiting gracefully when querying policy states.
- What not to change: Do not alter the existing ARM resource collection logic.
- Impact: Directly improves Stickiness (+8-10 pts) and Proof-of-ROI Readiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

---

## Prompt Batching Guidance

To optimize context window usage and cost-effectiveness, batch the actionable prompts as follows:

- **Batch 1 (Observability & Reliability):** 2, 18, 21, 22, 23
- **Batch 2 (Testing & CI Hygiene):** ~~5~~ completed 2026-05-17, 12, 14, 15, 16, 24
- **Batch 3 (Integrations & Extractor):** ~~6~~ completed 2026-05-17, 13, 25
- **Batch 4 (Architecture, infrastructure, tenant lifecycle):** ~~3~~ (**V2** — [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §**6m**), ~~7~~ completed 2026-05-17, 11, 17, 19, 20
- **Batch 5 (UX & Dashboards):** ~~4~~ completed 2026-05-17, 8, 9, 10
- **Batch 6 (Internal cross-tenant rollups):** ~~1~~ completed 2026-05-17

---

## Pending Questions for Later

(None.)