> **Scope:** Independent weighted quality assessment of ArchLucid as it stands in this repository on 2026-04-21. Weighted overall score: **67.61%**. Companion Cursor prompts: [`CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_67_61.md`](CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_67_61.md).

# ArchLucid Quality Assessment — 2026-04-21 — Weighted 67.61%

**Audience:** Product leadership, sponsoring exec, engineering leads, GTM owners.

**Method:** Each quality is scored 1–100 from independent inspection of the repository (source projects, Terraform stacks, docs, CI gates, runbooks, ADRs, templates, GTM material). Weights are taken from the request. The overall figure is `Σ(score × weight) ÷ Σ(weight × 100)`, where `Σ(weight)` for the supplied list is **100** — so the weighted percent doubles as a 0–100 scorecard.

**Ordering rule:** Sections appear **most-improvement-needed first**. "Improvement need" is `(100 − score) × weight` so a 60-point gap on a weight-8 quality outranks a 60-point gap on a weight-1 quality.

**Independence:** This file does not consult earlier `QUALITY_ASSESSMENT_*` files in this repo. Where my judgement happens to align with a previous one, that is convergent evidence, not citation.

---

## 0. Headline

| Bucket | Weight share | Sub-total contribution | Effective score for the bucket |
|--------|--------------|------------------------|---------------------------------|
| **Commercial** | 40 / 100 | **2,495 / 4,000** | 62.4% |
| **Enterprise** | 25 / 100 | **1,615 / 2,500** | 64.6% |
| **Engineering** | 35 / 100 | **2,651 / 3,500** | 75.7% |
| **Total** | 100 / 100 | **6,761 / 10,000** | **67.61%** |

**Plain-English read:** Engineering and operations are the strongest column. Trust, governance, and auditability are credible. The number is held down by **commercial proof** (no published reference customer, no live transactable Marketplace listing, no third-party pen test redacted summary, ROI evidence still modeled rather than measured) and by **organic adoption friction** (tool only embeds where Microsoft surfaces already exist).

---

## 1. Quality scores — ordered by improvement impact

For each quality I report the score, the weight, the **gap × weight** improvement-impact, justification grounded in repo evidence, the trade-off accepted by the current design, and a concrete recommendation. The eight largest improvements are also distilled into Cursor prompts in §3.

> Throughout, "the repo" means the source tree at `c:\ArchiForge\ArchiForge` on 2026-04-21.

---

### 1.1 Marketability — Score **58 / 100** · Weight **8** · Impact **336**

**Justification.** The pieces of a sellable narrative are present: an executive sponsor brief, a layered product packaging story (Core Pilot / Advanced Analysis / Enterprise Controls), an internal pricing philosophy with three tiers, a competitive landscape doc, a screenshot gallery, vertical briefs for five industries, a trust center, and a buyer-facing positioning page. What is **not** present is **external proof**: every row in `docs/go-to-market/reference-customers/README.md` is `Placeholder` or `Customer review`; there is no `Published` row, so the CI guard is still in advisory mode and the −15% reference-discount line in pricing is still notional. The marketing site is hostable (`https://archlucid.com`, `staging.archlucid.com`) but does not ship a price page or a "see this in 60 seconds" interactive demo of a real committed manifest from a recognisable logo.

**Trade-off.** The team consciously chose narrative honesty over inflation (sponsor brief explicitly refuses transformation claims). That protects long-term trust but caps short-term magnetism.

**Recommendation.**
1. Convert the **PLG row** in `reference-customers/README.md` to `Published` the day the first paying tenant approves copy — that single state change flips the CI guard to merge-blocking and is the moment marketability moves measurably.
2. Publish a **public price page** on the marketing site that mirrors the Team / Professional / Enterprise table in `PRICING_PHILOSOPHY.md` (gated behind owner decision item 13 in `PENDING_QUESTIONS.md`).
3. Promote `docs/DEMO_PREVIEW.md` (the cached anonymous commit page from ADR 0027) into a marketing-site `/see-it` route so anonymous visitors see a real committed manifest in under 30 seconds.

---

### 1.2 Adoption Friction — Score **58 / 100** · Weight **6** · Impact **252**

**Justification.** Evaluator friction is **low**: `docs/FIRST_30_MINUTES.md` is Docker-only, `archlucid try` is a single command, devcontainer boot does the same. Real **paid-adoption** friction is high: the trial signup design exists in `docs/go-to-market/TRIAL_AND_SIGNUP.md` but the production funnel requires DNS, Front Door, Stripe live keys, and Marketplace certification, **none of which are live yet** (per the Resolved + Still-open lists in `PENDING_QUESTIONS.md`). Operating ArchLucid in a customer's Azure also requires Entra app registration, Key Vault wiring, Container Apps deploy, and SQL provisioning — handled by Terraform stacks but not packaged as a single "buyer-runnable" path.

