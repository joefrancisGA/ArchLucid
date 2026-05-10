# ArchLucid Assessment — Weighted Readiness 70.28%

**Date:** 2026-05-10
**Methodology:** Independent first-principles assessment from repository materials only. No prior assessments referenced. Deferred V1.1/V2 items excluded from scoring per scope contract.

---

## 1. Executive Summary

### Overall Readiness

ArchLucid is a substantial, architecturally ambitious AI-assisted architecture review platform that has progressed well beyond prototype stage into a genuine V1-shaped product. The core operator path (request → execute → commit → manifest/artifacts) works, the governance and audit surfaces are real and deep, and the engineering discipline (CI tiers, architecture invariants, Roslyn analyzers, mutation testing) reflects serious professional intent. At 70.28% weighted readiness, the product is pilot-capable but faces meaningful friction in three converging areas: **the AI correctness boundary is not yet proven against live models in CI**, **buyer-facing packaging and self-serve adoption are incomplete**, and **the cognitive load of the documentation and configuration surface is genuinely high for a product this early in market life**.

### Commercial Picture

The commercial surface is more developed than most pre-revenue enterprise SaaS products — pricing tiers, order form templates, DPA, ROI models, and a quote-to-cash path all exist. However, the commerce rails are in Stripe TEST mode, there is no public reference customer, and the self-serve trial funnel has not processed live payment. The sales-led motion is the only viable V1 path, which narrows the funnel to operator-initiated pilots. Marketability is constrained by the absence of third-party validation and the density of the documentation surface a buyer must navigate.

### Enterprise Picture

Enterprise trust infrastructure is impressively thorough for a pre-revenue product: SCIM provisioning, 78+ typed audit events with append-only SQL enforcement, policy packs with segregation of duties, RBAC with four roles, DPA template, CAIQ pre-fill, and a trust center with honest SOC 2 self-assessment posture. The gaps are in workflow embeddedness (ITSM connectors are shipped but not yet live-validated in CI with real vendor sandboxes), usability (the operator shell is functionally complete but demands significant domain expertise), and procurement readiness (no CPA SOC 2, no third-party pen test — both explicitly deferred and not scored here, but the self-assessment artifacts need to be as polished as possible to compensate).

### Engineering Picture

The engineering foundation is the product's strongest dimension. 21 test projects, tiered CI with secret scanning through chaos injection, OpenAPI contract snapshots, Roslyn analyzers, architecture invariant catalog, DbUp migrations, k6 load tests, Stryker mutation testing, and Schemathesis contract fuzz testing. The primary engineering risk is the **AI correctness boundary**: the golden cohort evidence log shows the real-LLM gate was attempted but blocked on credentials, meaning the quality gate pipeline has been validated only against exemplar fixtures, not live model output in CI. The per-process LLM budget trackers are a known multi-replica risk (acknowledged in ARCHITECTURE_INVARIANTS INV-004). The 6000+ line consolidated SQL schema is well-structured but represents a significant operational surface.

---

## 2. Weighted Quality Assessment

Qualities ordered by **weighted deficiency** (weight × (100 − score)), most urgent first.

### 2.1 Correctness — Score: 70 | Weight: 8 | Weighted Deficiency: 240

**Justification:** The structural pipeline (request → tasks → agent execution → merge → manifest → commit) works end-to-end in simulator mode. The quality gate (`AgentOutputQualityGate`) applies structural and semantic floor checks with per-agent-type overrides. Findings get confidence scores, grounding checks, and explainability traces. The `eval_agent_corpus.py` scoring pipeline validates exemplar JSON against structural completeness and semantic heuristics.

However, the golden cohort real-LLM gate evidence (2026-05-09) explicitly states: "No API or `archlucid try --real` invoke ran; no cloud credentials were used or logged." The entire agent output evaluation pipeline has been tested only against hand-crafted exemplar fixtures, not against outputs actually produced by Azure OpenAI. This means the correctness of the *product's core value proposition* — AI-generated architecture analysis — has not been proven under real conditions in any automated gate. The TECH_BACKLOG TB-007 acknowledges "LLM correctness boundary — cohort gate promotion + eval real-mode scenarios" as an open item with explicit prereqs (Gap A + C).

The finding engine infrastructure (10 engines including topology acceptance, security controls, policy coverage, requirement coverage, complexity) is well-factored. The decision merge strategies (TopologyAcceptanceDecisionStrategy, SecurityControlsDecisionStrategy, etc.) apply structured logic. But the quality of these outputs when driven by real LLM completions — as opposed to simulator fixtures — is the critical unknown.

**Tradeoffs:** Simulator-first testing enables fast CI and deterministic regression, but it defers the hardest correctness question: does the system produce *useful* architecture analysis when real models are involved?

**Recommendations:** Run the real-LLM golden cohort gate against live Azure OpenAI in a gated CI tier. Even one successful pass with metrics attached closes the most critical correctness gap. V1 fixable with operator credentials.

---

### 2.2 AI/Agent Readiness — Score: 73 | Weight: 8 | Weighted Deficiency: 216

**Justification:** The agent runtime is well-structured: four agent types (Topology, Cost, Compliance, Critic) with handler implementations, a staged prior-agent summary builder, prompt field redaction, cost guardrail interceptors, LLM completion caching, fallback completion client, content safety enforcement, and a comprehensive evaluation harness (structural scoring, semantic scoring via heuristic + optional LLM judge, evidence grounding with embedding faithfulness, trace quality evaluation). The quality gate has warn/reject thresholds configurable per agent type.

The agent model tier resolver and completion router support multi-tier deployment. LLM budget tracking exists at daily and monthly granularity. The agent execution trace recorder persists reasoning traces for explainability. The `AgentOutputEvaluationHarness` orchestrates structural, semantic, grounding, and trace-quality checks.

Gaps: (1) Budget trackers (`LlmMonthlyTenantDollarBudgetTracker`, `LlmDailyTenantBudgetTracker`) appear to operate in-process, creating multi-replica drift risk (INV-004 acknowledges this). (2) The MCP membrane is explicitly V1.1 — no agent-to-agent tool ecosystem in V1. (3) No evidence of real-time model performance monitoring or drift detection against production LLM outputs. (4) The eval corpus uses exemplar fixtures; no automated real-model regression exists in CI today.

**Tradeoffs:** The conservative "simulator-first" posture avoids LLM cost in CI but means the AI evaluation pipeline is validated against synthetic data only. The quality gate floors are configurable but the defaults have not been calibrated against real-world model output distributions.

**Recommendations:** Wire TB-004 (OTel exporters for agent output metrics) and run one live execution cycle per environment to establish baseline quality gate distributions. Then calibrate floor thresholds against actual model behavior.

---

### 2.3 Adoption Friction — Score: 62 | Weight: 6 | Weighted Deficiency: 228

**Justification:** Getting value from ArchLucid requires: .NET 10 SDK, Docker, SQL Server, understanding the run lifecycle concept, configuration of auth mode, and either the CLI or the operator UI. The "try in 60 seconds" path (`dotnet run --project ArchLucid.Cli -- try`) is a good starting point but still requires a development machine with .NET 10.

For hosted SaaS, the trial funnel exists but is in Stripe TEST mode. The onboarding wizard exists, the Core Pilot guide is thorough, and there is a first-30-minutes doc. However, the documentation volume is itself a friction source — 680+ markdown files in docs/, which even with the five-document spine and START_HERE.md, creates a density that can overwhelm a new evaluator.

The operator UI (Next.js with Radix UI, Tailwind) appears functional with run lifecycle, manifest review, artifact download, compare, replay, graph, governance, audit, and alert surfaces. But the progressive disclosure model (Show more links, extended/advanced sidebar) may not be obvious to first-time users.

The requirement for SQL Server (not PostgreSQL, not SQLite for dev) narrows the developer experience audience. Docker Compose profiles exist but still require understanding the multi-container topology.

**Tradeoffs:** Enterprise-grade features (SCIM, RBAC, audit, governance) necessarily add configuration surface. The question is whether the minimal viable onboarding path is sufficiently insulated from this complexity.

**Recommendations:** Ensure the hosted SaaS trial path requires zero local toolchain. Validate that `staging.archlucid.net` signup → first committed manifest can be completed by a person who has never seen the product, using only the browser.

---

### 2.4 Marketability — Score: 68 | Weight: 8 | Weighted Deficiency: 256

**Justification:** The value proposition — "shorten the path from architecture request to reviewable, defensible architecture package" — is clear and addresses a real enterprise pain point. The executive sponsor brief, product datasheet, and pricing philosophy are well-developed. The pilot ROI model ($294K annual savings for a 6-architect team) gives buyers a concrete number.

However, marketability is constrained by: (1) no public reference customer or case study, (2) no third-party validation (analyst, award, pen test), (3) the product category ("AI architecture review") is not yet established — buyers may not know to look for it, (4) the marketing site at archlucid.net is in staging, and (5) the "10 finding engines" claim lacks independent validation that these engines produce commercially valuable output under real conditions.

The Champion 48-Hour Kit, decision fast lane, and "Not a Fit" guide show commercial maturity in the sales motion design. The whitepaper ("State of AI Architecture 2026") is a legitimate thought leadership asset.

**Tradeoffs:** Early-stage products face a chicken-and-egg problem: they need reference customers for marketability, but need marketability for reference customers. The sales-led motion is the right V1 strategy but limits reach.

**Recommendations:** Produce one publicly shareable demo recording with real (anonymized) architecture output. A 3-minute video showing request → commit → manifest → findings → Terraform advisory snippet would do more for marketability than any additional document.

---

### 2.5 Proof-of-ROI Readiness — Score: 64 | Weight: 5 | Weighted Deficiency: 180

**Justification:** The ROI model exists and is grounded in reasonable assumptions (40+ hours per manual architecture review). The pilot ROI model, pilot success scorecard, and "Why ArchLucid" pack builder exist. The measured ROI service (`ITenantMeasuredRoiService`) and first-value evidence completeness classifier suggest infrastructure for proving value.

However, no actual ROI measurement from a real pilot exists. The "proof" is entirely projected. The sample aggregate ROI bulletin is synthetic. The sponsor evidence pack and proof-of-value snapshot are architectural — they describe *how* ROI would be proven, not *that* it has been proven.

**Tradeoffs:** Projected ROI is standard for pre-revenue SaaS. The risk is that the projection is generous (break-even at ~180 architect-hours/year) and the "10x" framing may not survive scrutiny if the AI-generated architecture analysis requires significant human review/correction.

**Recommendations:** Run one complete pilot with time tracking. Even an internal dogfood pilot that measures "time to architecture package with ArchLucid vs manual" provides concrete evidence. The first-value evidence completeness classifier already exists — use it.

---

### 2.6 Workflow Embeddedness — Score: 60 | Weight: 3 | Weighted Deficiency: 120

**Justification:** ArchLucid integrates with: Microsoft Teams, Slack, Jira, ServiceNow, Confluence, Azure DevOps (PR decoration), CloudEvents webhooks, Azure Service Bus, and the Azure Extractor (customer-run PowerShell). SCIM 2.0 provisioning is shipped.

However, all ITSM connectors (Jira, ServiceNow, Confluence) are marked "Shipped + manual vendor" — meaning automated tests use mocks, and live validation against actual vendor instances requires manual operator setup. TB-016 in TECH_BACKLOG explicitly calls out: "ITSM + chat vendor sandbox accounts — provision, secrets, inbound webhooks — for recurring live smoke" as needed for trust/interoperability. Until these connectors are validated against real vendor APIs in a recurring automated fashion, the "shipped" status carries an asterisk.

The VS Code / IDE integration is explicitly out of scope. There is no GitHub App or GitHub Actions-native integration (only a workflow example). The Azure DevOps integration is PR-decoration-only; work item creation is planned but not shipped.

**Tradeoffs:** First-party connectors for the four major enterprise targets (Jira, ServiceNow, Confluence, Teams/Slack) is the right priority set. The gap is proof of ongoing compatibility, not architectural capability.

**Recommendations:** Stand up a Jira Cloud free-tier project and a ServiceNow developer instance; wire them into CI as a nightly validation. Even a single successful create + status sync per vendor per nightly run closes the credibility gap.

---

### 2.7 Decision Velocity — Score: 58 | Weight: 2 | Weighted Deficiency: 84

**Justification:** For a buyer evaluating ArchLucid, the decision process requires: (1) understanding the product category, (2) navigating the documentation, (3) running a pilot or demo, (4) evaluating the AI output quality, (5) assessing trust/security, (6) pricing/procurement. Each step involves significant material — the documentation library alone is 680+ files.

The decision fast lane guide, buyer first-30-minutes, and executive sponsor brief help. The order form template and pricing are explicit. But the sheer volume of material creates analysis paralysis. A buyer who opens the repo or the trust center encounters a documentation surface that is optimized for completeness over decision speed.

**Tradeoffs:** Comprehensive documentation serves long procurement cycles well but penalizes time-to-decision. Enterprise buyers often need to justify the evaluation effort before the evaluation begins.

**Recommendations:** Create a one-page "Should you evaluate ArchLucid?" decision tree. If the answer is yes, link to a 15-minute guided evaluation path that reaches a committed manifest.

---

### 2.8 Cognitive Load — Score: 58 | Weight: 1 | Weighted Deficiency: 42

**Justification:** The system imposes high cognitive load across every surface: (1) 680+ documentation files with a five-document spine, architecture index, operator atlas, and navigator — but the sheer volume means finding the right document requires meta-navigation, (2) configuration surface includes a `ConfigurationKeyCatalog` with extensive keys across auth, billing, storage, LLM, observability, and governance, (3) the SQL schema is 6000+ lines in a single consolidated file, (4) the operator UI uses progressive disclosure but the number of surfaces (runs, manifests, compare, replay, graph, Ask, advisory, governance, policy packs, audit, alerts, compliance drift) requires significant learning investment.

For *operators* (the target user), the Core Pilot path is reasonable: create → execute → commit → review. The complexity escalates sharply when moving to the Operate layer. For *contributors*, the INSTALL_ORDER, FIRST_30_MINUTES, and persona table help, but the number of projects (50+ .csproj), docs folders, and cross-referencing conventions is high.

**Tradeoffs:** The modularity and documentation depth are genuine engineering strengths. The problem is not that information is missing but that finding and prioritizing it requires significant effort.

**Recommendations:** Add a contextual help system to the operator UI that surfaces the right documentation section based on the current page/workflow state, rather than relying on users to search the docs library.

---

### 2.9 Usability — Score: 65 | Weight: 3 | Weighted Deficiency: 105

**Justification:** The operator UI (Next.js, Radix UI, Tailwind) covers the core workflows: run creation wizard, pipeline timeline, manifest summary, artifact review/download, comparison, replay, graph visualization (ReactFlow), governance dashboard, audit log with filters, alert management, and policy pack configuration. Accessibility testing exists (Vitest + jest-axe on components, Playwright axe integration, live route matrix).

However: (1) the progressive disclosure model means key features are hidden behind "Show more links" and "extended/advanced" sidebar toggles — a new user may not discover them, (2) the seven-step architecture request wizard is thorough but may feel heavyweight for a "quick architecture review" use case, (3) the UI proxies to the API with correlation + scope headers but the error experience when the API is unreachable or misconfigured is not clear from the code I examined, (4) the "Pilot" vs "Operate" layer distinction is a product concept that users must learn — it does not map to intuitive UI categories.

The CLI (archlucid try, run, commit, status, artifacts, doctor, support-bundle) provides a reasonable automation surface.

**Tradeoffs:** Feature richness necessarily trades against simplicity. The progressive disclosure approach is correct but the discovery mechanism may need work.

**Recommendations:** Add a guided tour or interactive walkthrough for first-time users in the operator UI. The onboarding wizard exists but a contextual overlay pointing out key surfaces would reduce time-to-proficiency.

---

### 2.10 Trustworthiness — Score: 72 | Weight: 3 | Weighted Deficiency: 84

