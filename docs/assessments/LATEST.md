> **Scope:** Internal weighted readiness assessment for repo stewards — V1 scoring boundary and backlog prompts; not a customer-facing datasheet nor an exhaustive audit substitute.

# ArchLucid Assessment – Weighted Readiness 81.55%

**V1 scoring boundary:**

- **MCP:** Inbound Model Context Protocol is **explicitly out of V1** and scheduled for **V1.1** per `docs/library/V1_SCOPE.md` §3 and `docs/library/V1_DEFERRED.md` §6d. **V1.1 slice pinned** (**owner 2026-05-15**, **P12**): **seven read-only tools**, **Streamable HTTP** for production (private endpoint), optional **`stdio`** for local/self-hosted harness only — `docs/library/MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md` **§5.1**. Absence of an MCP host does not reduce any weighted quality score; REST, CLI, operator UI, webhooks, and first-party integrations are the in-contract V1 integration surfaces.
- **Hosted-trial `V1`→`V1.1` migration / expectations guide:** **Explicitly out of V1 GA** narrative-blocking claims — orientation memo **`docs/library/HOSTED_TRIAL_V1_TO_V1_1_MIGRATION_GUIDE.md`** **shipped (2026-05-15**, improvement **#10**, **`V1_DEFERRED.md` §6i**). **`(A)` V1 headline readiness is unchanged:** memo frames **V1.1** outbound deltas (commerce, MCP, Slack approvals, packs), **not** a GA prerequisite checklist rewrite.
- **Native SAML 2.0 Service Provider (workforce SSO):** **In V1 GA scope** (**owner 2026-05-15**, **`docs/library/V1_SCOPE.md` §2.12**, **P6**). **`JwtBearer`** OIDC remains **first-class**; SAML **SP** augments buyer choice. **`(A)` V1 headline readiness** assumes **#13** closes before GA claims **SAML-direct** tenancy support without brokers — until shipped, procurement must describe **OIDC / broker** interim posture honestly.
- **Third-party penetration test (external vendor):** **`V2`** per **`docs/library/V1_DEFERRED.md` §6c. **`(A)` V1 planning / execution** omits recurring **budget / vendor pen-test prompts** (**owner 2026-05-15**, **P8**). Treat absent published assessor summary as **`(B)` procurement realism** only — improvement **#18** remains **`V2`** backlog metadata, not a **V1** standing question.
- **Planning bridge (59R operator UX):** **V1 GA** — in-shell flow on **`/product-learning`** per **`docs/library/PRODUCT_LEARNING.md` §4.2** (improvement **#16**, **P7** owner **2026-05-15**). **`/planning`** stays read-only browse; bridge invokes existing **`POST /v1/learning/planning/materialize`** — **no** preview-only endpoint required for GA (**engineering judgment** documented in §4.2 **Constraints**).
- **ServiceNow bi-directional status sync:** **`V1` GA** per **`docs/library/V1_SCOPE.md` §2.13** — unchanged. **P10** (**2026-05-15**): **no** ServiceNow developer instance **yet**; owner will unblock **#22** via **cost-free** **ServiceNow Developer Program** / personal developer-style instance (**paid** sandbox **not** a **`V1` GA** prerequisite). Until provisioned, engineering is **queued only** — explicit scope demotion requires **`V1_SCOPE.md`** / **`PENDING_QUESTIONS.md`** amendment **if** a **free** path never materializes.
- **Durable Task Framework (DTF):** **Improvement #26 closed (2026-05-16)** — SQL storage hosts bind the authority pipeline to the Durable Task port (`DtfAuthorityRunOrchestrator`); `ArchLucid.Application` still has no compile-time dependency on `Microsoft.DurableTask.*`. InMemory / simulator paths remain on the legacy adapter until separately migrated. The ACA Jobs row in `V1_DEFERRED.md` §6f remains out of V1 scope. **P11** (**2026-05-15**, owner concurrence): **Azure Container Apps Jobs** stay **`V2`** situational backlog (**improvement #25**) — **not** promoted into **`V1`**.
- **Terraform Phase 7.5 (`state mv`):** **COMPLETE for repository IaC posture (2026-05-15)** — committed **`infra/**/*.tf`** uses **`archlucid`** resource addresses only (grep audit and operator rehearsal checklist in **`docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md`**); **conditional** **`terraform state mv`** applies **only** when remote state still lists **`archiforge`** addresses (**`docs/archive/TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md`**). **Phase 7.6–7.7** (GitHub repository rename, Entra greenfield registration alignment) **closed 2026-04-19**; **Phase 7.8** (optional local workspace folder rename) **waived** — receipts in **`docs/archive/root-superseded-2026-05-01/ARCHLUCID_RENAME_CHECKLIST.md`**; pointer **`docs/ARCHLUCID_RENAME_CHECKLIST.md`** (**assessment improvement #2**). **P2** (**2026-05-15**): owner **IT/security approval** on file, consistent with executed rename work.
- **Operator UI vocabulary vs marketing workflow (V1):** Buyer-facing labels in **`archlucid-ui`** align with the evidence-backed governance narrative (e.g. **Capture system**, **Evidence**, **Review**, **Findings**, **Decisions**, **Report**) mapped from existing flows (**run**, **manifest**, **commit**, **authority** remain internal/API). **REST routes, OpenAPI operation IDs, CLI commands, and audit event names are unchanged** unless separately versioned. **Usability** headline (**77**) reflects glossary alignment (**Q1** / **#27**) plus bounded bulk capture (**Q4** / **#30**).

- **Buyer-grade architecture review export:** A **default DOCX/PDF export profile** matching the landing-page report narrative (executive summary, system overview, evidence reviewed, architecture decisions, key risks, policy findings, AI-assisted analysis with human-review framing, traceability appendix, recommended next actions) is a **V1 GA gate** per owner Q2 (**Marketing alignment — owner Q&A** row 2). **Consultant whitelabel** on cover/metadata is **also GA** per row **5** — same pipeline (**#28**). Landing demos and downloadable sample reports assume both ship with GA.

- **Consultant / engagement report whitelabel (V1 GA):** Exported **Architecture Review Reports** (**DOCX + PDF**) support **tenant-scoped branding**: **consulting firm name**, **client engagement title**, optional **logo image** (PNG/SVG policy per security review), and **cover footer disclaimer** (“Prepared by … using ArchLucid”) so boutique / marketplace consultants can deliver client-facing artifacts without manual replatforming. **Proof-of-ROI Readiness**, **Commercial Packaging Readiness**, and **Stickiness** are scored upward (**Marketing alignment — owner Q&A** row 5). Implementation folds into improvement **#28** (same export pipeline — avoid duplicate profiles).

- **Default policy packs (curated content — V1 GA subset):** ArchLucid ships **two** tenant-available **default policy packs** at **V1 GA**: (**1**) **AI governance / responsible AI** — MVP rule set with explicit framework **mapping** (e.g. NIST AI RMF v1.0 themes, EU AI Act high-risk categories) — *mapping only, no certification claim*; (**2**) **Security architecture baseline** — MVP rules aligned to buyer-credible themes (e.g. CIS Azure Foundations / OWASP ASVS-style controls). **Azure landing-zone / CAF-aligned** curated pack is **deferred to V1.1** (extractor + advisor already carry Azure posture narrative at GA). Marketing may claim bundled AI-governance + security-baseline starter packs at GA; **must not** imply a shipped **CAF landing-zone pack** until **V1.1**. **Proof-of-ROI Readiness**, **Commercial Packaging Readiness**, and **Stickiness** are scored upward to reflect this owner commitment (**Marketing alignment — owner Q&A** row 3).

- **Bulk evidence upload (V1 cap):** **Multi-file bulk attach** to a review’s evidence set ships in **V1 GA** with a **hard ceiling of 30 files per request** (server-enforced). Marketing **must** disclose the cap (“up to **30 files** per upload”) and avoid infinite batch promises until **V1.1** raises or removes the limit. **Usability** and **Customer Self-Sufficiency** are scored upward slightly (**Marketing alignment — owner Q&A** row 4).

- **Curated demo workspaces (hard V1 GA gate):** Exactly **two** **demo workspaces** must ship **before GA**, documented and reachable from onboarding / marketing flows: (**A**) **Self-demo / product tour** — lands evaluators on the canonical workflow (**Capture → Evidence → Review → … → Report**) using synthetic-safe content; (**B**) **Synthetic regulated scenario** — AI governance + cloud posture narrative with seeded evidence and **policy findings** sourced from improvements **#29** packs (no real customer data). **Release checklist blocks GA** until both pass automated smoke (**Playwright** and/or **`release-smoke`** per repo norms). **Adoption Friction**, **Proof-of-ROI Readiness**, and **Commercial Packaging Readiness** are scored upward (**Marketing alignment — owner Q&A** row **6**). Tracked via improvement **#31**.

- **Landing page CTA stack (first 90 days — V1 honesty):** **Hybrid** posture per owner **Q7** (**Marketing alignment — owner Q&A** row **7**): **primary CTA** = **Request walkthrough** (sales-led GA, matches deferred live marketplace/self-serve). **Secondary CTA** = **Try the self-demo** — deep-link into **Workspace A** from improvement **#31** (product touch before calendar). **Tertiary** = **Early access** / waitlist capture only — **must not** imply instant product access, live checkout, or parity with walkthrough-led pilots. **Public paid-pilot $ band** is **out of scope for the first 90 days** (pricing stays walkthrough→qualify→quote until reference customers exist). Implementation and copy review tracked via improvement **#32**.

## Executive Summary

**Overall Readiness:** ArchLucid is a functionally complete V1 product with a solid architectural foundation, capable of executing the core pilot loop (internally run → execute → commit → manifest and artifacts). However, its immediate readiness is still constrained by **residual audit-matrix deferrals** (notably read-path **`FindingsListAccessed`**) and the intentional deferral of live commerce and compliance attestations to V1.1 and beyond — **durable `ManifestSuperseded` / finalize supersession hygiene closed repository-side (2026-05-15**, **`AUDIT_COVERAGE_MATRIX.md`**, improvement **#3**). **Phase 7.6–7.7** rename execution and Entra greenfield alignment **closed 2026-04-19** (**7.8** waived — **`docs/ARCHLUCID_RENAME_CHECKLIST.md`**). **Terraform Phase 7.5** (**improvement #1**) is **closed** for **committed IaC** as of **2026-05-15**; operators still owe **`terraform plan` / `state list`** hygiene per **`docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md`** wherever remote backends exist. **Operator shell labels will align with marketing workflow language** so pilots moving from landing page to product see one coherent story (technical APIs unchanged). **V1 GA requires** a buyer-grade **Architecture Review Report** export (DOCX + PDF) aligned to landing-page sections (**Marketing alignment Q2**) **with consultant whitelabel on cover/metadata** (**Marketing alignment Q5**, folded into **#28**) **and two curated default policy packs** (AI governance + security baseline; landing-zone pack **V1.1**) (**Marketing alignment Q3**) **and bounded bulk evidence upload** (**≤30 files** per operation — **Marketing alignment Q4**) **and two curated demo workspaces as a hard release gate** (**Marketing alignment Q6** / improvement **#31**) **and a landing CTA stack aligned to sales-led GA** (**Marketing alignment Q7** / improvement **#32**) **and native SAML 2.0 SP workforce SSO** (**`V1_SCOPE.md` §2.12**, improvement **#13**, **P6** owner **2026-05-15**) **and the 59R planning bridge UX** (**`PRODUCT_LEARNING.md` §4.2**, improvement **#16**, **P7** owner **2026-05-15**).

**Commercial Picture:** The product is ready for sales-led pilots and staging-based trial evaluations. However, self-serve transactability is intentionally paused, with Stripe live keys and Marketplace publication deferred to V1.1. The lack of a published reference customer and signed design partner (also deferred) may slow early momentum. **GA ships differentiated governance starters:** buyer-visible **AI governance** and **security baseline** policy packs (thin MVP counts acceptable), strengthening demo credibility versus empty-pack onboarding. **Evidence capture** gets **bulk upload** at GA with an explicit **≤30-file** ceiling (**Marketing alignment Q4**) — pitch accordingly. **Consultants can white-label client deliverables** (firm name, engagement title, logo — **Marketing alignment Q5**) directly from export — strengthens marketplace / boutique wedge without manual DOCX surgery. **Sales-led and self-serve evaluators both hit fixed demo workspaces** (**self-demo + regulated synthetic**) — GA is blocked until both stay green (**Marketing alignment Q6**). **First-90-days landing posture:** **Request walkthrough** primary, **Try the self-demo** secondary (Workspace **A**), **Early access** tertiary capture — **no public paid-pilot $ band** yet (**Marketing alignment Q7**).

**Enterprise Picture:** The system supports robust tenant isolation (database-per-tenant), workforce SSO via **OIDC / Entra ID** and **native SAML 2.0 SP** (**`V1_SCOPE.md` §2.12**, **V1 GA** — improvement **#13**), and private connectivity. First-party ITSM connectors (Jira, ServiceNow) and Slack/Confluence integrations are strong enterprise features. However, the absence of a CPA-issued SOC 2 report and third-party penetration test (deferred to V2) will cause friction during procurement and security reviews.

**Engineering Picture:** The engineering foundation is strong, utilizing SQL persistence, DbUp migrations, and a well-architected agent orchestration pipeline. **Improvement #26 (2026-05-16):** SQL storage hosts bind the authority pipeline to the Durable Task port (`DtfAuthorityRunOrchestrator`); deeper DTF-native scheduling and full multiset parity remain incremental work. **Improvements closed (2026-05-15):** idempotent orphan **`archiforge_*`** RLS predicate drops (**DbUp 165**, **#4**); **`FirstTenantFunnelEvents`** SQL purge when per-tenant emission is **off** (**#5**); **`ui-e2e-live`** negative-path coverage (**#8**); optional **Redis-backed** graph projection **`IDistributedCache`** (**#9**); hosted-trial **V1→V1.1** orientation memo (**#10**). Residual risks include **immutable** migration/history spellings, catalogs still on legacy **RLS** identifiers until **`108`** replay coordination, single-process projection defaults without Redis, and **keeping GA-gated demo workspace smoke green** (**Q6** / **#31**).

---

## Weighted Quality Assessment

### 1. Adoption Friction
- **Score:** 77
- **Weight:** 6
- **Weighted deficiency signal:** 138
- **Justification:** Tier 1 Azure extraction remains frictionless. **Terraform Phase 7.5** (**improvement #1**) **closed in-repository (2026-05-15)** — **`infra/**/*.tf`** aligns with **`archlucid`** addresses (grep + rehearsal matrix **`docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md`**); **brownfield `state mv`** remains operator-owned only when legacy **`archiforge`** addresses persist in remote state. **Phase 7.6–7.7** + waived **7.8** (**improvement #2**) **closed 2026-04-19** — see **`docs/ARCHLUCID_RENAME_CHECKLIST.md`**. **Owner decision (Q6):** **two curated demo workspaces** are a **hard GA gate**, shrinking time-to-first-success for evaluators versus blank tenants. **Owner decision (Q7):** landing **hybrid CTA** routes serious buyers to **walkthrough** while offering **self-demo** before calendar load (**#32**). Some **immutable** DbUp history and RLS lineage still carries legacy spellings — procurement-facing docs should say so honestly (**not** unreleased rename backlog).
- **Tradeoffs:** Executing `state mv` in brownfield stacks is operationally risky and needs a coordinated deploy window. Demo workspaces create **fixture-maintenance tax** — feature churn can break GA smoke unless **#31** is treated as living backlog.
- **Improvement recommendations:** ~~Complete Phase 7.5 per `docs/ARCHLUCID_RENAME_CHECKLIST.md` and improvement #1 below.~~ **Improvement #1 closed (2026-05-15)** — follow **`docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md`** for subscription rehearsals only. **Improvement #2** (**7.6–7.8**) **closed 2026-04-19** per archived checklist — no schedule action. Implement improvement **#31** (demo workspaces — **release-blocking**). Implement improvement **#32** (landing CTA stack — **Q7**). Provide explicit documentation for generic OIDC setup (`improvement #24`).

### 2. AI/Agent Readiness
- **Score:** 82
- **Weight:** 8
- **Weighted deficiency signal:** 144
- **Justification:** The system effectively uses Azure OpenAI with prompt redaction, execution traces, and a well-tested authority pipeline. **Improvement #26 (2026-05-16)** delivers the SQL Durable Task port for authority orchestration; further checkpoint-native scheduling strengthens the governance story for regulated buyers. **Planning bridge UX** for **59R** is **in V1 GA scope** (**`PRODUCT_LEARNING.md` §4.2**, improvement **#16**, **P7** owner **2026-05-15**) — execution remains until engineering lands the panel; materialization API already ships (**§4.1**).
- **Tradeoffs:** DTF introduces a durable orchestration history schema in SQL and a new operational runbook surface. The trade-off is justified: the parity-test obligation and operational cost are bounded; the governance-provenance benefit compounds over time and aligns with the primary buyer wedge.
- **Improvement recommendations:** ~~Implement the DTF migration behind an interface boundary (see improvement #26).~~ **Improvement #26 closed (2026-05-16)** — SQL host DI + boundary tests; add explicit logging for state transitions during and after DTF scheduling hardening. (Inbound MCP is **V1.1** per scope docs — not a V1 readiness gap.)

### 3. Correctness
- **Score:** 82
- **Weight:** 8
- **Weighted deficiency signal:** 144
- **Justification:** The execution model is solid; **improvement #3** **`ManifestSuperseded`** durable path **closed (2026-05-15)** per **`docs/library/AUDIT_COVERAGE_MATRIX.md`** (finalize orphan cleanup). **Improvement #4** (**DbUp 165**) clears **unreferenced** legacy **`archiforge_*`** security predicates; residual catalogs still named **`ArchiforgeTenantScope`** remain operator **`108`** coordination — honesty / isolation posture unchanged versus immutable journal facts.
- **Tradeoffs:** Read-path **`FindingsListAccessed`** stays intentionally unaudited until a stable bulk-list contract exists; RLS rename migrations remain coordination-heavy.
- **Improvement recommendations:** ~~Implement durable audit coverage for all missing mutating flows.~~ **Improvement #3 closed (2026-05-15)** — retain **`AUDIT_COVERAGE_MATRIX.md`** discipline for future mutation surfaces. **Improvement #4 closed (2026-05-15)** — orphan predicate cleanup (**`165_RlsLegacyOrphanPredicateCleanup.sql`**); track honest **`108`** replay notes where catalogs lag (**migration header**).

### 4. Proof-of-ROI Readiness
- **Score:** 84
- **Weight:** 5
- **Weighted deficiency signal:** 80
- **Justification:** The Azure extractor provides cost data, and the comparison replay cost estimator is useful. **Owner decision (Q3):** **V1 GA** ships curated **AI governance** and **security baseline** default packs so pilots immediately surface policy findings aligned to the wedge — demos prove ROI faster than buyer-authored-only onboarding. **Owner decision (Q5):** report export **whitelabel** lets consultants prove tangible client-ready ROI artifacts without offline rebranding. **Owner decision (Q6):** **regulated synthetic demo workspace** gives repeatable proof narrative without bespoke pilot setup. Cross-tenant analytics remain absent for portfolio-wide executive proof.
- **Tradeoffs:** Tenant isolation (database-per-tenant) makes cross-tenant analytics harder to implement securely. **Curated packs** shift burden to **credible authoring** — MVP rule counts must stay humble (*starting baseline*, not exhaustive compliance) or regulated buyers dismiss the wedge.
- **Improvement recommendations:** Execute improvement **#29** (seed **AI governance** + **security baseline** packs). Ship **#28** including **consultant whitelabel** (**Q5**). Deliver improvement **#31** (**Q6** demo workspaces — ROI storytelling). Ship improvement **#32** (**Q7** landing CTAs → Workspace **A**). Enhance the `ComparisonReplayCostEstimator` with more granular heuristics (**#11**). Implement internal-only cross-tenant analytics (**#12**).

### 5. Usability
- **Score:** 77
- **Weight:** 3
- **Weighted deficiency signal:** 69
- **Justification:** The operator UI is functional. **Owner decision:** surface copy shifts from engineering-centric terms (**run**, **commit**, **manifest**) to marketing-aligned governance vocabulary (**Capture**, **Evidence**, **Review**, **Findings**, **Decisions**, **Report**) without renaming HTTP contracts — reducing cognitive load for regulated EA/security buyers and consultants. **Owner decision (Q4):** **bulk evidence upload** lands in **V1 GA** capped at **≤30 files** per upload so “gather scattered artifacts” demos stay honest without taking unlimited ingestion scope pre-GA. **Owner decision (P7):** **59R planning bridge** ships **V1 GA** per **`PRODUCT_LEARNING.md` §4.2** (**#16**) — **`/planning`** stays aggregation-only; **`/product-learning`** owns the materialize affordance. **`ui-e2e-live`** now carries targeted **live API negatives** (**improvement #8** **closed 2026-05-15**); most operator-shell Playwright paths remain **`/api/proxy`** mocks until broader expansion lands.
- **Tradeoffs:** Dual vocabulary (friendly labels vs stable API names) must be documented for integrators and support; translators/tests must reference stable selectors where headers change copy. The **30-file** ceiling avoids abuse and MVP complexity but forces explicit marketing disclosure and may annoy heavy dossier pilots until **V1.1**.
- **Improvement recommendations:** Execute improvement **#27** (navs, wizard steps, empty states, Core Pilot checklist). Implement improvement **#30** (bulk upload with **≤30** enforcement + UX copy). Ship improvement **#28** **including whitelabel fields** in export UX (**Q5**). Implement improvement **#16** (**59R planning bridge** — **`PRODUCT_LEARNING.md` §4.2**, **V1 GA**). ~~Expand `ui-e2e-live` … (**#8**).~~ **Improvement #8 closed (2026-05-15)** — **`live-api-negative-paths.spec.ts`**. Add `DataArchivalHostHealthCheck` to the dashboard (**#21**).

### 6. Workflow Embeddedness
- **Score:** 82
- **Weight:** 3
- **Weighted deficiency signal:** 54
- **Justification:** The inclusion of first-party ITSM connectors (Jira, ServiceNow) and Slack/Confluence integrations in V1 GA is a strong positive.
- **Tradeoffs:** Building first-party connectors takes resources away from core platform features but significantly improves workflow integration.
- **Improvement recommendations:** Implement bi-directional ServiceNow status sync (**#22**) once owner provisions **cost-free** Developer Program / PDI-style credentials (**P10**) — **`V1` GA** commitment unchanged (`V1_SCOPE.md` §2.13). Track **in-Slack interactive approvals** as **early V1.1** slice (**P3** / improvement **#6** — single approve-finding MVP).

### 7. Compliance Readiness
- **Score:** 75
- **Weight:** 2
- **Weighted deficiency signal:** 50
- **Justification:** A durable audit trail exists, and the SOC 2 self-assessment is complete. **Finalize supersession** now emits **`ManifestSuperseded`** (**2026-05-15**); residual gaps are limited to explicit matrix deferrals (e.g. **`FindingsListAccessed`** read path).
- **Tradeoffs:** Self-assessment is faster and cheaper than CPA attestation but carries less weight with enterprise buyers.
- **Improvement recommendations:** ~~Close the known gaps in the `AUDIT_COVERAGE_MATRIX.md`.~~ **Mutating durable gaps cleared (2026-05-15)** — keep matrix reviews green when adding HTTP mutations; track **`FindingsListAccessed`** only when a list endpoint ships.

### 8. Commercial Packaging Readiness
- **Score:** 83
- **Weight:** 2
- **Weighted deficiency signal:** 34
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
- **Tradeoffs:** Default **in-process** projection cache still caps multi-replica coherence unless operators enable **Distributed** backend + Redis (**improvement #9** **closed 2026-05-15** — configure **`ArchLucid:KnowledgeGraph:ProjectionCache:Backend`**).
- **Improvement recommendations:** ~~Implement a distributed graph snapshot projection cache…~~ **Improvement #9 closed (2026-05-15)** — **`GraphSnapshotProjectionDistributedCache`** + host **`IDistributedCache`** registration; retain **`V1_DEFERRED.md` §6e** honesty when Redis is **not** configured.

### 11. Interoperability
- **Score:** 88
- **Weight:** 2
- **Weighted deficiency signal:** 24
- **Justification:** V1 contract surfaces—**REST API**, **CLI**, **operator UI**, integration events/webhooks, and **first-party** ITSM and chat connectors—meet the documented integration posture. **Native SAML 2.0 SP** is **promoted to V1 GA** (**P6**, **`V1_SCOPE.md` §2.12**, improvement **#13**); until implemented, SAML-direct buyers still bridge via OIDC federation or brokers — document honestly in pilots. **No MCP host in V1 is in-contract deferral** (`V1_SCOPE.md` §3, `V1_DEFERRED.md` §6d), not a scored weakness for this pass.
- **Tradeoffs:** Buyers who want MCP-native agent tools wait until **V1.1**; until then HTTP/CLI and first-party connectors remain the automation paths of record. SAML SP adds dual auth-surface operational burden (cert rotation, metadata drift) versus OIDC-only tenants.
- **Improvement recommendations:** Tighten OpenAPI-aligned client examples and webhook recipe discoverability (`docs/integrations/recipes/`). **Ship improvement #13** (SAML SP) as **V1 GA** engineering. Track inbound MCP membrane only under the **V1.1** program (`MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md`).

### 12. Stickiness
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Governance workflows and compliance drift tracking provide ongoing value. **Default AI governance + security packs** give tenants a repeatable baseline to extend — modest lift vs buyer-authored-only baseline. **Branded consultant exports** (**Q5**) increase likelihood tenants reuse ArchLucid as their recurring engagement tooling vs one-off novelty. Advanced autonomous planning remains deferred and may still cap engagement depth.
- **Tradeoffs:** Focusing on deterministic execution over open-ended planning ensures reliability but may feel less "agentic". Thin starter packs risk **one-and-done** pilots unless tenants customize and attach packs to recurring reviews.
- **Improvement recommendations:** Execute improvement **#29** (baseline packs tenants extend over time). Implement improvement **#28** (**report export + whitelabel — Q5**). Add cross-tenant analytics capabilities to demonstrate ongoing value (**#12**).

### 13. Performance
- **Score:** 78
- **Weight:** 1
- **Weighted deficiency signal:** 22
- **Justification:** Rate limiting is implemented; optional Redis and **memory** caches remain deployment-dependent — **distributed graph projection cache** is **available when configured** (**improvement #9**, **2026-05-15**).
- **Tradeoffs:** Making Redis optional simplifies single-replica deployments but complicates scaled operations.
- **Improvement recommendations:** ~~Implement automated purge for `dbo.FirstTenantFunnelEvents`.~~ **Improvement #5 closed (2026-05-15)** — archival iteration batched SQL deletes when **`Telemetry:FirstTenantFunnel:PerTenantEmission`** is **false** + retention keys (**`ConfigurationKeyCatalog`**). Enhance `SqlScopedResolutionDbConnectionFactory` with connection retry logic.

### 14. Customer Self-Sufficiency
- **Score:** 81
- **Weight:** 1
- **Weighted deficiency signal:** 19
- **Justification:** Pilot guides and operator quickstarts are available. **Owner decision (Q4):** **bulk evidence upload** (**≤30 files**) improves first-session capture without sales hand-holding for small dossiers. **Improvement #10** publishes **`HOSTED_TRIAL_V1_TO_V1_1_MIGRATION_GUIDE.md`** (**2026-05-15**) as **V1.1**-oriented orientation — **`(A)` V1** scoring still treats outbound migration narrative as **post-GA** program context (**`V1_DEFERRED.md` §6i**).
- **Tradeoffs:** **V1.1** documentation carries the tenant-facing “what changed” narrative for promoted **`V1.1`** deltas (commerce, MCP, etc.). Bulk upload reduces friction only within the **30-file** envelope — enterprises with massive ZIP dumps still chunk manually until **V1.1**.
- **Improvement recommendations:** Implement improvement **#30**. Deliver improvement **#31** (**Q6** fast-path evaluators). ~~Schedule improvement **#10**…~~ **Improvement #10 closed (2026-05-15)** — anchor **`docs/library/HOSTED_TRIAL_V1_TO_V1_1_MIGRATION_GUIDE.md`**; refresh when **V1.1** deltas enumerate.

### 15. Observability
- **Score:** 82
- **Weight:** 1
- **Weighted deficiency signal:** 18
- **Justification:** OpenTelemetry, Serilog, and replay diagnostics provide good visibility.
- **Tradeoffs:** Standard observability tools require operator expertise to configure and monitor effectively.
- **Improvement recommendations:** Add explicit logging for agent state machine transitions.

---

## Top 15 Most Important Weaknesses

1. **Legacy naming seams** inside **immutable** DbUp migration history and some persisted RLS / graph identifiers (**not** unreleased GitHub or Entra rename work — **Phase 7.6–7.7 closed 2026-04-19**, **7.8 waived**, **`docs/ARCHLUCID_RENAME_CHECKLIST.md`**). Enterprise reviewers may ask for an explicit legacy-to-current map in procurement appendix until remaining honest doc pointers land.
2. **Planning bridge (59R)** — **`PRODUCT_LEARNING.md` §4.2** / improvement **#16** is **V1 GA** (**P7**); **until shipped**, **`/planning`** is read-only and **`POST /v1/learning/planning/materialize`** lacks first-class shell UX for non-API operators.
3. ~~Known gaps in durable audit coverage for some mutating flows.~~ **COMPLETE (2026-05-15)** **`ManifestSuperseded`** finalize supersession + durable audit (**improvement #3** / **`AUDIT_COVERAGE_MATRIX.md`**).
4. Absence of cross-tenant analytics, limiting Proof-of-ROI for enterprise buyers.
5. ~~Reliance on memory cache for graph snapshot projections…~~ **Mitigated (2026-05-15)** — optional **Redis-backed** **`IGraphSnapshotProjectionCache`** (**improvement #9**); single-replica **Memory** default unchanged.
6. Playwright E2E still relies heavily on mocked **`/api/proxy`** paths — **live** **`ui-e2e-live`** negative API checks (**improvement #8**, **`live-api-negative-paths.spec.ts`**) shrink blind spots but do **not** replace broad golden-path coverage.
7. ~~Lack of automated purge for first-tenant funnel events.~~ **COMPLETE (2026-05-15)** — **`FirstTenantFunnelArchivalIteration`** SQL purge path when per-tenant emission is **off** (**improvement #5**).
8. **Residual** legacy **RLS** catalog/history identifiers (**improvement #4** dropped orphan predicates only; **`108`** coordination remains where **`ArchiforgeTenantScope`** persists).
9. Manual nature of some cost estimations in the Azure extractor.
10. Absence of in-Slack interactive approvals (**early V1.1** target per **P3**, **2026-05-15** — explicitly **out** of V1 GA sprint).
11. ~~Scope clarity … absence at GA…~~ **Improvement #10** memo **shipped (2026-05-15)** — **`HOSTED_TRIAL_V1_TO_V1_1_MIGRATION_GUIDE.md`**; **`(A)` V1** headline unchanged (**orientation**, not GA checklist rewrite).
12. Until improvement **#27** ships, operator shell copy may still read engineering-first vs landing-page workflow vocabulary (**Capture / Evidence / …**) on residual surfaces — separate backlog from **#16**.
13. **Azure landing-zone / CAF-aligned curated policy pack deferred to V1.1:** Until **V1.1** ships that pack (same platform as improvement **#29**), marketing must **not** imply bundled CAF mapping — GA relies on **extractor + advisor** posture plus **AI governance + security baseline** packs only.
14. **Bulk evidence upload capped at 30 files (V1):** Landing or demo copy must not imply unlimited drag-and-drop dossiers; pilots exceeding the envelope need **multiple uploads** or **V1.1** lift — document prominently next to **Capture / Evidence** messaging (**Marketing alignment Q4**).
15. **Demo workspace fixture drift:** With **two GA-gated workspaces** (**Marketing alignment Q6** / **#31**), UX, export, policy-pack, or graph changes can silently break evaluator smoke — CI/release discipline must pin fixtures or owners risk shipping broken demos.

---

## Top 5 Monetization Blockers

1. Stripe live keys and Marketplace published state are deferred to V1.1 (**P4**: remain off until **finance confirms** Partner Center / tax / payout readiness).
2. Lack of cross-tenant analytics to prove ROI to executive buyers.
3. **GA-gated demo workspaces (#31)** — if automated smoke regresses, sales-led pilots lose a credible first-session story even when core product paths stay healthy.
4. Absence of a signed design partner (though deferred, it impacts early monetization).
5. Lack of a published reference customer case study (deferred to V1.1).

---

## Top 6 Enterprise Adoption Blockers

1. Lack of CPA-issued SOC 2 Type I/II report (though deferred, it causes procurement friction).
2. ~~Known gaps in durable audit coverage for mutating flows.~~ **Closed 2026-05-15** — **`ManifestSuperseded`** path (**improvement #3**); procurement narrative should cite **`AUDIT_COVERAGE_MATRIX.md`** for any residual **read-path** deferrals.
3. Absence of third-party penetration test redacted summary (**`V2`** — factual **`(B)` procurement friction**; **not** a **V1** standing prompt per **P8** owner **2026-05-15**).
4. **Immutable SQL / identity lineage strings** (historic migration bodies, session-context keys, allowlisted CI/doc carve-outs) plus honest disclosure obligations for procurement — **Terraform Phase 7.5 / improvement #1** complete for committed **`infra/**/*.tf`** **2026-05-15**; **Phase 7.6–7.7 / improvement #2** closed **2026-04-19** (**`docs/ARCHLUCID_RENAME_CHECKLIST.md`**); **`terraform state mv`** only when remote state lists **`archiforge`** (**`docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md`**).
5. **Native SAML 2.0 SP** — **V1 GA engineering gate** (**`V1_SCOPE.md` §2.12**, **P6** owner **2026-05-15**, improvement **#13**); **until shipped**, SAML-mandatory enterprises cannot rely on **direct SP** posture — interim OIDC federation / brokers remain valid.
6. Absence of multi-region active/active guarantees out of the box.

---

## Top 6 Engineering Risks

1. **Residual** legacy **RLS** identifiers in catalogs / immutable history — **orphan predicate cleanup shipped** (**DbUp 165**, **#4**); isolation posture still demands honest **`108`** notes where catalogs lag.
2. ~~Reliance on memory cache for graph snapshot projections at scale.~~ **Mitigated (2026-05-15)** — configure distributed projection cache + Redis (**improvement #9**).
3. DTF **SQL production DI** is on the Durable Task port (**#26**, **2026-05-16**); multiset parity / release-smoke receipts and deeper engine-native scheduling remain operator- and engineering-owned obligations — not a free upgrade.
4. ~~Playwright E2E tests relying on mocks…~~ **Partially mitigated (2026-05-15)** — **`live-api-negative-paths.spec.ts`** (**improvement #8**); most shell flows remain mock-backed until **`ui-e2e-live`** expands further.
5. ~~Lack of automated purge for first-tenant funnel events…~~ **COMPLETE (2026-05-15)** — SQL purge when **`PerTenantEmission`** is **false** (**improvement #5**); per-tenant emission **on** retains blob archival semantics.
6. Potential auth mismatches in scripts assuming DevelopmentBypass.

---

## Most Important Truth

ArchLucid is a functionally complete V1 product with a solid architectural foundation, but its immediate adoption and monetization are constrained by **residual audit-matrix deferrals** (read-path items such as **`FindingsListAccessed`** only — mutating durable gaps cleared **2026-05-15** via **`ManifestSuperseded`** / improvement **#3**), **GA demo workspace discipline (#31)**, and the intentional deferral of live commerce and compliance attestations to V1.1 and beyond. **Terraform Phase 7.5 / improvement #1** is **closed** for committed IaC **2026-05-15** — see **`docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md`**. **Phase 7.6–7.7 / improvement #2** closed **2026-04-19** (**7.8 waived** — **`docs/ARCHLUCID_RENAME_CHECKLIST.md`**). **GA commits** to **two curated policy packs** (AI governance + security baseline); **landing-zone pack narrative stays honest** until **V1.1**. **Bulk evidence ingestion is real but bounded:** **≤30 files** per upload at GA — marketing must carry that constraint visibly (**Marketing alignment Q4**). **Architecture Review exports ship consultant whitelabel** (firm/client branding + attribution — **Marketing alignment Q5**) — logo handling must meet the same tenant-upload security bar as other blobs. **GA cannot ship without two green demo workspaces** (**Marketing alignment Q6**) — fixture drift becomes an operational obligation, not optional polish. **First 90 days of landing copy** must mirror **sales-led GA:** walkthrough primary, self-demo secondary, early-access tertiary — **no public paid-pilot price band** until reference deals exist (**Marketing alignment Q7**). **59R planning bridge** (**`PRODUCT_LEARNING.md` §4.2**, **#16**) is **V1 GA** — engineering execution gates operator-complete pilot-feedback → planning flow (**P7**).

---

## Top Improvement Opportunities

1. **COMPLETE (2026-05-15)** Terraform Phase **7.5** — **`infra/**/*.tf`** resource address alignment (**improvement #1**)

   - **Outcome:** Committed Terraform uses **`archlucid`** resource labels exclusively (**grep audit:** `rg "archiforge" infra --glob "*.tf"` → empty — documented in **`docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md`**). Historical **`terraform state mv`** targets for APIM + Grafana stacks remain archived (**`docs/archive/TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md`**) for backends that still list **`archiforge`** addresses.

   - **Why it mattered:** Stale **`archiforge`** addresses block safe infra iteration; **main-branch IaC** no longer encodes that drift (**temporary `moved_*.tf` files removed 2026-04-19** per archived checklist).

   - **Expected impact — retained narrative:** Weighted readiness **81.55%** still assumes **demo workspaces (#31)** close alongside **`terraform plan` / `state list`** hygiene for the **subscriptions × roots** matrix (**P1**).

   - **Affected qualities:** Adoption Friction, Correctness.

   - **Actionable:** **Closed** for repository deliverables (**checklist pointer:** **`docs/ARCHLUCID_RENAME_CHECKLIST.md`**); operators finish **`terraform plan` / `state list`** rows only where remote backends exist (**same runbook** — subscriptions listed under **P1** below).

2. **COMPLETE (2026-04-19)** Phase **7.6–7.7** GitHub repo rename + Entra greenfield alignment (**improvement #2**); **7.8** waived

   - **Outcome:** GitHub **`joefrancisGA/ArchiForge` → `joefrancisGA/ArchLucid`**; Entra strings via **`infra/terraform-entra/`** for greenfield **`terraform apply`**; **Phase 7.8** optional workspace folder rename **waived** by owner. Receipts: **`docs/archive/root-superseded-2026-05-01/ARCHLUCID_RENAME_CHECKLIST.md`** (rows **7.6–7.8**).
   - **Why it mattered:** Public repository URL and registration alignment match the **ArchLucid** product name — reduces evaluator and identity-admin confusion versus legacy codename drift.
   - **Expected impact:** **P2** (**2026-05-15**) IT/security **approval** stays on file for auditors; execution debt for **7.6–7.7** is **not** reopenable from this checklist without a new initiative.
   - **Affected qualities:** Adoption Friction, Security.
   - **Actionable:** **Closed** — pointer **`docs/ARCHLUCID_RENAME_CHECKLIST.md`**; optional evidence link (ticket/email) retained per org policy only.

3. **COMPLETE (2026-05-15)** Durable audit + SQL lifecycle for **`ManifestSuperseded`** / finalize supersession hygiene (**improvement #3**)

   - **Outcome:** `ManifestFinalizationService` emits **`AuditEventTypes.ManifestSuperseded`** for each golden manifest transitioned by **`IGoldenManifestRepository.SupersedeUnreferencedActiveGoldenManifestsAsync`** (**Active** → **Superseded** when **no** non-archived **scoped** run references the row **after** finalize wires the new manifest). **`CachingGoldenManifestRepository`** evicts superseded ids from the hot-path cache.
   - **Why it mattered:** Prior matrix flagged **`ManifestSuperseded`** as catalogue-only — procurement narratives could not point at durable rows for orphan golden manifests replaced at commit.
   - **Expected impact:** Compliance Readiness / Correctness uplift mirrors the former backlog estimate (**~+0.54%** weighted **when rescored**); headline **81.55%** unchanged until the assessment spreadsheet is formally recomputed.
   - **Affected qualities:** Compliance Readiness, Correctness.
   - **Actionable:** **Closed** — verification anchor **`docs/library/AUDIT_COVERAGE_MATRIX.md`** (**Known gaps** mutating section cleared **2026-05-15**); **`FindingsListAccessed`** remains the lone intentional catalogue/read deferral.

4. **COMPLETE (2026-05-15)** Legacy **RLS** orphan **`archiforge_*`** predicate cleanup (**improvement #4**)

   - **Outcome:** DbUp **`165_RlsLegacyOrphanPredicateCleanup.sql`** drops **`rls.archiforge_scope_predicate`** / **`rls.archiforge_tenant_predicate`** **only when** unreferenced by **`sys.security_predicates`** (idempotent). Catalogs still owning **`rls.ArchiforgeTenantScope`** require journal repair / replay of **`108_RlsRenameToArchLucid.sql`** — documented in the migration header (atomic rename cutover remains **`108`**).
   - **Why it mattered:** Procurement-facing honesty on rename lineage plus cleanup for inconsistent restores without rewriting predicate bodies mid-flight.
   - **Expected impact:** Correctness / Security hygiene aligns with the former backlog estimate when rescored; headline readiness unchanged until spreadsheet recomputation.
   - **Affected qualities:** Correctness, Security.
   - **Actionable:** **Closed** — verification: migration **`ArchLucid.Persistence/Migrations/165_RlsLegacyOrphanPredicateCleanup.sql`**.

5. **COMPLETE (2026-05-15)** **`dbo.FirstTenantFunnelEvents`** automated SQL purge + **`ArchLucid:FirstTenantFunnelRetentionDays`** (**improvement #5**)

   - **Outcome:** **`FirstTenantFunnelArchivalIteration`** now runs **batched** aged-row deletes when **`Telemetry:FirstTenantFunnel:PerTenantEmission`** is **false** (cleanup after flag-down / legacy rows). Retention precedence: **`ArchLucid:FirstTenantFunnelRetentionDays`** (**> 0**) → **`ArchLucid:Retention:FunnelEventsDays`** → **`Telemetry:FirstTenantFunnel:ArchivalRetentionDays`** → **90**. Per-tenant emission **on** preserves blob archival path unchanged.
   - **Why it mattered:** Prevents SQL growth from stale funnel telemetry rows without widening privacy surface unexpectedly.
   - **Expected impact:** Performance / operational hygiene mirrors backlog narrative when rescored.
   - **Affected qualities:** Performance, Correctness.
   - **Actionable:** **Closed** — catalog rows **`docs/library/CONFIGURATION_REFERENCE.md`** spine via **`ConfigurationKeyCatalog`** + hosted archival worker receipts in logs.

6. DEFERRED Implement in-Slack interactive approvals

   - Why it matters: Improves Workflow Embeddedness for teams that live in Slack; **scoped MVP** avoids GA runway overload.
   - Expected impact: Faster governance approvals for Slack-centric tenants (**post-GA** window).
   - Affected qualities: Workflow Embeddedness, Usability.
   - Actionable: DEFERRED — **early V1.1** target (**not** V1 GA sprint).
   - Input needed: **P3 answered (2026-05-15):** **Priority** — **defer** from current sprint / **V1 GA**; schedule **early V1.1** (first ~**30 days** post-GA). **Scope — MVP:** **one** interactive flow — **approve finding / decision** — with **durable audit parity** (same event semantics as UI approvals), Slack **signing-secret verification**, **Slack user → ArchLucid identity → RBAC** binding. **Marketing honesty:** GA landing/support copy **must not** claim “approve from Slack.” **Artifacts:** No UX mockups cited in-thread — derive button/block copy from operator approval UX or add wireframes during the V1.1 slice.

7. DEFERRED Flip Stripe live keys and publish Marketplace listing

   - Why it matters: Unblocks self-serve monetization.
   - Expected impact: Enables live revenue generation.
   - Affected qualities: Commercial Packaging Readiness.
   - Actionable: DEFERRED — **gated on finance confirmation** (Partner Center seller verification, tax profile, payout/banking).
   - Input needed: **P4 answered (2026-05-15):** **Defer** live keys and Marketplace publication **until finance confirms** Partner Center readiness (verification, tax, payout) so engineering does **not** precede fiscal/legal sign-off.

8. **COMPLETE (2026-05-15)** Expanded **`ui-e2e-live`** negative paths (**improvement #8**)

   - **Outcome:** **`archlucid-ui/e2e/live-api-negative-paths.spec.ts`** adds **five** live checks: unknown-run execute (**404**), unknown-run commit (**404**), malformed run id (**400/404**), double-commit conflict (**409** `#conflict`), absurd HTTP client timeout on **`/health/ready`** (expects rejection).
   - **Why it mattered:** Catches integration regressions outside mocked `/api/proxy` smoke paths.
   - **Expected impact:** Correctness / usability signals strengthen when rescored.
   - **Affected qualities:** Correctness, Usability.
   - **Actionable:** **Closed** — run **`npx playwright test archlucid-ui/e2e/live-api-negative-paths.spec.ts`** against Sql **`DevelopmentBypass`** API per **`docs/LIVE_E2E_AUTH_ASSUMPTIONS.md`**.

9. **COMPLETE (2026-05-15)** Distributed graph snapshot projection cache (**improvement #9**)

   - **Outcome:** **`GraphSnapshotProjectionDistributedCache`** backs **`IGraphSnapshotProjectionCache`** with **`IDistributedCache`** (JSON UTF-8 payloads); **`KnowledgeGraphProjectionCacheOptions`** gains **`Backend`** (**Memory** vs **Distributed**), optional **`RedisConnectionString`**, and stable keys **`GraphSnapshotProjectionCacheKeys`** (**tenant/workspace/project/run/graphSnapshotId**). Host composition registers **Redis** **`IDistributedCache`** when distributed backend is selected and no cache exists (**shared LLM / hot-path Redis fallbacks**).
   - **Why it mattered:** Multi-replica API hosts avoid stale per-process-only projections without changing **`GraphSnapshot`** generation.
   - **Expected impact:** Performance / AI-agent readiness hygiene when rescored.
   - **Affected qualities:** Performance, AI/Agent Readiness.
   - **Actionable:** **Closed** — configure **`ArchLucid:KnowledgeGraph:ProjectionCache:Backend=Distributed`** plus Redis (**`ConfigurationKeyCatalog`** lists **`ProjectionCache:*`** keys).

10. **COMPLETE (2026-05-15)** Hosted-trial **`V1`→`V1.1`** migration memo (**improvement #10**)

   - **Outcome:** Published rollup **`docs/library/HOSTED_TRIAL_V1_TO_V1_1_MIGRATION_GUIDE.md`** (architecture-section spine + inventory pointers to **`V1_DEFERRED.md`** §**6b/6d/6a**). **`V1_DEFERRED.md` §6i** table row updated to link the shipped memo (**trial runbook cross-link note** preserved).
   - **Why it mattered:** Tenant admins / SEs get one orientation doc ahead of **V1.1** outbound deltas without diluting **`V1`** **`(A)`** scoring posture.
   - **Expected impact:** Customer self-sufficiency / adoption friction (**V1.1** documentation context).
   - **Affected qualities:** Customer Self-Sufficiency, Adoption Friction (**V1.1** narrative).
   - **Actionable:** **Closed** — anchor **`docs/library/HOSTED_TRIAL_V1_TO_V1_1_MIGRATION_GUIDE.md`**.

11. Enhance `ComparisonReplayCostEstimator` with more granular heuristics
- Why it matters: Improves Proof-of-ROI readiness by providing more accurate cost estimates.
- Expected impact: Directly improves Proof-of-ROI Readiness (+4 pts), Explainability (+2 pts). Weighted readiness impact: +0.50%.
- Affected qualities: Proof-of-ROI Readiness, Explainability.
- Actionable: Yes
```markdown
Enhance the `ComparisonReplayCostEstimator` in `ArchLucid.Application` to use more granular heuristics based on the specific agent tasks and artifact sizes involved in the comparison. Update the scoring logic to account for the complexity of the manifest deltas. Do not change the HTTP API contract for the cost estimate endpoint. Acceptance criteria: Cost estimates are more accurate and reflect the actual complexity of the replay.
```

12. Add cross-tenant analytics capabilities (internal only)
- Why it matters: Helps prove ROI across the customer base and informs product direction.
- Expected impact: Directly improves Proof-of-ROI Readiness (+3 pts), Stickiness (+2 pts). Weighted readiness impact: +0.35%.
- Affected qualities: Proof-of-ROI Readiness, Stickiness.
- Actionable: Yes
```markdown
Implement an internal-only analytics service that aggregates anonymized usage data, run completion times, and cost savings across all tenants. Ensure this service bypasses RLS safely using a dedicated internal connection string or explicit cross-tenant queries. Do not expose this data to external customers. Acceptance criteria: Internal operators can query aggregated cross-tenant metrics.
```

13. Implement native SAML 2.0 Service Provider — **V1 GA gate**
- Why it matters: Buyers mandate SAML Web SSO without SAML→OIDC brokers; parity with **`JwtBearer`** OIDC expands addressable regulated enterprises.
- Expected impact: Interoperability (+4 pts estimated post-ship), enterprise procurement friction reduction on IdP questionnaires.
- Affected qualities: Interoperability, Security.
- Actionable: Yes — **V1 GA** (**owner 2026-05-15**, **`V1_SCOPE.md` §2.12**, **P6**).
- Input needed: **P6 answered (2026-05-15):** Owner promotes **native SAML 2.0 SP** into **V1**; **`JwtBearer`** OIDC stays supported — SAML augments workforce SSO surfaces under §2.12 coexistence rules.

```markdown
Implement SAML 2.0 SP authentication alongside existing JwtBearer OIDC: tenant-scoped IdP metadata (entity ID, SSO URLs, IdP signing certificates), ACS endpoint(s), SAML Web SSO profile (HTTP-Redirect / POST), assertion signature validation, replay protection, and bounded clock skew. Map NameID / SAML attributes into `ArchLucidRoles` and authenticated principal identity using the same RBAC and tenant isolation pipeline as JWT bearer; emit typed audit events for SAML sign-in success/failure comparable to OIDC. Extend `SECURITY.md` and `CONFIGURATION_REFERENCE.md` with operator-facing wiring. Do not relax `ArchLucidAuth` production guards without ADR. Acceptance criteria: Automated tests validate assertion handling and role mapping against representative IdP metadata fixtures; SAML and OIDC modes remain independently testable per tenant configuration contract.
```

14. Enhance `v1-rc-drill.ps1` to support JWT/API key authentication
- Why it matters: Reduces auth mismatches and improves testing realism.
- Expected impact: Directly improves Correctness (+2 pts), Security (+2 pts). Weighted readiness impact: +0.46%.
- Affected qualities: Correctness, Security.
- Actionable: Yes
```markdown
Update the `v1-rc-drill.ps1` script to accept optional parameters for a JWT bearer token or API key. If provided, use these credentials instead of relying on `DevelopmentBypass`. Update the script documentation to explain how to use these parameters. Do not break the existing `DevelopmentBypass` behavior when no credentials are provided. Acceptance criteria: The RC drill script can be run against an environment secured with JWT or API keys.
```

15. Add explicit logging for agent state machine transitions
- Why it matters: Improves observability and debugging of complex agent orchestrations.
- Expected impact: Directly improves Observability (+5 pts), AI/Agent Readiness (+1 pts). Weighted readiness impact: +0.27%.
- Affected qualities: Observability, AI/Agent Readiness.
- Actionable: Yes
```markdown
Add explicit `ILogger` calls in `AuthorityRunOrchestrator` and `ArchLucid.Worker` to log every state transition of the agent execution state machine. Include the run ID, current state, next state, and any relevant task IDs in the log context. Ensure these logs are emitted at the `Information` level. Do not change the state machine logic itself. Acceptance criteria: Agent state transitions are clearly visible in the application logs.
```

16. Implement dedicated in-shell **planning bridge** UX — **V1 GA gate**
- Why it matters: Operators need **`PRODUCT_LEARNING.md` §4.2** parity — **`/planning`** is read-only until **`POST /v1/learning/planning/materialize`** is reachable without raw API tooling.
- Expected impact: Usability (+3 pts estimated post-ship), AI/Agent Readiness (+2 pts narrative engagement).
- Affected qualities: Usability, AI/Agent Readiness.
- Actionable: Yes — **V1 GA** (**owner 2026-05-15**, **`PRODUCT_LEARNING.md` §4.2**, **P7**).
- Input needed: **P7 answered (2026-05-15):** PRD appended to **`PRODUCT_LEARNING.md` §4.2** (ASCII wireframes + acceptance); **no** **`materialize/preview`** endpoint for GA — POST **`ProductLearningPlanningMaterializeResult`** suffices (**§4.2 Constraints**).

```markdown
On `/product-learning`, add ExecuteAuthority-gated PlanningBridgePanel: inherit dashboard `since`, bounded `maxPlansToMaterialize` (1–50), POST `/v1/learning/planning/materialize`, render ThemesInserted / PlansInserted / SkippedExistingThemeKeys / SignalLinksInserted, deep-link to `/planning`. Match demo/offline posture with existing Planning page. Add Vitest for query assembly + formatting; Playwright happy-path when ExecuteAuthority persona exists. Do not add LLM calls or governance mutations.
```

17. Add snapshot tests for advisory Terraform recommendation emit
- Why it matters: Ensures Terraform snippets remain valid and do not regress.
- Expected impact: Directly improves Correctness (+3 pts), Security (+1 pts). Weighted readiness impact: +0.56%.
- Affected qualities: Correctness, Security.
- Actionable: Yes
```markdown
Create snapshot tests in `ArchLucid.Api.Tests` or `ArchLucid.Application.Tests` that validate the output of the advisory Terraform recommendation emit. Use a library like `Verify` or `Snapshooter` to ensure the generated Terraform snippets match expected baselines. Ensure the tests verify the presence of the `# ArchLucid advisory` comment. Do not execute `terraform validate` in the unit tests to avoid external dependencies. Acceptance criteria: Snapshot tests cover the major Terraform recommendation scenarios.
```

18. DEFERRED Execute third-party penetration test (**`V2`** — backlog metadata)
- Why it matters: Fulfills **`V2`** commitment and removes a major enterprise procurement blocker when that program runs.
- Expected impact: Faster security reviews and increased enterprise trust (**post–V1**).
- Affected qualities: Security, Compliance Readiness (**`V2`** scoring context).
- Actionable: DEFERRED — **`V2`** window only.
- Input needed: **P8 answered (2026-05-15):** **No** budget/vendor clarity required for **`(A)` V1** passes — **stop** recurring pen-test vendor/budget questions during **V1** planning / execution; reopen **only** when **`V2`** pen-test program is chartered (then track vendor + budget outside this assessment’s **V1** pending queue).

19. DEFERRED Generate and publish PGP key for security@archlucid.net
- Why it matters: Fulfills V1.1 security commitment for coordinated disclosure.
- Expected impact: Improves security posture and trustworthiness.
- Affected qualities: Security.
- Actionable: DEFERRED — **`V1.1`** slice (**not** **`(A)` V1 GA**); prerequisites (**domain + mailbox**) satisfied (**P9**).
- Input needed: **P9 answered (2026-05-15):** **`archlucid.net`** acquired; **`security@archlucid.net`** mailbox **active**. **Remaining:** execute **`docs/security/PGP_KEY_GENERATION_RECIPE.md`** + single PR (**`archlucid-ui/public/.well-known/pgp-key.txt`**, **`SECURITY.md`**, marketing **`/security`**) per **`V1_SCOPE.md` §3** / **`V1_DEFERRED.md` §6c.

20. DEFERRED Implement inbound MCP server (membrane) — **V1.1 only**
- Why it matters: Tenant-scoped MCP tools are a named **V1.1** integration surface (`V1_SCOPE.md` §3, `V1_DEFERRED.md` §6d); **not** in the V1 shipping boundary. This item is **excluded from V1 weighted scoring** above.
- Expected impact: When delivered in V1.1, improves agent-tool interoperability for customers that standardize on MCP; does not change V1 headline readiness.
- Affected qualities: Interoperability (V1.1), AI/Agent Readiness (V1.1).
- Actionable: DEFERRED — **no V1 implementation** per product decision; ship in **V1.1** window only.
- Input needed: **P12 answered (2026-05-15):** **`MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md` §5.1** pins transport, tool allowlist, and tenancy model. **Remaining:** **`V1.1` program calendar** + ADR **`adr/0029-mcp-membrane-and-agent-ecosystem.md`** past *Draft* before engineering merge (**backlog §9 rules**).

21. Add `DataArchivalHostHealthCheck` to the operator dashboard
- Why it matters: Improves observability of background data archival processes.
- Expected impact: Directly improves Observability (+4 pts), Usability (+1 pts). Weighted readiness impact: +0.15%.
- Affected qualities: Observability, Usability.
- Actionable: Yes
```markdown
Update the operator UI dashboard to display the status of the `data_archival` health check. Fetch the health status from the `/health` endpoint and display a warning indicator if the status is `Degraded`. Do not change the underlying health check logic in the backend. Acceptance criteria: Operators can see the data archival health status on the UI dashboard.
```

22. DEFERRED Implement bi-directional status sync for ServiceNow
- Why it matters: Fulfills V1 GA commitment for ITSM integration.
- Expected impact: Seamless workflow integration for enterprise operators.
- Affected qualities: Workflow Embeddedness.
- Actionable: DEFERRED — **until** owner supplies **cost-free** ServiceNow Developer Program / PDI-style instance + schema/credential handshake for **#22** (**P10**).
- Input needed: **P10 answered (2026-05-15):** **No** ServiceNow developer access **today**; **`V1` GA** bidirectional sync **stays in scope** (`V1_SCOPE.md` §2.13). Owner will onboard a **free** developer instance when possible — **paid** sandbox **not** assumed. **Remaining:** provision instance → hand secure creds + confirm **`incident`** / state mapping vs integration defaults; **if** no **free** path is ever available, owner must **explicitly** amend **`V1_SCOPE.md`** / **`PENDING_QUESTIONS.md`** before demoting **V1** claims.

23. Enhance `SqlScopedResolutionDbConnectionFactory` with connection retry logic
- Why it matters: Improves resilience against transient database connection failures.
- Expected impact: Directly improves Correctness (+2 pts), Performance (+1 pts). Weighted readiness impact: +0.35%.
- Affected qualities: Correctness, Performance.
- Actionable: Yes
```markdown
Update `SqlScopedResolutionDbConnectionFactory` in `ArchLucid.Api.DataAccess` to use Polly for transient fault handling when opening SQL connections. Implement a retry policy with exponential backoff for common transient SQL errors (e.g., error numbers 40613, 40197, 40501). Ensure the retry policy is configurable via `appsettings.json`. Do not change the `IDbConnectionFactory` interface. Acceptance criteria: SQL connections automatically retry on transient failures.
```

24. Add explicit documentation for `ArchLucidAuth:Authority` configuration
- Why it matters: Reduces adoption friction for generic OIDC setup.
- Expected impact: Directly improves Adoption Friction (+3 pts), Customer Self-Sufficiency (+2 pts). Weighted readiness impact: +0.42%.
- Affected qualities: Adoption Friction, Customer Self-Sufficiency.
- Actionable: Yes
```markdown
Create a new markdown file `docs/runbooks/GENERIC_OIDC_SETUP.md` that provides step-by-step instructions for configuring `ArchLucidAuth:Authority` with a non-Microsoft OIDC issuer (e.g., Okta, Auth0). Include examples of claim mapping to `ArchLucidRoles` and troubleshooting tips for common JWKS validation errors. Link this new file from `docs/library/SECURITY.md` and `docs/library/CONFIGURATION_REFERENCE.md`. Acceptance criteria: Clear documentation exists for setting up generic OIDC.
```

25. DEFERRED Implement Azure Container Apps Jobs for bursty work
- Why it matters: V2 backlog candidate to improve orchestration scalability.
- Expected impact: Better resource utilization during peak loads.
- Affected qualities: Performance, AI/Agent Readiness.
- Actionable: DEFERRED
- Input needed: **P11** (**2026-05-15**): owner concurs with deferral — remains **`V2`** situational per `V1_DEFERRED.md` §6f; revisit with bursty-scale / cost telemetry after **#26** closure if pressure appears.

26. Migrate `AuthorityRunOrchestrator` to the Durable Task Framework (scoped V1 slice)
- **Status:** **COMPLETE (2026-05-16)** — SQL production DI binds `IAuthorityRunOrchestrator` to `DtfAuthorityRunOrchestrator` (P26-10); `AuthorityRunOrchestrator` remains in Persistence for unit tests; InMemory hosts keep `AuthorityRunOrchestratorApplicationAdapter`.
- Why it matters: Replaces the hand-rolled state machine with checkpoint-based replay, event-sourced orchestration history, and structured compensation flows. For the regulated AI governance buyer wedge, this means the system can structurally prove what the AI pipeline did at every step — not as something logged manually but as a first-class property of the orchestration substrate. Pre-release is architecturally the cheapest time to make this change.
- Expected impact: Directly improves AI/Agent Readiness (+4 pts), Correctness (+2 pts), Explainability (+2 pts). Weighted readiness impact: +0.67%.
- Affected qualities: AI/Agent Readiness, Correctness, Explainability.
- Actionable: ~~Yes~~ **COMPLETE (2026-05-16)**

```
Migrate AuthorityRunOrchestrator in ArchLucid.Worker / ArchLucid.Host.Composition to the
Durable Task Framework (DTF) library (Microsoft.DurableTask.*). Scope:

WHAT TO MIGRATE
- AuthorityRunOrchestrator and its direct stage sequence (ingestion → graph → findings →
  decision → artifacts → commit). This is the only orchestrator in scope for V1.
- Leave advisory scans, background hosted services, and alert delivery on their existing
  patterns.

INTERFACE BOUNDARY — MANDATORY CONSTRAINT
- Introduce an IAuthorityRunOrchestrator interface (if not already present) in
  ArchLucid.Application so callers depend on the abstraction.
- DTF types (TaskOrchestrationContext, TaskActivity, etc.) must NOT appear in
  ArchLucid.Application or ArchLucid.Contracts. Confine them entirely to the host
  composition / worker layer.
- The orchestration history store should use the existing SQL Server connection
  (Microsoft.DurableTask.SqlServer backend) — do not introduce a new database.

PARITY TESTS — MANDATORY BEFORE REMOVING THE OLD PATH
- Write behaviour-equivalence integration tests that run the same authority pipeline
  request through both the old and new orchestrators against an in-memory or test SQL
  store and assert identical manifest output, status transitions, and audit event emission.
- Keep the old orchestrator path behind a feature flag (ArchLucid:AuthorityPipeline:
  OrchestratorBackend = Legacy | DurableTask) until parity tests pass in CI.
- Only remove the legacy path once parity tests are green and at least one full
  release-smoke run has completed end-to-end with DurableTask active.

AUDIT AND OBSERVABILITY
- Emit the same durable AuditEvent types (e.g. AuthorityRunStarted,
  AuthorityRunCompleted, AuthorityRunFailed) from DTF activity completions as the
  current orchestrator does. Do not reduce audit coverage.
- Ensure OpenTelemetry activity spans are created per DTF stage using the existing
  ArchLucidInstrumentation sources.

DO NOT CHANGE
- The HTTP API contract (POST /v1/architecture/request, POST /v1/architecture/run/{id}/
  commit, and related endpoints).
- GoldenManifest schema or AuditEventTypes catalog values.
- The advisory scan or alert delivery pipelines.

ACCEPTANCE CRITERIA
1. All existing AuthorityRunOrchestrator unit and integration tests pass with the new
   implementation (or are replaced by equivalent DTF-aware tests).
2. Parity tests confirm identical manifest output between Legacy and DurableTask backends.
3. release-smoke.ps1 completes end-to-end with DurableTask backend active.
4. No DTF types leak into ArchLucid.Application or ArchLucid.Contracts (verified by an
   architecture unit test or build-time analyser check).
5. Audit event coverage is unchanged or improved (verify against AUDIT_COVERAGE_MATRIX.md).
```

- **#26 verification log (2026-05-15, coding-agent / workstation):** **AC4** PASS — `ArchLucid.Architecture.Tests` / `DtfNamespaceBoundaryArchitectureTests.DtfTypes_DoNotLeakIntoApplicationOrContracts`. **AC2** PARTIAL — `dotnet test ArchLucid.AgentRuntime.Tests --filter "Suite=Parity"` with `ARCHLUCID_PARITY_TESTS_ENABLED=true` PASS (composition: Legacy → `AuthorityRunOrchestratorApplicationAdapter`, DurableTask → `DtfAuthorityRunOrchestrator`; identical manifest multiset / audit multiset parity still behind `ARCHLUCID_PARITY_FULL_PIPELINE`). **AC1** SPOT CHECK — `ArchLucid.Persistence.Tests` / `AuthorityRunOrchestratorTests` (6) PASS on this run; full `Api.Tests` / `Worker.Tests` + CI matrix not re-run here. **AC3 NOT RUN** — `release-smoke.ps1` end-to-end with `ArchLucid__AuthorityPipeline__OrchestratorBackend=DurableTask` requires reachable tenant SQL; LocalDB probe on this machine failed (`sqllocaldb info MSSQLLocalDB` API error). Operator-owned rerun: set `ARCHLUCID_SMOKE_SQL` or `-SqlConnectionString`, export `ArchLucid__AuthorityPipeline__OrchestratorBackend=DurableTask`, run `.\release-smoke.ps1` (omit `-SkipE2E`), then confirm logs per GA task prompt (run persistence / DTF-equivalent stages, `AuthorityRunStarted` + `AuthorityRunCompleted`, non-null `goldenManifestId`). **AC5** — no `AUDIT_COVERAGE_MATRIX.md` delta from this verification pass. **P26-10 (2026-05-16):** `SqlStorageProviderRegistrar` now registers `IAuthorityRunOrchestrator` directly as `DtfAuthorityRunOrchestrator` (inner `AuthorityRunOrchestrator` retained for DI); `AuthorityRunOrchestratorApplicationAdapter` removed from SQL path only — InMemory unchanged.

27. Align operator shell labels with marketing governance vocabulary (presentation-only)
- Why it matters: Regulated buyers and consultants encounter landing-page workflow language first; mismatched UI terms (**Run**, **Commit**, **Manifest**) create friction and weaken the evidence-backed governance positioning.
- Expected impact: Glossary alignment (**Q1**) raises Usability **+4** (baseline **72** → **76**). Owner **Q4** / improvement **#30** adds **+1** → headline **77**. The glossary slice contributes **+0.25%** weighted readiness toward cumulative headline (**81.55%** after later owner deltas). Secondary lift for Adoption Friction after pilots validate copy.
- Affected qualities: Usability, Adoption Friction (narrative alignment).
- Actionable: Yes

```markdown
Align **`archlucid-ui`** user-visible strings with the marketing workflow story — **presentation layer only**.

CANONICAL GLOSSARY (owner-approved 2026-05-15 — implement consistently)
| Buyer-facing UI | Technical / unchanged |
|----------------|----------------------|
| **Review** | Run, run ID, `ArchitectureRun`, API `/v1/architecture/run/...` |
| **Finalize review** / **Finalize** (when context clear) | Commit, `POST .../commit`, golden manifest persistence |
| **Architecture snapshot** / **Snapshot** | Manifest, golden manifest, `GoldenManifest` |
| **Evidence graph** | Knowledge graph internally; URL path **`/graph`** |

TARGET WORKFLOW COPY (map honestly onto wizard + run detail + exports)
- Align with **Capture system → Add evidence → Review → Resolve findings → Record decisions → Generate report**; use **Architecture review** in headings/tooltips where **Review** alone is ambiguous.

SCOPE
- Navigation and section titles: `archlucid-ui/src/lib/nav-config.ts`, `nav-disclosure-copy.ts`, `nav-authority.ts`, related nav helpers.
- Home / Core Pilot checklist copy, layer headers, empty states, tooltips — replace buyer-visible Run/Commit/Manifest/Knowledge graph wording per glossary above.
- Update **`docs/library/operator-shell.md`** (and **`CORE_PILOT.md`** / **`PILOT_GUIDE.md`** cross-links if they duplicate UI strings) so docs match the UI glossary.

CONSTRAINTS — DO NOT CHANGE WITHOUT ADR / VERSIONING
- HTTP paths (`/v1/...`), OpenAPI titles, **`openapi-v1.contract.snapshot.json`**, CLI command names, durable audit **`AuditEventTypes`** names, or correlation-id docs.
- Do not rename React route paths unless required for redirects (prefer label-only changes).

TESTS
- Fix/update **`nav-config.structure.test.ts`**, **`nav-shell-visibility.test.ts`**, **`nav-tier.test.ts`**, and any snapshot tests that assert old headings.
- Ensure **`ui-e2e-live`** and Vitest suites still pass (`npm test` / CI parity).

ACCEPTANCE CRITERIA
1. Glossary table above appears verbatim (or linked single source) in **`docs/library/operator-shell.md`** or **`docs/go-to-market/UI_GLOSSARY_V1.md`** so support/procurement share one truth with the UI.
2. A reader can map landing-page hero workflow to visible operator labels without ad-hoc interpretation.
3. Finalize control includes tooltip copy that replay/compare remain available after finalize (no misleading irreversibility).
4. No regression in accessibility (`aria-labelledby` / buttons remain meaningful).
```

28. Buyer-grade **Architecture Review Report** export (DOCX + PDF) **with consultant whitelabel** — **V1 GA gate**
- Why it matters: Marketing sells the **deliverable** (report handed to ARB / CISO / client). Without a polished default profile **and consultant-ready branding**, demos and boutique-consultant promises under-deliver.
- Expected impact: Proof-of-ROI **82→83**, Commercial Packaging **81→82**, Stickiness **79→80**; weighted readiness **+~0.17%** toward headline (**stacked before Q6 / cumulative **81.55%**). Treat as **merge-blocking for GA** alongside improvement **#27**. **Owner Q5** folds whitelabel here — **no separate export SKU**.
- Affected qualities: Proof-of-ROI Readiness, Commercial Packaging Readiness, Stickiness; Usability (export dialog UX).
- Actionable: Yes

```markdown
Ship a **default** export profile **`architecture-review-board`** (name TBD) producing **DOCX and PDF** from a **finalized** review (golden manifest committed), with sections aligned to marketing:

REQUIRED SECTIONS (headings — professional typography per `docs/library/CONSULTING_DOCX_TEMPLATE.md` and PDF parity)
1. Executive summary  
2. System overview  
3. Evidence reviewed  
4. Architecture decisions  
5. Key risks  
6. Policy findings  
7. AI-assisted analysis — frame as **findings requiring human disposition** / **human-reviewed**, not autonomous design authority  
8. Traceability appendix (correlation IDs, snapshot/version refs, citations to extractor manifest timestamps where applicable)  
9. Recommended next actions  

WHITELABEL — V1 GA (**Marketing alignment Q5**)
- **Cover page:** consulting **firm display name**, **client / engagement title**, optional **logo** (enforce MIME/size caps; virus-scan or strip macros per existing blob pipeline — align with **`docs/library/SECURITY.md`**).
- **Footer / attribution:** mandatory **“Prepared by {firm} using ArchLucid”** (product/legal-approved string); ArchLucid wordmark optional secondary line per brand guidelines.
- **Persistence:** tenant-scoped settings table or reuse existing tenant branding blob pattern — **do not** leak logos across tenants (RLS / scoped container paths).
- **Operator UI:** export dialog collects whitelabel fields for this export run (defaults from tenant consultant profile); PDF mirrors DOCX branding.

SCOPE
- Extend existing export pipeline (`IEndToEndReplayComparisonExportService`, run-export paths, DOCX builders — locate via `ArchLucid.Application` export services and `docs/library/ARCHITECTURE_COMPONENTS.md`).
- Wire operator UI default export action for finalized reviews to this profile name + whitelabel step.
- Commit one **sanitized sample** (`dist/` or `docs/go-to-market/samples/`) for landing-page download — **no customer data**.

CONSTRAINTS
- Do not change HTTP JSON contracts for unrelated endpoints; additive export profile enum/name + optional whitelabel DTO only if needed.
- PDF must visually mirror DOCX section order and cover branding.

TESTS
- Snapshot or golden-file tests for generated DOCX/PDF structure (section headings present).
- One integration test: seeded finalized review → export → assert sections non-empty where data exists.
- Integration test: whitelabel fields render on cover for **both** DOCX and PDF; cross-tenant negative — tenant A logo never appears on tenant B export.

ACCEPTANCE CRITERIA
1. GA checklist blocks release without both formats passing tests **with whitelabel path exercised**.
2. Marketing can link to repo-hosted sample artifact generated by this profile from demo data (**sanitized logo**).
3. Security review signs off logo handling (same bar as other tenant-uploaded blobs).
```

29. Ship **curated default policy packs** — **V1 GA subset** (AI governance + security baseline); **landing-zone pack → V1.1**
- Why it matters: The policy-pack **platform** exists (`IPolicyPacksAppService`, persistence, UI), but **tenant-visible curated content** was effectively empty — regulated buyers expecting **AI governance findings** saw no starter signal. Shipping **two** MVP packs closes the narrative gap without pretending exhaustive compliance coverage.
- Expected impact: Proof-of-ROI Readiness **80→82**, Stickiness **78→79**, Commercial Packaging **80→81**; weighted readiness **+0.30%** toward headline (**stacked before Q4**). Coordinate with **#28** so export **Policy findings** sections populate credibly from seeded rules.
- Affected qualities: Proof-of-ROI Readiness, Commercial Packaging Readiness, Stickiness; secondary Explainability via mapping appendices.
- Actionable: Yes (**GA subset only**). **Azure landing-zone / CAF-aligned pack** explicitly **out of V1** — track as **V1.1** content slice (same mechanics; different authoring cadence).

```markdown
Deliver **two** first-party **default PolicyPack** artifacts shipped with **every new tenant** (or seeded via DbUp migration / bootstrap hook — choose one durable mechanism consistent with `ArchLucid.Persistence` patterns).

PACK A — AI GOVERNANCE / RESPONSIBLE AI (V1 GA — MVP ~15–25 rules)
- Themes: model/asset inventory & ownership; data minimization / sensitive-data routing before inference; human review gates for production-promotion decisions; evaluation / drift review cadence; prompt/tool logging & retention posture; vendor/model risk classification (informational rubric — **not** a certification claim).
- Each rule: stable machine id, severity, remediation guidance, **evidence hints** tying to extractor/manifest fields where possible.
- Documentation: **`docs/library/`** pack appendix listing **mapping** to **NIST AI RMF v1.0** lifecycle themes and **EU AI Act** high-risk category **themes only** — explicit disclaimer: *starter baseline; buyer responsibility for jurisdictional compliance*.

PACK B — SECURITY ARCHITECTURE BASELINE (V1 GA — MVP ~20–30 rules)
- Themes aligned to credible public baselines: identity/MFA/secrets; network segmentation & private endpoints; encryption; logging/monitoring; secure SDLC hooks — cite **CIS Azure Foundations** and **OWASP ASVS** **themes** as mapping references (same honesty bar as Pack A).

OUT OF SCOPE FOR THIS PROMPT (V1.1 PROGRAM)
- **Azure landing-zone / CAF-aligned** curated pack — **do not** seed at GA; open a **`docs/library/`** backlog note or extend `V1_DEFERRED.md` / marketing checklist so copy never implies bundled CAF pack until shipped.

ENGINEERING SCOPE
- Implement via **`ArchLucid.Host.Core`** / persistence paths already used by policy-pack CRUD (`PolicyPacksAppService`, repositories — inspect `ArchLucid.Persistence` migrations for pack tables).
- Ensure packs appear in **`archlucid-ui`** policy-pack administrator flows (visibility, assignment hooks if product expects tenant admin enablement — match existing UX).
- Version packs (`PackVersion` or changelog row per `050_PolicyPackChangeLog.sql` patterns) so upgrades do not silently mutate tenant expectations.

TESTS
- Contract or integration test: new tenant receives both packs with expected rule counts ≥ documented MVP floors.
- Snapshot or golden test for **rule id** stability across releases where feasible.

ACCEPTANCE CRITERIA
1. Pilot tenant sees **non-empty** AI governance + security baseline findings when running a representative demo workspace against seeded evidence (existing demo harness or documented seed steps).
2. Marketing-facing doc (`docs/go-to-market/` or `docs/library/`) lists exactly **two** bundled categories at GA and states landing-zone pack **V1.1**.
3. No regression to RBAC / RLS boundaries on pack read paths.
```

30. **Bulk evidence upload** — **V1 GA** with **≤30 files** per operation (server-enforced); larger batches **V1.1**
- Why it matters: Marketing needs honest **“gather scattered evidence”** narrative without implying infinite dossier ingestion pre-GA; consultants ship dozens of artifacts per engagement — **30** covers MVP demos while bounding abuse, timeouts, and storage spikes.
- Expected impact: Usability **76→77**, Customer Self-Sufficiency **80→81**; weighted readiness **+~0.09%** toward headline (**stacked before Q5 / cumulative **81.55%** after later deltas). Coordinate with **#27** copy (**Evidence / Capture**) so UI and landing page disclose the cap.
- Affected qualities: Usability, Customer Self-Sufficiency; secondary Correctness if API contracts are additive.
- Actionable: Yes

```markdown
Implement **multi-file upload** attaching **mixed file types** to the **current review’s evidence** (match existing evidence model — locate upload/storage handlers in **`ArchLucid.Api`** / **`ArchLucid.Application`** and **`archlucid-ui`** capture flows).

LIMIT — NON-NEGOTIABLE (V1)
- Enforce **`EvidenceBulkUploadMaxFiles = 30`** default via **`appsettings.json`** (`ArchLucid:EvidenceBulkUploadMaxFiles` or equivalent tenant-safe setting — justify if global-only).
- **HTTP API:** reject **`413`** / **`400`** with stable problem+json body when **count > max** (pick one documented pattern consistent with existing validation errors).
- **UI:** multi-select / drag-drop **must** show remaining quota (“**n / 30**”) and friendly error when exceeded.

DEFERRED / V1.1
- Raising/removing cap, ZIP-archive expansion, folder recursion — **explicitly out of V1** unless reopened; track on backlog referenced from **`docs/library/V1_DEFERRED.md`** or marketing checklist.

TESTS
- Unit test: validator rejects **31** files.
- API integration test: **30** succeeds; **31** fails with contract-stable response.
- Playwright / Vitest: operator capture flow surfaces cap copy.

DOCUMENTATION — MANDATORY
- **`docs/go-to-market/`** or **`docs/library/`** one-liner: “Bulk upload **up to 30 files** per action at GA.”

ACCEPTANCE CRITERIA
1. Pilot can attach **≤30** artifacts in one action without shell scripting workarounds.
2. Marketing-approved disclosure text ships beside bulk control and on landing/support FAQ hook.
3. Durable **`AuditEvent`** (or equivalent) emitted on bulk attach matches single-file parity expectations — verify vs **`AUDIT_COVERAGE_MATRIX.md`**.
```

31. **Two curated demo workspaces** — **hard V1 GA gate** (**Marketing alignment Q6**)
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

32. **Landing page CTA stack** — first **90 days** post-GA (**Marketing alignment Q7**)
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
- **P5 — Hosted-trial `V1`→`V1.1` migration guide — answered:** **Owner 2026-05-15:** Artifact is **out of V1 GA checklist-blocking scope** and **in V1.1 documentation scope** (`docs/library/V1_DEFERRED.md` §6i). **`(A)` V1 readiness is unchanged** by treating this as orientation-only at GA. **Improvement #10 closed (2026-05-15)** — **`docs/library/HOSTED_TRIAL_V1_TO_V1_1_MIGRATION_GUIDE.md`** ships baseline rollup prose; refresh when **`V1.1`** deltas enumerate (commerce **P4**, MCP, Slack **P3**, packs, etc.).
- **P6 — Native SAML 2.0 SP vs OIDC federation — answered:** **Owner 2026-05-15:** **Native SAML 2.0 Service Provider** workforce SSO is **promoted into V1 GA scope** (`docs/library/V1_SCOPE.md` §2.12). **`JwtBearer`** OIDC remains **first-class**. Implementation tracked via improvement **#13**; procurement/auth docs updated in **`SECURITY.md`**, **`PROCUREMENT_FAQ.md`**, **`V1_DEFERRED.md` §6g.
- **P7 — Planning bridge UX — answered:** **Owner 2026-05-15:** **V1 GA.** Product/requirements spec **`docs/library/PRODUCT_LEARNING.md` §4.2** (ASCII wireframes + acceptance); implementation **#16**. **Backend:** **no** preview-only **`materialize`** sibling endpoint for GA — POST response carries sufficient counts; defer dry-run **only** if usability testing proves insufficient (**§4.2** documents rationale).
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
