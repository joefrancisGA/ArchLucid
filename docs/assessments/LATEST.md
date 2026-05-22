# ArchLucid Assessment – (A) Headline Readiness: 82.05%

*This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding explicitly deferred V1.1/V2 items.*

## Executive Summary

### `(A)` Overall Headline Readiness
The solution stands at an 82.05% weighted readiness score for the V1 headline. The core agent orchestration, tenant isolation model (database-per-tenant), and the Tier 1 Azure Extractor pipeline are structurally sound and complete. The primary deductions stem from UX friction in the time-to-value path (e.g., PowerShell script pre-flight robustness without vendor IAM), minor inconsistencies in UI nomenclature, and the need for stricter explicit test assertions against hallucinated destructive IaC.

### `(B)` Procurement / Market-Motion Realism
From a buyer friction perspective, the absence of a CPA-issued SOC 2 Type I/II report and an external third-party penetration test will trigger extended InfoSec reviews. While the in-repo SOC 2 self-assessment and owner-conducted pen test mitigate some pushback, enterprise procurement teams will likely impose delays. Furthermore, the manual nature of the PowerShell-based Azure Extractor (Tier 1) may trigger endpoint-security exceptions on corporate laptops.

### Commercial Picture
The V1 commercial motion is strictly sales-led. Because the Stripe live keys flip and Azure Marketplace 'Published' status are intentionally deferred to V1.1 (owner-only actions), true zero-touch self-serve revenue is blocked. However, the trial funnel works perfectly in TEST mode, and the product effectively demonstrates cost-savings ROI via the uploaded Extractor payloads. The commercial capability is ready for sales-engineer-led onboarding.

### Enterprise Picture
Enterprise readiness is strong due to the native support for generic OIDC and SAML 2.0 SP in V1 GA, alongside robust RBAC and append-only SQL audit logging. However, the lack of automated, cross-tenant executive ROI rollups (V1.1 candidate) and the manual nature of tenant erasure (V2 candidate) will require account executives to rely heavily on manual narrative mapping during enterprise QBRs and GDPR compliance evaluations.

### Engineering Picture
The engineering baseline is highly reliable and constrained. Agentic actions are correctly walled off (e.g., plan-only Terraform advisory snippets with explicit documentation against `apply`/`destroy`). The decision to defer Azure Container Apps Jobs and the Durable Task Framework to V2 keeps the V1 architecture simple and maintainable. The most pressing engineering needs are extending explicit regex/AST test coverage for block-lists, ensuring Key Vault connectivity resilience on boot, and enforcing global SQL timeouts.

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
- **Status:** Actionable Now.

### 2. AI/Agent Readiness
- **Score:** 84
- **Weight:** 8
- **Weighted deficiency signal:** 128
- **Justification:** Agents are safely bounded and operate deterministically. However, hallucination risks around Terraform snippet generation (e.g., accidentally suggesting a `destroy` block) require aggressive, explicit string-matching guards at the API boundary before presentation, backed by undeniable test assertions.
- **Tradeoffs:** Agent flexibility vs. strict output schema and safety validation.
- **Recommendations:** Implement hard-coded regex and AST validation tests on all generated Terraform to strip or flag destructive actions.
- **Status:** Actionable Now.

### 3. Adoption Friction
- **Score:** 80
- **Weight:** 6
- **Weighted deficiency signal:** 120
- **Justification:** High architectural trust due to database-per-tenant isolation and V1 GA OIDC/SAML support. However, IdP setup lacks concrete documentation examples, and the operator UI still uses legacy terminology ("Runs" instead of "Reviews") which confuses new users during onboarding.
- **Tradeoffs:** Shipped code stability vs. UI nomenclature refactoring.
- **Recommendations:** Systematically rename "Runs" to "Reviews" across the React UI components, and author Okta/Auth0 integration examples.
- **Status:** Actionable Now.

