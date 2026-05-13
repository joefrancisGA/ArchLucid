> **Scope:** For leadership and technical evaluators: independent weighted readiness narrative (79.38%) with themes and prioritized gaps; not the canonical assessment index (LATEST), a build runbook, or live telemetry.

# ArchLucid Assessment – Weighted Readiness 79.38%

## Executive Summary

**Overall readiness**
The system is structurally sound for V1 GA but suffers from adoption friction and concurrency safety risks. The core agent orchestration is thoroughly mapped out but relies heavily on manual interventions for data ingestion and lacks deep continuous workflow integration. It has prioritized safety over velocity, ensuring compliance but dragging on adoption.

**The commercial picture**
Proof-of-ROI is highly optimized, giving clear first-value metrics to executive sponsors. However, adoption friction—specifically the reliance on manual PowerShell extractors for Azure ingestion—will throttle product-led growth and trial conversion rates in the mid-market.

**The enterprise picture**
The system integrates reasonably well with enterprise Identity (Entra/OIDC) and basic ITSM. However, it lacks deep bidirectional synchronization and relies heavily on advisory exports rather than native PR-driven automated workflows, limiting its stickiness in mature enterprise DevSecOps environments.

**The engineering picture**
The architecture is robustly designed with Row-Level Security, strong OpenTelemetry coverage, and explicit quality gates. However, correctness and reliability are threatened by missing idempotency on the commit phase, a lack of checkpointing in the hand-rolled orchestrator, and single points of failure like the Azure Content Safety API.

---

## Weighted Quality Assessment

Qualities are ranked from most urgent to least urgent based on their **weighted deficiency signal** (Weight × (100 - Score)).

### 1. Correctness
- **Score:** 72
- **Weight:** 8
- **Weighted deficiency signal:** 224
- **Justification:** The use of a hand-rolled orchestrator (`AuthorityRunOrchestrator`) introduces race conditions and crash-recovery risks for long-running processes. Furthermore, "extreme parallel duplicate-key pressure" fails idempotency, and the `commit` endpoint lacks idempotency header support entirely.
- **Tradeoffs:** Hand-rolled state machines reduce external dependencies (like Durable Task Framework) but increase the risk of race conditions and orphaned states.
- **Improvement recommendations:** Implement `Idempotency-Key` processing on the commit endpoint. Introduce intermediate checkpointing for agent results.
- **Likelihood of fix:** Fixable in V1 (Idempotency) / Better suited for V2 (DTF replacement).

### 2. Adoption Friction
- **Score:** 68
- **Weight:** 6
- **Weighted deficiency signal:** 192
- **Justification:** The Tier 1 Azure Extractor requires users to manually execute a PowerShell script and upload a potentially 52MB ZIP file. This is high friction for continuous use and limits the product to a snapshot-in-time review tool rather than a continuous monitoring platform.
- **Tradeoffs:** Zero-vendor-access ingestion ensures absolute security compliance and eliminates pushback from InfoSec, but destroys the user onboarding experience.
- **Improvement recommendations:** Implement a Tier 2 Azure Extractor Auto-Pull capability via Managed Identity.
- **Likelihood of fix:** Better suited for V1.1/V2 or blocked on user input.

### 3. AI/Agent Readiness
- **Score:** 76
- **Weight:** 8
- **Weighted deficiency signal:** 192
- **Justification:** Relying on static `InputUsdPerMillionTokens` in `appsettings` guarantees that cost metrics will drift from reality. Furthermore, `FailClosedOnSdkError` for Content Safety risks taking down the entire AI pipeline during Azure outages.
- **Tradeoffs:** Static token costs avoid complex billing reconciliations but misrepresent executive ROI. Failing closed guarantees safety but sacrifices availability.
- **Improvement recommendations:** Add a Circuit Breaker with a degraded regex-redaction fallback for Content Safety. Automate LLM cost reconciliation.
- **Likelihood of fix:** Fixable in V1.

### 4. Workflow Embeddedness
- **Score:** 70
- **Weight:** 3
- **Weighted deficiency signal:** 90
- **Justification:** Terraform integration is advisory and export-only. ITSM connectors (Jira/ServiceNow) are one-way creation with basic status-sync back. It does not embed deeply into GitOps (e.g., automatically opening a Pull Request).
- **Tradeoffs:** Advisory-only exports prevent destructive actions on customer infrastructure but force the operator to do manual out-of-band work.
- **Improvement recommendations:** Automatically generate Pull Requests with the generated Terraform.
- **Likelihood of fix:** Blocked on user input (requires SCM strategy).

