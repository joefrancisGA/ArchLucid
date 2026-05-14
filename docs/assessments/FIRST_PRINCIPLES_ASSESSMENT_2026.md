> **Scope:** For leadership and technical evaluators: first-principles weighted readiness assessment with themes, tradeoffs, and prioritized gaps; not a build runbook, API contract, formal audit opinion, or live telemetry snapshot.

# ArchLucid Assessment – Weighted Readiness 81.15%

## Executive Summary

### Overall Readiness
ArchLucid presents a strong V1 foundation, achieving an 81.15% weighted readiness score. The core architecture—rooted in database-per-tenant isolation, deterministic manifest generation, and append-only durable auditing—is sound. However, significant test coverage gaps in persistence and background workers, combined with the friction of manual PowerShell-based telemetry extraction, present the most material drags on immediate readiness. Deferred scope items (e.g., CPA SOC 2, Stripe live keys, MCP) have been properly excluded from the core score, but they still shape the immediate product posture.

### Commercial Picture
The commercial motion is viable but currently restricted to sales-led pilots. The V1 product delivers strong Proof-of-ROI capabilities via its built-in cost estimators and retail price alignment. However, Adoption Friction remains the heaviest drag on the commercial score; relying on a customer-executed PowerShell script (Tier 1 Extractor) to gather Azure telemetry will inevitably trigger internal security reviews at buyer organizations, lengthening the time-to-value.

### Enterprise Picture
Enterprise readiness is buoyed by strong Workflow Embeddedness (in-scope Jira, ServiceNow, Confluence, and Slack connectors) and robust tenant isolation strategies. Compliance Readiness is adequate for V1 via self-assessments and a durable SQL audit trail, though enterprise buyers will ultimately demand the post-V1.1 CPA SOC 2 report. Customer Self-Sufficiency is somewhat constrained; while the operator UI and CLI are capable, deep extensibility (custom agent handlers) requires .NET proficiency and forked deployments since a plugin marketplace is deferred.

### Engineering Picture
The architectural invariants and design constraints are rigorously defined, yielding high scores in Security and Explainability. Conversely, Correctness carries the largest weighted deficiency due to alarming test coverage gaps in `ArchLucid.Persistence` (56.42%) and `ArchLucid.Worker` (0.00%). AI/Agent Readiness is strong, leveraging deterministic orchestrators and Azure OpenAI, though Performance is capped by in-memory constraints (Redis and distributed graph caches being explicitly deferred to V2).

---

## Weighted Quality Assessment

Qualities are ranked from most urgent to least urgent based on their **weighted deficiency** (Weight × (100 - Score)).

### 1. Correctness
- **Score:** 75
- **Weight:** 8
- **Weighted deficiency signal:** 200 (Highest Priority)
- **Justification:** While the DbUp migrations, transaction handling, and idempotency guarantees are conceptually robust, the codebase has glaring test coverage gaps. `ArchLucid.Worker` sits at 0.00% coverage, and `ArchLucid.Persistence`—the critical data layer—is at 56.42%, with massive uncovered blocks in `DapperTenantRepository` and `GraphSnapshotSqlBulkCopy`.
- **Tradeoffs:** Iteration speed vs. verification. The team has prioritized shipping the V1 contract over backfilling tests for complex SQL/Dapper interactions.
- **Recommendations:** Immediately backfill unit and contract tests for `DapperTenantRepository` and the `ArchLucid.Worker` background loops.
- **Status:** Fixable in V1.

### 2. Adoption Friction
- **Score:** 70
- **Weight:** 6
- **Weighted deficiency signal:** 180
- **Justification:** The requirement for customers to manually download, review, and execute `Get-ArchLucidAzurePackage.ps1` (Tier 1 Extractor) introduces significant friction. While it avoids requiring Azure credentials (which aids Security), it forces a manual, out-of-band workflow that requires explicit buyer security sign-off.
- **Tradeoffs:** Zero-credential access (Tier 1) vs. automated seamless ingestion (Tier 2).
- **Recommendations:** Ensure the Tier 1 extractor script is flawlessly documented and signed. Accelerate the Tier 2 (managed identity / Reader role) continuous mode for V1.x to remove the manual execution requirement.
- **Status:** Better suited for V1.1/v2 (Tier 2 automation).

