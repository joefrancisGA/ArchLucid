# ArchLucid Assessment – (A) Headline Readiness: 77.29%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, explicitly excluding deferred items such as SOC 2 CPA attestation, third-party pen tests, signed design partners, and live commerce un-holds.

## Executive Summary

**(A) Overall Headline Readiness**
ArchLucid possesses a robust, functionally complete V1 technical foundation. The core pilot loop (request → execute → commit → artifacts) is operational and supported by strong isolation and durable auditing. However, the current readiness is constrained by adoption friction and time-to-value hurdles, primarily due to the manual nature of Azure extraction, the lack of automated baseline ROI inputs, and UI workflows that still impose moderate cognitive load despite recent vocabulary improvements.

**(B) Procurement & Market-Motion Realism (Informational)**
Enterprise procurement will face friction. The absence of a CPA-issued SOC 2 Type II report and a third-party penetration test will trigger extended security reviews. Additionally, the lack of a published reference customer or signed design partner weakens social proof for early enterprise buyers.

**Commercial Picture**
The commercial motion is currently sales-led. While the pricing philosophy and packaging tiers are well-defined, the explicit deferral of Stripe live keys and Azure Marketplace publication blocks zero-touch self-serve revenue. Curated demo workspaces and default policy packs assist sales, but realizing hard ROI requires manual tenant effort.

**Enterprise Picture**
Enterprise readiness is solid, featuring native SAML 2.0 SP, OIDC support, and database-per-tenant isolation. However, workflow embeddedness is hindered by the blocked ServiceNow integration (awaiting dev credentials), and the lack of out-of-the-box multi-region failover limits appeal to top-tier regulated entities.

**Engineering Picture**
The engineering foundation is highly reliable, backed by DbUp migrations, SQL persistence, and the new Durable Task Framework (DTF) port. Testability is improving with live E2E tests, though mock reliance remains high for negative paths. Observability is good but lacks granular state transition logging for DTF, and worker concurrency limits require manual tuning rather than auto-scaling.

---

## Weighted Quality Assessment

### 1. AI/Agent Readiness
- **Score:** 75
- **Weight:** 8
- **Weighted deficiency signal:** 200
- **Justification:** The DTF SQL port is implemented and LLM traces are shipped, but the staged critic process is slow and DTF orchestrations lack deep state transition logging.
- **Tradeoffs:** Trading immediate execution speed for durable, orchestratable agent steps.
- **Improvement recommendations:** Introduce explicit state machine transition logging in the Durable Task Framework orchestrator.

### 2. Correctness
- **Score:** 80
- **Weight:** 8
- **Weighted deficiency signal:** 160
- **Justification:** High confidence in the SQL boundaries and DbUp migrations, but edge cases remain with complex negative paths and trial exhaustion states.
- **Tradeoffs:** Mock-heavy testing for negative paths leaves some edge cases undiscovered in live environments.
- **Improvement recommendations:** Expand `live-api-negative-paths.spec.ts` with trial exhaustion (402) scenarios.

### 3. Adoption Friction
- **Score:** 75
- **Weight:** 6
- **Weighted deficiency signal:** 150
- **Justification:** Tier 1 Azure extraction is manual (PowerShell script), which slows down the "aha" moment for new evaluators.
- **Tradeoffs:** Zero vendor access to customer clouds (Tier 1) prioritizes security over onboarding speed.
- **Improvement recommendations:** Add a `Copy to Clipboard` button for the Azure Extractor PowerShell script in the UI to streamline the manual step.

### 4. Time-to-Value
- **Score:** 80
- **Weight:** 7
- **Weighted deficiency signal:** 140
- **Justification:** Core pilot is well defined, but requires manual baseline inputs to generate meaningful ROI reports.
- **Tradeoffs:** Relying on user-provided baselines ensures accuracy but delays value realization.
- **Improvement recommendations:** Add a warning indicator for missing baseline inputs on the Governance dashboard.