### 5. Executive Value Visibility
- **Score:** 85
- **Weight:** 4
- **Weighted deficiency signal:** 60
- **Justification:** First-value reports and run deltas explicitly surface findings and savings. However, there is no cross-tenant or macro-organizational dashboard for executives overseeing multiple workspaces.
- **Tradeoffs:** Strict tenant isolation (database-per-tenant) makes cross-tenant aggregations difficult to compute securely.
- **Improvement recommendations:** Build a cross-tenant rollup capability for MSPs or parent organizations.
- **Likelihood of fix:** Better suited for V1.1/V2.

### 6. Proof-of-ROI Readiness
- **Score:** 90
- **Weight:** 5
- **Weighted deficiency signal:** 50
- **Justification:** The system has specific `pilot-run-deltas` endpoints showing ROI numbers, a first-value report for sponsors, and explicit cost-savings models.
- **Tradeoffs:** Numbers are heavily reliant on the quality of the initial Azure extraction and static cost mappings.
- **Improvement recommendations:** Allow custom branding and logos on the exported ROI reports.
- **Likelihood of fix:** Fixable in V1.

### 7. Security
- **Score:** 84
- **Weight:** 3
- **Weighted deficiency signal:** 48
- **Justification:** Strong architectural security (RLS, private endpoints, ZAP in CI). However, RBAC is coarse-grained (Admin/Operator/Reader) with no project-level isolation, and API keys lack forced rotation.
- **Tradeoffs:** Coarse RBAC is easier to implement and test but fails to meet the needs of complex enterprise hierarchies.
- **Improvement recommendations:** Implement Project-Level RBAC and API Key Rotation policies.
- **Likelihood of fix:** Blocked on user input (requires UX/DB schema decisions).

### 8. Usability
- **Score:** 85
- **Weight:** 3
- **Weighted deficiency signal:** 45
- **Justification:** The operator UI has a structured 7-step wizard. However, debugging why a custom agent failed schema validation or why OIDC mapping failed is opaque to the user.
- **Tradeoffs:** Abstracting away validation errors keeps the UI clean but frustrates advanced operators.
- **Improvement recommendations:** Surface specific schema validation errors and semantic faithfulness reject reasons in the UI.
- **Likelihood of fix:** Fixable in V1.

### 9. Compliance Readiness
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Justification:** SOC 2 self-assessment is done and DPA/Trust Center exist. However, automated data lifecycle management (purging orphaned runs/traces) requires manual batch limits and doesn't handle all edge cases cleanly.
- **Tradeoffs:** Hard-deleting records is risky for audit trails, but keeping them forever violates data minimization principles.
- **Improvement recommendations:** Implement comprehensive stale run garbage collection.
- **Likelihood of fix:** Fixable in V1.

### 10. Explainability
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Justification:** Explainability relies heavily on the `Aggregate` explanation endpoint. `FaithfulnessFallbackEnabled` allows the system to accept explanations even when the LLM is hallucinating unsupported narratives.
- **Tradeoffs:** Fallbacks prevent failed runs but degrade trust in the AI's reasoning.
- **Improvement recommendations:** Log exact semantic gaps when faithfulness rejects occur to aid in prompt tuning.
- **Likelihood of fix:** Fixable in V1.

### 11. Interoperability
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Justification:** Webhooks, generic OIDC, and basic ITSM are in place. However, the system lacks native SAML 2.0 SP support and the Confluence connector only supports a single fixed space.
- **Tradeoffs:** OIDC is more modern than SAML, but many legacy enterprises still mandate SAML.
- **Improvement recommendations:** Implement Dynamic Confluence Space Routing based on project metadata.
- **Likelihood of fix:** Fixable in V1.

### 12. Performance
- **Score:** 75
- **Weight:** 1
- **Weighted deficiency signal:** 25
- **Justification:** Uploading 52MB ZIP files is slow. Document ingestion duplicates blobs instead of deduplicating them. Graph snapshots lack a distributed cache.
- **Tradeoffs:** Single-region, memory-only caching keeps the infrastructure footprint small and cheap but bottlenecks enterprise scale.
- **Improvement recommendations:** Implement Evidence Bundle Document Deduplication.
- **Likelihood of fix:** Fixable in V1.

### 13. Commercial Packaging Readiness
- **Score:** 88
- **Weight:** 2
- **Weighted deficiency signal:** 24
- **Justification:** Tiers are well-defined (Team, Pro, Enterprise) and explicitly gated in code.
- **Tradeoffs:** The trial funnel enforces a hard 402 block on writes when exhausted, which is jarring.
- **Improvement recommendations:** Add Trial Expiry Webhook/Email Warnings prior to exhaustion.
- **Likelihood of fix:** Fixable in V1.

### 14. Documentation
- **Score:** 92
- **Weight:** 3
- **Weighted deficiency signal:** 24
- **Justification:** Extremely thorough, with clear separation of scope, automated OpenAPI snapshots, and onboarding guidelines.
- **Tradeoffs:** High documentation maintenance burden slows down development velocity.
- **Improvement recommendations:** N/A (Maintained well).
- **Likelihood of fix:** N/A.

