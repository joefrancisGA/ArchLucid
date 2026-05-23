# ArchLucid Assessment – (A) Headline Readiness: 86.31%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding out-of-scope/deferred items.

## Executive Summary

**`(A)` Overall Headline Readiness:** ArchLucid V1 is highly capable and operates well within its scoped boundary. It excels in Proof-of-ROI, Reliability, and Supportability, largely thanks to recent integrations of executive cross-run dedup, persistent correlation IDs, and robust stream-based ZIP handling. The primary drag on its headline readiness is the Time-to-Value and Adoption Friction tied to the manual Azure extraction process.

**`(B)` Procurement/Market-Motion Realism:** The lack of a SOC 2 CPA attestation (currently relying on a self-assessment) remains a hurdle for enterprise procurement, acting as a hard gate for many. Furthermore, enterprise IT teams generally resist manual script execution and credential-less uploads, heavily preferring automated, continuous, role-based ingestion (Tier 2).

**Commercial Picture:** The product clearly demonstrates its financial value via the Executive ROI summary and robust pilot artifacts (DOCX/PDF). The pricing and cost controls are now better aligned with user expectations, as the persistent LLM budget badge and warning banners mitigate the risk of abrupt hard-stops disrupting trials. 

**Enterprise Picture:** The platform clearly targets Enterprise Architects and Platform Engineers. While the operator shell has seen usability boosts (e.g., buyer-default empty states, sample seed capabilities, and updated tour copy), the initial ingestion friction means that operators must still clear technical hurdles before fully exposing the product to sponsors. Explicit tenant isolation and Azure integration remain strong pillars.

**Engineering Picture:** The application architecture is exceptionally clean and well-structured, utilizing CQRS-like patterns, explicit domain boundaries, and solid persistence strategies. The custom orchestrator is heavily fortified with Polly-based retries and clear stall detection, minimizing the risk of fragile state transitions. Supportability is strong with excellent diagnostics, health probes, and audit logging.

## Deferred Scope Uncertainty
Some items deferred to V1.1 or V2 (e.g., automated continuous Tier 2 Azure ingestion, ServiceNow/Jira integrations, AWS/GCP multi-cloud analysis, MCP server capabilities) have explicit guidelines in `V1_DEFERRED.md`. However, specific UI/UX flows, IAM roles, and CMDB mapping specifics for these features are not yet fully mapped out in the documentation. 

## Weighted Quality Assessment

1. **Adoption Friction**
   - **Score:** 85 | **Weight:** 6 | **Weighted Impact:** 510
   - **Weighted Deficiency Signal:** 90
   - **Justification:** The sample seed and dry-run CLI tools help significantly, but the core requirement to execute a local PowerShell script to extract Azure data is inherently high-friction for new users.
   - **Tradeoffs:** Zero-credential ingestion (high trust) vs. automated continuous ingestion (low friction).
   - **Improvement Recommendations:** Create a unified CLI command that combines extraction and upload into a single step for technical operators, while planning for Tier 2 continuous ingestion.

2. **Time-to-Value**
   - **Score:** 88 | **Weight:** 7 | **Weighted Impact:** 616
   - **Weighted Deficiency Signal:** 84
   - **Justification:** The sample seed provides instant demo value, but for actual use cases, the manual extraction and upload process creates a delay before the first "aha" moment.
   - **Tradeoffs:** Security and trust via manual review vs. instant automated insights.
   - **Improvement Recommendations:** Enhance the UI to better guide users through the manual extraction steps with clear, copy-pasteable commands and instant upload capabilities.

3. **Usability**
   - **Score:** 78 | **Weight:** 3 | **Weighted Impact:** 234
   - **Weighted Deficiency Signal:** 66
   - **Justification:** Buyer-polished empty states and glossaries have improved the experience, but the interface remains fundamentally an "operator shell" that can be daunting for non-technical stakeholders.
   - **Tradeoffs:** Functionality and deep technical visibility vs. consumer-grade polish.
   - **Improvement Recommendations:** Add more prominent calls-to-action for exporting sponsor reports and navigating the comparison views.

4. **AI/Agent Readiness**
   - **Score:** 82 | **Weight:** 8 | **Weighted Impact:** 656
   - **Weighted Deficiency Signal:** 144
   - **Justification:** The custom orchestration is solid and LLM budget warnings are in place. However, relying on custom orchestration rather than a framework like Durable Task Framework introduces long-term state machine risks.
   - **Tradeoffs:** Avoiding external dependencies vs. leveraging proven orchestration frameworks.
   - **Improvement Recommendations:** Deepen telemetry on LLM token drift and add explicit "Idempotency-Replayed" responses to the API for clear execution state tracking.