### 5. Workflow Embeddedness
- **Score:** 60
- **Weight:** 3
- **Weighted deficiency signal:** 120
- **Justification:** Jira sync is status-only, and ServiceNow bi-directional sync is completely blocked pending developer credentials.
- **Tradeoffs:** Waiting for free PDI credentials preserves budget but stalls a critical enterprise integration.
- **Improvement recommendations:** DEFERRED ServiceNow bi-directional sync.

### 6. Proof-of-ROI Readiness
- **Score:** 80
- **Weight:** 5
- **Weighted deficiency signal:** 100
- **Justification:** Cost heuristic estimators and value reports are present, but cross-tenant analytics are missing for portfolio-wide proof.
- **Tradeoffs:** Tenant isolation makes cross-tenant aggregations technically and securely complex.
- **Improvement recommendations:** Add cross-tenant analytics metrics job (internal only).

### 7. Usability
- **Score:** 70
- **Weight:** 3
- **Weighted deficiency signal:** 90
- **Justification:** The vocabulary aligns with marketing, but the product surface is vast, and progressive disclosure needs stricter guardrails. The 30-file bulk upload limit is a hard constraint.
- **Tradeoffs:** Showing the full power of the platform vs. overwhelming first-time operators.
- **Improvement recommendations:** Add a dry-run flag to the `archlucid run commit` CLI command.

### 8. Differentiability
- **Score:** 80
- **Weight:** 4
- **Weighted deficiency signal:** 80
- **Justification:** Evidence-linked findings differentiate from generic AI, but this is sometimes buried in the UI.
- **Tradeoffs:** A dense UI dilutes the core differentiator.
- **Improvement recommendations:** Refine operator UI tooltips to explicitly focus on evidence-linked findings.

### 9. Commercial Packaging Readiness
- **Score:** 65
- **Weight:** 2
- **Weighted deficiency signal:** 70
- **Justification:** Entirely sales-led motion. Stripe live keys and Marketplace listings are explicitly deferred to V1.1.
- **Tradeoffs:** Manual sales control prevents self-serve revenue but controls early-stage customer experience.
- **Improvement recommendations:** DEFERRED Commerce Un-hold (Stripe/Marketplace).

### 10. Executive Value Visibility
- **Score:** 85
- **Weight:** 4
- **Weighted deficiency signal:** 60
- **Justification:** Architecture review DOCX export with consultant whitelabeling is highly effective, but abstract if baselines are skipped.
- **Tradeoffs:** None.
- **Improvement recommendations:** Add a 'Missing Baseline' warning to the executive sponsor PDF export.

### 11. Decision Velocity
- **Score:** 75
- **Weight:** 2
- **Weighted deficiency signal:** 50
- **Justification:** Operators still need to dig to verify AI confidence, slowing down approval workflows.
- **Tradeoffs:** Presenting too much data vs. too little.
- **Improvement recommendations:** Expose finding confidence scores visually on the operator UI review page.

### 12. Compliance Readiness
- **Score:** 75
- **Weight:** 2
- **Weighted deficiency signal:** 50
- **Justification:** SOC 2 self-assessment and GDPR deletion exist, but CPA attestation is deferred.
- **Tradeoffs:** Saving auditing costs at the expense of enterprise procurement friction.
- **Improvement recommendations:** Implement structured JSON logging for the `TenantDeletionService`.

### 13. Reliability
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Justification:** DTF parity is tested and concurrency limits protect workers, but Redis dependency lacks automated fallbacks.
- **Tradeoffs:** Single-process vs. distributed caching complexity.
- **Improvement recommendations:** Add a fallback to MemoryCache when Redis is unreachable for hot path reads.

### 14. Maintainability
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Justification:** Clean architecture, but the sheer size of the monorepo risks boundary leakage.
- **Tradeoffs:** Monorepo velocity vs. strict boundary enforcement.
- **Improvement recommendations:** Add ArchUnitNET tests to enforce that `ArchLucid.Application` does not reference `ArchLucid.Api`.

### 15. Explainability
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Justification:** Knowledge graph temporal snapshots and explanation endpoints provide good reasoning depth.
- **Tradeoffs:** None.
- **Improvement recommendations:** Add a one-click 'View Evidence' deep-link next to every finding in the UI.

