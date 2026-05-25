# ArchLucid Assessment – (A) Headline Readiness: 82.49%

*This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding deferred items.*

## Executive Summary

### (A) Overall Headline Readiness
The platform is technically robust and secure, achieving an 82.49% headline readiness score. The core architecture review pipeline, multi-agent orchestration, and governance workflows are functional and well-tested. The primary gaps lie in the absence of a structured evaluation harness for agent outputs, friction in the initial zero-credential onboarding, and the need for deeper executive-level value summarization.

### (B) Procurement / Market-Motion Realism
Enterprise buyers will encounter friction due to the absence of a CPA-issued SOC 2 Type II report and third-party penetration test summaries (both explicitly deferred post-V1.1). However, the internal security baseline, RLS architecture, and self-attested SOC 2 mapping provide a strong defensive posture during vendor security reviews.

### Commercial Picture
The commercial foundation is solid, with clear ROI tracking and deduplication of findings. The main blocker to rapid expansion is the "Time-to-Value" delay caused by the manual PowerShell extraction process required for Tier-1 ingest, which extends the time before a prospect sees their first automated review.

### Enterprise Picture
Enterprise adoption is supported by strong tenant isolation, OIDC/SAML integration, and robust audit trails. The primary barrier for enterprise operators is the cognitive load required to configure policy packs and understand the complex orchestration state machine without visual "dry run" simulators.

### Engineering Picture
The engineering architecture is highly maintainable and reliable, built on SQL Server and DbUp migrations. The most significant engineering risk is the reliance on a custom state machine for long-running agent tasks, which lacks the resilience of a dedicated orchestration framework (like Durable Task Framework, deferred to V2) and requires careful handling of transient LLM API failures.

## Weighted Quality Assessment

*Ordered from most urgent to least urgent by weighted deficiency.*

### 1. Cutting-Edge AI Technology
- **Score:** 75 / 100
- **Weight:** 8
- **Weighted deficiency signal:** 200
- **Justification:** While the system utilizes Azure OpenAI (gpt-4o) and enforces structured output validation, it lacks an A/B testing framework for prompts, a structured evaluation harness (scoring rubric) for agent output quality, and streaming support for the Ask endpoint. It relies on a single primary and single fallback model.
- **Tradeoffs:** Deterministic control and fast simulator test cycles are prioritized over real-time LLM behavioral drift detection and interactive perceived latency.
- **Improvement recommendations:** Build a structured agent output evaluation harness to track scores over time and detect model/prompt regression. Add streaming support for the Ask endpoint.

### 2. Time-to-Value
- **Score:** 80 / 100
- **Weight:** 7
- **Weighted deficiency signal:** 140
- **Justification:** The initial pilot journey requires manual PowerShell execution for Tier-1 zero-credential ingest. While highly secure, this creates an operational barrier that delays the "aha moment" of seeing the first architecture review. The 7-step wizard adds to the initial setup time.
- **Tradeoffs:** High security (zero read-only cloud permissions) vs. immediate value realization.
- **Improvement recommendations:** Create a simplified, guided sandbox onboarding mode with a pre-populated sample environment to demonstrate value before requiring full Azure extraction setup.

### 3. AI/Agent Readiness
- **Score:** 85 / 100
- **Weight:** 8
- **Weighted deficiency signal:** 120
- **Justification:** The multi-agent authority pipeline, simulator, and LLM budget guards are shipped. However, the hard $75/month stop aborts real runs mid-pilot, and structured LLM estimate-vs-actual logging is missing.
- **Tradeoffs:** Budget hard caps protect COGS on trials but trade away "unlimited wow" during evaluation. Custom orchestration avoids DTF dependency but adds state machine complexity.
- **Improvement recommendations:** Implement structured LLM estimate-vs-actual logging. Add a QA flag to simulate budget exhaustion.

### 4. Adoption Friction
- **Score:** 82 / 100
- **Weight:** 6
- **Weighted deficiency signal:** 108
- **Justification:** REST, CLI, UI, SCIM, and DevOps surfaces provide robust integration. However, configuring policy packs requires high operator expertise. Legacy terminology ("Runs" vs "Reviews") in the UI confuses new users.
- **Tradeoffs:** Configuration power and strict backend validation vs. simplicity and ease of use.
- **Improvement recommendations:** Systematically rename "Runs" to "Reviews" across the React UI components. Build a visual "Policy Pack Builder" or "dry run" mode to preview policy impacts.