5. **Maintainability**
   - **Score:** 84 | **Weight:** 2 | **Weighted Impact:** 168
   - **Weighted Deficiency Signal:** 32
   - **Justification:** The codebase is modular and well-tested, but keeping operator copy, architecture docs, and UI aligned requires constant vigilance.
   - **Tradeoffs:** Extensive documentation vs. the overhead of maintaining it.
   - **Improvement Recommendations:** Automate the synchronization of glossary terms and UI tooltips.

6. **Executive Value Visibility**
   - **Score:** 90 | **Weight:** 4 | **Weighted Impact:** 360
   - **Weighted Deficiency Signal:** 40
   - **Justification:** Cross-run ROI deduplication and executive dashboard panels provide excellent visibility. 
   - **Tradeoffs:** Executive exports vs. interactive dashboards.
   - **Improvement Recommendations:** Make the download paths for Executive ROI reports more prominent on the home dashboard.

7. **Reliability**
   - **Score:** 92 | **Weight:** 2 | **Weighted Impact:** 184
   - **Weighted Deficiency Signal:** 16
   - **Justification:** Zip stream reading, robust Polly retries, and comprehensive health checks provide a solid foundation. Server-side idempotency could be stricter.
   - **Tradeoffs:** Cache-based idempotency vs. strict database-backed idempotency logs.
   - **Improvement Recommendations:** Implement a strict SQL-backed idempotency key store for run creation.

8. **Proof-of-ROI Readiness**
   - **Score:** 92 | **Weight:** 5 | **Weighted Impact:** 460
   - **Weighted Deficiency Signal:** 40
   - **Justification:** High-quality DOCX/PDF exports with polished executive cover pages effectively communicate value.
   - **Tradeoffs:** Static artifact generation vs. dynamic reporting.
   - **Improvement Recommendations:** Add a visual comparison timeline for ROI across multiple runs.

9. **Supportability**
   - **Score:** 92 | **Weight:** 1 | **Weighted Impact:** 92
   - **Weighted Deficiency Signal:** 8
   - **Justification:** Excellent diagnostics, copyable correlation IDs, and ambient budget badges make troubleshooting straightforward.
   - **Tradeoffs:** None significant.
   - **Improvement Recommendations:** Provide a direct "Download Support Bundle" button in the UI settings.

## Top 12 Most Important Weaknesses
1. Manual PowerShell script execution is a high-friction hurdle for initial adoption.
2. The custom orchestration engine for long-running tasks carries long-term state machine risks.
3. True Server-Side Idempotency relies on transient cache rather than a durable SQL store.
4. The product leans heavily on static document exports over interactive, dynamic UI drill-downs for sponsors.
5. The operator shell lacks consumer-grade UX polish for non-technical stakeholders.
6. Tier 2 automated ingestion is explicitly deferred, limiting enterprise appeal.
7. Lack of public extension SDK limits ecosystem growth.
8. LLM cost estimation discrepancies can cause unexpected budget exhaustion despite UI warnings.
9. No cross-tenant analytics limits internal product learning.
10. The UI does not clearly indicate when an API request was handled via idempotency (replayed).
11. Error messages for rate-limiting (429) do not consistently use RFC 9457 Problem Details.
12. Sponsor exports (Scorecards, Value Reports) suffer from uneven discoverability from the main dashboard.

## Top 6 Monetization Blockers
1. Manual Azure extraction script severely hampers self-serve Team-tier trials.
2. Absence of a SOC 2 CPA attestation acts as a hard gate for large enterprise procurement.
3. Sponsor-facing export discoverability is somewhat buried in operator-centric menus.
4. Lack of continuous automated ingestion (Tier 2) makes the tool feel less like a permanent enterprise fixture.
5. While warnings exist, hitting hard LLM budget caps during a trial can prematurely stall proof-of-value.
6. The operator shell's technical density can intimidate non-engineering sponsors evaluating the tool.

## Top 6 Enterprise Adoption Blockers
1. Absence of SOC 2 CPA attestation (Type I/II).
2. Requirement to run a local PowerShell script (enterprises strongly prefer role-based automated ingestion).
3. The lack of interactive, live executive dashboards (relying instead on static exports).
4. Operate-mode IAM and governance enablement require deliberate configuration beyond the initial pilot wedge.
5. Absence of first-party ITSM connectors (Jira/ServiceNow) in the V1 GA release.
6. Difficulty in tracking multi-cloud (AWS/GCP) architectures in a unified view (deferred to V1.1).

