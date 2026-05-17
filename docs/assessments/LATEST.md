> **Scope:** Internal weighted readiness assessment for repo stewards — V1 scoring boundary and backlog prompts; not a customer-facing datasheet nor an exhaustive audit substitute.

**Canonical pair:** This file is the **single current score and backlog** for weighted readiness. Read **`docs/library/ASSESSMENT_INPUTS.md`** first for the evidence contract; treat **`docs/archive/assessments/`** and archived quality narratives as **history only** — see **“One workflow (current score vs history)”** there.

# ArchLucid Assessment – Weighted Readiness 88.88%

**V1 scoring boundary:**

- **Native SAML 2.0 Service Provider (workforce SSO):** **Shipped for V1 GA** (**`docs/library/V1_SCOPE.md` §2.12**). **`JwtBearer`** OIDC remains **first-class**; SAML **SP** augments buyer choice.
- **ServiceNow bi-directional status sync:** **`V1` GA** per **`docs/library/V1_SCOPE.md` §2.13** — unchanged. As of **2026-05-15**: **no** ServiceNow developer instance **yet**; bidirectional sync implementation proceeds when a **cost-free** **ServiceNow Developer Program** / personal developer-style instance is available (**paid** sandbox **not** a **`V1` GA** prerequisite). Until provisioned, engineering is **queued only** — explicit scope demotion requires **`V1_SCOPE.md`** / **`PENDING_QUESTIONS.md`** amendment **if** a **free** path never materializes.
- **Durable Task Framework (DTF):** SQL storage hosts bind the authority pipeline to the Durable Task port (`DtfAuthorityRunOrchestrator`); `ArchLucid.Application` still has no compile-time dependency on `Microsoft.DurableTask.*`. InMemory / simulator paths remain on the legacy adapter until separately migrated.

- **V2-only (deferral docs):** Items committed only to **V2** in **`V1_DEFERRED.md`** are **omitted** from **Pending technical questions** in this file and **do not** reduce **`(A)`** weighted V1 scores (track in deferral/scope docs only).

- **V1.1-only (scope + pinned backlogs):** Capabilities deferred to **V1.1** in **`V1_SCOPE.md`** / **`V1_DEFERRED.md`**, with implementation detail only in nested backlog docs, are **omitted** from **Pending technical questions** in this file and **do not** reduce **`(A)`** weighted V1 scores.
- **Operator UI vocabulary vs marketing workflow (V1):** Buyer-facing labels in **`archlucid-ui`** align with the evidence-backed governance narrative (e.g. **Capture system**, **Evidence**, **Review**, **Findings**, **Decisions**, **Report**) mapped from existing flows (**run**, **manifest**, **commit**, **authority** remain internal/API). **REST routes, OpenAPI operation IDs, CLI commands, and audit event names are unchanged** unless separately versioned. **Usability** headline (**77**) reflects **Marketing alignment** row **1** (glossary) plus bounded bulk capture (row **4**).

- **Buyer-grade architecture review export:** A **default DOCX/PDF export profile** matching the landing-page report narrative (executive summary, system overview, evidence reviewed, architecture decisions, key risks, policy findings, AI-assisted analysis with human-review framing, traceability appendix, recommended next actions) is a **V1 GA gate** (**Marketing alignment** row 2). **Consultant whitelabel** on cover/metadata is **also GA** per row **5** — same export pipeline. Landing demos and downloadable sample reports assume both ship with GA.

- **Consultant / engagement report whitelabel (V1 GA):** Exported **Architecture Review Reports** (**DOCX + PDF**) support **tenant-scoped branding**: **consulting firm name**, **client engagement title**, optional **logo image** (PNG/SVG policy per security review), and **cover footer disclaimer** (“Prepared by … using ArchLucid”) so boutique / marketplace consultants can deliver client-facing artifacts without manual replatforming. **Proof-of-ROI Readiness**, **Commercial Packaging Readiness**, and **Stickiness** are scored upward (**Marketing alignment** row 5). Use one export pipeline for DOCX and PDF (avoid duplicate profiles).

- **Default policy packs (curated content — V1 GA subset):** ArchLucid ships **two** tenant-available **default policy packs** at **V1 GA**: (**1**) **AI governance / responsible AI** — MVP rule set with explicit framework **mapping** (e.g. NIST AI RMF v1.0 themes, EU AI Act high-risk categories) — *mapping only, no certification claim*; (**2**) **Security architecture baseline** — MVP rules aligned to buyer-credible themes (e.g. CIS Azure Foundations / OWASP ASVS-style controls). **Azure landing-zone / CAF-aligned** curated pack is **deferred to V1.1** (extractor + advisor already carry Azure posture narrative at GA). Marketing may claim bundled AI-governance + security-baseline starter packs at GA; **must not** imply a shipped **CAF landing-zone pack** until **V1.1**. **Proof-of-ROI Readiness**, **Commercial Packaging Readiness**, and **Stickiness** are scored upward to reflect this commitment (**Marketing alignment** row 3).

- **Bulk evidence upload (V1 cap):** **Multi-file bulk attach** to a review’s evidence set ships in **V1 GA** with a **hard ceiling of 30 files per request** (server-enforced). Marketing **must** disclose the cap (“up to **30 files** per upload”) and avoid infinite batch promises until **V1.1** raises or removes the limit. **Usability** and **Customer Self-Sufficiency** are scored upward slightly (**Marketing alignment** row 4).

- **Curated demo workspaces (hard V1 GA gate):** Exactly **two** **demo workspaces** must ship **before GA**, documented and reachable from onboarding / marketing flows: (**A**) **Self-demo / product tour** — lands evaluators on the canonical workflow (**Capture → Evidence → Review → … → Report**) using synthetic-safe content; (**B**) **Synthetic regulated scenario** — AI governance + cloud posture narrative with seeded evidence and **policy findings** sourced from improvements **#29** packs (no real customer data). **Release checklist blocks GA** until both pass automated smoke (**Playwright** and/or **`release-smoke`** per repo norms). **Adoption Friction**, **Proof-of-ROI Readiness**, and **Commercial Packaging Readiness** are scored upward (**Marketing alignment** row **6**). Tracked via improvement **#31**.

- **Landing page CTA stack (first 90 days — V1 honesty):** **Hybrid** posture (**Marketing alignment** row **7**): **primary CTA** = **Request walkthrough** (sales-led GA, matches deferred live marketplace/self-serve). **Secondary CTA** = **Try the self-demo** — deep-link into **Workspace A** from improvement **#31** (product touch before calendar). **Tertiary** = **Early access** / waitlist capture only — **must not** imply instant product access, live checkout, or parity with walkthrough-led pilots. **Public paid-pilot $ band** is **out of scope for the first 90 days** (pricing stays walkthrough→qualify→quote until reference customers exist). Implementation and copy review tracked via improvement **#32**.

## Executive Summary

**Overall Readiness:** ArchLucid is a functionally complete V1 product with a solid architectural foundation, capable of executing the core pilot loop (internally run → execute → commit → manifest and artifacts). The platform includes key enterprise and commercial capabilities, such as **native SAML 2.0 SP workforce SSO** (**`V1_SCOPE.md` §2.12**), a buyer-grade **Architecture Review Report** export (DOCX + PDF) with **consultant whitelabeling** (**Marketing alignment Q2/Q5**), **operator shell labels aligned with marketing workflow language**, two curated default policy packs (AI governance + security baseline), bounded bulk evidence upload (**≤30 files** per operation), two curated demo workspaces (**Marketing alignment Q6**), and a landing CTA stack aligned to sales-led GA.

**Commercial Picture:** The product is ready for sales-led pilots and staging-based trial evaluations. The platform includes differentiated governance starters: buyer-visible **AI governance** and **security baseline** policy packs, strengthening demo credibility versus empty-pack onboarding. **Evidence capture** supports **bulk upload** with an explicit **≤30-file** ceiling — pitch accordingly. **Consultants can white-label client deliverables** (firm name, engagement title, logo) directly from export — strengthens marketplace / boutique wedge without manual DOCX surgery. **First-90-days landing posture** is implemented: **Request walkthrough** primary, **Try the self-demo** secondary (Workspace **A**), **Early access** tertiary capture — **no public paid-pilot $ band** yet. **Sales-led and self-serve evaluators both hit fixed demo workspaces** (**self-demo + regulated synthetic**) which are actively monitored by automated smoke tests to prevent fixture drift (**Marketing alignment Q6**).

**Enterprise Picture:** The system supports robust tenant isolation (database-per-tenant), workforce SSO via **OIDC / Entra ID** and **native SAML 2.0 SP**, and private connectivity. First-party ITSM connectors (Jira, ServiceNow) and Slack/Confluence integrations are strong enterprise features.

