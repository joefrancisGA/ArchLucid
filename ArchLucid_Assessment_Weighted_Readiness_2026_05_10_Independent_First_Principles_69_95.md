# ArchLucid Assessment – Weighted Readiness 70.13%

**Date:** 2026-05-10
**Method:** Independent first-principles assessment from repository materials **and** documented owner-declared posture where it corrects factual gaps versus the repo snapshot (below: **Azure OpenAI / real-mode**). Scores reflect **breadth of evidence and product maturity**, not absence of infra you have already provisioned.
**Scoring basis:** 47 qualities, 112 total weight points, scores 1–100 per quality
**Deferred-scope policy:** Items explicitly deferred to V1.1/V2 per `V1_SCOPE.md` and `V1_DEFERRED.md` are not penalized

**Product boundary (this assessment revision):** Customer delivery is **hosted SaaS only**. **Self-hosted** installs and an **open-source contributor** community are **not in scope** here. Local Docker / .NET tooling in the repo refers to **engineering** build and test workflows, not to a parallel buyer motion.

**Buyer-perception policy (this assessment):** **Single-vendor risk** (concern that the product comes from one company or a small engineering team) is **not** treated as a defect against headline readiness **`(A)`** and was **not** used to lower any quality score. Organizational scale optics belong only in optional **`(B)`** procurement-realism narrative, with **zero weight** on **`(A)`**, when explicitly labeled.

**Participant usability-study policy (this assessment):** Absence of scheduled **usability testing with 3–5 enterprise architects** (or comparable qualitative user research) is **not** treated as a headline readiness defect for **`(A)`** — parallel to assistive-technology research not being a **`V1_SCOPE` / `V1_DEFERRED`** gate in workspace assessment rules. **`(A)` Usability** reflects product affordances (patterns, progressive disclosure, a11y automation, onboarding), not recruiting-led studies. Optional sessions belong in **`(B)`** buyer-experience realism only, with **zero weight** on **`(A)`**.

**Custom agent-handler documentation policy (this assessment):** There is **no** customer-facing “how to add a **custom agent handler**” walkthrough for **V1** or **V1.1**; that narrative is **`V2` per `V1_SCOPE.md` §3 and `V1_DEFERRED.md` §6h**. **`(A)` headline readiness is not lowered** for this gap.

**Hosted trial — `V1` → `V1.1` migration documentation policy (this assessment):** A consolidated **tenant-facing migration / expectations narrative** for **existing hosted trials** at the **`V1` → `V1.1`** boundary is **`V1.1` documentation scope (`V1_SCOPE.md` §3, `V1_DEFERRED.md` §6i)**. **`(A)` V1 headline readiness is not lowered** for its absence (no Evolvability, Documentation, or Adoption Friction **`V1` penalty** on that basis).

**Cost-Effectiveness definition (this assessment):** **`§2.46 Cost-Effectiveness` is anchored on vendor economics** — your **hosted-service COGS and capacity discipline** (LLM token spend, caching and quotas protecting margin and reliability, infra cost signals in IaC/runbooks). **Buyer- or tenant-visible** cost transparency **may** reinforce the score (budget UX, procurement-friendly ranges) **but is not the primary definitional lens** unless the pillar text explicitly says otherwise.

**Production-customer policy (this assessment):** **Absence of a buyer tenant running ArchLucid in sustained “production workload” steady state** (`(A)` / `V1_SCOPE` terminology: no **shipping** prerequisite that such a tenant exist for **V1 GA headline readiness**) is **not treated as lowering any `V1` `(A)` quality score**. **Measured outcomes, pipeline proof, procurement lived experience, and peer validation** tied to eventual production adoption belong in **`(B)` market-motion / pipeline realism** (zero weight on **`(A)`**) alongside **`V1_DEFERRED.md` §6b** reference-customer **`V1.1`** posture — **without** implying **`V1` product/engineering completeness requires an external production logo**.

**Azure OpenAI / real-mode posture (owner-declared — this assessment revision):** A **development** Azure AI / Foundry-hosted OpenAI endpoint is provisioned (**resource `oai-archlucid-dev`**, canonical chat deployment **`gpt-4o`**, base URL shape `https://oai-archlucid-dev.services.ai.azure.com/...`). The repo wires **optional** gated CI (`ARCHLUCID_CI_REAL_AOAI_ENDPOINT`, `ARCHLUCID_CI_REAL_AOAI_KEY`, `ARCHLUCID_CI_REAL_AOAI_*`) and local **user secrets** for real mode (`AzureOpenAI:*`, `AgentExecution:Mode`). **Credibility gaps in §2.1 / §2.2 / §4 / §7 are therefore framed as empirical breadth (golden cohort expansion, drift measurement, logged outcomes) — not “no AOAI credentials.”**

---

## 1. Executive Summary

### Overall Readiness

