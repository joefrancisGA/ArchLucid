# ArchLucid Assessment – Weighted Readiness 76.02%

**Date:** 2026-05-09
**Basis:** Independent first-principles review of committed code, docs, tests, schemas, CI, and Terraform in the repository as of this date. No prior assessments referenced.

**Owner amendment (same date):** For the **next 90 days**, the stated primary commercial motion is a **mixture of self-serve trial and Azure Marketplace**. Narrative sections below reflect that intent. **Numerical scores are unchanged** — they remain anchored to repository evidence (activation gaps still apply).

**Owner targets (2026-05-09 follow-up):** **Azure Marketplace** offer aimed at **`Published` by 2026-06-20**. **Committed pilot start** aimed **by the same date** (aligned with Marketplace readiness). These are planning anchors, not repo-evidence claims until shipped.

**Owner scope pin (2026-05-09):** A dedicated **hosted product sandbox** (always-on demo tenant stack / `sandbox.*` environment) is **out of scope** for this planning pass — Improvement 4 and related pending questions are withdrawn unless scope changes.

**Golden cohort / real-LLM anchor (answered):** Canonical model **`gpt-4o`**. Owner confirms **`AzureOpenAI:DeploymentName`** matches the Azure deployment label (**2026-05-09**). Evidence runs should still record the deployment id used when filing session templates.

**Green cohort bar (adopted for planning, 2026-05-09):** Tiered targets on the committed **release cohort** under **`gpt-4o`**: (1) **Structural** — AgentResult JSON shape / schema-valid per repo gates: **100%** on cohort scenarios (any miss = regression). (2) **Quality gate** — **`outcome="rejected"`**: **0%** on canonical cohort (any reject fails the cohort). (3) **Semantic score** (`archlucid_agent_output_semantic_score`) — **p10 ≥ 0.50**, **p50 ≥ 0.70** as investigation thresholds aligned with existing histogram / alert posture (miss = investigate; tune after two baseline runs). (4) **Explainability trace completeness** (`archlucid_explainability_trace_completeness_ratio` / cohort mean): **≥ 0.80** across cohort findings. (5) **Adversarial scenarios** (when added): **qualitative pass** for first two baseline runs; defer numeric bar until distribution is measured.

**Canonical doc:** Full green-bar table and cross-links live in [`docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md`](docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md) §10; [`docs/quality/MANUAL_QA_CHECKLIST.md`](docs/quality/MANUAL_QA_CHECKLIST.md) §8.3 and [`docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md`](docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md) point operators there.

---

## 1. Executive Summary

### Overall Readiness

ArchLucid is a materially complete V1 product with a working core loop (request → execute → commit → manifest → artifacts), solid governance/audit infrastructure, deep observability, and defensible AI-agent orchestration with quality gates. Weighted readiness of **76.02%** reflects a product that can run a real pilot but still has meaningful gaps in commercial activation (including **closing the gap between the declared 90-day self-serve + Marketplace motion and production checkout / Marketplace publication — owner target Marketplace `Published` 2026-06-20 with pilot start aligned**), ITSM connector battle-testing, real-LLM evidence depth, and first-customer proof. The product punches well above its weight on architecture, security engineering, and documentation; it underperforms on commercial traction, adoption friction for non-technical buyers, and proving real-world AI correctness beyond simulator mode.

### Commercial Picture

Pricing philosophy is well-structured (value-based, three tiers, clear packaging). Commerce rails (Stripe, Marketplace, order form) are wired but **not yet production-unblocked** for transactability (live Stripe keys and Marketplace `Published` state remain owner milestones per `docs/library/V1_DEFERRED.md` §6b — still **not** deducted from headline readiness scores here). There are no reference customers, no published case studies, and no signed design partners — explicitly deferred per scope rules. **Declared near-term motion:** self-serve trial plus Marketplace creates clear leverage once checkout and Partner Center publication align with `BillingProductionSafetyRules` and hosted onboarding. **Owner calendar anchor:** Marketplace **`Published` target 2026-06-20**, with **committed pilot start targeted by that date** — backlog and readiness drills should be sequenced backward from that window. Until shipped, quote-request on `/pricing` and order-form paths remain important fallbacks. Time-to-value for hosted trials is better than contributor-local setup; friction remains where trials are not yet live or Marketplace discovery is unavailable.

### Enterprise Picture

Tenant isolation (database-per-tenant + optional RLS), RBAC (four roles + SCIM provisioning), audit trail (173 event types, append-only SQL with DENY UPDATE/DELETE), governance workflows (approval, pre-commit gate, policy packs, compliance drift), and a procurement pack (CLI-generated ZIP with DPA, CAIQ, SIG, subprocessors) are all shipped. SOC 2 is self-attested (CPA attestation deferred — not scored per rules). Pen testing is owner-conducted (third-party deferred to V2 — not scored). The trust center is honest about what exists and what does not. ITSM connectors (Jira, ServiceNow, Confluence, Slack) are code-complete with mock-based CI; live vendor validation is manual and smoke-level.

### Engineering Picture

The codebase is large (~49 .csproj files, Next.js UI, extensive SQL migrations) and well-structured: clear project boundaries, Dapper over raw SQL, typed contracts, OpenAPI snapshot testing, FsCheck property tests, k6 load baselines, and CI with multiple tiers. The AI agent pipeline has structural + semantic evaluation, quality gates that block runs on staging/production, circuit breakers, fallback chains, and LLM cost guardrails. Weaknesses: architecture invariants (INV-001 through INV-015) are documented but enforcement is "mixed" (convention, not automated analyzers yet); some budget trackers are per-process only (multi-replica risk documented but not yet fully mitigated); real-LLM evidence depth for production release confidence is thin.

---

## 2. Weighted Quality Assessment

### Scoring Summary Table

Total weight: 100. Weighted readiness = Σ(score × weight) / Σ(weight) = 7602.0 / 100 = **76.02%**

Ordered from most urgent (highest weighted deficiency) to least urgent.

| # | Quality | Category | Score | Weight | Weighted Contribution | Weighted Deficiency | Urgency Rank |
|---|---------|----------|-------|--------|----------------------|---------------------|-------------|
| 1 | Marketability | Commercial | 58 | 8 | 464.0 | 336.0 | 1 |
| 2 | AI/Agent Readiness | Engineering | 72 | 8 | 576.0 | 224.0 | 2 |
| 3 | Correctness | Engineering | 74 | 8 | 592.0 | 208.0 | 3 |
| 4 | Time-to-Value | Commercial | 65 | 7 | 455.0 | 245.0 | 4 |
| 5 | Adoption Friction | Commercial | 60 | 6 | 360.0 | 240.0 | 5 |
| 6 | Proof-of-ROI Readiness | Commercial | 55 | 5 | 275.0 | 225.0 | 6 |
| 7 | Executive Value Visibility | Commercial | 68 | 4 | 272.0 | 128.0 | 7 |
| 8 | Differentiability | Commercial | 82 | 4 | 328.0 | 72.0 | 8 |
| 9 | Traceability | Enterprise | 85 | 3 | 255.0 | 45.0 | 9 |
| 10 | Usability | Enterprise | 68 | 3 | 204.0 | 96.0 | 10 |
| 11 | Workflow Embeddedness | Enterprise | 72 | 3 | 216.0 | 84.0 | 11 |
| 12 | Trustworthiness | Enterprise | 78 | 3 | 234.0 | 66.0 | 12 |
| 13 | Architectural Integrity | Engineering | 79 | 3 | 237.0 | 63.0 | 13 |
| 14 | Security | Engineering | 82 | 3 | 246.0 | 54.0 | 14 |
| 15 | Decision Velocity | Commercial | 62 | 2 | 124.0 | 76.0 | 15 |
| 16 | Commercial Packaging Readiness | Commercial | 70 | 2 | 140.0 | 60.0 | 16 |
| 17 | Auditability | Enterprise | 86 | 2 | 172.0 | 28.0 | 17 |
| 18 | Policy and Governance Alignment | Enterprise | 84 | 2 | 168.0 | 32.0 | 18 |
| 19 | Compliance Readiness | Enterprise | 76 | 2 | 152.0 | 48.0 | 19 |
| 20 | Procurement Readiness | Enterprise | 74 | 2 | 148.0 | 52.0 | 20 |
| 21 | Interoperability | Enterprise | 78 | 2 | 156.0 | 44.0 | 21 |
| 22 | Reliability | Engineering | 78 | 2 | 156.0 | 44.0 | 22 |
| 23 | Data Consistency | Engineering | 80 | 2 | 160.0 | 40.0 | 23 |
| 24 | Maintainability | Engineering | 80 | 2 | 160.0 | 40.0 | 24 |
| 25 | Explainability | Engineering | 84 | 2 | 168.0 | 32.0 | 25 |
| 26 | Azure Compat / SaaS Deploy | Engineering | 80 | 2 | 160.0 | 40.0 | 26 |
| 27 | Stickiness | Commercial | 72 | 1 | 72.0 | 28.0 | 27 |
| 28 | Template/Accelerator Richness | Commercial | 60 | 1 | 60.0 | 40.0 | 28 |
| 29 | Accessibility | Enterprise | 72 | 1 | 72.0 | 28.0 | 29 |
| 30 | Customer Self-Sufficiency | Enterprise | 65 | 1 | 65.0 | 35.0 | 30 |
| 31 | Change Impact Clarity | Enterprise | 78 | 1 | 78.0 | 22.0 | 31 |
| 32 | Availability | Engineering | 76 | 1 | 76.0 | 24.0 | 32 |
| 33 | Performance | Engineering | 76 | 1 | 76.0 | 24.0 | 33 |
| 34 | Scalability | Engineering | 72 | 1 | 72.0 | 28.0 | 34 |
| 35 | Supportability | Engineering | 82 | 1 | 82.0 | 18.0 | 35 |
| 36 | Manageability | Engineering | 78 | 1 | 78.0 | 22.0 | 36 |
| 37 | Deployability | Engineering | 78 | 1 | 78.0 | 22.0 | 37 |
| 38 | Observability | Engineering | 86 | 1 | 86.0 | 14.0 | 38 |
| 39 | Testability | Engineering | 84 | 1 | 84.0 | 16.0 | 39 |
| 40 | Modularity | Engineering | 82 | 1 | 82.0 | 18.0 | 40 |
| 41 | Extensibility | Engineering | 80 | 1 | 80.0 | 20.0 | 41 |
| 42 | Evolvability | Engineering | 78 | 1 | 78.0 | 22.0 | 42 |
| 43 | Documentation | Engineering | 88 | 1 | 88.0 | 12.0 | 43 |
| 44 | Azure Ecosystem Fit | Engineering | 82 | 1 | 82.0 | 18.0 | 44 |
| 45 | Cognitive Load | Engineering | 62 | 1 | 62.0 | 38.0 | 45 |
| 46 | Cost-Effectiveness | Engineering | 74 | 1 | 74.0 | 26.0 | 46 |
| **TOTAL** | | | | **100** | **7602.0** | | |

