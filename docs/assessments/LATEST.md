> **Scope:** Independent, first-principles assessment of ArchLucid readiness.
> **Status:** current

# ArchLucid Assessment – (A) Headline Readiness: 84.03%

This score represents the `(A)` headline readiness per `Assessment-Scope-V1_1.mdc`, excluding explicitly deferred items (e.g., SOC 2 CPA attestation, third-party pen testing, MCP, live commerce un-hold).

## Executive Summary

### (A) Overall Headline Readiness
ArchLucid is a functionally complete V1 product with a solid architectural foundation (84.03% readiness). It successfully executes the core pilot loop (request → execute → commit → manifest) and provides strong governance and traceability features. The integration of native SAML 2.0 SP, curated default policy packs, and consultant whitelabeling significantly strengthens the V1 GA offering. The primary remaining gaps are in observability (LLM tracing), test automation for new integrations, and cross-tenant analytics.

### (B) Procurement/Market-Motion Realism
Enterprise procurement will face friction due to the lack of a CPA-issued SOC 2 Type II report and third-party penetration testing (both intentionally deferred). The reliance on a SOC 2 self-assessment and owner-conducted penetration testing is acceptable for early pilots but will require executive sponsorship to bypass standard vendor security gates. The lack of automated tenant data deletion (GDPR/CCPA) will also trigger privacy reviews.

### Commercial Picture
The commercial posture is strongly aligned for a sales-led, service-led motion. The inclusion of consultant whitelabeling on architecture review exports enables boutique consulting firms to use ArchLucid as a delivery engine. Curated demo workspaces and default policy packs (AI governance + security baseline) accelerate Time-to-Value and Proof-of-ROI. The deferred live commerce (Stripe/Marketplace) correctly prioritizes validated purchasing motions over premature self-serve availability.

### Enterprise Picture
ArchLucid provides strong enterprise integration points, including Jira, ServiceNow, Slack, and Confluence. Tenant isolation is robustly handled via database-per-tenant and RLS. However, the lack of a visual custom rule authoring UI means enterprise evaluators must rely on raw code or JSON to extend policy packs, increasing adoption friction for non-developer architects. 

### Engineering Picture
The engineering foundation is highly rigorous, with strong architectural invariants, NetArchTest boundary rules, and a durable audit trail. The agent orchestration pipeline is resilient, though it lacks explicit OpenTelemetry tracing for LLM token usage and latency. The heavy reliance on mocked `/api/proxy` in `ui-e2e-smoke` remains a testability risk, though the golden path is covered by live API specs.

---

## Weighted Quality Assessment

### 1. Correctness
- **Score:** 85
- **Weight:** 8
- **Weighted deficiency signal:** 120
- **Justification:** The execution model is solid, incorporating the `ManifestSuperseded` durable path. The system correctly merges agent results into versioned manifests.
- **Tradeoffs:** RLS migrations remain coordination-heavy.
- **Improvement recommendations:** Track `108` replay notes during catalog migrations to provide visibility into lag.

### 2. AI/Agent Readiness
- **Score:** 85
- **Weight:** 8
- **Weighted deficiency signal:** 120
- **Justification:** The system effectively uses Azure OpenAI with prompt redaction, execution traces, and a well-tested authority pipeline.
- **Tradeoffs:** Missing explicit LLM tracing (tokens/latency) limits cost attribution and debugging at scale.
- **Improvement recommendations:** Add explicit OpenTelemetry tracing for LLM API calls.

### 3. Time-to-Value
- **Score:** 85
- **Weight:** 7
- **Weighted deficiency signal:** 105
- **Justification:** Curated demo workspaces and default policy packs accelerate initial value. The Azure extractor is customer-controlled and easy to run.
- **Tradeoffs:** Real-mode value requires tenant baseline data, which can take time to gather.
- **Improvement recommendations:** Add a guided baseline collection wizard to the onboarding flow.

### 4. Proof-of-ROI Readiness
- **Score:** 80
- **Weight:** 5
- **Weighted deficiency signal:** 100
- **Justification:** The Azure extractor provides cost data, and the comparison replay cost estimator is useful. However, the lack of cross-tenant analytics limits portfolio-wide executive proof.
- **Tradeoffs:** Tenant isolation (database-per-tenant) makes cross-tenant analytics harder to implement securely.
- **Improvement recommendations:** Implement cross-tenant analytics for portfolio-wide insights.

### 5. Adoption Friction
- **Score:** 85
- **Weight:** 6
- **Weighted deficiency signal:** 90
- **Justification:** Operator shell labels are aligned with marketing vocabulary (Capture, Evidence, Review). Integrations with Jira, ServiceNow, Slack, and Confluence reduce workflow disruption.
- **Tradeoffs:** The lack of a visual custom rule authoring UI increases friction for non-developer architects.
- **Improvement recommendations:** Build a visual custom rule authoring UI for policy packs.

### 6. Usability
- **Score:** 85
- **Weight:** 3
- **Weighted deficiency signal:** 45
- **Justification:** The operator UI is functional and uses marketing-aligned vocabulary. Bounded bulk evidence upload (≤30 files) is supported. Finding confidence is already surfaced via `FindingConfidenceBadge` (evaluation bucket + trace completeness) on detail, explainability, and governance queue surfaces.
- **Tradeoffs:** The 30-file ceiling avoids abuse but may annoy heavy dossier pilots until V1.1. Run-scoped finding **lists** still push operators to open detail for rationale and evidence context.
- **Improvement recommendations:** Add optional compact rationale or primary evidence link on run-scoped findings list rows to reduce drill-down churn.

### 7. Executive Value Visibility
- **Score:** 85
- **Weight:** 4
- **Weighted deficiency signal:** 60
- **Justification:** Architecture Review Report export (DOCX/PDF) with consultant whitelabeling provides immediate, tangible executive artifacts.
- **Tradeoffs:** Executive value can become abstract if real tenant baselines are missing.
- **Improvement recommendations:** Add a 'Missing Baseline' warning to the executive dashboard.

