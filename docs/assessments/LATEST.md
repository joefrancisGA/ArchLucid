# ArchLucid Assessment – (A) Headline Readiness: 84.41%

*This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, explicitly excluding items deferred to V1.1 or V2.*

## Executive Summary

**`(A)` Overall Headline Readiness**
ArchLucid is highly ready for its V1 core mission: moving from an architecture request to a committed, reviewable manifest. The foundational authority pipeline, golden manifest generation, and auditability are robust. By explicitly removing penalties for V1.1/V2 deferred scope (such as ITSM/Chat integrations, MCP, and AWS/GCP support), the assessment reflects a strong, focused V1 product. The primary gaps holding back the score are adoption friction (manual data ingestion), observability (head-based trace sampling), and cognitive load in the operator UI.

**`(B)` Procurement/Market-Motion Realism**
Procurement will face moderate friction. The absence of a CPA-issued SOC 2 Type II report and a published third-party pen test summary will trigger extended security reviews. The lack of a signed design partner or public reference customer may slow executive buy-in, though the sales-led pilot motion is well-supported.

**Commercial Picture**
The commercial foundation is solid for sales-led pilots, with strong proof-of-ROI reporting (first-value reports, sponsor DOCX). However, self-serve transactability is blocked because Stripe live keys and the Azure Marketplace listing are intentionally deferred to V1.1.

**Enterprise Picture**
Enterprise usability is good, aided by progressive disclosure in the UI. Enterprise adoption is supported by REST APIs, Azure DevOps integrations, and webhooks, though the requirement for customers to manually run a PowerShell script for Azure extraction introduces some onboarding friction that could be smoothed with better UX.

**Engineering Picture**
The engineering architecture is structurally sound, with clear boundaries between the API, Application, Decisioning, and Persistence layers. AI/Agent readiness is high. The main risks involve over-reliance on SQL Server for large JSON payloads, potential cache coherency issues in multi-replica setups without Redis, the complexity of maintaining parallel Authority and Coordinator pipelines, and observability gaps due to head-based trace sampling dropping high-value authority runs.

---

## Weighted Quality Assessment

Qualities are ranked from most urgent to least urgent based on their weighted deficiency (Weight × (100 - Score)).

### 1. Adoption Friction
- **Score:** 75
- **Weight:** 6
- **Weighted deficiency signal:** 150
- **Justification:** While the "Tier 1" access model (no vendor access to customer cloud) is great for security, requiring customers to manually run a PowerShell script (`Get-ArchLucidAzurePackage.ps1`) to extract Azure data introduces onboarding friction.
- **Tradeoffs:** Security/Trust vs. Ease of Onboarding.
- **Improvement recommendations:** Provide a more seamless UI-driven guide and 1-click copy functionality for running the extraction script. *(1-click copy shipped 2026-05-19 — Full Wizard step “Ingest Azure context”.)*

### 2. Correctness
- **Score:** 85
- **Weight:** 8
- **Weighted deficiency signal:** 120
- **Justification:** The authority pipeline and golden manifest are strong, but the lack of full idempotency on the `POST /v1/architecture/request` endpoint introduces a risk of duplicate runs during network retries.
- **Tradeoffs:** Implementation speed vs. Strict distributed systems guarantees.
- **Improvement recommendations:** Implement full idempotency using the `Idempotency-Key` header for the create run endpoint.

### 3. Time-to-Value
- **Score:** 85
- **Weight:** 7
- **Weighted deficiency signal:** 105
- **Justification:** The Core Pilot path is well-defined and fast, but the manual Azure extraction step delays the time it takes to get the first meaningful architecture review.
- **Tradeoffs:** Manual secure ingestion vs. Automated risky ingestion.
- **Improvement recommendations:** Streamline the ingestion of infrastructure declarations and context documents.

### 4. AI/Agent Readiness
- **Score:** 88
- **Weight:** 8
- **Weighted deficiency signal:** 96
- **Justification:** Strong agent orchestration and cost estimation. However, the `StagedCriticEnabled` feature adds batch wall-clock time, and the Content Safety API dependency could cause availability issues if it fails closed.
- **Tradeoffs:** Safety/Quality vs. Latency/Availability.
- **Improvement recommendations:** Implement a circuit breaker for the Content Safety API.