---

### Detailed Quality Assessments (Ordered by Urgency)

#### 1. Marketability (Score: 58, Weight: 8, Weighted Deficiency: 336.0)

**Why this score:** The product is technically impressive but has zero external market proof. No reference customers, no published case studies, no analyst mentions, no marketplace listing live, no public production deployments documented. The pricing page exists but leads to a quote form, not a transaction (until live Stripe / Marketplace un-hold lands — **owner intent for the next 90 days is self-serve trial plus Marketplace**, which raises execution urgency without changing the repo-evidence score yet). The competitive landscape document is thorough internally but this positioning has not been tested against real buyer objections. Brand identity (`ArchLucid`) is established in code but the marketing site, domain acquisition status, and public presence are unclear from repo evidence alone.

**Tradeoffs:** Building deep product before market validation is a deliberate founder strategy (build-right-first); **with Marketplace + self-serve declared**, the risk shifts toward **GTM execution** (Partner Center, DNS, billing safety rules) rather than “whether sales-led is coherent.”

**Recommendations:** (1) Produce a recorded product walkthrough video from existing demo scripts and strengthen buyer-visible demo surfaces (e.g. `/demo` in marketing UI per Go-to-Market recommendations). **Dedicated hosted product sandbox is out of scope (owner, 2026-05-09).** (2) Accelerate one paying pilot to "Published" status. **(3) Sequence Marketplace publication and production trial/checkout against `BillingProductionSafetyRules` and hosted onboarding.** Timeline: v1/v1.1.

---

#### 2. AI/Agent Readiness (Score: 72, Weight: 8, Weighted Deficiency: 224.0)

**Why this score:** The agent pipeline is well-architected: four agent types, structured prompts, fallback chains, circuit breakers, quality gates (structural + semantic + configurable blocking), trace recording, eval corpus, and CI corpus gates. The simulator path is excellent for deterministic testing. However: (a) real-LLM evidence is thin — `REAL_LLM_RUN_EVIDENCE_TEMPLATE.md` exists as a template but evidence of real-mode runs producing high-quality output at scale is not committed; (b) the semantic score is a heuristic (not embedding similarity or LLM judge), and the doc warns buyers could misinterpret it; (c) adversarial eval coverage (hallucination, citation mismatch, contradictory manifest) is flagged as a known gap in `SONNET_AI_FUNCTIONALITY_REVIEW_BRIEF.md`; (d) budget trackers (`LlmDailyTenantBudgetTracker`, `LlmMonthlyTenantDollarBudgetTracker`) are per-process — documented multi-replica risk.

**Tradeoffs:** Simulator-first is the right development strategy; the risk is that real-model quality under diverse inputs is unproven until first pilots exercise it.

**Recommendations:** (1) Execute and commit at least 3 golden-cohort real-LLM runs with evidence artifacts. (2) Move budget trackers to SQL-backed durable state. (3) Add adversarial eval scenarios to the corpus. Timeline: v1 for items 1-2; v1.1 for item 3.

---

#### 3. Correctness (Score: 74, Weight: 8, Weighted Deficiency: 208.0)

**Why this score:** The deterministic finding engines (10 types) have documented 5/5 explainability trace coverage. FsCheck property tests verify analyzer invariants. Data consistency enforcement (orphan probes, FK authority chain, quarantine) is thorough. OpenAPI snapshot testing catches contract drift. However: (a) architecture invariants INV-001 through INV-015 are documented as "mixed" enforcement — several hold by convention only, not automated analyzers; (b) golden manifest schema validation is configurable (`ValidateGoldenManifestSchema`) rather than always-on; (c) the correctness of LLM-generated outputs is bounded by the quality gate heuristics which are acknowledged as coarse.

**Tradeoffs:** Configurable strictness accommodates pilot flexibility but risks shipping weak outputs when operators don't enable gates.

**Recommendations:** (1) Implement Roslyn analyzers for INV-001 (tenant identity boundary) and INV-007 (injected time). (2) Default `ValidateGoldenManifestSchema` to true in production profiles. (3) Add snapshot tests for more finding engine outputs. Timeline: v1 for items 1-2; ongoing for item 3.

---

#### 4. Time-to-Value (Score: 65, Weight: 7, Weighted Deficiency: 245.0)

**Why this score:** The `archlucid try` one-command demo is a strong accelerator for contributors. But for actual buyers/operators: setup requires Docker, SQL Server, .NET 10 SDK, Node 22, and configuration of connection strings and auth modes before a first run. The happy path (`POST /v1/architecture/request` → execute → commit) requires understanding the domain model. The UI wizard exists but the operator must navigate product layers, disclosure tiers, and authority concepts. A self-serve SaaS trial path exists (Stripe test mode, live spec) but is not activated for production — **this directly conflicts with the owner’s stated next-90-days motion (self-serve + Marketplace)** until checkout and hosted onboarding are production-unblocked.

**Tradeoffs:** Deep product requires deep onboarding; **hosted self-serve** reduces install friction but **does not** remove domain concept load once inside the shell.

**Recommendations:** (1) Ensure hosted trial signup lands operators in Core Pilot with minimal manual ops steps. (2) Shorten “first artifact” path documentation for Marketplace-driven buyers. Timeline: v1/v1.1.

---

#### 5. Adoption Friction (Score: 60, Weight: 6, Weighted Deficiency: 240.0)

**Why this score:** Prerequisites are heavy: .NET 10 SDK, Docker, SQL Server, Node 22, Python scripts for CI. The naming is still partially in transition (legacy config keys, RLS object names referencing older tokens per BREAKING_CHANGES). The concept model (runs, manifests, authority, findings, governance, layers) has a steep learning curve for teams not already doing structured architecture reviews. Integration requires configuring auth (three modes), connection strings, and understanding scope (tenant/workspace/project). The operator UI uses progressive disclosure which helps, but the sheer surface area is large.

**Tradeoffs:** The depth that creates friction is also the depth that creates value for enterprise buyers. Reducing surface area would reduce differentiation.

**Recommendations:** (1) Finish Phase **7** naming cleanup — brownfield Terraform **`state mv`** / verification is **in Improvement 7** (**owner-approved 2026-05-09**); continue doc/config key alignment per **`BREAKING_CHANGES`** as needed. (2) Create a minimal "Pilot-only" appsettings template that hides Operate surfaces. (3) Build an interactive in-UI onboarding checklist that guides operators through Core Pilot. Timeline: v1 for items 2–3; v1.1 for broader residue beyond Improvement **7**.

---

#### 6. Proof-of-ROI Readiness (Score: 55, Weight: 5, Weighted Deficiency: 225.0)

**Why this score:** `PILOT_ROI_MODEL.md` exists with break-even at ~180 architect-hours/year. Pricing philosophy cites $294K annual savings for a 6-architect team. However, these are projections — no actual pilot has produced measured before/after data. The ROI model is well-structured but untested. There's no in-product ROI dashboard, no time-savings measurement, no comparison of "time to architecture package with vs without ArchLucid." The business value cheat sheet exists but is theoretical.

**Tradeoffs:** ROI proof requires customer data which requires customers. This is a chicken-and-egg problem that only resolves with first pilots.

**Recommendations:** (1) Add a pilot-completion summary endpoint that captures time metrics (request-to-commit duration, human review time). (2) Build a "pilot report card" artifact that auto-generates before/after comparisons. (3) Define 3 measurable KPIs in PILOT_GUIDE that operators track during evaluation. Timeline: v1 for item 3; v1.1 for items 1-2.

---

#### 7. Executive Value Visibility (Score: 68, Weight: 4, Weighted Deficiency: 128.0)

**Why this score:** `EXECUTIVE_SPONSOR_BRIEF.md` exists and is well-written. The sponsor one-pager CLI command (`archlucid sponsor-one-pager`) generates a PDF-ready artifact. The pricing page renders tier grids. However, the executive narrative requires reading markdown docs — there's no polished slide deck, no video demo, no one-page value proposition suitable for a CXO cold email. The product datasheet exists but is internal-facing.

**Tradeoffs:** Engineering-first teams naturally underinvest in executive materials; the materials that exist are honest rather than aspirational, which is the right choice.