### 8. Differentiability
- **Score:** 85
- **Weight:** 4
- **Weighted deficiency signal:** 60
- **Justification:** Evidence-linked findings and governed decision trails differentiate the product from generic LLM wrappers.
- **Tradeoffs:** Broad proof surface helps defensibility but requires concise buyer framing.
- **Improvement recommendations:** Develop an internal "Policy Pack Hub" for sharing custom policies.

### 9. Workflow Embeddedness
- **Score:** 85
- **Weight:** 3
- **Weighted deficiency signal:** 45
- **Justification:** Inclusion of first-party ITSM connectors (Jira, ServiceNow) and Slack/Confluence integrations in V1 GA is a strong positive.
- **Tradeoffs:** Building first-party connectors takes resources away from core platform features.
- **Improvement recommendations:** Implement bi-directional ServiceNow status sync.

### 10. Compliance Readiness
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Justification:** A durable audit trail exists, and the SOC 2 self-assessment is complete. RLS provides tenant isolation.
- **Tradeoffs:** Lack of automated tenant data deletion (GDPR/CCPA) causes friction in privacy reviews.
- **Improvement recommendations:** Implement automated tenant data deletion (GDPR/CCPA "right to be forgotten").

### 11. Decision Velocity
- **Score:** 83
- **Weight:** 2
- **Weighted deficiency signal:** 34
- **Justification:** Speeds up architecture reviews by providing structured evidence and policy findings. Coarse confidence badges and explainability tables are already shipped for trust signals.
- **Tradeoffs:** Requires operator trust in the AI's findings to truly accelerate decisions. List-level density still hides graph/evidence entry points until drill-down.
- **Improvement recommendations:** Add one-click navigation from finding list rows to the knowledge graph node or explanation panel when `RelatedNodeIds` or trace targets exist.

### 12. Commercial Packaging Readiness
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Justification:** Sales-led pilot ready. Trial funnel tested in Stripe TEST mode. Consultant whitelabeling improves resale positioning.
- **Tradeoffs:** Deferring live commerce delays self-serve revenue but allows for a controlled rollout.
- **Improvement recommendations:** Extend `ui-e2e-live` Playwright specs to cover the consultant whitelabel export flow.

### 13. Reliability
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Justification:** The `AuthorityRunOrchestrator` handles long-running analysis with retry and queuing.
- **Tradeoffs:** Background workers and asynchronous jobs may lack comprehensive retry policies for transient SQL faults.
- **Improvement recommendations:** Audit and update background jobs to ensure Polly-based retry policies are uniformly applied.

### 14. Maintainability
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Justification:** Clean code architecture. NetArchTest boundary rules enforce layering.
- **Tradeoffs:** The large surface area increases maintenance overhead.
- **Improvement recommendations:** Add at least three new architecture boundary rules in `ArchLucid.Architecture.Tests`.

### 15. Explainability
- **Score:** 85
- **Weight:** 2
- **Weighted deficiency signal:** 30
- **Justification:** The system provides comparison replays and a knowledge graph, offering good visibility into architectural decisions.
- **Tradeoffs:** Default in-process projection cache caps multi-replica coherence.
- **Improvement recommendations:** Enhance documentation for single-process projection limitations.

### 16. Observability
- **Score:** 75
- **Weight:** 1
- **Weighted deficiency signal:** 25
- **Justification:** OpenTelemetry and Serilog provide good visibility, but explicit LLM tracing is missing.
- **Tradeoffs:** Standard observability tools require operator expertise to configure.
- **Improvement recommendations:** Add explicit OpenTelemetry tracing for LLM API calls.

### 17. Performance
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Rate limiting is implemented. Optional Redis cache is available.
- **Tradeoffs:** Making Redis optional simplifies single-replica deployments but complicates scaled operations.
- **Improvement recommendations:** Add dashboards and alerting in Grafana for wait times and dead letters.

### 18. Stickiness
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Governance workflows and compliance drift tracking provide ongoing value.
- **Tradeoffs:** Thin starter packs risk one-and-done pilots unless tenants customize them.
- **Improvement recommendations:** Enhance the Azure extractor script to collect Azure Policy compliance states.

### 19. Template and Accelerator Richness
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Two curated default policy packs (AI governance + security baseline) provide a good starting point.
- **Tradeoffs:** The library is currently small, shifting burden to credible authoring by the tenant.
- **Improvement recommendations:** Develop an internal "Policy Pack Hub" for sharing custom policies.

### 20. Testability
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Strong unit/integration tests. `ui-e2e-live` covers the golden path.
- **Tradeoffs:** Default `ui-e2e-smoke` remains mock-heavy, relying on `/api/proxy`.
- **Improvement recommendations:** Add Playwright smoke tests for new integrations (Jira, Slack, Confluence).

### 21. Cognitive Load
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Marketing-aligned vocabulary helps, but the product surface is large for a first-pilot motion.
- **Tradeoffs:** Breadth is valuable for expansion but increases first-session confusion.
- **Improvement recommendations:** Add explicit application-level logging to the findings list API endpoints to evaluate read-access patterns and simplify the UI.

### 22. Cost-Effectiveness
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Azure cost extractor provides visibility. Comparison replay cost estimation uses granular payload heuristics.
- **Tradeoffs:** Some manual estimation remains in broader Azure cost workflows.
- **Improvement recommendations:** Automate broader Azure cost estimations in the PowerShell extractor.

### 23. Interoperability
- **Score:** 90
- **Weight:** 2
- **Weighted deficiency signal:** 20
- **Justification:** REST API, CLI, webhooks, ITSM connectors, SAML 2.0 SP, and OIDC provide excellent interoperability.
- **Tradeoffs:** SAML SP adds dual auth-surface operational burden.
- **Improvement recommendations:** Add a CI step that fails the build if new API endpoints lack documented audit events.

### 24. Scalability
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** Scales well horizontally. KEDA azure-queue replica scaling is supported.
- **Tradeoffs:** Single-tenant worker pool exhaustion is still a risk if not carefully configured.
- **Improvement recommendations:** Implement auto-scaling rules for the worker pool based on SQL authority outbox depth.