**Trade-off.** The repo deliberately does **not** ship customer-operated container bundles (Resolved 2026-04-21 in `PENDING_QUESTIONS.md`). That keeps the SaaS contract clean but means a customer who wants self-hosting must be turned away.

**Recommendation.**
1. Promote one Terraform stack alias — `infra/apply-saas.ps1` — into a documented *buyer-onboarding* path that takes a fresh subscription ID and produces a usable hosted ArchLucid in ≤ 60 minutes; today the stack composition is reference-grade but operator-focused.
2. Implement the **Trial signup flow** end-to-end behind a feature flag so `staging.archlucid.com/signup` works with Stripe test mode before the live keys arrive (item 9 in pending questions).
3. Ship a **CLI doctor pre-flight** that validates Entra, Key Vault, SQL, and Front Door before first run so the failure modes are surfaced once rather than during the pilot kickoff.

---

### 1.3 Time-to-Value — Score **70 / 100** · Weight **7** · Impact **210**

**Justification.** The "from clone to committed manifest" path is genuinely fast: `archlucid try` plus the simulator-agent demo give a sponsor-shareable Markdown first-value report within ~10 minutes locally, and the operator-shell post-commit banner can email a sponsor PDF straight from the run page. The **measurable** value (review-cycle hours saved) is computed by `ValueReportReviewCycleSectionFormatter` and surfaced in the value-report DOCX; baseline can be captured at trial signup. What's missing is **field-validated** time-to-value: the model is accurate to the implementation, but no real customer's hours-saved curve has been published.

**Trade-off.** The repo invests heavily in *the artifact that proves value* (manifest + delta + provenance) instead of in flashy first-touch UI; that is the right long-term investment but means the first-15-minutes wow factor depends on the sample preset.

**Recommendation.**
1. Add a **time-to-first-committed-manifest** metric on the tenant row, expose via Prometheus + first-value report, and quote it in the sponsor banner — it gives every customer a self-serve ROI narrative.
2. Pre-seed one **vertical-aligned sample run** per industry brief so the trial UX selects the user's vertical and shows industry-relevant findings within 90 seconds of signup.

---

### 1.4 Proof-of-ROI Readiness — Score **65 / 100** · Weight **5** · Impact **175**

**Justification.** The plumbing is here: `docs/PILOT_ROI_MODEL.md` defines the six measurement axes, `docs/go-to-market/ROI_MODEL.md` carries the dollar baseline (~$294K savings for a 6-architect team), the value-report DOCX renderer is shipped, and `EVIDENCE_PACK.md`/`REFERENCE_EVIDENCE_PACK_TEMPLATE.md` give a single-page measured-delta format. The gap is empirical: **zero customer-supplied baselines** are populated; every number quoted to a buyer is from the model.

**Trade-off.** Conservative model defaults are used when a baseline is missing — this avoids over-claim but also means the headline number looks identical for every buyer.

**Recommendation.**
1. Make `baselineReviewCycleHours` a **soft-required** field at trial signup (skippable but defaulted to "I don't know — use model"), then surface a **before / after delta panel** on the operator UI home for every tenant once at least one run has committed.
2. Publish a **sanitized aggregate ROI bulletin** quarterly (mean / p50 / p90 of measured deltas across all opt-in tenants), so prospects see real numbers without per-customer disclosure.

---

### 1.5 Differentiability — Score **60 / 100** · Weight **4** · Impact **160**

**Justification.** `COMPETITIVE_LANDSCAPE.md` makes a defensible claim: ArchLucid is the only candidate that combines AI agent orchestration with enterprise governance, auditability, and provenance for design-time architecture. The repo backs the claim with real artefacts (decision traces, golden manifests, replay, comparison drift, dual pipeline). What is **missing** is a **side-by-side artifact** a buyer can read in two minutes: "this is the package ArchLucid hands an architecture review board; here is what LeanIX or Ardoq would have handed them for the same input."

**Trade-off.** The team has wisely refused to write competitor takedowns from the seat of the pants — but that leaves the differentiation buried in product behaviour rather than visible at the top of the funnel.