### 4. Executive Value Visibility
- **Score:** 82
- **Weight:** 4
- **Weighted deficiency signal:** 72
- **Justification:** The governance dashboard and compliance drift trends are effective, but missing empty-state visuals can make the dashboard look broken during a fresh trial before data accumulates.
- **Tradeoffs:** Developing empty states vs. core analytical features.
- **Recommendations:** Build dedicated, informative empty-state components for all dashboard charts.
- **Status:** Actionable Now.

### 5. Proof-of-ROI Readiness
- **Score:** 86
- **Weight:** 5
- **Weighted deficiency signal:** 70
- **Justification:** Per-run ROI and scorecard endpoints exist, but the metadata proving exactly *when* the Azure pricing baseline was collected is sometimes buried in the API response.
- **Tradeoffs:** Granular pricing data storage vs. top-level UI simplicity.
- **Recommendations:** Elevate the Extractor `collectionTimestamp` directly into the Pilot Outcome Summary DTO to guarantee citation tracking.
- **Status:** Actionable Now.

### 6. Usability
- **Score:** 82
- **Weight:** 3
- **Weighted deficiency signal:** 54
- **Justification:** The baseline wizard and comparison tools are strong. However, finding the "Show more links" toggle for advanced analysis requires discovery.
- **Tradeoffs:** Clean sidebar vs. discoverability of advanced features.
- **Recommendations:** Introduce a subtle onboarding tooltip pointing to the advanced analytical links.
- **Status:** Actionable Now.

### 7. Maintainability
- **Score:** 75
- **Weight:** 2
- **Weighted deficiency signal:** 50
- **Justification:** Phase 7 renaming (`ArchLucid.sql`) and legacy configuration bridges are pending cleanup. The custom agent handler documentation is currently missing, which is a V1 GA commitment.
- **Tradeoffs:** Feature delivery vs. technical debt and doc-writing.
- **Recommendations:** Author the `CUSTOM_AGENT_HANDLER_GUIDE.md` and complete the minor rename tasks.
- **Status:** Actionable Now.

### 8. Reliability
- **Score:** 88
- **Weight:** 2
- **Weighted deficiency signal:** 24
- **Justification:** The orchestrator pipeline handles retry and queueing well. A minor gap exists in default health checks for Key Vault connectivity, and global SQL command timeouts could be stricter.
- **Tradeoffs:** Fast startup vs. comprehensive dependency probing.
- **Recommendations:** Add an explicit Azure Key Vault connectivity probe to `/health/ready` and enforce global SQL command timeouts.
- **Status:** Actionable Now.

### 9. Supportability
- **Score:** 90
- **Weight:** 1
- **Weighted deficiency signal:** 10
- **Justification:** Exceptional audit logging and diagnostic CLI tools. Missing only some edge-case integration tests for Extractor upload failures and correlation ID tracing.
- **Tradeoffs:** Fast test execution vs. exhaustive edge-case coverage.
- **Recommendations:** Add unit tests for `azure-extractor/upload` schema version mismatch scenarios and correlation ID propagation.
- **Status:** Actionable Now.

---

## Top 12 Most Important Weaknesses
1. Extractor PowerShell script lacks graceful fallback/error messages if the user is missing required `Az` modules, creating early friction.
2. Missing AST/regex block-list checks in the API tests to definitively prove Terraform `destroy` blocks are never emitted by hallucinating agents.
3. Generic OIDC identity setup lacks concrete step-by-step examples in the documentation, slowing enterprise SSO onboarding.
4. Legacy "Runs" terminology in the UI confuses the "Request -> Review -> Commit" product lifecycle narrative.
5. The compliance drift dashboard lacks a polished "empty state", making fresh tenants look defective.
6. Key Vault connectivity is not explicitly checked in the `/health/ready` probe, potentially causing silent runtime configuration failures.
7. The pilot outcome DTO doesn't explicitly expose the exact Azure Retail pricing timestamp at the top level.
8. Custom Agent Handler developer documentation is missing, violating a V1 GA commitment.
9. Schema version validation on the Extractor ingest endpoint is not strictly enforced in the current integration test suite.
10. `BillingProductionSafetyRules` log outputs are not verbose enough to instantly diagnose why a startup is blocked in staging.
11. Missing automated test harness for the PowerShell Extractor script logic itself.
12. Phase 7 renaming (`ArchLucid.sql`) leaves legacy naming artifacts in the codebase that increase maintainer cognitive load.

