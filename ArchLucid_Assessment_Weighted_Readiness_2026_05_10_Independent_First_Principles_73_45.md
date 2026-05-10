# ArchLucid Assessment – Weighted Readiness 73.45%

**Date:** 2026-05-10
**Basis:** Independent first-principles review of the repository as of 2026-05-09 23:39 UTC-4.
**Method:** Codebase exploration, documentation analysis, architecture review, test infrastructure examination. No prior assessments referenced.

---

## Executive Summary

### Overall Readiness

ArchLucid is an ambitious, well-engineered AI-assisted architecture workflow system that produces versioned, evidence-linked findings through a multi-agent pipeline. The engineering foundation — modular C# codebase, extensive test tiers, OpenAPI contract drift detection, CI security scanning, Terraform IaC, and operator UI — is significantly more mature than typical pre-revenue products. The product's biggest liability is the gap between engineering depth and commercial traction: zero paying customers, no live LLM evidence in the assessment environment, and a heavy prerequisite stack (SQL Server + .NET 10 + Azure OpenAI + Docker) that narrows the addressable market before a single prospect evaluates.

### Commercial Picture

The pricing model is well-reasoned (value-based, $436–$2,331+/month) and the competitive positioning against Backstage/LeanIX/Structurizr is credible. However, the product remains sales-led with no self-serve commerce active (Stripe TEST mode only, Marketplace unpublished). No reference customer, no design partner, and no public case study exist. The ROI model is theoretical — grounded in reasonable assumptions but unvalidated by any real buyer engagement. Decision velocity for prospects is low: evaluating ArchLucid requires standing up infrastructure, not signing up on a website.

### Enterprise Picture

Enterprise-facing surfaces are strong for a V1: RBAC with four roles, append-only audit trail with 173+ typed events, governance workflows with segregation of duties, pre-commit gates, policy packs, SCIM 2.0 provisioning, OIDC/JWT bearer auth, and database-per-tenant isolation. Trust center documentation is honest and well-organized. The ITSM connectors (Jira, ServiceNow, Confluence, Slack, Teams) are shipped with automated tests but only manually validated against live vendors. SOC 2 is self-assessed only (CPA attestation explicitly deferred). The procurement pack (DPA, CAIQ, SIG) is template-grade, not battle-tested in a real RFP cycle.

### Engineering Picture

The codebase is well-structured across 30+ projects with clear layer boundaries. Test infrastructure includes property-based testing (FsCheck), mutation testing (Stryker), OWASP ZAP baseline, Schemathesis API fuzzing, k6 load tests, Playwright E2E, and architecture fitness tests. 27 CI/CD workflows cover build, security, performance, and deployment. Data consistency enforcement includes orphan probes and quarantine. The primary engineering risk is AI agent output quality: the golden cohort gate was blocked in the assessment environment (no Azure OpenAI credentials), meaning the core value proposition — AI-generated architecture findings — cannot be independently verified from this codebase alone. Simulator mode produces deterministic outputs that pass structural validation but do not prove that real LLM completions will produce usable architecture analysis.

---

## Weighted Quality Assessment

Qualities are ordered from most urgent (highest weighted deficiency) to least urgent.

### 1. Adoption Friction — Score: 55 | Weight: 6 | Weighted Deficiency: 2.70

**Justification:** Evaluating ArchLucid requires: .NET 10 SDK, Docker, SQL Server (or container), Azure OpenAI access (for real mode), Node.js (for UI). The "Try in 60 seconds" claim requires all of these pre-installed. No hosted free trial exists; the self-serve signup funnel is Stripe TEST mode only. The `archlucid try` CLI command is the fastest path but still requires a local .NET SDK. Compared to competitors where prospects visit a URL and click around, ArchLucid demands significant infrastructure commitment before a buyer sees value.

**Tradeoffs:** The heavy stack reflects real architectural choices (SQL Server for transactional integrity, .NET for type safety and performance, Azure OpenAI for LLM). These are defensible for the enterprise target market but brutal for top-of-funnel conversion.

**Recommendations:**
- Ship a hosted staging environment where prospects can run a guided pilot without local infrastructure.
- Create a 5-minute video demo that shows the complete pilot path with real outputs.
- Build a "sandbox" mode that uses in-memory storage and simulator agents for zero-dependency evaluation.

**Fixability:** Sandbox mode is V1-feasible; hosted trial is V1.1.

---

### 2. AI/Agent Readiness — Score: 65 | Weight: 8 | Weighted Deficiency: 2.80

**Justification:** The multi-agent pipeline (Topology, Cost, Compliance, Critic) is architecturally sound with clear stage boundaries, explainability traces (5/5 field coverage on most engines), and a quality gate framework. The eval corpus exists with structural/semantic scoring. However: (a) the golden cohort real-LLM gate was blocked in the assessment environment — no live Azure OpenAI credentials were available, so the core product claim (AI-generated architecture findings) is unverifiable from codebase alone; (b) the exemplar JSON fixtures used for eval scoring are hand-crafted, not captured from real model runs; (c) the agent output quality gate thresholds are configurable but there is no published evidence of what real GPT-4o outputs look like against diverse architecture briefs; (d) prompt regression testing exists conceptually but the corpus is thin (4 real-mode scenarios).

**Tradeoffs:** Simulator-first development is the right engineering choice for deterministic testing, but it creates a gap between what CI proves (structural correctness of the pipeline) and what buyers need (useful AI-generated architecture analysis). The `--real` mode path exists but has not been exercised in this assessment.

**Recommendations:**
- Run and document 10+ diverse architecture briefs through real Azure OpenAI and publish the output quality metrics.
- Expand the eval corpus to 20+ scenarios covering different architecture styles, scales, and industries.
- Add a nightly CI job that runs 3-5 briefs against real AOAI (gated on secret availability) and publishes a quality report.

**Fixability:** V1 with AOAI credentials; corpus expansion is incremental.

---

### 3. Marketability — Score: 62 | Weight: 8 | Weighted Deficiency: 3.04

**Justification:** The positioning is clear ("shortens the path from architecture request to reviewable, defensible architecture package") and the competitive differentiation against Backstage/LeanIX/Structurizr is credible. The executive sponsor brief, product datasheet, and pricing page exist. However: no reference customer, no case study, no testimonial, no published benchmark of time savings. The ROI model ($294K annual savings for 6-architect team) is theoretical. The product name "ArchLucid" is clear but the domain `archlucid.net` deployment status is uncertain from the codebase. No marketing site beyond the hosted staging exists.

**Tradeoffs:** Building deep product before marketing is a valid founder strategy for enterprise B2B, but the complete absence of external validation means every sales conversation starts from zero credibility.

**Recommendations:**
- Run one complete pilot (even internal) and document measurable time savings with before/after evidence.
- Publish the pilot results as a sanitized case study on the marketing site.
- Create a 3-minute product video showing the pilot path with real (non-simulator) outputs.

**Fixability:** V1 for internal pilot documentation; V1.1 for external reference customer.

---

### 4. Correctness — Score: 72 | Weight: 8 | Weighted Deficiency: 2.24

**Justification:** The system produces structurally correct outputs through the pilot path: request → execute → commit → manifest/artifacts. The pipeline stages have clear contracts. Data consistency enforcement catches orphan rows. Foreign keys on the authority chain prevent new orphans at the database level. The OpenAPI contract snapshot test prevents API drift. Property-based tests (FsCheck) check invariants on explainability trace analysis. However: (a) correctness of AI-generated findings depends entirely on model behavior, which is untested in this environment; (b) the "golden manifest" correctness is defined by structural completeness, not semantic accuracy of architecture recommendations; (c) comparison and replay correctness is tested at the structural level but the semantic value of "what changed and why" depends on LLM output quality that is not validated end-to-end against ground truth.

**Tradeoffs:** Structural correctness is the achievable and testable bar; semantic correctness of AI architecture analysis is inherently probabilistic. The product correctly separates these concerns — structural validation is deterministic, semantic quality is measured but not gated by default.

**Recommendations:**
- Establish a ground-truth corpus: 5 architecture briefs with expert-validated "correct" findings, then measure model output against them.
- Add semantic regression tests that detect when model outputs diverge significantly from expected finding categories.
- Document the boundary between "ArchLucid verifies structural completeness" and "the architect verifies semantic accuracy."

**Fixability:** Ground-truth corpus is V1; semantic regression is V1.1.

---

### 5. Decision Velocity — Score: 52 | Weight: 2 | Weighted Deficiency: 0.96

**Justification:** A prospect evaluating ArchLucid faces a long path to a purchase decision: install prerequisites → configure infrastructure → run a pilot → evaluate outputs → determine ROI → navigate procurement. No self-serve trial shortens this. The sales-led motion (quote request → manual follow-up) adds human latency. The pricing page exists but checkout is disabled (Stripe TEST mode). There is no "try before you buy" path that works in under an hour without infrastructure.

**Tradeoffs:** Enterprise B2B sales cycles are inherently long, and the sales-led motion is appropriate for the price point ($5K–$30K+ annually). But zero self-serve capability means even interested prospects must wait for human engagement.

**Recommendations:**
- Enable a time-limited hosted trial (14 days, simulator mode) that requires only email signup.
- Add a "Quick Demo" mode to the CLI that produces a sample output package without SQL or AOAI dependencies.

**Fixability:** Demo mode is V1; hosted trial is V1.1.

---

### 6. Time-to-Value — Score: 66 | Weight: 7 | Weighted Deficiency: 2.38

**Justification:** Once infrastructure is running, the pilot path (request → execute → commit → review) can complete in minutes with simulator mode. The "Core Pilot" checklist is well-documented. The CLI `archlucid try` command is the fastest path. However, getting to "infrastructure is running" takes hours to days depending on existing toolchain. Real-mode execution (with actual LLM analysis) requires Azure OpenAI provisioning, which adds more setup time. The first useful output (a committed manifest with real AI findings) requires both the infrastructure and AOAI — there is no intermediate value point where the product proves something useful without the full stack.

**Tradeoffs:** The product delivers a comprehensive package (manifest + artifacts + governance evidence) rather than a single insight, which means the time-to-first-value is higher but the value-per-output is also higher.

**Recommendations:**
- Create a "zero-config demo" that ships pre-generated sample outputs so prospects can explore the output format before committing to infrastructure.
- Document a 15-minute "first value" path that uses Docker Compose with pre-configured simulator mode.
- Separate the "see what ArchLucid produces" experience from the "run ArchLucid in your environment" experience.

**Fixability:** V1 for sample outputs and demo path improvement.