### 5. Usability
- **Score:** 80
- **Weight:** 3
- **Weighted deficiency signal:** 60
- **Justification:** Progressive disclosure helps, but the domain vocabulary imposes a high cognitive load, and trial expiration warnings are not prominent enough.
- **Tradeoffs:** Precise technical terms vs. Approachable user language.
- **Improvement recommendations:** Simplify the UI vocabulary and add clear visual indicators for trial expiration.

### 6. Proof-of-ROI Readiness
- **Score:** 90
- **Weight:** 5
- **Weighted deficiency signal:** 50
- **Justification:** Excellent built-in reporting (first-value report, pilot run deltas) that explicitly tracks time saved and LLM calls.
- **Tradeoffs:** None significant; this is a strong area.
- **Improvement recommendations:** Enhance the UI to make these reports even more prominent post-commit.

### 7. Executive Value Visibility
- **Score:** 88
- **Weight:** 4
- **Weighted deficiency signal:** 48
- **Justification:** The sponsor-shareable PDF and DOCX architecture packages are highly effective for executive visibility.
- **Tradeoffs:** Standardized reporting vs. Customizable templates.
- **Improvement recommendations:** Add visual indicators for trial expiration in PDF exports.

### 8. Workflow Embeddedness
- **Score:** 85
- **Weight:** 3
- **Weighted deficiency signal:** 45
- **Justification:** Judged strictly on V1 scope (REST APIs, Webhooks, Azure DevOps), the embeddedness is strong. (ITSM/Chat integrations are explicitly deferred to V1.1 and not penalized here).
- **Tradeoffs:** Core product focus vs. Ecosystem integration.
- **Improvement recommendations:** Add a "Test Connection" button for webhook subscriptions to improve the integration experience.

### 9. Differentiability
- **Score:** 90
- **Weight:** 4
- **Weighted deficiency signal:** 40
- **Justification:** The focus on governance, auditability, and the golden manifest differentiates ArchLucid from generic AI wrappers. (AWS/GCP support is explicitly deferred to V1.1 and not penalized here).
- **Tradeoffs:** Deep Azure integration vs. Broad multi-cloud appeal.
- **Improvement recommendations:** Continue deepening Azure-native governance features.

### 10. Decision Velocity
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Justification:** Features like "Compare two reviews" and "Ask" accelerate decisions, but the manual data ingestion slows down the initial velocity.
- **Tradeoffs:** Thorough analysis vs. Instant answers.
- **Improvement recommendations:** Improve the speed of the advisory scans.

### 11. Reliability
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Justification:** Solid single-region reliability with SQL Server and Polly retries.
- **Tradeoffs:** Cost/Complexity vs. High Availability.
- **Improvement recommendations:** Add Redis cache coherency checks for multi-replica deployments.

### 12. Cognitive Load
- **Score:** 70
- **Weight:** 1
- **Weighted deficiency signal:** 30
- **Justification:** The system has a complex architecture (Authority vs Coordinator, various snapshot types) that leaks into the operator experience.
- **Tradeoffs:** System flexibility vs. User simplicity.
- **Improvement recommendations:** Hide internal orchestration details from the standard operator UI.

### 13. Maintainability
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Justification:** Clean architecture boundaries, but maintaining both the Authority pipeline and the legacy Coordinator endpoints adds technical debt.
- **Tradeoffs:** Backward compatibility vs. Codebase simplicity.
- **Improvement recommendations:** Unify the state transition logic between the two pipelines.

### 14. Interoperability
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Justification:** Strong REST API and webhook support. (MCP is explicitly deferred to V1.1 and not penalized here).
- **Tradeoffs:** Core API stability vs. Standardized ecosystem protocols.
- **Improvement recommendations:** Ensure OpenAPI specifications remain strictly versioned.

