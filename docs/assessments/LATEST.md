# ArchLucid Assessment – (A) Headline Readiness: 82.74%

*This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding explicitly deferred V1.1/V2 items.*

## Executive Summary

### `(A)` Overall Headline Readiness
The solution stands at an 82.74% weighted readiness score for the V1 headline. The core agent orchestration, tenant isolation model (database-per-tenant), and the Tier 1 Azure Extractor pipeline are structurally sound. The primary deductions stem from UX friction in the time-to-value path (e.g., PowerShell script pre-flight robustness) and minor inconsistencies in nomenclature (e.g., legacy "Runs" vs. "Reviews" terminology) that impact the polish of the enterprise product. 

### `(B)` Procurement / Market-Motion Realism
From a buyer friction perspective, the absence of a CPA-issued SOC 2 Type I/II report and an external third-party penetration test will trigger extended InfoSec reviews. While the in-repo SOC 2 self-assessment and owner-conducted pen test mitigate some pushback, enterprise procurement teams will likely impose delays. Furthermore, the manual nature of the PowerShell-based Azure Extractor (Tier 1) may trigger endpoint-security exceptions on corporate laptops.

### Commercial Picture
The V1 commercial motion is strictly sales-led. Because the Stripe live keys flip and Azure Marketplace 'Published' status are intentionally deferred to V1.1 (owner-only actions), true zero-touch self-serve revenue is blocked. However, the trial funnel works perfectly in TEST mode, and the product effectively demonstrates cost-savings ROI via the uploaded Extractor payloads. The commercial capability is ready for sales-engineer-led onboarding.

### Enterprise Picture
Enterprise readiness is strong due to the native support for generic OIDC and SAML 2.0 SP in V1 GA, alongside robust RBAC and append-only SQL audit logging. However, the lack of automated, cross-tenant executive ROI rollups (V1.1 candidate) and the manual nature of tenant erasure (V2 candidate) will require account executives to rely heavily on manual narrative mapping during enterprise QBRs and GDPR compliance evaluations.

### Engineering Picture
The engineering baseline is highly reliable and constrained. Agentic actions are correctly walled off (e.g., plan-only Terraform advisory snippets with explicit block-lists against `apply`/`destroy`). The decision to defer Azure Container Apps Jobs and the Durable Task Framework to V2 keeps the V1 architecture simple and maintainable. The most pressing engineering needs are extending test coverage for explicit block-lists and ensuring Key Vault connectivity resilience.

---

## Weighted Quality Assessment

Qualities are ranked from most urgent to least urgent based on their weighted deficiency.

### 1. Time-to-Value
- **Score:** 82
- **Weight:** 7
- **Weighted deficiency signal:** 126
- **Justification:** While the Tier 1 Azure Extractor removes the need for vendor IAM credentials, requiring customers to execute a PowerShell script locally introduces environment-specific friction (execution policies, missing Azure modules).
- **Tradeoffs:** Zero-IAM access vs. script execution friction.
- **Recommendations:** Add robust pre-flight module and execution-policy checks to the PowerShell script; provide clearer UI hints during the upload phase.

### 2. AI/Agent Readiness
- **Score:** 86
- **Weight:** 8
- **Weighted deficiency signal:** 112
- **Justification:** Agents are safely bounded and operate deterministically. However, hallucination risks around Terraform snippet generation (e.g., accidentally suggesting a `destroy` block) require aggressive, explicit string-matching guards at the API boundary before presentation.
- **Tradeoffs:** Agent flexibility vs. strict output schema and safety validation.
- **Recommendations:** Implement hard-coded regex and AST validation on all generated Terraform to strip or flag destructive actions.

### 3. Proof-of-ROI Readiness
- **Score:** 80
- **Weight:** 5
- **Weighted deficiency signal:** 100
- **Justification:** Per-run ROI and scorecard endpoints exist, but the metadata proving exactly *when* the Azure pricing baseline was collected is sometimes buried.
- **Tradeoffs:** Granular pricing data storage vs. top-level UI simplicity.
- **Recommendations:** Elevate the Extractor `collectionTimestamp` directly into the Pilot Outcome Summary DTO to guarantee citation tracking.

