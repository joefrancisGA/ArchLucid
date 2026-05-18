> **Scope:** Independent, first-principles assessment of ArchLucid readiness.
> **Status:** current

# ArchLucid Assessment – (A) Headline Readiness: 84.94%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding explicitly deferred items (e.g., SOC 2 CPA attestation, third-party pen testing, MCP, live commerce un-hold, and V1.1-scoped integration suites). **§22** defines automated tenant erasure as actionable V2 backlog; it remains outside headline `(A)` scoring until implemented. **[V1.1 backlog](../library/V1_DEFERRED.md)** items (commercial un-hold, security publication milestones, and similar) do not reduce this headline score while deferred.

## Executive Summary

### (A) Overall Headline Readiness (84.94%)
ArchLucid is a functionally complete V1 product with a highly rigorous architectural foundation (84.94% readiness). It successfully executes the core pilot loop and provides strong governance and traceability features. Recent completions—such as internal cross-tenant analytics, form-based custom policy authoring, LLM telemetry, the internal Policy Pack Hub (catalog + clone), operational script hardening, merge-blocking OpenAPI v1 snapshot drift checks in CI, Azure Retail Prices coverage for VMs and Storage Accounts in the extractor package, tenant-fair dequeue for the deferred authority pipeline SQL outbox, Terraform plan validation of declared Azure SQL backup redundancy (Geo/Zone) in CD, SAML SP certificate nearing-expiry email notifications, structured application logging for policy pack assign and archive (telemetry fields include `PolicyPackId`, `TenantId`, `WorkspaceId`), soft-delete for architecture projects on `dbo.Projects` (`IsDeleted`, `DeletedUtc`) with leader-elected retention hard-purge after the configured window (default 30 days via `ArchitectureProjectRetention`), Azure Monitor managed Prometheus alerting for integration event outbox dead-letter (`ArchLucidIntegrationOutboxDeadLetterNonZeroTf`) and for per-tenant LLM monthly dollar budget utilization over 75% (`ArchLucidLlmBudgetWarnFractionBreachedTf`; product gauge `archlucid_llm_budget_utilization_fraction`, both in `infra/terraform-monitoring/prometheus_slo_rules.tf` with CI regression coverage), Grafana **LLM GenAI telemetry** (`infra/grafana/dashboard-archlucid-llm.json`: **`archlucid_llm_gen_ai_operation_duration_ms`**, token counters incl. **`archlucid_llm_embedding_input_tokens_total`**) paired with **`dashboard-archlucid-llm-usage`** (**budget headroom** **`archlucid_llm_budget_remaining_usd`**, **`archlucid_llm_budget_utilization_fraction`** from §15), **`runbook_url` annotations on the three legacy HTTP / outbox-depth SLO mirror rules** (Authority Pipeline observability runbook via `local.archlucid_authority_observability_runbook_url`), and a dedicated configurable rate limit (`evidenceBulkUpload`) on multipart bulk evidence upload, **`archlucid-ui/e2e/live-api-smoke.spec.ts`** (baseline extractor ZIP wizard + sealed findings UI on **`LIVE_API_URL`**; no Playwright **`page.route`** stubs)—significantly strengthen the GA offering. The primary remaining gaps include observability follow-through (**Loki** alerting on structured logs, composite GenAI / cross-service SLO coherence, optional **`grafana_dashboard`** Terraform for **`dashboard-archlucid-llm`** when teams rely on dashboards-as-code), Azure Cost Management actuals / Advisor parity versus retail estimates, and **PR UI skew** (mock-forward **`ui-e2e-smoke`** vs narrower real-integration **`live-api-*`** matrices).

### (B) Procurement/Market-Motion Realism
Enterprise procurement will face friction due to the lack of a CPA-issued SOC 2 Type II report and third-party penetration testing (both intentionally deferred). The reliance on a SOC 2 self-assessment and owner-conducted penetration testing is acceptable for early pilots but will require executive sponsorship to bypass standard vendor security gates. Automated tenant erasure is specified as actionable backlog in **§22** (V2 delivery); until shipped it is not scored as an `(A)` defect. V1 relies on operator-driven and trial/offboarding deletion paths.

### Commercial Picture
The commercial posture is strongly aligned for a sales-led, service-led motion. The inclusion of consultant whitelabeling on architecture review exports enables boutique consulting firms to use ArchLucid as a delivery engine. Curated demo workspaces, default policy packs, and the ZIP-first baseline wizard accelerate Time-to-Value and Proof-of-ROI. The deferred live commerce correctly prioritizes validated purchasing motions over premature self-serve availability.

### Enterprise Picture
ArchLucid provides strong enterprise integration points, including Jira, ServiceNow, Slack, and Confluence. Tenant isolation is robustly handled via database-per-tenant and RLS. Tenant custom governance packs support form-based authoring for curated-rules-shaped documents. SAML SP nearing-expiry email notifications for tenant admins, tenant-fair authority pipeline outbox dequeue in the worker, CD-time Terraform checks for declared Azure SQL backup redundancy, configurable per-tenant rate limits on bulk architecture evidence multipart uploads, structured logging for policy pack assignment assign and archive, architecture project soft-delete with retention-based hard purge (default 30 days), optional Azure Monitor Prometheus alerting for integration outbox dead-letter rows and for LLM monthly tenant-dollar budget utilization (warn-fraction breach per `tenant_id`) when the managed SLO/rule group is enabled, **`runbook_url`-linked triage paths on the legacy HTTP latency, 5xx ratio, and outbox-depth Prometheus SLO mirror rules**, **direct Prometheus LLM monthly budget USD headroom** (`archlucid_llm_budget_remaining_usd` for Grafana `dashboard-archlucid-llm-usage` when **`LlmMonthlyTenantDollarBudget:Enabled`**), and data residency verification in Terraform CI further enhance enterprise readiness.

### Engineering Picture
The engineering foundation is highly rigorous, with strong architectural invariants, NetArchTest boundary rules, and a durable audit trail. The agent orchestration pipeline is resilient, and producer-side OpenTelemetry GenAI instrumentation records token aggregates, latency, and deployment identifiers. Grafana **`dashboard-archlucid-llm`** complements **`dashboard-archlucid-llm-usage`** (latency + tokenizer throughput alongside **budget headroom** **`archlucid_llm_budget_remaining_usd`**); Loki alert rules on assignment logs, composite SLO depth, and dashboards-as-code wiring for **`dashboard-archlucid-llm`** remain follow-ups. **`live-api-smoke.spec.ts`** adds an unstubbed **`/api/proxy`** ZIP-first pilot + findings slice on **`LIVE_API_URL`**, alongside other **`live-api-*`** specs — **mock-heavy `ui-e2e-smoke`** release gates nevertheless keep testability breadth uneven vs full live route coverage.

---

## Weighted Quality Assessment

### 1. AI/Agent Readiness
- **Score:** 85
- **Weight:** 8
- **Weighted impact on readiness:** 120
- **Why this score was assigned:** The system effectively uses Azure OpenAI with prompt redaction, execution traces, and a well-tested authority pipeline. OpenTelemetry tracing for LLM API calls exists.
- **Key tradeoffs:** Cost attribution still depends on exporters and retention.
- **Specific improvement recommendations:** Operationalize alerting, SLOs, and **Loki** correlation on shipped GenAI telemetry (Grafana dashboards are committed; ingestion + on-call workflows still vary by deployment).
- **Fixability:** Fixable in V1.

### 2. Time-to-Value
- **Score:** 85
- **Weight:** 7
- **Weighted impact on readiness:** 105
- **Why this score was assigned:** Curated demo workspaces, default policy packs, and a guided baseline collection wizard (ZIP-first) accelerate initial value.
- **Key tradeoffs:** Real-mode value requires tenant baseline data, which can take time to gather.
- **Specific improvement recommendations:** Cost optimization curated sample policy pack shipped (`docs/samples/policy-packs/cost-optimization-rules-v1.json`, `cost-optimization.json`); optional follow-up is catalog/default seeding for first-run visibility.
- **Fixability:** Fixable in V1.

### 3. Correctness
- **Score:** 87
- **Weight:** 8
- **Weighted impact on readiness:** 104
- **Why this score was assigned:** The execution model is solid. The system correctly merges agent results into versioned manifests. Terraform advisory snippets validation and 108 replay note telemetry are implemented.
- **Key tradeoffs:** RLS migrations remain coordination-heavy.
- **Specific improvement recommendations:** Ensure Polly-based retry policies are uniformly applied in background jobs.
- **Fixability:** Fixable in V1.