### 16. Stickiness
- **Score:** 70
- **Weight:** 1
- **Weighted deficiency signal:** 30
- **Justification:** Good governance workflows, but the lack of broad internal ROI tracking makes it harder to prove long-term value to sponsors.
- **Tradeoffs:** Focusing on single-run value over long-term trend analysis.
- **Improvement recommendations:** None (addressed by cross-tenant analytics).

### 17. Interoperability
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Justification:** SAML SP, OIDC, and Slack chat-ops are strong integration points.
- **Tradeoffs:** Maintaining multiple auth pathways increases operational burden.
- **Improvement recommendations:** None (V1 complete).

### 18. Cognitive Load
- **Score:** 70
- **Weight:** 1
- **Weighted deficiency signal:** 30
- **Justification:** The product surface is massive. Progressive disclosure exists but can still overwhelm.
- **Tradeoffs:** Capability depth vs. simplicity.
- **Improvement recommendations:** Add an empty state illustration to the Alerts inbox when no rules are configured.

### 19. Scalability
- **Score:** 75
- **Weight:** 1
- **Weighted deficiency signal:** 25
- **Justification:** Container apps and worker orchestration scale well, but lack auto-scaling hooks for queue depth.
- **Tradeoffs:** Manual scaling reduces infrastructure cost surprises but risks bottlenecking.
- **Improvement recommendations:** Implement auto-scaling rules documentation for the worker pool based on queue depth.

### 20. Accessibility
- **Score:** 75
- **Weight:** 1
- **Weighted deficiency signal:** 25
- **Justification:** Axe-core is in CI, but executive exports lack automated accessibility assertions.
- **Tradeoffs:** Automated checks cannot replace participant studies (deferred).
- **Improvement recommendations:** Add Playwright accessibility assertions to the generated Architecture Review preview pages.

### 21. Template and Accelerator Richness
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** AI Governance and Security Baseline packs are shipped, but CAF landing-zone is deferred.
- **Tradeoffs:** Shipping MVP packs prevents "empty shell" syndrome without over-committing to full frameworks.
- **Improvement recommendations:** Add a CI check that validates `DefaultPolicyPackTemplates` against the JSON schema.

### 22. Performance
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Rate limiting and SQL open retries are solid.
- **Tradeoffs:** None.
- **Improvement recommendations:** None (V1 complete).

### 23. Cost-Effectiveness
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Tenant budgets and cost estimation heuristics are well implemented.
- **Tradeoffs:** None.
- **Improvement recommendations:** Expose `LlmDailyTenantBudget` usage fraction on the operator dashboard.

### 24. Supportability
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** Excellent diagnostics and correlation ID support.
- **Tradeoffs:** Operational scripts sometimes lack parity with API header capabilities.
- **Improvement recommendations:** Enhance `v1-rc-drill.ps1` to parse and log the correlation ID from response headers.

### 25. Observability
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** Strong OpenTelemetry metrics and LLM traces.
- **Tradeoffs:** Granular throttling events are not always clearly metricized.
- **Improvement recommendations:** Add an explicit error metric for `AuthorityTenantConcurrencyLimitExceededException` (429s).

### 26. Testability
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** Live E2E testing covers golden paths effectively.
- **Tradeoffs:** Demo workspace health is sometimes tested late in the cycle.
- **Improvement recommendations:** Extend `release-smoke.ps1` to validate the `GET /v1/demo/preview` anonymous endpoint.

---

## Top 12 Most Important Weaknesses

1. **Sales-led friction for self-serve users** due to deferred Stripe checkout and Azure Marketplace listings.
2. **Abstract ROI for enterprise buyers** if they skip the manual baseline configuration during onboarding.
3. **Lack of cross-tenant analytics** makes internal value aggregation difficult for sales and customer success.
4. **Heavy reliance on manual Azure extractor scripts** without automated Tier 2 ingestion.
5. **Missing ITSM sync completeness**, specifically ServiceNow being blocked on developer instance credentials.
6. **High cognitive load** for operators navigating the extended governance UI without sufficient progressive disclosure empty states.
7. **DTF orchestration implementation lacks deep observability** and explicit state transition logging.
8. **Limited baseline rule depth** in default policy packs creates a "blank slate" problem for non-security evaluations.
9. **Missing visual confidence indicators** and evidence deep-links on findings reduces decision velocity.
10. **Rigid 30-file bulk upload limit** restricts usage in dossier-heavy evaluations.
11. **Absence of auto-scaling hooks** for worker concurrency under high tenant load.
12. **Residual reliance on mocked E2E tests** for complex negative paths risks untested commercial edge cases in production.