### 4. Adoption Friction
- **Score:** 85
- **Weight:** 6
- **Weighted deficiency signal:** 90
- **Justification:** High architectural trust due to database-per-tenant isolation, but the operator UI still uses legacy terminology ("Runs" instead of "Reviews") which confuses new users during onboarding.
- **Tradeoffs:** Shipped code stability vs. UI nomenclature refactoring.
- **Recommendations:** Systematically rename "Runs" to "Reviews" across the React UI components and routing namespaces.

### 5. Executive Value Visibility
- **Score:** 78
- **Weight:** 4
- **Weighted deficiency signal:** 88
- **Justification:** The governance dashboard and compliance drift trends are effective, but missing empty-state visuals can make the dashboard look broken during a fresh trial before data accumulates.
- **Tradeoffs:** Developing empty states vs. core analytical features.
- **Recommendations:** Build dedicated, informative empty-state components for all dashboard charts.

### 6. Usability
- **Score:** 82
- **Weight:** 3
- **Weighted deficiency signal:** 54
- **Justification:** The baseline wizard and comparison tools are strong. However, finding the "Show more links" toggle for advanced analysis requires discovery.
- **Tradeoffs:** Clean sidebar vs. discoverability of advanced features.
- **Recommendations:** Introduce a subtle onboarding tooltip pointing to the advanced analytical links.

### 7. Maintainability
- **Score:** 75
- **Weight:** 2
- **Weighted deficiency signal:** 50
- **Justification:** Phase 7 renaming (ArchLucid.sql) and legacy configuration bridges are pending cleanup. The custom agent handler documentation is currently missing.
- **Tradeoffs:** Feature delivery vs. technical debt and doc-writing.
- **Recommendations:** Author the `CUSTOM_AGENT_HANDLER_GUIDE.md` and complete the minor rename tasks.

### 8. Reliability
- **Score:** 88
- **Weight:** 2
- **Weighted deficiency signal:** 24
- **Justification:** The orchestrator pipeline handles retry and queueing well. A minor gap exists in default health checks for Key Vault connectivity.
- **Tradeoffs:** Fast startup vs. comprehensive dependency probing.
- **Recommendations:** Add an explicit Azure Key Vault connectivity probe to `/health/ready`.

### 9. Supportability
- **Score:** 88
- **Weight:** 1
- **Weighted deficiency signal:** 12
- **Justification:** Exceptional audit logging and diagnostic CLI tools. Missing only some edge-case integration tests for Extractor upload failures.
- **Tradeoffs:** Fast test execution vs. exhaustive edge-case coverage.
- **Recommendations:** Add unit tests for `azure-extractor/upload` schema version mismatch scenarios.

---

## Top 12 Most Important Weaknesses
1. Legacy "Runs" terminology in the UI confuses the "Request -> Review -> Commit" product lifecycle narrative.
2. Extractor PowerShell script lacks graceful fallback/error messages if the user is missing required `Az` modules.
3. Missing AST/regex block-list checks in the API tests to definitively prove Terraform `destroy` blocks are never emitted.
4. Schema version validation on the Extractor ingest endpoint is not strictly enforced in the current integration test suite.
5. Generic OIDC identity setup lacks concrete step-by-step examples in the documentation, slowing enterprise SSO onboarding.
6. The compliance drift dashboard lacks a polished "empty state", making fresh tenants look defective.
7. Key Vault connectivity is not explicitly checked in the `/health/ready` probe, potentially causing silent runtime configuration failures.
8. `BillingProductionSafetyRules` log outputs are not verbose enough to instantly diagnose why a startup is blocked in staging.
9. Custom Agent Handler developer documentation is missing, violating a V1 GA commitment.
10. The pilot outcome DTO doesn't explicitly expose the exact Azure Retail pricing timestamp at the top level.
11. Missing automated test harness for the PowerShell Extractor script logic itself.
12. Trial funnel runbook lacks the stub structure for the V1 to V1.1 migration documentation requirement.

---

## Top 6 Monetization Blockers
1. **Deferred Stripe Live Keys Flip:** Actual self-serve revenue is physically blocked until owner un-holds the keys (V1.1).
2. **Marketplace Unpublished State:** Transactability via Azure Marketplace is blocked until owner completes Partner Center validation (V1.1).
3. **Missing Cross-Run Executive ROI API:** CFOs cannot easily see a rolled-up deduplicated view of savings across multiple architecture reviews (V1.1).
4. **AWS/GCP Exclusion:** Inability to analyze AWS/GCP targets out-of-the-box halts deals with multi-cloud or non-Azure-centric buyers (V1.1).
5. **No Built-in Native ITSM Sync:** The lack of bidirectional Jira/ServiceNow status sync limits stickiness in mature enterprise workflows (V1.1).
6. **Board-Pack PDF Limitations:** Exporting highly formatted, C-level readouts requires manual intervention if the UI charts don't render perfectly to PDF.

