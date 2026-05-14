# ArchLucid Assessment – Weighted Readiness 78.13%

## 2. Executive Summary
- **Overall Readiness:** The core agent pipeline (`RealAgentExecutor`, `StagedCritic`) and the baseline API contracts are structurally mature. The primary barriers to V1 GA success are related to the operator onboarding experience and the predictability of LLM behavior under edge cases.
- **Commercial Picture:** Proof-of-ROI exists via the Azure Extractor (`Get-ArchLucidAzurePackage.ps1`) and Terraform generation, but the value is locked inside artifacts rather than surfaced aggressively. Adoption friction remains high due to SQL and OIDC prerequisite knowledge.
- **Enterprise Picture:** Security (RLS, Private Endpoints) and Compliance (78 typed audit events) are exceptionally strong. Enterprise friction centers on self-service troubleshooting, particularly when debugging generic OIDC configuration failures without support intervention.
- **Engineering Picture:** The system has excellent circuit breaking and LLM quota tracking (`LlmCompletionAccountingClient`). However, non-deterministic correctness remains the highest weighted risk, necessitating stricter constraints on LLM outputs and explicit tests for destructive behavior.

## 3. Weighted Quality Assessment

**1. Adoption Friction**
- **Score:** 65
- **Weight:** 6
- **Weighted deficiency signal:** 210
- **Justification:** Bootstrapping requires manual JSON config manipulation (`appsettings.json`) for SQL strings, Azure OpenAI endpoints, and OIDC parameters. This creates a steep learning curve for trials.
- **Tradeoffs:** Full enterprise control vs. fast time-to-first-run.
- **Improvement recommendations:** Build interactive CLI bootstrapping wizards and surface OIDC diagnostic endpoints.
- **Status:** Fixable in V1.

**2. Correctness**
- **Score:** 75
- **Weight:** 8
- **Weighted deficiency signal:** 200
- **Justification:** Agents rely heavily on non-deterministic LLM responses. `AgentResultParser` enforcing schema on parse is strong, but semantic correctness and safety (e.g., never emitting `terraform destroy`) require relentless testing.
- **Tradeoffs:** Generative flexibility vs. strict rule enforcement.
- **Improvement recommendations:** Add explicit string-search guardrail tests for Terraform output and deterministic fallback manifests when schema parsing repeatedly fails.
- **Status:** Fixable in V1.

**3. Proof-of-ROI Readiness**
- **Score:** 75
- **Weight:** 5
- **Weighted deficiency signal:** 125
- **Justification:** Financial value is extracted via PowerShell and attached to artifacts (`cost-actual.json`), but is not the headline metric on the Run Detail dashboard.
- **Tradeoffs:** Deep technical analysis vs. executive summarization.
- **Improvement recommendations:** Build a prominent UI component that calculates and displays annualized savings directly from the artifact payload.
- **Status:** Fixable in V1.

**4. AI/Agent Readiness**
- **Score:** 85
- **Weight:** 8
- **Weighted deficiency signal:** 120
- **Justification:** The pipeline is mature (`LlmCompletionAccountingClient`, staged critic), but context truncation for massive Azure subscriptions could still overwhelm models.
- **Tradeoffs:** Sending full context vs. intelligent dropping.
- **Improvement recommendations:** Ensure token truncation is aggressively tested against edge-case subscription sizes.
- **Status:** Fixable in V1.

**5. Usability**
- **Score:** 70
- **Weight:** 3
- **Weighted deficiency signal:** 90
- **Justification:** Operator cognitive load is high, particularly around governance JSON policies, quality gate thresholds, and simulator vs real execution modes.
- **Tradeoffs:** Powerful configuration vs. simple interfaces.
- **Improvement recommendations:** Add inline help tooltips to policy editors, surface quality gates in settings, and explicitly flag Simulator mode.
- **Status:** Fixable in V1.

**6. Workflow Embeddedness**
- **Score:** 80
- **Weight:** 3
- **Weighted deficiency signal:** 60
- **Justification:** First-party connectors (Jira, ServiceNow, Slack, Confluence) are in scope. However, operators lack visibility into the live health/sync status of these outbound channels.
- **Tradeoffs:** Asynchronous fire-and-forget vs. synchronous status checks.
- **Improvement recommendations:** Implement a `/health` endpoint specific to ITSM integrations.
- **Status:** Fixable in V1.