---

## Top 6 Monetization Blockers

1. **Deferred Stripe live keys and Azure Marketplace publication** entirely blocks zero-touch revenue.
2. **Missing automated Tier 2 Azure extraction** delays hard ROI realization for infrastructure savings.
3. **Absence of a published reference customer or case study** limits social proof for enterprise procurement.
4. **Missing cross-tenant analytics** limits sales engineers from aggregating value across active pilots.
5. **Lack of immediate executive value visibility** if ROI baselines are not manually entered during onboarding.
6. **The manual nature of the guided pilot motion** fundamentally limits scale until self-serve is unblocked.

---

## Top 6 Enterprise Adoption Blockers

1. **Missing SOC 2 CPA attestation** introduces immediate friction in strict procurement reviews.
2. **Incomplete ITSM sync (ServiceNow blocked)** breaks the standard incident workflow for ITIL shops.
3. **Lack of automated GDPR/CCPA data deletion** (though partially shipped, needs robust internal tooling and validation).
4. **No third-party penetration test report** available for sharing under NDA.
5. **Inability to assign active/active multi-region failover** out of the box.
6. **Missing out-of-the-box landing zone / CAF policy packs** for immediate cloud baseline enforcement.

---

## Top 6 Engineering Risks

1. **DTF orchestration complexity** without deep state-transition logging could lead to opaque pipeline failures.
2. **Single-tenant worker pool exhaustion** during bursts, despite concurrency limits, due to lack of auto-scaling.
3. **Over-reliance on mock-backed E2E tests** for complex negative paths and trial exhaustion states.
4. **Drift between curated demo workspaces and actual product behavior** without strict CI fixture pinning.
5. **Silent failures in blob storage chunk uploads** during Azure network blips without Polly retries.
6. **Architectural coupling between Application and API layers** without strict ArchUnitNET boundary tests.

---

## Most Important Truth

ArchLucid possesses a robust, functionally complete V1 technical foundation, but its immediate commercial trajectory is constrained by a heavily sales-led motion, deferred self-serve checkout, and manual ROI baselines that increase time-to-value for evaluators.

---

## Top Improvement Opportunities

1. DEFERRED ServiceNow bi-directional sync
- Why it matters: V1 GA commitment that closes the workflow gap for ITSM-led enterprises.
- Expected impact: Improves Workflow Embeddedness (+5 pts), Interoperability (+2 pts).
- Affected qualities: Workflow Embeddedness, Interoperability.
- Actionable: DEFERRED
- Input needed: Provide credentials or instance URL for a free ServiceNow Developer Program (PDI) instance.

2. DEFERRED Commerce Un-hold (Stripe/Marketplace)
- Why it matters: Essential for unlocking zero-touch, self-serve revenue.
- Expected impact: Improves Commercial Packaging Readiness (+10 pts).
- Affected qualities: Commercial Packaging Readiness.
- Actionable: DEFERRED
- Input needed: Finance sign-off confirming Partner Center readiness, seller verification, and tax profiles.

3. DEFERRED PGP key generation and publication
- Why it matters: Required for coordinated vulnerability disclosure.
- Expected impact: Improves Trustworthiness (+2 pts).
- Affected qualities: Trustworthiness.
- Actionable: DEFERRED
- Input needed: Owner must generate the PGP keypair for security@archlucid.net and provide the public block.

4. DEFERRED Third-party pen test execution
- Why it matters: Critical for unblocking enterprise procurement.
- Expected impact: Improves Procurement Readiness (+5 pts).
- Affected qualities: Procurement Readiness.
- Actionable: DEFERRED
- Input needed: Confirm vendor SoW award and schedule.