---

## Top 6 Monetization Blockers
1. **DEFERRED: Stripe Live Keys Flip:** Actual self-serve revenue is physically blocked until owner un-holds the keys (V1.1).
2. **Extractor Script Friction:** Local PowerShell execution requirements for Tier 1 Extractor delay the initial proof of value for paid pilots.
3. **DEFERRED: Missing Cross-Run Executive ROI API:** CFOs cannot easily see a rolled-up deduplicated view of savings across multiple architecture reviews (V1.1).
4. **Board-Pack PDF Limitations:** Exporting highly formatted, C-level readouts requires manual intervention if the UI charts don't render perfectly to PDF.
5. **DEFERRED: Design Partner Engagement:** Signed design partner engagement structure is not closed, affecting referenced pricing discounts (V1.1).
6. **Missing Custom Handler Docs:** Lack of clear documentation for custom agent handlers limits upselling to advanced enterprise integrators.

---

## Top 6 Enterprise Adoption Blockers
1. **DEFERRED: SOC 2 CPA Attestation Absence:** Procurement teams will mandate manual security questionnaires because the formal CPA SOC 2 report is deferred to post-V1.1.
2. **DEFERRED: Third-Party Pen Test Absence:** Lack of an external, redacted vendor summary requires trust in the internal owner-conducted exercise (V2).
3. **Local PowerShell Execution Requirements:** InfoSec policies blocking local `.ps1` execution will force buyers to delay pilots while seeking endpoint exceptions.
4. **DEFERRED: Manual GDPR Tenant Erasure:** The lack of an automated quarantine/purge pipeline will cause friction during privacy compliance reviews (V2).
5. **OIDC/SAML Setup Ambiguity:** Enterprise IAM teams will struggle without concrete, vendor-specific mapping examples in the docs.
6. **DEFERRED: Multi-cloud (AWS/GCP) Analysis:** Lack of cross-cloud architecture analysis limits adoption in heterogenous environments (V1.1).

---

## Top 6 Engineering Risks
1. **Agent Hallucinated Destructive IaC:** The LLM might generate a Terraform snippet containing a `destroy` block if prompt constraints fail and strict regex filters are absent.
2. **Unvalidated Extractor Schema:** If the API accepts an outdated or malformed ZIP schema, downstream parsers could throw unhandled exceptions and crash the worker pipeline.
3. **Key Vault Outage Silent Failures:** If Azure Key Vault experiences a transient drop, the app might fail to boot or fetch secrets without clear health-probe visibility.
4. **Database Lockups:** Without global command timeouts on long-running orchestrator queries, transient database load could freeze the application.
5. **Missing Audit on Edge Exports:** If a bulk ZIP export fails midway, the audit log might miss the failure event, breaking the non-repudiation chain.
6. **Extractor Script Scoop Scope:** The PowerShell script could accidentally ingest sensitive Key Vault metadata if Azure API responses change and strict property allow-listing isn't used.

---

## Most Important Truth
ArchLucid's V1 core delivers a robust, safely-bounded architecture review platform, but immediate zero-touch monetization is gated by intentionally deferred commercial unlocks (Stripe/Marketplace), leaving time-to-value heavily dependent on the UX polish of the local Azure Extractor script and clear enterprise identity documentation.

---

## Top Improvement Opportunities

