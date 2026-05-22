# ArchLucid Assessment – (A) Headline Readiness: 75.53%

*Note: This score explicitly represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding items deferred beyond V1.1. It evaluates only in-contract V1 GA constraints and named V1.1 release-window engineering items. Multi-cloud (AWS/GCP) capabilities have been intentionally excluded from this assessment per the latest owner directives and do not penalize the current readiness posture.*

## Executive Summary

**`(A)` Overall Headline Readiness**  
The core platform (API, SQL persistence, UI, CLI) is stable, well-isolated, and capable of executing its designated V1 "Pilot" loop end-to-end flawlessly on Azure footprints. However, the V1.1 headline readiness score is dragged down by unfulfilled commitments in the V1.1 release window, specifically around the MCP membrane, cross-run executive reporting, and the first-party ITSM/chat-ops integrations. Until these are shipped, the product meets the bare V1 threshold but falls short of its stated V1.1 contractual capability.

**`(B)` Procurement / Market-Motion Realism (Informational)**  
Enterprise procurement will experience significant friction. The absence of an issued SOC 2 CPA attestation is an immediate red flag for infosec teams. While the “no ArchLucid credentials in customer cloud” Tier 1 extractor mitigates risk, security officers will heavily scrutinize the lack of a third-party penetration test (deferred to V2) and an automated tenant erasure quarantine pipeline. The platform relies heavily on trust-center honesty and self-assessments to bridge this gap today.

**Commercial Picture**  
Monetization is bottlenecked by the pending "Commerce Un-hold" (Stripe live keys and Marketplace publication). Until flipped, the motion is purely sales-led. Without cross-run executive ROI rollups, demonstrating strategic value to CFOs post-pilot remains manual and fractured.

**Enterprise Picture**  
The baseline wizard and core pilot paths are clean, but usability and operational scale drop off sharply when bulk evidence processing is required. Buyers expecting seamless native integrations (Jira, ServiceNow, Slack, Teams) will face immediate workflow disruption, and those requiring SAML 2.0 SP out-of-the-box (V1 GA pending) may stall implementations. 

**Engineering Picture**  
The architecture is solid—adhering strictly to Azure native services, DbUp migrations, and the Outbox pattern—but limits scale through its choices. The heavy reliance on SQL Server for audit trails, traces, and messaging queues is a ticking time bomb for high-throughput environments without a mandated distributed cache (Redis) or offloaded orchestrator (DTF). Multi-region High Availability is explicitly out of scope, capping enterprise SLA guarantees.

---

## Weighted Quality Assessment

### 1. AI/Agent Readiness (Score: 75/100, Weight: 8)
- **Weighted Impact:** -0.53%
- **Justification:** The architecture orchestrates agents well with explicit tasks, but the Model Context Protocol (MCP) membrane—a major V1.1 extensibility gate—is missing. Custom agent handler documentation is also pending.
- **Tradeoffs:** Structured orchestration ensures reliability and safety over open-ended autonomous agents, but missing MCP locks out the broader agent ecosystem.
- **Recommendations:** Implement the thin MCP HTTP Facade exposing the 7 designated read-only tools. 

### 2. Proof-of-ROI Readiness (Score: 60/100, Weight: 5)
- **Weighted Impact:** -0.53%
- **Justification:** V1 has a pilot scorecard and per-run ROI, but the dedicated cross-run executive ROI summary API is a V1.1 commitment that hasn't shipped.
- **Tradeoffs:** Per-run ROI is easy to calculate but fails to demonstrate systemic portfolio-level value to executive sponsors.
- **Recommendations:** Implement the `GET /v1/reports/executive-summary` endpoint (even if deduplication logic is stubbed) to begin serving CFO-level board packs.

### 3. Adoption Friction (Score: 70/100, Weight: 6)
- **Weighted Impact:** -0.47%
- **Justification:** Requiring users to run PowerShell scripts (`Get-ArchLucidAzurePackage.ps1`) for extraction creates human-in-the-loop operational drag. The absence of native SAML 2.0 SP and V1.1 first-party integrations (Jira, ServiceNow, Slack, Teams, Confluence) breaks automated remediation workflows.
- **Tradeoffs:** The Tier 1 extraction strategy maximizes security (no vendor creds needed) at the direct expense of operational friction.
- **Recommendations:** Fast-track the SAML 2.0 SP implementation and the V1.1 ITSM/Chat-Ops delivery sinks.