5. DEFERRED Reference customer publication
- Why it matters: Provides necessary social proof for scaling sales.
- Expected impact: Improves Marketability (+5 pts).
- Affected qualities: Marketability.
- Actionable: DEFERRED
- Input needed: Provide signed customer approval for a case study or logo publication.

6. DEFERRED Design partner agreement
- Why it matters: Formalizes early adopter feedback loops.
- Expected impact: Improves Marketability (+3 pts).
- Affected qualities: Marketability.
- Actionable: DEFERRED
- Input needed: Confirm a signed design partner agreement.

7. DEFERRED SOC 2 CPA Attestation
- Why it matters: The largest single friction point in enterprise procurement.
- Expected impact: Improves Compliance Readiness (+10 pts).
- Affected qualities: Compliance Readiness.
- Actionable: DEFERRED
- Input needed: Confirm auditor engagement, funding, and scheduling.

8. Add a warning indicator for missing baseline inputs on the Governance dashboard
- Why it matters: Keeps executive value visibility high by ensuring ROI inputs are gathered early.
- Expected impact: Directly improves Executive Value Visibility (+3 pts) and Proof-of-ROI Readiness (+2 pts). Weighted readiness impact: +0.30%.
- Affected qualities: Executive Value Visibility, Proof-of-ROI Readiness.
- Actionable: Yes
```markdown
Add an amber warning banner to `archlucid-ui/src/app/(operate)/governance/dashboard/page.tsx` that checks `isPilotRoiBaselineComplete` via the `GET /v1/tenant/baseline` endpoint. If incomplete, display "Tenant ROI baselines are incomplete" and provide a link to `/settings/baseline`. Do not block any existing dashboard functionality. Acceptance criteria: The dashboard clearly warns operators if ROI baselines are missing.
```

9. Expose finding confidence scores visually on the operator UI review page
- Why it matters: Increases Decision Velocity by giving the operator immediate trust signals without clicking into the JSON.
- Expected impact: Directly improves Decision Velocity (+5 pts). Weighted readiness impact: +0.13%.
- Affected qualities: Decision Velocity.
- Actionable: Yes
```markdown
Update `archlucid-ui/src/components/findings/FindingCard.tsx` and `FindingDetail.tsx` to display the finding's confidence score (or severity rationale) as a visual badge (e.g., High, Medium, Low). Ensure it does not alter the underlying finding schema. Acceptance criteria: Operators can gauge AI confidence at a glance from the list view.
```

10. Add a one-click 'View Evidence' deep-link next to every finding in the UI
- Why it matters: Reduces cognitive load and speeds up verification.
- Expected impact: Directly improves Explainability (+4 pts) and Usability (+2 pts). Weighted readiness impact: +0.19%.
- Affected qualities: Explainability, Usability.
- Actionable: Yes
```markdown
Update `archlucid-ui/src/components/findings/FindingCard.tsx` to include a prominent 'View Evidence' deep-link that navigates directly to the relevant nodes in the Evidence Graph when provenance exists. Do not modify the graph endpoint. Acceptance criteria: Operators can click from a finding directly to its backing evidence in the graph.
```

11. Add an explicit error metric for AuthorityTenantConcurrencyLimitExceededException (429s)
- Why it matters: Provides immediate visibility into tenant throttling and noisy neighbor issues.
- Expected impact: Directly improves Observability (+4 pts) and Performance (+2 pts). Weighted readiness impact: +0.08%.
- Affected qualities: Observability, Performance.
- Actionable: Yes
```markdown
Update `ArchLucid.Api/Middleware/ExceptionHandlingMiddleware.cs` and `ArchLucid.Core/Telemetry/ArchLucidInstrumentation.cs` to capture and emit a specific OpenTelemetry metric counter whenever `AuthorityTenantConcurrencyLimitExceededException` (HTTP 429) occurs. Tag the metric with the tenant ID. Acceptance criteria: 429 limits are visible in Prometheus/Grafana dashboards.
```