**7. Commercial Packaging Readiness**
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Justification:** `[RequiresCommercialTenantTier]` exists, but trial downgrade paths and hard LLM budget cutoffs lack refined UX handling.
- **Tradeoffs:** Hard enforcement vs. soft warnings.
- **Improvement recommendations:** Finalize UX behavior for LLM hard-cutoff triggers.
- **Status:** Fixable in V1.

**8. Customer Self-Sufficiency**
- **Score:** 60
- **Weight:** 1
- **Weighted deficiency signal:** 40
- **Justification:** Debugging OIDC mismatches or SQL migration failures requires reading container logs, which mid-market buyers struggle with.
- **Tradeoffs:** Secure default logging vs. verbose troubleshooting.
- **Improvement recommendations:** Provide API endpoints to test/validate Identity Provider metadata.
- **Status:** Fixable in V1.

**9. Explainability**
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Justification:** The Knowledge Graph exists, but the exact LLM reasoning (`ReasoningTrace`) that inferred specific edges is not surfaced deeply in the UI.
- **Tradeoffs:** UI clean design vs. deep transparency.
- **Improvement recommendations:** Inject reasoning snippets directly into the node metadata panels.
- **Status:** Fixable in V1.

**10. Interoperability**
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Justification:** Good OIDC and SCIM baseline. Custom agent handlers are promised in documentation but the physical boundary isn't crystallized.
- **Tradeoffs:** Tightly coupled code vs. external webhook architecture.
- **Improvement recommendations:** Finalize the custom agent boundary model.
- **Status:** Fixable in V1.

**11. Security**
- **Score:** 90
- **Weight:** 3
- **Weighted deficiency signal:** 30
- **Justification:** Exceptional baseline with `ArchLucidTenantScope` RLS, private endpoints, and strict policies.
- **Tradeoffs:** High friction deployment.
- **Improvement recommendations:** Continue aggressive test automation on destructive script generation.
- **Status:** Better suited for V1.1/V2.

**12. Compliance Readiness**
- **Score:** 90
- **Weight:** 2
- **Weighted deficiency signal:** 20
- **Justification:** 78 typed events and strong durable audit logging (`IAuditService`). Minor gaps in executive reporting formats.
- **Tradeoffs:** Engineering effort vs. GRC convenience.
- **Improvement recommendations:** Add PDF export for the Compliance Drift dashboard.
- **Status:** Fixable in V1.

**13. Stickiness**
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** ITSM hooks make the product sticky once deployed, but getting to deployment is the hurdle.
- **Tradeoffs:** N/A.
- **Improvement recommendations:** Improve webhook payload customization.
- **Status:** Fixable in V1.1.

**14. Performance**
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** The system runs well on `HotPathCache` memory, but the Redis distributed projection is deferred to V2.
- **Tradeoffs:** Complexity vs. Scale.
- **Improvement recommendations:** Determine baselines for the V2 Redis architecture.
- **Status:** Fixable in V1.

**15. Observability**
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** OpenTelemetry and Serilog are wired correctly. However, Staged Critic introduces wall-clock delays that need explicit tracing visibility.
- **Tradeoffs:** Trace cardinality vs. insight.
- **Improvement recommendations:** Wrap Staged Critic phases in explicit OpenTelemetry spans.
- **Status:** Fixable in V1.

## 4. Top 12 Most Important Weaknesses
1. Bootstrapping and Trial Configuration (SQL/OIDC) requires deep manual JSON editing, destroying momentum.
2. The risk of the system hallucinating destructive `terraform destroy` commands is unacceptable for enterprise trust.
3. Financial ROI is calculated but buried inside artifact JSON files instead of driving the UI narrative.
4. Troubleshooting OIDC/Entra ID failures requires access to raw container logs, blocking self-serve onboarding.
5. Operators lack real-time visibility into the health of critical ITSM outbound syncs (Jira/ServiceNow).
6. Quality Gate strictness parameters are hidden in config rather than visible to operators in the UI.
7. Operators may confuse `Simulator` mode behavior with broken agent logic if not explicitly warned.
8. The exact reasoning an LLM used to connect components is not surfaced in the Knowledge Graph UI.
9. Costly replay evaluations can be triggered without the user seeing the `CostEstimator` warning first.
10. Wall-clock delays introduced by the `StagedCritic` are not cleanly demarcated in APM traces.
11. The boundaries for customer-authored custom agent handlers remain undefined.
12. Multi-tenant LLM hard-cutoff logic lacks defined UX paths when a tenant maxes out their budget mid-run.