### 15. Stickiness
- **Score:** 78
- **Weight:** 1
- **Weighted deficiency signal:** 22
- **Justification:** Lack of bi-directional integration with external tools makes ArchLucid a destination rather than an embedded part of the developer's daily workflow.
- **Tradeoffs:** Deep bi-directional sync introduces massive state-reconciliation complexity.
- **Improvement recommendations:** Enhance ITSM syncing and Slack interactive approvals.
- **Likelihood of fix:** Blocked on user input.

### 16. Accessibility
- **Score:** 82
- **Weight:** 1
- **Weighted deficiency signal:** 18
- **Justification:** Draft VPAT and WCAG 2.1 AA targets are in place with `axe-core` CI checks.
- **Tradeoffs:** Automated accessibility checks miss complex screen-reader context issues.
- **Improvement recommendations:** Perform manual screen-reader evaluations.
- **Likelihood of fix:** Better suited for V1.1.

### 17. Customer Self-Sufficiency
- **Score:** 84
- **Weight:** 1
- **Weighted deficiency signal:** 16
- **Justification:** Operators have strong CLI tools, but discovering and auditing custom agent handlers is difficult without diving into code.
- **Tradeoffs:** Reflection-based UI discovery is complex to implement securely.
- **Improvement recommendations:** Add a Custom Agent Handler UI Discovery endpoint.
- **Likelihood of fix:** Fixable in V1.

### 18. Observability
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** OTEL and Prometheus metrics are robust, but tracing batch alert failures or schema validation drops is tough without raw log access.
- **Tradeoffs:** Exporting too much telemetry data to the UI risks exposing PII or internal state.
- **Improvement recommendations:** Enhance alert simulation to support historical runs.
- **Likelihood of fix:** Fixable in V1.

---

## Top 12 Most Important Weaknesses
1. **Manual PowerShell script requirement** for Azure extraction creates severe onboarding friction.
2. **Lack of idempotency on the `commit` endpoint** risks corrupted states during network drops.
3. **Terraform integration is advisory/export only**, requiring out-of-band application by operators.
4. **ITSM connectors (Jira/ServiceNow)** are one-way creation with only basic status-sync back.
5. **Hand-rolled orchestration state machine** lacks crash survivability compared to Durable Task Framework.
6. **Content Safety API failures fail closed entirely**, halting the core product during Azure outages.
7. **Fixed, single-space Confluence publishing** limits multi-team organizational structures.
8. **Static LLM cost estimation** in configuration quickly drifts from reality, misrepresenting usage metrics.
9. **Lack of automatic cleanup** for stale/orphan runs leads to SQL database bloat.
10. **Explanation fallbacks** can inadvertently hide LLM hallucinations from the end-user.
11. **Performance relies entirely on single-region SQL/Memory caching**, bottlenecking at scale.
12. **Coarse RBAC** prevents multi-project isolation within a single tenant workspace.

## Top 6 Monetization Blockers
1. High friction data-ingestion (PowerShell ZIP upload) will cause trial abandonment.
2. Lack of automated LLM cost reconciliation could lead to negative margin on Enterprise unlimited tiers.
3. Lack of deep workflow integration limits the perceived value for high-paying Enterprise buyers.
4. Missing break-glass governance bypass will cause production-blocker escalations.
5. Unclear UX on why a custom agent failed schema validation increases support burden.
6. Trial exhaustion is a hard 402 block on writes, potentially angering mid-eval champions without a graceful warning.

## Top 6 Enterprise Adoption Blockers
1. Lack of granular project-level RBAC within a tenant.
2. Manual Terraform application disrupts modern GitOps pipelines.
3. Single Confluence space publishing prevents enterprise-wide adoption across multiple BUs.
4. Missing API key rotation enforcement violates many InfoSec policies.
5. Inability to easily trace IdP JWT mapping issues leads to failed SSO onboarding.
6. Lack of cross-tenant dashboards prevents adoption by MSPs and central IT platforms.

## Top 6 Engineering Risks
1. `Idempotency-Key` missing on `commit` endpoint.
2. Azure Content Safety SDK failures fail the entire completion pipeline closed.
3. Missing trace chunk checkpointing during long-running orchestrations.
4. Unbounded storage growth from missing orphan trace and run garbage collection.
5. Potential race conditions in `AuthorityRunOrchestrator` when processing multiple agent results.
6. Deduplication of uploaded documents is missing, leading to bloated blob storage.

## Most Important Truth
The platform has prioritized defensive safety (advisory Terraform, manual PowerShell extractors, fail-closed content safety) to such a degree that it is severely degrading the continuous user experience and adoption motion.

---

## Top Improvement Opportunities

Below are 25 high-leverage improvement opportunities ranked by impact.