### 5. Maintainability
- **Score:** 82 / 100
- **Weight:** 4
- **Weighted deficiency signal:** 72
- **Justification:** The codebase is well-structured with clear interfaces and contract tests. However, the custom state machine handling the orchestration pipeline is complex and requires significant cognitive load to debug. Some boundary tests failing on legitimate code create CI noise.
- **Tradeoffs:** Strict separation of concerns and minimal dependencies vs. framework abstraction and boilerplate code.
- **Improvement recommendations:** Introduce detailed telemetry attributes tracking agent state transitions and retry rates to ease debugging. Add `[Trait("Category", "Quarantine")]` to noisy boundary tests.

### 6. Executive Value Visibility
- **Score:** 85 / 100
- **Weight:** 4
- **Weighted deficiency signal:** 60
- **Justification:** Cross-tenant portfolio summary and Executive ROI dashboard panel provide strong visibility. However, rolling up detailed technical findings into CFO-friendly narratives requires cognitive effort, and empty-state visuals are missing for fresh trials.
- **Tradeoffs:** Deep technical analysis for operators vs. executive narrative summarization.
- **Improvement recommendations:** Implement pre-built UI dashboard widgets that categorize findings strictly by business impact and add informative empty-state components.

### 7. Proof-of-ROI Readiness
- **Score:** 88 / 100
- **Weight:** 5
- **Weighted deficiency signal:** 60
- **Justification:** The Executive ROI summary endpoint and deduplication of findings provide clear value metrics. It uses Azure Retail Prices API for illustrative fallback, but lacks an explicit UI warning when illustrative prices are used instead of actual EA negotiated rates.
- **Tradeoffs:** Immediate cost visibility using standard retail pricing vs. precise EA pricing accuracy.
- **Improvement recommendations:** Add a prominent UI badge/warning on cost artifacts when illustrative Azure Retail prices are used instead of actual extracted cost data.

### 8. Reliability
- **Score:** 90 / 100
- **Weight:** 2
- **Weighted deficiency signal:** 20
- **Justification:** Solid V1 baseline: SQL Server persistence, health/live/ready probes, and append-only audit. The custom orchestrator handles transient failures, but if the Azure OpenAI endpoint is degraded, the LLM completion pipeline needs aggressive exponential backoff to prevent cascading failures.
- **Tradeoffs:** Fast failure vs. patient retry.
- **Improvement recommendations:** Enhance LLM completion retry policies specifically targeting 429 and 503 errors with exponential backoff logic.

### 9. Supportability
- **Score:** 92 / 100
- **Weight:** 1
- **Weighted deficiency signal:** 8
- **Justification:** Excellent diagnostics, correlation IDs, health checks, and append-only audit logs. LLM budget state is exposed via API and rendered in Settings, but persistent shell visibility is missing.
- **Tradeoffs:** Exhaustive logging vs. storage efficiency.
- **Improvement recommendations:** Add a persistent LLM budget badge to the operator shell so budget pressure is visible at any time.

## Top 12 Most Important Weaknesses
1. Lack of a structured evaluation harness to detect LLM behavioral drift and prompt regression over time.
2. High-friction, manual PowerShell execution required for the initial Tier-1 Azure extraction, delaying Time-to-Value.
3. Absence of streaming support in the Ask endpoint, resulting in poor perceived latency for interactive queries.
4. Custom orchestration state machine introduces fragility and high cognitive load for debugging compared to standard frameworks.
5. Hard $75/month LLM budget stop abruptly aborts real runs during pilots without graceful degradation.
6. Missing visual "dry run" simulators for policy packs, making governance configuration risky for operators.
7. Legacy terminology ("Runs" instead of "Reviews") in the UI creates cognitive dissonance during onboarding.
8. Lack of structured LLM estimate-vs-actual token logging hinders cost optimization and tuning.
9. Executive dashboards require cognitive effort to map technical findings to business impact.
10. Missing explicit UI warnings when illustrative Azure Retail prices are used instead of actual EA negotiated rates.
11. Empty states on dashboards look broken during fresh trials before data accumulates.
12. Noisy boundary tests failing on legitimate code reduce CI trust and developer velocity.