### 15. Observability
- **Score:** 75
- **Weight:** 1
- **Weighted deficiency signal:** 25
- **Justification:** Strong metrics and dashboarding, but the reliance on head-based trace sampling in the .NET SDK means high-value authority run traces may be dropped in production unless an external OTLP collector is configured for tail sampling.
- **Tradeoffs:** Trace volume/cost vs. Debuggability of critical flows.
- **Improvement recommendations:** Provide a default OTLP collector configuration with tail sampling for `ArchLucid.AuthorityRun` traces, or implement a custom in-process sampler.

### 16. Explainability
- **Score:** 90
- **Weight:** 2
- **Weighted deficiency signal:** 20
- **Justification:** The `/v1/explain` endpoints, provenance graphs, and reasoning traces provide excellent explainability.
- **Tradeoffs:** Storage cost of traces vs. Transparency.
- **Improvement recommendations:** Add UI indicators for context ingestion warnings to explain why certain documents were ignored.

### 17. Template and Accelerator Richness
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Ships with 23 default policy packs, which is a great start.
- **Tradeoffs:** Curated defaults vs. Exhaustive frameworks.
- **Improvement recommendations:** Add a Markdown export for governance resolution to easily share policy decisions.

### 18. Scalability
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Supports multiple replicas, but relies heavily on SQL Server for large JSON payloads, which could become a bottleneck.
- **Tradeoffs:** Relational simplicity vs. NoSQL scalability.
- **Improvement recommendations:** Optimize SQL Server JSON payload storage.

### 19. Performance
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** Good use of `HotPathCache` and `LlmCompletionCache`.
- **Tradeoffs:** Memory usage vs. Response time.
- **Improvement recommendations:** Optimize the Audit Log CSV export to stream data and prevent timeouts.

### 20. Stickiness
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** The core architecture review loop is highly sticky once adopted. (ITSM/Chat integrations are explicitly deferred to V1.1 and not penalized here).
- **Tradeoffs:** Standalone value vs. Integrated value.
- **Improvement recommendations:** Enhance the policy pack conflict resolution UI to keep users engaged in the governance loop.

### 21. Supportability
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** Excellent support bundle CLI and correlation IDs.
- **Tradeoffs:** Data privacy vs. Diagnostic depth.
- **Improvement recommendations:** Add a System Health dashboard to the operator UI.

### 22. Testability
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** In-memory repositories enable fast contract tests.
- **Tradeoffs:** Test speed vs. Database fidelity.
- **Improvement recommendations:** Ensure in-memory repos maintain strict parity with SQL behavior.

---

## Top 12 Most Important Weaknesses

1. **Head-Based Trace Sampling Drops High-Value Traces:** The .NET SDK's head-based sampling means critical `ArchLucid.AuthorityRun` traces may be dropped in production without an external OTLP tail-sampling collector.
2. **High Cognitive Load of Domain Vocabulary:** Terms like Authority, Coordinator, Manifest, and Trace leak into the UI, confusing new operators.
3. **Over-reliance on SQL Server for Large Payloads:** Storing large JSON manifests and traces in SQL Server `NVARCHAR(MAX)` columns poses a scalability risk.
4. **Incomplete Idempotency on Mutating Endpoints:** The `POST /v1/architecture/request` endpoint lacks full idempotency, risking duplicate runs on network retries.
5. **Complex RBAC and Policy Pack Configuration:** The governance resolution and policy pack assignment logic is powerful but difficult to troubleshoot when conflicts occur.
6. **Potential Cache Coherency Issues:** Multi-replica deployments that fail to configure Redis may experience stale data issues.
7. **Content Safety API Dependency Risk:** If the Azure Content Safety API fails, the system may fail closed, impacting availability.
8. **Fragmented Orchestration:** Maintaining both the Authority pipeline and the legacy Coordinator endpoints increases technical debt and the risk of bugs.
9. **Manual Data Ingestion Friction (Azure Extractor UX):** Running the PowerShell script is secure but lacks a smooth, guided UI experience.
10. **Lack of Webhook Testing UI:** Operators cannot easily verify if their webhook subscriptions are correctly configured and reachable.
11. **Unclear Trial Expiration UX:** Trial users lack prominent visual warnings when their trial enters the read-only or export-only phases.
12. **Missing API Key Rotation UI for Enterprise Trust:** Enterprise admins need a self-serve way to rotate API keys without CLI access.

