> **Scope:** Independent first-principles quality assessment of ArchLucid V1 — scored, weighted, ranked, and improvement-prompted. Not a marketing artifact.

# ArchLucid Assessment – Weighted Readiness 66.25%

**Date:** 2026-04-28  
**Method:** Independent, first-principles. No reference to prior assessments. Scored against live codebase, documentation, and IaC evidence.  
**Scoring:** Each quality scored 1–100; weighted per spec; overall readiness = (Σ score×weight) / (Σ weight × 100) × 100.  
**Totals:** Weighted score sum 6,757 / max 10,200 = **66.25%**  
**Deferred items per V1_DEFERRED.md:** Jira/ServiceNow/Confluence connectors, product-learning "brains," Phase 7.5–7.8 rename tasks, cross-tenant analytics, multi-region SaaS guarantees. These are correctly scoped out and do NOT reduce the readiness score.

---

## Deferred Scope Uncertainty

All referenced deferred items were found and confirmed in `docs/library/V1_DEFERRED.md`, `docs/library/V1_SCOPE.md`, and `docs/go-to-market/INTEGRATION_CATALOG.md`. No scope uncertainty exists.

---

## 2. Executive Summary

### Overall Readiness

ArchLucid V1 is a structurally complete, intelligently documented early-commercial product that is notably advanced in technical depth and go-to-market preparedness for its stage. At **66.25%** weighted readiness, it is not yet ready to win competitive enterprise deals without active sales support, but it is ready to run credible pilots with design partners. The engineering foundation is solid. The commercial and enterprise surfaces have meaningful, specific gaps that are fixable — but not without deliberate investment over the next 60–90 days.

### Commercial Picture

The commercial case is well-constructed on paper but unvalidated in market. The ROI model is detailed, the pricing architecture is defensible, the positioning is differentiated, and the buyer journey documentation is unusually mature for an early product. The critical gap is that every claim rests on synthetic data, a single fabricated case study, and no external references. Prospects who ask "who else is using this?" will hear silence. Fixing marketability requires a real customer or two — nothing in the codebase can substitute for that.

### Enterprise Picture

Enterprise readiness has genuine strengths: multi-tenant RLS, 117 typed audit events with CI enforcement, append-only SQL, OWASP ZAP + Schemathesis in CI, and a documented STRIDE threat model. The gaps are procurement-blocking: no SOC 2 (roadmap targets Type I in Q1 2027), no completed pen test (SoW exists), no Jira/ServiceNow/Confluence integration in V1, and compliance readiness that is narrative-heavy but evidence-light. Any enterprise security reviewer who asks for a SOC 2 report will receive a roadmap, not a report.

### Engineering Picture

The engineering posture is the product's strongest quadrant relative to its stage. The architecture is clean, layered, and consistent. Security defaults are fail-closed. Observability is unusually thorough (30+ custom OTel metrics, 117 audit events, correlation IDs everywhere). The primary engineering risk is test coverage: `ArchLucid.Persistence` sits at approximately **39.66%** per-package line coverage and `ArchLucid.Api` at approximately **60.79%** — both below the 63% strict-profile floor. The code is modular to a fault (50+ projects), and some commercial enforcement paths lack tier gating.

---

## 3. Weighted Quality Assessment

Ordered from most urgent (highest weighted deficiency) to least urgent.

---

### 3.1 Marketability — Score: 62 | Weight: 8 | Weighted Deficiency: 304

**Score justification:** Positioning, competitive landscape, ROI model, pricing tiers, buyer personas, pilot scorecard, and sponsor brief are all materially complete and unusually detailed for a V1. The product occupies a genuine whitespace ("AI Architecture Intelligence") with no direct incumbent. However, the product has no confirmed production customers, no reference story backed by real data, one synthetic case study (Contoso Retail Modernization), and no confirmed live Azure Marketplace listing. Marketing claims cannot be externally validated. A 62 reflects outstanding material preparation against zero market proof.

**Key tradeoffs:** Investing time in documentation and positioning (done well here) is necessary but insufficient without market validation. The product looks more mature than it has been proven to be.

**Improvement recommendations:**
- Convert at least one design-partner engagement into a reference-able outcome (even a "this team used ArchLucid for X and observed Y" statement is enough).
- Get the Azure Marketplace SaaS listing published — even as a trial SKU. Marketplace presence is a strong signal for enterprise procurement teams.
- Replace the synthetic Contoso Retail case study with a lightly fictionalized but sourced reference narrative.
- Publish a real metrics screenshot or export from a real pilot run on the `/why-archlucid` route.

**Fixability:** Primarily blocked on user/business action (getting a real customer). Engineering support can improve demo credibility and the `/why-archlucid` page with real telemetry data.

---

### 3.2 Adoption Friction — Score: 60 | Weight: 6 | Weighted Deficiency: 240

**Score justification:** The Core Pilot path is 4 steps and is clearly documented. Simulator mode eliminates LLM costs in dev. Docker Compose profiles exist. The CLI `archlucid run --quick` seeds and commits in one step. But: the self-serve trial (`archlucid.net/signup`) is not confirmed live. New operators face a documentation tree of 200+ docs before they find the entry point. SQL Server is required even for a trial. The `DevelopmentBypass` mode is not available in production, so any real deployment requires JWT/API key configuration that new operators frequently misconfigure. The `SECOND_RUN.toml` template is a genuinely good idea but reaches operators only after they've already invested in the platform.

**Key tradeoffs:** The breadth of capability creates inherent onboarding friction. Progressive disclosure in the UI is a good mitigation but doesn't address the infrastructure setup cost.

**Improvement recommendations:**
- Ensure the hosted SaaS trial path (`staging.archlucid.net/signup` → provision tenant → seed data → first wizard) runs end-to-end without manual intervention.
- Add a single-command Docker demo that works without a SQL Server (in-memory/embedded for demo only).
- Consolidate the "new operator in < 5 minutes" path to a single doc or interactive wizard page — do not make operators navigate `READ_THIS_FIRST.md → CORE_PILOT.md → PILOT_GUIDE.md` before getting value.

**Fixability:** Largely engineering-actionable for V1.

---

### 3.3 Time-to-Value — Score: 68 | Weight: 7 | Weighted Deficiency: 224

**Score justification:** The Core Pilot 4-step path is solid. Simulator mode delivers deterministic outputs in seconds. The `archlucid run --quick` one-liner is a genuinely fast path. The value delivered after a successful first run (manifest, artifacts, findings) is tangible and reviewable. The score is limited by: (a) the trial path not being confirmed live, (b) the time cost of environment setup before the first run, and (c) the fact that without live LLM integration, the pilot "value" is simulator-generated and not architecture-specific to the customer's system.

**Key tradeoffs:** Simulator-first reduces onboarding friction but creates a "first real run" moment that feels different from demo expectations. The transition from simulator to real LLM mode requires additional configuration.

**Improvement recommendations:**
- Document and test the "first meaningful output with real LLM" path separately from the simulator path.
- Ensure the first-run wizard pre-fills with a sample architecture brief so operators don't stare at a blank form.
- Add time-to-first-committed-manifest telemetry to the product onboarding funnel (the metric exists: `archlucid_first_session_completed_total`; surface it in the operator dashboard).

**Fixability:** Largely engineering-actionable for V1.

---

### 3.4 Proof-of-ROI Readiness — Score: 65 | Weight: 5 | Weighted Deficiency: 175

**Score justification:** The ROI model is detailed and grounded in industry benchmarks. The pilot scorecard exists. The value report DOCX is generatable from the operator UI. The sponsor one-pager PDF endpoint is documented. First-commit badge for temporal anchoring is implemented. The gap: all numbers are hypothetical. No real customer data has been fed into the model. The worked example uses synthetic numbers. The ROI claim ($294K annual savings for a 6-architect team) is plausible but unvalidated.

**Key tradeoffs:** A detailed ROI model without validation data is a starting point for a sales conversation, not a closing argument.

**Improvement recommendations:**
- Add a "baseline measurement" step to the pilot guide that captures pre-pilot effort data so the ROI comparison is grounded in the customer's own numbers.
- Ensure the value report DOCX correctly populates from real run data, not just template placeholders.
- Build a simple ROI calculator on the `/why-archlucid` or `/pricing` page that asks for inputs and shows projected savings.

**Fixability:** Partially engineering-actionable for V1.