### 25. Supportability
- **Score:** 85
- **Weight:** 1
- **Weighted deficiency signal:** 15
- **Justification:** Good logging, OpenTelemetry, and CLI diagnostics (`doctor`, `support-bundle`).
- **Tradeoffs:** Some operational scripts assume `DevelopmentBypass`.
- **Improvement recommendations:** Update all operational scripts to accept `-BearerToken` or `-ApiKey`.

---

## Top 12 Most Important Weaknesses

1. **Lack of cross-tenant analytics:** Limits portfolio-wide executive proof and internal product telemetry.
2. **Missing LLM observability:** Lack of explicit OpenTelemetry tracing for LLM token usage and latency hinders cost attribution and debugging.
3. **E2E test mock reliance:** `ui-e2e-smoke` relies heavily on mocked `/api/proxy`, leaving integration surfaces vulnerable to regressions.
4. **Manual Azure cost estimations:** The Azure extractor requires manual cost estimation for many resource types, limiting automated ROI proof.
5. **Lack of automated tenant data deletion:** Absence of a GDPR/CCPA "right to be forgotten" mechanism causes friction in privacy reviews.
6. **Lack of custom rule authoring UI:** Evaluators must write raw code or JSON to author custom governance rules, increasing adoption friction.
7. **Operational script auth realism:** Some scripts still rely on `DevelopmentBypass`, breaking realism and hindering secure operations.
8. **Worker pool scaling triggers:** Scaling relies primarily on Azure queue depth rather than SQL authority outbox depth, risking noisy neighbor issues.
9. **Background job transient fault handling:** Asynchronous jobs may lack comprehensive Polly-based retry policies for SQL transient errors.
10. **Data residency verification gaps:** The provisioning pipeline lacks automated assertions to verify that Azure resources match the requested `DataRegion`.
11. **Terraform advisory validation:** Generated Terraform snippets are not automatically validated (`terraform fmt`/`validate`) in CI, risking syntax errors in advisory output.
12. **Audit matrix drift:** New API endpoints can be merged without corresponding updates to the `AUDIT_COVERAGE_MATRIX.md`.

---

## Top 6 Monetization Blockers

1. **Lack of cross-tenant analytics:** Limits the ability to prove portfolio-wide ROI to executive buyers.
2. **Manual Azure cost estimations:** Reduces the platform's ability to automatically prove hard infrastructure savings.
3. **Lack of a published reference customer:** Slows early momentum and trust generation (deferred to V1.1).
4. **Lack of self-serve transactability:** Stripe live keys and Marketplace publication are deferred, forcing a high-touch sales motion.
5. **Named productized offers packaging:** Velocity to cash depends on a buyable review SKU and SOW alignment, which requires GTM execution.
6. **Thin starter packs:** While AI governance and security baseline packs exist, they risk "one-and-done" pilots if tenants do not extend them.

---

## Top 6 Enterprise Adoption Blockers

1. **Lack of automated tenant data deletion:** Fails GDPR/CCPA privacy reviews during procurement.
2. **Absence of compliance attestations:** Lack of a CPA-issued SOC 2 Type II report causes friction in security reviews.
3. **Lack of custom rule authoring UI:** Non-developer architects cannot easily author and test custom governance rules.
4. **Data residency diligence depth:** Buyers require verifiable proof that SQL topology and backups match their geography.
5. **Noisy neighbor posture in orchestration:** Buyers will diligence steady-state parallelism and multi-region fairness.
6. **SAML SP operational burden:** Managing certificate rotation and metadata drift for SAML SP adds operational overhead for enterprise IT.

---

## Top 6 Engineering Risks

1. **LLM observability gaps:** Missing explicit tracing for token usage and latency hinders debugging and scaling.
2. **E2E test mock reliance:** Heavy reliance on mocks in `ui-e2e-smoke` risks missing integration regressions.
3. **Operational script auth realism:** Scripts assuming `DevelopmentBypass` mask real-world authentication failures.
4. **Background job transient fault handling:** Incomplete retry policies for SQL connections in background workers risk silent failures.
5. **Worker pool scaling triggers:** Scaling on Azure queue depth rather than SQL outbox depth risks backlog accumulation.
6. **Terraform advisory syntax errors:** Unvalidated Terraform snippets could produce invalid advisory output, damaging trust.

---

## Most Important Truth

ArchLucid is a functionally complete, highly rigorous V1 product ready for sales-led pilots, but its ability to scale commercially is bottlenecked by observability gaps (LLM tracing), manual ROI proof (Azure cost extraction), and enterprise friction (lack of automated data deletion and custom rule authoring UI).

---

## Top Improvement Opportunities

### 1. Implement internal cross-tenant analytics rollups with tenant pseudonymization
- **Why it matters:** Proves portfolio-wide ROI signal for founders/operators and supports internal product telemetry without exposing tenant identity in rollups.
- **Expected impact:** Proof-of-ROI Readiness (+10 pts), Executive Value Visibility (+5 pts).
- **Affected qualities:** Proof-of-ROI Readiness, Executive Value Visibility.
- **Actionable:** Yes
```text
Add an internal-only cross-tenant analytics path (operator/admin or offline job — not a tenant-facing API) that aggregates non-sensitive counters and latency/throughput metrics across tenants.
- Pseudonymization: every stored or exported rollup row must key tenants by an opaque surrogate (e.g. stable per-tenant `AnalyticsTenantKey` derived with HMAC-SHA256 over tenant id + server-side salt from configuration/Key Vault — never store tenant slug, domain, or display name in rollup tables).
- Scope: aggregate only metrics already classified as internal BI-safe (counts, durations, token totals if already non-content, queue depths). Do not ingest review text, findings bodies, evidence filenames, or manifest excerpts into cross-tenant stores.
- Storage: prefer a dedicated system-catalog table or reporting schema (`dbo.InternalCrossTenantRollup*` or equivalent) with RLS not applicable — access only via `RequireOperatorRole` / internal service principal; document in `docs/runbooks/` or `docs/operations/` who may query it.
- Acceptance criteria: (1) A scheduled or on-demand job produces daily rollups keyed by surrogate id only; (2) no PII/PHI columns in rollup DDL; (3) tests prove surrogate stability and that raw tenant id does not appear in exported CSV/JSON for rollups.
- Constraints: No per-tenant opt-in UI; internal use only per product decision. Do not add new public HTTP routes without versioning review.
- What not to change: Do not weaken per-tenant isolation on tenant-scoped APIs; do not copy customer content blobs into a shared analytics store.
- Impact: Directly improves Proof-of-ROI Readiness (+6-10 pts) and Executive Value Visibility (+3-5 pts). Weighted readiness impact: +0.15-0.25%.
```