## 5. Top 6 Monetization Blockers
1. Friction in the initial installation and SQL/IdP bootstrapping causes trial abandonment.
2. Missing a prominent, auto-calculated "Annualized Savings" KPI component in the Run Detail view.
3. Difficulties in debugging OIDC configurations prevent mid-market customers from completing SSO setup.
4. Users executing runs in `Simulator` mode might falsely conclude the AI is weak, losing the sale.
5. Inability to easily copy/paste the Tier 2 Azure Extractor script natively from the UI slows down proof-of-value.
6. Ambiguity regarding the UX behavior when a trial hits the `LlmMonthlyTenantDollarBudget` limits.

## 6. Top 6 Enterprise Adoption Blockers
1. Fear of the agent pipeline accidentally generating destructive (`destroy`) infrastructure-as-code scripts.
2. Opaque status of ITSM connectors; enterprise operators need a dedicated health-check ping.
3. High cognitive load required to understand and write JSON schema policies for governance.
4. Lack of transparent visibility into the exact LLM `ReasoningTrace` for inferred architecture edges.
5. The inability to quickly export Compliance Drift metrics to a portable format like PDF for executives.
6. Confusion surrounding what is expected of the customer to implement custom agent handlers.

## 7. Top 6 Engineering Risks
1. A prompt injection or hallucination leading to a `terraform destroy` escaping the `ArtifactSynthesis` layer.
2. `AzureOpenAI` endpoints becoming unreachable without failing the application fast during startup.
3. Silent network drops breaking DbUp migrations, leaving the application in a degraded boot loop.
4. The `AdvisoryScanHostedService` silently failing its lease acquisition without CI test coverage proving its loop.
5. The `CircuitBreakingAgentCompletionClient` opening without emitting high-visibility, distinct warnings.
6. Stack traces losing the `RunId` context when `RealAgentExecutor` unhandled exceptions bubble up.

## 8. Most Important Truth
ArchLucid's technical foundation—from RLS to agent circuit-breaking—is remarkably robust, but the product will fail commercially if the "time-to-first-ROI" is obstructed by manual JSON configuration and buried cost-savings metrics.

## 9. Top Improvement Opportunities

**1. Define Custom Agent Handler Out-of-Process Boundary**
- **Why it matters:** V1.1 requires documentation for custom handlers, and out-of-process (webhooks) protects the host's memory space and aligns with MCP.
- **Expected impact:** Clear extensibility path for enterprise integrators.
- **Affected qualities:** Interoperability, Security.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Add `docs/library/CUSTOM_AGENT_HANDLERS.md`.
1. Document the architectural decision to strictly use out-of-process gRPC/HTTP webhooks for third-party custom agent handlers.
2. Provide a sample JSON payload demonstrating the expected webhook request and response schemas (based on `AgentResult`).
3. State explicitly that in-process .NET assembly loading is prohibited for custom agents.
Acceptance Criteria: A clear integration guide exists for external developers.
Constraints: Must align with the existing `AgentResult` schema and REST patterns.
```
- **Impact:** Directly improves Interoperability (+6-8 pts), Security (+3-5 pts). Weighted readiness impact: +0.4-0.6%.

**2. Implement Lightweight Redis Baseline for V2**
- **Why it matters:** V2 distributed cache needs configuration, and the expected light load means a minimal Basic tier Redis setup is sufficient.
- **Expected impact:** Prevents over-engineering and over-provisioning infrastructure.
- **Affected qualities:** Performance, Proof-of-ROI Readiness.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Update the infrastructure documentation in `docs/library/SCALING_PATH.md`.
1. Document that the V2 Redis distributed cache architecture targets a "Light Load" baseline (Basic tier, single user).
2. Add a section detailing that the `IGraphSnapshotProjectionCache` will be backed by a minimal Redis instance with a 24-hour TTL, scaling only if utilization exceeds 100 requests per minute.
Acceptance Criteria: Engineers have clear constraints preventing them from building a massive enterprise Redis cluster.
Constraints: Emphasize cost-efficiency over high-availability for this specific cache.
```
- **Impact:** Directly improves Performance (+5-7 pts). Weighted readiness impact: +0.2-0.3%.