---

### 3.5 Executive Value Visibility — Score: 63 | Weight: 4 | Weighted Deficiency: 148

**Score justification:** The executive sponsor brief is well written, honest, and appropriately scoped. The sponsor banner and first-value-report PDF are implemented. The governance dashboard, compliance drift chart, and `/why-archlucid` telemetry page exist. The gap: no confirmed live deployment means no real executive can log in and see their organization's data in the product. The "Day N since first commit" badge is clever but requires a real first commit to display.

**Key tradeoffs:** Executive value visibility is a lagging indicator — it requires successful operator adoption first.

**Improvement recommendations:**
- Ensure the governance dashboard and compliance trend chart render correctly with demo data.
- Add a "Share with sponsor" feature that generates a lightweight digest of run activity for a given time window.
- Make the sponsor brief PDF downloadable from a public marketing route for pre-trial eval.

**Fixability:** Largely engineering-actionable for V1.

---

### 3.6 Workflow Embeddedness — Score: 55 | Weight: 3 | Weighted Deficiency: 135

**Score justification:** Azure DevOps integration exists. Microsoft Teams integration exists. SCIM provisioning exists. CloudEvents webhooks are available as a generic egress path. The Jira, ServiceNow, and Confluence connectors that most enterprise teams require for their architecture governance workflows are explicitly deferred to V1.1. Without bidirectional ITSM integration, ArchLucid is a parallel workflow rather than part of the primary workflow. Architects will not adopt a tool that requires them to leave their existing issue-tracking ecosystem to review architecture findings.

**Key tradeoffs:** Native ITSM integration is V1.1; V1 can mitigate with improved webhook documentation and example payloads.

**Improvement recommendations:**
- Publish reference webhook payload examples (finding → JSON event) that teams can use to hand-wire Jira or ServiceNow during V1.
- Make the CloudEvents schema machine-readable (JSON Schema or AsyncAPI) so customers can write their own connectors.
- Accelerate the ServiceNow connector timeline — it is confirmed as V1.1 priority and is blocking enterprise deals now.

**Fixability:** Partial V1 improvement possible; full connector requires V1.1.

---

### 3.7 Correctness — Score: 68 | Weight: 4 | Weighted Deficiency: 128

**Score justification:** Multi-level test gates exist (unit, integration, E2E, live API). Schemathesis API fuzzing runs on every PR. OWASP ZAP baseline runs in CI. Agent output quality scoring (structural completeness + semantic quality) is implemented. Simulator mode enables deterministic test coverage. However: `ArchLucid.Persistence` sits at ~39.66% per-package line coverage — below the 63% floor. `ArchLucid.Api` is at ~60.79% — also below the floor. The merged line coverage of ~72.95% is below the strict 79% target. These are not aspirational targets; they are CI-enforced gates that would fail a merge today. Fifteen tests failed in the local snapshot.

**Key tradeoffs:** The gap is largest in persistence and API layers — exactly where bugs in a multi-tenant system cause data isolation failures or silent data loss. These are the highest-risk gaps.

**Improvement recommendations:**
- Prioritize SQL-backed integration tests for the most common Persistence paths (run create, commit, manifest retrieval).
- Add controller-level unit tests for the ungated and governance-adjacent `ArchLucid.Api` controllers.
- Fix the fifteen local test failures before the next pilot demo.

**Fixability:** Engineering-actionable for V1.

---

### 3.8 Differentiability — Score: 71 | Weight: 4 | Weighted Deficiency: 116

**Score justification:** The differentiation claim is credible and backed by shipped features: `ExplainabilityTrace` on every finding, provenance graph with nodes/edges, 78 typed audit event constants with CI guard, pre-commit governance gate, and the multi-agent pipeline. These are concrete, verifiable, and not present in any competitor. The score is limited by: the inability to demonstrate the differentiation to a prospect without a live product instance, and the fact that the category is still so new that prospects may not know they need what ArchLucid offers.

**Key tradeoffs:** Differentiation on enterprise features (governance, audit trail) is harder to sell than differentiation on user-facing UX, because enterprise features require convincing a procurement team, not a practitioner.

**Improvement recommendations:**
- Surface the `ExplainabilityTrace` more prominently in the default run view so evaluators see it without asking.
- Add a "live explainability demo" deep link to the staging evaluation path.
- Build a one-page "ArchLucid vs [competitor]" comparison that maps specific features to specific API endpoints or UI routes (not just marketing copy).

**Fixability:** Largely engineering-actionable for V1.

---

### 3.9 Usability — Score: 65 | Weight: 3 | Weighted Deficiency: 105

**Score justification:** Progressive disclosure (essential/extended/advanced nav tiers) is well-designed. The Core Pilot 4-step path is clear. The Operator Atlas documents all routes. The onboarding tour and getting-started page exist. The score is limited by: the sidebar has 3 disclosure tiers with complex authority-shaped logic, the run detail page is dense with information, and the new-run wizard has 7 steps (for a happy path that could be 2–3). First-time operators face both product novelty (AI architecture analysis) and platform novelty (manifest lifecycle, authority tiers).

**Key tradeoffs:** A feature-rich product has inherent usability tension. Progressive disclosure is the right strategy but needs tuning to minimize the default surface area further.

**Improvement recommendations:**
- Reduce the new-run wizard from 7 steps to 4 by combining "system identity" and "requirements" into a single free-text-first step with optional structured fields.
- Add inline tooltips on finding severity labels so operators understand the governance implications without leaving the page.
- Add a prominent "What happens next?" message on the run detail page after commit.

**Fixability:** Engineering-actionable for V1.

---

### 3.10 Trustworthiness — Score: 65 | Weight: 3 | Weighted Deficiency: 105

**Score justification:** Multi-tenant RLS with SQL `SESSION_CONTEXT`, fail-closed content safety guard, `DevelopmentBypass` blocked in production, OWASP ZAP in CI, Schemathesis fuzzing, STRIDE threat model, and append-only `dbo.AuditEvents` are all genuine trustworthiness assets. The score is limited by: no completed independent pen test (SoW exists, report is a placeholder), no SOC 2 attestation, simulator-generated outputs cannot be independently validated for accuracy, and the "AI said so" problem is only partially mitigated by `ExplainabilityTrace` (which is still LLM-generated text, not verified reasoning).

**Key tradeoffs:** Trustworthiness claims in AI systems require more evidence than in deterministic systems. Explainability is necessary but not sufficient for enterprise trust.

**Improvement recommendations:**
- Complete the pen test engagement (SoW is awarded — execute it).
- Publish the redacted pen test summary in the Trust Center when available.
- Add a "Trust posture: pre-SOC 2 with roadmap to Type I Q1 2027" statement to the Trust Center page so prospects are not surprised.
- Surface the `IsDemoData=true` banner prominently in all demo contexts to prevent screenshots from being quoted as production evidence.

**Fixability:** Partially engineering-actionable (Trust Center improvements); pen test requires user action.

---

### 3.11 Compliance Readiness — Score: 52 | Weight: 2 | Weighted Deficiency: 96

**Score justification:** CAIQ/SIG pre-fills exist. DPA template is available. DSAR process is documented. Subprocessors are listed. Privacy policy exists. The COMPLIANCE_MATRIX.md is present. SOC 2 self-assessment exists. The score is limited by: no SOC 2 report (roadmap targets Type I in Q1 2027), no completed pen test, no formal ISMS policies, no HR/training records, no independent BCP test, and no regulatory certifications (HIPAA, ISO 27001, etc.). Enterprise procurement teams in regulated industries will require at minimum a SOC 2 Type I before signing an annual contract.

**Key tradeoffs:** Compliance readiness is largely a function of time and money spent on the attestation process, not engineering effort. The code is more compliant than the paper trail reflects.

**Improvement recommendations:**
- Initiate auditor selection immediately — the SOC 2 Type I observation period in Q1 2027 requires starting the process now.
- Publish the SOC 2 self-assessment to the Trust Center so security reviewers see evidence of process, not just roadmap promises.
- Complete CAIQ/SIG with full responses rather than partial pre-fills.

**Fixability:** Cannot complete SOC 2 without user action; CAIQ/SIG and self-assessment improvements are engineering-actionable.

---

### 3.12 Security — Score: 70 | Weight: 3 | Weighted Deficiency: 90