ArchLucid is a serious, architecturally coherent product with genuine technical depth. The core pipeline (request → execute → commit → manifest → artifacts) works, the domain model is well-decomposed across ~30 .NET projects, the operator UI is progressive and accessibility-aware, and the documentation corpus is extraordinarily thorough. The 70.13% weighted readiness reflects a product that is **engineering-strong and commercially early** — the machinery works, but the connective tissue that turns a working system into a revenue-generating product (customer workflow integration, proof of real-world value, buyer self-sufficiency) has gaps that this document **scores as `V1` / `V1.1` / engineering obligations** independently of **`(B)` tenancy proof**. **`Absence of a steady-state buyer production tenant does not deduct `V1` `(A)`** (**header production-customer policy**); **market-motion / pipeline narratives** absorb that realism when explicitly labeled **`(B)`**.

### Commercial Picture

The product has clear positioning (AI-assisted architecture workflow) and a differentiated angle (manifest-first, governance-grade evidence). Pricing philosophy, ROI model, and procurement pack exist in detail. **`(B)` realism:** outbound **market proof** trails a mature SaaS incumbent — **not** counted as a **`V1` `(A)` deficit** absent a production buyer (**header production-customer policy**); **engineering/shipping gaps** cited elsewhere (trial funnel TEST mode today, ITSM connectors still being built for **`V1` GA commitments**, live commerce **`V1.1`**) are evaluated on **`V1` / `V1.1` contract** terms. The commercial picture is *prepared*; **pipeline evidence** catches up through motion, not via lowering **`V1` `(A)`** solely because no tenant labels production yet.

### Enterprise Picture

Enterprise trust infrastructure is unusually mature for a product at this maturity stage: CAIQ/SIG pre-fills, DPA template, SOC 2 self-assessment, STRIDE threat model, 78 typed audit events, RBAC with four roles, RLS, SCIM 2.0. **Workflow-integration shipping debt** (`V1`-committed ITSM depth, bidirectional sync in-flight vs outbound create) remains the enterprise **engineering gap** — articulated without treating **“no production customer yet”** as a **`V1` `(A)` penalty** (**header production-customer policy**). **`(B)` realism:** eventual cadence-threading proof will matter for pipeline narrative. **Hosted SaaS operators** do not stand up ArchLucid’s backing services; sophistication is about interpreting outputs, aligning workforce identity, and navigating Operate-layer capabilities. Operational deployment and platform hardening are **vendor** responsibilities on this motion.

### Engineering Picture

Engineering quality is the strongest pillar. The solution has 30+ projects with clean dependency boundaries, Dapper-over-EF persistence, DbUp migrations, FsCheck property-based tests, OWASP ZAP and Schemathesis in CI, OpenAPI contract snapshot testing, Stryker mutation testing, golden cohort LLM evaluation, architecture fitness tests, and 114 Terraform files across 15+ modules. Agent runtime includes circuit breakers, token budgets, content safety guards, caching, cost estimation, and quality gates with LLM semantic judges. **Real Azure OpenAI execution is supported and provisioned on the dev footprint** (**header Azure OpenAI / real-mode posture**); default developer and most CI surfaces still emphasize **simulator mode** for speed and cost — so the primary engineering tension is **empirical grounding at scale**: correctness of AI-generated outputs in novel real-world contexts, incomplete ITSM connector implementation, **thin systematically committed breadth** of real-mode golden cohort + drift characterization versus production-scale diversity of inputs (**not** lack of AOAI infra).

---

## 2. Weighted Quality Assessment

Qualities ordered by **weighted deficiency** (weight × (100 − score)), most urgent first.

### 2.1 Correctness
- **Score:** 72 | **Weight:** 8 | **Weighted deficiency:** 224
- **Justification:** The core pipeline produces structured manifests, findings, and artifacts. Schema validation, decision traces, typed findings, and property-based tests (FsCheck) provide structural correctness. Agent output quality gates with heuristic and LLM semantic judges catch low-quality completions. Golden cohort evidence exists. However, "correctness" for an AI architecture advisor means the *recommendations are actually right* — and empirical grounding is **still thin**: **little independent/external review** of finding accuracy versus diverse enterprise architectures outside the authoring org, simulator mode (**most CI**) produces deterministic façades over real-model behavior, and **real-Azure-OpenAI** golden cohort **breadth and published drift-vs-simulator characterization** lag what the infrastructure already permits (**header Azure OpenAI / real-mode posture** — AOAI dev resource + gated CI hooks exist). **`(A)` is not lowered** solely because **no buyer steady-state production tenant** exists (**header production-customer policy**); uncertainty here is **evidence-shape and model-fidelity**, not tenancy counting or missing AOAI endpoint access.
- **Tradeoffs:** Simulator-first testing enables fast CI but masks real LLM failure modes (hallucination, context window drift, prompt sensitivity). Golden cohort and optional real-mode CI attempt to bridge this; expand committed real-mode corpus and drift reports to tighten confidence.
- **Improvements:** Run golden cohort against diverse real architecture briefs; establish a correctness benchmark with expert-reviewed outputs; add drift detection between simulator and real-LLM outputs for the same inputs.

### 2.2 AI/Agent Readiness
- **Score:** 75 | **Weight:** 8 | **Weighted deficiency:** 200
- **Justification:** The agent runtime is well-structured: `RealAgentExecutor`, `AgentResultParser`, schema validation, circuit breakers (`CircuitBreakingAgentCompletionClient`), caching (`CachingLlmCompletionClient`), fallback providers, token quota trackers (daily and monthly), content safety guards, prompt redaction, cost estimation, staged critic agents, model tier routing, and agent output evaluation (heuristic + LLM judge + reference case catalog). The pipeline supports both simulator and real Azure OpenAI modes (**header Azure OpenAI / real-mode posture**). The quality gate architecture (`AgentOutputQualityGate`) with configurable floors and modes is mature. The gap is that **most** automated test evidence runs in simulator mode; **committed** real-LLM golden cohort depth and adversarial/regression envelopes are still catching up versus what AOAI provisioning already allows — the agent pipeline has not been validated at scale with diverse, adversarial, or edge-case architecture briefs in **documented breadth**.
- **Tradeoffs:** The simulator-first design is correct for CI speed but creates a coverage gap for agent behavior under real conditions. Content safety is fail-closed in production, which is correct but means production deployment requires Azure Content Safety provisioning.
- **Improvements:** Expand golden cohort to 20+ diverse scenarios; add agent output regression suites comparing real-LLM vs simulator; track prompt version → output quality correlation.

### 2.3 Marketability
- **Score:** 68 | **Weight:** 8 | **Weighted deficiency:** 256
- **Justification:** The product has a clear value proposition (architecture request → defensible manifest), differentiated positioning, an executive sponsor brief, a pricing philosophy, a procurement pack, demo scripts, and marketing UI pages. **Reference customer row / live commerce / peer proof artifacts** trail an incumbent — **`reference customer` explicitly `V1.1`** per **`V1_DEFERRED.md` §6b** (not **`V1` `(A)`**); **`(A)` is not lowered** simply because **no buyer labels production tenancy** yet (**header production-customer policy**). There is currently no **`Published`** reference row, thin **measured outcomes** narratives, minimal analyst/third-party commentary, **`archlucid.net`** staging stance, Stripe **TEST** posture today — **`(B)` friction** until motion lands, not **`V1` `(A)`** punishment for tenancy absence.
- **Tradeoffs:** Deep procurement documentation (CAIQ, SIG, DPA, trust center) is unusual for this stage and creates trust credibility, but lacks the customer evidence that validates the message.
- **Improvements:** Produce a synthetic but data-grounded case study with realistic numbers; complete the trial funnel end-to-end; prepare a 3-minute demo video.

### 2.4 Time-to-Value
- **Score:** 72 | **Weight:** 7 | **Weighted deficiency:** 196
- **Justification:** For **hosted SaaS customers**, the commercial path is browser-based: signup / trial, workforce identity (JWT / Entra External ID where used), and progressing from first login to a first committed manifest (`docs/START_HERE.md`). Time-to-value is gated by trial and onboarding quality, IdP alignment, domain fluency (how to phrase a good architecture brief and read findings), not by customers provisioning compute or databases. **Internal engineering** builds and validates the product with local tooling and CI; that is unrelated to customer time-to-value. The gap between "first session" and "they believe it saved meaningful architecture-review effort" remains significant until product and process fluency catch up.
- **Tradeoffs:** The two-layer model (Pilot → Operate) correctly defers complexity, but even Pilot requires domain understanding that the product cannot shortcut.
- **Improvements:** Shorten hosted SaaS time-to-first-value (signup → first meaningful committed review): polish trial onboarding, seeded sample architecture review tour, obvious next steps on home; optionally add guided "sample architecture review" with bundled inputs — without conflating that with infra, which buyers do not provision on the SaaS path.

### 2.5 Adoption Friction
- **Score:** 65 | **Weight:** 6 | **Weighted deficiency:** 210
- **Justification:** For **hosted SaaS**, buyers do not install .NET, Docker, SQL Server, or provision Azure OpenAI for the vendor stack. Adoption friction comes from trial and signup UX, interpreting a broad operator surface when Operate layers are disclosed, enterprise IdP / SCIM and governance conversations, and the trial funnel still not being on **live** commerce rails in the current window. Severity is **medium**: product depth and onboarding/commerce maturity, not customer-run infrastructure.
- **Tradeoffs:** The product's depth creates inherent surface area. The progressive disclosure model (Pilot → Operate) mitigates but doesn't eliminate this.
- **Improvements:** Ship and harden the hosted trial funnel end-to-end (Stripe TEST → production equivalents per release window); keep first-session onboarding focused on **hosted SaaS** buyers; reduce in-product configuration and concept load on the default Pilot path where possible.

### 2.6 Workflow Embeddedness
- **Score:** 55 | **Weight:** 3 | **Weighted deficiency:** 135
- **Justification:** ITSM connectors (Jira, ServiceNow) are committed for V1 GA and partially implemented — outbound issue creation exists with persistence and correlation, vendor HTTP conformance tests exist, but bidirectional status sync is in-flight. Confluence publish is committed. Slack outbound delivery channels exist. Integration events (Service Bus, webhooks) provide an event bus. Azure DevOps integration exists. However, no ITSM connector has been exercised end-to-end against a **tenant-owned Jira/ServiceNow org** (beyond mocks/vendor conformance doubles), the Confluence connector is minimal (single space, API token auth), and the product does not yet slot into an architect's daily workflow tools (no IDE integration, no calendar/meeting integration, no automated trigger from repo events).
- **Tradeoffs:** The webhook + CloudEvents + recipe approach provides flexibility but pushes integration burden to the customer. First-party connectors are the right call but shipping is incomplete.
- **Improvements:** Complete Jira and ServiceNow outbound creation with at least one real-instance smoke test; ship Confluence publish to staging; document a "day in the life" workflow showing how ArchLucid fits into existing architecture review cadences.

### 2.7 Proof-of-ROI Readiness
- **Score:** 58 | **Weight:** 5 | **Weighted deficiency:** 210
- **Justification:** A detailed ROI model exists with industry benchmarks, formulas, and a worked example. Pilot ROI telemetry (`RunRoiTelemetryRow`, value report pages, ROI bulletin templates) is built into the product. **Measured outcomes are still thin:** telemetry against realistic pilot workloads, logged before/after on live architecture reviews, and benchmark-to-telemetry reconciliation are incomplete — benchmarks remain **literature- and assumption-led**. Absence of a **steady-state buyer production tenant is not**, by **this assessment’s header policy**, treated as **`(A)`** grounds to lower **`§2.7`**; the scored gap is **instrumentation exercised vs mostly hypothetical narratives**.
- **Tradeoffs:** Building measurement rails before exhaustive field proof is correct posture; scarcity of populated **ROI rows** stays a **`(B)` commercial credibility** lever more than **`V1` completeness**.
- **Improvements:** Run the ROI model against the product's own development (use ArchLucid to review ArchLucid's architecture, measure time, compare to manual); prepare a "pilot success criteria" template that ties to specific measurable outcomes.

### 2.8 Security
- **Score:** 76 | **Weight:** 3 | **Weighted deficiency:** 72
- **Justification:** Security posture is strong for the product stage: fail-closed auth defaults, production guard against DevelopmentBypass, OWASP ZAP in CI (merge-blocking), Schemathesis API fuzzing, RBAC with four roles, RLS with SESSION_CONTEXT, content safety guards (fail-closed in production), log injection mitigation (LogSanitizer), STRIDE threat model, prompt redaction, Key Vault for secrets, private endpoint Terraform modules, rate limiting (role-aware), SCIM 2.0, and security headers. Gaps: no third-party pen test (V2 per scope), no CPA SOC 2 (post-V1.1 per scope — not penalized), PGP key not yet dropped (V1.1 per scope — not penalized), and owner-conducted pen test evidence is still in-progress.
- **Tradeoffs:** The security-in-depth approach is correct but increases operational complexity (Azure Content Safety, Key Vault, RLS, SCIM all need configuration). The fail-closed production defaults are excellent.
- **Improvements:** Complete the owner-conducted pen test and document findings; verify that all admin-only endpoints are covered by AdminAuthority policy; add a security self-test command to the CLI.

### 2.9 Architectural Integrity
- **Score:** 80 | **Weight:** 3 | **Weighted deficiency:** 60
- **Justification:** The solution demonstrates genuine architectural discipline: ~30 projects with clear responsibilities (Core → Contracts → AgentRuntime → ContextIngestion → KnowledgeGraph → Decisioning → ArtifactSynthesis → Provenance → Application → Persistence → Api → Worker → Cli), dependency constraint tests (`DependencyConstraintTests`), ADR catalog (35+ records), C4-level architecture documentation, clean separation between coordinator and authority pipelines, convergence tracked via ADRs (0002 → 0012 → 0021), and a navigation rule system for the UI. The architecture is internally coherent and well-documented.
- **Tradeoffs:** The large number of projects creates cognitive overhead for **engineers** joining the codebase, but the clean dependency graph justifies it. The coordinator-to-authority migration (ADR 0021 strangler plan) adds temporary complexity.
- **Improvements:** Complete the coordinator pipeline strangler; ensure all INV-* invariants from the architecture invariant catalog are enforced by tests.

### 2.10 Trustworthiness
- **Score:** 72 | **Weight:** 3 | **Weighted deficiency:** 84
- **Justification:** The trust infrastructure is unusually mature: trust center with 20+ documents, CAIQ/SIG pre-fills, DPA template, subprocessors register, incident communications policy, SIEM export, backup/DR documentation, SLA targets, data residency documentation, SOC 2 self-assessment, VPAT draft, procurement objection playbook, and a CLI-buildable procurement pack. **AI output reliance** ultimately needs **empirical grounding** beyond process docs — breadth of external / expert-reviewed runs is still catching up (**Correctness**, **Executive Value**) — articulated **without** equating "**no production customer**" with automatic **`Trustworthiness`** demotion (**header production-customer policy**).
- **Tradeoffs:** Documentation-heavy trust is the right posture early; richer **finding-level evidence catalogs** temper residual buyer skepticism.
- **Improvements:** Create a "trust evidence page" in the product that shows per-run quality metrics (faithfulness, grounding, citation coverage); make the finding inspector more prominent in the default Pilot flow.

### 2.11 Traceability
- **Score:** 78 | **Weight:** 3 | **Weighted deficiency:** 66
- **Justification:** Strong: 78 typed audit events in append-only SQL, correlation IDs across the pipeline, decision traces, agent execution traces, provenance graph, finding inspector with evidence chains, audit log search with keyset pagination, CSV export, SIEM-compatible CEF line writer, and durable audit for governance workflows. The finding inspector shows typed payload, decision rule, evidence nodes, and audit row ID. The gap is that some mutating flows do not yet emit durable audit events (acknowledged in AUDIT_COVERAGE_MATRIX known gaps).
- **Tradeoffs:** Append-only audit with DPA-aware retention (purge excludes AuditEvents) is the right trade.
- **Improvements:** Close remaining audit coverage gaps documented in AUDIT_COVERAGE_MATRIX.

### 2.12 Usability
- **Score:** 71 | **Weight:** 3 | **Weighted deficiency:** 87
- **Justification:** The operator UI has 527+ TSX files with progressive disclosure, a core pilot checklist, an onboarding tour, command palette, keyboard shortcuts, breadcrumbs, getting-started steps, and welcome banner. The two-layer model (Pilot → Operate) reduces initial surface area. Automated accessibility coverage (axe in Vitest and Playwright) provides a repeatable baseline. **`(A)` does not require** recruiting-led **usability sessions with enterprise architects**; that class of study is **`(B)`** optional buyer-experience realism only (see header policy). Headline deductions here are instead the inherent **product** challenge: the surface is large, the domain is complex, the configuration space is vast, and the Operate layer remains heavy when fully disclosed.
- **Tradeoffs:** The progressive disclosure approach is correct but the Operate layer surface is still overwhelming when fully disclosed.
- **Improvements:** Simplify the default Pilot UI to focus on the 4-step core path; add inline contextual help for the most common confusion points. **Optional `(B)`:** run qualitative sessions with architects when recruiting bandwidth exists — informative for copy and IA, **not** a gate on **`(A)`**.

### 2.13 Executive Value Visibility
- **Score:** 66 | **Weight:** 4 | **Weighted deficiency:** 136
- **Justification:** Executive sponsor brief exists, ROI model is detailed, pilot value report and sponsor one-pager exports are built in, ROI telemetry is tracked per run, and a steering decision memo template exists. **Product gap:** thin **purpose-built quarterly roll-up** (**scorecard**/dashboard) deriving from existing aggregates. **Buyer presence in production does not dictate this score level** (**header production-customer policy**); skepticism stays **instrumentation surfaced for sponsors** versus **dense operator chrome**.
- **Tradeoffs:** Executive UX before wide sponsor feedback carries discovery risk — mitigated via thin **read-mostly summaries** grounded in telemetry already stored.
- **Improvements:** Create a lightweight "executive scorecard" page that summarizes: runs completed, findings generated, estimated hours saved, compliance coverage trend — all derivable from existing data.

### 2.14 Differentiability
- **Score:** 74 | **Weight:** 4 | **Weighted deficiency:** 104
- **Justification:** ArchLucid has a genuinely differentiated angle: manifest-first architecture output (not just diagrams or discussions), governance-grade evidence trail, typed findings with decision traces, comparison/replay capabilities, and a structured request-to-commit workflow. No mainstream competitor offers this specific combination. The positioning document and executive brief articulate this clearly. **`(B)` realism:** differentiated claims gain **credibility seasoning** once external buyers articulate value in procurement — **`(A)` is not shaved** awaiting **steady-state external production** proof (**header production-customer policy**).
- **Tradeoffs:** The specificity of the value proposition (architecture review workflow automation) is both a differentiator and a market-size constraint.
- **Improvements:** Articulate the competitive landscape explicitly in the procurement pack; prepare a "why not just use [Confluence/SharePoint/manual review]" comparison for buyers.

### 2.15 Compliance Readiness
- **Score:** 68 | **Weight:** 2 | **Weighted deficiency:** 64
- **Justification:** COMPLIANCE_MATRIX.md maps control themes to evidence paths. SOC 2 self-assessment with gap register exists. CAIQ Lite and SIG Core pre-fills are prepared. VPAT draft (WCAG 2.1 AA) exists with axe-core evidence. DSAR process documented. However, there is no CPA SOC 2 (post-V1.1 — not penalized), no third-party pen test (V2 — not penalized), and compliance drift tracking is built but untested with real compliance data.
- **Tradeoffs:** Self-attestation is the correct posture pre-$250K ARR per the SOC 2 roadmap.
- **Improvements:** Ensure compliance drift chart works with realistic sample data; validate that CAIQ/SIG pre-fills are complete enough for a real buyer questionnaire round.

### 2.16 Procurement Readiness
- **Score:** 65 | **Weight:** 2 | **Weighted deficiency:** 70
- **Justification:** Procurement pack is CLI-buildable with manifest, SHA-256 checksums, redaction report, and canonical file list enforced in CI. Cover letter template exists. Procurement FAQ exists. Objection playbook exists. DPA template, subprocessors, SLA summary, backup/DR are all documented. **Risk:** completeness versus **desk scrutiny** — possible **draft** markers or unanswered questionnaire rows until a **planned dry-run** hardens the bundle. **`(A)` is not lowered** merely because **no buyer has concluded a live procurement cycle** (**header production-customer policy**).
- **Tradeoffs:** Over-preparing procurement materials before having a buyer is a reasonable investment given enterprise sales cycles.
- **Improvements:** Do a dry run of the procurement pack against a realistic enterprise security questionnaire; verify no placeholder or draft markers remain in the pack.

### 2.17 Interoperability
- **Score:** 58 | **Weight:** 2 | **Weighted deficiency:** 84
- **Justification:** OpenAPI contract with snapshot testing and generated .NET client. AsyncAPI for webhooks. Bruno collection for manual testing. Integration events via Service Bus. SCIM 2.0 for identity provisioning. Azure DevOps integration. Customer-controlled Azure extractor (PowerShell + ZIP). However, ITSM connectors are still building, Confluence publish is early, there is no MCP (V1.1 — not penalized), no IDE integration, no Terraform Cloud integration, and the API client is .NET-only (TypeScript types are generated but no published npm package).
- **Tradeoffs:** REST-first with webhook fan-out is the right starting point, but enterprise interoperability requires meeting customers where they are (Jira, ServiceNow, Slack, Teams — all in progress).
- **Improvements:** Ship the first ITSM outbound create to a real staging environment; publish TypeScript types as an npm package; add a Python API client example.

### 2.18 Decision Velocity
- **Score:** 62 | **Weight:** 2 | **Weighted deficiency:** 76
- **Justification:** The product is designed to accelerate architecture decisions (request → manifest in one session, comparison between runs, advisory scans). The core pilot path is streamlined. However, the actual decision velocity depends on how quickly an organization can: complete tenant onboarding and identity alignment (hosted SaaS), submit a meaningful architecture brief, interpret findings, and act on recommendations. The product does not yet automate the "act on findings" step beyond creating ITSM tickets.
- **Tradeoffs:** Decision velocity is partly a product property and partly an organizational property; ArchLucid correctly focuses on the structured-output side.
- **Improvements:** Add a "quick decision summary" that extracts the top 3 actionable items from a run without requiring full manifest review.

### 2.19 Commercial Packaging Readiness
- **Score:** 70 | **Weight:** 2 | **Weighted deficiency:** 60
- **Justification:** Two-layer model (Pilot → Operate) is clean. Pricing philosophy with seat-based pricing and run overage exists. Order form template exists. Stripe integration is wired (BillingStripeWebhookController, BillingCheckoutController, BillingProductionSafetyRules). Marketplace SaaS alignment doc exists. Tier enforcement ([RequiresCommercialTenantTier] returning 402) is implemented. Trial tenant accounting exists. However, commerce is in TEST mode only, no live pricing page, and the packaging boundary between Pilot and Operate is soft (UI shaping, not hard entitlement gates).
- **Tradeoffs:** Soft UI shaping before having customers is pragmatic; hard entitlement gates can be added when pricing is validated by market response.
- **Improvements:** Validate the pricing page renders correctly with current tier data; test the full trial → checkout → provision → use flow in staging.

### 2.20 Reliability
- **Score:** 73 | **Weight:** 2 | **Weighted deficiency:** 54
- **Justification:** Circuit breakers on LLM calls, retry policies (AzureOpenAiTooManyRequestsRetry), fallback agent completion client, health probes (live/ready/full), optimistic concurrency with ROWVERSION, data consistency orphan probes, hot-path cache with invalidation, chaos exercise calendar (staging-only, quarterly), and SLA targets (99.9% monthly). Database failover Terraform module exists. However, no production chaos testing, no real-world failure data, and the reliability targets are engineering aspirations, not measured outcomes.
- **Tradeoffs:** Staging-only chaos per owner decision (2026-04-22) is the right call before scaled external tenancy and production-traffic envelopes are exercised routinely.
- **Improvements:** Complete the first quarterly chaos exercise on staging and document results; verify failover group switchover actually works.

### 2.21 Data Consistency
- **Score:** 77 | **Weight:** 2 | **Weighted deficiency:** 46
- **Justification:** Explicit data consistency matrix documenting strong consistency, eventual consistency, and best-effort paths. Transactional boundaries are well-defined. Optimistic concurrency with ROWVERSION. Idempotency keys on run creation. Orphan golden manifest quarantine probe. Archival cascade with transactional child cleanup. Read-replica staleness expectations documented. Hot-path cache with documented invalidation paths and residual risk. This is unusually well-documented for the product stage.
- **Tradeoffs:** The consistency model is honest about its limitations (cache TTL staleness, read-replica lag), which is correct.
- **Improvements:** Add a data consistency smoke test to release-smoke that verifies round-trip consistency for the core path.

### 2.22 Maintainability
- **Score:** 74 | **Weight:** 2 | **Weighted deficiency:** 52
- **Justification:** Clean project structure with dependency constraints enforced by tests. Roslyn analyzers (DirectHttpClientConstructionAnalyzer and others). EditorConfig. Directory.Packages.props for central package management. Engineering onboarding / install spine in `docs/`. Architecture fitness tests. Code coverage enforcement. However, ~291 files in Core alone, ~225 in Contracts, ~116 in AgentRuntime — the codebase is large and growing, and the documentation-to-code ratio is very high (682 markdown files in docs/), which itself becomes a maintenance burden.
- **Tradeoffs:** Extensive documentation is a strength but creates a second codebase that must stay aligned. The doc scope header CI check and canonical JSON enforcement help.
- **Improvements:** Add a "stale doc" detector that flags markdown files not updated in 90+ days that reference code paths; consider archiving assessment/quality docs older than one quarter.

### 2.23 Explainability
- **Score:** 73 | **Weight:** 2 | **Weighted deficiency:** 54
- **Justification:** Finding inspector provides typed payload, decision rule, evidence nodes, and audit row linkage — all without exposing raw LLM prompts. Citation rendering rules documented. Trace completeness analysis exists (with FsCheck property tests). Per-run explainability JSON endpoint. Deterministic explanation service. LLM audit endpoint (separate, redacted). The "Why?" link from findings to inspector is the right UX pattern. The gap is that explainability for an AI system also means the user understands *why* the AI recommended what it did, not just *what data it used* — and that deeper "reasoning trace" is not yet surfaced.
- **Tradeoffs:** Not exposing raw LLM prompts at the API edge is correct for security; the finding inspector is a good proxy.
- **Improvements:** Add a "reasoning summary" field to finding inspection that provides a human-readable 2-3 sentence explanation of why the finding was generated.

### 2.24 Azure Compatibility and SaaS Deployment Readiness
- **Score:** 78 | **Weight:** 2 | **Weighted deficiency:** 44
- **Justification:** 114 Terraform files across 15+ modules (container-apps, SQL failover, edge/Front Door, Key Vault, monitoring, OpenAI, service bus, storage, private networking, Entra, OTEL collector, pilot). Container Apps deployment with jobs. Docker compose profiles. Managed identity support. Private endpoints. Consumption budgets. Application Insights. Prometheus SLO rules. Grafana dashboards. The infrastructure-as-code posture is production-grade. The gap is that some Terraform state still has legacy naming, and the full SaaS stack has not been deployed to production (staging only).
- **Tradeoffs:** Having this much IaC before widespread external adoption is unusual and positive; the Phase 7 rename is correctly deferred.
- **Improvements:** Verify `infra/apply-saas.ps1` works end-to-end on a clean subscription; document the minimum Azure permissions needed for deployment.

### 2.25 Stickiness
- **Score:** 71 | **Weight:** 1 | **Weighted deficiency:** 29
- **Justification:** Stickiness mechanisms: accumulated runs and manifests create a versioned history, committed golden manifests become reference artifacts, governance approval chains and policy packs create organizational investment, audit trail becomes compliance evidence, comparison/replay create a longitudinal architecture record. These are genuine switching costs. **Depth of accrued organizational history on real calendars** scales with deployments — **`(A)` is not deducted** awaiting **steady-state buyer production labeling** (**header production-customer policy**); maturity of **embedded switching-cost design** is what **`§2.25`** scores.
- **Tradeoffs:** Building stickiness into the data model from day one is correct.
- **Improvements:** Ensure export formats (ZIP, DOCX, CSV) are complete enough that customers don't feel trapped — stickiness should come from value, not data hostage.

### 2.26 Template and Accelerator Richness
- **Score:** 60 | **Weight:** 1 | **Weighted deficiency:** 40
- **Justification:** Project scaffolding via `archlucid new`, demo seed with Contoso trusted baseline, sample architecture request JSON, offline demo pack, and the finding engine template (`templates/archlucid-finding-engine/`). However, there are no industry-specific templates (healthcare, financial services, retail), no pre-built policy packs for common compliance frameworks, and no library of reference architecture patterns that the product could evaluate against.
- **Tradeoffs:** Templates are most valuable when shaped by real customer needs; building them speculatively is risky.
- **Improvements:** Create 2-3 policy pack templates for common scenarios (SOC 2 compliance, cost optimization, cloud migration readiness).

### 2.27 Auditability
- **Score:** 76 | **Weight:** 2 | **Weighted deficiency:** 48
- **Justification:** 78 typed audit events, append-only SQL store, correlation IDs, CSV export, SIEM-compatible export (CEF), audit search with keyset pagination, filter by event type/actor/run/correlation/time window, governance dual-write to durable audit, and DPA-aware retention (audit excluded from purge). Strong.
- **Tradeoffs:** Some flows still lack durable audit (documented as known gaps). Cosmos DB audit path is optional/future.
- **Improvements:** Close the remaining known gaps in AUDIT_COVERAGE_MATRIX; add audit event count to the admin health dashboard.

### 2.28 Policy and Governance Alignment
- **Score:** 74 | **Weight:** 2 | **Weighted deficiency:** 52
- **Justification:** Policy packs with scope assignments and effective governance resolution. Pre-commit governance gate. Approval workflow with segregation of duties and SLA tracking. Governance dashboard. Compliance drift trend tracking. Policy pack dry run. Environment activation. The governance model is well-designed. **Sample policy JSON** originates from **product-maintained catalogs** versus wide **tenant-authored customization libraries** (**not** synonymous with **`(A)`** penalty for **`V1`** tenancy absence — **header production-customer policy**).
- **Tradeoffs:** Governance infrastructure without customer-authored policies is a framework; it becomes valuable when customers create their own rules.
- **Improvements:** Create a sample "enterprise architecture governance" policy pack that demonstrates real-world rules.

### 2.29 Accessibility
- **Score:** 62 | **Weight:** 1 | **Weighted deficiency:** 38
- **Justification:** jest-axe tests in Vitest, Playwright axe integration, VPAT 2.4 draft (WCAG 2.1 AA), accessibility mailbox, marketing `/accessibility` route, dedicated accessibility test files (operator-governance-axe, marketing-pages-axe, interactive-primitives-axe). Review cadence documented. However, VPAT is draft with manual conformance gaps acknowledged, no assistive technology user testing (not penalized per scope rules), and some criteria are marked "Not Evaluated."
- **Tradeoffs:** Automated axe-core provides a baseline; manual WCAG conformance work remains. The annual review cadence is appropriate.
- **Improvements:** Complete evaluation of "Not Evaluated" VPAT criteria; ensure all interactive components have proper ARIA labels.

### 2.30 Customer Self-Sufficiency
- **Score:** 57 | **Weight:** 1 | **Weighted deficiency:** 43
- **Justification:** For **hosted SaaS**, buyers lean on Trust Center links, procurement pack, `/health` and versioning for support escalations, and in-product workflows. Repo docs and tooling (`doctor`, `support-bundle`) are primarily **engineering / vendor-operator** aids. Buyers still face domain load (architecture review methodology) and a large surface once Operate is revealed. No in-product help search or chat companion is described as first-class today.
- **Tradeoffs:** Documentation-heavy self-service is appropriate for an operator-focused product, but the volume of documentation itself becomes a navigation challenge.
- **Improvements:** Add a searchable help index in the operator UI; create a "common tasks" quick reference card; consider in-product contextual help tooltips.

### 2.31 Change Impact Clarity
- **Score:** 70 | **Weight:** 1 | **Weighted deficiency:** 30
- **Justification:** BREAKING_CHANGES.md, CHANGELOG.md, comparison/replay for architecture changes, manifest diffing, golden manifest delta for Azure DevOps PRs, and explicit deprecation policy with Sunset headers. The change trail for the product itself is documented. For customer-facing changes, the comparison and replay surfaces show what changed and when.
- **Tradeoffs:** Change clarity for the product is good; change clarity for the customer's architecture is the product's core value.
- **Improvements:** Add a "what changed since your last review" summary to the run detail page.

### 2.32 Performance
- **Score:** 66 | **Weight:** 1 | **Weighted deficiency:** 34
- **Justification:** Performance baseline tests exist (CorePilotFlowPerformanceTests with Stopwatch gates, simulator + in-memory). BenchmarkDotNet microbenchmarks (AgentDispatchMicroBenchmarks). k6 load tests (per-tenant burst, soak). Rate limiting. Hot-path cache. Read replica routing. However, baseline tests run against simulator/in-memory (not real SQL + real LLM), no published performance numbers, and the soak/load tests are scheduled but evidence of results is not visible.
- **Tradeoffs:** Performance with real LLM calls is dominated by Azure OpenAI latency, which the product cannot control. In-process performance is less critical.
- **Improvements:** Run load test baseline against staging with SQL; publish performance characteristics (request latency, throughput) in operator documentation.

### 2.33 Scalability
- **Score:** 67 | **Weight:** 1 | **Weighted deficiency:** 33
- **Justification:** Database-per-tenant isolation model. Hot-path cache with auto Redis selection at replica count > 1. Container Apps with autoscaling. Read replica routing. Token quota trackers (daily/monthly). LLM budget management. However, the product has not been tested at scale (multiple tenants, concurrent runs, large manifests), Redis is optional in V1, and the graph projection cache is in-memory only.
- **Tradeoffs:** The architectural choices (database-per-tenant, cache auto-selection, read replicas) are correctly positioned for future scale. The deferred Redis elevation to V2 is appropriate.
- **Improvements:** Run a simulated multi-tenant burst test; document scaling limits for single-replica deployments.

### 2.34 Availability
- **Score:** 70 | **Weight:** 1 | **Weighted deficiency:** 30
- **Justification:** 99.9% monthly availability target (pre-contractual). SQL failover group Terraform module. Health probes (live/ready/full). Hosted SaaS probe workflow. Geo-failover drill runbook. However, targets are aspirational — no production availability data exists, and the failover mechanisms have not been exercised in a real outage.
- **Tradeoffs:** Availability instrumentation landed before **steady-state multi-tenant production traffic envelopes** validate SLO attainment — pragmatic **forward investment**.
- **Improvements:** Complete the first geo-failover drill on staging; establish an availability measurement baseline.

### 2.35 Supportability
- **Score:** 75 | **Weight:** 1 | **Weighted deficiency:** 25
- **Justification:** CLI `doctor` and `support-bundle --zip`, correlation IDs on all requests, `/version` endpoint, troubleshooting guide, runbooks (15+ covering database failover, incident investigation, advisory scan failures, load test rate limits, secret rotation, trial lifecycle, etc.). Support bundle has sensitive pattern redaction. Incident communications policy documented.
- **Tradeoffs:** Support infrastructure is mature; support team does not exist yet.
- **Improvements:** Test support bundle generation against a real deployment; verify redaction removes all sensitive patterns.

### 2.36 Manageability
- **Score:** 72 | **Weight:** 1 | **Weighted deficiency:** 28
- **Justification:** ConfigurationKeyCatalog provides a typed registry of all configuration keys. Configuration summary endpoints. Admin health page. Operations admin guide. LLM quota management. Production profile fail-fast for misconfigurations. However, the configuration space is very large (hundreds of keys), and there is no configuration management UI — all configuration is via appsettings JSON, environment variables, or Key Vault.
- **Tradeoffs:** Configuration-file management is standard for infrastructure-grade software but creates operator burden.
- **Improvements:** Add a read-only "effective configuration" view to the admin panel showing non-secret configuration state.

### 2.37 Deployability
- **Score:** 71 | **Weight:** 1 | **Weighted deficiency:** 29
- **Justification:** Docker images with compose profiles. Container Apps Terraform. CD pipelines (cd-staging-on-merge, cd-saas-greenfield, cd). Package-release scripts. release-smoke validation. apply-saas.ps1. DbUp migrations on startup. However, the full SaaS stack deployment has not been validated end-to-end to production, and the deploy scripts have several environment-specific assumptions.
- **Tradeoffs:** Automated deployment with staged validation (staging → production) is the right model.
- **Improvements:** Document the complete production deployment runbook as a step-by-step checklist.

### 2.38 Observability
- **Score:** 74 | **Weight:** 1 | **Weighted deficiency:** 26
- **Justification:** OpenTelemetry instrumentation (ArchLucidInstrumentation). Application Insights integration. Prometheus metrics and SLO rules. Grafana dashboards (Terraform-deployed). Circuit breaker gate metrics. First-tenant funnel event tracking. Agent prompt activity tags. RLS bypass Prometheus counter. Structured logging with Serilog. However, no production observability data exists, and the observability stack has not been exercised under real load.
- **Tradeoffs:** Having OTel + Prometheus + Grafana + App Insights is comprehensive for the product stage.
- **Improvements:** Verify dashboard queries return meaningful data against staging; add a "system health" summary to the operator home page.

### 2.39 Testability
- **Score:** 79 | **Weight:** 1 | **Weighted deficiency:** 21
- **Justification:** Multi-tier test structure (Core, Fast Core, Integration, Slow, Full Regression, Performance, OpenAPI Contract). Property-based tests (FsCheck). Architecture fitness tests. Mutation testing (Stryker). Golden cohort evaluations. Agent eval corpus. Schemathesis API fuzzing. OWASP ZAP security scanning. Live E2E with Playwright against real API + SQL. Golden corpus record tests. Reference case catalog for agent output evaluation. CodeQL. SonarQube. 15+ test projects. Coverage enforcement with Coverlet. This is a very well-tested codebase.
- **Tradeoffs:** The test infrastructure is comprehensive but the test execution time and maintenance cost are non-trivial for a single developer.
- **Improvements:** Ensure Stryker mutation score is tracked and improving over time; add mutation test coverage to the most critical paths (commit, governance gate).

### 2.40 Modularity
- **Score:** 81 | **Weight:** 1 | **Weighted deficiency:** 19
- **Justification:** 30+ projects with explicit dependency boundaries. Core → Contracts → domain libraries → Application → Persistence → Api layering. Dependency constraint tests enforce the graph. Host.Composition wires DI. Host.Core provides shared startup. Finding engine template demonstrates extensibility. Each class in its own file. Interface-first design throughout. The modularity is genuine and enforced.
- **Tradeoffs:** High modularity increases the number of projects and can slow compilation, but the boundaries are meaningful.
- **Improvements:** Verify that the finding engine template can actually be used by a third party to create a custom finding engine.

### 2.41 Extensibility
- **Score:** 68 | **Weight:** 1 | **Weighted deficiency:** 32
- **Justification:** Finding engine template exists. Webhook + CloudEvents provide event extensibility. Integration event catalog. Policy pack framework allows custom governance rules. The agent handler pattern (ComplianceAgentHandler, etc.) is extensible internally. Absence of buyer-facing prose for adding a **custom agent handler** is explicitly **`V2` documentation (`V1_SCOPE.md` §3, `V1_DEFERRED.md` §6h)** — **not deducted in `(A)`** for V1/V1.1, parallel to MCP and speculative-ecosystem non-gates per `V1_SCOPE.md`. There is no public plugin SDK, extension API, or marketplace (already out of scope — not penalized), and the finding engine template has not been tested by anyone outside the project.
- **Tradeoffs:** Extension infrastructure before having users who want to extend is risky; the template approach is a reasonable middle ground.
- **Improvements:** Validate the finding engine template end-to-end (**separate obligation**). **Custom agent-handler customer documentation** is **`V2` tracked in `V1_DEFERRED.md` §6h** — **does not weigh on `(A)`** here.

### 2.42 Evolvability
- **Score:** 72 | **Weight:** 1 | **Weighted deficiency:** 28
- **Justification:** API versioning with deprecation headers and sunset policy. ADR catalog tracking architectural decisions. Explicit deferred scope (V1_DEFERRED.md). Strangler pattern for coordinator-to-authority migration (ADR 0021). Breaking change trail. The product is designed to evolve. Tenant-facing rollup documentation that narrates **`V1` → `V1.1`** for hosted **trial** tenants is **`V1.1` scope (`V1_SCOPE.md` §3, `V1_DEFERRED.md` §6i)** — **not an `(A)` V1 readiness deduction** pending that guide (see assessment header policy).
- **Tradeoffs:** Building evolution infrastructure early creates documentation and maintenance overhead; the trade is paid for by safer API and schema change discipline.
- **Improvements:** **`V1.1` (`V1_DEFERRED.md` §6i):** publish the consolidated **trial `V1` → `V1.1`** migration / expectations artifact — **does not weigh on `(A)` V1** in this scoring model.

### 2.43 Documentation
- **Score:** 82 | **Weight:** 1 | **Weighted deficiency:** 18
- **Justification:** 682 markdown files in docs/. Five-document onboarding spine for **buyers and operators**, plus deeper **engineering** and **security/GRC** material. CI-enforced doc scope headers. Architecture poster (C4). Operator atlas. Configuration reference. 15+ runbooks. CHANGELOG. BREAKING_CHANGES. ADR catalog. API contracts. Data model. This is *extraordinarily* thorough documentation.
- **Tradeoffs:** The documentation volume is itself a usability challenge — finding the right doc requires navigation skill. The NAVIGATOR.md and START_HERE.md help but the depth is intimidating.
- **Improvements:** Add a doc search feature to the operator UI; consider a documentation site generator (Docusaurus/VitePress) for the buyer-facing subset.

### 2.44 Azure Ecosystem Fit
- **Score:** 77 | **Weight:** 1 | **Weighted deficiency:** 23
- **Justification:** Azure-native throughout: Entra ID, Azure SQL, Azure OpenAI, Azure Content Safety, Azure Service Bus, Azure Key Vault, Azure Blob Storage, Azure Container Apps, Azure Front Door, Azure API Management, Application Insights, Azure Monitor. Private endpoints. Managed identity. The product is built for Azure.
- **Tradeoffs:** Azure-native is a strength for Azure customers and a limitation for non-Azure customers.
- **Improvements:** In Trust Center / buyer docs, summarize which **Microsoft Azure capabilities** underpin the hosted service (transparent subprocessors posture) **without implying customers operate** Container Apps/SQL/OpenAI tenancy for ArchLucid.

### 2.45 Cognitive Load
- **Score:** 61 | **Weight:** 1 | **Weighted deficiency:** 39
- **Justification:** The product imposes significant cognitive load: architecture review domain concepts, multi-layer UI, a large configurable surface (much of which is **vendor-hosted** implementation detail surfaced to admins), governance/policy/alert model, and documentation depth. Progressive disclosure helps but the full surface is complex. The naming is occasionally confusing (run vs architecture review, coordinator vs authority, tier vs layer vs rank).
- **Tradeoffs:** Domain complexity is inherent; the product could do more to manage it.
- **Improvements:** Standardize terminology in the UI (architecture review consistently, not mixed with "run"); add a glossary link in the operator shell; reduce the default visible surface further.

### 2.46 Cost-Effectiveness
- **Score:** 64 | **Weight:** 1 | **Weighted deficiency:** 36
- **Justification:** **Vendor economics:** LLM **`LlmCostEstimator`** wiring, **`LlmCostEstimationOptions`** (rates per deployment), **token budget** trackers (daily / monthly ceilings), **`CachingLlmCompletionClient`** and hot-path caches that directly cut **hosted inference spend**, and **consumption budgets in Terraform** are the right primitives for COGS containment. **Operational cost** narrative exists in pilots and provisioning docs (per‑tenant SKU thinking). However, **`LlmCostEstimator` versus actual AOAI meter / invoice lines** has not been reconciled under production-scale traffic on your hosted fleet; there is no single owner-facing rollup (e.g., FinOps view tying inference, DB, egress) validated as the **vendor** steady-state posture. **Customer-side (secondary in this pillar):** per-tenant budgeting surfaces and public “expected spend” prose are thinner — acceptable to mention as adjunct signal (see header definition), but **§2.46 is not predominantly “did the tenant get a dashboard.”**
- **Tradeoffs:** Over-instrumenting tenant-visible spend UX before tightening **supplier-side** metering and alerting can distract from gross-margin protection and capacity planning — both dimensions can evolve; **prioritize vendor observable truth first**.
- **Improvements:** **Vendor-first:** reconcile estimated vs billed LLM usage on a staging/production slice; ship or document a concise **hosted COGS observability** path (dashboards/queries/runbook) tying token volume, cache hit rate, and top spend drivers; stress-test quotas under multi-tenant peaks. **Optional buyer-facing layers:** per-run cost estimate on run detail; published expected cost bands in **`/pricing`-adjacent docs** — these **support** Cost-Effectiveness but are **not** the sole uplift path for **`§2.46`** per this assessment’s framing.

---

## 3. Weighted Readiness Calculation

| Category | Weight Sum | Weighted Score Sum | Max Possible |
|----------|-----------|-------------------|-------------|
| Commercial | 40 | 2,704 | 4,000 |
| Enterprise | 25 | 1,678 | 2,500 |
| Engineering | 47 | 3,473 | 4,700 |
| **Total** | **112** | **7,855** | **11,200** |

**Weighted Readiness: 7,855 / 11,200 = 70.13%**

---

## 4. Top 12 Most Important Weaknesses

Ranked by weighted deficiency × strategic criticality:

1. **Thin breadth of externally validated AI output correctness.** The core proposition — defensible correctness of architecture findings across **diverse** enterprise contexts — still relies heavily on simulator-mode automation and limited **committed** real-mode corpus / expert-reviewed baselines (**header Azure OpenAI / real-mode posture**: infra exists; systematic evidence expansion remains the workstream). Treat as **severity of residual uncertainty**, not “real LLM inaccessible.”

2. **`(B)` Pipeline proof vs `V1` completeness.** Narratives that ordinarily lean on production logos, longitudinal ROI tables, procurement war stories, and peer quotes are thin — **`(B)` market-motion realism** (zero weight on **`(A)`**). **`(A)` `V1` headline scores are explicitly not lowered** solely because **no buyer steady-state production tenant exists** (**header production-customer policy**; **`V1_DEFERRED.md` §6b** reference-customer **`V1.1`**).

3. **ITSM connectors are committed but incomplete.** Jira, ServiceNow, and Confluence are in V1 scope but still being built. Without these, the product cannot embed into existing architecture review workflows where tickets are tracked.

4. **Self-serve commercial path is not live.** Trial funnel in TEST mode, Stripe not live, Marketplace not published. Buyers cannot self-evaluate without seller involvement. This is V1.1-deferred (**not** a **`V1` `(A)`** penalty under deferral posture) yet remains **practical** revenue friction (**`(B)`**).

5. **Hosted SaaS trial and onboarding friction.** Buyers are not asked to provision the platform stack, yet the hosted path from signup to first credible committed review still needs tightening, and commerce is not on live rails in this window — so meaningful self-serve trial remains incomplete until those pieces land.

6. **Operated-at-scale UX friction (without requiring lab usability studies).** The UI is dense and architecture-review-domain-heavy; **`(A)`** does **not** treat absence of moderated sessions with enterprise architects as a readiness defect (see header policy). The practical gap is whether first-time pilots can traverse the golden path quickly enough — overlaps trial/onboarding (**#5**), configuration complexity (**#7**), and Cognitive Load (**§2.45**).

7. **Configuration complexity.** Hundreds of configuration keys, multiple auth modes, multiple SQL topology modes, optional Redis, optional Service Bus, multiple Terraform modules. The operational and admin surface is large relative to the default Pilot path (**scored as configuration / operability load, not as vendor team-size commentary**).

8. **ROI narrative still anchored in model math vs dense logged outcomes.** Telemetry exists, but persuasive **filled-in** pilots (hours saved rows, compliance deltas) lag — primarily a **`(B)` commercial credibility / Proof-of-ROI hygiene** lever; **`(A)` is not shaved** awaiting **steady-state buyer production** (**header production-customer policy**).

9. **Documentation volume is itself a UX problem.** 682 markdown files is extraordinary but creates a "where do I start?" problem. The five-doc spine helps but the depth behind it is overwhelming.

10. **Simulator–real-LLM delta is empirically under-measured.** Golden cohort scaffolding exists but **steady drift metrics** (side-by-side or paired runs summarizing divergence) are **not yet a durable product artifact**. AOAI provisioning supports closing this (**header Azure OpenAI / real-mode posture**); the weakness is measurement and corpus commitment, not missing endpoints.

11. **Incomplete executive visibility surfaces.** Executive sponsors need a dashboard showing value delivered over time. The ROI telemetry infrastructure exists but no executive-optimized summary view is built.

12. **Production support and incident narrative (unvalidated at scale).** Runbooks, correlation IDs, incident communications policy, and staging observability exist, but limited **published** tenant-visible incident-history storytelling may surface in diligence. **`(B)` procurement realism only** — not used to deduct **`(A)`** here.

---

## 5. Top 6 Monetization Blockers

**Scoring posture:** Monetization friction below informs **sales/pipeline realism** (**`(B)`** when labeled). **`V1` `(A)` headline readiness is not lowered** solely because **no steady-state buyer production tenant** exists (**header production-customer policy**). Items explicitly **`V1.1`**-deferred are **non-gates for `V1` `(A)`** per **`V1_SCOPE` / `V1_DEFERRED`**.

1. **No live commercial path.** Stripe TEST mode and unpublished Marketplace mean no money can flow. (V1.1-deferred — not scored against, but practically blocking revenue.)

2. **`(B)` Pricing proof hinges on causal evidence.** Defensible quoting benefits from externally validated “saves X hours / avoids Y rework” narratives — **`(B)` friction**, not **`(A)`** deduction for **`V1`** due to tenancy absence (**header production-customer policy**).

3. **ITSM connector gap prevents workflow replacement.** Buyers won't pay for a tool that doesn't integrate with their ticket system. Jira/ServiceNow outbound must ship.

4. **No self-service evaluation path on live commercial rails.** On **SaaS**, buyers are not asked to run SQL or Docker; the gap is an end-to-end, low-friction hosted trial (signup → tenant → first review) with commerce and operations ready for scale, not “install the stack.” The trial funnel still needs to be fully production-equivalent where the business requires it.

5. **ROI citations remain assumption-led.** The ROI model cites $288K+ annual savings for a 200-person org from benchmark math — scarce **logged** pilot outcomes sharpen defense against “we'll keep Confluence + manual reviews.” **`(B)` / commercial narrative gap** — **not**, by **policy**, **`(A)`** punishment for **`V1`** based on absent production badges alone.

6. **No reference customer or case study.** Enterprise buyers want peer validation. The reference customer table exists but has no `Published` rows. (V1.1 — not scored against, but a practical blocker for pipeline expansion.)

---

## 6. Top 6 Enterprise Adoption Blockers

1. **No third-party security attestation.** Owner-conducted pen test and SOC 2 self-assessment are correct for the stage, but enterprise security teams may require CPA SOC 2 or independent pen test before procurement can proceed. (Correctly scoped to V2/post-V1.1 — not penalized, but a real friction point.)

2. **Incomplete ITSM integration.** Enterprise architecture teams track findings in Jira or ServiceNow. Without bidirectional sync, findings accumulate in ArchLucid without flowing into existing remediation workflows.

3. **No production SLA.** 99.9% is a target, not a commitment. Enterprise procurement may require a contractual SLA with credit terms before signing.

4. **Enterprise integration and assurance work.** Customers still spend cycles on workforce identity (Entra External ID vs workforce OIDC maps), SCIM, network allowlists if used, SSO questionnaires, DPAs/subprocessors reviews, and (where required) aligning internal ITSM workflows with ArchLucid — even though **ArchLucid’s hosting footprint is vendor-operated**.

5. **AI / LLM addenda and subprocessor scrutiny.** Enterprises often run legal and security reviews on Azure OpenAI (and related Microsoft DPAs), model use, retention, and acceptable-use language. Delays here are procurement friction, **not** a statement about vendor headcount — and **single-vendor or small-team optics are explicitly excluded from `(A)` scoring** per the header policy.

6. **No multi-tenant administrative surface.** Enterprise customers with multiple teams/projects need administrative visibility. While database-per-tenant isolation exists, the admin experience for managing multiple tenants is limited to API calls and configuration.

---

## 7. Top 6 Engineering Risks

1. **Real-LLM output quality at breadth and hostile inputs remains an open empirical envelope.** Simulator mode dominates cheap CI loops; **real Azure OpenAI** can still surface hallucinations, inconsistencies, or missing findings gates miss (**header Azure OpenAI / real-mode posture** supplies dev execution paths — risk is **unexercised breadth vs rare enterprise inputs**, not lack of AOAI connectivity).

2. **Database migration ordering under concurrent deployment.** DbUp runs on startup, which means multiple replicas racing to apply migrations. MigrationCatalogMutexScope exists, but concurrent startup of Container Apps replicas during deployment could create race conditions.

3. **LLM prompt drift.** Agent prompts are not version-controlled in a way that ties prompt changes to output quality changes. A prompt edit that improves topology findings might degrade compliance findings. No regression gate catches this.

4. **Graph snapshot projection cache is in-process only.** `GraphSnapshotProjectionMemoryCache` keeps graph UI projections **off hot SQL** with a **process-local** TTL; **multi-replica API** fleets or bursty invalidation can widen **staleness windows** versus authoritative graph reads until **`V1_DEFERRED.md` §6e** optional **distributed** projection work (or tightened read paths). Hosted multitenant SQL remains **`SystemWithPerTenantCatalogs`** per **`V1_SCOPE.md`**.

5. **Key Vault secret rotation during operation.** Configuration references Key Vault secrets, but there is no documented graceful rotation path that avoids brief downtime or stale credentials during the rotation window.

6. **Coordinator-to-authority migration (ADR 0021) is incomplete.** The strangler pattern means both code paths may coexist for some operations. Inconsistencies between coordinator and authority behavior for edge cases could produce subtle bugs.

---

## 8. Most Important Truth

**ArchLucid exhibits rare engineering maturity for its stage**: coherent architecture decomposition, disciplined tests and security tooling, and a procurement-grade documentation spine. **`V1` `(A)` headline readiness does not require** external **steady-state buyer production tenancy** (**header production-customer policy**) — incompleteness belongs in **`(B)`** buyer-motion narrative unless `V1_SCOPE` names an in-contract gate. The distinct **technical** risk stays **whether AI-generated outputs retain accuracy and trust across diverse enterprise contexts** — characterized here as **simulator–real‑LLM evidence *breadth* and external validation**, not denial of AOAI (**header Azure OpenAI / real-mode posture**: dev resource + `gpt-4o` + gated CI naming are aligned with Improvement 2 / 13 / 18 tracks) — **orthogonal to tallying logos**.

---
## 9. Top Improvement Opportunities

### Improvement 1: Complete Jira + ServiceNow Outbound Issue Creation End-to-End

**Why it matters:** ITSM integration is the single most important workflow embeddedness gap. Enterprise architects track findings in Jira or ServiceNow. Without this, ArchLucid findings sit in their own system.

**Expected impact:** Directly improves Workflow Embeddedness (+10-15 pts), Interoperability (+5-8 pts), Adoption Friction (+3-5 pts), Monetization readiness. Weighted readiness impact: +0.6-1.0%.

**Affected qualities:** Workflow Embeddedness, Interoperability, Adoption Friction, Time-to-Value, Stickiness

**Status:** Completed (2026-05-10). Outbound Jira/ServiceNow create path is staging-testable: controller→service→typed HTTP clients are exercised under `ArchLucid.Api.Tests/Integrations/` (`ItsmOutboundIssuesIntegrationApiFactory`, `ItsmOutboundIssuesEndpointIntegrationTests`, `RecordingOutboundHttpHandler`), durable audit append is asserted via `CapturingAuditRepository`, Problem+JSON gains optional extensions (`provider`, `findingId`) alongside existing `correlationId`, `JiraAdfDescriptionBuilderTests` validates ADF shape, and outbound HTTP clients emit explicit timeout detail vs generic transport failures.

**Cursor Prompt:**
```
Complete the Jira and ServiceNow outbound issue creation path to a staging-testable state.