---

## Top 6 Monetization Blockers

1. **Stripe Live Keys and Marketplace Listing Deferred (V1.1):** Self-serve transactability is blocked because these are intentionally deferred.
2. **Trial to Paid Conversion Flow in TEST Mode:** The billing checkout flow is still running against Stripe TEST keys in production.
3. **Lack of Visual Trial Expiration Warnings in Exports:** Generated PDFs do not clearly indicate if they were produced during a trial that is about to expire.
4. **Missing API Key Rotation UI for Enterprise Trust:** Enterprise admins need a self-serve way to rotate API keys without CLI access.
5. **Unclear Data Archival Health Status for Compliance:** Operators cannot easily see if data retention policies are successfully executing.
6. **Lack of UI Toggle for Quality Gate Modes:** Admins need an easy way to switch between `WarnOnly` and `PilotStrict` without editing configuration files.

---

## Top 6 Enterprise Adoption Blockers

1. **Manual PowerShell Script Execution UX Friction:** Security and operations teams need a smoother, 1-click copy experience to run the Azure extractor.
2. **Complex Policy Pack Assignment Conflict Resolution:** Enterprise admins will struggle to understand why certain policies are effective without better conflict resolution UI.
3. **Lack of Webhook Connectivity Testing:** Integration teams cannot easily verify their event sinks.
4. **Missing Markdown Export for Governance Resolution:** Compliance teams need to easily export and share effective governance policies.
5. **Incomplete Idempotency on Architecture Requests:** Network retries from enterprise API gateways could trigger duplicate runs.
6. **Lack of UI Toggle for Quality Gate Modes:** Admins need an easy way to switch between `WarnOnly` and `PilotStrict` without editing configuration files.

---

## Top 6 Engineering Risks

1. **Trace Sampling Dropping High-Value Workflows:** Production environments using fractional sampling will lose visibility into core business workflows unless operators manually configure OTLP tail sampling.
2. **SQL Server Performance Degradation:** Large JSON payloads (manifests, traces) could cause database bloat and slow down queries.
3. **Lack of Full Idempotency on Create/Commit Endpoints:** Network instability could lead to duplicate architecture runs and wasted LLM spend.
4. **Cache Coherency Issues:** Deployments scaling beyond one replica without Redis configured will serve stale data.
5. **Content Safety API Fail-Closed Dependency:** A localized outage of the Azure Content Safety API could take down the entire ArchLucid deployment.
6. **Data Consistency Remediation is Manual:** Orphaned records detected by the consistency probe require manual intervention to quarantine or restore.

---

## Most Important Truth

ArchLucid has a strong, defensible core for architecture review and governance that is highly ready for V1. The most critical immediate tasks are ensuring high-value traces aren't dropped by sampling, smoothing the UX around data ingestion and governance resolution, and unifying the orchestration pipelines.

---

## Top Improvement Opportunities