### 4. Executive Value Visibility (Score: 65/100, Weight: 4)
- **Weighted Impact:** -0.37%
- **Justification:** Dashboards and compliance drift charts exist, but the lack of aggregated cross-run deduplication semantics dilutes the impact of findings presented to executives. 
- **Tradeoffs:** Operator-focused UI is strong, but executive-focused reporting is underdeveloped pending V1.1 work.
- **Recommendations:** Finalize the cross-run ROI aggregation rules to ensure clear visibility.

### 5. Time-to-Value (Score: 90/100, Weight: 7)
- **Weighted Impact:** -0.18%
- **Justification:** Azure architecture extraction via the Tier 1 PowerShell script delivers extremely rapid insights without requiring vendor credentials. The onboarding sequence is tight and effective for its targeted footprint.
- **Tradeoffs:** The purely manual extraction (Tier 1) requires human-in-the-loop, slightly degrading continuous time-to-value compared to a continuous service principal connection (Tier 2).
- **Recommendations:** Publish comprehensive documentation for setting up Tier 2 continuous pull-based Azure extractor automation.

### 6. Usability (Score: 80/100, Weight: 3)
- **Weighted Impact:** -0.16%
- **Justification:** The core operator happy path is highly legible. However, evidence bulk upload is capped at 30 files without ZIP expansion or folder recursion, creating massive friction during ingestion.
- **Tradeoffs:** Hard caps protect system resources but force operators to manually split evidence batches.
- **Recommendations:** Implement ZIP Archive Expansion and Folder Recursion on the evidence upload endpoints.

### 7. Maintainability (Score: 80/100, Weight: 2)
- **Weighted Impact:** -0.11%
- **Justification:** Codebase boundaries are respected, and DbUp works well. However, brownfield Terraform states retaining `archiforge` references present ongoing operational risk.
- **Tradeoffs:** DbUp provides rigid schema control but makes large-scale migrations cumbersome compared to state-based tools.
- **Recommendations:** Strip legacy configuration tokens from Terraform docs and finalize `state mv` guidance.

### 8. Reliability (Score: 85/100, Weight: 2)
- **Weighted Impact:** -0.08%
- **Justification:** Resilient Outbox patterns and SQL failover are present. Multi-region active/active is explicitly out of scope. High volumes may bottleneck on SQL without Redis.
- **Tradeoffs:** Single-region architecture dramatically reduces complexity and cost but hard-caps SLAs.
- **Recommendations:** Raise CI Merged Line Coverage to 95% to harden the core pipeline.

### 9. Supportability (Score: 90/100, Weight: 1)
- **Weighted Impact:** -0.03%
- **Justification:** Excellent diagnostic tooling (`GET /version`, `doctor`, `support-bundle`) and correlation IDs.
- **Tradeoffs:** PGP key drop for coordinated vulnerability disclosure is deferred to V1.1.
- **Recommendations:** Execute the PGP key drop once the mailbox is provisioned.

---

## Top 12 Most Important Weaknesses

1. **Missing Cross-Run Executive ROI rollup:** Restricts executive buy-in and CFO-level purchasing justification.
2. **Lack of Agent Ecosystem / MCP Membrane:** Blocks third-party tools from interacting with the architecture graph.
3. **Absence of First-Party ITSM connectors (Jira/ServiceNow):** Breaks automated operational remediation workflows.
4. **Absence of Chat-Ops (Slack/Teams):** Increases response latency for critical architecture approvals and alerts.
5. **Missing Evidence Bulk Upload capabilities (ZIP expansion/recursion):** Causes massive adoption friction during manual artifact ingestion.
6. **Pending Commerce Un-hold (Stripe/Marketplace):** Retains the sales-led motion bottleneck; blocks PLG transactability.
7. **Pending SAML 2.0 SP implementation:** Disqualifies the platform in enterprises strictly enforcing SAML over generic OIDC bridges.
8. **Unimplemented Confluence export:** Hinders broader organizational knowledge dissemination.
9. **Lack of PGP key drop:** Weakens the coordinated vulnerability disclosure posture.
10. **Missing automated tenant erasure pipeline (V2):** Creates GDPR/CCPA friction for enterprise privacy reviews.
11. **Dependence on SQL for outbox/audit/traces:** Poses a severe throughput scaling bottleneck for large enterprise fleets without a distributed cache baseline.
12. **Lack of Generic OIDC IdP wizard/documented paths:** Only Entra is the default documented path, making Okta/Ping integrations reliant on self-service configuration.