**3. Gracefully Disable LLM Execution on Budget Exceeded**
- **Why it matters:** Hard cutoffs shouldn't lock users out of viewing past reports or managing their account.
- **Expected impact:** Better UX when limits are hit, preserving stickiness while stopping costs.
- **Affected qualities:** Commercial Packaging Readiness, Usability.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Update the `RunCreationWizard` in `archlucid-ui`.
1. Fetch the tenant's current budget status via the API (check `LlmMonthlyTenantDollarBudget:HardCutoffUsdPerUtcMonth` limits).
2. If the limit is exceeded, disable the "Execute Run" button and display an inline warning: "LLM Execution budget exceeded for this month. You may still view previous runs."
Acceptance Criteria: Users can log in but cannot incur further LLM costs.
Constraints: Must not block artifact downloads or comparisons.
```
- **Impact:** Directly improves Commercial Packaging Readiness (+6-8 pts), Usability (+3-5 pts). Weighted readiness impact: +0.3-0.5%.

**4. Document ArchLucid-Owned Jira OAuth App Registration**
- **Why it matters:** Customers need clear instructions on how the Jira bi-directional sync authenticates.
- **Expected impact:** Removes enterprise adoption blockers regarding third-party app security.
- **Affected qualities:** Workflow Embeddedness, Security.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Add an authorization section to `docs/integrations/ITSM_BRIDGE_V1_RECIPES.md`.
1. Document that ArchLucid will provide a globally registered Jira OAuth 2.0 application for the V1 bi-directional sync.
2. Specify the exact Jira scopes requested by the app (e.g., `read:jira-work`, `write:jira-work`).
3. Explain the installation flow from the Atlassian Marketplace.
Acceptance Criteria: Security reviewers understand the exact blast radius of the Jira integration.
Constraints: Do not commit any client secrets or IDs to the repo.
```
- **Impact:** Directly improves Workflow Embeddedness (+5-8 pts). Weighted readiness impact: +0.2-0.4%.

**5. Scope Slack Interactive Actions for V1.1**
- **Why it matters:** Clearly defines that Slack approve/ack buttons are on the roadmap for V1.1, managing customer expectations.
- **Expected impact:** Provides a strong feature promise for chat-ops without delaying V1 GA.
- **Affected qualities:** Stickiness, Workflow Embeddedness.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Update `docs/library/V1_DEFERRED.md`.
1. Modify the Slack row in section `6a. Chat-ops`.
2. Explicitly commit that interactive Slack approvals (approve/ack buttons) are scoped for V1.1.
3. Keep the App Directory listing as an open (unpinned) item.
Acceptance Criteria: Documentation reflects that interactive Slack features are an upcoming V1.1 commitment.
Constraints: Do not pin calendar dates.
```
- **Impact:** Directly improves Stickiness (+4-6 pts). Weighted readiness impact: +0.1-0.2%.

**6. Implement PII Email Redaction in Support Bundles**
- **Why it matters:** Prevents accidental leakage of customer email addresses in support scenarios.
- **Expected impact:** Higher enterprise security compliance.
- **Affected qualities:** Security, Compliance Readiness.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Update `SupportBundleController` in `ArchLucid.Api`.
1. Before serializing logs and configuration for the support bundle, run a Regex-based redactor.
2. Replace all valid email addresses with `[REDACTED_EMAIL]`.
3. Apply this to all textual payloads being added to the ZIP bundle.
Acceptance Criteria: Support bundles generated via CLI/API do not contain user emails.
Constraints: Ensure the regex does not severely impact generation performance.
```
- **Impact:** Directly improves Security (+5-8 pts), Compliance Readiness (+3-5 pts). Weighted readiness impact: +0.3-0.5%.