1. **Add Az module pre-flight checks to Azure Extractor PowerShell script**
   - **Why it matters:** Prevents mid-execution crashes on customer machines when modules are missing.
   - **Expected impact:** Speeds up Tier 1 onboarding significantly.
   - **Affected qualities:** Time-to-Value (+5-7 pts), Adoption Friction (+3-5 pts). Weighted impact: ~0.15%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     Edit `scripts/azure/Get-ArchLucidAzurePackage.ps1`. Add a pre-flight `try/catch` block at the beginning of the script that checks if the `Az.Accounts` and `Az.Resources` modules are installed and imported. If they are not, write a clear, actionable warning message instructing the user to run `Install-Module Az` and exit cleanly. Do not alter the core extraction logic.
     ```

2. **Add strict `destroy` block filtering tests for Terraform advisory generation**
   - **Why it matters:** Prevents accidental destructive IaC emit, a core V1 safety promise.
   - **Expected impact:** Eliminates catastrophic engineering risk.
   - **Affected qualities:** AI/Agent Readiness (+5-8 pts), Reliability (+2-3 pts). Weighted impact: ~0.15%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     Modify the Terraform advisory snippet generation tests (e.g., `TerraformAdvisorySnippetTemplatesTests.cs`). Add a new test case that explicitly verifies that if an LLM mock returns a Terraform block containing the word `destroy`, the system either sanitizes it, replaces it with a comment, or throws an expected validation exception. Do not change the core architecture, only add the strict assertion tests.
     ```

3. **Unify "Runs" to "Reviews" terminology in UI components**
   - **Why it matters:** Aligns UI with the stated product lifecycle (Request -> Review -> Commit).
   - **Expected impact:** Lowers adoption friction and cognitive load.
   - **Affected qualities:** Usability (+3-5 pts), Adoption Friction (+2-4 pts). Weighted impact: ~0.1%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     Search the `archlucid-ui/src/` directory for instances of the word "Run" or "Runs" used in user-facing labels, headings, or navigation menus, and replace them with "Review" or "Reviews". Do NOT change variable names, API routes, or URL paths (e.g., keep `runId` and `/reviews/[runId]`). Update the text in relevant components to reflect this buyer-facing terminology. Ensure tests pass.
     ```

4. **Author Custom Agent Handler Documentation**
   - **Why it matters:** Fulfills the V1 GA commitment for extensibility guidance.
   - **Expected impact:** Removes a documentation gap for advanced integrators.
   - **Affected qualities:** Maintainability (+4-6 pts), Adoption Friction (+2-3 pts). Weighted impact: ~0.1%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     Create a new markdown file at `docs/library/CUSTOM_AGENT_HANDLER_GUIDE.md`. Write a comprehensive guide explaining how an advanced integrator can author and register a custom agent handler in the ArchLucid orchestration pipeline. Include sections on prerequisites, authority/safety posture, registration expectations, and versioning boundaries. Update `START_HERE.md` to link to it.
     ```

5. **Elevate `collectionTimestamp` in Pilot Outcome Summary DTO**
   - **Why it matters:** Ensures exact citation of pricing metrics for ROI proof.
   - **Expected impact:** Strengthens Proof-of-ROI credibility.
   - **Affected qualities:** Proof-of-ROI Readiness (+4-6 pts). Weighted impact: ~0.08%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     Modify the `PilotOutcomeSummaryResponse` DTO to explicitly include an `ExtractorCollectionTimestampUtc` property. Map this property from the underlying ingested ZIP manifest metadata. Update relevant unit tests to assert that this property is correctly passed through to the API response.
     ```

6. **Add empty states to Compliance Drift dashboard charts**
   - **Why it matters:** Improves the visual polish for fresh tenants.
   - **Expected impact:** Increases executive trust during initial pilots.
   - **Affected qualities:** Executive Value Visibility (+5-7 pts), Usability (+2-4 pts). Weighted impact: ~0.1%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     Locate the compliance drift and dashboard chart components in `archlucid-ui/src/app/(operator)/dashboard/`. Modify the render logic so that if the data array is empty, it displays a polished empty state component (e.g., a muted gray placeholder with text "Data gathering in progress. Commit a review to see trends.") instead of a blank or broken chart.
     ```