---

## Top 6 Monetization Blockers

1. **Commerce Un-hold (Stripe Live / Marketplace):** Retains the sales-led motion bottleneck; self-serve is dead in the water.
2. **Missing Cross-Run Executive ROI Endpoint:** Prevents the platform from automatically generating the CFO value-justification required to renew or expand licenses.
3. **No MCP Membrane:** Blocks the creation of a billable third-party plugin ecosystem.
4. **No First-Party Public Reference Customer:** Weakens marketing leverage and slows enterprise consensus.
5. **Missing ITSM Integrations:** Reduces product "stickiness" by failing to embed ArchLucid deeply into the daily operational toolchain.
6. **Missing SAML 2.0 SP:** Acts as a hard blocker for enterprise IAM sign-offs during procurement.

---

## Top 6 Enterprise Adoption Blockers

1. **SOC 2 CPA Report Absence:** Immediately triggers extended infosec reviews and risk exception paperwork.
2. **Manual PowerShell Extraction Defaults:** The lack of a turnkey Tier 2 automated pull-based connector frustrates operations teams looking for zero-touch observability.
3. **Lack of Native SAML 2.0 SP:** Disqualifies the platform in enterprises that refuse to configure generic OIDC bridges.
4. **Absence of Third-Party Pen Test:** Extends the procurement cycle while security teams demand vendor-funded assurance.
5. **Manual Evidence Upload Limitations:** The 30-file cap without ZIP recursion frustrates compliance officers uploading massive control matrices.
6. **Missing Automated Tenant Erasure:** Forces manual operator intervention to satisfy DPA data subject deletion requests.

---

## Top 6 Engineering Risks

1. **SQL Server Bottlenecking:** Overloading the primary database with durable audit logs, large outbox payloads, and graph traces risks DB throttling under high tenant load.
2. **Lack of Distributed Cache (Redis) Default:** Could lead to LLM API rate limiting and latency spikes in multi-replica deployments.
3. **Hand-Rolled Orchestration State Machines:** Managing long-running workflows via database state instead of a Durable Task Framework (DTF) increases the risk of stalled or orphaned runs.
4. **Incomplete RLS Object Coverage:** Legacy token names in the database pose a latent risk to cross-tenant data isolation.
5. **Single-Region Hard Cap:** The lack of multi-region active/active architectures limits disaster recovery RTO/RPO guarantees.
6. **Terraform Brownfield State:** Misalignment between `archiforge` remote states and `archlucid` IaC could trigger catastrophic accidental resource destruction during `terraform apply`.

---

## Most Important Truth

ArchLucid possesses a robust, secure, and well-isolated V1 core with a brilliant "no vendor access" ingestion doctrine, but its headline V1.1 readiness is heavily depressed by the gap between its stated V1.1 product commitments (MCP, ITSM, Executive ROI) and the actual shipped code.

---

## Top Improvement Opportunities

1. **DEFERRED Cross-Run Executive ROI Aggregation Rules**
   - **Why it matters:** Necessary to calculate portfolio-level value for CFOs.
   - **Expected impact:** Unblocks Executive Value Visibility.
   - **Affected qualities:** Executive Value Visibility, Proof-of-ROI Readiness.
   - **Actionable:** DEFERRED
   - **Input needed from me:** Provide explicit aggregation semantics (sum vs. max vs. unique-finding identity) when multiple runs surface the same systemic issue.

2. **Implement `GET /v1/reports/executive-summary`**
   - **Why it matters:** Establishes the API foundation for CFO value tracking.
   - **Expected impact:** Directly improves Executive Value Visibility (+5-7 pts). Weighted readiness impact: +0.6%.
   - **Affected qualities:** Executive Value Visibility, Proof-of-ROI Readiness.
   - **Actionable:** Yes.
   - **Prompt:** Create `ExecutiveSummaryController.cs` exposing `GET /v1/reports/executive-summary`. Return a `ValueReportSnapshot` payload. Stub the deduplication math logic with a TODO comment pending owner input on aggregation rules. Acceptance: Endpoint returns 200 OK with a valid snapshot payload for a given tenant.

