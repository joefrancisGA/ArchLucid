> **Scope:** Internal weighted readiness assessment for repo stewards — V1 scoring boundary and backlog prompts; not a customer-facing datasheet nor an exhaustive audit substitute.

**Canonical pair:** This file is the **single current score and backlog** for weighted readiness. Read **`docs/library/ASSESSMENT_INPUTS.md`** first for the evidence contract; treat **`docs/archive/assessments/`** and archived quality narratives as **history only** — see **“One workflow (current score vs history)”** there.

# ArchLucid Assessment – Weighted Readiness 82.75%

**V1 scoring boundary:**

- **MCP:** Inbound Model Context Protocol is **explicitly out of V1** and scheduled for **V1.1** per `docs/library/V1_SCOPE.md` §3 and `docs/library/V1_DEFERRED.md` §6d. **V1.1 slice pinned** (**owner 2026-05-15**, **P12**): **seven read-only tools**, **Streamable HTTP** for production (private endpoint), optional **`stdio`** for local/self-hosted harness only — `docs/library/MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md` **§5.1**. Absence of an MCP host does not reduce any weighted quality score; REST, CLI, operator UI, webhooks, and first-party integrations are the in-contract V1 integration surfaces.
- **Hosted-trial `V1`→`V1.1` migration / expectations guide:** **Explicitly out of V1 GA** narrative-blocking claims — orientation memo **`docs/library/HOSTED_TRIAL_V1_TO_V1_1_MIGRATION_GUIDE.md`** **provided** (improvement **#10**, **`V1_DEFERRED.md` §6i**). **`(A)` V1 headline readiness is unchanged:** memo frames **V1.1** outbound deltas (commerce, MCP, Slack approvals, packs), **not** a GA prerequisite checklist rewrite.
- **Native SAML 2.0 Service Provider (workforce SSO):** **In V1 GA scope** (**owner 2026-05-15**, **`docs/library/V1_SCOPE.md` §2.12**). **`JwtBearer`** OIDC remains **first-class**; SAML **SP** augments buyer choice.
- **Third-party penetration test (external vendor):** **`V2`** per **`docs/library/V1_DEFERRED.md` §6c. **`(A)` V1 planning / execution** omits recurring **budget / vendor pen-test prompts** (**owner 2026-05-15**, **P8**). Treat absent published assessor summary as **`(B)` procurement realism** only — improvement **#18** remains **`V2`** backlog metadata, not a **V1** standing question.
- **ServiceNow bi-directional status sync:** **`V1` GA** per **`docs/library/V1_SCOPE.md` §2.13** — unchanged. **P10** (**2026-05-15**): **no** ServiceNow developer instance **yet**; owner will unblock **#22** via **cost-free** **ServiceNow Developer Program** / personal developer-style instance (**paid** sandbox **not** a **`V1` GA** prerequisite). Until provisioned, engineering is **queued only** — explicit scope demotion requires **`V1_SCOPE.md`** / **`PENDING_QUESTIONS.md`** amendment **if** a **free** path never materializes.
- **Durable Task Framework (DTF):** SQL storage hosts bind the authority pipeline to the Durable Task port (`DtfAuthorityRunOrchestrator`); `ArchLucid.Application` still has no compile-time dependency on `Microsoft.DurableTask.*`. InMemory / simulator paths remain on the legacy adapter until separately migrated. The ACA Jobs row in `V1_DEFERRED.md` §6f remains out of V1 scope. **Azure Container Apps Jobs** stay **`V2`** situational backlog (**improvement #25**) — **not** promoted into **`V1`**.
- **Terraform Phase 7.5 (`state mv`):** **DEFERRED to V1.1** — **`infra/**/*.tf`** resource address alignment and `terraform state mv` operations are explicitly deferred. The repository continues to use `archiforge` addresses in V1.
- **Operator UI vocabulary vs marketing workflow (V1):** Buyer-facing labels in **`archlucid-ui`** align with the evidence-backed governance narrative (e.g. **Capture system**, **Evidence**, **Review**, **Findings**, **Decisions**, **Report**) mapped from existing flows (**run**, **manifest**, **commit**, **authority** remain internal/API). **REST routes, OpenAPI operation IDs, CLI commands, and audit event names are unchanged** unless separately versioned. **Usability** headline (**77**) reflects glossary alignment (**Q1** / **#27**) plus bounded bulk capture (**Q4** / **#30**).

- **Buyer-grade architecture review export:** A **default DOCX/PDF export profile** matching the landing-page report narrative (executive summary, system overview, evidence reviewed, architecture decisions, key risks, policy findings, AI-assisted analysis with human-review framing, traceability appendix, recommended next actions) is a **V1 GA gate** per owner Q2 (**Marketing alignment — owner Q&A** row 2). **Consultant whitelabel** on cover/metadata is **also GA** per row **5** — same pipeline (**#28**). Landing demos and downloadable sample reports assume both ship with GA.

- **Consultant / engagement report whitelabel (V1 GA):** Exported **Architecture Review Reports** (**DOCX + PDF**) support **tenant-scoped branding**: **consulting firm name**, **client engagement title**, optional **logo image** (PNG/SVG policy per security review), and **cover footer disclaimer** (“Prepared by … using ArchLucid”) so boutique / marketplace consultants can deliver client-facing artifacts without manual replatforming. **Proof-of-ROI Readiness**, **Commercial Packaging Readiness**, and **Stickiness** are scored upward (**Marketing alignment — owner Q&A** row 5). Implementation folds into improvement **#28** (same export pipeline — avoid duplicate profiles).

- **Default policy packs (curated content — V1 GA subset):** ArchLucid ships **two** tenant-available **default policy packs** at **V1 GA**: (**1**) **AI governance / responsible AI** — MVP rule set with explicit framework **mapping** (e.g. NIST AI RMF v1.0 themes, EU AI Act high-risk categories) — *mapping only, no certification claim*; (**2**) **Security architecture baseline** — MVP rules aligned to buyer-credible themes (e.g. CIS Azure Foundations / OWASP ASVS-style controls). **Azure landing-zone / CAF-aligned** curated pack is **deferred to V1.1** (extractor + advisor already carry Azure posture narrative at GA). Marketing may claim bundled AI-governance + security-baseline starter packs at GA; **must not** imply a shipped **CAF landing-zone pack** until **V1.1**. **Proof-of-ROI Readiness**, **Commercial Packaging Readiness**, and **Stickiness** are scored upward to reflect this owner commitment (**Marketing alignment — owner Q&A** row 3).

- **Bulk evidence upload (V1 cap):** **Multi-file bulk attach** to a review’s evidence set ships in **V1 GA** with a **hard ceiling of 30 files per request** (server-enforced). Marketing **must** disclose the cap (“up to **30 files** per upload”) and avoid infinite batch promises until **V1.1** raises or removes the limit. **Usability** and **Customer Self-Sufficiency** are scored upward slightly (**Marketing alignment — owner Q&A** row 4).

- **Curated demo workspaces (hard V1 GA gate):** Exactly **two** **demo workspaces** must ship **before GA**, documented and reachable from onboarding / marketing flows: (**A**) **Self-demo / product tour** — lands evaluators on the canonical workflow (**Capture → Evidence → Review → … → Report**) using synthetic-safe content; (**B**) **Synthetic regulated scenario** — AI governance + cloud posture narrative with seeded evidence and **policy findings** sourced from improvements **#29** packs (no real customer data). **Release checklist blocks GA** until both pass automated smoke (**Playwright** and/or **`release-smoke`** per repo norms). **Adoption Friction**, **Proof-of-ROI Readiness**, and **Commercial Packaging Readiness** are scored upward (**Marketing alignment — owner Q&A** row **6**). Tracked via improvement **#31**.

- **Landing page CTA stack (first 90 days — V1 honesty):** **Hybrid** posture per owner **Q7** (**Marketing alignment — owner Q&A** row **7**): **primary CTA** = **Request walkthrough** (sales-led GA, matches deferred live marketplace/self-serve). **Secondary CTA** = **Try the self-demo** — deep-link into **Workspace A** from improvement **#31** (product touch before calendar). **Tertiary** = **Early access** / waitlist capture only — **must not** imply instant product access, live checkout, or parity with walkthrough-led pilots. **Public paid-pilot $ band** is **out of scope for the first 90 days** (pricing stays walkthrough→qualify→quote until reference customers exist). Implementation and copy review tracked via improvement **#32**.

## Executive Summary

**Overall Readiness:** ArchLucid is a functionally complete V1 product with a solid architectural foundation, capable of executing the core pilot loop (internally run → execute → commit → manifest and artifacts). The platform includes key enterprise and commercial capabilities, such as **native SAML 2.0 SP workforce SSO** (**`V1_SCOPE.md` §2.12**), a buyer-grade **Architecture Review Report** export (DOCX + PDF) with **consultant whitelabeling** (**Marketing alignment Q2/Q5**), and **operator shell labels aligned with marketing workflow language**. However, its immediate readiness is still constrained by **residual audit-matrix deferrals** (notably read-path **`FindingsListAccessed`**) and the intentional deferral of live commerce and compliance attestations to V1.1 and beyond — **durable `ManifestSuperseded` / finalize supersession hygiene closed repository-side (2026-05-15**, **`AUDIT_COVERAGE_MATRIX.md`**, improvement **#3**). **Phase 7.6–7.7** rename execution and Entra greenfield alignment **closed 2026-04-19** (**7.8** waived — **`docs/ARCHLUCID_RENAME_CHECKLIST.md`**). **Terraform Phase 7.5** is **deferred to V1.1**. **V1 GA still requires** two curated default policy packs (AI governance + security baseline; landing-zone pack **V1.1**) (**Marketing alignment Q3**), bounded bulk evidence upload (**≤30 files** per operation — **Marketing alignment Q4**), two curated demo workspaces as a hard release gate (**Marketing alignment Q6** / improvement **#31**), and a landing CTA stack aligned to sales-led GA (**Marketing alignment Q7** / improvement **#32**).

**Commercial Picture:** The product is ready for sales-led pilots and staging-based trial evaluations. However, self-serve transactability is intentionally paused, with Stripe live keys and Marketplace publication deferred to V1.1. The lack of a published reference customer and signed design partner (also deferred) may slow early momentum. **GA requires differentiated governance starters:** buyer-visible **AI governance** and **security baseline** policy packs (thin MVP counts acceptable), strengthening demo credibility versus empty-pack onboarding. **Evidence capture** gets **bulk upload** at GA with an explicit **≤30-file** ceiling (**Marketing alignment Q4**) — pitch accordingly. **Consultants can white-label client deliverables** (firm name, engagement title, logo — **Marketing alignment Q5**) directly from export — strengthens marketplace / boutique wedge without manual DOCX surgery. **Sales-led and self-serve evaluators both hit fixed demo workspaces** (**self-demo + regulated synthetic**) — GA is blocked until both stay green (**Marketing alignment Q6**). **First-90-days landing posture:** **Request walkthrough** primary, **Try the self-demo** secondary (Workspace **A**), **Early access** tertiary capture — **no public paid-pilot $ band** yet (**Marketing alignment Q7**).

**Enterprise Picture:** The system supports robust tenant isolation (database-per-tenant), workforce SSO via **OIDC / Entra ID** and **native SAML 2.0 SP**, and private connectivity. First-party ITSM connectors (Jira, ServiceNow) and Slack/Confluence integrations are strong enterprise features. However, the absence of a CPA-issued SOC 2 report and third-party penetration test (deferred to V2) will cause friction during procurement and security reviews.

**Engineering Picture:** The engineering foundation is strong, utilizing SQL persistence, DbUp migrations, and a well-architected agent orchestration pipeline. SQL storage hosts bind the authority pipeline to the Durable Task port (`DtfAuthorityRunOrchestrator`); deeper DTF-native scheduling and full multiset parity remain incremental work. The system includes idempotent orphan **`archiforge_*`** RLS predicate drops (**DbUp 165**), **`FirstTenantFunnelEvents`** SQL purge when per-tenant emission is **off**, **`ui-e2e-live`** negative-path coverage, optional **Redis-backed** graph projection **`IDistributedCache`**, and a hosted-trial **V1→V1.1** orientation memo. Residual risks include **immutable** migration/history spellings, catalogs still on legacy **RLS** identifiers until **`108`** replay coordination, single-process projection defaults without Redis, and **keeping GA-gated demo workspace smoke green** (**Q6** / **#31**).

---

## Weighted Quality Assessment

### 1. Adoption Friction
- **Score:** 80
- **Weight:** 6
- **Weighted deficiency signal:** 120
- **Justification:** Tier 1 Azure extraction remains frictionless. **Phase 7.6–7.7** + waived **7.8** (**improvement #2**) **closed 2026-04-19** — see **`docs/ARCHLUCID_RENAME_CHECKLIST.md`**. **Owner decision (Q6):** **two curated demo workspaces** are a **hard GA gate**, shrinking time-to-first-success for evaluators versus blank tenants. **Owner decision (Q7):** landing **hybrid CTA** routes serious buyers to **walkthrough** while offering **self-demo** before calendar load (**#32**). Some **immutable** DbUp history and RLS lineage still carries legacy spellings — procurement-facing docs should say so honestly (**not** unreleased rename backlog). Operator shell labels are aligned with marketing vocabulary.
- **Tradeoffs:** Demo workspaces create **fixture-maintenance tax** — feature churn can break GA smoke unless **#31** is treated as living backlog.
- **Improvement recommendations:** **Improvement #2** (**7.6–7.8**) **closed 2026-04-19** per archived checklist — no schedule action. Implement improvement **#31** (demo workspaces — **release-blocking**). Implement improvement **#32** (landing CTA stack — **Q7**). Provide explicit documentation for generic OIDC setup (`improvement #24`).

### 2. AI/Agent Readiness
- **Score:** 82
- **Weight:** 8
- **Weighted deficiency signal:** 144
- **Justification:** The system effectively uses Azure OpenAI with prompt redaction, execution traces, and a well-tested authority pipeline. **Improvement #26 (2026-05-16)** delivers the SQL Durable Task port for authority orchestration; further checkpoint-native scheduling strengthens the governance story for regulated buyers.
- **Tradeoffs:** DTF introduces a durable orchestration history schema in SQL and a new operational runbook surface. The trade-off is justified: the parity-test obligation and operational cost are bounded; the governance-provenance benefit compounds over time and aligns with the primary buyer wedge.
- **Improvement recommendations:** Add explicit logging for state transitions during and after DTF scheduling hardening. (Inbound MCP is **V1.1** per scope docs — not a V1 readiness gap.)

### 3. Correctness
- **Score:** 84
- **Weight:** 8
- **Weighted deficiency signal:** 128
- **Justification:** The execution model is solid, incorporating the **`ManifestSuperseded`** durable path per **`docs/library/AUDIT_COVERAGE_MATRIX.md`**. The system clears **unreferenced** legacy **`archiforge_*`** security predicates (**DbUp 165**); residual catalogs still named **`ArchiforgeTenantScope`** remain operator **`108`** coordination — honesty / isolation posture unchanged versus immutable journal facts.
- **Tradeoffs:** Read-path **`FindingsListAccessed`** stays intentionally unaudited until a stable bulk-list contract exists; RLS rename migrations remain coordination-heavy.
- **Improvement recommendations:** Retain **`AUDIT_COVERAGE_MATRIX.md`** discipline for future mutation surfaces. Track honest **`108`** replay notes where catalogs lag (**migration header**).

### 4. Proof-of-ROI Readiness
- **Score:** 85
- **Weight:** 5
- **Weighted deficiency signal:** 75
- **Justification:** The Azure extractor provides cost data, and the comparison replay cost estimator is useful. **Owner decision (Q3):** **V1 GA** ships curated **AI governance** and **security baseline** default packs so pilots immediately surface policy findings aligned to the wedge — demos prove ROI faster than buyer-authored-only onboarding. **Owner decision (Q5):** report export **whitelabel** lets consultants prove tangible client-ready ROI artifacts without offline rebranding. **Owner decision (Q6):** **regulated synthetic demo workspace** gives repeatable proof narrative without bespoke pilot setup. Cross-tenant analytics remain absent for portfolio-wide executive proof.
- **Tradeoffs:** Tenant isolation (database-per-tenant) makes cross-tenant analytics harder to implement securely. **Curated packs** shift burden to **credible authoring** — MVP rule counts must stay humble (*starting baseline*, not exhaustive compliance) or regulated buyers dismiss the wedge.
- **Improvement recommendations:** Execute improvement **#29** (seed **AI governance** + **security baseline** packs). Deliver improvement **#31** (**Q6** demo workspaces — ROI storytelling). Ship improvement **#32** (**Q7** landing CTAs → Workspace **A**). Enhance the `ComparisonReplayCostEstimator` with more granular heuristics (**#11**). Implement internal-only cross-tenant analytics (**#12**).

### 5. Usability
- **Score:** 79
- **Weight:** 3
- **Weighted deficiency signal:** 63
- **Justification:** The operator UI is functional. **Owner decision:** surface copy shifted from engineering-centric terms (**run**, **commit**, **manifest**) to marketing-aligned governance vocabulary (**Capture**, **Evidence**, **Review**, **Findings**, **Decisions**, **Report**) without renaming HTTP contracts — reducing cognitive load for regulated EA/security buyers and consultants. **Owner decision (Q4):** **bulk evidence upload** lands in **V1 GA** capped at **≤30 files** per upload so “gather scattered artifacts” demos stay honest without taking unlimited ingestion scope pre-GA. **`/planning`** stays read-only browse; pilot-feedback materialization lives on **`/product-learning`**. **`ui-e2e-live`** now carries targeted **live API negatives** (**improvement #8** **closed 2026-05-15**); most operator-shell Playwright paths remain **`/api/proxy`** mocks until broader expansion lands.
- **Tradeoffs:** Dual vocabulary (friendly labels vs stable API names) must be documented for integrators and support; translators/tests must reference stable selectors where headers change copy. The **30-file** ceiling avoids abuse and MVP complexity but forces explicit marketing disclosure and may annoy heavy dossier pilots until **V1.1**.
- **Improvement recommendations:** Implement improvement **#30** (bulk upload with **≤30** enforcement + UX copy). Add `DataArchivalHostHealthCheck` to the dashboard (**#21**).

### 6. Workflow Embeddedness
- **Score:** 85
- **Weight:** 3
- **Weighted deficiency signal:** 45
- **Justification:** The inclusion of first-party ITSM connectors (Jira, ServiceNow) and Slack/Confluence integrations in V1 GA is a strong positive.
- **Tradeoffs:** Building first-party connectors takes resources away from core platform features but significantly improves workflow integration.
- **Improvement recommendations:** Implement bi-directional ServiceNow status sync (**#22**) once owner provisions **cost-free** Developer Program / PDI-style credentials (**P10**) — **`V1` GA** commitment unchanged (`V1_SCOPE.md` §2.13).

### 7. Compliance Readiness
- **Score:** 75
- **Weight:** 2
- **Weighted deficiency signal:** 50
- **Justification:** A durable audit trail exists, and the SOC 2 self-assessment is complete. **Finalize supersession** now emits **`ManifestSuperseded`** (**2026-05-15**); residual gaps are limited to explicit matrix deferrals (e.g. **`FindingsListAccessed`** read path).
- **Tradeoffs:** Self-assessment is faster and cheaper than CPA attestation but carries less weight with enterprise buyers.
- **Improvement recommendations:** ~~Close the known gaps in the `AUDIT_COVERAGE_MATRIX.md`.~~ **Mutating durable gaps cleared (2026-05-15)** — keep matrix reviews green when adding HTTP mutations; track **`FindingsListAccessed`** only when a list endpoint ships.

### 8. Commercial Packaging Readiness
- **Score:** 84
- **Weight:** 2
- **Weighted deficiency signal:** 32
- **Justification:** The trial funnel is tested in Stripe TEST mode, but live keys and Marketplace publication are intentionally deferred to V1.1. **Curated default packs at GA** sharpen the packaged story (**AI-era governance review** with actionable starter rules), reducing “empty shell” risk for sales-led pilots. **Owner decision (Q5):** **consultant whitelabel** on architecture-review exports improves resale positioning for boutique / marketplace consultants without a separate SKU. **Owner decision (Q6):** **mandatory demo workspaces** package the wedge into predictable buyer-ready flows — GA cannot ship without them. **Owner decision (Q7):** **hybrid landing CTAs** keep copy honest with deferred self-serve while still capturing **Early access** leads.
- **Tradeoffs:** Deferring live commerce allows for a controlled, sales-led V1 rollout but delays self-serve revenue. Starter packs raise **copy honesty** obligations — claims must match shipped rule depth. **Consultant logos** increase **tenant-upload attack surface** — mitigate with MIME/size caps and existing malware-scan posture (sign-off required — **Q5**). **Early access** tertiary must avoid **bait-and-switch** vs walkthrough-led pilots (**Q7**).
- **Improvement recommendations:** Execute improvement **#29** (default packs — GA subset). Implement improvement **#28** (**buyer-grade export + whitelabel — Q5**). Implement improvement **#31** (**Q6** — demo workspaces, release gate). Implement improvement **#32** (**Q7** — landing CTAs). Flip Stripe live keys and publish the Marketplace listing **after finance confirms** Partner Center readiness (**P4**, **#7**).

### 9. Security
- **Score:** 88
- **Weight:** 3
- **Weighted deficiency signal:** 36
- **Justification:** Strong fundamentals with OIDC, Entra ID, RBAC, private endpoints, and Key Vault. **Third-party pen-test publication is `V2`** (`V1_DEFERRED.md` §6c); **owner-directed pause** on vendor/budget pen-test prompts during **V1** planning (**P8**, **2026-05-15**) — **`(A)`** scoring does **not** await external pen-test closure.
- **Tradeoffs:** Owner-conducted pen testing is sufficient for V1 but will not satisfy strict enterprise procurement requirements.
- **Improvement recommendations:** **`V2` program:** execute improvement **#18** when the **V2** assurance window opens — **not** as a **V1** recurring questionnaire (**P8**). **`V1.1`:** schedule improvement **#19** (PGP key) — **`archlucid.net`** + **`security@`** prerequisites satisfied (**P9**).

### 10. Explainability
- **Score:** 82
- **Weight:** 2
- **Weighted deficiency signal:** 36
- **Justification:** The system provides comparison replays and a knowledge graph, offering good visibility into architectural decisions.
- **Tradeoffs:** Default **in-process** projection cache still caps multi-replica coherence unless operators enable **Distributed** backend + Redis (configure **`ArchLucid:KnowledgeGraph:ProjectionCache:Backend`**).
- **Improvement recommendations:** Retain **`V1_DEFERRED.md` §6e** honesty when Redis is **not** configured.

### 11. Interoperability
- **Score:** 92
- **Weight:** 2
- **Weighted deficiency signal:** 16
- **Justification:** V1 contract surfaces—**REST API**, **CLI**, **operator UI**, integration events/webhooks, and **first-party** ITSM and chat connectors—meet the documented integration posture. **Native SAML 2.0 SP** is **in V1 GA** (**P6**, **`V1_SCOPE.md` §2.12**). **No MCP host in V1 is in-contract deferral** (`V1_SCOPE.md` §3, `V1_DEFERRED.md` §6d), not a scored weakness for this pass.
- **Tradeoffs:** Buyers who want MCP-native agent tools wait until **V1.1**; until then HTTP/CLI and first-party connectors remain the automation paths of record. SAML SP adds dual auth-surface operational burden (cert rotation, metadata drift) versus OIDC-only tenants.
- **Improvement recommendations:** Tighten OpenAPI-aligned client examples and webhook recipe discoverability (`docs/integrations/recipes/`). Track inbound MCP membrane only under the **V1.1** program (`MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md`).

### 12. Stickiness
- **Score:** 81
- **Weight:** 1
- **Weighted deficiency signal:** 19
- **Justification:** Governance workflows and compliance drift tracking provide ongoing value. **Default AI governance + security packs** give tenants a repeatable baseline to extend — modest lift vs buyer-authored-only baseline. **Branded consultant exports** (**Q5**) increase likelihood tenants reuse ArchLucid as their recurring engagement tooling vs one-off novelty. Advanced autonomous planning remains deferred and may still cap engagement depth.
- **Tradeoffs:** Focusing on deterministic execution over open-ended planning ensures reliability but may feel less "agentic". Thin starter packs risk **one-and-done** pilots unless tenants customize and attach packs to recurring reviews.
- **Improvement recommendations:** Execute improvement **#29** (baseline packs tenants extend over time). Add cross-tenant analytics capabilities to demonstrate ongoing value (**#12**).

### 13. Performance
- **Score:** 78
- **Weight:** 1
- **Weighted deficiency signal:** 22
- **Justification:** Rate limiting is implemented; optional Redis and **memory** caches remain deployment-dependent — **distributed graph projection cache** is **available when configured**.
- **Tradeoffs:** Making Redis optional simplifies single-replica deployments but complicates scaled operations.
- **Improvement recommendations:** Enhance `SqlScopedResolutionDbConnectionFactory` with connection retry logic.

### 14. Customer Self-Sufficiency
- **Score:** 81
- **Weight:** 1
- **Weighted deficiency signal:** 19
- **Justification:** Pilot guides and operator quickstarts are available. **Owner decision (Q4):** **bulk evidence upload** (**≤30 files**) improves first-session capture without sales hand-holding for small dossiers. **`HOSTED_TRIAL_V1_TO_V1_1_MIGRATION_GUIDE.md`** provides **V1.1**-oriented orientation — **`(A)` V1** scoring still treats outbound migration narrative as **post-GA** program context (**`V1_DEFERRED.md` §6i**).
- **Tradeoffs:** **V1.1** documentation carries the tenant-facing “what changed” narrative for promoted **`V1.1`** deltas (commerce, MCP, etc.). Bulk upload reduces friction only within the **30-file** envelope — enterprises with massive ZIP dumps still chunk manually until **V1.1**.
- **Improvement recommendations:** Implement improvement **#30**. Deliver improvement **#31** (**Q6** fast-path evaluators). Refresh **`docs/library/HOSTED_TRIAL_V1_TO_V1_1_MIGRATION_GUIDE.md`** when **V1.1** deltas enumerate.

### 15. Observability
- **Score:** 82
- **Weight:** 1
- **Weighted deficiency signal:** 18
- **Justification:** OpenTelemetry, Serilog, and replay diagnostics provide good visibility.
- **Tradeoffs:** Standard observability tools require operator expertise to configure and monitor effectively.
- **Improvement recommendations:** Add explicit logging for agent state machine transitions.

---

## Top 10 Most Important Weaknesses

1. Absence of cross-tenant analytics, limiting Proof-of-ROI for enterprise buyers.
2. Playwright E2E still relies heavily on mocked **`/api/proxy`** paths — **live** **`ui-e2e-live`** negative API checks (**improvement #8**, **`live-api-negative-paths.spec.ts`**) shrink blind spots but do **not** replace broad golden-path coverage.
3. **Residual** legacy **RLS** catalog/history identifiers (**improvement #4** dropped orphan predicates only; **`108`** coordination remains where **`ArchiforgeTenantScope`** persists).
4. Manual nature of some cost estimations in the Azure extractor.
5. **Demo workspace fixture drift:** With **two GA-gated workspaces** (**Marketing alignment Q6** / **#31**), UX, export, policy-pack, or graph changes can silently break evaluator smoke — CI/release discipline must pin fixtures or owners risk shipping broken demos.
6. **Agent orchestration concurrency limits:** The `AuthorityRunOrchestrator` lacks rate limiting and concurrency controls, posing a reliability risk where a single tenant could exhaust worker pool resources during bursty workloads.
7. **LLM observability gaps:** Missing explicit OpenTelemetry tracing for LLM API calls (token usage, latency) hinders debugging, cost attribution, and AI/Agent readiness at scale.
8. **Durable Task Framework (DTF) parity gaps:** While SQL production DI is wired to DTF, full multiset parity and release-smoke validation remain engineering obligations before the legacy orchestrator can be safely removed.
9. **Auth mismatches in operational scripts:** Potential authentication mismatches exist in operational scripts (like `v1-rc-drill.ps1`) that assume `DevelopmentBypass`, reducing testing realism against environments secured with JWT or API keys.
10. **Lack of explicit logging for agent state machine transitions:** Makes it difficult to observe and debug complex agent orchestrations in production.

---

## Top 6 Monetization Blockers

1. Lack of cross-tenant analytics to prove ROI to executive buyers.
2. **GA-gated demo workspaces (#31)** — if automated smoke regresses, sales-led pilots lose a credible first-session story even when core product paths stay healthy.
3. **Incomplete Buyer-grade Architecture Review Report export:** Until the DOCX/PDF export with consultant whitelabel ships, boutique consultants cannot easily monetize their own deliverables.
4. **Manual Azure cost estimations:** The Azure extractor's manual cost estimation limits the platform's ability to automatically prove hard infrastructure savings to buyers.
5. **Coarse `ComparisonReplayCostEstimator` heuristics:** Lack of granular heuristics makes Proof-of-ROI less accurate for complex agent tasks, weakening the commercial business case.
6. **Lack of cross-tenant analytics (internal):** Without internal tools to aggregate usage and cost savings across tenants, it is difficult to prove ROI and inform product direction.

---

## Top 6 Enterprise Adoption Blockers

1. **Immutable SQL / identity lineage strings** (historic migration bodies, session-context keys, allowlisted CI/doc carve-outs) plus honest disclosure obligations for procurement — **Terraform Phase 7.5 / improvement #1** complete for committed **`infra/**/*.tf`** **2026-05-15**; **Phase 7.6–7.7 / improvement #2** closed **2026-04-19** (**`docs/ARCHLUCID_RENAME_CHECKLIST.md`**); **`terraform state mv`** only when remote state lists **`archiforge`** (**`docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md`**).
2. **Missing default policy packs:** The absence of bundled AI governance and security baseline policy packs (V1 GA gate) leaves regulated buyers without immediate, actionable compliance findings during initial evaluation.
3. **Lack of automated tenant data deletion:** Absence of a verifiable GDPR/CCPA "right to be forgotten" mechanism causes friction in enterprise procurement and legal reviews.
4. **Noisy neighbor risks in orchestration:** The lack of rate limiting and concurrency controls for the `AuthorityRunOrchestrator` raises reliability concerns for enterprise buyers evaluating multi-tenant SaaS.
5. **IdP configuration documentation gaps:** Missing explicit documentation for `ArchLucidAuth:Authority` configuration causes friction during enterprise SSO onboarding and security reviews.
6. **Lack of custom rule authoring UI:** Evaluators cannot easily author and test custom governance rules without writing raw code, slowing down enterprise adoption.

---

## Top 6 Engineering Risks

1. **Residual legacy RLS identifiers:** Immutable history and catalogs still contain legacy `archiforge_*` identifiers; while orphan predicates were dropped, isolation posture requires ongoing coordination with migration `108` where catalogs lag.
2. **Durable Task Framework (DTF) parity gaps:** While SQL production DI is wired to DTF, full multiset parity, release-smoke validation, and deeper engine-native scheduling remain engineering obligations before the legacy orchestrator can be safely removed.
3. **E2E test mock reliance:** Despite the addition of negative live-API paths, the majority of the Playwright E2E suite still relies heavily on mocked `/api/proxy` responses, leaving integration blind spots until `ui-e2e-live` expands further.
4. **Agent orchestration concurrency limits:** The `AuthorityRunOrchestrator` lacks rate limiting and concurrency controls, posing a reliability risk where a single tenant could exhaust worker pool resources during bursty workloads.
5. **LLM observability gaps:** Missing explicit OpenTelemetry tracing for LLM API calls (token usage, latency) hinders debugging, cost attribution, and AI/Agent readiness at scale.
6. **Auth mismatches in operational scripts:** Potential authentication mismatches exist in operational scripts (like `v1-rc-drill.ps1`) that assume `DevelopmentBypass`, reducing testing realism against environments secured with JWT or API keys.

---

## Most Important Truth

ArchLucid is a functionally complete V1 product with a solid architectural foundation, but its immediate adoption and monetization are constrained by **residual audit-matrix deferrals** (read-path items such as **`FindingsListAccessed`** only), **GA demo workspace discipline (#31)**, and the intentional deferral of live commerce and compliance attestations to V1.1 and beyond. **GA commits** to **two curated policy packs** (AI governance + security baseline); **landing-zone pack narrative stays honest** until **V1.1**. **Bulk evidence ingestion is real but bounded:** **≤30 files** per upload at GA — marketing must carry that constraint visibly (**Marketing alignment Q4**). **Architecture Review exports ship consultant whitelabel** (firm/client branding + attribution — **Marketing alignment Q5**) — logo handling must meet the same tenant-upload security bar as other blobs. **GA cannot ship without two green demo workspaces** (**Marketing alignment Q6**) — fixture drift becomes an operational obligation, not optional polish. **First 90 days of landing copy** must mirror **sales-led GA:** walkthrough primary, self-demo secondary, early-access tertiary — **no public paid-pilot price band** until reference deals exist (**Marketing alignment Q7**).

---

## Top Improvement Opportunities

1. Enhance `ComparisonReplayCostEstimator` with more granular heuristics
- Why it matters: Improves Proof-of-ROI readiness by providing more accurate cost estimates.
- Expected impact: Directly improves Proof-of-ROI Readiness (+4 pts), Explainability (+2 pts). Weighted readiness impact: +0.50%.
- Affected qualities: Proof-of-ROI Readiness, Explainability.
- Actionable: Yes
```markdown
Enhance the `ComparisonReplayCostEstimator` in `ArchLucid.Application` to use more granular heuristics based on the specific agent tasks and artifact sizes involved in the comparison. Update the scoring logic to account for the complexity of the manifest deltas. Do not change the HTTP API contract for the cost estimate endpoint. Acceptance criteria: Cost estimates are more accurate and reflect the actual complexity of the replay.
```

2. Add cross-tenant analytics capabilities (internal only)
- Why it matters: Helps prove ROI across the customer base and informs product direction.
- Expected impact: Directly improves Proof-of-ROI Readiness (+3 pts), Stickiness (+2 pts). Weighted readiness impact: +0.35%.
- Affected qualities: Proof-of-ROI Readiness, Stickiness.
- Actionable: Yes
```markdown
Implement an internal-only analytics service that aggregates anonymized usage data, run completion times, and cost savings across all tenants. Ensure this service bypasses RLS safely using a dedicated internal connection string or explicit cross-tenant queries. Do not expose this data to external customers. Acceptance criteria: Internal operators can query aggregated cross-tenant metrics.
```

3. Enhance `v1-rc-drill.ps1` to support JWT/API key authentication
- Why it matters: Reduces auth mismatches and improves testing realism.
- Expected impact: Directly improves Correctness (+2 pts), Security (+2 pts). Weighted readiness impact: +0.46%.
- Affected qualities: Correctness, Security.
- Actionable: Yes
```markdown
Update the `v1-rc-drill.ps1` script to accept optional parameters for a JWT bearer token or API key. If provided, use these credentials instead of relying on `DevelopmentBypass`. Update the script documentation to explain how to use these parameters. Do not break the existing `DevelopmentBypass` behavior when no credentials are provided. Acceptance criteria: The RC drill script can be run against an environment secured with JWT or API keys.
```

4. Add explicit logging for agent state machine transitions
- Why it matters: Improves observability and debugging of complex agent orchestrations.
- Expected impact: Directly improves Observability (+5 pts), AI/Agent Readiness (+1 pts). Weighted readiness impact: +0.27%.
- Affected qualities: Observability, AI/Agent Readiness.
- Actionable: Yes
```markdown
Add explicit `ILogger` calls in `AuthorityRunOrchestrator` and `ArchLucid.Worker` to log every state transition of the agent execution state machine. Include the run ID, current state, next state, and any relevant task IDs in the log context. Ensure these logs are emitted at the `Information` level. Do not change the state machine logic itself. Acceptance criteria: Agent state transitions are clearly visible in the application logs.
```

5. Add snapshot tests for advisory Terraform recommendation emit
- Why it matters: Ensures Terraform snippets remain valid and do not regress.
- Expected impact: Directly improves Correctness (+3 pts), Security (+1 pts). Weighted readiness impact: +0.56%.
- Affected qualities: Correctness, Security.
- Actionable: Yes
```markdown
Create snapshot tests in `ArchLucid.Api.Tests` or `ArchLucid.Application.Tests` that validate the output of the advisory Terraform recommendation emit. Use a library like `Verify` or `Snapshooter` to ensure the generated Terraform snippets match expected baselines. Ensure the tests verify the presence of the `# ArchLucid advisory` comment. Do not execute `terraform validate` in the unit tests to avoid external dependencies. Acceptance criteria: Snapshot tests cover the major Terraform recommendation scenarios.
```

6. Add `DataArchivalHostHealthCheck` to the operator dashboard
- Why it matters: Improves observability of background data archival processes.
- Expected impact: Directly improves Observability (+4 pts), Usability (+1 pts). Weighted readiness impact: +0.15%.
- Affected qualities: Observability, Usability.
- Actionable: Yes
```markdown
Update the operator UI dashboard to display the status of the `data_archival` health check. Fetch the health status from the `/health` endpoint and display a warning indicator if the status is `Degraded`. Do not change the underlying health check logic in the backend. Acceptance criteria: Operators can see the data archival health status on the UI dashboard.
```

7. Enhance `SqlScopedResolutionDbConnectionFactory` with connection retry logic
- Why it matters: Improves resilience against transient database connection failures.
- Expected impact: Directly improves Correctness (+2 pts), Performance (+1 pts). Weighted readiness impact: +0.35%.
- Affected qualities: Correctness, Performance.
- Actionable: Yes
```markdown
Update `SqlScopedResolutionDbConnectionFactory` in `ArchLucid.Api.DataAccess` to use Polly for transient fault handling when opening SQL connections. Implement a retry policy with exponential backoff for common transient SQL errors (e.g., error numbers 40613, 40197, 40501). Ensure the retry policy is configurable via `appsettings.json`. Do not change the `IDbConnectionFactory` interface. Acceptance criteria: SQL connections automatically retry on transient failures.
```

8. Add explicit documentation for `ArchLucidAuth:Authority` configuration
- Why it matters: Reduces adoption friction for generic OIDC setup.
- Expected impact: Directly improves Adoption Friction (+3 pts), Customer Self-Sufficiency (+2 pts). Weighted readiness impact: +0.42%.
- Affected qualities: Adoption Friction, Customer Self-Sufficiency.
- Actionable: Yes
```markdown
Create a new markdown file `docs/runbooks/GENERIC_OIDC_SETUP.md` that provides step-by-step instructions for configuring `ArchLucidAuth:Authority` with a non-Microsoft OIDC issuer (e.g., Okta, Auth0). Include examples of claim mapping to `ArchLucidRoles` and troubleshooting tips for common JWKS validation errors. Link this new file from `docs/library/SECURITY.md` and `docs/library/CONFIGURATION_REFERENCE.md`. Acceptance criteria: Clear documentation exists for setting up generic OIDC.
```

9. **Two curated demo workspaces** — **hard V1 GA gate** (**Marketing alignment Q6**)
- Why it matters: Marketing promises a **guided wedge demo**; blank tenants waste evaluator attention and inflate sales labor. Two workspaces package **happy-path tour** + **regulated synthetic** proof without exposing customer data.
- Expected impact: Adoption Friction **76→77**, Proof-of-ROI **83→84**, Commercial Packaging **82→83**; weighted readiness **+~0.28%** toward headline **81.55%**. **Merge-blocking:** GA checklist fails if either workspace smoke fails.
- Affected qualities: Adoption Friction, Proof-of-ROI Readiness, Commercial Packaging Readiness; secondary Customer Self-Sufficiency (faster eval).
- Actionable: Yes

```markdown
Ship **exactly two** persisted **demo workspaces** per hosted GA posture (pattern: seeded tenant artifacts + documented entry URLs — locate existing demo/marketing bootstrap conventions under **`docs/`**, **`ArchLucid.Host.Core`**, or **`archlucid-ui`** onboarding routes).

WORKSPACE A — **SELF-DEMO / PRODUCT TOUR**
- Synthetic-safe sample evidence only (fabricated company names).
- Completes canonical workflow steps aligned to improvement **#27** glossary (**Capture → Evidence → Review → … → Report**).
- Linked from landing/onboarding CTAs (**secondary CTA — improvement #32**).

WORKSPACE B — **SYNTHETIC REGULATED SCENARIO**
- AI-era governance narrative (model inventory hints, human-review checkpoints, sensitive-data routing themes — **no regulated PHI/PII**).
- Surfaces **policy findings** from improvements **#29** packs against seeded extractor/evidence stubs where applicable.
- Demonstrates **Architecture Review Report** export (**#28**) including optional **whitelabel** fields filled with fictitious consultant/client strings.

ENGINEERING / OPS
- Prefer **idempotent seed** scripts or migrations reusable in staging + CI.
- Tenant isolation unchanged — workspaces are normal tenant-bound content with **`DemoWorkspace`** (or equivalent) metadata flag **avoiding production billing surprises** if gated by env/config.

TESTS — RELEASE GATE (**NON-NEGOTIABLE**)
- Add or extend Playwright journey(s): **Workspace A** happy path + **Workspace B** export smoke (DOCX/PDF generation may verify download headers / file bytes checksum bounds — match repo norms).
- Wire into **`release-smoke.ps1`** or CI equivalent per **`docs/engineering/BUILD.md`** / **`AGENTS.md`** pointers.

DOCUMENTATION — MANDATORY
- **`docs/go-to-market/`** or **`docs/library/`**: stable URLs / tenant bootstrap instructions for Sales + Marketing.

ACCEPTANCE CRITERIA
1. Release manager cannot tag GA unless **both** workspace smokes pass on candidate build.
2. Neither workspace references real customer identifiers.
3. Breaking layout/copy changes caught by failing smoke force fixture updates — treat **#31** as ongoing hygiene (**§ weaknesses #15**).
```

10. **Landing page CTA stack** — first **90 days** post-GA (**Marketing alignment Q7**)
- Why it matters: **V1 GA** is **sales-led**; **Stripe live** + **Marketplace** are **V1.1**. A **primary “Early access”** or **public paid-pilot $** CTA misaligns acquisition with product truth and accelerates procurement before **CPA SOC 2** narrative maturity buyers expect (**external pen test is `V2`** — excluded from **V1** planning Q&A per owner **2026-05-15**, **P8**).
- Expected impact: **Narrative / commercial honesty** — supports **§1 Adoption** and **§8 Commercial Packaging** without changing weighted headline (**81.55%**) until execution evidence changes. Coordinate with **#31** Workspace **A** URL.
- Affected qualities: Adoption Friction (evaluator path), Commercial Packaging Readiness (copy integrity).
- Actionable: Yes

```markdown
Implement the **hybrid CTA stack** on the marketing / landing surface (repo path for static marketing site or `archlucid-ui` marketing routes — locate current landing implementation).

PRIMARY CTA — **Request walkthrough**
- Prominent button → calendar booking URL (**config-driven**, e.g. env or CMS) or mailto fallback with **pre-filled subject** tracked in analytics.
- Analytics: `cta_walkthrough_click` (+ optional UTM preservation).

SECONDARY CTA — **Try the self-demo**
- Deep-link into **Workspace A** from improvement **#31** (document exact URL pattern in **`docs/go-to-market/`**).
- Label must not imply full product access parity with paid tenancy; tooltip: short honest line (synthetic workspace, **no PHI**).
- Analytics: `cta_self_demo_click`.

TERTIARY — **Early access** / waitlist
- Email capture only; **no** implied instant login, **no** live **Checkout** path at GA.
- Post-submit copy sets expectation: **team will follow up**; align with **`FirstTenantFunnelEvents`** / CRM handoff if applicable.
- Analytics: `cta_early_access_submit`.

OUT OF SCOPE (first 90 days)
- **Public paid-pilot price band** on hero — defer until at least one **reference** design-partner-style deal (**V1.1** marketing revisit).
- Replacing walkthrough with self-serve **Buy** — blocked by **#7** / **P4** (finance confirms Partner Center readiness).

COPY / LEGAL — MANDATORY
- Product + marketing review sign-off that **Early access** language matches **walkthrough-led** onboarding.
- Cross-link FAQ: bulk upload **≤30 files** (**#30**), demo workspaces (**#31**).

TESTS
- Smoke or unit: landing builds; critical CTAs render and hrefs resolve in **staging**.
- Optional Playwright: click **Try the self-demo** → lands in Workspace **A** entry route (coordinate with **#31** tests — avoid duplicate full journey if already covered).

ACCEPTANCE CRITERIA
1. **Hero** shows three CTAs in **primary / secondary / tertiary** visual hierarchy matching this spec.
2. **Analytics** events fire for each CTA path (verify in staging telemetry or browser devtools contract).
3. **No** hero **$** pilot pricing for **90-day** window — pricing remains **sales-qualification** path only.
```

11. **Implement automated tenant data deletion (GDPR/CCPA right to be forgotten)**
- Why it matters: Enterprise compliance requires a verifiable way to delete all tenant data upon contract termination or user request.
- Expected impact: Compliance Readiness (+3 pts).
- Affected qualities: Compliance Readiness, Security.
- Actionable: Yes

```markdown
Implement a durable background job to handle tenant offboarding and data deletion.
- Create a `TenantDeletionService` that orchestrates the removal of all tenant-scoped data across SQL, Blob Storage, and Knowledge Graph.
- Ensure the deletion process emits a durable `TenantDataDeleted` audit event (stored in a system-level audit log, outside the tenant's scope).
- Add an administrative API endpoint `POST /v1/admin/tenants/{id}/delete` (secured by a highly privileged internal role).
- Acceptance criteria: A tenant can be fully deleted, and the deletion is durably audited.
```

12. **Add explicit OpenTelemetry tracing for LLM API calls**
- Why it matters: AI/Agent Readiness requires deep observability into token usage, latency, and prompt/response pairs for debugging and cost attribution.
- Expected impact: Observability (+3 pts), AI/Agent Readiness (+2 pts).
- Affected qualities: Observability, AI/Agent Readiness.
- Actionable: Yes

```markdown
Enhance the existing OpenTelemetry instrumentation to capture detailed metrics for all LLM API calls.
- Add spans for every call to the underlying LLM provider (e.g., Azure OpenAI).
- Include span attributes for: model name, prompt token count, completion token count, total token count, and latency.
- Ensure sensitive prompt/response content is NOT logged by default (or is scrubbed), but allow opting in via a secure configuration flag for debugging.
- Acceptance criteria: Token usage and latency for LLM calls are visible in the APM backend.
```

13. **Implement rate limiting and concurrency controls for the `AuthorityRunOrchestrator`**
- Why it matters: Prevents a single tenant from exhausting worker resources by submitting too many concurrent architecture review runs.
- Expected impact: Performance (+3 pts), Reliability (+2 pts).
- Affected qualities: Performance, Reliability.
- Actionable: Yes

```markdown
Introduce concurrency limits for the `AuthorityRunOrchestrator` to protect the worker pool.
- Implement a tenant-level concurrency limit (e.g., max 5 concurrent runs per tenant).
- If a tenant exceeds the limit, queue the runs or return a `429 Too Many Requests` response from the API.
- Ensure the limits are configurable via `appsettings.json` or a dynamic configuration provider.
- Acceptance criteria: A single tenant cannot monopolize the worker pool.
```

16. **Enhance `ArchLucid.Decisioning` with custom rule authoring UI**
- Why it matters: Enterprise security requires scanning all user-uploaded artifacts (e.g., architecture diagrams, PDFs) for malware before processing them in the pipeline.
- Expected impact: Security (+4 pts), Compliance Readiness (+2 pts).
- Affected qualities: Security, Compliance Readiness.
- Actionable: Yes

```markdown
Integrate a malware scanning step into the blob upload pipeline in `ArchLucid.Api`.
- Use an existing Azure service (e.g., Microsoft Defender for Storage) or a lightweight containerized scanner (e.g., ClamAV) to scan incoming evidence blobs.
- Reject infected files with a `400 Bad Request` and a specific error code.
- Emit a durable `EvidenceMalwareDetected` audit event for security monitoring.
- Acceptance criteria: Infected files are blocked from entering the system and are durably audited.
```

18. **Add tenant-specific data residency configuration options**
- Why it matters: European and highly regulated buyers often require explicit guarantees that their data (SQL and blobs) resides in a specific geographic region.
- Expected impact: Compliance Readiness (+3 pts), Commercial Packaging (+2 pts).
- Affected qualities: Compliance Readiness, Commercial Packaging.
- Actionable: Yes

```markdown
Extend the tenant provisioning pipeline to support explicit data residency region selection.
- Update the `Tenant` database model to include a `DataRegion` column.
- Ensure the storage provisioning logic (e.g., Azure Blob Storage containers) respects the selected region.
- Document the supported regions in `docs/go-to-market/PROCUREMENT_FAQ.md`.
- Acceptance criteria: Operators can provision tenants in specific geographic regions.
```

19. **Enhance the Knowledge Graph with temporal query support**
- Why it matters: Advanced users need to query the state of the architecture at specific points in time to understand how decisions evolved.
- Expected impact: Explainability (+4 pts), Usability (+2 pts).
- Affected qualities: Explainability, Usability.
- Actionable: Yes

```markdown
Add temporal query capabilities to the `ArchLucid.KnowledgeGraph` API.
- Implement an endpoint `GET /v1/graph/snapshot?asOf={timestamp}` that reconstructs the graph state at a given time.
- Update the operator UI to include a time-scrubber control for visualizing historical graph states.
- Acceptance criteria: Users can view the knowledge graph exactly as it existed at a past date.
```

14. **Implement robust API key rotation and revocation endpoints**
- Why it matters: The Playwright E2E suite still relies heavily on mocked `/api/proxy` responses, leaving integration blind spots.
- Expected impact: Correctness (+3 pts), Reliability (+2 pts).
- Affected qualities: Correctness, Reliability.
- Actionable: Yes

```markdown
Expand the `ui-e2e-live` test suite to cover the complete golden path of the operator workflow against a live, non-mocked backend.
- Include end-to-end coverage for: Capture system → Add evidence → Review → Resolve findings → Record decisions → Generate report.
- Ensure the tests run against a dedicated staging or ephemeral environment with a real SQL database and isolated tenant.
- Do not remove the existing mocked tests; treat the live E2E suite as a separate, higher-fidelity validation layer.
- Acceptance criteria: The full operator golden path is validated against a live backend in CI.
```

15. **Expand `ui-e2e-live` to cover the full golden path**
- Why it matters: Evaluators and enterprise buyers need a way to easily author and test custom governance rules without writing raw code.
- Expected impact: Customer Self-Sufficiency (+4 pts), Usability (+3 pts).
- Affected qualities: Customer Self-Sufficiency, Usability.
- Actionable: Yes

```markdown
Implement a web-based rule authoring interface in `archlucid-ui` that integrates with `ArchLucid.Decisioning`.
- Provide a guided wizard or low-code builder for creating custom policy rules.
- Allow operators to test the rule against existing architecture snapshots in the UI before publishing.
- Ensure custom rules are durably stored and versioned alongside the default policy packs.
- Acceptance criteria: Operators can create, test, and publish custom rules entirely through the UI.
```

---

## Prompt Batching Guidance

- **Batch 0 (IaC / state hygiene — coordinated window):** Improvement **#1** (**Terraform Phase 7.5**) **closed** in-repository **2026-05-15** — future brownfield-only **`state mv`** PRs pair **`docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md`** updates with operator **`terraform plan`** sign-off (human-required — **DEV** before **Prod**).
- **Batch 1b (Marketing artifact — GA gate):** **28** (buyer-grade report export **+ consultant whitelabel — Q5**). Coordinate with **#27** so labels in exported doc match UI glossary (**Architecture snapshot**, **Review**, etc.); coordinate with **#29** so **Policy findings** reflect seeded packs; security review on logo uploads.
- **Batch 1c (Governance content — GA gate):** **29** — curated pack authoring + seed/bootstrap + docs honesty guardrails; pair with legal/product review of mapping disclaimers; **do not** dilute with landing-zone pack scope creep.
- **Batch 1d (Evidence capture UX — GA gate):** **30** with **#27** — bulk upload surfaces must reuse glossary (**Evidence**, **Capture**) and visible **“up to 30 files”** disclosure.
- **Batch 1e (Demo workspaces — GA gate):** **31** alone or with **#29** seed coordination — release-blocking smoke; avoid coupling with unrelated feature PRs close to GA freeze.
- **Batch 1f (Landing / GTM — GA):** **32** after **#31** Workspace **A** URL is stable — pair copy + analytics; keep out of unrelated feature merges near freeze.
- **Batch 1 (High Leverage, Low Risk):** 3, 4, 17, 24. These address immediate correctness, security, and documentation gaps without major architectural changes.
- **Batch 2 (Performance & Observability):** 5, 9, 15, 21, 23. These improve the operational characteristics of the system, making it more robust at scale.
- **Batch 3 (Testing & Analytics):** 8, 11, 12, 14. These improve the testing posture and provide better ROI/cost estimation capabilities.
- **Batch 4 (DTF orchestration migration — dedicated slice):** 26 alone. This is a foundational change with its own parity-test obligation; give it a full context window and do not mix it with other improvements.
- **Deferred / V1.1 program (do not batch into V1 execution):** 20 (inbound MCP); **Azure CAF / landing-zone curated policy pack** (extends **#29** mechanics — ship post-GA per owner **Q3**); **bulk evidence upload limit above 30 files**, ZIP expansion, recursive folder ingest (**extends #30**). Keep out of V1 Cursor batches; plan V1.1 slices with dedicated context.

---

## Marketing alignment — owner Q&A

Sequential decisions so marketing ↔ technical V1 stay aligned. **Status: Q1–Q7 answered** (2026-05-15).

| # | Topic | Answer |
|---|--------|--------|
| 1 | Operator UI ↔ technical glossary (#27) — canonical buyer-facing labels vs API/internal terms | **Owner 2026-05-15:** Primary work unit **Run** → UI **Review** (use *Architecture review* where space allows). Persist-golden-manifest action **Commit** → **Finalize review** / **Finalize** in context. **Manifest / golden manifest** → **Architecture snapshot** / **Snapshot** in tight UI. Graph screen → **Evidence graph**; route **`/graph`** unchanged. Internal/API: `RunRecord`, `POST .../commit`, `GoldenManifest`, `KnowledgeGraph` unchanged. Tooltip near finalize: replay/compare still allowed after lock. |
| 2 | Buyer-grade default architecture review export (DOCX/PDF sections matching landing narrative) — **V1 GA gate** vs **post-V1 polish** | **Owner 2026-05-15:** **V1 GA gate.** Default export profile(s) must match marketing narrative sections; landing page / demos / downloadable sample assume GA ships with buyer-grade DOCX **and** PDF. Implementation tracked via improvement **#28** (extended by row 5). |
| 3 | Ship **default AI governance / landing-zone / security baseline policy packs** in **V1 GA** vs soften AI-governance marketing until packs exist | **Owner 2026-05-15 (agent recommendation accepted):** **V1 GA — ship subset:** (**1**) **AI governance / responsible AI** MVP pack; (**2**) **Security architecture baseline** MVP pack. **Azure landing-zone / CAF-aligned** curated pack **deferred to V1.1** — GA marketing relies on **extractor + advisor** for cloud baseline narrative; **must not** imply bundled CAF landing-zone pack until release. Implementation + honesty docs tracked via improvement **#29**; scoring boundary — see **§V1 scoring boundary** (policy packs bullet). |
| 4 | **Bulk evidence upload** (mixed files → run evidence) — **V1** vs **V1.1** vs **not planned** (sets honesty bar for “capture scattered evidence” copy) | **Owner 2026-05-15:** **V1 GA — capped:** bulk attach ships at GA with **≤30 files per upload/action** (hard server limit). Landing/support/demo copy **must** disclose the cap; raising/removing limit, ZIP unpack, recursive folders → **V1.1** backlog. Implementation tracked via improvement **#30**; scoring boundary — **§V1 scoring boundary** (bulk upload bullet). |
| 5 | **Consultant / engagement report whitelabel** (cover branding for Upwork-style deliverables) — **V1** vs **later** | **Owner 2026-05-15:** **V1 GA.** DOCX **and** PDF exports support **tenant-scoped** whitelabel: **firm name**, **engagement/client title**, optional **logo**, **Prepared by … using ArchLucid** attribution. Folded into improvement **#28** (same profile); **§V1 scoring boundary** (whitelabel bullet). Security sign-off on logo handling. |
| 6 | Two **curated demo workspaces** (self-demo + synthetic regulated scenario) — **V1 release gate** vs **best-effort before GA** | **Owner 2026-05-15:** **Hard V1 release gate.** Exactly **two** tenant-ready workspaces (**self-demo / tour** + **synthetic regulated AI + governance scenario**) ship before GA; **release checklist blocks GA** until both pass automated smoke (**Playwright** / **`release-smoke`** per repo norms). Implementation **#31**; **§V1 scoring boundary** (demo workspaces bullet). |
| 7 | Landing **primary CTA** for first 90 days — **Request walkthrough** vs **Early access** vs **Paid pilot ($ band)** vs hybrid | **Owner 2026-05-15 (agent recommendation accepted):** **Hybrid.** **Primary:** **Request walkthrough** (sales-led GA; matches deferred Stripe live / Marketplace). **Secondary:** **Try the self-demo** — deep-link to **Workspace A** (**#31**). **Tertiary:** **Early access** / email waitlist — **must not** imply instant product access or live checkout. **Public paid-pilot $ band** **excluded** from hero for **first 90 days** (qualify→quote path). Implementation **#32**; **§V1 scoring boundary** (landing CTA bullet). |

---

## Pending Questions for Later

- **P1 — Phase 7.5 Terraform rehearsals (`DEV` / `Prod`) — answered (subscriptions + authority); improvement **#1** checklist/runbook closure (**2026-05-15**):**
  - **Subscriptions (owner-provided via Azure portal, 2026-05-15):** Both tenant subscriptions under **Default Directory** (`joefrancismarch25outlook.onmicrosoft.com`) remain in scope for **`terraform plan` / `state mv`** rehearsals when remote backends exist:
    - **ArchLucid DEV** — subscription **`8aa56f3b-18bc-43ca-ad45-bad9e811d33b`**
    - **ArchLucid Prod** — subscription **`aab65184-5005-4b0d-a884-9e28328630b1`**
  - **Recommended window order:** Run **`terraform plan`** / **`terraform state mv`** rehearsal against **DEV** first; repeat only after DEV plans are clean for **Prod** (Prod currently shows **$0** spend — still validate whether remote state exists per root before skipping **Prod** passes).
  - **Backup / rollback authority:** Portal identity holds **Azure RBAC Owner** on **both** subscriptions — **same principal** should **download remote state backups** immediately before each `state mv`, run **`terraform plan`**, and **authorize abort / state restore** if the plan shows unexpected **destroy/replace**. Delegate to a named infra deputy in writing if Owner is not executing moves personally.
  - **Roots:** Canonical catalog **`docs/library/DEPLOYMENT_TERRAFORM.md`**. Enumerate only stacks already applied with **`backend.tf`**. **`terraform state list | rg archiforge`** determines brownfield **`state mv`** need (**archive procedures:** **`docs/archive/TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md`**). Starter audit depth (**when brownfield applies**) historically emphasized **`infra/terraform`**, **`infra/terraform-monitoring`**, **`infra/terraform-container-apps`**, **`infra/terraform-sql-failover`** — extend to other roots **when applied** in that subscription (**matrix:** **`docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md`**).
  - **Matrix:** Subscription × root rehearsal template appended **2026-05-15** (operators fill **Y/N** cells — satisfies former **P1** follow-up).
- **P2 — Phase 7.6–7.8 GitHub repo rename + Entra apps — answered:** **Owner 2026-05-15:** **Yes** — IT/security approval to execute the **GitHub repository rename** and **Entra ID app registration alignment** is **on file**. **Engineering closure:** **Phase 7.6–7.7** **completed 2026-04-19**; **Phase 7.8** optional local folder rename **waived** — receipts **`docs/archive/root-superseded-2026-05-01/ARCHLUCID_RENAME_CHECKLIST.md`**; living pointer **`docs/ARCHLUCID_RENAME_CHECKLIST.md`** (**improvement #2**). Optional evidence link (ticket/email) for auditors if your org requires it.
- **P3 — In-Slack interactive approvals — answered:** **Owner 2026-05-15 (agent recommendation accepted):** **Not** V1 GA / **not** current sprint. **Target: early V1.1** (~first **30 days** post-GA). **MVP scope:** single **approve finding / decision** flow; **audit parity** with UI; **signing-secret** + identity/RBAC binding. **Marketing:** no “approve from Slack” claims at GA. **Mockups:** none provided — engineer from operator approval UX or add wireframes in V1.1 slice. Details also in improvement **#6**.
- **P4 — Stripe live keys + Marketplace publication — answered:** **Owner 2026-05-15:** **Defer** execution **until finance confirms** Partner Center readiness (seller verification, tax profile, payout/banking). **Next step:** Finance “go” → run improvement **#7** against billing/runbook checklists (e.g. **`docs/library/DEPLOYMENT_TERRAFORM.md`** and any Partner Center / Stripe cutover notes the team maintains).
- **P5 — Hosted-trial `V1`→`V1.1` migration guide — answered:** **Owner 2026-05-15:** Artifact is **out of V1 GA checklist-blocking scope** and **in V1.1 documentation scope** (`docs/library/V1_DEFERRED.md` §6i). **`(A)` V1 readiness is unchanged** by treating this as orientation-only at GA. **`docs/library/HOSTED_TRIAL_V1_TO_V1_1_MIGRATION_GUIDE.md`** provides baseline rollup prose; refresh when **`V1.1`** deltas enumerate (commerce **P4**, MCP, Slack **P3**, packs, etc.).
- **P6 — Native SAML 2.0 SP vs OIDC federation — answered:** **Owner 2026-05-15:** **Native SAML 2.0 Service Provider** workforce SSO is **promoted into V1 GA scope** (`docs/library/V1_SCOPE.md` §2.12). **`JwtBearer`** OIDC remains **first-class**. Implementation tracked via improvement **#13**; procurement/auth docs updated in **`SECURITY.md`**, **`PROCUREMENT_FAQ.md`**, **`V1_DEFERRED.md` §6g.
- **P8 — Third-party penetration test (budget / vendor) — answered:** **Owner 2026-05-15:** **No** — do **not** treat pen-test vendor/budget as **`(A)` V1** inputs or recurring **§ Pending** prompts during **V1** planning / execution. Posture stays **`V2`** (`V1_DEFERRED.md` §6c); procurement honesty remains **`(B)`** friction only. Improvement **#18** is **`V2`** backlog metadata until a **`V2`** program formally opens.
- **P9 — PGP key prerequisites (`security@archlucid.net`) — answered:** **Owner 2026-05-15:** **`archlucid.net`** **acquired**; **`security@archlucid.net`** mailbox **active**. **PGP publication** remains **`V1.1`** engineering (**improvement #19**, **`PGP_KEY_GENERATION_RECIPE.md`** — single PR with **`SECURITY.md`** + **`/security`** per scope docs).
- **P10 — ServiceNow developer instance + schemas — answered:** **Owner 2026-05-15:** **No** access **at this time**. **`V1` GA** bidirectional ServiceNow sync **remains in contract** (`V1_SCOPE.md` §2.13). Owner commits to provisioning a **cost-free** **ServiceNow Developer Program** / personal developer-style instance for engineering (**#22**) **when available** — **paid** sandbox **not** a **`V1` GA** gate. **If** a **free** path cannot be obtained before a future GA decision, owner must **explicitly** revise scope docs — do **not** silently drop **`V1` GA** claims.
- **P11 — Azure Container Apps Jobs vs V1 — answered:** **Owner 2026-05-15:** Concurs — **do not** bring **ACA Jobs** into **`V1`**. Keeps **`V2`** situational backlog (`docs/library/V1_DEFERRED.md` §6f); tracked as improvement **#25**.
- **P12 — Inbound MCP V1.1 scope freeze — answered:** **Owner 2026-05-15:** **Pinned slice** in `docs/library/MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md` **§5.1** — **seven** **read-only** tools (`GetRunStatus`, `GetManifestSummary`, `CompareRuns`, `GetProvenanceGraph`, `GetGovernanceStatus`, `ListArtifacts`, `GetAuditSlice`); **production transport:** **Streamable HTTP** (private endpoint); **`stdio`:** optional **non-production** / local-self-hosted only; **shared membrane** + **`SESSION_CONTEXT`**; **no** outbound MCP client in **V1.1**. Cross-links: **`V1_SCOPE.md`** §3 MCP row, **`V1_DEFERRED.md`** §6d.
- **Marketing alignment Q7** (landing CTAs / **#32**): **Answered** — **Hybrid:** walkthrough primary, self-demo secondary (**#31** A), early access tertiary; **no public $ band** first 90 days; see row 7 and **§V1 scoring boundary** (landing CTA bullet).
- **Marketing alignment Q6** (demo workspaces / **#31**): **Answered** — **Hard GA gate** for **two** curated workspaces + automated smoke; see row 6 and **§V1 scoring boundary** (demo workspaces bullet).
- **Marketing alignment Q5** (consultant whitelabel / **#28**): **Answered** — **V1 GA**; cover + attribution on **DOCX + PDF**; see row 5 and **§V1 scoring boundary** (whitelabel bullet).
- **Marketing alignment Q4** (bulk evidence upload / **#30**): **Answered** — **V1 GA** with **≤30 files** per upload; disclose everywhere marketing promises bulk capture; **V1.1** for higher limits / ZIP / recursion — see row 4 and **§V1 scoring boundary** bullet.
- **Marketing alignment Q3** (default policy packs / #29): **Answered** — **V1 GA:** AI governance + security baseline MVP packs; **V1.1:** Azure landing-zone / CAF-aligned curated pack; see row 3 and **§V1 scoring boundary** bullet.
- **Marketing alignment Q2** (buyer-grade export): **Answered** — **V1 GA gate**; see row 2 and improvement **#28**.
- **Marketing alignment Q1** (glossary / #27): **Answered** — see **§ Marketing alignment — owner Q&A** row 1 (canonical UI labels: Review, Finalize review, Architecture snapshot, Evidence graph).