**7. Create `archlucid config bootstrap` wizard**
- **Why it matters:** Reduces trial Adoption Friction by interactively prompting for SQL and Azure OpenAI keys instead of hand-editing JSON.
- **Expected impact:** Speeds up pilot time-to-first-run by eliminating JSON syntax errors.
- **Affected qualities:** Adoption Friction, Usability.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Add a `bootstrap` verb to `ArchLucid.Cli`.
1. Interactively prompt the user for: `ConnectionStrings:ArchLucid`, `AzureOpenAI:Endpoint`, `AzureOpenAI:ApiKey`, and `AzureOpenAI:DeploymentName`.
2. Write these values to `appsettings.Development.json` in the current directory.
3. Validate the Azure OpenAI connection using a lightweight HTTP GET to the models endpoint.
Acceptance Criteria: A user can run `archlucid config bootstrap` and get a valid configuration file.
Constraints: Do not echo the `ApiKey` to the console.
```
- **Impact:** Directly improves Adoption Friction (+5-7 pts), Usability (+2-4 pts). Weighted readiness impact: +0.6-0.8%.

**8. Add Cost Savings KPI Component to Run Detail UI**
- **Why it matters:** ROI must be immediately obvious to executive sponsors without digging into artifacts.
- **Expected impact:** Increases commercial win rate by highlighting financial value.
- **Affected qualities:** Proof-of-ROI Readiness.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Create a `RunSavingsSummary` React component in `archlucid-ui`.
1. Fetch `cost-actual.json` and `orphan-candidates.json` from the run's artifact list.
2. Calculate total potential annualized savings.
3. Display this number prominently at the top of the Run Detail page.
Acceptance Criteria: If cost artifacts exist, a clear dollar amount is displayed.
Constraints: Handle missing artifacts gracefully without crashing.
```
- **Impact:** Directly improves Proof-of-ROI Readiness (+8-10 pts). Weighted readiness impact: +0.8-1.0%.

**9. Implement ITSM Sync Health Check Endpoint**
- **Why it matters:** Operators cannot currently tell if Jira/ServiceNow credentials have expired until a sync fails.
- **Expected impact:** Reduces support burden and improves observability.
- **Affected qualities:** Workflow Embeddedness, Observability.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Add `GET /v1/integrations/itsm/health` to `ArchLucid.Api`.
1. Check the `dbo.TenantItsmOutboundSettings` for the current tenant.
2. Issue a lightweight read-only ping to the configured Jira/ServiceNow instance.
3. Return 200 OK with `status: healthy` or 503 with the upstream error.
Acceptance Criteria: The endpoint correctly reports upstream ITSM connectivity.
Constraints: Respect tenant isolation via `IScopeContextProvider`.
```
- **Impact:** Directly improves Workflow Embeddedness (+6-8 pts), Observability (+2-3 pts). Weighted readiness impact: +0.4-0.6%.

**10. Embed LLM Reasoning in Knowledge Graph Nodes**
- **Why it matters:** Users need to trust the graph by seeing exactly why an edge was inferred.
- **Expected impact:** Greatly improves system explainability.
- **Affected qualities:** Explainability.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Update the `archlucid-ui` Knowledge Graph component and `ArchLucid.KnowledgeGraph` serialization.
1. Ensure `GraphEdge` and `GraphNode` models include the originating agent's `ReasoningTrace`.
2. In the UI, display this reasoning text in the node/edge detail sidebar.
Acceptance Criteria: Clicking an inferred edge shows the LLM reasoning that generated it.
Constraints: Truncate reasoning text to 500 characters in the sidebar with an "expand" option.
```
- **Impact:** Directly improves Explainability (+10-15 pts). Weighted readiness impact: +0.4-0.6%.