### 1. Idempotency Header on Commit Endpoint
- **Why it matters:** Prevents race conditions and duplicate commits during network retries.
- **Expected impact:** Eliminates a class of 409 Conflict bugs and ensures system stability.
- **Affected qualities:** Correctness, Reliability.
- **Actionable now:** Yes.
```text
Implement `Idempotency-Key` processing on the `POST /v1/architecture/run/{runId}/commit` endpoint.
Files to modify: The architecture run commit controller and `IArchitectureRunCommitOrchestrator` implementation.
Acceptance criteria:
- If a request is received with an `Idempotency-Key` that matches an already successful commit for that Run ID, return `200 OK` with the exact same golden manifest response, adding the `Idempotency-Replayed: true` header.
- If the body or state differs for the same key, return 409 Conflict.
Constraints: Use the existing `IScopeContextProvider` for isolation. Do NOT change the behavior of the `execute` endpoint.
Impact: Directly improves Correctness (+8-10 pts). Weighted readiness impact: +0.6-0.8%.
```

### 2. Implement Azure Extractor Auto-Pull
- **Why it matters:** Manual PowerShell extraction is the single largest point of friction for continuous enterprise use.
- **Expected impact:** Transforms ArchLucid from a point-in-time review tool into a continuous monitoring platform.
- **Affected qualities:** Adoption Friction, Stickiness.
- **Actionable now:** Yes.
```text
Implement a Tier 2 Auto-Pull capability for the Azure Extractor using Federated Identity Credentials.
Files to modify: `ArchLucid.Worker` jobs, Azure configuration services, and the Tenant settings schema.
Acceptance criteria:
- Allow tenants to configure a `ClientId`, `TenantId`, and `SubscriptionId` mapping to a customer-provisioned Service Principal.
- Implement an automated background CRON job in `ArchLucid.Worker` that assumes identity via OIDC (federated credentials) to pull ARM and Cost Management data.
- The worker should automatically trigger a new `ArchitectureRequest` using the pulled data.
Constraints: Do NOT use long-lived client secrets. Adhere to the Trust Center constraints: require only `Reader` and `Cost Management Reader` roles.
Impact: Directly improves Adoption Friction (+10-15 pts) and Stickiness (+5-8 pts). Weighted readiness impact: +0.8-1.0%.
```

### 3. Dynamic Confluence Space Routing
- **Why it matters:** Large organizations use different Confluence spaces per team.
- **Expected impact:** Massive increase in enterprise viability.
- **Affected qualities:** Interoperability, Workflow Embeddedness.
- **Actionable now:** Yes.
```text
Enhance the Confluence connector to allow routing to different Space Keys dynamically.
Files to modify: `Integrations:Confluence` configuration models and the Confluence webhook/integration publisher.
Acceptance criteria:
- Update the `TenantItsmOutboundSettings` or equivalent tenant config to accept a JSON mapping of Project ID -> Space Key.
- Fallback to `Confluence:DefaultSpaceKey` if no project mapping exists.
Constraints: Maintain the V1 MVP basic auth model. Do not introduce OAuth 2.0 yet.
Impact: Directly improves Interoperability (+5-7 pts) and Workflow Embeddedness (+3-5 pts). Weighted readiness impact: +0.2-0.4%.
```

### 4. Terraform Pull Request Generation
- **Why it matters:** Manual Terraform application disrupts modern GitOps pipelines and prevents continuous deployment.
- **Expected impact:** High adoption in GitOps environments.
- **Affected qualities:** Workflow Embeddedness, Interoperability.
- **Actionable now:** Yes.
```text
Enhance the Terraform export feature to automatically create a Pull Request against a GitHub repository.
Files to modify: The Terraform export service and GitHub integration services.
Acceptance criteria:
- Integrate with the GitHub API using an OAuth app or PAT.
- Create a new branch named `archlucid/terraform-update-{runId}` (or similar sensible convention).
- Commit the generated Terraform files to this branch and open a Pull Request against the repository's default branch.
Constraints: Ensure the PR body clearly states this is an advisory export. Ensure credentials are not logged.
Impact: Directly improves Workflow Embeddedness (+8-10 pts) and Interoperability (+3-5 pts). Weighted readiness impact: +0.4-0.6%.
```

### 5. Content Safety Circuit Breaker Fallback
- **Why it matters:** `FailClosedOnSdkError` halts the entire product if Azure Content Safety is down.
- **Expected impact:** High availability during Azure outages.
- **Affected qualities:** AI/Agent Readiness, Performance.
- **Actionable now:** Yes.
```text
Wrap the `ArchLucid.ContentSafety` SDK calls in a Polly Circuit Breaker.
Files to modify: The Content Safety service implementation and dependency injection wiring.
Acceptance criteria:
- If the Azure Content Safety API fails consecutively (e.g., 503s), open the circuit.
- When the circuit is open, fallback to a degraded local Regex-based redaction mechanism and log an `Advisory` audit event.
Constraints: Do not change the `BlockSeverityThreshold` logic. Ensure the fallback logs clearly state the degraded mode.
Impact: Directly improves AI/Agent Readiness (+5-8 pts). Weighted readiness impact: +0.4-0.6%.
```