---

## Top 6 Enterprise Adoption Blockers
1. **SOC 2 CPA Attestation Absence:** Procurement teams will mandate manual security questionnaires because the formal CPA SOC 2 report is deferred.
2. **Third-Party Pen Test Absence:** Lack of an external, redacted vendor summary requires trust in the internal owner-conducted exercise.
3. **Local PowerShell Execution Requirements:** InfoSec policies blocking local `.ps1` execution will force buyers to delay pilots while seeking endpoint exceptions.
4. **Manual GDPR Tenant Erasure:** The lack of an automated quarantine/purge pipeline will cause friction during privacy compliance reviews.
5. **OIDC/SAML Setup Ambiguity:** Enterprise IAM teams will struggle without concrete, vendor-specific mapping examples in the docs.
6. **No Automated Teams/Slack ChatOps:** Enterprise teams relying on chat-driven approvals will have to wait for V1.1 for native integrations.

---

## Top 6 Engineering Risks
1. **Agent Hallucinated Destructive IaC:** The LLM might generate a Terraform snippet containing a `destroy` block if prompt constraints fail and strict regex filters are absent.
2. **Extractor Script Scoop Scope:** The PowerShell script could accidentally ingest sensitive Key Vault metadata if Azure API responses change and strict property allow-listing isn't used.
3. **Unvalidated Extractor Schema:** If the API accepts an outdated or malformed ZIP schema, downstream parsers could throw unhandled exceptions and crash the worker pipeline.
4. **Key Vault Outage Silent Failures:** If Azure Key Vault experiences a transient drop, the app might fail to boot or fetch secrets without clear health-probe visibility.
5. **Orchestrator Lockups:** Without the Durable Task Framework, long-running agent loops might hit edge-case race conditions in the SQL state machine.
6. **Missing Audit on Edge Exports:** If a bulk ZIP export fails midway, the audit log might miss the failure event, breaking the non-repudiation chain.

---

## Most Important Truth
ArchLucid's V1 core is functionally complete and safely bounded, but its immediate monetization potential is gated by pending owner-only commercial flips (Stripe/Marketplace) and minor polish issues in the Extractor UX and UI nomenclature that cause unnecessary time-to-value friction.

---

## Top Improvement Opportunities

1. **Rename "Runs" to "Reviews" in Operator UI components**
   - **Why it matters:** Aligns UI with the stated product lifecycle (Request -> Review -> Commit).
   - **Expected impact:** Lowers adoption friction and cognitive load.
   - **Affected qualities:** Usability (+3-5 pts), Adoption Friction (+2-4 pts). Weighted impact: ~0.1%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     Search the `archlucid-ui/src/` directory for instances of the word "Run" or "Runs" used in user-facing labels, headings, or navigation menus, and replace them with "Review" or "Reviews". Do NOT change variable names, API routes, or URL paths (e.g., keep `runId` and `/reviews/[runId]`). Update the text in `RunDetailRunActionsSection.tsx` and `runs-page-model.ts` to reflect this buyer-facing terminology. Ensure tests pass.
     ```

2. **Add explicit terraform `destroy` blocking checks to tests**
   - **Why it matters:** Prevents accidental destructive IaC emit, a core V1 safety promise.
   - **Expected impact:** Eliminates catastrophic engineering risk.
   - **Affected qualities:** AI/Agent Readiness (+5-8 pts), Reliability (+2-3 pts). Weighted impact: ~0.15%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     Modify the Terraform advisory snippet generation tests (e.g., `TerraformAdvisorySnippetTemplatesTests.cs`). Add a new test case that explicitly verifies that if an LLM mock returns a Terraform block containing the word `destroy`, the system either sanitizes it, replaces it with a comment, or throws an expected validation exception. Do not change the core architecture, only add the strict assertion tests.
     ```

