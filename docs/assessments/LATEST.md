> **Scope:** Independent, first-principles assessment of ArchLucid readiness.
> **Status:** current

# ArchLucid Assessment – (A) Headline Readiness: 84.94%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding explicitly deferred items (e.g., automated tenant erasure, SOC 2 CPA attestation, third-party pen testing, MCP, live commerce un-hold, and V1.1-scoped integration suites).

## Executive Summary

### (A) Overall Headline Readiness (84.94%)
ArchLucid is a functionally complete V1 product with a highly rigorous architectural foundation (84.94% readiness). It successfully executes the core pilot loop and provides strong governance and traceability features. Recent completions—such as internal cross-tenant analytics, form-based custom policy authoring, LLM telemetry, the internal Policy Pack Hub (catalog + clone), operational script hardening, merge-blocking OpenAPI v1 snapshot drift checks in CI, Azure Retail Prices coverage for VMs and Storage Accounts in the extractor package, tenant-fair dequeue for the deferred authority pipeline SQL outbox, Terraform plan validation of declared Azure SQL backup redundancy (Geo/Zone) in CD, SAML SP certificate nearing-expiry email notifications, and a dedicated configurable rate limit (`evidenceBulkUpload`) on multipart bulk evidence upload—significantly strengthen the GA offering. The primary remaining gaps are in observability operationalization for shipped GenAI signals (dashboards, SLO linkage, alerting), Azure Cost Management actuals / Advisor parity versus retail estimates, and default `ui-e2e-smoke` mock-heavy coverage.

### (B) Procurement/Market-Motion Realism
Enterprise procurement will face friction due to the lack of a CPA-issued SOC 2 Type II report and third-party penetration testing (both intentionally deferred). The reliance on a SOC 2 self-assessment and owner-conducted penetration testing is acceptable for early pilots but will require executive sponsorship to bypass standard vendor security gates. The full automated tenant erasure quarantine pipeline is a V2 engineering commitment and is not scored as an `(A)` defect. V1 relies on operator-driven and trial/offboarding deletion paths.

### Commercial Picture
The commercial posture is strongly aligned for a sales-led, service-led motion. The inclusion of consultant whitelabeling on architecture review exports enables boutique consulting firms to use ArchLucid as a delivery engine. Curated demo workspaces, default policy packs, and the ZIP-first baseline wizard accelerate Time-to-Value and Proof-of-ROI. The deferred live commerce correctly prioritizes validated purchasing motions over premature self-serve availability.

### Enterprise Picture
ArchLucid provides strong enterprise integration points, including Jira, ServiceNow, Slack, and Confluence. Tenant isolation is robustly handled via database-per-tenant and RLS. Tenant custom governance packs support form-based authoring for curated-rules-shaped documents. SAML SP nearing-expiry email notifications for tenant admins, tenant-fair authority pipeline outbox dequeue in the worker, CD-time Terraform checks for declared Azure SQL backup redundancy, configurable per-tenant rate limits on bulk architecture evidence multipart uploads, and data residency verification in Terraform CI further enhance enterprise readiness.

### Engineering Picture
The engineering foundation is highly rigorous, with strong architectural invariants, NetArchTest boundary rules, and a durable audit trail. The agent orchestration pipeline is resilient, and producer-side OpenTelemetry GenAI instrumentation records token aggregates, latency, and deployment identifiers. Curating operator dashboards and alerts on those signals remains a gap. The heavy reliance on mocked `/api/proxy` in `ui-e2e-smoke` remains a testability risk.

---

## Weighted Quality Assessment

### 1. AI/Agent Readiness
- **Score:** 85
- **Weight:** 8
- **Weighted impact on readiness:** 120
- **Why this score was assigned:** The system effectively uses Azure OpenAI with prompt redaction, execution traces, and a well-tested authority pipeline. OpenTelemetry tracing for LLM API calls exists.
- **Key tradeoffs:** Cost attribution still depends on exporters and retention.
- **Specific improvement recommendations:** Operationalize dashboards and alerting on shipped GenAI telemetry.
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
- **Specific improvement recommendations:** Implement rate limiting for bulk evidence upload.
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
- **Specific improvement recommendations:** Implement tenant-fairness queuing in the Authority Pipeline.
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
- **Specific improvement recommendations:** Add telemetry for policy pack assignments.
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
- **Key tradeoffs:** Default `ui-e2e-smoke` remains mock-heavy.
- **Specific improvement recommendations:** Create a live API smoke test suite.
- **Fixability:** Fixable in V1.