Context:
- ItsmOutboundIssueCreationService.cs exists in ArchLucid.Application/Integrations/Itsm/Outbound/
- Vendor HTTP conformance tests exist in ArchLucid.Application.Tests/Integrations/Itsm/Outbound/
- ItsmOutboundIssuesController.cs exists in ArchLucid.Api/Controllers/Integrations/
- TenantItsmOutboundSettings persistence exists (SQL and in-memory)
- Configuration options exist in IntegrationsItsmOutboundOptions.cs

Tasks:
1. Verify ItsmOutboundIssueCreationService handles both Jira and ServiceNow providers
2. Verify the API endpoint POST /v1/integrations/itsm/outbound/issues returns correct responses for success, auth failure, and provider error cases
3. Verify ItsmFindingCorrelations are persisted on successful creation
4. Verify audit events (Integration.JiraIssueCreateSucceeded, Integration.ServiceNowIncidentCreateSucceeded, and failure variants) are emitted
5. Add an integration test that exercises the full controller → service → HTTP client path with a mock HTTP handler
6. Verify the JiraAdfDescriptionBuilder produces valid Atlassian Document Format
7. Ensure error handling produces Problem+JSON with meaningful detail for: invalid provider, missing configuration, HTTP timeout, auth rejection

Acceptance criteria:
- All existing ITSM tests pass
- New integration test covers controller → audit emission
- Problem+JSON errors include provider name and correlation ID
- No changes to ArchLucid.Core or ArchLucid.Contracts (outbound-only)