**Justification:** Trust infrastructure is genuinely strong for pre-revenue: SCIM 2.0, database-per-tenant isolation, RLS as defense-in-depth, 78+ typed audit events with append-only SQL enforcement (DENY UPDATE/DELETE), content safety guard on LLM prompts, prompt redaction, RBAC with four roles, API key and JWT auth, Key Vault secret references, OWASP ZAP baseline, Gitleaks, CodeQL, Trivy scans, STRIDE threat model, DPA template, CAIQ pre-fill, and honest trust center posture.

The gaps: (1) SOC 2 is self-assessment only (explicitly deferred — not scored here), (2) pen testing is owner-conducted only (explicitly deferred — not scored here), (3) the "10 finding engines" quality has not been independently validated, meaning a buyer is trusting ArchLucid's AI output quality on faith, (4) the database-per-tenant model is well-designed but the tenant provisioning lifecycle for trials (elastic pool warm catalogs, teardown SOP) is still backlog items (TB-017, TB-018).

**Tradeoffs:** Trust is established incrementally. The documentation honesty (stating what is *not* done as clearly as what is done) is itself a trust signal. The risk is that the gap between documentation thoroughness and production operational evidence may erode trust with sophisticated buyers.

**Recommendations:** Complete one end-to-end tenant lifecycle test including provisioning, data operations, and teardown to prove the isolation model works in practice, not just in architecture.

---

### 2.11 Architectural Integrity — Score: 79 | Weight: 3 | Weighted Deficiency: 63

**Justification:** The architecture is well-bounded: Contracts (DTOs/interfaces) → Core (domain types, configuration, billing, tenancy, audit abstractions) → Application (orchestration, exports, integrations, governance) → Persistence (Dapper + DbUp, SQL repositories) → AgentRuntime (LLM clients, evaluation harness, quality gates) → Decisioning (finding engines, merge strategies, manifests, alerts, advisory) → Host.Composition (DI wiring) → Api (controllers, auth middleware) → Worker (background jobs). Analyzers enforce cross-project rules via Roslyn. Architecture tests in `ArchLucid.Architecture.Tests` validate structural conventions.

The architecture invariant catalog (INV-001 through INV-015) is a genuine engineering governance artifact. INV-001 (tenant identity boundary) is enforced by a Roslyn analyzer (ARCH001). The single composition root invariant (INV-006) and production fail-closed invariant (INV-005) are well-defined.

Gaps: (1) The Persistence project has a large dependency footprint including Stripe.net, Azure.Communication.Email, and Microsoft.Azure.Cosmos — suggesting it may be handling too many concerns, (2) several invariants are "convention only" without enforcement (INV-002 through INV-004, INV-007 through INV-015), (3) the transition from coordinator-era architecture to authority-era architecture left some legacy naming and code paths.

**Tradeoffs:** The architecture reflects genuine evolution from an earlier design ("ArchiForge" / coordinator model) to the current authority model. The rename is mostly complete but legacy artifacts remain in comments, SQL scripts, and some internal naming.

**Recommendations:** Continue the TB-010/TB-011/TB-012 invariant enforcement waves. Each wave that lands converts convention-only invariants to automated enforcement, which is the highest-leverage architectural integrity improvement.

---

### 2.12 Security — Score: 76 | Weight: 3 | Weighted Deficiency: 72

**Justification:** The security surface is thorough: JWT bearer with configurable OIDC issuers (Entra ID + generic OIDC), API key auth, RBAC with Admin/Operator/Reader/Auditor roles, SCIM 2.0 provisioning with hashed bearer tokens, prompt redaction for LLM calls, content safety guard, database-per-tenant isolation, RLS as defense-in-depth, private endpoints in Terraform, WAF modules, Key Vault for secrets, OWASP ZAP baseline in CI, Gitleaks, CodeQL, Trivy image + config scanning, Schemathesis contract fuzz testing, and a STRIDE threat model.

The security posture is honest: the trust center clearly states what exists and what doesn't. The SECURITY.md and pen-test-summaries directory structure is well-organized.

Gaps: (1) The owner-conducted pen test (2026-Q2) provides a framework but not independent validation, (2) the content safety guard exists but the depth of prompt injection testing is unclear — the CI has "prompt-injection regression" as a named gate but I'd need to see the test content, (3) the PGP key for coordinated disclosure is not yet deployed (V1.1), (4) the API rate limiting is documented but the implementation depth versus sophisticated abuse patterns is not fully clear.

**Tradeoffs:** The "never request Global Reader/Owner/Contributor" pledge and the Tier 1 (no vendor access) default are strong trust signals. The advisory-only Terraform emit with no terraform apply/destroy is a genuine safety constraint.

**Recommendations:** Complete one pass of the prompt injection regression suite against real LLM completions (not just fixture validation). Document the results alongside the owner-conducted pen test evidence.

---

### 2.13 Time-to-Value — Score: 72 | Weight: 7 | Weighted Deficiency: 196

**Justification:** The "try in 60 seconds" CLI path and the Core Pilot four-step guide are reasonable time-to-value accelerators. For hosted SaaS, signup → first committed manifest should be achievable in under an hour given the trial funnel and onboarding wizard.

However: (1) meaningful value (not just "I saw a manifest" but "I got an architecture review that taught me something") depends on the AI output quality against the user's actual architecture — which requires either the Azure Extractor upload or manual request description, (2) the seven-step request wizard is thorough but adds friction before the user sees any output, (3) understanding whether the findings are correct and actionable requires architecture domain expertise, (4) the time from "I signed up" to "I showed my VP/CTO a compelling result" likely exceeds the attention span of most evaluators.

**Tradeoffs:** Faster time-to-value often means less thorough input, which means less accurate output. The request wizard collects information needed for quality analysis but imposes upfront cost.

**Recommendations:** Add a "quick scan" path that produces a preliminary finding set from minimal input (system name + cloud provider + one paragraph description), delivering something reviewable in under 5 minutes. Then invite the user to enrich the request for a deeper analysis.

---

### 2.14 Executive Value Visibility — Score: 74 | Weight: 4 | Weighted Deficiency: 104

**Justification:** The sponsor evidence pack, executive sponsor brief, "Why ArchLucid" pack builder, pilot success scorecard, and CLI `sponsor-one-pager` command all target executive audiences. The ROI model provides concrete numbers. The governance dashboard and compliance drift tracking give executives operational visibility.

The gap is that all executive-facing artifacts are templates and projections — none contain real measured results from actual pilots. The first-value evidence completeness classifier exists but has not been exercised against real data.

**Tradeoffs:** Template-quality executive materials are table stakes. The differentiator would be measured results.

**Recommendations:** After the first real pilot, populate the executive evidence pack with actual before/after metrics and time savings.

---

### 2.15 Differentiability — Score: 71 | Weight: 4 | Weighted Deficiency: 116

**Justification:** ArchLucid's differentiation claims include: (1) AI-assisted architecture review with structured finding engines, (2) golden manifest commitment model with governance, (3) 10 finding engines spanning topology, cost, compliance, and cross-cutting concerns, (4) evidence-backed recommendations with provenance graphs, (5) advisory-only Terraform emit with explicit safety constraints.

These are genuine differentiators if they work as described. The risk is that the "AI-assisted" part has not been proven under real conditions, and competitors in the architecture tooling space (while not directly comparable) may offer partial overlapping capabilities.

**Tradeoffs:** First-mover advantage in "AI architecture review" is real but fragile. The differentiation is more defensible in the governance/audit/compliance layer than in the AI analysis layer.

**Recommendations:** Develop a competitive comparison matrix that honestly positions ArchLucid against manual architecture review, static analysis tools, and cloud architecture advisory services. Publish it.

---

### 2.16 Commercial Packaging Readiness — Score: 70 | Weight: 2 | Weighted Deficiency: 60

