# ArchLucid Assessment – (A) Headline Readiness: 83.12%

*This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, explicitly excluding items deferred to V1.1 or V2.*

## Executive Summary

**`(A)` Overall Headline Readiness**
ArchLucid is highly ready for its V1 core mission: moving from an architecture request to a committed, reviewable manifest. The foundational authority pipeline, golden manifest generation, and auditability are robust. The primary gaps holding back the score are adoption friction (manual data ingestion), workflow embeddedness (lack of ITSM/Chat integrations in V1), and cost-effectiveness (high baseline COGS due to database-per-tenant isolation for trials).

**`(B)` Procurement/Market-Motion Realism**
Procurement will face moderate friction. The absence of a CPA-issued SOC 2 Type II report and a published third-party pen test summary will trigger extended security reviews. The lack of a signed design partner or public reference customer may slow executive buy-in, though the sales-led pilot motion is well-supported.

**Commercial Picture**
The commercial foundation is solid for sales-led pilots, with strong proof-of-ROI reporting (first-value reports, sponsor DOCX). However, self-serve transactability is blocked because Stripe live keys and the Azure Marketplace listing are intentionally deferred to V1.1.

**Enterprise Picture**
Enterprise usability is good, aided by progressive disclosure in the UI. However, enterprise adoption will be bottlenecked by the requirement for customers to manually run a PowerShell script for Azure extraction, and the lack of native Jira/ServiceNow/Teams integrations in V1, making ArchLucid a destination app rather than an embedded workflow tool.

**Engineering Picture**
The engineering architecture is structurally sound, with clear boundaries between the API, Application, Decisioning, and Persistence layers. AI/Agent readiness is high. The main risks involve over-reliance on SQL Server for large JSON payloads, potential cache coherency issues in multi-replica setups without Redis, the complexity of maintaining parallel Authority and Coordinator pipelines, and observability gaps due to head-based trace sampling dropping high-value authority runs.

---

## Weighted Quality Assessment

Qualities are ranked from most urgent to least urgent based on their weighted deficiency (Weight × (100 - Score)).

### 1. Adoption Friction
- **Score:** 75
- **Weight:** 6
- **Weighted deficiency signal:** 150
- **Justification:** While the "Tier 1" access model (no vendor access to customer cloud) is great for security, requiring customers to manually run a PowerShell script (`Get-ArchLucidAzurePackage.ps1`) to extract Azure data introduces significant friction.
- **Tradeoffs:** Security/Trust vs. Ease of Onboarding.
- **Improvement recommendations:** Automate the extraction process where possible, or provide a more seamless UI-driven guide for running the script.

### 2. Workflow Embeddedness
- **Score:** 60
- **Weight:** 3
- **Weighted deficiency signal:** 120
- **Justification:** V1 lacks native integrations with Jira, ServiceNow, Microsoft Teams, and Slack (all deferred to V1.1). Users must leave their daily tools to use ArchLucid.
- **Tradeoffs:** Core product focus vs. Ecosystem integration.
- **Improvement recommendations:** Accelerate the delivery of the ITSM and Chat integrations to make ArchLucid an invisible enabler rather than a destination app.

### 3. Correctness
- **Score:** 85
- **Weight:** 8
- **Weighted deficiency signal:** 120
- **Justification:** The authority pipeline and golden manifest are strong, but the lack of full idempotency on the `POST /v1/architecture/request` endpoint introduces a risk of duplicate runs during network retries.
- **Tradeoffs:** Implementation speed vs. Strict distributed systems guarantees.
- **Improvement recommendations:** Implement full idempotency using the `Idempotency-Key` header for the create run endpoint.

### 4. Time-to-Value
- **Score:** 85
- **Weight:** 7
- **Weighted deficiency signal:** 105
- **Justification:** The Core Pilot path is well-defined and fast, but the manual Azure extraction step delays the time it takes to get the first meaningful architecture review.
- **Tradeoffs:** Manual secure ingestion vs. Automated risky ingestion.
- **Improvement recommendations:** Streamline the ingestion of infrastructure declarations and context documents.

