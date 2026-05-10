# ArchLucid Assessment — Weighted Readiness 69.82%

**Date:** 2026-05-10  
**Method:** Independent first-principles assessment from repository materials  
**Total weight:** 112 | **Weighted score:** 69.82 / 100  
**Rescoring note (2026-05-10):** Published case studies, testimonials, and named reference customers are **V1.1** scope per `docs/library/V1_DEFERRED.md` §6b; they are **not** scored as V1 deficiencies for Marketability, Proof-of-ROI, Procurement Readiness, or related qualities.

**Rescoring note (2026-05-10, buyer pilot documentation):** Absence of an **in-repo** record of a **completed** buyer pilot (before/after metrics, PMF rows, etc.) is **not** treated as a **`(A)`** Proof-of-ROI readiness deficiency. Pilots may run under NDA, live outside the repo, or simply not be committed; the scored question is whether the **product and collateral** support pilot ROI proof — templates, models, and buyer-safe evidence — not whether this repository is the custodian of finished pilot files. **`(A)`** likewise does **not** treat the presence or absence of **optional, policy-permitted anonymized pilot outcome files** in the repo as a Proof-of-ROI plus or minus — that is commercial hygiene and **`(B)`** narrative convenience only, not product readiness.

**Rescoring note (2026-05-10, Azure-first posture):** Choosing an **Azure-native** product and deployment posture — and therefore **not** chasing multi-cloud parity — is **intentional ICP focus**, not a V1 **Adoption Friction** or **Marketability** defect. Buyers who cannot accept Azure-adjacent architecture self-filter (`NOT_A_FIT.md`). **`(A)` does not** reduce scores because a single-cloud strategy implies a **smaller theoretical addressable market** than an everything-everywhere product; that comparison confuses positioning with product readiness.

**Product posture correction (2026-05-10):** The **buyer path is hosted SaaS** — marketing → self-serve signup → operator shell (e.g. staging/production fronts per `docs/library/PRODUCT_PACKAGING.md`). **Docker / compose and local “try” flows are contributor, CI, and optional self-host mechanics**, not a first-class SaaS quickstart; this assessment should not treat a Docker-based “try” as the primary time-to-value story. **Hosted SaaS does not require a customer Azure subscription** (trial or paid); the vendor operates the service boundary. Optional **voluntary** data-ingest patterns (e.g. read-only export packages) are **not** prerequisites for trial or standard value — they are enrichments where buyers choose to supply material.

**Rescoring note (2026-05-10, Docker documentation audience):** **`(A)`** does **not** penalize Time-to-Value, Marketability, Deployability, or related onboarding qualities because local Docker/compose docs are or are not explicitly labeled **developer / self-host** versus **SaaS buyer** quickstart. That is editorial/docs hygiene; hosted SaaS readiness is judged on the **sign-up → shell** path, not on repo wording taxonomy for optional local stacks.

**Rescoring note (2026-05-10, formal usability studies):** **`(A)`** does **not** reduce **Usability** (or Cognitive Load) because the team has not run a prescribed usability protocol (e.g. moderated sessions with 3–5 target-persona users) or has not published UX-research artifacts in-repo. Judgment stays on **shipped** UX affordances (progressive disclosure, wizards, a11y-oriented components); optional research is **`(B)`** / process maturity, not a V1 product gate.

**Rescoring note (2026-05-10, procurement pack iteration):** **`(A)`** does **not** reduce **Procurement Readiness** because the organization has not yet completed its **first** full buyer procurement cycle or captured “lessons learned” iterations in-repo to refine the evidence pack. **`(A)`** scores the **shipped** procurement collateral set (templates, indexes, FAQs, accelerators). Post-deal pack tuning is normal **`(B)`** / sales-ops learning, not a V1 product defect.

**Rescoring note (2026-05-10, production burn-in and multi-region):** **`(A)`** does **not** reduce **Availability**, **Reliability**, **Azure Compatibility and SaaS Deployment Readiness**, or **Trustworthiness** because there is no long-running **production** (or sustained **staging**) burn-in narrative committed in-repo — those scores reflect **shipped** SLOs, probes, health endpoints, degradation design, Terraform/CD, and trust mechanisms aligned to **`docs/library/V1_SCOPE.md`**. **`(A)`** also does **not** penalize for absent **multi-region active/active** (or lack of live multi-region evidence) when that is **not** a V1 commitment — **`(B)`** buyers may still raise residency or DR depth.

---

## 1. Executive Summary

### Overall Readiness

ArchLucid is a mature, well-architected enterprise product with an unusually thorough documentation, testing, and governance posture for its stage. The core value proposition — structured architecture request → multi-agent pipeline → golden manifest with explainability traces — is implemented end-to-end with a working API, operator UI, CLI, and SQL persistence layer. The product has a genuine differentiation story and a clear pilot path. The primary drags on readiness are (a) the absence of live real-LLM evidence proving correctness under production model conditions, (b) the commercial motion being entirely sales-led with no self-serve transactability yet, and (c) the first-party ITSM and documentation connectors being freshly shipped without production burn-in. The product is pilot-ready for a sales-led motion with a technically sophisticated buyer; it is not yet ready for unattended self-serve or procurement-heavy enterprise cycles.

### Commercial Picture

Pricing and packaging are well-designed with three tiers (Team / Professional / Enterprise), an ROI model grounded in architect hourly cost displacement, and a quote-request path that works today. The self-serve Stripe checkout and Azure Marketplace listing are wired but operating in TEST mode only — the commerce un-hold is explicitly V1.1. The sales-led motion (order form, quote panel, pricing page) is functional. **V1.1 (not scored as a V1 gap):** published reference customers, testimonials, and public case studies per `V1_DEFERRED.md` §6b — including the signed design partner motion. Monetization still depends on closing pilots and operating the sales-led motion until commerce un-hold.

### Enterprise Picture

Trust and security posture is strong for the stage: database-per-tenant isolation, optional RLS, append-only typed audit with 174 event types, OWASP ZAP + Schemathesis in CI, STRIDE threat model, DPA/subprocessor/CAIQ templates, SOC 2 self-assessment, and a structured trust center. RBAC with four roles (Admin/Operator/Reader/Auditor) and SCIM 2.0 provisioning are shipped. Generic OIDC support is committed for V1 GA alongside Entra ID. The governance layer (approvals, pre-commit gates, policy packs, segregation of duties) is substantial. Procurement readiness materials are thorough. The main **`(B)`** enterprise friction remains CPA SOC 2 attestation (post-V1.1 per scope rules). **Not an `(A)` headline gap:** absence of in-repo **production burn-in** or **multi-region active/active** evidence — see rescoring note; those are operational narrative and post-V1 posture where applicable, not V1 product-readiness deductions in this assessment.

### Engineering Picture

The codebase is well-structured across ~55 .NET projects plus a Next.js operator UI, with clear module boundaries (Core, Application, Decisioning, AgentRuntime, Persistence, KnowledgeGraph, ContextIngestion, ArtifactSynthesis, Provenance, Retrieval, Host.Composition, Host.Core, Api, Worker, CLI). CI is comprehensive: 29 GitHub Actions workflows covering build, test tiers (Core/Fast-Core/Integration/Slow/Full), OpenAPI contract snapshots, Schemathesis fuzzing, ZAP security scanning, k6 load testing, CodeQL, Stryker mutation testing, golden cohort evaluation, and chaos engineering. Architecture invariants are cataloged (INV-001 through INV-015) with enforcement waves planned. The primary engineering risk is that real-LLM correctness is validated only against committed exemplar fixtures, not live Azure OpenAI completions in CI — the golden cohort gate evidence from 2026-05-09 explicitly states the live path was blocked by absent credentials.

---

## 2. Weighted Quality Assessment

Quality write-ups are grouped below. **Strict urgency:** sort Section 3’s table by **Deficiency** (descending).

### Correctness — Score: 64 | Weight: 8 | Weighted: 4.57 | Deficiency: 2.57

**Justification:** The deterministic pipeline stages (context ingestion, graph build, rule-based finding engines) are well-tested with property-based tests (FsCheck), golden fixtures, structural evaluation, and a quality gate mechanism. However, the system's core value — producing architecture findings from LLM-backed agents — has not been validated against live Azure OpenAI in CI or in any documented production-like environment. The golden cohort evidence from 2026-05-09 records no completed **live Azure OpenAI** validation in that automation environment (credentials absent there). The eval corpus scores (all 1.00) are against committed exemplar JSON, not real model output. This is the single largest risk: the product may produce correct outputs with the simulator but could exhibit drift, hallucination, or structural degradation with real models under varied inputs. The agent output evaluation framework (structural + semantic scoring, quality gate) is well-designed but unexercised against production conditions.

**Tradeoffs:** Building a thorough deterministic test harness (simulator + exemplars) was a pragmatic choice that enables fast CI. But it defers the hardest correctness question — does the real model produce useful architecture findings? — to a manual operator step that has not been completed.

**Improvements:** Run the golden cohort gate with live Azure OpenAI credentials and capture evidence. Wire at least a weekly scheduled CI job with real AOAI credentials (secrets in GitHub) to catch model-version-induced drift. This is the single highest-leverage action for the product.

---

### AI/Agent Readiness — Score: 66 | Weight: 8 | Weighted: 4.71 | Deficiency: 2.43

**Justification:** The multi-agent pipeline (Topology, Cost, Compliance, Critic) is structurally complete with a well-defined authority pipeline (AuthorityPipelineStagesExecutor → context ingestion → graph → findings → decisioning → artifacts). Agent output evaluation with structural/semantic scoring and a quality gate mechanism is shipped. Explainability traces are populated at 5/5 for most finding engines. The fallback pattern (real → simulator) with honest execution mode labeling is sound. Content safety is enforced in production. However: (a) real-model evidence is absent, (b) the LLM correctness boundary (TB-007) has open prerequisites (Gap A: ops, Gap C: engineering), (c) per-agent token budget dimensions (TB-015) are not shipped, making cost attribution per agent type opaque, and (d) the MCP ecosystem integration is V1.1. The agent architecture is well-designed for its current scope but not yet proven under adversarial or diverse real-world inputs.

**Tradeoffs:** The conservative quality posture (simulator-default, strict quality gate, content safety) protects against shipping bad output but also means the product has not been stress-tested where it matters most.

**Improvements:** Complete TB-007 (real-mode eval scenarios), ship TB-015 (per-agent token dimensions), and run a structured real-LLM pilot exercise.

---

### Marketability — Score: 68 | Weight: 8 | Weighted: 4.86 | Deficiency: 2.29

