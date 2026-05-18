> **Scope:** Independent, first-principles assessment of ArchLucid readiness.
> **Status:** current

# ArchLucid Assessment – (A) Headline Readiness: 84.94%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding explicitly deferred items (e.g., automated tenant erasure, SOC 2 CPA attestation, third-party pen testing, MCP, live commerce un-hold, and V1.1-scoped integration suites).

## Executive Summary

### (A) Overall Headline Readiness (84.94%)
ArchLucid is a functionally complete V1 product with a highly rigorous architectural foundation (84.94% readiness). It successfully executes the core pilot loop and provides strong governance and traceability features. Recent completions—such as internal cross-tenant analytics, form-based custom policy authoring, LLM telemetry, and operational script hardening—significantly strengthen the GA offering. The primary remaining gaps are in observability operationalization for shipped GenAI signals (dashboards, SLO linkage, alerting), broader automated Azure cost estimations, and default `ui-e2e-smoke` mock-heavy coverage.

### (B) Procurement/Market-Motion Realism
Enterprise procurement will face friction due to the lack of a CPA-issued SOC 2 Type II report and third-party penetration testing (both intentionally deferred). The reliance on a SOC 2 self-assessment and owner-conducted penetration testing is acceptable for early pilots but will require executive sponsorship to bypass standard vendor security gates. The full automated tenant erasure quarantine pipeline is a V2 engineering commitment and is not scored as an `(A)` defect. V1 relies on operator-driven and trial/offboarding deletion paths.

### Commercial Picture
The commercial posture is strongly aligned for a sales-led, service-led motion. The inclusion of consultant whitelabeling on architecture review exports enables boutique consulting firms to use ArchLucid as a delivery engine. Curated demo workspaces, default policy packs, and the ZIP-first baseline wizard accelerate Time-to-Value and Proof-of-ROI. The deferred live commerce correctly prioritizes validated purchasing motions over premature self-serve availability.

### Enterprise Picture
ArchLucid provides strong enterprise integration points, including Jira, ServiceNow, Slack, and Confluence. Tenant isolation is robustly handled via database-per-tenant and RLS. Tenant custom governance packs support form-based authoring for curated-rules-shaped documents. SAML SP expiry warnings and data residency verification in Terraform CI further enhance enterprise readiness.

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
- **Specific improvement recommendations:** Create a cost optimization policy pack to provide immediate, tangible value.
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
- **Why this score was assigned:** The Azure extractor appends Retail Prices for App Service and SQL. Cross-tenant analytics rollups exist.
- **Key tradeoffs:** Broader Cost Management / Advisor parity and wider SKU families remain manual.
- **Specific improvement recommendations:** Add Azure VM and Storage Account Retail Prices to the extractor.
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
- **Specific improvement recommendations:** Inbound MCP server (membrane).
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

### 2. Add Azure VM and Storage Account Retail Prices to Extractor
- **Why it matters:** Extends automated cost narratives beyond App Service and SQL, proving ROI for more SKUs.
- **Expected impact:** Cost-Effectiveness (+10 pts), Proof-of-ROI Readiness (+5 pts).
- **Affected qualities:** Cost-Effectiveness, Proof-of-ROI Readiness.
- **Actionable:** Yes
```text
Update `scripts/azure/ArchLucid.RetailPrices.helpers.ps1` and `Get-ArchLucidAzurePackage.ps1` to query the Azure Retail Prices API for Virtual Machines and Storage Accounts.
- Acceptance criteria: `retail-prices.json` includes consumption-priced catalog rows for VMs and Storage Accounts.
- Constraints: Do not require any new Azure RBAC roles beyond `Reader` and `Cost Management Reader`.
- What not to change: Do not alter the core ARM resource collection logic.
- Impact: Directly improves Cost-Effectiveness (+8-10 pts) and Proof-of-ROI Readiness (+3-5 pts). Weighted readiness impact: +0.2-0.3%.
```