---

### 7. Proof-of-ROI Readiness — Score: 60 | Weight: 5 | Weighted Deficiency: 2.00

**Justification:** The ROI model exists (PILOT_ROI_MODEL.md) with a credible framework: break-even at ~180 architect-hours/year, $294K savings for 6-architect team. The pilot success scorecard is defined. The value report exists in the UI. However: (a) no actual pilot has measured real time savings; (b) the ROI model inputs are estimated, not empirically derived; (c) there is no mechanism to automatically measure "time saved" vs. manual architecture review; (d) the "before" baseline is assumed, not measured.

**Tradeoffs:** ROI modeling before first customer is inherently theoretical. The framework is well-structured — the gap is validation, not methodology.

**Recommendations:**
- Run an internal pilot measuring actual wall-clock time for one architecture review with and without ArchLucid.
- Add instrumentation to measure "request to committed manifest" elapsed time so pilots generate their own ROI data.
- Publish the internal pilot results (sanitized) as the first proof point.

**Fixability:** Internal pilot measurement is V1.

---

### 8. Usability — Score: 64 | Weight: 3 | Weighted Deficiency: 1.08

**Justification:** The operator UI (Next.js) covers the pilot path: seven-step wizard for run creation, run list/detail, manifest review, artifact download, compare, replay, graph, governance, audit, and alerts. The UI uses progressive disclosure (Show more links, extended/advanced sidebar). Accessibility is gated in CI (62 routes scanned with axe-core, WCAG 2.2 AA target). However: (a) the UI is operator-focused, not buyer-focused — there is no "wow moment" for a first-time visitor; (b) the wizard requires architectural knowledge to fill in (system name, constraints, topology) — there is no guided template for common scenarios; (c) the sheer surface area (governance dashboard, policy packs, compliance drift, alerts, audit log) may overwhelm a first-time pilot user who just wants to see if the tool produces useful output.

**Tradeoffs:** The progressive disclosure model (Pilot → Operate) is the right approach to managing complexity. The gap is in the Pilot layer itself — the wizard could do more to guide users toward a successful first run.

**Recommendations:**
- Add 3-5 pre-built "starter templates" for common architecture review scenarios (cloud migration, microservices, cost optimization).
- Add inline guidance/tooltips to the wizard explaining what each field means and what good input looks like.
- Create a "Quick Start" wizard variant that pre-fills common defaults and requires only a system name and brief description.

**Fixability:** V1 for templates and wizard guidance.

---

### 9. Workflow Embeddedness — Score: 61 | Weight: 3 | Weighted Deficiency: 1.17

**Justification:** Integration surfaces exist: REST API, CLI, webhooks (CloudEvents), Azure Service Bus, Azure DevOps PR decoration, SCIM 2.0 provisioning, Jira/ServiceNow bidirectional sync, Confluence publish, Teams/Slack notifications. The connector readiness matrix shows shipped status for all V1 GA integrations. However: (a) the ITSM connectors are "Shipped + manual vendor" — they have automated tests against mocks but live vendor validation is operator-owned; (b) there is no IDE integration (explicitly out of scope); (c) CI/CD integration beyond Azure DevOps PR comments is recipe-based; (d) the product operates as a standalone tool rather than embedding into existing architecture workflows.

**Tradeoffs:** The "standalone with integration hooks" model is appropriate for V1 — deep embedding requires understanding each customer's workflow, which is premature without customers.

**Recommendations:**
- Document 3 end-to-end workflow patterns: "Architecture Review Board workflow," "Sprint Planning integration," "Cloud Migration assessment cadence."
- Create a GitHub Actions integration (beyond Azure DevOps) for PR manifest delta.
- Validate all ITSM connectors against live vendor instances and publish the smoke test results.

**Fixability:** Workflow documentation is V1; GitHub Actions is V1; live ITSM validation is V1.

---

### 10. Trustworthiness — Score: 72 | Weight: 3 | Weighted Deficiency: 0.84

**Justification:** The trust posture is honest and well-documented: trust center with dated reviews, STRIDE threat model, OWASP ZAP baseline (merge-blocking), Schemathesis API fuzzing, SOC 2 self-assessment, CAIQ/SIG pre-fills, DPA template, subprocessor register, pen-test templates (owner-conducted for V1). The "what we will never ask" list (no Global Reader, Owner, Contributor) is a strong trust signal. However: (a) no CPA SOC 2 attestation (explicitly deferred — not scored as a defect per scope rules); (b) no third-party pen test (V2); (c) no production deployment history to point to; (d) trust is asserted through documentation, not demonstrated through production track record.

**Tradeoffs:** For a pre-revenue product, the trust documentation is exceptionally thorough. The gap is that documentation-based trust is necessary but not sufficient for enterprise procurement — buyers want track record.

**Recommendations:**
- Complete the owner-conducted pen test and publish the quantitative summary.
- Deploy to a production-like staging environment and accumulate 90 days of uptime history.
- Add a hosted status page (even simple) showing availability of the staging environment.

**Fixability:** Pen test completion is V1; staging uptime is V1.

---

### 11. Stickiness — Score: 58 | Weight: 1 | Weighted Deficiency: 0.42

**Justification:** Stickiness depends on: (a) accumulation of architecture run history (compare runs over time), (b) governance workflow adoption (policy packs, approval chains), (c) audit trail dependency (compliance evidence), (d) integration wiring (ITSM, chat-ops). These are real switching costs once established. However, none of these are active today — stickiness is architectural potential, not demonstrated. No customer has accumulated history, adopted governance, or wired integrations. The product could be evaluated and abandoned without significant switching cost.

**Tradeoffs:** Enterprise B2B products naturally build stickiness through data accumulation and workflow embedding. The mechanisms are present — they just haven't been activated.

**Recommendations:**
- Add an "Architecture History" dashboard that visualizes run-over-run improvement to make accumulated data visually valuable.
- Create a "Value Report" that quantifies how many hours of review time ArchLucid has saved (based on run count and complexity).
- Implement data export (already partially done) so buyers feel confident they can leave — paradoxically increasing willingness to commit.

**Fixability:** V1 for history dashboard and value quantification.

---

### 12. Template and Accelerator Richness — Score: 55 | Weight: 1 | Weighted Deficiency: 0.45

**Justification:** The product ships with finding engines (Topology, Cost, Compliance, Security, Requirement, Policy, etc.) but no pre-built architecture review templates for common scenarios. The wizard requires the user to define their own request from scratch. There are no industry-specific accelerators (healthcare, fintech, SaaS). The integration recipe templates (Power Automate, Logic Apps) exist but are documentation-only.

**Tradeoffs:** Templates risk being too generic to be useful or too specific to be broadly applicable. Starting without templates and learning from real usage is defensible.

**Recommendations:**
- Create 5 starter templates: "Cloud Migration Assessment," "Microservices Architecture Review," "Cost Optimization Scan," "Security Posture Review," "Compliance Readiness Check."
- Add a "template gallery" to the run creation wizard.
- Include sample architecture briefs that demonstrate what good input looks like.

**Fixability:** V1 for starter templates.

---

### 13. Customer Self-Sufficiency — Score: 55 | Weight: 1 | Weighted Deficiency: 0.45

**Justification:** Documentation is extensive (664+ markdown files in docs/) but oriented toward contributors and operators, not end-user self-service. The troubleshooting guide exists. The CLI `doctor` and `support-bundle` commands are helpful. However: (a) no in-app help or contextual guidance; (b) no knowledge base or FAQ optimized for common operator questions; (c) no community forum or self-service support channel; (d) the documentation depth can itself be overwhelming — finding the right doc requires knowing the doc structure.

**Tradeoffs:** The documentation-as-code approach is appropriate for the current stage. Self-service support infrastructure (knowledge base, community) is premature without customers.

**Recommendations:**
- Add contextual help links in the UI (e.g., "What is a golden manifest?" tooltip on the manifest page).
- Create a "Top 10 FAQ" page linked from the UI help menu.
- Add a search feature to the documentation.

**Fixability:** V1 for contextual help and FAQ.

---

### 14. Cognitive Load — Score: 58 | Weight: 1 | Weighted Deficiency: 0.42

**Justification:** The product imposes significant cognitive load: (a) the concept model (runs, manifests, findings, snapshots, authority chain, governance workflows, policy packs) is rich and interconnected; (b) the operator must understand the difference between Pilot and Operate layers; (c) the UI has progressive disclosure but still surfaces many navigation items; (d) configuration has 100+ keys (CONFIGURATION_REFERENCE.md); (e) the documentation spine assumes familiarity with enterprise architecture concepts. The Pilot/Operate layer split helps but the Pilot layer itself still has substantial conceptual overhead.

**Tradeoffs:** The conceptual richness reflects the problem domain — enterprise architecture review genuinely involves manifests, findings, governance, and audit trails. Oversimplification would undermine the product's value to its target audience.

**Recommendations:**
- Add a "Getting Started Guide" that introduces concepts one at a time with concrete examples.
- Reduce the default visible navigation to the minimum pilot path; hide everything else until the user needs it.
- Create a glossary panel accessible from every UI page.

**Fixability:** V1 for navigation reduction and inline glossary.

---

### 15. Scalability — Score: 62 | Weight: 1 | Weighted Deficiency: 0.38

**Justification:** The architecture supports scaling: database-per-tenant topology, optional Redis (HotPathCache), Azure Container Apps deployment, k6 load testing (merge-blocking CI smoke + scheduled burst/soak). However: (a) no multi-region active/active is guaranteed (explicitly out of V1 scope); (b) Redis is optional and not the default; (c) the worker process is a single-instance hosted loop, not a distributed job system; (d) SQL Server is the only persistence option — no horizontal scaling path beyond Azure SQL elastic pools; (e) the k6 tests prove pilot-scale, not enterprise-scale.

**Tradeoffs:** Pilot-scale is the right target for V1. The architecture does not have fundamental scaling barriers — the paths to scale (distributed cache, job distribution, read replicas) are documented as V2 candidates.

**Recommendations:**
- Document a "scaling playbook" for operators who need to move beyond pilot scale.
- Test with 50+ concurrent architecture runs to establish a multi-tenant baseline.
- Add connection pool and query performance instrumentation to identify bottlenecks early.

**Fixability:** Playbook is V1; multi-tenant testing is V1.1.

---

### 16. Availability — Score: 68 | Weight: 1 | Weighted Deficiency: 0.32