---

## Top 12 Most Important Weaknesses

1. **LLM observability consumption gaps:** Producer GenAI spans and meters ship, but operators still need curated dashboards, SLOs, and alerting on those signals.
2. **E2E test mock reliance:** `ui-e2e-smoke` relies heavily on mocked `/api/proxy`, leaving integration surfaces vulnerable to regressions.
3. **Manual Azure cost estimations for VMs and Storage:** App Service and SQL are covered, but other SKUs remain manual.
4. **Missing Internal Policy Pack Hub:** Tenants need discoverable, trustworthy starter packs without emailing JSON.
5. **Background job transient fault handling:** Incomplete retry policies for SQL connections in background workers risk silent failures.
6. **Data residency diligence depth:** Buyers require verifiable proof that SQL topology and backups match their geography.
7. **SAML SP operational burden:** Managing certificate rotation and metadata drift for SAML SP adds operational overhead.
8. **Thin starter packs:** AI governance and security baseline packs exist, but risk "one-and-done" pilots without a cost optimization pack.
9. **Noisy neighbor posture in orchestration:** Buyers will diligence steady-state parallelism and multi-region fairness.
10. **Rate limiting missing for bulk evidence upload:** The 30-file ceiling avoids abuse, but API rate limiting is needed.
11. **Lack of soft delete for architecture projects:** Accidental deletion of projects cannot be easily recovered.
12. **Missing telemetry for policy pack assignments:** Lack of visibility into which policy packs are assigned to which workspaces.

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
5. **Automated tenant erasure:** Not a V1 headline blocker, but buyers may still request a productized erasure narrative (deferred to V2).
6. **Lack of soft delete for architecture projects:** Accidental deletion of projects cannot be easily recovered, causing data loss concerns for enterprise IT.

---

## Top 6 Engineering Risks

1. **LLM observability consumption gaps:** Operators still need curated dashboards, SLOs, and alerting on GenAI signals for day-2 operations.
2. **E2E test mock reliance:** Heavy reliance on mocks in `ui-e2e-smoke` risks missing integration regressions.
3. **Background job transient fault handling:** Incomplete retry policies for SQL connections in background workers risk silent failures.
4. **Rate limiting missing for bulk evidence upload:** Without rate limiting, the bulk upload endpoint could be abused.
5. **Lack of soft delete for architecture projects:** Accidental deletion of projects could lead to data loss.
6. **Missing health check endpoint for Redis:** If Redis is configured, a health check endpoint is needed to verify connectivity.

---

## Most Important Truth

ArchLucid is a functionally complete, highly rigorous V1 product ready for sales-led pilots, but its ability to scale commercially is bottlenecked by observability consumption gaps, residual manual ROI proof breadth, and enterprise friction.

---

## Top Improvement Opportunities

### 1. Implement LLM Observability Grafana Dashboard
- **Why it matters:** Provides operators with visibility into LLM token usage, latency, and costs.
- **Expected impact:** Observability (+15 pts), AI/Agent Readiness (+5 pts).
- **Affected qualities:** Observability, AI/Agent Readiness.
- **Actionable:** Yes
```text
Create a new Grafana dashboard JSON file in `infra/grafana/dashboard-archlucid-llm.json` to visualize LLM telemetry.
- Acceptance criteria: The dashboard includes panels for `archlucid_llm_gen_ai_operation_duration_ms` (latency) and token counters (`archlucid_llm_embedding_input_tokens_total`, etc.).
- Constraints: Use standard Prometheus PromQL syntax.
- What not to change: Do not modify the application metric emission logic.
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

### 7. Create Live API Smoke Test Suite
- **Why it matters:** Ensures integration surfaces are not vulnerable to regressions masked by mocks.
- **Expected impact:** Testability (+15 pts), Correctness (+5 pts).
- **Affected qualities:** Testability, Correctness.
- **Actionable:** Yes
```text
Create a new Playwright test suite `archlucid-ui/e2e/live-api-smoke.spec.ts` that runs against a real staging environment.
- Acceptance criteria: The suite covers the core pilot loop (login, upload ZIP, view findings) without using `/api/proxy`.
- Constraints: Use existing authentication helpers and seeded test data.
- What not to change: Do not modify the application code.
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