### 3. AI/Agent Readiness
- **Score:** 85
- **Weight:** 8
- **Weighted deficiency signal:** 120
- **Justification:** The orchestration pipeline is deterministic, and LLM completions are tightly managed via Azure OpenAI. However, the lack of MCP (deferred to V1.1) limits agentic extensibility out of the box.
- **Tradeoffs:** Safety and bounded execution vs. open-ended agentic autonomy. The product intentionally restricts agents.
- **Recommendations:** Harden the `AgentOutputTraceQualityEvaluator` and `LlmCompletionAccountingClient`, both of which have notable test coverage gaps.
- **Status:** Fixable in V1.

### 4. Usability
- **Score:** 85
- **Weight:** 3
- **Weighted deficiency signal:** 45
- **Justification:** The operator UI, CLI, and pilot wizard offer a solid happy path. However, advanced capabilities require navigating "Show more links" and understanding the nuanced difference between Pilot and Operate layers.
- **Tradeoffs:** Progressive disclosure vs. discoverability.
- **Recommendations:** Refine the operator shell's error messaging during failed manifest commits to be highly actionable.
- **Status:** Fixable in V1.

### 5. Compliance Readiness
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Justification:** V1 relies on self-assessments and a durable SQL audit log. The lack of a CPA-issued SOC 2 report is an intentional V1 deferral, but it still limits the absolute compliance posture in the eyes of an enterprise.
- **Tradeoffs:** Capital expenditure on auditors vs. engineering velocity.
- **Recommendations:** Expand the `AuditEventTypes` coverage to ensure absolutely zero gaps in the `AUDIT_COVERAGE_MATRIX.md`, particularly for governance and advisory features.
- **Status:** Blocked on user input / post-V1.1 (CPA audit).

### 6. Interoperability
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Justification:** Strong integration with Jira/ServiceNow/Confluence, but general API interoperability requires consuming complex HTTP endpoints or relying on the CLI. Generic OIDC is supported, which is a major plus.
- **Tradeoffs:** Deep first-party integrations vs. generic webhooks.
- **Recommendations:** Document exact webhook payload schemas comprehensively so customers can build reliable custom consumers.
- **Status:** Fixable in V1.

### 7. Workflow Embeddedness
- **Score:** 90
- **Weight:** 3
- **Weighted deficiency signal:** 30
- **Justification:** Pre-commit governance gates and bidirectional sync for Jira/ServiceNow make ArchLucid highly embedded in existing ITSM workflows.
- **Tradeoffs:** High coupling to external ITSM state vs. isolated operation.
- **Recommendations:** Ensure the resilience of the ITSM outbound queues; failing to sync a ticket shouldn't fail a crucial architectural commit.
- **Status:** Fixable in V1.

### 8. Security
- **Score:** 90
- **Weight:** 3
- **Weighted deficiency signal:** 30
- **Justification:** Architecture invariants strictly prohibit public SMB, mandate private endpoints, and enforce row-level security. The Tier 1 extractor requires zero vendor access to the customer's cloud.
- **Tradeoffs:** Strict isolation (database-per-tenant) increases hosting costs but vastly improves security.
- **Recommendations:** Regularly run the documented STRIDE threat models against the newly added generic OIDC features.
- **Status:** Fixable in V1.

### 9. Proof-of-ROI Readiness
- **Score:** 85
- **Weight:** 5
- **Weighted deficiency signal:** 75 (Note: Ranked lower in urgency despite signal size because the raw score is relatively high, indicating a healthy baseline)
- **Justification:** The comparison replay cost estimators and integration with Azure Retail Prices provide excellent immediate visibility into ROI.
- **Tradeoffs:** Heuristic-based cost estimation vs. heavy deterministic execution.
- **Recommendations:** Expose the `ComparisonReplayCostEstimator` bands more prominently in the operator UI before a user clicks "Replay".
- **Status:** Fixable in V1.

### 10. Performance
- **Score:** 75
- **Weight:** 1
- **Weighted deficiency signal:** 25
- **Justification:** Redis is deferred to V2. Relying on in-memory caches for graph projections (`GraphSnapshotProjectionMemoryCache`) will cause memory pressure on single replicas during large graph traversals.
- **Tradeoffs:** Simplified V1 infrastructure vs. horizontal scalability.
- **Recommendations:** Profile the memory consumption of `GraphSnapshotSqlBulkCopy` and `FindingsSnapshotRelationalRead`.
- **Status:** Better suited for V1.1/v2 (Redis baseline).