## Top 6 Monetization Blockers
1. Delayed "aha moment" due to manual extraction friction, causing prospects to abandon trials.
2. Hard budget stops aborting runs mid-pilot, preventing prospects from seeing the full value of the platform.
3. Lack of CFO-friendly, business-impact-categorized dashboard widgets to justify the purchase to economic buyers.
4. Missing EA discount multiplier adjustments in ROI calculations, reducing credibility with large enterprise finance teams.
5. Inability to easily demonstrate value via a guided sandbox without requiring full Azure setup.
6. Lack of a 'Business Value Cheat Sheet' mapping technical features directly to risk reduction and cost savings for sales teams.

## Top 6 Enterprise Adoption Blockers
1. High operator expertise required to write and safely deploy policy packs without a visual builder or dry-run mode.
2. Absence of CPA-issued SOC 2 Type II attestation (though deferred, it remains a friction point in procurement).
3. Complex custom orchestration state machine makes it difficult for enterprise support teams to debug stalled runs.
4. Lack of clear, in-app troubleshooting guides for bypassing local PowerShell execution policies securely during extraction.
5. Missing client-side validation for large or malformed ZIP uploads, leading to frustrating backend failures.
6. UI terminology inconsistencies ("Runs" vs "Reviews") that conflict with standard enterprise architecture nomenclature.

## Top 6 Engineering Risks
1. Silent LLM behavioral drift due to the lack of a structured evaluation harness and scoring rubric.
2. Cascading failures during Azure OpenAI degradation if exponential backoff is not aggressively enforced.
3. State machine fragility in the custom orchestrator, leading to stalled or orphaned agent tasks.
4. Hallucination risks in generated Terraform snippets (e.g., destructive actions) without hard-coded regex/AST validation.
5. CI fatigue and reduced trust due to noisy boundary tests failing on legitimate code.
6. Potential data loss or forensic gaps if blob storage for full prompts fails silently.

## Most Important Truth
The platform's core architecture and security model are enterprise-ready, but its commercial success is currently bottlenecked by the high friction of initial data ingestion and the lack of a structured evaluation harness to guarantee long-term AI reliability.

## Top Improvement Opportunities

1. **DEFERRED: Build a structured agent output evaluation harness**
   - **Why it matters:** Prevents silent LLM behavioral drift and ensures prompt changes don't degrade quality.
   - **Expected impact:** Drastically improves Cutting-Edge AI Technology and AI/Agent Readiness.
   - **Affected qualities:** Cutting-Edge AI Technology, AI/Agent Readiness.
   - **Input needed from user:** The specific scoring rubric and the reference input/output pairs to use as the golden cohort.

2. **Add streaming support for the Ask endpoint**
   - **Why it matters:** Improves perceived latency for interactive queries, making the AI feel more responsive.
   - **Expected impact:** Directly improves Cutting-Edge AI Technology (+5-8 pts), Time-to-Value (+2-4 pts). Weighted readiness impact: +0.5-0.8%.
   - **Affected qualities:** Cutting-Edge AI Technology, Time-to-Value.
   - **Actionable now:**
     ```text
     Please add Server-Sent Events (SSE) streaming support for the Ask endpoint in `ArchLucid.Api`.
     - Files to modify: `ArchLucid.Api/Controllers/AskController.cs`, `ArchLucid.Application/Services/AskService.cs`.
     - Acceptance criteria: The Ask endpoint should return an `IAsyncEnumerable<string>` or use `HttpResponse.Body.WriteAsync` to stream LLM tokens as they are generated.
     - Constraints: Maintain the existing non-streaming endpoint for backward compatibility if possible, or version the streaming endpoint. Do not change the underlying `ILlmProvider` interface if it already supports streaming; otherwise, add a streaming method to it.
     - Impact: Directly improves Cutting-Edge AI Technology (+5-8 pts), Time-to-Value (+2-4 pts). Weighted readiness impact: +0.5-0.8%.
     ```

3. **DEFERRED: Implement a guided sandbox onboarding mode with local mocks**
   - **Why it matters:** Allows prospects to experience the "aha moment" immediately without running PowerShell scripts.
   - **Expected impact:** Massively reduces Time-to-Value and Adoption Friction for trials.
   - **Affected qualities:** Time-to-Value, Adoption Friction.
   - **Input needed from user:** The exact mock data payload and the desired UX flow for the sandbox.