**11. Add Config Lint Rule for Azure OpenAI Connectivity**
- **Why it matters:** Fails fast if the endpoint is blocked by a firewall, preventing downstream pipeline failures.
- **Expected impact:** Lower adoption friction.
- **Affected qualities:** Adoption Friction.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Enhance `OperatorConfigurationLintEvaluator` in `ArchLucid.Core`.
1. If `AgentExecution:Mode` is `Real` and `AzureOpenAI:Endpoint` is present, perform a DNS resolution check or lightweight socket connect.
2. Emit an advisory lint warning if unreachable.
Acceptance Criteria: `archlucid config lint` warns if the OpenAI endpoint is unreachable.
Constraints: Set a strict 2-second timeout to avoid hanging the CLI.
```
- **Impact:** Directly improves Adoption Friction (+3-5 pts). Weighted readiness impact: +0.3-0.5%.

**12. Surface Quality Gate Strictness in UI**
- **Why it matters:** Operators don't know the current `PilotStrictMinSemanticScore` unless they read the JSON config.
- **Expected impact:** Better situational awareness of agent gating.
- **Affected qualities:** Usability.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Add a "Quality Gates" read-only panel to the Settings page in `archlucid-ui`.
1. Fetch `ArchLucid:AgentOutput:QualityGate` values from `GET /v1/admin/config-summary`.
2. Display `Mode`, `StructuralWarnBelow`, and `SemanticWarnBelow`.
Acceptance Criteria: Operators can see current quality gate thresholds in the UI.
Constraints: Do not expose mutation endpoints; config is read-only from the UI.
```
- **Impact:** Directly improves Usability (+4-6 pts). Weighted readiness impact: +0.2-0.4%.

**13. Create OIDC Diagnostic Endpoint**
- **Why it matters:** Generic OIDC debugging is extremely hard for self-serve customers.
- **Expected impact:** Drastically improves Customer Self-Sufficiency.
- **Affected qualities:** Customer Self-Sufficiency, Adoption Friction.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Add `GET /v1/admin/auth/oidc-diagnostics` to `ArchLucid.Api`.
1. Return the current `ArchLucidAuth:Authority` and `Audience`.
2. Attempt to fetch the `.well-known/openid-configuration` from the Authority.
3. Return the discovered endpoints and JWKS URI.
Acceptance Criteria: Operators can instantly verify if the API can reach their IdP.
Constraints: Require `AdminAuthority` policy.
```
- **Impact:** Directly improves Customer Self-Sufficiency (+10-15 pts). Weighted readiness impact: +0.3-0.5%.

**14. Add Missing Unit Test for Terraform Destroy Guard**
- **Why it matters:** Ensures the hard constraint "no `terraform destroy` on behalf of customers" is never accidentally violated.
- **Expected impact:** Eliminates a catastrophic security/engineering risk.
- **Affected qualities:** Correctness, Security.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Add a test class `TerraformAdvisorySafetyTests` in `ArchLucid.ArtifactSynthesis.Tests`.
1. Mock an agent recommendation that explicitly asks to delete an Azure resource.
2. Run the Terraform generator.
3. Assert that the output does not contain the word `destroy` and includes the `ADVISORY.md` comment.
Acceptance Criteria: CI fails if the generator ever emits a destroy block.
Constraints: Must test against the actual `ArchLucid.ArtifactSynthesis` generation logic.
```
- **Impact:** Directly improves Correctness (+5-8 pts), Security (+2-4 pts). Weighted readiness impact: +0.8-1.2%.

**15. Staged Critic OpenTelemetry Spans**
- **Why it matters:** Staged Critic adds wall-clock time; operators need to see this explicitly in traces.
- **Expected impact:** Better observability for pipeline latency.
- **Affected qualities:** Observability.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Update `RealAgentExecutor` in `ArchLucid.AgentRuntime`.
1. Wrap the Phase 1 (non-Critic) execution in an OpenTelemetry activity span named `AgentExecution.Phase1`.
2. Wrap the Phase 2 (Critic) execution in a span named `AgentExecution.Phase2_Critic`.
3. Add the number of summarized claims as a tag to Phase 2.
Acceptance Criteria: Traces in Jaeger/Application Insights clearly demarcate the Staged Critic delay.
Constraints: Use the existing `ArchLucidInstrumentation.ActivitySource`.
```
- **Impact:** Directly improves Observability (+6-9 pts). Weighted readiness impact: +0.1-0.2%.

**16. Add Info Tooltips to Governance Policies**
- **Why it matters:** Policy schemas are complex; inline help reduces documentation trips.
- **Expected impact:** Faster governance rollout by operators.
- **Affected qualities:** Usability.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Enhance the Governance Policy JSON editor in `archlucid-ui`.
1. Add a hoverable `?` icon next to the editor.
2. Display a brief explanation of the supported JSON schema fields for policy packs.
Acceptance Criteria: Operators can read schema hints without leaving the page.
Constraints: Keep the text under 100 words.
```
- **Impact:** Directly improves Usability (+5-7 pts). Weighted readiness impact: +0.3-0.5%.