**Recommendations:** (1) Create a one-page PDF from EXECUTIVE_SPONSOR_BRIEF suitable for email attachment. (2) Build a `/demo` route in the marketing UI with interactive screenshots from existing Playwright capture infrastructure. Timeline: v1.

---

#### 8. Differentiability (Score: 82, Weight: 4, Weighted Deficiency: 72.0)

**Why this score:** ArchLucid occupies a genuinely novel position: AI-agent-orchestrated architecture review with enterprise governance, provenance, and explainability. The competitive landscape document correctly identifies that no incumbent fully occupies this space. Explainability traces (5 fields per finding, 10 engine types, completeness metrics), provenance graphs, governance workflows with segregation of duties, and 173 typed audit events are meaningful differentiators. The Azure extractor (customer-controlled, never-request-write-roles) posture is a trust differentiator.

**Tradeoffs:** Novel category means no established buyer expectations — could be advantage (no direct comparison) or disadvantage (no budget line).

**Recommendations:** (1) Publish a "Why ArchLucid vs manual review" comparison page on the marketing site using competitive landscape data. (2) Quantify differentiators in procurement pack materials. Timeline: v1.

---

#### 9. Traceability (Score: 85, Weight: 3, Weighted Deficiency: 45.0)

**Why this score:** Outstanding. Every finding carries an `ExplainabilityTrace` with graph node IDs, rules applied, decisions taken, alternative paths, and notes. Provenance graph links decisions to evidence to artifacts. Authority chain with committed manifests provides version lineage. Audit events carry correlation IDs, run IDs, actor IDs. The `V1_REQUIREMENTS_TEST_TRACEABILITY.md` maps scope to tests. CI guards (audit const count, OpenAPI snapshot) prevent silent drift.

**Tradeoffs:** Deep traceability adds complexity and storage cost; the tradeoff is warranted for the enterprise audience.

**Recommendations:** (1) Add end-to-end lineage view in the operator UI (finding → trace → evidence → artifact → manifest). Timeline: v1.1.

---

#### 10. Usability (Score: 68, Weight: 3, Weighted Deficiency: 96.0)

**Why this score:** The operator UI is a Next.js progressive shell with Radix components, layer headers, role-aware navigation, and buyer-polished copy variants. The audit page alone is ~1000 lines of client-side code with lifecycle grouping, CSV export, and demo sample injection. However: (a) the UI surface is vast (runs, manifests, compare, replay, graph, ask, advisory, governance, audit, alerts, policy packs, compliance drift) with complex progressive disclosure; (b) no user research or usability testing evidence in the repo; (c) the learning curve for the concept model (authority, findings, manifests, governance) is steep; (d) some pages show demo/sample injection logic which adds code complexity.

**Tradeoffs:** Power-user depth vs first-time learnability. The product correctly prioritizes operator depth over consumer simplicity.

**Recommendations:** (1) Add contextual help/tooltips on key domain concepts in the UI (already partially there with GlossaryTooltip). (2) Create a guided walkthrough overlay for first-time users. (3) Simplify the home page to focus on "next action" rather than showing all surfaces. Timeline: v1.

---

#### 11. Workflow Embeddedness (Score: 72, Weight: 3, Weighted Deficiency: 84.0)

**Why this score:** Solid integration surface: REST API, CLI, webhooks (CloudEvents), Azure Service Bus integration events, Azure DevOps PR decoration, Jira/ServiceNow ITSM connectors, Confluence publish, Slack/Teams notifications, SCIM provisioning. The connector readiness matrix is comprehensive. However: (a) CI/CD pipeline integration is documented but requires customer-side setup; (b) ITSM connectors are code-complete but live vendor testing is manual/smoke-level; (c) no native IDE integration (VS Code extension explicitly out of scope); (d) Azure extractor requires manual PowerShell execution and ZIP upload.

**Tradeoffs:** Customer-controlled extraction (no vendor access to customer tenant) is a trust advantage that adds workflow steps.

**Recommendations:** (1) Create a GitHub Actions workflow template for architecture-as-code integration. (2) Build CI-integrated connector smoke tests with vendor sandbox accounts. Timeline: v1.1.

---

#### 12. Trustworthiness (Score: 78, Weight: 3, Weighted Deficiency: 66.0)

**Why this score:** The trust center is honest about what exists (self-assessment) and what does not (CPA SOC 2, third-party pen test). DPA template, subprocessors register, CAIQ/SIG pre-fills, incident communications policy, DSAR process are all present. The "never request write roles" and "never apply terraform" commitments are enforced and tested. Database-per-tenant topology is the primary isolation mechanism. However: (a) no production deployment evidence beyond staging probes; (b) assurance activity table shows mostly stubs and templates; (c) the trust center disclaims contractual SLA explicitly.

**Tradeoffs:** Honest trust posture at this stage is more credible than overclaiming. Self-assessment before CPA attestation is the standard pre-revenue path.

**Recommendations:** (1) Complete the owner-conducted penetration exercise and publish findings internally. (2) Execute the quarterly chaos exercise and publish the first game-day report. Timeline: v1.

---

#### 13. Architectural Integrity (Score: 79, Weight: 3, Weighted Deficiency: 63.0)

**Why this score:** Strong C4 documentation (context, containers, components), clear project boundaries (49 .csproj with logical separation), typed contracts between layers, Dapper-based persistence (no heavy ORM), ADR catalog. The architecture invariant catalog (INV-001 through INV-015) is a mature practice. Strangler pattern for coordinator→authority migration is documented. However: (a) invariant enforcement is "mixed" — several are convention-only; (b) the codebase is large with many projects which increases structural coupling risk; (c) `ArchLucid.Host.Composition` as single composition root is correct but complex; (d) some orchestrators have long method bodies per the untracked file list.

**Tradeoffs:** Explicit architecture documentation with partial enforcement is better than undocumented consistency; full enforcement requires analyzer investment.

**Recommendations:** (1) Implement architecture test scanning for INV-006 (single composition root). (2) Add dependency structure tests preventing unauthorized cross-project references. Timeline: v1.1.

---

#### 14. Security (Score: 82, Weight: 3, Weighted Deficiency: 54.0)

**Why this score:** Comprehensive security engineering: OWASP ZAP baseline in CI, Schemathesis contract checks, CodeQL security-extended, Gitleaks, rate limiting (three policies), RBAC (four roles), SCIM 2.0 provisioning, prompt redaction before Azure OpenAI, content safety guard, private endpoint Terraform modules, no SMB/445 exposure (enforced), STRIDE threat model, PII retention documentation, DSAR process, inbound webhook signature verification pipeline (INV-015). Key Vault for secrets. SQL append-only enforcement with DENY UPDATE/DELETE on audit events.

**Tradeoffs:** Security depth comes at development velocity cost and operational complexity. The tradeoff is appropriate for the enterprise target.

**Recommendations:** (1) Implement the remaining prompt injection regression tests from `tests/eval-datasets/prompt-injection/`. (2) Add automated RBAC boundary tests for every controller. Timeline: v1.

---

#### 15. Decision Velocity (Score: 62, Weight: 2, Weighted Deficiency: 76.0)

**Why this score:** Buyers need to make fast go/no-go decisions. The procurement pack is thorough but is a CLI-generated ZIP requiring technical skill to produce. The pricing page supports quote capture and guarded Stripe UX; **production self-serve checkout and Marketplace discovery are not yet active per repo posture**. Trial signup is wired but not production-flipped. Order form template still gates enterprise quote-to-cash with legal review. **Against the owner’s stated next-90-days motion (self-serve trial + Marketplace),** velocity is constrained until Partner Center publication, DNS/signup hostname readiness, and live Stripe/Marketplace webhooks satisfy `BillingProductionSafetyRules`.

**Tradeoffs:** Quote-led fallback stays valuable for Enterprise procurement and bespoke deals; **for the declared motion**, friction is dominated by **commerce activation**, not missing HTTP endpoints.

**Recommendations:** (1) Run an end-to-end dry run: Marketplace landing URL → tenant provisioning → Core Pilot → billing webhook acknowledgment (staging → prod). (2) Pair `/pricing` and Marketplace storefront copy so buyers see one coherent path (trial vs quote). Timeline: v1.1 aligned with commerce un-hold.

---

#### 16. Commercial Packaging Readiness (Score: 70, Weight: 2, Weighted Deficiency: 60.0)

**Why this score:** Three tiers (Team/Professional/Enterprise) with clear feature gates, seat pricing, run allowances, and workspace limits. Order form template is complete. Stripe integration is wired (BillingStripeWebhookController, BillingMarketplaceWebhookController, checkout controller, production safety rules). `[RequiresCommercialTenantTier]` enforcement filter exists. Azure Marketplace SaaS offer alignment is documented. However: (a) live keys / Marketplace `Published` remain owner milestones per `V1_DEFERRED.md` §6b; (b) tier enforcement is partially implemented per the route/tier/policy matrix; (c) metering infrastructure for run overages is unclear. **The declared 90-day motion raises priority on finishing Marketplace seller/readiness tasks and verifying entitlement mapping from Marketplace → tenant tier.**

**Tradeoffs:** Having the wiring ready before the commercial flip is the right approach — it's easier to activate than to build under time pressure.

**Recommendations:** (1) Complete tier enforcement for all routes per ROUTE_TIER_POLICY_NAV_MATRIX. (2) Implement run metering for overage billing. **(3) Validate Marketplace → Stripe reconciliation paths under production-like secrets.** Timeline: v1.1.

---

#### 17. Auditability (Score: 86, Weight: 2, Weighted Deficiency: 28.0)