### 11. Customer Self-Sufficiency
- **Score:** 75
- **Weight:** 1
- **Weighted deficiency signal:** 25
- **Justification:** Writing custom agent handlers requires diving into the .NET codebase. Without a plugin SDK, operators must fork or deploy custom builds.
- **Tradeoffs:** Tight architectural control vs. ecosystem extensibility.
- **Recommendations:** Publish the V1 GA custom handler documentation explicitly and ensure it provides copy-paste ready boilerplates.
- **Status:** Fixable in V1.

### 12. Commercial Packaging Readiness
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Justification:** Stripe live keys and Marketplace publication are deferred to V1.1. However, all the actual plumbing (test-mode Stripe, `BillingProductionSafetyRules`) is fully implemented.
- **Tradeoffs:** De-risking the launch vs. immediate self-serve revenue.
- **Recommendations:** Ensure the `BillingProductionSafetyRules` are strictly tested so the V1.1 flip is purely an environment variable change.
- **Status:** Blocked on user input (Owner-only flip).

### 13. Explainability
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Justification:** The knowledge graph and structured comparison deltas provide excellent traceability.
- **Tradeoffs:** High storage costs for granular traces vs. auditability.
- **Recommendations:** Ensure `ExplainabilityTrace` rendering in the UI handles deeply nested alternative paths cleanly.
- **Status:** Fixable in V1.

### 14. Stickiness
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** The durable audit log and governance policy packs make the product hard to rip out once embedded in a compliance workflow.
- **Tradeoffs:** Heavy governance features can alienate fast-moving pilot users.
- **Recommendations:** Ensure the "Pilot" path remains completely decoupled from the heavier "Operate" governance constraints.
- **Status:** Fixable in V1.

### 15. Observability
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** OpenTelemetry, Prometheus metrics, and the `IReplayDiagnosticsRecorder` ring buffer are well-implemented.
- **Tradeoffs:** Metric cardinality vs. granularity of agent traces.
- **Recommendations:** Ensure `ArchLucid.Worker` emits sufficient health metrics given its 0% test coverage.
- **Status:** Fixable in V1.

---

## Top 12 Most Important Weaknesses

1. **Persistence Layer Testing Vacuum:** 56% line coverage in the critical `ArchLucid.Persistence` layer is a severe risk to data integrity, especially for multi-tenant isolation (`DapperTenantRepository`).
2. **Background Orchestration Blindspot:** 0% line coverage in `ArchLucid.Worker` means long-running orchestrations are running without automated safety nets.
3. **Manual Extractor Friction:** Relying on a PowerShell script for Tier 1 Azure ingestion creates a massive procurement and security review hurdle for every new pilot.
4. **In-Memory Graph Projection Limits:** Relying solely on `GraphSnapshotProjectionMemoryCache` without Redis (deferred to V2) risks out-of-memory crashes on single replicas when processing massive architecture graphs.
5. **Api.Client Brittleness:** 18.75% coverage in `ArchLucid.Api.Client` means the primary programmatic entry point for automations is largely unverified.
6. **Agent Trace Accounting Risks:** Gaps in `LlmCompletionAccountingClient` testing could lead to inaccurate token billing and cost overruns.
7. **Custom Handler Complexity:** Extending ArchLucid requires compiling .NET code, severely limiting self-sufficiency for non-C# enterprise teams.
8. **ITSM Outbound Brittleness:** Failure handling for outbound Jira/ServiceNow syncing must be absolutely bulletproof to avoid blocking architectural commits.
9. **UI Export Generation Coverage:** Gaps in `MarkdownArchitectureAnalysisExportService` and `DocxExportService` threaten the reliability of the core Proof-of-ROI deliverable.
10. **Demo Seed Fragility:** `DemoSeedService` has massive uncovered blocks, risking broken trial environments.
11. **Rate Limiting Ambiguity:** Non-standard edge throttling on specific routes (`api/auth/*`) could expose the system to localized denial-of-service.
12. **Durable Audit Omissions:** Any unmapped edge case in the `AUDIT_COVERAGE_MATRIX.md` undermines the entire compliance value proposition.

---

## Top 6 Monetization Blockers