**Recommendation.**
1. Build a **`/why-archlucid`** page that walks through one full sample manifest + decision-trace + comparison-drift screenshot trio and labels every artefact with "incumbents do not produce this".
2. Publish one **demo run snapshot** as a static, link-shareable artefact (cached anonymous commit page from ADR 0027) and put the URL on every sales asset.

---

### 1.6 Trustworthiness — Score **55 / 100** · Weight **3** · Impact **135**

**Justification.** The repo is honest: SOC 2 deferred, owner-led security self-assessment, pen test SoW awarded but not yet executed, no published redacted summary, no PGP key on `security@archlucid.dev`. Procurement-grade documents (CAIQ Lite, SIG Core, DPA template, subprocessors list) are pre-filled. Engineering-side trust signals are strong: RLS with `SESSION_CONTEXT`, append-only `dbo.AuditEvents`, fail-closed API key default, ZAP + Schemathesis in CI, prompt redaction. The remaining gap is the **independent-third-party signal** — a SOC 2 attestation, an executed pen test, and at least one named reference logo.

**Trade-off.** The team has chosen to **not** brand the self-assessment as a pen test. That is the right ethical choice but loses the marketing line buyers want.

**Recommendation.**
1. **Execute the awarded pen test** (Aeronova SoW), publish the redacted summary into `pen-test-summaries/2026-Q2-REDACTED-SUMMARY.md`, call `POST /v1/admin/security-trust/publications` so the badge appears on `/security-trust`. This single deliverable moves the score by ~10 points.
2. Generate the **PGP key** for `security@archlucid.dev` and drop the public key into `archlucid-ui/public/.well-known/pgp-key.txt` — the CI guard turns green automatically.
3. Either commit a SOC 2 Type I observation-period start date or replace the SOC 2 references on the marketing site with a clear "interim self-assessment, attestation roadmap on request" treatment.

---

### 1.7 Workflow Embeddedness — Score **58 / 100** · Weight **3** · Impact **126**

**Justification.** GitHub Action and Azure DevOps task for manifest delta are shipped (`integrations/github-action-manifest-delta/`, `integrations/azure-devops-task-manifest-delta/`); five Logic Apps Standard workflows are templated under `infra/terraform-logicapps/workflows/`. Service Bus + AsyncAPI + webhooks are documented. **ServiceNow and Confluence are explicitly out of scope** (Resolved 2026-04-21). That is a defensible product call but it concentrates embeddedness in the Microsoft ecosystem only — every non-Microsoft shop is therefore reliant on REST-and-webhook glue.

**Trade-off.** Ecosystem focus reduces surface area but also reduces total addressable market.

**Recommendation.**
1. Ship a **Microsoft Teams notification connector** as the next anchor (item 11 in pending questions) — it sits naturally on top of the existing webhook pipeline and the Logic Apps standard pattern; it is the single highest-traffic Microsoft surface ArchLucid does not yet land in.
2. Stand up a **public integration catalog page** (`docs/go-to-market/INTEGRATION_CATALOG.md` is internal) on the marketing site, with explicit "we do not currently integrate with X / Y / Z" so prospects self-disqualify without taking an SE call.
3. Document a **REST + webhook recipe** for one common non-Microsoft target (Slack or Jira) using only what already ships — proves the product is open even where the first-party connector isn't.

---

### 1.8 Correctness — Score **72 / 100** · Weight **4** · Impact **112**

**Justification.** Coverage gates are real: `.github/workflows/ci.yml` enforces **79% line / 63% branch** on the merged report and **63% line on product packages**, and Schemathesis hits the OpenAPI surface. There are 21 test projects — every domain assembly has a paired `.Tests`. Mutation testing is on a ratchet (`docs/STRYKER_RATchet_TARGET_72.md`). Contract tests cover both the coordinator and authority interface families separately. What I cannot verify from a code read alone is **field correctness on ambiguous architecture inputs** — i.e. the LLM-driven path will sometimes produce a finding that a senior architect would dispute, and we have no public golden-cohort drift report yet.

**Trade-off.** Heavy structural testing buys regression confidence but does not prove the AI agents make the right call on a novel input.

**Recommendation.**
1. Land the **golden-cohort nightly drift run** (item 15 in pending questions) — it converts "the engine still passes its unit tests" into "the engine still produces the same answers on a fixed corpus".
2. Add a **finding-quality feedback loop** in the operator UI (thumbs-up/down per finding, persisted with run ID) and surface aggregate scores in the value report.

---

### 1.9 Executive Value Visibility — Score **72 / 100** · Weight **4** · Impact **112**