Constraints:
- Do not implement inbound webhook sync in this change
- Do not add new NuGet dependencies
- Follow existing test patterns in the Itsm/Outbound test folder
```

*(Prompt executed; items above delivered in-repo.)*


### COMPLETED:  Improvement 2: Expand Golden Cohort Real-LLM Evaluation Evidence

**Why it matters:** The gap between simulator-mode testing and real-LLM production behavior is the largest uncertainty in the product. Expanding golden cohort evidence directly addresses the correctness and trustworthiness gap.

**Expected impact:** Directly improves Correctness (+5-8 pts), AI/Agent Readiness (+3-5 pts), Trustworthiness (+3-5 pts). Weighted readiness impact: +0.5-0.8%.

**Affected qualities:** Correctness, AI/Agent Readiness, Trustworthiness, Proof-of-ROI Readiness

**Status:** Actionable now (Azure OpenAI endpoint and deployment are provisioned; CI secrets are wired)

**Known configuration:**
- **Endpoint:** `https://oai-archlucid-dev.services.ai.azure.com/api/projects/proj-default`
- **Deployment:** `gpt-4o`
- **CI secrets:** `ARCHLUCID_CI_REAL_AOAI_ENDPOINT`, `ARCHLUCID_CI_REAL_AOAI_KEY`, `ARCHLUCID_CI_REAL_AOAI_DEPLOYMENT`
- **Local:** Set `AgentExecution:Mode` to real mode and populate `AzureOpenAI:Endpoint` + `AzureOpenAI:ApiKey` via user secrets