1. **Stripe/Marketplace Deferral:** The deliberate V1.1 deferral of live Stripe keys and the Azure Marketplace listing prevents immediate, unassisted self-serve revenue.
2. **Tier 1 Extractor Security Audits:** Buyers will stall purchases while their InfoSec teams manually audit `Get-ArchLucidAzurePackage.ps1` before allowing it to run against their Azure environments.
3. **Lack of CPA SOC 2:** While excluded from the headline score, enterprise procurement will still heavily scrutinize or block deals until the V1.1+ CPA attestation is secured.
4. **Opaque Trial to Paid Migration:** The lack of a documented `V1` -> `V1.1` migration path for trial tenants causes hesitation for pilots looking to convert.
5. **Token Accounting Accuracy:** If `LlmCompletionAccountingClient` fails under load (due to test gaps), it risks severe margin degradation on hosted SaaS.
6. **Design Partner Absence:** The lack of a signed design partner limits external validation and referenceability, dampening organic inbound interest.

---

## Top 6 Enterprise Adoption Blockers

1. **PowerShell Execution Mandate:** Mandating script execution in customer environments (Tier 1 Extractor) is an automatic red flag for enterprise cloud security teams.
2. **Custom Handler C# Requirement:** Enterprises relying on Python or Go for internal tooling will struggle to adopt and extend the agent handlers.
3. **Post-V1.1 SOC 2 Timeline:** Large enterprises often have rigid vendor compliance rules that prohibit deploying systems without an issued CPA SOC 2 report.
4. **Single-Region Lock-in:** Enterprises with strict data sovereignty requirements across multiple geographies will struggle with the default single-region SaaS posture.
5. **Atlassian/ServiceNow Sync Failures:** If the outbound ITSM webhooks fail or drop state, enterprise PMOs will reject the integration.
6. **RBAC Granularity:** While App Roles exist, the inability to map highly granular, resource-specific permissions out-of-the-box may frustrate strict zero-trust environments.

---

## Top 6 Engineering Risks

1. **DapperTenantRepository Data Leakage:** At 56% test coverage, any bug in the RLS or tenant routing logic could result in catastrophic cross-tenant data exposure.
2. **Worker Orchestration Halts:** 0% test coverage in `ArchLucid.Worker` introduces the risk of silent background job failures, hanging architecture runs indefinitely.
3. **OOM on Graph Projections:** The lack of a distributed graph cache (Redis) makes the API highly susceptible to Out-Of-Memory exceptions during large architecture replays.
4. **Database Migration Failures:** If DbUp migrations fail on massive tenant catalogs, the automated deployment pipeline will halt.
5. **Malformed Agent Proposals:** If the `AgentOutputTraceQualityEvaluator` misses hallucinations, the `DecisionEngineService` could merge corrupt architectural decisions into the golden manifest.
6. **Audit Log Desynchronization:** If the durable `dbo.AuditEvents` fails to write while the system commits a manifest, the non-repudiation guarantee of the platform is destroyed.

---

## Most Important Truth

**ArchLucid's foundational architecture and invariants are exceptionally well-designed, but the critical data access and background worker layers lack the automated test coverage necessary to guarantee data integrity and operational reliability under enterprise load.**

---

## Top Improvement Opportunities

### DEFERRED: CPA SOC 2 Attestation
- **Why it matters:** Critical for unblocking enterprise procurement.
- **Expected impact:** Unblocks enterprise deals.
- **Affected qualities:** Compliance Readiness, Adoption Friction.
- **Input needed:** I need confirmation on the target calendar date and the selection of the CPA firm.

### DEFERRED: Stripe Live Key Activation
- **Why it matters:** Unblocks self-serve revenue.
- **Expected impact:** Direct monetization.
- **Affected qualities:** Commercial Packaging Readiness.
- **Input needed:** I need you to securely rotate the Stripe webhook secrets and authorize the environment variable flip.

### DEFERRED: Marketplace Listing Publication
- **Why it matters:** Unblocks Azure-native procurement.
- **Expected impact:** Accelerates enterprise procurement via Azure commits.
- **Affected qualities:** Commercial Packaging Readiness, Adoption Friction.
- **Input needed:** I need you to confirm that Partner Center seller verification, tax profiles, and payout accounts are fully approved.

### DEFERRED: Tier 2 Azure Extractor (Managed Identity)
- **Why it matters:** Removes the PowerShell script execution friction.
- **Expected impact:** Massive reduction in security review time.
- **Affected qualities:** Adoption Friction.
- **Input needed:** I need a decision on whether this will be prioritized for V1.1 and the specific ARM roles you are willing to request.