### 6. V2 DEFERRED: Move Orchestration to Durable Task Framework
- **Why it matters:** As agent pipelines grow in complexity (e.g., fan-out/fan-in, human-in-the-loop, compensation), a custom orchestrator becomes a liability.
- **Expected impact:** Transparent checkpointing, safe crash recovery, and offloading of bursty workloads to Container Apps Jobs.
- **Affected qualities:** Correctness, Reliability, Performance.
- **Actionable now:** No. This is explicitly deferred to V2 because the current custom state machine is intentional and well-tested. Replacing it would incur a massive refactoring and testing tax that is not justified by current V1 pipeline complexity.

### 7. LLM Cost Estimation Reconciliation API
- **Why it matters:** Static token costs drift rapidly, breaking the Proof-of-ROI models.
- **Expected impact:** Accurate executive reporting and margin protection.
- **Affected qualities:** Executive Value Visibility, Correctness.
- **Actionable now:** Yes.
```text
Add an endpoint `POST /v1/admin/llm-cost-tuning` to update token cost heuristics dynamically.
Files to modify: The Admin configuration controller and `LlmCostEstimation` configuration models.
Acceptance criteria:
- Accept a payload containing new `InputUsdPerMillionTokens` and `OutputUsdPerMillionTokens`.
- Persist these values in a tenant-override table or global config override so they take precedence over `appsettings.json`.
Constraints: Endpoint must be gated by `AdminAuthority`. Do not break the existing fallback to appsettings.
Impact: Directly improves Executive Value Visibility (+5-7 pts). Weighted readiness impact: +0.2-0.3%.
```

### 8. Stale Run Garbage Collection
- **Why it matters:** Prevents unbounded SQL database bloat from abandoned runs.
- **Expected impact:** Predictable storage costs.
- **Affected qualities:** Compliance Readiness, Performance.
- **Actionable now:** Yes.
```text
Implement a scheduled background job to hard-delete uncommitted architecture runs older than 30 days.
Files to modify: Add a new HostedService to `ArchLucid.Worker` and a new method to `IRunRepository`.
Acceptance criteria:
- Query for runs where Status is NOT 'Committed' and `CreatedUtc` is older than 30 days.
- Hard delete the runs and associated tasks/evidence in batches of 500 to avoid locking tables.
Constraints: Ensure the batch size is configurable via `DataArchival:PurgeUncommittedRunsBatchSize`. Do not delete Committed runs.
Impact: Directly improves Compliance Readiness (+5-8 pts). Weighted readiness impact: +0.1-0.2%.
```

### 9. Project-Level RBAC
- **Why it matters:** Large enterprises require different teams to manage their own projects within the same tenant without granting tenant-wide admin privileges.
- **Expected impact:** Satisfies least-privilege enterprise requirements and unlocks multi-team deployments.
- **Affected qualities:** Security, Workflow Embeddedness.
- **Actionable now:** Yes.
```text
Implement project-level Role Based Access Control (RBAC).
Files to modify: SQL migration scripts, Authorization policies, and Admin controllers.
Acceptance criteria:
- Create `dbo.ProjectRoleAssignments` with columns `TenantId`, `ProjectId`, `UserId`, `Role` (e.g., 'Reader', 'Operator', 'ProjectAdmin'), and enforce a unique constraint on `(TenantId, ProjectId, UserId)`.
- Introduce a new `ProjectAdmin` role that can manage project-scoped Policy Packs and delegate project roles.
- Update authorization handlers to combine JWT claims with `ProjectRoleAssignments` dynamically based on the requested `ProjectId` context.
Constraints: Ensure `TenantId` is included in all queries to maintain strict RLS `SESSION_CONTEXT` isolation. Do not downgrade tenant-wide `Admin` capabilities.
Impact: Directly improves Security (+5-8 pts). Weighted readiness impact: +0.2-0.3%.
```

### 10. Custom Agent Handler UI Discovery
- **Why it matters:** Admins cannot easily audit what custom agents are installed.
- **Expected impact:** Increases operator trust and self-sufficiency.
- **Affected qualities:** Customer Self-Sufficiency, Usability.
- **Actionable now:** Yes.
```text
Add an endpoint `GET /v1/admin/custom-handlers` that returns dynamically discovered agent types.
Files to modify: Admin controller and Agent execution registry.
Acceptance criteria:
- Use dependency injection/reflection to list all registered implementations of the custom agent handler interfaces.
- Return a JSON array with the agent name, version, and description.
Constraints: Gated by `AdminAuthority`. Do not execute any agent logic, just read metadata.
Impact: Directly improves Customer Self-Sufficiency (+5-7 pts). Weighted readiness impact: +0.1-0.2%.
```