**Score justification:** Security posture is strong for an early-stage product: fail-closed auth defaults, RBAC with four roles, API key + JWT dual mode, content safety guard mandatory in production, SQL `DENY UPDATE/DELETE` on audit table, rate limiting with role-aware partitioning, private endpoints specified in Terraform, no SMB exposure. Schemathesis + ZAP in CI are beyond what most comparable products ship. Gaps: no completed pen test, no WAF rule tuning evidence, SCIM tokens are managed outside standard auth flows (potential misuse), and `ApiKey` mode maps all keys to Admin or Reader only (coarse-grained for Enterprise).

**Key tradeoffs:** Security is strong in defaults but the audit path still has "swallowed exception" patterns on non-critical paths that could mask issues in production.

**Improvement recommendations:**
- Add structured logging for all swallowed security-adjacent exceptions (circuit breaker audit bridge, durable audit retry exhaustion) so Operations can detect them via alerts.
- Add WAF custom rules documentation to the Terraform modules.
- Tighten the SCIM token lifecycle: add rotation runbook and audit events for token creation/revocation.

**Fixability:** Engineering-actionable for V1.

---

### 3.13 Decision Velocity — Score: 55 | Weight: 2 | Weighted Deficiency: 90

**Score justification:** The demo mode exists (`DemoEnabled` feature gate), the `/demo/explain` route renders the provenance graph and citation-bound explanation, and the Showcase seeded data route is implemented. The score is limited by: the staging deployment (`staging.archlucid.net`) is not confirmed live, the demo route requires the `DemoEnabled` flag which is off by default in production, and prospects cannot self-evaluate without either accessing a staging instance or running a Docker container locally. The "decide to buy" path is too long for a prospect who just wants to see the product.

**Key tradeoffs:** A gated demo protects production deployments but slows the commercial funnel when there is no live staging instance to share.

**Improvement recommendations:**
- Publish `staging.archlucid.net` and ensure the Showcase and `/demo/explain` routes are accessible without authentication.
- Add a "Book a live demo" CTA to the public marketing pages that bypasses the self-serve trial for enterprise prospects who want a guided walkthrough.
- Add a one-click Docker Compose demo profile that populates sample data and opens a browser with no configuration required.

**Fixability:** Engineering-actionable for V1.

---

### 3.14 Procurement Readiness — Score: 58 | Weight: 2 | Weighted Deficiency: 84

**Score justification:** MSA template, DPA template, order form template, procurement pack cover, and trust center exist. Pricing is documented. Azure Marketplace SaaS offer is designed. The score is limited by: no live Marketplace listing, no SOC 2 report to attach to procurement questionnaires, no completed pen test summary, no reference customers to list on the order form, and the MSA is a template requiring legal review rather than a pre-signed standard contract.

**Key tradeoffs:** Procurement readiness is mostly blocked on compliance certification and market validation, not on documentation quality.

**Improvement recommendations:**
- Publish the Azure Marketplace SaaS offer (even as a trial SKU) to give procurement teams a familiar purchase vehicle.
- Complete the SOC 2 self-assessment and CAIQ/SIG responses to the maximum extent possible before the formal attestation.
- Add a "what enterprises typically ask and our current answer" FAQ to the Trust Center.

**Fixability:** Partially engineering-actionable (Trust Center improvements, Marketplace publishing); SOC 2 requires user action.

---

### 3.15 Architectural Integrity — Score: 72 | Weight: 3 | Weighted Deficiency: 84

**Score justification:** The architecture is clean and layered: Core, Application, API, Persistence, Worker, Host.Composition. C4 documentation at all three levels. Dapper over EF Core (appropriate for the data access patterns). DbUp migrations for SQL. The DI registration map is maintained. Clear bounded contexts and project separation. The score is limited by: 50+ projects creates navigation overhead and coordination cost disproportionate to the current team size. The Persistence layer is split into 6+ sub-projects (Persistence, Persistence.Advisory, Persistence.Alerts, Persistence.Coordination, Persistence.Integration, Persistence.Runtime) which is architecturally coherent but adds friction. Coordinator and application orchestration layers sometimes overlap.

**Key tradeoffs:** Over-modularization is a common early-stage mistake that reflects good intentions but increases maintenance cost. Consolidation will require effort later.

**Improvement recommendations:**
- Evaluate merging the 6 Persistence sub-projects into 2–3 (e.g., Persistence.Core, Persistence.Advisory, Persistence.Governance) to reduce solution overhead.
- Add an Architecture Test project (already exists as `ArchLucid.Architecture.Tests`) with rules that enforce the intended layer dependencies so architectural drift is caught in CI.

**Fixability:** Engineering-actionable for V1; full consolidation is a V1.1 refactor.

---

### 3.16 Interoperability — Score: 60 | Weight: 2 | Weighted Deficiency: 80

**Score justification:** REST API with OpenAPI/Swagger, CloudEvents webhooks, Azure DevOps integration, Teams integration, SCIM 2.0 provisioning, and a Billing Marketplace webhook controller exist. The score is limited by: no Jira, ServiceNow, or Confluence connectors in V1 (deferred), and the webhook schema is not published as a machine-readable AsyncAPI document that would allow customers to write their own consumers.

**Improvement recommendations:**
- Publish the CloudEvents schema as an AsyncAPI or JSON Schema document in the `/schemas` directory.
- Add a webhook test harness to the CLI (`archlucid webhooks test <event-type>`) so operators can verify their endpoint before going live.
- Publish sample webhook consumers for Jira and ServiceNow as reference implementations, even if not first-party connectors.

**Fixability:** Engineering-actionable for V1.

---

### 3.17 Commercial Packaging Readiness — Score: 60 | Weight: 2 | Weighted Deficiency: 80

**Score justification:** Three pricing tiers (Team/Professional/Enterprise) are documented and enforced via `[RequiresCommercialTenantTier]` at the API level. CI guard for pricing single-source. Stripe Checkout configured. Azure Marketplace SaaS offer designed. The score is limited by: the commercial enforcement coverage is acknowledged as incomplete — not all endpoints are tier-gated. The Marketplace listing is not confirmed live. The Stripe Checkout is configured but the trial-to-paid conversion path is not confirmed end-to-end.

**Improvement recommendations:**
- Audit all API controllers for missing `[RequiresCommercialTenantTier]` attributes and add them where appropriate.
- Publish the Azure Marketplace SaaS listing — this is blocking enterprise procurement.
- Add an integration test that verifies a free-tier tenant receives 404 on Standard-gated routes.

**Fixability:** Engineering-actionable for V1 (enforcement audit); Marketplace publishing requires user action.

---

### 3.18 Traceability — Score: 75 | Weight: 3 | Weighted Deficiency: 75

**Score justification:** 117 typed audit event constants with CI guard, append-only `dbo.AuditEvents` with `DENY UPDATE/DELETE`, `ExplainabilityTrace` on every finding, provenance graph with nodes/edges, correlation IDs across requests, and keyset-paginated audit retrieval. The score is limited by: some mutation paths still emit baseline-channel-only audit (structured logs, not durable SQL rows), and the audit search is capped at 500 rows per request.

**Improvement recommendations:**
- Close remaining baseline-only audit gaps — audit the `AUDIT_COVERAGE_MATRIX.md` known-gaps section and promote the highest-risk paths to durable writes.
- Add a "traceability completeness score" to the operator dashboard so operators can see what percentage of their tenant's events are fully traced.

**Fixability:** Engineering-actionable for V1.

---

### 3.19 Reliability — Score: 68 | Weight: 2 | Weighted Deficiency: 64

**Score justification:** Circuit breaker pattern, outbox pattern for integration events, retry with exponential backoff on critical audit paths, health endpoints, RTO/RPO targets documented, chaos testing docs, degraded mode documented. The score is limited by: no evidence of chaos testing actually being run (docs exist but game day log is sparse), no confirmed geo-failover drill result, and the critical-path durable audit retry exhausts silently (exception swallowed after 3 attempts).

**Improvement recommendations:**
- Run the chaos testing game day drill and record results in `docs/quality/game-day-log/`.
- Add a structured log line with error level (not swallowed) when durable audit retry exhausts — this is a data loss event and must surface to Operations.
- Add a Prometheus alert rule for `archlucid_data_consistency_alerts_total` > 0.

**Fixability:** Engineering-actionable for V1.

---

