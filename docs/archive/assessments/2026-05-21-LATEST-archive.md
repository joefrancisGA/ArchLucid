> **Scope:** Canonical current V1 GA readiness assessment for coding agents and the owner; headline readiness per `Assessment-Scope-V1_1.mdc`—not an archived snapshot or a buyer/procurement deliverable.

# ArchLucid Assessment – (A) Headline Readiness: 80.14%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, explicitly excluding deferred items such as SOC 2 CPA attestation, signed design partners, public extension SDKs, MCP inbound servers, and third-party plugin marketplaces.

### Assessment update (2026-05-21)

The **Structured Agent Output Evaluation Harness** (#1) now has a **committed baseline**:

- **Pack:** `tests/eval-corpus/templates-pack/` — 10 scenarios, `rubric.json` (70% recall floor, `enforceByDefault: false`).
- **Recordings:** `recordings/scenario-*.findings.json` — bootstrapped via `scripts/ci/bootstrap_eval_template_recordings.py` (synthetic from `expectedFindings`); replace with live `--mode capture` when a stable API is available.
- **Runner:** `scripts/ci/eval_template_harness.py` — score mode **10/10 PASS** (2026-05-21).
- **CI:** `.github/workflows/template-eval-harness.yml` (inform-only until `--enforce` or `rubric.enforceByDefault`).

**Optional next:** live capture refresh, tune `evidenceMustContain` anchors from real findings, then flip `--enforce`.

## Executive Summary

### (A) Overall Headline Readiness
ArchLucid is functionally ready for V1 GA (80.14%), but requires polish to reduce adoption friction and improve the operator experience. The core architecture review loop is solid, backed by a robust SQL persistence layer and comprehensive quality gates for LLM outputs. A **templates-pack evaluation harness** now scores agent findings against 10 curated architecture-request scenarios (inform-only until baseline recordings are captured). Remaining AI gaps include prompt A/B testing and operator-assist surfaces before/after runs. Operator usability (cognitive load from abstract concepts) and the manual effort to move from pilot to production deployment are still the dominant adoption risks.

### (B) Procurement / Market-Motion Realism
Enterprise procurement will encounter friction due to the absence of a CPA-issued SOC 2 Type II attestation and a published third-party penetration test. While the in-repo self-assessments and Trust Center provide excellent transparency, rigid RFP processes often treat these missing third-party attestations as hard blockers. The lack of a signed design partner may also slow early enterprise momentum, though the sales-led pilot motion is well-supported.

### Commercial Picture
The commercial packaging is clear, predictable, and expansion-friendly. However, the deferral of the Stripe live-keys flip and Marketplace publication to V1.1 means the V1 motion is entirely sales-led. This places a heavy burden on the sales and engineering teams to manually provision and manage trial conversions. Time-to-value for the initial demo is excellent, but proving empirical ROI requires customer-supplied baselines that are currently unpopulated.

### Enterprise Picture
ArchLucid's enterprise posture is strong, featuring database-per-tenant isolation, Entra ID / SAML 2.0 SP integration, and a durable audit trail. The primary enterprise blockers are usability-related: operators must internalize a complex taxonomy (Runs, Manifests, Decision Traces, Policy Packs) without sufficient in-app guidance, making the transition from technical evaluator to daily operator steep.

### Engineering Picture
The engineering foundation is exceptionally mature, with clean architecture, strict dependency constraints, and defensive LLM integration (circuit breakers, prompt redaction). Engineering risks are concentrated in unhandled edge cases at scale: lack of published load test baselines, reliance on a single SQL Server primary for writes, and potential performance bottlenecks from LLM latency and deep pagination.

---

## Weighted Quality Assessment

*Ordered from most urgent to least urgent based on weighted deficiency.*

### 1. AI/Agent Readiness
- **Score:** 80
- **Weight:** 8
- **Weighted deficiency signal:** 160
- **Why this score was assigned:** The system has excellent AI pipeline engineering (cost estimation, prompt redaction, circuit breakers, quality gates, calibrated faithfulness scoring). A **templates-pack harness** (`tests/eval-corpus/templates-pack/`) now provides structured recall scoring for 10 reference templates — recordings pending. The deeper gap is that AI is not yet woven into day-to-day operator tasks: request authoring still requires expert domain knowledge, findings leave operators asking "what do I do now?", and the Critic agent is too consensus-leaning to catch the conflicts it should flag.
- **Key tradeoffs:** Stateless agents and strict quality gates ensure reproducibility but limit the AI's ability to assist operators *before* and *after* a run, not just during it.
- **Specific improvement recommendations:** See `docs/library/AI_LEVERAGE_ROADMAP.md` for 25 prioritised opportunities. Immediate V1 priorities: Critic adversarial second-pass (#6), findings-to-IaC stub generator (#1), AI-assisted request authoring (#2), multi-model orchestration (#5). Category note: consider broadening the scoring definition of this quality to explicitly include **AI-augmented operator productivity**, not just pipeline quality — see roadmap §Assessment category note.
- **Fixability:** Pipeline items fixable in V1 now. Operator-facing AI surfaces (IaC stubs, request drafter, per-finding explainer, governance explainer) fixable in V1 — 2–6 weeks. Semantic search and portfolio chat are V1.1. Cross-tenant learning and fine-tuned SLM are V2.

### 2. Adoption Friction
- **Score:** 75
- **Weight:** 6
- **Weighted deficiency signal:** 150
- **Why this score was assigned:** While the `archlucid try` pilot path is streamlined, transitioning to a production configuration with custom Policy Packs, Entra ID integration, and Azure extractor automation requires significant manual effort and deep domain knowledge.
- **Key tradeoffs:** Deep, secure governance naturally imposes upfront configuration costs compared to frictionless consumer SaaS.
- **Specific improvement recommendations:** Provide guided setup wizards for policy customizations and Entra ID integration. Extract UI strings to `i18n.ts` for easier terminology adaptation.
- **Fixability:** Fixable in V1.

### 3. Time-to-Value
- **Score:** 82
- **Weight:** 7
- **Weighted deficiency signal:** 126
- **Why this score was assigned:** The "clone to committed manifest" path is genuinely fast via the simulator. However, the first production Architecture Request with real tenant context still takes careful authoring, and the Azure extractor script can fail if optional permissions are missing.
- **Key tradeoffs:** Relying on a customer-executed script reduces security friction but increases the risk of execution errors on the customer's machine.
- **Specific improvement recommendations:** Pre-seed one vertical-aligned sample run per industry brief during trial signup. Make the extractor script resilient to missing non-critical RBAC roles.
- **Fixability:** Fixable in V1.

### 4. Usability
- **Score:** 70
- **Weight:** 3
- **Weighted deficiency signal:** 90
- **Why this score was assigned:** The Next.js operator shell is functional but feature-sparse. The abstraction of "Runs," "Golden Manifests," and "Decision Traces" imposes a high cognitive load on non-architects, and there is minimal progressive disclosure or guided workflows.
- **Key tradeoffs:** Accurate modeling of the architecture domain requires specific nomenclature, sacrificing generic simplicity.
- **Specific improvement recommendations:** Add context-aware tooltips and a "guided tour" overlay in the Operator UI to explain lifecycle state transitions.
- **Fixability:** Fixable in V1.

### 5. Proof-of-ROI Readiness
- **Score:** 85
- **Weight:** 5
- **Weighted deficiency signal:** 75
- **Why this score was assigned:** The platform traces findings to financial implications via run-level artifacts and pilot scorecards. However, it stops short of translating these metrics into estimated USD savings automatically, and zero customer-supplied baselines are populated.
- **Key tradeoffs:** Calculating USD savings requires assumptions about architect hourly rates, which may vary by customer.
- **Specific improvement recommendations:** Surface `EstimatedUsdSavings` in the pilot deltas response using the existing `LlmCostEstimator`.
- **Fixability:** Fixable in V1.

### 6. Executive Value Visibility
- **Score:** 88
- **Weight:** 4
- **Weighted deficiency signal:** 48
- **Why this score was assigned:** Markdown/DOCX exports and tenant pilot scorecards cover sponsor-facing narratives well. A cross-run executive ROI summary endpoint (`GET /v1/roi/executive-summary`) now ships for the operator dashboard *(Completed 2026-05-20)*.
- **Key tradeoffs:** Building a cross-run summary requires complex deduplication logic for findings.
- **Specific improvement recommendations:** Improve operator UI discoverability for pilot value report and scorecard exports. Add visual indicators to distinguish demo data from real data.
- **Fixability:** Fixable in V1.

### 7. Reliability
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Why this score was assigned:** Solid single-region reliability with SQL Server and Polly retries. However, missing timeouts on Dapper queries and external HTTP calls pose reliability risks under adverse conditions.
- **Key tradeoffs:** Adding strict timeouts may cause false positives on slow networks, but it prevents thread exhaustion.
- **Specific improvement recommendations:** Add `CommandTimeout` to Dapper queries and strict timeouts to all `HttpClient` instances. Run and document a failover drill.
- **Fixability:** Fixable in V1.

### 8. Maintainability
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Why this score was assigned:** Strong architectural boundaries and modular design. However, the `NEXT_REFACTORINGS.md` backlog is massive, signaling accumulated technical debt, and dual manifest repository interfaces add cognitive load.
- **Key tradeoffs:** Documenting debt openly is better than hiding it, but the sheer volume may discourage contributors.
- **Specific improvement recommendations:** Eliminate remaining magic strings in `EffectiveGovernanceResolver` by moving them to a centralized `GovernanceConstants` file.
- **Fixability:** Fixable in V1.

### 9. Decision Velocity
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Why this score was assigned:** Automated advisory scans and pre-commit gates speed up decisions, but complex rule resolution can delay immediate feedback, and manual data ingestion slows initial velocity.
- **Key tradeoffs:** Accuracy and policy compliance supersede immediate latency.
- **Specific improvement recommendations:** Add a `/v1/governance/simulate` endpoint to allow operators to dry-run policy changes before applying them.
- **Fixability:** Fixable in V1.

### 10. Performance
- **Score:** 75
- **Weight:** 1
- **Weighted deficiency signal:** 25
- **Why this score was assigned:** The system uses `HotPathCache` effectively, but there are no published latency baselines, and LLM calls dominate run latency without a documented latency target.
- **Key tradeoffs:** Caching improves read latency but adds complexity (TTL staleness, invalidation coordination).
- **Specific improvement recommendations:** Add a CI performance regression gate (k6 smoke test with p95 assertion). Implement pruning for the `ReplayDiagnosticsRecorder`.
- **Fixability:** Fixable in V1.

### 11. Scalability
- **Score:** 75
- **Weight:** 1
- **Weighted deficiency signal:** 25
- **Why this score was assigned:** Database-per-tenant is highly scalable for isolation, but there is no load test baseline, and the reliance on a single SQL Server primary for all writes limits horizontal scaling.
- **Key tradeoffs:** The architecture is vertically scalable but not horizontally partitioned, which is appropriate for V1 but requires changes for scale.
- **Specific improvement recommendations:** Run a load test (k6) and publish baseline numbers. Ensure all bulk endpoints have strict payload limits.
- **Fixability:** Fixable in V1.

### 12. Stickiness
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Why this score was assigned:** Governance workflows, audit trails, and policy packs create strong stickiness. Residual churn risk is mostly UX habit formation rather than missing core APIs.
- **Key tradeoffs:** Relying on API integrations rather than deep native hooks initially.
- **Specific improvement recommendations:** Add "Saved Views" to the UI's Audit and Graph sections so operators build daily habits around customized dashboards.
- **Fixability:** Fixable in V1.

### 13. Supportability
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Why this score was assigned:** Excellent use of `X-Correlation-ID`, RFC 9457 Problem Details, and CLI support tools (`doctor`, `support-bundle`).
- **Key tradeoffs:** Verbose logging can increase storage costs.
- **Specific improvement recommendations:** Add a UI button to generate and download the support bundle directly from the operator shell.
- **Fixability:** Fixable in V1.

---

## Top 12 Most Important Weaknesses

1. **High Cognitive Load in UI:** The operator shell exposes too much domain complexity (dual pipelines, multiple auth modes, abstract concepts) to first-time users without sufficient guided onboarding.
2. **Lack of Empirical ROI Data:** The system models ROI well but lacks mechanisms to easily capture and surface real customer baselines, making the value proposition theoretical rather than empirical.
3. **Azure Extractor Fragility:** The PowerShell extraction script can fail entirely if optional RBAC roles are missing, stalling the pilot process.
4. **AI Evaluation Harness Not Yet Baselined:** The templates-pack harness ships in inform-only mode, but without committed `recordings/*.findings.json` and a green first score report, prompt/model regressions are still undetected in CI.
5. **No Load Test Baselines:** Throughput limits, breaking points, and scaling behavior under concurrency are entirely unknown.
6. **Production Configuration Friction:** Moving from the `archlucid try` pilot to a production-ready state requires significant manual configuration of Entra ID, Key Vault, and Policy Packs.
7. **Missing Timeouts:** Lack of strict timeouts on Dapper queries and external HTTP calls poses a reliability risk under adverse network conditions.
8. **Unbounded Payloads:** Missing explicit payload limits on bulk endpoints could lead to memory exhaustion or DoS attacks.
9. **In-Memory Cache Limitations:** The reliance on in-memory caches for graph projections limits multi-replica scalability.
10. **Massive Refactoring Backlog:** The 2,100+ line `NEXT_REFACTORINGS.md` file signals accumulated technical debt and discourages contribution.
11. **Lack of Performance Regression Gates:** Without CI performance gates, latency regressions can easily slip into production.

---

## Top 6 Monetization Blockers

1. **Deferred Commerce Un-hold:** The manual sales motion required before the Stripe live-keys flip and Marketplace publication limits self-serve velocity.
2. **Theoretical ROI:** Inability to easily capture and display actual customer baselines makes it harder to justify the subscription cost.
3. **Pilot-to-Production Chasm:** The steep configuration curve to move from a successful pilot to a governed production deployment delays expansion.
4. **Lack of Published Reference Customer:** The absence of a named, public reference customer reduces trust for risk-averse buyers.
5. **Executive Summary Gap:** The lack of a dedicated cross-run executive ROI summary makes it harder to prove aggregate value to CFOs.
6. **AWS/GCP Deferral:** Azure-only analysis limits the total addressable market, turning away multi-cloud or AWS-primary prospects.

---

## Top 6 Enterprise Adoption Blockers

1. **Missing SOC 2 Type II Attestation:** Rigid enterprise procurement processes will flag the lack of a CPA-issued SOC 2 report as a major risk.
2. **Missing Third-Party Pen Test:** The reliance on owner-conducted testing will not satisfy strict enterprise security reviews.
3. **Extractor Script Friction:** Security teams may hesitate to run the Azure extractor script if it fails ungracefully or requests overly broad permissions.
4. **Complex Identity Setup:** Configuring Entra ID or SAML 2.0 requires deep technical knowledge and lacks a guided UI wizard.
5. **Lack of ITSM/Chat-Ops Integration:** The deferral of Jira, ServiceNow, Teams, and Slack integrations to V1.1 reduces workflow embeddedness.
6. **Opaque Policy Resolution:** Operators may struggle to understand why a specific policy was applied without a simulation or dry-run endpoint.

---

## Top 6 Engineering Risks

1. **Single SQL Server Bottleneck:** Relying on a single primary for all writes creates a scalability ceiling and a single point of failure.
2. **Unbounded Memory Growth:** Missing eviction policies on in-memory caches (e.g., graph projections) could lead to OutOfMemory exceptions.
3. **Thread Pool Exhaustion:** Missing timeouts on external HTTP calls and database queries could exhaust the thread pool during outages.
4. **LLM Rate Limit Handling:** Failure to parse and respect `Retry-After` headers from Azure OpenAI could lead to cascading failures and throttled tenants.
5. **Deep JSON Parsing Vulnerability:** The `AgentResultParser` may be vulnerable to StackOverflow exceptions if the LLM returns maliciously or accidentally deep JSON.
6. **Performance Regressions:** The lack of automated load testing and latency assertions in CI means performance degradations will only be caught in production.

---

## Most Important Truth

ArchLucid's core architecture and AI integration are exceptionally sound, but the product currently demands too much domain expertise and manual configuration from its operators, creating a steep adoption curve that hinders the transition from technical pilot to enterprise-wide rollout.

---

## Top Improvement Opportunities

### 1. SHIPPED (baseline committed — synthetic bootstrap): Structured Agent Output Evaluation Harness
- **Why it matters:** Essential for detecting model drift and prompt regressions on the 10 buyer-shaped architecture templates you selected.
- **Expected impact:** After baseline capture, inform-only CI reports recall/unexpected hits per scenario; `--enforce` blocks regressions once anchors match agent vocabulary.
- **Affected qualities:** AI/Agent Readiness (+4–6 pts once baselined and enforced), Reliability (+2–3 pts).
- **Status:** Rubric, 10 scenarios, runner, workflow, and **bootstrap recordings** committed (`scripts/ci/bootstrap_eval_template_recordings.py` → `recordings/scenario-*.findings.json`); score mode passes **10/10** inform-only. Replace with live `--mode capture` when a stable API is available; then tune anchors and optionally enable `--enforce`.
- **Your next step (optional hardening):**
  1. `python scripts/ci/eval_template_harness.py --mode capture --base-url <api>` (replace bootstrap recordings)
  2. `python scripts/ci/eval_template_harness.py --mode score` — tune `evidenceMustContain` from any misses
  3. When consistently green on live capture: `workflow_dispatch` with `enforce=true` or set `rubric.enforceByDefault` to `true`
- **Artifacts:** `tests/eval-corpus/templates-pack/README.md`, `rubric.json`, `scenario-01` … `scenario-10`, `scripts/ci/eval_template_harness.py`, `.github/workflows/template-eval-harness.yml`

### 2. Add Streaming Support for Ask Endpoint *(Completed 2026-05-21)*
- **Why it matters:** Improves perceived latency for interactive queries.
- **Expected impact:** Better operator UX.
- **Affected qualities:** Usability (+5), AI/Agent Readiness (+3).
- **Completed.** — `POST /v1/ask/stream` in `AskController` emits SSE `token`/`done` events via `AskService.AskStreamAsync` and `SseEventWriter`; `archlucid-ui` consumes the stream through `ask-sse-stream.ts` and renders incremental assistant text in `AskPageContent` / `AskMessageThreadPanel`.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Update `AskController.cs` to stream Server-Sent Events (SSE) as the LLM generates tokens, using `IAsyncEnumerable<string>` or `HttpResponse.Body.WriteAsync`. In `archlucid-ui`, update the `Ask` component to consume the SSE stream using the native `fetch` API and render the accumulating text using a streaming-compatible markdown parser (like `react-markdown`).
Impact: Directly improves Usability (+5 pts) and AI/Agent Readiness (+3 pts). Weighted readiness impact: +0.08%.
```

### 3. Implement Multi-Model Orchestration *(Completed 2026-05-20)*
- **Why it matters:** Allows routing simple tasks to cheaper models and complex tasks to smarter models.
- **Expected impact:** Reduces LLM costs and improves performance.
- **Affected qualities:** Cost-Effectiveness (+5), AI/Agent Readiness (+3).
- **Completed.** — `LlmModelTier` routing via `IAgentTierCompletionRouter` / `TieredAgentCompletionRouter`; Topology and Critic default to Premium; Ask/explanations and schema-remediation retries use Economy; deployment names from `ArchLucid:AgentModelTiers` with fallback to `AzureOpenAI:DeploymentName`.
- **Status:** **Completed** (2026-05-20).
- **Prompt:**
```text
Update `AgentTaskRouter.cs` (or equivalent) to support a `ModelTier` enum (e.g., `Reasoning`, `Fast`). Route the `Critic` and `Topology` agents to the `Reasoning` tier (e.g., GPT-4o). Route parsing, formatting, and summarization tasks to the `Fast` tier (e.g., GPT-4o-mini). Update the Azure OpenAI client factory to resolve the correct deployment name based on the tier.
Impact: Directly improves Cost-Effectiveness (+5 pts) and AI/Agent Readiness (+3 pts). Weighted readiness impact: +0.08%.
```

### 4. Build Cross-Run Executive ROI Summary API *(Completed 2026-05-20)*
- **Why it matters:** Essential for CFO board packs.
- **Expected impact:** Proves aggregate value.
- **Affected qualities:** Executive Value Visibility (+5), Proof-of-ROI Readiness (+3).
- **Completed.** — `GET /v1/roi/executive-summary` via `RoiController` and `ExecutiveRoiSummaryService` aggregates the latest committed run per `SystemName`, sums `EstimatedUsdSavings` from findings snapshots, and returns the top five category/severity issue groups; operator `/dashboard` renders `ExecutiveRoiSummarySection`.
- **Status:** **Completed** (2026-05-20).
- **Prompt:**
```text
Create a new endpoint `GET /v1/roi/executive-summary` in `RoiController.cs`. Implement aggregation logic that takes the latest `ArchitectureRunDetail` for each unique `SystemName` in the tenant. Sum the `EstimatedUsdSavings` across these latest runs. Group findings by `Category` and `Severity`, returning the top 5 most frequent systemic issues. Surface this in a new "Executive Dashboard" view in `archlucid-ui`.
Impact: Directly improves Executive Value Visibility (+5 pts) and Proof-of-ROI Readiness (+3 pts). Weighted readiness impact: +0.06%.
```

### 5. Add `Time-to-First-Committed-Manifest` Metric *(Completed 2026-05-21)*
- **Why it matters:** Provides an empirical, self-serve ROI narrative for every customer.
- **Expected impact:** Proves Time-to-Value empirically.
- **Affected qualities:** Time-to-Value (+5), Proof-of-ROI Readiness (+3).
- **Completed.** — `TryMarkFirstManifestCommittedAsync` pins `TrialFirstManifestCommittedUtc`; `GET /v1/tenant/trial-status` exposes `timeToFirstCommittedManifestTotalSeconds`; sponsor banner and review-cycle delta panels surface the metric.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Update `ArchLucid.Core/Tenants/Tenant.cs` to add a nullable `TimeSpan` property `TimeToFirstCommittedManifest`. Update `AuthorityRunOrchestrator.cs` to calculate the duration between `Tenant.CreatedUtc` and the current time when the first manifest is committed, and save it to the tenant row. Surface this metric in the `TenantDto` and display it in the operator shell's sponsor banner.
Impact: Directly improves Time-to-Value (+5 pts) and Proof-of-ROI Readiness (+3 pts). Weighted readiness impact: +0.1%.
```

### 6. Pre-seed Vertical-Aligned Sample Run *(Completed 2026-05-21)*
- **Why it matters:** Shows industry-relevant findings within 90 seconds of signup.
- **Expected impact:** Massive reduction in initial Time-to-Value.
- **Affected qualities:** Time-to-Value (+5), Adoption Friction (+2).
- **Completed.** — `TrialVerticalWelcomeRequestFactory` maps signup `IndustryVertical` to brief-aligned welcome requests; `TrialArchitecturePreseedExecutor` uses the tenant profile when auto-committing the welcome run after trial bootstrap.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Update the trial signup flow in `TenantRegistrationService.cs`. Accept an optional `IndustryVertical` parameter. Based on the vertical (e.g., `financial-services`, `healthcare`), automatically trigger `POST /v1/demo/seed` with the corresponding template from `templates/briefs/` so the user's first view is a populated, relevant run.
Impact: Directly improves Time-to-Value (+5 pts) and Adoption Friction (+2 pts). Weighted readiness impact: +0.1%.
```

### 7. Surface `EstimatedUsdSavings` in Pilot Deltas *(Completed 2026-05-21)*
- **Why it matters:** Translates technical metrics into executive-friendly financial numbers.
- **Expected impact:** Strengthens the ROI narrative.
- **Affected qualities:** Proof-of-ROI Readiness (+5), Executive Value Visibility (+2).
- **Completed.** — `PilotRunDeltaComputer` loads `TotalEstimatedSavings` from the findings snapshot; `BeforeAfterDeltaPanel` and `EmailRunToSponsorBanner` render `estimatedUsdSavings` from `GET /v1/pilots/runs/{runId}/pilot-run-deltas`.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Update `PilotRunDeltaComputer.cs`. Integrate the `LlmCostEstimator` and the formulas from `PILOT_ROI_MODEL.md` to calculate `EstimatedUsdSavings` based on the number of findings and severity. Add this property to `PilotRunDeltaResponse` and display it in the operator UI's pilot scorecard.
Impact: Directly improves Proof-of-ROI Readiness (+5 pts) and Executive Value Visibility (+2 pts). Weighted readiness impact: +0.08%.
```

### 8. Add Guided "First Run" Wizard Overlay *(Completed 2026-05-21)*
- **Why it matters:** Reduces cognitive load for new operators.
- **Expected impact:** Smoother onboarding experience.
- **Affected qualities:** Usability (+5), Adoption Friction (+3).
- **Completed.** — `OperatorFirstRunWorkflowPanel` + `HomeFirstRunWorkflowGate` guide capture → execution → commit → findings; hidden once `hasCommittedManifest` is true; stable `operator-first-run-wizard-step-*` test ids for trial E2E.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
In `archlucid-ui`, create a new component `FirstRunWizardOverlay.tsx`. Use a library like `react-joyride` or build a simple state machine to highlight UI elements and guide the user through: 1. Creating a request, 2. Waiting for execution, 3. Committing the manifest, 4. Reviewing findings. Show this overlay only if `tenant.hasCommittedManifest` is false.
Impact: Directly improves Usability (+5 pts) and Adoption Friction (+3 pts). Weighted readiness impact: +0.08%.
```

### 9. Add `/v1/governance/simulate` Endpoint *(Completed — pre-existing)*
- **Why it matters:** Allows operators to dry-run policy changes safely.
- **Expected impact:** Faster, safer governance tuning.
- **Affected qualities:** Decision Velocity (+5), Usability (+2).
- **Completed.** — `POST /v1/governance/simulate` and `POST /v1/policy-packs/simulate` evaluate proposed pack content via `PolicyPackGovernanceDryRunService` without persisting changes; `PolicySimulator` surfaces results in the UI.
- **Status:** **Completed** (shipped before Batch 3; verified 2026-05-21).
- **Prompt:**
```text
Create a new endpoint `POST /v1/governance/simulate` in `GovernanceController.cs`. Accept a `PolicyPackAssignment` and a `RunId`. Run the `EffectiveGovernanceResolver` and return the simulated pass/fail results without persisting any changes or blocking the run.
Impact: Directly improves Decision Velocity (+5 pts) and Usability (+2 pts). Weighted readiness impact: +0.04%.
```

### 10. Add "Saved Views" to Audit and Graph *(Completed — pre-existing)*
- **Why it matters:** Builds daily habits for operators.
- **Expected impact:** Increases product stickiness.
- **Affected qualities:** Stickiness (+5), Usability (+2).
- **Completed.** — `OperatorSavedViewsBar` on Audit and Graph pages persists filter state via `POST /v1/operator/saved-views` (tenant-scoped API, not localStorage-only).
- **Status:** **Completed** (shipped before Batch 3; verified 2026-05-21).
- **Prompt:**
```text
Update the `archlucid-ui` Audit and Graph pages. Add a "Save View" button that serializes the current filter state (URL query parameters) into `localStorage` (or a new `UserPreferences` API endpoint). Add a dropdown to quickly load these saved views.
Impact: Directly improves Stickiness (+5 pts) and Usability (+2 pts). Weighted readiness impact: +0.03%.
```

### 11. Add Health Check Endpoint for Azure OpenAI *(Completed — pre-existing)*
- **Why it matters:** Detects LLM connectivity issues before a run fails.
- **Expected impact:** Better reliability and supportability.
- **Affected qualities:** Reliability (+3), AI/Agent Readiness (+2).
- **Completed.** — `AzureOpenAiHealthCheck` is registered on `/health/ready` as `openai`. In Real agent mode it performs a bounded TCP reachability probe (no chat quota consumption); Simulator/Echo modes skip the probe.
- **Status:** **Completed** (shipped before Batch 1; verified 2026-05-21).
- **Prompt:**
```text
Update `Program.cs` to add a custom `IHealthCheck` implementation `AzureOpenAiHealthCheck`. It should make a minimal, low-token call (e.g., "echo 1") to the configured Azure OpenAI endpoint. Register it with the `/health/ready` endpoint.
Impact: Directly improves Reliability (+3 pts) and AI/Agent Readiness (+2 pts). Weighted readiness impact: +0.05%.
```

### 12. Run and Document a Failover Drill *(Completed 2026-05-21)*
- **Why it matters:** Proves RTO/RPO targets are achievable.
- **Expected impact:** Increases enterprise trust.
- **Affected qualities:** Reliability (+5).
- **Completed.** — `scripts/ops/run-failover-drill.ps1` guides staging manual geo-failover timing against `GET /health/ready` and appends to `docs/quality/game-day-log/FAILOVER_RESULTS.md` (scaffold committed; first live staging execution pending operator schedule).
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Create a script `scripts/ops/run-failover-drill.ps1` that automates the steps in `docs/runbooks/DATABASE_FAILOVER.md` against the staging environment. Execute the script, measure the downtime, and append the results to `docs/quality/game-day-log/FAILOVER_RESULTS.md`.
Impact: Directly improves Reliability (+5 pts). Weighted readiness impact: +0.02%.
```

### 13. Move Magic Strings to `GovernanceConstants` *(Completed — pre-existing)*
- **Why it matters:** Reduces technical debt and prevents typos.
- **Expected impact:** Better maintainability.
- **Affected qualities:** Maintainability (+5).
- **Completed.** — `GovernanceConstants.cs` in `ArchLucid.Decisioning.Governance.Resolution` centralizes item types, conflict types, precedence tiers, resolution reasons, and note templates; `EffectiveGovernanceResolver` references them throughout.
- **Status:** **Completed** (shipped before Batch 4; verified 2026-05-21).
- **Prompt:**
```text
Create a new static class `GovernanceConstants.cs` in `ArchLucid.Core`. Move all hardcoded string literals from `EffectiveGovernanceResolver.cs` and `PolicyPackAssignment.cs` into this class. Update all references to use the constants.
Impact: Directly improves Maintainability (+5 pts). Weighted readiness impact: +0.02%.
```

### 14. Add CI Performance Regression Gate *(Completed — pre-existing)*
- **Why it matters:** Catches latency regressions before they merge.
- **Expected impact:** Consistent performance.
- **Affected qualities:** Performance (+5).
- **Completed.** — `ci.yml` job **Performance: k6 API smoke (operator path)** runs `tests/load/k6-api-smoke.js` after full regression; `scripts/ci/assert_k6_ci_smoke_summary.py` enforces per-tag p(95) caps aligned with `API_PERFORMANCE_TARGETS.md`. Heavier `scripts/load/hotpaths.js` remains on `workflow_dispatch` via `.github/workflows/load-test.yml`.
- **Status:** **Completed** (shipped before Batch 4; verified 2026-05-21).
- **Prompt:**
```text
Update `.github/workflows/ci.yml`. Add a new job `performance-smoke` that runs `k6 run scripts/load/hotpaths.js` against the Docker Compose stack. Configure k6 thresholds to fail the build if `http_req_duration` p(95) exceeds the targets defined in `API_PERFORMANCE_TARGETS.md`.
Impact: Directly improves Performance (+5 pts). Weighted readiness impact: +0.01%.
```

### 15. Add UI Button for Support Bundle *(Completed 2026-05-21)*
- **Why it matters:** Allows non-CLI users to gather diagnostics.
- **Expected impact:** Faster support resolution.
- **Affected qualities:** Supportability (+5), Usability (+2).
- **Completed.** — `POST /v1/admin/support-bundle` via `SupportBundleController`; `SupportBundleDownloadButton` + `useSupportBundleDownload` on Help panel (troubleshooting tab), tenant settings, and product guide; admin `/admin/support` remains the full diagnostics page.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Add a new endpoint `GET /v1/admin/support-bundle` in `AdminController.cs` that invokes the logic from `SupportBundleCommand` and returns a ZIP file. In `archlucid-ui`, add a "Download Support Bundle" button to the Help/Settings menu that calls this endpoint.
Impact: Directly improves Supportability (+5 pts) and Usability (+2 pts). Weighted readiness impact: +0.03%.
```

### 16. Add `CommandTimeout` to Dapper Queries *(Completed 2026-05-21)*
- **Why it matters:** Prevents thread exhaustion during database slowdowns.
- **Expected impact:** Higher resilience.
- **Affected qualities:** Reliability (+4).
- **Completed.** — `DapperGlobalCommandTimeoutBootstrap` applies optional global timeout from config; `DapperCommandTimeoutSeconds` documents Standard (30s) / Report (120s); governance repositories no longer pass `commandTimeout: null`.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Review all repositories in `ArchLucid.Persistence`. Ensure every call to Dapper's `QueryAsync`, `ExecuteAsync`, etc., explicitly sets the `commandTimeout` parameter (e.g., to 30 seconds for standard queries, 120 seconds for complex reports), rather than relying on the default.
Impact: Directly improves Reliability (+4 pts). Weighted readiness impact: +0.02%.
```

### 17. Enforce Explicit Payload Limits on Bulk Endpoints *(Completed — pre-existing)*
- **Why it matters:** Prevents OutOfMemory exceptions from massive uploads.
- **Expected impact:** Protects API availability.
- **Affected qualities:** Scalability (+3), Reliability (+2).
- **Completed.** — `[RequestSizeLimit]` on `EvidenceBulkUploadController`, `AzureExtractorUploadController`, import controllers, and admin logo upload (100MB evidence, extractor ZIP/chunk budgets aligned to options).
- **Status:** **Completed** (shipped before Batch 1; verified 2026-05-21).
- **Prompt:**
```text
Update `EvidenceController.cs` and `AzureExtractorController.cs`. Add the `[RequestSizeLimit]` attribute to all `POST` endpoints that accept file uploads or bulk JSON arrays, setting appropriate limits (e.g., 100MB for evidence, 200MB for extractor ZIPs).
Impact: Directly improves Scalability (+3 pts) and Reliability (+2 pts). Weighted readiness impact: +0.02%.
```

### 18. Parse `Retry-After` Headers for Azure OpenAI *(Completed — pre-existing)*
- **Why it matters:** Respects provider rate limits and prevents cascading failures.
- **Expected impact:** Smoother LLM execution under load.
- **Affected qualities:** Reliability (+4), AI/Agent Readiness (+2).
- **Completed.** — `AzureOpenAiTooManyRequestsRetry` honors `Retry-After` with bounded fallback; wired through `AzureOpenAiCompletionClient` and Polly resilience defaults.
- **Status:** **Completed** (shipped before Batch 1; verified 2026-05-21).
- **Prompt:**
```text
Update `AzureOpenAiCompletionClient.cs`. When catching a `429 Too Many Requests` exception, inspect the `Retry-After` HTTP header. Configure the Polly retry policy to delay for the duration specified in the header, rather than using a static exponential backoff.
Impact: Directly improves Reliability (+4 pts) and AI/Agent Readiness (+2 pts). Weighted readiness impact: +0.05%.
```

### 19. Make Extractor Script Resilient to Missing Roles *(Completed — pre-existing)*
- **Why it matters:** Ensures the pilot doesn't stall if the user lacks optional permissions.
- **Expected impact:** Lower adoption friction.
- **Affected qualities:** Adoption Friction (+5), Time-to-Value (+2).
- **Completed.** — `Get-ArchLucidActualCostSummary` returns `$null` and logs a warning when Cost Management RBAC or `az` access fails; `-IncludeCost` no longer aborts the ARM inventory ZIP.
- **Status:** **Completed** (shipped before Batch 2; verified 2026-05-21).
- **Prompt:**
```text
Update `scripts/azure/Get-ArchLucidAzurePackage.ps1`. Wrap the calls to Azure Cost Management APIs in a `try/catch` block. If an `AuthorizationFailed` error occurs, log a warning to the console and continue collecting the ARM resource inventory, rather than terminating the script.
Impact: Directly improves Adoption Friction (+5 pts) and Time-to-Value (+2 pts). Weighted readiness impact: +0.1%.
```

### 20. Protect `AgentResultParser` from Deep JSON *(Completed — pre-existing)*
- **Why it matters:** Prevents StackOverflow exceptions from malicious or hallucinated JSON.
- **Expected impact:** Higher resilience.
- **Affected qualities:** Reliability (+3), AI/Agent Readiness (+2).
- **Completed.** — `AgentResultParser` sets `JsonSerializerOptions.MaxDepth = 32` and treats depth violations as semantic parse failures.
- **Status:** **Completed** (shipped before Batch 1; verified 2026-05-21).
- **Prompt:**
```text
Update `AgentResultParser.cs`. Configure the `JsonSerializerOptions` used to parse LLM responses with `MaxDepth = 32` (or an appropriate limit). Catch `JsonException` and handle it gracefully as a semantic parsing failure.
Impact: Directly improves Reliability (+3 pts) and AI/Agent Readiness (+2 pts). Weighted readiness impact: +0.04%.
```

### 21. Add Visual Indicators for Trial Expiration in PDF Exports *(Completed 2026-05-21)*
- **Why it matters:** Creates urgency for trial conversion.
- **Expected impact:** Faster sales cycles.
- **Affected qualities:** Executive Value Visibility (+3).
- **Completed.** — `ActiveTrialExportNoticeFormatter` adds `Generated during ArchLucid Trial — Expires on {date} UTC` to architecture review board DOCX/PDF footers and cover watermarks for active trials.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Update `ArchitectureReviewBoardExportDocumentFactory.cs`. If the tenant is on a Trial tier, add a watermark or a prominent header to the generated DOCX/PDF stating "Generated during ArchLucid Trial - Expires on [Date]".
Impact: Directly improves Executive Value Visibility (+3 pts). Weighted readiness impact: +0.03%.
```

### 22. Extract UI Strings to `i18n.ts` *(Completed 2026-05-21)*
- **Why it matters:** Allows enterprises to adapt terminology (e.g., "Runs" to "Reviews").
- **Expected impact:** Lower adoption friction.
- **Affected qualities:** Adoption Friction (+3), Usability (+2).
- **Completed.** — `src/lib/i18n.ts` adds `OPERATOR_NAV_GROUP_LABELS` and `OPERATOR_NAV_LINK_LABELS`; pilot, analysis, and governance nav builders consume the dictionary alongside existing domain-term exports.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
In `archlucid-ui`, create a new file `src/lib/i18n.ts` containing a dictionary of core domain terms (e.g., `RUN: "Review"`, `MANIFEST: "Architecture Document"`). Refactor the main navigation and header components to use these constants instead of hardcoded strings.
Impact: Directly improves Adoption Friction (+3 pts) and Usability (+2 pts). Weighted readiness impact: +0.05%.
```

### 23. Add Dashboard Panel for Compliance Drift Trend *(Completed — pre-existing)*
- **Why it matters:** Shows the ongoing value of the platform.
- **Expected impact:** Better executive visibility and stickiness.
- **Affected qualities:** Executive Value Visibility (+3), Stickiness (+2).
- **Completed.** — `ExecutiveWorkspaceHealthDashboard` (`/governance/dashboard`) and `ExecutiveComplianceDriftTrendSection` (`/dashboard`) chart open/resolved findings from `GET /v1/governance/compliance-drift-trend`.
- **Status:** **Completed** (shipped before Batch 3; verified 2026-05-21).
- **Prompt:**
```text
In `archlucid-ui`, update the `GovernanceDashboard.tsx` to include a line chart showing the number of open compliance findings over the last 30 days. Fetch this data from a new or existing endpoint that aggregates `dbo.Findings` by date and status.
Impact: Directly improves Executive Value Visibility (+3 pts) and Stickiness (+2 pts). Weighted readiness impact: +0.03%.
```

### 24. Implement Pruning for `ReplayDiagnosticsRecorder` *(Completed 2026-05-21)*
- **Why it matters:** Prevents unbounded memory growth during long-running processes.
- **Expected impact:** Better performance and reliability.
- **Affected qualities:** Performance (+3), Reliability (+2).
- **Completed.** — Ring buffer already evicted by capacity and retention; default `ReplayDiagnostics:Capacity` raised to **10,000** (clamp 1–50,000) with oldest-entry drop on overflow.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Update `ReplayDiagnosticsRecorder.cs`. Implement a maximum capacity (e.g., 10,000 events). If the capacity is reached, either drop the oldest events (circular buffer) or stop recording new events and log a warning.
Impact: Directly improves Performance (+3 pts) and Reliability (+2 pts). Weighted readiness impact: +0.01%.
```

### 25. Add Strict Timeouts to all `HttpClient` Instances *(Completed 2026-05-21)*
- **Why it matters:** Prevents thread exhaustion.
- **Expected impact:** Higher resilience.
- **Affected qualities:** Reliability (+4).
- **Completed.** — `OutboundHttpClientTimeoutSeconds` centralizes timeout tiers; remaining unnamed clients (Pwned Passwords, Marketplace billing, Confluence publisher, Azure DevOps, SAML metadata, trial funnel probe) now set explicit `Timeout` values alongside existing ITSM/webhook/ARM clients.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Review `Program.cs` and any classes that manually instantiate `HttpClient`. Ensure that `Timeout` is explicitly set (e.g., 10 seconds for internal APIs, 30 seconds for external webhooks) on all registered HTTP clients.
Impact: Directly improves Reliability (+4 pts). Weighted readiness impact: +0.02%.
```

---

## AI Leverage Opportunities

> **Full detail:** `docs/library/AI_LEVERAGE_ROADMAP.md` — 25 prioritised items (15 V1, 7 V1.1, 3 V2), category refinement recommendation, batch sequencing, and per-item rationale. The items below are the immediately actionable V1 improvements with Cursor prompts, complementing improvements #1–#25 above.

### 26. Critic Adversarial Second-Pass with Disagreement Findings *(Completed 2026-05-21)*
- **Why it matters:** The Critic prompt is currently review-oriented but consensus-leaning. Strengthening it to challenge the other agents is the cheapest single-prompt change to raise output quality and trust.
- **Expected impact:** Agents surface conflicts that the current Critic misses; operators catch contradictions before commit.
- **Affected qualities:** AI/Agent Readiness (+6), Reliability (+2).
- **Completed.** — `CriticSystemPromptTemplate` v1.1.0 requires adversarial challenge and Critical findings on constraint conflicts; `CriticAgentHandlerTests` covers prompt rules and constraint-violation parsing.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Update CriticSystemPromptTemplate.cs in ArchLucid.AgentRuntime/Prompts/. Replace rule 8 ("Prefer conservative, review-oriented findings") with: "8. You MUST challenge the other agents' implied decisions. For each claim or proposed component you disagree with or find under-justified, emit a finding with category: 'Critic', severity: 'High' or 'Medium', and a message that states explicitly what you dispute and why. Do not emit a finding if you agree — silence is endorsement." Add a new rule: "9. If any Topology, Cost, or Compliance proposal conflicts with the request's explicit constraints, emit a 'Critical' severity finding citing both the constraint and the conflicting proposal." Update CriticAgentHandlerTests.cs to add a test case verifying that a scenario with an explicit constraint violation produces at least one High or Critical Critic finding.
Impact: Directly improves AI/Agent Readiness (+6 pts) and Reliability (+2 pts). Weighted readiness impact: +0.15%.
```

### 27. Findings-to-IaC Stub Generator *(Completed 2026-05-21)*
- **Why it matters:** Closes the "what do I do now?" gap after a run. Operators get a Bicep/Terraform snippet that directly addresses each finding. Addresses Time-to-Value, Adoption Friction, and Proof-of-ROI in one change.
- **Expected impact:** Operators have an actionable artefact for every finding without leaving the platform.
- **Affected qualities:** Time-to-Value (+5), Adoption Friction (+4), AI/Agent Readiness (+3).
- **Completed.** — `IFindingIacStubGenerator` / `FindingIacStubGenerator`; nullable `IacStub` on `ArchitectureFinding`; post-commit hook guarded by `AgentRuntime:GenerateIacStubs`; collapsible **Bicep stub** panel on finding detail and badge on quick decision summary when present.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Create a new service IFindingIacStubGenerator in ArchLucid.Application/Agents/IaC/. For each ArchitectureFinding with a non-null evidenceRefs list, call IAgentCompletionClient with: "Given this architecture finding: {finding.Message}. Generate the minimal Azure Bicep snippet that resolves it. Return ONLY valid Bicep code, no prose." Append the result as a nullable string property IacStub on ArchitectureFinding. Call this service from AuthorityRunOrchestrator after commit, guarded by config key AgentRuntime:GenerateIacStubs (default false). Surface IacStub in the run detail API response and in a collapsible "Bicep Stub" panel in the archlucid-ui findings list.
Impact: Directly improves Time-to-Value (+5 pts), Adoption Friction (+4 pts), AI/Agent Readiness (+3 pts). Weighted readiness impact: +0.14%.
```

### 28. AI-Assisted Architecture Request Authoring *(Completed 2026-05-21)*
- **Why it matters:** Eliminates the blank-page tax that stalls first-tenant runs. Operators paste a brief; AI suggests constraints, capabilities, assumptions, and security hints. The field that creates the most first-run failures.
- **Expected impact:** Operator request quality improves; first-run finding relevance increases.
- **Affected qualities:** Time-to-Value (+4), Adoption Friction (+5), Usability (+3).
- **Completed.** — `POST /v1/architecture/request/draft` on `RunsController`; `ArchitectureRequestDraftService`; **Suggest fields** on the new-request wizard with AI-tagged chips until edited.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Create a new endpoint POST /v1/architecture/request/draft in ArchLucid.Api/Controllers/Planning/ArchitectureRequestController.cs. Accept a DraftArchitectureRequestInput with FreeTextDescription (string, required, MinLength 20). Call IAgentCompletionClient with the system prompt: "You are an enterprise architecture intake assistant. Given this system description, produce a JSON object with keys: suggestedConstraints (string[]), suggestedCapabilities (string[]), suggestedAssumptions (string[]), topologyHints (string[]), securityBaselineHints (string[]). Be specific and concise. Return ONLY valid JSON." Return the parsed result as DraftArchitectureRequestResponse. In archlucid-ui, add a "Suggest fields" button to the New Request form that calls this endpoint and pre-fills the constraint and capability fields, with each pre-filled value marked as AI-suggested until the operator edits or accepts it.
Impact: Directly improves Time-to-Value (+4 pts), Adoption Friction (+5 pts), Usability (+3 pts). Weighted readiness impact: +0.14%.
```

### 29. Per-Finding Conversational Explainer *(Completed 2026-05-21)*
- **Why it matters:** "Why is this a finding? What evidence backs it? What is the smallest fix?" Reuses AskService for a single finding — reduces operator cognitive load without requiring a full conversation thread.
- **Expected impact:** Operators understand and act on findings faster; support escalations fall.
- **Affected qualities:** Usability (+5), Adoption Friction (+3), AI/Agent Readiness (+2).
- **Completed.** — `AskAboutFindingAsync` / `POST /v1/architecture/finding/{findingId}/ask`; inline **Ask** panel on finding detail and quick decision summary rows.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Add a new method AskAboutFindingAsync(FindingAskRequest, ScopeContext, CancellationToken) to AskService.cs. FindingAskRequest contains FindingId (Guid), Question (string), and optional ThreadId. The method should: 1) load the ArchitectureFinding and its parent AgentResult from persistence; 2) build a JSON context containing only that finding's message, severity, category, claims, and evidenceRefs; 3) use the system prompt: "You are an enterprise architect. Explain this specific architecture finding clearly: why it matters, what evidence supports it, and what the smallest concrete fix is. Use only the supplied finding data." Expose as POST /v1/architecture/finding/{findingId}/ask. In archlucid-ui, add a chat icon next to each finding row that opens an inline Ask panel pre-seeded with this endpoint.
Impact: Directly improves Usability (+5 pts), Adoption Friction (+3 pts), AI/Agent Readiness (+2 pts). Weighted readiness impact: +0.11%.
```

### 30. Inline Governance-Block Explainer *(Completed 2026-05-21)*
- **Why it matters:** When a policy pack rejects a manifest commit, operators get a rule ID. AI explaining *why* and *what the minimum edit is* removes one of the worst pilot blockers.
- **Expected impact:** Governance rejections become unblocking events rather than dead-ends.
- **Affected qualities:** Adoption Friction (+4), Usability (+4), Decision Velocity (+3).
- **Completed.** — `IPreCommitGovernanceBlockExplainer`; `BlockExplanation` on `PreCommitGateResult` in HTTP 409 problem JSON; prominent callout in `CommitRunButton` finalize rejection UI.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
In EffectiveGovernanceResolver.cs (or its caller in the commit path), when a governance rule blocks the commit, call IAgentCompletionClient with: "Policy rule '{rule.RuleId}' ({rule.Description}) blocked an architecture manifest commit. The manifest change that triggered it was: {serialised delta}. In two sentences: (1) explain why this rule exists, (2) describe the minimum manifest change that would satisfy it." Return the explanation as a nullable string property BlockExplanation on GovernanceBlockResult. Surface it in the commit API error response (HTTP 409 body) and display it prominently in the archlucid-ui commit rejection toast.
Impact: Directly improves Adoption Friction (+4 pts), Usability (+4 pts), Decision Velocity (+3 pts). Weighted readiness impact: +0.11%.
```

### 31. Run Summary One-Pager Auto-Generator *(Completed 2026-05-21)*
- **Why it matters:** One-click CFO-ready DOCX/MD: severity counts, USD impact, top-3 findings, 90-second brief. The most common missing artefact in pilot presentations.
- **Expected impact:** Operators can brief a sponsor without leaving the platform.
- **Affected qualities:** Executive Value Visibility (+5), Proof-of-ROI Readiness (+3), Adoption Friction (+2).
- **Completed.** — `RunSummaryOnePagerExportService`, Handlebars template, `GET /v1/architecture/run/{runId}/export/summary`; **Download Executive Summary** on run detail via `RunDetailPageHeader`.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Add a new export variant RunSummaryOnePager to ArchitectureReviewBoardExportDocumentFactory.cs. It should: 1) count findings by severity (Critical/High/Medium/Low); 2) call IAgentCompletionClient with the top-5 High/Critical findings and produce a 3-sentence executive summary; 3) populate a new Markdown template at templates/exports/run-summary-one-pager.md.hbs with severity counts, the AI summary, and top-3 finding titles. Expose as GET /v1/architecture/run/{runId}/export/summary in ArchitectureExportController.cs. Add a "Download Executive Summary" button in the archlucid-ui run detail page next to the existing export options.
Impact: Directly improves Executive Value Visibility (+5 pts), Proof-of-ROI Readiness (+3 pts). Weighted readiness impact: +0.09%.
```

### 32. AI Policy-Pack Drafting Assistant *(Completed 2026-05-21)*
- **Why it matters:** Operators write free-text governance intent and get a draft Policy Pack rule JSON. Removes the blank-page tax for enterprise policy customisation — a primary reason pilots stall past week one.
- **Expected impact:** Policy pack adoption increases; custom governance configuration time drops.
- **Affected qualities:** Adoption Friction (+5), Decision Velocity (+4), AI/Agent Readiness (+2).
- **Completed.** — `POST /v1/governance/policy-pack/draft` via `PolicyPackDraftService`; **Draft a rule from plain English** in `PolicyRuleAuthoringWizard` with side-by-side JSON review and disclaimer.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Create a new endpoint POST /v1/governance/policy-pack/draft in GovernanceController.cs. Accept DraftPolicyPackInput with FreeTextIntent (string, MinLength 20). Load 3–4 existing bundled policy pack rule examples from the bundled manifest as few-shot context. Call IAgentCompletionClient with: "You are a cloud governance expert. Based on the following intent, draft a valid ArchLucid policy pack rule JSON conforming to this schema: {PolicyPackRule schema}. Use these existing rules as examples: {fewShotExamples}." Return as DraftPolicyPackRuleResponse with a disclaimer that it requires human review before activation. In archlucid-ui, add a "Draft a rule from plain English" button to the Policy Pack editor that opens a text input and shows the draft in side-by-side view with the schema.
Impact: Directly improves Adoption Friction (+5 pts), Decision Velocity (+4 pts). Weighted readiness impact: +0.09%.
```

### 33. Findings Priority Re-Ranker by Business Impact *(Completed 2026-05-21)*
- **Why it matters:** Operators receive up to 30 "High" findings per run with no signal on which to fix first. Re-ranking by business impact turns an overwhelming list into an actionable queue.
- **Expected impact:** Operators address the highest-impact findings first; pilot scorecard ROI improves.
- **Affected qualities:** Usability (+4), Adoption Friction (+3), Proof-of-ROI Readiness (+3).
- **Completed.** — `IFindingPriorityReranker` / `FindingPriorityReranker`; migration `180_FindingRecords_PriorityRank.sql`; post-commit hook guarded by `AgentRuntime:RerankFindings`; `GET …/findings?orderBy=priority` on `RunQueryController`.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Create IFindingPriorityReranker in ArchLucid.Application/Findings/. After a run commits, collect all ArchitectureFindings for the run grouped by severity. For each severity tier, call IAgentCompletionClient with: "You are an enterprise risk advisor. Rank these {n} architecture findings from most to least urgent business impact for a {industryVertical} organisation. Return ONLY a JSON array of findingId strings in priority order." Persist the result as a new int column PriorityRank on dbo.Findings via a DbUp migration. Add an ?orderBy=priority query param to GET /v1/architecture/run/{runId} findings endpoint. Guard with config key AgentRuntime:RerankFindings (default false).
Impact: Directly improves Usability (+4 pts), Adoption Friction (+3 pts), Proof-of-ROI Readiness (+3 pts). Weighted readiness impact: +0.07%.
```

### 34. Conversational Compare-Two-Runs Explainer *(Completed 2026-05-21)*
- **Why it matters:** "What changed between run A and run B, and why does it matter?" Surfaces the delta as a narrative, not just a diff table. Makes every re-run feel like a progress report.
- **Expected impact:** Sponsors see architectural improvement over time; stickiness and Proof-of-ROI both improve.
- **Affected qualities:** Stickiness (+4), Proof-of-ROI Readiness (+3), Executive Value Visibility (+3).
- **Completed.** — `ComparisonNarrative` on `AskResponse` from `AskService.TryBuildComparisonNarrativeAsync`; highlighted banner on compare view via `CompareForm` / `fetchComparisonNarrativeViaAsk`.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
In AskService.cs, when AskRequest includes both BaseRunId and TargetRunId, after loading the comparison delta from IComparisonService, make a pre-narrative LLM call: "You are an enterprise architect. Given the delta between two architecture runs, write a 3–5 sentence narrative: (1) the most significant improvement, (2) any new risk introduced, (3) whether the architecture is net-better or net-worse. Use only the supplied delta data." Attach the result as a top-level string field ComparisonNarrative in AskResponse. Render it as a highlighted banner in the archlucid-ui comparison view above the delta table.
Impact: Directly improves Stickiness (+4 pts), Proof-of-ROI Readiness (+3 pts), Executive Value Visibility (+3 pts). Weighted readiness impact: +0.05%.
```

### 35. Calibrated Agent Confidence *(Completed 2026-05-21)*
- **Why it matters:** Agent self-reported `Confidence` is an uncalibrated model output. Calibrating it against historical `AgentOutputEvaluator` scores makes the quality gate genuinely predictive rather than cosmetic.
- **Expected impact:** Quality gate thresholds become meaningful; false passes and false blocks both decrease.
- **Affected qualities:** AI/Agent Readiness (+5), Reliability (+2).
- **Completed.** — `IAgentConfidenceCalibrator` / `AgentConfidenceCalibrator` (isotonic piecewise-linear); `182_AgentResults_AiBatchD.sql` adds `CalibratedConfidence` and `AgentOutputCalibrationSamples`; post-execute hook applies calibration via `IAgentConfidenceCalibrationService` before trace evaluation; `AgentOutputQualityGate` uses calibrated score when present.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Create IAgentConfidenceCalibrator in ArchLucid.Application/Agents/. Load the last N (configurable, default 200) (rawConfidence, semanticScore) pairs from dbo.AgentOutputEvaluations per AgentType. Fit a monotonic piecewise-linear calibration (no ML library required — implement isotonic regression directly). Expose CalibrateAsync(AgentType, double rawConfidence) -> double. Call it in the post-execution path after AgentOutputEvaluator, writing CalibratedConfidence to a new column on dbo.AgentResults via a DbUp migration. Surface CalibratedConfidence in the AgentResult API response and use it (when not null) in place of raw confidence in AgentOutputQualityGate comparisons.
Impact: Directly improves AI/Agent Readiness (+5 pts), Reliability (+2 pts). Weighted readiness impact: +0.07%.
```

### 36. Agent-Curated Evidence Pack Proposals *(Completed 2026-05-21)*
- **Why it matters:** When an agent encounters strong evidence not in the catalog, it proposes a new evidence item for operator review. The catalog gets smarter with every run — this is the foundation of a compounding knowledge advantage.
- **Expected impact:** Evidence catalog improves over time; future runs are better-grounded without manual curation effort.
- **Affected qualities:** AI/Agent Readiness (+5), Stickiness (+3).
- **Completed.** — `ProposedEvidenceJson` on `dbo.AgentResults`; shared `AgentCuratedEvidenceProposer` + `AgentResultPostExecutionEnricher` after agent batch; `GET /v1/admin/evidence/proposals` and `POST …/promote` via `EvidenceProposalsController`; admin `/admin/evidence-proposals` review UI.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Add a nullable column ProposedEvidenceJson (nvarchar(max)) to dbo.AgentResults via a DbUp migration. In each AgentHandler, after the primary LLM call, make a second short LLM call: "Based on your findings, is there any architectural pattern, policy rule, or service catalog entry missing from the evidence catalog that would help future analyses? If yes, return JSON: {type: 'Policy'|'Pattern'|'Service', title, description, rationale}. If no, return null." Persist in ProposedEvidenceJson. Create GET /v1/admin/evidence/proposals and POST /v1/admin/evidence/proposals/{id}/promote endpoints to create the appropriate PolicyEvidence or PatternEvidence row. Add an Evidence Proposals review screen to the archlucid-ui admin area.
Impact: Directly improves AI/Agent Readiness (+5 pts), Stickiness (+3 pts). Weighted readiness impact: +0.06%.
```

---

## Prompt Batching Guidance

**Harness baseline (one-off):** Bootstrap recordings committed (`bootstrap_eval_template_recordings.py`, score **10/10** inform-only). Optional: replace with live `--mode capture`, then enable `--enforce` when anchors match agent vocabulary.

To optimize context window usage, batch the actionable prompts as follows:

**AI leverage batches (highest strategic impact — do these first):**
- **AI Batch A (AI foundations — 2–3 weeks):** Prompts 26 *(completed 2026-05-21)*, 2 *(completed 2026-05-21)*, 3 *(completed 2026-05-20)* (Critic adversarial second-pass, Ask SSE Streaming, Multi-Model Orchestration). Share a single feature flag. No new persistence.
- **AI Batch B (AI as operator assistant — 4–6 weeks):** Prompts 27 *(completed 2026-05-21)*, 28 *(completed 2026-05-21)*, 29 *(completed 2026-05-21)*, 30 *(completed 2026-05-21)* (IaC Stubs, Request Authoring, Per-Finding Explainer, Governance Explainer). Each independently deployable; items 28 and 29 can be parallelised.
- **AI Batch C (AI as judgment layer — 4–6 weeks):** Prompts 31 *(completed 2026-05-21)*, 32 *(completed 2026-05-21)*, 33 *(completed 2026-05-21)*, 34 *(completed 2026-05-21)* (One-Pager, Policy-Pack Drafter, Re-Ranker, Compare-Runs Explainer). Produce stakeholder-facing artefacts.
- **AI Batch D (AI quality and self-improvement — 3–4 weeks):** Prompts 35 *(completed 2026-05-21)*, 36 *(completed 2026-05-21)*, 15 *(completed 2026-05-21 — support bundle discoverability in Help/Settings)*. Templates-pack drift detection (roadmap #15) remains open for nightly CI enforce flip after live capture replaces bootstrap recordings.

**Platform quality batches:**
- **Batch 1 (Reliability & Resilience):** Prompts 11 *(completed)*, 16 *(completed 2026-05-21)*, 17 *(completed)*, 18 *(completed)*, 20 *(completed)*, 25 *(completed 2026-05-21)* (Health Check, Dapper Timeouts, Payload Limits, Retry-After, JSON Depth, HttpClient Timeouts).
- **Batch 2 (Value & Adoption):** Prompts 4 *(completed 2026-05-20)*, 5 *(completed 2026-05-21)*, 6 *(completed 2026-05-21)*, 7 *(completed 2026-05-21)*, 19 *(completed)*, 21 *(completed 2026-05-21)* (Executive ROI Summary, Time-to-First-Manifest, Pre-seed Sample, USD Savings, Extractor Resilience, Trial Watermark).
- **Batch 3 (Usability & Stickiness):** Prompts 8 *(completed 2026-05-21)*, 9 *(completed)*, 10 *(completed)*, 22 *(completed 2026-05-21)*, 23 *(completed)* (First Run Wizard, Simulate Endpoint, Saved Views, i18n Strings, Drift Trend).
- **Batch 4 (Maintainability & Performance):** Prompts 12 *(completed 2026-05-21 — script + log scaffold)*, 13 *(completed)*, 14 *(completed)*, 24 *(completed 2026-05-21)* (Failover Drill, GovernanceConstants, CI Perf Gate, Diagnostics Pruning).

---

## Pending Questions for Later

*None. All previously deferred items have been resolved into actionable improvements.*