4. **Rename "Runs" to "Reviews" systematically across the React UI**
   - **Why it matters:** Aligns UI terminology with enterprise architecture standards, reducing cognitive load.
   - **Expected impact:** Directly improves Adoption Friction (+3-5 pts). Weighted readiness impact: +0.2-0.4%.
   - **Affected qualities:** Adoption Friction.
   - **Actionable now:**
     ```text
     Please systematically rename the term "Runs" to "Reviews" across the React UI components and routing namespaces in `archlucid-ui`.
     - Files to modify: `archlucid-ui/src/components/**/*`, `archlucid-ui/src/pages/**/*`, `archlucid-ui/src/routes.ts`.
     - Acceptance criteria: All user-facing text, button labels, and navigation links should use "Reviews" instead of "Runs".
     - Constraints: Do NOT change the underlying API payload keys or backend DTOs (e.g., keep `runId` in API requests). Only change the presentation layer.
     - Impact: Directly improves Adoption Friction (+3-5 pts). Weighted readiness impact: +0.2-0.4%.
     ```

5. **Implement structured LLM estimate-vs-actual logging**
   - **Why it matters:** Essential for tuning prompts and optimizing COGS.
   - **Expected impact:** Directly improves AI/Agent Readiness (+4-6 pts), Maintainability (+2-3 pts). Weighted readiness impact: +0.4-0.6%.
   - **Affected qualities:** AI/Agent Readiness, Maintainability.
   - **Actionable now:**
     ```text
     Please implement structured logging for LLM token estimates versus actual billed tokens in `ArchLucid.Application`.
     - Files to modify: `ArchLucid.Application/Services/Llm/LlmProvider.cs` (or equivalent provider implementation), `ArchLucid.Application/Telemetry/LlmMetrics.cs`.
     - Acceptance criteria: Every LLM call must log a structured event containing `EstimatedTokens`, `ActualTokens`, `ModelSku`, and `AgentType`.
     - Constraints: Do not block the critical path if logging fails. Ensure PII/prompts are NOT included in this specific metric log.
     - Impact: Directly improves AI/Agent Readiness (+4-6 pts), Maintainability (+2-3 pts). Weighted readiness impact: +0.4-0.6%.
     ```

6. **Add a QA flag to simulate budget exhaustion**
   - **Why it matters:** Allows developers to test the graceful degradation of the UI when the $75 hard stop is hit.
   - **Expected impact:** Directly improves AI/Agent Readiness (+2-4 pts), Reliability (+1-2 pts). Weighted readiness impact: +0.2-0.3%.
   - **Affected qualities:** AI/Agent Readiness, Reliability.
   - **Actionable now:**
     ```text
     Please add a configuration flag `SimulateBudgetExhaustion` to the LLM budget service.
     - Files to modify: `ArchLucid.Application/Configuration/LlmBudgetOptions.cs`, `ArchLucid.Application/Services/Llm/LlmBudgetService.cs`.
     - Acceptance criteria: When `SimulateBudgetExhaustion` is true, `LlmBudgetService` should immediately return a budget exhausted state, triggering the appropriate API responses and UI states.
     - Constraints: Ensure this flag is strictly disabled in production environments via `appsettings.Production.json` or environment variable checks.
     - Impact: Directly improves AI/Agent Readiness (+2-4 pts), Reliability (+1-2 pts). Weighted readiness impact: +0.2-0.3%.
     ```

7. **Add a prominent UI badge/warning for illustrative Azure Retail prices**
   - **Why it matters:** Prevents finance teams from rejecting the ROI summary due to perceived inaccuracies.
   - **Expected impact:** Directly improves Proof-of-ROI Readiness (+4-6 pts). Weighted readiness impact: +0.2-0.3%.
   - **Affected qualities:** Proof-of-ROI Readiness.
   - **Actionable now:**
     ```text
     Please add a prominent UI badge/warning on cost artifacts in `archlucid-ui` when illustrative Azure Retail prices are used.
     - Files to modify: `archlucid-ui/src/components/CostSummary/CostDashboard.tsx` (or equivalent).
     - Acceptance criteria: If the API response indicates fallback retail pricing was used (e.g., `isIllustrativePricing: true`), display a warning badge stating "Illustrative Retail Pricing - Does not reflect EA discounts".
     - Constraints: Do not alter the underlying calculation logic, only the presentation.
     - Impact: Directly improves Proof-of-ROI Readiness (+4-6 pts). Weighted readiness impact: +0.2-0.3%.
     ```