### 3.20 Maintainability — Score: 69 | Weight: 2 | Weighted Deficiency: 62

**Score justification:** Terse C# style rules enforced via Cursor rules. Primary constructors used appropriately. Early return pattern consistent. LINQ over foreach. Expression-bodied members. Project map documented. The score is limited by: 50+ projects increases cognitive load for maintainers, some over-abstraction in the Persistence split, and the DI registration map is a manually maintained doc (risk of drift).

**Improvement recommendations:**
- Add an architecture test that validates DI registrations by actually resolving key service types from the DI container in a test host — this is more reliable than maintaining a doc manually.
- Consolidate the most granular Persistence sub-projects.

**Fixability:** Engineering-actionable for V1.

---

### 3.21 Data Consistency — Score: 70 | Weight: 2 | Weighted Deficiency: 60

**Score justification:** `DataConsistencyOrphanProbeHostedService` detects orphan rows. Quarantine mode exists. Alert mode with OTel metrics. SQL FK constraints on primary run tables. Append-only audit enforcement at DB level. The score is limited by: the orphan probe is detection-only by default (`Warn` mode in code; `Alert` in shipped config), the quarantine mechanism is for manifests only (not all orphaned tables), and the probe runs on a schedule rather than inline with mutations.

**Improvement recommendations:**
- Enable `AutoQuarantine` for golden-manifest orphans in the default shipped config.
- Add a `DataConsistencyReportController` endpoint that operators can query to see the current orphan count by table without reading Prometheus.

**Fixability:** Engineering-actionable for V1.

---

### 3.22 AI/Agent Readiness — Score: 70 | Weight: 2 | Weighted Deficiency: 60

**Score justification:** Multi-agent pipeline (Topology, Cost, Compliance, Critic), `ILlmProvider` with `FallbackAgentCompletionClient` for multi-vendor, simulator mode for CI, structural completeness + semantic quality scoring with configurable quality gates, prompt injection CI eval, content safety guard. The score is limited by: product learning "brains" (deterministic theme derivation, plan-draft builder) are deferred, and the semantic quality score (0.0–1.0) is a heuristic with no external ground truth validation.

**Improvement recommendations:**
- Document the semantic scoring methodology so operators can understand and tune the quality gate threshold.
- Add a CLI command (`archlucid eval <runId>`) that shows the structural completeness and semantic quality scores for a committed run.

**Fixability:** Engineering-actionable for V1; learning brains are correctly deferred.

---

### 3.23 Azure Compatibility and SaaS Deployment Readiness — Score: 74 | Weight: 2 | Weighted Deficiency: 52

**Score justification:** Azure Container Apps with Terraform, Azure Front Door / WAF, private endpoints enforced, Key Vault integration, Entra ID OIDC, Azure Service Bus for messaging, Azure OpenAI integration, Azure Content Safety. The Terraform modules cover 20+ infrastructure components. The `apply-saas.ps1` script is documented. The score is limited by: `staging.archlucid.net` is not confirmed live, DNS and Front Door custom domains are still being attached per the documentation, and ACR production image push is documented as a gap.

**Improvement recommendations:**
- Confirm `staging.archlucid.net` is live and reachable via the documented smoke check.
- Add an ACR push step to the CI pipeline for the API Docker image.
- Add a Terraform `plan` output to PR CI so infrastructure changes are reviewed before deployment.

**Fixability:** Engineering-actionable for V1.

---

### 3.24 Explainability — Score: 75 | Weight: 2 | Weighted Deficiency: 50

**Score justification:** `ExplainabilityTrace` with 5 structured fields on every finding, provenance graph, citation-bound aggregate explanation, faithfulness checking (token overlap heuristic with aggregate fallback), explanation aggregate fallback when faithfulness is low, finding inspector endpoint. This is the product's strongest engineering story and a genuine differentiator. The score is limited by: the faithfulness check is a heuristic (token overlap), not a semantic similarity measure, and the citation rendering in the UI requires the operator to click through to understand the evidence chain.

**Improvement recommendations:**
- Promote the provenance graph link to the default run view (not just behind "Show more links").
- Add a "confidence" label to each finding based on the structural completeness score so operators immediately see which findings are well-evidenced vs. partially evidenced.

**Fixability:** Engineering-actionable for V1.

---

### 3.25–3.46 Remaining Qualities (Summary Table)

| Quality | Score | Weight | Weighted Deficiency | Notes |
|---------|-------|--------|---------------------|-------|
| Auditability | 72 | 2 | 56 | Strong baseline; some mutation paths log-only |
| Policy & Governance Alignment | 73 | 2 | 54 | Pre-commit gate, approval workflows, SLA tracking all shipped |
| Cognitive Load | 60 | 1 | 40 | 200+ docs; progressive disclosure helps UI; docs navigation painful |
| Template/Accelerator Richness | 60 | 1 | 40 | SECOND_RUN template and wizard presets exist; could be richer |
| Stickiness | 62 | 1 | 38 | Advisory/digest features add retention; product learning brains deferred |
| Scalability | 65 | 1 | 35 | Outbox pattern, Redis/multi-region documented; not load-tested |
| Accessibility | 65 | 1 | 35 | jest-axe + live axe in CI; full WCAG audit not completed |
| Performance | 67 | 1 | 33 | Baselines documented; SQL index inventory reviewed; no load test results |
| Cost-Effectiveness | 67 | 1 | 33 | Simulator eliminates dev LLM cost; per-tenant cost model documented |
| Availability | 68 | 1 | 32 | 99.5% SLO target; degraded mode; geo-failover runbook exists |
| Manageability | 68 | 1 | 32 | Admin controller, SCIM, multi-tenant config all present |
| Extensibility | 68 | 1 | 32 | 10 finding engines, custom policy packs, CloudEvents all present |
| Customer Self-Sufficiency | 68 | 1 | 32 | CLI doctor, support bundle, correlation IDs, troubleshooting guide |
| Change Impact Clarity | 68 | 1 | 32 | BREAKING_CHANGES.md, compare/diff run, Phase 7 tracking |
| Deployability | 70 | 1 | 30 | Docker Compose, Terraform, DbUp auto-migrate — solid |
| Modularity | 70 | 1 | 30 | Clean project separation; over-modularized (50+ projects) |
| Evolvability | 70 | 1 | 30 | ADRs, V1 scope contract, breaking changes tracked |
| Testability | 72 | 1 | 28 | DI interfaces, simulator, InMemory factories, Stryker — solid |
| Supportability | 72 | 1 | 28 | CLI doctor/bundle, health endpoints, correlation IDs, runbooks |
| Observability | 74 | 1 | 26 | 30+ OTel metrics, 117 audit events, Prometheus/Grafana/AI — strong |
| Azure Ecosystem Fit | 78 | 1 | 22 | Entra, Service Bus, Container Apps, OpenAI, Content Safety — excellent fit |
| Documentation | 82 | 1 | 18 | 200+ docs, CI guards on format, budget guard — exceptional for stage |

---

## 4. Top 10 Most Important Weaknesses

1. **No real customers.** Every commercial claim rests on synthetic data, a fabricated case study, and hypothetical ROI numbers. This is the single most limiting factor to revenue generation.

2. **ArchLucid.Persistence test coverage at ~39.66%** — below the 63% strict-profile floor. In a multi-tenant system, under-tested persistence paths create data isolation risk and regression exposure. This is the highest-severity engineering gap.

3. **No SOC 2 attestation and no completed pen test.** Enterprise procurement teams in regulated industries will not sign annual contracts without a SOC 2 report. The current posture (roadmap + self-assessment + SoW) is appropriate for pilots but not for revenue-generating contracts.

4. **Self-serve trial path not confirmed live.** The `archlucid.net` and `staging.archlucid.net` deployment is referenced but not confirmed. A non-functional trial URL is a hard stop for the self-serve commercial funnel.

5. **No Jira/ServiceNow/Confluence integration in V1.** Enterprise architects work in ITSM tools. A governance product that cannot push findings to where architects already work will be adopted as a parallel workflow, not an embedded one — which limits stickiness and renewal.

6. **Commercial tier enforcement is incomplete.** Not all API endpoints are gated by `[RequiresCommercialTenantTier]`. This creates revenue leakage risk and undermines the pricing model integrity.