### 4. Adoption Friction
- **Score:** 85
- **Weight:** 6
- **Weighted impact on readiness:** 90
- **Why this score was assigned:** Operator shell labels are aligned with marketing vocabulary. Integrations with Jira, ServiceNow, Slack, and Confluence reduce workflow disruption. Form-based curated-rules authoring exists.
- **Key tradeoffs:** Governance authoring UX depth may still lag specialist policy-studio expectations.
- **Specific improvement recommendations:** Add automated SAML cert expiry email notifications.
- **Fixability:** Fixable in V1.

### 5. Proof-of-ROI Readiness
- **Score:** 82
- **Weight:** 5
- **Weighted impact on readiness:** 90
- **Why this score was assigned:** The Azure extractor appends Retail Prices (consumption catalog rows) for App Service, SQL, Virtual Machines, and Storage Accounts when `-IncludeRetailPrices` is used. Cross-tenant analytics rollups exist.
- **Key tradeoffs:** Broader Cost Management / Advisor parity and estimate-vs-actual spend narratives remain manual.
- **Specific improvement recommendations:** Implement `-IncludeCost` / `-IncludeAdvisor` exports (or equivalent) so architecture reviews can contrast retail estimates with billed usage.
- **Fixability:** Fixable in V1.

### 6. Executive Value Visibility
- **Score:** 85
- **Weight:** 4
- **Weighted impact on readiness:** 60
- **Why this score was assigned:** Architecture Review Report export with consultant whitelabeling provides immediate, tangible artifacts. A missing baseline warning exists on the executive dashboard.
- **Key tradeoffs:** Executive value can become abstract if real tenant baselines are missing.
- **Specific improvement recommendations:** Draft a service-led review SKU order form to accelerate sales.
- **Fixability:** Fixable in V1.

### 7. Differentiability
- **Score:** 85
- **Weight:** 4
- **Weighted impact on readiness:** 60
- **Why this score was assigned:** Evidence-linked findings and governed decision trails differentiate the product from generic LLM wrappers.
- **Key tradeoffs:** Broad proof surface helps defensibility but requires concise buyer framing.
- **Specific improvement recommendations:** Develop an internal Policy Pack Hub for sharing custom policies.
- **Fixability:** Fixable in V1.

### 8. Usability
- **Score:** 85
- **Weight:** 3
- **Weighted impact on readiness:** 45
- **Why this score was assigned:** The operator UI is functional. Bounded bulk evidence upload is supported. Finding confidence is surfaced via badges.
- **Key tradeoffs:** The 30-file ceiling avoids abuse but may annoy heavy dossier pilots.
- **Specific improvement recommendations:** Tune bulk evidence quotas and operator visibility (`evidenceBulkUpload` ships in API; watch near-cap tenants and integration partners).
- **Fixability:** Fixable in V1.

### 9. Decision Velocity
- **Score:** 83
- **Weight:** 2
- **Weighted impact on readiness:** 34
- **Why this score was assigned:** Speeds up architecture reviews by providing structured evidence and policy findings.
- **Key tradeoffs:** Requires operator trust in the AI's findings to truly accelerate decisions.
- **Specific improvement recommendations:** Add export to CSV for findings for offline analysis.
- **Fixability:** Fixable in V1.

### 10. Compliance Readiness
- **Score:** 85
- **Weight:** 2
- **Weighted impact on readiness:** 30
- **Why this score was assigned:** A durable audit trail exists. RLS provides tenant isolation. Data residency verification in Terraform CI exists.
- **Key tradeoffs:** Absence of a fully automated GDPR/CCPA quarantine-and-purge pipeline (deferred to V2).
- **Specific improvement recommendations:** Add a SQL backup region verification script.
- **Fixability:** Fixable in V1.

### 11. Commercial Packaging Readiness
- **Score:** 85
- **Weight:** 2
- **Weighted impact on readiness:** 30
- **Why this score was assigned:** Sales-led pilot ready. Consultant whitelabeling improves resale positioning.
- **Key tradeoffs:** Deferring live commerce delays self-serve revenue.
- **Specific improvement recommendations:** Flip Stripe live keys and publish Marketplace listing.
- **Fixability:** Better suited for V1.1 (blocked on user input).

### 12. Explainability
- **Score:** 85
- **Weight:** 2
- **Weighted impact on readiness:** 30
- **Why this score was assigned:** The system provides comparison replays and a knowledge graph.
- **Key tradeoffs:** Default in-process projection cache caps multi-replica coherence.
- **Specific improvement recommendations:** Enhance documentation for single-process projection limitations.
- **Fixability:** Fixable in V1.

### 13. Reliability
- **Score:** 87
- **Weight:** 2
- **Weighted impact on readiness:** 26
- **Why this score was assigned:** The `AuthorityRunOrchestrator` handles long-running analysis. Worker pool auto-scaling based on SQL outbox depth exists.
- **Key tradeoffs:** Background workers may lack comprehensive retry policies.
- **Specific improvement recommendations:** Continue hardening Polly-backed SQL retries on remaining ancillary background workers now that tenant-fair authority outbox dequeue is shipped.
- **Fixability:** Fixable in V1.

### 14. Maintainability
- **Score:** 87
- **Weight:** 2
- **Weighted impact on readiness:** 26
- **Why this score was assigned:** Clean code architecture. NetArchTest boundary rules enforce layering.
- **Key tradeoffs:** The large surface area increases maintenance overhead.
- **Specific improvement recommendations:** Implement a Dependency Injection Analyzer NetArchTest rule.
- **Fixability:** Fixable in V1.

### 15. Observability
- **Score:** 78
- **Weight:** 1
- **Weighted impact on readiness:** 22
- **Why this score was assigned:** OpenTelemetry and Serilog provide good visibility. GenAI instrumentation shipped.
- **Key tradeoffs:** Standard observability tools require operator expertise to configure.
- **Specific improvement recommendations:** Curate Grafana dashboards for LLM spans and token counters.
- **Fixability:** Fixable in V1.

### 16. Interoperability
- **Score:** 90
- **Weight:** 2
- **Weighted impact on readiness:** 20
- **Why this score was assigned:** REST API, CLI, webhooks, ITSM connectors, SAML 2.0 SP, and OIDC provide excellent interoperability.
- **Key tradeoffs:** SAML SP adds dual auth-surface operational burden.
- **Specific improvement recommendations:** None for V1 GA.
- **Fixability:** Better suited for V1.1.

### 17. Performance
- **Score:** 80
- **Weight:** 1
- **Weighted impact on readiness:** 20
- **Why this score was assigned:** Rate limiting is implemented. Optional Redis cache is available. Dashboards for wait times and dead letters exist.
- **Key tradeoffs:** Making Redis optional simplifies single-replica deployments but complicates scaled operations.
- **Specific improvement recommendations:** Add a health check endpoint for Redis.
- **Fixability:** Fixable in V1.

### 18. Template and Accelerator Richness
- **Score:** 80
- **Weight:** 1
- **Weighted impact on readiness:** 20
- **Why this score was assigned:** Two curated default policy packs provide a good starting point.
- **Key tradeoffs:** The library is currently small.
- **Specific improvement recommendations:** Develop an internal Policy Pack Hub.
- **Fixability:** Fixable in V1.

### 19. Cognitive Load
- **Score:** 80
- **Weight:** 1
- **Weighted impact on readiness:** 20
- **Why this score was assigned:** Marketing-aligned vocabulary helps, but the product surface is large.
- **Key tradeoffs:** Breadth is valuable for expansion but increases first-session confusion.
- **Specific improvement recommendations:** Use telemetry to refine operator UI once patterns are stable.
- **Fixability:** Fixable in V1.

### 20. Cost-Effectiveness
- **Score:** 80
- **Weight:** 1
- **Weighted impact on readiness:** 20
- **Why this score was assigned:** Azure cost extractor provides visibility.
- **Key tradeoffs:** Some manual estimation remains in broader Azure cost workflows.
- **Specific improvement recommendations:** Extend automated Azure cost narratives to VMs and Storage.
- **Fixability:** Fixable in V1.

### 21. Stickiness
- **Score:** 82
- **Weight:** 1
- **Weighted impact on readiness:** 18
- **Why this score was assigned:** Governance workflows and compliance drift tracking provide ongoing value. Azure Policy compliance states are collected.
- **Key tradeoffs:** Thin starter packs risk one-and-done pilots.
- **Specific improvement recommendations:** Operationalize dashboards or saved searches on policy pack assignment logs (structured fields include `PolicyPackId`, `TenantId`, `WorkspaceId`).
- **Fixability:** Fixable in V1.