### 3. Internal Policy Pack Hub (catalog read model + admin-only promotion)
- **Why it matters:** Tenants need discoverable, trustworthy starter packs without emailing JSON.
- **Expected impact:** Stickiness (+15 pts), Template and Accelerator Richness (+10 pts).
- **Affected qualities:** Stickiness, Template and Accelerator Richness.
- **Actionable:** Yes
```text
Implement an internal Policy Pack Hub: a read-only catalog of platform-curated policy packs that any tenant can browse and clone, with admin-only promotion.
- Acceptance criteria: Add a `PolicyPackCatalogEntry` table. Add GET list/detail for catalog (tenant-authenticated). Add POST promote/demote (admin-only). Update UI to show a "Catalog" tab under `/policy-packs`.
- Constraints: Follow `Http-Surface-Docs-And-Clients.mdc` for new endpoints.
- What not to change: Do not open multi-tenant write sharing.
- Impact: Directly improves Stickiness (+10-15 pts) and Template and Accelerator Richness (+6-10 pts). Weighted readiness impact: +0.15-0.25%.
```

### 4. Create Cost Optimization Policy Pack
- **Why it matters:** Provides immediate, tangible value by identifying over-provisioned resources.
- **Expected impact:** Time-to-Value (+10 pts), Stickiness (+5 pts).
- **Affected qualities:** Time-to-Value, Stickiness.
- **Actionable:** Yes
```text
Create a new curated policy pack `docs/samples/policy-packs/cost-optimization-rules-v1.json` focused on cost savings (e.g., unattached disks, idle VMs).
- Acceptance criteria: The pack is valid JSON matching the curated-rules schema and includes at least 5 cost-focused rules.
- Constraints: Ensure the rules map to data collected by the Azure extractor.
- What not to change: Do not modify the policy engine.
- Impact: Directly improves Time-to-Value (+8-10 pts) and Stickiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 5. Add Automated SAML Cert Expiry Email Notifications
- **Why it matters:** Proactively alerts admins before SAML SP certificates expire, reducing support load.
- **Expected impact:** Supportability (+10 pts), Adoption Friction (+5 pts).
- **Affected qualities:** Supportability, Adoption Friction.
- **Actionable:** Yes
```text
Create a background hosted service `SamlCertExpiryNotificationHostedService` that runs daily to check SAML SP certificate expiry.
- Acceptance criteria: Sends an email notification to tenant admins if the cert is within 30 days of expiry.
- Constraints: Use the existing `SamlOperationalDiagnosticsService` to check expiry.
- What not to change: Do not modify SAML login paths.
- Impact: Directly improves Supportability (+8-10 pts) and Adoption Friction (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 6. Implement Tenant-Fairness Queuing in Authority Pipeline
- **Why it matters:** Prevents noisy neighbor issues by ensuring one tenant cannot monopolize the worker pool.
- **Expected impact:** Reliability (+10 pts), Scalability (+5 pts).
- **Affected qualities:** Reliability, Scalability.
- **Actionable:** Yes
```text
Modify the SQL outbox processor in `ArchLucid.Worker` to round-robin across tenants instead of strict FIFO.
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

### 8. Add SQL Backup Region Verification Script
- **Why it matters:** Provides verifiable proof that SQL automated backups are stored in the expected geography.
- **Expected impact:** Compliance Readiness (+10 pts), Reliability (+5 pts).
- **Affected qualities:** Compliance Readiness, Reliability.
- **Actionable:** Yes
```text
Create a Python script `scripts/ci/assert_sql_backup_regions.py` to verify Azure SQL backup storage redundancy configurations in Terraform.
- Acceptance criteria: The script parses `terraform show -json` and fails if `requested_backup_storage_redundancy` is not `Geo` or `Zone` as expected.
- Constraints: Run this script in the existing CD pipeline.
- What not to change: Do not modify the Terraform resource definitions.
- Impact: Directly improves Compliance Readiness (+8-10 pts) and Reliability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 9. Implement Rate Limiting for Bulk Evidence Upload
- **Why it matters:** Prevents abuse of the bulk upload endpoint.
- **Expected impact:** Reliability (+10 pts), Usability (+5 pts).
- **Affected qualities:** Reliability, Usability.
- **Actionable:** Yes
```text
Add API rate limiting to the bulk evidence upload endpoint in `ArchLucid.Api`.
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

### 14. DEFERRED: Automated tenant erasure (30-day quarantine, legal-hold flag, blob + SQL purge)
- **Reason:** Deferred to V2. Requires user input to confirm the legal hold schema and RBAC roles allowed to clear the hold.
- **Needed from me:** Please provide the exact schema for `LegalHoldUntilUtc` and confirm the RBAC roles for clearing the hold.

### 15. DEFERRED: First named, public reference customer
- **Reason:** Deferred to V1.1. Requires user input to provide the customer name and case study details.
- **Needed from me:** Please provide the customer name, logo, and case study content when ready.

### 16. DEFERRED: Signed design partner engagement
- **Reason:** Deferred to V1.1. Requires user input to confirm the partner details.
- **Needed from me:** Please provide the design partner agreement details when signed.

### 17. DEFERRED: Commerce un-hold (Stripe live keys flipped + Marketplace listing published)
- **Reason:** Deferred to V1.1. Requires user input to provide the live Stripe keys and confirm Marketplace publication.
- **Needed from me:** Please provide the `sk_live_` Stripe keys and confirm the Marketplace offer is `Published`.

### 18. DEFERRED: PGP key drop for security@archlucid.net
- **Reason:** Deferred to V1.1. Requires user input to generate and provide the PGP keypair.
- **Needed from me:** Please provide the public PGP key block to be placed at `archlucid-ui/public/.well-known/pgp-key.txt`.

### 19. DEFERRED: Inbound MCP server (membrane)
- **Reason:** Deferred to V1.1. Requires user input to confirm the final list of read-only tools.
- **Needed from me:** Please confirm the 7 read-only tools listed in the backlog are final.

### 20. DEFERRED: Redis as the default production substrate for scaled API fleets
- **Reason:** Deferred to V2. Requires user input to confirm the recommended Azure Cache for Redis SKU.
- **Needed from me:** Please provide the recommended Redis SKU and private connectivity Terraform configuration.

---

## Prompt Batching Guidance

To optimize context window usage and cost-effectiveness, batch the actionable prompts as follows:

- **Batch 1 (Observability & Monitoring):** 1, 11, 13
- **Batch 2 (Cost & Policy Packs):** 2, 3, 4
- **Batch 3 (Reliability & Scalability):** 6, 9, 12
- **Batch 4 (Security & Compliance):** 5, 8
- **Batch 5 (Testing & UX):** 7, 10

---

## Pending Questions for Later

### DEFERRED: Automated tenant erasure (30-day quarantine, legal-hold flag, blob + SQL purge)
- What is the exact schema for `LegalHoldUntilUtc` and which RBAC roles are allowed to clear the hold?

### DEFERRED: First named, public reference customer
- What is the customer name, logo, and case study content?

### DEFERRED: Signed design partner engagement
- What are the design partner agreement details?

### DEFERRED: Commerce un-hold (Stripe live keys flipped + Marketplace listing published)
- What are the `sk_live_` Stripe keys and is the Marketplace offer `Published`?

### DEFERRED: PGP key drop for security@archlucid.net
- What is the public PGP key block to be placed at `archlucid-ui/public/.well-known/pgp-key.txt`?

### DEFERRED: Inbound MCP server (membrane)
- Are the 7 read-only tools listed in the backlog final?

### DEFERRED: Redis as the default production substrate for scaled API fleets
- What is the recommended Redis SKU and private connectivity Terraform configuration?