### 1. Backfill `DapperTenantRepository` Tests
- **Status:** Complete — Batch 1.
- **Why it matters:** Prevents catastrophic cross-tenant data leaks.
- **Expected impact:** Directly improves Correctness (+5-8 pts) and Security (+1-2 pts). Weighted readiness impact: +0.6-0.9%.
- **Affected qualities:** Correctness, Security.
- **Actionable now:** Yes.
- **Prompt:**
```text
Please write comprehensive unit and integration tests for `ArchLucid.Persistence.Tenancy.DapperTenantRepository` in `ArchLucid.Persistence.Tests`. Ensure you cover all CRUD operations, explicitly validating that the `TenantId` isolation logic cannot be bypassed. Use `ArchitectureCommitTestSeed` where applicable. Do not change the implementation of `DapperTenantRepository` itself. Acceptance criteria: Code coverage for this class must exceed 90%.
```

### 2. Backfill `ArchLucid.Worker` Tests
- **Why it matters:** 0% coverage is unacceptable for the background orchestration engine.
- **Expected impact:** Directly improves Correctness (+3-5 pts) and Reliability. Weighted readiness impact: +0.4-0.6%.
- **Affected qualities:** Correctness, Workflow Embeddedness.
- **Actionable now:** Yes.
- **Prompt:**
```text
Please implement unit tests for the background services in `ArchLucid.Worker`, specifically targeting the `Program.cs` composition and any hosted services running within it. Use `Moq` to mock dependencies. Do not modify the actual worker logic. Acceptance criteria: The worker assembly must register > 60% coverage.
```

### 3. Fortify `GraphSnapshotSqlBulkCopy` Tests
- **Status:** Complete — Batch 1.
- **Why it matters:** Massive uncovered blocks here risk data corruption during complex graph ingestion.
- **Expected impact:** Directly improves Correctness (+2-4 pts) and Performance. Weighted readiness impact: +0.3-0.5%.
- **Affected qualities:** Correctness, Performance.
- **Actionable now:** Yes.
- **Prompt:**
```text
Please write SQL integration tests for `ArchLucid.Persistence.GraphSnapshots.GraphSnapshotSqlBulkCopy` in `ArchLucid.Persistence.Tests`. Verify that bulk edge and node insertions handle large payloads gracefully and rollback correctly on failure. Do not alter the bulk copy implementation.
```

### 4. Enhance `AgentOutputTraceQualityEvaluator` Tests
- **Status:** Complete — Batch 2.
- **Why it matters:** This component is the safeguard against LLM hallucinations corrupting the manifest.
- **Expected impact:** Directly improves AI/Agent Readiness (+3-5 pts) and Correctness. Weighted readiness impact: +0.4-0.7%.
- **Affected qualities:** AI/Agent Readiness, Correctness.
- **Actionable now:** Yes.
- **Prompt:**
```text
Please add exhaustive unit tests for `ArchLucid.AgentRuntime.Evaluation.AgentOutputTraceQualityEvaluator` in `ArchLucid.AgentRuntime.Tests`. Test edge cases involving malformed JSON, missing fields, and hallucinated relationships. Ensure coverage exceeds 95% for this class.
```

### 5. Secure `LlmCompletionAccountingClient` Tests
- **Status:** Complete — Batch 2.
- **Why it matters:** Gaps here risk severe financial inaccuracies in token billing.
- **Expected impact:** Directly improves Correctness (+2-3 pts) and Proof-of-ROI Readiness. Weighted readiness impact: +0.3-0.5%.
- **Affected qualities:** Correctness.
- **Actionable now:** Yes.
- **Prompt:**
```text
Please write unit tests for `ArchLucid.AgentRuntime.LlmCompletionAccountingClient`. Focus on testing circuit breakers, retry logic on transient Azure OpenAI failures, and accurate token tallying. Mock the external HTTP calls.
```

### 6. Harden `AzureExtractorIngestService` Tests
- **Why it matters:** This is the primary ingestion point for customer telemetry; it must be flawless.
- **Expected impact:** Directly improves Interoperability (+2-4 pts) and Correctness. Weighted readiness impact: +0.2-0.4%.
- **Affected qualities:** Interoperability, Correctness.
- **Actionable now:** Yes.
- **Prompt:**
```text
Please add unit and integration tests for `ArchLucid.Application.AzureExtractor.AzureExtractorIngestService`. Validate that it correctly parses, sanitizes, and rejects malformed `schemaVersion` ZIP files. Ensure it correctly links the extracted data to the associated run ID.
```