**Justification:** The product has a clear positioning: AI-assisted architecture review with governance, manifest versioning, and evidence trails. Competitive comparison materials (vs Backstage, LeanIX, Structurizr, manual Confluence+Jira) are thoughtful. The pricing page, ROI model (break-even at ~180 architect-hours/year), buyer personas, and executive sponsor brief exist. The pilot guide and hosted SaaS entry packaging (`PRODUCT_PACKAGING.md`) describe the buyer path; pilot documentation stays oriented to the operator shell on **hosted** environments, not a Docker-first “try the stack locally” story. **Not scored as V1 gaps (V1.1 per `V1_DEFERRED.md` §6b):** published case studies, testimonials, and named reference customers — independent assessments must not treat their absence as a Marketability deduction for V1. Remaining deductions: (a) the public surface is still largely the operator shell plus pricing, not a purpose-built marketing funnel with rich product walkthroughs, (b) SEO enrichment is on the backlog (TB-020), and (c) the “architecture review” buyer vocabulary is niche — organic search demand is limited. Warm sales-led outreach is credible; unpaid inbound discovery is weak.

**Tradeoffs:** Deep product work before broad marketing was deliberate; trade-off is weaker organic pull until TB-020 and richer marketing pages land.

**Improvements:** Build a purpose-built landing layer with product screenshots and feature walkthroughs (still compatible with sales-led V1). Add JSON-LD structured data per TB-020. Reserve **published** case studies, testimonials, and reference-customer rows for the **V1.1** commercial milestone — do not treat their absence as a V1 product defect.

---

### Time-to-Value — Score: 68 | Weight: 7 | Weighted: 4.25 | Deficiency: 2.00

**Justification:** For **hosted SaaS**, the pilot path is: land on the marketing surface → signup/trial → operator shell → create run → execute → commit → review (see `CORE_PILOT.md` / `PILOT_GUIDE.md` aligned to **vendor-operated** SQL and app tier, not “install SQL locally”). The operator UI has progressive disclosure (Pilot links visible by default, Operate surfaces behind toggles) and the architecture-request wizard guides first use. Remaining friction: (a) **real-LLM**-representative outcomes still need a credible hosted model configuration (and documented posture when runs use simulator vs real mode), (b) the self-serve funnel’s commerce rail is largely **TEST**-mode until the V1.1 un-hold, so many evaluators still need sales/engineering assistance for contract and production-like gates, (c) **optional** voluntary enrichments (e.g. buyer-supplied read-only export packages for deeper cost fidelity) add steps only when a buyer wants that narrative — they are **not** part of the core SaaS onboarding bar, and **no customer Azure subscription is required** for trial or product use, and (d) first meaningful value still requires learning the architecture-request → manifest workflow. **Out of scope for this narrative:** positioning Docker Compose or a local “try” stack as the primary SaaS onboarding path (those exist for contributors, CI, and optional self-host only).

**Tradeoffs:** Simulator vs real execution remains a product design axis for cost and determinism; hosted SaaS should make **operator** onboarding about accounts and runs, not container bring-up.

**Improvements:** Sharpen hosted trial defaults so a net-new tenant can reach first committed manifest with minimal steps (clear mode labeling, optional “demo run” seed).

---

### Adoption Friction — Score: 68 | Weight: 6 | Weighted: 3.64 | Deficiency: 1.71

**Justification:** Friction points for a new **SaaS** adopter in ArchLucid’s **intended** envelope: (a) **Hosted SaaS is vendor-operated** — **no customer Azure subscription** is required for trial or production use; optional voluntary ingest patterns exist for buyers who want richer context, but they are **not** onboarding prerequisites. **`(A)` does not** treat Azure-first scope or ICP filtering (`NOT_A_FIT.md`) as adoption friction — non-fit buyers are out of charter, not failed onboarding. (b) Large **operator** configuration surface for advanced features (`CONFIGURATION_REFERENCE.md`). (c) The **architecture request** concept is novel and requires buyers to structure input accordingly. (d) Governance features often need explicit enablement. (e) First-party ITSM/chat connectors need tenant-specific secrets and vendor accounts. Mitigations: hosted onboarding, documentation, CLI **support** tooling (`doctor`, `support-bundle`) for operators and field/support engineers, health endpoints, progressive disclosure in the shell.

**Tradeoffs:** Azure-native engineering reduces cross-cloud integration load for the team and buyer at the cost of **not** being the universal multi-cloud SKU — that is scope choice, **`(A)`** “ready for intended buyers,” not a penalty. The rich configuration surface enables flexibility but increases initial setup burden for operators.

**Improvements:** Tighten first-run guidance in the hosted operator UI (defaults, progressive disclosure, optional guided configuration for advanced settings).

---

### Proof-of-ROI Readiness — Score: 72 | Weight: 5 | Weighted: 3.21 | Deficiency: 1.25

**Justification:** The ROI model (ROI_MODEL.md) is well-constructed with industry benchmarks and a fill-in-the-blank template. The pilot ROI model (PILOT_ROI_MODEL.md) provides concrete before/after measurement guidance. The executive sponsor brief, pilot success scorecard, buyer-safe evidence templates, and synthetic/worked examples give sales and pilots **usable proof-of-ROI machinery without requiring a published customer story**. **Not scored as V1 gaps:** missing *public* case studies, testimonials, or reference-customer publication (V1.1 per `V1_DEFERRED.md` §6b); **nor** missing an **in-repo** file trail of a **finished** buyer pilot — that is commercial/operational history, not a product defect in the ROI artifact set, and outcomes may sit under NDA or outside git. **Remaining gap:** product-learning “brains” (deterministic theme derivation, plan-draft builder) are intentionally deferred (`V1_DEFERRED.md` §1), which limits how much of the ROI narrative is auto-assembled from runs versus guided by templates.

**Tradeoffs:** Templates and synthetic examples support a sales-led V1; richer auto-generated ROI storytelling waits on deferred product-learning work.

**Improvements:** As engineering prioritizes `V1_DEFERRED.md` §1, ship product-learning “brains” (deterministic theme derivation, plan-draft builder) so more of the ROI story can be derived from runs. Treat **published** reference ROI as **V1.1**, not a V1 engineering gate.

---

### Executive Value Visibility — Score: 65 | Weight: 4 | Weighted: 2.32 | Deficiency: 1.25

**Justification:** The executive sponsor brief exists and frames the value well. The pricing page is public. The steering decision memo template helps champions present to leadership. The one-email kit and business value cheat sheet are available. The compliance drift trend chart in the operator UI provides visible governance value. However: (a) there is no board-pack PDF export, (b) the aggregate ROI bulletin template exists but requires manual population, (c) dashboards and executive-facing visualizations beyond the operator shell are absent, and (d) the product does not produce a "CEO-ready" summary artifact from a run — the golden manifest and findings are architect-audience outputs, not executive presentations.

**Tradeoffs:** Focusing on the architect/operator audience first was correct. Executive-facing polish is a v1.1/v2 concern.

**Improvements:** Add a "run summary for executives" export mode that produces a 1-page PDF with key findings, risk summary, and cost insights in plain language.

---

### Differentiability — Score: 74 | Weight: 4 | Weighted: 2.64 | Deficiency: 0.93

**Justification:** ArchLucid has genuine differentiation: (a) the structured architecture request → multi-agent pipeline → golden manifest → commit lifecycle is unique among shipped products, (b) the advisory-only Terraform emit with explicit never-apply constraint is a novel trust posture, (c) **optional** read-only / customer-operated ingest patterns (e.g. export packages — vendor does not require buyer cloud tenancy for SaaS), (d) the governance layer (approvals, pre-commit gates, policy packs, segregation of duties) applied to architecture manifests is not replicated in developer portals or EA tools, and (e) the explainability trace coverage (5/5 for most finding engines) with completeness metrics is rigorous. The competitive positioning is credible. **Not a V1 score penalty:** absence of *public* customer stories (V1.1). Remaining nuance: buyers still need demos or pilots to **feel** the difference — that is motion and real-LLM evidence, not published references.

**Tradeoffs:** Deep product differentiation was chosen over fast market entry. This is sound if the sales cycle can convey the nuance.

**Improvements:** Create a 3-minute demo video showing the full pilot path with real-LLM output to make the differentiation tangible.

---

### Trustworthiness — Score: 73 | Weight: 3 | Weighted: 1.96 | Deficiency: 0.72

**Justification:** Trust posture is strong: (a) database-per-tenant isolation (not just RLS), (b) append-only audit with SQL DENY UPDATE/DELETE and 174 typed events, (c) explicit execution mode labeling (Real/Simulator/Fallback/Mixed — never "unknown"), (d) advisory-only Terraform (never apply/destroy), (e) trust center with honest gap disclosure, (f) content safety guard enforced in production, (g) prompt redaction before LLM calls, (h) STRIDE threat model. The SOC 2 self-assessment and roadmap are honest about the gap. The trust center is unusually transparent for a pre-revenue product. Deductions: no third-party pen test (V2, not penalized), no CPA SOC 2 (post-V1.1, not penalized per scope rules). **`(A)` does not** treat missing in-repo **production burn-in** as a Trustworthiness defect — see header rescoring note.

**Tradeoffs:** Investing heavily in trust infrastructure before revenue was deliberate and defensible for the enterprise market.

**Improvements:** Complete the owner-conducted pen-test exercise (2026-Q2) and publish results in the trust center.

---

### Traceability — Score: 74 | Weight: 3 | Weighted: 1.98 | Deficiency: 0.70

**Justification:** The traceability story is strong: (a) every finding has an ExplainabilityTrace with 5 fields (GraphNodeIdsExamined, RulesApplied, DecisionsTaken, AlternativePathsConsidered, Notes) — most engines at 5/5, (b) agent execution traces with ParsedResultJson are persisted and queryable, (c) audit events carry RunId, ManifestId, CorrelationId for cross-cutting forensics, (d) the authority pipeline emits OpenTelemetry spans with stage names, (e) cost recommendations can cite metadata from **optional** buyer-supplied read-only export packages when those artifacts are used, (f) comparison records preserve the full payload for replay and verification drift analysis. The V1 requirements test traceability matrix maps scope items to tests. Gap: some orchestration paths still emit baseline mutation audit (log-only) rather than durable audit (SQL) — documented in AUDIT_COVERAGE_MATRIX.md as a known design decision, not a bug.

**Tradeoffs:** Comprehensive traceability adds storage and complexity. The design choice to have both durable and baseline audit channels is well-reasoned (TB-001).

**Improvements:** None urgent — traceability is among the strongest qualities.

---

### Usability — Score: 68 | Weight: 3 | Weighted: 1.82 | Deficiency: 0.86

**Justification:** The operator UI has progressive disclosure (Pilot → Operate Analysis → Operate Governance), a seven-step architecture request wizard, run progress tracking with aria-live, destructive action confirmations via Radix Alert Dialog, and role-aware shaping. The CLI supports diagnostics and support bundles for operators and integrators; the **primary buyer surface remains the hosted operator UI**. However: (a) the UI is an "operator shell" — functional but not beautiful or polished for a commercial SaaS audience, (b) cognitive load for new users is high with 270+ docs and a large configuration surface, and (c) the product concept (architecture request → manifest → findings → commit) requires learning a novel workflow. **`(A)` does not** treat the absence of formal moderated usability studies (e.g. 3–5 target-persona sessions) or of committed UX-research write-ups as a Usability defect — see header rescoring note.