**Justification.** Sponsor banner on run-detail, sponsor PDF endpoint, value-report DOCX, sponsor one-pager, executive sponsor brief, "Day N since first commit" badge — the artefacts a sponsor needs are all here and reachable from the operator UI. The remaining gap is that the artefacts are **per-run** and **on demand**: there is no recurring, sponsor-addressed digest that arrives in a sponsor's inbox monthly without an operator pressing a button.

**Recommendation.**
1. Wire the existing **digest subscription** plumbing (operator UI shows a `digest-subscriptions` page) to a **monthly executive digest** preset that includes the value-report DOCX numbers, no operator action required.
2. Add a **board-pack PDF** template that consolidates the last quarter's runs, governance approvals, and review-cycle deltas into a single deck.

---

### 1.10 Usability — Score **65 / 100** · Weight **3** · Impact **105**

**Justification.** Operator UI is organised around a clear three-tier model (Core Pilot / Advanced Analysis / Enterprise Controls) with progressive disclosure, role-aware shaping via `/api/auth/me`, keyboard shortcut provider, breadcrumbs, an onboarding wizard, and a help panel. Vitest seam tests guard the layering. What I cannot evaluate from the repo: **task-completion rates with real users**. The total surface area is large (≥ 50 routes under `(operator)`), which raises the bar for a first-time user.

**Recommendation.**
1. Add a **task-success telemetry signal** (e.g. "first run committed within session") and chart it in the operator dashboard so we see actual usability rather than inferring it.
2. Run **moderated usability sessions** with the design partner pipeline (currently `Customer review`) before the next minor release.

---

### 1.11 Architectural Integrity — Score **65 / 100** · Weight **3** · Impact **105**

**Justification.** The two persistence families (`Persistence.Data.*` for the run / commit / agent workflow, the rest of `Persistence` for authority and decisioning) are **coherent and documented** (`ARCHITECTURE_COMPONENTS.md`, ADRs 0002 / 0010 / 0021 / 0022), but they are still two parallel families: there are two `IGoldenManifestRepository` interfaces and two `IDecisionTraceRepository` interfaces resolved by fully-qualified type names. ADR 0021 names a strangler plan; ADR 0022 marks coordinator Phase 3 as deferred. That is the right pragmatic call, but every new engineer has to be taught the dual map before they can navigate the codebase.

**Trade-off.** Convergence is hard, partial convergence avoids breaking changes — but the cost shows up in cognitive load and architectural-integrity scores until the strangler completes.

**Recommendation.**
1. Pick a **named completion date** for the ADR 0021 strangler and gate it on a CI check that fails when both interface families are still referenced from the same compose root.
2. Until then, ship a **`docs/ARCHITECTURE_COORDINATOR_VS_AUTHORITY_NAVIGATOR.md`** that maps every dual interface to "use this one when…" rules — `DUAL_PIPELINE_NAVIGATOR.md` is close but optimised for runtime flow, not for choosing an interface.

---

### 1.12 Decision Velocity — Score **50 / 100** · Weight **2** · Impact **100**

**Justification.** Pricing is fully described internally but not published (Resolved item 13 in pending questions still defers public publication). Marketplace listing is not live (item 8). Stripe is wired but production go-live policy decisions remain owner-only (item 9). Every prospect therefore needs at least one human conversation to learn the price.

**Recommendation.**
1. Publish the price page; ship the Marketplace listing; flip Stripe to live keys behind a feature flag — this is the single biggest short-term lever for decision velocity.
2. Until then, add a **`/pricing`** quote-on-request form on the marketing site that auto-emails the order-form template — at least it removes a calendar round-trip.

---

### 1.13 Compliance Readiness — Score **50 / 100** · Weight **2** · Impact **100**

**Justification.** GDPR DPA template, subprocessors list, CAIQ Lite, SIG Core, RLS posture, audit catalog — all present. **No certification yet** (SOC 2 deferred, no ISO 27001, no FedRAMP). The five vertical policy packs (financial-services, healthcare, retail, saas, public-sector) are functional accelerators rather than compliance certifications.

**Recommendation.**
1. Publish a **clear "Where ArchLucid is in the compliance journey"** page (interim self-assessment, attestation roadmap, what is and is not in scope) — buyers want to see the picture, not chase artefacts.
2. Add a **HIPAA-aligned vertical policy pack** if any healthcare prospect surfaces — the template already exists.

---

### 1.14 Security — Score **70 / 100** · Weight **3** · Impact **90**