### 7. Fortify `MarkdownArchitectureAnalysisExportService`
- **Why it matters:** Exported artifacts are the primary tangible deliverable for executives.
- **Expected impact:** Directly improves Proof-of-ROI Readiness (+2-4 pts) and Usability. Weighted readiness impact: +0.2-0.4%.
- **Affected qualities:** Proof-of-ROI Readiness, Usability.
- **Actionable now:** Yes.
- **Prompt:**
```text
Please write unit tests for `ArchLucid.Application.Analysis.MarkdownArchitectureAnalysisExportService`. Ensure that short, executive, and detailed profiles render correctly and that markdown syntax is never malformed by missing data.
```

### 8. Fix `DemoSeedService` Test Gaps
- **Why it matters:** The demo seed is critical for trial success; it must never fail.
- **Expected impact:** Directly improves Usability (+2-3 pts) and Adoption Friction. Weighted readiness impact: +0.2-0.3%.
- **Affected qualities:** Usability, Adoption Friction.
- **Actionable now:** Yes.
- **Prompt:**
```text
Please create integration tests for `ArchLucid.Application.Bootstrap.DemoSeedService`. Verify that the demo seed generates a consistent, valid architecture run and does not violate any SQL foreign key constraints.
```

### 9. Improve `Api.Client` Coverage
- **Why it matters:** The client SDK must be highly reliable for automation.
- **Expected impact:** Directly improves Interoperability (+2-4 pts) and Customer Self-Sufficiency. Weighted readiness impact: +0.2-0.4%.
- **Affected qualities:** Interoperability, Customer Self-Sufficiency.
- **Actionable now:** Yes.
- **Prompt:**
```text
Please write unit tests for the generated types in `ArchLucid.Api.Client`, specifically focusing on `FileParameter` and serialization edge cases. Increase the assembly coverage to at least 70%.
```

### 10. Audit `AdminDiagnosticsService`
- **Why it matters:** Diagnostics are critical for troubleshooting production issues.
- **Expected impact:** Directly improves Observability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
- **Affected qualities:** Observability.
- **Actionable now:** Yes.
- **Prompt:**
```text
Please add unit tests for `ArchLucid.Api.Services.Admin.AdminDiagnosticsService`. Validate that it correctly aggregates outbox snapshots and handles `StorageProvider=InMemory` short-circuits gracefully.
```

### 11. Strengthen `ComparisonReplayCostEstimator` Visibility
- **Why it matters:** Users need to understand the cost of a replay before triggering it.
- **Expected impact:** Directly improves Usability (+2-3 pts) and Proof-of-ROI Readiness. Weighted readiness impact: +0.1-0.2%.
- **Affected qualities:** Usability, Proof-of-ROI Readiness.
- **Actionable now:** Yes.
- **Prompt:**
```text
Review `ArchLucid.Application.Runs.ComparisonReplayCostEstimator`. Add robust unit tests ensuring that `low`, `medium`, and `high` bands are accurately calculated based on payload size and comparison type. Do not change the calculation logic, just ensure it is heavily tested.
```

### 12. Test `AuthorityPipelineWorkProcessor`
- **Why it matters:** Core component of the background job processing.
- **Expected impact:** Directly improves Correctness (+2-3 pts). Weighted readiness impact: +0.2-0.3%.
- **Affected qualities:** Correctness.
- **Actionable now:** Yes.
- **Prompt:**
```text
Please add tests for `ArchLucid.Host.Core.Hosted.AuthorityPipelineWorkProcessor`. Mock the underlying queues and ensure that poison messages are correctly dead-lettered without crashing the processor.
```

### 13. Test `BackgroundJobQueueProcessorHostedService`
- **Why it matters:** Background job resilience.
- **Expected impact:** Directly improves Correctness (+2-3 pts). Weighted readiness impact: +0.2-0.3%.
- **Affected qualities:** Correctness.
- **Actionable now:** Yes.
- **Prompt:**
```text
Please implement unit tests for `ArchLucid.Host.Core.Jobs.BackgroundJobQueueProcessorHostedService`. Validate shutdown cancellation token handling and concurrent job execution limits.
```