3. **Generate Custom Agent Handler Documentation**
   - **Why it matters:** Fulfills the V1 GA commitment for extensibility guidance.
   - **Expected impact:** Removes a documentation gap for advanced integrators.
   - **Affected qualities:** Maintainability (+4-6 pts), Adoption Friction (+2-3 pts). Weighted impact: ~0.1%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     Create a new markdown file at `docs/library/CUSTOM_AGENT_HANDLER_GUIDE.md`. Write a comprehensive guide explaining how an advanced integrator can author and register a custom agent handler in the ArchLucid orchestration pipeline. Include sections on prerequisites, authority/safety posture, registration expectations, and versioning boundaries. Ensure it explicitly states that this is for in-repo/self-hosted extensions, not a public plugin marketplace. Update `START_HERE.md` to link to it.
     ```

4. **Implement Schema Version strict validation in Extractor Ingest**
   - **Why it matters:** Protects the backend from malformed or outdated ZIP payloads.
   - **Expected impact:** Increases pipeline reliability.
   - **Affected qualities:** Reliability (+4-5 pts), Supportability (+2-4 pts). Weighted impact: ~0.05%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     Locate the Azure Extractor upload endpoint tests (e.g., `AzureExtractorUploadEndpointTests.cs`) and the corresponding controller implementation. Ensure there is explicit logic that reads `manifest.json`, checks the `schemaVersion`, and returns a 400 Bad Request if the version is missing or unsupported. Write a unit test providing a mocked ZIP with an invalid schema version to assert the 400 response.
     ```

5. **Add Pre-flight module checks to PowerShell script**
   - **Why it matters:** Prevents mid-execution crashes on customer machines.
   - **Expected impact:** Speeds up Tier 1 onboarding.
   - **Affected qualities:** Time-to-Value (+5-7 pts), Adoption Friction (+3-5 pts). Weighted impact: ~0.15%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     Edit `scripts/azure/Get-ArchLucidAzurePackage.ps1`. Add a pre-flight `try/catch` block at the beginning of the script that checks if the `Az.Accounts` and `Az.Resources` modules are installed and imported. If they are not, write a clear, actionable warning message in yellow instructing the user to run `Install-Module Az` and exit cleanly. Do not alter the core extraction logic.
     ```

6. **Add missing generic OIDC setup examples to Configuration Reference**
   - **Why it matters:** Removes ambiguity for enterprise IAM teams.
   - **Expected impact:** Reduces enterprise adoption blockers.
   - **Affected qualities:** Adoption Friction (+4-6 pts), Maintainability (+2-3 pts). Weighted impact: ~0.1%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     Edit `docs/library/CONFIGURATION_REFERENCE.md`. Under the identity section, add a concrete JSON/YAML snippet example for configuring generic OIDC (`ArchLucidAuth:Mode=JwtBearer` with `ArchLucidAuth:Authority` pointing to an Okta/Auth0-style issuer). Include notes on mapping IdP claims to `ArchLucidRoles`.
     ```

7. **Create a Key Vault Health Check probe**
   - **Why it matters:** Surfaces configuration errors immediately upon boot.
   - **Expected impact:** Reduces silent failures.
   - **Affected qualities:** Supportability (+5-8 pts), Reliability (+2-4 pts). Weighted impact: ~0.05%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     In the API project, implement a new `IHealthCheck` class named `KeyVaultConnectivityHealthCheck`. It should verify that the application can successfully authenticate and reach the configured Azure Key Vault (if Key Vault is enabled in the environment). Register it with the health check builder tagged for `/health/ready`. Add corresponding unit tests.
     ```

8. **Update `archlucid-ui` compliance drift chart with empty states**
   - **Why it matters:** Improves the visual polish for fresh tenants.
   - **Expected impact:** Increases executive trust during initial pilots.
   - **Affected qualities:** Executive Value Visibility (+5-7 pts), Usability (+2-4 pts). Weighted impact: ~0.1%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     Locate the compliance drift and dashboard chart components in `archlucid-ui/src/app/(operator)/dashboard/`. Modify the render logic so that if the data array is empty, it displays a polished empty state component (e.g., a muted gray placeholder with text "Data gathering in progress. Commit a review to see trends.") instead of a blank or broken chart.
     ```