7. **Create Key Vault connectivity health check probe**
   - **Why it matters:** Surfaces configuration errors immediately upon boot.
   - **Expected impact:** Reduces silent failures.
   - **Affected qualities:** Supportability (+5-8 pts), Reliability (+2-4 pts). Weighted impact: ~0.05%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     In the API project, implement a new `IHealthCheck` class named `KeyVaultConnectivityHealthCheck`. It should verify that the application can successfully authenticate and reach the configured Azure Key Vault. Register it with the health check builder tagged for `/health/ready`. Add corresponding unit tests.
     ```

8. **Document generic OIDC configuration examples (Auth0, Okta)**
   - **Why it matters:** Removes ambiguity for enterprise IAM teams.
   - **Expected impact:** Reduces enterprise adoption blockers.
   - **Affected qualities:** Adoption Friction (+4-6 pts), Maintainability (+2-3 pts). Weighted impact: ~0.1%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     Edit `docs/library/CONFIGURATION_REFERENCE.md`. Under the identity section, add a concrete JSON/YAML snippet example for configuring generic OIDC (`ArchLucidAuth:Mode=JwtBearer` with `ArchLucidAuth:Authority` pointing to an Okta/Auth0-style issuer). Include notes on mapping IdP claims to `ArchLucidRoles`.
     ```

9. **Add strict schema version validation tests for Extractor upload**
   - **Why it matters:** Protects the backend from malformed or outdated ZIP payloads.
   - **Expected impact:** Increases pipeline reliability.
   - **Affected qualities:** Reliability (+4-5 pts), Supportability (+2-4 pts). Weighted impact: ~0.05%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     Locate the Azure Extractor upload endpoint tests (e.g., `AzureExtractorUploadEndpointTests.cs`) and the corresponding controller implementation. Ensure there is explicit logic that reads `manifest.json`, checks the `schemaVersion`, and returns a 422 Unprocessable Entity if the version is missing or unsupported. Write a unit test providing a mocked ZIP with an invalid schema version to assert the 422 response.
     ```

10. **Add explicit Key Vault exclusion filtering to Extractor script**
    - **Why it matters:** Prevents accidental ingestion of secret data.
    - **Expected impact:** Mitigates a top engineering risk.
    - **Affected qualities:** Reliability (+2-3 pts), Adoption Friction (+2-3 pts). Weighted impact: ~0.05%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Edit `scripts/azure/Get-ArchLucidAzurePackage.ps1`. Explicitly filter out `Microsoft.KeyVault/vaults/secrets` or ensure that when looping over resources, the script strictly grabs structural ARM metadata and NEVER requests the data plane or secret contents. Add a comment explaining this security boundary.
      ```

11. **Add `BillingProductionSafetyRules` explicit critical logging**
    - **Why it matters:** Decreases debug time when the app fails to boot.
    - **Expected impact:** Improves supportability.
    - **Affected qualities:** Supportability (+4-6 pts). Weighted impact: ~0.02%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Locate the `BillingProductionSafetyRules` class or configuration validation logic. When it throws an exception or fails validation, ensure it uses `ILogger` to emit a `Critical` level log with exact remediation instructions before throwing the exception.
      ```

12. **Enforce global SQL command timeouts on Repositories**
    - **Why it matters:** Prevents long-running queries from locking up the orchestrator during transient database load.
    - **Expected impact:** Improves overall system reliability.
    - **Affected qualities:** Reliability (+3-5 pts). Weighted impact: ~0.05%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Review the Dapper or EF Core database connection logic (e.g., `SqlDbConnectionFactory`). Implement a global default command timeout (e.g., 30 seconds) across all data access repositories to ensure queries fail fast and trigger the orchestrator's retry logic instead of hanging indefinitely. Add a unit test verifying this timeout configuration.
      ```