12. Add a dry-run flag to the `archlucid run commit` CLI command
- Why it matters: Improves usability and operator confidence before finalizing irreversible reviews.
- Expected impact: Directly improves Usability (+3 pts) and Cost-Effectiveness (+1 pts). Weighted readiness impact: +0.13%.
- Affected qualities: Usability, Cost-Effectiveness.
- Actionable: Yes
```markdown
Update `ArchLucid.Cli/Commands/RunCommitCommand.cs` to support a `--dry-run` flag. When passed, it should query the API to ensure the run is in a `ReadyForCommit` state and simulate the commit checks locally without calling `POST /v1/architecture/run/{runId}/commit`. Acceptance criteria: Operators can verify a run is ready to commit without modifying state.
```

13. Extend release-smoke.ps1 to validate the GET /v1/demo/preview anonymous endpoint
- Why it matters: Ensures the marketing demo landing page remains healthy in staging and prevents silent fixture drift.
- Expected impact: Directly improves Reliability (+3 pts) and Testability (+3 pts). Weighted readiness impact: +0.12%.
- Affected qualities: Reliability, Testability.
- Actionable: Yes
```markdown
Update `release-smoke.ps1` to issue an HTTP GET to `/v1/demo/preview`. Assert that it returns a 200 OK or 304 Not Modified. If it returns 404, the script should fail, indicating the demo seed run is missing or broken. Acceptance criteria: `release-smoke.ps1` catches broken marketing demo endpoints.
```

14. Add a Copy to Clipboard button for the Azure Extractor PowerShell script in the UI
- Why it matters: Reduces adoption friction for operators running the Tier 1 ingestion.
- Expected impact: Directly improves Adoption Friction (+5 pts). Weighted readiness impact: +0.41%.
- Affected qualities: Adoption Friction.
- Actionable: Yes
```markdown
Update `archlucid-ui/src/app/(operate)/capture/azure-extractor/page.tsx` to include a 'Copy to Clipboard' button next to the `Get-ArchLucidAzurePackage.ps1` download instructions, copying the exact execution command. Acceptance criteria: Operators can copy the script execution command with one click.
```

15. Implement a retry mechanism with Polly for Blob Storage trace chunk uploads
- Why it matters: Increases reliability during transient Azure Storage network blips, preventing silent failures.
- Expected impact: Directly improves Reliability (+4 pts). Weighted readiness impact: +0.11%.
- Affected qualities: Reliability.
- Actionable: Yes
```markdown
Update `ArchLucid.Persistence/Storage/BlobTraceStorageService.cs` to wrap Azure Blob Storage uploads in a Polly retry policy (exponential backoff, 3 retries max) to handle transient `RequestFailedException` errors. Do not change the chunk size logic. Acceptance criteria: Trace chunk uploads survive minor network blips.
```

16. Add a CI check that validates DefaultPolicyPackTemplates against the JSON schema
- Why it matters: Prevents shipped policy packs from containing malformed JSON.
- Expected impact: Directly improves Correctness (+3 pts) and Maintainability (+2 pts). Weighted readiness impact: +0.38%.
- Affected qualities: Correctness, Maintainability.
- Actionable: Yes
```markdown
Create a new Python script `scripts/ci/validate_policy_packs.py` that validates all JSON files in `docs/samples/policy-packs/` against their respective schemas. Add this script as a merge-blocking step in `.github/workflows/ci.yml`. Acceptance criteria: CI fails if a default policy pack contains invalid JSON.
```

17. Create a dedicated docs/runbooks/REDIS_FAILOVER.md runbook
- Why it matters: Improves maintainability and supportability for distributed cache setups.
- Expected impact: Directly improves Supportability (+4 pts). Weighted readiness impact: +0.05%.
- Affected qualities: Supportability.
- Actionable: Yes
```markdown
Create a new markdown file `docs/runbooks/REDIS_FAILOVER.md` detailing the failover, monitoring, and recovery steps when `ArchLucid:KnowledgeGraph:ProjectionCache:Backend` is set to Distributed (Redis). Include instructions for flushing the cache safely. Acceptance criteria: A clear runbook exists for Redis operational emergencies.
```