3. **Implement MCP Membrane HTTP Facade**
   - **Why it matters:** Gateway to the entire third-party agent ecosystem.
   - **Expected impact:** Directly improves AI/Agent Readiness (+5-8 pts). Weighted readiness impact: +1.1%.
   - **Affected qualities:** AI/Agent Readiness.
   - **Actionable:** Yes.
   - **Prompt:** Create a new facade project `ArchLucid.Mcp` wrapping `ArchLucid.Application`. Expose exactly 7 read-only tools: `GetRunStatus`, `GetManifestSummary`, `CompareRuns`, `GetProvenanceGraph`, `GetGovernanceStatus`, `ListArtifacts`, `GetAuditSlice`. Configure Streamable HTTP. Apply `SESSION_CONTEXT` RLS. Acceptance: Integration tests verify secure execution.

4. **Elevate `ArchLucidAuth:Mode=Saml2` Native SP support for Workforce SSO**
   - **Why it matters:** Eliminates a major blocker for enterprise procurement.
   - **Expected impact:** Directly improves Adoption Friction (+4-6 pts). Weighted readiness impact: +0.6%.
   - **Affected qualities:** Adoption Friction.
   - **Actionable:** Yes.
   - **Prompt:** Implement `ArchLucidAuth:Mode=Saml2` in the auth startup extensions. Configure the ASP.NET Core SAML2 middleware to act as a Service Provider. Map incoming SAML assertions to `ArchLucidRoles`. Ensure mutually exclusive coexistence with `JwtBearer`. Acceptance: Integration tests verify successful SAML sign-in.

5. **Implement Jira Outbound Issue Creator**
   - **Why it matters:** Critical for automated remediation workflow stickiness.
   - **Expected impact:** Directly improves Adoption Friction (+3-5 pts). Weighted readiness impact: +0.5%.
   - **Affected qualities:** Adoption Friction.
   - **Actionable:** Yes.
   - **Prompt:** Create `ItsmOutboundJiraIssueCreator.cs` implementing `IItsmOutboundIssueProvider` in `ArchLucid.Application`. Use `ItsmFindingAuthorityPayloadMapper` to map findings to Jira REST API payloads using basic auth/API tokens. Do not implement OAuth 2.0. Acceptance: Unit tests mock Jira's API and verify mapping.

6. **Implement ServiceNow Outbound Incident Creator**
   - **Why it matters:** Required for enterprise ITSM integration.
   - **Expected impact:** Directly improves Adoption Friction (+3-5 pts). Weighted readiness impact: +0.5%.
   - **Affected qualities:** Adoption Friction.
   - **Actionable:** Yes.
   - **Prompt:** Create `ItsmOutboundServiceNowIncidentCreator.cs` implementing `IItsmOutboundIssueProvider` in `ArchLucid.Application`. Post to the `incident` table via REST using basic auth. Leave `cmdb_ci` empty if no exact match is found. Acceptance: Unit tests verify incident formatting.

7. **DEFERRED ServiceNow Auto-Create CMDB CI Logic**
   - **Why it matters:** Engineering cannot validate ServiceNow bidirectional sync.
   - **Expected impact:** Unblocks full ServiceNow validation.
   - **Affected qualities:** Adoption Friction.
   - **Actionable:** DEFERRED
   - **Input needed from me:** Provision and provide credentials for a cost-free ServiceNow Developer Program instance.

8. **Implement Bi-directional Status Sync for Jira**
   - **Why it matters:** Keeps the system of record accurate without double-data entry.
   - **Expected impact:** Directly improves Adoption Friction (+3-5 pts). Weighted readiness impact: +0.5%.
   - **Affected qualities:** Adoption Friction.
   - **Actionable:** Yes.
   - **Prompt:** Create a webhook handler to sync Jira issue status changes back to ArchLucid finding state. Map `To Do` -> `Open`, `In Progress` -> `InProgress`, `Done` -> `Resolved`. Update `ItsmFindingCorrelationRecord`. Acceptance: Unit tests verify status transitions correctly map and save.