### 2. Add explicit OpenTelemetry tracing for LLM API calls
- **Why it matters:** Missing tracing for token usage and latency hinders debugging, cost attribution, and scaling.
- **Expected impact:** Observability (+15 pts), AI/Agent Readiness (+5 pts).
- **Affected qualities:** Observability, AI/Agent Readiness.
- **Actionable:** Yes
```text
Modify `ArchLucid.Host.Core/ObservabilityExtensions.cs` (or equivalent instrumentation setup) to add explicit OpenTelemetry tracing for all LLM API calls.
- Acceptance criteria: Token usage, latency, and model version are captured as custom metrics or trace attributes.
- Constraints: Do not log raw prompt text or completion text to avoid PII leakage.
- What not to change: Do not modify existing HTTP client instrumentation.
- Impact: Directly improves Observability (+10-15 pts) and AI/Agent Readiness (+5-8 pts). Weighted readiness impact: +0.2-0.4%.
```

### 3. Implement automated tenant erasure (30-day quarantine, legal-hold flag, blob + SQL purge)
- **Why it matters:** GDPR/CCPA-aligned erasure and enterprise procurement expect a verifiable delete story; a bounded quarantine plus audited hold is proportionate without a separate storage tier.
- **Expected impact:** Compliance Readiness (+10 pts), Adoption Friction (+5 pts).
- **Affected qualities:** Compliance Readiness, Adoption Friction.
- **Actionable:** Yes
```text
Implement an automated tenant erasure pipeline aligned to GDPR/CCPA storage-limitation practice (product policy — not legal advice).
- Quarantine: On verified erasure request + operator/admin confirmation, mark tenant **soft-deleted** with `TenantErasureRequestedUtc` (or equivalent). **Hard purge** runs automatically **30 calendar days** after that timestamp unless blocked below.
- Legal hold: Add nullable **`LegalHoldUntilUtc`** (or `LegalHoldReason` + `LegalHoldSetBy`) on the system-catalog tenant row. If `LegalHoldUntilUtc` is in the future (or a boolean hold is active per your schema), the hard-purge job **must skip** the tenant and emit a structured warning; clearing hold is an audited admin action. **No separate legal-hold blob bucket** — hold keeps data in place.
- Scope of hard purge (same orchestrated job): (1) Drop or irreversibly scrub **per-tenant SQL catalog** per existing topology (`SystemWithPerTenantCatalogs`); (2) Delete **all tenant-scoped blobs** referenced from DB or known prefixes (exports DOCX/PDF, bundle ZIPs, Azure extractor upload packages, logos) using existing blob clients; (3) Remove **control-plane** tenant binding rows so the tenant id cannot authenticate.
- Audit: Emit durable audit events for request received, quarantine start, hold set/cleared, hard purge start/complete, failures with correlation id.
- Acceptance criteria: Integration or harness test proves quarantine → after simulated clock or test double, purge runs; hold blocks purge; blobs listed in fixture are gone after purge.
- Constraints: Do not log secrets; do not weaken other tenants’ isolation; honor existing RBAC (only platform admin / operator MAY initiate or clear hold).
- What not to change: Do not alter unrelated billing or global config tables except foreign-key cleanup required for tenant removal.
- Impact: Directly improves Compliance Readiness (+6-10 pts) and Adoption Friction (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 4. Form-based custom policy rule authoring (curated rules JSON round-trip)
- **Why it matters:** Non-developer architects need to extend governance packs without hand-editing JSON; a form-based editor matches enterprise expectations and reuses the shipped sample schema.
- **Expected impact:** Adoption Friction (+10 pts), Usability (+5 pts).
- **Affected qualities:** Adoption Friction, Usability.
- **Actionable:** Yes
```text
Deliver **form-based** (not block/Scratch-style) authoring for **tenant custom** policy packs, with JSON that **round-trips** the sample “curated rules” documents under `docs/samples/policy-packs/*-rules-v1.json`.

**A. Decisioning bridge (backend, required for net-new rule bodies)**  
Today `PolicyFilteredComplianceRulePackProvider` loads a **file-merged** `ComplianceRulePack` and filters by `complianceRuleKeys` on `PolicyPackContentDocument`. Keys alone are insufficient if the rule is not in that merged file set. Extend the compliance/governance pipeline so **tenant-published** pack content can **contribute additional `ComplianceRule` rows** before filtering (e.g. merge inline definitions derived from the curated-rules document alongside existing file loaders, or an equivalent approach documented in the PR). Map sample rule fields to `ArchLucid.Decisioning.Compliance.Models.ComplianceRule` explicitly in code (e.g. `id`→`RuleId`, `title`→`ControlName`, `description`→`Description`, `severity`→`Severity`; default or derive `ControlId`, `AppliesToCategory`, `RequiredNodeType`, `RequiredEdgeType` with documented semantics; carry `remediationGuidance` / `evidenceHints` / `frameworkMappings` only if the engine already consumes them or store as extensions per existing patterns — do not silently drop validation requirements).

**B. Pack envelope (`contentJson`)**  
On `POST /v1/policy-packs/{id}/publish`, serialized `contentJson` must remain a valid `PolicyPackContentDocument` (`ArchLucid.Decisioning.Governance.PolicyPacks.PolicyPackContentDocument`): keep `complianceRuleIds`, `complianceRuleKeys`, `alertRuleIds`, `compositeAlertRuleIds`, `advisoryDefaults`, `metadata` aligned with today’s merge semantics. **Every** authored rule’s `id` must appear in `complianceRuleKeys`. Persist the full curated-rules document in a **reserved `metadata` entry** (string value) agreed in the same PR (e.g. `pack.curatedRules.v1`) so the UI and decisioning share one canonical JSON shape — do not fork a second on-disk format in repo root.