### 22. Scalability
- **Score:** 85
- **Weight:** 1
- **Weighted impact on readiness:** 15
- **Why this score was assigned:** Scales well horizontally. Auto-scaling rules for worker pool exist.
- **Key tradeoffs:** Single-tenant worker pool exhaustion is still a risk.
- **Specific improvement recommendations:** Redis as the default production substrate for scaled API fleets.
- **Fixability:** Better suited for V2.

### 23. Supportability
- **Score:** 85
- **Weight:** 1
- **Weighted impact on readiness:** 15
- **Why this score was assigned:** Good logging, OpenTelemetry, and CLI diagnostics. Operational scripts support JWT/API keys.
- **Key tradeoffs:** New HTTP utilities must reuse auth headers.
- **Specific improvement recommendations:** Create a runbook for handling rate limit exceeded errors.
- **Fixability:** Fixable in V1.

### 24. Testability
- **Score:** 87
- **Weight:** 1
- **Weighted impact on readiness:** 13
- **Why this score was assigned:** Strong unit/integration tests. Playwright specs for whitelabel export added.
- **Key tradeoffs:** **`ui-e2e-smoke`** / release mock suite remains skew vs **`live-api-*`** depth.
- **Specific improvement recommendations:** Expand **`live-api-*`** matrices (CI/staging breadth) beyond **`live-api-smoke`** parity.
- **Fixability:** Fixable in V1.

---

## Top 12 Most Important Weaknesses

1. **LLM observability consumption gaps:** Producer GenAI spans and meters ship; committed Grafana covers GenAI latency + tokenizer throughput (**`dashboard-archlucid-llm`**) and usage/finops (**`dashboard-archlucid-llm-usage`**), but operators still need SLO depth, alerting, and **Loki** correlation for those signals.
2. **E2E test mock reliance:** **`live-api-smoke.spec.ts`** (**§7**) and the broader **`live-api-*`** suite exercise real **`/api/proxy`** → **`LIVE_API_URL`**, but mock-forward **`ui-e2e-smoke`** (**`playwright.mock.config`**) remains the default PR surface—regressions outside live matrices remain possible.
3. **Manual Azure cost estimations for VMs and Storage:** App Service and SQL are covered, but other SKUs remain manual.
4. **Missing Internal Policy Pack Hub:** Tenants need discoverable, trustworthy starter packs without emailing JSON.
5. **Background job transient fault handling:** Incomplete retry policies for SQL connections in background workers risk silent failures.
6. **Data residency diligence depth:** Buyers require verifiable proof that SQL topology and backups match their geography.
7. **SAML SP operational burden:** Managing certificate rotation and metadata drift for SAML SP adds operational overhead.
8. **Thin starter packs:** AI governance and security baseline packs exist, but risk "one-and-done" pilots without a cost optimization pack.
9. **Noisy neighbor posture in orchestration:** Buyers will diligence steady-state parallelism and multi-region fairness.
10. **`evidenceBulkUpload` follow-up:** Dedicated rate limiting ships (`ASP.NET Core` policy `evidenceBulkUpload`, tenant/IP partitions); perimeter defense and dashboards for dossier-heavy or abusive callers still need curator attention.
11. **Architecture project recovery is not self-service:** `DELETE /v1/tenant/workspaces/.../projects/...` soft-deletes (`IsDeleted`, `DeletedUtc`); hard purge runs after retention (default 30 days). In-product undo/restore is still absent—recovery depends on operational backup or direct data plane work during the retention window.
12. **Policy pack assignment visibility (follow-up):** Assign and archive paths emit structured application logs, but Grafana/Loki dashboards and alert rules keyed on those events are not yet curated.

---

## Top 6 Monetization Blockers

1. **Manual Azure cost estimations for VMs and Storage:** Limits the platform's ability to automatically prove hard infrastructure savings.
2. **Lack of a published reference customer:** Slows early momentum and trust generation (deferred to V1.1).
3. **Lack of self-serve transactability:** Stripe live keys and Marketplace publication are deferred, forcing a high-touch sales motion.
4. **Named productized offers packaging:** Velocity to cash depends on a buyable review SKU and SOW alignment, which requires GTM execution.
5. **Thin starter packs:** Risk "one-and-done" pilots if tenants do not extend them.
6. **Missing Internal Policy Pack Hub:** Central catalog visibility increases stickiness while keeping mutation authority narrow.

---

## Top 6 Enterprise Adoption Blockers

1. **Absence of compliance attestations:** Lack of a CPA-issued SOC 2 Type II report causes friction in security reviews.
2. **Data residency diligence depth:** Buyers require verifiable proof that SQL topology and backups match their geography.
3. **Noisy neighbor posture in orchestration:** Buyers will diligence steady-state parallelism and multi-region fairness.
4. **SAML SP operational burden:** Managing certificate rotation and metadata drift for SAML SP adds operational overhead for enterprise IT.
5. **Automated tenant erasure:** Not a V1 headline blocker, but buyers may still request a productized erasure narrative—**§22** is the concrete V2 backlog spec (quarantine, legal hold, blob + SQL purge).
6. **Architecture project recovery is not self-service:** Soft-delete plus retention purge is implemented; productized undelete UX and guardrails messaging for admins are still limited compared to buyer expectations for “recycle bin” workflows.

---

## Top 6 Engineering Risks

1. **LLM observability consumption gaps:** Committed Grafana covers GenAI latency + tokenizer throughput (**`dashboard-archlucid-llm`**) and usage/finops headroom (**`dashboard-archlucid-llm-usage`**); operators still need SLO depth, alerting, and **Loki** correlation for day-2 operations.
2. **E2E test mock reliance:** **`live-api-smoke.spec.ts`** complements **`live-api-*`** against SQL/API, while **`ui-e2e-smoke`** stays mock-forward — coverage skew remains unless teams expand **`live-api-*`** or wire staging runs.
3. **Background job transient fault handling:** Incomplete retry policies for SQL connections in background workers risk silent failures.
4. **`evidenceBulkUpload` observability:** Fixed-window ASP.NET Core rate limiting is implemented for multipart bulk architecture evidence uploads; anomaly detection, WAF-aligned quotas, and operator dashboards for abusive tenants remain uneven.
5. **Architecture project retention vs. UX:** Deleted projects linger for the purge window—operators need clarity on timelines and escalation if a mistaken delete must be reversed without a restore UI.
6. **Missing health check endpoint for Redis:** If Redis is configured, a health check endpoint is needed to verify connectivity.

---

## Most Important Truth

ArchLucid is a functionally complete, highly rigorous V1 product ready for sales-led pilots, but its ability to scale commercially is bottlenecked by observability consumption gaps, residual manual ROI proof breadth, and enterprise friction.

---

## Top Improvement Opportunities

### 1. Implement LLM Observability Grafana Dashboard — **complete**
- **Why it matters:** Provides operators with visibility into LLM token usage, latency, and costs.
- **Expected impact:** Observability (+15 pts), AI/Agent Readiness (+5 pts).
- **Affected qualities:** Observability, AI/Agent Readiness.
- **Actionable:** No — delivered (`infra/grafana/dashboard-archlucid-llm.json`: GenAI **`archlucid_llm_gen_ai_operation_duration_ms`** histogram p50/p95 + mean, **`archlucid_llm_embedding_input_tokens_total`**, **`archlucid_llm_prompt_tokens_total`**, **`archlucid_llm_completion_tokens_total`**. Operational **usage + USD headroom** lives in **`dashboard-archlucid-llm-usage.json`**, §17.)
```text
Create a Grafana dashboard JSON in `infra/grafana/` to visualize LLM telemetry (`archlucid_llm_gen_ai_operation_duration_ms`, token counters incl. `archlucid_llm_embedding_input_tokens_total`).
- Status: COMPLETE — acceptance criteria met (**`dashboard-archlucid-llm.json`**, PromQL Prometheus datasource **`${datasource}`**).
- Acceptance criteria: Dashboard includes **`archlucid_llm_gen_ai_operation_duration_ms`** latency (histogram panels) and **`archlucid_llm_embedding_input_tokens_total`** (embedding throughput); standard PromQL only.
- Constraints: Use standard Prometheus PromQL syntax.
- What not to change: Dashboard-only artifact; metric emission unchanged.
- Impact: Directly improves Observability (+10-15 pts) and AI/Agent Readiness (+3-5 pts). Weighted readiness impact: +0.2-0.3%.
```