**Cursor Prompt:**
```
Expand golden cohort real-LLM evaluation evidence to cover 10+ diverse architecture scenarios.

Context:
- Golden cohort infrastructure exists in tests/golden-cohort/
- Budget config at tests/golden-cohort/budget.config.json
- Eval corpus at tests/eval-corpus/ with existing real-mode scenarios (scenario-real-mode-smoke.json, scenario-real-mode-three-tier.json)
- Azure OpenAI endpoint: https://oai-archlucid-dev.services.ai.azure.com/api/projects/proj-default
- Deployment: gpt-4o
- AgentExecution:Mode must be set to real mode (not Simulator)
- CI gated job: dotnet-azure-openai-live-post-regression

Tasks:
1. Inventory existing real-mode scenarios in tests/eval-corpus/ and tests/golden-cohort/
2. Create 8+ new scenario files covering diverse architecture briefs:
   - Cloud migration (lift-and-shift legacy app)
   - Greenfield microservices design
   - Compliance-heavy regulated workload (healthcare or financial)
   - Cost optimization review (existing Azure deployment)
   - Event-driven architecture review
   - Multi-region high-availability design
   - Data platform / analytics pipeline
   - AI/ML workload architecture
3. For each scenario, create a realistic architecture-request JSON with:
   - System name and description
   - Technology stack details
   - Specific review objectives
   - Constraints and requirements
4. Run each scenario in real mode and capture the agent results as .real.json evidence files
5. Validate that all quality gate checks pass for each run
6. Document results in tests/golden-cohort/COHORT_EVIDENCE_SUMMARY.md:
   - Scenario name, structural score, semantic score, finding count, token usage
   - Overall pass/fail against budget thresholds

Acceptance criteria:
- At least 10 distinct scenarios with real-mode evidence files
- All runs pass quality gate structural and semantic floors
- Evidence summary document committed
- Budget config updated if thresholds need adjustment
- No regression in existing golden cohort scenarios

Constraints:
- Use gpt-4o deployment only
- Do not modify agent prompts or core pipeline to make scenarios pass
- If a scenario fails quality gates, document the failure — do not suppress it
- Capture token usage for cost estimation
```

### Improvement 3: Ship Trial Funnel Staging End-to-End Validation

**Why it matters:** The trial funnel is the first touchpoint for self-serve evaluators. Testing it end-to-end in staging validates the critical path from "interested buyer" to "first architecture review." The live E2E spec exists but staging deployment validation is separate from CI.

**Expected impact:** Directly improves Time-to-Value (+3-5 pts), Adoption Friction (+3-5 pts), Commercial Packaging (+2-3 pts). Weighted readiness impact: +0.3-0.5%.

**Affected qualities:** Time-to-Value, Adoption Friction, Commercial Packaging Readiness, Decision Velocity

**Status:** DEFERRED

**Reason:** Requires access to staging environment (staging.archlucid.net) and Stripe TEST-mode configuration to validate the full funnel. The spec and runbook exist but execution needs hosted infrastructure access.

**Information needed:** Confirmation that staging.archlucid.net is accessible and Stripe TEST-mode keys are configured. Or: provide the Stripe TEST-mode publishable key and the staging API base URL.

### COMPLETED:  Improvement 4: Add Executive Scorecard Summary Page

**Why it matters:** Executive sponsors need to see value delivered without diving into operator-level detail. A lightweight scorecard using existing data (run count, finding count, estimated hours saved, compliance coverage) directly addresses Executive Value Visibility.

**Expected impact:** Directly improves Executive Value Visibility (+8-10 pts), Proof-of-ROI Readiness (+3-5 pts), Stickiness (+2-3 pts). Weighted readiness impact: +0.4-0.6%.

**Affected qualities:** Executive Value Visibility, Proof-of-ROI Readiness, Stickiness, Marketability

**Status:** Actionable now

**Cursor Prompt:**
```
Create an executive scorecard summary page in the operator UI that displays key value metrics derived from existing data.

Context:
- archlucid-ui/src/app/(executive)/ directory already exists with executive review routes
- ROI telemetry data is available via existing API endpoints (RunRoiTelemetryRow)
- The value-report/roi page exists at archlucid-ui/src/app/(operator)/value-report/roi/page.tsx
- RoiTelemetryCard component exists

Tasks:
1. Create archlucid-ui/src/app/(executive)/scorecard/page.tsx
2. Display four summary cards:
   - Total architecture reviews completed (count of committed runs)
   - Total findings generated (sum of findings across committed runs)
   - Estimated hours saved (from ROI telemetry if available, or formula: runs × average_hours_per_manual_review)
   - Compliance coverage trend (from compliance drift data if available)
3. Add a time-range selector (last 30 days, last quarter, all time)
4. Use existing UI components (card.tsx, CollapsibleSection) for consistent styling
5. Add axe accessibility test for the new page
6. Gate behind ReadAuthority (same as other read surfaces)

Acceptance criteria:
- Page renders with placeholder data when no runs exist (empty state)
- Page renders with real data when runs exist
- Time-range selector filters displayed data
- axe-core test passes
- Vitest snapshot test exists
- No new API endpoints required — use existing run list, ROI telemetry, and compliance drift endpoints

Constraints:
- Do not add new API endpoints
- Do not modify existing components
- Follow the existing (executive) layout pattern
- Use TypeScript strict mode
- Keep the page simple — 4 cards maximum
```

### Improvement 5: Reduce Cognitive Load — Terminology Consistency Pass

**Why it matters:** The product uses "run" (API/database), "architecture review" (buyer language), "review" (UI), and "pilot" (first-time flow) interchangeably. This creates confusion for new users. The explicit hybrid vocabulary decision (2026-05-01) needs to be fully applied.