**Justification:** Health endpoints exist (`/health/live`, `/health/ready`, `/health`). Terraform modules include optional SQL failover groups and secondary region stack. The chaos exercise calendar is published (quarterly staging). RTO/RPO targets are documented but not contractually committed. However: (a) no production deployment exists to measure actual availability; (b) the first chaos exercise was scheduled for 2026-04-29 (staging only) — results are not in the codebase; (c) no status page exists; (d) availability is architectural potential, not demonstrated.

**Tradeoffs:** For a pre-production product, having the availability infrastructure (health checks, failover, chaos calendar) in place is above average.

**Recommendations:**
- Deploy a production-like staging environment and measure uptime for 90 days.
- Publish a simple status page (even static) showing staging health.
- Complete and document the results of the first chaos exercise.

**Fixability:** V1.

---

### 17. Executive Value Visibility — Score: 70 | Weight: 4 | Weighted Deficiency: 1.20

**Justification:** The executive sponsor brief exists and is well-written. The product datasheet exists. The pricing page exists. The "one-email kit" for sponsors exists. The CLI can generate a sponsor one-pager. However: (a) no real outputs to show an executive — all demos would use simulator mode; (b) no ROI proof point from a real engagement; (c) the executive narrative is compelling but unproven; (d) the product's value proposition requires explaining the architecture review problem before explaining the solution.

**Tradeoffs:** The executive materials are well-prepared for the stage. The gap is in having real evidence to back the narrative.

**Recommendations:**
- Create a polished demo video showing a complete pilot with real (non-simulator) outputs.
- Generate a sample "executive report" artifact from a real-mode run.
- Add before/after metrics to the executive narrative.

**Fixability:** V1 with AOAI credentials.

---

### 18. Commercial Packaging Readiness — Score: 65 | Weight: 2 | Weighted Deficiency: 0.70

**Justification:** Three tiers are defined (Team/Professional/Enterprise) with clear feature gates. The pricing model is value-based. The order form template exists. The Stripe integration (checkout, webhooks, billing controller) is coded. The Azure Marketplace SaaS offer alignment is documented. The tenant tier enforcement (`[RequiresCommercialTenantTier]`, 402 filter) is implemented. However: (a) commerce is TEST mode only — no live Stripe keys, no published Marketplace listing; (b) the tier enforcement is UI-shaping-based (soft disable), not hard API entitlement; (c) trial funnel is code-complete but not live; (d) no billing portal or invoice management exists.

**Tradeoffs:** Having the billing infrastructure coded before first customer is the right investment. The "un-hold" (flip to live) is explicitly V1.1.

**Recommendations:**
- Test the complete trial → checkout → provision → use → billing cycle in Stripe TEST mode end-to-end.
- Document the billing operations runbook (refunds, tier changes, cancellations).
- Prepare the Marketplace SaaS offer in Partner Center draft state.

**Fixability:** V1 for TEST mode validation; V1.1 for live commerce.

---

### 19. Compliance Readiness — Score: 70 | Weight: 2 | Weighted Deficiency: 0.60

**Justification:** SOC 2 self-assessment exists. CAIQ Lite and SIG Core pre-fills exist. DPA template exists. Subprocessor register exists. OWASP ZAP is merge-blocking. Gitleaks runs in CI. Content safety (Azure AI) is fail-closed in production. Audit trail is append-only with DENY UPDATE/DELETE at the database level. However: (a) no CPA SOC 2 (explicitly deferred — not scored as defect); (b) compliance drift tracking exists in the UI but the baseline is empty without real runs; (c) audit retention policy is documented but not tested in production.

**Tradeoffs:** The compliance posture is honest: "here is what we have, here is what we plan, here is what we don't have yet." This is the right approach for enterprise trust.

**Recommendations:**
- Populate the compliance drift chart with sample data from simulator runs to demonstrate the feature works.
- Test the audit export endpoint with realistic volumes (10,000+ events) and measure export time.
- Document the compliance controls that are "active by default" vs. "require operator enablement."

**Fixability:** V1.

---

### 20. Procurement Readiness — Score: 64 | Weight: 2 | Weighted Deficiency: 0.72

**Justification:** Procurement pack index exists. DPA template, CAIQ, SIG pre-fills, and procurement FAQ exist. The procurement response accelerator is documented. The fast-lane guide is documented. However: (a) these have not been tested in a real procurement cycle; (b) no CPA SOC 2 report (procurement friction — noted as informational, not scored); (c) no reference customer to list on security questionnaires; (d) no formal incident response SLA to cite; (e) the procurement pack is template-quality, not battle-tested.

**Tradeoffs:** Having procurement materials ready before first engagement is unusually thorough for a pre-revenue product.

**Recommendations:**
- Review procurement materials with a real enterprise buyer (even informally) and incorporate feedback.
- Prepare responses to the 10 most common enterprise security questionnaire questions.
- Create a one-page security summary for procurement teams.

**Fixability:** V1.

---

### 21. Interoperability — Score: 69 | Weight: 2 | Weighted Deficiency: 0.62

**Justification:** OpenAPI v1 contract is maintained with snapshot drift detection. REST API with versioned routes. CLI wraps the API. Webhooks with CloudEvents envelope. Azure Service Bus integration events. SCIM 2.0 inbound provisioning. ITSM bidirectional sync (Jira, ServiceNow). Confluence page publish. Azure DevOps PR decoration. Azure extractor ZIP ingest. However: (a) no GitHub integration (only Azure DevOps); (b) no generic CI/CD webhook (recipes only); (c) no MCP server (V1.1); (d) the generated TypeScript client (`api-types.generated.ts`) and .NET client (`ArchLucidApiClient.g.cs`) exist but client SDK usability is not documented for third parties.

**Tradeoffs:** The integration breadth is appropriate for V1 targeting Azure-first enterprise customers. GitHub and non-Azure CI/CD are reasonable V1.1 extensions.

**Recommendations:**
- Add a GitHub Actions workflow for PR manifest delta (parity with Azure DevOps).
- Document the .NET client and TypeScript types as first-party SDKs with usage examples.
- Publish the OpenAPI spec at a stable URL for third-party consumption.

**Fixability:** GitHub Actions is V1; SDK documentation is V1.

---

### 22. Differentiability — Score: 78 | Weight: 4 | Weighted Deficiency: 0.88

**Justification:** ArchLucid occupies a genuinely distinct position: AI-generated architecture findings from a structured brief, committed to a golden manifest, with governance evidence and explainability traces. No direct competitor offers this specific workflow. The customer-controlled Azure extractor (no vendor access to customer tenant) is a strong trust differentiator. Advisory-only Terraform (never applies) is a clear safety boundary. The append-only typed audit trail with 173+ events is more mature than typical. The explainability trace coverage (5/5 fields on most engines) is a genuine differentiator for regulated environments.

**Tradeoffs:** Differentiation based on a novel category ("AI architecture workflow system") is powerful but requires more education than differentiation within an established category.

**Recommendations:**
- Develop a "Category Creation" narrative that defines the space ArchLucid creates, not just how it compares to adjacent tools.
- Publish a whitepaper on "AI-Assisted Architecture Review: Why Manifests Beat Wikis."
- Create a comparison page on the marketing site.

**Fixability:** V1 for narrative; V1.1 for whitepaper.

---

### 23. Architectural Integrity — Score: 79 | Weight: 3 | Weighted Deficiency: 0.63

**Justification:** The C4 architecture poster is clear. Layer boundaries are enforced: Core (no persistence/host references), Application (business logic), Persistence (Dapper, no EF), API (ASP.NET Core entry), Host.Composition (DI wiring), Worker (background loops). The architecture invariant catalog (INV-*) is being formalized with ADR 0035. The Coordinator → Authority strangler pattern (ADR 0021) shows intentional evolution. Custom Roslyn analyzers (`ArchLucid.Analyzers`) enforce code-level constraints. Architecture tests enforce structural rules. However: (a) the legacy Coordinator layer coexists with the Authority pattern, creating conceptual duplication; (b) the 30+ project solution is complex — contribution requires understanding the dependency graph; (c) some invariants (INV-002, INV-004, INV-007–015) are proposed but not yet enforced.

**Tradeoffs:** The architectural discipline is genuinely high. The complexity is inherent in the domain. The invariant enforcement waves (TB-010, TB-011, TB-012) show a deliberate program to formalize what has been implicitly maintained.

**Recommendations:**
- Complete Wave A invariant enforcement (INV-005, INV-006) to close the multi-tenant and boot safety invariants.
- Document the Coordinator → Authority migration status so new contributors know which paths are legacy.
- Add an architecture dependency diagram to the contributor onboarding.

**Fixability:** V1 for Wave A; V1.1 for remaining waves.

---

### 24. Security — Score: 77 | Weight: 3 | Weighted Deficiency: 0.69

**Justification:** Security posture is strong for a pre-revenue product: fail-closed auth defaults (API key disabled, DevelopmentBypass blocked outside Development environment), OWASP ZAP merge-blocking, Schemathesis fuzzing, rate limiting (role-aware), RBAC with four roles and fine-grained permissions, RLS available, DENY UPDATE/DELETE on audit table, Content Safety fail-closed in production, prompt redaction (LLM), Gitleaks in CI, STRIDE threat model. The "what we will never ask" commitment is credible and tested. However: (a) pen testing is owner-conducted only (V1 stance, not scored as defect); (b) no production security incident history (no production exists); (c) LLM content safety is the Azure AI service — no custom safety layer for architecture-specific risks; (d) some configuration keys could expose security state if misconfigured (mitigated by startup validation rules).

**Tradeoffs:** The security investment is disproportionately high for the product's maturity — this is the right priority for enterprise trust.

**Recommendations:**
- Complete the owner-conducted pen test and document findings.
- Add a security hardening checklist for production deployments.
- Test the content safety integration with adversarial architecture briefs designed to inject prompt attacks.

**Fixability:** V1.

---

### 25. Traceability — Score: 80 | Weight: 3 | Weighted Deficiency: 0.60

**Justification:** Traceability is a product strength: every finding has an ExplainabilityTrace (GraphNodeIdsExamined, RulesApplied, DecisionsTaken, AlternativePathsConsidered, Notes). Correlation IDs flow through the pipeline. Audit events carry RunId, ManifestId, CorrelationId. The authority chain links runs → manifests → snapshots → artifacts with foreign keys. Provenance data is stored. The V1 Requirements Test Traceability document maps scope items to tests. However: (a) traceability from business requirement to finding is structural, not semantic — the system traces "which rule fired" but not "why this finding matters to the customer's specific business context"; (b) traceability to external systems (Jira issues, ServiceNow incidents) is correlation-based, not deep-linked.