**Tradeoffs:** Prioritizing functional completeness over UX polish was appropriate for the stage. The progressive disclosure model is the right pattern.

**Improvements:** Improve empty states and first-run guidance in the operator UI as shipping priorities allow.

---

### Workflow Embeddedness — Score: 67 | Weight: 3 | Weighted: 1.79 | Deficiency: 0.88

**Justification:** Integration surface is broad: (a) REST API with OpenAPI contract, (b) CLI, (c) outbound webhooks with CloudEvents, (d) Azure Service Bus integration events, (e) SCIM 2.0 provisioning, (f) Microsoft Teams and Slack notifications, (g) Azure DevOps PR decoration, (h) Jira and ServiceNow bidirectional ITSM sync, (i) Confluence publish, (j) optional read-only export-package ingest for voluntary buyer-supplied context, (k) customer-operated bridge recipes (Logic Apps, Power Automate). The connector readiness matrix shows most as "Shipped" or "Shipped + manual vendor." However: (a) ITSM connectors are newly shipped with manual vendor validation only — no automated live smoke tests against vendor sandboxes (TB-016), (b) the MCP ecosystem surface is V1.1, (c) CI/CD integration beyond Azure DevOps is recipe-only, and (d) the product does not embed into IDEs (VS Code extension is explicitly out of scope).

**Tradeoffs:** Building many connector surfaces before proving PMF risks wasted effort. The connector breadth does support the "enterprise embeddability" story.

**Improvements:** Provision Jira and ServiceNow sandbox accounts (TB-016) and wire recurring live smoke tests. Ship the Confluence publish connector smoke against a real Confluence Cloud instance.

---

### Architectural Integrity — Score: 78 | Weight: 3 | Weighted: 2.09 | Deficiency: 0.59

**Justification:** The architecture is well-structured: (a) clear project boundaries (Core has no persistence/host references, Application owns business logic, Persistence is Dapper-only), (b) single composition root (ArchLucid.Host.Composition), (c) 15 cataloged architecture invariants (INV-001 through INV-015) with enforcement waves planned, (d) ADR process with 35+ decisions, (e) the system/tenant database topology split is clean, (f) the authority pipeline stages are well-separated (context ingestion → graph → findings → decisioning → artifacts), (g) tenant identity is established once at the host boundary (INV-001 shipped with Roslyn analyzer ARCH001). Deductions: (a) some invariants hold by convention only — enforcement waves (TB-010/011/012) are pending, (b) the legacy coordinator path coexists with the authority pipeline (two mental models per the decision tree in ARCHITECTURE_FLOWS.md), and (c) the INV-004 (durable cost guardrails across replicas) is not yet enforced.

**Tradeoffs:** Maintaining the legacy coordinator path alongside the authority pipeline is technical debt but supports existing integration patterns.

**Improvements:** Complete TB-010 (Wave A: INV-005 startup validator parity, INV-006 composition root scan). The invariant enforcement program is well-designed — execute it.

---

### Security — Score: 76 | Weight: 3 | Weighted: 2.04 | Deficiency: 0.64

**Justification:** Security posture is strong for the stage: (a) OWASP ZAP baseline scan merge-blocking in CI + weekly schedule, (b) Schemathesis OpenAPI fuzzing merge-blocking, (c) Gitleaks pre-receive, (d) CodeQL analysis, (e) DevelopmentBypass production guard (fails fast if misconfigured in prod/staging), (f) content safety guard enforced in production, (g) prompt redaction before LLM, (h) database-per-tenant isolation, (i) private endpoint Terraform modules, (j) STRIDE threat model, (k) RBAC with four roles, (l) rate limiting partitioned by role, (m) SCIM threat model, (n) PII retention documented, (o) DSAR process template. Deductions: (a) owner-conducted pen testing only — no external assessment (V2, not penalized), (b) INV-001 shipped but other tenant boundary invariants are convention-only, (c) RLS object names still reference older tokens per BREAKING_CHANGES.md.

**Tradeoffs:** Automated security testing (ZAP, Schemathesis, CodeQL) is more repeatable than point-in-time assessments. The absence of an external pen test is a procurement friction point but not a shipped-product security gap.

**Improvements:** Complete the owner-conducted pen-test exercise and document findings.

---

### Auditability — Score: 79 | Weight: 2 | Weighted: 1.41 | Deficiency: 0.38

**Justification:** The audit system is comprehensive: (a) 174 typed audit event constants with CI anchor verification (assert_audit_const_count.py), (b) append-only SQL enforcement via DENY UPDATE/DELETE on dbo.AuditEvents, (c) CSV and JSON export with UTC range filtering and max-rows clamping, (d) paginated search with keyset cursor (OccurredUtc + EventId), (e) correlation ID and RunId indexed queries, (f) three retention tiers (hot/warm/cold), (g) governance workflow dual-writes to durable audit, (h) circuit breaker audit as fire-and-forget with scheduled logging. The known design decisions (baseline mutation audit as log-only for some orchestration paths, critical-path retry with DurableAuditLogRetry) are well-documented and defensible.

**Tradeoffs:** The dual-channel approach (durable SQL vs. baseline log) adds complexity but correctly separates transactional from informational audit.

**Improvements:** None urgent — auditability is a strong suit.

---

### Policy and Governance Alignment — Score: 72 | Weight: 2 | Weighted: 1.29 | Deficiency: 0.50

**Justification:** The governance layer is substantial: (a) approval workflow with segregation of duties (self-approval blocked), (b) SLA tracking on approvals with webhook escalation on breach, (c) pre-commit governance gate (blocks manifest commit when findings exceed severity thresholds), (d) versioned policy packs with scope assignments and effective governance resolution, (e) governance dashboard for cross-run pending approvals, (f) compliance drift trend tracking. This exceeds what most early-stage products offer. Deduction: governance features require explicit enablement and configuration — they are not "on by default" for new tenants, which means pilot customers may not experience them.

**Tradeoffs:** Making governance opt-in reduces friction for pilots but means the governance story is not self-evident.

**Improvements:** Create a governance quick-start that enables basic governance (pre-commit gate + one policy pack) with a single configuration toggle.

---

### Compliance Readiness — Score: 68 | Weight: 2 | Weighted: 1.21 | Deficiency: 0.57

**Justification:** Compliance materials are thorough: (a) SOC 2 self-assessment (SOC2_SELF_ASSESSMENT_2026.md), (b) SOC 2 roadmap with honest timeline (SOC2_ROADMAP.md), (c) CAIQ Lite pre-fill for CSA STAR, (d) SIG Core 2026 responses, (e) DPA template, (f) subprocessors register, (g) privacy policy and privacy note, (h) DSAR process, (i) PII retention documentation, (j) compliance matrix mapping. However: (a) no CPA SOC 2 attestation (intentionally post-V1.1 — not penalized per scope rules but noted), (b) no ISO 27001, (c) no HIPAA-specific controls (healthcare vertical brief exists but is positioning only), (d) VPAT 2.5 WCAG 2.1 AA is a draft.

**Tradeoffs:** Building compliance templates and self-assessment before revenue was forward-thinking. The gap to CPA attestation is a procurement timing issue, not a product gap.

**Improvements:** Finalize the VPAT 2.5 draft and publish as part of the trust center.

---

### Procurement Readiness — Score: 76 | Weight: 2 | Weighted: 1.36 | Deficiency: 0.43

**Justification:** Procurement materials are extensive: (a) procurement FAQ, (b) procurement fast lane, (c) procurement evidence pack index, (d) procurement response accelerator, (e) procurement objection playbook, (f) MSA template, (g) DPA template, (h) order form template, (i) pilot buyer safe evidence template, (j) how-to-request-procurement-pack guide, (k) SOC 2 procurement status page. The procurement pack cover and evidence pack are well-structured. **Not scored as a V1 product gap:** inability to cite a **published** named reference customer (V1.1 milestone per `V1_DEFERRED.md` §6b); templates and self-assessment posture are the intended V1 answer. **`(A)` does not** treat an incomplete **first** buyer-side procurement cycle or lack of in-repo “pack refinement after first deal” notes as a Procurement Readiness defect — see header rescoring note. Remaining **(B) informational** friction: no CPA SOC 2 report to attach (`SOC2_STATUS_PROCUREMENT.md`); no third-party pen-test summary (V2). Those stay out of the V1 headline score per scope rules but still slow some RFPs.

**Tradeoffs:** Building the procurement pack before revenue accelerates first-deal cycles; some buyers will still ask for artifacts reserved for V1.1/V2.

**Improvements:** Keep templates current as law and subprocessors change (standing product hygiene). Optional pack tweaks after real RFP patterns emerge are **`(B)`**, not a scored **`(A)`** gate.

---

### Interoperability — Score: 69 | Weight: 2 | Weighted: 1.23 | Deficiency: 0.55

**Justification:** Integration breadth is good (see Workflow Embeddedness above). The OpenAPI contract is the canonical interface with generated .NET and TypeScript clients. CloudEvents envelope for webhooks follows a standard. SCIM 2.0 for provisioning is standards-compliant. The integration event catalog is machine-readable JSON. However: (a) ITSM connectors use basic auth for V1 MVP (OAuth is follow-on), (b) the product is Azure-specific — no AWS or GCP extraction path, (c) the architecture request input format is proprietary, (d) there is no standard architecture description language import/export (e.g., C4, TOGAF, ArchiMate), (e) MCP is V1.1.

**Tradeoffs:** Azure-native focus was deliberate. Proprietary input format is unavoidable for a novel product category.

**Improvements:** Document the architecture request schema publicly for integrators.

---

### Reliability — Score: 75 | Weight: 2 | Weighted: 1.34 | Deficiency: 0.45

**Justification:** Reliability mechanisms include: (a) circuit breakers on LLM calls with state transition metrics, (b) fallback completion client (primary → secondary provider), (c) retry policies on outbound HTTP, (d) graceful degradation documented (DEGRADED_MODE.md) with feature availability matrix, (e) health endpoints (live/ready/detailed), (f) DurableAuditLogRetry for critical audit paths, (g) BillingProductionSafetyRules for commerce fail-closed, (h) startup validation that fails fast on misconfiguration. **`(A)` does not** penalize for absent **multi-region active/active** when that is **out of V1** / a documented non-goal — see header rescoring note. Remaining deductions: (a) the simmy chaos engineering workflow exists but is scheduled/manual, (b) the reliability drill is scheduled rather than continuous.

**Tradeoffs:** Investing in graceful degradation over multi-region was appropriate for the stage.

**Improvements:** Increase chaos and drill **frequency** when operational **`(B)`** goals warrant; multi-region depth stays **out of `(A)`** V1 scoring per scope.

---

### Data Consistency — Score: 70 | Weight: 2 | Weighted: 1.25 | Deficiency: 0.54