9. **Elevate Extractor timestamp in Pilot Outcome Summary DTO**
   - **Why it matters:** Ensures exact citation of pricing metrics for ROI proof.
   - **Expected impact:** Strengthens Proof-of-ROI credibility.
   - **Affected qualities:** Proof-of-ROI Readiness (+4-6 pts). Weighted impact: ~0.08%.
   - **Actionable Now.**
   - **Cursor Prompt:**
     ```
     Modify the `PilotOutcomeSummaryResponse` DTO (and its mapping logic) to explicitly include an `ExtractorCollectionTimestampUtc` property. Map this property from the underlying ingested ZIP manifest metadata. Update relevant unit tests to assert that this property is correctly passed through to the API response.
     ```

10. **Add explicit Key Vault exclusion filtering to PowerShell script**
    - **Why it matters:** Prevents accidental ingestion of secret data.
    - **Expected impact:** Mitigates a top engineering risk.
    - **Affected qualities:** Reliability (+2-3 pts), Adoption Friction (+2-3 pts). Weighted impact: ~0.05%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Edit `scripts/azure/Get-ArchLucidAzurePackage.ps1`. Explicitly filter out `Microsoft.KeyVault/vaults/secrets` or ensure that when looping over resources, the script strictly grabs structural ARM metadata and NEVER requests the data plane or secret contents. Add a comment explaining this security boundary.
      ```

11. **Add `BillingProductionSafetyRules` explicit logging**
    - **Why it matters:** Decreases debug time when the app fails to boot.
    - **Expected impact:** Improves supportability.
    - **Affected qualities:** Supportability (+4-6 pts). Weighted impact: ~0.02%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Locate the `BillingProductionSafetyRules` class or configuration validation logic. When it throws an exception or fails validation (e.g., `sk_live_` key without a webhook secret in Production), ensure it uses `ILogger` to emit a `Critical` level log with exact remediation instructions before throwing the exception.
      ```

12. **Update Trial Funnel End to End Runbook for V1.1 Migration stub**
    - **Why it matters:** Sets up the framework for the V1.1 migration commitment.
    - **Expected impact:** Organizes docs for future releases.
    - **Affected qualities:** Maintainability (+2-4 pts). Weighted impact: ~0.02%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Edit `docs/runbooks/TRIAL_FUNNEL_END_TO_END.md`. Add a placeholder heading and section titled `## V1 to V1.1 Migration (Upcoming)`. Add a brief note stating that instructions for migrating trial tenants to V1.1 will be linked here once `HOSTED_TRIAL_V1_TO_V1_1_MIGRATION_GUIDE.md` is finalized.
      ```

13. **Add missing audit event unit tests for Export failures**
    - **Why it matters:** Ensures the audit log non-repudiation chain is unbroken.
    - **Expected impact:** Boosts compliance and trust.
    - **Affected qualities:** Supportability (+3-4 pts), Reliability (+2-3 pts). Weighted impact: ~0.03%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Locate the export service tests (e.g., `RunExportAuditServiceTests.cs`). Add a test that forces the export generation to fail (e.g., via a mocked exception) and verify that a failure-specific `AuditEventType` (e.g., `Export.Failed`) is still durably written to the `IAuditService`.
      ```

14. **Create PGP Key Generation script CI hooks**
    - **Why it matters:** Prepares the repository for the V1.1 PGP drop smoothly.
    - **Expected impact:** Streamlines future compliance work.
    - **Affected qualities:** Maintainability (+2-3 pts). Weighted impact: ~0.02%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Ensure that the CI guard mentioned in the docs (which turns green automatically when `archlucid-ui/public/.well-known/pgp-key.txt` is detected) is correctly implemented in the GitHub Actions workflow files. If it's currently failing the build when absent, change it to a `continue-on-error: true` warn-mode step for the V1 window.
      ```

15. **Add tooltips for "Show more links" in UI**
    - **Why it matters:** Improves discovery of Operate-tier features.
    - **Expected impact:** Better usability.
    - **Affected qualities:** Usability (+4-6 pts). Weighted impact: ~0.05%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      In the `archlucid-ui` sidebar component, add a subtle, dismissible tooltip (using the existing Tooltip or Popover component) pointing to the "Show more links" button. The tooltip should say "Unlock advanced analysis and governance tools."
      ```