**C. UI (`archlucid-ui`)**  
Under **`/policy-packs`** (or `/policy-packs/[id]/rules`): table of rules; **Add** / **Edit** opens a form — severity dropdown (match sample casing: Critical/High/Medium/Low), text fields, dynamic lists for `evidenceHints` and `frameworkMappings` rows; **read-only JSON preview** of the curated-rules doc. Enforce duplicate-id checks and required fields before calling publish. Use `@/lib/openapi-schemas` for API DTOs; `data-testid` on primary actions (`UI-Stable-Selectors-And-Snapshots.mdc`). RBAC: match existing policy-pack mutation gates (same roles as pack publish today).

**D. HTTP surface**  
Prefer existing routes. Any new contract fields require OpenAPI regeneration and `Http-Surface-Docs-And-Clients.mdc` checklist.

**E. Tests**  
- .NET: unit tests for metadata→`ComplianceRule` mapping and merge order vs governance filter.  
- UI: Vitest for parse/serialize round-trip using a frozen snippet from `security-architecture-baseline-rules-v1.json`.

**What not to do**  
Block-based visual programming in this slice; editing **PlatformDefault** seeded packs; introducing ad hoc rule schema JSON outside the sample `*-rules-v1.json` shape without an ADR.

**Impact:** Adoption Friction (+6–10 pts), Usability (+3–5 pts). Weighted readiness impact: +0.1–0.2%.
```

### 5. Extend `ui-e2e-live` Playwright specs to cover consultant whitelabel export
- **Why it matters:** Consultant whitelabeling is a key V1 commercial feature; automated UI tests ensure it does not regress.
- **Expected impact:** Testability (+10 pts), Commercial Packaging Readiness (+5 pts).
- **Affected qualities:** Testability, Commercial Packaging Readiness.
- **Actionable:** Yes
```text
Create a new Playwright test file `archlucid-ui/e2e/live-api-whitelabel-export.spec.ts`.
- Acceptance criteria: The test must log in, navigate to a finalized review, open the export modal, fill in the firm name and engagement title, upload a mock logo, and trigger the export.
- Constraints: Use the existing `ui-e2e-live` setup and authentication helpers.
- What not to change: Do not modify the underlying export API endpoints.
- Impact: Directly improves Testability (+8-10 pts) and Commercial Packaging Readiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 6. Automate broader Azure cost estimations in the PowerShell extractor
- **Why it matters:** Manual cost estimation limits the platform's ability to automatically prove hard infrastructure savings.
- **Expected impact:** Cost-Effectiveness (+10 pts), Proof-of-ROI Readiness (+5 pts).
- **Affected qualities:** Cost-Effectiveness, Proof-of-ROI Readiness.
- **Actionable:** Yes
```text
Update `Get-ArchLucidAzurePackage.ps1` to automatically query the Azure Retail Prices API for App Service Plans and Azure SQL Databases.
- Acceptance criteria: The script outputs `retail-prices.json` containing the current retail rates for the collected App Service and SQL SKUs.
- Constraints: Do not require any new Azure RBAC roles beyond `Reader` and `Cost Management Reader`.
- What not to change: Do not alter the core ARM resource collection logic.
- Impact: Directly improves Cost-Effectiveness (+8-10 pts) and Proof-of-ROI Readiness (+3-5 pts). Weighted readiness impact: +0.2-0.3%.
```

### 7. Update all operational scripts to support JWT/API keys
- **Why it matters:** Scripts assuming `DevelopmentBypass` mask real-world authentication failures and hinder secure operations.
- **Expected impact:** Supportability (+10 pts), Correctness (+5 pts).
- **Affected qualities:** Supportability, Correctness.
- **Actionable:** Yes
```text
Audit all `.ps1` scripts in the `scripts/` directory and update them to accept `-BearerToken` or `-ApiKey` parameters.
- Acceptance criteria: Scripts must authenticate using the provided token/key instead of relying on `DevelopmentBypass`.
- Constraints: Maintain backward compatibility for local development if no token is provided.
- What not to change: Do not change the core logic of the scripts, only the HTTP client authentication headers.
- Impact: Directly improves Supportability (+8-10 pts) and Correctness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 8. Guided baseline collection wizard (ZIP-first, thin required fields)
- **Why it matters:** Real-mode value requires tenant baseline data; a wizard that leads with the Azure extractor ZIP reduces manual typing and speeds first commit.
- **Expected impact:** Time-to-Value (+10 pts), Usability (+5 pts).
- **Affected qualities:** Time-to-Value, Usability.
- **Actionable:** Yes
```text
Extend the operator **new review** flow (`archlucid-ui` — `reviews/new`, `NewRunWizardClient`, existing wizard steps including `WizardStepAzureContext`) with a **baseline-first path** without bloating the V1 gate checklist.