### 14. Document Custom Handler Boilerplate
- **Why it matters:** fulfills the V1 GA extensibility documentation requirement.
- **Expected impact:** Directly improves Customer Self-Sufficiency (+5-8 pts). Weighted readiness impact: +0.2-0.3%.
- **Affected qualities:** Customer Self-Sufficiency.
- **Actionable now:** Yes.
- **Prompt:**
```text
Create a new markdown document at `docs/library/CUSTOM_AGENT_HANDLERS.md`. It must provide a complete, copy-pasteable C# boilerplate for registering a custom agent handler in `ArchLucid.Host.Composition`. Follow the exact patterns used by existing handlers. Do not invent new SDKs.
```

### 15. Enforce Webhook Delivery HMAC
- **Why it matters:** Prevents spoofing of outbound integration events.
- **Expected impact:** Directly improves Security (+2-3 pts). Weighted readiness impact: +0.1-0.2%.
- **Affected qualities:** Security.
- **Actionable now:** Yes.
- **Prompt:**
```text
Add unit tests verifying the `ArchLucidConfigurationRules.CollectErrors` logic that ensures `WebhookDelivery:UseHttpClient` fails startup in Production if `WebhookDelivery:HmacSha256SharedSecret` is missing.
```

### 16. Harden ITSM Outbound Synchronization
- **Why it matters:** Jira/ServiceNow sync failures must not bring down the coordinator.
- **Expected impact:** Directly improves Workflow Embeddedness (+2-3 pts). Weighted readiness impact: +0.1-0.2%.
- **Affected qualities:** Workflow Embeddedness.
- **Actionable now:** Yes.
- **Prompt:**
```text
Write integration tests for the `Integration.JiraIssueCreateSucceeded` and `Integration.ServiceNowIncidentCreateFailed` event handlers. Ensure that transient HTTP 500s from Atlassian/ServiceNow result in appropriate retries and eventual dead-lettering without losing the correlation.
```

### 17. Review `DocxExportService` Memory Usage
- **Why it matters:** Large DOCX exports can cause memory spikes.
- **Expected impact:** Directly improves Performance (+2-3 pts). Weighted readiness impact: +0.1-0.2%.
- **Affected qualities:** Performance.
- **Actionable now:** Yes.
- **Prompt:**
```text
Add unit tests for `ArchLucid.ArtifactSynthesis.Docx.DocxExportService` ensuring that large XML payload manipulations do not cause unbounded memory allocations. Use streams wherever possible.
```

### 18. Audit `FindingExplainabilityResult`
- **Why it matters:** Explanations must be deterministic and serializable.
- **Expected impact:** Directly improves Explainability (+2-3 pts). Weighted readiness impact: +0.1-0.2%.
- **Affected qualities:** Explainability.
- **Actionable now:** Yes.
- **Prompt:**
```text
Write tests for `ArchLucid.Contracts.Explanation.FindingExplainabilityResult`. Ensure that JSON serialization and deserialization of deeply nested alternative paths works flawlessly.
```

### 19. Validate `EffectiveGovernanceResolver`
- **Why it matters:** Governance policies must apply strictly without bypassing.
- **Expected impact:** Directly improves Stickiness (+2-3 pts) and Correctness. Weighted readiness impact: +0.1-0.2%.
- **Affected qualities:** Stickiness, Correctness.
- **Actionable now:** Yes.
- **Prompt:**
```text
Write exhaustive unit tests for `ArchLucid.Decisioning.Governance.Resolution.EffectiveGovernanceResolver`. Ensure that conflicting policies resolve deterministically according to documented precedence rules.
```

### 20. Test `DataConsistencyOrphanProbeExecutor`
- **Status:** Complete — Batch 1.
- **Why it matters:** Orphaned data costs money and degrades performance.
- **Expected impact:** Directly improves Performance (+1-2 pts) and Correctness. Weighted readiness impact: +0.1-0.2%.
- **Affected qualities:** Performance, Correctness.
- **Actionable now:** Yes.
- **Prompt:**
```text
Add unit tests for `ArchLucid.Host.Core.DataConsistency.DataConsistencyOrphanProbeExecutor`. Validate that it accurately identifies orphaned records without accidentally flagging active runs.
```