**Justification:** Three tiers (Team, Professional, Enterprise custom) per [PRICING_PHILOSOPHY §5 — Locked list prices](docs/go-to-market/PRICING_PHILOSOPHY.md#5-locked-list-prices-2026), clear seat and run allowances, annual prepay discounts, finding engine access tiers, governance capability tiering. The billing infrastructure (Stripe controllers, Marketplace webhooks, production safety rules, tier enforcement via `[RequiresCommercialTenantTier]` 402 filter) is wired but in TEST mode.

**Tradeoffs:** The packaging is more developed than most pre-revenue products. The gap is the live commerce flip, which is explicitly deferred to V1.1.

**Recommendations:** Validate the complete test-mode trial → paid conversion path on staging before the V1.1 commerce un-hold.

---

### 2.17 Compliance Readiness — Score: 68 | Weight: 2 | Weighted Deficiency: 64

**Justification:** SOC 2 self-assessment, CAIQ Lite pre-fill, SIG questionnaire acceleration, DPA template, subprocessors register, audit event coverage matrix with CI guard, and honest trust center positioning. The append-only audit trail with DENY UPDATE/DELETE is a genuine compliance control.

Gaps: (1) No CPA SOC 2 (deferred — not scored), (2) CAIQ and SIG are pre-fills, not submitted to CSA STAR or an assessor, (3) data retention policy exists but automated enforcement of retention windows is operator-scheduled, not product-enforced.

**Tradeoffs:** Self-assessment with honest documentation is the right V1 posture for a pre-revenue product. The risk is that enterprise procurement may reject self-assessment without a committed timeline.

**Recommendations:** Publish the SOC 2 roadmap timeline explicitly on the trust center with quarterly milestones.

---

### 2.18 Procurement Readiness — Score: 64 | Weight: 2 | Weighted Deficiency: 72

**Justification:** The procurement FAQ, procurement response accelerator (50 SIG/CAIQ-mapped prompts), order form template, DPA template, and subprocessors register are all present. The pricing is explicit and the quote request flow exists.

Gaps: (1) No CPA SOC 2 — procurement teams at mid-to-large enterprises routinely require this, (2) no third-party pen test summary for NDA distribution, (3) the Marketplace SaaS offer is not published, (4) no VPAT/ACR for accessibility compliance documentation (though accessibility testing exists in CI).

**Tradeoffs:** Every missing procurement artifact adds negotiation friction. The honest "we don't have SOC 2 yet, here's our roadmap" posture is better than silence but still extends deal cycles.

**Recommendations:** Prepare a VPAT/ACR draft based on the existing axe accessibility test results. This is a low-effort, high-credibility procurement artifact.

---

### 2.19 Traceability — Score: 78 | Weight: 3 | Weighted Deficiency: 66

**Justification:** The provenance graph, architecture run provenance service, decision merge trace recorder, agent execution trace recorder, authority committed chain writer, finding confidence enrichment chain, and audit event trail provide strong traceability from request through to committed manifest. Correlation IDs flow through the stack. The OpenAPI contract snapshot tests ensure API contract traceability.

Gaps: (1) The V1 requirements test traceability matrix is described as "lightweight" — a more rigorous bidirectional trace would strengthen this, (2) traceability of *why* the AI produced a specific finding is limited to heuristic grounding scores and optional LLM judge output.

**Tradeoffs:** Full provenance is a genuine product differentiator. The question is whether the trace data is useful to the target audience (architects) or primarily useful to the engineering team.

**Recommendations:** Expose the provenance graph more prominently in the operator UI as a buyer-facing differentiator, not just an engineering inspection tool.

---

### 2.20 Auditability — Score: 80 | Weight: 2 | Weighted Deficiency: 40

**Justification:** 78+ typed audit events, append-only SQL enforcement, paginated audit retrieval, filtered search (correlation ID, run ID, time window), CSV export for compliance, audit retention policy with hot/warm/cold tiers, and a CI guard that validates the audit constant catalog against the coverage matrix. The governance workflow dual-writes to both baseline mutation log and durable audit.

This is the strongest enterprise signal in the product. Genuine production-grade audit infrastructure.

**Tradeoffs:** The audit infrastructure is more mature than most shipped enterprise products, let alone pre-revenue ones. Minor gap: some orchestration paths use baseline mutation log only (structured logger, not durable SQL).

**Recommendations:** Close remaining baseline-only audit gaps identified in the coverage matrix Known Gaps section for the highest-traffic orchestration paths.

---

### 2.21 Policy and Governance Alignment — Score: 78 | Weight: 2 | Weighted Deficiency: 44

**Justification:** Policy packs with versioned rule sets, scope assignments, effective governance resolution, pre-commit governance gate (block commit when findings exceed severity thresholds), approval workflow with segregation of duties (self-approval blocked), SLA tracking, webhook escalation on breach, governance dashboard with cross-run pending approvals. Default policy pack templates exist.

This is substantive governance infrastructure — not checkbox compliance but a genuine workflow engine.

**Tradeoffs:** The governance surface adds complexity. Teams that don't need governance (early-stage evaluators) must navigate past it. The progressive disclosure model helps but doesn't fully solve this.

**Recommendations:** Ensure the default policy pack templates are calibrated to produce meaningful findings against common architecture patterns, not just demonstrate the engine.

---

### 2.22 Interoperability — Score: 70 | Weight: 2 | Weighted Deficiency: 60

**Justification:** REST API with OpenAPI v1 contract, CLI, CloudEvents webhooks, Azure Service Bus, SCIM 2.0, Teams, Slack, Jira, ServiceNow, Confluence, Azure DevOps PR decoration, Azure Extractor. Generated TypeScript types and .NET API client. Integration event catalog in JSON schema.

Gaps: (1) No MCP (V1.1), (2) no GitHub App/Actions native integration, (3) no VS Code extension, (4) ITSM connectors validated against mocks only in CI, (5) no GraphQL or gRPC surface.

**Tradeoffs:** REST + webhooks + SCIM covers 80% of enterprise integration needs. The MCP gap is the most significant for the agent ecosystem story.

**Recommendations:** Prioritize one live vendor validation (Jira Cloud free tier) in nightly CI to prove ongoing compatibility.

---

### 2.23 Reliability — Score: 74 | Weight: 2 | Weighted Deficiency: 52

**Justification:** Circuit breaker patterns in the agent runtime, LLM retry with exponential backoff (`AzureOpenAiTooManyRequestsRetry`), fallback completion client, Simmy chaos testing in CI, reliability drill scheduled workflow, health probes (live/ready/health), data consistency reconciliation service, idempotent SQL schema creation, and DbUp migrations. The API runs on ASP.NET Core with structured health checks.

Gaps: (1) RTO/RPO targets are documented but not contractually committed, (2) SQL failover group Terraform exists but is optional, (3) the data consistency reconciliation service exists but its operational track record is unknown, (4) the chaos testing (Simmy) surface coverage is not clear from what I examined.

**Tradeoffs:** For a V1 product, the reliability infrastructure is strong. The gap is operational evidence, not architectural capability.

**Recommendations:** Run the reliability drill scheduled workflow against a SQL-backed environment and document the results as operational evidence.

---

### 2.24 Data Consistency — Score: 72 | Weight: 2 | Weighted Deficiency: 56

**Justification:** The data consistency reconciliation service, DbUp migrations against consolidated DDL, transactional writes via `IArchLucidUnitOfWork`, idempotent schema creation, and the persistence MigrateVerify project (testing migration paths) all support data consistency. The run commit flow uses optimistic concurrency with documented conflict behavior.

Gaps: (1) The 6000+ line consolidated SQL schema and separate migration scripts create dual-maintenance risk (though the MigrateVerify project helps), (2) the data archival orphan probe exists in tests but the operational posture for data lifecycle management is backlog, (3) the per-tenant database model means consistency guarantees are per-catalog — cross-tenant consistency is explicitly out of scope.

**Tradeoffs:** Database-per-tenant simplifies consistency within a tenant but adds operational complexity for schema migrations across many catalogs.

**Recommendations:** Validate DbUp migration idempotency against a catalog with existing data from a prior version — the MigrateVerify project should cover this but explicit evidence is needed.

---

### 2.25 Maintainability — Score: 77 | Weight: 2 | Weighted Deficiency: 46

**Justification:** The codebase is well-modularized (50+ projects with clear boundaries), uses primary constructors with null checks, follows interface-first design, has a Roslyn analyzer project for custom rules, and maintains explicit architecture invariants. The code I examined follows consistent style with modular single-responsibility classes.

The TECH_BACKLOG provides prioritized engineering work. The ADR directory contains 35+ architecture decision records. The coding conventions are enforced by Cursor rules (whitespace, throw style, blank lines).

Gaps: (1) The project count itself creates cognitive overhead for new contributors, (2) the legacy naming from pre-rename era adds maintenance noise, (3) the Persistence project's wide dependency surface suggests it may benefit from further decomposition.

**Tradeoffs:** High modularity enables independent evolution but increases the surface area for dependency management and cross-project coordination.

**Recommendations:** Complete the Phase 7 rename cleanup to remove legacy naming friction from daily development.

---

### 2.26 Explainability — Score: 71 | Weight: 2 | Weighted Deficiency: 58

**Justification:** The finding explainability narrative builder, explainability trace completeness analyzer, finding trace confidence mapper, sponsor evidence explainability mapper, and run explanation summary service all contribute to system explainability. The decision merge trace recorder captures the reasoning chain. The agent execution trace recorder persists LLM reasoning traces.

Gaps: (1) Explainability of *why* the AI reached a specific finding relies on heuristic grounding scores and optional LLM judge narrative — not a transparent chain of evidence, (2) the finding confidence levels (calculated) may not be intuitive to architects who expect binary "correct/incorrect" assessments, (3) the explanation quality depends on the underlying model behavior which is not directly controlled.

**Tradeoffs:** AI explainability is an unsolved problem industry-wide. The product's approach (multi-dimensional confidence + trace recording + grounding checks) is more principled than most.

**Recommendations:** Add a "How was this finding produced?" drill-down in the operator UI that shows the evidence chain from request context through to the specific model output that generated the finding.

---

### 2.27 Azure Compatibility and SaaS Deployment Readiness — Score: 80 | Weight: 2 | Weighted Deficiency: 40

**Justification:** 12+ Terraform root modules covering Container Apps, SQL, storage, Key Vault, Service Bus, Front Door/WAF, APIM, monitoring, Entra ID, OpenAI, private networking, and SQL failover. Docker Compose profiles. Container Apps jobs Terraform. Managed identity for SQL and Blob. Private endpoint modules. Azure Front Door with marketing routes.

The hosted SaaS probe workflow validates the staging environment. The cd-staging-on-merge and cd-saas-greenfield workflows handle deployment. The Terraform modules include `checks.tf` files for validation.

This is a comprehensively Azure-native deployment surface.

**Tradeoffs:** Azure-only limits market to Azure customers, but this is the stated design choice.

**Recommendations:** Ensure the `apply-saas.ps1` script and the greenfield deployment workflow produce a clean environment from scratch — test this as a release gate.

---

### 2.28 Stickiness — Score: 73 | Weight: 1 | Weighted Deficiency: 27

**Justification:** Data lock-in via SQL persistence (architecture runs, manifests, audit events, governance state), accumulated governance policy packs, trained recommendation learning profiles, historical comparison baselines, and the provenance graph all create switching costs. The integration wiring (ITSM correlations, webhook subscriptions, SCIM provisioning) adds operational inertia.

**Tradeoffs:** Stickiness is healthy at this level. The risk is that early-stage customers may not invest enough to trigger the lock-in effects.

**Recommendations:** Ensure data export is easy and well-documented. Paradoxically, making it easy to leave increases willingness to stay.

---

### 2.29 Template and Accelerator Richness — Score: 76 | Weight: 1 | Weighted Deficiency: 24

**Justification:** Architecture request templates, integration recipe templates (Logic Apps, Power Automate), bridge contract test templates, Terraform module templates, pen test SoW/summary templates, DPA template, order form template, finding engine template project. The offline demo pack and demo quickstart exist.

**Tradeoffs:** Templates reduce time-to-value but require maintenance. The current template set is adequate for V1.

**Recommendations:** Add 2-3 industry-specific architecture request templates (e.g., "Azure microservices migration", "legacy modernization", "multi-region deployment") to demonstrate domain applicability.

---

### 2.30 Accessibility — Score: 72 | Weight: 1 | Weighted Deficiency: 28

**Justification:** Jest-axe component testing, Playwright axe integration in CI, live axe route matrix (nightly), Radix UI primitives (which have built-in accessibility), and an accessibility mailbox. The CI runs `ui-axe-components` as a merge gate.

Gaps: (1) No VPAT/ACR published, (2) no evidence of screen reader testing beyond automated axe checks, (3) no keyboard navigation testing documentation.

**Tradeoffs:** Automated axe testing catches structural accessibility issues but misses interaction patterns and cognitive accessibility.

**Recommendations:** Generate a VPAT/ACR draft from existing axe results. This is a procurement accelerator with minimal effort.

---

### 2.31 Customer Self-Sufficiency — Score: 60 | Weight: 1 | Weighted Deficiency: 40

**Justification:** CLI doctor command, support bundle, troubleshooting guide, health probes, version endpoint, and extensive documentation all support self-sufficiency. The operator UI surfaces run status, manifest details, and diagnostic information.

Gaps: (1) No in-product help system or contextual documentation, (2) the documentation volume requires significant self-directed navigation, (3) no community forum, knowledge base, or FAQ accessible from the product, (4) the Tier 1 support runbook exists but is internal-facing.

**Tradeoffs:** Self-sufficiency depends on documentation quality, which is high but dense.

**Recommendations:** Add an in-product "Help" panel that links to relevant docs based on the current operator UI context.

---

### 2.32 Change Impact Clarity — Score: 74 | Weight: 1 | Weighted Deficiency: 26

**Justification:** Breaking changes document, changelog, comparison replay (structured golden-manifest deltas), compliance drift trend tracking, and the policy pack change log all support change impact clarity. The commit flow has documented conflict behavior.

**Tradeoffs:** Strong for architecture output changes (manifest deltas). Less clear for product/platform changes that affect operators.

**Recommendations:** Ensure the CHANGELOG.md is buyer-friendly, not just contributor-friendly.

---

### 2.33 Availability — Score: 73 | Weight: 1 | Weighted Deficiency: 27

**Justification:** Health probes, Docker Compose with restart policies, optional SQL failover group, Container Apps scaling, and documented RTO/RPO targets. The hosted SaaS probe monitors staging availability.

**Tradeoffs:** Single-region by default. Multi-region is optional Terraform configuration, not a product guarantee.

**Recommendations:** Ensure the staging probe alerts on degradation before customers notice.

---

### 2.34 Performance — Score: 68 | Weight: 1 | Weighted Deficiency: 32

**Justification:** k6 load tests (operator-path API smoke, per-tenant burst, soak test), named query p95 allowlist (`archlucid_query_p95_ms`), hot-path read cache (optional Redis), LLM completion response cache, and graph snapshot projection memory cache.

Gaps: (1) k6 results show baseline but no published performance targets or SLAs, (2) the 6000+ line SQL schema may have query performance hotspots not covered by the p95 allowlist, (3) LLM completion latency is externally constrained and not benchmarked against user expectations.

**Tradeoffs:** Performance optimization is premature before real load patterns exist. The infrastructure for measurement is in place.

**Recommendations:** Establish baseline p95 latency targets for the top 10 API routes and add them to the k6 configuration.

---

### 2.35 Scalability — Score: 66 | Weight: 1 | Weighted Deficiency: 34

**Justification:** Database-per-tenant model scales tenants independently. Container Apps horizontal scaling is configured. Hot-path cache supports Redis for multi-replica coherence. The LLM token quota system supports per-tenant budgets.

Gaps: (1) LLM budget trackers are per-process (INV-004 — multi-replica risk), (2) Redis is optional for V1, meaning single-replica is the default, (3) no published scaling limits (max tenants, max runs/tenant, max concurrent executions), (4) the graph snapshot projection cache is memory-only.

**Tradeoffs:** Scaling to tens of tenants with single-digit concurrent runs is likely fine. Scaling to hundreds of tenants with high concurrency requires the V2 Redis reinforcement and durable budget guardrails.

**Recommendations:** Document target scaling envelope (e.g., "V1 supports up to X tenants with Y concurrent runs per tenant") based on current architecture constraints.

---

### 2.36 Supportability — Score: 78 | Weight: 1 | Weighted Deficiency: 22

**Justification:** CLI doctor, support bundle, correlation IDs, version endpoint, troubleshooting guide, Tier 1 support runbook, build info response, and structured logging with sanitization. The support bundle next steps builder suggests intelligent diagnostic guidance.

**Tradeoffs:** Strong diagnostic tooling. The gap is operational experience with real support cases.

**Recommendations:** Validate the support bundle against 3-5 common failure scenarios to ensure diagnostic completeness.

---

### 2.37 Manageability — Score: 75 | Weight: 1 | Weighted Deficiency: 25

**Justification:** Configuration key catalog, operations admin documentation, Key Vault integration, startup validators, data consistency enforcement options, tenant lifecycle management (provisioning, hard purge), SCIM provisioning, and the operator UI admin surfaces.

**Tradeoffs:** Configuration surface is wide but documented. The risk is configuration drift between documentation and actual behavior.

**Recommendations:** Add a `GET /v1/admin/configuration-summary` endpoint that reports the effective non-secret configuration state for diagnostic purposes.

---

### 2.38 Deployability — Score: 77 | Weight: 1 | Weighted Deficiency: 23

**Justification:** Docker images, Docker Compose profiles (demo, real-AOAI), Terraform modules (12+ roots), Container Apps deployment, canary deployment runbook, CD workflows (staging-on-merge, SaaS greenfield), build-release scripts, package-release scripts, and environment readiness check scripts.

**Tradeoffs:** The deployment surface is comprehensive but the number of Terraform roots creates coordination complexity for operators.

**Recommendations:** Provide a single "reference deployment" script that applies the minimum viable set of Terraform roots for a new environment.

---

### 2.39 Observability — Score: 74 | Weight: 1 | Weighted Deficiency: 26

**Justification:** OpenTelemetry integration (Application Insights, OTLP, Prometheus), custom metrics (agent output quality, query p95, audit write failures, outbox depth, startup config warnings), tracing with configurable sampling, Prometheus alert rules in Terraform, Grafana dashboard Terraform, and the observability export readiness report script.

Gaps: (1) TB-004 (wire OTel exporters + verify agent output metrics) is still a backlog item — the metrics *emit* but exporter wiring is environment-specific, (2) no pre-built dashboards for operators (Terraform exists for Grafana but requires provisioning).

**Tradeoffs:** Emit-side instrumentation is solid. The gap is in "out of the box" operational visibility for operators who don't run their own Prometheus/Grafana.

**Recommendations:** Provide Application Insights workbook templates that operators can deploy with one click for immediate operational visibility.

---

### 2.40 Testability — Score: 80 | Weight: 1 | Weighted Deficiency: 20

**Justification:** 21 test projects, tiered CI (Tier 0 secret scan through Tier 3b live E2E), Stryker mutation testing, Schemathesis contract fuzz, k6 load testing, Simmy chaos injection, OpenAPI contract snapshots, architecture tests, golden cohort evaluation, eval corpus, and Playwright E2E (mock + live). Code coverage with ReportGenerator artifacts.

This is an exceptionally thorough testing infrastructure for any enterprise product.

**Tradeoffs:** The test surface creates CI runtime cost. The tiered model mitigates this well.

**Recommendations:** Publish the aggregate code coverage percentage as a badge. Confidence in test coverage is a buyer signal.

---

### 2.41 Modularity — Score: 82 | Weight: 1 | Weighted Deficiency: 18

**Justification:** Clear project boundaries (Contracts → Core → domain projects → Application → Persistence → Host.Composition → Api/Worker), interface-first design throughout, DI-based composition with single root (INV-006), finding engine plugin discovery, and the separation of agent runtime from application orchestration.

**Tradeoffs:** High modularity = many projects = higher navigation cost. The trade is correct for a product of this complexity.

**Recommendations:** No action needed. Modularity is a strength.

---

### 2.42 Extensibility — Score: 76 | Weight: 1 | Weighted Deficiency: 24

**Justification:** Finding engine plugin discovery, integration event schema catalog, webhook subscriber model, policy pack rule sets, and the template project for custom finding engines. The MCP membrane (V1.1) will add agent tool extensibility.

**Tradeoffs:** V1 extensibility is primarily configuration-driven (policy packs, alert rules, webhook subscribers). Custom finding engines require .NET development.

**Recommendations:** Document the finding engine extension API as a public surface with versioning guarantees.

---

### 2.43 Evolvability — Score: 75 | Weight: 1 | Weighted Deficiency: 25

**Justification:** ADR directory (35+ records), architecture invariant catalog, tech backlog with priority ordering, breaking changes document, V1 deferred inventory with explicit scope decisions, and the modular project structure that enables independent evolution.

**Tradeoffs:** The deferred scope inventory is unusually well-managed. The risk is that deferred items accumulate faster than delivery capacity.

**Recommendations:** Review the TECH_BACKLOG quarterly and re-prioritize based on actual customer feedback once pilots begin.

---

### 2.44 Documentation — Score: 83 | Weight: 1 | Weighted Deficiency: 17

**Justification:** 680+ markdown files covering architecture, operations, security, go-to-market, integrations, runbooks, ADRs, quality assessments, and contributor guidance. Five-document onboarding spine, buyer first-30-minutes, executive sponsor brief, architecture poster, operator atlas, and navigator. CI guards for documentation integrity (scope headers, link validation, root count budget).

This is the strongest documentation surface I've assessed for a product at this stage. The problem is volume, not quality.

**Tradeoffs:** Comprehensive documentation is an asset for long procurement cycles but a liability for time-to-evaluation.

**Recommendations:** Implement a documentation search capability in the operator UI or marketing site.

---

### 2.45 Azure Ecosystem Fit — Score: 79 | Weight: 1 | Weighted Deficiency: 21

**Justification:** Azure SQL, Azure OpenAI, Azure Key Vault, Azure Service Bus, Azure Container Apps, Azure Front Door, Azure APIM, Azure Blob Storage, Entra ID, Azure Monitor/App Insights, and managed identity. Terraform modules for all Azure services. Azure Marketplace SaaS offer (not yet published but wired).

**Tradeoffs:** Excellent Azure alignment. The trade is Azure-only, which is the stated strategy.

**Recommendations:** No action needed for V1. Azure fit is a strength.

---

### 2.46 Cost-Effectiveness — Score: 65 | Weight: 1 | Weighted Deficiency: 35

**Justification:** LLM cost estimator, per-tenant monthly/daily budget trackers, cost guardrail interceptor, agent model tier resolver (cost-tier routing), LLM completion caching (response reuse), and the Capabilities.Cost project. The pricing model is value-based with included run allowances.

Gaps: (1) LLM cost estimation options exist but the accuracy of cost projections has not been validated against actual Azure OpenAI billing, (2) budget trackers are per-process (multi-replica drift risk), (3) the TB-015 backlog item ("per-agent/per-invoke-kind LLM token dimensions") acknowledges that truthful token envelope data is needed for cost-preview, (4) COGS per run (LLM tokens + SQL + compute) is not published or tracked.

**Tradeoffs:** Cost controls exist but are not yet proven under real usage patterns. The risk is that actual COGS per run exceed the pricing model assumptions.

**Recommendations:** Instrument one full run cycle with actual Azure billing data to validate the cost model. Publish the result internally as the COGS baseline.

---

## 3. Weighted Readiness Calculation

| Category | Weighted Points | Max Possible | Category % |
|----------|----------------|--------------|------------|
| Commercial | 2,725 | 4,000 | 68.13% |
| Enterprise | 1,751 | 2,500 | 70.04% |
| Engineering | 3,606 | 5,000 | 72.12% |
| **Overall** | **8,082** | **11,500** | **70.28%** |

---

## 4. Top 12 Most Important Weaknesses

1. **AI output correctness is unproven under real LLM conditions.** The golden cohort gate was blocked on credentials. No automated CI tier validates that Azure OpenAI produces commercially useful architecture analysis through the quality gate pipeline. This is the product's existential risk — the entire value proposition depends on AI output quality that has only been tested against hand-crafted exemplar fixtures.

2. **No live commerce or self-serve purchase path.** Stripe is in TEST mode. The Marketplace offer is not published. The only revenue path is sales-led with manual order forms. This limits both validation velocity and scalability of the commercial motion.

3. **Excessive cognitive load for both buyers and operators.** 680+ docs, 50+ projects, a 6000-line SQL schema, and a configuration surface with dozens of keys. The product is optimized for completeness over accessibility. A sophisticated buyer may be impressed; a pragmatic buyer may be overwhelmed.

4. **LLM budget trackers are per-process, creating multi-replica cost overrun risk.** INV-004 acknowledges this. In a scaled deployment with multiple Container Apps replicas, tenant budget enforcement may be inconsistent, allowing cost overruns before reconciliation.

5. **ITSM connectors are validated against mocks, not real vendor APIs in CI.** Jira, ServiceNow, Confluence, and Slack integrations are "Shipped + manual vendor" — meaning automated tests use mocks. Until nightly CI validates against real vendor sandboxes, the "shipped" status is aspirational for interoperability claims.

6. **No customer-validated proof of ROI.** The ROI model projects $294K savings for a 6-architect team, but no real pilot has measured actual time savings. The sponsor evidence pack is a template, not evidence.

7. **Trial-to-paid conversion path is untested end-to-end in production.** The trial funnel test runs on staging in Stripe TEST mode. The production DNS cutover, real Stripe keys, and Marketplace publishing are all deferred. The commercialization path has multiple owner-only gates.

8. **Time-to-first-meaningful-insight is high.** The seven-step architecture request wizard and the requirement for either Azure Extractor upload or detailed manual input mean users invest significant effort before seeing any AI-generated value.

9. **Prompt injection defense is not validated against real model behavior.** CI has a "prompt-injection regression" gate but the depth of adversarial testing against real LLM completions (not fixtures) is unclear.

10. **Documentation is comprehensive but not navigable for decision-makers.** The five-document spine helps contributors but a buyer evaluating the trust center, pricing, and technical fit must navigate across multiple deep documents without a clear guided path.

11. **The rename from ArchiForge to ArchLucid is incomplete.** Legacy naming in SQL comments, some internal paths, and the Phase 7 rename checklist items (Terraform state mv, repo rename, Entra apps, workspace path) create surface-level inconsistency.

12. **Finding engine quality calibration against real-world architectures is undocumented.** The 10 finding engines (topology acceptance, security controls, policy coverage, etc.) are architecturally sound but their output quality against diverse real-world Azure architectures is not evidenced.

---

## 5. Top 6 Monetization Blockers

1. **Stripe TEST mode / no live commerce path.** Cannot accept payment. Sales-led order forms are the only path, which requires manual sales effort per deal.

2. **No reference customer or case study.** Buyers cannot see evidence of real-world value. The ROI model is theoretical. No testimonial, logo, or measured outcome exists.

3. **AI output quality unproven = risky purchase decision.** A buyer committing to the [published subscription bands in PRICING_PHILOSOPHY §5](docs/go-to-market/PRICING_PHILOSOPHY.md#5-locked-list-prices-2026) needs confidence the AI analysis is useful. Without a live demo with real model output, the purchase is faith-based.

4. **Self-serve trial funnel incomplete for production.** The staging trial works in TEST mode but the production path requires multiple owner-only actions (Stripe live keys, Marketplace publishing, DNS cutover). PLG motion is blocked.

5. **High friction to first "aha moment."** The time from signup to "I got a useful architecture finding" is too long. Quick scan or instant-value paths would lower the activation threshold.

6. **No expansion motion beyond seat adds.** V1 packaging has seat-based expansion and workspace adds, but no usage-based expansion trigger or automated upsell from Team to Professional. The stickiness-to-expansion conversion relies on manual sales.

---

## 6. Top 6 Enterprise Adoption Blockers

1. **No CPA SOC 2.** (Informational — not scored per deferred scope rules.) Enterprise procurement at mid-to-large organizations routinely requires SOC 2. The self-assessment and roadmap are honest but add 3-6 months to deal cycles for procurement teams that treat SOC 2 as a hard gate.

2. **No third-party security assessment.** (Informational — V2 deferred.) Security reviewers at F500 companies expect an independent pen-test summary under NDA. Owner-conducted testing, while genuine, does not satisfy this bar.

3. **ITSM integration not proven against real vendor APIs.** An enterprise that runs ServiceNow as their incident management system needs confidence that the bidirectional sync actually works against their ServiceNow instance, not a mock.

4. **Configuration complexity for enterprise deployment.** Deploying ArchLucid in an enterprise environment requires: Terraform for 12+ root modules, SQL Server provisioning, Entra ID app registration, Key Vault setup, Container Apps configuration, and network security (private endpoints, WAF). This is a significant implementation burden.

5. **No VPAT/ACR for accessibility compliance.** U.S. federal and many large enterprise procurement processes require VPAT. The product has accessibility testing in CI but no published compliance documentation.

6. **Data residency documentation is deployment-specific, not contractual.** The trust center describes region configurability but does not offer contractual data residency guarantees. Regulated industries need explicit contractual terms.

---

## 7. Top 6 Engineering Risks

1. **Real-LLM output quality under production conditions.** The entire product value chain depends on Azure OpenAI producing useful architecture analysis. If real model output is lower quality than the exemplar fixtures used in testing, the quality gate may reject outputs at a rate that makes the product unusable, or accept outputs that are commercially useless.

2. **Multi-replica LLM budget drift.** Per-process budget trackers (LlmMonthlyTenantDollarBudgetTracker, LlmDailyTenantBudgetTracker) can allow a tenant to exceed budget when running on multiple Container Apps replicas before the next SQL reconciliation. This is a direct cost exposure.

3. **6000+ line consolidated SQL schema maintenance risk.** While DbUp migrations and the MigrateVerify project mitigate this, the dual-maintenance between the consolidated DDL file and the incremental migration scripts creates a surface for drift. Schema changes must be applied in both places correctly.

4. **Tenant database provisioning at scale.** The database-per-tenant model with elastic pool warm catalogs (TB-018, backlog) means trial signups trigger DDL operations. Without the warm catalog pool, signup latency may be unacceptable for self-serve.

5. **Prompt injection and adversarial inputs.** The content safety guard and prompt redaction exist, but the defense depth against sophisticated prompt injection attacks (where user-supplied architecture descriptions contain adversarial prompts) is not clearly tested against real model behavior.

6. **Agent execution trace storage growth.** The AgentExecutionTraceRecorder persists LLM reasoning traces including full prompt/completion pairs. For high-volume tenants, this creates significant storage growth. The retention/purge strategy for trace data is not clearly defined.

---

## 8. Most Important Truth

**ArchLucid has built the infrastructure for an AI architecture review product but has not yet proven that the AI produces commercially valuable output.** The engineering is genuine and deep — this is not vaporware. But the critical gap is not test coverage, documentation, or enterprise compliance. It is the simple, uncomfortable question: when a real architect runs a real architecture through ArchLucid with a real Azure OpenAI model, does the output teach them something they didn't already know? Until that question has a documented, measured answer, the product is a sophisticated hypothesis.

---

## 9. Top Improvement Opportunities

**Implementation status (2026-05-10):** Item **2** (INV-004 durable LLM budgets) and items **11–18**, **20–23** are implemented in-repo; **19** is only partially addressed. **Status** lines under each improvement are updated accordingly. Executive scores in sections 1–8 are not recalculated here.

### Improvement 1: Run Real-LLM Golden Cohort Gate with Live Azure OpenAI

**Title:** Execute the golden cohort real-LLM gate against live Azure OpenAI and document results

**Why it matters:** The product's core value proposition — AI-generated architecture analysis — has only been validated against exemplar fixtures. One live execution cycle with documented metrics closes the most critical credibility gap.

**Expected impact:** Directly improves Correctness (+8-12 pts), AI/Agent Readiness (+5-8 pts), Trustworthiness (+3-5 pts). Weighted readiness impact: +1.2-2.0%.

**Affected qualities:** Correctness, AI/Agent Readiness, Trustworthiness, Proof-of-ROI Readiness, Marketability

**Status:** DEFERRED

**Reason:** Owner must enable **`vars.ARCHLUCID_GOLDEN_COHORT_REAL_LLM`**, set **`secrets.ARCHLUCID_GOLDEN_COHORT_API_HOST`**, and populate GitHub **secret** **`AZURE_OPENAI_API_KEY`** plus **variable** **`AZURE_OPENAI_ENDPOINT`** (see **CI wiring** below). Live cohort execution is still **owner-gated** until those are set and a run is observed green.

**Information needed:** Nothing further for deployment identity — use **`AZURE_OPENAI_API_KEY`** (GitHub secret) and **`AZURE_OPENAI_ENDPOINT`** (GitHub variable); never commit the key.

**Owner guidance (2026-05-10):** Use deployment name **`gpt-4o`**. Treat nightly real-LLM CI as capped at **`USD 5`** spend (cost budget for that tier; the budget probe’s **`monthlyTokenBudgetUsd`** in **`tests/golden-cohort/budget.config.json`** may still reflect the older **`$50`** Q15 cap — align in a dedicated change if you want Cost Management kill-switch to match **`$5`**). Endpoint for the dev/project-aligned gate: **`https://oai-archlucid-dev.services.ai.azure.com/api/projects/proj-default`** — set this as repository variable **`AZURE_OPENAI_ENDPOINT`**. **Branch protection:** real-LLM cohort path is **merge-blocking** once stable — require the relevant **`golden-cohort-nightly`** job(s) as status checks on **`main`** per **`docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`** §2 (coordinate **`cohort-real-llm-preflight`** / live invoke policy with nightly vs PR triggers).

**CI wiring (2026-05-10):** **`.github/workflows/golden-cohort-nightly.yml`**, job **`cohort-real-llm-live`**, step **Golden cohort drift (strict real + structural-only)**, passes **`secrets.AZURE_OPENAI_API_KEY`**, **`vars.AZURE_OPENAI_ENDPOINT`**, and **`AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o`** into the process environment. See **`docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`** §2.

---

### Improvement 2: Wire Durable LLM Budget Trackers for Multi-Replica Safety

**Title:** Replace per-process LLM budget trackers with SQL-backed durable trackers (INV-004)

**Why it matters:** Multi-replica Container Apps deployments allow tenants to exceed LLM budgets because each replica maintains an independent in-memory count. This is a direct cost exposure that grows with scale.

**Expected impact:** Directly improves Cost-Effectiveness (+8-10 pts), Reliability (+3-5 pts), Scalability (+3-5 pts), Data Consistency (+3-5 pts). Weighted readiness impact: +0.4-0.7%.

**Affected qualities:** Cost-Effectiveness, Reliability, Scalability, Data Consistency, AI/Agent Readiness

**Status:** COMPLETED (2026-05-10) — **`LlmMonthlyTenantDollarBudgetTracker`** / **`LlmDailyTenantBudgetTracker`** use **`ILlmTenantBudgetRepository`** with **`SqlLlmTenantBudgetRepository`** (optimistic concurrency, pre-call **`ReserveAsync`** / post-call **`SettleAsync`**) on **`dbo.LlmMonthlyTenantBudgetState`** and **`dbo.LlmDailyTenantTokenWindowState`** (not the prompt’s single `TenantLlmBudgetLedger` table name). DbUp **`154_LlmBudgetPreCallReservation.sql`**; concurrency coverage in **`SqlLlmTenantBudgetRepositoryConcurrencyIntegrationTests`**.

**Product guidance (2026-05-10):** Budget enforcement may exceed the nominal cap by **at most roughly one LLM call** (assumed reservation vs actual settlement). **Strict zero overshoot is not required.** If **budget reservation** fails because **SQL is unavailable**, **allow the LLM call** and **log a warning** (fail-open on the guardrail path rather than blocking tenants during a DB incident).
```
In the ArchLucid codebase, replace the per-process LLM budget trackers with SQL-backed durable trackers to close INV-004 (durable cost guardrails).

Scope:
- Modify `ArchLucid.AgentRuntime/LlmMonthlyTenantDollarBudgetTracker.cs` and `ArchLucid.AgentRuntime/LlmDailyTenantBudgetTracker.cs` to use a SQL-backed reservation/settlement pattern instead of in-memory tracking.
- Add a new persistence method in `ArchLucid.Persistence` for atomic budget reservation (pre-call) and settlement (post-call) using optimistic concurrency on a `dbo.TenantLlmBudgetLedger` table.
- Add the DDL for `dbo.TenantLlmBudgetLedger` to `ArchLucid.Persistence/Scripts/ArchLucid.sql` (idempotent CREATE IF NOT EXISTS) AND as a new DbUp migration in `ArchLucid.Persistence/Migrations/`.
- The table should have columns: TenantId, BudgetWindowStart (UTC), BudgetWindowEnd (UTC), ReservedTokenCost (DECIMAL), SettledTokenCost (DECIMAL), RowVersion (for optimistic concurrency).
- The reservation should use `UPDATE ... SET ReservedTokenCost = ReservedTokenCost + @amount ... WHERE RowVersion = @expectedVersion` pattern with retry on concurrency conflict.
- Settlement should update SettledTokenCost with actual observed cost after the LLM call completes.
- Budget check should compare ReservedTokenCost against the configured limit (LlmMonthlyTenantDollarBudget / LlmDailyTenantDollarBudget).
- Keep the existing in-memory fast-path as a read cache that is periodically refreshed from SQL (e.g., every 30 seconds or on cache miss) — the SQL row is authoritative.
- Add unit tests in `ArchLucid.AgentRuntime.Tests` for the reservation/settlement logic.
- Add a SQL integration test in `ArchLucid.Persistence.Tests` that verifies two concurrent reservations against the same budget window produce consistent results (simulating two replicas).

Constraints:
- Use Dapper for all SQL access (no EF Core).
- Follow existing repository patterns in `ArchLucid.Persistence/Data/Repositories/`.
- Do not change the `IOptions<>` configuration surface — budget limits stay in configuration.
- Do not change the CostGuardrailInterceptor interface — it should continue to call the budget tracker transparently.
- All new classes must be in their own files per workspace rules.
- Include null checks on all public method parameters.
- Follow existing blank line conventions (one blank line before if/foreach unless first line of method).

Acceptance criteria:
- Two Container Apps replicas sharing one SQL database cannot jointly exceed a tenant's monthly budget by more than the cost of one LLM call (the reservation granularity).
- Budget enforcement works correctly with a single replica (regression).
- The migration is idempotent and the consolidated DDL includes the new table.
- All new code has unit test coverage.

Do not change:
- The configuration key names or structure.
- The CostGuardrailInterceptor public API.
- The quality gate evaluation pipeline.
- Any UI code.
```

---

### Improvement 3: Add Quick Scan Path for Instant Time-to-Value

**Title:** Implement a quick scan endpoint that produces preliminary findings from minimal input

**Why it matters:** The current architecture request wizard requires seven steps before a user sees any AI-generated output. A quick scan path that accepts system name + cloud provider + brief description and returns preliminary findings in under 2 minutes dramatically reduces time-to-value and adoption friction.

**Expected impact:** Directly improves Time-to-Value (+6-8 pts), Adoption Friction (+5-7 pts), Decision Velocity (+5-8 pts), Marketability (+3-5 pts). Weighted readiness impact: +0.8-1.3%.

**Affected qualities:** Time-to-Value, Adoption Friction, Decision Velocity, Marketability, Usability

**Status:** COMPLETED (2026-05-10) — **`POST /v1/architecture/quick-scan`** (`ArchitectureQuickScanController`); minimal request/response DTOs in **`ArchLucid.Contracts`**; **`QuickScanMinimalContextBuilder`** + **`ArchitectureQuickScanResponseMapper`** in **`ArchLucid.Application`**; **`QuickScanService`** prompt aligned to **`FindingSeverity`** with optional **`confidenceScore`** / **`confidenceLevel`**; simulator **`FakeAgentCompletionClient`** routes on **`QuickScanLlmPrompts.ClientRoutingMarker`** to **`FakeQuickScanCompletionJson`**; **`IQuickScanService`** registered in **`ArchLucid.Host.Composition`**; integration test **`ArchitectureQuickScanIntegrationTests`**; OpenAPI snapshot + **`ArchLucid.Api.Client`** + **`archlucid-ui`** `api-types` regenerated. Real completions follow existing host **`AgentExecution:Mode`** + Azure OpenAI config (same pipeline as other LLM calls). Unrelated compile fix: **`ProvenanceCompletenessAnalyzer.CoalesceEmpty`**.

**Cursor prompt:**
```
In the ArchLucid codebase, the QuickScan service already exists at `ArchLucid.AgentRuntime/QuickScan/QuickScanService.cs`. Verify its current state, and then ensure the following end-to-end path works:

1. Read `ArchLucid.AgentRuntime/QuickScan/QuickScanService.cs` and any related files to understand the current quick scan implementation.
2. Verify that `POST /v1/architecture/quick-scan` exists in the API controllers. If not, create it in `ArchLucid.Api/Controllers/Authority/` following existing controller patterns.
3. The endpoint should accept a minimal request: `{ "systemName": "string", "cloudProvider": "Azure", "description": "string" }` — no seven-step wizard fields required.
4. The response should return a lightweight finding set (top 5 findings by severity) with finding titles, descriptions, severities, and confidence levels.
5. The endpoint should use simulator mode by default (so it works without Azure OpenAI credentials) and real mode when `ARCHLUCID_REAL_AOAI=1` is set.
6. Add an API test in `ArchLucid.Api.Tests` that validates the endpoint returns findings for a minimal request.
7. If the OpenAPI snapshot changes, regenerate it per the Http-Surface-Docs-And-Clients rule.

Constraints:
- Reuse existing `QuickScanService` and `QuickScanResult` types — do not duplicate.
- Follow existing controller patterns (auth, scoping, audit, error handling).
- The endpoint should be accessible to the Reader role (read-only operation).
- Response time target: under 5 seconds in simulator mode.
- Do not modify the existing architecture request or run lifecycle.
- All new files must follow one-class-per-file rule.

Acceptance criteria:
- `POST /v1/architecture/quick-scan` returns 200 with findings for a minimal 3-field request.
- Existing API tests pass.
- OpenAPI snapshot is updated if the contract changed.

Do not change:
- The existing run lifecycle (request → execute → commit).
- The architecture request wizard or its API surface.
- The quality gate evaluation pipeline.
```

---

### Improvement 4: Stand Up One Live ITSM Vendor Sandbox in Nightly CI

**Title:** Add Jira Cloud nightly validation against a real vendor sandbox

**Why it matters:** All ITSM connectors are validated against mocks only. One live vendor validation proves ongoing compatibility and converts the "Shipped + manual vendor" status to "Shipped + CI-validated."

**Expected impact:** Directly improves Workflow Embeddedness (+5-8 pts), Interoperability (+4-6 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: +0.3-0.5%.

**Affected qualities:** Workflow Embeddedness, Interoperability, Trustworthiness, Procurement Readiness

**Status:** DEFERRED

**Reason:** Requires provisioning a Jira Cloud free-tier project and storing credentials as GitHub Actions secrets. Cannot be executed without a Jira Cloud account and GitHub Actions secret configuration.

**Information needed:** (Deferred) Jira Cloud **site/project** for nightly validation; GitHub Actions **secret** strategy (dedicated Atlassian user vs owner); Atlassian account ownership. Revisit when sandbox work is scheduled.

**Owner guidance (2026-05-10):** **Deferred** — no Jira Cloud sandbox project or CI credential decision yet.

---

### Improvement 5: Reduce Documentation Cognitive Load with Contextual Help

**Title:** Add in-product contextual help links in the operator UI

**Why it matters:** 680+ docs creates navigation friction. Contextual links from UI surfaces to the relevant documentation section reduce time-to-answer and make the documentation volume an asset rather than a barrier.

**Expected impact:** Directly improves Cognitive Load (+8-12 pts), Usability (+4-6 pts), Customer Self-Sufficiency (+5-8 pts), Adoption Friction (+3-5 pts). Weighted readiness impact: +0.3-0.5%.

**Affected qualities:** Cognitive Load, Usability, Customer Self-Sufficiency, Adoption Friction, Time-to-Value

**Status:** COMPLETED (2026-05-10) — **`archlucid-ui/src/lib/contextual-help.ts`** (`getHelpUrl`, `listContextualHelpDocPaths`, minimum route map incl. `/audit`, `/alerts`, `/graph`); **`HelpButton`** in **`archlucid-ui/src/components/ui/help-button.tsx`** (lucide **`HelpCircle`**, Radix tooltip “View documentation”, new tab); base URL via existing **`getDocHref`** / **`NEXT_PUBLIC_DOCS_BASE_URL`**; wired through **`OperatorPageHeader`** (**`docsPageKey`**) on reviews list (**`/runs`** key), **`/compare`**, **`/governance`**, plus **`RunDetailPageHeader`** (**`/runs/[id]`**). Vitest **`contextual-help.test.ts`** asserts URLs and repo doc paths exist.

**Cursor prompt:**
```
In the `archlucid-ui` Next.js application, add a contextual help system that links operator UI pages to relevant documentation.

1. Create a new utility file `archlucid-ui/src/lib/contextual-help.ts` that exports a `getHelpUrl(pageKey: string): string | null` function mapping operator UI route segments to documentation URLs.
2. Map at minimum these pages:
   - `/runs` → `/docs/library/OPERATOR_QUICKSTART.md` section on runs
   - `/runs/[id]` → `/docs/library/operator-shell.md` section on run detail
   - `/compare` → `/docs/library/COMPARISON_REPLAY.md`
   - `/governance` → `/docs/library/PRE_COMMIT_GOVERNANCE_GATE.md`
   - `/audit` → `/docs/library/AUDIT_COVERAGE_MATRIX.md`
   - `/alerts` → `/docs/library/ALERTS.md`
   - `/graph` → `/docs/library/KNOWLEDGE_GRAPH.md`
3. Create a small `HelpButton` component in `archlucid-ui/src/components/ui/help-button.tsx` that renders a `?` icon (from lucide-react `HelpCircle`) with a tooltip showing "View documentation" and opens the help URL in a new tab.
4. The help URL base should be configurable via environment variable `NEXT_PUBLIC_DOCS_BASE_URL` defaulting to `https://github.com/joefrancisGA/ArchLucid/blob/main/`.
5. Add the `HelpButton` to the page header area on at least the runs list, run detail, compare, and governance pages. Look at the existing layout patterns and add it in the page header alongside existing action buttons.
6. Add a Vitest test that validates all mapped help URLs resolve to valid documentation file paths relative to the repo root.

Constraints:
- Use existing UI component patterns (Radix UI, Tailwind, lucide-react).
- Keep the help button subtle — it should not compete with primary actions.
- Do not modify the navigation structure or sidebar.
- Follow existing TypeScript patterns in the codebase.

Acceptance criteria:
- A `?` icon appears on at least 4 operator UI pages.
- Clicking it opens the correct documentation page in a new tab.
- Vitest test passes validating the URL mappings.
- Existing UI tests pass.

Do not change:
- Navigation structure or sidebar configuration.
- API routes or backend code.
- Existing page layouts beyond adding the help button.
```

---

### Improvement 6: Create VPAT/ACR Draft from Existing Accessibility Test Results

**Title:** Generate a VPAT 2.4 / ACR draft from existing axe test results

**Why it matters:** U.S. federal and many large enterprise procurement processes require VPAT. The product already has accessibility testing in CI — converting those results into a procurement artifact is low effort, high credibility.

**Expected impact:** Directly improves Procurement Readiness (+4-6 pts), Accessibility (+3-5 pts), Compliance Readiness (+2-3 pts). Weighted readiness impact: +0.2-0.3%.

**Affected qualities:** Procurement Readiness, Accessibility, Compliance Readiness

**Status:** COMPLETED (2026-05-10) — **`docs/security/VPAT_2_4_WCAG_2_1_DRAFT.md`** (VPAT® 2.4 Rev–style ACR draft; WCAG 2.1 Levels A/AA; Doc-Scope-Header; Trust Center link in **`docs/go-to-market/TRUST_CENTER.md`** *Compliance and certifications* table). No code or test file changes per acceptance constraints.

**Cursor prompt:**
```
Create a VPAT 2.4 Rev (WCAG 2.1 edition) draft document for ArchLucid at `docs/security/VPAT_2_4_WCAG_2_1_DRAFT.md`.

1. Use the ITI VPAT 2.4 Rev template structure (available at https://www.itic.org/policy/accessibility/vpat).
2. For the product information section, use:
   - Product: ArchLucid Operator UI (web application)
   - Version: V1
   - Contact: security@archlucid.net
   - Date: 2026-05-10
   - Description: Web-based architecture review and governance platform
3. For each WCAG 2.1 Level A and AA success criterion:
   - If the criterion is testable by axe-core (which the product uses in CI), mark it as "Supports" with a remark noting "Validated by automated axe-core testing in CI (jest-axe component tests + Playwright axe integration)."
   - If the criterion requires manual testing (e.g., 1.1.1 Non-text Content for complex images, 1.2.x Time-based Media, 2.1.1 Keyboard for custom interactions), mark it as "Not Evaluated" with a remark "Manual evaluation pending."
   - If a known gap exists based on common SPA patterns (e.g., focus management on route transitions), mark it as "Partially Supports" with an honest remark.
4. Add the standard VPAT disclaimer: "This document is provided for informational purposes and reflects the current state of automated accessibility testing. Manual evaluation of criteria marked 'Not Evaluated' is recommended."
5. Add a scope header per the Doc-Scope-Header rule.
6. Add a link to this document from `docs/go-to-market/TRUST_CENTER.md` in the compliance/assurance table.

Constraints:
- Be honest — do not claim "Supports" for criteria that require manual testing.
- Follow the docs markdown conventions.
- Do not modify any code or test files.
- Keep it under 300 lines.

Acceptance criteria:
- A valid VPAT 2.4 structure exists at the specified path.
- All Level A and AA criteria are listed with honest conformance levels.
- Trust center links to the new document.

Do not change:
- Any code files.
- Any existing documentation content (only add the link in trust center).
```

---

### Improvement 7: Implement INV-005 Startup Validator Catalog Parity (TB-010 Remainder)

**Title:** Extend startup validation to enforce production fail-closed for all documented safety rules

**Why it matters:** INV-005 requires that Staging/Production hosts fail fast when developer-only auth or missing secret dispositions are detected. Partial enforcement means a misconfigured production deployment could silently accept DevelopmentBypass auth.

**Expected impact:** Directly improves Security (+4-6 pts), Reliability (+3-5 pts), Correctness (+2-3 pts). Weighted readiness impact: +0.3-0.5%.

**Affected qualities:** Security, Reliability, Correctness, Trustworthiness, Manageability

**Status:** Actionable now

**Product guidance (2026-05-10):** **No** dedicated **“allowed in production with warning only”** catalog for **V1** — unsafe **Required** / **Conditional** disposition in Production/Staging stays **hard-fail**; optional keys need no validator. **No** break-glass keys exempt from validation by default. If a real break-glass scenario appears later, add an explicit **`ARCHLUCID_BREAK_GLASS_*`** (or equivalent) path **via ADR**, with logging/audit — not an informal warn tier.

**Cursor prompt:**
```
In the ArchLucid codebase, extend the startup validation system to achieve INV-005 catalog parity (TB-010 remainder).

1. Read `ArchLucid.Host.Core/Startup/Validation/` (or equivalent path) to understand the current `IStartupValidator` pattern and `StartupValidatorTests`.
2. Read `ArchLucid.Core/Configuration/ConfigurationKeyCatalog.cs` to understand the full configuration surface.
3. Identify any configuration keys marked as "development-only" or "bypass" that are NOT currently checked by a startup validator under Production/Staging environments.
4. For each gap, add a new `IStartupValidator` implementation that:
   - Fails startup (throws or returns failure) when the development-only key is configured AND `ASPNETCORE_ENVIRONMENT` is `Production` or `Staging`.
   - Allows startup when the key is absent or when the environment is `Development`.
5. Add corresponding tests in the existing `StartupValidatorTests` file (or create a new test file if the existing one is too large) that verify:
   - Production + development-only key = startup failure.
   - Development + development-only key = startup success.
   - Production + no development-only key = startup success.
6. Add a CI test that compares the set of `ConfigurationKeyCatalog` keys flagged as development-only against the set of keys checked by startup validators, failing if any are uncovered. This implements the "diff ConfigurationKeyCatalog vs validator registry" enforcement sketch from INV-005.

Constraints:
- Follow existing `IStartupValidator` patterns exactly.
- Do not change the validation behavior for keys that already have validators.
- Use the existing test infrastructure (xUnit, FluentAssertions or equivalent).
- Each new validator in its own file per workspace rules.
- Do not add ConfigureAwait(false) in tests.

Acceptance criteria:
- Every development-only configuration key in the catalog has a corresponding startup validator.
- A CI test enforces catalog-to-validator parity.
- All existing startup validation tests pass.
- No new linter errors.

Do not change:
- The configuration key catalog itself.
- The existing startup validation infrastructure.
- Any API routes or controllers.
```

---

### Improvement 8: Publish Code Coverage Badge and Gate

**Title:** Add aggregate code coverage badge to README and establish a coverage floor

**Why it matters:** Test coverage visibility builds buyer and contributor confidence. A published badge demonstrates the testing investment is real, not claimed.

**Expected impact:** Directly improves Testability (+3-5 pts), Trustworthiness (+2-3 pts), Marketability (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

**Affected qualities:** Testability, Trustworthiness, Marketability, Supportability

**Status:** Actionable now

**Cursor prompt:**
```
In the ArchLucid CI workflow (`.github/workflows/ci.yml`), add a code coverage badge to the README.

1. Read the existing `ci.yml` to find the coverage merge step (`dotnet-coverage-merge` or equivalent).
2. Determine the current aggregate line coverage percentage from the merged Cobertura report.
3. Add a step after coverage merge that generates a badge SVG (use `shields.io` dynamic badge or `coverage-badge-creator` action) based on the line coverage percentage.
4. Upload the badge as a workflow artifact AND push it to a `gh-pages` branch badge path (e.g., `badges/coverage.svg`) if the workflow runs on `main`.
5. Add the badge to `README.md` next to the existing hosted SaaS probe badge, using the format: `[![Coverage](badge-url)](link-to-coverage-report)`.
6. Add a coverage floor assertion step that fails CI if aggregate line coverage drops below the current level minus 2% (ratchet mechanism — coverage can only go up or stay within 2% of the high water mark).

Constraints:
- Only generate badges on `main` branch pushes (not PRs).
- The coverage floor should be stored in a file (e.g., `.coverage-floor`) so it can be updated explicitly.
- Follow the Code-Coverage-Product-Only rule — exclude test assemblies and TestSupport from the coverage calculation.
- Do not modify the test execution or collection steps.

Acceptance criteria:
- README.md displays a coverage percentage badge.
- CI fails if coverage drops more than 2% from the recorded floor.
- Badge is updated on every main branch push.

Do not change:
- Test execution order or configuration.
- Coverage collection settings (coverage.runsettings).
- The README structure beyond adding the badge.
```

---

### Improvement 9: Create a One-Page Buyer Decision Tree

**Title:** Create a concise buyer evaluation decision tree document

**Why it matters:** The documentation density creates analysis paralysis for buyers. A one-page decision tree that answers "Is ArchLucid right for me?" and routes to a 15-minute evaluation path reduces decision velocity friction.

**Expected impact:** Directly improves Decision Velocity (+6-10 pts), Adoption Friction (+3-5 pts), Marketability (+2-4 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Decision Velocity, Adoption Friction, Marketability, Time-to-Value

**Status:** Actionable now

**Cursor prompt:**
```
Create a concise buyer evaluation decision tree at `docs/SHOULD_YOU_EVALUATE.md`.

1. Add a scope header per the Doc-Scope-Header rule: `> **Scope:** One-page buyer routing — answers "Is ArchLucid right for me?" in under 2 minutes; not a substitute for the executive sponsor brief or pilot guide.`
2. Structure as a decision tree with 4-5 yes/no questions:
   - Q1: "Does your team produce architecture review packages for stakeholders?" (No → "ArchLucid may not be a fit today. See `docs/go-to-market/NOT_A_FIT.md`.")
   - Q2: "Do you run workloads on Azure (or plan to within 6 months)?" (No → "ArchLucid V1 targets Azure workloads. Contact us for multi-cloud roadmap.")
   - Q3: "Do you spend 20+ hours per architecture review cycle?" (No → "You may still benefit from governance and compliance features. Start with a quick scan." Yes → "Strong fit — proceed to evaluation.")
   - Q4: "Do you need governance, audit trails, or compliance evidence from architecture reviews?" (Yes → "Start with the Operate layer evaluation." No → "Start with the Pilot layer — request → commit → review.")
3. After the decision tree, provide a "15-minute evaluation path":
   - If hosted SaaS: signup at archlucid.net → quick scan → review findings → commit manifest (15 min target)
   - If self-hosted: `dotnet run --project ArchLucid.Cli -- try` → review output → decide (15 min target)
4. End with links: Executive Sponsor Brief, Pricing, Trust Center, Core Pilot guide.
5. Keep under 80 lines total. No tables, no deep links, no qualification caveats. Direct and opinionated.

Constraints:
- Do not exceed the docs root markdown count budget (32 files). Check first whether this pushes past the limit; if so, place it at `docs/library/SHOULD_YOU_EVALUATE.md` and add a one-line link from `docs/START_HERE.md`.
- Be honest in the "not a fit" routing.
- Do not reference prior assessments.
- Do not make claims about AI output quality that aren't backed by evidence.

Acceptance criteria:
- Document exists and is under 80 lines.
- Decision tree has 4-5 questions with clear routing.
- 15-minute evaluation path is described.
- Scope header passes CI check.

Do not change:
- Any existing documentation files (only add links where specified).
- Any code files.
```

---

### Improvement 10: Establish Baseline p95 Latency Targets for Top API Routes

**Title:** Define and enforce p95 latency targets for the 10 highest-traffic API routes

**Why it matters:** Performance targets without measurement are aspirational. Establishing p95 baselines from k6 results and enforcing them in CI prevents performance regressions and provides buyers with concrete performance commitments.

**Expected impact:** Directly improves Performance (+6-8 pts), Reliability (+2-3 pts), Supportability (+2-3 pts). Weighted readiness impact: +0.1-0.2%.

**Affected qualities:** Performance, Reliability, Supportability, Manageability

**Status:** Actionable now

**Cursor prompt:**
```
In the ArchLucid codebase, establish p95 latency targets for the top 10 API routes and enforce them in k6.

1. Read `ArchLucid.Core/Configuration/` for the existing named-query p95 allowlist pattern (`archlucid_query_p95_ms` per TB-003).
2. Read the existing k6 test scripts (likely under `k6/` or `scripts/k6/` or referenced in `ci.yml`).
3. Read `k6-summary.json` at the repo root to understand the current baseline performance data.
4. For the 10 most common API routes (at minimum: GET /health/live, GET /health/ready, GET /v1/architecture/runs, GET /v1/architecture/run/{runId}, POST /v1/architecture/request, POST /v1/architecture/run/{runId}/commit, GET /v1/audit, GET /v1/audit/search, GET /v1/governance/dashboard, GET /version):
   - Extract the current p95 latency from k6-summary.json or the existing k6 threshold configuration.
   - Set a p95 threshold at 120% of the current baseline (20% headroom to avoid flaky failures).
   - Add these thresholds to the k6 configuration as enforced `thresholds`.
5. Document the targets in a new `docs/library/API_PERFORMANCE_TARGETS.md` with the scope header, route list, target values, measurement methodology, and last-measured date.
6. Ensure the k6 CI step fails if any threshold is exceeded.

Constraints:
- Only add thresholds for routes that already have k6 coverage.
- Do not modify the k6 test scenarios — only add threshold enforcement.
- Use the existing k6 configuration patterns.
- Targets should be realistic (based on actual measurements, not aspirational).

Acceptance criteria:
- 10 API routes have enforced p95 latency thresholds in k6 configuration.
- Documentation lists the targets with measurement methodology.
- k6 CI step fails if thresholds are exceeded.

Do not change:
- The k6 test scenarios or request patterns.
- Any API route implementations.
- Any configuration or startup code.
```

---

### Improvement 11: INV-006 Composition Root Architecture Test (TB-010 Remainder)

**Title:** Complete the single-composition-root architecture test to cover all product assemblies

**Why it matters:** INV-006 requires that production DI registration is owned by `ArchLucid.Host.Composition` only. The existing `SingleCompositionRootServiceCollectionExtensionsTests` scans a defined set of product assemblies, but the scanned set may not cover every product assembly. A gap means a domain project could silently add `IServiceCollection` extensions that bypass the composition root.

**Expected impact:** Directly improves Architectural Integrity (+2-3 pts), Maintainability (+1-2 pts), Security (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

**Affected qualities:** Architectural Integrity, Maintainability, Security, Testability

**Status:** COMPLETED (2026-05-10) — composition-root list extended (incl. Contracts, Capabilities.Cost, Integrations.AzureDevOps); bin-output DLL coverage test added. See `ArchLucid.Architecture.Tests/SingleCompositionRoot*`.

**Cursor prompt:**
```
In the ArchLucid codebase, extend the INV-006 composition root architecture test to cover all product assemblies.

1. Read `ArchLucid.Architecture.Tests/SingleCompositionRootArchitectureTestConstants.cs` to see the current `CompositionRootScannedProductAssemblyNames` list.
2. Read `ArchLucid.Architecture.Tests/SingleCompositionRootServiceCollectionExtensionsTests.cs` to understand the existing scan logic.
3. Compare the list of product assemblies in the constants file against the actual set of `ArchLucid.*` project references (excluding `*.Tests`, `ArchLucid.TestSupport`, `ArchLucid.Analyzers`, `ArchLucid.Benchmarks`). Find any product assemblies not currently scanned.
4. Add missing product assemblies to the constants and ensure an anchor type from each is loaded in `ResolveCompositionRootScannedProductAnchors()`.
5. Add a new test that programmatically discovers all `ArchLucid.*` assemblies in the test's output directory (excluding test/analyzer/benchmark assemblies) and asserts that every one is present in the scanned set — so that new product projects automatically fail CI if they're not added to the scan.

Constraints:
- Follow the existing pattern in the architecture test file exactly.
- Do not add allow-list entries for IServiceCollection extensions — only extend the scan coverage.
- If a product assembly legitimately needs an IServiceCollection extension (e.g., `ArchLucid.Host.Composition` itself), document the allow-list entry in the constants file.
- Do not modify any product assembly code.

Acceptance criteria:
- All product assemblies (non-test, non-analyzer, non-benchmark) are scanned for IServiceCollection extension violations.
- A new project added without updating the constants file causes a test failure.
- All existing tests pass.

Do not change:
- The existing allow-list for `ArchLucid.Host.Composition`.
- Any product assembly source code.
- The test infrastructure beyond the architecture test files.
```

---

### Improvement 12: Agent Execution Trace Retention Policy and Automated Purge

**Title:** Implement configurable retention and automated purge for agent execution traces

**Why it matters:** The `AgentExecutionTraceRecorder` persists full LLM prompt/completion pairs for every agent invocation. For high-volume tenants, this creates significant and unbounded storage growth. Without automated retention, the trace table grows indefinitely, increasing SQL costs and backup sizes.

**Expected impact:** Directly improves Cost-Effectiveness (+4-6 pts), Manageability (+3-4 pts), Scalability (+2-3 pts). Weighted readiness impact: +0.1-0.3%.

**Affected qualities:** Cost-Effectiveness, Manageability, Scalability, Reliability, Data Consistency

**Status:** COMPLETED (2026-05-10) — implemented as optional **`DataArchival:PurgeArchivedAgentExecutionTracesAfterDays`** / **`PurgeArchivedAgentExecutionTracesBatchSize`** during **`DataArchivalCoordinator`** (hard-delete SQL rows with `ArchivedUtc` before cutoff). Does **not** match the prompt’s separate `AgentExecutionTrace:RetentionDays` worker job / `Maintenance.TracesPurged` audit event.

**Product guidance (2026-05-10):** Retention / purge policy should be **per-tenant** configurable on the roadmap (buyer/regulator variance). **Current shipping slice** is **deployment-global** `DataArchival:*` only — **per-tenant overrides** are a **documented gap** until modeled (e.g., tenant settings + purge keyed by `TenantId`). **Minimum retention (owner):** treat **three calendar months** as the **floor** before trace data may be purged (hard-delete); **`PurgeArchivedAgentExecutionTracesAfterDays`** (when enabled) must be **≥ ~90 days** in regulated-style deployments unless legal approves shorter — product should enforce floor when per-tenant rules land.
```
In the ArchLucid codebase, implement a configurable retention policy and automated purge for agent execution traces.

1. Read `ArchLucid.AgentRuntime/AgentExecutionTraceRecorder.cs` and `ArchLucid.AgentRuntime/IAgentExecutionTraceRecorder.cs` to understand the trace persistence model.
2. Search for the trace storage table in `ArchLucid.Persistence/Scripts/ArchLucid.sql` (likely `dbo.AgentExecutionTraces` or similar).
3. Add a new configuration option `AgentExecutionTrace:RetentionDays` (default: 90) in `ArchLucid.Core/Configuration/` following existing options patterns. Add to `ConfigurationKeyCatalog`.
4. Create a new background job in `ArchLucid.Application/Jobs/` named `AgentExecutionTracePurgeJob` that:
   - Reads the retention window from configuration.
   - Deletes trace rows older than the retention window in batches (e.g., 1000 rows per batch with a brief delay between batches to avoid blocking).
   - Emits an audit event of type `Maintenance.TracesPurged` with the count of deleted rows.
   - Logs the purge result at Information level.
5. Register the job in the Worker's background job catalog so it runs on a configurable schedule (default: daily at 02:00 UTC).
6. Add unit tests for the purge logic (batch size, retention calculation, audit event emission).
7. Add the configuration key to `docs/library/CONFIGURATION_REFERENCE.md` if it exists.

Constraints:
- Use Dapper for the DELETE operation.
- Batch deletes to avoid long-running transactions (DELETE TOP 1000 pattern).
- The purge must be tenant-aware — only delete traces within the tenant context or use a system-level maintenance path with explicit documentation.
- Do not delete traces for runs that are in an active (non-terminal) state.
- Follow existing background job patterns in `ArchLucid.Application/Jobs/`.
- Each new class in its own file.

Acceptance criteria:
- Traces older than `RetentionDays` are automatically deleted by the background job.
- Purge operates in batches to avoid SQL blocking.
- An audit event records each purge execution.
- Configuration defaults to 90 days.
- Unit tests cover retention calculation and batch logic.

Do not change:
- The trace recording path (writes remain unchanged).
- The existing background job infrastructure.
- Any API routes or controllers.
```

---

### Improvement 13: Operator UI Onboarding Guided Tour

**Title:** Add a first-visit guided tour overlay to the operator UI

**Why it matters:** The operator UI has many surfaces behind progressive disclosure (Show more links, extended/advanced sidebar). New users may not discover key capabilities, reducing perceived value and increasing time-to-proficiency.

**Expected impact:** Directly improves Usability (+5-7 pts), Adoption Friction (+3-5 pts), Time-to-Value (+2-3 pts), Customer Self-Sufficiency (+3-5 pts). Weighted readiness impact: +0.3-0.5%.

**Affected qualities:** Usability, Adoption Friction, Time-to-Value, Customer Self-Sufficiency, Cognitive Load

**Status:** COMPLETED (2026-05-10) — existing operator **`OnboardingTour`** (`archlucid-ui/src/components/OnboardingTour.tsx`) wired in **`AppShellClient`**; aligns with guided-tour intent (paths differ from prompt file names).

**Cursor prompt:**
```
In the `archlucid-ui` Next.js application, implement a lightweight first-visit guided tour.

1. Create `archlucid-ui/src/components/onboarding/guided-tour.tsx` — a component that renders a sequence of tooltip-style overlays highlighting key UI areas.
2. The tour should have 5 steps:
   - Step 1: "Create your first run" — highlight the "New Run" / request creation button on the home page.
   - Step 2: "Monitor execution" — highlight the pipeline timeline area on a run detail page (show on the runs list if no run exists).
   - Step 3: "Review your manifest" — highlight the Artifacts section.
   - Step 4: "Go deeper" — highlight the "Show more links" sidebar toggle.
   - Step 5: "Get help" — highlight the help button (if Improvement 5 is implemented) or point to the docs link.
3. Use a simple overlay approach: a semi-transparent backdrop with a highlighted cutout around the target element, plus a floating card with title, description, and Next/Skip buttons.
4. Track tour completion in `localStorage` under key `archlucid-tour-completed`. Only show the tour on first visit (when the key is absent).
5. Add a "Restart tour" option in the user menu or settings area.
6. Style using existing Tailwind classes and Radix UI primitives (Dialog for the overlay, Tooltip-like positioning).
7. Add a Vitest test that verifies the tour renders on first visit and does not render when localStorage has the completion key.

Constraints:
- No external tour libraries — keep the implementation lightweight using existing UI primitives.
- The tour must not block access to the UI — Skip should always be available.
- Do not modify existing page layouts beyond adding tour anchor attributes (data-tour-step="step-1" etc.) to target elements.
- Follow existing component patterns in `archlucid-ui/src/components/`.
- Mobile-responsive: tour cards should not overflow on narrow viewports.

Acceptance criteria:
- First visit shows a 5-step tour overlay.
- Subsequent visits do not show the tour.
- "Restart tour" option exists somewhere accessible.
- Skip dismisses the tour permanently.
- Vitest test passes.

Do not change:
- The navigation structure or sidebar logic.
- The API or backend code.
- Existing component APIs or props.
```

---

### Improvement 14: Configuration Summary Diagnostic Endpoint

**Title:** Add a `GET /v1/admin/configuration-summary` endpoint for deployment diagnostics

**Why it matters:** The wide configuration surface (dozens of keys across auth, billing, storage, LLM, observability, governance) makes it hard to verify a deployment is correctly configured. A diagnostic endpoint that reports the effective non-secret configuration state accelerates troubleshooting and deployment validation.

**Expected impact:** Directly improves Manageability (+4-6 pts), Supportability (+3-4 pts), Deployability (+2-3 pts). Weighted readiness impact: +0.1-0.2%.

**Affected qualities:** Manageability, Supportability, Deployability, Observability

**Status:** COMPLETED (2026-05-10) — extended existing **`GET /v1/admin/config-summary`** with `Section`, `RequirementKind`, optional **`includeEffectiveValues`** (redacted via `ConfigurationEffectiveValueResolver`). No separate `configuration-summary` route; audit event from prompt not added.

**Cursor prompt:**
```
In the ArchLucid API, add a diagnostic configuration summary endpoint.

1. Read `ArchLucid.Core/Configuration/ConfigurationKeyCatalog.cs` to understand the full configuration key inventory.
2. Create a new controller `ArchLucid.Api/Controllers/Admin/ConfigurationSummaryController.cs` with a single `GET /v1/admin/configuration-summary` endpoint.
3. The endpoint should:
   - Require the Admin role (`[Authorize(Policy = ArchLucidPolicies.RequireAdmin)]` or equivalent).
   - Read all configuration keys listed in `ConfigurationKeyCatalog`.
   - For each key, report: key name, whether it has a non-empty value (boolean), the requirement kind (from the catalog), and for non-secret keys, the actual value. For keys flagged as secrets (connection strings, API keys, tokens), report only "configured" / "not configured" — NEVER the actual value.
   - Group results by category (Auth, Billing, Storage, LLM, Observability, Governance, etc.) matching the catalog's structure.
   - Return JSON with the structure: `{ "categories": [{ "name": "Auth", "keys": [{ "key": "ArchLucidAuth:Mode", "configured": true, "value": "JwtBearer", "requirement": "Required" }] }] }`.
4. Add a secret-detection heuristic: any key containing "Secret", "Key", "Password", "Token", "ConnectionString" (case-insensitive) must have its value redacted to `"***"` in the response.
5. Add unit tests in `ArchLucid.Api.Tests` that verify: (a) secret values are redacted, (b) non-secret values are returned, (c) the endpoint requires Admin role, (d) all catalog keys appear in the response.
6. Update the OpenAPI snapshot if the contract changed (per Http-Surface-Docs-And-Clients rule).

Constraints:
- NEVER expose secret values — this is a hard security requirement.
- Use existing controller patterns (attribute routing, scoping, audit).
- The endpoint should emit an audit event (e.g., `Admin.ConfigurationSummaryViewed`).
- Follow existing admin controller patterns in `ArchLucid.Api/Controllers/Admin/`.
- Each new class in its own file.

Acceptance criteria:
- `GET /v1/admin/configuration-summary` returns a categorized configuration report.
- All secret values are redacted.
- Admin role is required.
- Audit event is emitted.
- All new and existing API tests pass.
- OpenAPI snapshot is updated.

Do not change:
- The configuration loading or resolution logic.
- Any existing configuration keys or defaults.
- The ConfigurationKeyCatalog structure.
```

---

### Improvement 15: CHANGELOG Buyer-Friendliness Pass

**Title:** Add a buyer-facing summary section to the CHANGELOG

**Why it matters:** The current CHANGELOG is contributor-oriented with internal references, code paths, and policy decisions. Buyers evaluating the product velocity and direction see internal jargon rather than value-oriented summaries. A buyer-facing section at the top increases transparency and decision velocity.

**Expected impact:** Directly improves Change Impact Clarity (+4-6 pts), Marketability (+2-3 pts), Decision Velocity (+2-3 pts), Executive Value Visibility (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

**Affected qualities:** Change Impact Clarity, Marketability, Decision Velocity, Executive Value Visibility

**Status:** COMPLETED (2026-05-10) — buyer-facing **rolling shorthand** paragraph at top of **`docs/CHANGELOG.md`** (not the prompt’s separate `## Release highlights (buyer-facing)` table).

**Cursor prompt:**
```
In `docs/CHANGELOG.md`, add a buyer-facing release summary section at the top of the file, below the scope header and above the first detailed entry.

1. Read the current `docs/CHANGELOG.md` to understand the existing format (contributor-oriented, newest-first).
2. Insert a new section `## Release highlights (buyer-facing)` immediately after the scope/spine header block and before the first `## 2026-...` entry.
3. In this section, summarize the last 5-8 major product changes in buyer-friendly language. For each:
   - One-line title describing what changed from the buyer's perspective (e.g., "Slack notifications now available" not "Slack first-party chat-ops promoted to V1 GA")
   - One sentence explaining why it matters to the buyer
   - Link to the detailed CHANGELOG entry below
4. Format as a simple table: | Date | What changed | Why it matters |
5. Do NOT modify or rewrite any existing CHANGELOG entries — only add the new summary section.
6. Keep the summary under 30 lines total.

Constraints:
- Use plain buyer language — no internal code references, no policy citations, no architecture jargon.
- Do not reference specific file paths, class names, or configuration keys.
- Do not add scope header to this section (the file already has one).
- Do not mention deferred items or assessment scores.

Acceptance criteria:
- A `## Release highlights (buyer-facing)` section exists at the top of the CHANGELOG.
- 5-8 recent changes are summarized in buyer-friendly language.
- No existing entries are modified.
- The scope header CI check still passes.

Do not change:
- Any existing CHANGELOG entries.
- The scope header.
- Any other documentation files.
```

---

### Improvement 16: Support Bundle Validation Against Common Failure Scenarios

**Title:** Add integration tests that validate support bundle diagnostic completeness for common failures

**Why it matters:** The support bundle (CLI `support-bundle`) is the primary diagnostic artifact for troubleshooting. If it misses critical information for common failure scenarios (API unreachable, SQL connection failure, auth misconfiguration, LLM timeout), support cycles lengthen and customer satisfaction drops.

**Expected impact:** Directly improves Supportability (+4-6 pts), Reliability (+2-3 pts), Customer Self-Sufficiency (+2-3 pts). Weighted readiness impact: +0.1-0.2%.

**Affected qualities:** Supportability, Reliability, Customer Self-Sufficiency, Manageability

**Status:** COMPLETED (2026-05-10) — **`SupportBundleDiagnosticCompletenessTests`** (triage catalog / ordering invariants); narrower than prompt’s five scenario assertions.

**Cursor prompt:**
```
In the ArchLucid CLI test project, add integration tests that validate the support bundle captures useful diagnostics for common failure scenarios.

1. Read `ArchLucid.Cli/Support/SupportBundleTriageCatalog.cs`, `SupportBundleBuildSection.cs`, `SupportBundleHealthProbe.cs`, and `ArchLucid.Core/Support/SupportBundleLayout.cs` to understand the current support bundle structure.
2. Read `ArchLucid.Api/Controllers/Admin/SupportBundleController.cs` to understand the API surface.
3. In `ArchLucid.Cli.Tests/`, create a new test class `SupportBundleDiagnosticCompletenessTests.cs` with tests that verify the support bundle output includes:
   - Test 1: Health probe results (live, ready) are present in the bundle.
   - Test 2: Version information is captured.
   - Test 3: When the API returns a non-200 health status, the bundle captures the failure reason.
   - Test 4: Configuration summary (non-secret keys) is present (or marked as "requires Admin role" if not authorized).
   - Test 5: The triage catalog maps at least 5 known failure patterns to actionable next-step suggestions.
4. Use the existing `SupportBundleTriageCatalog` to validate that common error patterns (connection refused, 401, 403, 500, timeout) have triage entries with non-empty next-steps.
5. These can be unit-level tests against the catalog and layout classes — they do not need a running API instance.

Constraints:
- Follow existing CLI test patterns.
- Do not modify the support bundle production code — only add tests.
- Use xUnit traits (Category, Suite) consistent with existing tests.
- Do not add ConfigureAwait(false) in tests.

Acceptance criteria:
- 5+ tests validate support bundle diagnostic completeness.
- Tests verify the triage catalog covers common failure patterns.
- All existing CLI tests pass.

Do not change:
- The support bundle implementation.
- The triage catalog content (only test that it covers expected patterns).
- Any API or backend code.
```

---

### Improvement 17: Finding Engine Output Quality Documentation with Examples

**Title:** Document finding engine output examples with quality expectations per engine

**Why it matters:** The "10 finding engines" claim is a key differentiator, but no documentation shows what each engine actually produces. Buyers and operators cannot evaluate whether the findings are useful without seeing examples. Sample outputs build confidence and set quality expectations.

**Expected impact:** Directly improves Differentiability (+3-5 pts), Proof-of-ROI Readiness (+2-4 pts), Trustworthiness (+2-3 pts), Explainability (+2-3 pts). Weighted readiness impact: +0.2-0.3%.

**Affected qualities:** Differentiability, Proof-of-ROI Readiness, Trustworthiness, Explainability, Marketability

**Status:** COMPLETED (2026-05-10) — **`docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md`**.

**Cursor prompt:**
```
Create a finding engine output quality reference document at `docs/library/FINDING_ENGINE_OUTPUT_REFERENCE.md`.

1. Read the finding engine implementations to identify all engines:
   - `ArchLucid.Decisioning/Services/PolicyCoverageFindingEngine.cs`
   - `ArchLucid.Decisioning/Services/RequirementCoverageFindingEngine.cs`
   - `ArchLucid.Decisioning/Services/SecurityCoverageFindingEngine.cs`
   - `ArchLucid.Decisioning/Services/SecurityBaselineFindingEngine.cs`
   - `ArchLucid.Decisioning/Services/PolicyApplicabilityFindingEngine.cs`
   - `ArchLucid.Decisioning/Services/RequirementFindingEngine.cs`
   - `ArchLucid.Capabilities.Cost/CostConstraintFindingEngine.cs`
   - And any others discoverable via `FindingEnginePluginDiscovery.cs`
2. Read the existing golden corpus test data in `ArchLucid.Decisioning.Tests/GoldenCorpus/` to extract representative finding examples.
3. For each finding engine, document:
   - Engine name and purpose (one sentence)
   - What input it analyzes (agent output type, context)
   - Example finding output (title, description, severity, confidence) — use sanitized/fictional examples from golden corpus or simulator output
   - Quality expectation: what a "good" finding from this engine looks like
   - Known limitations (if any are documented in code comments or tests)
4. Format as a table per engine, with a short narrative introduction.
5. Add a scope header per the Doc-Scope-Header rule.
6. Link from `docs/library/PRODUCT_PACKAGING.md` (if it references finding engines) and from `docs/library/CONNECTOR_READINESS_MATRIX.md` (if relevant).

Constraints:
- Use only fictional/sanitized examples — no real customer data.
- Prefer examples from existing test fixtures or golden corpus data.
- Be honest about limitations — do not overstate finding quality.
- Keep under 200 lines.
- Do not modify any code files.

Acceptance criteria:
- Every finding engine has a documented entry with purpose, example output, and quality expectations.
- Examples are realistic and derived from existing test data.
- Scope header passes CI check.
- At least one cross-link from an existing document.

Do not change:
- Any code files.
- Any existing documentation content (only add links where specified).
```

---

### Improvement 18: Terraform Reference Deployment Single-Script Wrapper

**Title:** Create a single reference deployment script that applies the minimum viable Terraform stack

**Why it matters:** The 12+ Terraform root modules create coordination complexity. A new operator deploying ArchLucid must understand which roots to apply in what order, with what variables. A single wrapper script with sensible defaults reduces deployment friction from hours to minutes.

**Expected impact:** Directly improves Deployability (+4-6 pts), Adoption Friction (+2-3 pts), Time-to-Value (+2-3 pts), Azure Compatibility (+1-2 pts). Weighted readiness impact: +0.1-0.3%.

**Affected qualities:** Deployability, Adoption Friction, Time-to-Value, Azure Compatibility and SaaS Deployment Readiness

**Status:** COMPLETED (2026-05-10) — **`infra/deploy-reference.ps1`** (wrapper over **`apply-saas.ps1 -MultiRoot`**). No **`deploy-reference.cmd`** or **`infra/REFERENCE_DEPLOYMENT.md`** per prompt.

**Cursor prompt:**
```
Create a reference deployment script at `infra/deploy-reference.ps1` that applies the minimum viable Terraform stack for a new ArchLucid environment.

1. Read the existing `infra/apply-saas.ps1` to understand the current deployment orchestration pattern.
2. Read the Terraform root modules to determine the minimum viable set for a working ArchLucid deployment:
   - At minimum: `terraform` (base resources), `terraform-sql-failover` or equivalent SQL module, `terraform-keyvault`, `terraform-container-apps`, and `terraform-openai`.
3. Create `infra/deploy-reference.ps1` that:
   - Accepts parameters: `-Location` (Azure region, default "eastus2"), `-EnvironmentName` (e.g., "pilot-01"), `-SubscriptionId` (required).
   - Validates prerequisites: `az` CLI installed and logged in, `terraform` installed, subscription accessible.
   - Applies Terraform roots in the correct dependency order, passing variables from parameters.
   - Between each root, validates the previous apply succeeded before continuing.
   - Outputs the final deployment summary: API URL, health check URL, Container Apps name, SQL server name.
   - Includes a `-DryRun` switch that runs `terraform plan` only for each root.
4. Add a companion `infra/deploy-reference.cmd` wrapper that calls the PowerShell script.
5. Add a brief README section at `infra/REFERENCE_DEPLOYMENT.md` with scope header, prerequisites, usage examples, and what the script does NOT do (e.g., does not configure Entra ID, does not set up private endpoints).

Constraints:
- Do not modify existing Terraform modules — only orchestrate them.
- Do not hardcode secrets or sensitive values — require them as parameters or from Azure Key Vault.
- Use existing Terraform variable patterns (tfvars, environment variables).
- The script must be idempotent — running it twice should not fail or create duplicate resources.
- Follow existing PowerShell script patterns in the repo root.

Acceptance criteria:
- `deploy-reference.ps1 -Location eastus2 -EnvironmentName pilot-01 -SubscriptionId <sub>` applies all required Terraform roots.
- `-DryRun` shows plans without applying.
- Prerequisites are validated before any apply.
- Deployment summary is printed on success.
- README documents usage and limitations.

Do not change:
- Any existing Terraform module files.
- Any existing deployment scripts.
- Any application code.
```

---

### Improvement 19: Application Insights Workbook Template for Operators

**Title:** Provide an Azure Application Insights workbook template for out-of-box operational visibility

**Why it matters:** The product emits rich OpenTelemetry metrics (agent output quality, query p95, audit write failures, outbox depth) but operators who don't run Prometheus/Grafana get no out-of-box visibility. An Application Insights workbook template provides immediate operational dashboards with one-click deployment.

**Expected impact:** Directly improves Observability (+4-6 pts), Manageability (+2-3 pts), Supportability (+2-3 pts). Weighted readiness impact: +0.1-0.2%.

**Affected qualities:** Observability, Manageability, Supportability, Reliability

**Status:** PARTIALLY COMPLETED (2026-05-10) — **`infra/appinsights-workbook/README.md`** with KQL starters; no ARM **`archlucid-operations.workbook.json`** or **`deploy-workbook.ps1`** from prompt.

**Cursor prompt:**
```
Create an Azure Application Insights workbook template for ArchLucid operational monitoring.

1. Read `docs/library/OBSERVABILITY.md` and `ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs` to catalog the custom metrics emitted.
2. Read `infra/terraform-monitoring/` to understand existing monitoring infrastructure.
3. Create `infra/appinsights-workbook/archlucid-operations.workbook.json` as an ARM-deployable Application Insights workbook template with these panels:
   - **Health overview:** API response time p50/p95/p99 over time, request rate, error rate (from standard ASP.NET Core telemetry).
   - **Agent output quality:** `archlucid_agent_output_semantic_score` histogram, `archlucid_agent_output_structural_completeness_ratio` histogram, `archlucid_agent_output_quality_gate_total` by outcome.
   - **Agent output failures:** `archlucid_agent_output_parse_failures_total` rate, `archlucid_agent_trace_blob_upload_failures_total` rate.
   - **SQL query performance:** `archlucid_query_p95_ms` gauge by query name.
   - **Audit health:** `archlucid_audit_write_failures_total` rate.
   - **Outbox depth:** `archlucid_outbox_depth` gauge.
4. Use KQL queries against `customMetrics` and `requests` tables.
5. Add a deployment script `infra/appinsights-workbook/deploy-workbook.ps1` that accepts `-ResourceGroupName` and `-AppInsightsName` and deploys the workbook via `az deployment group create`.
6. Add a README at `infra/appinsights-workbook/README.md` with scope header, prerequisites, deployment instructions, and screenshots description (describe what each panel shows).

Constraints:
- Use standard Application Insights workbook JSON format (ARM template).
- Use only metrics that are documented in OBSERVABILITY.md — do not invent metric names.
- Metric names in App Insights may be normalized (underscores to dots or similar) — use the `customMetrics` table `name` field as documented.
- Do not require Prometheus or Grafana.
- Do not modify any application code.

Acceptance criteria:
- Workbook template deploys successfully to an Application Insights resource.
- All referenced metrics correspond to actual instrumentation in the codebase.
- README documents deployment and panel descriptions.

Do not change:
- Any application code or instrumentation.
- Existing Terraform monitoring modules.
- Any documentation in docs/ (only create new files in infra/).
```

---

### Improvement 20: Competitive Positioning Matrix

**Title:** Create an honest competitive comparison document for buyer conversations

**Why it matters:** Buyers evaluating ArchLucid need to understand how it compares to alternatives (manual architecture review, static analysis tools, cloud advisory services, IaC scanners). An honest matrix positions ArchLucid's strengths without overselling and helps sales conversations.

**Expected impact:** Directly improves Differentiability (+3-5 pts), Marketability (+2-3 pts), Decision Velocity (+2-3 pts). Weighted readiness impact: +0.1-0.2%.

**Affected qualities:** Differentiability, Marketability, Decision Velocity, Executive Value Visibility

**Status:** COMPLETED (2026-05-10) — **`docs/go-to-market/COMPETITIVE_COMPARISON.md`**.

**Cursor prompt:**
```
Create a competitive positioning matrix at `docs/go-to-market/COMPETITIVE_COMPARISON.md`.

1. Read `docs/go-to-market/COMPETITIVE_LANDSCAPE.md` to understand any existing competitive positioning.
2. Read `docs/go-to-market/POSITIONING.md` and `docs/EXECUTIVE_SPONSOR_BRIEF.md` for the current value proposition.
3. Create the comparison document with:
   - Scope header per Doc-Scope-Header rule: "Honest competitive positioning for sales and buyer conversations; not marketing copy."
   - A comparison matrix table with these columns: Capability | ArchLucid | Manual Review | Static Analysis (e.g., SonarQube) | IaC Scanners (e.g., Checkov/tfsec) | Cloud Advisory (e.g., Azure Advisor)
   - Rows for at minimum: Architecture review automation, Finding governance, Audit trail, Multi-agent analysis, Cost optimization findings, Compliance checking, Manifest commitment model, Evidence-backed recommendations, Terraform advisory emit, Integration (ITSM/chat), Time per review cycle, Explainability
   - For each cell: brief honest assessment (e.g., "Full", "Partial", "Not applicable", "Manual only")
   - A "Where ArchLucid is NOT the right tool" section (link to `NOT_A_FIT.md`)
   - A "Where ArchLucid is strongest" section highlighting unique differentiators
4. Be honest — mark cells where alternatives are stronger than ArchLucid (e.g., static analysis tools have deeper code-level coverage; Azure Advisor has native Azure integration that doesn't require ZIP upload).
5. Keep under 120 lines.

Constraints:
- Do not make unsubstantiated claims.
- Do not name specific vendor products with negative framing — use category names.
- Be honest about limitations.
- Do not reference internal engineering details.
- Link to `NOT_A_FIT.md` and `POSITIONING.md` where appropriate.

Acceptance criteria:
- Matrix covers 5 comparison categories with 10+ capability rows.
- Honest assessment of where alternatives are stronger.
- Scope header passes CI check.
- Under 120 lines.

Do not change:
- Any existing go-to-market documents.
- Any code files.
```

---

### Improvement 21: In-Product Documentation Search

**Title:** Add a documentation search capability to the operator UI

**Why it matters:** With 680+ docs, finding the right information requires significant navigation effort. A search capability transforms the documentation volume from a cognitive load problem into a knowledge asset.

**Expected impact:** Directly improves Cognitive Load (+5-8 pts), Customer Self-Sufficiency (+4-6 pts), Usability (+2-3 pts). Weighted readiness impact: +0.2-0.3%.

**Affected qualities:** Cognitive Load, Customer Self-Sufficiency, Usability, Adoption Friction

**Status:** COMPLETED (2026-05-10) — **`archlucid-ui/src/lib/docs-search-index.ts`** + Documentation group in **`CommandPalette`** (Vitest: **`docs-search-index.test.ts`**).

**Cursor prompt:**
```
In the `archlucid-ui` Next.js application, add a documentation search capability using the existing `cmdk` (Command Menu) dependency.

1. Read `archlucid-ui/package.json` to confirm `cmdk` is already a dependency.
2. Read the existing UI to see if there's already a command palette or search component.
3. Create a documentation search index at `archlucid-ui/src/lib/docs-search-index.ts` containing:
   - An array of searchable documentation entries, each with: `title`, `description` (first sentence of the doc), `category` (e.g., "Operations", "Security", "Integrations", "Architecture"), `url` (relative path to the markdown file on GitHub).
   - Populate with the ~30 most important operator-facing documents (prioritize: PILOT_GUIDE, OPERATOR_QUICKSTART, TROUBLESHOOTING, CLI_USAGE, RELEASE_SMOKE, API_CONTRACTS, SECURITY, AUDIT_COVERAGE_MATRIX, CONNECTOR_READINESS_MATRIX, V1_SCOPE, CONFIGURATION_REFERENCE, and similar).
4. Create `archlucid-ui/src/components/docs-search.tsx` using `cmdk` to render a searchable command palette:
   - Triggered by Ctrl+K / Cmd+K keyboard shortcut.
   - Filters entries by title and description as the user types.
   - Groups results by category.
   - Selecting a result opens the GitHub URL in a new tab.
5. Mount the command palette in the main layout so it's available on every page.
6. Add a Vitest test that verifies the search index has entries and the component renders without errors.

Constraints:
- Use the existing `cmdk` dependency — do not add new search libraries.
- The search is client-side against a static index — no API calls.
- Keep the index manually curated (not auto-generated) for quality control.
- Follow existing component and styling patterns.
- The URL base should use `NEXT_PUBLIC_DOCS_BASE_URL` (same as Improvement 5 if implemented, defaulting to `https://github.com/joefrancisGA/ArchLucid/blob/main/`).

Acceptance criteria:
- Ctrl+K / Cmd+K opens a documentation search palette.
- Typing filters results by title and description.
- At least 25 documentation entries are indexed.
- Selecting a result opens the doc in a new tab.
- Vitest test passes.

Do not change:
- The navigation structure or sidebar.
- Any API or backend code.
- Any existing components.
```

---

### Improvement 22: Data Export Completeness Validation

**Title:** Add a test that validates data export covers all major entity types

**Why it matters:** Paradoxically, making data export easy increases customer willingness to adopt. If customers discover that export is incomplete (e.g., audit events export but findings don't, or manifests export but provenance doesn't), trust erodes. A test ensures export completeness is maintained as the schema evolves.

**Expected impact:** Directly improves Stickiness (+2-3 pts), Trustworthiness (+2-3 pts), Data Consistency (+2-3 pts), Compliance Readiness (+1-2 pts). Weighted readiness impact: +0.05-0.1%.

**Affected qualities:** Stickiness, Trustworthiness, Data Consistency, Compliance Readiness

**Status:** COMPLETED (2026-05-10) — **`ExportControllerSurfaceArchitectureTests`** (curated export HTTP surface); not the prompt’s full DDL ↔ export matrix.

**Cursor prompt:**
```
In the ArchLucid architecture tests, add a test that validates data export covers all major persisted entity types.

1. Read `ArchLucid.Application/Exports/` to understand the existing export services (Markdown, DOCX, ZIP).
2. Read the export API surface — likely `GET /v1/architecture/run/{runId}/export` or similar endpoints.
3. Read the SQL schema tables in `ArchLucid.Persistence/Scripts/ArchLucid.sql` to catalog the major entity types (Runs, Manifests, Findings, AgentResults, AuditEvents, GovernanceDecisions, Artifacts, etc.).
4. Create a test in `ArchLucid.Architecture.Tests/DataExportCompletenessTests.cs` that:
   - Lists the major entity tables from the SQL schema (parse the DDL or maintain a curated list).
   - For each major entity type, asserts that at least one export path exists (an export service method, an API export endpoint, or a CLI export command) that covers that entity type.
   - The test should be structural — it validates that export code references the entity type, not that the export is functionally complete.
5. Maintain a curated `ExportableEntityTypes` list in the test constants, similar to the composition root test pattern.
6. Include an `[Fact]` that fails when a new table is added to the schema but not to the exportable entities list — forcing developers to either add export support or explicitly mark the table as "not user-exportable" (e.g., internal caching tables).

Constraints:
- This is a structural/architecture test, not a functional export test.
- Do not modify any export code.
- Follow existing architecture test patterns.
- Use reflection or string parsing as appropriate.

Acceptance criteria:
- All major entity types have at least one export path documented in the test.
- Adding a new SQL table without updating the test causes a failure.
- The test distinguishes between user-exportable and internal-only tables.

Do not change:
- Any export implementation code.
- Any SQL schema.
- Any API routes.
```

---

### Improvement 23: Demo Recording Script and Storyboard

**Title:** Create a scripted demo storyboard for producing a shareable product walkthrough

**Why it matters:** A 3-minute video showing request → commit → manifest → findings → Terraform advisory snippet does more for marketability than additional documentation. A written storyboard ensures the demo is reproducible and consistent.

**Expected impact:** Directly improves Marketability (+4-6 pts), Decision Velocity (+3-4 pts), Proof-of-ROI Readiness (+2-3 pts). Weighted readiness impact: +0.2-0.3%.

**Affected qualities:** Marketability, Decision Velocity, Proof-of-ROI Readiness, Executive Value Visibility, Differentiability

**Status:** COMPLETED (2026-05-10) — **`docs/demo/DEMO_RECORDING_STORYBOARD.md`**, **`scripts/demo-setup.ps1`**.

**Cursor prompt:**
```
Create a demo recording storyboard at `docs/demo/DEMO_RECORDING_STORYBOARD.md`.

1. Read `docs/go-to-market/DEMO_QUICKSTART.md` and `docs/demo/README.md` to understand existing demo infrastructure.
2. Read the architecture request templates at `templates/architecture-requests/` to pick the most visually compelling scenario.
3. Create the storyboard document with:
   - Scope header: "Scripted storyboard for producing a 3-minute product demo recording; not a live demo script."
   - Prerequisites: what must be running (API, UI, which mode — simulator is fine)
   - Scene-by-scene breakdown (6-8 scenes, ~20-30 seconds each):
     - Scene 1: Open archlucid.net (or localhost), show the home page and Core Pilot checklist
     - Scene 2: Click "New Run", fill in the architecture request using the `web-app-with-database.json` template scenario
     - Scene 3: Show execution pipeline timeline progressing through agents
     - Scene 4: Show committed manifest with findings summary (highlight severity distribution)
     - Scene 5: Drill into a specific finding — show the evidence, confidence score, and explanation
     - Scene 6: Show the Artifacts tab — download or preview the Terraform advisory snippet
     - Scene 7: Show the governance dashboard or audit log (quick pan)
     - Scene 8: End card — "From request to defensible architecture in under 5 minutes"
   - For each scene: what to click, what to say (voiceover script, 1-2 sentences), what the viewer should notice
   - Screen resolution and browser zoom recommendations for recording clarity
   - Suggested recording tools (OBS, screen capture)
4. Add a companion script `scripts/demo-setup.ps1` (or extend existing `scripts/demo-start.ps1`) that:
   - Starts the API in simulator mode
   - Pre-seeds one completed run using `release-smoke.ps1` or the CLI `try` command
   - Prints "Demo environment ready — open http://localhost:3000"
5. Keep the storyboard under 100 lines.

Constraints:
- Use simulator mode — do not require Azure OpenAI credentials.
- Use fictional/Contoso scenario names only.
- Do not record actual video — produce the storyboard and setup script only.
- Follow existing docs and script patterns.

Acceptance criteria:
- Storyboard has 6-8 scenes with voiceover script and click instructions.
- Demo setup script starts a working environment with pre-seeded data.
- The entire demo path can be executed in under 5 minutes.
- Scope header passes CI check.

Do not change:
- Any existing demo infrastructure.
- Any application code.
- The release-smoke script (only call it, don't modify).
```

---

## 10. Pending Questions for Later

**Note (2026-05-10):** Baseline implementations now exist for Improvements **2**, **3**, **12**, **14**, and **18** (see section 9 status notes). The bullets under those headings are optional product follow-ups, not blockers.

### Improvement 1 (Real-LLM Golden Cohort Gate)
- **Answered (2026-05-10):** Azure OpenAI deployment for CI is **`gpt-4o`**. Nightly real-LLM CI cost budget cap: **`USD 5`**.
- **Answered (2026-05-10):** Real-LLM tier is **merge-blocking** on **`main`** once the gate is stable (required status checks; see **`docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`** §2).

### Improvement 2 (Durable LLM Budget Trackers)
- **Answered (2026-05-10):** **One LLM call’s worth** of overshoot past the configured cap is **acceptable** (reservation granularity); a strict zero-overshoot cap is **not** required.
- **Answered (2026-05-10):** If reservation fails (e.g. **SQL unavailable**), **allow the LLM call** and **log a warning** (fail-open).

### Improvement 3 (Quick Scan)
**Status (2026-05-10):** Implemented — **`POST /v1/architecture/quick-scan`** (see Improvement 3 in section 9). **`QuickScanService`** is functional end-to-end; results are **ephemeral** for this slice (no persistence / no new run lifecycle). *Open product follow-up:* whether to persist quick scans as lightweight runs in a future iteration.

### Improvement 4 (ITSM Vendor Sandbox)
- **Deferred (2026-05-10):** Jira Cloud **project/site** and **Atlassian account** choice — **no decision yet**; revisit when live vendor CI is scheduled.
- **Deferred (2026-05-10):** **Dedicated service account vs owner credentials** for nightly CI — **no decision yet**.

### Improvement 7 (INV-005 Startup Validator Parity)
- **Answered (2026-05-10):** **No** break-glass or dev-only keys exempt from Production/Staging validation for **V1**; any future break-glass is **explicit env + ADR**, not a silent warn tier.
- **Answered (2026-05-10):** **No** separate **warn-in-production** key list for **V1** — invalid required/conditional stays **hard block**; optional keys are not startup-gated that way.

### Improvement 12 (Agent Execution Trace Retention)
- **Answered (2026-05-10):** **Per-tenant** configurable retention is the **target**; today’s **`DataArchival:*`** purge is **global** — per-tenant overrides remain **product/engineering follow-up**.
- **Answered (2026-05-10):** **Minimum retention** before purge-eligible treatment: **three months** (~**90 days**); operators should not set archival hard-delete windows **below** that floor without legal sign-off.

### Improvement 14 (Configuration Summary Endpoint)
- Are there any configuration keys that should be hidden entirely (not just redacted) from the summary — e.g., keys whose existence reveals architectural decisions the buyer shouldn't see?

### Improvement 18 (Reference Deployment Script)
- What is the minimum viable set of Terraform roots? Should it include private networking, or is a public-endpoint deployment acceptable for pilots?
- Should the script support bring-your-own SQL Server, or always provision a new one?

### General
- What is the target date for the V1.1 commerce un-hold (Stripe live keys + Marketplace publish)?
- Is there a budget allocated for the SOC 2 Type I readiness assessment (even if the CPA engagement is deferred)?
- What is the expected tenant count at V1 GA — single digits, tens, or hundreds? This affects whether the scaling gaps are urgent.

---

## Deferred Scope Uncertainty

I was able to locate and read the markdown files that define deferred scope:
- `docs/library/V1_SCOPE.md` — V1 contract
- `docs/library/V1_DEFERRED.md` — deferred inventory (§1-§7)
- `docs/library/TECH_BACKLOG.md` — engineering backlog
- `docs/PENDING_QUESTIONS.md` — referenced but not fully read

All deferred items referenced in this assessment are traceable to specific sections in these documents. No deferred scope uncertainty exists in this assessment.

---

*Assessment performed 2026-05-10 from repository materials at commit HEAD. No prior assessments, scores, or conclusions were referenced.*
