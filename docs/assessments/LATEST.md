> **Scope:** Internal weighted readiness assessment for repo stewards — V1 scoring boundary and backlog prompts; not a customer-facing datasheet nor an exhaustive audit substitute.

**Canonical pair:** This file is the **single current score and backlog** for weighted readiness. Read **`docs/library/ASSESSMENT_INPUTS.md`** first for the evidence contract; treat **`docs/archive/assessments/`** and archived quality narratives as **history only** — see **“One workflow (current score vs history)”** there.

# ArchLucid Assessment – Weighted Readiness 82.93%

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
- **Score:** 83
- **Weight:** 6
- **Weighted deficiency signal:** 102
- **Justification:** Tier 1 Azure extraction remains frictionless. Landing **hybrid CTA** routes serious buyers to **walkthrough** while offering **self-demo** before calendar load (**#32**). Operator shell labels are aligned with marketing vocabulary. Curated demo workspace smoke and fixture pinning is now hardened, ensuring reliable evaluations.
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
- **Score:** 86
- **Weight:** 5
- **Weighted deficiency signal:** 70
- **Justification:** The Azure extractor provides cost data, and the comparison replay cost estimator is useful. **Improvement #11 (2026-05-16):** replay cost heuristics inspect persisted comparison JSON (`manifestDiff` structural surface, `agentResultDiff.agentDeltas`, `exportDiffs`, `runDiff`, and export-record diff payloads) so estimates track replay complexity more closely — operator cost-estimate API contract unchanged. **V1 GA** ships curated **AI governance** and **security baseline** default packs so pilots immediately surface policy findings aligned to the wedge — demos prove ROI faster than buyer-authored-only onboarding. Report export **whitelabel** lets consultants prove tangible client-ready ROI artifacts without offline rebranding. **Regulated synthetic demo workspace** gives repeatable proof narrative without bespoke pilot setup. Cross-tenant analytics remain absent for portfolio-wide executive proof. Hardened demo workspace smoke tests and fixture pinning ensure reliable, repeatable ROI demonstrations.
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
- **Score:** 86
- **Weight:** 2
- **Weighted deficiency signal:** 28
- **Justification:** The trial funnel is tested in Stripe TEST mode, but live keys and Marketplace publication are intentionally deferred to V1.1. **Curated default packs at GA** sharpen the packaged story (**AI-era governance review** with actionable starter rules), reducing “empty shell” risk for sales-led pilots. **Consultant whitelabel** on architecture-review exports improves resale positioning for boutique / marketplace consultants without a separate SKU. **Mandatory demo workspaces** package the wedge into predictable buyer-ready flows. **Hybrid landing CTAs** keep copy honest with deferred self-serve while still capturing **Early access** leads. Hardened demo workspace smoke tests guarantee a consistent packaging and trial experience.
- **Tradeoffs:** Deferring live commerce allows for a controlled, sales-led V1 rollout but delays self-serve revenue. Starter packs raise **copy honesty** obligations — claims must match shipped rule depth. **Consultant logos** increase **tenant-upload attack surface** — mitigate with MIME/size caps and existing malware-scan posture (sign-off required — **Q5**). **Early access** tertiary must avoid **bait-and-switch** vs walkthrough-led pilots (**Q7**).
- **Improvement recommendations:** Flip Stripe live keys and publish the Marketplace listing **after finance confirms** Partner Center readiness (**P4**, **#7**).

### 9. Explainability
- **Score:** 82
- **Weight:** 2
- **Weighted deficiency signal:** 36
- **Justification:** The system provides comparison replays and a knowledge graph, offering good visibility into architectural decisions.
- **Tradeoffs:** Default **in-process** projection cache still caps multi-replica coherence unless operators enable **Distributed** backend + Redis (configure **`ArchLucid:KnowledgeGraph:ProjectionCache:Backend`**).
- **Improvement recommendations:** Retain **`V1_DEFERRED.md` §6e** honesty when Redis is **not** configured.

### 10. Interoperability
- **Score:** 92
- **Weight:** 2
- **Weighted deficiency signal:** 16
- **Justification:** V1 contract surfaces—**REST API**, **CLI**, **operator UI**, integration events/webhooks, and **first-party** ITSM and chat connectors—meet the documented integration posture. **Native SAML 2.0 SP** is **shipped** for **V1 GA** (**`V1_SCOPE.md` §2.12**).
- **Tradeoffs:** SAML SP adds dual auth-surface operational burden (cert rotation, metadata drift) versus OIDC-only tenants.
- **Improvement recommendations:** Tighten OpenAPI-aligned client examples and webhook recipe discoverability (`docs/integrations/recipes/`).

### 11. Stickiness
- **Score:** 81
- **Weight:** 1
- **Weighted deficiency signal:** 19
- **Justification:** Governance workflows and compliance drift tracking provide ongoing value. **Default AI governance + security packs** give tenants a repeatable baseline to extend — modest lift vs buyer-authored-only baseline. **Branded consultant exports** (**Q5**) increase likelihood tenants reuse ArchLucid as their recurring engagement tooling vs one-off novelty. Advanced autonomous planning remains deferred and may still cap engagement depth.
- **Tradeoffs:** Focusing on deterministic execution over open-ended planning ensures reliability but may feel less "agentic". Thin starter packs risk **one-and-done** pilots unless tenants customize and attach packs to recurring reviews.
- **Improvement recommendations:** Execute improvement **#29** (baseline packs tenants extend over time). Add cross-tenant analytics capabilities to demonstrate ongoing value (**#12**).

### 12. Performance
- **Score:** 78
- **Weight:** 1
- **Weighted deficiency signal:** 22
- **Justification:** Rate limiting is implemented; optional Redis and **memory** caches remain deployment-dependent — **distributed graph projection cache** is **available when configured**.
- **Tradeoffs:** Making Redis optional simplifies single-replica deployments but complicates scaled operations.
- **Improvement recommendations:** ~~Connection open retries~~ **Delivered (2026-05-16):** `SqlScopedResolutionDbConnectionFactory.CreateOpenConnectionAsync` resolves scoped `ISqlConnectionFactory`, which production registers as `ResilientSqlConnectionFactory` wrapping Polly (`SqlOpenResilienceDefaults`, transient detection including Azure SQL codes 40613 / 40197 / 40501). Configure attempts and backoff via `Persistence:SqlOpenResilience` in `appsettings`.

### 13. Observability
- **Score:** 82
- **Weight:** 1
- **Weighted deficiency signal:** 18
- **Justification:** OpenTelemetry, Serilog, and replay diagnostics provide good visibility.
- **Tradeoffs:** Standard observability tools require operator expertise to configure and monitor effectively.
- **Improvement recommendations:** Add explicit logging for agent state machine transitions.

### 14. Time-to-Value
- **Score:** 85
- **Weight:** 7
- **Weighted deficiency signal:** 105
- **Justification:** Core pilot path is well-defined. Curated demo workspaces and default policy packs accelerate initial value without manual rule authoring.
- **Tradeoffs:** Real-mode value requires tenant baseline data, which can take time to gather.
- **Improvement recommendations:** Add a guided baseline collection wizard to the onboarding flow to accelerate real-mode value.

### 15. Executive Value Visibility
- **Score:** 84
- **Weight:** 4
- **Weighted deficiency signal:** 64
- **Justification:** Architecture Review Report export (DOCX/PDF) with consultant whitelabeling provides immediate, tangible executive artifacts.
- **Tradeoffs:** Executive value can become abstract if real tenant baselines are missing.
- **Improvement recommendations:** Add a 'Missing Baseline' warning to the executive dashboard to ensure value is not abstract.

### 16. Differentiability
- **Score:** 83
- **Weight:** 4
- **Weighted deficiency signal:** 68
- **Justification:** Evidence-linked findings and governed decision trails differentiate the product from generic LLM wrappers.
- **Tradeoffs:** Broad proof surface helps defensibility but requires concise buyer framing to avoid sounding like a feature inventory.
- **Improvement recommendations:** Refine in-app tooltips to focus strictly on the core differentiation (evidence-linked findings) to avoid feature inventory overload.

### 17. Decision Velocity
- **Score:** 80
- **Weight:** 2
- **Weighted deficiency signal:** 40
- **Justification:** Speeds up architecture reviews by providing structured evidence and policy findings.
- **Tradeoffs:** Requires operator trust in the AI's findings to truly accelerate decisions.
- **Improvement recommendations:** Highlight confidence scores or evidence links more prominently in the UI to build operator trust faster.

### 18. Template and Accelerator Richness
- **Score:** 78
- **Weight:** 1
- **Weighted deficiency signal:** 22
- **Justification:** Two curated default policy packs (AI governance + security baseline) provide a good starting point.
- **Tradeoffs:** The library is currently small, shifting some burden to credible authoring by the tenant.
- **Improvement recommendations:** Pack depth uplift delivered **2026-05-17** (five additional **`sec-base-026`**–**`sec-base-030`** rules + Workspace **B** seed IDs aligned to shipped keys); continue extending tenant-authored corpus over time.

### 19. Accessibility
- **Score:** 75
- **Weight:** 1
- **Weighted deficiency signal:** 25
- **Justification:** Basic web accessibility is present.
- **Tradeoffs:** No participant user testing with assistive technologies (not a V1 requirement).
- **Improvement recommendations:** None for automated baseline scans — merge-blocking **`@axe-core/playwright`** runs in **`ui-e2e-live`** and **`ui-playwright-accessibility`** (see **`archlucid-ui/e2e/live-api-accessibility.spec.ts`**). Participant assistive-technology studies remain out of V1 scope (see tradeoffs).

### 20. Reliability
- **Score:** 82
- **Weight:** 2
- **Weighted deficiency signal:** 36
- **Justification:** DTF orchestration improves reliability.
- **Tradeoffs:** Multi-region worker fleets still need disciplined slot sizing versus SQL lease churn; orphaned leases rely on **`LeaseRecognitionHorizon`** scavenging.
- **Improvement recommendations:** Operational runbooks should document defaults for **`AuthorityPipeline:Concurrency`** per environment tier and monitor lease table growth alongside worker saturation.

### 21. Maintainability
- **Score:** 84
- **Weight:** 2
- **Weighted deficiency signal:** 32
- **Justification:** Clean code architecture.
- **Tradeoffs:** The large surface area increases maintenance overhead.
- **Improvement recommendations:** **`ArchLucid.Architecture.Tests`** (**NetArchTest**) gates core layering in CI (**improvement #23**, **completed 2026-05-17**); continue narrowing public surfaces via **`internal`** where appropriate and expand boundary rules incrementally per **`INV-*`** / **`docs/library/TECH_BACKLOG.md`** enforcement waves.

### 22. Scalability
- **Score:** 80
- **Weight:** 1
- **Weighted deficiency signal:** 20
- **Justification:** Scales well horizontally.
- **Tradeoffs:** Single-tenant worker pool exhaustion is a known risk requiring rate limiting.
- **Improvement recommendations:** Implement auto-scaling rules for the worker pool based on queue depth.

### 23. Supportability
- **Score:** 82
- **Weight:** 1
- **Weighted deficiency signal:** 18
- **Justification:** Good logging and OpenTelemetry.
- **Tradeoffs:** Some operational scripts assume DevelopmentBypass aside from curated paths (for example JWT-only CLI probes).
- **Improvement recommendations:** Broaden JWT/API realism for remaining operator scripts (`ARCHLUCID_*` bearer parity); `v1-rc-drill.ps1` covered (**#3**, **closed 2026-05-16**).

### 24. Testability
- **Score:** 84
- **Weight:** 1
- **Weighted deficiency signal:** 16
- **Justification:** Strong unit/integration tests plus merge-blocking **`ui-e2e-live`** golden-path coverage (**#14**, **2026-05-16**) and **`live-api-negative-paths`** (**#8**).
- **Tradeoffs:** Default **`ui-e2e-smoke`** remains mock-heavy — fast churn coverage without standing up SQL on every PR.
- **Improvement recommendations:** Prefer targeted **`live-api-*.spec.ts`** additions when a high-risk surface stays mock-only; golden-path **`live-api-journey`** / **`live-api-core-pilot-path`** already merge-block via **`ui-e2e-live`** (**#14**, **2026-05-16**).

### 25. Cognitive Load
- **Score:** 76
- **Weight:** 1
- **Weighted deficiency signal:** 24
- **Justification:** Marketing-aligned vocabulary helps, but the product surface is large for a first-pilot motion.
- **Tradeoffs:** Breadth is valuable for expansion but increases first-session confusion.
- **Improvement recommendations:** Implement progressive disclosure in the UI to hide advanced governance features until needed.

### 26. Cost-Effectiveness
- **Score:** 82
- **Weight:** 1
- **Weighted deficiency signal:** 18
- **Justification:** Azure cost extractor provides visibility. Comparison replay cost estimation uses granular payload heuristics (**#11**, **2026-05-16**).
- **Tradeoffs:** Some manual estimation remains in Azure extractor–adjacent workflows.
- **Improvement recommendations:** None for comparison replay cost heuristics (**#11** **closed 2026-05-16**); residual gap is broader Azure cost manual estimation surfaces.

---

## Top 8 Most Important Weaknesses

1. Absence of cross-tenant analytics, limiting Proof-of-ROI for enterprise buyers.
2. **Mock-backed default smoke breadth:** **`ui-e2e-smoke`** still relies heavily on mocked **`/api/proxy`** for wide route coverage — merge-blocking **`ui-e2e-live`** now validates the operator golden spine on **real API + ephemeral SQL CI** (**#14**, **`live-api-journey`** / **`live-api-core-pilot-path`**) alongside negatives (**#8**, **`live-api-negative-paths.spec.ts`**).
3. Manual nature of some cost estimations in the Azure extractor (distinct from comparison replay payload heuristics — **#11** **closed 2026-05-16**).
4. **Agent orchestration noisy-neighbor mitigation (narrow residual):** Per-tenant **`AuthorityPipeline:Concurrency`** slots and SQL lease-backed counting (**#11 backlog**, **2026-05-16**) cap concurrent heavy-stage work; bursts still justify queue/offload telemetry and alerting when leases approach limits.
5. **LLM observability gaps:** Missing explicit OpenTelemetry tracing for LLM API calls (token usage, latency) hinders debugging, cost attribution, and AI/Agent readiness at scale.
6. **Durable Task Framework (narrow residual):** Legacy vs DTF **adapter** multiset parity is CI-gated (`ArchLucid.Host.Composition.Tests` / `AuthorityOrchestratorAdapterParityTests`); **`release-smoke`** supports **`-AuthorityPipelineDtfSmoke`** for tenant SQL + gRPC validation. Remaining work is **worker/engine scheduling depth** and optional DI cleanup once main stays green — not a commitment-gap for GA reads.
7. **Operational script auth realism (narrow residual):** `v1-rc-drill.ps1` accepts **`-BearerToken`** / **`-ApiKey`** (**#3**, **2026-05-16**); other scripts may remain DevelopmentBypass-assumptive; JwtBearer drills still rely on **`ARCHLUCID_API_KEY`** for CLI detailed **`/health/diagnostics`** probes (JWT covers script REST).
8. **Lack of explicit logging for agent state machine transitions:** Makes it difficult to observe and debug complex agent orchestrations in production.

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

1. **Implement progressive disclosure for advanced governance routes** (**completed 2026-05-17**)
- Why it matters: Reduces first-session cognitive load while keeping Operate depth available after the pilot proof path.
- Expected impact: Cognitive Load (+6 pts), Usability (+2 pts), Adoption Friction (+2 pts). Weighted readiness impact: +0.14%.
- Affected qualities: Cognitive Load, Usability, Adoption Friction.
- Actionable: Yes (**done** — `archlucid-ui`: pilot nav + home CTAs on four-step path; pre-commit gate expanded for `/graph` + `/dashboard`; **Architecture advisory** at **advanced** tier with Alerts / Planning / Digests; routes and RBAC unchanged. **Residual:** optional tenant/API “full shell” unlock for admins before first committed review if product wants parity with the assessment line.)

```markdown
In `archlucid-ui` navigation and home CTAs, default to the four-step pilot path (Capture → Evidence → Review → Report).
- Move Alerts, Planning, Digests, Advisory, and similar routes behind an **Advanced** section or role-gated expander until the tenant completes a committed review or an admin enables full shell.
- Preserve deep links and RBAC; do not delete routes.
- Acceptance criteria: First-time evaluators see a narrow path; power users can still reach advanced routes.
```

2. **Add targeted API telemetry for finding list paths**
- Why it matters: The `FindingsListAccessed` durable read path remains intentionally unaudited. Adding telemetry prepares this path for future auditability.
- Expected impact: Compliance Readiness (+3 pts), Observability (+2 pts).
- Affected qualities: Compliance Readiness, Observability.
- Actionable: Yes

```markdown
Add explicit application-level logging to the findings list API endpoints so read-access patterns can be evaluated before committing them to the durable audit matrix.
```

3. **Surface finding confidence and evidence links prominently in review UI**
- Why it matters: Operators need trust signals to accelerate decisions; buried provenance slows Decision Velocity.
- Expected impact: Decision Velocity (+5 pts), Explainability (+2 pts), Differentiability (+1 pt). Weighted readiness impact: +0.13%.
- Affected qualities: Decision Velocity, Explainability, Differentiability.
- Actionable: Yes

```markdown
On finding detail and list views in `archlucid-ui`, show confidence (or severity rationale) and one-click **View evidence** / graph deep-link when provenance exists.
- Do not change finding schema without OpenAPI/versioning discipline.
- Acceptance criteria: PHI/minimization-style demo finding shows visible confidence and evidence navigation without opening the full manifest.
```

4. **Implement bi-directional ServiceNow status sync (when dev credentials available)**
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

5. **Extend live API specs for high-risk mock-only surfaces**
- Why it matters: Mock-backed default smoke breadth relies on mocked /api/proxy. Live specs close this gap.
- Expected impact: Correctness (+3 pts), Reliability (+2 pts).
- Affected qualities: Correctness, Reliability.
- Actionable: Yes

```markdown
Add targeted `live-api-*.spec.ts` additions for high-risk surfaces that currently stay mock-only. Ensure golden-path integration is fully covered by `ui-e2e-live`.
```

6. **Implement auto-scaling rules for the worker pool**
- Why it matters: Prevents single-tenant worker pool exhaustion which is a known risk.
- Expected impact: Scalability (+3 pts), Reliability (+2 pts).
- Affected qualities: Scalability, Reliability.
- Actionable: Yes

```markdown
Implement auto-scaling rules for the worker pool based on queue depth to prevent noisy neighbor and pool exhaustion.
```

7. **Add explicit logging for agent state machine transitions**
- Why it matters: Makes it easier to observe and debug complex agent orchestrations in production.
- Expected impact: Observability (+3 pts), AI/Agent Readiness (+2 pts).
- Affected qualities: Observability, AI/Agent Readiness.
- Actionable: Yes

```markdown
Ensure detailed Information-level logs are emitted for `Agent execution state transition` with run id, current/next states, and task identifiers.
```

8. **Update remaining operational scripts to support JWT/API keys**
- Why it matters: Some operational scripts still rely on DevelopmentBypass, breaking realism.
- Expected impact: Correctness (+2 pts), Security (+2 pts).
- Affected qualities: Correctness, Security.
- Actionable: Yes

```markdown
Update operational scripts to accept optional parameters for a JWT bearer token or API key, removing the assumption of `DevelopmentBypass`.
```

9. **Add queue/offload telemetry and alerting for worker bursts**
- Why it matters: Agent orchestration bursts still justify queue and offload telemetry when leases approach limits.
- Expected impact: Observability (+3 pts), Performance (+2 pts).
- Affected qualities: Observability, Performance.
- Actionable: Yes

```markdown
Add dashboards and alerting on wait times and dead letters when workers queue behind saturated slots.
```

10. **Refine in-app tooltips to focus strictly on evidence-linked findings**
- Why it matters: Broad proof surface helps defensibility but requires concise framing to avoid feature inventory overload.
- Expected impact: Differentiability (+3 pts), Cognitive Load (+2 pts).
- Affected qualities: Differentiability, Cognitive Load.
- Actionable: Yes

```markdown
Update in-app tooltips within the review UI to highlight core differentiation elements like evidence-linked findings.
```

11. **Add explicit OpenTelemetry tracing for LLM API calls**
- Why it matters: Missing tracing for token usage and latency hinders debugging and AI/Agent readiness.
- Expected impact: Observability (+3 pts), AI/Agent Readiness (+3 pts).
- Affected qualities: Observability, AI/Agent Readiness.
- Actionable: Yes

```markdown
Enhance OpenTelemetry instrumentation to capture detailed metrics for all LLM API calls, including token count and latency.
```

12. **Expand coverage for transient SQL failures in background workers**
- Why it matters: While primary API connections handle transient SQL faults, background workers and asynchronous jobs may lack comprehensive retry policies.
- Expected impact: Reliability (+3 pts), Performance (+2 pts).
- Affected qualities: Reliability, Performance.
- Actionable: Yes

```markdown
Audit and update background jobs to ensure Polly-based retry policies are uniformly applied to all SQL connection attempts, specifically for Azure SQL transient errors.
```

13. **Deeper engine-native scheduling and observability for DTF**
- Why it matters: Required for full multiset parity and operational depth.
- Expected impact: Reliability (+3 pts), Maintainability (+2 pts).
- Affected qualities: Reliability, Maintainability.
- Actionable: Yes

```markdown
Complete deeper engine-native scheduling and observability for the Durable Task Framework port and clean up legacy paths once sustained green.
```

14. **Add tracking for 108 replay notes during catalog migrations**
- Why it matters: RLS migrations remain coordination-heavy; tracking replay notes where catalogs lag improves correctness visibility.
- Expected impact: Correctness (+3 pts), Maintainability (+2 pts).
- Affected qualities: Correctness, Maintainability.
- Actionable: Yes

```markdown
Implement telemetry to track `108` replay notes during catalog migrations to provide visibility into lag.
```

15. **Enhance documentation for single-process projection limitations**
- Why it matters: Default in-process projection cache caps multi-replica coherence when Redis is absent.
- Expected impact: Explainability (+3 pts), Reliability (+2 pts).
- Affected qualities: Explainability, Reliability.
- Actionable: Yes

```markdown
Update deployment documentation to clearly state the limitations of single-process projection caches and strongly recommend Redis for scaled environments.
```

16. **Improve discoverability of OpenAPI client examples and webhook recipes**
- Why it matters: Developers struggle to find examples, increasing integration time.
- Expected impact: Interoperability (+4 pts), Adoption Friction (+2 pts).
- Affected qualities: Interoperability, Adoption Friction.
- Actionable: Yes

```markdown
Reorganize `docs/integrations/recipes/` to surface OpenAPI-aligned client examples and webhook configurations more prominently.
```

17. **Automate broader Azure cost estimations**
- Why it matters: Manual cost estimation limits the platform's ability to prove hard infrastructure savings automatically.
- Expected impact: Cost-Effectiveness (+4 pts), Proof-of-ROI Readiness (+2 pts).
- Affected qualities: Cost-Effectiveness, Proof-of-ROI Readiness.
- Actionable: Yes

```markdown
Extend the Azure extractor to automate cost estimations across a broader set of Azure resources, reducing reliance on manual operator input.
```

18. **Implement automated checks for audit matrix reviews**
- Why it matters: Ensures that any new HTTP mutations automatically trigger a review of the audit coverage matrix.
- Expected impact: Compliance Readiness (+4 pts), Auditability (+2 pts).
- Affected qualities: Compliance Readiness, Auditability.
- Actionable: Yes

```markdown
Add a CI step that parses `docs/library/AUDIT_COVERAGE_MATRIX.md` and fails the build if new `POST`/`PUT`/`DELETE` API endpoints lack documented audit events.
```

19. **Refine error handling and retry logic in background data archival**
- Why it matters: Data archival runs in the background; improved error handling ensures orphaned blobs are eventually scavenged without manual intervention.
- Expected impact: Reliability (+3 pts), Maintainability (+2 pts).
- Affected qualities: Reliability, Maintainability.
- Actionable: Yes

```markdown
Update `DataArchivalHostHealthCheck` and the underlying archival services to implement exponential backoff and dead-letter queues for failed blob deletions.
```

20. **Update operational runbooks for AuthorityPipeline concurrency**
- Why it matters: Operators need clear guidance on configuring and monitoring worker pool concurrency.
- Expected impact: Reliability (+4 pts), Supportability (+2 pts).
- Affected qualities: Reliability, Supportability.
- Actionable: Yes

```markdown
Document the recommended defaults for `AuthorityPipeline:Concurrency` per environment tier and add a runbook section for monitoring lease table growth.
```

21. **Incrementally expand NetArchTest boundary rules**
- Why it matters: Continued expansion of automated boundary rules protects maintainability as the codebase grows.
- Expected impact: Maintainability (+4 pts), Modularity (+2 pts).
- Affected qualities: Maintainability, Modularity.
- Actionable: Yes

```markdown
Add at least three new architecture boundary rules in `ArchLucid.Architecture.Tests` to further tighten public surfaces using the `internal` modifier.
```

22. **Establish a periodic manual accessibility review process**
- Why it matters: Automated scans (axe-core) do not catch all accessibility issues; manual testing with assistive technologies is required.
- Expected impact: Accessibility (+5 pts), Usability (+2 pts).
- Affected qualities: Accessibility, Usability.
- Actionable: Yes

```markdown
Create a documented process and schedule for manual accessibility reviews using screen readers, and add a recurring reminder task for the team.
```

23. **Add Playwright smoke tests for consultant whitelabel export**
- Why it matters: Consultant whitelabeling is a key V1 commercial feature; automated UI tests ensure the export modal and branding fields do not regress.
- Expected impact: Testability (+3 pts), Commercial Packaging Readiness (+2 pts).
- Affected qualities: Testability, Commercial Packaging Readiness.
- Actionable: Yes

```markdown
Write a new `live-api-whitelabel.spec.ts` Playwright test that verifies the consultant logo upload and engagement title inputs function correctly before exporting a review.
```

24. **Formalize data residency verification in the provisioning pipeline**
- Why it matters: Enterprise buyers require verifiable proof that their data resides in the specified geographic region.
- Expected impact: Compliance Readiness (+4 pts), Security (+2 pts).
- Affected qualities: Compliance Readiness, Security.
- Actionable: Yes

```markdown
Add automated tests to the tenant provisioning pipeline that verify Azure Blob Storage and SQL database locations match the requested `DataRegion`.
```

25. **Develop a framework for sharing custom policy packs**
- Why it matters: Encouraging tenants to author and share their own policy packs increases platform stickiness and value.
- Expected impact: Stickiness (+4 pts), Template and Accelerator Richness (+3 pts).
- Affected qualities: Stickiness, Template and Accelerator Richness.
- Actionable: Yes

```markdown
Design the API contracts and storage schema necessary to support an internal "Policy Pack Hub" where tenants can publish and subscribe to custom packs.
```

## Prompt Batching Guidance

- **Batch 1 (High Leverage, Low Risk):** 1, 3, 6, 11
- **Batch 2 (Performance & Observability):** 2, 5, 7, 9, 13
- **Batch 3 (UX & adoption):** 10, 15, 16, 22
- **Batch 4 (Architecture hygiene & Testing):** 8, 12, 14, 18, 21, 24
- **Batch 5 (Integrations — credential-dependent):** 4 (ServiceNow), 19
- **Batch 6 (Business Value & Stickiness):** 17, 20, 23, 25
- **Deferred / V1.1 program:** Azure CAF / landing-zone curated policy pack; bulk evidence upload above 30 files, ZIP expansion, recursive folder ingest; Stripe live keys / Marketplace.

## Marketing alignment

Sequential decisions so marketing ↔ technical V1 stay aligned. **Do not** duplicate these rows under **§ Pending technical questions** — that section is for technical / commercial-owner backlog only.

| # | Topic | Answer |
|---|--------|--------|
| 1 | Operator UI ↔ technical glossary (#27) — canonical buyer-facing labels vs API/internal terms | Primary work unit **Run** → UI **Review** (use *Architecture review* where space allows). Persist-golden-manifest action **Commit** → **Finalize review** / **Finalize** in context. **Manifest / golden manifest** → **Architecture snapshot** / **Snapshot** in tight UI. Graph screen → **Evidence graph**; route **`/graph`** unchanged. Internal/API: `RunRecord`, `POST .../commit`, `GoldenManifest`, `KnowledgeGraph` unchanged. Tooltip near finalize: replay/compare still allowed after lock. |
| 2 | Buyer-grade default architecture review export (DOCX/PDF sections matching landing narrative) | **COMPLETED (2026-05-17) — improvement #28.** DOCX + PDF with full section coverage; consultant whitelabel (firm name, engagement title, logo, attribution footer). Downloadable sample report unblocked for marketing. |
| 3 | Ship **default AI governance / landing-zone / security baseline policy packs** at V1 GA | **COMPLETED (2026-05-17) — improvement #29.** (**1**) AI governance / responsible AI MVP pack (NIST AI RMF + EU AI Act mapping only); (**2**) Security architecture baseline MVP pack (`sec-base-001`…`sec-base-030`). **Azure landing-zone / CAF-aligned** curated pack **remains deferred to V1.1** — must not imply bundled CAF pack in GA marketing copy. |
| 4 | **Bulk evidence upload** (mixed files → run evidence) — honesty bar for "capture scattered evidence" copy | **COMPLETED (2026-05-17) — improvement #27.** Bulk attach ships with hard **≤30-file** server ceiling. Landing / support / demo copy must disclose cap. Raising / removing limit, ZIP unpack, recursive folders → V1.1. |
| 5 | **Consultant / engagement report whitelabel** (cover branding for Upwork-style deliverables) | **COMPLETED (2026-05-17) — improvement #28** (same pipeline as row 2). Firm name, engagement title, optional logo (MIME + size caps), attribution footer. Upwork service listing copy unblocked. |
| 6 | Two **curated demo workspaces** (self-demo + synthetic regulated scenario) — V1 release gate | **COMPLETED (2026-05-17) — improvement #30.** Workspace A (self-demo / product tour) and Workspace B (`RegulatedScenarioWorkspaceSeed`) both pass automated Playwright smoke (`demo-workspace-b.smoke.spec.ts`). Release checklist gate cleared. |
| 7 | Landing **primary CTA** for first 90 days — hybrid posture | **COMPLETED (2026-05-17) — improvements #31 (CTA stack) + #32 (landing page content).** Request walkthrough (primary) / Try the self-demo — Workspace A deep-link (secondary) / Early access waitlist (tertiary). No public paid-pilot $ band in first 90 days. Full landing page hero, problem/solution, use cases, and proof section also shipped. |

---

## Pending technical questions for later

Technical / commercial-owner queue only. **Marketing ↔ product decisions** are recorded in **§ Marketing alignment** (table above), not duplicated here.

- **P4 — Stripe live keys + Marketplace publication:** **Defer** execution **until finance confirms** Partner Center readiness (seller verification, tax profile, payout/banking). **Next step:** Finance “go” → run improvement **#7** against billing/runbook checklists (e.g. **`docs/library/DEPLOYMENT_TERRAFORM.md`** and any Partner Center / Stripe cutover notes the team maintains).
- **P10 — ServiceNow developer instance + schemas:** **No** access **at this time**. **`V1` GA** bidirectional ServiceNow sync **remains in contract** (`V1_SCOPE.md` §2.13). Provisioning a **cost-free** **ServiceNow Developer Program** / personal developer-style instance for engineering (**#22**) **when available** — **paid** sandbox **not** a **`V1` GA** gate. **If** a **free** path cannot be obtained before a future GA decision, scope docs must be **explicitly** revised — do **not** silently drop **`V1` GA** claims.