**Why this score:** Excellent. 173 typed audit event constants with CI-enforced count parity. Append-only SQL with DENY UPDATE/DELETE. Paginated search with keyset cursor, correlation ID filtering, run ID filtering. Bulk export (JSON/CSV) with 90-day max window. Retention tiering (hot/warm/cold) documented. Operator UI with lifecycle grouping. Circuit breaker audit via fire-and-forget bridge. Critical-path durable audit retry. Governance dual-write to both baseline and durable channels.

**Tradeoffs:** Depth of audit adds storage cost and query complexity; warranted for compliance audiences.

**Recommendations:** (1) Add audit event type documentation tooltips in the operator UI export workflow. Timeline: v1.1.

---

#### 18. Policy and Governance Alignment (Score: 84, Weight: 2, Weighted Deficiency: 32.0)

**Why this score:** Pre-commit governance gate with configurable severity thresholds. Approval workflows with segregation of duties (self-approval blocked). SLA tracking with webhook escalation. Policy packs (versioned rule sets with scope assignments). Compliance drift trending. Governance dashboard. Full dual-write audit. This is enterprise-grade governance for an architecture review tool.

**Tradeoffs:** Governance complexity may overwhelm small teams; the two-layer model (Pilot skips governance, Operate enables it) is the correct mitigation.

**Recommendations:** (1) Add default policy pack templates for common frameworks (NIST, CIS). Timeline: v1.1.

---

#### 19. Compliance Readiness (Score: 76, Weight: 2, Weighted Deficiency: 48.0)

**Why this score:** SOC 2 self-assessment with gap register, CAIQ Lite pre-fill, SIG Core pre-fill, DPA template, DSAR process, compliance matrix mapping controls to evidence paths, subprocessors register. The compliance journey marketing route exists. However: (a) no CPA SOC 2 (deferred — not scored against V1); (b) compliance matrix maps to "evidence paths" but not to automated compliance checks; (c) compliance drift trending is implemented but relies on architecture run outputs, not external compliance scans.

**Tradeoffs:** Self-attestation with roadmap honesty is the correct pre-revenue posture. Compliance investment should follow revenue signals.

**Recommendations:** (1) Automate compliance matrix evidence collection into the procurement pack build. Timeline: v1.1.

---

#### 20. Procurement Readiness (Score: 74, Weight: 2, Weighted Deficiency: 52.0)

**Why this score:** Procurement pack is CLI-built with manifest, SHA-256 checksums, redaction report, and canonical paths enforced in CI. Objection playbook exists. Customer onboarding playbook (6-week pilot). Fast lane document. Assurance status canonical wording. However: (a) pack includes templates not yet filled (pen-test SoW, redacted summary); (b) procurement responses rely on self-attestation; (c) no SOC 2 report to include (deferred — not scored against V1).

**Tradeoffs:** Having the procurement machinery ready before the first enterprise deal is the right sequencing.

**Recommendations:** (1) Do a dry-run procurement pack submission against a mock RFP to identify gaps. Timeline: v1.

---

#### 21. Interoperability (Score: 78, Weight: 2, Weighted Deficiency: 44.0)

**Why this score:** OpenAPI v1 contract with snapshot testing. AsyncAPI spec for webhooks. CloudEvents envelope support. Integration event catalog (machine-readable JSON). SCIM 2.0 for identity provisioning. Azure Service Bus integration. REST API with versioning and deprecation policy. CLI as API client. Generated TypeScript types and .NET API client. Azure DevOps PR decoration. However: (a) no MCP server (V1.1 — not scored); (b) no generic webhook transformer for arbitrary targets; (c) API versioning is v1 only — no experience with version migration.

**Tradeoffs:** Focusing on the most common enterprise integration patterns (REST, SCIM, ITSM, chat-ops) before exotic protocols is correct prioritization.

**Recommendations:** (1) Publish the OpenAPI spec to a developer portal or SwaggerHub equivalent. Timeline: v1.1.

---

#### 22. Reliability (Score: 78, Weight: 2, Weighted Deficiency: 44.0)

**Why this score:** Health checks (liveness, readiness, deep), circuit breakers on LLM calls, fallback agent completion client, retry policies (Polly via LlmCallResilienceDefaults), data consistency orphan probes with escalating enforcement, foreign key authority chain constraints, startup validation (fail-fast on misconfiguration). Production safety rules prevent misconfigured billing. However: (a) no production deployment evidence; (b) staging chaos exercise is scheduled but first run may not be completed; (c) multi-region failover is documented in Terraform but untested; (d) SLA targets (99.9%) are engineering targets without production measurement.

**Tradeoffs:** Pre-production reliability engineering is strong; production validation requires actual deployments.

**Recommendations:** (1) Execute and document the first chaos exercise results. (2) Run the hosted availability probe against staging for 30 days and publish rollup. Timeline: v1.

---

#### 23. Data Consistency (Score: 80, Weight: 2, Weighted Deficiency: 40.0)

**Why this score:** Strong data consistency engineering: orphan probes with Warn/Alert/Quarantine modes, foreign key authority chain (WITH NOCHECK for brownfield), golden manifest schema validation, idempotent run creation, optimistic concurrency on governance state, data consistency mode readiness report script. The enforcement escalation path is well-designed. However: (a) quarantine is staging-recommended, not production-default; (b) some consistency checks are detection-only (reconciliation is manual); (c) the `DataConsistencyEnforcementOptions.Mode` defaults may be too permissive for production.

**Tradeoffs:** Detection-first approach avoids data loss from aggressive automated remediation; the escalation model is appropriate.

**Recommendations:** (1) Default production appsettings to `Mode=Alert` with documented operator guidance. Timeline: v1.

---

#### 24. Maintainability (Score: 80, Weight: 2, Weighted Deficiency: 40.0)

**Why this score:** Good modularity (49 projects with clear boundaries), Dapper over heavy ORM, typed contracts, DI-based composition, contributor code map, system map. NEXT_REFACTORINGS.md tracks tech debt intentionally. Architecture invariant catalog provides a maintenance north star. However: (a) some orchestrators are complex with many dependencies; (b) the documentation volume itself requires maintenance; (c) formal architecture fitness functions are not yet automated as CI tests.

**Tradeoffs:** Comprehensive documentation aids maintainability but creates its own maintenance burden.

**Recommendations:** (1) Add doc-freshness CI checks for critical operator docs. (2) Implement architecture fitness functions as automated tests. Timeline: v1.1.

---

#### 25. Explainability (Score: 84, Weight: 2, Weighted Deficiency: 32.0)

**Why this score:** Structured per-finding explainability with 5 trace fields, completeness analyzer with FsCheck property tests, OTel metric for completeness ratio, explanation faithfulness heuristic with fallback budget SLO, deterministic per-finding evidence endpoint (no LLM on the read path), aggregate run explanation with faithfulness fallback counter. This is one of the product's strongest differentiators — no competitor offers this depth.

**Tradeoffs:** Heuristic faithfulness is acknowledged as coarse; embedding-based similarity is a documented future option. Honest about limitations.

**Recommendations:** (1) Add a buyer-facing explanation quality badge on the run detail page. Timeline: v1.

---

#### 26. Azure Compatibility / SaaS Deployment Readiness (Score: 80, Weight: 2, Weighted Deficiency: 40.0)

**Why this score:** Terraform modules for Container Apps, SQL, Front Door/WAF, private endpoints, Blob, Key Vault, failover groups, OTEL collector. Docker Compose profiles. Container images with health checks. SaaS stack ordering document. Deployment runbook. Staging deployment checklist. Apply-SaaS script. However: (a) no evidence of successful Azure production deployment from repo artifacts; (b) **brownfield** stacks may still carry legacy Terraform **state addresses** until **`terraform state mv`** runs (greenfield sources already Phase **7.5** clean per repo — owner approved wrapping remainder **with this improvement batch, 2026-05-09**); (c) cost profile documents exist but are projections.

**Tradeoffs:** Having IaC ready before deployment is correct; the gap is validation evidence.

**Recommendations:** (1) Run terraform plan against a staging subscription and commit the plan output summary. (2) Publish staging deployment evidence. Timeline: v1.

---

#### 27-46: Remaining Qualities (summarized for brevity)

**Stickiness (72, W:1):** Governance workflows, audit trail, and manifest versioning create switching costs. Gap: no evidence of actual retention data. v1.1.

**Template/Accelerator Richness (60, W:1):** Finding engine template exists. Integration recipe templates. However, no pre-built assessment templates for common scenarios (cloud migration, security review). v1.

**Accessibility (72, W:1):** axe-core with WCAG 2.2 AA target, jest-axe in Vitest, Playwright axe in live E2E, accessibility self-attestation. Gap: no screen reader testing evidence, no keyboard navigation tests. v1.1.

**Customer Self-Sufficiency (65, W:1):** Extensive docs, CLI doctor, support bundle, troubleshooting guide. Gap: no in-product help center, no searchable knowledge base, no community forum. v1.1.

**Change Impact Clarity (78, W:1):** Comparison runs with structured deltas, breaking changes doc, manifest versioning. Strong for V1.

**Availability (76, W:1):** Health checks, synthetic probes, RTO/RPO targets documented. Gap: no production availability data. v1.

**Performance (76, W:1):** k6 CI smoke (merge-blocking), burst/soak scheduled tests, performance baselines. Gap: real-LLM latency benchmarks thin. v1.

**Scalability (72, W:1):** Optional Redis, per-tenant databases, configurable rate limits. Gap: no multi-replica production evidence; distributed cache is V2. v1.1.

**Supportability (82, W:1):** CLI doctor, support bundle, correlation IDs, troubleshooting docs, runbooks. Strong.