**V1 scope (ship in this slice)**
- **Step 1 — Extractor ZIP upload:** Accept the customer’s Azure packager ZIP (same artifact produced by `Get-ArchLucidAzurePackage.ps1`). Client-side, unpack enough to read normalized manifest / identity fields used today (e.g. `SubscriptionId`, `ScopeDescriptor`, `CollectionTimestamp`, schema versions) and **auto-fill** wizard state where the form already supports it. Enforce generous but bounded file size consistent with existing bulk-evidence limits; surface clear errors for corrupt or non-packager zips.
- **Step 2 — Minimal identity (required):** Operator must confirm or enter **system name**, **environment** (default sensible non-prod if unknown), and **cloud provider** (default **Azure**, confirm-only — forward-compat). These align with `ArchitectureRequest` / wizard schema fields already used by `wizardValuesToCreateRunPayload` / `createArchitectureRun` — do not invent parallel DTOs.
- **Progressive disclosure:** Keep existing steps (constraints, advanced) **optional** and skippable for this path; do **not** require governance tags, compliance constraint matrices, datastore/service graph authoring, or framework-mapping inputs before first run creation.
- **Telemetry / checklist:** Wire into the same first-tenant funnel / core pilot step affordances as today (`core-pilot-steps`, funnel events) so “baseline captured” is observable.
- **Docs link:** CTA from the wizard to `docs/library/PILOT_GUIDE.md` (or the canonical packager doc path already linked from the Azure step).
- **Tests:** Vitest for ZIP metadata extraction + form prefill (fixture: minimal valid zip structure or mocked `File`/`Blob` path per existing test patterns); one RTL test that baseline-first path reaches submit with only required fields set.
- **Constraints:** Reuse OpenAPI types; no new HTTP routes unless the product already needs a server-side unpack endpoint — prefer browser-side unzip + parse if safe for size limits; if server unpack is required, follow `Http-Surface-Docs-And-Clients.mdc`.
- **Explicitly out of scope here** (deferred per `docs/library/V1_DEFERRED.md` — baseline wizard enrichments): manual datastore/service enumeration as a **gate**, mandatory governance/compliance/risk fields pre-commit, portfolio multi-system capture in one wizard, and deep framework-mapping steps. V1.1 carries structured enrichment gates; V2 carries portfolio-style onboarding where noted in that table.

**Impact:** Time-to-Value (+6–10 pts), Usability (+3–5 pts). Weighted readiness impact: +0.1–0.2%.
```

### 9. Add a 'Missing Baseline' warning to the executive dashboard
- **Why it matters:** Executive value can become abstract if real tenant baselines are missing.
- **Expected impact:** Executive Value Visibility (+10 pts), Usability (+5 pts).
- **Affected qualities:** Executive Value Visibility, Usability.
- **Actionable:** Yes
```text
Modify the executive dashboard component in `archlucid-ui` to display a prominent warning banner if no baseline data (e.g., Azure extractor ZIP) has been uploaded.
- Acceptance criteria: The banner is visible to Admin and Operator roles and links to the baseline upload documentation.
- Constraints: The banner must be dismissible for the current session.
- What not to change: Do not alter the underlying dashboard metrics calculations.
- Impact: Directly improves Executive Value Visibility (+8-10 pts) and Usability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 10. DEFERRED Develop an internal "Policy Pack Hub" for sharing custom policies
- **Why it matters:** Encouraging tenants to author and share policy packs increases platform stickiness and value.
- **Expected impact:** Stickiness (+15 pts), Template and Accelerator Richness (+10 pts).
- **Affected qualities:** Stickiness, Template and Accelerator Richness.
- **Input needed from user:** Define the versioning, approval workflow, and tenant isolation rules for the hub.

### 11. Formalize data residency verification in the Terraform provisioning pipeline
- **Why it matters:** Enterprise buyers require verifiable proof that resources match their geography.
- **Expected impact:** Compliance Readiness (+10 pts), Reliability (+5 pts).
- **Affected qualities:** Compliance Readiness, Reliability.
- **Actionable:** Yes
```text
Add a validation step in the Terraform CI pipeline (`.github/workflows/cd.yml` or equivalent) that asserts the `location` of all provisioned resources matches the expected `DataRegion`.
- Acceptance criteria: The pipeline fails if any resource is provisioned in an unexpected region.
- Constraints: Use Terraform `plan` output or `azurerm` data sources for validation.
- What not to change: Do not modify the actual Terraform resource definitions.
- Impact: Directly improves Compliance Readiness (+8-10 pts) and Reliability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 12. Add a CI step that fails the build if new API endpoints lack documented audit events
- **Why it matters:** Ensures that the `AUDIT_COVERAGE_MATRIX.md` does not drift from the actual API surface.
- **Expected impact:** Compliance Readiness (+10 pts), Maintainability (+5 pts).
- **Affected qualities:** Compliance Readiness, Maintainability.
- **Actionable:** Yes
```text
Create a Python script `scripts/ci/check_audit_matrix.py` that parses `ArchLucid.Api` controllers for `[HttpPost]`, `[HttpPut]`, and `[HttpDelete]` attributes and cross-references them against `docs/library/AUDIT_COVERAGE_MATRIX.md`.
- Acceptance criteria: The script exits with a non-zero code if a mutating endpoint is missing from the matrix.
- Constraints: Allow an explicit `[AuditExempt]` attribute or comment to bypass the check for valid exceptions.
- What not to change: Do not modify the API controllers, only add the CI script.
- Impact: Directly improves Compliance Readiness (+8-10 pts) and Maintainability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 13. Implement bi-directional ServiceNow status sync
- **Why it matters:** Closes a workflow gap for ITSM-led enterprises and fulfills a V1 GA commitment.
- **Expected impact:** Workflow Embeddedness (+15 pts), Interoperability (+5 pts).
- **Affected qualities:** Workflow Embeddedness, Interoperability.
- **Actionable:** Yes
```text
Implement a webhook receiver or polling mechanism in `ArchLucid.Api` to sync ServiceNow incident status changes back to ArchLucid finding states.
- Acceptance criteria: A status change in ServiceNow updates the corresponding finding in ArchLucid and emits a durable audit event.
- Constraints: Map statuses using a configurable per-tenant mapping (default: New/In Progress -> Open/InProgress; Resolved/Closed -> Resolved).
- What not to change: Do not alter the existing outbound incident creation logic.
- Impact: Directly improves Workflow Embeddedness (+10-15 pts) and Interoperability (+3-5 pts). Weighted readiness impact: +0.2-0.3%.
```