### 1. Add 1-Click Copy for Azure Extractor PowerShell Script *(Completed 2026-05-19)*
- **Why it matters:** Reduces the friction of the manual Azure extraction process.
- **Expected impact:** Improves Adoption Friction (+5 pts) and Usability (+2 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Adoption Friction, Usability.
- **Completed.** Shipped in Full Wizard step “Ingest Azure context” (`WizardStepAzureContext`): pre-filled `Get-ArchLucidAzurePackage.ps1` command (operator scope tenant id → `-SubscriptionId`, `-IncludeCost`, `-OutputPath`) and **Copy to clipboard** (`data-testid="wizard-azure-ingest-copy"`).
```text
Add a 1-click copy button for the Azure Extractor PowerShell script in the operator UI.
1. Create a dedicated "Data Ingestion" or "Azure Extractor" tab in the New Review wizard.
2. Display the exact `Get-ArchLucidAzurePackage.ps1` command with the current tenant ID pre-filled.
3. Add a "Copy to Clipboard" button next to the command.
Files: `archlucid-ui/src/app/(operator)/reviews/new/NewRunWizardClient.tsx`, `archlucid-ui/src/components/wizard/steps/WizardStepAzureContext.tsx`, `archlucid-ui/src/lib/get-archlucid-azure-package-command.ts`.
Constraints: Ensure the copied command includes all necessary flags for the standard V1 extraction.
```

### 2. Expose Data Archival Health in Operator UI
- **Why it matters:** Gives operators visibility into whether data retention policies are successfully executing.
- **Expected impact:** Improves Supportability (+5 pts) and Observability (+2 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Supportability, Observability.
- **Completed.** Shipped on Governance Dashboard (`/governance/dashboard`): `DataArchivalDegradedBanner` on `ExecutiveWorkspaceHealthDashboard` consumes anonymous `GET /health/ready` (via `/api/proxy/health/ready`), parses the `data_archival` readiness entry, and shows an amber warning when status is `Degraded`. No banner when archival is disabled, the check is absent (API-only host), or readiness is unavailable.
```text
Expose the `DataArchivalHostHealthCheck` status in the operator UI.
1. Consume the `GET /health/ready` endpoint (summary readiness includes `data_archival` on worker hosts).
2. Parse the `data_archival` check status.
3. Display a warning banner on the Governance Dashboard if the archival health is `Degraded`.
Files: `archlucid-ui/src/app/(operator)/governance/dashboard/page.tsx`, `archlucid-ui/src/components/ExecutiveWorkspaceHealthDashboard.tsx`, `archlucid-ui/src/components/governance/DataArchivalDegradedBanner.tsx`, `archlucid-ui/src/lib/fetch-health-ready.ts`, `archlucid-ui/src/lib/health-dashboard-types.ts`.
Constraints: Must gracefully handle environments where data archival is disabled.
```

### 3. Implement Client-Side Handling for 402 Trial Limits
- **Why it matters:** Provides a clear upgrade path when users hit trial limits.
- **Expected impact:** Improves Usability (+5 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Usability.
- **Completed.** `throwApiRequestError` in `archlucid-ui/src/lib/api/http.ts` (re-exported from `api-client.ts`) opens `TrialLimitModalHost` on browser 402 responses when Problem Details include `trialReason` / `daysRemaining`; the request still throws so callers handle failure — read-only GETs are unaffected unless the API returns 402.
```text
Implement graceful client-side handling for HTTP 402 Payment Required responses.
1. Intercept 402 responses in the UI's API client.
2. Parse the `application/problem+json` body for `trialReason` and `daysRemaining`.
3. Display a modal or toast notification explaining the limit (e.g., "Trial limit reached") with a CTA to upgrade.
Files: `archlucid-ui/src/lib/api-client.ts`, `archlucid-ui/src/lib/api/http.ts`, `archlucid-ui/src/lib/trial-limit-problem.ts`, `archlucid-ui/src/lib/trial-limit-modal-bridge.ts`, `archlucid-ui/src/components/TrialLimitModal.tsx`.
Constraints: Must not block read-only operations.
```

### 4. Add Markdown Export for Governance Resolution
- **Why it matters:** Allows compliance teams to easily share effective governance policies.
- **Expected impact:** Improves Explainability (+5 pts) and Usability (+2 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Explainability, Usability.
- **Actionable now.**
```text
Add a Markdown export feature for the Governance Resolution UI.
1. Add an "Export to Markdown" button on the `/governance-resolution` page.
2. Generate a Markdown document summarizing the `EffectiveGovernanceResolutionResult`, including decisions, conflicts, and notes.
3. Trigger a file download for the generated Markdown.
Files: `archlucid-ui/src/app/(operator)/governance-resolution/page.tsx`.
Constraints: The export must clearly indicate that it is a point-in-time snapshot.
```

### 5. DEFERRED Flip Stripe Live Keys and Publish Marketplace Listing
- **Why it matters:** Unblocks self-serve revenue.
- **Expected impact:** Unblocks monetization.
- **Affected qualities:** None directly (commercial milestone).
- **Input needed:** Owner to perform the flip and publish in Partner Center.

### 6. Optimize Knowledge Graph Snapshot Serialization
- **Why it matters:** Reduces memory allocation during context ingestion.
- **Expected impact:** Improves Performance (+5 pts) and Scalability (+2 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Performance, Scalability.
- **Actionable now.**
```text
Optimize the serialization of `GraphSnapshot` objects.
1. Ensure `System.Text.Json` source generators are used for all graph node and edge types.
2. Review the `DefaultGraphBuilder` to minimize intermediate object allocations.
Files: `ArchLucid.KnowledgeGraph/Serialization/GraphJsonSerializerContext.cs`.
Constraints: Must maintain exact JSON schema compatibility.
```

### 7. Add "Test Connection" Button for Webhook Subscriptions
- **Why it matters:** Allows operators to verify their integrations immediately.
- **Expected impact:** Improves Interoperability (+5 pts) and Usability (+2 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Interoperability, Usability.
- **Actionable now.**
```text
Add a "Test Connection" button for webhook subscriptions.
1. Add a `POST /v1/webhooks/subscriptions/{id}/test` endpoint that fires a synthetic ping event.
2. Add a corresponding button in the operator UI's webhook configuration page.
3. Display the HTTP response code and body from the external webhook server.
Files: `ArchLucid.Api/Controllers/WebhooksController.cs`, `archlucid-ui/src/app/(operator)/digests/page.tsx`.
Constraints: Must respect the configured HMAC signing secret.
```

### 8. Implement Visual Indicator for Trial Expiration in PDF Exports
- **Why it matters:** Ensures executives reviewing exported PDFs are aware of the trial status.
- **Expected impact:** Improves Executive Value Visibility (+5 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Executive Value Visibility.
- **Completed.** `ArchitectureReviewExportService` loads tenant `TrialStatus`; when `Active`, `ArchitectureReviewPdfBuilder` adds footer text and a light cover watermark (`Generated during ArchLucid Trial`). Paid/converted tenants and non-active lifecycle phases omit the notice.
```text
Add a visual indicator for trial expiration in generated PDFs.
1. Check the `TrialStatus` when generating the Architecture Review Board PDF.
2. If the tenant is on an active trial, add a subtle watermark or footer note (e.g., "Generated during ArchLucid Trial").
Files: `ArchLucid.Application/Exports/ArchitectureReviewExportService.cs`, `ArchLucid.Application/Exports/ArchitectureReviewBoard/ArchitectureReviewPdfBuilder.cs`.
Constraints: Must not obscure the actual architecture content.
```

### 9. Add UI Toggle for AgentOutput:QualityGate:Mode
- **Why it matters:** Allows admins to easily enforce stricter quality gates.
- **Expected impact:** Improves Usability (+5 pts) and Manageability (+2 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Usability.
- **Completed.** `GET`/`PUT`/`DELETE /v1/admin/settings/agent-output-quality-gate-mode` (`SettingsController`, `AdminAuthority`) persist `AgentOutput.QualityGate.Mode` in `dbo.TenantSettings`; `IAgentOutputQualityGateOptionsResolver` applies tenant mode at runtime; tenant settings card toggles WarnOnly/PilotStrict.
```text
Add a UI toggle for the `AgentOutput:QualityGate:Mode` configuration.
1. Expose the current mode (`WarnOnly` or `PilotStrict`) via a new admin settings endpoint.
2. Add a toggle in the operator UI (under an Admin or Settings section) to switch between modes.
3. Persist the override in the database (e.g., `dbo.TenantSettings`) so it applies dynamically.
Files: `ArchLucid.Api/Controllers/Admin/SettingsController.cs`, `archlucid-ui/src/app/(operator)/settings/tenant/_sections/TenantQualityGatesCard.tsx`.
Constraints: Must require `AdminAuthority`.
```

### 10. Configure Default Purge for Stale Uncommitted Runs
- **Why it matters:** Prevents database bloat from abandoned architecture requests.
- **Expected impact:** Improves Scalability (+5 pts) and Maintainability (+2 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Scalability, Maintainability.
- **Actionable now.**
```text
Configure a default purge policy for stale uncommitted runs.
1. Update the production `appsettings.json` template to set `DataArchival:PurgeUncommittedRunsAfterDays` to a sensible default (e.g., 7 days).
2. Ensure the `DataArchivalCoordinator` correctly hard-deletes these rows.
Files: `ArchLucid.Api/appsettings.Production.json`.
Constraints: Must explicitly exclude demo/showcase runs from the purge.
```

### 11. Implement API Key Rotation UI for Enterprise Trust
- **Why it matters:** Enterprise admins need a self-serve way to rotate API keys without CLI access.
- **Expected impact:** Directly improves Usability (+5 pts) and Supportability (+2 pts). Weighted readiness impact: +0.1%.
- **Affected qualities:** Usability, Supportability.
- **Completed.** `GET`/`POST /v1/admin/settings/api-keys` (+ `/rotate`) expose masked segments and issue rotation material once; `/settings/api-keys` admin page; audit omits key material.
```text
Implement an API Key Rotation UI in the operator settings.
1. Create a new settings page for API Key Management (visible only to `AdminAuthority`).
2. Display the current status of `Authentication:ApiKey:Enabled` and the masked keys.
3. Provide a secure way to generate a new key and invalidate the old one.
Files: `archlucid-ui/src/app/(operator)/settings/api-keys/page.tsx`.
Constraints: Must securely handle key material and never log the raw keys.
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
- **Completed.** `architecture-review-vocabulary.ts` + `LayerHeader` Review/Manifest/Trace help; operator headings/CTAs and glossary use **Architecture review** (API `runId` unchanged).
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
- **Completed.** `BulkEvidenceUpload` uses XHR upload progress via `/api/proxy/.../evidence/bulk`; ETA + per-file partial failure list.
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
- **Completed.** `CronExpressionBuilder` + next-run preview; `/advisory-scheduling` renders schedules UI; **Run now (test)** via `POST .../schedules/{id}/run`.
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
- **Completed.** `TrialBanner` red export-only alert on all operator routes via `GET /v1/tenant/trial-status` (`daysRemaining` = days until purge).
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
- **Completed.** `routingCriteria` on `POST /v1/alert-routing-subscriptions`; `AlertRoutingMatcher` in dispatcher; UI filters on `/alert-routing` and alerts hub.
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
- **Completed.** `GovernanceConflictsTable` on `/governance-resolution` consumes `conflicts` and `notes`; loser links use `/policy-packs?packId=…`.
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

**Batch 1: Core Reliability, Observability & Trust (Backend)**
- Implement API Key Rotation UI for Enterprise Trust (11)
- Configure Tail-Based Trace Sampling for Authority Runs (12)
- Implement Full Idempotency for Create Run Endpoint (13)
- Add Redis Cache Coherency Checks (14)
- Configure Default Purge for Stale Uncommitted Runs (10)

**Batch 2: UI & UX Enhancements (Frontend)**
- ~~Add 1-Click Copy for Azure Extractor PowerShell Script (1)~~ *(completed 2026-05-19)*
- ~~Implement Client-Side Handling for 402 Trial Limits (3)~~ *(completed 2026-05-19)*
- Simplify Domain Vocabulary in Operator UI (16)
- Add Bulk Evidence Upload Progress Indicator (19)
- Add Export-Only Trial State Warning (21)

**Batch 3: Governance, Integration & Orchestration (Full Stack)**
- Add "Test Connection" Button for Webhook Subscriptions (7)
- Add Markdown Export for Governance Resolution (4)
- Unify Authority and Coordinator Pipeline Logic (18)
- Enhance Advisory Scan Scheduling UI (20)
- Implement Configurable Alert Routing Rules (22)
- Add Policy Pack Conflict Resolution UI (23)

**Batch 4: Data Management, Safety & Observability (Backend)**
- Optimize SQL Server JSON Payload Storage (15)
- Optimize Knowledge Graph Snapshot Serialization (6)
- Add Content Safety API Circuit Breaker (17)
- Optimize Audit Log CSV Export (24)
- ~~Expose Data Archival Health in Operator UI (2)~~ *(completed 2026-05-19)*
- Add System Health Dashboard (25)

---

## Pending Questions for Later

**DEFERRED Flip Stripe Live Keys and Publish Marketplace Listing**
- When do you plan to complete the Partner Center seller verification, tax profile, and payout account setup?