**Justification.** RLS with `SESSION_CONTEXT`, fail-closed API keys, JwtBearer + Entra, ZAP baseline, Schemathesis, prompt redaction, threat models (system + Ask/RAG), Key Vault, gitleaks pre-receive, never-expose-SMB rule. **No external pen test executed**, **no PGP key**, **SOC 2 not attested**. Engineering security is solid; external assurance is light.

**Recommendation.**
1. Execute the awarded pen test (see §1.6), publish the redacted summary, generate the PGP key.
2. Add **automated dependency-vulnerability gating** on the Directory.Packages.props (Dependabot is likely on; verify `.github/dependabot.yml`).

---

### 1.15 Commercial Packaging Readiness — Score **55 / 100** · Weight **2** · Impact **90**

**Justification.** Three named tiers, single source of truth on prices, order-form template, DPA, SLA summary, subprocessors, Stripe abstraction (ADR 0016), Marketplace alignment doc, packaging layer enforcement plan. **Listing not live, Stripe not in prod.**

**Recommendation.** Same lever as §1.12: ship Marketplace + Stripe live before any new packaging change.

---

### 1.16 Procurement Readiness — Score **58 / 100** · Weight **2** · Impact **84**

**Justification.** All the buyer-facing legal artefacts are pre-drafted (DPA, MSA implied via order form, SLA, subprocessors, Trust Center, Operational Transparency, Incident Communications Policy, Tenant Isolation, Multi-Tenant RLS, Pen Test SoW). What's missing for "real" procurement is the **executed third-party pen test summary** and a **vendor security questionnaire portal** (today the answers live in markdown, which most procurement teams will not accept as a deliverable).

**Recommendation.**
1. Stand up a **`/security-trust/questionnaires`** page that exposes pre-filled CAIQ and SIG as downloadable XLSX, generated from the markdown source.
2. Once the pen test summary is published, add a **request-access form** so prospects can NDA-gate full document delivery — many enterprise buyers will not send a procurement vendor through without it.

---

### 1.17 Interoperability — Score **60 / 100** · Weight **2** · Impact **80**

**Justification.** OpenAPI + AsyncAPI + GitHub Action + ADO Task + Service Bus integration events + JSON Schemas under `schemas/integration-events/` + webhook delivery with HMAC. No first-party Slack / Jira / Confluence / ServiceNow connectors (out-of-scope by design). Public API client `ArchLucid.Api.Client` is a real shipped artefact.

**Recommendation.**
1. Add a **language-coverage line** on the integration catalog page — today only C# client is published; a typed TypeScript client generated from the OpenAPI would unlock the Node ecosystem cheaply.
2. Document the **webhook signature scheme** prominently so partners can integrate without a portal.

---

### 1.18 Traceability — Score **80 / 100** · Weight **3** · Impact **60**

Strong: W3C trace IDs persisted on runs, decision traces, audit catalog, OTel `ActivitySource`s for `AuthorityRun`, `AdvisoryScan`, `RetrievalIndex`, `Agent.Handler`, `Agent.LlmCompletion`, integration / retrieval outboxes. Improvement: surface trace IDs to operators directly on every page footer and in the support bundle.

---

### 1.19 Policy and Governance Alignment — Score **70 / 100** · Weight **2** · Impact **60**

Five vertical policy packs, governance approval workflow, segregation of duties at Pro/Enterprise tiers, Logic Apps governance routing template. Improvement: ship a **policy-pack authoring tool** in the operator UI rather than requiring JSON edits.

---

### 1.20 Reliability — Score **70 / 100** · Weight **2** · Impact **60**

99.5% SLO, Prometheus rules, Application Insights, geo-failover drill runbook, canary deployment runbook, secondary region in `terraform-container-apps/secondary_region.tf`. No published RTO/RPO measurement; `RTO_RPO_TARGETS.md` is target-only.

---

### 1.21 Maintainability — Score **70 / 100** · Weight **2** · Impact **60**

C# 12 conventions enforced via house rules (primary ctors, expression-bodied members, single-class-per-file, terse guard clauses), 21 test projects, ADRs, packaging boundary CI guards. Friction: project count is large enough that build times and CI matrix complexity are real costs.

---

### 1.22 Data Consistency — Score **72 / 100** · Weight **2** · Impact **56**

Transactional outbox (ADR 0004), append-only audit, RLS, DbUp migrations, single SQL DDL master script, dual-write strangler under controlled rules. Backfill processes documented (`SqlRelationalBackfill.md`).

---

### 1.23 Explainability — Score **72 / 100** · Weight **2** · Impact **56**

