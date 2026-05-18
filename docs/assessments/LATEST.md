> **Scope:** Independent, first-principles assessment of ArchLucid readiness.
> **Status:** current

# ArchLucid Assessment – (A) Headline Readiness: 88.19%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding explicitly deferred items (e.g., SOC 2 CPA attestation, third-party pen testing, MCP, live commerce un-hold, first **published** reference customer, **first-party** **Jira** / **ServiceNow** / **Confluence** / **Slack** managed connectors ([`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13–§2.15 → **V1.1**), **Microsoft Teams** / **CloudEvents webhooks** / **customer-operated recipes** as **buyer-contract** paths ([`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.8, §2.14, §3 → **V1.1**), and V1.1-scoped integration / ops collateral). Deferred items do not reduce this headline score.

## Executive Summary

### (A) Overall Headline Readiness (88.19%)
ArchLucid is a functionally complete V1 product with a highly rigorous architectural foundation (88.19% readiness). It successfully executes the core pilot loop and provides strong governance and traceability features. The system has robust AI/Agent readiness, strong correctness, and excellent interoperability. **Proof-of-ROI Readiness** and **Differentiability** are not reduced for absence of a **published** reference customer — that obligation is **V1.1** per [`docs/library/V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6b. **Workflow Embeddedness**, **Interoperability**, **Adoption Friction**, and **Supportability** are **not** reduced for absence of **first-party** **Jira** / **ServiceNow** / **Confluence** / **Slack**, **Microsoft Teams** webhook delivery, **CloudEvents** outbound webhooks, or **recipe** bridges (**V1.1** per [`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.8, §2.13–§2.15, §3) or for residual **V1.1** connector ops work: **`(A)`** treats the **V1** integration contract as **REST**, **CLI**, **operator UI**, **SCIM**, **Azure DevOps** / **GitHub** CI surfaces, and **§2.16+** HTTP paths — not Teams / webhook / recipe **buyer commitments**. The primary remaining gaps include observability follow-through (broad Loki alerting on structured logs and curated dashboards beyond the shipped policy pack assignment ruler rules), E2E test mock reliance, and cognitive load for new operators due to the large product surface.

### (B) Procurement/Market-Motion Realism
Enterprise procurement will face friction due to the lack of a CPA-issued SOC 2 Type II report and third-party penetration testing (both intentionally deferred). The reliance on a SOC 2 self-assessment and owner-conducted penetration testing is acceptable for early pilots but will require executive sponsorship to bypass standard vendor security gates. Automated tenant erasure is specified as actionable backlog for V2; until shipped, it is not scored as an `(A)` defect.