7. **Simulator mode outputs are non-specific.** The first impression a pilot evaluator gets is from simulator-generated findings, not architecture-specific analysis of their system. The gap between "interesting demo" and "useful for my team" requires a successful real-LLM run, which requires additional configuration.

8. **Decision velocity is blocked on staging availability.** Prospects cannot self-evaluate without either a live staging URL or running Docker locally. The sales cycle is therefore dependent on sales-led demos, which does not scale.

9. **Audit coverage has known gaps in baseline-only paths.** Some mutating flows emit structured logs only, not durable `dbo.AuditEvents` rows. For governance and compliance workflows, this creates an incomplete audit trail.

10. **Documentation cognitive overload.** 200+ docs are exceptional for engineering depth but overwhelming for a new operator. The "forced decision-tree" entry in `READ_THIS_FIRST.md` helps but does not fully solve the discoverability problem for non-technical buyers who arrive at the repo.

---

## 5. Top 5 Monetization Blockers

1. **No reference customers or validated ROI data.** Enterprise buyers ask "who else uses this?" Silence ends deals before proposals are written.

2. **No live self-serve trial path.** If `archlucid.net/signup` is not live, the bottom-of-funnel conversion path does not exist. All revenue requires a direct sales conversation.

3. **Azure Marketplace listing not published.** Enterprise companies with Azure MACC commitments strongly prefer Marketplace purchases. Not being on Marketplace means missing the lowest-friction enterprise purchase channel.

4. **No SOC 2 report.** For enterprise deals > $50K ACV, a SOC 2 Type I is typically required by procurement. The current posture blocks any deal where security review is required.

5. **Incomplete commercial tier enforcement.** If ungated routes allow free-tier tenants to access Standard-tier features, the pricing model leaks. Worse: if discovered by a paying customer, it creates trust and contract risk.

---

## 6. Top 5 Enterprise Adoption Blockers

1. **No SOC 2 / formal compliance attestation.** Security reviewers at regulated enterprises have a checklist. "SOC 2 roadmap targeting Q1 2027" satisfies nothing on that checklist today.

2. **No Jira/ServiceNow integration in V1.** Enterprise architecture governance workflows run through ITSM. A product that cannot push findings to Jira or ServiceNow will sit alongside the workflow, not inside it.

3. **No confirmed completed pen test.** Most enterprise procurement security reviews require a pen test report dated within the last 12 months. The SoW is awarded but the report is a placeholder.

4. **SCIM provisioning is present but not deeply integrated into enterprise IdP flows.** Large organizations provision and deprovision users via Okta/Entra SCIM. The SCIM implementation needs documentation of tested IdP integrations, not just the controller.

5. **Multi-tenant data isolation cannot be demonstrated to a security reviewer without sharing the RLS implementation details.** The SQL `SESSION_CONTEXT` approach is correct but requires trust that the application layer always sets context. An independent pen test result would substitute, but it doesn't exist yet.

---

## 7. Top 5 Engineering Risks

1. **Persistence coverage gap creates blind spots in data isolation testing.** At ~39.66% per-package line coverage, significant persistence paths are untested. A bug in a multi-tenant query that doesn't set `SESSION_CONTEXT` could expose one tenant's data to another. This is the highest-severity engineering risk.

2. **Swallowed exceptions on critical audit retry paths mask data loss.** When `DurableAuditLogRetry` exhausts all 3 attempts, the exception is caught and the orchestration continues. This is correct behavior (audit must not break orchestration), but the failure is only logged, not alerted. An operator running for a week with a broken audit path would not know.

3. **Simulator-to-real-LLM transition is under-tested.** The majority of test coverage runs against the simulator. The real LLM path has different failure modes (rate limiting, model unavailability, content safety blocks, malformed JSON responses) that are exercised in integration tests but not as thoroughly as the happy path.

4. **Commercial tier enforcement gaps enable tier bypass.** Known incomplete gating means a determined free-tier user could discover and call Standard-tier endpoints. For an enterprise product, this is a commercial and trust risk.

5. **Azure Marketplace billing webhook integration is not end-to-end tested.** `BillingMarketplaceWebhookController` and `BillingStripeWebhookController` exist, but a billing failure in a production multi-tenant environment would not be caught by the existing test suite. Revenue collection depends on these paths being correct.

---

## 8. Most Important Truth

**ArchLucid has built a technically impressive product with outstanding documentation, but it has zero confirmed external validation. The gap between "impressive" and "purchased" is filled only by real customers using the product and sharing their experience. Everything else — the ROI model, the competitive landscape, the sponsor brief, the pricing tiers — is scaffolding waiting for a building to be constructed on it. The highest-leverage action available is not improving the code or the docs. It is getting one real architecture team to run a real pilot, committing a real manifest, and allowing a fragment of their experience to be referenced publicly.**

---

## 9. Top Improvement Opportunities

---

### Improvement 1: Lift ArchLucid.Persistence Test Coverage Above 63% Per-Package Floor

**Why it matters:** `ArchLucid.Persistence` at ~39.66% is the largest coverage gap in the codebase and the highest-risk one — untested multi-tenant persistence paths create data isolation risk.

**Expected impact:** Directly improves Correctness (+6–8 pts), Data Consistency (+4–5 pts), Security (+2–3 pts). Weighted readiness impact: **+0.6–0.9%**.

**Affected qualities:** Correctness, Data Consistency, Security, Testability.

**Status:** Fully actionable now.

**Impact of running this prompt:** Raises `ArchLucid.Persistence` per-package line coverage from ~39.66% toward the 63% floor, unblocks the strict CI gate, reduces multi-tenant data isolation risk, and brings merged line coverage meaningfully closer to the 79% target.

**Cursor prompt:**

```
Target: ArchLucid.Persistence.Tests project

Goal: Raise ArchLucid.Persistence per-package line coverage from approximately 39.66% to above 63% to meet the strict CI profile floor enforced by scripts/ci/assert_merged_line_coverage_min.py.

Context:
- Coverage is measured in CI by the dotnet-full-regression job using dotnet test ArchLucid.sln with coverage.runsettings.
- SQL-backed tests require ARCHLUCID_SQL_TEST environment variable pointing to a reachable SQL Server.
- Many existing tests skip when ARCHLUCID_SQL_TEST is not set (InMemory fallback).
- The Persistence project is split into: ArchLucid.Persistence (core), ArchLucid.Persistence.Advisory, ArchLucid.Persistence.Alerts, ArchLucid.Persistence.Coordination, ArchLucid.Persistence.Integration, ArchLucid.Persistence.Runtime.

Instructions:
1. Read docs/library/COVERAGE_GAP_ANALYSIS.md and docs/library/COVERAGE_GAP_ANALYSIS_RECENT.md to identify the highest-priority uncovered paths in ArchLucid.Persistence.
2. Add unit tests (using InMemory or real SQL) for the top uncovered repository classes in ArchLucid.Persistence.Tests.
3. Focus first on: run repository (create/get/update), manifest repository (create/get), and audit repository (append/query) paths that are most likely to be called in production but not covered.
4. Follow the existing test pattern in ArchLucid.Persistence.Tests — use the same test base classes, DI factories, and SQL connection setup.
5. Do NOT add [ExcludeFromCodeCoverage] to avoid coverage — only use exclusions for infrastructure/composition code as documented in docs/library/coverage-exclusions.md.
6. Do NOT change production code unless a bug is found — these are coverage-only tests.
7. Verify each new test class follows CSharp-Terse-* style rules (primary constructors, guard clauses, early return, LINQ preference).

Acceptance criteria:
- dotnet test ArchLucid.Persistence.Tests runs green without ARCHLUCID_SQL_TEST (InMemory paths).
- Running assert_merged_line_coverage_min.py on merged Cobertura shows ArchLucid.Persistence per-package >= 63%.
- No new [ExcludeFromCodeCoverage] attributes added to production classes.
```

---

### Improvement 2: Commercial Tier Enforcement Audit and Remediation

**Why it matters:** Ungated routes allow lower-tier tenants to access Standard/Enterprise features, creating revenue leakage and commercial trust risk.

**Expected impact:** Directly improves Commercial Packaging Readiness (+8–12 pts), Traceability (+2–3 pts). Weighted readiness impact: **+0.3–0.5%**.

**Affected qualities:** Commercial Packaging Readiness, Trustworthiness, Traceability.

**Status:** Fully actionable now.