13. **Complete Phase 7 renaming for `ArchLucid.sql` artifacts**
    - **Why it matters:** Reduces tech debt and cognitive load.
    - **Expected impact:** Cleaner codebase.
    - **Affected qualities:** Maintainability (+3-5 pts). Weighted impact: ~0.05%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Search for remaining instances of legacy naming mentioned in the Phase 7 cleanup guidelines (e.g., `ArchLucid.sql` file references) and rename them to their intended targets. Update any corresponding script or configuration references.
      ```

14. **Add integration test for Correlation ID propagation to Audit logs**
    - **Why it matters:** Guarantees that cross-service requests can be accurately traced during incident response.
    - **Expected impact:** Improves supportability and incident resolution time.
    - **Affected qualities:** Supportability (+5-7 pts), Reliability (+2-3 pts). Weighted impact: ~0.05%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Create an integration test in the API test suite that sends an HTTP request with a specific `X-Correlation-ID` header. Assert that the resulting durable audit event written to the database contains this exact correlation ID, proving the middleware correctly propagates it to the audit service.
      ```

15. **Add audit event test for Export generation failures**
    - **Why it matters:** Ensures the audit log non-repudiation chain is unbroken.
    - **Expected impact:** Boosts compliance and trust.
    - **Affected qualities:** Supportability (+3-4 pts), Reliability (+2-3 pts). Weighted impact: ~0.03%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Locate the export service tests. Add a test that forces the export generation to fail (e.g., via a mocked exception) and verify that a failure-specific `AuditEventType` (e.g., `Export.Failed`) is still durably written to the `IAuditService`.
      ```

16. **Automate OWASP ZAP Baseline validation in CI**
    - **Why it matters:** Ensures continuous security posture and prevents regressions on the API image.
    - **Expected impact:** Strengthens security and CI honesty.
    - **Affected qualities:** Reliability (+2-3 pts), Maintainability (+2-3 pts). Weighted impact: ~0.08%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Update the GitHub Actions CI workflow (e.g., `.github/workflows/ci.yml`). Add a step that runs the OWASP ZAP baseline scan against the built API container image. Configure the step to fail the build if high-severity vulnerabilities are detected, and ensure the scan report is uploaded as a workflow artifact.
      ```

17. **Add informative empty state to Artifacts list in Review UI**
    - **Why it matters:** Improves the operator experience when a review is still executing or has no artifacts.
    - **Expected impact:** Reduces UX friction.
    - **Affected qualities:** Usability (+3-4 pts), Adoption Friction (+2-3 pts). Weighted impact: ~0.08%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Locate the Artifacts table component in the Review detail page (`archlucid-ui/src/app/(operator)/reviews/[runId]/`). Update the component to display a polished empty state (e.g., an icon and "No artifacts generated yet. Wait for the review to commit.") if the artifacts array is empty, rather than a collapsed or broken table.
      ```

18. **Add tooltips for "Show more links" in UI sidebar**
    - **Why it matters:** Improves discovery of Operate-tier features.
    - **Expected impact:** Better usability.
    - **Affected qualities:** Usability (+4-6 pts). Weighted impact: ~0.05%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      In the `archlucid-ui` sidebar component, add a subtle, dismissible tooltip (using the existing Tooltip or Popover component) pointing to the "Show more links" button. The tooltip should say "Unlock advanced analysis and governance tools."
      ```

19. **Create SCIM Provisioning Quickstart Doc**
    - **Why it matters:** Accelerates SSO/SCIM integration.
    - **Expected impact:** Less enterprise friction.
    - **Affected qualities:** Adoption Friction (+3-5 pts). Weighted impact: ~0.05%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Create `docs/integrations/SCIM_PROVISIONING_QUICKSTART.md`. Write a brief quickstart guide summarizing how to provision the `ScimBearer` token, the expected `/scim/v2/Users` endpoints, and how group-to-role mapping works for Entra ID SCIM clients.
      ```

20. **Create Private Endpoint setup guide for Azure**
    - **Why it matters:** Clarifies the network security configuration for enterprise deployments.
    - **Expected impact:** Speeds up enterprise onboarding and InfoSec approvals.
    - **Affected qualities:** Maintainability (+3-4 pts), Adoption Friction (+3-5 pts). Weighted impact: ~0.1%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Create a new markdown document at `docs/runbooks/PRIVATE_ENDPOINT_SETUP.md`. Write a concise guide explaining how to configure Azure Private Endpoints for the SQL and Blob storage resources using the provided Terraform modules. Link this guide from the `CUSTOMER_TRUST_AND_ACCESS.md` document.
      ```