**17. Add "Copy Command" for Azure Extractor in UI**
- **Why it matters:** Running the PowerShell script is the first step for ROI; make it frictionless.
- **Expected impact:** Higher conversion rate on cost extraction.
- **Affected qualities:** Adoption Friction.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Update the Run Creation wizard in `archlucid-ui`.
1. Add a step for "Ingest Azure Context".
2. Display the `Get-ArchLucidAzurePackage.ps1` command in a code block.
3. Add a "Copy to Clipboard" button.
Acceptance Criteria: Users can click one button to copy the exact ingestion command.
Constraints: Ensure the command includes the `-IncludeCost` switch by default.
```
- **Impact:** Directly improves Adoption Friction (+4-6 pts). Weighted readiness impact: +0.4-0.6%.

**18. Circuit Breaker Open Log Warning**
- **Why it matters:** When `CircuitBreakingAgentCompletionClient` trips, operators need a high-visibility log.
- **Expected impact:** Faster diagnosis of LLM provider outages.
- **Affected qualities:** Observability.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Update `CircuitBreakingAgentCompletionClient` in `ArchLucid.AgentRuntime`.
1. Add an `OnBreak` delegate to the Polly `AsyncCircuitBreakerPolicy`.
2. Log a `Warning` level message: "LLM Circuit Breaker opened due to consecutive failures."
3. Log an `Information` message when it resets.
Acceptance Criteria: The host logs clearly indicate circuit breaker state transitions.
Constraints: Do not log sensitive prompt data.
```
- **Impact:** Directly improves Observability (+5-8 pts). Weighted readiness impact: +0.1-0.2%.

**19. PDF Export for Compliance Drift Dashboard**
- **Why it matters:** Compliance officers need portable artifacts for board meetings.
- **Expected impact:** Better Enterprise Compliance Readiness.
- **Affected qualities:** Compliance Readiness.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Add a PDF export button to the Compliance Drift page in `archlucid-ui`.
1. Use `html2canvas` and `jspdf` to capture the drift chart.
2. Trigger a browser download of the generated PDF.
Acceptance Criteria: Users can download a PDF snapshot of their compliance drift.
Constraints: Exclude navigation sidebars from the PDF capture.
```
- **Impact:** Directly improves Compliance Readiness (+5-7 pts). Weighted readiness impact: +0.2-0.3%.

**20. Simulator Mode UI Banner**
- **Why it matters:** Users might think the LLM is failing when they are actually just in `Simulator` mode.
- **Expected impact:** Prevents pilot confusion.
- **Affected qualities:** Usability.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Add a global banner to `archlucid-ui` layout.
1. Check `GET /v1/admin/config-summary` for `AgentExecution:Mode`.
2. If `Simulator`, render an orange banner at the top: "Running in Simulator Mode - Agent outputs are deterministic mocks."
Acceptance Criteria: Operators are explicitly aware when real LLMs are disabled.
Constraints: Banner should be dismissible for the session.
```
- **Impact:** Directly improves Usability (+3-5 pts). Weighted readiness impact: +0.2-0.4%.

**21. Add "Estimate Cost" Button Before Heavy Replay**
- **Why it matters:** `ComparisonReplayCostEstimator` exists but isn't surfaced prominently before triggering expensive replays.
- **Expected impact:** Prevents accidental budget burn.
- **Affected qualities:** Usability, Correctness.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Update the Replay dialog in `archlucid-ui`.
1. Call `GET /v1/architecture/comparisons/{id}/replay/cost-estimate`.
2. Display the returned band (low/medium/high) before the user clicks "Start Replay".
Acceptance Criteria: Users are warned of heavy replay costs before execution.
Constraints: Do not block execution, just warn.
```
- **Impact:** Directly improves Usability (+4-6 pts), Correctness (+1-2 pts). Weighted readiness impact: +0.2-0.3%.

**22. Create Automated Test for Advisory Scan Service**
- **Why it matters:** The `AdvisoryScanHostedService` runs in the background and is hard to verify manually.
- **Expected impact:** Guarantees background scans don't silently fail.
- **Affected qualities:** Correctness.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Add `AdvisoryScanHostedServiceTests` to `ArchLucid.Host.Core.Tests`.
1. Mock `IAdvisoryScanRunner` and `IHostLeaderElection`.
2. Verify that the service acquires a lease and calls the runner at the correct interval.
Acceptance Criteria: CI validates the advisory scan orchestration loop.
Constraints: Use `TimeProvider` or `Task.Delay` mocking to avoid long test times.
```
- **Impact:** Directly improves Correctness (+4-6 pts). Weighted readiness impact: +0.6-0.9%.