16. **Create SCIM Provisioning Quickstart Doc**
    - **Why it matters:** Accelerates SSO/SCIM integration.
    - **Expected impact:** Less enterprise friction.
    - **Affected qualities:** Adoption Friction (+3-5 pts). Weighted impact: ~0.05%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Create `docs/integrations/SCIM_PROVISIONING_QUICKSTART.md`. Write a brief quickstart guide summarizing how to provision the `ScimBearer` token, the expected `/scim/v2/Users` endpoints, and how group-to-role mapping works for Entra ID SCIM clients.
      ```

17. **Refactor DB Connection String builder for robustness**
    - **Why it matters:** Prevents transient SQL failures from crashing the boot sequence.
    - **Expected impact:** Higher reliability.
    - **Affected qualities:** Reliability (+2-4 pts). Weighted impact: ~0.03%.
    - **Actionable Now.**
    - **Cursor Prompt:**
      ```
      Review the `SystemWithPerTenantCatalogs` topology connection string generation logic (e.g., `TestSqlDbConnectionFactory.cs` or the production equivalent). Ensure it explicitly sets `ConnectRetryCount=3` and `ConnectRetryInterval=10` (or similar robust defaults) to handle Azure SQL transient boot drops.
      ```

18. **DEFERRED: Stripe Live Keys Flip**
    - **Reason deferred:** Requires owner-only action in Stripe Dashboard and Partner Center to transition keys and verify tax profiles.
    - **Information needed:** Owner confirmation that Stripe live keys are ready and the Marketplace offer is set to 'Published'.

19. **DEFERRED: Cross-run executive ROI summary aggregation logic**
    - **Reason deferred:** Product logic for overlapping findings is undecided.
    - **Information needed:** Do we aggregate overlapping findings by sum, max, or unique-finding identity?

20. **DEFERRED: Automated Tenant Erasure Quarantine Pipeline**
    - **Reason deferred:** V2 candidate; specific legal hold workflows need definition.
    - **Information needed:** What is the exact delay (e.g., 30 days) and who has the RBAC authority to lift a legal hold?

21. **DEFERRED: AWS/GCP inventory ZIP script structure**
    - **Reason deferred:** V1.1 scope; requires mapping of AWS APIs to ArchLucid schema.
    - **Information needed:** Which specific AWS/GCP CLI commands or APIs should we invoke for the illustrative cost fallbacks?

22. **DEFERRED: ServiceNow auto-create CMDB CI class selection**
    - **Reason deferred:** V1.1 scope; CMDB taxonomy decisions.
    - **Information needed:** Is the default `cmdb_ci_appl` class strictly sufficient, or should we build a custom taxonomy mapping table?

23. **DEFERRED: Confluence integration default space key dynamic routing**
    - **Reason deferred:** V1.1 scope; routing complexity.
    - **Information needed:** Do we ship the MVP with a single fixed space key, or do we implement dynamic routing based on tenant metadata immediately?

24. **DEFERRED: Slack interactive buttons (Approve/Ack)**
    - **Reason deferred:** Unpinned follow-on feature.
    - **Information needed:** Should we prioritize interactive Slack actions for V1.1, or keep it deferred to V2?

25. **DEFERRED: Raising bulk upload cap beyond 30 files**
    - **Reason deferred:** V1.1 scale testing required.
    - **Information needed:** What is the target cap (e.g., 100 files, 500 files) and what is the maximum memory footprint allowed per request?

---

## Prompt Batching Guidance
To optimize context windows and cost:
- **Batch 1 (UI & Terminology):** Run Prompts #1, #8, and #15 together, passing the `archlucid-ui/src/` context.
- **Batch 2 (API Safety & Resilience):** Run Prompts #2, #4, #7, #11, and #17 together, providing the `.cs` test and controller files.
- **Batch 3 (Powershell & Scripts):** Run Prompts #5, #10, and #14 together, providing `scripts/azure/` and `.github/workflows/`.
- **Batch 4 (Documentation):** Run Prompts #3, #6, #12, and #16 together, providing the `docs/` directory context.

---

## Pending Questions for Later
- **Stripe Live Keys Flip:** Are the live keys available and is the Marketplace profile fully verified?
- **Cross-run executive ROI:** How should overlapping findings be aggregated (sum, max, unique)?
- **Automated Tenant Erasure:** What is the legal hold duration and approval process?
- **AWS/GCP inventory:** Which exact AWS/GCP APIs will we use for the cost fallback script?
- **ServiceNow CMDB:** Will `cmdb_ci_appl` suffice for the MVP?
- **Confluence routing:** Fixed space key or dynamic routing?
- **Slack interactivity:** Are approval buttons a hard requirement for V1.1?
- **Bulk upload cap:** What is the target file limit and memory threshold?