### 5. AI/Agent Readiness
- **Score:** 88
- **Weight:** 8
- **Weighted deficiency signal:** 96
- **Justification:** Strong agent orchestration and cost estimation. However, the `StagedCriticEnabled` feature adds batch wall-clock time, and the Content Safety API dependency could cause availability issues if it fails closed.
- **Tradeoffs:** Safety/Quality vs. Latency/Availability.
- **Improvement recommendations:** Implement a circuit breaker for the Content Safety API.

### 6. Interoperability
- **Score:** 65
- **Weight:** 2
- **Weighted deficiency signal:** 70
- **Justification:** Interoperability is limited to REST APIs and the CLI. The Model Context Protocol (MCP) server is deferred to V1.1.
- **Tradeoffs:** Core API stability vs. Standardized ecosystem protocols.
- **Improvement recommendations:** Deliver the MCP server to allow seamless integration with other AI tools.

### 7. Usability
- **Score:** 80
- **Weight:** 3
- **Weighted deficiency signal:** 60
- **Justification:** Progressive disclosure helps, but the domain vocabulary (Authority, Coordinator, Manifest, Trace) imposes a high cognitive load on new users.
- **Tradeoffs:** Precise technical terms vs. Approachable user language.
- **Improvement recommendations:** Simplify the UI vocabulary, using terms like "Architecture Review" consistently instead of "Run".

### 8. Differentiability
- **Score:** 85
- **Weight:** 4
- **Weighted deficiency signal:** 60
- **Justification:** The focus on governance, auditability, and the golden manifest differentiates ArchLucid from generic AI wrappers, but the lack of multi-cloud support (AWS/GCP deferred to V1.1) limits its appeal to Azure-only shops.
- **Tradeoffs:** Deep Azure integration vs. Broad multi-cloud appeal.
- **Improvement recommendations:** Deliver AWS/GCP architecture analysis capabilities.

### 9. Proof-of-ROI Readiness
- **Score:** 90
- **Weight:** 5
- **Weighted deficiency signal:** 50
- **Justification:** Excellent built-in reporting (first-value report, pilot run deltas) that explicitly tracks time saved and LLM calls.
- **Tradeoffs:** None significant; this is a strong area.
- **Improvement recommendations:** Enhance the UI to make these reports even more prominent post-commit.

### 10. Executive Value Visibility
- **Score:** 88
- **Weight:** 4
- **Weighted deficiency signal:** 48
- **Justification:** The sponsor-shareable PDF and DOCX architecture packages are highly effective for executive visibility.
- **Tradeoffs:** Standardized reporting vs. Customizable templates.
- **Improvement recommendations:** Allow minor customizations (e.g., logo insertion) in the generated PDFs.

### 11. Decision Velocity
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Justification:** Features like "Compare two reviews" and "Ask" accelerate decisions, but the manual data ingestion slows down the initial velocity.
- **Tradeoffs:** Thorough analysis vs. Instant answers.
- **Improvement recommendations:** Improve the speed of the advisory scans.

### 12. Reliability
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Justification:** Solid single-region reliability with SQL Server and Polly retries. However, multi-region active/active topology is deferred to V2.
- **Tradeoffs:** Cost/Complexity vs. High Availability.
- **Improvement recommendations:** Add Redis cache coherency checks for multi-replica deployments.

### 13. Cost-Effectiveness
- **Score:** 65
- **Weight:** 1
- **Weighted deficiency signal:** 35
- **Justification:** While LLM token budgets are well-controlled, the architectural mandate of "database-per-tenant" (even for self-serve trial tenants) introduces a massive baseline infrastructure cost and limits density in Azure SQL Elastic Pools.
- **Tradeoffs:** Strict tenant data isolation vs. Infrastructure cost.
- **Improvement recommendations:** Implement a shared-database, RLS-isolated tier specifically for trial tenants to reduce the COGS of the self-serve funnel.

### 14. Stickiness
- **Score:** 70
- **Weight:** 1
- **Weighted deficiency signal:** 30
- **Justification:** Without ITSM and Chat integrations, ArchLucid is less sticky because it doesn't live where the users already work.
- **Tradeoffs:** Standalone value vs. Integrated value.
- **Improvement recommendations:** Deliver the Jira and Teams integrations.

### 15. Cognitive Load
- **Score:** 70
- **Weight:** 1
- **Weighted deficiency signal:** 30
- **Justification:** The system has a complex architecture (Authority vs Coordinator, various snapshot types) that leaks into the operator experience.
- **Tradeoffs:** System flexibility vs. User simplicity.
- **Improvement recommendations:** Hide internal orchestration details from the standard operator UI.