**Engineering Picture:** The engineering foundation is strong, utilizing SQL persistence, DbUp migrations, and a well-architected agent orchestration pipeline. SQL storage hosts bind the authority pipeline to the Durable Task port (`DtfAuthorityRunOrchestrator`); deeper DTF-native scheduling and full multiset parity remain incremental work. The system includes **`FirstTenantFunnelEvents`** SQL purge when per-tenant emission is **off**, merge-blocking **`ui-e2e-live`** golden-path + negative-path specs (**#14** / **#8**, **2026-05-16** / **2026-05-15**), and optional **Redis-backed** graph projection **`IDistributedCache`**. Residual risks include single-process projection defaults without Redis.

---

## Weighted Quality Assessment

### 1. Adoption Friction
- **Score:** 80
- **Weight:** 6
- **Weighted deficiency signal:** 120
- **Justification:** Tier 1 Azure extraction remains frictionless. Landing **hybrid CTA** routes serious buyers to **walkthrough** while offering **self-demo** before calendar load (**#32**). Operator shell labels are aligned with marketing vocabulary.
- **Tradeoffs:** Demo workspaces create **fixture-maintenance tax** — feature churn can break GA smoke.
- **Improvement recommendations:** Provide explicit documentation for generic OIDC setup (`improvement #24`).

### 2. AI/Agent Readiness
- **Score:** 82
- **Weight:** 8
- **Weighted deficiency signal:** 144
- **Justification:** The system effectively uses Azure OpenAI with prompt redaction, execution traces, and a well-tested authority pipeline. **Improvement #26 (2026-05-16)** delivers the SQL Durable Task port for authority orchestration; further checkpoint-native scheduling strengthens the governance story for regulated buyers.
- **Tradeoffs:** DTF introduces a durable orchestration history schema in SQL and a new operational runbook surface. The trade-off is justified: the parity-test obligation and operational cost are bounded; the governance-provenance benefit compounds over time and aligns with the primary buyer wedge.
- **Improvement recommendations:** Add explicit logging for state transitions during and after DTF scheduling hardening.

### 3. Correctness
- **Score:** 84
- **Weight:** 8
- **Weighted deficiency signal:** 128
- **Justification:** The execution model is solid, incorporating the **`ManifestSuperseded`** durable path per **`docs/library/AUDIT_COVERAGE_MATRIX.md`**.
- **Tradeoffs:** Read-path **`FindingsListAccessed`** stays intentionally unaudited until a stable bulk-list contract exists; RLS migrations remain coordination-heavy.
- **Improvement recommendations:** Track honest **`108`** replay notes where catalogs lag (**migration header**).

### 4. Proof-of-ROI Readiness
- **Score:** 85
- **Weight:** 5
- **Weighted deficiency signal:** 75
- **Justification:** The Azure extractor provides cost data, and the comparison replay cost estimator is useful. **Improvement #11 (2026-05-16):** replay cost heuristics inspect persisted comparison JSON (`manifestDiff` structural surface, `agentResultDiff.agentDeltas`, `exportDiffs`, `runDiff`, and export-record diff payloads) so estimates track replay complexity more closely — operator cost-estimate API contract unchanged. **V1 GA** ships curated **AI governance** and **security baseline** default packs so pilots immediately surface policy findings aligned to the wedge — demos prove ROI faster than buyer-authored-only onboarding. Report export **whitelabel** lets consultants prove tangible client-ready ROI artifacts without offline rebranding. **Regulated synthetic demo workspace** gives repeatable proof narrative without bespoke pilot setup. Cross-tenant analytics remain absent for portfolio-wide executive proof.
- **Tradeoffs:** Tenant isolation (database-per-tenant) makes cross-tenant analytics harder to implement securely. **Curated packs** shift burden to **credible authoring** — MVP rule counts must stay humble (*starting baseline*, not exhaustive compliance) or regulated buyers dismiss the wedge.
- **Improvement recommendations:** Implement internal-only cross-tenant analytics (**#12**).

### 5. Usability
- **Score:** 79
- **Weight:** 3
- **Weighted deficiency signal:** 63
- **Justification:** The operator UI is functional. Surface copy shifted from engineering-centric terms (**run**, **commit**, **manifest**) to marketing-aligned governance vocabulary (**Capture**, **Evidence**, **Review**, **Findings**, **Decisions**, **Report**) without renaming HTTP contracts — reducing cognitive load for regulated EA/security buyers and consultants. **Bulk evidence upload** lands in **V1 GA** capped at **≤30 files** per upload so “gather scattered artifacts” demos stay honest without taking unlimited ingestion scope pre-GA. **`/planning`** stays read-only browse; pilot-feedback materialization lives on **`/product-learning`**. **`ui-e2e-live`** exercises **live API + ephemeral SQL CI** (**improvement #14** **closed 2026-05-16**) via **`live-api-journey`** / **`live-api-core-pilot-path`** plus negatives (**#8**, **2026-05-15**); default **`ui-e2e-smoke`** remains **`/api/proxy`**-mock-backed for broad surface churn.
- **Tradeoffs:** Dual vocabulary (friendly labels vs stable API names) must be documented for integrators and support; translators/tests must reference stable selectors where headers change copy. The **30-file** ceiling avoids abuse and MVP complexity but forces explicit marketing disclosure and may annoy heavy dossier pilots until **V1.1**.
- **Improvement recommendations:** Add `DataArchivalHostHealthCheck` to the dashboard (**#21**).

### 6. Workflow Embeddedness
- **Score:** 85
- **Weight:** 3
- **Weighted deficiency signal:** 45
- **Justification:** The inclusion of first-party ITSM connectors (Jira, ServiceNow) and Slack/Confluence integrations in V1 GA is a strong positive.
- **Tradeoffs:** Building first-party connectors takes resources away from core platform features but significantly improves workflow integration.
- **Improvement recommendations:** Implement bi-directional ServiceNow status sync (**#22**) once **cost-free** Developer Program / PDI-style credentials (**P10**) are provisioned — **`V1` GA** commitment unchanged (`V1_SCOPE.md` §2.13).

### 7. Compliance Readiness
- **Score:** 75
- **Weight:** 2
- **Weighted deficiency signal:** 50
- **Justification:** A durable audit trail exists, and the SOC 2 self-assessment is complete. **Finalize supersession** now emits **`ManifestSuperseded`** (**2026-05-15**); residual gaps are limited to explicit matrix deferrals (e.g. **`FindingsListAccessed`** read path).
- **Tradeoffs:** Self-assessment is faster and cheaper than CPA attestation but carries less weight with enterprise buyers.
- **Improvement recommendations:** Keep matrix reviews green when adding HTTP mutations; track **`FindingsListAccessed`** only when a list endpoint ships.

### 8. Commercial Packaging Readiness
- **Score:** 84
- **Weight:** 2
- **Weighted deficiency signal:** 32
- **Justification:** The trial funnel is tested in Stripe TEST mode, but live keys and Marketplace publication are intentionally deferred to V1.1. **Curated default packs at GA** sharpen the packaged story (**AI-era governance review** with actionable starter rules), reducing “empty shell” risk for sales-led pilots. **Consultant whitelabel** on architecture-review exports improves resale positioning for boutique / marketplace consultants without a separate SKU. **Mandatory demo workspaces** package the wedge into predictable buyer-ready flows. **Hybrid landing CTAs** keep copy honest with deferred self-serve while still capturing **Early access** leads.
- **Tradeoffs:** Deferring live commerce allows for a controlled, sales-led V1 rollout but delays self-serve revenue. Starter packs raise **copy honesty** obligations — claims must match shipped rule depth. **Consultant logos** increase **tenant-upload attack surface** — mitigate with MIME/size caps and existing malware-scan posture (sign-off required — **Q5**). **Early access** tertiary must avoid **bait-and-switch** vs walkthrough-led pilots (**Q7**).
- **Improvement recommendations:** Flip Stripe live keys and publish the Marketplace listing **after finance confirms** Partner Center readiness (**P4**, **#7**).

### 9. Security
- **Score:** 100
- **Weight:** 3
- **Weighted deficiency signal:** 0
- **Justification:** Strong fundamentals with OIDC, Entra ID, RBAC, private endpoints, and Key Vault. External third-party pen testing is explicitly deferred to V2. Achieves 100% of V1 scope.
- **Tradeoffs:** Internal pen testing is sufficient for V1 but will not satisfy strict enterprise procurement requirements (which is a V2 concern).
- **Improvement recommendations:** None (V1 complete).

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
- **Justification:** V1 contract surfaces—**REST API**, **CLI**, **operator UI**, integration events/webhooks, and **first-party** ITSM and chat connectors—meet the documented integration posture. **Native SAML 2.0 SP** is **shipped** for **V1 GA** (**`V1_SCOPE.md` §2.12**).
- **Tradeoffs:** SAML SP adds dual auth-surface operational burden (cert rotation, metadata drift) versus OIDC-only tenants.
- **Improvement recommendations:** Tighten OpenAPI-aligned client examples and webhook recipe discoverability (`docs/integrations/recipes/`).

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
- **Improvement recommendations:** ~~Connection open retries~~ **Delivered (2026-05-16):** `SqlScopedResolutionDbConnectionFactory.CreateOpenConnectionAsync` resolves scoped `ISqlConnectionFactory`, which production registers as `ResilientSqlConnectionFactory` wrapping Polly (`SqlOpenResilienceDefaults`, transient detection including Azure SQL codes 40613 / 40197 / 40501). Configure attempts and backoff via `Persistence:SqlOpenResilience` in `appsettings`.

### 14. Customer Self-Sufficiency
- **Score:** 100
- **Weight:** 1
- **Weighted deficiency signal:** 0
- **Justification:** Pilot guides and operator quickstarts are available. Bulk evidence upload (≤30 files) improves first-session capture without sales hand-holding. Expanding the limit is deferred to V1.1. Achieves 100% of V1 scope.
- **Tradeoffs:** Bulk upload reduces friction only within the 30-file envelope — enterprises with massive ZIP dumps still chunk manually until V1.1.
- **Improvement recommendations:** None (V1 complete).

### 15. Observability
- **Score:** 82
- **Weight:** 1
- **Weighted deficiency signal:** 18
- **Justification:** OpenTelemetry, Serilog, and replay diagnostics provide good visibility.
- **Tradeoffs:** Standard observability tools require operator expertise to configure and monitor effectively.
- **Improvement recommendations:** Add explicit logging for agent state machine transitions.

### 16. Marketability
- **Score:** 100
- **Weight:** 8
- **Weighted deficiency signal:** 0
- **Justification:** Strong category narrative (architecture review package). Differentiated from generic AI. Hybrid CTA stack aligns with sales-led GA. Self-serve and reference customers are explicitly deferred to V1.1/V2. Achieves 100% of V1 scope.
- **Tradeoffs:** Relies on sales explanation for deep value until self-serve and reference customers are established (which are V1.1/V2 scope).
- **Improvement recommendations:** None (V1 complete).

### 17. Time-to-Value
- **Score:** 85
- **Weight:** 7
- **Weighted deficiency signal:** 105
- **Justification:** Core pilot path is well-defined. Curated demo workspaces and default policy packs accelerate initial value without manual rule authoring.
- **Tradeoffs:** Real-mode value requires tenant baseline data, which can take time to gather.
- **Improvement recommendations:** Add a guided baseline collection wizard to the onboarding flow to accelerate real-mode value.

### 18. Executive Value Visibility
- **Score:** 84
- **Weight:** 4
- **Weighted deficiency signal:** 64
- **Justification:** Architecture Review Report export (DOCX/PDF) with consultant whitelabeling provides immediate, tangible executive artifacts.
- **Tradeoffs:** Executive value can become abstract if real tenant baselines are missing.
- **Improvement recommendations:** Add a 'Missing Baseline' warning to the executive dashboard to ensure value is not abstract.

### 19. Differentiability
- **Score:** 83
- **Weight:** 4
- **Weighted deficiency signal:** 68
- **Justification:** Evidence-linked findings and governed decision trails differentiate the product from generic LLM wrappers.
- **Tradeoffs:** Broad proof surface helps defensibility but requires concise buyer framing to avoid sounding like a feature inventory.
- **Improvement recommendations:** Refine in-app tooltips to focus strictly on the core differentiation (evidence-linked findings) to avoid feature inventory overload.

### 20. Decision Velocity
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Justification:** Speeds up architecture reviews by providing structured evidence and policy findings.
- **Tradeoffs:** Requires operator trust in the AI's findings to truly accelerate decisions.
- **Improvement recommendations:** Highlight confidence scores or evidence links more prominently in the UI to build operator trust faster.

### 21. Template and Accelerator Richness
- **Score:** 78
- **Weight:** 1
- **Weighted deficiency signal:** 22
- **Justification:** Two curated default policy packs (AI governance + security baseline) provide a good starting point.
- **Tradeoffs:** The library is currently small, shifting some burden to credible authoring by the tenant.
- **Improvement recommendations:** Pack depth uplift delivered **2026-05-17** (five additional **`sec-base-026`**–**`sec-base-030`** rules + Workspace **B** seed IDs aligned to shipped keys); continue extending tenant-authored corpus over time.

### 22. Traceability
- **Score:** 100
- **Weight:** 3
- **Weighted deficiency signal:** 0
- **Justification:** Strong evidence graph and durable audit trail (`ManifestSuperseded`). Achieves 100% of V1 scope.
- **Tradeoffs:** None.
- **Improvement recommendations:** None (V1 complete).

### 23. Trustworthiness
- **Score:** 100
- **Weight:** 3
- **Weighted deficiency signal:** 0
- **Justification:** SOC 2 self-assessment completed. Private endpoints and tenant isolation are standard. CPA attestation and third-party pen tests are explicitly deferred to V2. Achieves 100% of V1 scope.
- **Tradeoffs:** Lack of CPA attestation will cause friction in enterprise procurement, though they are not V1 technical gates.
- **Improvement recommendations:** None (V1 complete).

### 24. Auditability
- **Score:** 100
- **Weight:** 2
- **Weighted deficiency signal:** 0
- **Justification:** Durable task framework and SQL persistence provide a strong audit foundation. Achieves 100% of V1 scope.
- **Tradeoffs:** None.
- **Improvement recommendations:** None (V1 complete).

### 25. Policy and Governance Alignment
- **Score:** 100
- **Weight:** 2
- **Weighted deficiency signal:** 0
- **Justification:** Policy packs align well with enterprise governance needs. Achieves 100% of V1 scope.
- **Tradeoffs:** None.
- **Improvement recommendations:** None (V1 complete).

### 26. Procurement Readiness
- **Score:** 100
- **Weight:** 2
- **Weighted deficiency signal:** 0
- **Justification:** Trust center, DPA, and CAIQ pre-fill are available. CPA SOC 2 is explicitly deferred to V2. Achieves 100% of V1 scope.
- **Tradeoffs:** Procurement friction is expected due to the lack of a CPA-issued SOC 2 report.
- **Improvement recommendations:** None (V1 complete).

### 27. Accessibility
- **Score:** 75
- **Weight:** 1
- **Weighted deficiency signal:** 25
- **Justification:** Basic web accessibility is present.
- **Tradeoffs:** No participant user testing with assistive technologies (not a V1 requirement).
- **Improvement recommendations:** None for automated baseline scans — merge-blocking **`@axe-core/playwright`** runs in **`ui-e2e-live`** and **`ui-playwright-accessibility`** (see **`archlucid-ui/e2e/live-api-accessibility.spec.ts`**). Participant assistive-technology studies remain out of V1 scope (see tradeoffs).

### 28. Change Impact Clarity
- **Score:** 100
- **Weight:** 1
- **Weighted deficiency signal:** 0
- **Justification:** Comparison replays help clarify the impact of architectural changes. Achieves 100% of V1 scope.
- **Tradeoffs:** None.
- **Improvement recommendations:** None (V1 complete).

### 29. Architectural Integrity
- **Score:** 100
- **Weight:** 3
- **Weighted deficiency signal:** 0
- **Justification:** Solid SQL persistence, DbUp migrations, and clean separation of concerns. Achieves 100% of V1 scope.
- **Tradeoffs:** None.
- **Improvement recommendations:** None (V1 complete).

### 30. Reliability
- **Score:** 82
- **Weight:** 2
- **Weighted deficiency signal:** 36
- **Justification:** DTF orchestration improves reliability.
- **Tradeoffs:** Multi-region worker fleets still need disciplined slot sizing versus SQL lease churn; orphaned leases rely on **`LeaseRecognitionHorizon`** scavenging.
- **Improvement recommendations:** Operational runbooks should document defaults for **`AuthorityPipeline:Concurrency`** per environment tier and monitor lease table growth alongside worker saturation.

### 31. Data Consistency
- **Score:** 100
- **Weight:** 2
- **Weighted deficiency signal:** 0
- **Justification:** Database-per-tenant isolation and transactional SQL boundaries ensure high consistency. Achieves 100% of V1 scope.
- **Tradeoffs:** None.
- **Improvement recommendations:** None (V1 complete).

### 32. Maintainability
- **Score:** 84
- **Weight:** 2
- **Weighted deficiency signal:** 32
- **Justification:** Clean code architecture.
- **Tradeoffs:** The large surface area increases maintenance overhead.
- **Improvement recommendations:** Introduce stricter module boundaries using .NET internal visibility and ArchUnitNET to manage the large surface area.

### 33. Azure Compatibility and SaaS Deployment Readiness
- **Score:** 100
- **Weight:** 2
- **Weighted deficiency signal:** 0
- **Justification:** Native Azure integrations (OpenAI, Key Vault, SQL, App Service/ACA) are robust. Achieves 100% of V1 scope.
- **Tradeoffs:** None.
- **Improvement recommendations:** None (V1 complete).

### 34. Availability
- **Score:** 100
- **Weight:** 1
- **Weighted deficiency signal:** 0
- **Justification:** Standard Azure high availability is supported. Multi-region active/active is explicitly deferred to V2. Achieves 100% of V1 scope.
- **Tradeoffs:** None.
- **Improvement recommendations:** None (V1 complete).

### 35. Scalability
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Scales well horizontally.
- **Tradeoffs:** Single-tenant worker pool exhaustion is a known risk requiring rate limiting.
- **Improvement recommendations:** Implement auto-scaling rules for the worker pool based on queue depth.

### 36. Supportability
- **Score:** 82
- **Weight:** 1
- **Weighted deficiency signal:** 18
- **Justification:** Good logging and OpenTelemetry.
- **Tradeoffs:** Some operational scripts assume DevelopmentBypass aside from curated paths (for example JWT-only CLI probes).
- **Improvement recommendations:** Broaden JWT/API realism for remaining operator scripts (`ARCHLUCID_*` bearer parity); `v1-rc-drill.ps1` covered (**#3**, **closed 2026-05-16**).

### 37. Manageability
- **Score:** 100
- **Weight:** 1
- **Weighted deficiency signal:** 0
- **Justification:** Operator shell and configuration references provide good manageability. Achieves 100% of V1 scope.
- **Tradeoffs:** None.
- **Improvement recommendations:** None (V1 complete).

### 38. Deployability
- **Score:** 100
- **Weight:** 1
- **Weighted deficiency signal:** 0
- **Justification:** Automated CI/CD and DbUp migrations streamline deployment. Achieves 100% of V1 scope.
- **Tradeoffs:** None.
- **Improvement recommendations:** None (V1 complete).

### 39. Testability
- **Score:** 84
- **Weight:** 1
- **Weighted deficiency signal:** 16
- **Justification:** Strong unit/integration tests plus merge-blocking **`ui-e2e-live`** golden-path coverage (**#14**, **2026-05-16**) and **`live-api-negative-paths`** (**#8**).
- **Tradeoffs:** Default **`ui-e2e-smoke`** remains mock-heavy — fast churn coverage without standing up SQL on every PR.
- **Improvement recommendations:** Prefer targeted **`live-api-*.spec.ts`** additions when a high-risk surface stays mock-only; golden-path **`live-api-journey`** / **`live-api-core-pilot-path`** already merge-block via **`ui-e2e-live`** (**#14**, **2026-05-16**).

### 40. Modularity
- **Score:** 100
- **Weight:** 1
- **Weighted deficiency signal:** 0
- **Justification:** Highly modular architecture with clear project boundaries. Achieves 100% of V1 scope.
- **Tradeoffs:** None.
- **Improvement recommendations:** None (V1 complete).

### 41. Extensibility
- **Score:** 100
- **Weight:** 1
- **Weighted deficiency signal:** 0
- **Justification:** Architecture supports new policy packs and ITSM connectors. Public extension SDK is deferred to V1.1. Achieves 100% of V1 scope.
- **Tradeoffs:** None.
- **Improvement recommendations:** None (V1 complete).

### 42. Evolvability
- **Score:** 100
- **Weight:** 1
- **Weighted deficiency signal:** 0
- **Justification:** System is designed to evolve, with DTF paving the way for more complex workflows. Achieves 100% of V1 scope.
- **Tradeoffs:** None.
- **Improvement recommendations:** None (V1 complete).

### 43. Documentation
- **Score:** 100
- **Weight:** 1
- **Weighted deficiency signal:** 0
- **Justification:** Comprehensive docs (API contracts, configuration, trust center). Achieves 100% of V1 scope.
- **Tradeoffs:** None.
- **Improvement recommendations:** None (V1 complete).

### 44. Azure Ecosystem Fit
- **Score:** 100
- **Weight:** 1
- **Weighted deficiency signal:** 0
- **Justification:** Deep integration with Azure services (Entra ID, Azure OpenAI, Azure SQL). Achieves 100% of V1 scope.
- **Tradeoffs:** None.
- **Improvement recommendations:** None (V1 complete).

### 45. Cognitive Load
- **Score:** 76
- **Weight:** 1
- **Weighted deficiency signal:** 24
- **Justification:** Marketing-aligned vocabulary helps, but the product surface is large for a first-pilot motion.
- **Tradeoffs:** Breadth is valuable for expansion but increases first-session confusion.
- **Improvement recommendations:** Implement progressive disclosure in the UI to hide advanced governance features until needed.

### 46. Cost-Effectiveness
- **Score:** 82
- **Weight:** 1
- **Weighted deficiency signal:** 18
- **Justification:** Azure cost extractor provides visibility. Comparison replay cost estimation uses granular payload heuristics (**#11**, **2026-05-16**).
- **Tradeoffs:** Some manual estimation remains in Azure extractor–adjacent workflows.
- **Improvement recommendations:** None for comparison replay cost heuristics (**#11** **closed 2026-05-16**); residual gap is broader Azure cost manual estimation surfaces.

---

## Top 9 Most Important Weaknesses

1. Absence of cross-tenant analytics, limiting Proof-of-ROI for enterprise buyers.
2. **Mock-backed default smoke breadth:** **`ui-e2e-smoke`** still relies heavily on mocked **`/api/proxy`** for wide route coverage — merge-blocking **`ui-e2e-live`** now validates the operator golden spine on **real API + ephemeral SQL CI** (**#14**, **`live-api-journey`** / **`live-api-core-pilot-path`**) alongside negatives (**#8**, **`live-api-negative-paths.spec.ts`**).
3. Manual nature of some cost estimations in the Azure extractor (distinct from comparison replay payload heuristics — **#11** **closed 2026-05-16**).
4. **Demo workspace fixture drift:** With **two GA-gated workspaces** (**Marketing alignment** / **#31**), UX, export, policy-pack, or graph changes can silently break evaluator smoke — CI/release discipline must pin fixtures or teams risk shipping broken demos.
5. **Agent orchestration noisy-neighbor mitigation (narrow residual):** Per-tenant **`AuthorityPipeline:Concurrency`** slots and SQL lease-backed counting (**#11 backlog**, **2026-05-16**) cap concurrent heavy-stage work; bursts still justify queue/offload telemetry and alerting when leases approach limits.
6. **LLM observability gaps:** Missing explicit OpenTelemetry tracing for LLM API calls (token usage, latency) hinders debugging, cost attribution, and AI/Agent readiness at scale.
7. **Durable Task Framework (narrow residual):** Legacy vs DTF **adapter** multiset parity is CI-gated (`ArchLucid.Host.Composition.Tests` / `AuthorityOrchestratorAdapterParityTests`); **`release-smoke`** supports **`-AuthorityPipelineDtfSmoke`** for tenant SQL + gRPC validation. Remaining work is **worker/engine scheduling depth** and optional DI cleanup once main stays green — not a commitment-gap for GA reads.
8. **Operational script auth realism (narrow residual):** `v1-rc-drill.ps1` accepts **`-BearerToken`** / **`-ApiKey`** (**#3**, **2026-05-16**); other scripts may remain DevelopmentBypass-assumptive; JwtBearer drills still rely on **`ARCHLUCID_API_KEY`** for CLI detailed **`/health/diagnostics`** probes (JWT covers script REST).
9. **Lack of explicit logging for agent state machine transitions:** Makes it difficult to observe and debug complex agent orchestrations in production.

---

## Top 5 Monetization Blockers

1. Lack of cross-tenant analytics to prove ROI to executive buyers.
2. **Manual Azure cost estimations:** The Azure extractor's manual cost estimation limits the platform's ability to automatically prove hard infrastructure savings to buyers.
3. **Lack of cross-tenant analytics (internal):** Without internal tools to aggregate usage and cost savings across tenants, it is difficult to prove ROI and inform product direction.
4. **Lack of self-serve transactability:** With Stripe live keys and Marketplace publication deferred to V1.1, the platform cannot capture self-serve revenue.
5. **Lack of a published reference customer:** The absence of a signed design partner or published reference customer may slow early momentum.

---

## Top 5 Enterprise Adoption Blockers

1. **Lack of automated tenant data deletion:** Absence of a verifiable GDPR/CCPA "right to be forgotten" mechanism causes friction in enterprise procurement and legal reviews.
2. **Noisy neighbor posture in orchestration (narrow residual):** Tenant-scoped concurrency gates now protect the worker-heavy authority path (**#11 backlog**, **2026-05-16**); buyers still diligence steady-state parallelism, queue depth during incidents, and multi-region fairness.
3. **Lack of custom rule authoring UI:** Evaluators cannot easily author and test custom governance rules without writing raw code, slowing down enterprise adoption.
4. **Absence of compliance attestations:** The lack of a CPA-issued SOC 2 report will cause friction during procurement and security reviews.
5. **Residency diligence depth:** Tenant provisioning pins a **`DataRegion`** key and routes large artifact blobs to regional URIs when configured; buyers still validate during diligence that SQL topology, backups, DR, and networking match their geography and contractual posture (**`PROCUREMENT_FAQ.md`** Q3).

---

## Top 5 Engineering Risks

1. **Durable Task Framework (narrow residual):** Wrapper-level parity vs the Legacy adapter is enforced in host composition tests; **`release-smoke -AuthorityPipelineDtfSmoke`** exercises tenant SQL with **`ArchLucid__AuthorityPipeline__DurableTask__GrpcEndpoint`** set. Remaining: deeper engine-native scheduling/observability and optional removal of redundant registration paths after sustained green main — not the prior “no multiset tests” gap.
2. **E2E test mock reliance (residual):** **`ui-e2e-smoke`** still uses mocked **`/api/proxy`** for most routes; golden-path integration is covered by merge-blocking **`ui-e2e-live`** (**#14**, **2026-05-16**) — extend live specs when a surface is mock-only and high-risk.
3. **Agent orchestration parallelism observability:** Concurrency leases cap tenant fan-out (**#11 backlog**, **2026-05-16**); operators still need dashboards on wait times / dead letters when workers queue behind saturated slots.
4. **LLM observability gaps:** Missing explicit OpenTelemetry tracing for LLM API calls (token usage, latency) hinders debugging, cost attribution, and AI/Agent readiness at scale.
5. **Operational script auth realism (narrow residual):** Beyond **`v1-rc-drill.ps1`** JWT/API key support (**#3**, **2026-05-16**), some scripts remain DevelopmentBypass-assumptive; CLI JWT parity for probes that require ReadAuthority remains a tooling gap versus API-key env (`ARCHLUCID_API_KEY`).

---

## Most Important Truth

ArchLucid is a functionally complete V1 product with a solid architectural foundation. The platform includes **two curated policy packs** (AI governance + security baseline), **bounded bulk evidence ingestion** (**≤30 files** per upload), **Architecture Review exports with consultant whitelabel**, **two curated demo workspaces** to support evaluators, and a **hybrid landing CTA stack** aligned to sales-led GA. **First 90 days of landing copy** must mirror **sales-led GA:** walkthrough primary, self-demo secondary, early-access tertiary — **no public paid-pilot price band** until reference deals exist (**Marketing alignment Q7**).

---

## Top Improvement Opportunities

1. COMPLETED: Add cross-tenant analytics capabilities (internal only)
- Why it matters: Helps prove ROI across the customer base and informs product direction.
- Expected impact: Directly improves Proof-of-ROI Readiness (+3 pts), Stickiness (+2 pts). Weighted readiness impact: +0.35%.
- Affected qualities: Proof-of-ROI Readiness, Stickiness.
- Actionable: Completed

2. COMPLETED: Enhance `ComparisonReplayCostEstimator` with more granular heuristics
- Why it matters: Comparison replay cost estimates now track manifest/agent/export diff payload complexity via `ComparisonReplayPayloadComplexity`; operator API shape unchanged.
- Expected impact: (Delivered **2026-05-16**.) Proof-of-ROI Readiness, Cost-Effectiveness.
- Affected qualities: Proof-of-ROI Readiness, Cost-Effectiveness, Explainability.
- Actionable: Completed

3. COMPLETED: Enhance `v1-rc-drill.ps1` to support JWT/API key authentication
- Why it matters: Reduces auth mismatches and improves testing realism.
- Expected impact: (Delivered **2026-05-16**.) Directly improves Correctness (+2 pts), Security (+2 pts). Weighted readiness impact: +0.46%.
- Affected qualities: Correctness, Security.
- Actionable: Completed
```markdown
Update the `v1-rc-drill.ps1` script to accept optional parameters for a JWT bearer token or API key. If provided, use these credentials instead of relying on `DevelopmentBypass`. Update the script documentation to explain how to use these parameters. Do not break the existing `DevelopmentBypass` behavior when no credentials are provided. Acceptance criteria: The RC drill script can be run against an environment secured with JWT or API keys.
```

4. COMPLETED: Add explicit logging for agent state machine transitions
- Why it matters: `AuthorityRunOrchestrator`, queued completion, finalize, and the worker-hosted deferred outbox (`AuthorityPipelineWorkProcessor`) now emit Information-level `Agent execution state transition` logs with run id, current/next states, and task or outbox identifiers where applicable.
- Expected impact: (Delivered **2026-05-16**.) Directly improves Observability (+5 pts), AI/Agent Readiness (+1 pts). Weighted readiness impact: +0.27%.
- Affected qualities: Observability, AI/Agent Readiness.
- Actionable: Completed
```markdown
Add explicit `ILogger` calls in `AuthorityRunOrchestrator` and `ArchLucid.Worker` to log every state transition of the agent execution state machine. Include the run ID, current state, next state, and any relevant task IDs in the log context. Ensure these logs are emitted at the `Information` level. Do not change the state machine logic itself. Acceptance criteria: Agent state transitions are clearly visible in the application logs.
```

5. COMPLETED: Add snapshot tests for advisory Terraform recommendation emit
- Why it matters: Ensures Terraform snippets remain stable and the advisory banner cannot regress silently.
- Expected impact: (Delivered **2026-05-16**.) Directly improves Correctness (+3 pts), Security (+1 pts). Weighted readiness impact: +0.56%.
- Affected qualities: Correctness, Security.
- Actionable: Completed
```markdown
Create snapshot tests in `ArchLucid.Api.Tests` or `ArchLucid.Application.Tests` that validate the output of the advisory Terraform recommendation emit. Use a library like `Verify` or `Snapshooter` to ensure the generated Terraform snippets match expected baselines. Ensure the tests verify the presence of the `# ArchLucid advisory` comment. Do not execute `terraform validate` in the unit tests to avoid external dependencies. Acceptance criteria: Snapshot tests cover the major Terraform recommendation scenarios.
```

6. COMPLETED: Show `data_archival` on the operator dashboard health strip
- Why it matters: Improves observability of background data archival processes.
- Expected impact: (Delivered **2026-05-16**.) Directly improves Observability (+4 pts), Usability (+1 pts). Weighted readiness impact: +0.15%.
- Affected qualities: Observability, Usability.
- Actionable: Completed
```markdown
Update the operator UI dashboard to display the status of the `data_archival` health check. Fetch the readiness summary from `GET /health/ready` (the check is tagged Ready; anonymous `GET /health` lists only the database probe in this codebase) and display a warning indicator if the status is `Degraded`. Do not change the underlying health check logic in the backend. Acceptance criteria: Operators can see the data archival health status on the UI dashboard.
```

7. COMPLETED: Connection retry logic for scoped SQL opens (`SqlScopedResolutionDbConnectionFactory`)
- Why it matters: Improves resilience against transient database connection failures.
- Expected impact: (Delivered **2026-05-16**.) Directly improves Correctness (+2 pts), Performance (+1 pts). Weighted readiness impact: +0.35%.
- Affected qualities: Correctness, Performance.
- Actionable: Completed
```markdown
Update `SqlScopedResolutionDbConnectionFactory` in `ArchLucid.Host.Core` (historic assessment text cited `ArchLucid.Api.DataAccess`) so SQL connection opens use Polly for transient faults: exponential backoff for common transient SQL errors (40613, 40197, 40501 via `SqlTransientDetector`), configurable under `Persistence:SqlOpenResilience`, without changing `IDbConnectionFactory`. **Delivered:** `CreateOpenConnectionAsync` delegates to scoped `ResilientSqlConnectionFactory` + `SqlOpenResilienceDefaults`; `ArchLucid.Host.Composition` binds options from configuration; regression test asserts the bridge retries after transient `SqlException` 40613.
```

8. COMPLETED: Explicit documentation for `ArchLucidAuth:Authority` (generic OIDC)
- Why it matters: Reduces adoption friction for generic OIDC setup.
- Expected impact: (Delivered **2026-05-16**.) Directly improves Adoption Friction (+3 pts), Customer Self-Sufficiency (+2 pts). Weighted readiness impact: +0.42%.
- Affected qualities: Adoption Friction, Customer Self-Sufficiency.
- Actionable: Completed
```markdown
Create a new markdown file `docs/runbooks/GENERIC_OIDC_SETUP.md` that provides step-by-step instructions for configuring `ArchLucidAuth:Authority` with a non-Microsoft OIDC issuer (e.g., Okta, Auth0). Include examples of claim mapping to `ArchLucidRoles` and troubleshooting tips for common JWKS validation errors. Link this new file from `docs/library/SECURITY.md` and `docs/library/CONFIGURATION_REFERENCE.md`. Acceptance criteria: Clear documentation exists for setting up generic OIDC.

**Delivered:** Runbook rewritten with accurate **`roles`** → **`ArchLucidRoles`** value mapping (JWT bearer **`RoleClaimType`**), **`MultiTenantEntra=false`** guardrail, JWKS / IDX troubleshooting table, Okta/Auth0 deep links, and **`CONFIGURATION_REFERENCE.md`** quick-start row links **[GENERIC_OIDC_SETUP.md](../runbooks/GENERIC_OIDC_SETUP.md)**; **`SECURITY.md`** already linked the runbook.
```

9. COMPLETED: Automated tenant data deletion (GDPR/CCPA right to be forgotten)
- Why it matters: Enterprise compliance requires a verifiable way to delete all tenant data upon contract termination or user request.
- Expected impact: (Delivered **2026-05-16**.) Directly improves Compliance Readiness (+3 pts). Weighted readiness impact: per scoring model.
- Affected qualities: Compliance Readiness, Security.
- Actionable: Completed

```markdown
Implement a durable background job to handle tenant offboarding and data deletion.
- Create a `TenantDeletionService` that orchestrates the removal of all tenant-scoped data across SQL, Blob Storage, and Knowledge Graph.
- Ensure the deletion process emits a durable `TenantDataDeleted` audit event (stored in a system-level audit log, outside the tenant's scope).
- Add an administrative API endpoint `POST /v1/admin/tenants/{id}/delete` (secured by a highly privileged internal role).
- Acceptance criteria: A tenant can be fully deleted, and the deletion is durably audited.

**Delivered:** `TenantDeletionService` + `TenantBlobPrefixDeletionService` (prefixes under `golden-manifests`, `artifact-bundles`, `agent-traces`; skips shared `artifact-contents` dedup), extended `SqlTenantHardPurgeService` (`DeleteTenantScopedAuditEvents`, funnel rows), new `dbo.PlatformAuditEvents` + `IPlatformAuditRepository`, `TenantDeletionWorkUnit` on the durable `IBackgroundJobQueue`, `POST /v1/admin/tenants/{id}/delete` (`PlatformTenantDeletionAuthority` / `ArchLucidRoles.PlatformOperator` → `platform:tenant-delete`). Knowledge-graph projections are SQL-backed (`GraphSnapshots` etc.) and are removed with the hard purge.
```

10. **COMPLETED:** Add explicit OpenTelemetry tracing for LLM API calls
- Why it matters: AI/Agent Readiness requires deep observability into token usage, latency, and prompt/response pairs for debugging and cost attribution.
- Expected impact: (Delivered **2026-05-16**.) Observability (+3 pts), AI/Agent Readiness (+2 pts).
- Affected qualities: Observability, AI/Agent Readiness.
- Actionable: Completed

```markdown
Enhance the existing OpenTelemetry instrumentation to capture detailed metrics for all LLM API calls.
- Add spans for every call to the underlying LLM provider (e.g., Azure OpenAI).
- Include span attributes for: model name, prompt token count, completion token count, total token count, and latency.
- Ensure sensitive prompt/response content is NOT logged by default (or is scrubbed), but allow opting in via a secure configuration flag for debugging.
- Acceptance criteria: Token usage and latency for LLM calls are visible in the APM backend.

**Delivered:** Chat completions already emitted `gen_ai.usage.*` on `ArchLucid.Agent.LlmCompletion` spans; extended with `gen_ai.request.model`, `gen_ai.response.model`, `gen_ai.operation.name`, `gen_ai.completion.latency_ms`, and `LlmTelemetry:CapturePromptResponseOnSpans` (default false, hard-capped payload length via `ArchLucidInstrumentation.SensitiveGenAiTelemetrySnapshotMaxChars`). Added `ArchLucid.Agent.LlmEmbedding` spans for Azure OpenAI embeddings (`gen_ai.embeddings`, usage when the SDK returns it, latency, input count) with the same opt-in prompt snapshot flag. Registered the new source in `AddArchLucidOpenTelemetry` and default tail-sampling keep list (`terraform-otel-collector`).
```

11. **COMPLETED:** Implement rate limiting and concurrency controls for the `AuthorityRunOrchestrator`
- Why it matters: Prevents a single tenant from exhausting worker resources by submitting too many concurrent architecture review runs.
- Expected impact: (Delivered **2026-05-16**.) Performance (+3 pts), Reliability (+2 pts).
- Affected qualities: Performance, Reliability.
- Actionable: Completed

```markdown
Introduce concurrency limits for the `AuthorityRunOrchestrator` to protect the worker pool.
- Implement a tenant-level concurrency limit (e.g., max 5 concurrent runs per tenant).
- If a tenant exceeds the limit, queue the runs or return a `429 Too Many Requests` response from the API.
- Ensure the limits are configurable via `appsettings.json` or a dynamic configuration provider.
- Acceptance criteria: A single tenant cannot monopolize the worker pool.

**Delivered:** `ArchLucid:AuthorityPipeline:Concurrency` on `AuthorityPipelineOptions` binds `MaxConcurrentExecutionsPerTenant`, `RejectInlineCreateWhenConcurrencyUnavailable`, `LeaseRecognitionHorizon`, and `WaitPollMilliseconds`. Inline creates acquire a tenant slot before heavy stages; queued worker completions wait (poll SQL) rather than failing. SQL hosts use durable lease rows (`dbo.AuthorityPipelineTenantExecutionLease`, migration **169**) with serializable counting; optional fail-fast emits `AuthorityTenantConcurrencyLimitExceededException` → HTTP **429** / `ProblemTypes.AuthorityTenantConcurrentRunsExceeded`. In-memory hosts use `InMemoryTenantAuthorityPipelineConcurrencyGate` (per-process semaphores).
```

12. **COMPLETED:** Add tenant-specific data residency configuration options
- Why it matters: European and highly regulated buyers often require explicit guarantees that their data (SQL and blobs) resides in a specific geographic region.
- Expected impact: (Delivered **2026-05-16**.) Compliance Readiness (+3 pts), Commercial Packaging (+2 pts).
- Affected qualities: Compliance Readiness, Commercial Packaging.
- Actionable: Completed

```markdown
Extend the tenant provisioning pipeline to support explicit data residency region selection.
- Update the `Tenant` database model to include a `DataRegion` column.
- Ensure the storage provisioning logic (e.g., Azure Blob Storage containers) respects the selected region.
- Document the supported regions in `docs/go-to-market/PROCUREMENT_FAQ.md`.
- Acceptance criteria: Operators can provision tenants in specific geographic regions.

**Delivered:** **`dbo.Tenants.DataRegion`** (**`169_Tenants_DataRegion.sql`**, unified schema scripts), **`TenantRecord`** / **`TenantProvisioningRequest`** / **`TenantProvisionAdminRequest`**, **`TenantProvisioningDataRegionPolicy`** + **`TenantProvisioningOptions.SupportedDataRegions`**. **`RegionalArtifactBlobClientFactory`** / **`TenantRegionalArtifactBlobClients`** route **`ArtifactLargePayload`** **`AzureBlob`** clients via **`ArtifactLargePayload:AzureBlobServiceUriByRegion`** when **`DataRegion`** ≠ **`default`**. Supported regions documented under **`docs/go-to-market/PROCUREMENT_FAQ.md`** Q3.
```

13. **COMPLETED:** Enhance the Knowledge Graph with temporal query support
- Why it matters: Advanced users need to query the state of the architecture at specific points in time to understand how decisions evolved.
- Expected impact: (Delivered **2026-05-17**.) Explainability (+4 pts), Usability (+2 pts).
- Affected qualities: Explainability, Usability.
- Actionable: Completed

```markdown
Add temporal query capabilities to the `ArchLucid.KnowledgeGraph` API.
- Implement an endpoint `GET /v1/graph/snapshot?asOf={timestamp}` that reconstructs the graph state at a given time.
- Update the operator UI to include a time-scrubber control for visualizing historical graph states.
- Acceptance criteria: Users can view the knowledge graph exactly as it existed at a past date.

**Delivered:** `GET /v1/graph/snapshot` with required `runId` (anchors scope/project lineage) and `asOf` (UTC); resolves the latest non-archived run in the project with a persisted `GraphSnapshot` at or before `asOf`, returns `ArchitectureGraphTemporalSnapshotResponse` (`resolvedRunId`, `asOfUtc`, `resolvedRunCreatedUtc`, `graph`). SQL + in-memory **`IRunRepository.GetLatestWithGraphAtOrBeforeAsync`**. **413** problems may include **`resolvedRunId`** for paginated recovery. Operator review detail: **time-scrubber** between earliest graph-backed run in the loaded project list and this review’s `createdUtc` (disabled for static demo runs). OpenAPI snapshot + **`archlucid-ui` generated types** + **`ArchLucid.Api.Client`** refreshed.
```

14. **COMPLETED:** Expand `ui-e2e-live` to cover the full golden path
- Why it matters: Mock-only E2E cannot prove the operator spine against real SQL + HTTP — live specs close that gap without deleting fast mock smoke.
- Expected impact: (Delivered **2026-05-16**.) Correctness (+3 pts), Reliability (+2 pts).
- Affected qualities: Correctness, Reliability.
- Actionable: Completed

```markdown
Expand the `ui-e2e-live` test suite to cover the complete golden path of the operator workflow against a live, non-mocked backend.
- Include end-to-end coverage for: Capture system → Add evidence → Review → Resolve findings → Record decisions → Generate report.
- Ensure the tests run against a dedicated staging or ephemeral environment with a real SQL database and isolated tenant.
- Do not remove the existing mocked tests; treat the live E2E suite as a separate, higher-fidelity validation layer.
- Acceptance criteria: The full operator golden path is validated against a live backend in CI.

**Delivered:** Merge-blocking **`ui-e2e-live`** (`.github/workflows/ci.yml`, non-**`pull_request`**) runs **`archlucid-ui/e2e/live-api-*.spec.ts`** via **`playwright.live.config.ts`** against **ArchLucid.Api** with **SQL Server service** (ephemeral CI lab). **`live-api-journey.spec.ts`** drives **create → execute → commit → golden manifest** with browser checks on **`/runs/{id}`** and **`/manifests/{id}`**, **ZIP export** via API, **governance** approval + **`/governance`** UI, and **`/audit`** search (required audit event types enforced). **`live-api-core-pilot-path.spec.ts`** covers the buyer-polished **showcase** spine (home → new review → reviews list → review deliverables) on the same live stack. Mock-backed **`ui-e2e-smoke`** / **`playwright.mock.config.ts`** unchanged as the fast, broad layer.
```

15. **COMPLETED:** Enhance `ArchLucid.Decisioning` with custom rule authoring UI
- Why it matters: Evaluators and enterprise buyers need a way to easily author and test custom governance rules without writing raw code.
- Expected impact: (Delivered **2026-05-17**.) Customer Self-Sufficiency (+4 pts), Usability (+3 pts).
- Affected qualities: Customer Self-Sufficiency, Usability.
- Actionable: Completed

```markdown
Implement a web-based rule authoring interface in `archlucid-ui` that integrates with `ArchLucid.Decisioning`.
- Provide a guided wizard or low-code builder for creating custom policy rules.
- Allow operators to test the rule against existing architecture snapshots in the UI before publishing.
- Ensure custom rules are durably stored and versioned alongside the default policy packs.
- Acceptance criteria: Operators can create, test, and publish custom rules entirely through the UI.

**Delivered:** **`PolicyRuleAuthoringWizard`** on **`/policy-packs`** (Advanced options): step **Design** (guided compliance/alert/composite/metadata fields with merge + raw JSON editor; **`buildPolicyPackContentFromGuidedFields`** in **`src/lib/policy-pack-guided-content.ts`**), step **Test on run** (`POST /v1/policy-packs/simulate` via **`simulatePolicyPackAgainstRun`** in **`src/lib/api/policy-governance-api.ts`** — pre-commit gate outcome; recent runs from **`listRunsByProjectPaged`**), step **Publish** (wired to existing **`createPolicyPack`** / **`publishPolicyPackVersion`** with **`syncPolicyContentJson`** keeping create + publish JSON aligned). Shared default skeleton moved to **`src/lib/policy-pack-default-content.ts`**. Vitest: **`policy-pack-guided-content.test.ts`**.
```

16. **COMPLETED:** Add guided baseline collection wizard (onboarding)
- Why it matters: Proof-of-ROI and executive value depend on tenant baselines; empty baselines weaken sponsor narratives.
- Expected impact: (Delivered **2026-05-17**.) Time-to-Value (+3 pts), Proof-of-ROI Readiness (+2 pts), Executive Value Visibility (+2 pts). Weighted readiness impact: +0.35%.
- Affected qualities: Time-to-Value, Proof-of-ROI Readiness, Executive Value Visibility.
- Actionable: Completed

```markdown
Add a first-run (or settings) wizard in `archlucid-ui` that captures pilot baseline fields required by `docs/library/PILOT_ROI_MODEL.md` (e.g. manual prep hours, review cycle length).
- Persist values tenant-scoped via existing settings or ROI API contracts; do not invent a parallel store without aligning OpenAPI.
- Block or warn on sponsor-export actions when required baseline fields are empty.
- Acceptance criteria: A new tenant can complete baseline capture without sales engineering hand-holding.

**Delivered:** **`PilotBaselineWizard`** + **`PilotBaselineWizardLauncher`** (operator shell FAB / session auto-open; **`NEXT_PUBLIC_SUPPRESS_CORE_PILOT_WIZARD`** suppresses alongside core pilot wizard). **`BaselineSettingsClient`** on **`/settings/baseline`** persists **`manualPrepHoursPerReview`** + **`baselineReviewCycleHours`** via **`PUT /v1/tenant/baseline`**; OpenAPI snapshot extended with **`baselineReviewCycleHours`**, **`baselineReviewCycleSource`**, **`baselineReviewCycleCapturedUtc`**, **`baselineReviewCycleSourceNote`** (`openapi-v1.contract.snapshot.json`). **`EmailRunToSponsorBanner`** warns and disables primary sponsor PDF when **`GET /v1/tenant/baseline`** gate fails (**`usePilotRoiBaselineCompleteness`**); **`GenerateSponsorValueReportButton`** blocks DOCX export the same way. Backend **`TenantBaselineController`** merges GET + selective PUT for review-cycle provenance (markers + audit). Vitest: **`pilot-roi-baseline-completeness.test.ts`**, **`EmailRunToSponsorBanner.test.tsx`**, **`baseline/page.test.tsx`**.
```

17. **COMPLETED:** Surface Missing Baseline warnings on executive / sponsor surfaces
- Why it matters: Prevents sending abstract executive artifacts when quantified ROI inputs are absent.
- Expected impact: (Delivered **2026-05-17**.) Executive Value Visibility (+4 pts), Proof-of-ROI Readiness (+1 pt). Weighted readiness impact: +0.22%.
- Affected qualities: Executive Value Visibility, Proof-of-ROI Readiness.
- Actionable: Completed

```markdown
On sponsor brief, first-value report, and architecture-review export preview routes, show a prominent **Missing baseline** banner when required ROI baseline fields are unset.
- Link the banner to **Add guided baseline collection wizard (onboarding)** (completed item **16** above — **2026-05-17**).
- Do not block read-only preview; block **sendable** or **download** classification when marketing requires quantified claims.
- Acceptance criteria: Operators cannot mistake an incomplete baseline package for board-ready ROI proof.

**Delivered:** Post-commit **`EmailRunToSponsorBanner`** (**`/runs/{runId}`**): amber **`role="alert"`** banner **`email-run-to-sponsor-roi-baseline-gap`** (**Missing tenant ROI baselines**) when **`GET /v1/tenant/baseline`** is incomplete (**`isPilotRoiBaselineComplete`**) alongside **`pilot-run-deltas`** readiness; **`PILOT_BASELINE_WIZARD_OPEN_EVENT`** + **`/settings/baseline`** CTA (**item 16** wizard). Sponsor **PDF** primary action disabled until baselines captured; Markdown first-value report, architecture **DOCX**, and ZIP exports remain available (read-only / collateral downloads). Persisted **`describeSponsorProofReadiness`** (**`src/lib/pilot-proof-readiness.ts`**) exposes **NeedsBaseline** vs **Sendable** copy for sponsor-send posture. **`GenerateSponsorValueReportButton`** gates tenant sponsor **DOCX** via **`usePilotRoiBaselineCompleteness`**. Vitest: **`EmailRunToSponsorBanner.test.tsx`** (ROI baseline gate).
```

18. **COMPLETED:** Integrate axe-core accessibility checks in CI
- Why it matters: Catches regressions on operator-shell pages without claiming full assistive-technology user-study coverage (out of V1 headline scope).
- Expected impact: (Delivered **2026-05-17**.) Accessibility (+8 pts). Weighted readiness impact: +0.08%.
- Affected qualities: Accessibility.
- Actionable: Completed

```markdown
Add `@axe-core/playwright` (or equivalent) to the existing Playwright CI job for golden-path operator routes (Home, Reviews list, Review detail, Manifest).
- Fail the job on serious/critical violations; allow a short documented allowlist file checked into `archlucid-ui` with expiry comments.
- Do not replace manual AT studies — document that limitation in the test README.
- Acceptance criteria: CI fails when a serious a11y regression lands on covered routes.

**Delivered:** **`@axe-core/playwright`** in **`archlucid-ui/package.json`**; live merge-blocking **`ui-e2e-live`** runs **`live-api-accessibility*.spec.ts`** with **`runAxe`** (**`e2e/helpers/axe-helper.ts`**) gating **critical** and **serious** violations. Default CI subset always includes golden paths via **`GOLDEN_PATH_OPERATOR_A11Y_PAGES`** in **`e2e/live-api-accessibility.spec.ts`**. Checked-in suppressions: **`e2e/axe-rule-allowlist.ts`** (empty list; expiry required when used). Mock **`ui-playwright-accessibility`** runs **`npm run test:e2e:accessibility`**. Limitation (no substitute for AT user studies): **`archlucid-ui/docs/TESTING_AND_TROUBLESHOOTING.md`** § *Live accessibility*.
```

19. **Implement progressive disclosure for advanced governance routes**
- Why it matters: Reduces first-session cognitive load while keeping Operate depth available after the pilot proof path.
- Expected impact: Cognitive Load (+6 pts), Usability (+2 pts), Adoption Friction (+2 pts). Weighted readiness impact: +0.14%.
- Affected qualities: Cognitive Load, Usability, Adoption Friction.
- Actionable: Yes

```markdown
In `archlucid-ui` navigation and home CTAs, default to the four-step pilot path (Capture → Evidence → Review → Report).
- Move Alerts, Planning, Digests, Advisory, and similar routes behind an **Advanced** section or role-gated expander until the tenant completes a committed review or an admin enables full shell.
- Preserve deep links and RBAC; do not delete routes.
- Acceptance criteria: First-time evaluators see a narrow path; power users can still reach advanced routes.
```

20. **COMPLETED:** Expand security baseline policy pack with five additional MVP rules
- Why it matters: Thin starter packs risk one-and-done pilots; modest depth improves demo credibility without over-claiming compliance.
- Expected impact: (Delivered **2026-05-17**.) Template and Accelerator Richness (+5 pts), Stickiness (+2 pts), Proof-of-ROI Readiness (+1 pt). Weighted readiness impact: +0.09%.
- Affected qualities: Template and Accelerator Richness, Stickiness, Proof-of-ROI Readiness.
- Actionable: Completed

```markdown
Add five buyer-credible rules to the shipped **security architecture baseline** pack (e.g. private endpoint posture, Key Vault secret usage, TLS minimums) with framework **mapping only** (no certification claims).
- Seed rules into demo workspace **B** so regulated synthetic smoke surfaces real findings.
- Update pack metadata version and `docs/go-to-market` honesty copy if rule counts change.
- Acceptance criteria: Security baseline pack ships ≥5 additional MVP rules and demo workspace smoke passes.

**Delivered:** Five rules **`sec-base-026`**–**`sec-base-030`** in **`docs/samples/policy-packs/security-architecture-baseline-rules-v1.json`** (pack **`1.1.0`**); provisioning keys in **`DefaultPolicyPackTemplates.SecurityArchitectureBaselineV1Json`** + sample **`security-architecture-baseline.json`**; catalog stubs in **`ArchLucid.Decisioning/Compliance/RulePacks/ga-starter-compliance.rules.json`**. Workspace **B** seed (**`RegulatedScenarioWorkspaceSeed`**) now references shipped IDs (**`sec-base-006`**, **`sec-base-011`**, **`sec-base-018`**) instead of phantom identifiers. Honesty copy: **`docs/go-to-market/DEFAULT_POLICY_PACKS_V1.md`**, **`docs/library/POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md`**. **`MergedComplianceRulePackLoaderTests`** asserts **`sec-base-030`** merge; Playwright **`demo-workspace-b.smoke.spec.ts`** expects **`sec-base-006`** on review detail.
```

21. **COMPLETED:** Complete DTF multiset parity tests and release-smoke validation
- Why it matters: SQL DTF port is wired; legacy orchestrator cannot be removed until parity and smoke prove equivalence.
- Expected impact: (Delivered **2026-05-17**.) Correctness (+2 pts), Reliability (+3 pts), AI/Agent Readiness (+2 pts). Weighted readiness impact: +0.35%.
- Affected qualities: Correctness, Reliability, AI/Agent Readiness.
- Actionable: Completed

```markdown
Add integration tests that run the same authority-run scenarios through DTF and legacy paths and assert equivalent manifest, audit, and terminal states.
- Extend `release-smoke` (or equivalent) to exercise DTF on SQL storage hosts in staging.
- Document rollback switch in operator runbook; do not delete legacy adapter until parity suite is green in CI.
- Acceptance criteria: Parity suite green; release smoke documents DTF path; legacy removal is a follow-up PR gated on green main.

**Delivered:** **`ArchLucid.Host.Composition.Tests/AuthorityOrchestratorAdapterParityTests.cs`** — same simulator **`AuthorityRunOrchestrator`**, **`AuthorityRunOrchestratorApplicationAdapter`** vs **`DtfAuthorityRunOrchestrator`**, asserts aligned terminal-shape fingerprint and ordered audit **event-type** multiset; runs under **fast Core** (`Suite=Core`, `Category!=Integration`). **`release-smoke.ps1 -AuthorityPipelineDtfSmoke`** (requires **`ArchLucid__AuthorityPipeline__DurableTask__GrpcEndpoint`**, forbids **`-SkipE2E`**) sets **`ArchLucid__AuthorityPipeline__OrchestratorBackend=DurableTask`** for the temporary API. Docs: **`docs/library/RELEASE_SMOKE.md`**, **`docs/runbooks/STAGING_DEPLOYMENT_VALIDATION.md`** (authority pipeline — SQL hosts use DTF port only; rollback = deployment revision). Removed gated-only **`ArchLucid.AgentRuntime.Tests/AuthorityPipelineOrchestratorParityTests.cs`** in favor of composition execution parity.
```

22. **Harden curated demo workspace smoke and fixture pinning**
- Why it matters: Two GA-gated demo workspaces drift when UX, exports, or policy packs change without fixture updates.
- Expected impact: Adoption Friction (+3 pts), Commercial Packaging Readiness (+2 pts), Proof-of-ROI Readiness (+1 pt). Weighted readiness impact: +0.10%.
- Affected qualities: Adoption Friction, Commercial Packaging Readiness, Proof-of-ROI Readiness.
- Actionable: Yes

```markdown
Pin demo workspace seeds (SQL + blob fixtures) to versioned packages consumed by Playwright and `release-smoke`.
- Add a CI job that fails when Workspace **A** / **B** smoke diverges from `docs/go-to-market/DEMO_WORKSPACES.md` URLs and expected finding counts.
- Document fixture update procedure in `DEMO_WORKSPACES.md` when product changes intentionally break smoke.
- Acceptance criteria: GA checklist cannot pass without both workspaces green on pinned fixtures.
```

23. **Add ArchUnitNET (or equivalent) architecture boundary tests**
- Why it matters: Large monorepo surface increases accidental coupling; automated boundaries protect maintainability at scale.
- Expected impact: Maintainability (+4 pts), Modularity (+2 pts). Weighted readiness impact: +0.10%.
- Affected qualities: Maintainability, Modularity.
- Actionable: Yes

```markdown
Introduce architecture tests in `ArchLucid.TestSupport` (or a dedicated test project) that enforce layer rules (e.g. `ArchLucid.Core` must not reference `ArchLucid.Api`, UI must not reference persistence).
- Start with a minimal rule set matching `.cursor/rules/Architecture-Invariants.mdc` INV-* pointers; expand incrementally.
- Wire into existing `dotnet test` CI; fail on violation.
- Acceptance criteria: At least five boundary rules run in CI and block obvious layer violations.
```

24. **Surface finding confidence and evidence links prominently in review UI**
- Why it matters: Operators need trust signals to accelerate decisions; buried provenance slows Decision Velocity.
- Expected impact: Decision Velocity (+5 pts), Explainability (+2 pts), Differentiability (+1 pt). Weighted readiness impact: +0.13%.
- Affected qualities: Decision Velocity, Explainability, Differentiability.
- Actionable: Yes

```markdown
On finding detail and list views in `archlucid-ui`, show confidence (or severity rationale) and one-click **View evidence** / graph deep-link when provenance exists.
- Do not change finding schema without OpenAPI/versioning discipline.
- Acceptance criteria: PHI/minimization-style demo finding shows visible confidence and evidence navigation without opening the full manifest.
```

25. **Implement bi-directional ServiceNow status sync (when dev credentials available)**
- Why it matters: **V1 GA** commitment per `V1_SCOPE.md` §2.13; closes workflow gap for ITSM-led enterprises.
- Expected impact: Workflow Embeddedness (+5 pts), Interoperability (+2 pts). Weighted readiness impact: +0.21%.
- Affected qualities: Workflow Embeddedness, Interoperability.
- Actionable: Yes (blocked on **P10** cost-free developer instance — queue engineering until credentials exist)

```markdown
Implement status sync between ArchLucid review/findings state and ServiceNow change/incident records per existing webhook/controller patterns.
- Map terminal review states to ServiceNow fields bidirectionally; emit durable audit events on sync.
- Gate feature behind configuration; document setup in `docs/integrations/recipes/`.
- Acceptance criteria: Status change in ArchLucid updates ServiceNow and vice versa in a developer-instance integration test.
```

33. **Implement marketing landing page content (hero, problem/solution, use cases, proof)**
- Why it matters: The landing page hero copy, problem/solution narrative, use case listing, and proof section are the primary evaluator entry point. `WelcomeMarketingPage.tsx` and `archlucid-ui/src/app/(marketing)/layout.tsx` exist as untracked files with no corresponding improvement item; without complete content the CTA stack (**#32**) routes buyers to an incomplete page.
- Expected impact: Marketability, Adoption Friction, Commercial Packaging Readiness.
- Affected qualities: Marketability, Adoption Friction.
- Actionable: Yes — files exist; content and copy need implementation aligned to `POSITIONING.md` tagline and the five V1-approved use cases (architecture review boards, AI governance reviews, security architecture reviews, M&A / modernization assessments, consultant architecture assessments). **Do not** include CAF landing-zone pack claim until V1.1.
- GTM dependency: Blocks marketing tasks **M-09** in `docs/go-to-market/GTM_BACKLOG.md`.

```markdown
Implement marketing landing page sections in `archlucid-ui/src/app/(marketing)/` and `WelcomeMarketingPage.tsx`:
- Hero: headline + sub-headline aligned to `POSITIONING.md` tagline; primary CTA from #32.
- Problem: architecture review is fragmented across diagrams, decks, wikis, meetings, and memory.
- Solution: ArchLucid creates a reviewable evidence graph connecting decisions to source artifacts, risks, policies, and reports.
- Core workflow: six-step visual (Capture system → Add evidence → Run review → Resolve findings → Record decisions → Generate report).
- Use cases: five V1-approved cases listed above; exclude CAF landing-zone pack claim.
- Proof: screenshot gallery (≥6 screenshots from Workspace A/B), downloadable sample report link (from #28 export), link to Workspace A self-demo.
- CTA stack: per #32 (Request walkthrough / Try the self-demo / Early access).
- Acceptance criteria: Page renders all sections; copy reviewed against `POSITIONING.md`; screenshots sourced from stable Workspace A/B (#31); no claim that contradicts `docs/library/V1_SCOPE.md` honesty constraints.
```

---

## Prompt Batching Guidance

- **Batch 1 (High Leverage, Low Risk):** 3, 4, 8, 14, 18 (**item 17 — missing baseline executive / sponsor surfaces — COMPLETED** **2026-05-17**). Correctness, observability, documentation, live E2E, and a11y CI without large architecture moves.
- **Batch 2 (Performance & Observability):** 5, 7, 10, 11, 21. Operational robustness, SQL retries, LLM tracing, orchestration limits, and DTF parity smoke.
- **Batch 3 (Testing, Analytics & ROI):** **16 — baseline wizard — COMPLETED** **2026-05-17** (**item 12 — data residency — COMPLETED** **2026-05-16**; do not re-prompt).
- **Batch 4 (UX & adoption):** 6, 15, 19, **20 — security baseline pack expansion — COMPLETED** **2026-05-17**, 22, 24. Dashboard health, rule UI, progressive disclosure, pack depth, demo smoke, and finding trust signals.
- **Batch 5 (Architecture hygiene):** 23. ArchUnitNET boundaries — isolated PR, expand rules incrementally.
- **Batch 6 (Integrations — credential-dependent):** 25. ServiceNow bi-directional sync when **P10** developer instance is available; do not block other batches.
- **Batch 7 (Marketing landing page — GTM gate):** 33. Marketing landing page content implementation (`WelcomeMarketingPage.tsx` + `(marketing)/layout.tsx`); coordinate with GTM task **M-09** in `docs/go-to-market/GTM_BACKLOG.md`. Copy review must precede engineering implementation — do not build placeholder content.
- **Deferred / V1.1 program (do not batch into V1 execution):** **Azure CAF / landing-zone curated policy pack**; **bulk evidence upload above 30 files**, ZIP expansion, recursive folder ingest; Stripe live keys / Marketplace (**#7** in commercial packaging notes). Plan V1.1 slices with dedicated context (see **`V1_SCOPE.md`**, **`V1_DEFERRED.md`**, pinned backlog docs — not re-listed here).

---

## Marketing alignment

Sequential decisions so marketing ↔ technical V1 stay aligned. **Do not** duplicate these rows under **§ Pending technical questions** — that section is for technical / commercial-owner backlog only.

| # | Topic | Answer |
|---|--------|--------|
| 1 | Operator UI ↔ technical glossary (#27) — canonical buyer-facing labels vs API/internal terms | Primary work unit **Run** → UI **Review** (use *Architecture review* where space allows). Persist-golden-manifest action **Commit** → **Finalize review** / **Finalize** in context. **Manifest / golden manifest** → **Architecture snapshot** / **Snapshot** in tight UI. Graph screen → **Evidence graph**; route **`/graph`** unchanged. Internal/API: `RunRecord`, `POST .../commit`, `GoldenManifest`, `KnowledgeGraph` unchanged. Tooltip near finalize: replay/compare still allowed after lock. |
| 2 | Buyer-grade default architecture review export (DOCX/PDF sections matching landing narrative) — **V1 GA gate** vs **post-V1 polish** | **V1 GA gate.** Default export profile(s) must match marketing narrative sections; landing page / demos / downloadable sample assume GA ships with buyer-grade DOCX **and** PDF. Implementation tracked via improvement **#28** (extended by row 5). |
| 3 | Ship **default AI governance / landing-zone / security baseline policy packs** in **V1 GA** vs soften AI-governance marketing until packs exist | **V1 GA — ship subset:** (**1**) **AI governance / responsible AI** MVP pack; (**2**) **Security architecture baseline** MVP pack. **Azure landing-zone / CAF-aligned** curated pack **deferred to V1.1** — GA marketing relies on **extractor + advisor** for cloud baseline narrative; **must not** imply bundled CAF landing-zone pack until release. Implementation + honesty docs tracked via improvement **#29**; scoring boundary — see **§V1 scoring boundary** (policy packs bullet). |
| 4 | **Bulk evidence upload** (mixed files → run evidence) — **V1** vs **V1.1** vs **not planned** (sets honesty bar for “capture scattered evidence” copy) | **V1 GA — capped:** bulk attach ships at GA with **≤30 files per upload/action** (hard server limit). Landing/support/demo copy **must** disclose the cap; raising/removing limit, ZIP unpack, recursive folders → **V1.1** backlog. Implementation tracked via improvement **#30**; scoring boundary — **§V1 scoring boundary** (bulk upload bullet). |
| 5 | **Consultant / engagement report whitelabel** (cover branding for Upwork-style deliverables) — **V1** vs **later** | **V1 GA.** DOCX **and** PDF exports support **tenant-scoped** whitelabel: **firm name**, **engagement/client title**, optional **logo**, **Prepared by … using ArchLucid** attribution. Folded into improvement **#28** (same profile); **§V1 scoring boundary** (whitelabel bullet). Security sign-off on logo handling. |
| 6 | Two **curated demo workspaces** (self-demo + synthetic regulated scenario) — **V1 release gate** vs **best-effort before GA** | **Hard V1 release gate.** Exactly **two** tenant-ready workspaces (**self-demo / tour** + **synthetic regulated AI + governance scenario**) ship before GA; **release checklist blocks GA** until both pass automated smoke (**Playwright** / **`release-smoke`** per repo norms). Implementation **#31**; **§V1 scoring boundary** (demo workspaces bullet). |
| 7 | Landing **primary CTA** for first 90 days — **Request walkthrough** vs **Early access** vs **Paid pilot ($ band)** vs hybrid | **Hybrid.** **Primary:** **Request walkthrough** (sales-led GA; matches deferred Stripe live / Marketplace). **Secondary:** **Try the self-demo** — deep-link to **Workspace A** (**#31**). **Tertiary:** **Early access** / email waitlist — **must not** imply instant product access or live checkout. **Public paid-pilot $ band** **excluded** from hero for **first 90 days** (qualify→quote path). Implementation **#32**; **§V1 scoring boundary** (landing CTA bullet). |

---

## Pending technical questions for later

Technical / commercial-owner queue only. **Marketing ↔ product decisions** are recorded in **§ Marketing alignment** (table above), not duplicated here.

- **P4 — Stripe live keys + Marketplace publication:** **Defer** execution **until finance confirms** Partner Center readiness (seller verification, tax profile, payout/banking). **Next step:** Finance “go” → run improvement **#7** against billing/runbook checklists (e.g. **`docs/library/DEPLOYMENT_TERRAFORM.md`** and any Partner Center / Stripe cutover notes the team maintains).
- **P10 — ServiceNow developer instance + schemas:** **No** access **at this time**. **`V1` GA** bidirectional ServiceNow sync **remains in contract** (`V1_SCOPE.md` §2.13). Provisioning a **cost-free** **ServiceNow Developer Program** / personal developer-style instance for engineering (**#22**) **when available** — **paid** sandbox **not** a **`V1` GA** gate. **If** a **free** path cannot be obtained before a future GA decision, scope docs must be **explicitly** revised — do **not** silently drop **`V1` GA** claims.