## Top 6 Engineering Risks
1. Custom orchestration for long-running tasks risks fragility and limits built-in replayability.
2. Idempotency relies on cache rather than a strict server-side store, risking duplicate runs under heavy load.
3. LLM token cost drift between estimation and actual usage.
4. Concurrency limits on the pipeline execution driver could bottleneck under high load.
5. Expanding graph snapshot projections in-memory without a distributed cache could cause OOM issues at scale.
6. Maintaining tight alignment between operator-facing copy and architecture documentation as the UI evolves.

## Most Important Truth
ArchLucid V1 is a highly capable, technically sound architecture review engine. Its main constraint is not functional capability, but **ingestion friction**: the requirement to manually extract and upload Azure configurations blocks rapid, seamless time-to-value for enterprise users. Resolving this (or deeply streamlining the manual path) is the most critical step for broader adoption.

## Top Improvement Opportunities

1. **Create a Unified CLI Extract-and-Upload Command**
   - **Why it matters:** Reduces the two-step manual process (run script, upload zip) into a single streamlined CLI command.
   - **Expected impact:** Adoption Friction (+4-6 pts), Time-to-Value (+2-4 pts). Weighted readiness impact: +0.2-0.5%.
   - **Affected qualities:** Adoption Friction, Time-to-Value.
   - **Actionable:** Yes.
   - **Prompt:**
     ```text
     In the `ArchLucid.Cli` project, create a new command: `archlucid azure extract-and-upload --subscription <id>`. This command should invoke the existing `Get-ArchLucidAzurePackage.ps1` script locally, capture the resulting ZIP file, immediately upload it to `POST /v1/azure-extractor/upload`, and return the `runId`. Ensure appropriate API key authentication is used for the upload. Do not modify the underlying PowerShell script. Acceptance criteria: Operators can extract and upload in a single CLI command.
     ```

2. **Implement Tier 2 Continuous Azure Ingestion Setup UX and Backend**
   - **Why it matters:** Eliminates the manual PowerShell script hurdle for enterprise users, transitioning them to a continuous automated ingestion model.
   - **Expected impact:** Adoption Friction (+5-7 pts), Time-to-Value (+4-6 pts). Weighted readiness impact: +0.4-0.7%.
   - **Affected qualities:** Adoption Friction, Time-to-Value.
   - **Actionable:** Yes.
   - **Prompt:**
     ```text
     Implement the Tier 2 continuous Azure ingestion setup:
     
     FRONTEND:
     1. Create `archlucid-ui/src/app/(operator)/settings/cloud-connections/page.tsx` and add a "Connect Azure (Tier 2)" panel.
     2. The panel must display a copy-pasteable Azure CLI script (or Terraform snippet) that creates a Service Principal with `Reader` and `Cost Management Reader` roles scoped to a specified Subscription or Management Group, and configures Federated Identity Credentials matching this ArchLucid instance's OIDC issuer.
     3. Add a form for the operator to input the resulting `TenantId`, `ClientId`, and target `SubscriptionIds` (or Management Group IDs).
     
     BACKEND:
     4. Create `ArchLucid.Application/AzureExtractor/Tier2ConnectionService.cs` to securely store these connection details in a new `dbo.TenantCloudConnections` table.
     5. Create an API endpoint `POST /v1/azure-extractor/connections` to save this configuration, using Workload Identity Federation (no client secrets stored).
     
     Acceptance criteria: Operators can configure automated Tier 2 continuous ingestion via the UI without handling or pasting client secrets.
     ```

3. **Implement Strict SQL-Backed Server-Side Idempotency**
   - **Why it matters:** Prevents duplicate runs and wasted LLM tokens during aggressive network retries.
   - **Expected impact:** Reliability (+4-6 pts). Weighted readiness impact: +0.1-0.3%.
   - **Affected qualities:** Reliability, AI/Agent Readiness.
   - **Actionable:** Yes.
   - **Prompt:**
     ```text
     In `ArchLucid.Persistence.Data`, create a new `IdempotencyRecord` table and repository. Update `ArchitectureController` to check this table for the `Idempotency-Key` header combined with the tenant ID. If it exists, return the stored response. If not, proceed and store the result. Acceptance criteria: Duplicate requests with the same key are safely rejected or returned the cached response via SQL.
     ```