### 16. Maintainability
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Justification:** Clean architecture boundaries, but maintaining both the Authority pipeline and the legacy Coordinator endpoints adds technical debt.
- **Tradeoffs:** Backward compatibility vs. Codebase simplicity.
- **Improvement recommendations:** Unify the state transition logic between the two pipelines.

### 17. Observability
- **Score:** 75
- **Weight:** 1
- **Weighted deficiency signal:** 25
- **Justification:** Strong metrics and dashboarding, but the reliance on head-based trace sampling in the .NET SDK means high-value authority run traces may be dropped in production unless an external OTLP collector is configured for tail sampling.
- **Tradeoffs:** Trace volume/cost vs. Debuggability of critical flows.
- **Improvement recommendations:** Provide a default OTLP collector configuration with tail sampling for `ArchLucid.AuthorityRun` traces, or implement a custom in-process sampler.

### 18. Explainability
- **Score:** 90
- **Weight:** 2
- **Weighted deficiency signal:** 20
- **Justification:** The `/v1/explain` endpoints, provenance graphs, and reasoning traces provide excellent explainability.
- **Tradeoffs:** Storage cost of traces vs. Transparency.
- **Improvement recommendations:** Add UI indicators for context ingestion warnings to explain why certain documents were ignored.

### 19. Template and Accelerator Richness
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Ships with 23 default policy packs, which is a great start.
- **Tradeoffs:** Curated defaults vs. Exhaustive frameworks.
- **Improvement recommendations:** Expand the catalog of promoted policy packs.

### 20. Scalability
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Supports multiple replicas, but relies heavily on SQL Server for large JSON payloads, which could become a bottleneck.
- **Tradeoffs:** Relational simplicity vs. NoSQL scalability.
- **Improvement recommendations:** Optimize SQL Server JSON payload storage.

### 21. Performance
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** Good use of `HotPathCache` and `LlmCompletionCache`.
- **Tradeoffs:** Memory usage vs. Response time.
- **Improvement recommendations:** Optimize the Audit Log CSV export to stream data and prevent timeouts.

### 22. Supportability
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** Excellent support bundle CLI and correlation IDs.
- **Tradeoffs:** Data privacy vs. Diagnostic depth.
- **Improvement recommendations:** Add a System Health dashboard to the operator UI.

### 23. Testability
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** In-memory repositories enable fast contract tests.
- **Tradeoffs:** Test speed vs. Database fidelity.
- **Improvement recommendations:** Ensure in-memory repos maintain strict parity with SQL behavior.

---

## Top 12 Most Important Weaknesses

1. **Manual Data Ingestion Bottleneck:** The requirement to manually run a PowerShell script for Azure extraction introduces significant adoption friction.
2. **Destination App Syndrome:** The lack of V1 integrations with Jira, ServiceNow, Teams, and Slack means users must leave their daily workflows to use the product.
3. **Database-per-Tenant COGS for Trials:** Using a dedicated SQL database for every self-serve trial tenant creates massive baseline infrastructure costs and limits elastic pool density.
4. **Head-Based Trace Sampling Drops High-Value Traces:** The .NET SDK's head-based sampling means critical `ArchLucid.AuthorityRun` traces may be dropped in production without an external OTLP tail-sampling collector.
5. **High Cognitive Load of Domain Vocabulary:** Terms like Authority, Coordinator, Manifest, and Trace leak into the UI, confusing new operators.
6. **Over-reliance on SQL Server for Large Payloads:** Storing large JSON manifests and traces in SQL Server `NVARCHAR(MAX)` columns poses a scalability risk.
7. **Incomplete Idempotency on Mutating Endpoints:** The `POST /v1/architecture/request` endpoint lacks full idempotency, risking duplicate runs on network retries.
8. **Lack of Automated Tenant Erasure:** The absence of a fully automated tenant erasure pipeline (deferred to V2) may raise data privacy concerns for enterprise buyers.
9. **Missing Multi-Cloud Support in V1:** Being Azure-only in V1 limits the total addressable market and differentiability.
10. **Complex RBAC and Policy Pack Configuration:** The governance resolution and policy pack assignment logic is powerful but difficult to troubleshoot when conflicts occur.
11. **Potential Cache Coherency Issues:** Multi-replica deployments that fail to configure Redis may experience stale data issues.
12. **Content Safety API Dependency Risk:** If the Azure Content Safety API fails, the system may fail closed, impacting availability.