8. **DEFERRED: Implement pre-built UI dashboard widgets for business impact**
   - **Why it matters:** Translates technical findings into CFO-friendly narratives, crucial for executive sponsorship.
   - **Expected impact:** Drastically improves Executive Value Visibility.
   - **Affected qualities:** Executive Value Visibility.
   - **Input needed from user:** The specific mapping rules from technical finding IDs to business impact categories like "Cost Waste" or "Compliance Risk".

9. **Introduce detailed telemetry attributes for agent state transitions**
   - **Why it matters:** Reduces the cognitive load required to debug the custom orchestration state machine.
   - **Expected impact:** Directly improves Maintainability (+5-7 pts), Supportability (+2-4 pts). Weighted readiness impact: +0.3-0.5%.
   - **Affected qualities:** Maintainability, Supportability.
   - **Actionable now:**
     ```text
     Please add detailed OpenTelemetry attributes tracking agent state transitions and retry rates in the orchestrator.
     - Files to modify: `ArchLucid.Worker/Orchestration/AuthorityRunOrchestrator.cs`, `ArchLucid.Application/Telemetry/OrchestrationMetrics.cs`.
     - Acceptance criteria: State transitions (e.g., Pending -> Running -> Completed/Failed) must emit spans with attributes for `RunId`, `AgentType`, `AttemptCount`, and `DurationMs`.
     - Constraints: Use the existing `ActivitySource` defined for the application. Do not introduce new logging frameworks.
     - Impact: Directly improves Maintainability (+5-7 pts), Supportability (+2-4 pts). Weighted readiness impact: +0.3-0.5%.
     ```

10. **Add `[Trait("Category", "Quarantine")]` to noisy boundary tests**
    - **Why it matters:** Restores CI trust and developer velocity by silencing tests that fail on legitimate code.
    - **Expected impact:** Directly improves Maintainability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Maintainability.
    - **Actionable now:**
      ```text
      Please add the `[Trait("Category", "Quarantine")]` attribute to known noisy boundary tests.
      - Files to modify: Identify tests in `ArchLucid.Tests` or `ArchLucid.IntegrationTests` that frequently flap or fail on legitimate architectural boundaries.
      - Acceptance criteria: The identified tests should be marked with the Quarantine trait so they can be excluded from the primary blocking CI run.
      - Constraints: Do not delete the tests. Do not apply this to core business logic or correctness tests.
      - Impact: Directly improves Maintainability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
      ```

