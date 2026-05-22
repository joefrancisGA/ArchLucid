> **Scope:** Canonical weighted V1 GA readiness assessment for coding agents and the owner — current `(A)` headline score and improvement backlog; not a buyer deliverable or historical archive.

# ArchLucid Assessment – (A) Headline Readiness: 82.05%

*This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding explicitly deferred V1.1/V2 items. **Score not yet recalculated** after recent completions below.*

### Completion status (2026-05-22)
**Completed since last assessment:** All actionable improvement items (#1–#21, #23) except explicitly deferred #22, #24, #25.  
**Still open:** None among the original Top Improvement Opportunities backlog.  
**Deferred (unchanged):** #22, #24, #25.

## Executive Summary

### `(A)` Overall Headline Readiness
The solution stands at an 82.05% weighted readiness score for the V1 headline. The core agent orchestration, tenant isolation model (database-per-tenant), and the Tier 1 Azure Extractor pipeline are structurally sound and complete. Remaining deductions stem mainly from UX polish (compliance drift empty states on some surfaces), incomplete pilot outcome timestamp surfacing, and a few supportability gaps (billing startup diagnostics, PowerShell extractor test harness).

### `(B)` Procurement / Market-Motion Realism
From a buyer friction perspective, the absence of a CPA-issued SOC 2 Type I/II report and an external third-party penetration test will trigger extended InfoSec reviews. While the in-repo SOC 2 self-assessment and owner-conducted pen test mitigate some pushback, enterprise procurement teams will likely impose delays. Furthermore, the manual nature of the PowerShell-based Azure Extractor (Tier 1) may trigger endpoint-security exceptions on corporate laptops.

### Commercial Picture
The V1 commercial motion is strictly sales-led. Because the Stripe live keys flip and Azure Marketplace 'Published' status are intentionally deferred to V1.1 (owner-only actions), true zero-touch self-serve revenue is blocked. However, the trial funnel works perfectly in TEST mode, and the product effectively demonstrates cost-savings ROI via the uploaded Extractor payloads. The commercial capability is ready for sales-engineer-led onboarding.

### Enterprise Picture
Enterprise readiness is strong due to the native support for generic OIDC and SAML 2.0 SP in V1 GA, alongside robust RBAC and append-only SQL audit logging. Cross-run executive ROI deduplication is now available via `GET /v1/reports/executive-summary`. The manual nature of tenant erasure (V2 candidate) will still require account executives to rely on manual narrative mapping during GDPR compliance evaluations.

### Engineering Picture
The engineering baseline is highly reliable and constrained. Agentic actions are correctly walled off (e.g., plan-only Terraform advisory snippets with explicit documentation against `apply`/`destroy`). The decision to defer Azure Container Apps Jobs and the Durable Task Framework to V2 keeps the V1 architecture simple and maintainable. Remaining engineering needs include surfacing the pilot outcome collection timestamp at the top level, billing startup critical logging, and a PowerShell extractor test harness.

---

## Weighted Quality Assessment

Qualities are ranked from most urgent to least urgent based on their weighted deficiency.

### 1. Time-to-Value
- **Score:** 78
- **Weight:** 7
- **Weighted deficiency signal:** 154
- **Justification:** While the Tier 1 Azure Extractor removes the need for vendor IAM credentials, requiring customers to execute a PowerShell script locally introduces environment-specific friction (execution policies, missing Azure modules).
- **Tradeoffs:** Zero-IAM access vs. script execution friction.
- **Recommendations:** Add robust pre-flight module and execution-policy checks to the PowerShell script; provide clearer UI hints during the upload phase.
- **Status:** Partially completed — Az module pre-flight shipped in `scripts/azure/Get-ArchLucidAzurePackage.ps1`; UI upload hints remain open.

### 2. AI/Agent Readiness
- **Score:** 84
- **Weight:** 8
- **Weighted deficiency signal:** 128
- **Justification:** Agents are safely bounded and operate deterministically. However, hallucination risks around Terraform snippet generation (e.g., accidentally suggesting a `destroy` block) require aggressive, explicit string-matching guards at the API boundary before presentation, backed by undeniable test assertions.
- **Tradeoffs:** Agent flexibility vs. strict output schema and safety validation.
- **Recommendations:** Implement hard-coded regex and AST validation tests on all generated Terraform to strip or flag destructive actions.
- **Status:** Completed — `TerraformAdvisorySnippetTemplatesTests` and related advisory safety tests assert `destroy` is rejected/sanitized.

### 3. Adoption Friction
- **Score:** 80
- **Weight:** 6
- **Weighted deficiency signal:** 120
- **Justification:** High architectural trust due to database-per-tenant isolation and V1 GA OIDC/SAML support. Generic OIDC setup examples are documented; UI nomenclature now uses **Review/Reviews** in buyer-facing labels.
- **Tradeoffs:** Shipped code stability vs. UI nomenclature refactoring.
- **Recommendations:** Systematically rename "Runs" to "Reviews" across the React UI components, and author Okta/Auth0 integration examples.
- **Status:** Completed — UI terminology unified (2026-05-22); Okta/Auth0 OIDC examples in `docs/library/CONFIGURATION_REFERENCE.md`.

### 4. Executive Value Visibility
- **Score:** 82
- **Weight:** 4
- **Weighted deficiency signal:** 72
- **Justification:** The governance dashboard and compliance drift trends are effective, but missing empty-state visuals can make the dashboard look broken during a fresh trial before data accumulates.
- **Tradeoffs:** Developing empty states vs. core analytical features.
- **Recommendations:** Build dedicated, informative empty-state components for all dashboard charts.
- **Status:** Completed — compliance drift trend empty state in `ExecutiveComplianceDriftTrendSection.tsx`.

### 5. Proof-of-ROI Readiness
- **Score:** 86
- **Weight:** 5
- **Weighted deficiency signal:** 70
- **Justification:** Per-run ROI and scorecard endpoints exist, but the metadata proving exactly *when* the Azure pricing baseline was collected is sometimes buried in the API response.
- **Tradeoffs:** Granular pricing data storage vs. top-level UI simplicity.
- **Recommendations:** Elevate the Extractor `collectionTimestamp` directly into the Pilot Outcome Summary DTO to guarantee citation tracking.
- **Status:** Completed — `ExtractorCollectionTimestampUtc` on `PilotScorecardResponse` / `GET /v1/pilots/outcome-summary`; run deltas mapper and scope SQL lookup.

### 6. Usability
- **Score:** 82
- **Weight:** 3
- **Weighted deficiency signal:** 54
- **Justification:** The baseline wizard and comparison tools are strong. However, finding the "Show more links" toggle for advanced analysis requires discovery.
- **Tradeoffs:** Clean sidebar vs. discoverability of advanced features.
- **Recommendations:** Introduce a subtle onboarding tooltip pointing to the advanced analytical links.
- **Status:** Completed — sidebar tooltip in `SidebarNav.tsx` ("Unlock advanced analysis and governance tools.").

### 7. Maintainability
- **Score:** 75
- **Weight:** 2
- **Weighted deficiency signal:** 50
- **Justification:** Phase 7 renaming (`ArchLucid.sql`) and legacy configuration bridges are pending cleanup. The custom agent handler documentation is currently missing, which is a V1 GA commitment.
- **Tradeoffs:** Feature delivery vs. technical debt and doc-writing.
- **Recommendations:** Author the `CUSTOM_AGENT_HANDLER_GUIDE.md` and complete the minor rename tasks.
- **Status:** Completed — `docs/library/CUSTOM_AGENT_HANDLER_GUIDE.md` shipped; Phase 7 `ArchLucid.sql` header, `.editorconfig`, and CI helper scripts updated (2026-05-22).

### 8. Reliability
- **Score:** 88
- **Weight:** 2
- **Weighted deficiency signal:** 24
- **Justification:** The orchestrator pipeline handles retry and queueing well. A minor gap exists in default health checks for Key Vault connectivity, and global SQL command timeouts could be stricter.
- **Tradeoffs:** Fast startup vs. comprehensive dependency probing.
- **Recommendations:** Add an explicit Azure Key Vault connectivity probe to `/health/ready` and enforce global SQL command timeouts.
- **Status:** Completed — `KeyVaultConnectivityHealthCheck` on `/health/ready`; global SQL command timeout (30s) via `SqlConnectionFactory` / `DapperGlobalCommandTimeoutBootstrap`.

### 9. Supportability
- **Score:** 90
- **Weight:** 1
- **Weighted deficiency signal:** 10
- **Justification:** Exceptional audit logging and diagnostic CLI tools. Missing only some edge-case integration tests for Extractor upload failures and correlation ID tracing.
- **Tradeoffs:** Fast test execution vs. exhaustive edge-case coverage.
- **Recommendations:** Add unit tests for `azure-extractor/upload` schema version mismatch scenarios and correlation ID propagation.
- **Status:** Partially completed — `AzureExtractorUploadEndpointTests` (schema version rejection) and `CorrelationIdAuditIntegrationTests` shipped; additional edge-case upload failure coverage remains open.

---

## Top 12 Most Important Weaknesses
1. ~~Extractor PowerShell script lacks graceful fallback/error messages if the user is missing required `Az` modules~~ **Addressed** — pre-flight checks in `Get-ArchLucidAzurePackage.ps1`.
2. ~~Missing AST/regex block-list checks in the API tests to definitively prove Terraform `destroy` blocks are never emitted by hallucinating agents~~ **Addressed** — advisory safety and snippet template tests.
3. ~~Generic OIDC identity setup lacks concrete step-by-step examples in the documentation~~ **Addressed** — Okta/Auth0 section in `CONFIGURATION_REFERENCE.md`.
4. ~~Legacy "Runs" terminology in the UI confuses the "Request -> Review -> Commit" product lifecycle narrative~~ **Addressed** (2026-05-22).
5. ~~The compliance drift dashboard lacks a polished "empty state"~~ **Addressed** — `ExecutiveComplianceDriftTrendSection.tsx`.
6. ~~Key Vault connectivity is not explicitly checked in the `/health/ready` probe~~ **Addressed** — `KeyVaultConnectivityHealthCheck`.
7. ~~The pilot outcome DTO doesn't explicitly expose the exact Azure Retail pricing timestamp at the top level.~~ **Addressed** — `ExtractorCollectionTimestampUtc` on outcome summary and run deltas.
8. ~~Custom Agent Handler developer documentation is missing~~ **Addressed** — `docs/library/CUSTOM_AGENT_HANDLER_GUIDE.md`.
9. ~~Schema version validation on the Extractor ingest endpoint is not strictly enforced in the current integration test suite~~ **Addressed** — `AzureExtractorUploadEndpointTests`.
10. ~~`BillingProductionSafetyRules` log outputs are not verbose enough to instantly diagnose why a startup is blocked in staging.~~ **Addressed** — `[BillingProductionSafety]` Critical logs + `StartupConfigurationFailureLogger`.
11. Missing automated test harness for the PowerShell Extractor script logic itself.
12. ~~Phase 7 renaming (`ArchLucid.sql`) leaves legacy naming artifacts in the codebase that increase maintainer cognitive load.~~ **Addressed** (2026-05-22).

---

## Top 6 Monetization Blockers
1. **DEFERRED: Stripe Live Keys Flip:** Actual self-serve revenue is physically blocked until owner un-holds the keys (V1.1).
2. **Extractor Script Friction:** Local PowerShell execution requirements for Tier 1 Extractor delay the initial proof of value for paid pilots (pre-flight checks shipped; endpoint-policy friction remains).
3. ~~**DEFERRED: Missing Cross-Run Executive ROI API**~~ **COMPLETED:** `GET /v1/reports/executive-summary` with unique-finding deduplication (`ExecutiveSummaryAggregator`).
4. **Board-Pack PDF Limitations:** Exporting highly formatted, C-level readouts requires manual intervention if the UI charts don't render perfectly to PDF.
5. **DEFERRED: Design Partner Engagement:** Signed design partner engagement structure is not closed, affecting referenced pricing discounts (V1.1).
6. ~~**Missing Custom Handler Docs**~~ **COMPLETED:** `docs/library/CUSTOM_AGENT_HANDLER_GUIDE.md`.

---

## Top 6 Enterprise Adoption Blockers
1. **DEFERRED: SOC 2 CPA Attestation Absence:** Procurement teams will mandate manual security questionnaires because the formal CPA SOC 2 report is deferred to post-V1.1.
2. **DEFERRED: Third-Party Pen Test Absence:** Lack of an external, redacted vendor summary requires trust in the internal owner-conducted exercise (V2).
3. **Local PowerShell Execution Requirements:** InfoSec policies blocking local `.ps1` execution will force buyers to delay pilots while seeking endpoint exceptions.
4. **DEFERRED: Manual GDPR Tenant Erasure:** The lack of an automated quarantine/purge pipeline will cause friction during privacy compliance reviews (V2).
5. **OIDC/SAML Setup Ambiguity:** Enterprise IAM teams will struggle without concrete, vendor-specific mapping examples in the docs. *(Partially mitigated — generic OIDC Okta/Auth0 examples shipped in `CONFIGURATION_REFERENCE.md`.)*
6. **DEFERRED: Multi-cloud (AWS/GCP) Analysis:** Lack of cross-cloud architecture analysis limits adoption in heterogenous environments (V1.1).

---

## Top 6 Engineering Risks
1. ~~**Agent Hallucinated Destructive IaC**~~ **Mitigated** — Terraform advisory tests and sanitization reject `destroy` tokens.
2. ~~**Unvalidated Extractor Schema**~~ **Mitigated** — schema version checks and integration tests on upload endpoint.
3. ~~**Key Vault Outage Silent Failures**~~ **Mitigated** — `KeyVaultConnectivityHealthCheck` on `/health/ready`.
4. ~~**Database Lockups**~~ **Mitigated** — global SQL command timeout (30s default).
5. ~~**Missing Audit on Edge Exports**~~ **Mitigated** — `RunExportAuditServiceTests` asserts failure audit events.
6. ~~**Extractor Script Scoop Scope**~~ **Mitigated** — Key Vault secrets filtered in `Get-ArchLucidAzurePackage.ps1`.

---

## Most Important Truth
ArchLucid's V1 core delivers a robust, safely-bounded architecture review platform. Recent completions (executive ROI deduplication, UI Review terminology, Key Vault readiness probe, and advisory safety tests) close several adoption and engineering gaps. Immediate zero-touch monetization remains gated by intentionally deferred commercial unlocks (Stripe/Marketplace); time-to-value still depends partly on local Azure Extractor execution policy on corporate endpoints.

---

## Top Improvement Opportunities

1. **COMPLETED: Add Az module pre-flight checks to Azure Extractor PowerShell script**
   - **Why it matters:** Prevents mid-execution crashes on customer machines when modules are missing.
   - **Expected impact:** Speeds up Tier 1 onboarding significantly.
   - **Affected qualities:** Time-to-Value (+5-7 pts), Adoption Friction (+3-5 pts). Weighted impact: ~0.15%.
   - **Completed.** Pre-flight for `Az.Accounts` / `Az.Resources` in `scripts/azure/Get-ArchLucidAzurePackage.ps1`.

2. **COMPLETED: Add strict `destroy` block filtering tests for Terraform advisory generation**
   - **Why it matters:** Prevents accidental destructive IaC emit, a core V1 safety promise.
   - **Expected impact:** Eliminates catastrophic engineering risk.
   - **Affected qualities:** AI/Agent Readiness (+5-8 pts), Reliability (+2-3 pts). Weighted impact: ~0.15%.
   - **Completed.** `TerraformAdvisorySnippetTemplatesTests` and related advisory safety tests.

3. **COMPLETED: Unify "Runs" to "Reviews" terminology in UI components**
   - **Why it matters:** Aligns UI with the stated product lifecycle (Request -> Review -> Commit).
   - **Expected impact:** Lowers adoption friction and cognitive load.
   - **Affected qualities:** Usability (+3-5 pts), Adoption Friction (+2-4 pts). Weighted impact: ~0.1%.
   - **Completed (2026-05-22).** Buyer-facing labels updated across operator UI; API routes and `runId` identifiers unchanged.

4. **COMPLETED: Author Custom Agent Handler Documentation**
   - **Why it matters:** Fulfills the V1 GA commitment for extensibility guidance.
   - **Expected impact:** Removes a documentation gap for advanced integrators.
   - **Affected qualities:** Maintainability (+4-6 pts), Adoption Friction (+2-3 pts). Weighted impact: ~0.1%.
   - **Completed.** `docs/library/CUSTOM_AGENT_HANDLER_GUIDE.md`; linked from `START_HERE.md`.

5. **COMPLETED: Elevate `collectionTimestamp` in Pilot Outcome Summary DTO**
   - **Why it matters:** Ensures exact citation of pricing metrics for ROI proof.
   - **Expected impact:** Strengthens Proof-of-ROI credibility.
   - **Affected qualities:** Proof-of-ROI Readiness (+4-6 pts). Weighted impact: ~0.08%.
   - **Completed (2026-05-22).** `ExtractorCollectionTimestampUtc` on `PilotScorecardResponse`; `PilotScorecardBuilder` + `SqlAzureExtractorPackageRepository`; `PilotOutcomeSummaryEndpointTests` and `PilotRunDeltasResponseMapperTests`.

6. **COMPLETED: Add empty states to Compliance Drift dashboard charts**
   - **Why it matters:** Improves the visual polish for fresh tenants.
   - **Expected impact:** Increases executive trust during initial pilots.
   - **Affected qualities:** Executive Value Visibility (+5-7 pts), Usability (+2-4 pts). Weighted impact: ~0.1%.
   - **Completed.** Empty state in `ExecutiveComplianceDriftTrendSection.tsx`.

7. **COMPLETED: Create Key Vault connectivity health check probe**
   - **Why it matters:** Surfaces configuration errors immediately upon boot.
   - **Expected impact:** Reduces silent failures.
   - **Affected qualities:** Supportability (+5-8 pts), Reliability (+2-4 pts). Weighted impact: ~0.05%.
   - **Completed.** `KeyVaultConnectivityHealthCheck` registered for `/health/ready`; unit tests in `KeyVaultConnectivityHealthCheckTests`.

8. **COMPLETED: Document generic OIDC configuration examples (Auth0, Okta)**
   - **Why it matters:** Removes ambiguity for enterprise IAM teams.
   - **Expected impact:** Reduces enterprise adoption blockers.
   - **Affected qualities:** Adoption Friction (+4-6 pts), Maintainability (+2-3 pts). Weighted impact: ~0.1%.
   - **Completed.** Okta/Auth0 section in `docs/library/CONFIGURATION_REFERENCE.md`.

9. **COMPLETED: Add strict schema version validation tests for Extractor upload**
   - **Why it matters:** Protects the backend from malformed or outdated ZIP payloads.
   - **Expected impact:** Increases pipeline reliability.
   - **Affected qualities:** Reliability (+4-5 pts), Supportability (+2-4 pts). Weighted impact: ~0.05%.
   - **Completed.** `AzureExtractorUploadEndpointTests.Upload_unknownSchema_returns400` (and related upload validation tests).

10. **COMPLETED: Add explicit Key Vault exclusion filtering to Extractor script**
    - **Why it matters:** Prevents accidental ingestion of secret data.
    - **Expected impact:** Mitigates a top engineering risk.
    - **Affected qualities:** Reliability (+2-3 pts), Adoption Friction (+2-3 pts). Weighted impact: ~0.05%.
    - **Completed.** `Microsoft.KeyVault/vaults/secrets` filtered in `Get-ArchLucidAzurePackage.ps1`.

11. **COMPLETED: Add `BillingProductionSafetyRules` explicit critical logging**
    - **Why it matters:** Decreases debug time when the app fails to boot.
    - **Expected impact:** Improves supportability.
    - **Affected qualities:** Supportability (+4-6 pts). Weighted impact: ~0.02%.
    - **Completed (2026-05-22).** `[BillingProductionSafety]` prefix, `LogCriticalForMatchingErrors`, `StartupConfigurationFailureLogger.LogCriticalAndThrow` in API/Worker hosts; unit tests in `BillingProductionSafetyRulesTests` and `StartupConfigurationFailureLoggerTests`.

12. **COMPLETED: Enforce global SQL command timeouts on Repositories**
    - **Why it matters:** Prevents long-running queries from locking up the orchestrator during transient database load.
    - **Expected impact:** Improves overall system reliability.
    - **Affected qualities:** Reliability (+3-5 pts). Weighted impact: ~0.05%.
    - **Completed.** 30s default via `SqlConnectionFactory` and `DapperGlobalCommandTimeoutBootstrap`; `SqlConnectionFactoryTests`.

13. **COMPLETED: Complete Phase 7 renaming for `ArchLucid.sql` artifacts**
    - **Why it matters:** Reduces tech debt and cognitive load.
    - **Expected impact:** Cleaner codebase.
    - **Affected qualities:** Maintainability (+3-5 pts). Weighted impact: ~0.05%.
    - **Completed (2026-05-22).** `ArchLucid.Persistence/Scripts/ArchLucid.sql` header, `.editorconfig`, `tools/document_test_classes.py`, `tools/rerun_failed_from_trx.py`.

14. **COMPLETED: Add integration test for Correlation ID propagation to Audit logs**
    - **Why it matters:** Guarantees that cross-service requests can be accurately traced during incident response.
    - **Expected impact:** Improves supportability and incident resolution time.
    - **Affected qualities:** Supportability (+5-7 pts), Reliability (+2-3 pts). Weighted impact: ~0.05%.
    - **Completed.** `CorrelationIdAuditIntegrationTests.RequestWithXCorrelationId_PropagatesToDurableAuditEvent`.

15. **COMPLETED: Add audit event test for Export generation failures**
    - **Why it matters:** Ensures the audit log non-repudiation chain is unbroken.
    - **Expected impact:** Boosts compliance and trust.
    - **Affected qualities:** Supportability (+3-4 pts), Reliability (+2-3 pts). Weighted impact: ~0.03%.
    - **Completed.** `RunExportAuditServiceTests.RecordFailureAsync_LogsExportFailedAudit`.

16. **COMPLETED: Automate OWASP ZAP Baseline validation in CI**
    - **Why it matters:** Ensures continuous security posture and prevents regressions on the API image.
    - **Expected impact:** Strengthens security and CI honesty.
    - **Affected qualities:** Reliability (+2-3 pts), Maintainability (+2-3 pts). Weighted impact: ~0.08%.
    - **Completed.** `security-zap-api-baseline` job in `.github/workflows/ci.yml`; scheduled strict run in `zap-baseline-strict-scheduled.yml`.

17. **COMPLETED: Add informative empty state to Artifacts list in Review UI**
    - **Why it matters:** Improves the operator experience when a review is still executing or has no artifacts.
    - **Expected impact:** Reduces UX friction.
    - **Affected qualities:** Usability (+3-4 pts), Adoption Friction (+2-3 pts). Weighted impact: ~0.08%.
    - **Completed.** Empty state in `RunDetailArtifactsExportsSection.tsx`.

18. **COMPLETED: Add tooltips for "Show more links" in UI sidebar**
    - **Why it matters:** Improves discovery of Operate-tier features.
    - **Expected impact:** Better usability.
    - **Affected qualities:** Usability (+4-6 pts). Weighted impact: ~0.05%.
    - **Completed.** Tooltip in `SidebarNav.tsx`.

19. **COMPLETED: Create SCIM Provisioning Quickstart Doc**
    - **Why it matters:** Accelerates SSO/SCIM integration.
    - **Expected impact:** Less enterprise friction.
    - **Affected qualities:** Adoption Friction (+3-5 pts). Weighted impact: ~0.05%.
    - **Completed.** `docs/integrations/SCIM_PROVISIONING_QUICKSTART.md`.

20. **COMPLETED: Create Private Endpoint setup guide for Azure**
    - **Why it matters:** Clarifies the network security configuration for enterprise deployments.
    - **Expected impact:** Speeds up enterprise onboarding and InfoSec approvals.
    - **Affected qualities:** Maintainability (+3-4 pts), Adoption Friction (+3-5 pts). Weighted impact: ~0.1%.
    - **Completed.** `docs/runbooks/PRIVATE_ENDPOINT_SETUP.md`.

21. **COMPLETED: Add explicit Azure OpenAI content safety error handling tests**
    - **Why it matters:** Guarantees application resilience if Azure AI Content Safety returns 5xx.
    - **Expected impact:** Improves API stability under external duress.
    - **Affected qualities:** Reliability (+3-5 pts). Weighted impact: ~0.05%.
    - **Completed (2026-05-22).** `AzureContentSafetyGuard.HandleSdkFailure` with 503/429 fail-closed and fail-open coverage in `AzureContentSafetyGuardSdkFailureTests`.

22. **DEFERRED: Stripe Live Keys Flip**
    - **Reason deferred:** Requires owner-only action in Stripe Dashboard and Partner Center to transition keys and verify tax profiles.
    - **Information needed:** Owner confirmation that Stripe live keys are ready and the Marketplace offer is set to 'Published'.

23. **COMPLETED: Implement unique-finding deduplication for Executive ROI API**
    - **Why it matters:** Prevents double-counting of savings across multiple architecture reviews, ensuring CFOs see an honest, defensible ROI.
    - **Expected impact:** Strengthens Proof-of-ROI credibility and Executive Value Visibility.
    - **Affected qualities:** Proof-of-ROI Readiness (+5-7 pts), Executive Value Visibility (+4-6 pts). Weighted impact: ~0.15%.
    - **Completed (2026-05-22).** `ExecutiveSummaryAggregator` groups by `FindingId` and takes max cost/risk per finding; `GET /v1/reports/executive-summary`; unit tests in `ExecutiveSummaryAggregatorTests`.

24. **DEFERRED: Automated Tenant Erasure Pipeline**
    - **Reason deferred:** Fully automated GDPR quarantine/purge is an explicit V2 roadmap item.
    - **Information needed:** Go-ahead to pull this work forward, or confirmation to leave it scheduled for V2.

25. **DEFERRED: Third-party Pen Test Execution**
    - **Reason deferred:** Awaiting vendor selection and SOW execution (V2).
    - **Information needed:** Confirmation of executed SOW to proceed with generating redacted summary assets.

---

## Prompt Batching Guidance
To optimize context windows and cost:
- **Batch 1 (UI & Terminology):** ~~Prompts #3, #6, #17, and #18~~ — **completed.**
- **Batch 2 (API Safety & Resilience):** ~~Prompts #2, #7, #9, #11, #12, #14, #15, #21, and #23~~ — **completed.**
- **Batch 3 (Powershell & Scripts):** ~~Prompts #1, #10, and #16~~ — **completed.**
- **Batch 4 (Documentation & Debt):** ~~Prompts #4, #5, #8, #13, #19, and #20~~ — **completed.**

---

## Pending Questions for Later
- **Stripe Live Keys Flip:** Are the live keys available and is the Marketplace profile fully verified?
- **Automated Tenant Erasure:** Is there any desire to pull the automated 30-day quarantine pipeline forward from V2 to V1.1?
- **Third-Party Pen Test:** Has an external vendor been selected for the V2 penetration test?

*(Deferred Scope Uncertainty: None. All deferred items were successfully located in `V1_DEFERRED.md`, `V1_SCOPE.md`, and `TRUST_CENTER.md`.)*