**Justification:** Data consistency mechanisms: (a) DbUp migrations for schema management, (b) greenfield SQL boot tests verify migration ordering, (c) the authority pipeline uses transactional finalization (FinalizeCommittedPipelineAsync), (d) comparison replay has artifact/regenerate/verify modes with drift analysis, (e) the ComparisonRecords run-id GUID + FK migration (TB-006) is shipped, (f) audit events have CI-verified constant counts. Deductions: (a) the dual-path architecture (authority pipeline vs legacy coordinator) could produce inconsistent states if both paths are accidentally mixed on the same run (documented as an anti-pattern), (b) INV-004 (durable cost guardrails across replicas) is not enforced — per-process-only token trackers could drift in multi-replica scenarios, (c) INV-012 (single quality-gate truth) is not yet enforced.

**Tradeoffs:** The authority pipeline transaction model is sound. The legacy coordinator path is transitional debt.

**Improvements:** Enforce INV-004 (durable cost guardrails) — this directly affects multi-replica correctness for budget accounting.

---

### Maintainability — Score: 75 | Weight: 2 | Weighted: 1.34 | Deficiency: 0.45

**Justification:** The codebase shows good maintainability practices: (a) each class in its own file, (b) clear project boundaries, (c) Dapper for data access (no heavy ORM), (d) extensive documentation (270+ docs), (e) contributor code map, (f) C# house style documented, (g) architecture tests, (h) the TECH_BACKLOG prioritizes items systematically. Deductions: (a) documentation volume is high, which itself creates maintenance burden, (b) some docs reference earlier product names (rename Phase 7 items), (c) 15 invariants that hold by convention create implicit maintenance obligations.

**Tradeoffs:** Thorough documentation is both an asset and a liability — it must be maintained.

**Improvements:** Complete TB-013 (documentation library audience split) to reduce contributor cognitive load.

---

### Explainability — Score: 77 | Weight: 2 | Weighted: 1.38 | Deficiency: 0.41

**Justification:** Explainability is a standout quality: (a) ExplainabilityTrace with 5 fields per finding, most engines at 5/5 coverage, (b) ExplainabilityTraceCompletenessAnalyzer with property-based tests, (c) explanation faithfulness checker (heuristic token overlap), (d) advisory scan ResultJson includes traceCompleteness, (e) aggregate explanation endpoint, (f) OTEL histogram for trace completeness ratio. The system can explain why it produced each finding with rule citations, decision traces, and alternative paths considered.

**Tradeoffs:** The faithfulness checker is heuristic (token overlap, not semantic entailment) — acknowledged as a coarse signal.

**Improvements:** None urgent — explainability is among the strongest qualities.

---

### Azure Compatibility and SaaS Deployment Readiness — Score: 76 | Weight: 2 | Weighted: 1.36 | Deficiency: 0.43

**Justification:** Azure alignment is deep: (a) Terraform modules for Container Apps, SQL, Key Vault, Front Door, WAF, APIM, private endpoints, Entra ID, ACR, (b) docker-compose profiles for **local development and CI** (not the SaaS buyer onboarding path), (c) CD pipeline (cd.yml, cd-staging-on-merge.yml, cd-saas-greenfield.yml) with post-deploy validation, (d) deployment runbook for failed deploys and rollback, (e) reference SaaS stack ordering doc, (f) production profile preflight script, (g) SLA targets (99.9% monthly availability), (h) database-per-tenant topology with elastic pools. **`(A)` does not** treat lack of committed **production/staging burn-in** evidence in-repo as a deployment-readiness defect — IaC + CD + runbooks are the V1 artifact bar; see header rescoring note. Remaining deductions: (a) Terraform state mv for rename (Phase 7.5) is pending, (b) ACR production image push is not yet in CI.

**Tradeoffs:** The infrastructure-as-code investment is substantial; live burn-in narrative is **`(B)`** / ops storytelling as environments harden.

**Improvements:** Close Phase 7.5 Terraform rename migration and wire ACR production image push in CI per backlog.

---

### Decision Velocity — Score: 66 | Weight: 2 | Weighted: 1.18 | Deficiency: 0.61

**Justification:** Decision velocity materials exist: (a) pricing page with quote-request form, (b) order form template, (c) decision fast lane guide, (d) steering decision memo template, (e) one-email kit, (f) procurement fast lane. The sales-led motion has a clear path from quote to order. However: (a) no self-serve **live** checkout (commerce un-hold is V1.1), (b) hosted trial exists but **production-like** evaluation and procurement-heavy buyers often still need sales/solutions support, (c) the product requires an architecture request as input — the buyer must understand what they're buying before they can evaluate it, (d) no free tier or freemium model for organic discovery.

**Tradeoffs:** Sales-led is appropriate for the price point ($436-$2,331+/month). Self-serve is a v1.1 multiplier.

**Improvements:** Enable Stripe TEST-mode checkout on staging so prospects can complete a trial signup without sales intervention.

---

### Commercial Packaging Readiness — Score: 71 | Weight: 2 | Weighted: 1.27 | Deficiency: 0.52

**Justification:** Packaging is well-defined: (a) three tiers (Team/Professional/Enterprise) with clear feature gates, (b) pricing guards in CI (check_pricing_single_source.py, assert_marketplace_pricing_alignment.py), (c) tenant tier enforcement in code ([RequiresCommercialTenantTier] → 402), (d) run allowances per tier, (e) audit retention tiering per tier, (f) Marketplace alignment doc. Deductions: (a) commerce un-hold is V1.1, (b) the tier enforcement in the UI is via progressive disclosure rather than hard gates on all features, (c) LLM monthly budget top-up SKU (TB-014) is not shipped.

**Tradeoffs:** Building the enforcement layer before go-live was correct.

**Improvements:** Ship TB-014 (LLM monthly budget top-up) before the first paying customer to avoid a hard-cut cliff.

---

### Availability — Score: 78 | Weight: 1 | Weighted: 0.70 | Deficiency: 0.20

**Justification:** Availability mechanisms: (a) 99.9% SLO with Prometheus burn-rate alerts, (b) synthetic probe workflow, (c) health endpoints, (d) Container Apps auto-scaling, (e) SQL failover group Terraform module available, (f) degraded-mode design. **`(A)` does not** penalize because live **production** has not run long enough to “prove” the SLO in the field, **nor** for **multi-region active/active** being **out of V1** — see header rescoring note. Remaining nuance: RTO/RPO targets are documented; live failover exercises are **`(B)`** / operational maturity when scheduled.

---

### Performance — Score: 69 | Weight: 1 | Weighted: 0.62 | Deficiency: 0.28

**Justification:** Performance evidence: (a) merge-blocking k6 CI smoke with per-tag budgets, (b) weekly per-tenant burst test, (c) soak test, (d) in-process performance baselines (CorePilotFlowPerformanceTests), (e) latency tiers documented (Tier 1 < 300ms p95, Tier 2 < 800ms p95, Tier 3 < 8s p95), (f) BenchmarkDotNet in ArchLucid.Benchmarks, (g) HotPathCache with optional Redis. Deductions: (a) all CI performance is against simulator, not real LLM, (b) performance baselines are pilot-scale only — no evidence of behavior under sustained multi-tenant load.

---

### Scalability — Score: 65 | Weight: 1 | Weighted: 0.58 | Deficiency: 0.31

**Justification:** Scalability design: (a) Container Apps with auto-scaling, (b) database-per-tenant with elastic pools, (c) Worker host for background pipelines, (d) optional Redis for multi-replica cache coherence, (e) async authority pipeline with queue. Deductions: (a) no distributed graph projection cache (V2), (b) per-process-only cost trackers in multi-replica (INV-004 not enforced), (c) no load evidence beyond pilot-scale profiles.

---

### Supportability — Score: 72 | Weight: 1 | Weighted: 0.64 | Deficiency: 0.25

**Justification:** Support tooling: (a) CLI doctor command, (b) support bundle generation, (c) correlation IDs on all requests, (d) troubleshooting runbook, (e) /version endpoint, (f) /health detailed JSON for operators. Good for the stage.

---

### Manageability — Score: 70 | Weight: 1 | Weighted: 0.62 | Deficiency: 0.27

**Justification:** Configuration is well-documented (CONFIGURATION_REFERENCE.md) with startup validation rules and fail-fast behavior. Feature flags via FeatureManagement. Tenant management APIs. Deduction: configuration surface is large.

---

### Deployability — Score: 71 | Weight: 1 | Weighted: 0.63 | Deficiency: 0.26

**Justification:** Container images, Terraform modules, CD pipeline, deployment runbook, rollback procedure, and deployment-evidence CLI — aligned to **Azure-hosted SaaS** and optional dedicated deployments. Compose remains for dev/CI and self-host scenarios; it is not the SaaS buyer quickstart.

---

### Observability — Score: 73 | Weight: 1 | Weighted: 0.65 | Deficiency: 0.24

**Justification:** Rich instrumentation: (a) OpenTelemetry with custom meter, (b) histograms for pipeline stages, agent output quality, circuit breakers, LLM usage, (c) Application Insights, OTLP, and Prometheus export paths, (d) Prometheus alert rules for agent quality, (e) observability export readiness report script, (f) archlucid_audit_write_failures_total counter. Deduction: TB-004 (wire exporters and verify in a real deployment) is not completed.

---

### Testability — Score: 78 | Weight: 1 | Weighted: 0.70 | Deficiency: 0.20

**Justification:** Exceptional test infrastructure: (a) multi-tier test structure (Core/Fast-Core/Integration/Slow/Full), (b) WebApplicationFactory integration tests, (c) FsCheck property-based tests, (d) golden fixture baselines with CI guard, (e) OpenAPI contract snapshot tests, (f) Playwright E2E (mock + live API), (g) Vitest unit tests for UI, (h) jest-axe accessibility testing, (i) Stryker mutation testing (scheduled + PR), (j) k6 performance tests, (k) eval corpus for agent output, (l) greenfield SQL boot tests. 29 CI workflows.

---

### Modularity — Score: 76 | Weight: 1 | Weighted: 0.68 | Deficiency: 0.21

**Justification:** ~55 projects with clear boundaries. Core has no host/persistence references. The plugin sample finding engine demonstrates extensibility. Single composition root principle (INV-006). Clean project dependency graph.

---

### Extensibility — Score: 68 | Weight: 1 | Weighted: 0.61 | Deficiency: 0.29

**Justification:** Extension points: (a) IFindingEngine for custom finding engines, (b) plugin sample, (c) webhooks and integration events for external consumers, (d) policy packs for governance customization. Deductions: (a) no public extension SDK, (b) MCP is V1.1, (c) no marketplace for third-party plugins.

---

### Evolvability — Score: 72 | Weight: 1 | Weighted: 0.64 | Deficiency: 0.25

**Justification:** The architecture supports evolution: (a) ADR process, (b) architecture invariant catalog, (c) clean module boundaries, (d) the strangler plan (ADR 0021) for coordinator → authority migration, (e) schema-versioned optional ingest package formats, (f) OpenAPI contract drift detection. The product can evolve without breaking.

---

### Documentation — Score: 74 | Weight: 1 | Weighted: 0.66 | Deficiency: 0.23