9. **Implement Bi-directional Status Sync for ServiceNow**
   - **Why it matters:** Enterprise standardization for resolving tickets.
   - **Expected impact:** Directly improves Adoption Friction (+3-5 pts). Weighted readiness impact: +0.5%.
   - **Affected qualities:** Adoption Friction.
   - **Actionable:** Yes.
   - **Prompt:** Create a webhook handler to sync ServiceNow incident status changes back to ArchLucid finding state. Map `New`/`In Progress` -> `Open`/`InProgress`, `Resolved`/`Closed` -> `Resolved`. Acceptance: Unit tests verify status transitions correctly map and save.

10. **Implement Microsoft Teams Incoming Webhook Delivery Sink**
    - **Why it matters:** Reduces alert latency for operators.
    - **Expected impact:** Directly improves Adoption Friction (+2-3 pts). Weighted readiness impact: +0.4%.
    - **Affected qualities:** Adoption Friction.
    - **Actionable:** Yes.
    - **Prompt:** Create a Teams webhook delivery channel under `ArchLucid.Application/Integrations/Teams`. Subscribe to the canonical `IntegrationEvents` catalog. Format payloads into Teams Adaptive Cards utilizing Key Vault secret references. Acceptance: Integration tests verify Adaptive Card JSON schema.

11. **Implement Slack Outbound Chat-Ops Delivery Sink**
    - **Why it matters:** Captures the Slack-heavy startup and enterprise market.
    - **Expected impact:** Directly improves Adoption Friction (+2-3 pts). Weighted readiness impact: +0.4%.
    - **Affected qualities:** Adoption Friction.
    - **Actionable:** Yes.
    - **Prompt:** Create `DigestSlackWebhookDeliveryChannel` and `AlertSlackWebhookDeliveryChannel` under `ArchLucid.Application/Integrations/Slack`. Subscribe to the `EnabledTriggersJson` matrix. Format payloads for Slack Block Kit. Do not add OAuth UX or interactive buttons. Acceptance: Unit tests verify Block Kit formatting.

12. **Implement Confluence Cloud Page Publisher**
    - **Why it matters:** Disseminates architecture findings across the organization.
    - **Expected impact:** Directly improves Adoption Friction (+2-3 pts). Weighted readiness impact: +0.4%.
    - **Affected qualities:** Adoption Friction.
    - **Actionable:** Yes.
    - **Prompt:** Create `ConfluencePagePublisher.cs` in `ArchLucid.Application/Integrations/Confluence`. Authenticate using basic auth/API token. Publish architecture findings to the tenant's `Confluence:DefaultSpaceKey`. Do not add multi-space dynamic routing. Acceptance: Successful mapping of a finding into Atlassian Document Format.

13. **Implement ZIP Archive Expansion for Evidence Upload**
    - **Why it matters:** Massively reduces operator toil when uploading artifacts.
    - **Expected impact:** Directly improves Usability (+3-4 pts). Weighted readiness impact: +0.3%.
    - **Affected qualities:** Usability.
    - **Actionable:** Yes.
    - **Prompt:** Update `EvidenceUploadController` (or `POST /v1/evidence/upload` logic) to detect `.zip` files and extract contents in-memory. Apply the 30-file cap to the expanded contents. Do not support folder recursion yet. Acceptance: Uploading a ZIP of 5 files stores them as 5 distinct items.

14. **Implement Folder Recursion for Evidence Bulk Upload**
    - **Why it matters:** Needed to ingest deep directory structures from compliance audits.
    - **Expected impact:** Directly improves Usability (+2-3 pts). Weighted readiness impact: +0.2%.
    - **Affected qualities:** Usability.
    - **Actionable:** Yes.
    - **Prompt:** Extend the ZIP Archive Expansion logic to recursively flatten nested directories within the ZIP payload. Maintain the overall 30-file cap, throwing an explicit error if exceeded. Acceptance: A ZIP containing nested folders correctly flattens and uploads.

15. **Flip Stripe Test keys to Live Keys in `BillingProductionSafetyRules` config**
    - **Why it matters:** Forces production readiness for the billing pipeline.
    - **Expected impact:** Directly improves Adoption Friction (+1-2 pts). Weighted readiness impact: +0.1%.
    - **Affected qualities:** Adoption Friction.
    - **Actionable:** Yes.
    - **Prompt:** Update the defaults for `BillingProductionSafetyRules` to require the `sk_live_` prefix when `ASPNETCORE_ENVIRONMENT=Production`. Do not remove the safety guard itself. Document the required Partner Center verified status. Acceptance: Unit tests assert the guard blocks production startup if test keys are used.