18. Expand live-api-negative-paths.spec.ts with trial exhaustion (402) scenarios
- Why it matters: Ensures the commercial boundary remains enforced in CI against real SQL.
- Expected impact: Directly improves Testability (+4 pts) and Correctness (+2 pts). Weighted readiness impact: +0.27%.
- Affected qualities: Testability, Correctness.
- Actionable: Yes
```markdown
Update `archlucid-ui/e2e/live-api-negative-paths.spec.ts` to include a test that simulates a trial exhaustion state (e.g., by mocking the tenant state or exhausting the run limit on a test tenant) and asserts that mutating endpoints correctly return an HTTP 402 Payment Required status. Acceptance criteria: Trial exhaustion is validated against the live API in CI.
```

19. Add ArchUnitNET tests to enforce that ArchLucid.Application does not reference ArchLucid.Api
- Why it matters: Prevents architectural degradation and circular coupling.
- Expected impact: Directly improves Maintainability (+5 pts). Weighted readiness impact: +0.13%.
- Affected qualities: Maintainability.
- Actionable: Yes
```markdown
Update `ArchLucid.Architecture.Tests/DependencyConstraintTests.cs` to add an ArchUnitNET (or NetArchTest) rule explicitly asserting that assemblies matching `ArchLucid.Application` do not have dependencies on assemblies matching `ArchLucid.Api`. Acceptance criteria: The build fails if the Application layer couples to the API layer.
```

20. Implement structured JSON logging for the TenantDeletionService
- Why it matters: Ensures GDPR/CCPA deletion audits are easily parsed by SIEMs.
- Expected impact: Directly improves Observability (+3 pts) and Compliance Readiness (+2 pts). Weighted readiness impact: +0.09%.
- Affected qualities: Observability, Compliance Readiness.
- Actionable: Yes
```markdown
Update `ArchLucid.Worker/Services/TenantDeletionService.cs` to log its progress using structured JSON logging (e.g., semantic logging properties like `tenantId`, `deletedBlobCount`, `deletedSqlRows`). Ensure no PII is logged. Acceptance criteria: Tenant deletion events are semantically structured in the application logs.
```

21. Enhance v1-rc-drill.ps1 to parse and log the correlation ID from response headers
- Why it matters: Improves supportability when drills fail by providing the exact trace ID.
- Expected impact: Directly improves Supportability (+5 pts). Weighted readiness impact: +0.06%.
- Affected qualities: Supportability.
- Actionable: Yes
```markdown
Update `v1-rc-drill.ps1` to inspect the `X-Correlation-ID` header on all HTTP responses. If a request fails, print the correlation ID prominently in the console output to aid debugging. Acceptance criteria: Operators can easily grab the correlation ID from a failed drill run.
```

22. Add Playwright accessibility assertions to the generated Architecture Review preview pages
- Why it matters: Prevents accessibility regressions on high-value executive surfaces.
- Expected impact: Directly improves Accessibility (+8 pts). Weighted readiness impact: +0.11%.
- Affected qualities: Accessibility.
- Actionable: Yes
```markdown
Update `archlucid-ui/e2e/live-api-accessibility.spec.ts` to include Axe-core checks on the export preview routes (`/runs/{runId}` report preview modal). Ensure it fails on critical/serious violations. Acceptance criteria: Executive export preview UI is covered by automated accessibility checks.
```

23. Add a fallback to MemoryCache when Redis is unreachable for hot path reads
- Why it matters: Increases reliability and performance under load if Redis blips.
- Expected impact: Directly improves Reliability (+3 pts). Weighted readiness impact: +0.08%.
- Affected qualities: Reliability.
- Actionable: Yes
```markdown
Update `ArchLucid.Host.Composition/Configuration/ArchLucidStorageServiceCollectionExtensions.cs` to wrap the Redis cache provider registration in a resilience policy. If Redis throws a connection exception during startup or read, log a warning and fall back to the `Memory` provider temporarily. Acceptance criteria: The application starts and functions (albeit with localized state) if Redis is temporarily down.
```