### 11. Agent Result Schema Strict Enforcement
- **Why it matters:** Silent schema failures lead to corrupted manifests.
- **Expected impact:** Stops bad data from entering the decision trace.
- **Affected qualities:** Correctness.
- **Actionable now:** Yes.
```text
Enforce strict JSON schema validation on outputs from custom agents before persisting results.
Files to modify: `AgentResultParser` or the schema validation middleware.
Acceptance criteria:
- If an agent's `AgentResult` fails the `SchemaValidation:AgentResultSchemaPath` check, throw an exception or return a hard failure state for that agent task.
- Log the specific schema validation errors into the task's diagnostic output.
Constraints: Respect the `SchemaValidation:EnforceOnParse` flag (ensure it defaults to true). Do not change the schema file itself.
Impact: Directly improves Correctness (+3-5 pts). Weighted readiness impact: +0.2-0.4%.
```

### 12. Alert Simulation Historical Run Support
- **Why it matters:** Operators need to test new alert rules against real past data, not just fakes.
- **Expected impact:** Easier tuning of noisy alerts.
- **Affected qualities:** Observability, Usability.
- **Actionable now:** Yes.
```text
Update `POST /v1/alerts/simulate` to optionally accept a `runId`.
Files to modify: Alert simulation controller and simulation service.
Acceptance criteria:
- If `runId` is provided, load the actual golden manifest from that run instead of requiring a synthetic payload.
- Run the simulation and return which alerts would have triggered.
Constraints: Require `ReadAuthority`. Ensure RLS prevents cross-tenant run loading.
Impact: Directly improves Observability (+5-7 pts) and Usability (+3-5 pts). Weighted readiness impact: +0.1-0.3%.
```

### 13. Governance Pre-Commit Bypass
- **Why it matters:** Missing break-glass governance bypass will cause production-blocker escalations.
- **Expected impact:** Enables emergency interventions without full policy rewrites.
- **Affected qualities:** Usability, Customer Self-Sufficiency.
- **Actionable now:** Yes.
```text
Implement a break-glass bypass mechanism for the Governance Pre-Commit gate.
Files to modify: The Governance gate evaluator and the architecture run commit controller.
Acceptance criteria:
- Allow the commit request to accept a `bypassJustification` string.
- If the justification is provided and the user has `ExecuteAuthority`, bypass the critical finding block.
- Log a high-severity `GovernanceBypassInvoked` audit event containing the justification.
Constraints: A second approver is not required. Must clearly log the exact findings that were bypassed.
Impact: Directly improves Usability (+4-6 pts) and Customer Self-Sufficiency (+2-4 pts). Weighted readiness impact: +0.2-0.4%.
```

### 14. Orphan Probe Auto-Remediation
- **Why it matters:** Reduces operator toil for trivial data inconsistencies.
- **Expected impact:** Self-healing data integrity.
- **Affected qualities:** Correctness.
- **Actionable now:** Yes.
```text
Add an `AutoQuarantine` execution block for the `DataConsistency` background job.
Files to modify: `DataConsistency` background service.
Acceptance criteria:
- When `DataConsistency:Enforcement:AutoQuarantine` is true, automatically flag and hide invalid references found by the orphan probe.
- Emit a `DataConsistencyRemediated` audit event with the count of affected rows.
Constraints: Ensure the batch limit `MaxRowsPerBatch` is respected. Do not delete data; only soft-delete or quarantine.
Impact: Directly improves Correctness (+3-5 pts). Weighted readiness impact: +0.2-0.4%.
```

### 15. Mermaid Diagram to SVG/PNG Export
- **Why it matters:** Execs cannot view raw Mermaid text easily.
- **Expected impact:** Better visual presentations in exports.
- **Affected qualities:** Executive Value Visibility.
- **Actionable now:** Yes.
```text
Allow exporting the generated Architecture Graph as a rendered image in the bundle ZIP.
Files to modify: `IEndToEndReplayComparisonExportService` and the Mermaid integration.
Acceptance criteria:
- When `ArchLucid:MermaidCli:Enabled` is true, invoke the external CLI to convert the `.mmd` string to an `.svg` or `.png`.
- Include the rendered image in the exported ZIP alongside the markdown.
Constraints: Do not block the export if the CLI fails; fallback gracefully to just the text file.
Impact: Directly improves Executive Value Visibility (+5-8 pts). Weighted readiness impact: +0.2-0.3%.
```