---

## Top 6 Monetization Blockers

1. **Stripe Live Keys and Marketplace Listing Deferred:** Self-serve transactability is blocked because these are deferred to V1.1.
2. **Lack of a Signed Design Partner:** While not required for V1 GA, the absence of a design partner slows down real-world commercial validation.
3. **Lack of a Public Reference Customer:** Deferred to V1.1, this creates friction in proving market traction to new buyers.
4. **Trial to Paid Conversion Flow in TEST Mode:** The billing checkout flow is still running against Stripe TEST keys in production.
5. **Absence of SOC 2 Type II Report:** This will cause significant friction during enterprise procurement and security reviews.
6. **Absence of Third-Party Pen Test Summary:** Deferred to V2, this will also trigger extended security reviews by enterprise buyers.

---

## Top 6 Enterprise Adoption Blockers

1. **Manual PowerShell Script Execution:** Security and operations teams will resist running a third-party script to extract Azure data.
2. **Lack of Jira/ServiceNow Integration in V1:** Enterprise teams rely on ITSM tools; without them, ArchLucid is disconnected from their workflows.
3. **Lack of Teams/Slack Integration in V1:** Architecture reviews often happen in chat; lack of integration reduces visibility.
4. **Lack of Automated Tenant Erasure:** Data privacy teams will flag the manual nature of data purging.
5. **Missing AWS/GCP Support:** Enterprises with multi-cloud strategies will defer adoption until V1.1.
6. **Complex Policy Pack Assignment:** Enterprise admins will struggle to understand why certain policies are effective without better conflict resolution UI.

---

## Top 6 Engineering Risks

1. **Trace Sampling Dropping High-Value Workflows:** Production environments using fractional sampling will lose visibility into core business workflows unless operators manually configure OTLP tail sampling.
2. **Database-per-Tenant COGS Risk:** The trial funnel could become unsustainably expensive if a high volume of self-serve signups requires provisioning thousands of individual SQL databases.
3. **SQL Server Performance Degradation:** Large JSON payloads (manifests, traces) could cause database bloat and slow down queries.
4. **Lack of Full Idempotency on Create/Commit Endpoints:** Network instability could lead to duplicate architecture runs and wasted LLM spend.
5. **Cache Coherency Issues:** Deployments scaling beyond one replica without Redis configured will serve stale data.
6. **Content Safety API Fail-Closed Dependency:** A localized outage of the Azure Content Safety API could take down the entire ArchLucid deployment.

---

## Most Important Truth

ArchLucid has a strong, defensible core for architecture review and governance, but its V1 adoption will be bottlenecked by the manual nature of data ingestion (PowerShell script) and the lack of embeddedness in existing enterprise workflows (Jira, Teams), making it a destination app rather than an invisible enabler.

---

## Top Improvement Opportunities

### 1. DEFERRED Implement Jira Integration
- **Why it matters:** Embeds ArchLucid into enterprise workflows.
- **Expected impact:** Improves Workflow Embeddedness (+20 pts) and Stickiness (+15 pts). Weighted readiness impact: +1.1%.
- **Affected qualities:** Workflow Embeddedness, Stickiness.
- **Input needed:** Confirmation of V1.1 timeline and Jira API credentials for testing.

### 2. DEFERRED Implement ServiceNow Integration
- **Why it matters:** Essential for enterprise ITSM adoption.
- **Expected impact:** Improves Workflow Embeddedness (+15 pts). Weighted readiness impact: +0.6%.
- **Affected qualities:** Workflow Embeddedness.
- **Input needed:** Confirmation of V1.1 timeline and ServiceNow Developer instance details.

### 3. DEFERRED Implement Microsoft Teams Integration
- **Why it matters:** Brings architecture reviews into daily chat workflows.
- **Expected impact:** Improves Workflow Embeddedness (+10 pts). Weighted readiness impact: +0.4%.
- **Affected qualities:** Workflow Embeddedness.
- **Input needed:** Confirmation of V1.1 timeline and Teams webhook configuration.