### 2. Add Azure VM and Storage Account Retail Prices to Extractor — **complete**
- **Why it matters:** Extends automated cost narratives beyond App Service and SQL, proving ROI for more SKUs.
- **Expected impact:** Cost-Effectiveness (+10 pts), Proof-of-ROI Readiness (+5 pts).
- **Affected qualities:** Cost-Effectiveness, Proof-of-ROI Readiness.
- **Actionable:** No — delivered (`Resolve-ArchLucidRetailCatalogServiceName` maps `Microsoft.Compute/virtualMachines` → **Virtual Machines** and `Microsoft.Storage/storageAccounts` → **Storage Accounts**; VM size hints via `properties.vmSize` and `Get-ArchLucidInventoryVmSizeHint`; `Get-ArchLucidAzurePackage.ps1` scriptVersion **0.3.1**; Retail HTTPS-only, no new RBAC).
```text
Update `scripts/azure/ArchLucid.RetailPrices.helpers.ps1` and `Get-ArchLucidAzurePackage.ps1` to query the Azure Retail Prices API for Virtual Machines and Storage Accounts.
- Status: COMPLETE — acceptance criteria met (`retail-prices.json` emits consumption-priced catalog rows for inventoried VMs and Storage Accounts; OData filter unchanged pattern `priceType eq 'Consumption'`).
- Acceptance criteria: `retail-prices.json` includes consumption-priced catalog rows for VMs and Storage Accounts.
- Constraints: Do not require any new Azure RBAC roles beyond `Reader` and `Cost Management Reader`.
- What not to change: Do not alter the core ARM resource collection logic.
- Impact: Directly improves Cost-Effectiveness (+8-10 pts) and Proof-of-ROI Readiness (+3-5 pts). Weighted readiness impact: +0.2-0.3%.
```

### 3. Internal Policy Pack Hub (catalog read model + admin-only promotion) — **complete**
- **Why it matters:** Tenants need discoverable, trustworthy starter packs without emailing JSON.
- **Expected impact:** Stickiness (+15 pts), Template and Accelerator Richness (+10 pts).
- **Affected qualities:** Stickiness, Template and Accelerator Richness.
- **Actionable:** No — delivered (`PolicyPackCatalogEntry` / migration 171, `GET/POST /v1/policy-packs/catalog/*`, operator **Catalog** tab on `/policy-packs`, `docs/library/API_CONTRACTS.md` Policy packs table; clone remains tenant-owned; no multi-tenant write sharing).
```text
Implement an internal Policy Pack Hub: a read-only catalog of platform-curated policy packs that any tenant can browse and clone, with admin-only promotion.
- Status: COMPLETE — acceptance criteria met (table, tenant-authenticated catalog GETs, admin promote/demote, UI Catalog tab; OpenAPI/clients per Http-Surface-Docs-And-Clients).
- Acceptance criteria: Add a `PolicyPackCatalogEntry` table. Add GET list/detail for catalog (tenant-authenticated). Add POST promote/demote (admin-only). Update UI to show a "Catalog" tab under `/policy-packs`.
- Constraints: Follow `Http-Surface-Docs-And-Clients.mdc` for new endpoints.
- What not to change: Do not open multi-tenant write sharing.
- Impact: Directly improves Stickiness (+10-15 pts) and Template and Accelerator Richness (+6-10 pts). Weighted readiness impact: +0.15-0.25%.
```