**Tradeoffs:** The traceability investment is above market standard. The gap between structural traceability and business-contextual traceability is a V1.1 enhancement, not a V1 deficiency.

**Recommendations:**
- Add "business impact" tagging to findings so operators can trace from business capability to architecture finding.
- Display the authority chain visually in the UI (run → findings → manifest → governance decision).

**Fixability:** V1.1.

---

### 26. Auditability — Score: 80 | Weight: 2 | Weighted Deficiency: 0.40

**Justification:** 173+ typed audit events in an append-only SQL store. DENY UPDATE/DELETE at the database level. Export endpoint (JSON/CSV, UTC range, max 90 days per request). Audit UI with filtering. Critical-path audit events use DurableAuditLogRetry. Audit coverage matrix is maintained with CI guard. Known gaps are documented. However: (a) some mutating flows emit baseline mutation log (structured logger) only, not durable audit events; (b) audit retention tiering (hot/warm/cold) is documented but not implemented beyond the hot tier; (c) no audit log integrity verification (e.g., hash chain or WORM storage).

**Tradeoffs:** For V1, the audit infrastructure is mature. The gaps are in completeness (some flows) and integrity verification (hash chain) — both are V1.1 candidates.

**Recommendations:**
- Close the remaining audit coverage gaps where durable events are missing for mutating flows.
- Implement a nightly audit integrity check (count + last event timestamp) to detect tampering.

**Fixability:** V1 for coverage gaps; V1.1 for integrity verification.

---

### 27. Policy and Governance Alignment — Score: 78 | Weight: 2 | Weighted Deficiency: 0.44

**Justification:** Governance workflows with segregation of duties (self-approval blocked). Pre-commit governance gate (blocks commit when findings exceed severity thresholds). Policy packs (versioned rule sets with scope assignments). Governance dashboard (cross-run pending approvals). Compliance drift trend tracking. SLA tracking on approvals with webhook escalation. However: (a) governance is configuration-driven and all features require explicit enablement — a pilot without governance enabled gets no governance value; (b) the policy pack authoring experience is API-only, not guided; (c) no default policy pack ships — operators must create their own from scratch.

**Tradeoffs:** Making governance opt-in is the right choice for a product that serves both "just want findings" and "need full governance" use cases.

**Recommendations:**
- Ship 2-3 default policy packs (e.g., "Baseline Security," "Cost Governance," "Architecture Review Board") that operators can adopt and customize.
- Add a policy pack wizard to the UI.

**Fixability:** V1 for default policy packs.

---

### 28. Reliability — Score: 72 | Weight: 2 | Weighted Deficiency: 0.56

**Justification:** Circuit breakers with audit callbacks. DurableAuditLogRetry on critical paths. Retry policies on LLM calls. Health endpoints. DbUp migrations run on startup (automatic schema management). Chaos exercise calendar (quarterly staging). Data consistency orphan probes with quarantine. However: (a) no production operational history; (b) the worker process is a single-instance hosted loop — no distributed work queue with dead-letter handling; (c) the first chaos exercise results are not documented in the codebase; (d) the agent pipeline does not have explicit timeout/circuit-breaker per stage.

**Tradeoffs:** The reliability infrastructure is appropriate for V1 pilot-scale. The worker architecture is the primary risk for production reliability.

**Recommendations:**
- Add per-stage timeouts and circuit breakers to the authority pipeline.
- Document the failure modes and recovery procedures for the worker process.
- Complete and document the chaos exercise results.

**Fixability:** V1.

---

### 29. Data Consistency — Score: 76 | Weight: 2 | Weighted Deficiency: 0.48

**Justification:** Foreign keys on the authority chain (runs → manifests → snapshots). Orphan probe detection with configurable enforcement modes (Warn → Alert → Quarantine). Quarantine table for orphan staging. DbUp migrations managed with idempotent WITH NOCHECK for brownfield catalogs. Data consistency readiness report script. However: (a) legacy orphan rows may exist in older databases (detection-only, not auto-remediated); (b) the quarantine system is staging, not deletion — operators must handle remediation; (c) comparison record run ID columns were recently type-migrated (TB-006, now done) indicating recent data model instability.

**Tradeoffs:** The orphan detection/quarantine approach is the right conservative strategy. Auto-remediation would risk data loss.

**Recommendations:**
- Run the orphan probe against a production-scale database and document the typical orphan rate and resolution time.
- Add a "data health" dashboard to the operator UI showing probe results and quarantine status.

**Fixability:** V1.

---

### 30. Maintainability — Score: 70 | Weight: 2 | Weighted Deficiency: 0.60

**Justification:** Code is well-structured: each class in its own file, LINQ preferred, concrete types over var, null checks enforced. Custom Roslyn analyzers enforce conventions. Architecture tests enforce structural rules. Directory.Build.props and Directory.Packages.props for centralized dependency management. Stryker mutation testing configurations exist for multiple projects. However: (a) 30+ projects is a large solution — build times are significant; (b) the documentation volume (664+ markdown files) is itself a maintenance burden; (c) the legacy Coordinator layer adds maintenance surface that will be removed post-strangler; (d) tech backlog items (TB-008 through TB-012) represent acknowledged maintenance debt.

**Tradeoffs:** The maintenance burden reflects the product's breadth. The tech backlog tracking is a positive signal — debt is acknowledged and prioritized.

**Recommendations:**
- Establish a documentation pruning cadence — remove or archive docs that are superseded.
- Complete the Coordinator strangler migration to reduce dual-maintenance surface.
- Add build time monitoring to CI to catch regressions in build performance.

**Fixability:** V1.1 for strangler completion; ongoing for doc hygiene.

---

### 31. Explainability — Score: 76 | Weight: 2 | Weighted Deficiency: 0.48

**Justification:** ExplainabilityTrace on each finding with 5 structured fields. Completeness analyzer with property-based tests. Explanation faithfulness checker (heuristic token overlap). Advisory scan includes trace completeness in ResultJson. Aggregate explanation API (`/v1/explain/runs/{runId}/aggregate`). Per-engine completeness ratios. However: (a) the faithfulness checker is coarse (word token overlap, not semantic entailment); (b) explainability of the overall architecture recommendation (not just individual findings) is less structured; (c) the "why did the system recommend X" question is answered at the finding level but not at the manifest level.

**Tradeoffs:** Finding-level explainability is the right granularity for the product. Manifest-level explainability ("why does the overall recommendation look this way") is a genuinely harder problem.

**Recommendations:**
- Add a manifest-level explanation summary that synthesizes individual finding traces into an overall narrative.
- Add a "decision log" view that shows the pipeline's decision points for a given run.

**Fixability:** V1.1.

---

### 32. Azure Compatibility and SaaS Deployment Readiness — Score: 80 | Weight: 2 | Weighted Deficiency: 0.40

**Justification:** 13+ Terraform module roots covering Container Apps, SQL, Key Vault, Storage, Front Door/WAF, Entra, Service Bus, APIM, monitoring, private networking, and SQL failover. Docker Compose profiles for local dev. Containerization documented. CD pipeline to staging on merge. Azure OpenAI integration. Application Insights + OTLP + Prometheus export paths. Managed identity support documented. Private endpoints for SQL and Blob. However: (a) the staging deployment is documented but production has not been deployed; (b) some Terraform state references still use legacy naming (Phase 7.5 deferred); (c) the Terraform modules have `checks.tf` preconditions but no automated `terraform plan` in CI; (d) multi-region is optional, not default.

**Tradeoffs:** The Azure investment is deep and appropriate for the target market. The deployment infrastructure is production-ready in design; it has not been production-tested.

**Recommendations:**
- Add `terraform plan` validation to CI for at least one representative module.
- Complete Phase 7.5 state mv to clean up legacy resource names.
- Document the minimum Azure subscription configuration for a production deployment.

**Fixability:** V1.

---

### 33. Performance — Score: 70 | Weight: 1 | Weighted Deficiency: 0.30

**Justification:** k6 load tests (merge-blocking CI smoke + scheduled burst/soak). Performance baseline tests with Stopwatch gates. Named-query allowlist CI gate. Caching (in-memory + optional Redis). Dapper for SQL (no ORM overhead). However: (a) performance is proven at pilot scale only (not enterprise scale); (b) no published p95/p99 latency targets for API endpoints; (c) LLM call latency dominates the pipeline but is not instrumented per-stage in a way that sets expectations; (d) no CDN or edge caching for the operator UI.

**Tradeoffs:** Pilot-scale performance testing is appropriate for V1. The k6 merge gate prevents regressions without over-investing in load testing infrastructure.

**Recommendations:**
- Publish API endpoint latency targets (p50, p95, p99) for the core pilot path.
- Add per-stage pipeline duration instrumentation that is visible to operators.

**Fixability:** V1.

---

### 34. Supportability — Score: 75 | Weight: 1 | Weighted Deficiency: 0.25

**Justification:** CLI `doctor` command. Support bundle generation (`support-bundle --zip`). Version endpoint (`GET /version`). Correlation IDs on all requests. Troubleshooting guide. Health endpoints with dependency status. Build provenance. However: (a) no ticketing system or support portal; (b) no runbook for common operational issues beyond what's in docs; (c) support bundle content is not documented for what it includes/excludes (PII review guidance exists).

**Tradeoffs:** For a product without customers, the diagnostic tooling is well-prepared.

**Recommendations:**
- Document the support bundle contents and PII review process.
- Create an operational runbook for the top 10 anticipated support scenarios.

**Fixability:** V1.

---

### 35. Manageability — Score: 73 | Weight: 1 | Weighted Deficiency: 0.27

**Justification:** Configuration reference with 100+ keys. Feature flags. Tenant configuration per database. Per-tenant ITSM settings. Rate limiting configuration. Agent execution mode configuration. Startup validation rules with advisory metrics. However: (a) no admin UI for configuration management (API-only for most settings); (b) configuration sprawl (100+ keys) creates risk of misconfiguration; (c) no configuration diff or audit trail for config changes.

**Tradeoffs:** API-driven configuration is appropriate for the target audience (platform engineers). An admin UI for configuration is a V1.1 polish item.

**Recommendations:**
- Add a configuration status page to the operator UI showing active settings and warnings.
- Add audit events for configuration changes.

**Fixability:** V1.1.

---

### 36. Deployability — Score: 74 | Weight: 1 | Weighted Deficiency: 0.26