**Justification:** Documentation is extensive (270+ files) and well-organized with a five-document onboarding spine, scope headers on every file, and CI enforcement of doc structure. However: (a) volume creates cognitive load, (b) TB-013 (audience split) is not complete, (c) some docs are contributor-facing mixed with buyer-facing content.

---

### Azure Ecosystem Fit — Score: 75 | Weight: 1 | Weighted: 0.67 | Deficiency: 0.22

**Justification:** Deep Azure alignment: Entra ID, Azure SQL, Key Vault, Container Apps, Front Door, APIM, Azure OpenAI, Application Insights, Azure Service Bus, Azure Blob Storage. Terraform modules for all. Marketplace SaaS offer prepared (in preview/test).

---

### Cognitive Load — Score: 58 | Weight: 1 | Weighted: 0.52 | Deficiency: 0.38

**Justification:** The system imposes significant cognitive load: (a) 270+ docs to navigate, (b) novel product concept (architecture request → manifest → findings → commit), (c) two execution paths (authority pipeline vs legacy coordinator) with a decision tree, (d) large configuration surface, (e) progressive disclosure in UI helps but the underlying model complexity remains, (f) governance features require understanding policy packs, approval workflows, and pre-commit gates. The operator atlas and decision guide help but cannot fully compensate.

**Improvements:** TB-013 (doc audience split), simplify the first-run experience, default governance configuration.

---

### Cost-Effectiveness — Score: 67 | Weight: 1 | Weighted: 0.60 | Deficiency: 0.29

**Justification:** Cost awareness: (a) per-tenant cost model documented, (b) LLM monthly budget with hard-cut per tenant, (c) capacity and cost playbook, (d) cost guide for buyers, (e) Azure Retail Prices API integration for citation. Deductions: (a) per-agent token dimensions (TB-015) not shipped — cost attribution is opaque, (b) LLM budget top-up SKU (TB-014) not shipped — hard-cut without recourse, (c) trial orphaned-catalog teardown (TB-017) is a backlog item.

---

### Accessibility — Score: 60 | Weight: 1 | Weighted: 0.54 | Deficiency: 0.36

**Justification:** Accessibility work: (a) WCAG 2.2 AA target, (b) eslint-plugin-jsx-a11y, (c) jest-axe component tests (ui-axe-components CI job), (d) live axe in E2E tests, (e) VPAT 2.5 draft exists, (f) Radix UI components with focus trapping, (g) aria-live regions for progress tracking. Deductions: (a) VPAT is draft/not finalized, (b) no user testing with assistive technologies, (c) accessibility audit doc exists but is not comprehensive.

---

### Customer Self-Sufficiency — Score: 64 | Weight: 1 | Weighted: 0.57 | Deficiency: 0.32

**Justification:** Self-sufficiency tools: (a) CLI doctor and support-bundle, (b) pilot guide and operator quickstart, (c) troubleshooting runbook, (d) ITSM bridge recipes for customer-operated integrations, (e) optional voluntary ingest paths where buyers choose to supply read-only material. Deductions: (a) self-serve trial is TEST mode only, (b) product learning "brains" are deferred, (c) onboarding requires sales-engineer assistance for real-LLM setup.

---

### Change Impact Clarity — Score: 71 | Weight: 1 | Weighted: 0.63 | Deficiency: 0.26

**Justification:** Change impact is well-communicated: (a) breaking changes document, (b) OpenAPI contract drift detection, (c) comparison runs with structured deltas, (d) compliance drift trend, (e) rename checklist with phased approach. The product helps operators understand what changed between runs.

---

### Stickiness — Score: 62 | Weight: 1 | Weighted: 0.55 | Deficiency: 0.34

**Justification:** Stickiness mechanisms: (a) committed golden manifests accumulate value over time, (b) comparison across runs builds institutional memory, (c) audit trail is a compliance asset, (d) governance configurations are effort to recreate, (e) ITSM correlations create cross-system dependencies. However: (a) the product learning bridge (deferred "brains") would be a major stickiness driver but is not shipped, (b) no network effects or community features. **`(A)` does not** deduct because there is not yet **production-tenure** “stickiness data” in-repo — that is **`(B)`** customer lifecycle evidence.

---

### Template and Accelerator Richness — Score: 58 | Weight: 1 | Weighted: 0.52 | Deficiency: 0.38

**Justification:** Templates: (a) ITSM bridge recipe templates, (b) procurement templates (MSA, DPA, order form), (c) integration recipe templates, (d) pen-test SoW/summary templates, (e) ROI model template. However: (a) no architecture request templates for common scenarios (e.g., "review my microservices migration"), (b) no pre-built policy pack library, (c) no Terraform module templates for common customer architectures.

---

## 3. Score Summary Table

| Quality | Score | Weight | Weighted | Deficiency |
|---------|-------|--------|----------|------------|
| Marketability | 68 | 8 | 4.86 | 2.29 |
| Correctness | 64 | 8 | 4.57 | 2.57 |
| AI/Agent Readiness | 66 | 8 | 4.71 | 2.43 |
| Time-to-Value | 68 | 7 | 4.25 | 2.00 |
| Adoption Friction | 68 | 6 | 3.64 | 1.71 |
| Proof-of-ROI Readiness | 72 | 5 | 3.21 | 1.25 |
| Executive Value Visibility | 65 | 4 | 2.32 | 1.25 |
| Differentiability | 74 | 4 | 2.64 | 0.93 |
| Decision Velocity | 66 | 2 | 1.18 | 0.61 |
| Commercial Packaging Readiness | 71 | 2 | 1.27 | 0.52 |
| Stickiness | 62 | 1 | 0.55 | 0.34 |
| Template and Accelerator Richness | 58 | 1 | 0.52 | 0.38 |
| Traceability | 74 | 3 | 1.98 | 0.70 |
| Usability | 68 | 3 | 1.82 | 0.86 |
| Workflow Embeddedness | 67 | 3 | 1.79 | 0.88 |
| Trustworthiness | 73 | 3 | 1.96 | 0.72 |
| Auditability | 79 | 2 | 1.41 | 0.38 |
| Policy and Governance Alignment | 72 | 2 | 1.29 | 0.50 |
| Compliance Readiness | 68 | 2 | 1.21 | 0.57 |
| Procurement Readiness | 76 | 2 | 1.36 | 0.43 |
| Interoperability | 69 | 2 | 1.23 | 0.55 |
| Accessibility | 60 | 1 | 0.54 | 0.36 |
| Customer Self-Sufficiency | 64 | 1 | 0.57 | 0.32 |
| Change Impact Clarity | 71 | 1 | 0.63 | 0.26 |
| Architectural Integrity | 78 | 3 | 2.09 | 0.59 |
| Security | 76 | 3 | 2.04 | 0.64 |
| Reliability | 75 | 2 | 1.34 | 0.45 |
| Data Consistency | 70 | 2 | 1.25 | 0.54 |
| Maintainability | 75 | 2 | 1.34 | 0.45 |
| Explainability | 77 | 2 | 1.38 | 0.41 |
| Azure Compatibility and SaaS Deployment Readiness | 76 | 2 | 1.36 | 0.43 |
| Availability | 78 | 1 | 0.70 | 0.20 |
| Performance | 69 | 1 | 0.62 | 0.28 |
| Scalability | 65 | 1 | 0.58 | 0.31 |
| Supportability | 72 | 1 | 0.64 | 0.25 |
| Manageability | 70 | 1 | 0.62 | 0.27 |
| Deployability | 71 | 1 | 0.63 | 0.26 |
| Observability | 73 | 1 | 0.65 | 0.24 |
| Testability | 78 | 1 | 0.70 | 0.20 |
| Modularity | 76 | 1 | 0.68 | 0.21 |
| Extensibility | 68 | 1 | 0.61 | 0.29 |
| Evolvability | 72 | 1 | 0.64 | 0.25 |
| Documentation | 74 | 1 | 0.66 | 0.23 |
| Azure Ecosystem Fit | 75 | 1 | 0.67 | 0.22 |
| Cognitive Load | 58 | 1 | 0.52 | 0.38 |
| Cost-Effectiveness | 67 | 1 | 0.60 | 0.29 |
| **TOTAL** | | **112** | **69.82** | **30.18** |

---

## 4. Top 10 Most Important Weaknesses

Ranked from most serious to least serious, cross-cutting across quality dimensions.

### 1. No live real-LLM correctness evidence

The single most critical gap. The product's core value — architecture findings from AI agents — has never been validated against live Azure OpenAI in any documented environment. All CI and evaluation runs use the deterministic simulator or committed exemplar JSON. The golden cohort gate evidence from 2026-05-09 explicitly states the live path was blocked. This undermines Correctness, AI/Agent Readiness, and Trust in model-backed outputs (distinct from **V1.1** public reference / case-study marketing).

### 2. Self-serve evaluation path is not functional

A prospect often still needs sales or solutions help to complete a **production-like** evaluation while Stripe/Marketplace **live** un-hold is V1.1. Rich **optional** evidence packs (beyond standard SaaS onboarding) may still be solutions-led. Friction here is **commerce and evaluation gates**, not local Docker documentation labels — **`(A)` does not** score that hygiene (see header rescoring note). This affects Time-to-Value, Adoption Friction, Decision Velocity, and Marketability.

### 3. ITSM and documentation connectors have no production burn-in

The Jira, ServiceNow, Confluence, and Slack connectors are freshly shipped with automated tests against mocks/fixtures and "manual vendor" validation status. No recurring live smoke tests against vendor sandboxes exist (TB-016 is backlog). This creates risk for Workflow Embeddedness, Interoperability, and Trustworthiness in enterprise integration scenarios.

### 4. LLM cost attribution per agent type is opaque

TB-015 (per-agent/per-invoke-kind token dimensions) is not shipped. Operators cannot see which agent (Topology/Cost/Compliance/Critic) consumes what portion of the LLM budget. Combined with the unshipped budget top-up SKU (TB-014), this creates a cost surprise risk. Affects Cost-Effectiveness, Manageability, and commercial trust.

### 5. Cognitive load for new users is high

270+ docs, a novel product concept, two execution paths (authority vs legacy coordinator), a large configuration surface, and governance features that require explicit enablement create a steep learning curve. The five-doc onboarding spine and progressive disclosure help but cannot fully compensate. Affects Usability, Adoption Friction, Time-to-Value, and Customer Self-Sufficiency.

### 6. Multi-replica cost guardrails not enforced

INV-004 (durable cost guardrails across replicas) is cataloged but not enforced. Per-process-only LLM budget trackers could allow budget overruns in multi-replica Container Apps deployments. This is a data consistency and cost risk that grows with scale. Affects Data Consistency, Cost-Effectiveness, Reliability.

### 7. Marketing surface is underdeveloped

The product's public face is still largely the operator shell with a pricing page, not a purpose-built marketing funnel. No SEO enrichment (TB-020), limited product tour content, and no demo video. **Not scored as a V1 gap:** absence of published testimonials or reference customers (V1.1). Organic discovery remains weak for other reasons (SEO, niche vocabulary). Affects Marketability, Time-to-Value, Decision Velocity.