### 4. DEFERRED Implement Slack Integration
- **Why it matters:** Essential for modern engineering teams.
- **Expected impact:** Improves Workflow Embeddedness (+10 pts). Weighted readiness impact: +0.4%.
- **Affected qualities:** Workflow Embeddedness.
- **Input needed:** Confirmation of V1.1 timeline and Slack App configuration.

### 5. DEFERRED Flip Stripe Live Keys and Publish Marketplace Listing
- **Why it matters:** Unblocks self-serve revenue.
- **Expected impact:** Unblocks monetization.
- **Affected qualities:** None directly (commercial milestone).
- **Input needed:** Owner to perform the flip and publish in Partner Center.

### 6. DEFERRED Implement Model Context Protocol (MCP) Server
- **Why it matters:** Enables ecosystem integrations.
- **Expected impact:** Improves Interoperability (+20 pts). Weighted readiness impact: +0.5%.
- **Affected qualities:** Interoperability.
- **Input needed:** Confirmation of V1.1 timeline and MCP SDK version.

### 7. DEFERRED Implement AWS/GCP Architecture Analysis
- **Why it matters:** Expands TAM to multi-cloud enterprises.
- **Expected impact:** Improves Differentiability (+10 pts). Weighted readiness impact: +0.5%.
- **Affected qualities:** Differentiability.
- **Input needed:** Confirmation of V1.1 timeline and AWS/GCP inventory script requirements.

### 8. DEFERRED Implement Automated Tenant Erasure Pipeline
- **Why it matters:** Satisfies enterprise data privacy requirements.
- **Expected impact:** Removes an enterprise adoption blocker.
- **Affected qualities:** Reliability.
- **Input needed:** Confirmation of V2 timeline and legal hold requirements.

### 9. DEFERRED Publish Third-Party Pen Test Summary
- **Why it matters:** Reduces security review friction.
- **Expected impact:** Removes a monetization blocker.
- **Affected qualities:** None directly.
- **Input needed:** Owner to execute vendor engagement and provide redacted summary.

### 10. DEFERRED Obtain SOC 2 Type II Report
- **Why it matters:** Essential for enterprise procurement.
- **Expected impact:** Removes a monetization blocker.
- **Affected qualities:** None directly.
- **Input needed:** Owner to engage CPA firm and complete examination.

### 11. Implement Shared-Database RLS Tier for Trial Tenants
- **Why it matters:** Reduces the massive baseline infrastructure cost of provisioning a dedicated SQL database for every self-serve trial signup.
- **Expected impact:** Directly improves Cost-Effectiveness (+15 pts) and Scalability (+5 pts). Weighted readiness impact: +0.3%.
- **Affected qualities:** Cost-Effectiveness, Scalability.
- **Actionable now.**
```text
Implement a shared-database, RLS-isolated tier for trial tenants.
1. Create a new `SystemWithSharedTrialCatalog` tenant isolation mode.
2. Modify the `TenantProvisioningService` to place new trial tenants into a shared database.
3. Ensure Row-Level Security (RLS) via `SESSION_CONTEXT` is strictly enforced for this shared catalog.
4. Provide a migration path for converting a trial tenant from the shared catalog to a dedicated catalog upon paid conversion.
Files: `ArchLucid.Persistence/Tenants/TenantProvisioningService.cs`, `ArchLucid.Persistence/Connections/SessionContextSqlConnectionFactory.cs`.
Constraints: Must not compromise data isolation between trial tenants.
```

### 12. Configure Tail-Based Trace Sampling for Authority Runs
- **Why it matters:** Ensures high-value business workflows are never dropped by head-based sampling in production.
- **Expected impact:** Directly improves Observability (+10 pts) and Supportability (+5 pts). Weighted readiness impact: +0.2%.
- **Affected qualities:** Observability, Supportability.
- **Actionable now.**
```text
Configure tail-based trace sampling for `ArchLucid.AuthorityRun` traces.
1. Since the .NET SDK doesn't support per-source sampling natively, implement a custom `Sampler` that checks the `Activity.DisplayName` or `ActivitySource.Name`.
2. If the source is `ArchLucid.AuthorityRun`, always return `SamplingResult.RecordAndSample`.
3. Otherwise, fall back to the configured fractional sampling ratio.
Files: `ArchLucid.Host.Core/Startup/ObservabilityTraceSamplingConfigurator.cs`.
Constraints: Must not impact the performance of high-volume, low-value traces.
```