### 10. Add Export to CSV for Findings
- **Why it matters:** Allows operators to perform offline analysis of architecture findings.
- **Expected impact:** Decision Velocity (+10 pts), Usability (+5 pts).
- **Affected qualities:** Decision Velocity, Usability.
- **Actionable:** Yes
```text
Add a `GET /v1/architecture/run/{runId}/findings/export/csv` endpoint to export findings as a CSV file.
- Acceptance criteria: The endpoint returns a well-formatted CSV containing finding details, severity, and status.
- Constraints: Ensure the endpoint is covered by the audit matrix.
- What not to change: Do not modify the existing JSON findings endpoints.
- Impact: Directly improves Decision Velocity (+8-10 pts) and Usability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 11. Add Telemetry for Policy Pack Assignments
- **Why it matters:** Provides visibility into which policy packs are actively used by tenants.
- **Expected impact:** Stickiness (+10 pts), Observability (+5 pts).
- **Affected qualities:** Stickiness, Observability.
- **Actionable:** Yes
```text
Add application-level logging in `PolicyPackAssignmentRepository` when a policy pack is assigned or unassigned.
- Status: COMPLETE — acceptance criteria met (structured Information logs via `SanitizedLoggerInformationExtensions`: assign after `CreateAsync`, unassign after successful `ArchiveAsync` with SQL `OUTPUT` preserving single-update semantics; includes `PolicyPackId`, `TenantId`, `WorkspaceId`; no new `IAuditService` hooks.)
- Acceptance criteria: A structured log entry is emitted containing the `PolicyPackId`, `TenantId`, and `WorkspaceId`.
- Constraints: Do not emit a durable `IAuditService` event unless required by the audit matrix.
- What not to change: Do not alter the assignment logic.
- Impact: Directly improves Stickiness (+8-10 pts) and Observability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 12. Implement Soft Delete for Architecture Projects
- **Why it matters:** Allows accidental deletions to be recovered before permanent data loss.
- **Expected impact:** Reliability (+10 pts), Usability (+5 pts).
- **Affected qualities:** Reliability, Usability.
- **Actionable:** Yes
```text
Modify the `ArchitectureProject` entity to include an `IsDeleted` flag and `DeletedUtc` timestamp.
- Acceptance criteria: Deleting a project sets the flag instead of hard-deleting the row. A background job hard-deletes projects after 30 days.
- Constraints: Update all read queries to filter out soft-deleted projects.
- What not to change: Do not modify the tenant deletion service.
- Impact: Directly improves Reliability (+8-10 pts) and Usability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 13. Add Health Check Endpoint for Redis
- **Why it matters:** Verifies connectivity to the optional Redis cache.
- **Expected impact:** Supportability (+10 pts), Performance (+5 pts).
- **Affected qualities:** Supportability, Performance.
- **Actionable:** Yes
```text
Add a Redis health check to the ASP.NET Core Health Checks pipeline in `ArchLucid.Api`.
- Acceptance criteria: The `/health` endpoint includes Redis status if Redis is configured.
- Constraints: Use `Microsoft.Extensions.Diagnostics.HealthChecks`.
- What not to change: Do not make the health check fail the entire app if Redis is optional.
- Impact: Directly improves Supportability (+8-10 pts) and Performance (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 14. Add Prometheus Alert for Integration Event Outbox Dead Letters
- **Why it matters:** When an integration event exhausts all publish retries it is moved to the dead-letter slot (`archlucid_integration_event_outbox_dead_letter` gauge, emitted by `OutboxOperationalMetricsHostedService`). The dead-letter transition is logged at Error level but no Prometheus alert rule fires, so operators are only alerted if they manually inspect dashboards. A missed dead-letter means an integration event (Jira ticket, Slack notification, etc.) silently never delivered.
- **Expected impact:** Reliability (+12 pts), Observability (+8 pts).
- **Affected qualities:** Reliability, Observability.
- **Actionable:** Yes
```text
Add a new Prometheus alert rule to `infra/terraform-monitoring/prometheus_slo_rules.tf` inside the existing `azurerm_monitor_alert_prometheus_rule_group.archlucid_slo` resource.
- Rule name: `ArchLucidIntegrationOutboxDeadLetterNonZeroTf`
- Expression: `archlucid_integration_event_outbox_dead_letter > 0`
- Severity: 2, `for = "PT5M"`, action group: `azurerm_monitor_action_group.ops[0].id`.
- Annotation summary: "Integration event outbox dead-letter queue is non-zero. See docs/runbooks/AUTHORITY_PIPELINE_OBSERVABILITY.md."
- Acceptance criteria: (a) Rule appears in `terraform plan` output. (b) Unit test asserts the rule is present in a Terraform JSON plan or the rule group locals list. (c) `terraform validate` passes.
- Constraints: Stay inside the existing `count = local.prometheus_slo_rule_group_enabled ? 1 : 0` guard. Do not add a new resource.
- What not to change: Do not alter the three existing SLO alert rules.
- Impact: Directly improves Reliability (+10-12 pts) and Observability (+6-8 pts). Weighted readiness impact: +0.15-0.25%.
```

### 15. Add Prometheus Alert for LLM Tenant Budget Approaching Warn Fraction
- **Why it matters:** `LlmMonthlyTenantDollarBudgetOptions` has a `WarnFraction` (default 0.75) that gates pre-call reservations, but no Prometheus alert fires when aggregate per-tenant spend approaches the cap. Operators learn of budget pressure only when tenants start receiving budget-exceeded errors, not before.
- **Expected impact:** AI/Agent Readiness (+8 pts), Observability (+6 pts).
- **Affected qualities:** AI/Agent Readiness, Observability.
- **Actionable:** Yes
```text
Two-part change.
(1) In `ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs` (or the nearest telemetry file), add an observable up-down counter gauge named `archlucid_llm_budget_utilization_fraction` (dimensioned by `tenant_id`) that reads from `ILlmTenantBudgetRepository.GetOrCreateAsync` for the current period and emits `consumed / hard_cutoff`.
(2) Add a Prometheus alert rule to `infra/terraform-monitoring/prometheus_slo_rules.tf` inside the existing rule group:
- Rule name: `ArchLucidLlmBudgetWarnFractionBreachedTf`
- Expression: `max by (tenant_id) (archlucid_llm_budget_utilization_fraction) > 0.75`
- Severity: 3, `for = "PT5M"`, action group ops.
- Annotation summary: "Tenant LLM budget utilisation exceeded 75%. Review infra/terraform-monitoring."
- Acceptance criteria: (a) Gauge appears in Prometheus `/metrics` output. (b) Alert rule validates in Terraform plan.
- Constraints: Gauge collection must not trigger a SQL query more frequently than every 5 minutes; use a cached/last-known value if the repository is slow.
- What not to change: Do not alter the budget reserve/settle logic.
- Impact: Directly improves AI/Agent Readiness (+6-8 pts) and Observability (+4-6 pts). Weighted readiness impact: +0.1-0.2%.
```

### 16. Add `runbook_url` Annotations to All Existing Prometheus SLO Alert Rules
- **Why it matters:** The three existing alert rules in `prometheus_slo_rules.tf` (`ArchLucidSloHttpP99HighTf`, `ArchLucidSloHttp5xxRatioElevatedTf`, `ArchLucidSloOutboxDepthCriticalTf`) have only a `summary` annotation. Alertmanager and PagerDuty surface the `runbook_url` annotation as a clickable link. Without it, on-call engineers must manually search for the correct runbook in a high-stress incident.
- **Expected impact:** Observability (+8 pts), Reliability (+4 pts).
- **Affected qualities:** Observability, Reliability.
- **Actionable:** Yes
```text
Update each of the three existing `rule` blocks in `infra/terraform-monitoring/prometheus_slo_rules.tf` to add a `runbook_url` key to their `annotations` map.
- `ArchLucidSloHttpP99HighTf` → `runbook_url = "https://github.com/ArchLucid/ArchLucid/blob/main/docs/runbooks/AUTHORITY_PIPELINE_OBSERVABILITY.md"`
- `ArchLucidSloHttp5xxRatioElevatedTf` → same runbook URL.
- `ArchLucidSloOutboxDepthCriticalTf` → same runbook URL.
- Acceptance criteria: `terraform validate` passes; all three rules contain `runbook_url` in their annotations maps.
- Constraints: Use the existing `docs/runbooks/AUTHORITY_PIPELINE_OBSERVABILITY.md` path. Do not create new runbook files.
- What not to change: Do not alter expression, severity, or for duration on any existing rule.
- Impact: Directly improves Observability (+6-8 pts). Weighted readiness impact: +0.05-0.1%.
```

### 17. Export LLM Tenant Budget Utilization as a Prometheus Observable Gauge
- **Why it matters:** The `dashboard-archlucid-llm-usage.json` Grafana dashboard exists, but it has no budget-headroom panel because `ILlmTenantBudgetRepository` state is not surfaced via Prometheus. Operators cannot tell at a glance whether any tenant is within 20% of their hard cutoff. This is a distinct instrumentation gap from the alert rule in task 15.
- **Expected impact:** Observability (+10 pts), AI/Agent Readiness (+5 pts).
- **Affected qualities:** Observability, AI/Agent Readiness.
- **Actionable:** Yes
```text
Add a background periodic reader that calls `ILlmTenantBudgetRepository.GetOrCreateAsync` for every active tenant every 5 minutes and publishes an observable gauge `archlucid_llm_budget_remaining_usd` (dimensioned by `tenant_id`) to `ArchLucidInstrumentation`.
- Acceptance criteria: (a) Metric appears in `/metrics` scrape. (b) A new panel "LLM Budget Remaining (USD) by Tenant" is added to `infra/grafana/dashboard-archlucid-llm-usage.json` using this metric. (c) Unit test asserts the gauge is non-negative.
- Constraints: Limit to tenants with `LlmMonthlyTenantDollarBudget:Enabled = true`. Cache the tenant list; refresh every 60 s to avoid N+1 SQL per scrape.
- What not to change: Do not modify the reserve/settle path or the budget enforcement logic.
- Impact: Directly improves Observability (+8-10 pts) and AI/Agent Readiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 18. Raise Merged-Line Coverage Floor in CI from 0 to 75
- **Why it matters:** `ci.yml` line 1742 explicitly passes `0` as the merged-line minimum, with a comment stating the 95% ratchet is deferred to V1.1. This means test coverage can regress freely from its current level until V1.1. Raising the floor to 75 is a safe intermediate gate that preserves the current coverage bar without requiring the full ratchet mechanism.
- **Expected impact:** Testability (+12 pts), Correctness (+5 pts).
- **Affected qualities:** Testability, Correctness.
- **Actionable:** Yes
```text
In `.github/workflows/ci.yml`, change the merged-line minimum argument to `assert_merged_line_coverage_min.py` from `0` to `75`.
- Current line (approx. 1742): `python3 scripts/ci/assert_merged_line_coverage_min.py "${OUT}/Cobertura.xml" 0 \`
- Change to: `python3 scripts/ci/assert_merged_line_coverage_min.py "${OUT}/Cobertura.xml" 75 \`
- Also update the inline comment from "Merged line minimum is 0 here" to "Merged line minimum is 75; full ratchet (.coverage-floor) is V1.1."
- Acceptance criteria: (a) A PR that drops merged line coverage below 75 fails CI. (b) The current main branch passes the new threshold. (c) No other CI steps are modified.
- Constraints: Verify the current merged-line coverage value from the most recent CI run artifact before choosing 75; if it is below 75, use the current value minus 1 as a safe floor instead.
- What not to change: Do not change the branch coverage minimum (63) or the per-package minimums.
- Impact: Directly improves Testability (+10-12 pts) and Correctness (+3-5 pts). Weighted readiness impact: +0.15-0.25%.
```

### 19. Add Azure Cost Management Actual-Spend Ingestion to the Extractor
- **Why it matters:** `scripts/azure/ArchLucid.RetailPrices.helpers.ps1` estimates unit costs from retail price lists, but the extractor (`Get-ArchLucidAzurePackage.ps1`) never calls the Azure Cost Management API to retrieve actual monthly spend. Architecture review reports currently show "estimated" cost without a "vs. actual" comparison, which reduces commercial credibility with FinOps-aware buyers.
- **Expected impact:** Decision Velocity (+12 pts), Time-to-Value (+6 pts).
- **Affected qualities:** Decision Velocity, Time-to-Value.
- **Actionable:** Yes
```text
Add a new helper function `Get-ArchLucidActualCostSummary` to a new file `scripts/azure/ArchLucid.CostManagement.helpers.ps1` that:
1. Calls `az costmanagement query` with `--type ActualCost` scoped to the subscription.
2. Returns a summary object with `TotalActualCostUsd`, `CurrencyCode`, `BillingPeriod`, and a per-service-name breakdown.
3. Is called from `Get-ArchLucidAzurePackage.ps1` and its output merged into the JSON package under a new top-level key `"actualCostSummary"`.
- Acceptance criteria: (a) Running the script against a subscription with Cost Management Reader role returns a non-null `actualCostSummary`. (b) Script gracefully handles insufficient permissions (Cost Management Reader not assigned) by setting `"actualCostSummary": null` and logging a warning. (c) A Pester or integration test validates the helper returns the expected shape.
- Constraints: The `az` CLI must be the only dependency; do not add PowerShell modules. Scope to the current subscription only.
- What not to change: Do not alter existing `RetailPrices` logic or the existing JSON package structure keys.
- Impact: Directly improves Decision Velocity (+10-12 pts) and Time-to-Value (+4-6 pts). Weighted readiness impact: +0.15-0.25%.
```

### 20. Add Trial Expiry Countdown Banner to the UI
- **Why it matters:** `TrialLifecycleEmailScanHostedService` sends email notifications on trial lifecycle events, but there is no in-app UI component that shows "N days remaining in your trial." Without a visible countdown, users approaching the trial end have no in-session nudge to convert. This is a direct conversion-funnel gap.
- **Expected impact:** Stickiness (+10 pts), Time-to-Value (+6 pts).
- **Affected qualities:** Stickiness, Time-to-Value.
- **Actionable:** Yes
```text
Add a `TrialExpiryBanner` React component in `archlucid-ui/src/components/` that:
1. Reads trial expiry state from a new API endpoint `GET /v1/trial/status` (or an existing tenant-profile endpoint if one already surfaces `TrialEndsUtc`).
2. Renders a dismissible info banner when the trial has 7 or fewer days remaining, showing the exact number of days and a "Talk to us" CTA linking to the configured contact/sales URL.
3. Is mounted in the root layout so it appears on every authenticated page.
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

### 22. DEFERRED: Automated tenant erasure (30-day quarantine, legal-hold flag, blob + SQL purge)
- **Reason:** Deferred to V2. Requires user input to confirm the legal hold schema and RBAC roles allowed to clear the hold.
- **Needed from me:** Please provide the exact schema for `LegalHoldUntilUtc` and confirm the RBAC roles for clearing the hold.

### 23. DEFERRED: Commerce un-hold (Stripe live keys flipped + Marketplace listing published)
- **Reason:** Deferred to V1.1. Requires user input to provide the live Stripe keys and confirm Marketplace publication.
- **Needed from me:** Please provide the `sk_live_` Stripe keys and confirm the Marketplace offer is `Published`.

### 24. DEFERRED: PGP key drop for security@archlucid.net
- **Reason:** Deferred to V1.1. Requires user input to generate and provide the PGP keypair.
- **Needed from me:** Please provide the public PGP key block to be placed at `archlucid-ui/public/.well-known/pgp-key.txt`.

---

## Prompt Batching Guidance

To optimize context window usage and cost-effectiveness, batch the actionable prompts as follows:

- **Batch 1 (Observability & Monitoring):** 1, 11, 13, 16, 17
- **Batch 2 (Alerting & SLO):** 14, 15
- **Batch 3 (Cost & Policy Packs):** 2, 3, 4, 19
- **Batch 4 (Reliability & Scalability):** 6, 9, 12
- **Batch 5 (Security & Compliance):** 5, 8
- **Batch 6 (Testing & CI):** 7, 18
- **Batch 7 (UX & Conversion):** 10, 20

---

## Pending Questions for Later

### DEFERRED (22): Automated tenant erasure (30-day quarantine, legal-hold flag, blob + SQL purge)
- What is the exact schema for `LegalHoldUntilUtc` and which RBAC roles are allowed to clear the hold?

### DEFERRED (23): Commerce un-hold (Stripe live keys flipped + Marketplace listing published)
- What are the `sk_live_` Stripe keys and is the Marketplace offer `Published`?

### DEFERRED (24): PGP key drop for security@archlucid.net
- What is the public PGP key block to be placed at `archlucid-ui/public/.well-known/pgp-key.txt`?