24. Expose LlmDailyTenantBudget usage fraction on the operator dashboard
- Why it matters: Allows tenants to self-monitor their API limits and avoid sudden 402s.
- Expected impact: Directly improves Cost-Effectiveness (+4 pts) and Usability (+2 pts). Weighted readiness impact: +0.13%.
- Affected qualities: Cost-Effectiveness, Usability.
- Actionable: Yes
```markdown
Update `ArchLucid.Api/Controllers/Admin/TenantController.cs` to return the current `LlmDailyTenantBudget` usage fraction. Then update `archlucid-ui/src/app/(operate)/governance/dashboard/page.tsx` to display this as a simple progress bar widget. Acceptance criteria: Operators can see their daily token budget usage.
```

25. Add explicit state machine transition logging in the Durable Task Framework orchestrator
- Why it matters: Improves observability for long-running authority tasks and aids debugging.
- Expected impact: Directly improves Observability (+4 pts) and AI/Agent Readiness (+2 pts). Weighted readiness impact: +0.27%.
- Affected qualities: Observability, AI/Agent Readiness.
- Actionable: Yes
```markdown
Update `ArchLucid.Worker/Orchestration/DtfAuthorityRunOrchestrator.cs` to add explicit `ILogger.LogInformation` calls at the start and end of every DTF activity/stage transition. Include the orchestration instance ID and current stage name. Acceptance criteria: DTF state transitions are clearly traceable in the logs.
```

26. Add cross-tenant analytics metrics job (internal only)
- Why it matters: Proving ROI across the portfolio helps the sales team aggregate value.
- Expected impact: Directly improves Proof-of-ROI Readiness (+4 pts). Weighted readiness impact: +0.27%.
- Affected qualities: Proof-of-ROI Readiness.
- Actionable: Yes
```markdown
Create `ArchLucid.Worker/Jobs/CrossTenantAnalyticsJob.cs` that periodically aggregates non-PII metrics (e.g., total runs, total findings resolved, aggregate LLM call counts) across all tenants into a central telemetry table or log. Do not expose this data to tenants. Acceptance criteria: Internal teams can query aggregated usage statistics.
```

27. Refine operator UI tooltips to explicitly focus on evidence-linked findings
- Why it matters: Sharpens differentiability against generic LLM wrappers.
- Expected impact: Directly improves Differentiability (+4 pts). Weighted readiness impact: +0.22%.
- Affected qualities: Differentiability.
- Actionable: Yes
```markdown
Update `archlucid-ui/src/components/findings/FindingTooltip.tsx` to emphasize that the finding is "Grounded in specific architectural evidence" rather than generic AI advice. Adjust the tooltip copy to point to the evidence graph. Acceptance criteria: Tooltips clearly highlight the evidence-backed nature of the findings.
```

---

## Prompt Batching Guidance

- **Batch 1 (High Leverage UI/UX & Visibility):** 8, 9, 10, 14, 27
- **Batch 2 (Reliability, Tracing, & Fallbacks):** 11, 15, 23, 25
- **Batch 3 (Testability, Quality, & CI):** 13, 16, 18, 19, 22
- **Batch 4 (Internal Analytics & Cost-Effectiveness):** 24, 26
- **Batch 5 (CLI & Runbooks):** 12, 17, 20, 21
- **Batch 6 (Deferred GTM / Executive Approvals):** 1, 2, 3, 4, 5, 6, 7

---

## Pending Questions for Later

- **DEFERRED ServiceNow bi-directional sync:** What are the credentials or instance URL for the ServiceNow Developer Program instance?
- **DEFERRED Commerce Un-hold (Stripe/Marketplace):** Has finance confirmed Partner Center readiness, seller verification, and tax profiles?
- **DEFERRED PGP key generation and publication:** What is the generated public key block for security@archlucid.net?
- **DEFERRED Third-party pen test execution:** Has a vendor SoW been awarded and scheduled?
- **DEFERRED Reference customer publication:** Do we have a signed customer approval for a case study or logo publication?
- **DEFERRED Design partner agreement:** Has a design partner agreement been signed?
- **DEFERRED SOC 2 CPA Attestation:** Has an auditor engagement been funded and scheduled?