**Impact of running this prompt:** Closes commercial enforcement gaps, ensures free-tier tenants cannot access paid features, and adds integration test coverage that prevents regressions. This directly fixes a revenue and trust risk.

**Cursor prompt:**

```
Target: ArchLucid.Api/Controllers/**/*.cs, ArchLucid.Api.Tests

Goal: Audit all API controllers for missing [RequiresCommercialTenantTier] attributes and add them where the endpoint capability is restricted by tier in the product packaging docs.

Context:
- The attribute is defined in ArchLucid.Api/Attributes/RequiresCommercialTenantTierAttribute.cs.
- The filter is CommercialTenantTierFilter.cs.
- The factory is PackagingTierProblemDetailsFactory.cs.
- Current inventory of gated routes is in docs/library/COMMERCIAL_ENFORCEMENT_DEBT.md.
- Tier definitions are in docs/library/PRODUCT_PACKAGING.md — read this to understand which capabilities require Standard or Enterprise tier.
- The attribute returns HTTP 404 (not 402) by design — do not change this behavior.

Instructions:
1. Read docs/library/COMMERCIAL_ENFORCEMENT_DEBT.md and docs/library/PRODUCT_PACKAGING.md to understand the intended tier gating for each feature area.
2. List all API controllers and their action methods.
3. For each controller, determine from PRODUCT_PACKAGING.md whether the endpoint should be Standard-gated, Enterprise-gated, or free-tier accessible.
4. Add [RequiresCommercialTenantTier(TenantTier.Standard)] or [RequiresCommercialTenantTier(TenantTier.Enterprise)] to any controller or action that is missing the attribute but should be gated per the packaging docs.
5. Do NOT add tier gates to: health, version, auth, registration, demo, marketing, and trial endpoints — these must remain publicly accessible.
6. Add or update integration tests in ArchLucid.Api.Tests that verify:
   a. A free-tier tenant receives HTTP 404 on each newly gated route.
   b. A Standard-tier tenant can access Standard routes.
7. Update docs/library/COMMERCIAL_ENFORCEMENT_DEBT.md to reflect the new state.

Acceptance criteria:
- All capability areas identified in PRODUCT_PACKAGING.md as Standard or Enterprise tier have corresponding [RequiresCommercialTenantTier] attributes in the API.
- Integration tests pass verifying tier enforcement.
- No health, auth, or marketing endpoints are inadvertently gated.
- COMMERCIAL_ENFORCEMENT_DEBT.md is updated to "Debt / follow-ons" section only (no remaining known gaps).
```

---

### Improvement 3: Close Durable Audit Coverage Gaps for Baseline-Only Mutation Paths

**Why it matters:** Some mutating workflows emit structured logs only (baseline channel), not durable `dbo.AuditEvents` rows. For enterprise governance and compliance, this creates an incomplete audit trail.

**Expected impact:** Directly improves Auditability (+5–7 pts), Compliance Readiness (+3–4 pts), Trustworthiness (+2–3 pts). Weighted readiness impact: **+0.3–0.4%**.

**Affected qualities:** Auditability, Compliance Readiness, Traceability, Trustworthiness.

**Status:** Fully actionable now.

**Impact of running this prompt:** Closes the gap between baseline-only audit paths and the durable audit trail, making the governance evidence available in the Audit UI for more workflows. This directly improves the enterprise and compliance story.

**Cursor prompt:**

```
Target: ArchLucid.Application, ArchLucid.Api, docs/library/AUDIT_COVERAGE_MATRIX.md

Goal: Promote the highest-risk baseline-only audit paths to durable SQL audit writes so they appear in dbo.AuditEvents and are queryable via GET /v1/audit.

Context:
- The audit system has two channels: durable SQL (IAuditService → dbo.AuditEvents) and baseline mutation log (IBaselineMutationAuditService → structured ILogger only).
- The AUDIT_COVERAGE_MATRIX.md Known Gaps section lists paths that are log-only.
- Baseline-only paths do NOT appear in the operator Audit UI.
- The coordinator orchestrators already dual-write for Architecture.* events via BaselineMutationAuditArchitectureDurableWriter.
- Durable audit failures must NOT break orchestration — use the same fire-and-forget pattern as existing durable writes.

Instructions:
1. Read docs/library/AUDIT_COVERAGE_MATRIX.md to identify all paths marked as "baseline only" or "log only" in the Known Gaps section.
2. Rank them by business impact (governance, export, and advisory paths are highest priority for compliance).
3. For each high-priority path:
   a. Add an IAuditService.LogAsync call using the appropriate AuditEventTypes constant.
   b. If no suitable constant exists, add one to ArchLucid.Core/Audit/AuditEventTypes.cs and update the CI anchor comment (<!-- audit-core-const-count:N -->) in AUDIT_COVERAGE_MATRIX.md.
   c. Follow the fire-and-forget pattern (schedule on thread pool, swallow exception after logging) to prevent orchestration failure.
4. Add unit tests confirming that IAuditService.LogAsync is called with the correct event type for each promoted path.
5. Update AUDIT_COVERAGE_MATRIX.md to move promoted paths from Known Gaps to the durable audit table.

Constraints:
- Do NOT add synchronous audit calls on the hot path (use the same async/fire-and-forget pattern as existing durable writes).
- Do NOT fail the surrounding operation if audit write fails.
- Do NOT add new audit event types that duplicate existing ones — reuse where semantically correct.
- Update the CI anchor count comment when new constants are added.

Acceptance criteria:
- The identified baseline-only paths now appear in dbo.AuditEvents after operation.
- AUDIT_COVERAGE_MATRIX.md Known Gaps section is empty or has only explicitly documented exceptions.
- CI audit const count check passes (assert_audit_const_count.py).
- New unit tests pass verifying IAuditService.LogAsync calls.
```

---

### Improvement 4: Enhance the Decision Velocity Path with a No-Auth Demo Experience

**Why it matters:** Prospects cannot evaluate the product without either a live staging URL or a local Docker setup. This creates friction in the top-of-funnel commercial process.

**Expected impact:** Directly improves Decision Velocity (+12–15 pts), Adoption Friction (+4–6 pts), Marketability (+3–4 pts). Weighted readiness impact: **+0.4–0.6%**.

**Affected qualities:** Decision Velocity, Adoption Friction, Marketability, Time-to-Value.

**Status:** Fully actionable now.

**Impact of running this prompt:** Lowers the barrier for a prospect to evaluate the product by making the demo path accessible without authentication or local Docker setup. This directly accelerates the sales cycle.

**Cursor prompt:**

```
Target: archlucid-ui/src/app/(marketing)/demo/, ArchLucid.Api/Controllers/Demo/, docs/library/DEMO_PREVIEW.md

Goal: Ensure the /demo/explain and /demo/preview marketing routes render correctly from unauthenticated public access when DemoEnabled feature flag is true, and add a one-click "See a live run" CTA to the public marketing pages.

Context:
- The DemoViewerController and DemoExplainController provide demo data sourced from the seeded Contoso Retail Modernization tenant.
- The [FeatureGate(FeatureGateKey.DemoEnabled)] filter gates the demo routes and returns 404 in production when disabled.
- The /showcase/[runId] route exists for showcase runs.
- The marketing layout is in archlucid-ui/src/app/(marketing)/layout.tsx.

Instructions:
1. Verify that GET /v1/demo/explain and GET /v1/demo/preview return demo data correctly when DemoEnabled=true, without requiring any authentication header. Add an integration test confirming this.
2. Add a clear "See a live architecture review" CTA on the /get-started or /why pages (marketing layout) that deep-links to /demo/explain on the staging hostname.
3. Ensure the demo pages display the IsDemoData=true banner prominently (not just as a small chip) with text: "This is sample data from a seeded demonstration tenant. It does not represent any real organization's architecture."
4. Add a Docker Compose override profile (docker-compose.demo.yml) that:
   a. Starts the API with DemoEnabled=true and AuthMode=DevelopmentBypass.
   b. Seeds the Contoso Retail demo data on startup (using the existing seed endpoint or a startup hook).
   c. Starts the UI pointing to the local API.
   d. Opens a browser to /demo/explain on startup (or prints the URL clearly).
5. Document the one-command demo in docs/library/DEMO_PREVIEW.md: `docker compose -f docker-compose.yml -f docker-compose.demo.yml up`.

Constraints:
- Do NOT remove the [FeatureGate] protection — DemoEnabled must still be false by default in production builds.
- Do NOT allow demo routes to expose real tenant data.
- Do NOT change the demo data schema.

Acceptance criteria:
- GET /v1/demo/explain returns 200 with IsDemoData=true when DemoEnabled=true, without Authorization header.
- GET /v1/demo/explain returns 404 when DemoEnabled=false.
- The marketing page has a "See a live run" CTA that links to the demo route.
- docker compose -f docker-compose.yml -f docker-compose.demo.yml up starts successfully and seeds demo data.
- The demo banner is prominently displayed (not a small label) on the demo pages.
```

