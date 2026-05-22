> **Scope:** Canonical weighted V1 GA readiness assessment for coding agents and the owner — current `(A)` headline score and improvement backlog; not a buyer deliverable or historical archive.

# ArchLucid Assessment – (A) Headline Readiness: 82.05%

*This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`. Note: Explicitly deferred V1.1/V2 items—such as the Stripe Live Keys flip and Azure Marketplace 'Published' status—are tracked below for visibility but **do not penalize this score in any way**.*

## Executive Summary

### `(A)` Overall Headline Readiness
The solution stands at an 82.05% weighted readiness score for the V1 headline. The core agent orchestration, tenant isolation model (database-per-tenant), and the Tier 1 Azure Extractor pipeline are structurally sound and complete. The remaining deductions stem mainly from first-mile friction (local PowerShell execution policies for the Extractor) and UX polish (empty states, missing UI badges for illustrative pricing).

### `(B)` Procurement / Market-Motion Realism
From a buyer friction perspective, the absence of a CPA-issued SOC 2 Type I/II report and external third-party penetration test will act as substantial friction in InfoSec reviews. Furthermore, enterprise endpoints often block local PowerShell execution (`Get-ArchLucidAzurePackage.ps1`), which will require security exemptions and increase the time to first successful extraction for evaluators.

### Commercial Picture
The V1 commercial motion is well-defined as sales-led. Because the Stripe live keys flip and Azure Marketplace 'Published' status are intentionally deferred to V1.1 (owner-only actions), true self-serve credit-card revenue is gated. However, the trial funnel, pricing model, and reference customer processes provide a solid foundation for account executives and sales engineers to close initial pilot deals using manual quote-to-cash.

### Enterprise Picture
Enterprise readiness is a major strength. Database-per-tenant architecture, robust Row-Level Security (RLS) options, and comprehensive OIDC/SAML 2.0 integration paths drastically reduce architectural friction for integration. 

### Engineering Picture
The engineering foundation is highly constrained and resilient. Strict orchestration boundaries prevent destructive IaC operations, and DbUp migrations handle schema evolution cleanly. However, the reliance on a hand-rolled state machine for orchestrator logic introduces a maintainability overhead as multi-step agent logic scales. Furthermore, agent responses to API throttling require tight exponential backoff handling to maintain pipeline reliability.

---

## Weighted Quality Assessment

### 1. AI/Agent Readiness
- **Score:** 84
- **Weight:** 8
- **Weighted deficiency signal:** 128
- **Justification:** Agents are safely bounded and operate deterministically, walled off from emitting `destroy` or `apply` actions. However, hallucination risks around Terraform snippet generation (e.g., accidentally suggesting an unsupported attribute) require aggressive validation at the API boundary before presentation.
- **Tradeoffs:** Agent flexibility vs. strict output schema and safety validation.
- **Recommendations:** Implement a background `terraform fmt` and `terraform validate` pass on generated snippets before returning them to the UI, stripping or warning on invalid blocks.
- **Status:** Actionable now.

### 2. Time-to-Value
- **Score:** 78
- **Weight:** 7
- **Weighted deficiency signal:** 154
- **Justification:** While the Tier 1 Azure Extractor removes the need for vendor IAM credentials, requiring customers to execute a PowerShell script locally introduces environment-specific friction (execution policies, missing Azure modules).
- **Tradeoffs:** Zero-IAM access vs. script execution friction.
- **Recommendations:** Add a dedicated troubleshooting document and UI pre-flight checklist specifically for bypassing local PowerShell execution policies securely.
- **Status:** Actionable now.

### 3. Executive Value Visibility
- **Score:** 82
- **Weight:** 4
- **Weighted deficiency signal:** 72
- **Justification:** The architecture exposes pilot scorecards and per-run ROI, but rolling up these detailed technical findings into a CFO-friendly narrative requires cognitive effort. The platform lacks pre-built widget summaries explicitly mapping technical risks to high-level business impact categories on the dashboard.
- **Tradeoffs:** Deep technical analysis vs. executive narrative summarization.
- **Recommendations:** Implement pre-built UI dashboard widgets that categorize findings strictly by business impact (e.g., "Cost Waste," "Compliance Risk").
- **Status:** Actionable now.

### 4. Proof-of-ROI Readiness
- **Score:** 86
- **Weight:** 5
- **Weighted deficiency signal:** 70
- **Justification:** The system uses the Azure Retail Prices API for illustrative fallback, which is excellent. However, there is no explicit UI warning alerting the user when illustrative prices are being used instead of their actual EA negotiated rates, potentially skewing perceived ROI.
- **Tradeoffs:** Immediate cost visibility vs. precise EA pricing accuracy.
- **Recommendations:** Add a prominent UI badge/warning on cost artifacts when illustrative Azure Retail prices are used instead of actual extracted cost data.
- **Status:** Actionable now.

### 5. Adoption Friction
- **Score:** 80
- **Weight:** 6
- **Weighted deficiency signal:** 120
- **Justification:** Outstanding identity support (OIDC/SAML) and strong tenant isolation drastically reduce friction. Minor friction remains in the initial Extractor upload step if the ZIP file is slightly malformed or excessively large without clear client-side validation.
- **Tradeoffs:** Strict backend validation vs. client-side UX.
- **Recommendations:** Add a client-side `manifest.json` schema validation check before uploading the ZIP.
- **Status:** Actionable now.

### 6. Usability
- **Score:** 82
- **Weight:** 3
- **Weighted deficiency signal:** 54
- **Justification:** The operator UI is robust, but configuring policy packs and understanding their threshold impacts can be overwhelming for a first-time user without a "dry run" or impact simulation view.
- **Tradeoffs:** Configuration power vs. simplicity.
- **Recommendations:** Provide a UI "dry run" mode for policy packs to preview which existing resources would fail before enabling the policy.
- **Status:** Actionable now.

### 7. Maintainability
- **Score:** 75
- **Weight:** 2
- **Weighted deficiency signal:** 50
- **Justification:** The custom state machine handling the orchestration pipeline is complex. While moving to Durable Task Framework is appropriately deferred, the current state transitions require significant cognitive load to debug.
- **Tradeoffs:** Minimal dependencies vs. framework abstraction.
- **Recommendations:** Introduce detailed telemetry attributes tracking agent state transitions and retry rates to ease debugging.
- **Status:** Actionable now.

### 8. Reliability
- **Score:** 88
- **Weight:** 2
- **Weighted deficiency signal:** 24
- **Justification:** DbUp and SQL boundaries are rock solid. However, if the Azure OpenAI endpoint is degraded, the LLM completion pipeline must ensure aggressive exponential backoff to prevent cascading failures.
- **Tradeoffs:** Fast failure vs. patient retry.
- **Recommendations:** Enhance LLM completion retry policies specifically targeting 429 and 503 errors with exponential backoff logic.
- **Status:** Actionable now.

### 9. Supportability
- **Score:** 90
- **Weight:** 1
- **Weighted deficiency signal:** 10
- **Justification:** The append-only audit trail and diagnostic tools are excellent. Supportability is only missing a few minor edge-case logs and health checks.
- **Tradeoffs:** Exhaustive logging vs. storage efficiency.
- **Recommendations:** Expose DbUp migration status explicitly in the `/health` endpoint payload.
- **Status:** Actionable now.

---

## Top 12 Most Important Weaknesses

1. **Hallucinated Terraform Specifics:** Agents may emit valid HCL that contains hallucinated resource parameters, causing `terraform validate` failures for the user.
2. **Local PowerShell Friction:** Enterprise endpoint security policies block the `.ps1` extractor script, delaying time-to-value.
3. **Illustrative Pricing Ambiguity:** Users are not clearly warned when cost models use illustrative retail pricing instead of their actual EA rates.
4. **Policy Pack Opaqueness:** Operators cannot preview the blast radius of a policy pack before enabling it.
5. **LLM Throttling Resilience:** Insufficient exponential backoff on Azure OpenAI 429/503 responses can fail an entire review run.
6. **Executive Narrative Gap:** Dashboard lacks high-level business impact widgets summarizing the technical findings for CFOs.
7. **Client-Side Upload Validation:** Malformed Extractor ZIPs fail late on the backend rather than instantly on the frontend UI.
8. **Complex State Machine Debugging:** The custom orchestrator pipeline lacks granular state-transition telemetry, making it hard to maintain.
9. **Migration Visibility:** Pending DbUp migrations are not visible via standard health check endpoints, complicating deployments.
10. **Context Overflow in Ask Feature:** Natural language queries against large architecture graphs risk hitting token limits without better chunking.
11. **Retail API Circuit Breaker:** No explicit circuit breaker exists if the public Azure Retail Prices API becomes unreachable during analysis.
12. **Missing Export Audit Trails:** The UI does not provide clear visual cues of when an Extractor ZIP download event is audited.

---

## Top 6 Monetization Blockers

1. **DEFERRED: Stripe Live Keys Flip:** True self-serve revenue is blocked until the owner transitions the Stripe keys from TEST to Live (V1.1). *(Note: Does not penalize readiness score).*
2. **DEFERRED: Azure Marketplace Published Status:** The SaaS offer remains unpublished, preventing Marketplace-driven enterprise transactions (V1.1). *(Note: Does not penalize readiness score).*
3. **PowerShell Execution Friction:** Technical evaluators abandoning the trial because they cannot easily bypass corporate PowerShell execution policies to run the Extractor.
4. **Pricing Ambiguity in ROI:** The lack of UI warnings regarding illustrative pricing might cause a CFO to dispute the tool's ROI calculations during procurement.
5. **Executive Dashboard Deficits:** The inability to instantly show a non-technical buyer a summarized "Cost Waste" widget slows down the purchasing decision.
6. **Integration Validation Friction:** Evaluators can't quickly simulate webhooks without triggering full runs, stalling ITSM adoption.

---

## Top 6 Enterprise Adoption Blockers

1. **Endpoint Security Blocking Extractor:** InfoSec teams blocking the execution of arbitrary local PowerShell scripts.
2. **Policy Impact Uncertainty:** Risk teams will hesitate to enable governance policy packs without a dry-run feature to predict compliance failures.
3. **Local Context Overflow:** Natural language queries against massive graphs failing due to token limits.
4. **Illustrative Pricing Ambiguity:** Users are not clearly warned when cost models use illustrative retail pricing.
5. **Complex State Machine Debugging:** The custom orchestrator pipeline lacks granular state-transition telemetry, making it hard to maintain.
6. **Missing Export Audit Trails:** The UI does not provide clear visual cues of when an Extractor ZIP download event is audited.

---

## Top 6 Engineering Risks

1. **Terraform Apply Failures:** Emitting syntactically valid but functionally hallucinated Terraform degrades trust.
2. **LLM Cascade Failures:** A lack of strict exponential backoff during Azure OpenAI rate limiting could cause system-wide review failures.
3. **Context Window Exhaustion:** "Ask" queries against massive graphs failing due to token limits.
4. **Retail API Dependency:** Extracting costs halting entirely if the Azure Retail Prices API goes offline without a circuit breaker.
5. **Orchestrator State Corruption:** Without granular telemetry, debugging a stalled run in the custom state machine is incredibly difficult.
6. **Silent Migration Failures:** Pending database migrations causing subtle runtime bugs because they aren't exposed in health endpoints.

---

## Most Important Truth
ArchLucid is exceptionally well-architected for V1, utilizing safe agent boundaries and strong tenant isolation. The primary hurdles are no longer structural engineering flaws, but rather first-mile execution friction (running the local Extractor script) and the polishing of AI outputs (validating Terraform snippets, warning on illustrative pricing) to ensure absolute trust in the generated artifacts.

---

## Top Improvement Opportunities

1. **DEFERRED Stripe Live Keys Flip**
   - **Why it matters:** Required to transition from sales-led pilots to zero-touch self-serve credit-card revenue.
   - **Reason deferred:** Requires owner-only action in Stripe Dashboard to transition keys and verify tax profiles.
   - **Input needed:** Owner confirmation that Stripe live keys are ready to be enabled in production.

2. **DEFERRED Azure Marketplace Published Status**
   - **Why it matters:** Unlocks enterprise transactions via Azure Marketplace.
   - **Reason deferred:** Requires owner-only submission and verification in Microsoft Partner Center.
   - **Input needed:** Owner confirmation that the offer is set to 'Published'.

3. **Implement a webhook payload simulation endpoint**
   - **Why it matters:** Operators configuring ITSM/Teams webhooks need a way to test delivery without triggering a full architecture run.
   - **Expected impact:** Reduces setup friction for integrations.
   - **Affected qualities:** Usability (+3-5 pts), Time-to-Value (+2-3 pts). Weighted readiness impact: ~0.1%.
   - **Actionable now.**
   - **Prompt:**
     ```
     In `ArchLucid.Api`, add a new POST endpoint `/v1/integrations/webhooks/simulate`.
     This endpoint should accept a `WebhookDeliveryConfiguration` and send a synthetic `AuthorityRunCompleted` payload.
     Return the HTTP response code and body received from the target.
     Acceptance Criteria: Unit tests demonstrate that the synthetic payload is dispatched and the response is accurately returned to the caller.
     ```

4. **Add explicit SQL timeout for large Extractor ZIP uploads**
   - **Why it matters:** Very large environments can produce Extractor payloads that exceed the global 30s SQL command timeout during bulk insert.
   - **Expected impact:** Prevents timeout failures for large enterprise pilots.
   - **Affected qualities:** Reliability (+4-5 pts), Supportability (+2-3 pts). Weighted readiness impact: ~0.1%.
   - **Actionable now.**
   - **Prompt:**
     ```
     In `ArchLucid.Persistence.Data`, locate the repository method handling the bulk insert of Extractor payloads (e.g., `SaveAzureExtractorPackageAsync`).
     Override the global `Dapper` command timeout specifically for this method to 120 seconds.
     Acceptance Criteria: The code explicitly passes a higher `commandTimeout` parameter to the Dapper call for this specific operation.
     ```

5. **Implement Review Completion confirmation modal in UI**
   - **Why it matters:** After a review commits, operators aren't explicitly directed to the advanced analysis tools (Compare, Export, etc.).
   - **Expected impact:** Increases discovery of "Operate" tier features.
   - **Affected qualities:** Usability (+4-6 pts), Adoption Friction (+2-3 pts). Weighted readiness impact: ~0.1%.
   - **Actionable now.**
   - **Prompt:**
     ```
     In `archlucid-ui`, listen for the transition of a Review's status to `Committed` (or successful return from the commit API).
     Display a confirmation modal summarizing the findings count and providing deep links to the "Artifacts Export", "Compare", and "Knowledge Graph" views.
     Acceptance Criteria: The modal appears once upon commit success and accurately routes the user to the advanced views.
     ```

6. **Create troubleshooting guide for PowerShell execution policy bypass**
   - **Why it matters:** Directs users on how to safely run the Extractor script when blocked by corporate endpoint policies.
   - **Expected impact:** Reduces Time-to-Value by unblocking frustrated evaluators.
   - **Affected qualities:** Time-to-Value (+5-7 pts), Usability (+3-4 pts). Weighted readiness impact: ~0.12%.
   - **Actionable now.**
   - **Prompt:**
     ```
     Create a new markdown document at `docs/runbooks/EXTRACTOR_EXECUTION_POLICY_BYPASS.md`. 
     Detail the steps for a user to temporarily bypass PowerShell execution policies (e.g., using `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`) in a secure manner.
     Include warnings about organizational compliance.
     Update `docs/START_HERE.md` or `docs/runbooks/AZURE_EXTRACTOR_INGEST.md` to link to this new troubleshooting guide.
     Do not change the Extractor script itself.
     Acceptance Criteria: The document must provide clear, copy-pasteable PowerShell commands and explicitly state that it only affects the current process scope.
     ```

7. **Implement background `terraform validate` logic for advisory snippets**
   - **Why it matters:** Ensures emitted advisory IaC is syntactically valid and free of hallucinated resource names.
   - **Expected impact:** Drastically increases trust in agent outputs.
   - **Affected qualities:** AI/Agent Readiness (+5-8 pts), Reliability (+2-3 pts). Weighted readiness impact: ~0.15%.
   - **Actionable now.**
   - **Prompt:**
     ```
     Modify the Terraform advisory generation pipeline (likely within `ArchLucid.Decisioning` or `ArchLucid.ArtifactSynthesis`) to include a post-processing validation step.
     If local terraform binaries are unavailable, implement a regex-based strict syntax linter for basic HCL validity on the generated snippets.
     If invalid, the agent should strip the snippet and emit a warning comment instead.
     Do not introduce a hard dependency on the `terraform` CLI for the API host, but provide an interface `ITerraformValidator` with a robust fallback.
     Acceptance Criteria: Unit tests must demonstrate that malformed HCL is caught and sanitized before being committed to the manifest.
     ```

8. **Enhance LLM completion retry policies with exponential backoff**
   - **Why it matters:** Azure OpenAI 429 and 503 errors currently cause hard failures if not retried patiently.
   - **Expected impact:** Increases review pipeline reliability under API duress.
   - **Affected qualities:** Reliability (+4-6 pts). Weighted readiness impact: ~0.08%.
   - **Actionable now.**
   - **Prompt:**
     ```
     Locate the Azure OpenAI client registration or resilience policies (likely using Polly in `ArchLucid.Api` or `ArchLucid.Host.Composition`).
     Implement an exponential backoff retry policy specifically targeting HTTP 429 and 503 status codes.
     Configure the policy with a jittered exponential backoff (e.g., up to 3 retries, starting at 2 seconds).
     Acceptance Criteria: The resilience policy must be applied to the LLM completion HTTP client, and unit tests must verify the backoff timing.
     ```

9. **Add UI badge for Illustrative Azure Retail Pricing**
   - **Why it matters:** Prevents users from assuming the displayed ROI matches their exact EA discounts if cost data wasn't extracted.
   - **Expected impact:** Sets correct expectations and protects Proof-of-ROI credibility.
   - **Affected qualities:** Proof-of-ROI Readiness (+4-6 pts), Usability (+2-3 pts). Weighted readiness impact: ~0.1%.
   - **Actionable now.**
   - **Prompt:**
     ```
     In the `archlucid-ui` project, locate the components responsible for rendering cost estimates (e.g., within the Artifacts or Run Detail views).
     Add a distinct UI badge or warning banner when the `isIllustrativePricing` flag (or equivalent logic checking the presence of actual EA rates in the manifest) is true.
     The badge should read "Illustrative Retail Pricing" with a tooltip explaining that actual EA discounts may vary.
     Acceptance Criteria: The UI must clearly indicate when retail pricing is used, and a Storybook/unit test must verify the badge rendering condition.
     ```

10. **Implement Client-side `manifest.json` schema validation for ZIP uploads**
    - **Why it matters:** Fails fast on the client side before uploading a multi-megabyte ZIP file.
    - **Expected impact:** Improves UX and reduces unnecessary backend load.
    - **Affected qualities:** Adoption Friction (+3-5 pts), Usability (+3-4 pts). Weighted readiness impact: ~0.08%.
    - **Actionable now.**
    - **Prompt:**
        ```
        In the `archlucid-ui` project, update the Azure Extractor upload component.
        Before dispatching the POST request to `/v1/azure-extractor/upload`, use JSZip (or similar existing dependency) to peek into the ZIP archive.
        Read `manifest.json` and validate that the `schemaVersion` matches the expected format.
        If invalid, display a localized error message immediately.
        Acceptance Criteria: The UI must block the upload and show an error if `manifest.json` is missing or has an unsupported schema version.
        ```

11. **Expose DbUp migration status in the `/health` endpoint** *(Completed 2026-05-22)*
    - **Why it matters:** Operators need to know if the application is pending database schema updates.
    - **Expected impact:** Reduces support burden during upgrades.
    - **Affected qualities:** Supportability (+5-7 pts), Maintainability (+2-4 pts). Weighted readiness impact: ~0.06%.
    - **Completed.** `DbUpMigrationHealthCheck` compares embedded DbUp scripts against `dbo.SchemaVersions` and registers on `/health/ready` as `dbup_migration_status` (Degraded when migrations are pending).
    - **Status:** **Completed** (2026-05-22).
    - **Prompt:**
        ```
        In `ArchLucid.Api`, create a new `IHealthCheck` implementation named `DbUpMigrationHealthCheck`.
        It should query the database (using `DbUp` APIs or checking the `SchemaVersions` table directly) to verify if all required scripts have been applied.
        Register this health check on the `/health/ready` or `/health` endpoint.
        Acceptance Criteria: The health check must return `Healthy` when migrations are up to date and `Degraded` or `Unhealthy` if migrations are pending.
        ```

12. **Implement pre-built business impact widgets for the Dashboard**
    - **Why it matters:** Translates deep technical findings into CFO-friendly summaries.
    - **Expected impact:** Massively improves Executive Value Visibility.
    - **Affected qualities:** Executive Value Visibility (+5-8 pts). Weighted readiness impact: ~0.1%.
    - **Actionable now.**
    - **Prompt:**
        ```
        In `archlucid-ui`, add a new component `BusinessImpactSummaryWidget.tsx` to the main dashboard.
        It should aggregate findings from the `GET /v1/reports/executive-summary` (or pilot outcome APIs) into three distinct buckets: "Cost Waste," "Security/Compliance Risk," and "Reliability Gaps."
        Display these as high-level summary cards.
        Acceptance Criteria: The dashboard must successfully render these cards using data from the existing APIs, with zero visual layout breaks on empty states.
        ```

13. **Add detailed telemetry tracking for orchestrator state transitions**
    - **Why it matters:** Custom state machines are notoriously hard to debug without granular logs.
    - **Expected impact:** Slashes MTTR (Mean Time To Resolution) for orchestrator bugs.
    - **Affected qualities:** Maintainability (+4-6 pts), Supportability (+3-4 pts). Weighted readiness impact: ~0.08%.
    - **Actionable now.**
    - **Prompt:**
        ```
        In `ArchLucid.Worker` (specifically within `AuthorityRunOrchestrator`), add OpenTelemetry `ActivityEvent` calls for every major state transition.
        Log the `fromState`, `toState`, and `runId`.
        Also record a custom metric counter for `archlucid_orchestrator_transition_total` with tags for the state names.
        Acceptance Criteria: State transitions must be observable in OpenTelemetry traces and Prometheus metric endpoints.
        ```

14. **Implement circuit breaker for Azure Retail Prices API**
    - **Why it matters:** Prevents extraction tasks from hanging indefinitely if the public API goes down.
    - **Expected impact:** Protects system reliability.
    - **Affected qualities:** Reliability (+4-5 pts). Weighted readiness impact: ~0.06%.
    - **Actionable now.**
    - **Prompt:**
        ```
        Locate the HTTP client configuration for the Azure Retail Prices API (likely in `ArchLucid.Capabilities.Cost` or `ArchLucid.Host.Composition`).
        Add a Polly Circuit Breaker policy (e.g., break after 5 consecutive failures, break duration 30 seconds).
        Ensure the cost estimation logic falls back gracefully (e.g., omitting costs with a warning) when the circuit is open.
        Acceptance Criteria: Unit tests must simulate API failures, verify the circuit breaker trips, and ensure the pipeline continues without crashing.
        ```

15. **Add "Copy to Clipboard" button for generated Terraform snippets in UI**
    - **Why it matters:** Drastically improves operator UX when acting on recommendations.
    - **Expected impact:** Reduces Friction.
    - **Affected qualities:** Usability (+4-6 pts). Weighted readiness impact: ~0.05%.
    - **Actionable now.**
    - **Prompt:**
        ```
        In `archlucid-ui`, locate the component that renders the Terraform advisory snippets (e.g., `TerraformAdvisoryBlock.tsx` or similar).
        Implement a standard "Copy to Clipboard" button utilizing the `navigator.clipboard` API.
        Include a brief visual confirmation (e.g., a checkmark icon) upon successful copy.
        Acceptance Criteria: Users must be able to click the button and paste the exact snippet text.
        ```

16. **Create a UI "Dry Run" preview mode for Policy Packs**
    - **Why it matters:** Operators need to see the blast radius before enabling governance rules.
    - **Expected impact:** Reduces enterprise adoption hesitation.
    - **Affected qualities:** Usability (+5-7 pts), Adoption Friction (+2-4 pts). Weighted readiness impact: ~0.08%.
    - **Actionable now.**
    - **Prompt:**
        ```
        In the `archlucid-ui` Policy Packs configuration view, add a "Simulate Impact" or "Dry Run" button.
        When clicked, call an existing analysis or preview endpoint (or simulate on the frontend if rules are known) to display how many recent runs would have failed under this policy pack.
        If a backend endpoint doesn't exist, create a stub in `ArchLucid.Api` returning illustrative data for now, marked with a TODO.
        Acceptance Criteria: The UI must provide a modal or panel displaying the projected impact (e.g., "This will flag 12 existing resources").
        ```

17. **Implement context chunking strategy for "Ask" natural language queries**
    - **Why it matters:** Prevents token limit exhaustion when querying massive architecture graphs.
    - **Expected impact:** Improves AI feature reliability.
    - **Affected qualities:** AI/Agent Readiness (+4-6 pts), Reliability (+2-3 pts). Weighted readiness impact: ~0.1%.
    - **Actionable now.**
    - **Prompt:**
        ```
        In `ArchLucid.Retrieval` or the relevant Agent context ingestion logic, implement a token-aware text chunking utility.
        Before sending the graph representation to the LLM for the "Ask" feature, ensure the payload is split or truncated safely if it exceeds the configured maximum context window (e.g., 100k tokens).
        Acceptance Criteria: Unit tests must demonstrate that oversized graph representations are safely truncated or chunked without crashing the LLM client.
        ```

18. **Add explicit UI warning if uploaded Extractor ZIP exceeds expected size**
    - **Why it matters:** Large ZIPs can cause timeouts; warning the user manages expectations.
    - **Expected impact:** Better UX.
    - **Affected qualities:** Usability (+3-4 pts). Weighted readiness impact: ~0.04%.
    - **Actionable now.**
    - **Prompt:**
        ```
        In the `archlucid-ui` Extractor upload component, check the File size before uploading.
        If the file exceeds 50MB (or the configured safe limit), display a warning toast: "Large file detected. Processing may take longer than usual."
        Do not block the upload, only warn.
        Acceptance Criteria: The warning must appear correctly for files over the limit.
        ```

19. **Expose `RunId` prominently in all exported DOCX/PDF artifacts** *(Completed 2026-05-22)*
    - **Why it matters:** Correlating a printed report back to the system is currently difficult.
    - **Expected impact:** Enhances Supportability and Usability.
    - **Affected qualities:** Supportability (+3-5 pts), Usability (+2-3 pts). Weighted readiness impact: ~0.05%.
    - **Completed.** `ArchitectureReviewBoardExportTraceFooter` injects Run ID and Exported UTC into DOCX/PDF page footers; cover pages share the same export timestamp.
    - **Status:** **Completed** (2026-05-22).
    - **Prompt:**
        ```
        In `ArchLucid.Application` (specifically `ArchitectureReviewDocxBuilder` and `ArchitectureReviewPdfBuilder`), modify the cover page generation logic.
        Explicitly inject the `RunId` and `ExportTimestampUtc` into the document footer or cover page subtitle.
        Acceptance Criteria: Generated exports must clearly display the `RunId`.
        ```

20. **Add specific audit event for Extractor ZIP downloads** *(Completed 2026-05-22)*
    - **Why it matters:** Tracks exactly who is downloading sensitive infrastructure metadata.
    - **Expected impact:** Increases enterprise trust.
    - **Affected qualities:** Supportability (+4-6 pts). Weighted readiness impact: ~0.03%.
    - **Completed.** `GET /v1/azure-extractor/packages/{packageId}` serves scoped ZIP bytes and emits `Export.AzureExtractorPackageDownloaded`; `AUDIT_COVERAGE_MATRIX.md` updated.
    - **Status:** **Completed** (2026-05-22).
    - **Prompt:**
        ```
        In `ArchLucid.Api` where Extractor ZIPs are served to the user (e.g., a download endpoint), invoke the `IAuditService`.
        Log a new event type (e.g., `Export.AzureExtractorPackageDownloaded`) containing the user's ID, the package ID, and the RunId.
        Update `AUDIT_COVERAGE_MATRIX.md` to reflect this new event.
        Acceptance Criteria: Downloading the ZIP must reliably emit the durable audit event.
        ```

21. **Create an automated test simulating a corrupted Extractor ZIP upload** *(Completed 2026-05-22)*
    - **Why it matters:** Proves the system handles garbage data gracefully without throwing 500s.
    - **Expected impact:** Hardens reliability.
    - **Affected qualities:** Reliability (+2-4 pts), Supportability (+2-3 pts). Weighted readiness impact: ~0.03%.
    - **Completed.** `Upload_CorruptedZipFile_Returns400BadRequest` integration test; upload pre-check returns 400 for invalid ZIP archives.
    - **Status:** **Completed** (2026-05-22).
    - **Prompt:**
        ```
        In `ArchLucid.Integrations.AzureExtractor.Tests` or the API integration test suite, write a test case named `Upload_CorruptedZipFile_Returns400BadRequest`.
        Send a byte array of random data (not a valid ZIP) to the `POST /v1/azure-extractor/upload` endpoint.
        Assert that the endpoint returns a `400 Bad Request` and does not crash or log a critical unhandled exception.
        Acceptance Criteria: The test must pass and properly validate the error handling logic.
        ```

22. **Add detailed tooltips in the Policy Pack configuration UI**
    - **Why it matters:** Operators need clarity on what each threshold (e.g., High vs Medium severity) actually entails.
    - **Expected impact:** Improves usability.
    - **Affected qualities:** Usability (+4-5 pts). Weighted readiness impact: ~0.05%.
    - **Actionable now.**
    - **Prompt:**
        ```
        In `archlucid-ui`, locate the Policy Pack configuration screen.
        Add info-circle icons with tooltips next to key configuration thresholds (e.g., Severity Thresholds, Scope Assignments).
        The tooltips should briefly explain the impact of the setting based on `DEFAULT_POLICY_PACKS_V1.md` definitions.
        Acceptance Criteria: Tooltips render correctly without overlapping other UI elements.
        ```

23. **Provide a sample CSV/JSON of expected Extractor output in Docs**
    - **Why it matters:** Evaluators want to know exactly what data is collected before running the script.
    - **Expected impact:** Lowers adoption friction and builds trust.
    - **Affected qualities:** Adoption Friction (+3-5 pts). Weighted readiness impact: ~0.06%.
    - **Actionable now.**
    - **Prompt:**
        ```
        Create a new document at `docs/samples/AZURE_EXTRACTOR_SAMPLE_OUTPUT.md`.
        Include a heavily redacted, illustrative JSON snippet of what `manifest.json`, `resources.json`, and `cost-actual.json` look like.
        Link to this sample from `AZURE_EXTRACTOR_INGEST.md`.
        Acceptance Criteria: The document accurately reflects the schema generated by the script without exposing real data.
        ```

24. **Implement a "First-Run" guided tour pointing to API key setup**
    - **Why it matters:** New operators often struggle to find where to configure their first API key.
    - **Expected impact:** Speeds up Time-to-Value.
    - **Affected qualities:** Time-to-Value (+4-6 pts), Usability (+3-4 pts). Weighted readiness impact: ~0.1%.
    - **Actionable now.**
    - **Prompt:**
        ```
        In `archlucid-ui`, implement a lightweight "First-Run" banner or modal that checks if the user has any configured API keys (or simply shows on first login).
        The modal should say "Welcome to ArchLucid. To automate your reviews, set up your first API Key here," with a direct link to the Settings/Auth page.
        Acceptance Criteria: The banner/modal directs the user correctly and can be permanently dismissed.
        ```

25. **Add explicit API response headers indicating token usage**
    - **Why it matters:** Advanced operators need to monitor their LLM token usage closely for billing and quota purposes.
    - **Expected impact:** Enhances Supportability and Maintainability.
    - **Affected qualities:** Supportability (+4-5 pts). Weighted readiness impact: ~0.03%.
    - **Actionable now.**
    - **Prompt:**
        ```
        In `ArchLucid.Api`, implement an Action Filter or middleware that inspects the current request context for LLM token usage metrics (if available in the current scoped services).
        Append a custom HTTP header (e.g., `X-ArchLucid-Token-Usage`) to the response of any endpoint that triggers an LLM call.
        Acceptance Criteria: The header is present on relevant API responses containing accurate (or estimated) token counts.
        ```

---

## Prompt Batching Guidance

To optimize context window usage and cursor cost-effectiveness, execute the actionable prompts in the following batches:

   - **Batch 1 (High-Leverage UI & UX):** Prompts #5, #9, #10, #12, #15, #16, #18, #22, #24. (Focuses on `archlucid-ui` components, badges, validations, and guided tours). **[COMPLETED]**
- **Batch 2 (Core Reliability & Telemetry):** Prompts #3, #4, #8, #13, #14, #17, #25. (Focuses on `ArchLucid.Worker`, `ArchLucid.Api`, Polly retry policies, circuit breakers, and chunking strategies). **[COMPLETED]**
- **Batch 3 (Agent Safety & Documentation):** Prompts #6, #7, #23. (Focuses on Terraform validation, Extractor execution bypass docs, and sample outputs). **[COMPLETED]**
- **Batch 4 (Audit & Diagnostics):** Prompts #11, #19, #20, #21. (Focuses on DbUp health checks, DOCX builders, audit events, and API testing). **[COMPLETED]**

---

## Pending Questions for Later

- **DEFERRED Stripe Live Keys Flip**
  - Are the live keys available and is the Marketplace profile fully verified in Partner Center?
- **DEFERRED Azure Marketplace Published Status**
  - Is the SaaS offer successfully marked as 'Published'?