### 13. Implement Full Idempotency for Create Run Endpoint
- **Why it matters:** Prevents duplicate runs on network retries, saving LLM costs and avoiding confusion.
- **Expected impact:** Directly improves Reliability (+5 pts) and Correctness (+2 pts). Weighted readiness impact: +0.2%.
- **Affected qualities:** Reliability, Correctness.
- **Actionable now.**
```text
Implement full idempotency for `POST /v1/architecture/request`.
1. Modify `ArchitectureRequest` processing to accept and validate the `Idempotency-Key` header.
2. Store the mapping of `(tenant, workspace, project, SHA-256(key))` to `runId` in a short-lived server-side store or SQL table.
3. If a request with the same key and payload fingerprint arrives, return 200 OK with the existing `runId` and `Idempotency-Replayed: true`.
4. If the payload fingerprint differs, return 409 Conflict.
5. Ensure thread safety and handle concurrent requests gracefully.
Files: `ArchLucid.Api/Controllers/ArchitectureController.cs`, `ArchLucid.Application/Runs/ArchitectureRunService.cs`.
Constraints: Do not break existing non-idempotent clients.
```

### 14. Add Redis Cache Coherency Checks
- **Why it matters:** Prevents stale data in multi-replica deployments.
- **Expected impact:** Directly improves Reliability (+3 pts) and Scalability (+2 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Reliability, Scalability.
- **Actionable now.**
```text
Add startup validation for Redis cache coherency.
1. In `ArchLucidConfigurationRules`, add a rule that checks if `HotPathCache:ExpectedApiReplicaCount > 1`.
2. If true, ensure that `HotPathCache:Provider` resolves to `Redis` and `HotPathCache:RedisConnectionString` is not empty.
3. If it resolves to `Memory`, log a strong warning or fail startup depending on the environment.
Files: `ArchLucid.Host.Composition/Configuration/ArchLucidConfigurationRules.cs`.
Constraints: Do not break single-replica deployments.
```

### 15. Optimize SQL Server JSON Payload Storage
- **Why it matters:** Prevents performance degradation with large manifests.
- **Expected impact:** Directly improves Performance (+5 pts) and Scalability (+3 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Performance, Scalability.
- **Actionable now.**
```text
Optimize the storage of large JSON payloads in SQL Server.
1. Review `GoldenManifestRepository` and `DecisionTraceRepository`.
2. Ensure that `PayloadJson` columns are using `NVARCHAR(MAX)` and are compressed if possible.
3. Consider adding a background job to compress older payloads or move them to Blob Storage if they exceed a certain size.
Files: `ArchLucid.Persistence.Data/Repositories/GoldenManifestRepository.cs`.
Constraints: Do not break existing queries that rely on `OPENJSON`.
```

### 16. Simplify Domain Vocabulary in Operator UI
- **Why it matters:** Reduces cognitive load for new users.
- **Expected impact:** Directly improves Cognitive Load (+10 pts) and Usability (+5 pts). Weighted readiness impact: +0.3%.
- **Affected qualities:** Cognitive Load, Usability.
- **Actionable now.**
```text
Simplify the domain vocabulary in the operator UI.
1. Ensure that "Architecture review" is used consistently instead of "Run" in primary headings and CTAs.
2. Add a tooltip or help text explaining the relationship between "Review", "Manifest", and "Trace".
3. Update `archlucid-ui/src/lib/layer-guidance.ts` to reflect these simplified terms.
Files: `archlucid-ui/src/components/LayerHeader.tsx`, `archlucid-ui/src/lib/layer-guidance.ts`.
Constraints: Do not change API route names or database column names.
```

### 17. Add Content Safety API Circuit Breaker
- **Why it matters:** Prevents the entire system from failing closed if the Content Safety API is down.
- **Expected impact:** Directly improves Reliability (+5 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Reliability.
- **Actionable now.**
```text
Add a circuit breaker for the Azure Content Safety API.
1. Wrap the Content Safety API calls in a Polly circuit breaker policy.
2. If the circuit is open, log an alert and either fail closed (if `FailClosedOnSdkError` is true) or fail open (if false).
3. Ensure the circuit state is observable via metrics.
Files: `ArchLucid.Application/Safety/ContentSafetyService.cs`.
Constraints: Must respect the `FailClosedOnSdkError` configuration.
```

### 18. Unify Authority and Coordinator Pipeline Logic
- **Why it matters:** Reduces orchestration complexity and bugs.
- **Expected impact:** Directly improves Maintainability (+5 pts) and Correctness (+2 pts). Weighted readiness impact: +0.2%.
- **Affected qualities:** Maintainability, Correctness.
- **Actionable now.**
```text
Refactor the Authority and Coordinator pipelines to share more common logic.
1. Identify duplicated state transition logic between `AuthorityRunOrchestrator` and the legacy coordinator endpoints (`execute`, `result`, `commit`).
2. Extract this logic into a shared `RunStateTransitionService`.
3. Ensure both paths use this service to validate preconditions before committing.
Files: `ArchLucid.Persistence/Orchestration/AuthorityRunOrchestrator.cs`, `ArchLucid.Application/Runs/ArchitectureRunService.cs`.
Constraints: Do not break existing API contracts.
```

### 19. Add Bulk Evidence Upload Progress Indicator
- **Why it matters:** Improves usability for large uploads.
- **Expected impact:** Directly improves Usability (+5 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Usability.
- **Actionable now.**
```text
Add a progress indicator for bulk evidence uploads in the operator UI.
1. Modify the upload component to track the progress of the `multipart/form-data` request.
2. Display a progress bar and estimated time remaining.
3. Handle partial successes gracefully by showing which files failed.
Files: `archlucid-ui/src/components/EvidenceUpload.tsx`.
Constraints: Must work with the existing `/v1/evidence/bulk` endpoint.
```

### 20. Enhance Advisory Scan Scheduling UI
- **Why it matters:** Makes it easier to configure automated scans.
- **Expected impact:** Directly improves Usability (+5 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Usability.
- **Actionable now.**
```text
Enhance the Advisory Scan Scheduling UI.
1. Add a cron expression builder component to the schedule creation form.
2. Display the next 5 scheduled run times based on the cron expression.
3. Allow operators to manually trigger a scheduled scan immediately for testing.
Files: `archlucid-ui/src/app/(operator)/advisory-scheduling/page.tsx`.
Constraints: Must use the existing `PUT /v1/advisory/schedules` endpoint.
```

### 21. Add Export-Only Trial State Warning
- **Why it matters:** Prevents data loss surprises for trial users.
- **Expected impact:** Directly improves Usability (+2 pts) and Supportability (+2 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Usability, Supportability.
- **Actionable now.**
```text
Add a prominent warning in the operator UI when a trial enters the export-only state.
1. Check the `TrialStatus` from `GET /v1/tenant/trial-status`.
2. If the status is `ExportOnly`, display a red banner indicating the number of days until hard purge.
3. Provide a clear CTA to export all artifacts and audit logs.
Files: `archlucid-ui/src/components/TrialBanner.tsx`.
Constraints: Must use the existing trial status API.
```

### 22. Implement Configurable Alert Routing Rules
- **Why it matters:** Reduces alert fatigue by routing alerts to the right teams.
- **Expected impact:** Directly improves Usability (+3 pts) and Workflow Embeddedness (+2 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Usability, Workflow Embeddedness.
- **Actionable now.**
```text
Enhance the Alert Routing UI to support more complex rules.
1. Allow operators to route alerts based on severity, finding type, or tags.
2. Update the `POST /v1/alert-routing` payload to accept these new routing criteria.
3. Ensure the backend evaluates these criteria before dispatching the alert.
Files: `archlucid-ui/src/app/(operator)/alert-routing/page.tsx`, `ArchLucid.Api/Controllers/AlertsController.cs`.
Constraints: Must be backward compatible with existing routing rules.
```

### 23. Add Policy Pack Conflict Resolution UI
- **Why it matters:** Helps operators understand why a policy was overridden.
- **Expected impact:** Directly improves Usability (+5 pts) and Explainability (+3 pts). Weighted readiness impact: +0.2%.
- **Affected qualities:** Usability, Explainability.
- **Actionable now.**
```text
Add a conflict resolution view to the Governance Resolution UI.
1. Consume the `conflicts` and `notes` arrays from `GET /v1/governance-resolution`.
2. Display a clear table showing which policy pack won the conflict and why (e.g., scope level).
3. Provide a link to edit the losing policy pack assignment.
Files: `archlucid-ui/src/app/(operator)/governance-resolution/page.tsx`.
Constraints: Must use the existing governance resolution API.
```

### 24. Optimize Audit Log CSV Export
- **Why it matters:** Prevents timeouts for large exports.
- **Expected impact:** Directly improves Performance (+5 pts) and Scalability (+2 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Performance, Scalability.
- **Actionable now.**
```text
Optimize the `GET /v1/audit/export` endpoint for large datasets.
1. Stream the CSV response directly from the database using `IAsyncEnumerable` or a `SqlDataReader`.
2. Avoid loading the entire dataset into memory before writing to the response stream.
3. Ensure the response has the correct `Content-Disposition` header for streaming downloads.
Files: `ArchLucid.Api/Controllers/Admin/AuditController.cs`, `ArchLucid.Persistence.Data/Repositories/AuditRepository.cs`.
Constraints: Must maintain the existing CSV format.
```

### 25. Add System Health Dashboard
- **Why it matters:** Improves observability for operators.
- **Expected impact:** Directly improves Observability (+5 pts) and Supportability (+3 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Observability, Supportability.
- **Actionable now.**
```text
Add a System Health dashboard to the operator UI.
1. Consume the `GET /health/live` and `GET /health/ready` endpoints.
2. Display the status of critical dependencies (SQL Server, Azure OpenAI, Redis).
3. Show the current version and uptime.
Files: `archlucid-ui/src/app/(operator)/health/page.tsx`.
Constraints: Must be accessible to users with `ReadAuthority`.
```

---

## Prompt Batching Guidance

To optimize context window usage and cost-effectiveness, batch the implementation of the actionable prompts as follows:

**Batch 1: Core Reliability, Observability & Cost (Backend)**
- Implement Shared-Database RLS Tier for Trial Tenants (11)
- Configure Tail-Based Trace Sampling for Authority Runs (12)
- Implement Full Idempotency for Create Run Endpoint (13)
- Add Redis Cache Coherency Checks (14)

**Batch 2: UI & Usability Enhancements (Frontend)**
- Simplify Domain Vocabulary in Operator UI (16)
- Add Bulk Evidence Upload Progress Indicator (19)
- Add Export-Only Trial State Warning (21)
- Add System Health Dashboard (25)

**Batch 3: Governance & Orchestration (Full Stack)**
- Unify Authority and Coordinator Pipeline Logic (18)
- Enhance Advisory Scan Scheduling UI (20)
- Implement Configurable Alert Routing Rules (22)
- Add Policy Pack Conflict Resolution UI (23)

**Batch 4: Data Management & Safety (Backend)**
- Optimize SQL Server JSON Payload Storage (15)
- Add Content Safety API Circuit Breaker (17)
- Optimize Audit Log CSV Export (24)

---

## Pending Questions for Later

**DEFERRED Implement Jira Integration**
- What is the exact target date for the V1.1 release window?
- Can you provide a Jira Developer instance and API credentials for testing?

**DEFERRED Implement ServiceNow Integration**
- When will the ServiceNow Developer Program instance be provisioned and credentials provided?

**DEFERRED Implement Microsoft Teams Integration**
- Do we have a test Microsoft Teams tenant and webhook configuration available?

**DEFERRED Implement Slack Integration**
- Has a Slack App been created in the workspace for testing, and are the OAuth tokens available?

**DEFERRED Flip Stripe Live Keys and Publish Marketplace Listing**
- When do you plan to complete the Partner Center seller verification, tax profile, and payout account setup?

**DEFERRED Implement Model Context Protocol (MCP) Server**
- Which specific version of the MCP SDK should we target for the V1.1 implementation?

**DEFERRED Implement AWS/GCP Architecture Analysis**
- Are there specific AWS/GCP accounts provisioned for testing the read-only inventory scripts?

**DEFERRED Implement Automated Tenant Erasure Pipeline**
- What are the specific legal hold requirements and the default quarantine delay (e.g., 30 days) for V2?
**DEFERRED Publish Third-Party Pen Test Summary**
- When will the vendor engagement be executed?

**DEFERRED Obtain SOC 2 Type II Report**
- What is the timeline for engaging a CPA firm?