---

### Improvement 5: SOC 2 Evidence Pre-Assembly and CAIQ/SIG Completion

**Why it matters:** Procurement and compliance readiness are blocked by incomplete evidence packages. Pre-assembly of what is available now shortens the time to first enterprise deal.

**Expected impact:** Directly improves Compliance Readiness (+6–8 pts), Procurement Readiness (+5–7 pts). Weighted readiness impact: **+0.3–0.5%**.

**Affected qualities:** Compliance Readiness, Procurement Readiness, Trustworthiness.

**Status:** Fully actionable now (documentation-focused; does not require SOC 2 auditor engagement).

**Impact of running this prompt:** Completes all documentation-sourceable evidence for procurement reviewers, produces a reviewer-facing evidence pack, and elevates the procurement conversation from "we have a roadmap" to "here is our current evidence package."

**Cursor prompt:**

```
Target: docs/security/CAIQ_LITE_2026.md, docs/security/SIG_CORE_2026.md, docs/security/SOC2_SELF_ASSESSMENT_2026.md, docs/go-to-market/TRUST_CENTER.md, docs/go-to-market/CURRENT_ASSURANCE_POSTURE.md

Goal: Complete all documentation-sourceable fields in the CAIQ Lite, SIG Core, and SOC 2 self-assessment, and produce a consolidated procurement evidence pack that security reviewers can receive before an audit.

Context:
- The CAIQ Lite and SIG Core pre-fills exist but may have incomplete responses where evidence is available in the codebase.
- The SOC 2 self-assessment exists at docs/security/SOC2_SELF_ASSESSMENT_2026.md.
- The Trust Center is at docs/go-to-market/TRUST_CENTER.md.
- Evidence for controls is scattered across: docs/library/SECURITY.md, docs/security/SYSTEM_THREAT_MODEL.md, docs/library/AUDIT_COVERAGE_MATRIX.md, docs/security/MULTI_TENANT_RLS.md, docs/library/AUDIT_RETENTION_POLICY.md, docs/go-to-market/DPA_TEMPLATE.md, docs/go-to-market/SUBPROCESSORS.md, docs/go-to-market/INCIDENT_COMMUNICATIONS_POLICY.md.

Instructions:
1. Read each CAIQ Lite question and for each: identify whether the codebase, Terraform, or existing docs provide evidence for a "Yes" or "Partial" response. Fill in the response and cite the evidence doc.
2. Do the same for SIG Core.
3. Review SOC2_SELF_ASSESSMENT_2026.md and complete any unanswered control sections where evidence exists in the codebase.
4. Update docs/go-to-market/TRUST_CENTER.md to include a "Current evidence available" section with direct links to: self-assessment, CAIQ, SIG, DPA template, subprocessors, incident policy, STRIDE model, and the ZAP/Schemathesis CI evidence.
5. Create docs/go-to-market/PROCUREMENT_EVIDENCE_PACK_INDEX.md that lists all available evidence artifacts with a one-line description and status (Available / Planned / Blocked on audit).
6. Add a prominent disclaimer on the SOC 2 self-assessment and CAIQ: "This is an owner-completed self-assessment, not an independent auditor opinion. SOC 2 Type I attestation is targeted for Q1 2027."

Constraints:
- Do NOT fabricate or over-claim compliance status.
- Do NOT remove existing "Planned" status markers — replace them with "Available with evidence" only when evidence actually exists.
- Do NOT include specific price figures in any procurement doc — link to PRICING_PHILOSOPHY.md per the single-source rule.

Acceptance criteria:
- CAIQ_LITE_2026.md has responses for all questions where codebase or doc evidence exists.
- SIG_CORE_2026.md has responses for all questions where evidence exists.
- SOC2_SELF_ASSESSMENT_2026.md has no unanswered sections for implemented controls.
- PROCUREMENT_EVIDENCE_PACK_INDEX.md lists all available evidence artifacts.
- TRUST_CENTER.md links to the evidence pack index.
```

---

### Improvement 6: First-Session Cognitive Load Reduction

**Why it matters:** New operators face 200+ docs and a 7-step wizard before producing their first committed manifest. Every unnecessary step increases abandonment probability during trials.

**Expected impact:** Directly improves Cognitive Load (+8–12 pts), Adoption Friction (+4–5 pts), Time-to-Value (+3–4 pts), Usability (+3–4 pts). Weighted readiness impact: **+0.4–0.6%**.

**Affected qualities:** Cognitive Load, Adoption Friction, Time-to-Value, Usability.

**Status:** Fully actionable now.

**Impact of running this prompt:** Reduces operator abandonment during the first session, increases trial-to-committed-manifest conversion, and improves overall first impression quality.

**Cursor prompt:**

```
Target: archlucid-ui/src/app/(operator)/runs/new/NewRunWizardClient.tsx, docs/FIRST_RUN_WALKTHROUGH.md, docs/library/PILOT_GUIDE.md, archlucid-ui/src/app/(operator)/onboarding/

Goal: Reduce the friction of a new operator's first session from documentation discovery to first committed manifest.

Context:
- The new-run wizard currently has 7 steps (system identity, requirements, constraints, advanced inputs, submit).
- The CORE_PILOT.md defines the 4-step path operators need to follow.
- The getting-started page exists at archlucid-ui/src/app/(operator)/getting-started/page.tsx.
- The onboarding start page exists at archlucid-ui/src/app/(operator)/onboarding/start/page.tsx.
- The sidebar progressive disclosure (essential/extended/advanced) is implemented.
- READ_THIS_FIRST.md is the doc entry point.

Instructions:
1. Wizard simplification:
   a. Combine "system identity" and "requirements" into a single step: "Describe your system" with a free-text primary field and optional structured fields (revealed with "Add more detail").
   b. Move "advanced inputs" to a collapsible "Advanced options" section within the combined step.
   c. Result: 4 wizard steps maximum (Describe → Constraints → Review → Submit).
   d. Add a "Use a sample: Contoso Retail Modernization" preset button that pre-fills all fields from the demo data.

2. Getting-started page improvements:
   a. Add a prominent "Start your first run now" button that goes directly to the new-run wizard with the sample preset pre-selected.
   b. Add a "4 steps to your first manifest" visual timeline on the getting-started page showing: Create → Execute → Commit → Review.
   c. Remove links to extended documentation from the default getting-started view — add a "Learn more" expandable section at the bottom instead.

3. Documentation entry:
   a. Update READ_THIS_FIRST.md to include a "First time here?" path: one button, goes to getting-started page.
   b. Update FIRST_RUN_WALKTHROUGH.md to match the simplified 4-step wizard.

Constraints:
- Do NOT remove any wizard fields — only combine and reorder.
- Do NOT break existing tests for the wizard.
- Do NOT change API contracts.
- Ensure the combined step still passes all required field validation.

Acceptance criteria:
- The new-run wizard has 4 or fewer steps.
- The "Use a sample" preset fills all required fields.
- The getting-started page shows the 4-step timeline.
- Existing Playwright tests for the new-run wizard still pass.
- FIRST_RUN_WALKTHROUGH.md reflects the new wizard flow.
```

---

### Improvement 7: CloudEvents Webhook Schema Publication and Integration Guide

**Why it matters:** Enterprise teams need a machine-readable schema to build ITSM bridges in the absence of first-party Jira/ServiceNow connectors. Publishing the schema is a V1 workaround that reduces the V1.1 timeline pressure.

**Expected impact:** Directly improves Interoperability (+8–10 pts), Workflow Embeddedness (+4–6 pts), Adoption Friction (+2–3 pts). Weighted readiness impact: **+0.3–0.5%**.

**Affected qualities:** Interoperability, Workflow Embeddedness, Enterprise Adoption Friction.