Decision traces, agent activity sources, manifest comparison + replay, run trace viewer link in UI. Improvement: a **per-finding "explain this"** affordance that surfaces the agent prompt, the LLM completion (redacted), and the supporting evidence in one panel.

---

### 1.24 Cognitive Load — Score **45 / 100** · Weight **1** · Impact **55**

This is the **single lowest engineering score**. Evidence: 384 docs files, 35 runbooks, 25 ADRs, 21 test projects, 18+ Terraform stacks, dual persistence interface families, layered UI shaping with Vitest seam tests guarding the layering. Each of those is individually justified; together they make the codebase intimidating to a new engineer. Improvement: invest in **navigation files** (`docs/SYSTEM_MAP.md` is the right shape — extend it) and prune archived material out of the live `docs/` root.

---

### 1.25 AI / Agent Readiness — Score **75 / 100** · Weight **2** · Impact **50**

`AgentRuntime` project, `RealAgentExecutor`, agent simulator, LLM completion pipeline ADR 0005, Azure OpenAI Terraform module, prompt redaction, telemetry on `Agent.Handler` and `Agent.LlmCompletion` ActivitySources. Solid.

---

### 1.26 Azure Compatibility and SaaS Deployment Readiness — Score **78 / 100** · Weight **2** · Impact **44**

18+ Terraform stacks: container-apps, sql-failover, openai, keyvault, edge (Front Door + WAF), entra, monitoring (App Insights + Prometheus rules + Grafana dashboards), private endpoints, service bus, logicapps, storage, otel-collector, orchestrator. Front Door routes for marketing and SaaS, secondary region wired. The remaining gap is the **live transactable Marketplace listing** and the activated production subscription (id is recorded; secrets need owner action).

---

### 1.27 Stickiness — Score **60 / 100** · Weight **1** · Impact **40**

Versioned manifests, append-only audit, governance workflow tied to a tenant, value-report DOCX with quarter-on-quarter trend potential. Stickiness will be **structurally** strong once a customer has six months of committed manifests; today it is unproven because there are no customers with six months of manifests.

---

### 1.28 Auditability — Score **80 / 100** · Weight **2** · Impact **40**

Append-only `dbo.AuditEvents`, typed event catalog with CI-tracked count (`AUDIT_COVERAGE_MATRIX.md`), correlation IDs, retention tiered by package. Strong.

---

### 1.29 Customer Self-Sufficiency — Score **65 / 100** · Weight **1** · Impact **35**

35 runbooks, troubleshooting doc, support-bundle CLI command, doctor command, deep API contract docs, OpenAPI. The challenge is **discoverability** — a customer must know the doc exists before they can self-serve.

---

### 1.30 Performance — Score **65 / 100** · Weight **1** · Impact **35**

Cold-start trimming docs, `LOAD_TEST_BASELINE.md`, performance docs, caching decorators on repositories, read-replica config. No published p99 latency budgets per endpoint.

---

### 1.31 Cost-Effectiveness — Score **65 / 100** · Weight **1** · Impact **35**

Per-tenant cost model, pilot profile, capacity-and-cost playbook, consumption budgets in Terraform. Customer-visible cost reporting is internal only.

---

### 1.32 Template and Accelerator Richness — Score **70 / 100** · Weight **1** · Impact **30**

Five vertical briefs, five compliance rule packs, five governance policy packs, one finding-engine template, one API endpoint template, exec-digest email templates. Solid for a V1.

---

### 1.33 Accessibility — Score **70 / 100** · Weight **1** · Impact **30**

WCAG 2.1 AA target, axe Playwright gates, eslint-plugin-jsx-a11y, Radix Alert Dialog for destructive actions, ARIA live region on run progress tracker. No published VPAT.

---

### 1.34 Change Impact Clarity — Score **70 / 100** · Weight **1** · Impact **30**

Run comparison, replay, drift analysis, manifest delta, GitHub PR comment integration, ADO PR comment integration. Strong UI affordance for "what changed".

---

### 1.35 Availability — Score **70 / 100** · Weight **1** · Impact **30**

99.5% SLO, secondary region, geo-failover drill, canary. Untested at customer scale.

---

### 1.36 Scalability — Score **70 / 100** · Weight **1** · Impact **30**

Container Apps + Service Bus + outbox + caching + read-scale-out. Container Apps Jobs (ADR 0018) for background. Untested at customer scale.

---

### 1.37 Manageability — Score **70 / 100** · Weight **1** · Impact **30**

Configuration safety rules (`ArchLucidConfigurationRules.CollectProductionSafetyErrors`), feature flags, rate-limit policies, environment tiers, fail-closed startup.