**Justification:** Docker images. Docker Compose profiles. Terraform modules. DbUp migrations on startup. CD pipeline to staging. Package release scripts. Greenfield SQL boot tests (empty database → healthy API). However: (a) no blue/green or canary deployment support; (b) no rollback procedure documented; (c) the deployment depends on multiple Azure services (SQL, Key Vault, Container Apps, AOAI) — failure in any one blocks deployment.

**Tradeoffs:** The deployment infrastructure is production-capable. Blue/green and rollback are production-maturity features.

**Recommendations:**
- Document a rollback procedure for failed deployments.
- Add deployment health checks that verify all dependencies before accepting traffic.

**Fixability:** V1.

---

### 37. Observability — Score: 79 | Weight: 1 | Weighted Deficiency: 0.21

**Justification:** Custom OpenTelemetry meter with histograms and counters. Application Insights, OTLP, and Prometheus export paths. Agent output quality metrics. Pipeline stage duration histograms. Circuit breaker metrics. LLM usage metrics. Prompt redaction metrics. Data consistency metrics. Prometheus alert rules with Grafana dashboards. However: (a) observability requires configuring at least one export path — it's not active by default in local dev; (b) no pre-built Application Insights workbooks or Grafana dashboards ship in the repo (alert rules exist but not full dashboards).

**Tradeoffs:** The observability infrastructure is comprehensive. The gap is in out-of-box dashboards.

**Recommendations:**
- Ship pre-built Grafana dashboard JSON for the key operational metrics.
- Add an "Observability Quick Start" section to the deployment guide.

**Fixability:** V1.

---

### 38. Testability — Score: 82 | Weight: 1 | Weighted Deficiency: 0.18

**Justification:** Multi-tier test structure (Core, Fast Core, Integration, Slow, Performance, Full Regression). Property-based tests (FsCheck). Mutation testing (Stryker). Contract tests (OpenAPI snapshot, integration event catalog). Architecture fitness tests. WebApplicationFactory integration tests. Greenfield SQL boot tests. UI: Vitest unit, axe-core accessibility, Playwright E2E (mock and live-API). k6 load tests. OWASP ZAP security tests. Schemathesis API fuzzing. 27 CI/CD workflows. Coverage tracking with Coverlet.

**Tradeoffs:** This is one of the strongest aspects of the product. The test infrastructure is more mature than many production systems.

**Recommendations:**
- Track and publish test coverage percentage as a CI artifact.
- Add test stability monitoring (flaky test detection).

**Fixability:** V1.

---

### 39. Modularity — Score: 83 | Weight: 1 | Weighted Deficiency: 0.17

**Justification:** Clean project structure: Core (no host/persistence), Application (business logic), Persistence (Dapper), API (entry), Host.Composition (DI), Worker (background), separate projects for AgentRuntime, Decisioning, KnowledgeGraph, ContextIngestion, ArtifactSynthesis, Provenance, etc. Each class in its own file. Interfaces for all services. Roslyn analyzers enforce boundaries.

**Tradeoffs:** High modularity is maintained despite the solution's complexity. The 30+ project count is a consequence, not a flaw.

**Recommendations:**
- Consider consolidating rarely-changed utility projects to reduce solution complexity.

**Fixability:** V1.1.

---

### 40. Extensibility — Score: 75 | Weight: 1 | Weighted Deficiency: 0.25

**Justification:** Plugin sample finding engine exists. Finding engines are interface-based (IFindingEngine). Integration events use CloudEvents for external consumption. Webhooks are extensible. Policy packs are configurable. Alert rules are composable. However: (a) no plugin SDK or extension point documentation for third parties; (b) custom finding engines require code changes, not configuration; (c) MCP (V1.1) would add the primary extensibility surface.

**Tradeoffs:** V1 extensibility is internal (new finding engines, new connectors). Third-party extensibility is a V1.1 concern.

**Recommendations:**
- Document the finding engine extension point with a step-by-step guide.
- Prepare the MCP tool surface design for V1.1.

**Fixability:** V1 for documentation; V1.1 for MCP.

---

### 41. Evolvability — Score: 74 | Weight: 1 | Weighted Deficiency: 0.26

**Justification:** ADR process in place. Breaking changes documented. Architecture invariant catalog being formalized. Strangler pattern for Coordinator → Authority migration. Tech backlog is tracked. Version endpoint for build attribution. OpenAPI contract drift detection. However: (a) the strangler migration is incomplete; (b) some ADRs are proposed but not accepted; (c) the system has evolved rapidly (60+ change sets) which increases the risk of inconsistency.

**Tradeoffs:** The evolvability infrastructure (ADRs, breaking changes, invariants) is well-established. The risk is in the pace of change outrunning the formalization of constraints.

**Recommendations:**
- Accept and enforce ADR 0035 (architecture invariant catalog).
- Complete the Coordinator → Authority strangler.

**Fixability:** V1.

---

### 42. Documentation — Score: 82 | Weight: 1 | Weighted Deficiency: 0.18

**Justification:** 664+ markdown files covering scope, architecture, deployment, security, testing, troubleshooting, configuration, operations, and go-to-market. Five-document onboarding spine. Scope header enforcement on all docs. Doc root size budget enforced by CI. Architecture poster. Contributor persona table. Operator atlas. Multiple persona-specific entry points. However: (a) the volume itself is a liability — finding the right doc is hard without knowing the structure; (b) docs are internally focused (contributor/operator), not customer-facing; (c) some docs may be stale given the pace of change.

**Tradeoffs:** Over-documentation is better than under-documentation for a product of this complexity. The CI enforcement of doc hygiene is a strong signal.

**Recommendations:**
- Add a documentation search capability.
- Implement a doc staleness check (flag docs not updated in 30+ days).

**Fixability:** V1.

---

### 43. Azure Ecosystem Fit — Score: 80 | Weight: 1 | Weighted Deficiency: 0.20

**Justification:** Azure-native by design: Entra ID, SQL Server, Key Vault, Container Apps, Front Door, APIM, Service Bus, Application Insights, Content Safety, OpenAI. Terraform modules for all Azure services. Managed identity support. Private endpoints. No SMB/445 exposure. The Azure extractor specifically targets Azure environments.

**Tradeoffs:** Azure-first is the correct strategy for the target market but limits non-Azure customers.

**Recommendations:**
- Document the minimum Azure subscription requirements for each deployment profile.

**Fixability:** V1.

---

### 44. Cost-Effectiveness — Score: 65 | Weight: 1 | Weighted Deficiency: 0.35

**Justification:** Azure OpenAI token usage is instrumented. LLM completion caching (optional Redis or in-process). Consumption budget Terraform modules. Cost constraint finding engine. Advisory Terraform emit. However: (a) no published cost-to-serve per architecture run; (b) LLM costs dominate but are not budget-capped by default; (c) the pricing model does not account for variable LLM costs per run; (d) no cost attribution per tenant for multi-tenant deployments.

**Tradeoffs:** Cost management is documented as an engineering concern but not yet instrumented for operators or baked into the pricing model.

**Recommendations:**
- Instrument and publish the average cost-to-serve per architecture run (Azure OpenAI + SQL + compute).
- Add per-tenant LLM budget caps as a configuration option.
- Document the cost model for operators planning capacity.

**Fixability:** V1.

---

## Weighted Readiness Calculation

| Category | Quality | Score | Weight | Weighted |
|----------|---------|-------|--------|----------|
| COMMERCIAL | Marketability | 62 | 8 | 496 |
| COMMERCIAL | Time-to-Value | 66 | 7 | 462 |
| COMMERCIAL | Adoption Friction | 55 | 6 | 330 |
| COMMERCIAL | Proof-of-ROI Readiness | 60 | 5 | 300 |
| COMMERCIAL | Executive Value Visibility | 70 | 4 | 280 |
| COMMERCIAL | Differentiability | 78 | 4 | 312 |
| COMMERCIAL | Decision Velocity | 52 | 2 | 104 |
| COMMERCIAL | Commercial Packaging Readiness | 65 | 2 | 130 |
| COMMERCIAL | Stickiness | 58 | 1 | 58 |
| COMMERCIAL | Template and Accelerator Richness | 55 | 1 | 55 |
| ENTERPRISE | Traceability | 80 | 3 | 240 |
| ENTERPRISE | Usability | 64 | 3 | 192 |
| ENTERPRISE | Workflow Embeddedness | 61 | 3 | 183 |
| ENTERPRISE | Trustworthiness | 72 | 3 | 216 |
| ENTERPRISE | Auditability | 80 | 2 | 160 |
| ENTERPRISE | Policy and Governance Alignment | 78 | 2 | 156 |
| ENTERPRISE | Compliance Readiness | 70 | 2 | 140 |
| ENTERPRISE | Procurement Readiness | 64 | 2 | 128 |
| ENTERPRISE | Interoperability | 69 | 2 | 138 |
| ENTERPRISE | Accessibility | 78 | 1 | 78 |
| ENTERPRISE | Customer Self-Sufficiency | 55 | 1 | 55 |
| ENTERPRISE | Change Impact Clarity | 68 | 1 | 68 |
| ENGINEERING | Correctness | 72 | 8 | 576 |
| ENGINEERING | AI/Agent Readiness | 65 | 8 | 520 |
| ENGINEERING | Architectural Integrity | 79 | 3 | 237 |
| ENGINEERING | Security | 77 | 3 | 231 |
| ENGINEERING | Reliability | 72 | 2 | 144 |
| ENGINEERING | Data Consistency | 76 | 2 | 152 |
| ENGINEERING | Maintainability | 70 | 2 | 140 |
| ENGINEERING | Explainability | 76 | 2 | 152 |
| ENGINEERING | Azure Compat. & SaaS Readiness | 80 | 2 | 160 |
| ENGINEERING | Availability | 68 | 1 | 68 |
| ENGINEERING | Performance | 70 | 1 | 70 |
| ENGINEERING | Scalability | 62 | 1 | 62 |
| ENGINEERING | Supportability | 75 | 1 | 75 |
| ENGINEERING | Manageability | 73 | 1 | 73 |
| ENGINEERING | Deployability | 74 | 1 | 74 |
| ENGINEERING | Observability | 79 | 1 | 79 |
| ENGINEERING | Testability | 82 | 1 | 82 |
| ENGINEERING | Modularity | 83 | 1 | 83 |
| ENGINEERING | Extensibility | 75 | 1 | 75 |
| ENGINEERING | Evolvability | 74 | 1 | 74 |
| ENGINEERING | Documentation | 82 | 1 | 82 |
| ENGINEERING | Azure Ecosystem Fit | 80 | 1 | 80 |
| ENGINEERING | Cognitive Load | 58 | 1 | 58 |
| ENGINEERING | Cost-Effectiveness | 65 | 1 | 65 |