### 14. Add Playwright smoke tests for the Jira bidirectional status sync
- **Why it matters:** Ensures the Jira integration does not regress, protecting a key enterprise workflow.
- **Expected impact:** Testability (+10 pts), Workflow Embeddedness (+5 pts).
- **Affected qualities:** Testability, Workflow Embeddedness.
- **Actionable:** Yes
```text
Create a new Playwright test file `archlucid-ui/e2e/live-api-jira-sync.spec.ts`.
- Acceptance criteria: The test mocks a Jira webhook payload indicating a status change and verifies the finding status updates in the ArchLucid UI.
- Constraints: Do not make actual calls to the Jira API; use the mocked `/api/proxy` or a dedicated test webhook endpoint.
- What not to change: Do not modify the Jira integration business logic.
- Impact: Directly improves Testability (+8-10 pts) and Workflow Embeddedness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 15. Add Playwright smoke tests for the Slack chat-ops integration
- **Why it matters:** Ensures the Slack integration does not regress.
- **Expected impact:** Testability (+10 pts), Workflow Embeddedness (+5 pts).
- **Affected qualities:** Testability, Workflow Embeddedness.
- **Actionable:** Yes
```text
Create a new Playwright test file `archlucid-ui/e2e/live-api-slack-integration.spec.ts`.
- Acceptance criteria: The test triggers an alert or digest and verifies that the corresponding Slack webhook payload is generated correctly.
- Constraints: Intercept the outbound HTTP request to Slack to verify the payload without sending a real message.
- What not to change: Do not modify the Slack integration business logic.
- Impact: Directly improves Testability (+8-10 pts) and Workflow Embeddedness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 16. Add Playwright smoke tests for the Confluence documentation publish integration
- **Why it matters:** Ensures the Confluence integration does not regress.
- **Expected impact:** Testability (+10 pts), Workflow Embeddedness (+5 pts).
- **Affected qualities:** Testability, Workflow Embeddedness.
- **Actionable:** Yes
```text
Create a new Playwright test file `archlucid-ui/e2e/live-api-confluence-publish.spec.ts`.
- Acceptance criteria: The test triggers a run summary publish and verifies that the outbound Confluence API payload is formatted correctly.
- Constraints: Intercept the outbound HTTP request to Confluence to verify the payload without creating a real page.
- What not to change: Do not modify the Confluence integration business logic.
- Impact: Directly improves Testability (+8-10 pts) and Workflow Embeddedness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 17. Surface SAML SP signing certificate (and IdP metadata) expiry warnings for operators
- **Why it matters:** Enterprise SAML SP deployments fail procurement and production reviews when cert or metadata rotation is discovered only after outages; proactive surfacing reduces support load and adoption friction.
- **Expected impact:** Supportability (+10 pts), Adoption Friction (+5 pts).
- **Affected qualities:** Supportability, Adoption Friction.
- **Actionable:** Yes
```text
Ship **read-only** SAML 2.0 SP **operational health** signals for tenants with `ArchLucidAuth:Saml2:Enabled` so operators see rotation risk before IdP or SP certificates expire.

**Backend**
- Add an internal admin/operator read model (new `GET` route under existing admin auth conventions or extend an existing diagnostics DTO) that returns: SP **signing certificate** `NotAfter` (UTC) parsed from the configured cert material (no private keys on the wire); optional **IdP metadata** `validUntil` when metadata is loaded from XML and exposes that attribute; `Saml2Enabled` flag. Reuse `ArchLucidSamlAuthOptions` / host composition — do not log cert thumbprints or secrets. Follow `Http-Surface-Docs-And-Clients.mdc` if the HTTP contract changes.

**UI (`archlucid-ui`)**
- On the settings / security / auth surface where SAML is already documented (or add a thin **Security** strip under operator **Help** if no dedicated route exists today), render a **dismissible** banner when signing cert `NotAfter` is within **30 days** (make threshold a constant or config key) or already expired. Link to the repo SAML rotation runbook path (add or extend `docs/` if missing). `data-testid` + accessible name per `UI-Stable-Selectors-And-Snapshots.mdc`.

**Tests**
- API: unit or integration test with a fixed clock and stub certificate / options.
- UI: Vitest for banner threshold logic; optional Playwright if live stack already exercises SAML fixtures.

**Constraints**
- No behavior change to SAML login, assertion validation, or cookie issuance — **surfacing only**.