**23. Auto-focus Search Bar on Comparisons Page**
- **Why it matters:** Operator muscle memory; small UX polish goes a long way.
- **Expected impact:** Minor Usability improvement.
- **Affected qualities:** Usability.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Update the Comparisons list page in `archlucid-ui`.
1. Add an `autoFocus` attribute to the main search input field.
2. Ensure it works on initial page load.
Acceptance Criteria: The cursor is immediately ready to type a search query on the comparisons page.
Constraints: None.
```
- **Impact:** Directly improves Usability (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

**24. Include RunId in All Agent Exceptions**
- **Why it matters:** Exceptions from `RealAgentExecutor` without context are hard to trace in logs.
- **Expected impact:** Better observability for debugging failed runs.
- **Affected qualities:** Observability.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Update `RealAgentExecutor` in `ArchLucid.AgentRuntime`.
1. Catch any unhandled exceptions during `ExecuteAsync`.
2. Wrap them in a new `AgentExecutionFailedException` that includes the `runId` and `taskId` in the message.
3. Re-throw the wrapped exception.
Acceptance Criteria: Crash logs always contain the associated run ID.
Constraints: Preserve the original exception stack trace using `InnerException`.
```
- **Impact:** Directly improves Observability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.

**25. Add SQL Transient Error Retry Logging**
- **Why it matters:** DbUp or Dapper retries might hide network instability.
- **Expected impact:** Highlights failing infrastructure before hard crashes.
- **Affected qualities:** Observability.
- **Status:** Actionable now
- **Cursor prompt:**
```text
Update `SqlScopedResolutionDbConnectionFactory` in `ArchLucid.Api.DataAccess`.
1. If the underlying resilient connection factory retries an open attempt, log a `Warning`.
2. Include the elapsed time and retry count.
Acceptance Criteria: SQL connection blips are visible in Serilog.
Constraints: Do not log the full connection string.
```
- **Impact:** Directly improves Observability (+4-6 pts). Weighted readiness impact: +0.1-0.2%.

## 10. Prompt Batching Guidance
To optimize context window usage and cursor cost-effectiveness, execute the actionable prompts in the following batches:
- **Batch 1 (Core Guardrails & Correctness):** Improvements 14, 22. Focuses on `ArchLucid.ArtifactSynthesis.Tests` and `ArchLucid.Host.Core.Tests`.
- **Batch 2 (CLI & Operator Tooling):** Improvements 7, 11, 13. Focuses on `ArchLucid.Cli`, config parsing, and `ArchLucid.Api` diagnostic routes.
- **Batch 3 (UI ROI & Transparency):** Improvements 8, 10, 17. Focuses heavily on `archlucid-ui` components (Savings, Knowledge Graph sidebar, Copy Command).
- **Batch 4 (Observability & Latency Tracing):** Improvements 15, 18, 24, 25. Focuses on `ArchLucid.AgentRuntime` and `ArchLucid.Api.DataAccess` telemetry.
- **Batch 5 (UX Polish & Settings):** Improvements 12, 16, 19, 20, 21, 23. Light touches to React components across `archlucid-ui`.
- **Batch 6 (Integration Health):** Improvement 9. Isolated work on `ArchLucid.Api` ITSM controllers.
- **Batch 7 (Integration & Architecture Docs):** Improvements 1, 2, 4, 5. Focuses on `docs/library` and `docs/integrations`.
- **Batch 8 (Billing UX & Security Polish):** Improvements 3, 6. Focuses on `archlucid-ui` and `SupportBundleController`.

## 11. Pending Questions for Later

All pending questions have been resolved and their outputs integrated into the Top Improvement Opportunities above.