**Expected impact:** Directly improves Cognitive Load (+5-8 pts), Usability (+3-5 pts), Time-to-Value (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Cognitive Load, Usability, Time-to-Value, Adoption Friction

**Status:** Actionable now (partially — UI copy changes only; API paths unchanged per scope)

**Cursor Prompt:**
```
Apply the explicit hybrid vocabulary decision consistently across operator UI hero headings and primary CTAs.

Context:
- Owner decision (2026-05-01): "architecture review" is the dominant buyer-facing phrase
- API paths, DTO fields, and database entities must NOT be renamed
- "Run ID" should appear in metadata/secondary text, not as the only hero label
- Bridge copy should explain that each architecture review is tracked as one run

Tasks:
1. In archlucid-ui/src/app/(operator)/reviews/ pages:
   - Ensure page titles use "Architecture Review" not "Run"
   - Ensure the new-review wizard CTA says "Start Architecture Review" not "Start Run"
   - Ensure list page heading says "Architecture Reviews" not "Runs"
2. In archlucid-ui/src/components/CorePilotChecklist.tsx:
   - Ensure step labels use "architecture review" language
3. In archlucid-ui/src/components/ShellNav.tsx:
   - Verify nav labels use "Reviews" (not "Runs") for the Pilot tier
4. Add bridge copy to the reviews list page empty state:
   "Each architecture review is tracked as a run in the system. Your Run ID appears in metadata for support and diagnostics."
5. Do NOT rename: URL paths, API calls, TypeScript type names, or anything in src/lib/

Acceptance criteria:
- All hero headings and primary CTAs use "Architecture Review" or "Reviews"
- "Run" / "Run ID" appears only in metadata, secondary text, or technical contexts
- Bridge copy appears in at least the reviews list empty state
- No TypeScript type renames
- No API path changes
- Existing Vitest tests pass (update snapshots if heading text changed)

Constraints:
- Copy changes only — no component restructuring
- Do not touch files outside archlucid-ui/src/app/(operator)/ and archlucid-ui/src/components/
- Do not rename any CSS classes, component names, or exported functions
```

### Improvement 6: Close Top Audit Coverage Gaps

**Why it matters:** The audit trail is a key trust differentiator. Known gaps in AUDIT_COVERAGE_MATRIX reduce the credibility of the audit claim. Closing the top gaps strengthens Auditability, Traceability, and Compliance Readiness.

**Expected impact:** Directly improves Auditability (+3-5 pts), Traceability (+2-3 pts), Compliance Readiness (+2-3 pts). Weighted readiness impact: +0.2-0.4%.

**Affected qualities:** Auditability, Traceability, Compliance Readiness, Trustworthiness

**Status:** DEFERRED

**Reason:** Need to read the current AUDIT_COVERAGE_MATRIX.md "Known gaps" section to identify which specific flows lack durable audit. The document states "zero open durable-audit omissions" as of 2026-04-23 for previously listed areas, but new routes and flows may have been added since.

**Information needed:** Confirm whether there are any current known gaps in AUDIT_COVERAGE_MATRIX.md, or point me to the specific flows you want audited.

### Improvement 7: Add In-Product Configuration Summary View

**Why it matters:** The product has hundreds of configuration keys. Operators cannot easily verify their effective configuration without reading appsettings files. A read-only configuration summary reduces operational errors and supports troubleshooting.

**Expected impact:** Directly improves Manageability (+5-8 pts), Supportability (+3-5 pts), Customer Self-Sufficiency (+3-5 pts). Weighted readiness impact: +0.15-0.3%.

**Affected qualities:** Manageability, Supportability, Customer Self-Sufficiency, Cognitive Load

**Status:** Actionable now (ConfigurationEffectiveValueResolver and ConfigSummaryDtos already exist in Core)

**Cursor Prompt:**
```
Expose the existing configuration summary infrastructure as a read-only admin page in the operator UI.

Context:
- ConfigurationEffectiveValueResolver exists in ArchLucid.Core/Configuration/Summary/
- ConfigSummaryDtos exists in the same location
- ConfigurationKeyCatalog provides the typed registry of all configuration keys
- AdminAuthority policy gates admin-only surfaces

Tasks:
1. If not already present, add a GET /v1/admin/configuration/summary endpoint in the admin controller area
   - Gate with AdminAuthority policy
   - Return ConfigSummaryDtos data from ConfigurationEffectiveValueResolver
   - Redact any key whose catalog entry indicates it is secret (mask with "***")
   - Include the key name, effective value (or masked), source (appsettings, env, Key Vault), and catalog description
2. Create archlucid-ui/src/app/(operator)/admin/configuration/page.tsx
   - Display configuration keys in a searchable, filterable table
   - Group by catalog category if available
   - Show masked values for secrets
   - Gate behind AdminAuthority in the nav config
3. Add axe accessibility test

Acceptance criteria:
- Secret values are never exposed in the API response or UI
- AdminAuthority is enforced (non-admin gets 403)
- Search filters by key name
- Page works in empty/error states
- Existing tests pass

Constraints:
- Read-only — no configuration mutation from the UI
- Do not modify ConfigurationKeyCatalog or ConfigurationEffectiveValueResolver
- Do not expose connection strings, API keys, or Key Vault URIs
- Follow existing admin page patterns (e.g., admin/health)
```

### Improvement 8: DEFERRED — Hosted SaaS trial funnel and tenant lifecycle

**Title:** DEFERRED — Lock hosted SaaS trial experience (signup → tenant → first value) and operational policies

**Reason:** On SaaS, buyers never provision ArchLucid infrastructure; the open work is **vendor-side** host configuration and product policy: which environment hosts trials, Stripe mode, DNS/Front Door, tenant isolation, trial duration, and data lifecycle. Those are owner decisions, not “buyer avoids infra.”

**Information needed:** Should trial evaluators use the existing staging.archlucid.net, or should there be a separate trial-only deployment? What is the desired trial tenant lifecycle (duration, auto-expire, data purge)?

### Improvement 9: Add Per-Run Cost Estimate to Run Detail

**Why it matters:** **`LlmCostEstimator`** already backs **supplier-side** costing; exposing a **derived per-run estimate** in the UI is **secondary** uplift for **`§2.46`** in this scoring model (**vendor economics primary** — see assessment header policy). **Still valuable:** reinforces tenant trust and helps buyers sanity-check budgets (Executive Value Visibility, Trustworthiness).

**Expected impact:** Cost-Effectiveness (+2–4 pts toward the **tenant-transparency adjunct** slice of the pillar — not assumed to dominate the pillar score), Executive Value Visibility (+2–3 pts). Weighted readiness impact: small fractional %.

**Affected qualities:** Cost-Effectiveness (partial), Executive Value Visibility, Trustworthiness

**Status:** Actionable now (`LlmCostEstimator` exists). For a **meaningful uplift to the vendor-economic core** of **`§2.46`**, pair with **estimated-vs-billed** LLM reconciliation and **hosted COGS observability** (see **`§2.46` Improvements** above — vendor-first bullets).

**Cursor Prompt:**
```
Surface the per-run LLM cost estimate in the run detail view.

Context:
- LlmCostEstimator exists in ArchLucid.AgentRuntime/LlmCostEstimator.cs
- LlmCostEstimationOptions with USD rates exists in ArchLucid.Core/Configuration/
- AgentExecutionTraces contain token usage data
- Run detail page exists at archlucid-ui/src/app/(operator)/reviews/[runId]/

Tasks:
1. If not already present, add an endpoint or extend the run detail response to include estimated LLM cost
   - Sum token usage from AgentExecutionTraces for the run
   - Apply rates from LlmCostEstimationOptions
   - Return as { estimatedCostUsd: number, tokenCounts: { prompt: number, completion: number }, model: string }
2. In the run detail UI, add a small "Estimated cost" badge or card showing:
   - Total estimated USD cost
   - Token breakdown (prompt / completion)
   - Model used
3. Show "Cost estimate unavailable" when no trace data exists (simulator mode without real tokens)

Acceptance criteria:
- Cost displays correctly for runs with agent execution traces
- Cost shows "unavailable" gracefully for simulator-only runs
- USD formatting is locale-aware
- No new configuration keys required
- Existing tests pass

Constraints:
- Use existing LlmCostEstimator — do not create a new cost calculation
- Do not modify LlmCostEstimationOptions
- This is a read-only display — no cost limits or gates
```

### Improvement 10: OPTIONAL `(B)` — Usability Sessions with Enterprise Architects

**Title:** OPTIONAL — moderated usability sessions with 3–5 enterprise architects when recruiting allows

**Scope:** **`(B)` buyer-experience realism only** — improves narrative confidence and qualitative IA/copy insight; **not** a **`(A)`** headline readiness prerequisite (aligned with participant usability-study policy in the header).

**Reason:** Useful when external participants can be recruited; deferred when not — **scores are not reduced** for skipping it.

**Information needed:** If you choose to pursue this: availability of architects for ~30-minute sessions, remote vs onsite, NDA/consent norms.

### Improvement 11: Produce a 3-Minute Demo Video

**Why it matters:** A polished short-form demo is the single highest-leverage **Marketability** artifact for cold outreach, landing pages, and procurement decks. No buyer reads 682 markdown files; most will watch a 3-minute video. Also strengthens Differentiability (shows the unique commit → manifest → artifacts flow) and Adoption Friction (sets expectations before signup).

**Expected impact:** Marketability (+4–6 pts), Differentiability (+2–3 pts), Adoption Friction (+1–2 pts). Weighted readiness impact: +0.4–0.7%.

**Affected qualities:** Marketability, Differentiability, Adoption Friction, Time-to-Value

**Status:** Actionable now (demo seed, `/demo/preview`, offline demo pack exist). Requires screen recording + narration.

**Information needed:** Preferred narration voice (owner, AI-generated, professional). Hosting target (YouTube unlisted, marketing site embed, both).

### Improvement 12: Ship Confluence Publish Connector to Staging

**Why it matters:** Confluence is **V1 GA scope** per `V1_SCOPE.md` §2.15 and the Atlassian pair commitment. Shipping the outbound publish to staging closes part of the ITSM/documentation connector obligation and directly lifts Workflow Embeddedness and Interoperability.

**Expected impact:** Workflow Embeddedness (+3–5 pts), Interoperability (+3–5 pts). Weighted readiness impact: +0.2–0.4%.

**Affected qualities:** Workflow Embeddedness, Interoperability, Adoption Friction

**Status:** Actionable now (single-space, API token auth minimum viable shape described in `V1_SCOPE.md` §2.15)

**Cursor Prompt:**
```
Ship the V1 minimum viable Confluence Cloud publish connector to a staging-testable state.

Context:
- V1_SCOPE.md §2.15 defines the MVP: one-way publish to a single fixed Confluence:DefaultSpaceKey per tenant, Confluence API token + basic auth for V1
- Existing ITSM outbound patterns in ArchLucid.Application/Integrations/Itsm/Outbound/ should inform the structure
- The connector should consume Authority-shaped event payloads, same as webhooks
- Configuration keys: Confluence:DefaultSpaceKey, Confluence:ApiToken, Confluence:BaseUrl, Confluence:UserEmail

Tasks:
1. Create ArchLucid.Application/Integrations/Confluence/ConfluencePagePublishService.cs
   - Accept a finding summary or run summary payload
   - POST to Confluence Cloud REST API v2 (POST /wiki/api/v2/pages) with storage-format body
   - Return the created page URL and page ID for correlation
2. Create ArchLucid.Application/Integrations/Confluence/ConfluencePublishOptions.cs for configuration binding
3. Add POST /v1/integrations/confluence/publish endpoint gated by ExecuteAuthority
4. Persist a ConfluencePublishCorrelation row (runId, pageId, spaceKey, publishedUtc)
5. Emit audit events: Integration.ConfluencePublishSucceeded, Integration.ConfluencePublishFailed
6. Add vendor HTTP conformance tests with a mock Confluence API handler
7. Add Problem+JSON error handling for auth failure, space not found, rate limit

Acceptance criteria:
- Publish creates a page in the configured space with findings content
- Correlation row persists on success
- Audit events fire for success and failure
- Problem+JSON errors include space key and correlation ID
- All existing tests pass

Constraints:
- Single space only (no multi-space routing)
- API token + basic auth only (no OAuth in this change)
- Do not add Confluence NuGet packages — use HttpClient directly
- Follow existing ITSM outbound patterns for service/controller/test structure
```

### Improvement 13: Simulator vs Real-LLM Drift Detection

**Why it matters:** Engineering Risk #1 and the **§2.1 Correctness** uncertainty both hinge on the **unquantified gap** between simulator outputs and real Azure OpenAI outputs for identical inputs. A drift-detection mechanism lets you measure this gap and track it over time.

**Expected impact:** Correctness (+3–5 pts), AI/Agent Readiness (+2–4 pts), Testability (+1–2 pts). Weighted readiness impact: +0.3–0.5%.

**Affected qualities:** Correctness, AI/Agent Readiness, Testability, Trustworthiness

**Status:** Actionable now (Azure OpenAI dev endpoint and `gpt-4o` deployment are provisioned; CI real-mode gate is wired)

**Cursor Prompt:**
```
Build a simulator-vs-real-LLM drift detection mechanism for golden cohort scenarios.

Context:
- Azure OpenAI endpoint: https://oai-archlucid-dev.services.ai.azure.com/api/projects/proj-default
- Deployment: gpt-4o
- AgentExecution:Mode toggles between Simulator and real mode
- Golden cohort scenarios in tests/golden-cohort/ and tests/eval-corpus/
- Simulator produces deterministic outputs; real LLM produces variable outputs

Tasks:
1. Create a drift detection test class: ArchLucid.AgentRuntime.Tests/DriftDetection/SimulatorVsRealDriftTests.cs
   - For each golden cohort scenario:
     a. Run the scenario in Simulator mode, capture structured output (findings count, severity distribution, finding titles)
     b. Run the same scenario in real mode against gpt-4o, capture the same structured output
     c. Compute drift metrics: finding count delta, severity distribution divergence, title overlap (Jaccard), recommendation overlap
   - Store results as tests/golden-cohort/drift-reports/{scenario-name}-drift.json
2. Create a DriftReport model: { scenarioName, simulatorFindings, realFindings, countDelta, severityDivergence, titleOverlap, recommendationOverlap, timestamp }
3. Create a summary aggregator that produces tests/golden-cohort/DRIFT_SUMMARY.md:
   - Average drift across scenarios
   - Scenarios with highest divergence
   - Trend over time (append-only JSON log)
4. Wire as a manual-trigger CI job (not on every PR — too expensive)

Acceptance criteria:
- Drift report JSON produced for at least 3 existing golden cohort scenarios
- Summary document shows quantified gap between simulator and real
- No hard failures if real mode produces lower quality — document the gap
- Test is skippable when AOAI credentials are absent (SkipIfNoRealMode attribute)

Constraints:
- Do not modify simulator behavior to match real mode
- Do not modify real-mode behavior to match simulator
- Measure and report only — no auto-correction
- Budget: cap total token spend at configurable limit per drift run
```

### Improvement 14: "Quick Decision Summary" on Run Detail

**Why it matters:** **Decision Velocity (§2.18)** scores low partly because interpreting a full manifest requires expertise and time. A concise "top 3 actionable items" summary, derived from existing finding severity and recommendation fields, gives operators an immediate next step without reading the entire manifest.

**Expected impact:** Decision Velocity (+4–6 pts), Time-to-Value (+2–3 pts), Executive Value Visibility (+1–2 pts). Weighted readiness impact: +0.15–0.3%.

**Affected qualities:** Decision Velocity, Time-to-Value, Executive Value Visibility, Cognitive Load

**Status:** Actionable now (findings with severity and recommendations exist in committed runs)

**Cursor Prompt:**
```
Add a "Quick Decision Summary" card to the run detail page that extracts the top 3 highest-severity actionable findings.

Context:
- Run detail page: archlucid-ui/src/app/(operator)/reviews/[runId]/
- Findings are available from the run detail API response with severity, title, and recommendation fields
- The card should appear above the full findings list

Tasks:
1. Create archlucid-ui/src/components/QuickDecisionSummary.tsx
   - Accept an array of findings
   - Sort by severity (Critical > High > Medium > Low > Info), then by finding order
   - Display the top 3 as numbered action items: severity badge, title, first sentence of recommendation
   - Link each item to its finding detail anchor
2. Add the component to the run detail page, visible when at least one finding exists
3. Show "No findings to act on" when the run has zero findings
4. Add Vitest test and axe accessibility check

Acceptance criteria:
- Top 3 findings display correctly sorted by severity
- Each item links to the full finding
- Empty state renders gracefully
- Accessibility test passes
- No new API calls — derive from existing run detail data

Constraints:
- Client-side derivation only — no new API endpoint
- Do not modify existing finding components
- Keep the component under 100 lines
```

### Improvement 15: "What Changed Since Your Last Review" Summary

**Why it matters:** Architecture review value compounds over time — comparison/replay already exist but require navigating to a separate view. A lightweight "delta since your last committed review" on the run detail page directly surfaces **Change Impact Clarity (§2.31)** and reinforces **Stickiness (§2.25)**.

**Expected impact:** Change Impact Clarity (+4–6 pts), Stickiness (+2–3 pts), Executive Value Visibility (+1–2 pts). Weighted readiness impact: +0.1–0.2%.

**Affected qualities:** Change Impact Clarity, Stickiness, Executive Value Visibility

**Status:** Actionable now (comparison API exists; previous run is queryable)

**Cursor Prompt:**
```
Add a "Changes since last review" summary banner to the run detail page when a prior committed run exists for the same project.

Context:
- Comparison endpoint exists: GET /v1/architecture/comparisons (or run comparison logic in Application layer)
- Run list is per-project, ordered by creation date
- Run detail page: archlucid-ui/src/app/(operator)/reviews/[runId]/

Tasks:
1. On run detail load, query the previous committed run for the same project
2. If a previous run exists, display a collapsible banner showing:
   - "Compared to your previous review on [date]:"
   - Net change in finding count (e.g., "+3 new findings, -1 resolved")
   - Severity shift summary (e.g., "1 new Critical, 2 new Medium")
   - Link to full comparison view
3. If no previous run exists, do not render the banner
4. Add Vitest test for the component

Acceptance criteria:
- Banner displays accurate delta when a prior run exists
- Banner is absent when no prior run exists
- Link navigates to the comparison page
- No new API endpoints — use existing comparison and run list data

Constraints:
- Read-only display
- Do not call comparison API on every render — cache or derive from already-fetched data where possible
```

### Improvement 16: Publish TypeScript API Types as npm Package

**Why it matters:** `api-types.generated.ts` exists but is only consumed internally by `archlucid-ui`. Publishing it as an npm package (even private/scoped) enables external integrators and future MCP membrane work (V1.1) to use typed ArchLucid API clients in TypeScript/Node without hand-rolling types. Lifts **Interoperability (§2.17)**.

**Expected impact:** Interoperability (+3–5 pts), Extensibility (+1–2 pts). Weighted readiness impact: +0.1–0.2%.

**Affected qualities:** Interoperability, Extensibility, Evolvability

**Status:** Actionable now (types are generated; needs packaging and publish pipeline)

**Cursor Prompt:**
```
Package the generated TypeScript API types for publication as a scoped npm package.

Context:
- archlucid-ui/src/lib/api-types.generated.ts is the source (generated by npm run generate:api-types)
- The package should be @archlucid/api-types (or scoped appropriately)

Tasks:
1. Create archlucid-ui/packages/api-types/ with its own package.json, tsconfig.json, and README
2. Copy or symlink api-types.generated.ts as the main export
3. Add a build step that compiles to .d.ts + .js (ESM)
4. Add a prepublish script that regenerates types from the OpenAPI snapshot before publish
5. Add a version field that tracks the OpenAPI snapshot version or API version
6. Update archlucid-ui to consume from the local package (workspace dependency)

Acceptance criteria:
- npm pack produces a valid tarball
- Types match the current OpenAPI snapshot
- archlucid-ui still builds against the workspace package
- README documents usage for external consumers

Constraints:
- Do not publish to public npm yet — prepare for private/scoped publish
- Do not change the generation pipeline — just package the output
```

### Improvement 17: Competitive Positioning Comparison Document

**Why it matters:** Buyers ask "why not just use Confluence and manual reviews?" or "how does this compare to [competitor]?" The procurement pack and objection playbook exist but lack a structured **head-to-head comparison** artifact. This is the lowest-hanging **Differentiability (§2.14)** and **Procurement Readiness (§2.16)** improvement.

**Expected impact:** Differentiability (+3–5 pts), Procurement Readiness (+2–3 pts), Marketability (+2–3 pts). Weighted readiness impact: +0.2–0.4%.

**Affected qualities:** Differentiability, Procurement Readiness, Marketability

**Status:** Actionable now (positioning doc and objection playbook exist as source material)

**Cursor Prompt:**
```
Create a structured competitive positioning comparison document for the procurement pack.

Context:
- docs/go-to-market/POSITIONING.md exists with value proposition
- docs/go-to-market/OBJECTION_PLAYBOOK.md exists with objection handling
- Target comparisons: (1) Manual architecture review + Confluence/SharePoint, (2) Diagram-first tools (Lucidchart, Miro), (3) GRC platforms (ServiceNow GRC, Archer)

Tasks:
1. Create docs/go-to-market/COMPETITIVE_COMPARISON.md
2. Structure as a comparison matrix with rows for:
   - Structured output (manifest vs freeform), Evidence trail, Governance gate, Typed findings, Comparison/replay, API-first, Audit trail, Cost model transparency
3. For each competitor category, note what they do well and where ArchLucid differentiates
4. Include a "Why not just use [X]?" FAQ section (3-4 entries)
5. Keep it factual — no unsupported claims about competitors

Acceptance criteria:
- Matrix covers at least 3 competitor categories
- FAQ has at least 3 entries
- No competitor trade names used in claims that could be challenged
- Document fits in the procurement pack CLI build

Constraints:
- Do not add competitor logos or trademarks
- Keep under 300 lines
- Factual and defensible — cite ArchLucid capabilities only, note competitor gaps by category
```

### Improvement 18: Dogfood ROI — Use ArchLucid to Review ArchLucid's Architecture

**Why it matters:** The ROI model cites $288K+ annual savings but has **zero logged outcomes**. Running ArchLucid against its own architecture and measuring time-to-insight vs a manual review produces the first real data point for **Proof-of-ROI (§2.7)** and validates the pipeline end-to-end.

**Expected impact:** Proof-of-ROI Readiness (+4–6 pts), Correctness (+2–3 pts), Marketability (+2–3 pts). Weighted readiness impact: +0.3–0.5%.

**Affected qualities:** Proof-of-ROI Readiness, Correctness, Marketability, Trustworthiness

**Status:** Actionable now (Azure OpenAI dev endpoint with `gpt-4o` deployment is provisioned)

**Cursor Prompt:**
```
Run ArchLucid in real mode against its own architecture to produce the first dogfood ROI evidence.

Context:
- Azure OpenAI endpoint: https://oai-archlucid-dev.services.ai.azure.com/api/projects/proj-default
- Deployment: gpt-4o
- Architecture source material: docs/architecture/, docs/library/V1_SCOPE.md, the C4 architecture poster
- The product has agent types: Topology, Compliance, Cost, Critic
- ROI telemetry: RunRoiTelemetryRow, value report pages
- AgentExecution:Mode must be set to real mode

Tasks:
1. Write an architecture request JSON (templates/architecture-requests/archlucid-self-review.json):
   - System: "ArchLucid — Architecture Decision Intelligence Platform"
   - Description: summarize from docs/architecture/ARCHITECTURE_OVERVIEW.md
   - Technology stack: .NET 9, Azure SQL, Azure OpenAI, Container Apps, React/Next.js
   - Review objectives: architecture integrity, scalability posture, security boundaries, cost structure
   - Constraints: multi-tenant SaaS, database-per-tenant, agent pipeline with LLM dependency
2. Run the full authority pipeline against this brief in real mode
3. Capture the committed manifest, findings, and execution traces
4. Measure and document:
   - Wall clock time from request to committed manifest
   - Token usage (prompt + completion) per agent type
   - Total estimated cost from LlmCostEstimator
   - Finding count and severity distribution
   - Quality gate scores (structural + semantic)
5. Write results to docs/evidence/DOGFOOD_ROI_EVIDENCE.md:
   - Time comparison: "ArchLucid produced N findings in X minutes vs estimated Y hours for manual review"
   - Cost: "Estimated LLM cost: $Z per review"
   - Quality: quality gate scores and finding sample
6. Save the architecture-request, manifest, and traces as reference artifacts

Acceptance criteria:
- Complete real-mode run with committed manifest
- All quality gates pass
- ROI evidence document committed with measured numbers
- Token usage and cost captured
- Architecture request saved as a reusable scenario

Constraints:
- Real mode only — simulator results are not meaningful for ROI claims
- Do not modify agent prompts to improve results against ArchLucid specifically
- Document actual results honestly, including any low-quality findings
```

### Improvement 19: First Quarterly Chaos Exercise on Staging

**Why it matters:** **Reliability (§2.20)** and **Availability (§2.34)** both cite aspirational targets without exercise evidence. Running the chaos exercise calendar's first entry on staging and documenting results converts "we plan chaos testing" into "we have done chaos testing." Also lifts Trustworthiness.

**Expected impact:** Reliability (+3–5 pts), Availability (+2–3 pts), Trustworthiness (+1–2 pts). Weighted readiness impact: +0.15–0.3%.

**Affected qualities:** Reliability, Availability, Trustworthiness, Supportability

**Status:** DEFERRED (requires staging environment access and Container Apps admin permissions)

**Information needed:** Staging environment credentials and confirmation that the chaos exercise calendar first entry (likely "kill one API replica during a run") is the desired first exercise.

### Improvement 20: Sample Policy Packs for Common Scenarios

**Why it matters:** **Template and Accelerator Richness (§2.26)** and **Policy and Governance (§2.28)** both note the absence of pre-built policy packs. Creating 2–3 sample packs for common compliance scenarios gives buyers a starting point and demonstrates the governance framework in action.

**Expected impact:** Template Richness (+5–8 pts), Policy/Governance Alignment (+3–5 pts), Adoption Friction (+1–2 pts). Weighted readiness impact: +0.15–0.3%.

**Affected qualities:** Template and Accelerator Richness, Policy and Governance Alignment, Adoption Friction, Marketability

**Status:** Actionable now (policy pack framework, scope assignments, and governance resolution exist)

**Cursor Prompt:**
```
Create sample policy packs for three common enterprise scenarios.

Context:
- Policy pack framework exists in ArchLucid.Application with scope assignments and effective governance resolution
- Policy packs are JSON-based with rule definitions
- GovernancePolicyPackService handles pack lifecycle
- Existing demo seed may have a basic pack

Tasks:
1. Create docs/samples/policy-packs/soc2-compliance-baseline.json
   - Rules for: data classification findings must have severity >= Medium, encryption recommendations must cite specific standards, access control findings must reference least-privilege
2. Create docs/samples/policy-packs/cloud-migration-readiness.json
   - Rules for: cost impact findings must include estimated range, availability findings must cite RTO/RPO, dependency findings must enumerate external services
3. Create docs/samples/policy-packs/architecture-review-governance.json
   - Rules for: all Critical findings require approval before commit, findings count floor (at least N findings per review), recommendation specificity threshold
4. Add a README.md in docs/samples/policy-packs/ explaining how to import each pack
5. Validate each JSON against the policy pack schema

Acceptance criteria:
- Each pack loads without error via the governance API or CLI
- README covers import steps
- Packs demonstrate different rule types (severity gate, count threshold, content pattern)
- No hardcoded tenant or environment references

Constraints:
- JSON format matching existing policy pack schema
- Do not modify the policy pack framework
- Keep each pack under 50 rules (demonstrative, not exhaustive)
```

### Improvement 21: Searchable Help Index in Operator UI

**Why it matters:** **Customer Self-Sufficiency (§2.30)** and **Documentation (§2.43)** both cite the "682 markdown files" navigation problem. A lightweight in-product search index over key docs (runbooks, configuration reference, troubleshooting) lets operators find answers without leaving the product.

**Expected impact:** Customer Self-Sufficiency (+5–7 pts), Cognitive Load (+2–3 pts), Documentation (+1–2 pts). Weighted readiness impact: +0.15–0.25%.

**Affected qualities:** Customer Self-Sufficiency, Cognitive Load, Documentation, Usability

**Status:** Actionable now (docs exist; needs a search index and UI component)

**Cursor Prompt:**
```
Add a searchable help panel to the operator UI shell that indexes key documentation.

Context:
- Operator shell: archlucid-ui/src/components/ShellNav.tsx
- Command palette already exists (keyboard shortcut infrastructure)
- Key docs to index: PILOT_GUIDE.md, TROUBLESHOOTING.md, CONFIGURATION_REFERENCE.md, CORE_PILOT.md, FAQ entries from PROCUREMENT_FAQ.md

Tasks:
1. Create archlucid-ui/src/lib/help-index.ts
   - Build a static search index at build time from a curated list of markdown files
   - Index title, headings, and first paragraph of each section
   - Use a lightweight client-side search (e.g., Fuse.js or similar — check what is already in package.json)
2. Create archlucid-ui/src/components/HelpSearchPanel.tsx
   - Slide-out panel triggered by a "?" icon in the shell header or Cmd+?
   - Search input with results showing: doc title, matching section heading, excerpt
   - Click result opens the relevant doc section (external link to docs or inline)
3. Add to the shell layout
4. Add Vitest test and axe accessibility check

Acceptance criteria:
- Search returns relevant results for "how to create a run", "configuration", "troubleshooting"
- Panel opens and closes cleanly
- Keyboard navigable
- axe test passes
- Build-time index — no runtime API call to fetch docs

Constraints:
- Do not add a full-text search server
- Index only curated operator-relevant docs (not all 682 files)
- Keep the index under 500KB
- If Fuse.js is not already a dependency, check for an existing lightweight alternative before adding
```

### Improvement 22: Complete VPAT "Not Evaluated" Criteria

**Why it matters:** **Accessibility (§2.29)** notes that the VPAT draft has criteria marked "Not Evaluated." Completing evaluation for those criteria strengthens the compliance story and removes a gap buyers may flag in procurement questionnaires.

**Expected impact:** Accessibility (+3–5 pts), Compliance Readiness (+1–2 pts), Procurement Readiness (+1 pt). Weighted readiness impact: +0.05–0.15%.

**Affected qualities:** Accessibility, Compliance Readiness, Procurement Readiness

**Status:** Actionable now (VPAT draft exists; requires manual evaluation of identified criteria)

**Information needed:** The specific VPAT criteria currently marked "Not Evaluated" — read from `docs/accessibility/VPAT_*.md` or equivalent.

### Improvement 23: Vendor COGS Observability — Estimated vs Billed LLM Reconciliation

**Why it matters:** The primary lever for **Cost-Effectiveness (§2.46)** per this assessment's header definition is **vendor economics**, not tenant dashboards. Reconciling `LlmCostEstimator` numbers against actual Azure OpenAI billing data on a staging slice produces the first **validated** COGS baseline and identifies whether estimates drift from reality.

**Expected impact:** Cost-Effectiveness (+4–6 pts on the **vendor-economic core**), Reliability (+1 pt for budget accuracy). Weighted readiness impact: +0.05–0.15%.

**Affected qualities:** Cost-Effectiveness (primary), Reliability, Trustworthiness

**Status:** Actionable now (Azure OpenAI dev endpoint `oai-archlucid-dev` is provisioned; run golden cohort scenarios in real mode and compare `LlmCostEstimator` output against Azure Cost Management for the resource)

**Cursor Prompt:**
```
Reconcile LlmCostEstimator output against actual Azure OpenAI billing for a sample workload.

Context:
- LlmCostEstimator in ArchLucid.AgentRuntime/LlmCostEstimator.cs
- LlmCostEstimationOptions: InputUsdPerMillionTokens, OutputUsdPerMillionTokens
- Azure OpenAI resource: oai-archlucid-dev
- Golden cohort scenarios exist in tests/eval-corpus/ and tests/golden-cohort/
- AgentExecution traces capture token usage per agent call

Tasks:
1. Run 5-10 golden cohort scenarios in real mode against gpt-4o, capturing:
   - Per-run: LlmCostEstimator estimated USD, prompt tokens, completion tokens
   - Aggregate: total estimated USD across all runs
2. After runs complete, query Azure Cost Management for the oai-archlucid-dev resource:
   - Filter to the time window of the test runs
   - Extract actual billed amount for the Azure OpenAI meter
3. Create docs/evidence/LLM_COST_RECONCILIATION.md documenting:
   - Per-scenario: estimated vs (proportional) actual cost
   - Aggregate: total estimated vs total billed
   - Drift percentage: abs(estimated - actual) / actual × 100
   - Analysis: whether LlmCostEstimationOptions rates need adjustment
4. If drift exceeds 20%, propose updated rates for LlmCostEstimationOptions

Acceptance criteria:
- At least 5 real-mode runs with captured cost estimates
- Reconciliation document committed
- Drift percentage quantified
- Rate adjustment proposed if drift is material

Constraints:
- Do not modify LlmCostEstimator logic in this change — measure first
- Azure Cost Management data may lag 24-48 hours; document the time window
- Use the dev AOAI resource only — not production
```

### Improvement 24: Production Deployment Runbook — Step-by-Step Checklist

**Why it matters:** **Deployability (§2.37)** scores 71 partly because the full SaaS stack deployment has not been validated end-to-end and deploy scripts have environment-specific assumptions. A concrete step-by-step production deployment checklist converts operational knowledge into repeatable process.

**Expected impact:** Deployability (+3–5 pts), Supportability (+1–2 pts), Reliability (+1 pt). Weighted readiness impact: +0.05–0.15%.

**Affected qualities:** Deployability, Supportability, Reliability, Manageability

**Status:** Actionable now (deploy scripts, Terraform modules, and CD pipeline definitions exist as source material)

**Cursor Prompt:**
```
Create a step-by-step production deployment runbook for the hosted SaaS stack.

Context:
- infra/apply-saas.ps1 orchestrates Terraform
- CD pipelines: .github/workflows/cd-staging-on-merge.yml, cd-saas-greenfield.yml
- DbUp migrations run on API startup
- Container Apps deployment via Terraform container-apps module
- Pre-deployment: BillingProductionSafetyRules must pass

Tasks:
1. Create docs/runbooks/PRODUCTION_DEPLOYMENT.md
2. Structure as a numbered checklist:
   - Pre-flight checks (subscription access, Key Vault secrets populated, DNS configured, Terraform state backend initialized)
   - Terraform plan review (infra/apply-saas.ps1 -WhatIf equivalent)
   - Terraform apply sequence (networking → SQL → identity → app → edge → monitoring)
   - Post-Terraform validation (health probes, version endpoint, BillingProductionSafetyRules startup gate)
   - Database migration verification (DbUp applied, system catalog healthy)
   - Smoke test (release-smoke.ps1 against production URL)
   - DNS cutover and Front Door verification
   - Post-deployment monitoring (first 30 min checklist)
   - Rollback procedure (which Terraform state to revert, how to drain)
3. Include minimum Azure RBAC permissions needed for each step
4. Note which steps are owner-only vs automatable

Acceptance criteria:
- A new operator following only this doc can deploy to a clean subscription
- Each step has a verification criterion (how to confirm it worked)
- Rollback procedure is documented
- Minimum Azure permissions are listed

Constraints:
- Do not include actual secrets, subscription IDs, or resource names
- Reference existing scripts and Terraform modules by path — do not duplicate logic
- Keep under 400 lines
```

### Improvement 25: "Reasoning Summary" Field for Finding Inspection

**Why it matters:** **Explainability (§2.23)** notes that operators see *what data* led to a finding but not *why* the AI recommended what it did. Adding a human-readable 2–3 sentence reasoning summary to the finding inspector bridges this gap.

**Expected impact:** Explainability (+4–6 pts), Trustworthiness (+2–3 pts), Cognitive Load (+1–2 pts). Weighted readiness impact: +0.1–0.2%.

**Affected qualities:** Explainability, Trustworthiness, Cognitive Load, Differentiability

**Status:** Actionable now (finding inspector, decision rule, and evidence nodes exist; reasoning can be derived from existing finding metadata)

**Cursor Prompt:**
```
Add a "reasoning summary" field to the finding inspection response and display it in the finding inspector UI.

Context:
- Finding inspector: archlucid-ui/src/components/ (FindingInspector or equivalent)
- Explain API: GET /v1/explain/runs/{runId}/explain returns ExplanationResult
- Findings have severity, title, recommendation, decision rule, and evidence nodes

Tasks:
1. In ArchLucid.Application, add a ReasoningSummaryBuilder service
   - Input: a single finding with its decision rule and evidence nodes
   - Output: 2-3 sentence human-readable string explaining why this finding was generated
   - Template: "This [severity] finding was triggered because [decision rule summary]. The evidence shows [top evidence node summary]. The recommendation to [first sentence of recommendation] addresses [risk category]."
   - Use existing finding fields — do not call the LLM for this
2. Extend the finding inspection DTO to include reasoningSummary: string | null
3. Populate when the finding has sufficient metadata; null otherwise
4. In the finding inspector UI, display the reasoning summary in a highlighted box above the evidence chain
5. Add unit tests for ReasoningSummaryBuilder with edge cases (missing evidence, missing recommendation)

Acceptance criteria:
- Reasoning summary displays for findings with complete metadata
- Graceful null/absent handling when metadata is sparse
- No LLM calls — deterministic template-based generation
- Existing tests pass
- axe accessibility check on the inspector passes

Constraints:
- Template-based only — no LLM inference
- Do not modify finding persistence or core finding types
- New service in Application layer, new DTO field in Contracts
```

### Improvement 26: Load Test Baseline Against Staging with SQL

**Why it matters:** **Performance (§2.32)** and **Scalability (§2.33)** both cite the absence of published performance numbers against real infrastructure. Running the existing k6 load tests against staging with SQL and publishing request latency / throughput characteristics converts "we have load tests" into "we have load test results."

**Expected impact:** Performance (+4–6 pts), Scalability (+2–3 pts), Reliability (+1–2 pts). Weighted readiness impact: +0.1–0.2%.

**Affected qualities:** Performance, Scalability, Reliability, Trustworthiness

**Status:** DEFERRED (requires staging environment access)

**Information needed:** Staging API base URL with SQL backend; confirmation that k6 scripts in the repo are current and runnable.

### Improvement 27: Geo-Failover Drill on Staging

**Why it matters:** **Availability (§2.34)** cites a geo-failover drill runbook but no evidence of execution. Completing the first drill and documenting RTO/RPO actuals validates the disaster recovery posture.

**Expected impact:** Availability (+4–6 pts), Reliability (+2–3 pts), Trustworthiness (+1–2 pts). Weighted readiness impact: +0.1–0.15%.

**Affected qualities:** Availability, Reliability, Trustworthiness, Deployability

**Status:** DEFERRED (requires staging with SQL failover group and Container Apps admin access)

**Information needed:** Staging SQL failover group name and paired region; Container Apps resource group.

### Improvement 28: Stale-Doc Detector for Maintenance Hygiene

**Why it matters:** **Maintainability (§2.22)** notes that 682 markdown files in docs/ creates a parallel codebase. A simple CI-friendly script that flags docs not updated in 90+ days that reference specific code paths keeps documentation aligned with code evolution.

**Expected impact:** Maintainability (+2–3 pts), Documentation (+1–2 pts). Weighted readiness impact: +0.05–0.1%.

**Affected qualities:** Maintainability, Documentation, Supportability

**Status:** Actionable now

**Cursor Prompt:**
```
Create a CI-friendly stale-doc detector script.

Context:
- 682+ markdown files in docs/
- Some reference code paths (file paths, class names) that may have changed
- CI scripts live in scripts/ci/

Tasks:
1. Create scripts/ci/detect_stale_docs.py (or .ps1)
   - For each .md file in docs/, check git log for last modification date
   - Flag files not modified in 90+ days that contain code path references (patterns: .cs, .tsx, .ts file paths, or class/interface names like IFoo, FooService)
   - Output a report: file path, last modified date, number of code references found
   - Exit code 0 (warn mode — does not block CI)
2. Add to CI as a continue-on-error step
3. Exclude docs/archive/ from scanning

Acceptance criteria:
- Script runs in under 30 seconds on the repo
- Output is human-readable
- Does not block CI (warn mode)
- Excludes archived docs

Constraints:
- No new dependencies beyond Python standard library (or PowerShell built-ins)
- Warn-only — never merge-blocking
```

### Improvement 29: Dry-Run Procurement Pack Against Enterprise Questionnaire

**Why it matters:** **Procurement Readiness (§2.16)** notes the pack has not been tested against a real-style questionnaire. Running the CLI-built pack through a synthetic enterprise security questionnaire (modeled on a CAIQ-style or SIG-style template) identifies placeholder text, missing answers, and format issues before a real buyer sees them.

**Expected impact:** Procurement Readiness (+4–6 pts), Trustworthiness (+1–2 pts), Compliance Readiness (+1–2 pts). Weighted readiness impact: +0.1–0.2%.

**Affected qualities:** Procurement Readiness, Trustworthiness, Compliance Readiness

**Status:** Actionable now (procurement pack CLI, CAIQ/SIG pre-fills exist)

**Cursor Prompt:**
```
Perform a dry-run audit of the procurement pack against a synthetic enterprise security questionnaire.

Context:
- CLI: archlucid procurement-pack (builds the pack with manifest, checksums, redaction report)
- CAIQ pre-fill: docs/go-to-market/caiq-lite-prefill.md (or .json)
- SIG pre-fill: docs/go-to-market/sig-core-prefill.md (or .json)
- DPA template: docs/go-to-market/DPA_TEMPLATE.md

Tasks:
1. Run archlucid procurement-pack and inspect every file in the output
2. Check for: placeholder text (TODO, TBD, PLACEHOLDER, [FILL], draft markers), empty sections, broken internal links, formatting issues
3. Cross-reference CAIQ pre-fill against CAIQ Lite v4 question IDs — flag any unanswered or "N/A without justification" entries
4. Cross-reference SIG pre-fill against SIG Core question set — same check
5. Verify DPA template has no placeholder party names or dates
6. Write findings to docs/go-to-market/PROCUREMENT_PACK_DRYRUN_RESULTS.md
7. Fix any placeholder text or broken links found

Acceptance criteria:
- Zero TODO/TBD/PLACEHOLDER markers remain in the pack output
- All CAIQ/SIG pre-fill entries have substantive answers or justified N/A
- DPA template is clean of placeholder content
- Dry-run results document is committed

Constraints:
- Do not change the procurement pack CLI logic
- Do not invent compliance answers — flag gaps for owner review
```

### Improvement 30: Verify `infra/apply-saas.ps1` End-to-End on Clean Subscription

**Why it matters:** **Azure Compatibility (§2.24)** and **Deployability (§2.37)** both cite the gap between "IaC exists" and "IaC has been validated on a clean subscription." Running the SaaS provisioning script end-to-end and documenting the minimum Azure permissions closes this gap.

**Expected impact:** Azure Compatibility (+2–3 pts), Deployability (+3–5 pts). Weighted readiness impact: +0.1–0.15%.

**Affected qualities:** Azure Compatibility, Deployability, Reliability

**Status:** DEFERRED (requires a clean Azure subscription with sufficient quota)

**Information needed:** Azure subscription ID for validation. Minimum expected quota: Container Apps environment, Azure SQL logical server, Key Vault, Storage account, Front Door profile.

### Improvement 31: Verify Dashboard Queries Return Meaningful Data Against Staging

**Why it matters:** **Observability (§2.38)** cites Grafana dashboards and Prometheus SLO rules deployed via Terraform, but no evidence they return useful data. A quick validation pass against staging confirms dashboards are not empty shells.

**Expected impact:** Observability (+3–5 pts), Supportability (+1–2 pts). Weighted readiness impact: +0.05–0.1%.

**Affected qualities:** Observability, Supportability, Reliability

**Status:** DEFERRED (requires staging Grafana instance access)

**Information needed:** Staging Grafana URL and viewer credentials.

### Improvement 32: Mutation Testing on Critical Paths (Commit + Governance Gate)

**Why it matters:** **Testability (§2.39)** is already strong (79) but notes Stryker mutation score is not tracked over the most critical paths. Running Stryker against the commit and governance gate paths identifies surviving mutants in the code that matters most for correctness guarantees.

**Expected impact:** Testability (+2–3 pts), Correctness (+1–2 pts). Weighted readiness impact: +0.05–0.1%.

**Affected qualities:** Testability, Correctness, Reliability

**Status:** Actionable now (Stryker is configured in the repo)

**Cursor Prompt:**
```
Run Stryker mutation testing against the commit and governance gate paths and document the results.

Context:
- Stryker is already configured in the repo
- Critical paths: AuthorityCommitService (or equivalent commit orchestration), GovernancePreCommitGateService (or equivalent governance gate)

Tasks:
1. Configure a Stryker mutation run scoped to:
   - ArchLucid.Application/**/Commit/ (or the commit service namespace)
   - ArchLucid.Application/**/Governance/ (or the governance gate namespace)
2. Run the mutation test and capture the report
3. Document results in docs/testing/MUTATION_TESTING_CRITICAL_PATHS.md:
   - Mutation score percentage
   - Count of survived mutants with file and line
   - Top 5 surviving mutants ranked by risk
4. Fix or add tests for any surviving mutants in the commit path that would allow an uncommitted run to appear committed, or a governance gate to be bypassed

Acceptance criteria:
- Mutation report is committed
- Zero surviving mutants that bypass commit integrity or governance gate logic
- Existing tests still pass

Constraints:
- Scope to commit and governance paths only (not full repo — too slow)
- Do not weaken existing test assertions to kill mutants
```

---

## 10. Pending Questions for Later

### Improvement 3 (Trial Funnel)
- Is staging.archlucid.net currently accessible and configured with Stripe TEST keys?
- What is the desired trial tenant duration before auto-expiration?

### Improvement 6 (Audit Gaps)
- Are there any current known gaps in the audit coverage matrix beyond what was documented as of 2026-04-23?
- Are there new flows added since the last audit matrix review that need coverage?

### Improvement 8 (Hosted Trial)
- Should trial evaluators share a staging environment or get isolated per-tenant provisioning?
- What Azure region should the trial environment target?

### Improvement 10 (optional architect sessions — `(B)`)
- If run: cohort source (customers vs advisors vs pilots), incentive, scheduling constraints?
- Preferred modality: moderated task-based vs exploratory interview?

### Improvement 11 (Demo Video)
- Preferred narration: owner voice, AI-generated, or professional voiceover?
- Hosting: YouTube unlisted, marketing site embed, or both?

### Improvement 18 (Dogfood ROI)
- Which architecture brief focus for the self-review: full system, a subsystem, or a specific decision?

### Improvement 19 (Chaos Exercise)
- Staging environment credentials and Container Apps admin permissions?
- Confirm first exercise type: "kill one API replica during a run"?

### Improvement 22 (VPAT Completion)
- Which specific VPAT criteria are currently marked "Not Evaluated"?

### Improvement 26 (Load Test Baseline)
- Staging API base URL with SQL backend?
- Are k6 scripts current and runnable?

### Improvement 27 (Geo-Failover Drill)
- Staging SQL failover group name, paired region, and Container Apps resource group?

### Improvement 30 (apply-saas.ps1 Validation)
- Clean Azure subscription ID with Container Apps, SQL, Key Vault, Storage, Front Door quota?

### Improvement 31 (Dashboard Validation)
- Staging Grafana URL and viewer credentials?

### General
- What is the expected timeline for first customer engagement? This affects prioritization of ITSM connectors vs trial funnel vs executive surfaces.
- Is there a target for the first paid pilot, and does it have specific integration requirements (e.g., "must integrate with Jira")?

---

## Deferred Scope Uncertainty

All deferred items referenced in this assessment (MCP/V1.1, SOC 2 CPA/post-V1.1, third-party pen test/V2, commerce un-hold/V1.1, design partner/V1.1, PGP key/V1.1, Redis elevation/V2, Container Apps Jobs + DTF/V2, **custom agent-handler customer documentation/V2**, **hosted trial `V1`→`V1.1` migration guidance/V1.1**) were located in `V1_SCOPE.md` §3, `V1_DEFERRED.md` §6a-6i, and `TRUST_CENTER.md`. No deferred item was scored as violating a **`V1` in-contract** obligation when **`V1_SCOPE`** / **`V1_DEFERRED`** place it at **`V1.1`** or **`V2`**. No scope uncertainty exists for the items referenced.

---

**(B) Procurement / market-motion realism (informational, not weighted into headline score):**

**(B) addendum — qualitative UX realism:** Some enterprise design teams still value moderated usability research with architects; skipping it removes **confidence signal only**, **not** a contractual V1 readiness gate in this **`(A)`** model.

**`(B)` addendum — steady-state buyer production tenancy:** Lack of external **hosted production workload evidence** (**logos**, longitudinal ROI fills, procurement war stories) is **`(B)` pipeline realism**, **not** a **`V1` `(A)` score driver** (**header production-customer policy**; aligns with **`V1_DEFERRED.md` §6b**).

Enterprise procurement teams at $500K+ ACV will likely require: (1) CPA SOC 2 Type II — the self-assessment and roadmap are credible but the absence of an independent report will be flagged in ~60% of enterprise RFPs; (2) independent pen test summary — owner-conducted is honest but procurement teams often require a third-party attestor; (3) reference customer or case study — enterprise buyers want peer evidence before committing; (4) contractual SLA with credits — the 99.9% target needs a signed commitment. These are correctly scoped to V1.1/V2/post-V1.1 and do not affect the (A) headline score, but they represent real friction in enterprise pipeline conversion. The procurement pack, CAIQ, SIG, and DPA are excellent preparation — better than most pre-revenue products — and will handle initial procurement cycles well. The SOC 2 trigger ($250K ARR) is pragmatic. **Single-vendor concentration or “small vendor” optics are buyer psychology in some RFPs; they are explicitly not used to reduce `(A)` in this assessment** — cite only under `(B)` if the reader wants GTM realism, with zero weight on the headline composite.