### 16. First-Value Report Branding Configuration
- **Why it matters:** MSPs and Enterprise teams want their own logos on generated reports.
- **Expected impact:** Better commercial presentation.
- **Affected qualities:** Proof-of-ROI Readiness.
- **Actionable now:** Yes.
```text
Allow tenants to apply custom branding to the Markdown/PDF first-value report.
Files to modify: The First Value Report generator and Tenant configuration models.
Acceptance criteria:
- Read `TenantBranding:LogoUrl` and `TenantBranding:CompanyName` from the tenant's configuration.
- Inject these values into the header of the exported Markdown and PDF reports.
Constraints: Ensure HTML sanitization on the inputs to prevent XSS in the PDF renderer.
Impact: Directly improves Proof-of-ROI Readiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 17. IdP Claim Mapping UI Diagnostics
- **Why it matters:** Inability to easily trace IdP JWT mapping issues leads to failed SSO onboarding.
- **Expected impact:** Reduces support tickets for enterprise integrations.
- **Affected qualities:** Usability, Interoperability.
- **Actionable now:** Yes.
```text
Add an admin diagnostic endpoint for troubleshooting failed JWT claim mappings during authentication.
Files to modify: Authentication middleware and the Admin diagnostics controller.
Acceptance criteria:
- Capture failed JWT mapping attempts (e.g., missing role claims) into an in-memory ring buffer or temporary diagnostics table.
- Filter out sensitive claims (like raw tokens or passwords) and retain only standard attributes (e.g., issuer, audience, missing claim names).
- Expose this data via a `GET /v1/admin/auth-diagnostics` endpoint.
Constraints: Must be gated by `AdminAuthority`. Ensure no PII or raw token signatures are persisted to durable storage.
Impact: Directly improves Usability (+5-8 pts) and Interoperability (+2-4 pts). Weighted readiness impact: +0.2-0.3%.
```

### 18. Trial Expiry Webhook/Email Warning
- **Why it matters:** A hard 402 block is a terrible UX for a champion in the middle of a trial.
- **Expected impact:** Higher conversion rates, less frustration.
- **Affected qualities:** Commercial Packaging Readiness, Adoption Friction.
- **Actionable now:** Yes.
```text
Extend the trial lifecycle job to send a warning email when the trial is near expiration.
Files to modify: Trial lifecycle hosted service and Email templates.
Acceptance criteria:
- Check if the trial has `daysRemaining <= 3`.
- Emit a `TrialExpiringSoon` integration event and send a warning email to the tenant admins.
Constraints: Ensure idempotency so the warning is only sent once per tenant per threshold.
Impact: Directly improves Commercial Packaging Readiness (+4-6 pts). Weighted readiness impact: +0.1-0.2%.
```

### 19. Run Export to Azure Blob Storage Destination
- **Why it matters:** Enterprises want to automatically pipe exports into their own cold storage.
- **Expected impact:** Better workflow embeddedness.
- **Affected qualities:** Interoperability, Workflow Embeddedness.
- **Actionable now:** Yes.
```text
Add an alternative export sink to push the ZIP directly to a customer-provided SAS URL.
Files to modify: The Export service and integration routing.
Acceptance criteria:
- Allow configuring a `DestinationSasUrl` for exports.
- Stream the generated ZIP file directly to the Azure Blob Storage via the SAS URL using `HttpClient` PUT.
Constraints: Must run asynchronously and not block the API response. Log success/failure to the audit trail.
Impact: Directly improves Interoperability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 20. API Key Rotation Enforcement
- **Why it matters:** Missing API key rotation enforcement violates many InfoSec policies.
- **Expected impact:** Satisfies strict enterprise security audits.
- **Affected qualities:** Security, Compliance Readiness.
- **Actionable now:** Yes.
```text
Implement support for secondary rolling API keys in the admin panel and configuration.
Files to modify: API Key authentication handler and the Admin configuration controller.
Acceptance criteria:
- Update the API key auth handler to support a list of valid keys per role (primary and secondary), rather than a single string.
- Provide a dedicated UI panel (or API endpoints) for admins to generate a secondary key without invalidating the primary.
- Add an `ExpiresAt` field to keys and reject expired keys during auth.
Constraints: Ensure new keys are securely generated and only displayed once.
Impact: Directly improves Security (+5-8 pts) and Compliance Readiness (+3-5 pts). Weighted readiness impact: +0.3-0.5%.
```

### 21. Evidence Bundle Document Deduplication
- **Why it matters:** Uploading the same architecture documents repeatedly inflates costs.
- **Expected impact:** Reduced SQL/Blob storage costs.
- **Affected qualities:** Performance.
- **Actionable now:** Yes.
```text
Hash incoming documents in `ArchitectureRequest` to deduplicate storage.
Files to modify: `ArchitectureRequest` handler and evidence persistence repository.
Acceptance criteria:
- Compute an SHA-256 hash of the incoming document payload.
- Check if the hash exists in the blob store for that tenant; if so, link to the existing blob instead of writing a new one.
Constraints: Retain strict tenant isolation (do not deduplicate across different tenants).
Impact: Directly improves Performance (+5-8 pts). Weighted readiness impact: +0.1-0.2%.
```