4. **Add "Download Sponsor Export" CTA to Review Detail Page**
   - **Why it matters:** Improves discoverability of the high-value executive reports.
   - **Expected impact:** Executive Value Visibility (+3-5 pts). Weighted readiness impact: +0.2-0.3%.
   - **Affected qualities:** Executive Value Visibility, Usability.
   - **Actionable:** Yes.
   - **Prompt:**
     ```text
     In `archlucid-ui/src/app/(operator)/runs/[id]/page.tsx` (Review Detail page), add a prominent, primary-styled button labeled "Download Sponsor Export (DOCX)" at the top of the Artifacts section. It should directly trigger the download for the `architecture-review-board` artifact. Acceptance criteria: The sponsor export is easily discoverable.
     ```

5. **DEFERRED - ServiceNow Outbound Integration**
   - **Reason:** Requires CMDB field mapping specifics and OAuth 2.0 flow designs.
   - **Input needed:** What are the exact `cmdb_ci` mapping rules and authentication flows required for the V1.1 ServiceNow connector?

6. **Add "Idempotency-Replayed" Header Flag to API Responses**
   - **Why it matters:** Helps clients and UI know when a request was safely retried.
   - **Expected impact:** Supportability (+2-4 pts). Weighted readiness impact: +0.05-0.1%.
   - **Affected qualities:** Supportability.
   - **Actionable:** Yes.
   - **Prompt:**
     ```text
     In `ArchLucid.Api`, when a request is served from the idempotency cache (or store), append an HTTP header `X-Idempotency-Replayed: true` to the response. Acceptance criteria: API clients can detect replayed responses.
     ```

7. **Show "Idempotency Replayed" Badge in UI**
   - **Why it matters:** Gives operators visual feedback that their retry was handled safely.
   - **Expected impact:** Usability (+2-3 pts). Weighted readiness impact: +0.1%.
   - **Affected qualities:** Usability.
   - **Actionable:** Yes.
   - **Prompt:**
     ```text
     In `archlucid-ui`, update the API interceptor to detect the `X-Idempotency-Replayed: true` header. When detected during a mutation (POST/PUT), display a small, non-intrusive toast saying "Request safely replayed". Acceptance criteria: Users see visual confirmation of idempotency.
     ```

8. **Standardize Rate-Limiting Error Messages (RFC 9457)**
   - **Why it matters:** Provides consistent API error handling for clients.
   - **Expected impact:** Supportability (+3-4 pts). Weighted readiness impact: +0.1%.
   - **Affected qualities:** Supportability.
   - **Actionable:** Yes.
   - **Prompt:**
     ```text
     In `ArchLucid.Api/Startup/RateLimitingExtensions.cs`, configure `OnRejected` to return a standard RFC 9457 Problem Details JSON (`type: "#rate-limit-exceeded"`, status 429), including the `Retry-After` header. Acceptance criteria: 429 errors follow the Problem Details format.
     ```

9. **Log LLM Cost Estimation Discrepancies**
   - **Why it matters:** Allows engineering to tune cost estimation models.
   - **Expected impact:** Maintainability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
   - **Affected qualities:** Maintainability.
   - **Actionable:** Yes.
   - **Prompt:**
     ```text
     In the LLM completion client (e.g., `AzureOpenAiCompletionClient`), add a structured `LogWarning` when the actual returned token count differs from the estimated token count by more than 15%. Include `runId` and `agentType`. Acceptance criteria: Cost discrepancies are visible in logs.
     ```