16. **Generate `HOSTED_TRIAL_V1_TO_V1_1_MIGRATION_GUIDE.md`**
    - **Why it matters:** Calms buyer anxiety during the V1.1 upgrade.
    - **Expected impact:** Directly improves Maintainability (+2-3 pts). Weighted readiness impact: +0.1%.
    - **Affected qualities:** Maintainability.
    - **Actionable:** Yes.
    - **Prompt:** Create `docs/library/HOSTED_TRIAL_V1_TO_V1_1_MIGRATION_GUIDE.md`. Summarize vendor-managed upgrades, breaking changes, new MCP/Slack/Teams features, and the flip to live Stripe keys. Link this in `docs/runbooks/TRIAL_END_TO_END.md`. Acceptance: Markdown is generated and links correctly.

17. **Strip `archiforge` legacy configuration tokens from Terraform docs**
    - **Why it matters:** Prevents operator confusion and catastrophic state destruction.
    - **Expected impact:** Directly improves Maintainability (+3-5 pts). Weighted readiness impact: +0.2%.
    - **Affected qualities:** Maintainability.
    - **Actionable:** Yes.
    - **Prompt:** Scan `docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md` and related infrastructure documentation. Remove lingering references to `archiforge` configuration overrides. Replace with `archlucid` equivalents. Do not alter `BREAKING_CHANGES.md`. Acceptance: `grep -i archiforge` against `docs/` yields zero operational references.

18. **Raise CI Merged Line Coverage requirement to 95%**
    - **Why it matters:** Hardens the system against regressions.
    - **Expected impact:** Directly improves Reliability (+3-5 pts). Weighted readiness impact: +0.2%.
    - **Affected qualities:** Reliability.
    - **Actionable:** Yes.
    - **Prompt:** Update `.github/workflows/ci.yml` and `scripts/ci/assert_merged_line_coverage_min.py` to change the line coverage floor to 95%. Re-enable the ratchet step. Do not modify `COVERAGE_GAP_ANALYSIS.md` yet. Acceptance: CI fails if merged line coverage is below 95%.

19. **DEFERRED PGP Key Generation for security@archlucid.net**
    - **Why it matters:** Required for coordinated vulnerability disclosure.
    - **Expected impact:** Closes a Trust Center gap.
    - **Affected qualities:** Supportability.
    - **Actionable:** DEFERRED
    - **Input needed from me:** Finalize `archlucid.net` domain acquisition, provision the `security@archlucid.net` mailbox, and provide the UID for the PGP key.

20. **Add Custom Agent Handler documentation to `docs/library/`**
    - **Why it matters:** Fulfills a V1 GA scope commitment for extensibility.
    - **Expected impact:** Directly improves AI/Agent Readiness (+2-3 pts). Weighted readiness impact: +0.5%.
    - **Affected qualities:** AI/Agent Readiness.
    - **Actionable:** Yes.
    - **Prompt:** Create `docs/library/CUSTOM_AGENT_HANDLER_GUIDE.md`. Document prerequisites, registration code patterns, safety boundaries, and versioning rules for self-hosting buyers wanting to write custom handlers. Add a link to `START_HERE.md`. Acceptance: Markdown is complete and links validate correctly.

21. **Implement Generic OIDC Integration Validations**
    - **Why it matters:** Ensures the V1 GA commitment to standard (non-Entra) OIDC providers is thoroughly tested and reliable.
    - **Expected impact:** Directly improves Reliability (+2-3 pts). Weighted readiness impact: +0.1%.
    - **Affected qualities:** Reliability.
    - **Actionable:** Yes.
    - **Prompt:** Create `GenericOidcProviderIntegrationTests.cs` using WireMock to simulate a non-Entra standard OIDC IdP (`.well-known/openid-configuration`, JWKS). Ensure `JwtBearer` configuration dynamically accepts and validates tokens, mapping claims for `ArchLucidRoles`. Acceptance: Tests pass verifying non-Entra token parsing.