**Manageability (78, W:1):** Configuration catalog, startup validation, admin diagnostics. Gap: no admin UI for configuration changes. v1.1.

**Deployability (78, W:1):** Docker, Compose, Terraform, health checks, DbUp auto-migration. Gap: no CI/CD pipeline deploying to Azure (CD pipeline doc exists but is conceptual). v1.

**Observability (86, W:1):** Excellent. OpenTelemetry with Azure Monitor, OTLP, Prometheus. Custom histograms and counters for agent output, authority pipeline, circuit breakers, LLM tokens, data consistency, explanation faithfulness. Grafana dashboard JSON committed. Alert rules in Prometheus YAML. Console exporter for local dev.

**Testability (84, W:1):** Multi-tier test structure, FsCheck property tests, WebApplicationFactory integration, k6 load tests, Playwright E2E (mock + live), OpenAPI snapshot, eval corpus. Strong.

**Modularity (82, W:1):** 49 projects with clear boundaries, contracts separate from implementation, DI-based composition, thin CLI over API.

**Extensibility (80, W:1):** Finding engine plugin template, integration event catalog, configurable alert rules, policy packs. MCP as V1.1 membrane.

**Evolvability (78, W:1):** ADR catalog, architecture invariants, strangler pattern for coordinator→authority, versioned APIs with deprecation policy.

**Documentation (88, W:1):** Exceptional volume and quality. 662+ docs, scope headers enforced by CI, five-doc spine, architecture poster, operator atlas, multiple persona paths. Risk: documentation maintenance burden.

**Azure Ecosystem Fit (82, W:1):** Entra ID, Key Vault, Azure SQL, Blob Storage, Container Apps, Front Door/WAF, Service Bus, Azure OpenAI. Private endpoints throughout.

**Cognitive Load (62, W:1):** Concept model is deep (runs, manifests, findings, authority, governance, policy packs, layers, tiers, scopes). Progressive disclosure helps but the underlying model requires significant domain learning. v1.

**Cost-Effectiveness (74, W:1):** Per-tenant cost model documented. LLM cost guardrails. Pilot profile with cost estimates. Gap: budget trackers per-process only; actual cloud costs unvalidated. v1.

---

## 3. Top 12 Most Important Weaknesses

1. **No market validation or customer proof.** Zero deployed customers, zero reference cases, zero measured ROI. All commercial claims are projections.

2. **Real-LLM output quality evidence is thin.** Simulator path is excellent; actual model output quality under diverse real inputs is unproven beyond template-level evidence requests.

3. **High adoption barrier for first-time operators.** Prerequisites (Docker, SQL, .NET 10, Node 22, auth config) and concept model complexity create significant friction before first value.

4. **Commerce activation lags declared motion.** In-repo wiring supports self-serve trial and Marketplace billing surfaces, but **production checkout** and a **Published** Marketplace offer remain owner milestones (`docs/library/V1_DEFERRED.md` §6b). Until those gates close, the stated **next-90-days mix** cannot fully execute end-to-end.

5. **Per-process LLM budget trackers are a multi-replica correctness risk.** Documented but unresolved for scaled deployments where multiple Container Apps replicas share tenant budgets.

6. **Architecture invariants are convention-enforced, not analyzer-enforced.** INV-001 through INV-015 catalog intent without automated CI enforcement, creating regression risk on critical invariants like tenant identity boundary.

7. **No production deployment evidence.** All reliability, availability, and performance claims are based on CI, staging probes, and local testing — no production data.

8. **ITSM connector live validation is manual/smoke-level.** Jira, ServiceNow, Confluence, Slack connectors are code-complete with mock CI but vendor-side testing relies on manual operator procedures.

9. **Cognitive load for new operators is high.** The concept model (authority, findings, manifests, governance, layers, tiers, scopes, policy packs) requires significant domain learning before productive use.

10. **ROI model is theoretical.** Break-even calculations exist but no actual pilot has produced measured time savings or cost reduction data.

11. **Phase 7 legacy naming creates confusion.** Residual tokens mainly surface for **brownfield Terraform remote state** and stray docs/config references — SQL RLS rename shipped via DbUp. **Mitigation:** owner approved completing Phase **7.5** **`state mv`** / verification **with the current improvement batch (2026-05-09)** per [`docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md`](docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md).

12. **Architecture fitness functions are not yet automated.** The invariant catalog (INV-001 through INV-015) documents the right intent, but absence of Roslyn analyzers and architecture tests means violations accumulate silently until code review catches them.

---

## 4. Top 6 Monetization Blockers

1. **Production self-serve + Marketplace un-hold.** Live Stripe configuration with rotated production webhook secrets, Marketplace offer at `Published`, DNS/signup hostname alignment, and `BillingProductionSafetyRules` passing — required for the **declared 90-day motion** — remain owner milestones per `V1_DEFERRED.md` §6b. Until then, buyers effectively rely on quote/order-form paths or non-production checkout UX.

2. **No reference customer or case study.** Enterprise buyers need social proof. The reference-customer table exists with placeholder rows but nothing is published.

3. **Quote-to-cash requires manual legal review.** Order form template needs legal sign-off per transaction. Low-touch purchase still needs standardized click-through terms where applicable.

4. **No measured ROI to cite in sales conversations.** The ROI model projects $294K savings but no actual measurement exists. Difficult to justify budget allocation.

5. **Pricing / Marketplace / trial coherence.** `/pricing`, Marketplace storefront copy, and in-product trial entry must stay aligned so **self-serve + Marketplace** buyers do not hit dead ends (placeholder checkout, conflicting tier messaging, or quote-only flows where checkout was expected).

6. **Marketplace discovery unavailable until Published.** Azure Marketplace SaaS offer is documented and wired but not in `Published` state — eliminating the procurement channel half of the declared motion.

---

## 5. Top 6 Enterprise Adoption Blockers

1. **SOC 2 CPA attestation absent (B-informational, not scored against V1).** Many enterprise procurement processes hard-require SOC 2 Type II. Self-assessment and roadmap honesty partially mitigate but will block rigid RFP-driven purchases.

2. **No third-party pen test report (V2 — not scored).** Security-conscious buyers request assessor-issued summaries. Owner-conducted testing and templates exist but do not satisfy formal requirements.

3. **ITSM bidirectional sync is new and unproven at scale.** Jira and ServiceNow inbound webhook sync is committed V1 GA but has no production deployment evidence. Status mapping correctness under real-world webhook volumes is untested.

4. **Self-hosted deployment complexity.** Operators who cannot use the hosted SaaS must deploy SQL Server, Container Apps, Key Vault, Front Door, and configure auth, which requires deep Azure expertise.

5. **No SLA with financial backing.** API SLOs are documented as "engineering targets, not contractual." Enterprise contracts with credits require negotiation per the pricing table's Enterprise tier.

6. **Identity federation limited to Entra ID / JWT.** Generic OIDC is "roadmap." Organizations using Okta, Ping, or other IdPs must configure JWT claim mapping rather than using a native integration.

---

## 6. Top 6 Engineering Risks

1. **Multi-replica LLM budget tracker drift.** `LlmDailyTenantBudgetTracker` and `LlmMonthlyTenantDollarBudgetTracker` operate per-process. Under Container Apps horizontal scaling, two replicas could independently exceed a tenant's budget before either detects the breach. INV-004 documents this as P1 but enforcement is pending.

2. **Tenant identity boundary enforcement is convention-only.** INV-001 requires "exactly one derivation of tenant id per request scope" but the Roslyn analyzer and parallel-tenant integration tests are in the enforcement sketch, not in CI today. A bug in scope derivation could cause cross-tenant data access.

3. **Quality gate heuristics may miss semantically incorrect but structurally valid LLM outputs.** The semantic score is a deterministic heuristic based on evidence ref count and field lengths, not semantic entailment. A model could produce plausible-looking but factually wrong findings that pass the gate.

4. **Authority chain FK constraints are WITH NOCHECK on brownfield.** Legacy catalogs install foreign keys without full-table validation. Historical orphan rows exist as known state. An operator could accidentally rely on FK integrity guarantees that don't hold for old data.

5. **Doc maintenance burden at current volume.** 662+ markdown files with scope headers, CI-enforced counts, and cross-references create a documentation debt surface proportional to the engineering surface. Stale docs are worse than no docs for operator trust.

6. **Single-developer concentration.** The breadth of the codebase (49 .csproj, Next.js UI, Python CI scripts, PowerShell tooling, Terraform modules, k6 load tests) across multiple technology stacks concentrated in one contributor creates operational continuity risk.

---

## 7. Most Important Truth

ArchLucid is an exceptionally well-engineered product that has invested heavily in the right architectural qualities — explainability, governance, auditability, security — but has not yet proven that real buyers will pay at scale. **You have declared the next 90 days around self-serve trial plus Azure Marketplace:** the highest-leverage work is **closing the commerce and onboarding loop** (Partner Center publication, production billing, DNS, tenant provisioning, first-run success metrics) **in parallel with** landing paying or trial-converted customers and measuring actual value delivery — not adding marginal features ahead of that motion.

---

## 8. Top Improvement Opportunities

### Improvement 1: Execute and Commit Real-LLM Golden Cohort Evidence

**Title:** Execute and Commit Real-LLM Golden Cohort Evidence

**Why it matters:** AI/Agent Readiness is the second-highest weighted deficiency. The simulator path is excellent but buyers need confidence that real Azure OpenAI completions produce quality outputs. The `REAL_LLM_RUN_EVIDENCE_TEMPLATE.md` exists but no evidence artifacts are committed.