### 8. Architecture request input requires novel user behavior

The product asks users to create a "structured architecture request" — a concept that does not exist in most organizations' current workflows. There are no templates for common scenarios (e.g., "review this cloud migration plan"). This raises Adoption Friction and reduces Time-to-Value for prospects who do not already think in terms of structured architecture briefs.

### 9. Accessibility posture is draft-quality

The VPAT 2.5 is a draft, not finalized. No user testing with assistive technologies has been documented. While the component-level axe testing and eslint a11y plugin are good foundations, enterprise procurement (especially government) may require a published VPAT. Affects Accessibility, Procurement Readiness, Compliance Readiness.

### 10. Legacy coordinator path creates architectural dualism

The authority pipeline and legacy coordinator path coexist, requiring a decision tree (ARCHITECTURE_FLOWS.md Flow A1) and anti-pattern documentation. This adds cognitive load for contributors and creates risk for operational confusion. ADR 0021 (strangler plan) exists but the migration is incomplete.

---

## 5. Top 5 Monetization Blockers

### 1. Revenue motion and pricing hypotheses not yet validated by signed commercial outcomes

List pricing, discount policy, and order-form choreography are designed, but **repeatable revenue** and procurement-in-the-wild feedback still depend on closing deals. That is normal pre-scale commercial work. **`(A)` does not** treat the absence of an **in-repo** completed-buyer-pilot file pack as a product defect for Proof-of-ROI (see header rescoring note); **(B)** still notes that until contracts close, revenue is unproven.

### 2. Self-serve commerce is not live

The Stripe checkout and Marketplace listing are in TEST mode. The commerce un-hold (V1.1) means every sale requires manual order-form processing. This limits deal velocity and eliminates PLG-sourced revenue.

### 3. LLM hard-budget cliff without top-up

When a tenant exhausts LlmMonthlyTenantDollarBudget, they are hard-cut until the next UTC month (TB-014 not shipped). This creates a terrible experience for legitimate heavy users and blocks expansion revenue from high-value customers.

### 4. Architecture request concept requires buyer education

The product asks buyers to adopt a new workflow concept. Without architecture request templates, the buyer must figure out what to submit. This extends sales cycles and increases CAC.

### 5. Weak organic discovery channel

With no SEO (TB-020), no demo video, and no community presence, inbound demand depends heavily on outbound sales. **Not a V1 scored gap:** missing public case studies or testimonials (V1.1). CAC stays high for non-reference reasons until demand-gen assets ship.

---

## 6. Top 6 Enterprise Adoption Blockers

### 1. No CPA SOC 2 attestation (post-V1.1, not penalized but real friction)

Enterprise procurement teams increasingly require SOC 2 Type II. The self-assessment and roadmap are honest, but "we plan to get SOC 2 eventually" loses deals against vendors who have it. (B) informational — not weighted against (A).

### 2. ITSM connector reliability is unproven

Enterprise buyers will ask "does your Jira/ServiceNow integration work in production?" The answer is "it works in our automated tests with mocks and we've done manual vendor validation." This is not the answer that closes enterprise deals.

### 3. Reference deployment narrative (**`(B)`**, not **`(A)`**)

Some enterprise buyers want a **named** “how Company X runs this in production” story. That is **`(B)`** social proof / implementation comfort, not a V1 **`(A)`** gap for IaC + CD + runbooks — see **production burn-in** rescoring note. Mitigation: architecture diagrams, Terraform modules, deployment runbook, and honest trust center.

### 4. Generic OIDC integration is configuration-only

While the product supports any OIDC issuer (V1 GA), there are no turnkey admin wizards or documented step-by-step guides for non-Entra IdPs (Okta, Auth0, Ping). Enterprise buyers with Okta will need to figure out claim mapping themselves.

### 5. VPAT/accessibility compliance is draft

Government and regulated enterprise procurement may require a published VPAT. The current draft status creates a blocker for these segments.

### 6. Multi-region / active-active depth (**`(B)`**, not V1 **`(A)`**)

Buyers with strict **data residency** or **active/active** expectations may push for multi-region stories. Multi-region active/active is **not** a V1 **`(A)`** commitment in this assessment’s scope framing — **`(A)`** does not require live multi-region evidence; single-region Terraform + module inventory is the rated bar. **`(B)`** may still require dialogue and roadmap honesty.

---

## 7. Top 6 Engineering Risks

### 1. Real-model output drift undetected

If Azure OpenAI model versions change (e.g., GPT-4o update), the agent pipeline's output could silently degrade. There is no scheduled CI job exercising real-model completions, so drift would only be caught by manual operator testing.

### 2. Multi-replica budget overrun

INV-004 is unenforced. In a Container Apps deployment with multiple API replicas, concurrent requests could exceed the per-tenant LLM dollar budget because each process tracks usage independently. This is a financial integrity risk.

### 3. Legacy coordinator path confusion

The coexistence of two execution paths (authority pipeline vs. legacy coordinator) creates risk of accidental mixing, which the ARCHITECTURE_FLOWS.md anti-pattern section explicitly warns about. A misrouted request could produce a 409/400 or silently bypass the authority pipeline's quality gate.

### 4. Connector secret management at scale

ITSM and chat-ops connectors store secret references (Key Vault secret names) in SQL. At multi-tenant scale, the blast radius of a Key Vault misconfiguration or rotation failure could affect multiple tenants' integrations simultaneously. There is no documented rotation runbook for connector secrets.

### 5. Migration ordering between DbUp and SqlSchemaBootstrapper

The greenfield SQL boot tests exist precisely because this is a known failure mode. An ordering bug between DbUp migrations and the schema bootstrapper could prevent new tenant database provisioning. The test exists — but only covers one boot sequence.

### 6. Startup validation coverage gap

INV-005 (production host fail-closed) is partially enforced. The StartupValidatorTests exist but the "catalog parity" check (diff ConfigurationKeyCatalog vs. validator registry) is not yet in CI. A new configuration key could be added without a corresponding startup validation rule, allowing misconfigured production boots.

---

## 8. Most Important Truth

**ArchLucid is a well-engineered product whose model-backed correctness has not been validated with live Azure OpenAI in documented automation** (golden cohort evidence: credentials absent there). The engineering, documentation, security, and governance posture are unusually mature for a pre-scale SaaS — genuinely impressive in depth and rigor. **`(A)` does not** score down Proof-of-ROI for missing an **in-repo** trail of a completed buyer pilot, **nor** for choosing not to commit anonymized pilot artifacts — pilots and outcomes may exist off-repo or under confidentiality, and git is not the rated evidence store. The single highest-leverage technical action remains to run real-LLM evaluation (TB-007 / golden cohort). Separately, **(B)** / sales may hold metrics under policy without any **`(A)`** implication.

---

## 9. Top Improvement Opportunities

### Improvement 1: Run Golden Cohort Gate with Live Azure OpenAI

**Title:** Complete Real-LLM Golden Cohort Gate Evidence

**Why it matters:** The product's correctness claims rest entirely on simulator/exemplar validation. A single documented real-LLM session would validate or invalidate the core value proposition and unblock TB-007.

**Expected impact:** Directly improves Correctness (+8-12 pts), AI/Agent Readiness (+6-10 pts), Trustworthiness (+3-5 pts). Weighted readiness impact: +1.2-2.0%.

**Affected qualities:** Correctness, AI/Agent Readiness, Trustworthiness

**Indirect (sales / pricing narrative):** Proof-of-ROI collateral may be easier to populate after real runs; missing in-repo pilot files **or** a decision not to commit anonymized pilot excerpts are **not** scored **`(A)`** gaps per the buyer-pilot documentation rescoring note.

**Status:** DEFERRED

**Reason:** Requires Azure OpenAI credentials (endpoint, API key, deployment name) in an Azure subscription **the service operator controls** (e.g. GitHub Actions secrets for CI) — **not** a buyer subscription; hosted SaaS runs LLM and infra on the vendor side.

**Information needed:** Azure OpenAI endpoint URL, API key, and deployment name for a gpt-4o (or equivalent) model deployment.

---

### Improvement 2: Wire Weekly Real-LLM CI Job

**Title:** Schedule Real-LLM Agent Evaluation in CI

**Why it matters:** Even after a manual golden cohort run, model-version drift could silently degrade output quality. A weekly CI job with real AOAI credentials catches this automatically.

**Expected impact:** Directly improves Correctness (+3-5 pts), AI/Agent Readiness (+3-5 pts), Reliability (+2-3 pts). Weighted readiness impact: +0.5-0.8%.

**Affected qualities:** Correctness, AI/Agent Readiness, Reliability

**Status:** DEFERRED

**Reason:** Requires GitHub Actions secrets for Azure OpenAI credentials. Also requires a cost budget decision — real-LLM calls cost money per run.

**Information needed:** (a) Azure OpenAI credentials for GitHub Secrets, (b) acceptable weekly LLM spend budget for the CI job.

---

### Improvement 3: ITSM Connector Live Smoke Tests (TB-016)

**Title:** Provision Vendor Sandbox Accounts and Wire Recurring Live Smoke

**Why it matters:** The Jira, ServiceNow, Confluence, and Slack connectors are first-party V1 commitments but validated only against mocks. Production buyers will test these integrations during evaluation. A failing connector during a pilot is a deal-breaker.