22. **Document Tier 2 Azure Extractor Setup (Continuous Ingestion)**
    - **Why it matters:** Mitigates Adoption Friction for enterprises that reject manual PowerShell script execution and want zero-touch continuous ingestion.
    - **Expected impact:** Directly improves Adoption Friction (+2-3 pts). Weighted readiness impact: +0.4%.
    - **Affected qualities:** Adoption Friction.
    - **Actionable:** Yes.
    - **Prompt:** Create `docs/runbooks/AZURE_EXTRACTOR_TIER2_CONTINUOUS.md`. Document the exact steps for a customer to provision a service principal with `Reader` + `Cost Management Reader`, establish federated workload identity, and configure a scheduled GitHub Action/Azure DevOps pipeline to run `Get-ArchLucidAzurePackage.ps1` and POST to the API. Acceptance: Markdown accurately guides operators through the setup.

23. **Harden Azure Retail Prices API with Resiliency/Polly Retries**
    - **Why it matters:** Cost extraction will fail if the public Azure Retail Prices API rate limits or drops connections.
    - **Expected impact:** Directly improves Reliability (+2-3 pts). Weighted readiness impact: +0.1%.
    - **Affected qualities:** Reliability.
    - **Actionable:** Yes.
    - **Prompt:** Add `Microsoft.Extensions.Http.Resilience` to the project if not present. Configure a Polly retry and circuit breaker policy on the `HttpClient` used to query the Azure Retail Prices API during execution. Ensure exponential backoff. Acceptance: Integration tests simulate 429 Too Many Requests and verify successful retry logic.

24. **Extend Pre-Commit Governance Gate with Severity Thresholds**
    - **Why it matters:** Core compliance feature required for the pre-commit gate to properly function.
    - **Expected impact:** Directly improves Usability (+2-3 pts). Weighted readiness impact: +0.1%.
    - **Affected qualities:** Usability.
    - **Actionable:** Yes.
    - **Prompt:** Enhance `PreCommitGovernanceGate` to read `ArchLucid:Governance:PreCommitGateThreshold` (e.g., `High`, `Critical`). Block `POST /v1/architecture/run/{runId}/commit` if the run contains findings at or above this severity. Acceptance: Unit tests verify that a run with High findings is rejected when the threshold is set to High.

25. **Implement `ITenantHardPurgeService` tests for Offboarding**
    - **Why it matters:** Ensures trial/operator offboarding works as a stop-gap until the V2 automated privacy pipelines are built.
    - **Expected impact:** Directly improves Maintainability (+2-3 pts). Weighted readiness impact: +0.1%.
    - **Affected qualities:** Maintainability.
    - **Actionable:** Yes.
    - **Prompt:** Create `TenantHardPurgeServiceTests.cs`. Verify that executing the purge drops all SQL schema data for the tenant ID, removes associated Blobs, and emits the correct `PlatformAuditEvents` without breaking shared system catalogs. Acceptance: Test executes and validates zero surviving rows for the purged tenant.

---

## Prompt Batching Guidance

- **Batch 1: Core Integrations & Identity** (Items 4, 21, 22)
  *Optimizes context window around Auth/Identity startup extensions and documentation for Tier 2.*
- **Batch 2: ITSM & Collaboration Sync** (Items 5, 6, 8, 9, 10, 11, 12)
  *Groups all webhook, REST outbound delivery sinks, and bidirectional sync for efficient `ArchLucid.Application/Integrations` modification.*
- **Batch 3: Extensibility & Agent API** (Items 3, 20)
  *Groups MCP API construction and the custom handler documentation.*
- **Batch 4: Upload UX Improvements** (Items 13, 14)
  *Focused solely on the `EvidenceUploadController` stream and ZIP byte-manipulation.*
- **Batch 5: Executive ROI, Governance & Admin** (Items 2, 15, 16, 17, 18, 23, 24, 25)
  *Groups reporting endpoints, billing safety rules, threshold logic, Polly retries, and purge tests.*

---

## Pending Questions for Later

- **Cross-Run Executive ROI Aggregation Rules**
  - When multiple runs surface the exact same systemic issue, should the financial impact be summed, capped at maximum, or resolved via unique-finding identity?
- **ServiceNow Auto-Create CMDB CI Logic**
  - Is the cost-free ServiceNow Developer instance provisioned and ready for testing bidirectional sync?
- **PGP Key Generation**
  - What is the timeline for `archlucid.net` domain acquisition and `security@archlucid.net` mailbox provisioning?