**Expected impact:** Directly improves AI/Agent Readiness (+6-8 pts), Correctness (+3-5 pts), Trustworthiness (+2-3 pts). Weighted readiness impact: +0.8-1.3%.

**Affected qualities:** AI/Agent Readiness, Correctness, Trustworthiness, Proof-of-ROI Readiness.

**Status:** Actionable now.

**Cursor prompt:**

```
Execute the golden cohort real-LLM gate documented in docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md. The goal is to produce committed evidence artifacts proving real Azure OpenAI completions meet quality thresholds.

Steps:
1. Read docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md and docs/quality/REAL_LLM_RUN_EVIDENCE_TEMPLATE.md for the exact procedure and template.
2. Read docs/library/AGENT_EVAL_CORPUS.md and scripts/ci/eval_agent_corpus.py for the eval corpus structure.
3. Execute the eval corpus against real Azure OpenAI (requires AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT_NAME environment variables).
4. Capture the markdown report output using --markdown-report flag.
5. For each successful run, fill in the REAL_LLM_RUN_EVIDENCE_TEMPLATE with actual metrics (structural completeness ratio, semantic scores, quality gate outcomes, execution mode labels).
6. Commit the evidence file(s) to docs/quality/ with a descriptive name including the date.
7. Update docs/library/V1_READINESS_SUMMARY.md to reference the new evidence.

Acceptance criteria:
- At least 1 committed evidence file in docs/quality/ with real metrics (not template placeholders).
- Evidence file references actual run IDs and model deployment names.
- Quality gate outcomes (pass/warn/reject) are recorded.
- V1_READINESS_SUMMARY.md references the evidence.

Constraints:
- Do NOT modify the eval corpus scripts or quality gate thresholds.
- Do NOT commit Azure OpenAI credentials.
- Do NOT change appsettings files.
- If Azure OpenAI is unavailable, document the attempt and specific error in a short note.
```

---

### Improvement 2: Move LLM Budget Trackers to Durable SQL State

**Title:** Move LLM Budget Trackers to Durable SQL State

**Why it matters:** INV-004 identifies per-process budget trackers as a P1 multi-replica correctness risk. Under horizontal scaling, two replicas could independently exceed tenant budgets. This is a real production safety issue for cost governance.

**Expected impact:** Directly improves AI/Agent Readiness (+3-5 pts), Correctness (+3-4 pts), Reliability (+2-3 pts), Cost-Effectiveness (+3-5 pts). Weighted readiness impact: +0.5-0.9%.

**Affected qualities:** AI/Agent Readiness, Correctness, Reliability, Cost-Effectiveness, Scalability.

**Status:** Actionable now.

**Cursor prompt:**

```
Migrate LLM budget tracking from per-process in-memory state to SQL-backed durable state for multi-replica safety, per architecture invariant INV-004 in docs/library/ARCHITECTURE_INVARIANTS.md.

Steps:
1. Read ArchLucid.AgentRuntime/LlmDailyTenantBudgetTracker.cs and ArchLucid.AgentRuntime/LlmMonthlyTenantDollarBudgetTracker.cs to understand current per-process tracking.
2. Read docs/library/ARCHITECTURE_INVARIANTS.md INV-004 for the enforcement sketch (SQL row with optimistic concurrency).
3. Add a new SQL table dbo.LlmTenantBudgetState with columns: TenantId (uniqueidentifier), BudgetPeriod (nvarchar — 'Daily' or 'Monthly'), PeriodKey (nvarchar — date or month string), TokensConsumed (bigint), EstimatedDollarCost (decimal(18,6)), RowVersion (rowversion for optimistic concurrency), UpdatedUtc (datetime2).
4. Add the DDL to ArchLucid.Persistence/Scripts/ArchLucid.sql and create a new numbered DbUp migration.
5. Create an ILlmTenantBudgetRepository interface in ArchLucid.Core with ReserveAsync and SettleAsync methods using optimistic concurrency.
6. Implement the repository in ArchLucid.Persistence using Dapper with rowversion-based optimistic concurrency.
7. Update LlmDailyTenantBudgetTracker and LlmMonthlyTenantDollarBudgetTracker to delegate to the repository when StorageProvider is Sql, falling back to in-memory for non-Sql modes.
8. Add unit tests for the repository and integration tests with two concurrent callers verifying budget is not double-spent.

Acceptance criteria:
- New migration creates dbo.LlmTenantBudgetState with optimistic concurrency column.
- Budget trackers use SQL when StorageProvider=Sql.
- Two-concurrent-caller test proves budget is respected across "replicas."
- Existing in-memory fallback preserved for non-Sql configurations.
- Follow existing code patterns: Dapper, ISqlConnectionFactory, scope context.

Constraints:
- Do NOT change the public API contract or any controller signatures.
- Do NOT change appsettings schema — use existing StorageProvider to select implementation.
- Do NOT add a new NuGet dependency.
- Follow the SingleLineThrowNoBraces rule for guard clauses.
- One blank line before if/foreach statements per user rules.
- Each class in its own file.
```

---

### Improvement 3: Implement Roslyn Analyzer for Tenant Identity Boundary (INV-001)

**Title:** Implement Roslyn Analyzer for Tenant Identity Boundary (INV-001)

**Why it matters:** INV-001 is P0 — cross-tenant data access is an "irreversible reputational failure." Currently enforced by convention only. A Roslyn analyzer preventing `IHttpContextAccessor` or `ClaimsPrincipal` reads below the API/Middleware layer would catch violations at compile time.

**Expected impact:** Directly improves Correctness (+4-6 pts), Security (+3-4 pts), Architectural Integrity (+3-4 pts). Weighted readiness impact: +0.5-0.8%.

**Affected qualities:** Correctness, Security, Architectural Integrity, Trustworthiness.

**Status:** Actionable now.

**Cursor prompt:**

```
Implement a Roslyn diagnostic analyzer that enforces architecture invariant INV-001 (tenant identity boundary) from docs/library/ARCHITECTURE_INVARIANTS.md.

The invariant: "Tenant identity is established once at the host boundary and passed as typed context; deeper layers never re-parse claims or ambient HTTP to infer tenant."

Steps:
1. Read docs/library/ARCHITECTURE_INVARIANTS.md INV-001 for full context.
2. Read ArchLucid.Core/Scoping/IScopeContextProvider.cs to understand the typed scope model.
3. Create a new project ArchLucid.Analyzers (or add to an existing analyzer project if one exists) with a DiagnosticAnalyzer that:
   - Reports a warning (ARCH001) when any code in ArchLucid.Application, ArchLucid.Decisioning, ArchLucid.AgentRuntime, ArchLucid.Persistence, ArchLucid.KnowledgeGraph, ArchLucid.Provenance, ArchLucid.Retrieval, ArchLucid.ContextIngestion, ArchLucid.ArtifactSynthesis, ArchLucid.Core, ArchLucid.Contracts, or ArchLucid.Notifications references IHttpContextAccessor, HttpContext, or ClaimsPrincipal directly.
   - Allow-lists ArchLucid.Api and ArchLucid.Host.* projects (these are the boundary).
4. Add the analyzer as a project reference to the affected .csproj files.
5. Add tests using Microsoft.CodeAnalysis.Testing that verify violations are reported and allow-listed code is clean.
6. Fix any existing violations found (there may be some — refactor to use IScopeContextProvider).

Acceptance criteria:
- Analyzer reports ARCH001 for IHttpContextAccessor usage in non-boundary projects.
- Existing code in ArchLucid.Application and below does not trigger the analyzer (or violations are fixed).
- Tests prove the analyzer catches violations and allows boundary-layer usage.
- Analyzer runs as part of normal dotnet build.

Constraints:
- Do NOT change the IScopeContextProvider interface or existing scope derivation logic.
- Do NOT add the analyzer to test projects.
- Use Microsoft.CodeAnalysis.CSharp.Workspaces for the analyzer; pin to the version compatible with the repo's .NET 10 SDK.
- Each class in its own file.
```

---

### Improvement 4: Hosted sandbox demo environment — OUT OF SCOPE

**Title:** Hosted sandbox demo environment

**Status:** **Out of scope** for this assessment and planning window (**owner, 2026-05-09**). A dedicated always-on hosted product sandbox is not a committed deliverable; subscription/RG/budget/DNS questions under this improvement do not apply until scope is reopened.

---

### Improvement 5: Default Production Data Consistency to Alert Mode

**Title:** Default Production Data Consistency to Alert Mode

**Why it matters:** Data Consistency enforcement defaults may be too permissive for production. Setting `Mode=Alert` by default ensures orphan detection surfaces operationally without requiring explicit operator opt-in.