**Impact:** Supportability (+6-10 pts), Adoption Friction (+3-5 pts). Weighted readiness impact: +0.1-0.15%.
```

### 18. Add explicit application-level logging to the findings list API endpoints
- **Why it matters:** Allows evaluation of read-access patterns before committing them to the durable audit matrix.
- **Expected impact:** Observability (+10 pts), Compliance Readiness (+5 pts).
- **Affected qualities:** Observability, Compliance Readiness.
- **Actionable:** Yes
```text
Modify the findings list endpoints in `ArchLucid.Api` to emit structured application logs (e.g., via Serilog) containing the `FindingCount`, scope IDs, and run ID.
- Acceptance criteria: Read access to findings lists generates a structured log entry.
- Constraints: Do not emit a durable `IAuditService` event yet; this is for application telemetry only.
- What not to change: Do not alter the response schema of the findings list API.
- Impact: Directly improves Observability (+8-10 pts) and Compliance Readiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 19. Implement auto-scaling rules for the worker pool based on SQL authority outbox depth
- **Why it matters:** Scaling on Azure queue depth alone risks backlog accumulation for SQL-driven workloads.
- **Expected impact:** Scalability (+15 pts), Reliability (+5 pts).
- **Affected qualities:** Scalability, Reliability.
- **Actionable:** Yes
```text
Update the KEDA configuration in `infra/terraform-container-apps` to include a scaler based on the SQL authority outbox depth (`archlucid_authority_pipeline_work_pending` metric).
- Acceptance criteria: The worker pool scales up when the SQL outbox depth exceeds a configured threshold.
- Constraints: Ensure the scaler uses a read-only SQL principal or Prometheus metric endpoint.
- What not to change: Do not remove the existing Azure Queue scaler.
- Impact: Directly improves Scalability (+10-15 pts) and Reliability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 20. Add at least three new architecture boundary rules in `ArchLucid.Architecture.Tests`
- **Why it matters:** Protects maintainability by tightening public surfaces using the `internal` modifier.
- **Expected impact:** Maintainability (+10 pts), Correctness (+5 pts).
- **Affected qualities:** Maintainability, Correctness.
- **Actionable:** Yes
```text
Add three new NetArchTest rules in `ArchLucid.Architecture.Tests/DependencyConstraintTests.cs` to enforce that specific internal modules (e.g., specific persistence repositories or API middleware) are not referenced outside their designated boundaries.
- Acceptance criteria: The tests pass and correctly fail if the boundary is violated.
- Constraints: Ensure the rules align with the architecture invariants in `ARCHITECTURE_INVARIANTS.md`.
- What not to change: Do not refactor existing code unless it violates the new rules.
- Impact: Directly improves Maintainability (+8-10 pts) and Correctness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 21. Add dashboards and alerting in Grafana for wait times and dead letters
- **Why it matters:** Provides visibility into worker bursts and orchestration bottlenecks.
- **Expected impact:** Observability (+10 pts), Performance (+5 pts).
- **Affected qualities:** Observability, Performance.
- **Actionable:** Yes
```text
Create or update a Grafana dashboard JSON file in `infra/grafana/` to visualize `archlucid_authority_pipeline_work_dead_letter` and `archlucid_authority_pipeline_work_oldest_pending_age_seconds`.
- Acceptance criteria: The dashboard includes panels for dead letters, backlog depth, and oldest pending age, with corresponding Prometheus alert rules.
- Constraints: Use standard Prometheus PromQL syntax.
- What not to change: Do not modify the application metric emission logic.
- Impact: Directly improves Observability (+8-10 pts) and Performance (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 22. Audit and update background jobs to ensure Polly-based retry policies are uniformly applied
- **Why it matters:** Prevents silent failures in background workers due to transient SQL errors.
- **Expected impact:** Reliability (+15 pts), Correctness (+5 pts).
- **Affected qualities:** Reliability, Correctness.
- **Actionable:** Yes
```text
Review all background services (e.g., `IHostedService` implementations) in `ArchLucid.Worker` and ensure they use `ResilientSqlConnectionFactory` or apply `SqlOpenResilienceDefaults` when opening SQL connections.
- Acceptance criteria: All background SQL connections use the configured Polly retry pipeline.
- Constraints: Do not apply retries to non-transient errors (e.g., authentication failures).
- What not to change: Do not alter the core business logic of the background jobs.
- Impact: Directly improves Reliability (+10-15 pts) and Correctness (+3-5 pts). Weighted readiness impact: +0.2-0.3%.
```

### 23. Implement telemetry to track `108` replay notes during catalog migrations
- **Why it matters:** Provides visibility into lag during coordination-heavy RLS migrations.
- **Expected impact:** Correctness (+10 pts), Maintainability (+5 pts).
- **Affected qualities:** Correctness, Maintainability.
- **Actionable:** Yes
```text
Add telemetry emission (e.g., via `ArchLucidInstrumentation`) whenever a `108` replay note is encountered during a catalog migration.
- Acceptance criteria: A custom metric or structured log is emitted containing the migration ID and tenant scope.
- Constraints: Ensure the telemetry does not block the migration process.
- What not to change: Do not alter the DbUp migration execution flow.
- Impact: Directly improves Correctness (+8-10 pts) and Maintainability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 24. Add a CI check to ensure all Terraform advisory snippets pass `terraform fmt` and `terraform validate`
- **Why it matters:** Unvalidated Terraform snippets could produce invalid advisory output, damaging trust.
- **Expected impact:** Correctness (+10 pts), Reliability (+5 pts).
- **Affected qualities:** Correctness, Reliability.
- **Actionable:** Yes
```text
Add a step to the GitHub Actions CI pipeline (`.github/workflows/ci.yml`) that extracts sample Terraform advisory snippets and runs `terraform fmt -check` and `terraform validate` on them.
- Acceptance criteria: The CI build fails if any sample snippet is invalid Terraform.
- Constraints: Use a mock or sample finding payload to generate the snippets during the test.
- What not to change: Do not modify the Terraform export business logic.
- Impact: Directly improves Correctness (+8-10 pts) and Reliability (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

### 25. Enhance the Azure extractor script to collect Azure Policy compliance states
- **Why it matters:** Provides a richer baseline for security and governance policy packs, increasing platform stickiness.
- **Expected impact:** Stickiness (+10 pts), Proof-of-ROI Readiness (+5 pts).
- **Affected qualities:** Stickiness, Proof-of-ROI Readiness.
- **Actionable:** Yes
```text
Update `Get-ArchLucidAzurePackage.ps1` to query Azure Policy compliance states (e.g., via `Get-AzPolicyState`) and include the results in a new `policy-compliance.json` file in the output ZIP.
- Acceptance criteria: The script successfully collects policy states without requiring additional RBAC roles beyond `Reader`.
- Constraints: Handle pagination and rate limiting gracefully when querying policy states.
- What not to change: Do not alter the existing ARM resource collection logic.
- Impact: Directly improves Stickiness (+8-10 pts) and Proof-of-ROI Readiness (+3-5 pts). Weighted readiness impact: +0.1-0.2%.
```

---

## Prompt Batching Guidance

To optimize context window usage and cost-effectiveness, batch the actionable prompts as follows:

- **Batch 1 (Observability & Reliability):** 2, 18, 21, 22, 23
- **Batch 2 (Testing & CI Hygiene):** 5, 12, 14, 15, 16, 24
- **Batch 3 (Integrations & Extractor):** 6, 13, 25
- **Batch 4 (Architecture, infrastructure, tenant lifecycle):** 3, 7, 11, 17, 19, 20
- **Batch 5 (UX & Dashboards):** 4, 8, 9
- **Batch 6 (Internal cross-tenant rollups):** 1

---

## Pending Questions for Later

### DEFERRED Develop an internal "Policy Pack Hub" for sharing custom policies
- **Resolved (2026-05-17) — global publish authority:** Only **internal ArchLucid platform admins** may publish to a **global / catalog** scope; **single-owner** control until additional admins are designated.
- **Still open:** Versioning semantics, draft → approved → published workflow, and tenant-isolation rules for forked or imported packs.