**Expected impact:** Directly improves Workflow Embeddedness (+5-7 pts), Interoperability (+4-6 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: +0.4-0.7%.

**Affected qualities:** Workflow Embeddedness, Interoperability, Trustworthiness, Adoption Friction

**Status:** DEFERRED

**Reason:** Requires provisioning vendor sandbox accounts (Jira Cloud, ServiceNow Developer Instance, Confluence Cloud, Slack workspace) and storing secrets in GitHub Actions or a CI secrets vault.

**Information needed:** (a) Whether to use free developer/sandbox tiers for each vendor, (b) who will own the vendor accounts, (c) whether to wire these as scheduled-only or merge-blocking CI jobs.

---

### Improvement 4: Enforce Durable Cost Guardrails (INV-004)

**Title:** Implement Cross-Replica LLM Budget Enforcement via SQL

**Why it matters:** Multi-replica deployments could overrun per-tenant LLM budgets because current cost tracking is per-process only. This is a financial integrity risk that worsens with scale.

**Expected impact:** Directly improves Data Consistency (+5-7 pts), Cost-Effectiveness (+4-6 pts), Reliability (+2-3 pts). Weighted readiness impact: +0.3-0.5%.

**Affected qualities:** Data Consistency, Cost-Effectiveness, Reliability, Scalability

**Status:** Actionable now

**Cursor prompt:**

```
Implement INV-004: durable LLM cost guardrails across replicas.

CONTEXT:
- Current LLM token/cost tracking is per-process only (in-memory counters)
- In multi-replica Container Apps deployments, concurrent requests from different replicas can independently approve LLM calls that collectively exceed the per-tenant budget
- The budget configuration is `LlmCostEstimation:MonthlyTenantDollarBudget` in `ArchLucid.Core/Configuration/LlmCostEstimationOptions.cs`
- INV-004 in `docs/library/ARCHITECTURE_INVARIANTS.md` specifies: "SQL row with optimistic concurrency or equivalent; two-instance test harness"

WHAT TO DO:
1. Add a `dbo.TenantLlmBudgetLedger` table to the master DDL (`ArchLucid.Persistence/Scripts/ArchLucid.sql`) and a DbUp migration:
   - Columns: TenantId (UNIQUEIDENTIFIER, PK composite), BudgetPeriodUtc (DATE, PK composite — first day of UTC month), AccumulatedCostDollars (DECIMAL(18,6)), LastUpdatedUtc (DATETIME2), RowVersion (ROWVERSION for optimistic concurrency)
   - Create a Dapper repository `ILlmBudgetLedgerRepository` with methods: `GetOrCreateCurrentPeriodAsync`, `TryReserveCostAsync` (optimistic update that fails if accumulated + reserved > budget), `SettleActualCostAsync` (post-call reconciliation)
2. Create `DurableLlmBudgetGuard` in `ArchLucid.Application` that wraps the existing budget check with a SQL-backed pre-call reservation and post-call settlement
3. Wire `DurableLlmBudgetGuard` in `ArchLucid.Host.Composition` when `LlmCostEstimation:DurableBudget:Enabled` is true (default false for backward compatibility; true in appsettings.SaaS.json)
4. Add integration tests: two concurrent budget reservation attempts against the same tenant with a budget that only allows one — verify the second fails with optimistic concurrency retry exhaustion
5. Update `docs/library/ARCHITECTURE_INVARIANTS.md` INV-004 section to mark enforcement as shipped

FILES TO MODIFY:
- `ArchLucid.Persistence/Scripts/ArchLucid.sql` (master DDL)
- New migration file in `ArchLucid.Persistence/Scripts/Migrations/`
- New `ILlmBudgetLedgerRepository` + Dapper implementation in `ArchLucid.Persistence/`
- New `DurableLlmBudgetGuard` in `ArchLucid.Application/`
- `ArchLucid.Host.Composition/` registration
- Integration tests in `ArchLucid.Persistence.Tests/` or `ArchLucid.Application.Tests/`
- `docs/library/ARCHITECTURE_INVARIANTS.md`

CONSTRAINTS:
- Do NOT change the existing in-memory budget check — the durable guard wraps it
- Do NOT introduce EF Core — use Dapper only
- Do NOT change the LlmCostEstimationOptions structure — read the existing budget from there
- Each class in its own file
- Use LINQ where appropriate
- Check nulls
- Blank line before if/foreach unless first line of method

ACCEPTANCE CRITERIA:
- Two concurrent reservation tests pass showing optimistic concurrency prevents double-spend
- Existing tests still pass (the guard is opt-in via configuration)
- Migration runs clean on greenfield and existing databases
- Architecture invariants doc updated
```

---

### Improvement 5: Architecture Request Templates

**Title:** Ship Pre-Built Architecture Request Templates for Common Scenarios

**Why it matters:** The architecture request is the core product input, but new users have no examples of what to submit. Templates for common scenarios (cloud migration review, microservices architecture review, cost optimization review) dramatically reduce Adoption Friction and Time-to-Value.

**Expected impact:** Directly improves Adoption Friction (+4-6 pts), Time-to-Value (+3-5 pts), Template Richness (+8-12 pts). Weighted readiness impact: +0.4-0.7%.

**Affected qualities:** Adoption Friction, Time-to-Value, Template and Accelerator Richness, Usability

**Status:** Actionable now

**Cursor prompt:**

```
Create architecture request templates for common evaluation scenarios.

CONTEXT:
- `POST /v1/architecture/request` accepts an ArchitectureRequest body
- The operator UI has a seven-step wizard for creating requests
- New users do not know what to submit — this is a major adoption friction point
- Templates should be JSON files that can be loaded in the UI or submitted via API/CLI

WHAT TO DO:
1. Create a `templates/architecture-requests/` directory with these JSON template files:
   - `cloud-migration-review.json` — review a proposed migration from on-premises to Azure
   - `microservices-decomposition-review.json` — review a monolith-to-microservices proposal
   - `cost-optimization-review.json` — review current Azure spend and architecture for cost reduction
   - `security-baseline-review.json` — review architecture against security compliance baselines
   - `greenfield-design-review.json` — review a net-new system design proposal
2. Each template should include:
   - A meaningful `systemName`, `description`, and `context` that demonstrate the input format
   - Realistic but synthetic Azure resource references where applicable
   - Comments (in a `_templateNotes` field) explaining what to customize
3. Create `templates/architecture-requests/README.md` documenting the templates and how to use them
4. Add a link from `docs/library/PILOT_GUIDE.md` and `docs/library/CORE_PILOT.md` to the templates directory

FILES TO CREATE:
- `templates/architecture-requests/README.md`
- `templates/architecture-requests/cloud-migration-review.json`
- `templates/architecture-requests/microservices-decomposition-review.json`
- `templates/architecture-requests/cost-optimization-review.json`
- `templates/architecture-requests/security-baseline-review.json`
- `templates/architecture-requests/greenfield-design-review.json`

FILES TO MODIFY:
- `docs/library/PILOT_GUIDE.md` — add link to templates
- `docs/library/CORE_PILOT.md` — add link to templates

CONSTRAINTS:
- Do NOT modify the ArchitectureRequest DTO or API behavior
- Templates must be valid JSON that the existing API accepts
- Use realistic but entirely synthetic data (no real company names or Azure subscription IDs)
- Keep each template focused and < 100 lines of JSON
- Add doc scope header to the README per `.cursor/rules/Doc-Scope-Header.mdc`

ACCEPTANCE CRITERIA:
- Each template is valid JSON parseable by System.Text.Json
- README explains the purpose and usage of each template
- PILOT_GUIDE.md and CORE_PILOT.md link to the templates
```

---

### Improvement 6: Complete Startup Validator Catalog Parity (INV-005 / TB-010)

**Title:** CI Guard for ConfigurationKeyCatalog vs StartupValidator Parity

**Why it matters:** A new configuration key could be added without a corresponding startup validation rule, allowing a production host to boot with invalid configuration and fail at runtime instead of at startup.

**Expected impact:** Directly improves Security (+2-3 pts), Reliability (+2-3 pts), Architectural Integrity (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Security, Reliability, Architectural Integrity, Deployability

**Status:** Actionable now

**Cursor prompt:**

```
Implement startup validator catalog parity check for INV-005 (TB-010 remainder).

CONTEXT:
- `ArchLucid.Host.Core/Configuration/ConfigurationKeyCatalog.cs` lists all known configuration keys
- `ArchLucid.Host.Core/Startup/Validation/` contains startup validation rules (IStartupValidator implementations)
- INV-005 requires that production hosts fail fast when misconfigured
- Currently there is no CI check that every production-critical configuration key has a corresponding validator
- `StartupValidatorTests` exist but do not verify catalog parity

WHAT TO DO:
1. Create `scripts/ci/assert_startup_validator_catalog_parity.py` that:
   - Parses `ConfigurationKeyCatalog.cs` to extract all public const string fields
   - Parses all `IStartupValidator` / startup rule implementations to extract which configuration keys they reference
   - Reports any catalog keys marked as production-required that have no validator coverage
   - Exits non-zero if gaps are found
2. Add the script to `.github/workflows/ci.yml` in the appropriate tier (after build, before integration)
3. Add `ArchLucid.Architecture.Tests/StartupValidatorCatalogParityTests.cs`:
   - Use reflection to enumerate ConfigurationKeyCatalog fields
   - Use reflection to enumerate all IStartupValidator implementations
   - Assert coverage (or maintain an explicit allow-list for keys that intentionally skip validation)
4. Update `docs/library/ARCHITECTURE_INVARIANTS.md` INV-005 to note the enforcement addition

FILES TO CREATE:
- `scripts/ci/assert_startup_validator_catalog_parity.py`
- `ArchLucid.Architecture.Tests/StartupValidatorCatalogParityTests.cs`

FILES TO MODIFY:
- `.github/workflows/ci.yml` — add CI step
- `docs/library/ARCHITECTURE_INVARIANTS.md` — update INV-005
- `docs/library/TECH_BACKLOG.md` — update TB-010 status

CONSTRAINTS:
- Do NOT modify ConfigurationKeyCatalog or existing validators
- The allow-list approach is acceptable for keys that intentionally have no validator (document why)
- Python script should work without external dependencies beyond stdlib
- Test class should use [Trait("Suite", "Core")]

ACCEPTANCE CRITERIA:
- CI step runs and passes on current codebase (with allow-list for legitimate exceptions)
- Architecture test discovers at least one validator per production-critical key family
- If a new key is added to ConfigurationKeyCatalog without a validator, CI fails
```

---

### Improvement 7: Ship LLM Budget Top-Up SKU (TB-014)

**Title:** Implement Tenant LLM Budget Top-Up Purchase Path

**Why it matters:** When a tenant exhausts LlmMonthlyTenantDollarBudget, they are hard-cut until the next UTC month. This creates a terrible experience for legitimate heavy users, blocks expansion revenue, and damages the PLG motion.

**Expected impact:** Directly improves Cost-Effectiveness (+4-6 pts), Commercial Packaging (+3-5 pts), Customer Self-Sufficiency (+3-5 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Cost-Effectiveness, Commercial Packaging Readiness, Customer Self-Sufficiency, Stickiness

**Status:** DEFERRED

**Reason:** Requires product decision on top-up pricing (per-dollar or per-block), whether it should be self-serve (Stripe) or sales-triggered, and whether it resets at month boundary or accumulates.

**Information needed:** (a) Top-up pricing model (e.g., $10 per $1 of LLM budget?), (b) self-serve vs. sales-triggered, (c) reset semantics.

---

### Improvement 8: Documentation Audience Split (TB-013)

**Title:** Separate Customer-Facing and Contributor-Reference Documentation

**Why it matters:** The 270+ doc library mixes buyer/evaluator content with contributor/engineering content, creating cognitive load for both audiences. TB-013 phases 2-3 would split these cleanly.

**Expected impact:** Directly improves Cognitive Load (+4-6 pts), Usability (+2-3 pts), Maintainability (+2-3 pts). Weighted readiness impact: +0.1-0.3%.

**Affected qualities:** Cognitive Load, Usability, Maintainability, Documentation

**Status:** Actionable now (Phase 2 portion — create audience-tagged index)

**Cursor prompt:**

```
Create a documentation audience index as Phase 2 of TB-013.

CONTEXT:
- `docs/library/DOCUMENTATION_BY_AUDIENCE.md` exists but may need enhancement
- 270+ docs mix buyer, operator, contributor, and security reviewer audiences
- The five-doc onboarding spine exists but does not cover the full library
- Goal: every doc in docs/library/ should be tagged with its primary audience

WHAT TO DO:
1. Read `docs/library/DOCUMENTATION_BY_AUDIENCE.md` and assess its current state
2. Create or update the file to include a complete table mapping every `docs/library/*.md` file to:
   - Primary audience (Buyer | Operator | Contributor | Security Reviewer | All)
   - One-sentence purpose
   - Whether it should be visible to customers (yes/no/internal-only)
3. Add a CI script `scripts/ci/assert_doc_audience_tags.py` that:
   - Parses the audience table
   - Verifies every `docs/library/*.md` file appears in the table
   - Warns (not fails) when new files are untagged
4. Update `docs/library/TECH_BACKLOG.md` TB-013 to note Phase 2 completion

FILES TO MODIFY:
- `docs/library/DOCUMENTATION_BY_AUDIENCE.md`
- `docs/library/TECH_BACKLOG.md`

FILES TO CREATE:
- `scripts/ci/assert_doc_audience_tags.py`

CONSTRAINTS:
- Do NOT move or rename any documentation files in this change
- Do NOT modify doc content — this is an index/tagging pass only
- Python script should work without external dependencies
- Script should warn, not fail, for untagged files (to avoid blocking other PRs)

ACCEPTANCE CRITERIA:
- Every current docs/library/*.md file appears in the audience table
- Script runs successfully and identifies any untagged files
- TB-013 status updated
```

---

### Improvement 9: Finalize VPAT 2.5

**Title:** Finalize VPAT 2.5 WCAG 2.1 AA Draft

**Why it matters:** Government and regulated enterprise procurement requires a published VPAT. The draft exists but is not finalized, creating a procurement blocker for these segments.

**Expected impact:** Directly improves Accessibility (+5-8 pts), Procurement Readiness (+2-3 pts), Compliance Readiness (+2-3 pts). Weighted readiness impact: +0.1-0.3%.

**Affected qualities:** Accessibility, Procurement Readiness, Compliance Readiness

**Status:** Actionable now (partial — finalize based on current axe coverage)

**Cursor prompt:**

```
Finalize the VPAT 2.5 WCAG 2.1 AA document based on current accessibility evidence.

CONTEXT:
- `docs/security/VPAT_2_5_WCAG_2_1_AA.md` exists as a draft
- `docs/security/VPAT_2_4_WCAG_2_1_DRAFT.md` is an earlier version
- `docs/security/VPAT_EVIDENCE_MAP.md` maps WCAG criteria to evidence
- The operator UI runs eslint-plugin-jsx-a11y, jest-axe component tests (ui-axe-components CI job), and live axe in E2E tests
- `docs/library/ACCESSIBILITY.md` and `docs/library/ACCESSIBILITY_AUDIT.md` document current posture
- Radix UI components provide accessible primitives (focus trapping, ARIA attributes)

WHAT TO DO:
1. Read the current VPAT 2.5 draft and the evidence map
2. Update the VPAT to reflect the current state of conformance:
   - For criteria with CI evidence (axe rules passing), mark as "Supports" with test evidence citation
   - For criteria with partial coverage, mark as "Partially Supports" with specific gaps noted
   - For criteria not yet tested, mark as "Not Evaluated" rather than claiming conformance
3. Remove "DRAFT" from the document title if the content is factually accurate
4. Add a "Last evaluated" date and a note that the VPAT is based on automated testing only (no manual assistive technology testing yet)
5. Ensure the trust center links to the finalized VPAT

FILES TO MODIFY:
- `docs/security/VPAT_2_5_WCAG_2_1_AA.md`
- `docs/security/VPAT_EVIDENCE_MAP.md` (if gaps are found)
- `docs/go-to-market/TRUST_CENTER.md` (ensure link exists)

CONSTRAINTS:
- Do NOT claim "Supports" for any criterion without CI evidence
- Do NOT claim manual assistive technology testing was performed if it was not
- Be honest about "Not Evaluated" criteria
- Maintain the standard VPAT 2.5 table format

ACCEPTANCE CRITERIA:
- Every WCAG 2.1 AA criterion has a conformance level and evidence citation
- No criterion is marked "Supports" without a corresponding axe rule or test
- Document is dated and notes the evaluation methodology
- Trust center links to the VPAT
```

---

### Improvement 10: Composition Root Architecture Test (INV-006 / TB-010)

**Title:** Enforce Single Composition Root via Architecture Test

**Why it matters:** Stray DI registrations outside `ArchLucid.Host.Composition` could bypass cross-cutting concerns (audit, tenant scope, resilience). An architecture test catches this at build time.

**Expected impact:** Directly improves Architectural Integrity (+2-3 pts), Security (+1-2 pts), Maintainability (+1-2 pts). Weighted readiness impact: +0.1-0.2%.

**Affected qualities:** Architectural Integrity, Security, Maintainability

**Status:** Actionable now

**Cursor prompt:**

```
Implement INV-006: architecture test enforcing single composition root.

CONTEXT:
- INV-006 in `docs/library/ARCHITECTURE_INVARIANTS.md` states: "Production DI registration for app lifetimes is owned by `ArchLucid.Host.Composition` only; stray `Add*` helpers elsewhere are forbidden or allow-listed"
- This is part of TB-010 (Wave A)
- The pattern to follow is similar to existing architecture tests in `ArchLucid.Architecture.Tests/`
- Some `IServiceCollection` extensions in test projects are legitimate (test setup, fakes)

WHAT TO DO:
1. In `ArchLucid.Architecture.Tests/`, create `CompositionRootArchitectureTests.cs`:
   - Scan all production assemblies (exclude `*.Tests`, `ArchLucid.TestSupport`) for `IServiceCollection` extension methods
   - Assert that such methods only exist in `ArchLucid.Host.Composition` or in an explicit allow-list
   - The allow-list should be a static array in the test class, with a comment for each entry explaining why it is allowed
2. Add `[Trait("Suite", "Core")]` to the test class
3. Update `docs/library/ARCHITECTURE_INVARIANTS.md` INV-006 to note the enforcement
4. Update `docs/library/TECH_BACKLOG.md` TB-010 to note INV-006 status

FILES TO CREATE:
- `ArchLucid.Architecture.Tests/CompositionRootArchitectureTests.cs`

FILES TO MODIFY:
- `docs/library/ARCHITECTURE_INVARIANTS.md`
- `docs/library/TECH_BACKLOG.md`

CONSTRAINTS:
- Do NOT move existing IServiceCollection extensions — just detect and allow-list legitimate ones
- Use reflection to scan assemblies (pattern from existing architecture tests)
- Each legitimate exception in the allow-list must have a one-line comment
- Do NOT use ConfigureAwait(false) in tests
- Blank line before if/foreach unless first line of method

ACCEPTANCE CRITERIA:
- Test passes with current codebase (all stray extensions are in the allow-list with justification)
- Adding a new IServiceCollection extension in a non-Composition production assembly causes the test to fail
- INV-006 marked as enforced in architecture invariants doc
```

---

## 10. Pending Questions for Later

### Improvement 1 (Real-LLM Golden Cohort)
- What Azure OpenAI model deployment should be the canonical target? (The doc references gpt-4o but this should be confirmed.)
- What is the acceptable cost per golden cohort run?
- Should the evidence capture include the full agent result JSON or just scoring metrics?

### Improvement 2 (Weekly Real-LLM CI)
- What weekly LLM spend is acceptable for CI? (Four agent types × N scenarios × token cost)
- Should CI real-LLM failures be merge-blocking or informational?
- Should the job run against staging or a dedicated CI Azure OpenAI deployment?

### Improvement 3 (ITSM Live Smoke)
- Which vendor sandbox tiers? (Jira Cloud free, ServiceNow PDI, Confluence Cloud free, Slack free workspace?)
- Should live smoke failures be merge-blocking or continue-on-error?
- Who maintains the sandbox accounts and rotates credentials?

### Improvement 7 (LLM Budget Top-Up)
- Top-up pricing: per-dollar-of-budget or block pricing (e.g., $10 buys $5 of LLM budget)?
- Self-serve (Stripe additional charge) or sales-triggered (manual budget increase)?
- Does unused top-up roll over or reset at month boundary?
- Should there be a maximum number of top-ups per month?

### General
- Is there a target date for the first pilot customer engagement?
- Is there a target date for the commerce un-hold (V1.1)?
- Are there specific enterprise verticals being targeted first (healthcare vertical brief exists)?
- Is there a marketing site build planned separately from the operator shell?

---

## Deferred Scope Uncertainty

All items referenced as deferred (V1.1, V2) were located in the repository at `docs/library/V1_DEFERRED.md` and `docs/library/V1_SCOPE.md` §3. No deferred items were referenced without a corresponding markdown source. The scope boundary between V1 and V1.1 is well-documented and internally consistent.

---

## (B) Enterprise Procurement Realism (Informational — Not Weighted into (A))

This section is provided for completeness per the assessment scope rules. It carries **zero weight** in the **69.82%** headline score.

- **SOC 2 CPA attestation:** Not issued. Self-assessment and roadmap exist. Enterprise RFPs that hard-require "SOC 2 Type II report attached to response" will filter out ArchLucid. Mitigation: honest trust center, CAIQ/SIG pre-fills, DPA template, and SOC 2 roadmap with timeline narrative.
- **Published reference customer / public case study / testimonial (buyer social proof):** Explicit **V1.1** milestone per `V1_DEFERRED.md` §6b — **not** treated as a V1 headline product defect in this assessment’s **(A)** score. Mitigation until then: pilot buyer safe evidence template, sales-led proof packs, and procurement FAQs.
- **In-repo record of a completed buyer pilot (metrics, PMF rows):** **Not** a **`(A)`** Proof-of-ROI deduction in this assessment. Buyers may not consent to repo commits; outcomes may live in CRM or under NDA. **`(B)`** may still care for internal forecasting and investor narrative.
- **Optional anonymized pilot excerpts in git (policy-permitted):** **Not** scored — neither required for **`(A)`** nor a bonus; purely **`(B)`** / go-to-market hygiene if the business chooses it.
- **First full buyer procurement cycle / post-deal evidence-pack iteration:** **Not** a **`(A)`** Procurement Readiness requirement; **`(A)`** rates **shipped** procurement collateral. Refining the pack after live RFPs is normal **`(B)`** / sales enablement.
- **In-repo production or long-run staging “burn-in” story:** Comfort for some **`(B)`** buyers; **not** an **`(A)`** deduction for Availability, Reliability, Azure deployment readiness, or Trustworthiness when IaC, SLOs, and runbooks exist — see **production burn-in** rescoring note.
- **Multi-region active/active or live multi-region evidence:** **Not** **`(A)`** when outside V1 commitments; **`(B)`** may still ask — see same rescoring note.
- **Third-party pen test:** Not conducted. V2 timeline. Procurement teams that require "independent security assessment summary" cannot be satisfied. Mitigation: owner-conducted testing, ZAP/Schemathesis/CodeQL CI evidence, and pen-test SoW template ready for vendor selection.