**Status:** Fully actionable now.

**Impact of running this prompt:** Enables enterprise customers to hand-wire their own Jira/ServiceNow integrations without waiting for V1.1, reducing enterprise adoption friction and demonstrating commitment to open integration.

**Cursor prompt:**

```
Target: schemas/, docs/library/INTEGRATION_EVENTS_AND_WEBHOOKS.md, ArchLucid.Contracts/

Goal: Publish the ArchLucid CloudEvents webhook schema as machine-readable JSON Schema files and add a practical integration guide for hand-wiring Jira and ServiceNow.

Context:
- ArchLucid publishes integration events via Azure Service Bus using CloudEvents format.
- The event types and payload shapes are defined in ArchLucid.Contracts/ and ArchLucid.Contracts.Abstractions/.
- docs/library/INTEGRATION_EVENTS_AND_WEBHOOKS.md documents the events in prose.
- The schemas/ directory exists in the repo root.
- Jira and ServiceNow connectors are deferred to V1.1.

Instructions:
1. JSON Schema generation:
   a. For each integration event type in ArchLucid.Contracts, generate (or manually author) a JSON Schema file in schemas/events/<event-name>.schema.json.
   b. Include: event type string, CloudEvents metadata fields (specversion, source, subject, time), and the data payload shape.
   c. Add a schemas/events/README.md that lists all event types with their schema file path and a one-line description.

2. Integration guide:
   a. Add a new section to docs/library/INTEGRATION_EVENTS_AND_WEBHOOKS.md: "Hand-wiring Jira (V1 bridge)" that shows:
      - How to subscribe to finding-related CloudEvents via the webhook endpoint.
      - A sample Azure Logic App (or Function App) that receives a FindingCreated event and creates a Jira issue via Jira REST API.
   b. Add a "Hand-wiring ServiceNow (V1 bridge)" section similarly.
   c. Both sections must include: a complete sample event payload, the target Jira/ServiceNow API call, and a working curl example.

3. CLI test harness:
   a. Add a command to archlucid-ui CLI (or ArchLucid.Cli): archlucid webhooks test <event-type> --url <endpoint-url>
   b. The command sends a sample event payload of the specified type to the given URL and reports the HTTP response.
   c. Document the command in docs/library/CLI_USAGE.md.

Constraints:
- Do NOT implement the Jira or ServiceNow connectors — these are V1.1.
- Do NOT require any third-party library not already in the project.
- Schema files must be valid JSON Schema draft-07 or later.

Acceptance criteria:
- schemas/events/ contains one .schema.json per published event type.
- schemas/events/README.md lists all event types.
- INTEGRATION_EVENTS_AND_WEBHOOKS.md has Jira and ServiceNow bridge sections with working sample payloads.
- archlucid webhooks test command works and is documented in CLI_USAGE.md.
```

---

### DEFERRED: Real Customer Reference Story Activation

**Title:** DEFERRED — Real Customer Reference Story Activation

**Reason deferred:** No engineering action can substitute for a real customer willing to be referenced. This requires the user/founder to identify and enable at least one design-partner customer whose pilot experience can be quoted (even lightly fictionalized if needed).

**Information needed:**
- Is there a current design partner or early pilot customer whose outcome can be referenced (even with company name anonymized)?
- What was the observed time-to-manifest reduction, if any?
- Is a written testimonial or reference call possible?
- Would a "lightly fictionalized" reference (e.g., "a Fortune 500 healthcare company") be acceptable, or is a named reference required?

---

### Improvement 8 (added to replace DEFERRED): ArchLucid.Api Coverage Lift with Controller Unit Tests

**Why it matters:** `ArchLucid.Api` at ~60.79% per-package line coverage is below the 63% floor. Controller coverage is the most actionable gap — controllers are the entry points for all user-facing behavior.

**Expected impact:** Directly improves Correctness (+4–6 pts), Testability (+3–4 pts). Weighted readiness impact: **+0.3–0.5%**.

**Affected qualities:** Correctness, Testability, Reliability.

**Status:** Fully actionable now.

**Impact of running this prompt:** Raises `ArchLucid.Api` per-package line coverage toward the 63% floor, unblocks the strict CI gate, and improves confidence in controller-level behavior correctness. Combined with Improvement 1 (Persistence coverage), this achieves meaningful progress toward the merged 79% target.

**Cursor prompt:**

```
Target: ArchLucid.Api.Tests/Controllers/ and related controller unit test classes

Goal: Raise ArchLucid.Api per-package line coverage from approximately 60.79% to above 63% by adding targeted controller unit tests for the highest-gap controllers.

Context:
- The strict profile requires >= 63% per-package line for all ArchLucid.* assemblies.
- docs/library/CODE_COVERAGE.md and the CHANGELOG.md 2026-04-20 session list recently added coverage.
- The test pattern uses WebApplicationFactory or manual controller instantiation with mocked services.
- Controllers are organized under ArchLucid.Api/Controllers/ by domain area.

Instructions:
1. Read docs/library/CODE_COVERAGE.md and docs/library/COVERAGE_GAP_ANALYSIS_RECENT.md to identify the highest-coverage-gap controllers not yet covered.
2. For each identified controller (prioritize by line count and functional importance):
   a. Add a test class in ArchLucid.Api.Tests/Controllers/<Area>/<ControllerName>Tests.cs.
   b. Test: the happy path action (one test per public action method minimum).
   c. Test: the null/missing parameter guard path (returns 400 or 404 as appropriate).
   d. Test: the authorization-denied path if the controller uses [Authorize] policies.
3. Use the established test pattern in existing controller tests — WebApplicationFactory with DevelopmentBypass auth mode, or direct controller instantiation with mocked IMediator/service.
4. Focus on controllers in: Planning (ConversationController, ExplanationController, GraphController), Authority (AnalysisReportsController, RunAgentEvaluationController), and Governance (GovernanceBatchReviewResponse paths) — these are likely high-gap based on complexity.
5. Do NOT mock at the controller level — mock at the service/repository level so the controller logic itself is exercised.

Constraints:
- Do NOT add [ExcludeFromCodeCoverage] to avoid coverage.
- Do NOT change production controller logic to make tests easier.
- Follow CSharp-Terse-* style rules.
- Each test class in its own file.

Acceptance criteria:
- All new test files compile and pass.
- Running dotnet test ArchLucid.Api.Tests shows new tests contributing to coverage.
- assert_merged_line_coverage_min.py (local run) shows ArchLucid.Api >= 63% per-package line.
- No production code changes.
```

---

## 10. Pending Questions for Later

### Improvement 1 (Persistence Coverage)
- Are there specific Persistence paths that should remain excluded from coverage for documented reasons (beyond those already in `docs/library/coverage-exclusions.md`)?
- Is there an active SQL Server instance available for running the full regression suite locally?

### Improvement 4 (Demo Experience)
- Should the `docker-compose.demo.yml` seed the Contoso Retail demo data automatically, or should it require a manual `archlucid demo seed` step?
- Is the staging hostname `staging.archlucid.net` currently live and accessible? If not, what is the current state?

### Improvement 5 (SOC 2 Evidence)
- Has an auditor been selected for the SOC 2 Type I engagement?
- Is the pen test SoW (awarded) still on track for execution in Q2 2026?
- Are there specific CAIQ/SIG questions that have been deliberately left blank for legal review reasons?

### Real Customer Reference (DEFERRED)
- Is there a current design partner or early pilot customer whose outcome can be referenced?
- What pilot outcomes have been observed (time-to-manifest, finding quality, artifact usefulness)?
- Is a written testimonial, case study, or reference call possible?
- Would a lightly fictionalized reference be acceptable to the sales motion?

### Commercial Packaging (Improvement 2)
- Are there any intentionally ungated routes that should remain accessible to free-tier tenants beyond the documented exceptions (health, auth, marketing, trial)?
- Has the Azure Marketplace SaaS offer been submitted for review, or is it still in draft?

### Stripe/Billing (General)
- Is the Stripe Checkout live in test mode on staging, or is it still in configuration?
- Is the Azure Marketplace billing webhook being tested end-to-end?

---

*Assessment by: ArchLucid AI assistant, independent first-principles analysis, 2026-04-28*  
*Weighted score: 6,757 / 10,200 = 66.25%*  
*Prior assessments: not consulted.*