**Expected impact:** Directly improves Data Consistency (+3-5 pts), Reliability (+2-3 pts), Correctness (+1-2 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Data Consistency, Reliability, Correctness.

**Status:** Actionable now.

**Cursor prompt:**

```
Set the default data consistency enforcement mode to Alert in production appsettings profiles.

Steps:
1. Read ArchLucid.Api/appsettings.Production.json and appsettings.Staging.json for current DataConsistency settings.
2. Read docs/data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md for the mode definitions (Warn, Alert, Quarantine).
3. In appsettings.Production.json and appsettings.Staging.json, set DataConsistency:Enforcement:Mode to "Alert" if not already set.
4. In appsettings.json (base), keep the default as "Warn" so development environments are not affected.
5. Update docs/data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md operational considerations to note that Production and Staging default to Alert mode.
6. Verify that the existing AlertThreshold default is reasonable (should be > 0 to avoid noise).

Acceptance criteria:
- appsettings.Production.json contains DataConsistency:Enforcement:Mode = "Alert".
- appsettings.Staging.json contains DataConsistency:Enforcement:Mode = "Alert".
- appsettings.json (base) remains "Warn" or unset.
- Documentation updated to reflect the change.
- No test changes required (mode selection is configuration, not code).

Constraints:
- Do NOT change the enforcement logic or probe queries.
- Do NOT enable Quarantine mode by default (that requires explicit operator sign-off per the doc).
- Do NOT change any migration files.
```

---

### Improvement 6: Add First-Time Operator In-UI Onboarding Checklist

**Title:** Add First-Time Operator In-UI Onboarding Checklist

**Why it matters:** Adoption Friction and Time-to-Value are high-weight deficiencies. The Core Pilot checklist exists in docs but is not surfaced in the UI. A contextual in-UI guide reduces the gap between opening the product and completing the first pilot.

**Expected impact:** Directly improves Adoption Friction (+5-7 pts), Time-to-Value (+4-6 pts), Usability (+3-4 pts). Weighted readiness impact: +0.6-1.0%.

**Affected qualities:** Adoption Friction, Time-to-Value, Usability, Cognitive Load.

**Status:** Actionable now.

**Cursor prompt:**

```
Add an interactive onboarding checklist component to the operator UI home page that guides first-time operators through the Core Pilot steps.

Steps:
1. Read docs/CORE_PILOT.md for the four Core Pilot steps (Configure, Start, Create Run, Execute, Commit, Review).
2. Read archlucid-ui/src/app/(operator)/page.tsx (home page) for the current layout.
3. Read archlucid-ui/src/components/ to understand existing component patterns (LayerHeader, OperatorPageHeader, etc.).
4. Create a new component archlucid-ui/src/components/CorePilotChecklist.tsx that:
   - Displays a vertical step list matching the Core Pilot steps.
   - Each step shows: title, one-line description, and a "Mark complete" checkbox.
   - Checklist state persists in localStorage (key: archlucid-pilot-checklist).
   - When all steps are complete, shows a congratulatory message and a "Hide checklist" option.
   - Includes a "Show checklist" toggle when hidden (persisted in localStorage).
   - Links each step to the relevant docs page or UI route.
5. Add the checklist to the home page, above or alongside the existing content.
6. Add a Vitest test for the component (render, toggle, localStorage persistence).
7. Style using existing Tailwind/shadcn patterns from the codebase.

Acceptance criteria:
- CorePilotChecklist renders on the home page for new visitors.
- Steps match docs/CORE_PILOT.md content.
- State persists across page reloads via localStorage.
- Checklist can be hidden and shown again.
- Vitest test covers render and localStorage behavior.
- No changes to API or backend code.

Constraints:
- Do NOT add new npm dependencies.
- Do NOT change existing home page components — add alongside them.
- Use existing Radix/shadcn primitives (Collapsible, etc.).
- Keep the component under 200 lines.
- Follow the existing code patterns in archlucid-ui/src/components/.
```

---

### Improvement 7: Complete Phase 7.5 Terraform State Naming Cleanup

**Title:** Complete Phase 7.5 Terraform State Naming Cleanup

**Owner approval (2026-05-09):** **Approved** to execute **with this batch of improvements** — no separate deferral milestone; coordinate **`terraform state mv`** only on stacks where remote state still holds legacy resource addresses (see runbook below). Greenfield **`infra/**/*.tf`** sources are already Phase **7.5** clean on main.

**Why it matters:** Brownfield remote state can lag renamed `.tf` resources; unresolved **`state`** drift blocks confident applies and keeps weakness §3 item **11** open.

**Expected impact:** Azure Compatibility / SaaS Deployment Readiness (+2–4 pts), Maintainability (+1–3 pts). Weighted readiness impact: small (+0.1–0.3%) once evidenced.

**Affected qualities:** Azure Compatibility, Maintainability.

**Status:** Actionable now (**this improvement batch**).

**Cursor prompt:**

```
Complete Phase 7.5 Terraform alignment for any actively-applied stacks that still use legacy state addresses.

Steps:
1. Read docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md — greenfield vs brownfield split.
2. For brownfield stacks only: follow docs/archive/TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md for terraform state mv procedures; pair with docs/library/DEPLOYMENT_TERRAFORM.md and docs/library/REFERENCE_SAAS_STACK_ORDER.md for apply order.
3. Inventory infra/terraform*, infra/terraform-* roots that your environments actually apply (staging/production); run terraform plan per workspace before and after state moves.
4. Verify rg "archiforge" infra --glob "*.tf" stays clean (sources); separately confirm remote state addresses match current resource blocks for roots you updated.
5. Document completion (which workspaces, dates, plan summaries) in docs appropriate to your ops practice — do not commit secrets or full state files.

Acceptance criteria:
- Every actively-applied Terraform workspace either has no legacy-address drift documented as N/A (greenfield-only) OR shows completed state mv / refreshed state with passing plan.
- No regression to infra/**/*.tf archiforge naming (CI expectation).
- Operator-facing note if any stack remains intentionally unmigrated (explicit rationale).

Constraints:
- Do NOT rename Azure resources in-place without following the archived state mv tables — prefer mv then apply pattern per archive doc.
- Do NOT commit .tfstate or backend credentials.
```

---

### Improvement 8: Add Adversarial Eval Scenarios to Agent Corpus

**Title:** Add Adversarial Eval Scenarios to Agent Corpus

**Why it matters:** `SONNET_AI_FUNCTIONALITY_REVIEW_BRIEF.md` identifies missing adversarial scenarios (hallucination, citation mismatch, contradictory manifest, oversized context) as a coverage gap. These are critical for proving AI correctness under edge cases.

**Expected impact:** Directly improves AI/Agent Readiness (+3-5 pts), Correctness (+2-3 pts). Weighted readiness impact: +0.4-0.6%.

**Affected qualities:** AI/Agent Readiness, Correctness, Trustworthiness.

**Status:** Actionable now.

**Cursor prompt:**

```
Add adversarial evaluation scenarios to the agent eval corpus to test AI correctness under edge cases.

Steps:
1. Read docs/library/AGENT_EVAL_CORPUS.md for the corpus structure and how scenarios are defined.
2. Read tests/eval-corpus/ to understand the existing scenario format (manifest, recordings, expected outcomes).
3. Read tests/eval-datasets/prompt-injection/ for existing prompt injection test patterns.
4. Create at least 4 new scenarios under tests/eval-corpus/adversarial/:
   a. hallucination-detection: An input that would tempt the model to fabricate non-existent Azure services or made-up compliance frameworks. Expected: quality gate catches fabricated evidence refs.
   b. citation-mismatch: An input where the context explicitly contradicts what a naive summary would claim. Expected: faithfulness checker flags low overlap.
   c. contradictory-manifest: An input with internally contradictory requirements (e.g., "must be serverless" + "must use dedicated VMs"). Expected: findings acknowledge the contradiction rather than silently picking one.
   d. oversized-context: An input that exceeds typical token budgets. Expected: graceful truncation or error, not silent data loss.
5. For each scenario, create the input JSON matching the AgentResult schema and an expected-outcome metadata file.
6. Update scripts/ci/agent-reference-baselines.json to include the new golden files if applicable.
7. Run scripts/ci/eval_agent_corpus.py --dry-run to verify the scenarios are well-formed.

Acceptance criteria:
- 4 new scenario directories under tests/eval-corpus/adversarial/.
- Each has input JSON and expected-outcome metadata.
- eval_agent_corpus.py --dry-run succeeds.
- agent-reference-baselines.json updated if new golden files are added.
- No changes to existing scenarios or the eval script logic.

Constraints:
- Do NOT modify the quality gate thresholds.
- Do NOT change the AgentResult schema.
- Use realistic but synthetic inputs — no real customer data.
- Follow existing file naming conventions in tests/eval-corpus/.
```

---

### Improvement 9: Validate Golden Manifest Schema by Default in Production

**Title:** Validate Golden Manifest Schema by Default in Production

**Why it matters:** `AuthorityCommitSchemaValidationOptions.ValidateGoldenManifestSchema` controls whether committed manifests are schema-validated. Defaulting to true in production prevents structurally invalid manifests from being persisted, improving correctness guarantees.

**Expected impact:** Directly improves Correctness (+2-4 pts), Data Consistency (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Correctness, Data Consistency, Reliability.

**Status:** Actionable now.

**Cursor prompt:**

```
Ensure golden manifest schema validation is enabled by default in production and staging appsettings profiles.

Steps:
1. Read ArchLucid.Contracts/Architecture/AuthorityCommitSchemaValidationOptions.cs for the option structure.
2. Read ArchLucid.Api/appsettings.Production.json and appsettings.Staging.json.
3. Read ArchLucid.Application/Runs/Orchestration/AuthorityDrivenArchitectureRunCommitOrchestrator.cs for how the option is consumed.
4. In appsettings.Production.json, ensure ArchLucid:AuthorityCommit:ValidateGoldenManifestSchema is true.
5. In appsettings.Staging.json, ensure the same setting is true.
6. Verify that the base appsettings.json does not override this (it should default to false or be absent so dev is flexible).
7. If any test relies on this being false in production-like configs, update the test to explicitly set the override.

Acceptance criteria:
- appsettings.Production.json has ValidateGoldenManifestSchema = true.
- appsettings.Staging.json has ValidateGoldenManifestSchema = true.
- Base appsettings.json does not force it true (development flexibility preserved).
- Existing tests pass.

Constraints:
- Do NOT change the schema validation logic itself.
- Do NOT change the AuthorityCommitSchemaValidationOptions class.
- Do NOT change any controller or orchestrator code.
```

---

### Improvement 10: Build Pilot Report Card Artifact Generator

**Title:** Build Pilot Report Card Artifact Generator

**Why it matters:** Proof-of-ROI Readiness is a high-weight deficiency. A pilot report card that auto-generates measurable outcomes (time from request to commit, finding count, governance actions, export count) from actual run data would provide concrete ROI evidence for sales conversations and case studies.

**Expected impact:** Directly improves Proof-of-ROI Readiness (+5-7 pts), Marketability (+2-3 pts), Executive Value Visibility (+2-3 pts). Weighted readiness impact: +0.4-0.7%.

**Affected qualities:** Proof-of-ROI Readiness, Marketability, Executive Value Visibility, Stickiness.

**Status:** Actionable now.

**Cursor prompt:**

```
Build a pilot report card artifact generator that summarizes measurable outcomes from completed architecture runs for a tenant.

Steps:
1. Read docs/library/PILOT_ROI_MODEL.md for the ROI metrics and break-even model.
2. Read ArchLucid.Application/Runs/ to understand how run data is queried.
3. Read ArchLucid.Application/ArchitectureApplicationService.cs for existing service patterns.
4. Create a new service ArchLucid.Application/Pilots/PilotReportCardService.cs with:
   - A method GenerateReportCardAsync(tenantId, workspaceId, projectId) that:
     - Queries all completed runs in scope.
     - Calculates: total runs, average request-to-commit duration, total findings generated, findings by severity, governance actions (approvals, rejections), exports generated, unique artifact types produced.
     - Returns a PilotReportCard DTO with these metrics plus the date range covered.
5. Create ArchLucid.Contracts/Pilots/PilotReportCard.cs with the DTO.
6. Add a controller endpoint: GET /v1/pilots/report-card (ReadAuthority policy).
7. Add unit tests for the service using the existing test patterns (mock repositories).
8. Add the route to the OpenAPI snapshot (regenerate with ARCHLUCID_UPDATE_OPENAPI_SNAPSHOT=1).

Acceptance criteria:
- GET /v1/pilots/report-card returns a JSON report card with documented metrics.
- Service calculates metrics from actual run data.
- Unit tests verify calculation logic.
- OpenAPI snapshot updated.
- No new external dependencies.

Constraints:
- Do NOT add new SQL tables — query existing run, manifest, findings, and governance tables.
- Do NOT change existing controller or service signatures.
- Follow existing DI registration patterns in ArchLucid.Host.Composition.
- Use Dapper for any new queries.
- Each class in its own file.
- Prefer LINQ over foreach.
- Concrete types over var.
```

---

### DEFERRED Improvement 11: Activate Self-Serve Stripe Trial for Production

**Title:** DEFERRED — Activate Self-Serve Stripe Trial for Production

**Reason deferred:** Commerce un-hold (Stripe live keys + Marketplace Published state) is explicitly V1.1 per V1_DEFERRED.md §6b. Requires owner-only actions: Partner Center seller verification, tax profile, payout account filing, and DNS cutover for signup.archlucid.net.

**Owner alignment (2026-05-09):** Declared primary motion for the **next 90 days** is **self-serve trial plus Marketplace** — completing this deferred slice is **on the critical path** for that motion (scores unchanged until shipped). **Owner target:** Marketplace **`Published` by 2026-06-20**, with **committed pilot start by the same date**.

**Specific information needed:** Owner completion of Partner Center seller verification, tax profile, payout account setup, DNS registrar access for signup.archlucid.net, and explicit go-ahead to flip live keys.

**Progress note:** Partner Center seller / legal verification **complete** (**owner confirmation**). Remaining commerce un-hold items: **tax profile**, **payout account**, **DNS** for `signup.archlucid.net`, **explicit go-ahead** to rotate live Stripe / Marketplace production config per `BillingProductionSafetyRules`.

### Improvement 12: Add RBAC Boundary Integration Tests for All Controllers

**Title:** Add RBAC Boundary Integration Tests for All Controllers

**Why it matters:** Security is a high-weight quality. While policies (`ReadAuthority`, `ExecuteAuthority`, `AdminAuthority`) are applied via attributes, there's no systematic test that every controller action enforces the expected policy. A boundary test suite would catch accidental policy omissions.

**Expected impact:** Directly improves Security (+2-3 pts), Correctness (+1-2 pts), Testability (+1-2 pts). Weighted readiness impact: +0.2-0.3%.

**Affected qualities:** Security, Correctness, Testability.

**Status:** Actionable now.

**Cursor prompt:**

```
Add an integration test that systematically verifies RBAC policy enforcement on every public controller action in the v1 API surface.

Steps:
1. Read ArchLucid.Api.Tests/ for existing integration test patterns using WebApplicationFactory.
2. Read docs/library/ROUTE_TIER_POLICY_NAV_MATRIX.md for the expected policy-per-route mapping.
3. Read ArchLucid.Api/Controllers/ to enumerate all public controller actions.
4. Create a new test class ArchLucid.Api.Tests/Security/RbacBoundaryIntegrationTests.cs that:
   - Uses reflection to discover all controller actions with [HttpGet], [HttpPost], [HttpPut], [HttpDelete], [HttpPatch] attributes.
   - For each action, asserts that either: (a) the action or its controller has an [Authorize] attribute with a named policy, or (b) the action has [AllowAnonymous] for intentionally public routes (health, webhooks).
   - Reports any unprotected actions as test failures with the controller name and action method.
5. Add a second test that calls each non-anonymous endpoint without auth credentials and asserts 401 or 403 (not 200/2xx).
6. Add [Trait("Suite", "Core")] and [Trait("Category", "Integration")] to the test class.

Acceptance criteria:
- Test discovers all public controller actions via reflection.
- Every action is covered by either a policy attribute or explicit AllowAnonymous.
- Unauthenticated requests to protected endpoints return 401/403.
- Test runs as part of the Core integration tier.
- Any currently unprotected endpoints are flagged and fixed.

Constraints:
- Do NOT change any controller attributes unless fixing a genuine gap.
- Do NOT add new NuGet dependencies.
- Use the existing ArchLucidApiFactory test infrastructure.
- Do not use ConfigureAwait(false) in tests (per user rules).
```

---

## 9. Deferred Scope Uncertainty

All deferred items referenced in this assessment (SOC 2 CPA, design partner, commerce un-hold, third-party pen test, MCP, broader Phase 7 rename residue in product docs where applicable, distributed cache, Container Apps Jobs, PGP key) were located in `docs/library/V1_DEFERRED.md` and `docs/library/V1_SCOPE.md` §3 with clear scope pinning and owner decisions. **Hosted product sandbox** is **not** deferred here — it is **explicitly out of scope** (**owner, 2026-05-09**). **Phase 7.5 Terraform state cleanup** for brownfield stacks is **in scope for the owner-approved improvement batch (2026-05-09)** — see Improvement **7**. No deferred scope uncertainty exists — all items have explicit documentation.

---

## 10. Pending Questions for Later

### Improvement 1 (Real-LLM Golden Cohort)

- **Canonical model (answered):** **`gpt-4o`** — use for golden cohort reproducibility and buyer-facing real-LLM evidence narratives.
- **Deployment naming (answered, 2026-05-09):** **`AzureOpenAI:DeploymentName`** matches the Azure AI Foundry / Cognitive Services deployment name (no drift vs app configuration).
- **Green cohort bar (answered / adopted, 2026-05-09):** **Structural 100%** on cohort scenarios; **quality-gate rejects 0%** on canonical cohort; **semantic score p10 ≥ 0.50, p50 ≥ 0.70** (investigate on miss); **explainability trace completeness mean ≥ 0.80** across cohort findings; **adversarial scenarios qualitative** until two baseline runs establish distributions.

---

### Improvement 4 (Hosted sandbox — OUT OF SCOPE)
- **Owner decision (2026-05-09):** Dedicated hosted product sandbox **withdrawn** from this planning pass — no subscription/RG/budget/URL/auto-reset answers required unless scope reopens.

### Improvement 7 (Phase 7.5 Terraform)
- **Owner go-ahead (answered, 2026-05-09):** Approved **with this batch of improvements** — proceed with brownfield **`terraform state mv`** / verification per [`docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md`](docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md); no separate deploy-freeze constraint declared.
- **Operational detail (during execution):** Confirm which **`infra/terraform*`** roots and workspaces are actively applied; greenfield **`.tf`** sources are already Phase **7.5** clean on main.

### Improvement 11 (Stripe Trial — DEFERRED)
- **Partner Center seller verification (answered):** **Complete** (**owner confirmation**). Further Marketplace setup (offer, certification, **`Published`**) uses [`docs/go-to-market/MARKETPLACE_PUBLICATION.md`](docs/go-to-market/MARKETPLACE_PUBLICATION.md); publisher placeholders in [`docs/runbooks/MARKETPLACE_PUBLISHER_IDENTITY.md`](docs/runbooks/MARKETPLACE_PUBLISHER_IDENTITY.md).
- Tax profile and payout account filing status?
- DNS registrar access for signup.archlucid.net?

### General (owner input — partial)

- **Primary commercial motion (answered, 2026-05-09):** Next **90 days** — **mixture of self-serve trial and Azure Marketplace** (narrative updated throughout this document).
- **Marketplace + pilot dates (answered, 2026-05-09):** Azure Marketplace offer aimed at **`Published` by 2026-06-20**; **committed pilot start** aimed **by the same date** (aligned with Marketplace readiness).
- Is there a defined maximum number of concurrent pilot tenants the current infrastructure should support?