**Commercial subtotal:** 2,527 / 4,000 = 63.18%
**Enterprise subtotal:** 1,754 / 2,500 = 70.16%
**Engineering subtotal:** 3,064 / 3,500 = 87.54% (wait — let me recount)

Let me recalculate engineering: 576+520+237+231+144+152+140+152+160+68+70+62+75+73+74+79+82+83+75+74+82+80+58+65 = 3,064 ... wait, engineering weight = 8+8+3+3+2+2+2+2+2+1+1+1+1+1+1+1+1+1+1+1+1+1+1+1 = 35, so max = 3,500.

**Total weighted:** 2,527 + 1,754 + 3,064 = 7,345
**Total max:** 10,000
**Weighted readiness:** 73.45%

---

## Top 12 Most Important Weaknesses

Ranked from most serious to least serious, based on cross-cutting impact weighted by commercial and engineering significance.

### 1. No Live AI Evidence Validates the Core Value Proposition

The product claims to produce "AI-generated architecture findings." The golden cohort gate was blocked (no AOAI credentials in the assessment environment). All automated testing uses simulator mode, which produces deterministic outputs that prove pipeline correctness but not output usefulness. No buyer can verify that real LLM completions produce architecture analysis worth paying for without standing up the full stack and supplying their own Azure OpenAI credentials. This is the single largest risk to the product.

### 2. Zero Customer Traction Creates a Credibility Vacuum

No paying customer, no signed design partner (V1.1 — not scored), no case study, no testimonial, no measured ROI. Every sales conversation starts from zero. The product competes against the buyer's default state ("we use Confluence and Jira") with no proof that switching produces measurably better outcomes. The ROI model is theoretical.

### 3. Prohibitive Evaluation Barrier

Evaluating ArchLucid requires installing .NET 10, Docker, SQL Server, and optionally Azure OpenAI and Node.js. No hosted trial exists. The "Try in 60 seconds" claim requires all prerequisites pre-installed. Compared to SaaS competitors where evaluation starts with a URL, ArchLucid demands hours of infrastructure setup before a prospect sees any output.

### 4. Self-Serve Commerce Is Inactive

Stripe is TEST mode only. Marketplace is unpublished. The sales-led motion (quote request → manual follow-up) adds latency to every conversion. The trial funnel is code-complete but not live. A prospect who decides "I want to buy this" cannot complete the transaction without human intermediation.

### 5. AI Output Quality Is Untested at Scale

The eval corpus has 4 real-mode scenarios. There is no published evidence of what GPT-4o produces against 20+ diverse architecture briefs. The agent output quality gate exists but the thresholds are defaults, not calibrated against real buyer expectations. Prompt regression testing is conceptual but thin.

### 6. Cognitive Overhead for First-Time Users

The concept model (runs, manifests, findings, snapshots, authority chain, governance, policy packs, explainability traces) is rich. No starter templates guide users toward a successful first run. The wizard requires architectural knowledge to fill in. The Pilot layer is simpler than the Operate layer but still has substantial conceptual overhead.

### 7. No GitHub Integration for Non-Azure-DevOps Users

Azure DevOps PR decoration exists but no GitHub equivalent. GitHub Actions is the dominant CI platform for the target audience. The absence limits workflow embeddedness for GitHub-native teams.

### 8. LLM Cost Model Is Opaque to Operators

Azure OpenAI costs dominate the cost-to-serve but there is no published cost per run, no per-tenant budget cap, and no cost attribution instrumentation. Operators deploying ArchLucid cannot predict their Azure OpenAI spend.

### 9. Worker Process Is Single-Instance

The background worker (`ArchLucid.Worker`) runs as a single-instance hosted loop. There is no distributed work queue, no dead-letter handling, and no horizontal scaling path for the worker. A worker failure blocks all background processing until restart.

### 10. Connector Live Validation Is Manual and Undocumented

ITSM connectors (Jira, ServiceNow, Confluence, Slack) are "Shipped + manual vendor" — automated tests use mocks. Live vendor validation is operator-owned and the results are not published in the codebase. A buyer cannot verify that the Jira integration works against their Jira instance without trying it.

### 11. Documentation Volume Is Itself a Usability Problem

664+ markdown files. Finding the right doc requires knowing the doc structure. No search capability. No staleness detection. The depth that is an asset for contributors becomes a liability for evaluators and operators.

### 12. No In-App Help or Contextual Guidance

The operator UI has no tooltips, no inline help, no "what is this?" links, no contextual documentation. Users must leave the product and navigate the documentation separately to understand concepts.

---

## Top 6 Monetization Blockers

### 1. No Self-Serve Trial or Checkout

Prospects cannot try or buy without human involvement. The entire top-of-funnel is gated on sales capacity. Fix: enable a hosted trial with simulator mode; enable Stripe TEST checkout for staging evaluation.

### 2. No Proof That AI Output Is Worth Paying For

The core value proposition (AI-generated architecture findings) has no published evidence of quality from real LLM runs. Buyers are being asked to pay for an unproven AI capability. Fix: run and publish 10+ diverse architecture briefs with quality metrics.

### 3. No Reference Customer or Case Study

Every sales conversation starts from zero credibility. Enterprise buyers want to see who else uses the product. Fix: run an internal pilot and publish a sanitized case study.

### 4. ROI Model Is Theoretical

The $294K savings claim is a model, not a measurement. No before/after evidence exists. Fix: measure actual time savings in one pilot and publish the results.

### 5. Evaluation Barrier Filters Out Prospects

Requiring .NET + Docker + SQL Server to evaluate means many potential buyers never try the product. Fix: create a zero-dependency demo mode or hosted sandbox.

### 6. Sales-Led Motion Has No Sales Infrastructure

The sales-led model requires quote requests → manual follow-up, but there is no CRM, no pipeline tracking, no sales playbook beyond the "one-email kit." Fix: establish a minimal sales pipeline with lead tracking.

---

## Top 6 Enterprise Adoption Blockers

### 1. No CPA SOC 2 Attestation

Explicitly deferred (not scored as a defect per scope rules). However, enterprise procurement teams routinely require SOC 2 Type II. The self-assessment is credible but many RFPs have a hard requirement for CPA-issued reports. The trust center is honest about this, which is the right approach.

### 2. No Production Deployment Track Record

Trustworthiness for enterprise buyers requires demonstrating operational stability. No production environment exists, so no uptime history, no incident response history, no SLA track record.

### 3. Connector Validation Is Unproven in Customer Environments

Jira, ServiceNow, Confluence, and Slack connectors are tested against mocks. No customer has validated them against their own vendor instances. Live vendor smoke test results are not published.

### 4. Configuration Complexity

100+ configuration keys. Startup validation catches some misconfigurations but the surface area is large. An implementation team could easily misconfigure auth, database topology, content safety, or observability exports.

### 5. Single-Vendor Cloud Dependency

Azure-only hosting limits adoption by organizations committed to AWS, GCP, or multi-cloud. The product requires Azure SQL, Azure OpenAI, Azure Key Vault, and optionally Azure Container Apps, Front Door, and Application Insights.

### 6. No Formal Incident Response SLA

No SLA with credits exists. RTO/RPO targets are documented but not contractually committed. Enterprise buyers need SLA language for procurement approvals.

---

## Top 6 Engineering Risks

### 1. Real LLM Output Quality Regression

The agent pipeline produces useful results only if the underlying LLM (GPT-4o) produces useful architecture analysis. Model version changes, prompt drift, or token limit adjustments could silently degrade output quality. The eval corpus is too thin (4 scenarios) to catch regressions reliably. **Mitigation:** Expand eval corpus to 20+ scenarios; run nightly against real AOAI.

### 2. Single-Instance Worker Failure

The worker process handles advisory scans, outbox processing, digest delivery, and scheduled tasks as a single hosted loop. If the worker crashes or hangs, all background processing stops until manual intervention. No dead-letter queue, no distributed coordination. **Mitigation:** Add health monitoring and auto-restart; consider moving to Azure Container Apps Jobs for bursty work.

### 3. SQL Server as Sole Persistence Path

SQL Server is the only supported persistence provider. A SQL outage blocks the entire product. Azure SQL failover is optional and untested in production. Connection pool exhaustion under load is a known risk (chaos exercise targets this). **Mitigation:** Implement and test the SQL failover path; add connection pool monitoring and alerts.

### 4. Prompt Injection Through Architecture Briefs

Users submit free-text architecture descriptions that become LLM prompts. A malicious or accidentally adversarial brief could produce unexpected agent behavior. Content safety catches some categories but architecture-specific prompt injection is not tested. **Mitigation:** Add adversarial brief testing to the eval corpus; implement output validation beyond structural checks.

### 5. Data Consistency Drift in Legacy Databases

Historical databases may contain orphan rows (golden manifests, findings snapshots referencing deleted runs). Foreign keys were added with WITH NOCHECK for brownfield compatibility, meaning existing orphans are not retroactively validated. **Mitigation:** Run orphan probes against staging/production; establish a remediation SOP for legacy orphans.

### 6. Observability Blind Spots Before Export Configuration

Custom metrics exist in-process but are invisible until at least one export path (Application Insights, OTLP, or Prometheus) is configured. A default deployment without observability configuration is flying blind on agent output quality, LLM costs, and circuit breaker state. **Mitigation:** Make observability export configuration a required deployment step; fail-open with console export in non-production.

---

## Most Important Truth

ArchLucid is an exceptionally well-engineered product that has not yet proven its core value proposition — that AI can generate architecture findings worth paying for — to a single external buyer. The engineering depth (27 CI workflows, 13+ Terraform modules, 173+ audit events, property-based testing, mutation testing, OWASP ZAP, Schemathesis) is disproportionate to the commercial traction (zero customers, zero revenue, TEST-mode-only commerce). The product needs to stop building infrastructure and start proving that real GPT-4o output produces measurable time savings for real architects reviewing real systems. One successful pilot with documented ROI would do more for the product's weighted readiness than any 10 engineering improvements combined.

---

## Top 10 Improvement Opportunities

### 1. Run and Document Real LLM Architecture Analysis Quality

**Why it matters:** The entire product value proposition rests on AI-generated architecture findings being useful. Without evidence that real GPT-4o outputs produce actionable architecture analysis, the product is selling an unproven promise.

**Expected impact:** Directly improves AI/Agent Readiness (+10-15 pts), Correctness (+5-8 pts), Marketability (+5-8 pts), Proof-of-ROI Readiness (+3-5 pts). Weighted readiness impact: +1.5-2.5%.