10. **Add Download Support Bundle Button to UI**
    - **Why it matters:** Makes it easier for users to gather diagnostics for support.
    - **Expected impact:** Supportability (+5-8 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Supportability.
    - **Actionable:** Yes.
    - **Prompt:**
      ```text
      In `archlucid-ui/src/app/(operator)/settings/page.tsx`, add a "Download Support Bundle" button that calls the existing diagnostic endpoint (or triggers the equivalent CLI command output) and downloads it as a ZIP. Acceptance criteria: Operators can easily download support logs.
      ```

11. **Expand OptInTour to Highlight Executive ROI**
    - **Why it matters:** Ensures new users immediately know where to find the highest-value commercial output.
    - **Expected impact:** Executive Value Visibility (+4-6 pts). Weighted readiness impact: +0.1-0.3%.
    - **Affected qualities:** Executive Value Visibility.
    - **Actionable:** Yes.
    - **Prompt:**
      ```text
      In `archlucid-ui/src/components/tour/OptInTour.tsx`, add a 7th step that points to the Executive ROI Summary panel on the Home dashboard, explaining its value for sponsors. Acceptance criteria: Tour highlights the ROI panel.
      ```

12. **DEFERRED - AWS/GCP Multi-Cloud Analysis UI**
    - **Reason:** Specific UI designs and extractor scripts for AWS/GCP are not yet defined for V1.1.
    - **Input needed:** What are the exact cloud provider selection UI designs and the AWS/GCP extraction script locations?

13. **Add "Review Complete" Email Notification Trigger**
    - **Why it matters:** Keeps operators informed without needing to actively poll the UI.
    - **Expected impact:** Usability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Usability.
    - **Actionable:** Yes.
    - **Prompt:**
      ```text
      In `ArchLucid.Application.Runs.Orchestration.AuthorityDrivenArchitectureRunCommitOrchestrator`, after a successful commit, dispatch a background job or event `ReviewCompletedEvent`. Add a simple handler that logs the intent to send a completion email (actual email integration can be wired to a provider later). Acceptance criteria: The system reacts to review completion events.
      ```

14. **Expose Azure Orphan Candidates on Home Dashboard**
    - **Why it matters:** Orphan candidates represent immediate, actionable cost savings.
    - **Expected impact:** Time-to-Value (+3-5 pts). Weighted readiness impact: +0.1-0.3%.
    - **Affected qualities:** Time-to-Value, Executive Value Visibility.
    - **Actionable:** Yes.
    - **Prompt:**
      ```text
      In `archlucid-ui`, update the Home dashboard to fetch and display the total number of "Orphan Candidates" and their estimated savings from the latest committed review's artifacts. Acceptance criteria: Orphan savings are visible on the dashboard.
      ```

15. **Implement Visual Diff View for Manifest JSON**
    - **Why it matters:** Helps technical operators quickly spot changes between runs.
    - **Expected impact:** Usability (+3-4 pts). Weighted readiness impact: +0.1%.
    - **Affected qualities:** Usability.
    - **Actionable:** Yes.
    - **Prompt:**
      ```text
      In `archlucid-ui`, on the Compare Reviews page, add a toggle to view the raw JSON diff of the two golden manifests using a standard JSON diff component. Acceptance criteria: Operators can see raw JSON diffs.
      ```

16. **DEFERRED - Interactive Cross-Tenant Portfolio Dashboard**
    - **Reason:** Cross-tenant analytics are explicitly deferred/out-of-scope for V1.
    - **Input needed:** What are the specific privacy and data aggregation rules for cross-tenant metrics?

17. **DEFERRED - Multi-Region Active/Active Topology**
    - **Reason:** V1.1 scope item requiring major infrastructure changes.
    - **Input needed:** Which Azure regions are targeted for active/active failover?

18. **Add Configuration Flag to Simulate LLM Budget Exhaustion**
    - **Why it matters:** Enables QA to easily test UI behavior when budget caps are hit.
    - **Expected impact:** Maintainability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Maintainability, Reliability.
    - **Actionable:** Yes.
    - **Prompt:**
      ```text
      In the LLM cost service, add a configuration flag `ArchLucid:Testing:SimulateLlmBudgetExhausted`. When true (and not in Production), immediately throw a budget exhausted exception. Acceptance criteria: QA can simulate hard stops.
      ```

19. **Export Knowledge Graph as High-Res PNG**
    - **Why it matters:** Allows users to easily share architecture diagrams in presentations.
    - **Expected impact:** Proof-of-ROI Readiness (+3-4 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Proof-of-ROI Readiness, Usability.
    - **Actionable:** Yes.
    - **Prompt:**
      ```text
      In `archlucid-ui`, on the Graph page, add an "Export as PNG" button that uses an HTML-to-canvas library to capture the currently rendered knowledge graph and trigger a download. Acceptance criteria: Users can download graph images.
      ```

20. **Surface Azure WAF Rule Alignments in Graph**
    - **Why it matters:** Provides immediate security value visibility.
    - **Expected impact:** Executive Value Visibility (+2-4 pts). Weighted readiness impact: +0.1%.
    - **Affected qualities:** Executive Value Visibility.
    - **Actionable:** Yes.
    - **Prompt:**
      ```text
      In `ArchLucid.KnowledgeGraph.DefaultGraphBuilder`, explicitly tag nodes that represent Azure WAF resources with a `WafAligned` property based on associated findings. The UI should render these nodes with a distinct border or icon. Acceptance criteria: WAF resources are easily identifiable in the graph.
      ```

21. **DEFERRED - Jira Outbound Integration**
    - **Reason:** ITSM shapes are V1.1 and need specific design mapping.
    - **Input needed:** What are the exact issue type mappings and custom field requirements for Jira?

22. **DEFERRED - Bulk Evidence Upload ZIP Expansion**
    - **Reason:** Explicitly marked as a V1.1 candidate in `V1_DEFERRED.md`.
    - **Input needed:** What are the recursion limits and file type allowlists for ZIP expansion?

23. **Create One-Click "Generate PDF" on Compare Page**
    - **Why it matters:** Allows sponsors to easily consume comparison reports offline.
    - **Expected impact:** Proof-of-ROI Readiness (+3-4 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Proof-of-ROI Readiness.
    - **Actionable:** Yes.
    - **Prompt:**
      ```text
      In `archlucid-ui`, on the Compare Reviews page, add a "Download PDF Report" button that calls the existing `POST /v1/architecture/comparisons/{id}/replay` endpoint with the PDF format specified. Acceptance criteria: Users can download comparison PDFs directly.
      ```

24. **Add Explicit Telemetry for Orchestrator Stall Detection**
    - **Why it matters:** Proactively alerts engineering to stalled runs before users complain.
    - **Expected impact:** Supportability (+4-6 pts). Weighted readiness impact: +0.1%.
    - **Affected qualities:** Supportability.
    - **Actionable:** Yes.
    - **Prompt:**
      ```text
      In `ArchLucid.Host.Core/Health/OrchestratorHealthCheck.cs`, when returning `HealthCheckResult.Degraded`, explicitly emit a structured `LogCritical` or OpenTelemetry event `orchestrator.stalled` including the count of stalled tasks. Acceptance criteria: Stalls generate distinct telemetry events.
      ```

25. **Add Visual "Idempotency-Replayed" Badge to Review Detail Header**
    - **Why it matters:** Clarifies state for operators directly on the main entity view.
    - **Expected impact:** Usability (+2-3 pts). Weighted readiness impact: +0.05%.
    - **Affected qualities:** Usability.
    - **Actionable:** Yes.
    - **Prompt:**
      ```text
      In `archlucid-ui/src/app/(operator)/runs/[id]/page.tsx`, if the review was created via an idempotency replay (passed via API metadata), display a small badge next to the Review ID saying "Replayed". Acceptance criteria: Users see replay status on the review page.
      ```

## Prompt Batching Guidance

- **Batch CLI-EXTRACT:** Improvement #1. High leverage for adoption; isolated to the CLI project.
- **Batch INGESTION-TIER2:** Improvement #2. Focuses on setting up automated Tier 2 Azure ingestion to drastically reduce onboarding friction.
- **Batch UI-DISCOVERABILITY:** Improvements #4, #11, #14, #23. Focuses on making existing valuable features (ROI, exports, orphans, PDFs) highly visible in the UI.
- **Batch API-RELIABILITY:** Improvements #3, #6, #8. Focuses on API contracts, rate limiting, and idempotency headers/storage.
- **Batch UI-SUPPORT:** Improvements #7, #10, #15, #19, #25. Focuses on UI feedback (idempotency toasts, JSON diffs, PNG exports, support bundles).
- **Batch TELEMETRY:** Improvements #9, #13, #18, #20, #24. Focuses on logging, simulated failures, WAF graph tags, and stall detection.

## Pending Questions for Later

- **DEFERRED - ServiceNow Outbound Integration:** What are the exact `cmdb_ci` mapping rules and authentication flows required for the V1.1 ServiceNow connector?
- **DEFERRED - AWS/GCP Multi-Cloud Analysis UI:** What are the exact cloud provider selection UI designs and the AWS/GCP extraction script locations?
- **DEFERRED - Interactive Cross-Tenant Portfolio Dashboard:** What are the specific privacy and data aggregation rules for cross-tenant metrics?
- **DEFERRED - Multi-Region Active/Active Topology:** Which Azure regions are targeted for active/active failover?
- **DEFERRED - Jira Outbound Integration:** What are the exact issue type mappings and custom field requirements for Jira?
- **DEFERRED - Bulk Evidence Upload ZIP Expansion:** What are the recursion limits and file type allowlists for ZIP expansion?
