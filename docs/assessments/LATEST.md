> **Scope:** Canonical current V1 GA readiness assessment for coding agents and the owner; headline readiness per `Assessment-Scope-V1_1.mdc`—not an archived snapshot or a buyer/procurement deliverable.

# ArchLucid Assessment – (A) Headline Readiness: 80.58%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, explicitly excluding deferred items such as SOC 2 CPA attestation, signed design partners, public extension SDKs, MCP inbound servers, and third-party plugin marketplaces.

> **Update 2026-05-21 (judgment-resolved follow-up):** Owner directed me to apply judgment to all previously DEFERRED improvement items rather than block on input. The nine improvements listed below (#1, #10, #11, #14, #15, #17, #18, #21, #24) have been converted from DEFERRED to actionable with concrete Cursor prompts based on architectural patterns already present in the repo. The headline score is unchanged because those items remain unshipped; once executed, the expected cumulative weighted readiness gain is approximately **+0.55%**.

## Executive Summary

### (A) Overall Headline Readiness
ArchLucid is functionally mature and ready for V1 GA (80.58%), featuring a robust AI pipeline, solid architectural foundations, and comprehensive features like the first-run wizard and AI-assisted authoring. The primary areas requiring attention are reducing the manual configuration burden for enterprise deployments (SSO, custom policies) and making the ROI narrative more empirical by allowing operators to input custom baselines.

### (B) Procurement / Market-Motion Realism
Enterprise procurement will encounter friction due to the absence of a CPA-issued SOC 2 Type II attestation and a published third-party penetration test. While the in-repo self-assessments and Trust Center provide excellent transparency, rigid RFP processes often treat these missing third-party attestations as hard blockers. The lack of a signed design partner may also slow early enterprise momentum.

### Commercial Picture
The commercial packaging is clear, but the deferral of the Stripe live-keys flip and Marketplace publication to V1.1 means the V1 motion is entirely sales-led. This places a burden on the team to manually provision and manage trial conversions. Time-to-value for the initial demo is excellent thanks to pre-seeded runs, but proving empirical ROI requires customer-supplied baselines that are currently hardcoded or opaque.

### Enterprise Picture
ArchLucid's enterprise posture is strong, featuring database-per-tenant isolation, Entra ID / SAML 2.0 SP integration, and a durable audit trail. The primary enterprise blockers are usability-related: setting up SSO and custom policy packs requires manual effort and reading documentation, lacking guided UI wizards.

### Engineering Picture
The engineering foundation is exceptionally mature, with clean architecture, strict dependency constraints, and defensive LLM integration. Engineering risks are concentrated in unhandled edge cases at scale: reliance on a single SQL Server primary for writes, in-memory cache limitations for multi-replica scaling, and overlapping persistence projects that complicate the dependency graph.

---

## Weighted Quality Assessment

*Ordered from most urgent to least urgent based on weighted deficiency.*

### 1. Adoption Friction
- **Score:** 75
- **Weight:** 6
- **Weighted deficiency signal:** 150
- **Why this score was assigned:** While the pilot path is streamlined, transitioning to a production configuration with custom Policy Packs and Entra ID / SAML integration requires significant manual effort and deep domain knowledge.
- **Key tradeoffs:** Deep, secure governance naturally imposes upfront configuration costs compared to frictionless consumer SaaS.
- **Specific improvement recommendations:** Provide guided setup wizards in the UI for SSO integration and a visual policy pack builder.
- **Fixability:** Fixable in V1.

### 2. Time-to-Value
- **Score:** 80
- **Weight:** 7
- **Weighted deficiency signal:** 140
- **Why this score was assigned:** Pre-seeded runs and AI authoring provide fast value. However, the Azure extractor script requires local PowerShell execution, which can be a hurdle.
- **Key tradeoffs:** Relying on a customer-executed script reduces security friction but increases the risk of execution errors on the customer's machine.
- **Specific improvement recommendations:** Provide a one-click "Deploy Sample Architecture" button for instant evaluation without local scripts.
- **Fixability:** Fixable in V1.

### 3. AI/Agent Readiness
- **Score:** 85
- **Weight:** 8
- **Weighted deficiency signal:** 120
- **Why this score was assigned:** The system has excellent AI pipeline engineering, multi-model routing, and calibrated confidence. However, it lacks an operator feedback loop (thumbs up/down) to fine-tune the critic and a prompt A/B testing framework.
- **Key tradeoffs:** Implementing feedback loops requires additional persistence and UI complexity.
- **Specific improvement recommendations:** Add thumbs up/down feedback on findings.
- **Fixability:** Fixable in V1.

### 4. Proof-of-ROI Readiness
- **Score:** 80
- **Weight:** 5
- **Weighted deficiency signal:** 100
- **Why this score was assigned:** The platform estimates USD savings, but relies on hardcoded assumptions. Operators cannot easily input their own hourly rates or cost baselines in the UI.
- **Key tradeoffs:** Hardcoded assumptions simplify the initial experience but reduce credibility for enterprise buyers.
- **Specific improvement recommendations:** Add a "Cost Settings" panel for operators to input custom baselines. *(Completed 2026-05-21 — `/settings/tenant` Cost settings card + `/v1/tenant/cost-settings`.)*
- **Fixability:** Fixable in V1.

### 5. Usability
- **Score:** 75
- **Weight:** 3
- **Weighted deficiency signal:** 75
- **Why this score was assigned:** The UI is functional but exposes significant domain complexity. It lacks global search and keyboard shortcuts for power users.
- **Key tradeoffs:** Accurate modeling of the architecture domain requires specific nomenclature, sacrificing generic simplicity.
- **Specific improvement recommendations:** Implement a global search bar and keyboard shortcuts. *(Completed 2026-05-21 — global search + `c`/`/`/`?` shortcuts.)*
- **Fixability:** Fixable in V1.

### 6. Executive Value Visibility
- **Score:** 85
- **Weight:** 4
- **Weighted deficiency signal:** 60
- **Why this score was assigned:** Strong executive reporting capabilities exist (one-pager, ROI summary), but sponsors must log in or request them manually.
- **Key tradeoffs:** Automated emails require background job infrastructure and reliable email delivery.
- **Specific improvement recommendations:** Schedule automated weekly executive summary emails. *(Completed 2026-05-21 — `WeeklyExecutiveSummaryJob` + `WeeklyExecutiveSummary` email template.)*
- **Fixability:** Fixable in V1.

### 7. Reliability
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Why this score was assigned:** Good resilience patterns (timeouts, retries) are implemented. However, the single SQL Server primary is a SPOF, and external integrations lack advanced circuit breakers.
- **Key tradeoffs:** Adding circuit breakers increases complexity in the HTTP client configuration.
- **Specific improvement recommendations:** Implement advanced circuit breakers for external integrations.
- **Fixability:** Fixable in V1.

### 8. Decision Velocity
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Why this score was assigned:** The `/v1/governance/simulate` endpoint exists, but the policy editor lacks real-time syntax and logic validation.
- **Key tradeoffs:** Real-time validation requires exposing the JSON schema to the frontend.
- **Specific improvement recommendations:** Integrate a JSON Schema validator into the Policy Pack editor. *(Completed 2026-05-21 — `PolicyPackContentJsonEditor` + `GET /v1/governance/policy-pack-content-schema`.)*
- **Fixability:** Fixable in V1.

### 9. Maintainability
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Why this score was assigned:** Clean architecture and magic strings resolved; AI feature code under `ArchLucid.Application/` is tracked in git (verified 2026-05-21). Residual gap is automated dependency hygiene (Dependabot not yet configured).
- **Key tradeoffs:** Keeping the refactor backlog visible in docs is honest but can read as heavier debt than the active top-10 list implies.
- **Specific improvement recommendations:** Configure Dependabot for NuGet, npm, and GitHub Actions. *(Completed 2026-05-21 — daily Dependabot for NuGet, npm, GitHub Actions.)*
- **Fixability:** Fixable in V1.

### 10. Scalability
- **Score:** 75
- **Weight:** 1
- **Weighted deficiency signal:** 25
- **Why this score was assigned:** Database-per-tenant is scalable, but the single SQL Server primary for writes and in-memory caches limit multi-replica scaling.
- **Key tradeoffs:** Implementing distributed caching adds infrastructure dependencies.
- **Specific improvement recommendations:** Implement API rate limiting.
- **Fixability:** Fixable in V1.

### 11. Performance
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Why this score was assigned:** CI performance gates exist, but large API payloads lack response compression.
- **Key tradeoffs:** Compression uses CPU cycles but saves bandwidth.
- **Specific improvement recommendations:** Enable HTTP response compression.
- **Fixability:** Fixable in V1.

### 12. Stickiness
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Why this score was assigned:** Saved views and drift trends create stickiness, but operators cannot share saved views with their team.
- **Key tradeoffs:** Sharing views requires additional permission checks and UI updates.
- **Specific improvement recommendations:** Allow sharing of saved views.
- **Fixability:** Fixable in V1.

### 13. Supportability
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Why this score was assigned:** Support bundle generation is available, but the bundles are static ZIPs without automated analysis.
- **Key tradeoffs:** Automated analysis requires parsing potentially large log files.
- **Specific improvement recommendations:** Add automated log analysis to the support bundle generation.
- **Fixability:** Fixable in V1.

---

## Top 12 Most Important Weaknesses

1. **Manual Enterprise SSO Configuration:** Setting up Entra ID or SAML requires reading documentation and manual configuration, lacking a guided UI wizard.
2. **Local Script Execution for Azure Extractor:** The requirement to run a PowerShell script locally introduces friction and security concerns for some users.
3. **Opaque ROI Assumptions:** Estimated savings calculations rely on hardcoded assumptions that operators cannot easily customize in the UI.
4. **Lack of Operator Feedback Loop:** No mechanism for operators to rate findings (thumbs up/down) to fine-tune the AI critic.
5. **Technical UI Cognitive Load:** The UI exposes too much domain complexity without sufficient progressive disclosure or global search capabilities.
6. **Absence of Scheduled Executive Reporting:** Sponsors must log in or request reports manually; there are no automated weekly summary emails.
7. **Single SQL Server Primary:** Relying on a single primary database for all writes creates a scalability ceiling.
8. **No Real-Time Policy Validation:** The policy editor lacks real-time syntax and logic validation.
9. **In-Memory Cache Limitations:** Reliance on in-memory caches limits multi-replica scalability.
10. **Missing Prompt A/B Testing:** The evaluation harness lacks a framework for A/B testing different prompts.
11. **Cannot Share Saved Views:** Operators cannot share their customized Audit and Graph views with team members.
12. **No Automated Dependency Updates:** Dependabot (or equivalent) is not configured, leaving NuGet/npm/action updates manual.

---

## Top 6 Monetization Blockers

1. **Deferred Commerce Un-hold:** The manual sales motion required before the Stripe live-keys flip limits self-serve velocity.
2. **Inflexible ROI Modeling:** Inability for prospects to input their own cost baselines makes the ROI narrative feel theoretical.
3. **Pilot-to-Production Configuration Chasm:** The steep curve to configure SSO and custom policies delays expansion from pilot to production.
4. **Lack of Published Reference Customer:** The absence of a named, public reference customer reduces trust for risk-averse buyers.
5. **AWS/GCP Deferral:** Azure-only analysis limits the total addressable market.
6. **No Automated Executive Nurturing:** Lack of automated weekly reports means sponsors might forget the platform's value between logins.

---

## Top 6 Enterprise Adoption Blockers

1. **Missing SOC 2 Type II Attestation:** Rigid enterprise procurement processes will flag the lack of a CPA-issued SOC 2 report.
2. **Missing Third-Party Pen Test:** Reliance on owner-conducted testing will not satisfy strict enterprise security reviews.
3. **Extractor Script Security Friction:** Security teams may hesitate to run the Azure extractor script locally.
4. **Complex Identity Setup:** Configuring Entra ID or SAML 2.0 lacks a guided UI wizard.
5. **Lack of ITSM/Chat-Ops Integration:** Deferral of Jira, ServiceNow, Teams, and Slack integrations reduces workflow embeddedness.
6. **No RBAC Granularity in UI:** While RBAC exists, the UI lacks fine-grained controls for managing custom roles.

---

## Top 6 Engineering Risks

1. **Single SQL Server Bottleneck:** A single primary for all writes limits horizontal scaling.
2. **Unbounded Memory Growth:** In-memory caches without strict distributed eviction policies could lead to OutOfMemory exceptions.
3. **No Automated Failover Testing:** The lack of automated failover testing in CI/CD leaves recovery time objectives unproven.
4. **Manual Dependency Updates:** Without Dependabot, security patches in NuGet/npm dependencies rely on manual discovery.
5. **Lack of Response Compression:** Large API payloads without compression can degrade performance.
6. **Overlapping Persistence Projects:** Overlapping persistence projects complicate the dependency graph.

---

## Most Important Truth

ArchLucid possesses a highly mature AI pipeline and solid architectural foundation, but its adoption is constrained by the manual effort required to configure enterprise features (SSO, custom ROI, policy packs) and the friction of running local extraction scripts.

---

## Top Improvement Opportunities

### 1. UI Wizard for SSO Configuration *(Completed 2026-05-21)*
- **Why it matters:** Reduces adoption friction for enterprise deployments by replacing the documentation-walked configuration of `ArchLucidAuth:Mode=JwtBearer` / SAML SP with a guided UI flow.
- **Expected impact:** Faster pilot-to-production transitions; fewer support escalations during initial enterprise onboarding.
- **Affected qualities:** Adoption Friction (+4), Usability (+3).
- **Actionable:** Yes (judgment applied: five-step wizard, OIDC + SAML parity, claim-to-role mapping, sandbox test login, activation gated by Admin role).
- **Completed.** Shipped Admin API `IdentityProviderConfigurationController` (`POST /v1/admin/identity/discover|test-login|activate`, `GET /v1/admin/identity/configuration`), `dbo.TenantIdentityProviderConfigurations` migration 183, discovery/test-login/activation services, and operator UI at `/settings/identity/sso-wizard` with Vitest + xUnit coverage.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Add a new operator UI route `/settings/identity/sso-wizard` in `archlucid-ui` (Admin-only) and an underlying API surface `ArchLucid.Api/Controllers/Admin/IdentityProviderConfigurationController.cs` with endpoints:
- `POST /v1/admin/identity/discover` — accepts `{ protocol: 'oidc' | 'saml', metadataUrl: string }`, fetches OIDC discovery (`/.well-known/openid-configuration` + JWKS) or SAML 2.0 metadata XML, returns the parsed issuer, JWKS URI, signing certs, and available claim names.
- `POST /v1/admin/identity/test-login` — issues a short-lived test bearer token bound to a sandbox tenant principal so the wizard can verify end-to-end without flipping the live `ArchLucidAuth:Mode`.
- `POST /v1/admin/identity/activate` — writes the configured issuer / metadata URI, claim-to-`ArchLucidRoles` mapping (Admin / Operator / Reader / Auditor + optional custom group claim regex), and signing material reference into a new `dbo.TenantIdentityProviderConfigurations` table (`TenantId`, `Protocol`, `IssuerUri`, `MetadataXml` nvarchar(max) nullable, `ClaimMappingJson`, `KeyVaultSecretName`, `UpdatedUtc`, `UpdatedByActorId`, `IsActive`). Emit `Identity.SsoConfigurationActivated` durable audit event.
The wizard has five steps: (1) choose `OIDC` vs `SAML 2.0`, (2) paste discovery / metadata URL and confirm parsed issuer + signing cert thumbprint, (3) map IdP group / role claim values to ArchLucid roles via a table editor, (4) run a `test-login` against a sandboxed user, (5) confirm activation. Persist progress in component state and gate "Activate" until step 4 returns success. Add Vitest + xUnit tests for the discover/test-login/activate happy paths and ensure the existing `SECURITY.md` and `CONFIGURATION_REFERENCE.md` keys remain authoritative — the wizard writes only the tenant-scoped row, not host configuration. Do not change global `ArchLucidAuth` startup wiring.
Impact: Directly improves Adoption Friction (+4 pts) and Usability (+3 pts). Weighted readiness impact: +0.09%.
```

### 2. Customizable ROI Baselines in UI *(Completed 2026-05-21)*
- **Why it matters:** Makes the ROI narrative empirical and tailored to the customer.
- **Expected impact:** Stronger business case for purchase.
- **Affected qualities:** Proof-of-ROI Readiness (+5), Executive Value Visibility (+2).
- **Actionable:** Yes.
- **Completed.** Shipped `dbo.TenantCostSettings` (migration 184), `GET`/`PUT /v1/tenant/cost-settings`, `TenantAdjustedFindingsSavingsCalculator` + `TenantEstimatedUsdSavingsResolver` wired into `PilotRunDeltaComputer` and `ExecutiveRoiSummaryService`, and the Cost settings card on `/settings/tenant`.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Update `archlucid-ui` to add a "Cost Settings" panel in the Tenant Settings view. Allow operators to input their average architect hourly rate and average incident cost. Update `PilotRunDeltaComputer.cs` and `ExecutiveRoiSummaryService.cs` to use these tenant-specific settings (stored in a new `dbo.TenantCostSettings` table) instead of hardcoded assumptions when calculating `EstimatedUsdSavings`.
Impact: Directly improves Proof-of-ROI Readiness (+5 pts) and Executive Value Visibility (+2 pts). Weighted readiness impact: +0.1%.
```

### 3. Operator Feedback Loop (Thumbs Up/Down on Findings) *(Completed 2026-05-21)*
- **Why it matters:** Provides ground-truth data to improve the AI critic.
- **Expected impact:** Better finding relevance over time.
- **Affected qualities:** AI/Agent Readiness (+4), Stickiness (+2).
- **Actionable:** Yes.
- **Completed.** Shipped `POST /v1/architecture/finding/{findingId}/feedback` on `RunsController` (`IsHelpful`, optional `Comment`, migration `186_FindingFeedback_Comment`), and `FindingFeedbackThumbs` on each finding row in `QuickDecisionSummary`.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Add a new endpoint `POST /v1/architecture/finding/{findingId}/feedback` in `RunsController.cs` accepting a boolean `IsHelpful` and optional `Comment`. Store this in a new `dbo.FindingFeedback` table. In `archlucid-ui`, add thumbs up/down icons to each finding row.
Impact: Directly improves AI/Agent Readiness (+4 pts) and Stickiness (+2 pts). Weighted readiness impact: +0.08%.
```

### 4. Automated Weekly Executive Summary Email *(Completed 2026-05-21)*
- **Why it matters:** Keeps sponsors engaged without requiring them to log in.
- **Expected impact:** Higher executive visibility and retention.
- **Affected qualities:** Executive Value Visibility (+5), Stickiness (+2).
- **Actionable:** Yes.
- **Completed.** Shipped `WeeklyExecutiveSummaryJob` + `WeeklyExecutiveSummaryHostedService` (hourly leader-elected poll, `WeeklyExecutiveSummary` config), `WeeklyExecutiveSummaryDeliveryScanner` (commercial tenants, latest committed run → `IRunSummaryOnePagerExportService`), `IWeeklyExecutiveSummaryEmailDispatcher` / Razor `WeeklyExecutiveSummary` template, and `IExecutiveSummaryRecipientLookup` (Admin / Sponsor / WorkspaceAdmin SCIM mailboxes + audit fallback). CLI job slug: `weekly-executive-summary`.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Create a new background worker job `WeeklyExecutiveSummaryJob` in `ArchLucid.Worker`. For each commercial tenant, generate the `RunSummaryOnePager` content and send it via email to users with the `Admin` or `Sponsor` role using the existing notification service. Schedule it to run weekly.
Impact: Directly improves Executive Value Visibility (+5 pts) and Stickiness (+2 pts). Weighted readiness impact: +0.05%.
```

### 5. Global Search Bar in UI *(Completed 2026-05-21)*
- **Why it matters:** Reduces cognitive load when navigating complex domains.
- **Expected impact:** Faster task completion for operators.
- **Affected qualities:** Usability (+5), Adoption Friction (+2).
- **Actionable:** Yes.
- **Completed.** Shipped `GET /v1/search?q={query}` (`SearchController`, `GlobalSearchService`, `SqlGlobalSearchRepository`) and `GlobalSearchBar` in the operator header with categorized runs/findings/policy-packs dropdown.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Implement a global search component in the `archlucid-ui` header. Create a new endpoint `GET /v1/search?q={query}` that searches across Runs, Findings, and Policy Packs, returning categorized results. Update the UI to display these results in a dropdown.
Impact: Directly improves Usability (+5 pts) and Adoption Friction (+2 pts). Weighted readiness impact: +0.06%.
```

### 6. Real-Time Policy Syntax Validation *(Completed 2026-05-21)*
- **Why it matters:** Prevents errors before running a full simulation.
- **Expected impact:** Faster policy authoring.
- **Affected qualities:** Decision Velocity (+4), Usability (+3).
- **Actionable:** Yes.
- **Completed.** Shipped `GET /v1/governance/policy-pack-content-schema` (`PolicyPackContentDocumentJsonSchemaResponse`), `PolicyPackContentDocumentSchemaExporter`, and `PolicyPackContentJsonEditor` with `ajv` real-time linting on create/publish lifecycle editors and the policy rule wizard raw JSON tab.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
In `archlucid-ui`, integrate a JSON Schema validator (e.g., `ajv`) into the Policy Pack editor. Fetch the Policy Pack JSON schema from the backend and provide real-time linting and syntax validation as the user types.
Impact: Directly improves Decision Velocity (+4 pts) and Usability (+3 pts). Weighted readiness impact: +0.04%.
```

### 7. Shareable Saved Views *(Completed 2026-05-21)*
- **Why it matters:** Enhances team collaboration.
- **Expected impact:** Increased stickiness and usability.
- **Affected qualities:** Stickiness (+4), Usability (+2).
- **Actionable:** Yes.
- **Completed.** Shipped `IsShared` on `POST /v1/operator/saved-views` (migration `187_OperatorSavedViews_IsShared`), tenant-scoped list including shared presets, and `OperatorSavedViewsBar` grouped into “My views” / “Shared views”.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Update the `POST /v1/operator/saved-views` endpoint to accept an `IsShared` boolean. Modify the `GET` endpoint to return both personal and shared views for the tenant. Update the `archlucid-ui` Saved Views dropdown to group views by "My Views" and "Shared Views".
Impact: Directly improves Stickiness (+4 pts) and Usability (+2 pts). Weighted readiness impact: +0.02%.
```

### 8. COMPLETED: Verify AI Feature Files Tracked in Git *(Completed 2026-05-21)*
- **Why it matters:** Ensures recent work is not lost and is included in builds.
- **Expected impact:** Better maintainability and reliability.
- **Affected qualities:** Maintainability (+5), Reliability (+2).
- **Status:** **Completed** (2026-05-21). `git ls-files --others --exclude-standard` over `ArchLucid.Application/`, `ArchLucid.Api/`, and `ArchLucid.AgentRuntime/` returned no untracked paths; the prior assessment claim was stale. Remaining hygiene item is Dependabot (#23).

### 9. Response Compression for API *(Completed 2026-05-21)*
- **Why it matters:** Improves load times for large manifests.
- **Expected impact:** Better performance on slow networks.
- **Affected qualities:** Performance (+5).
- **Actionable:** Yes.
- **Completed.** Already shipped via `AddArchLucidResponseCompression()` and `UseResponseCompression()` (Brotli/Gzip for HTTPS JSON responses).
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Update `ArchLucid.Api/Program.cs` to enable HTTP response compression. Add `builder.Services.AddResponseCompression()` and `app.UseResponseCompression()`, configuring it to compress `application/json` responses.
Impact: Directly improves Performance (+5 pts). Weighted readiness impact: +0.01%.
```

### 10. Prompt A/B Testing Framework *(Completed 2026-05-21)*
- **Why it matters:** Allows empirical optimisation of LLM prompts against the already-shipped `AgentOutputEvaluator` semantic-score signal rather than ad-hoc prompt edits.
- **Expected impact:** Higher AI quality over time; closes the loop with the templates-pack evaluation harness.
- **Affected qualities:** AI/Agent Readiness (+4).
- **Actionable:** Yes (judgment applied: stable-hash bucket assignment by `(TenantId, RunId, PromptTemplateName)`, variants persisted as rows with basis-point weights, variant key recorded on every `AgentResult`).
- **Completed.** Shipped migration `188_PromptVariants_AgentOutputEvaluations.sql`, `SqlPromptVariantRegistry`, `PromptVariantSelector` + `VariantAwareAgentSystemPromptCatalog`, `PromptVariantKey` on `dbo.AgentResults`, and `GET /v1/admin/prompt-variants/stats` (`PromptVariantsAdminController`, `PromptVariantStatsService`).
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Create `IPromptVariantRegistry` and `PromptVariantRegistry` in `ArchLucid.AgentRuntime/Prompts/Variants/`. Variants are seeded via a new DbUp migration creating `dbo.PromptVariants` (`PromptTemplateName`, `VariantKey`, `WeightBps` int (sum per template must equal 10000), `PromptBody` nvarchar(max), `IsActive` bit, `CreatedUtc`, `RetiredUtc` nullable). Add `IPromptVariantSelector` that takes `(string promptTemplateName, Guid tenantId, Guid runId)` and returns the variant by:
1. Hashing `tenantId|runId|promptTemplateName` to a stable uint via xxHash64.
2. Mapping the hash to a `0..9999` bucket and selecting the variant whose cumulative `WeightBps` covers that bucket.
This guarantees the same run sees the same variant for a given template across retries while spreading variants across runs by configured weight. Wire the selector into the existing prompt template resolution path (e.g. `CriticSystemPromptTemplate`, `TopologySystemPromptTemplate`) behind config flag `AgentRuntime:PromptVariants:Enabled` (default false). When enabled, the resolved prompt body comes from the variant row instead of the in-code template constant.
Add a new column `PromptVariantKey nvarchar(64) NULL` to `dbo.AgentResults` and persist the chosen variant on every agent invocation. Add a read-side projection endpoint `GET /v1/admin/prompt-variants/stats?templateName={name}` that returns per-variant mean and median `SemanticScore` (from `dbo.AgentOutputEvaluations`) and per-variant `QualityGate` pass rates. Cover the selector with unit tests proving deterministic bucketing and weight respect. Do not change existing prompt template classes' default behaviour when the flag is off.
Impact: Directly improves AI/Agent Readiness (+4 pts). Weighted readiness impact: +0.05%.
```

### 11. Cloud-Hosted Azure Extractor (Opt-In, Workload Identity Federation) *(Completed 2026-05-21)*
- **Why it matters:** Removes the need to run local PowerShell scripts for Tier 2 customers while preserving the §2.16 "no long-lived vendor secrets in customer tenant" posture.
- **Expected impact:** Massive reduction in adoption friction for customers whose security teams resist running unattested local scripts.
- **Affected qualities:** Adoption Friction (+5), Time-to-Value (+3).
- **Actionable:** Yes (judgment applied: **Workload Identity Federation** from ArchLucid's hosted managed identity to a customer-provisioned service principal with `Reader` + `Cost Management Reader` scopes — strictly aligned with V1_SCOPE.md §2.16 Tier 2 "federated workload identity preferred over long-lived secrets" and never requests Owner/Contributor/Global Reader).
- **Completed.** Shipped customer onboarding IaC (`infra/terraform-customer-onboarding/`, `infra/bicep-customer-onboarding/main.bicep`), `ArchLucid.Integrations.AzureExtractor` (`IHostedAzureExtractorClient`, WIF credential factory, GET-only ARM inventory + schema v1 ZIP builder), migration `189_TenantHostedExtractorConfigurations`, admin APIs (`POST/GET /v1/admin/azure-extractor/hosted/configure|configuration`, `POST …/run`), and `docs/library/AZURE_EXTRACTOR.md`.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Add an opt-in Tier 2 hosted extractor path in `ArchLucid.Integrations.AzureExtractor` (new project sibling to `ArchLucid.Integrations.AzureDevOps`) that uses **Workload Identity Federation** from the ArchLucid-hosted user-assigned managed identity to a customer-provisioned service principal:

1. Author `infra/terraform-customer-onboarding/` (and a parallel Bicep template at `infra/bicep-customer-onboarding/main.bicep`) that the customer runs once in their tenant. It creates:
   - A service principal `archlucid-readonly-extractor`.
   - A federated identity credential whose issuer/subject points at ArchLucid's tenant + managed-identity `appId` (parameters: `archLucidTenantId`, `archLucidManagedIdentityObjectId`, both published by ArchLucid).
   - Role assignments: `Reader` on the subscription, `Cost Management Reader` on the subscription. **Never** `Owner`, `Contributor`, `User Access Administrator`, or `Global Reader` (assert in a Terraform unit test).
   - Output: the customer service principal `appId` and tenant id, which the customer pastes into ArchLucid's UI.

2. Add `IHostedAzureExtractorClient` and `HostedAzureExtractorClient` that, given `{ customerTenantId, customerAppId, subscriptionId }`, uses `Azure.Identity.WorkloadIdentityCredential` (or `ClientAssertionCredential` if WIC is unavailable) to authenticate as that principal and produce the same schema-versioned ZIP shape the PowerShell extractor produces (`manifest.json`, `resources.json`, optional cost JSONs, `retail-prices.json`). Reuse the existing ingest pipeline by feeding the ZIP into `POST /v1/azure-extractor/upload`.

3. Add `POST /v1/admin/azure-extractor/hosted/configure` (Admin-only) that persists `{ CustomerTenantId, CustomerAppId, SubscriptionId, IncludeCost }` into `dbo.TenantHostedExtractorConfigurations` (one row per tenant per subscription). Emit `Integration.HostedAzureExtractorConfigured` durable audit event.

4. Add `POST /v1/admin/azure-extractor/hosted/run` (ExecuteAuthority) that triggers `HostedAzureExtractorClient` and uploads the produced ZIP under the existing `runId` association.

Hard constraints (assert with tests):
- The Bicep / Terraform asserts that role assignments only include `Reader` and `Cost Management Reader`; the test fails if any other role name appears.
- ArchLucid never persists customer client secrets — only `appId` + `tenantId`.
- The hosted extractor never calls write or destructive ARM operations; integration tests verify all REST calls are GETs against `management.azure.com` paths.

Update `docs/library/AZURE_EXTRACTOR.md` (or the equivalent doc) with the Tier 2 federated-identity onboarding flow and trust-center wording confirming no long-lived secrets cross the boundary.
Impact: Directly improves Adoption Friction (+5 pts) and Time-to-Value (+3 pts). Weighted readiness impact: +0.13%.
```

### 12. Automated Log Analysis in Support Bundle *(Completed 2026-05-21)*
- **Why it matters:** Helps customers self-diagnose issues before contacting support.
- **Expected impact:** Lower support burden.
- **Affected qualities:** Supportability (+5), Usability (+2).
- **Actionable:** Yes.
- **Completed.** Shipped `SupportBundleLogDiagnosticsAnalyzer` (timeouts, 401/403, 429, 5xx heuristics), `diagnostics-summary.txt` in CLI/API bundle output via `SupportBundleArchiveWriter` and `SupportBundleAssembler`, and xUnit coverage in `SupportBundleLogDiagnosticsAnalyzerTests`.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Update `SupportBundleCommand.cs`. Add a step that scans the collected logs for common error patterns (e.g., timeouts, 401s, 429s) and generates a `diagnostics-summary.txt` file included in the root of the ZIP bundle, highlighting potential issues.
Impact: Directly improves Supportability (+5 pts) and Usability (+2 pts). Weighted readiness impact: +0.03%.
```

### 13. Circuit Breakers for External Integrations *(Completed 2026-05-21)*
- **Why it matters:** Prevents cascading failures when external systems are down.
- **Expected impact:** Higher reliability.
- **Affected qualities:** Reliability (+4).
- **Actionable:** Yes.
- **Completed.** Shipped `OutboundExternalHttpResiliencePolicy` + `AddOutboundExternalHttpResilience()` (Polly v8 retry + ratio-based circuit breaker, default 50% failure over 30s), `ArchLucid:OutboundHttp:Resilience` options, wired on webhook/ITSM/billing/Confluence outbound `HttpClient` builders, and tests in `OutboundExternalHttpResiliencePolicyTests`.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Update the Polly policies in `Program.cs` for all external `HttpClient` instances (e.g., webhooks, ITSM). Add an `AddAdvancedCircuitBreaker` policy that opens after a configurable failure threshold (e.g., 50% failure rate over 30 seconds) to prevent overwhelming failing downstream services.
Impact: Directly improves Reliability (+4 pts). Weighted readiness impact: +0.02%.
```

### 14. Read Replicas for Analytical Queries (Azure SQL Read Scale-Out) *(Completed 2026-05-21)*
- **Why it matters:** Offloads heavy read-mostly endpoints (audit search, findings list, dashboards, compliance drift trend) from the primary so a single SQL Server primary stops being the throughput ceiling on §2.10 Audit and §2.11 dashboards.
- **Expected impact:** Better scalability and performance under multi-tenant analytical load.
- **Affected qualities:** Scalability (+4), Performance (+2).
- **Actionable:** Yes (judgment applied: **Azure SQL Database Read Scale-Out** via `ApplicationIntent=ReadOnly` on a separate connection string; route only known-safe read endpoints; primary connection remains the default).
- **Completed.** Shipped `ArchLucid:Persistence:ReadOnlyConnectionStringTemplate`, `IReadOnlyDbConnectionFactory` / `ReadOnlyDbConnectionFactory`, read-only routing on `SqlFindingsSnapshotRepository`, `DapperAuditRepository`, and `DapperComplianceDriftFindingsTrendReader`, `AzureSqlReadReplicaHealthCheck` (`sql-read-replica` on `/health/ready`), and `docs/library/READ_REPLICA_ROUTING.md`. Executive ROI run enumeration continues via existing `IAuthorityRunListConnectionFactory`.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Introduce a read replica routing path for analytical queries without disturbing the existing transactional `ISqlConnectionFactory`:

1. Add configuration key `ArchLucid:Persistence:ReadOnlyConnectionStringTemplate` (per-tenant DB template, mirrors the existing primary template). Document that operators should set this to the same logical server name with `ApplicationIntent=ReadOnly` appended so Azure SQL Database Read Scale-Out routes the session to a HA secondary; in non-Azure environments, this can resolve to the same primary string (no-op fallback).

2. Add `IReadOnlyDbConnectionFactory` (new) and `ReadOnlyDbConnectionFactory` that resolve the template with the current tenant binding identically to the existing `SqlScopedResolutionDbConnectionFactory`, but open a connection against the read-only string. If the read-only template is empty, transparently delegate to the primary `ISqlConnectionFactory` so the system remains correct on single-DB pilots.

3. Refactor only the following repositories to take an additional `IReadOnlyDbConnectionFactory` and use it for `Query*` calls (writes stay on the primary):
   - `SqlFindingsSnapshotRepository` (findings list / dashboard reads)
   - `SqlAuditEventRepository` (audit search keyset pagination)
   - `SqlComplianceDriftTrendRepository` (governance drift chart)
   - `SqlExecutiveRoiSummaryRepository` (ROI summary aggregations)
   Do **not** route through the read replica from inside an open primary transaction; assert via a Roslyn analyser test (or unit test on each repository) that no method mixes the two connection types within one logical operation.

4. Add health-check `AzureSqlReadReplicaHealthCheck` registered on `/health/ready` as `sql-read-replica` (skipped when the read-only template is empty). It runs `SELECT 1; SELECT DATABASEPROPERTYEX(DB_NAME(), 'Updateability')` and reports unhealthy if the secondary returns `READ_WRITE` (indicating the connection was routed to the primary unexpectedly).

5. Add docs under `docs/library/READ_REPLICA_ROUTING.md` covering the connection string format, eventual-consistency lag (Azure SQL HA replicas are seconds-behind during sustained write load) and which endpoints are routed where. Update `CONFIGURATION_REFERENCE.md` with the new key.

Acceptance: existing tests pass with the read-only template unset (no-op fallback). New tests prove read-only repositories never write and never share a connection across read/write methods. Impact: Directly improves Scalability (+4 pts) and Performance (+2 pts). Weighted readiness impact: +0.06%.
```

### 15. Consolidate Persistence Projects *(Completed 2026-05-21)*
- **Why it matters:** Simplifies the dependency graph as noted in `NEXT_REFACTORINGS.md` §1; the current split between `ArchLucid.Persistence` and `ArchLucid.Persistence.MigrateVerify` doubles internal-type discovery cost for tooling.
- **Expected impact:** Better maintainability and faster `dotnet build` graph compilation.
- **Affected qualities:** Maintainability (+4).
- **Actionable:** Yes (judgment applied: merge `ArchLucid.Persistence.MigrateVerify` into `ArchLucid.Persistence/MigrateVerify/` sub-namespace; keep entrypoint executable separate to preserve operator command surface; merge corresponding tests).
- **Completed.** Phase 1 shipped: `MigrateVerifyConnectionStringReader` in `ArchLucid.Persistence/MigrateVerify/`, tests under `ArchLucid.Persistence.Tests/MigrateVerify/`, `ArchLucid.Persistence.MigrateVerify.Tests` removed from solution; thin `ArchLucid.Persistence.MigrateVerify` exe retained for CI migrate-verify.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Implement the first phase of `docs/library/PERSISTENCE_CONSOLIDATION_PLAN.md` by folding the `ArchLucid.Persistence.MigrateVerify` library into `ArchLucid.Persistence`:

1. Move every type under `ArchLucid.Persistence.MigrateVerify/` (excluding `Program.cs` and any host-startup wiring) to `ArchLucid.Persistence/MigrateVerify/` preserving namespaces by renaming to `ArchLucid.Persistence.MigrateVerify` (sub-namespace inside the consolidated assembly). Keep the existing entrypoint executable in place but reduce it to a thin shell that calls into the consolidated library — DO NOT remove the `migrate-verify` operator command surface.
2. Move tests from `ArchLucid.Persistence.MigrateVerify.Tests/` into `ArchLucid.Persistence.Tests/MigrateVerify/`, preserving test ids and trait categories. Update `coverage.runsettings` exclusion paths if they reference the moved project.
3. Remove the now-empty `ArchLucid.Persistence.MigrateVerify` and `ArchLucid.Persistence.MigrateVerify.Tests` library projects from `ArchLucid.sln`, `ArchLucid.Backend.slnf`, `ArchLucid.Core.slnf`, and `docs/library/REPO_DIGEST.md`. Replace project references everywhere with the consolidated `ArchLucid.Persistence` / `ArchLucid.Persistence.Tests` project references.
4. Update `docs/library/PERSISTENCE_CONSOLIDATION_PLAN.md` with a "Phase 1 complete" note. Update `docs/library/REPO_DIGEST.md` by regenerating with `python scripts/repo_digest/build_repo_digest.py`.
5. Do NOT touch the existing connection-factory wiring (item #2 in `NEXT_REFACTORINGS.md`) in the same change — that is a separate refactor.

Acceptance: `dotnet build ArchLucid.sln`, `dotnet build ArchLucid.Backend.slnf`, and `dotnet test ArchLucid.Persistence.Tests` all green. Pre-commit hook still passes. No type left in a duplicated namespace.
Impact: Directly improves Maintainability (+4 pts). Weighted readiness impact: +0.02%.
```

### 16. Keyboard Shortcuts in Operator UI *(Completed 2026-05-21)*
- **Why it matters:** Speeds up workflows for power users.
- **Expected impact:** Better usability.
- **Affected qualities:** Usability (+4).
- **Actionable:** Yes.
- **Completed.** Extended `shortcut-registry` / `useShortcutNavigation` with single-key `c` (new review), `/` (focus global search), and `?` (keyboard shortcuts help dialog); full shell uses built-in shortcuts modal.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
In `archlucid-ui`, implement a keyboard shortcut hook (e.g., using `react-hotkeys-hook`). Add shortcuts for common actions: 'c' to create a review, '/' to focus global search, and '?' to show a keyboard shortcuts help modal.
Impact: Directly improves Usability (+4 pts). Weighted readiness impact: +0.03%.
```

### 17. Automated Database Failover Testing in CI (Nightly) *(Completed 2026-05-21)*
- **Why it matters:** Currently `scripts/ops/run-failover-drill.ps1` is a manual operator script; turning it into a nightly CI gate proves the RTO/RPO targets continuously rather than once per release.
- **Expected impact:** Higher confidence in reliability; regressions in reconnection logic surface within 24 hours, not at the next staged drill.
- **Affected qualities:** Reliability (+4).
- **Actionable:** Yes (judgment applied: dual-SQL-Server docker-compose, primary container killed mid-test, assertion that the API recovers within the documented RTO; nightly schedule, not per-PR, because the test is inherently slow and flaky-tolerant).
- **Completed.** Shipped `tests/failover/docker-compose.failover.yml`, `tests/failover/run-failover-test.ps1` (SQL stop/restart + `/health/ready` RTO assertion + seeded run readability), `.github/workflows/nightly-failover-test.yml` (`continue-on-error: true` warn mode), and append-only rows in `docs/quality/game-day-log/FAILOVER_RESULTS.md`.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Add an automated nightly database failover test:

1. Create `tests/failover/docker-compose.failover.yml` with two `mcr.microsoft.com/mssql/server:2022-latest` containers (`sql-primary`, `sql-secondary`) and a single `archlucid-api` container pointed at a static connection string `Server=sql-primary,1433;...;Failover_Partner=sql-secondary` (or equivalent — use the connection-string shape currently supported by `SqlScopedResolutionDbConnectionFactory`; if the factory does not support Failover_Partner today, fall back to a startup-time `IDbConnectionFactory` retry-with-secondary path and document it).
2. Create `tests/failover/run-failover-test.ps1` that:
   - Brings the compose stack up.
   - Runs DbUp migrations against both servers.
   - Seeds a known tenant + run via `POST /v1/architecture/request`.
   - Starts a steady-state load of 1 RPS against `GET /health/ready` and `GET /v1/architecture/run/{runId}` for 60s.
   - Issues `docker kill sql-primary` at t=20s.
   - Asserts: (a) `/health/ready` becomes `Unhealthy` within 5s, (b) `/health/ready` returns `Healthy` again within the documented RTO (load from `docs/library/RTO_RPO_TARGETS.md`; default 60s if undocumented), (c) the seeded run is still readable after recovery, (d) no 500s leak — only structured 503s with RFC 9457 Problem Details.
   - Appends a markdown row to `docs/quality/game-day-log/FAILOVER_RESULTS.md` (downtime, recovery time, error budget burn).
3. Create `.github/workflows/nightly-failover-test.yml` that runs the script on a nightly `schedule:` (`cron: '0 5 * * *'` UTC) and on `workflow_dispatch`. Use `continue-on-error: true` for the first two weeks (warn mode) before flipping to merge-blocking on `main` branch protections.
4. Do NOT add the test to the PR-blocking `ci.yml` — failover tests are inherently slow and flake-prone; nightly + `workflow_dispatch` is the right cadence.

Acceptance: workflow runs green locally via `act` (or skipped with documented reason if `act` lacks docker-in-docker). FAILOVER_RESULTS.md gets one new appended row per run. Impact: Directly improves Reliability (+4 pts). Weighted readiness impact: +0.02%.
```

### 18. Visual Policy Pack Builder (MVP) *(Completed 2026-05-21)*
- **Why it matters:** Allows non-technical operators to create policies without writing JSON; complements (does not replace) the raw JSON editor and the AI policy drafter (#32 in `LATEST.md` history).
- **Expected impact:** Lower adoption friction for governance customisation.
- **Affected qualities:** Adoption Friction (+4), Usability (+3).
- **Actionable:** Yes (judgment applied: three-pane layout, MVP scoped to the predicate types already supported by `EffectiveGovernanceResolver`, live JSON preview keeps the JSON as the source of truth).
- **Completed.** Shipped `GET /v1/policy-packs/rule-templates` (`PolicyPackRuleTemplatesService`), three-pane `PolicyPackVisualBuilder` tab on `PolicyRuleAuthoringWizard` (template picker / condition builder / live JSON preview with round-trip warnings), and Vitest coverage in `policy-pack-visual-builder.test.ts`.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Add a visual Policy Pack rule builder to `archlucid-ui/src/app/(operator)/policy-packs/_sections/`:

UI layout — three vertical panes side by side:
1. **Rule template picker (left, 25% width):** scrolling list of starter rule templates loaded from `GET /v1/policy-packs/rule-templates` (a new endpoint that returns the bundled starter rules from `bundled-policy-packs-v1.manifest.json` flattened). Clicking a template loads its predicate tree into the middle pane.
2. **Condition builder (middle, 50% width):** a `react-querybuilder`-style component that supports ONLY the predicate operators currently implemented in `EffectiveGovernanceResolver`:
   - `equals`, `notEquals` (string / number)
   - `contains`, `startsWith`, `endsWith` (string)
   - `severityAtLeast` (Low / Medium / High / Critical)
   - `categoryIn` (multi-select of `ArchLucid.Contracts/Findings/FindingCategory.cs` enum values)
   - `and` / `or` group nodes (no deeper than 3 levels of nesting — enforced by validation)
   Each leaf node has a "field" dropdown (`finding.severity`, `finding.category`, `finding.message`, `manifest.systemName`, `manifest.environment`) and an operator + value pair appropriate to that field's type.
3. **Live JSON preview (right, 25% width):** monospace textarea showing the equivalent Policy Pack rule JSON. Updates in real time as the user edits the middle pane. Editing the JSON directly is allowed and round-trips back to the visual builder when parseable (show a yellow warning banner when JSON is hand-edited into something the visual builder cannot represent).
4. Bottom action bar: **Validate** (calls the existing `POST /v1/policy-packs/simulate` with a sample run), **Save Draft**, **Submit for Activation**.

Hard constraints:
- The JSON in the right pane is the source of truth; the visual builder is a derived view. Saving always submits the JSON.
- Do NOT add server-side support for predicate operators that don't already exist in `EffectiveGovernanceResolver` — the MVP is strictly visual editing of the current rule schema.
- Reuse the existing `PolicyRuleAuthoringWizard.tsx` AI-drafter as a sibling tab; do not replace it.

Add Vitest tests covering: template load → condition edit → JSON preview update → hand-edit JSON to unsupported predicate → warning shown. Impact: Directly improves Adoption Friction (+4 pts) and Usability (+3 pts). Weighted readiness impact: +0.08%.
```

### 19. One-Click Deploy for Sample Architecture *(Completed 2026-05-21)*
- **Why it matters:** Provides instant value without any local setup.
- **Expected impact:** Faster time-to-value.
- **Affected qualities:** Time-to-Value (+4).
- **Actionable:** Yes.
- **Completed.** Shipped `OnboardingStartClient` “Deploy sample architecture to Azure” CTA, `trial-sample-azure-deploy.ts`, and public `trial-sample-azure-template.json` ARM template linked via Azure Portal custom deploy.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Update the Trial Welcome flow. Instead of just pre-seeding a run, add a "Deploy Sample Architecture to Azure" button that provides an ARM template link (using `https://portal.azure.com/#create/Microsoft.Template`) to deploy a safe, isolated sample environment that the user can immediately analyze.
Impact: Directly improves Time-to-Value (+4 pts). Weighted readiness impact: +0.06%.
```

### 20. Export Findings to CSV *(Completed 2026-05-21)*
- **Why it matters:** Allows operators to perform custom analysis in Excel.
- **Expected impact:** Better usability and reporting.
- **Affected qualities:** Usability (+3), Executive Value Visibility (+2).
- **Actionable:** Yes.
- **Completed.** Shipped `GET /v1/architecture/run/{runId}/findings/export/csv` with `EstimatedUsdSavings` column and “Export to CSV” on the run detail findings list (`QuickDecisionSummary`).
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Add a new endpoint `GET /v1/architecture/run/{runId}/findings/export/csv` in `RunsController.cs`. Generate a CSV file containing all findings for the run, including Severity, Category, Message, and EstimatedUsdSavings. Add an "Export to CSV" button in the `archlucid-ui` findings list.
Impact: Directly improves Usability (+3 pts) and Executive Value Visibility (+2 pts). Weighted readiness impact: +0.04%.
```

### 21. Distributed Graph Projection Cache (MessagePack over Redis) *(Completed 2026-05-21)*
- **Why it matters:** Today `GraphSnapshotProjectionMemoryCache` is in-process only — multi-replica deployments rebuild projections per replica, defeating §2.7 Graph performance and exposing the §6e V2 distributed-cache gap as a near-term scalability ceiling.
- **Expected impact:** Better scalability for multi-replica fleets; cache hit rates approach single-replica behaviour.
- **Affected qualities:** Scalability (+4).
- **Actionable:** Yes (judgment applied: **MessagePack** binary serialisation — 3-5x smaller than JSON, integer keys via `[MessagePackObject]`, already supported by `MessagePack.AspNetCoreMvcFormatter` ecosystem; Redis pub/sub for cross-replica invalidation).
- **Completed.** Shipped MessagePack+LZ4 serialization in `GraphSnapshotMessagePackSerialization`, Redis pub/sub invalidation (`GraphProjectionCacheInvalidationSubscriberHostedService`, `RedisGraphProjectionCacheInvalidationBroadcaster`), `GraphProjectionCacheProvider` Auto selection, and `RedisGraphProjectionHealthCheck` (`graph-projection-cache` on `/health/ready`).
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Add a distributed implementation of `IGraphSnapshotProjectionCache` alongside the existing in-memory one:

1. Add NuGet package `MessagePack` (latest stable) to `ArchLucid.KnowledgeGraph.csproj`. Annotate the projection DTO (`GraphSnapshotProjection` and its child types) with `[MessagePackObject]` and integer `[Key]` attributes. Add a `MessagePackSerializerOptions` that uses `StandardResolverAllowPrivate` and `LZ4BlockArray` compression.
2. Add `DistributedGraphSnapshotProjectionCache` implementing `IGraphSnapshotProjectionCache`, backed by `IDistributedCache` (already wired via `HotPathCache:Provider=Redis`). Keys: `graph-proj:{tenantId}:{runId}:{schemaVersion}`. TTL from new config key `GraphProjection:CacheTtlMinutes` (default 60).
3. Add cross-replica invalidation via Redis pub/sub: on manifest commit (`AuthorityCommittedChainPersisted` audit event) publish to channel `graph-proj-invalidate` with payload `{tenantId, runId}`. `DistributedGraphSnapshotProjectionCache` subscribes on construction and removes matching keys. Bound the subscriber with a `BackgroundService` so it stops cleanly with the host.
4. Wire selection via `GraphProjection:CacheProvider` config (`Memory` | `Distributed` | `Auto`). `Auto` selects `Distributed` when `ExpectedApiReplicaCount > 1` and a Redis connection string is set, otherwise `Memory`. Mirror the existing `HotPathCache:Provider=Auto` selection logic so operators only configure one cache provider concept.
5. Add health-check `RedisGraphProjectionHealthCheck` on `/health/ready` as `graph-projection-cache` (skipped when provider is `Memory`).
6. Cover with unit tests: serialise/deserialise round-trip preserves all projection fields; TTL eviction; pub/sub invalidation removes the key on the second replica.

Do NOT change the in-process `GraphSnapshotProjectionMemoryCache` or its behavioural contract — both implementations coexist behind the interface. Impact: Directly improves Scalability (+4 pts). Weighted readiness impact: +0.04%.
```

### 22. Add "What-If" Cost Analysis *(Completed 2026-05-21)*
- **Why it matters:** Allows users to see the financial impact of applying recommendations before doing so.
- **Expected impact:** Stronger ROI proof.
- **Affected qualities:** Proof-of-ROI Readiness (+4).
- **Actionable:** Yes.
- **Completed.** Shipped `FindingsWhatIfAnalysisPanel` on run detail findings (`RunDetailRunExplanationCollapsible`) with toggle, finding selection, baseline annual cost, and projected new cost metric.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
In `archlucid-ui`, add a "What-If Analysis" toggle on the Findings page. When enabled, it recalculates the total projected architecture cost by subtracting the `EstimatedUsdSavings` of selected findings from the baseline cost, displaying a dynamic "Projected New Cost" metric.
Impact: Directly improves Proof-of-ROI Readiness (+4 pts). Weighted readiness impact: +0.05%.
```

### 23. Automated Dependency Updates *(Completed 2026-05-21)*
- **Why it matters:** Keeps the codebase secure and up-to-date.
- **Expected impact:** Better maintainability.
- **Affected qualities:** Maintainability (+3).
- **Actionable:** Yes.
- **Completed.** Shipped daily Dependabot updates for NuGet, npm, and GitHub Actions (`.github/dependabot.yml`).
- **Status:** **Completed** (2026-05-21).

### 24. Fine-Grained RBAC UI (Custom Role Builder) *(Completed 2026-05-21)*
- **Why it matters:** The current Admin / Operator / Reader / Auditor roles are fixed; enterprise customers consistently need composite roles like "Auditor + Findings Feedback" or "Operator without Billing".
- **Expected impact:** Lower adoption friction for large orgs with existing role models.
- **Affected qualities:** Adoption Friction (+3), Usability (+3).
- **Actionable:** Yes (judgment applied: enumerate atomic permissions derived from existing `[Authorize(Policy = ...)]` and `Tier` filters; matrix UI; built-in roles remain immutable and become a starting template).
- **Completed.** Shipped `Permissions.cs`, migration `185_CustomRoles.sql`, `CustomRoleService`, `CustomRolesAdminController` (`GET/POST/PUT /v1/admin/roles`, `POST assign`), `CustomRoleClaimsTransformation`, and `/settings/roles` matrix UI with clone-built-in flow.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Add custom role management without changing the existing built-in role behaviour:

1. Enumerate atomic permissions in `ArchLucid.Core/Authorization/Permissions.cs` (new) as a static class of string constants, derived from current `[Authorize(Policy = ...)]` usages and tier filters: `Runs.Read`, `Runs.Create`, `Runs.Commit`, `Runs.Delete`, `Findings.Read`, `Findings.Feedback`, `Governance.Read`, `Governance.SimulatePolicy`, `Governance.ActivatePolicy`, `PolicyPacks.Author`, `Audit.Read`, `Audit.Export`, `Tenants.ReadOwn`, `Tenants.ManageOwn`, `Tenants.ManageAny`, `Billing.Read`, `Billing.Manage`, `Identity.ManageProviders`, `Integrations.Configure`, `Support.GenerateBundle`, `AdminConsole.Access`. Mark each constant with an XML doc summary describing the endpoints it gates.
2. Create `dbo.CustomRoles` (`Id`, `TenantId`, `Name`, `Description`, `PermissionsJson` nvarchar(max), `IsSystem` bit, `CreatedUtc`, `UpdatedUtc`) and `dbo.UserCustomRoleAssignments` (`UserId`, `CustomRoleId`, `AssignedUtc`, `AssignedByActorId`). Seed the four built-in roles as `IsSystem = 1` rows whose permission sets mirror the current behaviour so the existing authorization handlers can resolve through the new tables without behaviour change.
3. Add `ICustomRoleService` + `CustomRoleService` and an `ICustomRolePermissionEvaluator` that combines built-in role inheritance with the assigned custom-role permission union. Wire it into the existing ASP.NET authorization pipeline via a new `IAuthorizationHandler` that resolves each `Permission` string and short-circuits if the current principal has it. Existing `[Authorize(Roles = "Admin")]` and `[RequiresCommercialTenantTier]` filters stay unchanged.
4. Add admin-only endpoints `GET/POST/PUT /v1/admin/roles` and `POST /v1/admin/roles/{roleId}/assign` (Body `{ userId }`). Emit `Identity.CustomRoleCreated|Updated|Assigned|Removed` durable audit events.
5. Build a `/settings/roles` page in `archlucid-ui` (Admin-only) with a matrix UI: rows = atomic permissions grouped by area (Runs / Findings / Governance / Audit / Tenants / Billing / Identity / Integrations / Support / Admin Console), columns = the roles defined for the tenant. Checkboxes toggle inclusion. Built-in role columns are read-only (display "system"); a "Clone to custom role" button on each built-in role pre-fills a new row.

Hard constraints (assert with tests):
- Built-in roles' effective permission sets are unchanged when no custom role assignments exist for a user.
- Deleting a custom role removes all assignments transactionally.
- Custom role names are unique within a tenant (UNIQUE index).
- Permission strings in `PermissionsJson` are validated against the `Permissions` static class on every write — unknown values are rejected with 400.

Impact: Directly improves Adoption Friction (+3 pts) and Usability (+3 pts). Weighted readiness impact: +0.06%.
```

### 25. Add API Rate Limiting *(Completed 2026-05-21)*
- **Why it matters:** Protects the system from abuse.
- **Expected impact:** Better reliability and scalability.
- **Affected qualities:** Reliability (+3), Scalability (+2).
- **Actionable:** Yes.
- **Completed.** Already shipped via `AddArchLucidRateLimiting`, fixed-window `100`/minute partitions, `DefaultPublicApiRateLimitConvention`, and RFC 9457 `429` responses with `Retry-After`.
- **Status:** **Completed** (2026-05-21).
- **Prompt:**
```text
Update `ArchLucid.Api/Program.cs` to add ASP.NET Core Rate Limiting. Configure a fixed window limiter (e.g., 100 requests per minute per IP or TenantId) and apply it to all API endpoints, returning 429 Too Many Requests when exceeded.
Impact: Directly improves Reliability (+3 pts) and Scalability (+2 pts). Weighted readiness impact: +0.02%.
```

---

## Prompt Batching Guidance

To optimise context window usage and Cursor cost-effectiveness, batch the actionable prompts as follows. Batches are sized to fit comfortably in one context window and grouped by shared touch-files so the agent does not thrash across unrelated subsystems.

- **Batch 1 (Quick Wins & Hygiene):** Prompts 9, 23 (Response Compression, Dependabot). Prompt 8 is **completed** (2026-05-21 — AI paths verified tracked).
- **Batch 2 (ROI & Executive Visibility):** Prompts 2, 4, 20, 22 (Custom ROI Baselines, Weekly Email, CSV Export, What-If Analysis). Financial and reporting features in one pass.
- **Batch 3 (Usability & Friction — UI focused):** Prompts 5, 6, 7, 16 (Global Search, Policy Validation, Shared Views, Keyboard Shortcuts). Pure `archlucid-ui` work.
- **Batch 4 (AI & Reliability):** Prompts 3, 12, 13, 19, 25 (Operator Feedback, Log Analysis, Circuit Breakers, Sample Deploy, Rate Limiting). Hardens the system and improves AI feedback loops.
- **Batch 5 (Identity & Access — judgment-resolved):** Prompts 1, 24 (SSO Wizard, Fine-Grained RBAC). Share `dbo.TenantIdentity*` schema work and `archlucid-ui/src/app/(operator)/settings/` UI surfaces — do them together so the new admin pages can cross-link.
- **Batch 6 (AI Quality Infrastructure — judgment-resolved):** Prompt 10 alone (Prompt A/B Testing Framework). Touches `ArchLucid.AgentRuntime/Prompts/` extensively; keep isolated so existing prompt templates can be regression-tested incrementally.
- **Batch 7 (Persistence Refactor & Scale — judgment-resolved):** Prompts 15, 14, 21 (Consolidate Persistence Projects, Read Replica Routing, Distributed Graph Cache). Do #15 **first** (project consolidation) so #14 and #21 don't have to be re-done after a solution restructure.
- **Batch 8 (Reliability Drills — judgment-resolved):** Prompt 17 alone (Nightly Failover Test). Independent CI workflow; no shared touch-files with other batches.
- **Batch 9 (Hosted Extractor — judgment-resolved):** Prompt 11 alone (Cloud-Hosted Azure Extractor via WIF). New `ArchLucid.Integrations.AzureExtractor` project + Bicep/Terraform onboarding templates; large enough to warrant its own context.
- **Batch 10 (Governance UX — judgment-resolved):** Prompt 18 alone (Visual Policy Pack Builder). Substantial `archlucid-ui` work; do after Batch 3 so the new builder coexists cleanly with the existing JSON editor.

---

## Pending Questions for Later

*All previously deferred items have been resolved by applying agent judgment (owner directive 2026-05-21). Each is now actionable with a concrete Cursor prompt above. The judgments below are recorded so the owner can override any of them before execution; if any judgment is rejected, the corresponding prompt should be regenerated against the owner's preferred direction.*

### #1 SSO Configuration Wizard — judgment applied
- **Decision:** Five-step wizard at `/settings/identity/sso-wizard`: choose protocol → discover metadata → map claims → sandbox test login → activate. Persists per-tenant config in a new `dbo.TenantIdentityProviderConfigurations` row; does NOT mutate host-level `ArchLucidAuth` startup wiring.
- **Override if:** the owner prefers SAML-first (rather than a single wizard with OIDC + SAML parity) or wants the wizard to also reconfigure host-level startup config.

### #10 Prompt A/B Testing Framework — judgment applied
- **Decision:** Variants stored as rows in `dbo.PromptVariants` keyed by `PromptTemplateName + VariantKey` with basis-point weights summing to 10000; traffic routed by stable xxHash64 of `(TenantId, RunId, PromptTemplateName)` for deterministic retries; variant key recorded on every `AgentResult`.
- **Override if:** the owner prefers a config-file-driven variant catalogue (e.g. `appsettings.PromptVariants.json`) instead of SQL rows, or wants random (non-deterministic) bucketing.

### #11 Cloud-Hosted Azure Extractor — judgment applied
- **Decision:** **Workload Identity Federation** from ArchLucid's hosted managed identity to a customer-provisioned service principal with `Reader` + `Cost Management Reader` only — strictly aligned with V1_SCOPE.md §2.16 Tier 2 ("federated workload identity preferred over long-lived secrets").
- **Override if:** the owner wants to support a long-lived client-secret fallback for customers whose IT prohibits federated credentials.

### #14 Read Replicas — judgment applied
- **Decision:** **Azure SQL Database Read Scale-Out** via `ApplicationIntent=ReadOnly` on a separate template-driven connection string; only four read-mostly repositories (`SqlFindingsSnapshotRepository`, `SqlAuditEventRepository`, `SqlComplianceDriftTrendRepository`, `SqlExecutiveRoiSummaryRepository`) are routed; primary connection remains the default for everything else.
- **Override if:** the owner prefers Azure SQL geo-replicas with explicit replica selection rather than `ApplicationIntent`-based routing.

### #15 Persistence Consolidation — judgment applied
- **Decision:** **Phase 1 only** — fold `ArchLucid.Persistence.MigrateVerify` into `ArchLucid.Persistence/MigrateVerify/` sub-namespace; keep the `migrate-verify` operator command surface intact; merge tests accordingly. Defer further consolidation (e.g. data + persistence merge from `NEXT_REFACTORINGS.md` §1) to a subsequent pass after this lands.
- **Override if:** the owner wants Phases 1 + 2 in one change.

### #17 Failover Testing in CI — judgment applied
- **Decision:** **Nightly** schedule (not per-PR) with two SQL Server containers in docker-compose; `docker kill` the primary mid-load; assert RTO + structured 503s; results appended to `docs/quality/game-day-log/FAILOVER_RESULTS.md`. Warn-mode for two weeks before becoming merge-blocking on `main`.
- **Override if:** the owner wants this as a PR-blocking gate from day one.

### #18 Visual Policy Pack Builder — judgment applied
- **Decision:** Three-pane MVP (template picker / condition builder / live JSON preview); operators limited to predicates that `EffectiveGovernanceResolver` already supports; JSON is the source of truth; coexists with the existing JSON editor and the AI policy drafter as sibling tabs.
- **Override if:** the owner wants the builder to also extend the predicate operator set (which would require server-side resolver work).

### #21 Distributed Graph Projection Cache — judgment applied
- **Decision:** **MessagePack with LZ4BlockArray compression** over Redis (`IDistributedCache`); cross-replica invalidation via Redis pub/sub on `AuthorityCommittedChainPersisted` audit events; provider selection mirrors `HotPathCache:Provider=Auto` logic.
- **Override if:** the owner prefers System.Text.Json (debuggability over size) or a different invalidation strategy (e.g. TTL-only without pub/sub).

### #24 Fine-Grained RBAC UI — judgment applied
- **Decision:** 21 atomic permissions enumerated from existing `[Authorize]` and tier filters; built-in roles seeded as `IsSystem = 1` immutable templates; matrix UI at `/settings/roles` with "clone built-in to custom" flow; existing authorization handlers resolve unchanged when no custom roles are assigned.
- **Override if:** the owner wants the permission set to start narrower (e.g. only Findings + Audit feedback) or to include cross-tenant admin permissions for a managed-service operator persona.