---

### 1.38 Extensibility — Score **70 / 100** · Weight **1** · Impact **30**

Finding-engine plugin template, API endpoint template, public client library, OpenAPI + AsyncAPI.

---

### 1.39 Evolvability — Score **70 / 100** · Weight **1** · Impact **30**

ADRs, breaking-changes doc, changelog, strangler patterns, packaging-boundary enforcement plan.

---

### 1.40 Deployability — Score **78 / 100** · Weight **1** · Impact **22**

`docker compose`, devcontainer, Terraform, GitHub Actions CI/CD, `archlucid pilot up`, blue/green hooks. Strong.

---

### 1.41 Observability — Score **78 / 100** · Weight **1** · Impact **22**

OTel + Prometheus scraping endpoint + Grafana dashboards + custom `Meter` + `ActivitySource`s + Application Insights Terraform module. Strong.

---

### 1.42 Documentation — Score **78 / 100** · Weight **1** · Impact **22**

384 docs files, 35 runbooks, 25 ADRs, daily onboarding tracks per persona, scope-line discipline. The cognitive-load cost is real (see §1.24) but the depth is exceptional.

---

### 1.43 Supportability — Score **80 / 100** · Weight **1** · Impact **20**

`support-bundle --zip`, `doctor`, correlation IDs, runbooks, troubleshooting doc, CLI diagnostics. Strong.

---

### 1.44 Testability — Score **80 / 100** · Weight **1** · Impact **20**

21 test projects, contract tests, mutation tests, Schemathesis, ZAP, Playwright, Vitest seam tests, deterministic mocks for E2E.

---

### 1.45 Modularity — Score **80 / 100** · Weight **1** · Impact **20**

Single-class-per-file rule, primary constructors, terse C#, clearly bounded projects. Almost too modular (see Cognitive Load).

---

### 1.46 Azure Ecosystem Fit — Score **85 / 100** · Weight **1** · Impact **15**

Entra, Azure SQL, Service Bus, Azure OpenAI, Container Apps, Front Door + WAF, Key Vault, App Insights, Log Analytics, Logic Apps Standard, Storage with private endpoints. ADR 0020 makes Azure-primary explicit and permanent.

---

## 2. Summary lists

### 2.1 Top 10 most important weaknesses

1. **No published reference customer** — every row in `reference-customers/README.md` is `Placeholder` or `Customer review`. Caps marketability, trustworthiness, and pricing power.
2. **Live transactable Marketplace listing not yet shipped** — caps decision velocity, commercial packaging, procurement.
3. **External pen test not yet executed and published** — caps trustworthiness, security, and procurement.
4. **No measured customer ROI evidence** — only modelled numbers, so proof-of-ROI tops out at "credible model".
5. **Differentiation is buried in product behaviour, not in marketing** — the unique value (AI orchestration + governance + provenance) is not surfaced as a one-page side-by-side.
6. **Workflow embeddedness is Microsoft-only by design** — leaves non-Microsoft shops to glue with REST/webhooks.
7. **Dual coordinator/authority interface families** — coherent but heavy; ADR 0021 strangler not yet completed.
8. **Cognitive load** — 384 docs / 35 runbooks / 25 ADRs / 21 test projects / 18+ Terraform stacks raise the bar for new engineers and customer self-service.
9. **No SOC 2 attestation date** — interim self-assessment is honest but enterprise procurement will keep asking.
10. **Trial signup, Stripe production, and price page are not live yet** — every paying customer still needs a human conversation.

### 2.2 Top 5 monetization blockers

1. No published reference customer.
2. No live Azure Marketplace transactable listing.
3. No public price page.
4. Stripe live keys not in production.
5. No measured customer ROI bulletin / case study.

### 2.3 Top 5 enterprise adoption blockers

1. No SOC 2 attestation, no third-party pen test summary published.
2. No first-party Microsoft Teams / non-Microsoft (Slack / Jira) connector.
3. Procurement-grade questionnaires only delivered as markdown.
4. Customer-side onboarding to Azure (Entra app reg, Key Vault, Container Apps deploy) is reference-grade but not packaged as a buyer-runnable path.
5. PGP key for `security@archlucid.dev` not generated, signalling "young program" to security reviewers.

### 2.4 Top 5 engineering risks