21. **Add explicit Azure OpenAI content safety error handling tests**
    - **Why it matters:** Guarantees application resilience if Azure AI Content Safety returns 5xx.
    - **Expected impact:** Improves API stability under external duress.
    - **Affected qualities:** Reliability (+3-5 pts). Weighted impact: ~0.05%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Create a unit test for the Content Safety HTTP client logic. Mock the response to return a 503 Service Unavailable or 429 Too Many Requests, and assert that the application either fails closed safely (as per configuration) or retries appropriately without bringing down the orchestrator process.
      ```

22. **DEFERRED: Stripe Live Keys Flip**
    - **Reason deferred:** Requires owner-only action in Stripe Dashboard and Partner Center to transition keys and verify tax profiles.
    - **Information needed:** Owner confirmation that Stripe live keys are ready and the Marketplace offer is set to 'Published'.

23. **Implement unique-finding deduplication for Executive ROI API**
    - **Why it matters:** Prevents double-counting of savings across multiple architecture reviews, ensuring CFOs see an honest, defensible ROI.
    - **Expected impact:** Strengthens Proof-of-ROI credibility and Executive Value Visibility.
    - **Affected qualities:** Proof-of-ROI Readiness (+5-7 pts), Executive Value Visibility (+4-6 pts). Weighted impact: ~0.15%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Create a new API endpoint `GET /v1/reports/executive-summary` (or extend the existing pilot scorecard) that aggregates cost savings and risk reduction across multiple runs for a tenant. Implement deduplication logic based on unique finding identity (e.g., `FindingId` or resource signature) so that overlapping findings across runs are only counted once towards the total ROI. Write unit tests to verify the unique-finding aggregation logic.
      ```

24. **DEFERRED: Automated Tenant Erasure Pipeline**
    - **Reason deferred:** Fully automated GDPR quarantine/purge is an explicit V2 roadmap item.
    - **Information needed:** Go-ahead to pull this work forward, or confirmation to leave it scheduled for V2.

25. **DEFERRED: Third-party Pen Test Execution**
    - **Reason deferred:** Awaiting vendor selection and SOW execution (V2).
    - **Information needed:** Confirmation of executed SOW to proceed with generating redacted summary assets.

---

## Prompt Batching Guidance
To optimize context windows and cost:
- **Batch 1 (UI & Terminology):** Run Prompts #3, #6, #17, and #18 together, passing the `archlucid-ui/src/` context.
- **Batch 2 (API Safety & Resilience):** Run Prompts #2, #7, #9, #11, #12, #14, #15, #21, and #23 together, providing the `.cs` test and controller files.
- **Batch 3 (Powershell & Scripts):** Run Prompts #1, #10, and #16 together, providing `scripts/azure/` and `.github/workflows/`.
- **Batch 4 (Documentation & Debt):** Run Prompts #4, #5, #8, #13, #19, and #20 together, providing the `docs/` directory context and relevant legacy SQL files.

---

## Pending Questions for Later
- **Stripe Live Keys Flip:** Are the live keys available and is the Marketplace profile fully verified?
- **Automated Tenant Erasure:** Is there any desire to pull the automated 30-day quarantine pipeline forward from V2 to V1.1?
- **Third-Party Pen Test:** Has an external vendor been selected for the V2 penetration test?

*(Deferred Scope Uncertainty: None. All deferred items were successfully located in `V1_DEFERRED.md`, `V1_SCOPE.md`, and `TRUST_CENTER.md`.)*