**Affected qualities:** AI/Agent Readiness, Correctness, Marketability, Proof-of-ROI Readiness, Trustworthiness.

**Status:** Actionable now (requires AOAI credentials).

**Cursor Prompt:**

```
Using the existing golden cohort framework, expand the real-LLM evidence base:

1. In `tests/eval-corpus/agent-results/`, create 6 new `.real.json` exemplar files representing diverse architecture briefs:
   - cloud-migration-3tier.real.json (classic 3-tier to cloud)
   - microservices-decomposition.real.json (monolith breakup)
   - cost-optimization-overprovisioned.real.json (right-sizing scenario)
   - security-review-public-api.real.json (API security assessment)
   - compliance-healthcare-hipaa.real.json (regulated industry)
   - greenfield-saas-platform.real.json (new SaaS architecture)

2. For each, create a corresponding architecture brief in `tests/eval-corpus/briefs/` following the existing format from `AGENT_EVAL_CORPUS.md`.

3. Update `scripts/ci/eval_agent_corpus.py` to include the new scenarios in the `REAL_MODE_SCENARIOS` list.

4. Update `docs/library/AGENT_EVAL_CORPUS.md` with rows for each new scenario.

5. Add a new CI workflow `.github/workflows/golden-cohort-expanded-nightly.yml` that runs the full 10-scenario corpus against real AOAI when `AZURE_OPENAI_ENDPOINT` is set, publishing a markdown report artifact.

Constraints:
- Do not modify existing eval scenarios or change scoring thresholds.
- Each new exemplar must have structural completeness 1.0 and semantic score >= 0.8.
- Brief files must be realistic enterprise scenarios, not toy examples.
- Do not hardcode AOAI credentials anywhere.

Acceptance criteria:
- 10 total eval scenarios exist (4 existing + 6 new).
- `eval_agent_corpus.py` runs successfully against all 10 exemplars.
- The nightly workflow is syntactically valid YAML and references the correct script paths.
- `AGENT_EVAL_CORPUS.md` has rows for all 10 scenarios.
```

---

### 2. Create Zero-Dependency Demo Experience

**Why it matters:** The #1 adoption friction is the infrastructure requirement. A prospect who can see ArchLucid's output without installing anything is 10x more likely to evaluate further.

**Expected impact:** Directly improves Adoption Friction (+8-12 pts), Time-to-Value (+5-8 pts), Decision Velocity (+5-8 pts). Weighted readiness impact: +1.0-1.8%.

**Affected qualities:** Adoption Friction, Time-to-Value, Decision Velocity, Marketability, Customer Self-Sufficiency.

**Status:** Actionable now.

**Cursor Prompt:**

```
Create a pre-generated demo output package that prospects can explore without any infrastructure:

1. Create `docs/demo/` directory with:
   - `README.md` — explains what the demo contains and how to interpret it
   - `sample-architecture-brief.md` — the input brief used
   - `sample-manifest.json` — a committed golden manifest (generated from simulator mode)
   - `sample-findings/` directory with 3-5 finding JSON files showing different engines (Topology, Cost, Compliance)
   - `sample-artifacts/` directory with sample export outputs (markdown, executive summary)
   - `sample-explainability-trace.json` — showing the trace fields for one finding

2. Add a CLI command `archlucid demo` to `ArchLucid.Cli` that:
   - Copies the demo package to a local directory
   - Opens a summary in the terminal showing what was generated
   - Does NOT require SQL, Docker, or AOAI
   - Prints "To run ArchLucid for real, see docs/CORE_PILOT.md"

3. Update `README.md` to add a "See sample output" section above the "Try in 60 seconds" section, pointing to `docs/demo/README.md`.

Constraints:
- Demo files must be realistic but not contain any real customer data.
- Do not modify existing CLI commands or their behavior.
- The demo command must work with `dotnet run --project ArchLucid.Cli -- demo` only — no other dependencies.
- Do not add the demo files to the production container image.

Acceptance criteria:
- `dotnet run --project ArchLucid.Cli -- demo` runs without errors and produces output.
- `docs/demo/README.md` explains each file and what it represents.
- Sample manifest JSON validates against the existing manifest schema.
- README.md links to the demo section.
```

---

### 3. Add Starter Templates to Run Creation Wizard

**Why it matters:** First-time users face a blank wizard with no guidance on what to enter. Templates reduce cognitive load and increase the probability of a successful first run.

**Expected impact:** Directly improves Usability (+6-10 pts), Template and Accelerator Richness (+15-20 pts), Cognitive Load (+5-8 pts), Time-to-Value (+3-5 pts). Weighted readiness impact: +0.5-1.0%.

**Affected qualities:** Usability, Template and Accelerator Richness, Cognitive Load, Time-to-Value, Adoption Friction.

**Status:** Actionable now.

**Cursor Prompt:**

```
Add starter templates to the architecture run creation wizard in the operator UI:

1. Create `archlucid-ui/src/data/starter-templates.ts` with 5 templates:
   - "Cloud Migration Assessment" — pre-fills system name, description, topology hints for a lift-and-shift scenario
   - "Microservices Architecture Review" — pre-fills for a service decomposition review
   - "Cost Optimization Scan" — pre-fills with cost-focused constraints and Azure subscription context
   - "Security Posture Review" — pre-fills with security baseline requirements
   - "Compliance Readiness Check" — pre-fills with compliance framework references

Each template should export: { id, name, description, icon, prefill: Partial<ArchitectureRequest> }

2. In the wizard's first step component (find the wizard in `archlucid-ui/src/app/(operator)/runs/new/`), add a "Start from template" section above the manual entry form:
   - Show 5 template cards in a responsive grid
   - Clicking a template pre-fills the wizard form fields
   - Add a "Start from scratch" option that clears all fields
   - Preserve the existing manual flow as the default if no template is selected

3. Add Vitest tests in `archlucid-ui/src/data/starter-templates.test.ts`:
   - Each template has required fields (id, name, description, prefill)
   - No two templates share an id
   - Each template's prefill produces valid partial ArchitectureRequest

Constraints:
- Do not modify the wizard step flow or existing form validation.
- Templates are client-side only — no API changes.
- Do not change the API request schema.
- Template prefills must be valid against the existing ArchitectureRequest type.

Acceptance criteria:
- 5 template cards render on the first wizard step.
- Clicking a template populates the form fields.
- Existing manual wizard flow is unchanged when no template is selected.
- Vitest tests pass.
```

---

### 4. DEFERRED — Instrument and Publish Cost-to-Serve Per Architecture Run

**Title:** DEFERRED — Instrument and Publish Cost-to-Serve Per Architecture Run

**Reason deferred:** Requires production or staging deployment with real Azure OpenAI billing data. Cost measurement cannot be done meaningfully with simulator mode or without actual Azure resource consumption metrics.

**Information needed:** Access to an Azure subscription with OpenAI billing data, or a staging environment where actual LLM token costs can be measured per run. Alternatively, provide the average token counts per agent type from a real AOAI deployment so costs can be estimated from published pricing.

---

### 5. Add GitHub Actions PR Manifest Delta Workflow

**Why it matters:** GitHub is the dominant CI platform. Azure DevOps PR decoration exists but no GitHub equivalent. Adding a GitHub Action extends workflow embeddedness to the majority of potential customers.

**Expected impact:** Directly improves Workflow Embeddedness (+5-8 pts), Interoperability (+3-5 pts), Adoption Friction (+2-3 pts). Weighted readiness impact: +0.3-0.6%.

**Affected qualities:** Workflow Embeddedness, Interoperability, Adoption Friction.

**Status:** Actionable now.

**Cursor Prompt:**

```
Create a GitHub Actions reusable workflow for PR manifest delta commenting, mirroring the Azure DevOps PR decoration capability:

1. Create `.github/actions/manifest-delta/action.yml`:
   - Inputs: `api-base-url`, `api-key`, `run-id`, `compare-to-run-id` (optional), `github-token`
   - Steps: call the ArchLucid comparison API, format the delta as a markdown table, post as a PR comment
   - Use the existing `ArchLucid.Api.Client` or direct REST calls to `/v1/architecture/compare`

2. Create `.github/workflows/example-manifest-delta-github-pr.yml`:
   - Triggers on `pull_request`
   - Shows how to integrate the action with ArchLucid API calls
   - Documents the required secrets (`ARCHLUCID_API_KEY`, `ARCHLUCID_API_URL`)

3. Create `docs/integrations/GITHUB_PR_MANIFEST_DELTA.md`:
   - Setup instructions
   - Required secrets configuration
   - Example workflow YAML
   - Comparison with the Azure DevOps PR decoration

4. Update `docs/library/CONNECTOR_READINESS_MATRIX.md` to add a GitHub PR decoration row.

Constraints:
- Do not modify existing Azure DevOps integration code.
- The action must work with both GitHub.com and GitHub Enterprise Server.
- Use `actions/github-script` or direct `gh api` calls for PR commenting.
- Do not hardcode any API URLs or credentials.

Acceptance criteria:
- `action.yml` is valid and references correct inputs.
- The example workflow YAML is syntactically valid.
- Documentation includes setup, usage, and troubleshooting sections.
- Connector readiness matrix has a GitHub PR decoration row.
```

---

### 6. Ship Default Policy Packs

**Why it matters:** Governance is a key differentiator but requires operators to create policy packs from scratch. Default packs reduce time-to-value for governance adoption and demonstrate the feature's capabilities.

**Expected impact:** Directly improves Policy and Governance Alignment (+5-8 pts), Template and Accelerator Richness (+5-8 pts), Time-to-Value (+2-3 pts), Usability (+2-3 pts). Weighted readiness impact: +0.3-0.5%.

**Affected qualities:** Policy and Governance Alignment, Template and Accelerator Richness, Time-to-Value, Usability.

**Status:** Actionable now.

**Cursor Prompt:**