11. **Enhance LLM completion retry policies with exponential backoff**
    - **Why it matters:** Prevents cascading failures when Azure OpenAI is degraded.
    - **Expected impact:** Directly improves Reliability (+4-6 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Reliability.
    - **Actionable now:**
      ```text
      Please enhance the LLM completion retry policies in `ArchLucid.Application` to specifically target HTTP 429 and 503 errors with exponential backoff.
      - Files to modify: `ArchLucid.Host.Composition/Configuration/ResiliencePolicies.cs` (or where Polly policies are defined).
      - Acceptance criteria: The Polly retry policy for `ILlmProvider` clients must use `WaitAndRetryAsync` with an exponential backoff (e.g., 2s, 4s, 8s) specifically for `HttpRequestException` or `HttpResponseMessage` with status codes 429 and 503.
      - Constraints: Ensure the total retry duration does not exceed the overall orchestrator timeout for a single agent task.
      - Impact: Directly improves Reliability (+4-6 pts). Weighted readiness impact: +0.1-0.2%.
      ```

12. **Add a persistent LLM budget badge to the operator shell**
    - **Why it matters:** Ensures operators are always aware of budget pressure, preventing surprise run aborts.
    - **Expected impact:** Directly improves Supportability (+4-6 pts). Weighted readiness impact: +0.1%.
    - **Affected qualities:** Supportability.
    - **Actionable now:**
      ```text
      Please add a persistent LLM budget badge to the global navigation/header in `archlucid-ui`.
      - Files to modify: `archlucid-ui/src/components/Layout/Header.tsx` (or equivalent), `archlucid-ui/src/hooks/useLlmBudget.ts`.
      - Acceptance criteria: The header should display a small badge showing the current budget utilization percentage (e.g., "LLM Budget: 45%"). It should turn yellow at 75% and red at 90%.
      - Constraints: Cache the budget API response to prevent spamming the backend on every navigation.
      - Impact: Directly improves Supportability (+4-6 pts). Weighted readiness impact: +0.1%.
      ```

13. **DEFERRED: Implement a visual "Policy Pack Builder" or "dry run" mode**
    - **Why it matters:** Reduces the high operator expertise required to safely deploy governance policies.
    - **Expected impact:** Drastically improves Adoption Friction.
    - **Affected qualities:** Adoption Friction.
    - **Input needed from user:** The UX wireframes and the specific interaction model for building policy rules visually.

14. **Add informative empty-state components for all dashboard charts**
    - **Why it matters:** Prevents the dashboard from looking broken during a fresh trial, improving executive confidence.
    - **Expected impact:** Directly improves Executive Value Visibility (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Executive Value Visibility.
    - **Actionable now:**
      ```text
      Please implement informative empty-state components for all charts in the `archlucid-ui` dashboard.
      - Files to modify: `archlucid-ui/src/components/Dashboard/Charts/*.tsx`.
      - Acceptance criteria: When a chart has no data, it should display a visually appealing empty state with a clear call-to-action (e.g., "Run your first review to see compliance trends").
      - Constraints: Use existing UI library components (e.g., empty state illustrations) to maintain design consistency.
      - Impact: Directly improves Executive Value Visibility (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
      ```

15. **Ensure Tier 1 extractor documentation is prominent in onboarding**
    - **Why it matters:** Reduces friction by clearly guiding users through the mandatory manual extraction step.
    - **Expected impact:** Directly improves Time-to-Value (+2-4 pts). Weighted readiness impact: +0.1-0.3%.
    - **Affected qualities:** Time-to-Value.
    - **Actionable now:**
      ```text
      Please update the `archlucid-ui` onboarding flow to prominently feature the Tier 1 extractor documentation.
      - Files to modify: `archlucid-ui/src/components/Onboarding/WelcomeStep.tsx` (or equivalent).
      - Acceptance criteria: The first step of onboarding must include a highly visible link to the `Get-ArchLucidAzurePackage.ps1` documentation and a brief explanation of why it's required.
      - Constraints: Do not alter the actual wizard steps, only the introductory text/links.
      - Impact: Directly improves Time-to-Value (+2-4 pts). Weighted readiness impact: +0.1-0.3%.
      ```

16. **Provide clear examples for integrating the CLI into CI/CD**
    - **Why it matters:** Encourages enterprise adoption by showing how to automate the extraction process.
    - **Expected impact:** Directly improves Adoption Friction (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Adoption Friction.
    - **Actionable now:**
      ```text
      Please add clear examples for integrating the ArchLucid CLI into standard CI/CD pipelines (GitHub Actions, Azure DevOps) to the documentation.
      - Files to modify: `docs/integrations/CI_CD_EXAMPLES.md` (create if it doesn't exist), and link from `docs/CLI_USAGE.md`.
      - Acceptance criteria: Provide copy-pasteable YAML snippets for running the extractor and uploading the ZIP via the CLI in both GitHub Actions and Azure DevOps.
      - Constraints: Ensure the examples use secure secret management for API keys.
      - Impact: Directly improves Adoption Friction (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
      ```

17. **Add comprehensive unit tests for `ExecutiveRoiExportResponse`**
    - **Why it matters:** Ensures the CFO-facing ROI metrics are mathematically accurate and reliable.
    - **Expected impact:** Directly improves Proof-of-ROI Readiness (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Proof-of-ROI Readiness.
    - **Actionable now:**
      ```text
      Please add comprehensive unit tests for the `ExecutiveRoiExportResponse` mapping and calculation logic.
      - Files to modify: `ArchLucid.Tests/Application/Roi/ExecutiveRoiExportResponseTests.cs`.
      - Acceptance criteria: Tests must cover deduplication logic, sum aggregations, and edge cases with missing or zero-value findings.
      - Constraints: Use the existing mocking framework (e.g., Moq, NSubstitute) and follow the project's testing conventions.
      - Impact: Directly improves Proof-of-ROI Readiness (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
      ```

18. **Add comprehensive unit tests for `OrphanedAzureResourceFindingEngine`**
    - **Why it matters:** Guarantees that cost-saving recommendations are accurate, building trust with finance teams.
    - **Expected impact:** Directly improves Proof-of-ROI Readiness (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Proof-of-ROI Readiness.
    - **Actionable now:**
      ```text
      Please add comprehensive unit tests for the `OrphanedAzureResourceFindingEngine`.
      - Files to modify: `ArchLucid.Tests/Application/Engines/OrphanedAzureResourceFindingEngineTests.cs`.
      - Acceptance criteria: Tests must cover scenarios with attached/unattached disks, unassociated public IPs, and empty resource groups.
      - Constraints: Mock the underlying Azure resource graph or extractor data structures accurately.
      - Impact: Directly improves Proof-of-ROI Readiness (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
      ```

19. **Implement hard-coded regex and AST validation on generated Terraform**
    - **Why it matters:** Mitigates severe hallucination risks where an agent might suggest a destructive Terraform action (e.g., `destroy`).
    - **Expected impact:** Directly improves Reliability (+3-5 pts), Maintainability (+1-2 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Reliability, Maintainability.
    - **Actionable now:**
      ```text
      Please implement hard-coded regex validation on all generated Terraform snippets to flag or strip destructive actions.
      - Files to modify: `ArchLucid.Application/Validation/TerraformSnippetValidator.cs`.
      - Acceptance criteria: The validator must reject or flag any snippet containing `destroy`, `delete`, or `remove` blocks/commands. This validator must be called before the snippet is saved to the manifest.
      - Constraints: Ensure the validation is fast and does not require shelling out to the actual Terraform CLI.
      - Impact: Directly improves Reliability (+3-5 pts), Maintainability (+1-2 pts). Weighted readiness impact: +0.1-0.2%.
      ```

20. **Elevate Extractor `collectionTimestamp` into the Pilot Outcome Summary DTO**
    - **Why it matters:** Proves exactly when the Azure pricing baseline was collected, ensuring citation tracking for ROI.
    - **Expected impact:** Directly improves Proof-of-ROI Readiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Proof-of-ROI Readiness.
    - **Actionable now:**
      ```text
      Please elevate the Extractor `collectionTimestamp` directly into the `PilotOutcomeSummaryDto`.
      - Files to modify: `ArchLucid.Contracts/Dtos/PilotOutcomeSummaryDto.cs`, `ArchLucid.Application/Mapping/PilotOutcomeMapper.cs`.
      - Acceptance criteria: The DTO must include a `BaselineCollectionTimestampUtc` field, populated from the underlying extractor metadata.
      - Constraints: Do not break existing API contracts; add this as a new, optional field if necessary.
      - Impact: Directly improves Proof-of-ROI Readiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
      ```

21. **Add troubleshooting doc for bypassing local PowerShell execution policies**
    - **Why it matters:** Removes a common stumbling block for enterprise users trying to run the Tier-1 extractor.
    - **Expected impact:** Directly improves Adoption Friction (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Adoption Friction.
    - **Actionable now:**
      ```text
      Please add a dedicated troubleshooting section to the documentation for bypassing local PowerShell execution policies securely.
      - Files to modify: `docs/runbooks/AZURE_EXTRACTOR_TROUBLESHOOTING.md`.
      - Acceptance criteria: Provide clear instructions on using `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` to run the extractor without permanently altering machine security settings.
      - Constraints: Ensure the advice aligns with standard enterprise security guidelines.
      - Impact: Directly improves Adoption Friction (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
      ```

22. **Add client-side `manifest.json` schema validation check before ZIP upload**
    - **Why it matters:** Prevents frustrating backend failures and saves bandwidth by catching malformed uploads early.
    - **Expected impact:** Directly improves Adoption Friction (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Adoption Friction.
    - **Actionable now:**
      ```text
      Please add a client-side `manifest.json` schema validation check in `archlucid-ui` before uploading the extractor ZIP.
      - Files to modify: `archlucid-ui/src/components/Upload/ZipUploader.tsx`.
      - Acceptance criteria: The component should read the `manifest.json` inside the ZIP using a library like `jszip`, validate it against a basic schema (e.g., checking for required fields), and show an error immediately if invalid.
      - Constraints: Keep the validation lightweight so it doesn't freeze the browser on large ZIPs.
      - Impact: Directly improves Adoption Friction (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
      ```

23. **Create a 'Business Value Cheat Sheet' mapping technical features to ROI**
    - **Why it matters:** Equips sales teams and champions to sell the product to non-technical economic buyers.
    - **Expected impact:** Directly improves Executive Value Visibility (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Executive Value Visibility.
    - **Actionable now:**
      ```text
      Please create a 'Business Value Cheat Sheet' document mapping technical features to risk reduction and cost savings.
      - Files to modify: `docs/go-to-market/BUSINESS_VALUE_CHEAT_SHEET.md`.
      - Acceptance criteria: The document must include a table mapping features like "Pre-commit governance gates" and "Orphaned resource detection" to specific business outcomes (e.g., "Prevents compliance fines", "Reduces monthly Azure spend").
      - Constraints: Keep the language accessible to non-technical executives.
      - Impact: Directly improves Executive Value Visibility (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
      ```

24. **Add a configurable EA discount multiplier to the ROI summation logic**
    - **Why it matters:** Provides more accurate savings estimates for large enterprise buyers, increasing credibility.
    - **Expected impact:** Directly improves Proof-of-ROI Readiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Proof-of-ROI Readiness.
    - **Actionable now:**
      ```text
      Please add a configurable Enterprise Agreement (EA) discount multiplier to the ROI summation logic.
      - Files to modify: `ArchLucid.Application/Configuration/RoiOptions.cs`, `ArchLucid.Application/Services/Roi/RoiCalculationService.cs`.
      - Acceptance criteria: The service should multiply the illustrative retail savings by `(1 - EaDiscountPercentage)` if configured. The default discount should be 0.
      - Constraints: Ensure the multiplier is clearly logged and surfaced in the API response so clients know it was applied.
      - Impact: Directly improves Proof-of-ROI Readiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
      ```

25. **Introduce transparency logging for the ROI summation logic**
    - **Why it matters:** Allows operators to audit exactly how the total savings figure was calculated, building trust.
    - **Expected impact:** Directly improves Proof-of-ROI Readiness (+2-4 pts), Supportability (+1-2 pts). Weighted readiness impact: +0.1-0.2%.
    - **Affected qualities:** Proof-of-ROI Readiness, Supportability.
    - **Actionable now:**
      ```text
      Please introduce transparency logging for the ROI summation logic in `ArchLucid.Application`.
      - Files to modify: `ArchLucid.Application/Services/Roi/RoiCalculationService.cs`.
      - Acceptance criteria: The service must log a structured event detailing the sum of individual finding savings, the applied EA multiplier, and the final total.
      - Constraints: Use the standard `ILogger` interface. Do not log sensitive tenant data.
      - Impact: Directly improves Proof-of-ROI Readiness (+2-4 pts), Supportability (+1-2 pts). Weighted readiness impact: +0.1-0.2%.
      ```

## Prompt Batching Guidance
To optimize context window usage and cost-effectiveness, batch the actionable prompts as follows:
- **Batch 1 (UI Terminology & Polish):** Prompts 4, 7, 12, 14. These touch React components and UI presentation logic.
- **Batch 2 (LLM & Reliability):** Prompts 5, 6, 9, 11. These focus on the orchestrator, LLM provider, and Polly retry policies.
- **Batch 3 (ROI & Testing):** Prompts 17, 18, 20, 24, 25. These involve the ROI calculation services, DTOs, and their corresponding unit tests.
- **Batch 4 (Validation & Extractor):** Prompts 19, 22. These focus on validation logic (Terraform AST and client-side ZIP validation).
- **Batch 5 (Documentation):** Prompts 15, 16, 21, 23. These are purely markdown documentation updates.
- **Batch 6 (Streaming):** Prompt 2. This is a significant architectural change to the API and should be run in isolation.
- **Batch 7 (CI Maintenance):** Prompt 10. This touches test project configuration and should be run in isolation to ensure CI stability.

## Pending Questions for Later
- **DEFERRED: Build a structured agent output evaluation harness**
  - What is the specific scoring rubric we should use for evaluating agent outputs?
  - Where are the reference input/output pairs that should form the golden cohort?
- **DEFERRED: Implement a guided sandbox onboarding mode with local mocks**
  - What exact mock data payload should we use for the sandbox?
  - What is the desired UX flow for transitioning from the sandbox to a real Azure extraction?
- **DEFERRED: Implement pre-built UI dashboard widgets for business impact**
  - What are the specific mapping rules from technical finding IDs to business impact categories (e.g., "Cost Waste", "Compliance Risk")?
- **DEFERRED: Implement a visual "Policy Pack Builder" or "dry run" mode**
  - Are there existing UX wireframes for the visual policy builder?
  - What is the expected interaction model for simulating a "dry run" against existing architecture data?