1. **Strangler debt (ADR 0021/0022)** — the longer dual interface families coexist, the higher the chance a regression slips between the families.
2. **No golden-cohort drift detection on the AI agents** — engine correctness on novel inputs is unmeasured.
3. **Single primary region in the active stack** — `terraform-container-apps/secondary_region.tf` exists but real geo-failover behaviour at customer scale is untested.
4. **Cognitive load makes onboarding new engineers slow** — every new dev costs more weeks-to-productivity than peer products at this stage.
5. **Cost trajectory of LLM calls under real customer load is modelled but not measured** — the per-tenant cost model is internal projection.

### 2.5 Most Important Truth

**ArchLucid is engineered ahead of its evidence.** The product, infrastructure, security posture, and supporting documentation have been built to enterprise-SaaS standards — and the score reflects that. Every meaningful upside from here comes from **producing the first piece of external proof**: one published reference customer, one executed pen test summary, one live Marketplace listing, one measured ROI bulletin. None of those are engineering problems. They are scheduling, sales, and budget problems. Until they exist, the buyer's question — *"who else uses this and what did it actually do for them?"* — has no answer, and that single missing answer is what holds the weighted score under 70.

---

## 3. Eight best improvements

These are the eight changes that would move the weighted score the most per unit of effort. Cursor prompts for each are in [`CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_67_61.md`](CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21_67_61.md).

| # | Improvement | Primary qualities lifted | Why now |
|---|-------------|---------------------------|---------|
| 1 | Convert the PLG row in `reference-customers/README.md` to `Published` (assets + CI flip + marketing site) | Marketability, Trustworthiness, Stickiness | Largest single lever; CI guard is already built. |
| 2 | Execute the awarded pen test, publish the redacted summary, generate the PGP key | Trustworthiness, Security, Compliance, Procurement | Procurement-grade artefact; SoW already awarded. |
| 3 | Ship the Azure Marketplace SaaS offer + flip Stripe to live | Decision Velocity, Commercial Packaging, Procurement | Removes the human-in-the-loop from every paid signup. |
| 4 | Build a public `/why-archlucid` differentiation page anchored on a real cached anonymous-commit demo | Differentiability, Marketability, Time-to-Value | Surfaces the unique product behaviour above the fold. |
| 5 | Trial signup live (hosted funnel + tenant provisioning + sample run on signup + email digest) | Adoption Friction, Time-to-Value, Proof-of-ROI | Removes every blocker between a curious prospect and a working tenant. |
| 6 | Microsoft Teams notification connector (next anchor after GitHub / ADO manifest delta) | Workflow Embeddedness, Stickiness | Highest-traffic Microsoft surface ArchLucid does not yet land in. |
| 7 | Complete the ADR 0021 coordinator strangler and add a CI guard against dual-family coexistence | Architectural Integrity, Cognitive Load, Maintainability | Pays down the largest piece of structural debt. |
| 8 | Land the golden-cohort nightly drift run + per-finding "explain this" panel | Correctness, Explainability, AI/Agent Readiness | Converts unit-test correctness into engine-quality correctness. |

---

## 4. Pending owner questions surfaced by this assessment

The following items came out of this assessment and **cannot be resolved from the repository alone**. They are appended to `docs/PENDING_QUESTIONS.md` for the next session.

1. **Reference-customer publication owner and re-rate trigger** — who graduates the first row from `Customer review` to `Published`, and on what evidence? (Already partially in pending question 7, but specifically tied to Improvement 1.)
2. **Public price page publication** — publish the Team / Pro / Enterprise table on the marketing site at the same moment the Marketplace listing goes live, or stay quote-on-request? (Pending question 13.)
3. **Marketplace go-live date** — Partner Center seller verification, tax profile, payout account, and webhook URL ownership. (Pending question 8.)
4. **Stripe live-mode go-live date and chargeback / refund policy text.** (Pending question 9.)
5. **Pen-test execution window for Aeronova SoW** — and the customer-shareable redacted summary review owner.
6. **PGP key custodianship for `security@archlucid.dev`.** (Pending question 10.)
7. **Microsoft Teams connector scope** — notification-only first, or two-way (approve a governance request from Teams)?
8. **ADR 0021 strangler completion target date** — is this an owner-time or engineering-time call?
9. **Golden-cohort nightly drift LLM budget** — Azure OpenAI deployment + estimated monthly token spend. (Pending question 15.)
10. **VPAT publication decision** — produce a formal VPAT for accessibility, or stay with the WCAG 2.1 AA self-attestation in `ACCESSIBILITY.md`? (Related to pending question 12.)

When you next ask "what pending questions do you have?", the canonical answer is `docs/PENDING_QUESTIONS.md` plus this list.