### 21. Verify `ArchLucidAuth:Authority` Generic OIDC
- **Why it matters:** A key V1 GA commitment.
- **Expected impact:** Directly improves Interoperability (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
- **Affected qualities:** Interoperability.
- **Actionable now:** Yes.
- **Prompt:**
```text
Write configuration tests ensuring that when `ArchLucidAuth:Authority` is set to a generic non-Entra OIDC provider, the JWT bearer middleware correctly bootstraps the JWKS discovery and maps `ArchLucidRoles`.
```

### 22. Audit `GraphNodeFactory`
- **Why it matters:** Graph integrity is the core of the analysis engine.
- **Expected impact:** Directly improves Correctness (+1-2 pts). Weighted readiness impact: +0.1-0.2%.
- **Affected qualities:** Correctness.
- **Actionable now:** Yes.
- **Prompt:**
```text
Add unit tests for `ArchLucid.KnowledgeGraph.GraphNodeFactory`. Ensure node instantiation strictly adheres to the type system and rejects invalid properties.
```

### 23. Test `DefaultGraphEdgeInferer`
- **Status:** Complete — Batch 2.
- **Why it matters:** Inferred relationships must be accurate to avoid hallucinated architecture diagrams.
- **Expected impact:** Directly improves Explainability (+2-3 pts). Weighted readiness impact: +0.1-0.2%.
- **Affected qualities:** Explainability.
- **Actionable now:** Yes.
- **Prompt:**
```text
Write unit tests for `ArchLucid.KnowledgeGraph.Inference.DefaultGraphEdgeInferer`. Test the inference of `CONTAINS` and `PROTECTS` edges based on typical infrastructure topologies.
```

### 24. Document Webhook Payload Schemas
- **Why it matters:** Enables custom downstream integrations.
- **Expected impact:** Directly improves Interoperability (+2-4 pts). Weighted readiness impact: +0.1-0.2%.
- **Affected qualities:** Interoperability.
- **Actionable now:** Yes.
- **Prompt:**
```text
Create `docs/integrations/WEBHOOK_SCHEMAS.md`. Document the exact JSON schema payloads for the primary `IntegrationEvent` types, focusing on `AuthorityRunCompleted` and `GovernanceApprovalRequested`. Provide curl examples for testing.
```

### 25. Harden `BuyerProofPackCommand`
- **Why it matters:** The CLI command for generating the procurement pack must be rock solid.
- **Expected impact:** Directly improves Compliance Readiness (+2-3 pts). Weighted readiness impact: +0.1-0.2%.
- **Affected qualities:** Compliance Readiness.
- **Actionable now:** Yes.
- **Prompt:**
```text
Add unit tests for `ArchLucid.Cli.Commands.BuyerProofPackCommand`. Ensure that the ZIP generation correctly incorporates all required markdown files and fails loudly if a canonical file is missing.
```

---

## Prompt Batching Guidance

To optimize context window usage and efficiency, execute the actionable prompts in the following batches:

- **Batch 1 (Core Persistence & Correctness):** **Complete.** Prompts 1, 3, 20. (Focuses strictly on `ArchLucid.Persistence` and related data consistency execution. Highly localized context).
- **Batch 2 (Agent & LLM Reliability):** **Complete.** Prompts 4, 5, 23. (Focuses on `ArchLucid.AgentRuntime` and Knowledge Graph inference).
- **Batch 3 (Background Orchestration):** Prompts 2, 12, 13. (Focuses strictly on `ArchLucid.Worker` and `ArchLucid.Host.Core.Jobs`).
- **Batch 4 (Integrations & Telemetry):** Prompts 6, 15, 16, 21. (Focuses on Azure Extractor, Webhooks, ITSM, and OIDC auth).
- **Batch 5 (Artifacts & Explainability):** Prompts 7, 11, 17, 18, 22. (Focuses on Export Services, Cost Estimators, and Explainability Contracts).
- **Batch 6 (Documentation & CLI):** Prompts 8, 9, 10, 14, 19, 24, 25. (Focuses on Demo Seed, CLI coverage, and generating Markdown documentation).

---

## Pending Questions for Later

### DEFERRED: CPA SOC 2 Attestation
- What is the precise calendar target for initiating the formal CPA SOC 2 Type I/II examination?

### DEFERRED: Stripe Live Key Activation
- Are there any pending tax or legal reviews blocking the rotation of the Stripe live webhook secret in the production environment?

### DEFERRED: Marketplace Listing Publication
- Has the Azure Partner Center seller verification process been fully completed and approved by Microsoft?

### DEFERRED: Tier 2 Azure Extractor (Managed Identity)
- Will the continuous pull mode (Tier 2) be formally prioritized for the upcoming V1.1 sprint, and if so, are we enforcing workload identity federation over client secrets?