### 22. Semantic Faithfulness Reject Context
- **Why it matters:** Operators cannot fix prompts if they don't know why the agent was rejected.
- **Expected impact:** Faster prompt engineering cycles.
- **Affected qualities:** Usability, Explainability.
- **Actionable now:** Yes.
```text
When `PilotStrict` rejects an agent output, add the specific `EvaluationReason` to the `ProblemDetails` extensions.
Files to modify: The Quality Gate evaluator and the API Error formatting middleware.
Acceptance criteria:
- Capture the detailed semantic failure reason from the Heuristic/LLM Judge.
- Append this string to the `extensions.evaluationReason` property of the RFC 9457 JSON response.
Constraints: Ensure no sensitive user prompt data leaks into the generic error message.
Impact: Directly improves Explainability (+4-6 pts) and Usability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 23. Interactive Graph JSON Endpoint
- **Why it matters:** The frontend needs structured data to render visualizations, not just raw objects.
- **Expected impact:** Allows the UI to build interactive experiences.
- **Affected qualities:** Executive Value Visibility.
- **Actionable now:** Yes.
```text
Add `GET /v1/architecture/runs/{runId}/graph/interactive` to return a Cytoscape.js compatible JSON format.
Files to modify: Architecture controller and `IKnowledgeGraphService`.
Acceptance criteria:
- Transform the `GraphSnapshot` nodes and edges into the standard `{"data": {"id": "...", "source": "...", "target": "..."}}` Cytoscape format.
- Return `200 OK` with `application/json`.
Constraints: Require `ReadAuthority`. Ensure it uses the existing cached snapshot if available.
Impact: Directly improves Executive Value Visibility (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 24. Slack Interactive Action Approvals
- **Why it matters:** In-chat approvals drastically reduce the time to resolve governance blocks.
- **Expected impact:** Faster decision velocity and tighter ChatOps adoption.
- **Affected qualities:** Stickiness, Workflow Embeddedness.
- **Actionable now:** Yes.
```text
Implement interactive Slack actions for governance approvals using customer-provided Slack App credentials.
Files to modify: The Slack integration services and Webhook payload generators.
Acceptance criteria:
- Allow tenants to configure their own internal Slack App credentials (Signing Secret and Bot Token).
- Update the outbound Slack webhook to include interactive "Approve" and "Reject" buttons for governance findings.
- Expose a secure callback endpoint (e.g., `/v1/integrations/webhooks/slack/interactivity`) to process the button clicks.
Constraints: Ensure the callback verifies the Slack signature using the tenant's specific signing secret before executing the approval.
Impact: Directly improves Stickiness (+5-8 pts) and Workflow Embeddedness (+4-6 pts). Weighted readiness impact: +0.2-0.4%.
```

### 25. Batch Architecture Run Endpoint
- **Why it matters:** CI/CD pipelines need to submit multiple architectures at once.
- **Expected impact:** Higher throughput for automated ingestion.
- **Affected qualities:** Interoperability, Performance.
- **Actionable now:** Yes.
```text
Add `POST /v1/architecture/request/batch` to accept an array of requests and process them asynchronously.
Files to modify: Architecture controller and the Run orchestration service.
Acceptance criteria:
- Accept a JSON array of `ArchitectureRequest` objects (max 50).
- Queue them for asynchronous processing and return `202 Accepted` with a list of `runId`s.
Constraints: Enforce the `expensive` rate limit policy. Validate each request individually.
Impact: Directly improves Interoperability (+4-6 pts). Weighted readiness impact: +0.1-0.2%.
```

---

## Prompt Batching Guidance

To optimize context window usage and ensure logical grouping of changes, execute the actionable prompts in the following batches:

- **Batch 1: Core Reliability, RBAC & Idempotency** (Items 1, 5, 9) - Touches core controllers, authorization policies, `IArchitectureRunCommitOrchestrator`, and `DataConsistency` jobs.
- **Batch 2: UI, Export, & Visualization** (Items 3, 15, 16, 23) - Focuses on presentation layer, Mermaid CLI, Confluence routing, and custom branding.
- **Batch 3: Data Management, Performance & Extraction** (Items 2, 8, 21) - Focuses on Auto-Pull worker jobs, SQL `DELETE` batching, background hosted services, and Blob deduplication.
- **Batch 4: API, Integrations & Diagnostics** (Items 4, 7, 10, 11, 12, 13, 14, 17, 18, 19, 20, 22, 24, 25) - Touches endpoints, Schema validation, Content Safety Polly policies, Webhooks, GitHub integration, API keys, Bypass mechanisms, and Slack integrations.

---