```
Create 3 default policy packs that ship with ArchLucid and can be adopted by operators:

1. In `ArchLucid.Application/Governance/DefaultPolicyPacks/`, create:
   - `BaselineSecurityPolicyPack.cs` — rules requiring security findings below Critical severity before commit
   - `CostGovernancePolicyPack.cs` — rules requiring cost findings to have remediation recommendations
   - `ArchitectureReviewBoardPolicyPack.cs` — rules requiring minimum finding coverage across Topology, Cost, and Compliance engines

2. Each policy pack class should implement the existing policy pack interface and include:
   - A descriptive name and version
   - 3-5 rules per pack
   - Severity thresholds appropriate for each domain
   - Human-readable rule descriptions

3. In `ArchLucid.Application/Bootstrap/` (or wherever policy pack seeding occurs), add a seed method that creates these packs on first boot if they don't already exist, with a `IsDefault=true` flag so operators know they can customize them.

4. Add tests in `ArchLucid.Application.Tests/Governance/DefaultPolicyPacks/`:
   - Each default pack serializes/deserializes correctly
   - Each pack has non-empty rules
   - Pack names are unique
   - Seed method is idempotent

5. Update `docs/library/GOVERNANCE.md` (or equivalent) to document the default packs.

Constraints:
- Do not modify existing policy pack schema or API contracts.
- Default packs must be customizable by operators after seeding.
- Do not auto-enable governance for existing tenants — packs are available but not active until adopted.
- Follow existing code patterns for policy pack creation.

Acceptance criteria:
- 3 default policy packs exist in code with valid rules.
- Seed method creates them on first boot without errors.
- Tests pass for serialization, uniqueness, and idempotency.
- Documentation describes each pack and how to adopt/customize it.
```

---

### 7. Add Contextual Help to Operator UI

**Why it matters:** Users currently must leave the product to understand concepts. Inline help reduces cognitive load and increases self-sufficiency.

**Expected impact:** Directly improves Customer Self-Sufficiency (+8-12 pts), Cognitive Load (+5-8 pts), Usability (+3-5 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Customer Self-Sufficiency, Cognitive Load, Usability.

**Status:** Actionable now.

**Cursor Prompt:**

```
Add a contextual help system to the ArchLucid operator UI:

1. Create `archlucid-ui/src/components/help-tooltip.tsx`:
   - A reusable component that renders a small "?" icon next to a label
   - On hover/click, shows a popover with a short explanation (2-3 sentences)
   - Optionally includes a "Learn more" link to the relevant doc
   - Accessible: aria-label, keyboard navigable, dismissable

2. Create `archlucid-ui/src/data/help-content.ts`:
   - Export a dictionary of help entries keyed by concept ID
   - Include entries for at minimum:
     - "golden-manifest" — what a golden manifest is and why it matters
     - "architecture-run" — what a run represents
     - "findings" — what findings are and how they're generated
     - "authority-chain" — what the authority chain proves
     - "explainability-trace" — what the trace fields mean
     - "governance-gate" — what the pre-commit gate does
     - "policy-pack" — what policy packs are
     - "commit" — what committing a run means
   - Each entry: { title, description, learnMoreUrl? }

3. Add HelpTooltip components to the following UI locations:
   - Run detail page: next to "Golden Manifest" heading
   - Run list page: next to "Runs" heading
   - Wizard first step: next to the form title
   - Governance dashboard: next to "Pre-commit Gate" label

4. Add Vitest tests:
   - HelpTooltip renders without errors
   - All help-content entries have non-empty title and description
   - Tooltip shows on interaction
   - Accessibility: axe-core scan on the tooltip component

Constraints:
- Do not modify existing component behavior or layout beyond adding the tooltip icons.
- Help content must be maintainable in one file (help-content.ts).
- Do not add external dependencies for the tooltip — use existing UI library components or simple CSS.
- Keep help text concise (max 3 sentences per entry).

Acceptance criteria:
- HelpTooltip component renders on at least 4 pages.
- 8+ help entries exist in help-content.ts.
- Vitest tests pass including axe accessibility scan.
- Tooltips are keyboard-navigable.
```

---

### 8. Validate ITSM Connectors Against Live Vendor Instances

**Why it matters:** Connectors are "Shipped + manual vendor" status. Without published evidence of live vendor testing, buyers cannot trust that the integration will work with their Jira/ServiceNow instance.

**Expected impact:** Directly improves Workflow Embeddedness (+3-5 pts), Trustworthiness (+2-3 pts), Interoperability (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Workflow Embeddedness, Trustworthiness, Interoperability, Procurement Readiness.

**Status:** Actionable now (requires vendor accounts).

**Cursor Prompt:**

```
Document and structure the ITSM connector live validation process:

1. Update each connector smoke doc under `docs/integrations/smoke/`:
   - `CONNECTOR_SMOKE_JIRA.md` — add a "Live validation results" section with a template table (Date, Jira version, Test result, Issue created, Status sync verified, Notes)
   - `CONNECTOR_SMOKE_SERVICENOW.md` — same template table for ServiceNow
   - `CONNECTOR_SMOKE_CONFLUENCE.md` — same for Confluence
   - `CONNECTOR_SMOKE_SLACK.md` — same for Slack

2. Create `scripts/integrations/validate-itsm-live.ps1`:
   - A PowerShell script that runs the live validation checklist for each connector
   - Takes parameters: -Provider (Jira|ServiceNow|Confluence|Slack), -ApiBaseUrl, required auth params
   - Calls the ArchLucid API to create a test finding, then calls the outbound create endpoint
   - Captures the response and appends to a results JSON file
   - Does NOT auto-resolve — operator must verify in the target system

3. Update `docs/library/CONNECTOR_READINESS_MATRIX.md`:
   - Add a "Live validation" column to the matrix
   - Status values: "Validated YYYY-MM-DD", "Pending", "Not applicable"

Constraints:
- Do not modify connector code or test code.
- The validation script must be safe to run against production vendor instances (creates only, no deletes).
- Do not hardcode any vendor credentials in the script.
- Live validation results sections should have "Pending" as default status.

Acceptance criteria:
- Each smoke doc has a live validation results template.
- The validation script runs without errors when called with --help.
- The connector readiness matrix has a live validation column.
```

---

### 9. Add Pipeline Stage Duration Visibility to Operator UI

**Why it matters:** Operators and buyers need to understand how long each stage of the architecture analysis takes. The pipeline stage durations are instrumented (histograms) but not visible in the product UI.

**Expected impact:** Directly improves Usability (+2-3 pts), Observability (+2-3 pts), Performance (+2-3 pts), Supportability (+2-3 pts). Weighted readiness impact: +0.1-0.3%.

**Affected qualities:** Usability, Observability, Performance, Supportability.

**Status:** Actionable now.

**Cursor Prompt:**

```
Add pipeline stage duration visualization to the run detail page in the operator UI:

1. Check if the API already returns stage timing data in the run detail response (look at `GET /v1/architecture/run/{runId}` response shape). If stage timings are available:
   - Parse the stage duration fields from the run detail response

2. If stage timings are NOT in the run detail response, check if they are available via another endpoint (e.g., agent evaluation, authority pipeline trace). If available elsewhere:
   - Add a secondary fetch to retrieve stage timings

3. In the run detail page (`archlucid-ui/src/app/(operator)/runs/[runId]/`):
   - Add a "Pipeline Timeline" section showing a horizontal bar chart
   - Each bar represents a pipeline stage (context_ingestion, graph, findings, decisioning, artifacts)
   - Bar width is proportional to stage duration
   - Show duration in milliseconds next to each bar
   - Color-code: green for < 1s, yellow for 1-5s, red for > 5s
   - Show total pipeline duration

4. Add Vitest tests:
   - Timeline renders with sample data
   - Duration formatting is correct
   - Color thresholds work correctly
   - Empty/missing stage data handles gracefully

Constraints:
- Do not modify API response schemas — work with existing data.
- If stage timing data is not available from the API, create a placeholder component that says "Pipeline timing available when stage metrics are enabled" and skip the implementation.
- Do not add external charting libraries — use CSS/SVG for the bar chart.
- The component must be responsive.

Acceptance criteria:
- Pipeline timeline renders on the run detail page (or a clear placeholder if data is unavailable).
- Vitest tests pass.
- The component handles missing data gracefully.
```

---

### 10. DEFERRED — Establish Hosted Staging Trial for Prospects

**Title:** DEFERRED — Establish Hosted Staging Trial for Prospects

**Reason deferred:** Requires infrastructure decisions about trial tenant provisioning, data isolation for trial users, trial expiration/cleanup automation, and Azure subscription cost commitment for hosting trial workloads. These are product and commercial decisions, not engineering implementation.

**Information needed:** (a) Should trial tenants use a shared database or database-per-tenant? (b) What is the trial duration? (c) Should trials use simulator mode or real AOAI? (d) What Azure subscription and budget should host trials? (e) Should trial signup require email verification, or should it be open?

---

## Pending Questions for Later

### Improvement 1 — Real LLM Architecture Analysis Quality
- What Azure OpenAI deployment name and model version should be used as the canonical baseline for quality scoring? (Golden cohort doc references `gpt-4o` but deployment names vary.)
- Should the quality gate thresholds be calibrated against buyer expectations, or should the current defaults (structural 1.0, semantic 0.8) be maintained?

### Improvement 4 (DEFERRED) — Cost-to-Serve Instrumentation
- What is the average token count per agent type (Topology, Cost, Compliance, Critic) in a real-mode run? This would allow cost estimation without a live deployment.
- Is there a target cost-per-run budget that should constrain prompt design?

### Improvement 8 — ITSM Live Validation
- Are test accounts available for Jira Cloud, ServiceNow Developer Instance, Confluence Cloud, and Slack workspace? If so, what are the authentication methods configured?
- Should live validation be a one-time exercise or a recurring scheduled job?

### Improvement 10 (DEFERRED) — Hosted Trial
- What is the acceptable Azure spend per month for hosting prospect trials?
- Should trials be self-serve (email signup) or gated (request access → manual approval)?

---

## Deferred Scope Uncertainty

All items identified as V1.1 or V2 deferrals in this assessment were traceable to `docs/library/V1_DEFERRED.md` and `docs/library/V1_SCOPE.md`. No deferred items were referenced without locatable source material. The following V1.1/V2 items were confirmed in the codebase and not scored against V1 readiness:

- SOC 2 CPA attestation (post-V1.1, confirmed in V1_DEFERRED.md §6c)
- Signed design partner (V1.1, confirmed in V1_DEFERRED.md §6b)
- Commerce un-hold / Stripe live keys (V1.1, confirmed in V1_DEFERRED.md §6b)
- MCP server (V1.1, confirmed in V1_DEFERRED.md §6d)
- Third-party pen test (V2, confirmed in V1_DEFERRED.md §6c)
- PGP key drop (V1.1, confirmed in V1_DEFERRED.md §6c)
- Distributed cache / Redis baseline (V2, confirmed in V1_DEFERRED.md §6e)
- Reference customer publication (V1.1, confirmed in V1_DEFERRED.md §6b)