### 4. Create Cost Optimization Policy Pack — **complete**
- **Why it matters:** Provides immediate, tangible value by identifying over-provisioned resources.
- **Expected impact:** Time-to-Value (+10 pts), Stickiness (+5 pts).
- **Affected qualities:** Time-to-Value, Stickiness.
- **Actionable:** No — delivered (`docs/samples/policy-packs/cost-optimization-rules-v1.json` — `archlucid.policyPack.curatedRules.v1` with **6** extractor-aligned cost rules; companion `docs/samples/policy-packs/cost-optimization.json` for `complianceRuleKeys` **`cost-opt-001`**–**`cost-opt-006`** and `curatedRulesArtifact` pointer; policy engine unchanged.)
```text
Create a new curated policy pack `docs/samples/policy-packs/cost-optimization-rules-v1.json` focused on cost savings (e.g., unattached disks, idle VMs).
- Status: COMPLETE — acceptance criteria met (valid curated-rules v1 JSON; ≥5 cost-focused rules; evidence maps to extractor `resources.json`, `manifest.json`, optional `retail-prices.json`, `policy-compliance.json`).
- Acceptance criteria: The pack is valid JSON matching the curated-rules schema and includes at least 5 cost-focused rules.
- Constraints: Ensure the rules map to data collected by the Azure extractor.
- What not to change: Do not modify the policy engine.
- Impact: Directly improves Time-to-Value (+8-10 pts) and Stickiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 5. Add Automated SAML Cert Expiry Email Notifications — **complete**
- **Why it matters:** Proactively alerts admins before SAML SP certificates expire, reducing support load.
- **Expected impact:** Supportability (+10 pts), Adoption Friction (+5 pts).
- **Affected qualities:** Supportability, Adoption Friction.
- **Actionable:** No — delivered (`ArchLucid.Api/Hosting/SamlCertExpiryNotificationHostedService.cs`, `SamlCertExpiryNotificationWork.cs`; leader lease `hosted:saml-cert-expiry-notification`; unit tests `ArchLucid.Api.Tests/Hosting/SamlCertExpiryNotificationWorkTests.cs`.)
```text
Create a background hosted service `SamlCertExpiryNotificationHostedService` that runs daily to check SAML SP certificate expiry.
- Status: COMPLETE — acceptance criteria met (daily leader-elected loop; `ISamlOperationalDiagnosticsService.BuildAsync` for SP `NotAfter`; email to resolved tenant admins when ≤30 days remain; `ISentEmailLedger` idempotency per tenant/cert-day/UTC-day; SAML login paths unchanged).
- Acceptance criteria: Sends an email notification to tenant admins if the cert is within 30 days of expiry.
- Constraints: Use the existing `SamlOperationalDiagnosticsService` to check expiry.
- What not to change: Do not modify SAML login paths.
- Impact: Directly improves Supportability (+8-10 pts) and Adoption Friction (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 6. Implement Tenant-Fairness Queuing in Authority Pipeline — **complete**
- **Why it matters:** Prevents noisy neighbor issues by ensuring one tenant cannot monopolize the worker pool.
- **Expected impact:** Reliability (+10 pts), Scalability (+5 pts).
- **Affected qualities:** Reliability, Scalability.
- **Actionable:** No — delivered (`ArchLucid.Persistence/Orchestration/DapperAuthorityPipelineWorkRepository.cs`, `InMemoryAuthorityPipelineWorkRepository.cs`; unit coverage `ArchLucid.Persistence.Tests/Orchestration/AuthorityPipelineWorkOutboxRecoverabilityTests.cs`. Worker-hosted `AuthorityPipelineWorkProcessor` unchanged aside from dequeue ordering via repository.)
```text
Modify the SQL outbox processor in `ArchLucid.Worker` to round-robin across tenants instead of strict FIFO.
- Status: COMPLETE — acceptance criteria met (eligible rows ranked per-tenant FIFO via `ROW_NUMBER() OVER (PARTITION BY TenantId ORDER BY CreatedUtc, OutboxId)` then globally ordered for fair interleaving before `TOP (@Take)`; in-memory repo matches SQL ordering; pipeline stage execution logic unchanged.)
- Acceptance criteria: The processor fetches work items fairly across active tenants.
- Constraints: Ensure the query remains performant under load.
- What not to change: Do not alter the core execution logic of the pipeline stages.
- Impact: Directly improves Reliability (+8-10 pts) and Scalability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 7. Create Live API Smoke Test Suite — **complete**
- **Why it matters:** Ensures integration surfaces are not vulnerable to regressions masked by mocks.
- **Expected impact:** Testability (+15 pts), Correctness (+5 pts).
- **Affected qualities:** Testability, Correctness.
- **Actionable:** No — delivered (`archlucid-ui/e2e/live-api-smoke.spec.ts`: **`injectDemoWorkspaceOperatorScope`** seeded demo tenant; operator home → **`/reviews/new?baseline=1`** minimal packager **`manifest.json` ZIP via `fflate`**; **`POST /api/proxy/v1/architecture/request`** awaited (no **`page.route`** stubs); **`executeRun`** + authority findings poll; **`quick-decision-summary`** on **`/reviews/{runId}`**; JWT skips unless **`ARCHLUCID_PROXY_BEARER_TOKEN`**. Acceptance wording “without `/api/proxy`” interpreted as **no mocked proxy**, i.e. real Next proxy forwarding to **`LIVE_API_URL`**.)
```text
Create a Playwright suite `archlucid-ui/e2e/live-api-smoke.spec.ts` against real API/SQL (**`LIVE_API_URL`** / default `live-api-*` Playwright config).
- Status: COMPLETE — acceptance criteria met (**operator shell + seeded scope**, baseline-first **ZIP**, **`executeRun`**, **`quick-decision-summary`** findings surface; **`page.route`** not used — real **`/api/proxy`** to upstream).
- Acceptance criteria: Core pilot spine (authenticated operator context, extractor ZIP wizard prefill, view findings summary) **without mocked `/api/proxy`** Playwright stubs.
- Constraints: Reuse **`live-api-client`** and **`injectDemoWorkspaceOperatorScope`**; no production app edits for this backlog item.
- What not to change: No application/backend changes tied to §7 (Playwright artifact only).
- Impact: Directly improves Testability (+10-15 pts) and Correctness (+3-5 pts). Weighted readiness impact: +0.15-0.25%.
```

### 8. Add SQL Backup Region Verification Script — **complete**
- **Why it matters:** Provides verifiable proof that SQL automated backups are stored in the expected geography.
- **Expected impact:** Compliance Readiness (+10 pts), Reliability (+5 pts).
- **Affected qualities:** Compliance Readiness, Reliability.
- **Actionable:** No — delivered (`scripts/ci/assert_sql_backup_regions.py`; unit tests `scripts/ci/tests/test_assert_sql_backup_regions.py`; CD runs the script on the same `terraform show -json` artifact as the data-region guard; CI runs the unit tests in `doc-markdown-links`.)
```text
Create a Python script `scripts/ci/assert_sql_backup_regions.py` to verify Azure SQL backup storage redundancy configurations in Terraform.
- Status: COMPLETE — acceptance criteria met (parses Terraform plan JSON from `terraform show -json`; when `requested_backup_storage_redundancy` is set on planned `azurerm_mssql_database`, it must satisfy default allowlist Geo/Zone; omitted values pass unless `--require-explicit-redundancy`; optional `--allowed` extends policy e.g. for `GeoZone`.)
- Acceptance criteria: The script parses `terraform show -json` and fails if `requested_backup_storage_redundancy` is not `Geo` or `Zone` as expected.
- Constraints: Run this script in the existing CD pipeline.
- What not to change: Do not modify the Terraform resource definitions.
- Impact: Directly improves Compliance Readiness (+8-10 pts) and Reliability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 9. Implement Rate Limiting for Bulk Evidence Upload — **complete**
- **Why it matters:** Prevents abuse of the bulk upload endpoint.
- **Expected impact:** Reliability (+10 pts), Usability (+5 pts).
- **Affected qualities:** Reliability, Usability.
- **Actionable:** No — delivered (`RateLimiting:EvidenceBulkUpload:*` defaults + policy `evidenceBulkUpload` in `InfrastructureExtensions`; `EvidenceBulkUploadController` uses tenant/IP partitions via `RateLimitingRolePartitionBuilder`; 429 surfaced in OpenAPI; integration tests relaxed via `ArchLucidApiFactory`. Files-per-upload cap unchanged at 30.)
```text
Add API rate limiting to the bulk evidence upload endpoint in `ArchLucid.Api`.
- Status: COMPLETE — acceptance criteria met (`Microsoft.AspNetCore.RateLimiting` policy `evidenceBulkUpload`; fixed window keyed by tenant_id claim or IP with same role multipliers as `fixed`; default 20 permits per `WindowMinutes`; `RateLimiter` middleware returns 429 with Problem Details and Retry-After; `EvidenceBulkUploadMaxFiles` unchanged.)
- Acceptance criteria: The endpoint returns 429 Too Many Requests if a tenant exceeds the configured upload rate.
- Constraints: Use `AspNetCore.RateLimiting`.
- What not to change: Do not alter the 30-file ceiling logic.
- Impact: Directly improves Reliability (+8-10 pts) and Usability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 10. Add Export to CSV for Findings — **complete**
- **Why it matters:** Allows operators to perform offline analysis of architecture findings.
- **Expected impact:** Decision Velocity (+10 pts), Usability (+5 pts).
- **Affected qualities:** Decision Velocity, Usability.
- **Actionable:** No — delivered (`RunQueryController` `GET …/run/{runId}/findings/export/csv`; `ArchitectureRunFindingsCsvFormatter` using `ExportFormatterService.EscapeCsvField`; durable audit `FindingsListAccessed` with `{ format: csv, findingCount }`; integration 404 smoke `RunFindingsCsvExportEndpointTests`; formatter unit tests; audit matrix rows in `docs/library/AUDIT_COVERAGE_MATRIX.md` and `dist/procurement-pack/AUDIT_COVERAGE_MATRIX.md`; `FindingsListAccessTelemetry` summary updated). **MERGE FOLLOW-UP (wire contract + clients):** run `ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT=1 dotnet test ArchLucid.Api.Tests --filter OpenApiContractSnapshotTests`, then `dotnet build ArchLucid.Api.Client` (NSwag), then `npm run generate:api-types` under `archlucid-ui` (`docs/library/API_CONTRACTS.md`). Avoid concurrent `dotnet test`/`dotnet build` hitting `ArchLucid.Api.dll` on Windows (file locks).
```text
Add a `GET /v1/architecture/run/{runId}/findings/export/csv` endpoint to export findings as a CSV file.
- Status: COMPLETE — acceptance criteria met (`text/csv` download with flattened finding rows: id, correlating agent result/task, severity, category, message, **status** muted/active, mute reason, optional confidence; durable audit per matrix.)
- Acceptance criteria: The endpoint returns a well-formatted CSV containing finding details, severity, and status.
- Constraints: Ensure the endpoint is covered by the audit matrix.
- What not to change: Do not modify the existing JSON findings endpoints.
- Impact: Directly improves Decision Velocity (+8-10 pts) and Usability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 11. Add Telemetry for Policy Pack Assignments — **complete**
- **Why it matters:** Provides visibility into which policy packs are actively used by tenants.
- **Expected impact:** Stickiness (+10 pts), Observability (+5 pts).
- **Affected qualities:** Stickiness, Observability.
- **Actionable:** No — delivered (`PolicyPackAssignmentRepository`: structured Information logs after `CreateAsync` and successful `ArchiveAsync` in SQL and in-memory implementations; helper methods on `SanitizedLoggerInformationExtensions` with EventIds 3014–3015; fields `PolicyPackId`, `TenantId`, `WorkspaceId`; no new `IAuditService` emission.)
```text
Add application-level logging in `PolicyPackAssignmentRepository` when a policy pack is assigned or unassigned.
- Status: COMPLETE — acceptance criteria met (structured Information logs via `SanitizedLoggerInformationExtensions`: assign after `CreateAsync`, unassign after successful `ArchiveAsync` with SQL `OUTPUT` preserving single-update semantics; includes `PolicyPackId`, `TenantId`, `WorkspaceId`; no new `IAuditService` hooks.)
- Acceptance criteria: A structured log entry is emitted containing the `PolicyPackId`, `TenantId`, and `WorkspaceId`.
- Constraints: Do not emit a durable `IAuditService` event unless required by the audit matrix.
- What not to change: Do not alter the assignment logic.
- Impact: Directly improves Stickiness (+8-10 pts) and Observability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 12. Implement Soft Delete for Architecture Projects — **complete**
- **Why it matters:** Allows accidental deletions to be recovered before permanent data loss.
- **Expected impact:** Reliability (+10 pts), Usability (+5 pts).
- **Affected qualities:** Reliability, Usability.
- **Actionable:** No — delivered (`dbo.Projects.IsDeleted`, `DeletedUtc`; `IArchitectureProjectRepository.TrySoftDeleteAsync` + `ListActiveByTenantAsync` excludes deleted; `ArchitectureProjectRetentionPurgeHostedService` / API `RetentionPurgeWorker` + `SqlArchitectureProjectRetentionPurgeService` hard-delete past `ArchitectureProjectRetention:RetentionDays`, default **30**, excluding rows still referenced as `TenantWorkspaces.DefaultProjectId`; `TenantWorkspacesController` soft-delete + `ArchitectureProjectSoftDeleted` audit; `SqlTenantHardPurgeService` untouched for tenant-level purge.)
```text
**Delivered (V1):** `dbo.Projects` includes `IsDeleted` and `DeletedUtc`; workspace project `DELETE` is a soft-delete; leader-elected retention (`ArchitectureProjectRetentionPurgeHostedService` / `RetentionPurgeWorker`) permanently removes rows past **`ArchitectureProjectRetention:RetentionDays`** (default **30**).
- Status: COMPLETE — acceptance criteria met (persistent columns on `dbo.Projects`; API delete performs soft-delete; leader-elected retention job hard-deletes expired soft-deleted rows; list reads filter `IsDeleted = 0`.)
- Acceptance criteria: Deleting a project sets the flag instead of hard-deleting the row. A background job hard-deletes projects after 30 days.
- Constraints: Update all read queries to filter out soft-deleted projects.
- What not to change: Do not modify the tenant deletion service.
- Impact: Directly improves Reliability (+8-10 pts) and Usability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 13. Add Health Check Endpoint for Redis — **complete**
- **Why it matters:** Verifies connectivity to the optional Redis cache.
- **Expected impact:** Supportability (+10 pts), Performance (+5 pts).
- **Affected qualities:** Supportability, Performance.
- **Actionable:** No — delivered (`RedisHealthProbeConnectionResolver` + optional `OptionalRedisConnectionHealthCheck`; registered in `RegisterArchLucidHealthChecks` when a Redis string is resolved; `/health` predicate includes `redis` alongside `database`.)
```text
**Delivered (V1):** `RegisterArchLucidHealthChecks` adds `redis` (failure `Degraded`) when `RedisHealthProbeConnectionResolver` finds a non-empty string (projection → LLM completion cache → hot-path). `/health` exposes `database` + `redis` summaries when the check is registered.
- Status: COMPLETE — acceptance criteria met (optional probe; does not mark the app Unhealthy when Redis is down; uses `Microsoft.Extensions.Diagnostics.HealthChecks`).
- Acceptance criteria: The `/health` endpoint includes Redis status if Redis is configured.
- Constraints: Use `Microsoft.Extensions.Diagnostics.HealthChecks`.
- What not to change: Do not make the health check fail the entire app if Redis is optional.
- Impact: Directly improves Supportability (+8-10 pts) and Performance (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 14. Add Prometheus Alert for Integration Event Outbox Dead Letters — **complete**
- **Why it matters:** When an integration event exhausts all publish retries it is moved to the dead-letter slot (`archlucid_integration_event_outbox_dead_letter` gauge, emitted by `OutboxOperationalMetricsHostedService`). Self-hosted Prometheus already had `ArchLucidIntegrationEventOutboxDeadLetter` in `infra/prometheus/archlucid-alerts.yml`; aligning Azure Monitor managed rules closes the TF-managed alerting gap when `enable_prometheus_slo_rule_group` is on.
- **Expected impact:** Reliability (+12 pts), Observability (+8 pts).
- **Affected qualities:** Reliability, Observability.
- **Actionable:** No — delivered (`ArchLucidIntegrationOutboxDeadLetterNonZeroTf` in `infra/terraform-monitoring/prometheus_slo_rules.tf`; severity **2**, `for = PT5M`, ops action group; `scripts/ci/tests/test_prometheus_slo_dead_letter_alert_rule_tf.py`; CI wired in **`doc-markdown-links`**. Existing three `rule` blocks unchanged.)
```text
**Delivered (V1 IaC):** Fourth `rule` in `azurerm_monitor_alert_prometheus_rule_group.archlucid_slo` — Azure Monitor Prometheus mirror for integration outbox dead-letter gauge (self-hosted parity: `infra/prometheus/archlucid-alerts.yml` `ArchLucidIntegrationEventOutboxDeadLetter`).
- Status: COMPLETE — acceptance criteria met (rule in `prometheus_slo_rules.tf`; static unit test asserts alert name, expression, `PT5M`, annotation summary + runbook pointer; run `terraform validate` in `infra/terraform-monitoring` after `terraform init -backend=false` for local/provider verification.)
- Rule name: `ArchLucidIntegrationOutboxDeadLetterNonZeroTf`
- Expression: `archlucid_integration_event_outbox_dead_letter > 0`
- Severity: 2, `for = "PT5M"`, action group: `azurerm_monitor_action_group.ops[0].id`.
- Annotation summary: "Integration event outbox dead-letter queue is non-zero. See docs/runbooks/AUTHORITY_PIPELINE_OBSERVABILITY.md."
- Acceptance criteria: (a) Rule appears in `terraform plan` output. (b) Unit test asserts the rule is present in a Terraform JSON plan or the rule group locals list. (c) `terraform validate` passes.
- Constraints: Stay inside the existing `count = local.prometheus_slo_rule_group_enabled ? 1 : 0` guard. Do not add a new resource.
- What not to change: Do not alter the three existing SLO alert rules.
- Impact: Directly improves Reliability (+10-12 pts) and Observability (+6-8 pts). Weighted readiness impact: +0.15-0.25%.
```

### 15. Add Prometheus Alert for LLM Tenant Budget Approaching Warn Fraction — **complete**
- **Why it mattered:** `LlmMonthlyTenantDollarBudgetOptions` warns at `WarnFraction` (default **0.75**), yet operators lacked a Prometheus alert tied to utilization before tenants hit hard cutoffs—the gap this item closed.
- **Expected impact:** AI/Agent Readiness (+8 pts), Observability (+6 pts).
- **Affected qualities:** AI/Agent Readiness, Observability.
- **Actionable:** No — delivered (`ArchLucidLlmBudgetWarnFractionBreachedTf` in `prometheus_slo_rules.tf`; `archlucid_llm_budget_utilization_fraction` observable gauge plus `LlmTenantBudgetUtilizationMetricsHostedService` on a 5‑minute cadence; severity **3**, `for = PT5M`, ops action group; `scripts/ci/tests/test_prometheus_slo_llm_budget_warn_alert_rule_tf.py`; CI step next to the existing Prometheus SLO TF unit test.)
```text
**Delivered (V1 IaC + product telemetry):**
(1) `EnsureLlmTenantBudgetUtilizationObservableGaugeRegistered` publishes `archlucid_llm_budget_utilization_fraction` (`tenant_id`) from snapshots refreshed only by `LlmTenantBudgetUtilizationMetricsHostedService` (bounded SQL / repository reads: at most once per tenant per 5 minutes; Prometheus scrape reads cached values — failures retain last-known series).
(2) Fifth `rule` in `azurerm_monitor_alert_prometheus_rule_group.archlucid_slo` — `ArchLucidLlmBudgetWarnFractionBreachedTf`, expression `max by (tenant_id) (archlucid_llm_budget_utilization_fraction) > 0.75`.
- Utilization aligns with enforcement: `TotalUsdPressure / (HardCutoffUsdPerUtcMonth + PurchasedCapBumpUsd)` via `LlmBudgetTelemetry` (reserve/settle path unchanged).
- Status: COMPLETE — `terraform validate` for `infra/terraform-monitoring`; static unit test asserts rule name, expression, severity **3**, `PT5M`, annotation summary, ops action group; manual `/metrics` shows the gauge whenever monthly dollar budget is enabled and tenants exist.
- Original constraints / impact text retained for scoring reference: Acceptance (a)-(b); do not alter budget reserve/settle logic; weighted readiness impact +0.1-0.2%.
```

### 16. Add `runbook_url` Annotations to All Existing Prometheus SLO Alert Rules — **complete**
- **Why it mattered:** The three **original** Azure Monitor mirror rules in `prometheus_slo_rules.tf` (`ArchLucidSloHttpP99HighTf`, `ArchLucidSloHttp5xxRatioElevatedTf`, `ArchLucidSloOutboxDepthCriticalTf`) had only `summary`. On-call tooling surfaces `runbook_url`; this gap is closed without changing §14+/§15+ rules.
- **Expected impact:** Observability (+8 pts), Reliability (+4 pts).
- **Affected qualities:** Observability, Reliability.
- **Actionable:** No — delivered (`local.archlucid_authority_observability_runbook_url` in `prometheus_slo_rules.tf`; `runbook_url` on the three legacy SLO `rule` blocks only; expressions / severity / `for` unchanged.)
```text
**Delivered (V1 IaC):** Each of the three original mirror rules carries `annotations.runbook_url` → GitHub-rendered path for `docs/runbooks/AUTHORITY_PIPELINE_OBSERVABILITY.md`.
- Alerts: `ArchLucidSloHttpP99HighTf`, `ArchLucidSloHttp5xxRatioElevatedTf`, `ArchLucidSloOutboxDepthCriticalTf` (dead-letter §14 and LLM budget §15 rules unchanged aside from unrelated prior work).
- Status: **COMPLETE** — `terraform validate` for `infra/terraform-monitoring` after `terraform init -backend=false` (or reuse prior init).
- Original acceptance: all three annotations maps include `runbook_url`; no new runbook file; expressions, severity, and `for` duration untouched.
```

### 17. Export LLM Tenant Budget **Remaining (USD)** as a Prometheus Observable Gauge — **complete**
- **Why it mattered:** Grafana `dashboard-archlucid-llm-usage` lacked a **budget headroom** series; utilization fraction §15 stops short of a direct **USD remaining** cue for ops.
- **Expected impact:** Observability (+10 pts), AI/Agent Readiness (+5 pts).
- **Affected qualities:** Observability, AI/Agent Readiness.
- **Actionable:** No — delivered (`EnsureLlmTenantBudgetRemainingUsdObservableGaugeRegistered`; `archlucid_llm_budget_remaining_usd`; `LlmTenantBudgetRemainingGaugeState`; same `LlmTenantBudgetUtilizationMetricsHostedService` loop with tenant-id cache TTL **60 s**, **5 min** `GetOrCreateAsync` snapshots; panel **LLM Budget Remaining (USD) by Tenant** in `infra/grafana/dashboard-archlucid-llm-usage.json`; **`LlmBudgetTelemetry.MonthlyHardCapRemainingUsd`** + assertions in **`LlmBudgetTelemetryTests`** that remaining is ≥ **0**.)
```text
**Delivered:**
- Gauge `archlucid_llm_budget_remaining_usd` (`tenant_id`); headroom `max(0, effectiveCap - TotalUsdPressure)` matching tracker cap math (`LlmBudgetTelemetry`).
- `LlmTenantBudgetUtilizationMetricsHostedService`: tenant GUID list refreshed at most every 60 seconds; repo reads bounded to the configured five-minute collector interval when enabled.
- Grafana: panel id **3**, title **LLM Budget Remaining (USD) by Tenant**.
- Tests: **`MonthlyHardCapRemainingUsd`** non-negative / cap-edge cases (**`ArchLucid.Core.Tests/Budgeting/LlmBudgetTelemetryTests.cs`**).
- Status: **COMPLETE** — acceptance (a)-(c); reserve/settle path unchanged.
```

### 18. Raise Merged-Line Coverage Floor in CI from 0 to 75 — **complete**
- **Why it mattered:** Merged overall line % in full-regression was **`0`** minimum (advisory-only), so solution-wide line coverage could regress silently until the V1.1 **95%** ratchet.
- **Expected impact:** Testability (+12 pts), Correctness (+5 pts).
- **Affected qualities:** Testability, Correctness.
- **Actionable:** No — delivered (`.github/workflows/ci.yml` `dotnet-coverage-merge`: **`assert_merged_line_coverage_min.py`** positional **`75`** with updated inline comment; **63%** merged branch + **63%** per-package line unchanged; **`assert_merged_line_coverage_min.py`** module banner aligned.)
```text
**Delivered:**
- CI: `"${OUT}/Cobertura.xml" 75` + comment **Merged line minimum is 75; full ratchet (.coverage-floor) is V1.1.**
- No other workflow steps altered; **`--min-branch-pct 63`** and **`--min-package-line-pct 63`** unchanged.
- Acceptance: (a)-(c) as specified (**main** merge-line vs **75** validated in CI on next successful full-regression artifact).
- Status: **COMPLETE** — **`docs/library/coverage-exclusions.md`**, **`docs/engineering/BUILD.md`**, **`docs/library/COVERAGE_GAP_ANALYSIS.md`**, **`docs/library/V1_DEFERRED.md`**, and **`scripts/ci/coverage_gap_analysis.py`** narration synced so operators are not pointed at **`0`**.
```

### 19. Add Azure Cost Management Actual-Spend Ingestion to the Extractor — **complete**
- **Why it matters:** `scripts/azure/ArchLucid.RetailPrices.helpers.ps1` estimates unit costs from retail price lists, but the extractor (`Get-ArchLucidAzurePackage.ps1`) never called the Azure Cost Management API for actual subscription spend, so reviewers lacked a credible **estimated vs actual** signal.
- **Expected impact:** Decision Velocity (+12 pts), Time-to-Value (+6 pts).
- **Affected qualities:** Decision Velocity, Time-to-Value.
- **Actionable:** No — delivered (**`scripts/azure/ArchLucid.CostManagement.helpers.ps1`**: **`Get-ArchLucidActualCostSummary`** (**ActualCost** / subscription scope via **`az rest`** to **`Microsoft.CostManagement/query`**, paging **`nextLink`**; **RetailPrices unchanged**); **`-IncludeCost`** merges **`actualCostSummary`** into **`manifest.json`** in **`scripts/azure/Get-ArchLucidAzurePackage.ps1`** (scriptVersion **0.3.2**); failures / missing RBAC / missing **`az`** → **`null`** + warning; Pester: **`scripts/azure/tests/ArchLucid.CostManagement.helpers.Tests.ps1`** + fixture **`scripts/azure/tests/fixtures/ArchLucid.actual-cost.sample.json`**.)
```text
**Delivered:**
- Helper: subscription POST to `/subscriptions/{id}/providers/Microsoft.CostManagement/query?api-version=2023-03-01` with body **type ActualCost** (equivalent to the removed **`az costmanagement query --type ActualCost`** path; **`az rest`** used because **`costmanagement` extension dropped `query`** in extension v0.2.1+).
- **`manifest.json`**: **`actualCostSummary`** only when **`-IncludeCost`** (**`BreakdownByServiceName`**, **`TotalActualCostUsd`**, **`CurrencyCode`**, **`BillingPeriod`**); omitted when flag unset.
- Acceptance: **(b)** permissive degrade — **`null`** + **`Write-Warning`**; **(c)** **`Invoke-Pester`** on converters/merge (**no live Azure dependency**).
- Tests: **`scripts/azure/tests/ArchLucid.CostManagement.helpers.Tests.ps1`** (**`fixtures/ArchLucid.actual-cost.sample.json`**).
```

### 20. Add Trial Expiry Countdown Banner to the UI — **complete**
- **Why it matters:** `TrialLifecycleEmailScanHostedService` sends email notifications on trial lifecycle events, but there is no in-app UI component that shows "N days remaining in your trial." Without a visible countdown, users approaching the trial end have no in-session nudge to convert. This is a direct conversion-funnel gap.
- **Expected impact:** Stickiness (+10 pts), Time-to-Value (+6 pts).
- **Affected qualities:** Stickiness, Time-to-Value.
- **Actionable:** No — delivered (`TrialExpiryBanner` in `archlucid-ui/src/components/TrialExpiryBanner.tsx`; mounted in `AppShellClient` for **all** operator routes (full + minimal chrome); reads existing `GET /v1/tenant/trial-status`; shows when `status === Active` and `daysRemaining` is **0–7**; **sessionStorage** dismiss; **Talk to us** → `/pricing#pricing-quote-request`. Home `TrialBanner` skips when `daysRemaining <= 7` to avoid duplicate CTAs. Vitest: `TrialExpiryBanner.test.tsx`.)
```text
Add a `TrialExpiryBanner` React component in `archlucid-ui/src/components/` that:
1. Reads trial expiry state from a new API endpoint `GET /v1/trial/status` (or an existing tenant-profile endpoint if one already surfaces `TrialEndsUtc`).
2. Renders a dismissible info banner when the trial has 7 or fewer days remaining, showing the exact number of days and a "Talk to us" CTA linking to the configured contact/sales URL.
3. Is mounted in the root layout so it appears on every authenticated page.
- Status: **COMPLETE** — uses `GET /v1/tenant/trial-status`; all operator shell pages; session dismiss (`sessionStorage`). (a) Storybook / Playwright deferred; Vitest covers render, dismiss, day window.
- Acceptance criteria: (a) Banner appears in Storybook and a Playwright smoke test confirms it renders when `daysRemaining <= 7`. (b) Banner does not render when the tenant is not on a trial. (c) Banner is dismissible per session (localStorage flag).
- Constraints: Read `TrialEndsUtc` from the existing profile/context store; do not introduce a new polling call unless the value is absent from the existing context.
- What not to change: Do not modify `TrialLifecycleEmailScanHostedService` or any backend trial lifecycle logic.
- Impact: Directly improves Stickiness (+8-10 pts) and Time-to-Value (+4-6 pts). Weighted readiness impact: +0.1-0.2%.
```

### 21. Add OpenAPI Snapshot Staleness Check to CI — **complete**
- **Why it matters:** `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json` is the canonical API contract; merge-blocking enforcement keeps it aligned with the live OpenAPI document so route changes cannot ship without updating the snapshot (and thus generated clients/docs workflows tied to it).
- **Expected impact:** Correctness (+10 pts), Testability (+6 pts).
- **Affected qualities:** Correctness, Testability.
- **Actionable:** No — delivered (Tier **0.x** job `openapi-contract-snapshot` in `.github/workflows/ci.yml` runs `bash scripts/ci/check_openapi_contract_snapshot.sh`, which builds `ArchLucid.Api.Tests` and runs `OpenApiContractSnapshotTests`; stale snapshot fails CI; local regen documented on `OpenApiContractSnapshotTests` and in the script header via `ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT=1`.)
```text
Add merge-blocking OpenAPI snapshot drift detection to CI.
- Status: COMPLETE — acceptance criteria met (dedicated fail-fast job parallel with early-tier gates; intentional API changes require regenerating `openapi-v1.contract.snapshot.json` and committing it in the same PR).
- Acceptance criteria: (a) A PR that changes routes without updating the committed snapshot fails CI. (b) A PR with an up-to-date snapshot passes.
- Constraints: Regeneration is local/developer-only (`ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT=1`); CI compares via existing `OpenApiContractSnapshotTests` (no auto-commit on the runner).
- What not to change: Do not weaken the test’s contract without replacing it with an equivalent drift gate.
- Impact: Directly improves Correctness (+8-10 pts) and Testability (+4-6 pts). Weighted readiness impact: +0.1-0.2%.
```

### 22. Automated tenant erasure (30-day quarantine, legal hold, blob + SQL purge)
- **Why it matters:** Buyers expect a defensible right-to-erasure story: cooling-off period, legal/regulatory hold, deterministic purge of tenant SQL + tenant-prefixed blobs, and immutable operator audit. Today **`TenantDeletionService`** (`ArchLucid.Application/Tenancy/TenantDeletionService.cs`) performs immediate orchestration (blobs via **`TenantBlobPrefixDeletionService`**, SQL via **`SqlTenantHardPurgeService`**) without a first-class quarantine or hold gate.
- **Expected impact:** Security (+12 pts), Reliability (+6 pts), Compliance narrative (+variable).
- **Affected qualities:** Security, Reliability, Supportability.
- **Actionable:** Yes — **V2 delivery**; assumptions below lock schema and RBAC so implementation is unblocked.
```text
Implement automated tenant erasure with quarantine and legal hold, reusing existing purge orchestration.

**Schema (`dbo.Tenants`, single DDL migration file per DB policy — extend unified schema + DbUp migration):**
- `OffboardedUtc DATETIMEOFFSET NULL` — non-null means tenant is in offboarding quarantine.
- `ErasureEligibleUtc DATETIMEOFFSET NULL` — earliest UTC when hard purge may run (set at offboard to `OffboardedUtc + retention`, default **30 days**, configurable to match `ArchitectureProjectRetention:RetentionDays` semantics unless product dictates a separate option).
- `LegalHoldUntilUtc DATETIMEOFFSET NULL` — while non-null and `UtcNow < LegalHoldUntilUtc`, hard purge must not run regardless of `ErasureEligibleUtc`.
- `LegalHoldReason NVARCHAR(500) NULL`
- `LegalHoldSetByUserId NVARCHAR(256) NULL`
- `LegalHoldSetUtc DATETIMEOFFSET NULL`

**Eligibility rule:** Invoke hard purge only when `OffboardedUtc IS NOT NULL` AND `UtcNow >= ErasureEligibleUtc` AND (`LegalHoldUntilUtc IS NULL` OR `UtcNow >= LegalHoldUntilUtc`).

**Orchestration:**
1. Offboard API (platform-only): sets `OffboardedUtc` / `ErasureEligibleUtc`; tenant access Denied as today for suspended/offboarded semantics (align with existing `SuspendedUtc` behavior — document chosen UX).
2. Background scanner (leader-elected hosted job, mirror `ArchitectureProjectRetentionPurgeHostedService` patterns): for each eligible tenant, call existing **`ITenantDeletionService.DeleteTenantAsync`** — preserve today's order (**tenant-prefixed blobs first**, then **`SqlTenantHardPurgeService`**) unless an ADR documents reordering; keep **`TenantDeletionService`** as the single purge seam.
3. **Restore during quarantine:** `PlatformOperator` may null `OffboardedUtc` / `ErasureEligibleUtc` before purge runs; document as break-glass only.

**RBAC (JWT `roles` / `ArchLucidRoles`):**
- Start offboarding quarantine: **`PlatformOperator`** only (`PlatformTenantDeletionAuthority` / `platform:tenant-delete`).
- Set or extend legal hold: **`PlatformOperator`** or **`Admin`**.
- Clear legal hold (`LegalHoldUntilUtc` → NULL): **`PlatformOperator`** only (tenant **`Admin`** must not clear holds).

**Audit:** Emit **`PlatformAuditRepository`** events (or equivalent) for offboard, hold set/extend/clear, restore-from-quarantine, and completed purge — include prior/new column values in `DataJson`.

**Tests:** Integration tests for eligibility (hold blocks past `ErasureEligibleUtc`), purge invocation once eligible, and RBAC on mutation endpoints.

**Follow-ups (explicit non-blockers for first slice):** Redis tenant keys, search indexes, Stripe customer archival — enumerate in runbook if not purged in SQL/blob path.

**Assumption:** Default quarantine **30 days** matches architecture-project retention narrative unless superseded by configuration.

- Acceptance criteria: (a) Migration adds columns; no purge until eligibility rule passes. (b) Legal hold blocks purge past eligible date until hold expires or PlatformOperator clears it. (c) Completed purge still produces **`TenantDataDeleted`**-style platform audit with SQL row counts + blobs-by-container summary. (d) RBAC matches table above.
- Constraints: Do not bypass **`ITenantDeletionService`** for final purge; extend **`TenantBlobPrefixDeletionService`** container list only if new tenant-isolated containers exist (today: `golden-manifests`, `artifact-bundles`, `agent-traces`).
- What not to change: Leave content-addressed shared dedup containers untouched (existing deletion service already skips them).
- Impact: Security (+10-14 pts), Reliability (+4-8 pts). Weighted readiness impact: material on buyer diligence once shipped (V2).
```

### 23. DEFERRED: Commerce un-hold (Stripe live keys flipped + Marketplace listing published)
- **Reason:** Deferred to V1.1. Requires user input to provide the live Stripe keys and confirm Marketplace publication.
- **Needed from me:** Please provide the `sk_live_` Stripe keys and confirm the Marketplace offer is `Published`.

---

## Prompt Batching Guidance

To optimize context window usage and cost-effectiveness, batch the actionable prompts as follows:

- **Batch 1 (Observability & Monitoring):** 13 (**§1 complete:** `infra/grafana/dashboard-archlucid-llm.json` — GenAI latency + embedding/chat token throughput. **§17 complete:** `archlucid_llm_budget_remaining_usd` + Grafana **LLM Budget Remaining (USD) by Tenant** on `dashboard-archlucid-llm-usage`.)
- **Batch 2 (Alerting & SLO):** **complete** — §14 (integration outbox dead-letter TF rule) + §15 (LLM budget utilization gauge + warn-fraction TF rule) + §16 (`runbook_url` on legacy HTTP / outbox Prometheus SLO mirror rules); no numbered backlog items left in this batch.
- **Batch 3 (Cost & Policy Packs):** 2, 3, 4, 19
- **Batch 4 (Reliability & Scalability):** 6, 9
- **Batch 5 (Security & Compliance):** 5, 8, 22
- **Batch 6 (Testing & CI):** 18 (**§7 complete:** `archlucid-ui/e2e/live-api-smoke.spec.ts` — seeded scope, baseline ZIP wizard, **`executeRun`**, **`quick-decision-summary`**, no **`page.route`** mocks.)
- **Batch 7 (UX & Conversion):** **complete** — §10 (findings CSV export) + §20 (`TrialExpiryBanner`, all operator pages, `daysRemaining` 0–7, session dismiss).

---

## Pending Questions for Later

### DEFERRED (23): Commerce un-hold (Stripe live keys flipped + Marketplace listing published)
- What are the `sk_live_` Stripe keys and is the Marketplace offer `Published`?