### Commercial Picture
The commercial posture is strongly aligned for a sales-led, service-led motion. Curated demo workspaces, default policy packs, and the ZIP-first baseline wizard accelerate Time-to-Value and Proof-of-ROI. A **published** reference customer + case study is a **V1.1** commercial milestone ([`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6b) and is **not** an `(A)` V1 gate. The deferred live commerce correctly prioritizes validated purchasing motions over premature self-serve availability.

### Enterprise Picture
ArchLucid provides strong enterprise integration points for **V1** through **REST**, **CLI**, **operator UI**, **SCIM**, **Azure DevOps** / **GitHub** PR and manifest decoration, and **§2.16+** surfaces; **Microsoft Teams**, **CloudEvents webhooks**, **customer-operated** recipes, and **first-party** **Jira**, **ServiceNow**, **Confluence**, and **Slack** are **V1.1 buyer-contract** paths per [`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.8, §2.13–§2.15, §3 (*Resolved 2026-05-18*). **`(A)`** does **not** lower headline readiness for **V1.1**-scoped connector / integration depth. Tenant isolation is robustly handled via database-per-tenant and RLS. SAML SP nearing-expiry email notifications, tenant-fair authority pipeline outbox dequeue, and configurable per-tenant rate limits enhance enterprise readiness.

### Engineering Picture
The engineering foundation is highly rigorous, with strong architectural invariants, NetArchTest boundary rules, and a durable audit trail. The agent orchestration pipeline is resilient, and producer-side OpenTelemetry GenAI instrumentation records token aggregates, latency, and deployment identifiers. Mock-heavy `ui-e2e-smoke` release gates keep testability breadth uneven vs full live route coverage.

---

## Weighted Quality Assessment

### 1. Cognitive Load
- **Score:** 82
- **Weight:** 1
- **Weighted deficiency signal:** 18
- **Why this score was assigned:** The product surface is large and complex, which can overwhelm new operators despite marketing-aligned vocabulary.
- **Key tradeoffs:** Breadth is valuable for expansion but increases first-session confusion.
- **Specific improvement recommendations:** Use telemetry to refine operator UI once patterns are stable. Add a UI warning when tenant baselines are missing to guide users.
- **Fixability:** Fixable in V1.

### 2. Explainability
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Why this score was assigned:** The system provides comparison replays and a knowledge graph, but default in-process projection cache caps multi-replica coherence.
- **Key tradeoffs:** Single-process projection simplifies deployment but limits scale.
- **Specific improvement recommendations:** Enhance documentation for single-process projection limitations.
- **Fixability:** Fixable in V1.

### 3. Observability
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Why this score was assigned:** OpenTelemetry and Serilog provide good visibility, and GenAI instrumentation is shipped. Policy pack assign/unassign Loki ruler rules and a curated Grafana dashboard ship in-repo (`infra/loki/archlucid-policy-pack-assignment-alerts.yml`, `infra/grafana/dashboard-archlucid-policy-packs.json`); broader Loki alerting on other structured-log surfaces and composite GenAI/cross-service SLO coherence are still missing.
- **Key tradeoffs:** Standard observability tools require operator expertise to configure.
- **Specific improvement recommendations:** Wire and tune the committed policy pack Loki rules and Grafana dashboard per environment; extend Loki alerting and dashboards to other structured-log surfaces.
- **Fixability:** Fixable in V1.

### 4. Performance
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Why this score was assigned:** Rate limiting is implemented, optional Redis cache is available, and health check endpoints exist.
- **Key tradeoffs:** Making Redis optional simplifies single-replica deployments but complicates scaled operations.
- **Specific improvement recommendations:** Implement anomaly detection for `evidenceBulkUpload`.
- **Fixability:** Fixable in V1.

### 5. Template and Accelerator Richness
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Why this score was assigned:** Three curated default policy packs provide a good starting point, and the Internal Policy Pack Hub is available.
- **Key tradeoffs:** The library is currently small for a broad enterprise audience.
- **Specific improvement recommendations:** Create a curated policy pack for Azure Well-Architected Framework (WAF) alignment.
- **Fixability:** Fixable in V1.

### 6. Executive Value Visibility
- **Score:** 85
- **Weight:** 4
- **Weighted deficiency signal:** 60
- **Why this score was assigned:** Architecture Review Report export with consultant whitelabeling provides immediate artifacts.
- **Key tradeoffs:** Executive value can become abstract if real tenant baselines are missing.
- **Specific improvement recommendations:** Add a UI warning when tenant baselines are missing on the executive dashboard.
- **Fixability:** Fixable in V1.

### 7. Adoption Friction
- **Score:** 88
- **Weight:** 6
- **Weighted deficiency signal:** 72
- **Why this score was assigned:** Operator shell labels are aligned with marketing vocabulary. **V1** leans on **REST**, **CLI**, **operator UI**, **ADO**/**GitHub** CI hooks, and **§2.16+** for workflow-shaped coverage; **Teams**, **webhooks**, **recipes**, and **first-party** **Jira** / **ServiceNow** / **Confluence** / **Slack** are **V1.1** ([`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.8, §2.13–§2.15, §3). Residual **V1.1** connector program work is **not** an `(A)` V1 deduction.
- **Key tradeoffs:** Governance authoring UX depth may still lag specialist policy-studio expectations.
- **Specific improvement recommendations:** Add a CLI command to test SAML SP configuration.
- **Fixability:** Fixable in V1.

### 8. Differentiability
- **Score:** 90
- **Weight:** 4
- **Weighted deficiency signal:** 40
- **Why this score was assigned:** Evidence-linked findings and governed decision trails differentiate the product from generic LLM wrappers. Absence of a **published** named reference customer is **V1.1** scope ([`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6b) and **does not** reduce this `(A)` score.
- **Key tradeoffs:** Broad proof surface helps defensibility but requires concise buyer framing.
- **Specific improvement recommendations:** Create a curated policy pack for GDPR compliance baseline.
- **Fixability:** Fixable in V1.

### 9. Decision Velocity
- **Score:** 86
- **Weight:** 2
- **Weighted deficiency signal:** 28
- **Why this score was assigned:** Speeds up architecture reviews by providing structured evidence and policy findings. Export to CSV for findings is available.
- **Key tradeoffs:** Requires operator trust in the AI's findings to truly accelerate decisions.
- **Specific improvement recommendations:** Implement a dashboard panel for compliance drift trend.
- **Fixability:** Fixable in V1.

### 10. Usability
- **Score:** 86
- **Weight:** 3
- **Weighted deficiency signal:** 42
- **Why this score was assigned:** The operator UI is functional. Bounded bulk evidence upload is supported. Soft delete for architecture projects is available with in-product recycle listing and restore.
- **Key tradeoffs:** The 30-file ceiling avoids abuse but may annoy heavy dossier pilots.
- **Specific improvement recommendations:** Surfacing purge-window / hard-delete timing in recycle bin copy and runbooks (in-product recycle list + restore shipped at `/settings/tenant/recycle-bin` via `GET /v1/tenant/workspaces/recycle-bin` and `POST /v1/tenant/workspaces/{workspaceId}/projects/{projectId}/restore`).
- **Fixability:** Fixable in V1.

### 11. Maintainability
- **Score:** 87
- **Weight:** 2
- **Weighted deficiency signal:** 26
- **Why this score was assigned:** Clean code architecture. NetArchTest boundary rules enforce layering.
- **Key tradeoffs:** The large surface area increases maintenance overhead.
- **Specific improvement recommendations:** Dependency Injection Analyzer NetArchTest rule — **shipped** (`ControllerAndHandlerDependencyInjectionArchitectureTests`; missing `IExecutiveSummaryService` / Confluence publisher registrations fixed in `ServiceCollectionExtensions.ApplicationPipeline.cs`).
- **Fixability:** Fixable in V1.

### 12. Time-to-Value
- **Score:** 88
- **Weight:** 7
- **Weighted deficiency signal:** 84
- **Why this score was assigned:** Curated demo workspaces, default policy packs, and a guided baseline collection wizard accelerate initial value.
- **Key tradeoffs:** Real-mode value requires tenant baseline data, which can take time to gather.
- **Specific improvement recommendations:** Automated SQL backup region verification on the executive dashboard — **shipped** (`ExecutiveSqlBackupRegionVerificationCard` on `/dashboard`; persisted artifact `archlucid-ui/public/sql-backup-region-verification.json` from `scripts/ci/write_sql_backup_verification_artifact.py` after `assert_sql_backup_regions.py` in CI/CD).
- **Fixability:** Fixable in V1.

### 13. Proof-of-ROI Readiness
- **Score:** 91
- **Weight:** 5
- **Weighted deficiency signal:** 45
- **Why this score was assigned:** The Azure extractor appends Retail Prices for App Service, SQL, Virtual Machines, and Storage Accounts. Azure Cost Management Actual-Spend ingestion is added. Lack of a **published** reference customer / measured **ROI** story is **V1.1** per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6b and is **excluded** from `(A)` deductions here.
- **Key tradeoffs:** Broader Cost Management / Advisor parity and estimate-vs-actual spend narratives remain manual for some SKUs.
- **Specific improvement recommendations:** Implement a dashboard panel for integration event outbox dead letters.
- **Fixability:** Fixable in V1.

### 14. Stickiness
- **Score:** 88
- **Weight:** 1
- **Weighted deficiency signal:** 12
- **Why this score was assigned:** Governance workflows and compliance drift tracking provide ongoing value. Telemetry for policy pack assignments is added.
- **Key tradeoffs:** Thin starter packs risk one-and-done pilots.
- **Specific improvement recommendations:** Wire the imported policy pack Grafana dashboard and Loki alert rules per environment.
- **Fixability:** Fixable in V1.

### 15. Workflow Embeddedness
- **Score:** 95
- **Weight:** 3
- **Weighted deficiency signal:** 15
- **Why this score was assigned:** **V1** workflow embedding is anchored on **GitHub/ADO** CI surfaces and **REST**/**CLI**/operator UI. **Teams**, **webhooks**, **recipes**, and **first-party** **Jira** / **ServiceNow** / **Confluence** / **Slack** are **V1.1** ([`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.8, §2.13–§2.15, §3). **`(A)`** does **not** deduct for **V1.1** connector program depth.
- **Key tradeoffs:** Custom integrations still require webhook handling when tenants bypass first-party connectors.
- **Specific improvement recommendations:** **V1.1:** first-party connectors, Teams/webhooks/recipes per [`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.8, §2.13–§2.15, §3.
- **Fixability:** **V1** REST/CLI/CI/**§2.16+**; **V1.1** Teams/webhooks/recipes + first-party ITSM/Slack/Confluence per scope.

### 16. Correctness
- **Score:** 88
- **Weight:** 8
- **Weighted deficiency signal:** 96
- **Why this score was assigned:** The execution model is solid. OpenAPI snapshot staleness check added to CI.
- **Key tradeoffs:** RLS migrations remain coordination-heavy.
- **Specific improvement recommendations:** Expand `live-api-*` matrices to cover more operator flows without mocks.
- **Fixability:** Fixable in V1.

### 17. AI/Agent Readiness
- **Score:** 88
- **Weight:** 8
- **Weighted deficiency signal:** 96
- **Why this score was assigned:** The system effectively uses Azure OpenAI with prompt redaction. Prometheus alert for LLM tenant budget approaching warn fraction is available.
- **Key tradeoffs:** Cost attribution still depends on exporters and retention.
- **Specific improvement recommendations:** Add a health check endpoint for the Azure OpenAI connection.
- **Fixability:** Fixable in V1.

### 18. Reliability
- **Score:** 88
- **Weight:** 2
- **Weighted deficiency signal:** 24
- **Why this score was assigned:** Tenant-fairness queuing in authority pipeline is added. Rate limiting for bulk evidence upload is implemented.
- **Key tradeoffs:** Application-level job retries and outbox semantics remain separate from SQL transient retries on worker paths.
- **Specific improvement recommendations:** Polly-backed SQL retries on ancillary background workers — **shipped** (`IBackgroundWorkerSqlConnectionFactory`, `SqlResilientOperationExecutor`, `SqlOpenResilienceDefaults.BuildSqlOperationRetryPipeline`; primary-catalog repos and `RegisterBackgroundWorkerSqlResilience` in `SqlStorageProviderRegistrar`; tests in `SqlResilientOperationExecutorTests`).
- **Fixability:** Fixable in V1.

### 19. Scalability
- **Score:** 88
- **Weight:** 1
- **Weighted deficiency signal:** 12
- **Why this score was assigned:** Scales well horizontally. Auto-scaling rules for worker pool exist.
- **Key tradeoffs:** Single-tenant worker pool exhaustion is still a risk.
- **Specific improvement recommendations:** Implement anomaly detection for `evidenceBulkUpload`.
- **Fixability:** Fixable in V1.

### 20. Supportability
- **Score:** 92
- **Weight:** 1
- **Weighted deficiency signal:** 8
- **Why this score was assigned:** Good logging, OpenTelemetry, and CLI diagnostics. Automated SAML cert expiry email notifications are added. **First-party** ITSM/Slack/Confluence, **Teams**/webhook/recipe buyer-contract depth (**V1.1** per §2.8, §2.13–§2.15, §3) is **not** an `(A)` V1 deduction.
- **Key tradeoffs:** New HTTP utilities must reuse auth headers.
- **Specific improvement recommendations:** Rate-limit 429 triage runbook shipped (`docs/runbooks/RATE_LIMIT_EXCEEDED.md` for `evidenceBulkUpload`; P2 index in `docs/runbooks/README.md`).
- **Fixability:** Fixable in V1.

### 21. Testability
- **Score:** 88
- **Weight:** 1
- **Weighted deficiency signal:** 12
- **Why this score was assigned:** Strong unit/integration tests. Live API smoke test suite added. Merged-line coverage floor raised to 75.
- **Key tradeoffs:** `ui-e2e-smoke` remains mock-forward.
- **Specific improvement recommendations:** Expand `live-api-*` matrices to cover more operator flows without mocks.
- **Fixability:** Fixable in V1.

### 22. Cost-Effectiveness
- **Score:** 88
- **Weight:** 1
- **Weighted deficiency signal:** 12
- **Why this score was assigned:** Azure cost extractor provides visibility. Azure VM and Storage Account Retail Prices and Actual-Spend ingestion are added.
- **Key tradeoffs:** Some manual estimation remains in broader Azure cost workflows.
- **Specific improvement recommendations:** Add export to CSV for audit logs to facilitate offline cost analysis.
- **Fixability:** Fixable in V1.

### 23. Interoperability
- **Score:** 94
- **Weight:** 2
- **Weighted deficiency signal:** 12
- **Why this score was assigned:** REST API, CLI, **operator UI**, SAML 2.0 SP, and OIDC provide strong **V1** interoperability. **CloudEvents webhooks**, **Microsoft Teams** chat-ops, **recipe** bridges, and **first-party** **Jira** / **ServiceNow** / **Confluence** / **Slack** are **V1.1** buyer-contract surfaces ([`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.8, §2.13–§2.15, §3); **`(A)`** does **not** penalize their absence for V1.
- **Key tradeoffs:** SAML SP adds dual auth-surface operational burden.
- **Specific improvement recommendations:** Create a runbook for SAML SP certificate rotation.
- **Fixability:** Fixable in V1.

---

## Top 12 Most Important Weaknesses

1. **Observability alerting gaps:** While Grafana dashboards and some Prometheus alerts exist, broader Loki alerting on structured logs (beyond the committed policy pack assignment rules in `infra/loki/archlucid-policy-pack-assignment-alerts.yml`) and composite GenAI/cross-service SLO coherence are missing.
2. **E2E test mock reliance:** `ui-e2e-smoke` relies on mocks, creating a coverage skew compared to `live-api-*` tests.
3. **Cognitive Load:** The product surface is large and complex, which can overwhelm new operators despite marketing-aligned vocabulary.
4. **Explainability of single-process projection limitations:** Default in-process projection cache caps multi-replica coherence, needing better documentation.
5. **Performance edge cases:** Making Redis optional simplifies single-replica deployments but complicates scaled operations, and rate limiting needs WAF-aligned quotas.
6. **Template and Accelerator Richness:** While 3 packs exist, the library is still relatively small for a broad enterprise audience.
7. **Executive Value Visibility without baselines:** Executive value can become abstract if real tenant baselines are missing.
8. **Background job transient fault handling:** Incomplete retry policies for SQL connections in background workers risk silent failures.
9. **Architecture project retention UX clarity:** Undo/restore is productized (`/settings/tenant/recycle-bin`, `POST /v1/tenant/workspaces/{workspaceId}/projects/{projectId}/restore`), but purge-window escalation and SLA-style messaging for operators remains uneven vs the retention worker.
10. **Policy pack assignment visibility (operator wiring):** Assign and archive paths emit structured logs; Loki ruler rules and a Grafana dashboard ship in-repo (`infra/loki/archlucid-policy-pack-assignment-alerts.yml`, `infra/grafana/dashboard-archlucid-policy-packs.json`); operators must import/bind Loki and tighten stream selectors per environment.
11. **Data residency diligence depth:** Buyers require verifiable proof that SQL topology and backups match their geography.
12. **SAML SP operational burden:** Managing certificate rotation and metadata drift adds operational overhead.

---

## Top 6 Monetization Blockers

1. **Lack of a published reference customer (`(B)` / V1.1):** Still dampens **buyer trust and cycle speed** in real GTM; tracked as **V1.1** in [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6b — **does not reduce `(A)` headline readiness**.
2. **Lack of self-serve transactability:** Stripe live keys and Marketplace publication are deferred, forcing a high-touch sales motion.
3. **Named productized offers packaging:** Velocity to cash depends on a buyable review SKU and SOW alignment.
4. **Thin starter packs:** Risk "one-and-done" pilots if tenants do not extend them.
5. **Executive Value Visibility without baselines:** Reduces the impact of the executive dashboard during pilots.
6. **Manual Azure cost estimations for non-standard SKUs:** Limits the platform's ability to automatically prove hard infrastructure savings.

---

## Top 6 Enterprise Adoption Blockers

1. **Absence of compliance attestations:** Lack of a CPA-issued SOC 2 Type II report causes friction in security reviews.
2. **Data residency diligence depth:** Buyers require verifiable proof that SQL topology and backups match their geography.
3. **SAML SP operational burden:** Managing certificate rotation and metadata drift for SAML SP adds operational overhead for enterprise IT.
4. **Automated tenant erasure:** Not a V1 headline blocker, but buyers may still request a productized erasure narrative (V2 backlog).
5. **Architecture project retention communication:** Soft-delete, retention purge, and in-product recycle bin + restore exist; buyer/operator narratives still need sharper hard-purge timeline and escalation guidance.
6. **Noisy neighbor posture in orchestration:** Buyers will diligence steady-state parallelism and multi-region fairness.

---

## Top 6 Engineering Risks

1. **E2E test mock reliance:** `ui-e2e-smoke` stays mock-forward, creating coverage skew unless `live-api-*` is expanded.
2. **LLM observability consumption gaps:** Operators still need SLO depth, alerting, and Loki correlation for day-2 operations.
3. **Background job transient fault handling:** Incomplete retry policies for SQL connections in background workers risk silent failures.
4. **Architecture project retention vs UX:** Deleted projects linger for the purge window—recycle restore is available in-product, but timeline/escalation clarity for hard purge remains a documentation and UX-strip gap.
5. **Single-tenant worker pool exhaustion risk:** Despite tenant-fairness queuing, heavy workloads from a single tenant could still impact others if not properly bounded.
6. **`evidenceBulkUpload` observability:** Anomaly detection and WAF-aligned quotas remain uneven for abusive tenants.

---

## Most Important Truth

ArchLucid is a functionally complete, highly rigorous V1 product ready for sales-led pilots, but its ability to scale commercially is bottlenecked by the need for deeper observability, broader E2E test coverage without mocks, and enterprise friction points like self-serve transactability and compliance attestations.

---

## Top Improvement Opportunities

### 1. DEFERRED: Commerce un-hold (Stripe live keys flipped + Marketplace listing published)
- **Why it matters:** Enables self-serve revenue and frictionless purchasing.
- **Expected impact:** Adoption Friction (+5 pts).
- **Affected qualities:** Adoption Friction.
- **Actionable:** DEFERRED
- **Needed from me:** Please provide the `sk_live_` Stripe keys and confirm the Marketplace offer is `Published`.

### 2. DEFERRED: PGP key drop for `security@archlucid.net`
- **Why it matters:** Fulfills coordinated disclosure requirements for security researchers.
- **Expected impact:** Supportability (+5 pts).
- **Affected qualities:** Supportability.
- **Actionable:** DEFERRED
- **Needed from me:** **Domain acquisition — confirmed (owner 2026-05-18).** Please provide or authorize generation of the **public** key block (`archlucid-ui/public/.well-known/pgp-key.txt`) and custodian/fingerprint for `SECURITY.md` + marketing `/security` in the same PR per [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6c.

### 3. COMPLETED: Loki alert rules for policy pack assignments
- **Why it matters:** Provides actionable alerts when policy packs are assigned or unassigned, improving observability.
- **Expected impact:** Observability (+10 pts), Stickiness (+5 pts).
- **Affected qualities:** Observability, Stickiness.
- **Actionable:** No — delivered as `infra/loki/archlucid-policy-pack-assignment-alerts.yml` (LogQL on logs from `PolicyPackAssignmentRepository` / `SanitizedLoggerInformationExtensions` EventId 3014–3015). Operators must mount/sync the file to Loki ruler or Grafana Alerting and tighten stream selectors per environment.
```text
Create Loki alert rules for policy pack assignments. [COMPLETED]
- Acceptance criteria: Alert rules trigger when a policy pack is assigned or unassigned, using the structured logs emitted by `PolicyPackAssignmentRepository`.
- Constraints: Use existing Loki configuration patterns.
- What not to change: Do not modify the application logging logic.
- Impact: Directly improves Observability (+8-10 pts) and Stickiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
- Deliverable: `infra/loki/archlucid-policy-pack-assignment-alerts.yml`
```

### 4. COMPLETED: Expand live API smoke for additional operator flows (no mocks)
- **Why it matters:** Reduces reliance on mocks and ensures real integration surfaces are tested.
- **Expected impact:** Testability (+15 pts), Correctness (+10 pts).
- **Affected qualities:** Testability, Correctness.
- **Actionable:** No — delivered in `archlucid-ui/e2e/live-api-smoke.spec.ts` (policy pack assignment + authority compare hydrated through `/compare`, both via `archlucid-ui/e2e/helpers/live-api-client.ts`, no `page.route` mocks); helper updates add optional tenant scope on `compareAuthorityRuns` and align `postReplayRunRaw` with POST `/v1/architecture/run/{runId}/replay`.
```text
Expand `archlucid-ui/e2e/live-api-smoke.spec.ts` to include additional operator flows (e.g., policy pack assignment, comparison replay) without using `page.route` mocks. [COMPLETED]
- Acceptance criteria: At least two new operator flows are covered in the live API smoke test suite.
- Constraints: Reuse existing `live-api-client` utilities.
- What not to change: Do not modify the application code.
- Impact: Directly improves Testability (+10-15 pts) and Correctness (+8-10 pts). Weighted readiness impact: +0.2-0.3%.
- Deliverable: `archlucid-ui/e2e/live-api-smoke.spec.ts` (operator flows); `archlucid-ui/e2e/helpers/live-api-client.ts` (optional tenant scope on `compareAuthorityRuns`; `postReplayRunRaw` targets POST `/v1/architecture/run/{runId}/replay`).
```

### 5. COMPLETED: In-product undo/restore UX for soft-deleted architecture projects
- **Why it matters:** Allows operators to recover accidentally deleted projects without backend intervention.
- **Expected impact:** Usability (+15 pts), Reliability (+5 pts).
- **Affected qualities:** Usability, Reliability.
- **Actionable:** No — delivered as `GET /v1/tenant/workspaces/recycle-bin` and `POST /v1/tenant/workspaces/{workspaceId}/projects/{projectId}/restore` (`TenantWorkspacesController`), persistence on `IArchitectureProjectRepository.ListSoftDeletedByTenantAsync` / `TryRestoreAsync` (`DapperArchitectureProjectRepository` / `InMemoryArchitectureProjectRepository`), audit `ArchitectureProjectRestored`, operator UI `/settings/tenant/recycle-bin` (`ProjectsRecycleBinPage`), nav + OpenAPI snapshot + generated clients/types aligned per `Http-Surface-Docs-And-Clients.mdc`. Restore rejects active workspace/name collisions (`409`).
```text
Add a "Restore" button to the UI for soft-deleted architecture projects and a corresponding `POST /v1/tenant/workspaces/.../projects/.../restore` endpoint. [COMPLETED]
- Acceptance criteria: Operators can view soft-deleted projects in a "Recycle Bin" view and restore them, clearing the `IsDeleted` flag.
- Constraints: Ensure restored projects do not violate unique constraints.
- What not to change: Do not modify the hard-purge background job.
- Impact: Directly improves Usability (+10-15 pts) and Reliability (+3-5 pts). Weighted readiness impact: +0.15-0.25%.
- Deliverable: `ArchLucid.Api/Controllers/Tenancy/TenantWorkspacesController.cs` (recycle + restore); `ArchLucid.Core/Tenancy/IArchitectureProjectRepository.cs` + `ArchLucid.Persistence/Tenancy/DapperArchitectureProjectRepository.cs` (+ in-memory parity); `archlucid-ui/.../settings/tenant/recycle-bin/` (`ProjectsRecycleBinPage`); `ArchLucid.Api.Tests/Contracts/openapi-v1.contract.snapshot.json` + `npm run generate:api-types`; `ArchLucid.Api.Client` regen.
```

### 6. COMPLETED: Create a runbook for handling rate limit exceeded errors
- **Why it matters:** Provides operators with clear steps to diagnose and mitigate 429 errors.
- **Expected impact:** Supportability (+10 pts), Cognitive Load (+5 pts).
- **Affected qualities:** Supportability, Cognitive Load.
- **Actionable:** No — delivered as `docs/runbooks/RATE_LIMIT_EXCEEDED.md` (`evidenceBulkUpload` policy on `POST …/evidence/bulk`): tenant identification (`tenant_id` / correlation / audit), effective limit inspection (`RateLimiting:EvidenceBulkUpload:*`, role multipliers), configuration tuning without code changes; 429 vs 400 file-count limit distinction; indexed in `docs/runbooks/README.md` (P2).
```text
Create a runbook `docs/runbooks/RATE_LIMIT_EXCEEDED.md` detailing how to handle 429 Too Many Requests errors, specifically for `evidenceBulkUpload`. [COMPLETED]
- Acceptance criteria: Runbook includes steps to identify the affected tenant, check current limits, and adjust configuration if necessary.
- Constraints: Follow existing runbook formatting guidelines.
- What not to change: Do not modify the rate limiting logic.
- Impact: Directly improves Supportability (+8-10 pts) and Cognitive Load (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
- Deliverable: `docs/runbooks/RATE_LIMIT_EXCEEDED.md`; `docs/runbooks/README.md` (P2 index row).
```

### 7. COMPLETED: Dependency Injection Analyzer NetArchTest rule
- **Why it matters:** Prevents DI configuration errors from causing runtime failures.
- **Expected impact:** Maintainability (+10 pts), Correctness (+5 pts).
- **Affected qualities:** Maintainability, Correctness.
- **Actionable:** No — delivered as `ArchLucid.Architecture.Tests/ControllerAndHandlerDependencyInjectionArchitectureTests.cs` with NetArchTest discovery (`ApiHostControllerAndHandlerDiscovery`) over `ArchLucid.Api` `ControllerBase` types and auth `*Handler` types; constructor-injected interfaces are checked against the simulator API composition built by `ApiSimulatorCompositionServiceCollectionBuilder`. CI fails on unregistered dependencies. Bugfix registrations added in `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.ApplicationPipeline.cs` for `IExecutiveSummaryService`, `IPublisherConnector` / `ConfluenceCloudPublisherConnector`, and `IConfluenceFirstValueReportPublisher` (surfaced by the new test).
```text
Add a NetArchTest rule to verify that all interfaces injected into controllers and handlers are registered in the DI container. [COMPLETED]
- Acceptance criteria: The test suite fails if an unregistered dependency is detected.
- Constraints: Use the existing NetArchTest framework.
- What not to change: Do not modify existing DI registrations unless fixing a bug.
- Impact: Directly improves Maintainability (+8-10 pts) and Correctness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
- Deliverable: `ArchLucid.Architecture.Tests/ControllerAndHandlerDependencyInjectionArchitectureTests.cs`; `ArchLucid.Architecture.Tests/DependencyInjection/*`; `ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.ApplicationPipeline.cs` (missing service registrations); `ArchLucid.Api/ArchLucid.Api.csproj` (`InternalsVisibleTo` for `ArchLucid.Architecture.Tests`).
```

### 8. COMPLETED: Add automated SQL backup region verification to the executive dashboard
- **Why it matters:** Provides executives with immediate visibility into data residency compliance.
- **Expected impact:** Executive Value Visibility (+5 pts).
- **Affected qualities:** Executive Value Visibility.
- **Actionable:** No — delivered as `ExecutiveSqlBackupRegionVerificationCard` on `/dashboard` (`ExecutiveRoiDashboardPageView`): green check + primary data region when `verified` is true, amber warning when false. Reads `archlucid-ui/public/sql-backup-region-verification.json` at build/SSR via `loadSqlBackupRegionVerification()`. Artifact is emitted by `scripts/ci/write_sql_backup_verification_artifact.py` (reuses `assert_sql_backup_regions.py` validation; assert script unchanged). CD regenerates the JSON after a passing Terraform plan guard; CI drift-checks against `scripts/ci/fixtures/tfplan-sql-backup-verified.sample.json`.
```text
Add a widget to the executive dashboard that displays the verified SQL backup region, reading from the artifact generated by `assert_sql_backup_regions.py`. [COMPLETED]
- Acceptance criteria: The dashboard shows a green checkmark and the region name if verified, or a warning if unverified.
- Constraints: Read the verification status from a persisted configuration or artifact.
- What not to change: Do not modify the Python verification script.
- Impact: Directly improves Executive Value Visibility (+3-5 pts). Weighted readiness impact: +0.15-0.25%.
- Deliverable: `scripts/ci/write_sql_backup_verification_artifact.py`; `archlucid-ui/public/sql-backup-region-verification.json`; `archlucid-ui/src/lib/sql-backup-region-verification.ts`; `archlucid-ui/src/app/(operator)/dashboard/_sections/ExecutiveSqlBackupRegionVerificationCard.tsx`; `.github/workflows/cd.yml` + `.github/workflows/ci.yml` (writer + drift check); `scripts/ci/fixtures/tfplan-sql-backup-verified.sample.json`.
```

### 9. COMPLETED: Curate Grafana/Loki dashboards keyed on policy pack assignment events
- **Why it matters:** Provides visual insights into policy pack adoption and usage trends.
- **Expected impact:** Observability (+10 pts), Stickiness (+5 pts).
- **Affected qualities:** Observability, Stickiness.
- **Actionable:** No — delivered as `infra/grafana/dashboard-archlucid-policy-packs.json` (Loki LogQL on assign/unassign logs from `PolicyPackAssignmentRepository` / `SanitizedLoggerInformationExtensions` EventId 3014–3015): panels for total assignments over time, top assigned packs, and assignment churn. Optional Terraform import via `infra/terraform-monitoring/grafana_dashboards.tf` when `grafana_terraform_dashboards_enabled`. Operators must bind `${datasource}` to Loki and tighten `${stream_labels}` per environment (same guidance as `infra/loki/archlucid-policy-pack-assignment-alerts.yml`).
```text
Create a Grafana dashboard `infra/grafana/dashboard-archlucid-policy-packs.json` to visualize policy pack assignments and unassignments using Loki logs. [COMPLETED]
- Acceptance criteria: Dashboard includes panels for total assignments over time, top assigned packs, and assignment churn.
- Constraints: Use existing Loki data sources.
- What not to change: Do not modify the application logging logic.
- Impact: Directly improves Observability (+8-10 pts) and Stickiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
- Deliverable: `infra/grafana/dashboard-archlucid-policy-packs.json`; `infra/terraform-monitoring/grafana_dashboards.tf` (`grafana_dashboard.policy_packs`).
```

### 10. COMPLETED: Add export to CSV for audit logs
- **Why it matters:** Facilitates offline analysis and compliance reporting for audit events.
- **Expected impact:** Usability (+5 pts).
- **Affected qualities:** Usability.
- **Actionable:** No — delivered as `GET /v1/audit/export/csv` on `AuditController` (`ArchLucid.Api/Controllers/Admin/AuditController.cs`); accepts the same optional filter params as the search endpoint (`eventType`, `fromUtc`, `toUtc`, `correlationId`, `actorUserId`, `runId`) plus `maxRows` clamped 1–10 000; always responds `text/csv` with `Content-Disposition: attachment`; uses `GetFilteredExportAsync`; requires `RequireAuditor` role; rate-limited under the `expensive` policy. Audit coverage matrix updated (`docs/library/AUDIT_COVERAGE_MATRIX.md`). Tests in `ArchLucid.Api.Tests/AuditExportCsvControllerTests.cs`. OpenAPI snapshot regeneration required before merge.
```text
Add a `GET /v1/audit/export/csv` endpoint to export audit logs as a CSV file. [COMPLETED]
- Acceptance criteria: The endpoint returns a well-formatted CSV containing audit event details, filtered by the same parameters as the search endpoint.
- Constraints: Ensure the endpoint is covered by the audit matrix.
- What not to change: Do not modify the existing JSON audit endpoints.
- Impact: Directly improves Usability (+3-5 pts). Weighted readiness impact: +0.15-0.25%.
```

### 11. COMPLETED: Implement Polly-backed SQL retries on remaining ancillary background workers
- **Why it matters:** Prevents silent failures due to transient database connectivity issues.
- **Expected impact:** Reliability (+15 pts), Correctness (+5 pts).
- **Affected qualities:** Reliability, Correctness.
- **Actionable:** No — ancillary primary-catalog SQL paths now use `IBackgroundWorkerSqlConnectionFactory` (Polly on open via `BackgroundWorkerResilientSqlConnectionFactory`) and `SqlResilientOperationExecutor` (full operation retry via `SqlOpenResilienceDefaults.BuildSqlOperationRetryPipeline` / `SqlTransientDetector`, configured from `Persistence:SqlOpenResilience`). Updated repos: weekly digest critical-findings summary, internal cross-tenant rollup/analytics/metrics, first-tenant funnel archival batch store, ITSM correlation/outbound settings, first-value report branding. SQL hosts register `DapperOutboxOperationalMetricsReader` for `OutboxOperationalMetricsHostedService`. Tests: `ArchLucid.Persistence.Tests/Connections/SqlResilientOperationExecutorTests.cs`.
```text
Identify all background workers interacting with SQL that lack Polly retry policies and implement `SqlTransientException` retries. [COMPLETED]
- Acceptance criteria: All identified workers use a standard Polly retry policy for SQL operations.
- Constraints: Use the existing `ArchLucid.Persistence` retry configurations.
- What not to change: Do not alter the business logic of the workers.
- Impact: Directly improves Reliability (+10-15 pts) and Correctness (+3-5 pts). Weighted readiness impact: +0.2-0.3%.
- Deliverable: `ArchLucid.Persistence/Connections/` (`IBackgroundWorkerSqlConnectionFactory`, `BackgroundWorkerResilientSqlConnectionFactory`, `SqlResilientOperationExecutor`); `SqlStorageProviderRegistrar.RegisterBackgroundWorkerSqlResilience`; updated analytics/weekly-digest/telemetry/integration/tenancy SQL repos listed above.
```

### 12. COMPLETED: Add a health check endpoint for the Azure OpenAI connection
- **Why it matters:** Verifies connectivity to the critical LLM infrastructure.
- **Expected impact:** Supportability (+10 pts), AI/Agent Readiness (+5 pts).
- **Affected qualities:** Supportability, AI/Agent Readiness.
- **Actionable:** No — `AzureOpenAiHealthCheck` registered as `openai` in `RegisterArchLucidHealthChecks` (`ArchLucid.Host.Composition/Startup/ServiceCollectionExtensions.DataHealthAndJobs.cs`); probes only when `AzureOpenAiExecutionProbePolicy.ShouldProbeConfiguredEndpoint` (Real mode, non-Echo client); uses bounded TCP connect via `AzureOpenAiEndpointConnectivitySocketProbe` (no chat/embedding calls — zero model quota). Surfaces on `/health`, `/health/ready`, and summary responses. Tests: `ArchLucid.Host.Core.Tests/Health/AzureOpenAiHealthCheckTests.cs`.
```text
Add a health check for the Azure OpenAI connection to `RegisterArchLucidHealthChecks`. [COMPLETED]
- Acceptance criteria: The `/health` endpoint includes an `openai` status, performing a lightweight ping to the Azure OpenAI endpoint.
- Constraints: Ensure the ping does not consume significant quota or incur high costs.
- What not to change: Do not modify the core LLM execution logic.
- Impact: Directly improves Supportability (+8-10 pts) and AI/Agent Readiness (+3-5 pts). Weighted readiness impact: +0.15-0.25%.
- Deliverable: `ArchLucid.Host.Core/Health/AzureOpenAiHealthCheck.cs`; registration in `ServiceCollectionExtensions.DataHealthAndJobs.cs`.
```

### 13. Create a curated policy pack for Azure Well-Architected Framework (WAF) alignment
- **Why it matters:** Provides immediate value for Azure customers looking to align with best practices.
- **Expected impact:** Template and Accelerator Richness (+15 pts), Time-to-Value (+10 pts).
- **Affected qualities:** Template and Accelerator Richness, Time-to-Value.
- **Actionable:** Yes
```text
Create a new curated policy pack `docs/samples/policy-packs/azure-waf-rules-v1.json` focused on Azure WAF alignment.
- Acceptance criteria: The pack is valid JSON matching the curated-rules schema and includes at least 10 WAF-aligned rules.
- Constraints: Ensure the rules map to data collected by the Azure extractor.
- What not to change: Do not modify the policy engine.
- Impact: Directly improves Template and Accelerator Richness (+10-15 pts) and Time-to-Value (+8-10 pts). Weighted readiness impact: +0.2-0.3%.
```

### 14. Add a UI warning when tenant baselines are missing on the executive dashboard
- **Why it matters:** Guides users to upload baselines to unlock the full value of the dashboard.
- **Expected impact:** Usability (+10 pts), Executive Value Visibility (+5 pts).
- **Affected qualities:** Usability, Executive Value Visibility.
- **Actionable:** Yes
```text
Add a warning banner to the executive dashboard if no baseline data (e.g., Azure extractor ZIP) has been uploaded for the tenant.
- Acceptance criteria: The banner is visible and links to the baseline upload wizard.
- Constraints: Check for the existence of baseline artifacts in the tenant's workspace.
- What not to change: Do not modify the dashboard's analytical widgets.
- Impact: Directly improves Usability (+8-10 pts) and Executive Value Visibility (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 15. Implement anomaly detection for `evidenceBulkUpload`
- **Why it matters:** Protects the system from abusive or anomalous bulk upload patterns.
- **Expected impact:** Reliability (+10 pts), Scalability (+5 pts).
- **Affected qualities:** Reliability, Scalability.
- **Actionable:** Yes
```text
Add anomaly detection logic to the `EvidenceBulkUploadController` to flag and temporarily throttle tenants with highly unusual upload patterns (e.g., sudden spikes).
- Acceptance criteria: The system logs an anomaly warning and applies a stricter rate limit if an anomaly is detected.
- Constraints: Use standard statistical methods or existing rate-limiting extensions.
- What not to change: Do not modify the base 30-file ceiling.
- Impact: Directly improves Reliability (+8-10 pts) and Scalability (+3-5 pts). Weighted readiness impact: +0.15-0.25%.
```

### 16. Add a CLI command to test SAML SP configuration
- **Why it matters:** Simplifies the setup and troubleshooting of SAML SP integrations.
- **Expected impact:** Adoption Friction (+10 pts), Supportability (+5 pts).
- **Affected qualities:** Adoption Friction, Supportability.
- **Actionable:** Yes
```text
Add a command `archlucid saml test-config` to the CLI to validate the SAML SP configuration (e.g., metadata URL, certificate validity).
- Acceptance criteria: The command outputs a clear pass/fail status for each configuration component.
- Constraints: Do not perform a full authentication flow, only configuration validation.
- What not to change: Do not modify the SAML authentication middleware.
- Impact: Directly improves Adoption Friction (+8-10 pts) and Supportability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 17. Create a runbook for SAML SP certificate rotation
- **Why it matters:** Provides clear instructions for operators to rotate expiring certificates.
- **Expected impact:** Supportability (+10 pts), Maintainability (+5 pts).
- **Affected qualities:** Supportability, Maintainability.
- **Actionable:** Yes
```text
Create a runbook `docs/runbooks/SAML_CERT_ROTATION.md` detailing the steps to rotate the SAML SP certificate without downtime.
- Acceptance criteria: Runbook includes steps for generating a new cert, updating configuration, and coordinating with the IdP.
- Constraints: Follow existing runbook formatting guidelines.
- What not to change: Do not modify the SAML authentication logic.
- Impact: Directly improves Supportability (+8-10 pts) and Maintainability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 18. Implement a dashboard panel for integration event outbox dead letters
- **Why it matters:** Provides visual visibility into dead-letter queues, complementing the existing alert.
- **Expected impact:** Observability (+10 pts), Reliability (+5 pts).
- **Affected qualities:** Observability, Reliability.
- **Actionable:** Yes
```text
Add a panel to an existing operational Grafana dashboard to visualize the `archlucid_integration_event_outbox_dead_letter` gauge.
- Acceptance criteria: The panel clearly shows the dead-letter count over time.
- Constraints: Use existing Prometheus data sources.
- What not to change: Do not modify the metric emission logic.
- Impact: Directly improves Observability (+8-10 pts) and Reliability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 19. Add a UI component to display the current LLM budget utilization fraction
- **Why it matters:** Gives operators real-time visibility into their LLM budget usage directly in the UI.
- **Expected impact:** Usability (+10 pts), Cost-Effectiveness (+5 pts).
- **Affected qualities:** Usability, Cost-Effectiveness.
- **Actionable:** Yes
```text
Add a progress bar or gauge to the operator UI (e.g., in the settings or dashboard) showing the current LLM budget utilization fraction.
- Acceptance criteria: The component reads from an appropriate API endpoint and displays the fraction visually, turning yellow/red near the warn fraction.
- Constraints: Ensure the API endpoint used is performant and cached.
- What not to change: Do not modify the backend budget calculation logic.
- Impact: Directly improves Usability (+8-10 pts) and Cost-Effectiveness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 20. Create a curated policy pack for GDPR compliance baseline
- **Why it matters:** Helps European and global customers quickly assess GDPR readiness.
- **Expected impact:** Template and Accelerator Richness (+10 pts).
- **Affected qualities:** Template and Accelerator Richness.
- **Actionable:** Yes
```text
Create a new curated policy pack `docs/samples/policy-packs/gdpr-baseline-rules-v1.json` focused on GDPR compliance (e.g., data encryption, region constraints).
- Acceptance criteria: The pack is valid JSON matching the curated-rules schema and includes at least 5 GDPR-aligned rules.
- Constraints: Ensure the rules map to data collected by the Azure extractor.
- What not to change: Do not modify the policy engine.
- Impact: Directly improves Template and Accelerator Richness (+8-10 pts). Weighted readiness impact: +0.15-0.25%.
```

### 21. Implement a CLI command to export the knowledge graph to GraphML
- **Why it matters:** Allows advanced users to analyze the knowledge graph in external tools like Gephi.
- **Expected impact:** Interoperability (+10 pts), Explainability (+5 pts).
- **Affected qualities:** Interoperability, Explainability.
- **Actionable:** Yes
```text
Add a command `archlucid graph export --format graphml` to the CLI to export the knowledge graph for a specific run.
- Acceptance criteria: The command outputs a valid GraphML XML file representing the nodes and edges.
- Constraints: Use standard GraphML schema.
- What not to change: Do not modify the internal graph representation.
- Impact: Directly improves Interoperability (+8-10 pts) and Explainability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 22. Implement a dashboard panel for compliance drift trend
- **Why it matters:** Provides visual visibility into how compliance is changing over time.
- **Expected impact:** Executive Value Visibility (+10 pts), Stickiness (+5 pts).
- **Affected qualities:** Executive Value Visibility, Stickiness.
- **Actionable:** Yes
```text
Add a panel to the executive dashboard to visualize the compliance drift trend over the last 30 days.
- Acceptance criteria: The panel clearly shows the trend of open vs. resolved findings.
- Constraints: Read from existing aggregated data or perform an efficient query.
- What not to change: Do not modify the underlying findings data model.
- Impact: Directly improves Executive Value Visibility (+8-10 pts) and Stickiness (+3-5 pts). Weighted readiness impact: +0.15-0.25%.
```

### 23. Add operator-facing documentation for projection cache and multi-replica limitations
- **Why it matters:** Default in-process projection behavior is easy to misunderstand when scaling to multiple replicas; explicit help reduces **Explainability** and **Cognitive Load** gaps called out in the Top Weaknesses list.
- **Expected impact:** Explainability (+10 pts), Cognitive Load (+5 pts).
- **Affected qualities:** Explainability, Cognitive Load.
- **Actionable:** Yes
```text
Add an operator-facing doc (e.g. `docs/operations/PROJECTION_CACHE_AND_REPLICAS.md`) and link it from the operator UI settings or internal help: explain when in-process projection is sufficient, when Redis/shared cache is required, and how to validate coherence across replicas.
- Acceptance criteria: Doc is linked from at least one in-product “learn more” surface; mentions multi-replica footguns in plain language.
- Constraints: Stay aligned with shipped configuration flags and existing `Explainability`/architecture notes — do not invent new product promises.
- What not to change: Do not change projection engine behavior in the same change set unless a defect is found.
- Impact: Directly improves Explainability (+8-10 pts) and Cognitive Load (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 24. Add automated tests that reject inbound webhooks with invalid HMAC signatures
- **Why it matters:** CloudEvents subscribers must not accept **forged** deliveries; contract tests prevent regressions in verification middleware.
- **Expected impact:** Correctness (+10 pts), Testability (+8 pts).
- **Affected qualities:** Correctness, Testability.
- **Actionable:** Yes
```text
Add Core/API tests that POST representative webhook payloads with missing, wrong, and well-formed `X-ArchLucid-Webhook-Signature` values and assert 401/400 (per contract) — reuse `INTEGRATION_EVENTS_AND_WEBHOOKS.md` canonical examples.
- Acceptance criteria: At least three negative cases + one positive case; no live vendor calls.
- Constraints: Use existing test harness patterns; keep secrets out of tests.
- What not to change: Do not weaken production verification logic to make tests pass.
- Impact: Directly improves Correctness (+8-10 pts) and Testability (+5-8 pts). Weighted readiness impact: +0.15-0.25%.
```

### 25. Add Grafana panel for GenAI request latency (p95) from existing OTel GenAI metrics
- **Why it matters:** Operators still need **SLO depth** tying LLM spend to latency; complements token metrics already emitted.
- **Expected impact:** Observability (+10 pts), AI/Agent Readiness (+5 pts).
- **Affected qualities:** Observability, AI/Agent Readiness.
- **Actionable:** Yes
```text
Extend `infra/grafana/` dashboards (or add a panel to an existing operational dashboard) charting p95 GenAI completion latency from OpenTelemetry GenAI metrics already produced by the host — document the PromQL/Loki source in the dashboard annotation.
- Acceptance criteria: Panel shows p95 latency over 24h with tenant or deployment label where available.
- Constraints: Do not add new custom metrics unless an existing series is truly absent — prefer `grep`/dashboard reuse from current exporters.
- What not to change: Do not change LLM call paths; dashboard-only deliverable.
- Impact: Directly improves Observability (+8-10 pts) and AI/Agent Readiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

---

## Prompt Batching Guidance

To optimize context window usage and cost-effectiveness, batch the actionable prompts as follows:

- **Batch 1 (Observability & Dashboards):** 3, 9, 18, 22, 25
- **Batch 2 (UI & UX Enhancements):** 5, 8, 14, 19, 23
- **Batch 3 (Reliability & Health Checks):** 15 *(12 completed)*
- **Batch 4 (CLI & Export Features):** 10, 16, 21
- **Batch 5 (Policy Packs & Runbooks):** 6, 13, 17, 20
- **Batch 6 (Testing & Code Quality):** 4, 7, 24

---

## Pending Questions for Later

### DEFERRED: Commerce un-hold (Stripe live keys flipped + Marketplace listing published)
- What are the `sk_live_` Stripe keys and is the Marketplace offer `Published`?

### V1.1 / DEFERRED: Publish first named reference customer
- What is the customer name, do we have logo permission, and what is the case study text?

### V1.1 / DEFERRED: First-party Jira / ServiceNow / Confluence / Slack connector program
- What **V1.1** milestone anchors shipping per [`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13–§2.15 (*Resolved 2026-05-18*) — and does **P10** (ServiceNow developer instance) block validation calendar?

### DEFERRED: PGP key drop for `security@archlucid.net`
- Domain acquisition is **confirmed** (2026-05-18). What is the **public** key material (or approval to generate per [`docs/security/PGP_KEY_GENERATION_RECIPE.md`](../security/PGP_KEY_GENERATION_RECIPE.md)), and who is named custodian for rotation?
