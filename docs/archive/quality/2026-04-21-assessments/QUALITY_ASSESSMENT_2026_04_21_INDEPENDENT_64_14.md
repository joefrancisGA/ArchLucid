> **ARCHIVED 2026-04-22 — Superseded by** [`QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md`](QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md). Historical score preserved for traceability only.

> **Scope:** Independent weighted quality assessment of ArchLucid as it stands on **2026-04-21**. Scored from first principles against the repository's current state — code, infra, docs, tests, and go-to-market assets — without reference to prior assessments.

> **Spine doc:** [Five-document onboarding spine](../../../FIRST_5_DOCS.md). Read this file only if you have a specific reason beyond those five entry documents.


# ArchLucid Independent Quality Assessment — 2026-04-21 (Weighted **64.14%**)

**Audience:** Owner / product / engineering / GTM. The percent in the title is the **weight-normalized** sum of every quality below (each scored 1–100 against its weight, divided by total weight 100).

**Method:**

1. Each quality scored 1–100 using direct observation of the repository (source layout, Terraform modules, CI workflows, tests, ADRs, go-to-market docs, runbooks).
2. Sections are **ordered by weighted improvement headroom** — `weight × (100 − score)` — so the items at the top of the report are the ones where deliberate investment moves the dial most.
3. Each entry has: **score**, **justification**, **trade-offs**, and **recommendation**. No item that requires owner-only input is silently fixed; those are surfaced in **§ Pending owner questions** and queued in [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md).
4. Six **best improvements** at the end are paired with paste-ready Cursor prompts in [`CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21.md`](CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21.md).

---

## 1. Weighted score summary

| Bucket | Weight | Contribution | Effective score |
|--------|-------:|-------------:|----------------:|
| Commercial | 40 | 24.93 | 62.3 |
| Enterprise | 25 | 15.07 | 60.3 |
| Engineering | 35 | 24.14 | 69.0 |
| **Total** | **100** | **64.14** | **64.14** |

**One-line read:** Engineering substrate (observability, testability, audit, explainability) is solidly above the line; the **commercial proof story** and **enterprise trust signals** are the lagging legs. The two highest-impact internal architecture risks are (a) the **un-collapsed dual pipeline** (ADR 0021 Phase 3 blocked per ADR 0022) and (b) the **probabilistic correctness** of LLM-derived findings.

---

## 2. Quality scores — ordered by weighted improvement headroom

> Headroom = `weight × (100 − score)`. Higher headroom = bigger weighted lift if you fix it.

### 2.1 Marketability — **62 / 100** · weight 8 · headroom 304

**Justification.** A genuine **AI Architecture Intelligence** category claim is articulated end-to-end ([`POSITIONING.md`](go-to-market/POSITIONING.md), [`COMPETITIVE_LANDSCAPE.md`](go-to-market/COMPETITIVE_LANDSCAPE.md), [`PRODUCT_DATASHEET.md`](go-to-market/PRODUCT_DATASHEET.md), `/why-archlucid` proof page, sponsor PDF). What is missing is the **outside-in proof** — no published reference customer, no analyst coverage, no Marketplace listing live, no inbound funnel metrics yet.

**Trade-offs.** A novel category needs education to land; education without proof reads as marketing. Current docs are honest about that ("grounding rule: every claim maps to shipped V1 capability"), which is good for trust but caps reach.

**Recommendation.** Land **one** publishable reference (paying tenant + signed quote + computed deltas) and a **live** Azure Marketplace listing. Until then, marketability is bottlenecked by external validation, not by content.

---

### 2.2 Adoption Friction — **58 / 100** · weight 6 · headroom 252

**Justification.** Self-serve paths are real: `archlucid try` one-command, devcontainer, Docker `pilot up`, hosted staging funnel, JWT/Entra/API-key auth. Friction comes from (a) **two-pipeline mental model** (coordinator + authority) bleeding into operator concepts, (b) integrations limited to **GitHub Action + Azure DevOps Pipelines** (no Jira, ServiceNow, Confluence, Slack first-class), and (c) **no Marketplace billing path live** — every customer is a hand-rolled order form today.

**Trade-offs.** Eager Marketplace publication forces commercial decisions you may not be ready to commit (irreversible pricing, plan SKUs). But every quarter without it raises CAC.

**Recommendation.** Ship Stripe checkout to production behind the trial funnel; treat Marketplace as fast-follow once Stripe revenue exists. Add a **single** ServiceNow change-request integration as the second workflow anchor.

---

### 2.3 Proof-of-ROI Readiness — **55 / 100** · weight 5 · headroom 225

**Justification.** ROI model is conservative, formula-based, and cross-linked from sponsor brief. `PilotRunDeltaComputer` already computes time-to-commit, finding counts, LLM-call counts, audit-row counts, and decision-trace excerpts on real (or demo) runs. Trial signup now captures a baseline review-cycle figure. What's missing is **one real tenant's measured deltas** — every example today is the Contoso demo seed labeled "demo tenant — replace before publishing."

**Trade-offs.** Conservative ROI ranges protect credibility; they also make the case feel academic.

**Recommendation.** Instrument the first paying tenant end-to-end (baseline before, measured after, written quote). Add an opt-in **"benchmark cohort"** so every Standard-tier customer's anonymized deltas can roll into an aggregate ROI evidence pack.

---

### 2.4 Trustworthiness — **45 / 100** · weight 3 · headroom 165

**Justification.** Architecturally trustworthy (RLS, append-only audit, ExplainabilityTrace, governance gates) but the **buyer-visible** trust signals are weak: no external pen-test, no SOC 2 attestation, no published reference, no PGP key for `security@archlucid.dev`, owner-conducted security assessment only. The Trust Center is honest about this.

**Trade-offs.** Honesty (good) costs near-term enterprise deals where procurement requires a SOC 2 box-tick.

**Recommendation.** Commission an external pen-test (even a constrained scope) and a **SOC 2 Type I readiness assessment** in the next quarter — not full Type II, just the readiness gap report. Trust Center then publishes "SOC 2 readiness — gap report on file, available under NDA."

---

### 2.5 Time-to-Value — **78 / 100** · weight 7 · headroom 154

**Justification.** Among the strongest dimensions. `archlucid try`, `pilot up`, devcontainer, Docker-only `FIRST_30_MINUTES.md`, demo seed on startup, sponsor PDF post-commit, "Day N since first commit" badge, `/why-archlucid`. The path from `git clone` to a committed manifest with a sponsor-shareable artifact is genuinely short.

**Trade-offs.** All paths require local Docker or staging access; a true zero-install browser-only demo doesn't exist yet (the cached `/demo/preview` page is the closest thing).

**Recommendation.** Promote `/demo/preview` to a **public, non-cached, click-around** sandboxed read-only walkthrough that mirrors a committed run end-to-end. Add an embedded video on the marketing site for procurement-channel buyers who will not run Docker.

---

### 2.6 Differentiability — **62 / 100** · weight 4 · headroom 152

**Justification.** The intersection — **multi-agent AI architecture analysis** + **explainability trace per finding** + **enterprise governance with append-only audit** — is genuinely hard to find in a single product among the LeanIX / Ardoq / Well-Architected / Copilot landscape. The differentiation is real on paper.

**Trade-offs.** Differentiation that requires demoing four agents, a provenance graph, and a governance approval flow is not a five-minute pitch.

**Recommendation.** Build a **30-second screenshot pair** ("manual review week 1 vs ArchLucid commit page") and a **two-minute video** of `/demo/explain`. The product is more differentiated than the GTM material currently lands.

---

### 2.7 Correctness — **62 / 100** · weight 4 · headroom 152

**Justification.** The structural plumbing for correctness is excellent — finding-engine determinism rules, simulator mode, golden fixtures, `AgentOutputEvaluator`, `ExplanationFaithfulnessChecker`, prompt-regression baselines, structured findings. The hard part is unavoidable: **LLM outputs are probabilistic**, and the dual-pipeline situation (coordinator + authority) means there are two code paths whose outputs can drift. ADR 0022 records the failed Phase 3 gates.

**Trade-offs.** Forcing fully-deterministic output kills the AI-pipeline value proposition; fully embracing non-determinism kills enterprise trust. The current "structured envelope around probabilistic content" is the right compromise but requires constant evaluator hygiene.

**Recommendation.** Stand up a **continuously-running golden cohort** (10–20 representative requests, real LLM, nightly): drift past a threshold opens a tracked issue. Pair with **ADR 0021 Phase 3 unblocking** so a single canonical pipeline produces the manifest.

---

### 2.8 Workflow Embeddedness — **50 / 100** · weight 3 · headroom 150

**Justification.** GitHub Action (job summary + sticky PR comment) + Azure DevOps pipeline templates + integration events (Service Bus) + AsyncAPI catalog — the foundation is there. Still missing first-class: **Jira issue creation** on commit, **Confluence page publishing**, **ServiceNow change-request creation**, **Slack/Teams** notifications.

**Trade-offs.** Each integration is a maintenance tax forever.

**Recommendation.** Pick **two**: ServiceNow CR (governance-aligned) and Confluence page publishing (architect-aligned). Treat the rest as community-supported via the integration events catalog.

---

### 2.9 Architectural Integrity — **52 / 100** · weight 3 · headroom 144

**Justification.** Two real concerns: (a) **coordinator + authority pipelines coexist** (ADR 0010, 0021, 0022 — Phase 3 blocked because parity runbook still has TBD rows and `AuditEventTypes.Run` catalog hasn't materialized), and (b) the **allow-list assertion in `DualPipelineRegistrationDisciplineTests`** is healthy duct-tape, not structural collapse. Outside that, the layering is genuinely clean — bounded `ArchLucid.*` projects, primary-constructor DI, terse-rule house style, ADR discipline.

**Trade-offs.** Collapsing the dual pipeline means a freeze window and parity verification effort that nobody currently owns.

**Recommendation.** Assign an owner to the **14-day zero-Coordinator-write parity window** + the Phase 2 `AuditEventTypes.Run` consolidation. Until that lands, every new mutation route doubles the future migration cost.

---

### 2.10 Usability — **58 / 100** · weight 3 · headroom 126

**Justification.** Operator UI ships with disclosure tiers (Core Pilot / Advanced / Enterprise), `LayerHeader` cues, soft-disable for non-mutation tiers, first-run wizard, run detail page, sponsor banner. There are seam tests preventing regressions. The friction is **discoverability** (deep nav, "Show more links" required for advanced surfaces) and the conceptual cost of three layers + tier ∩ rank composition.

**Trade-offs.** Progressive disclosure protects first-pilot focus; it also hides power-user value.

**Recommendation.** Add a one-page **operator command palette** (cmd-K) that surfaces every action regardless of tier (but still respects authority). Add **task-mode** templates ("Run a compliance review", "Compare two runs", "Replay last commit") on the home page.

---

### 2.11 Executive Value Visibility — **70 / 100** · weight 4 · headroom 120

**Justification.** Executive Sponsor Brief, sponsor PDF one-shot from run detail, value-report DOCX, "Day N since first commit" badge, `/why-archlucid` proof page. The exec layer is well-served.

**Trade-offs.** The narrative is consistent across docs (good), but it relies on the operator triggering the share — there is no **scheduled exec digest** today.

**Recommendation.** Add a weekly auto-emailed exec digest (manifests committed, governance approvals processed, drift trend). Tie unsubscribe link to the sponsor email captured during `archlucid try`.

---

### 2.12 Security — **62 / 100** · weight 3 · headroom 114

**Justification.** Strong baseline: RLS, CMK, JWT/OIDC, Entra, API key + dev-bypass scheme switch, `DENY UPDATE/DELETE` on `dbo.AuditEvents`, ZAP baseline scheduled, CodeQL, log sanitizer, SECURITY.md, security.txt, Subprocessors page, scoped policies (`ReadAuthority` / `ExecuteAuthority` / `AdminAuthority`). Production-config safety guards refuse to start with permissive CORS or unsigned webhook delivery. Gaps are external-validation-shaped — no third-party pen-test on file, no PGP key for `security@archlucid.dev`, no SOC 2 evidence, no public bug-bounty.

**Trade-offs.** Bug-bounty before SOC 2 risks signal-to-noise overload.

**Recommendation.** External pen-test + PGP key (cheap and high-signal). SOC 2 Type I scoping in parallel.

---

### 2.13 Procurement Readiness — **50 / 100** · weight 2 · headroom 100

**Justification.** DPA template, Subprocessors page, Trust Center, order form template, security.txt are present — the procurement starter pack exists. What's missing is the **completed standard vendor questionnaire** (CAIQ Lite, SIG Lite), a **published price list with public discount tiers**, and a **standard MSA**.

**Recommendation.** Pre-fill CAIQ-Lite based on existing controls. Publish public price list (already in `PRICING_PHILOSOPHY.md`) on the marketing site. Standard MSA + DPA + order-form bundle ready for self-serve enterprise close.

---

### 2.14 Decision Velocity — **52 / 100** · weight 2 · headroom 96

**Justification.** Self-serve trial path exists, list pricing documented, single CTA on the run-detail page, `archlucid try` removes evaluator friction. Slowdowns: vendor-security-review cycle (no SOC 2), manual order form, no Marketplace.

**Recommendation.** See 2.4 (Trustworthiness) and 2.13 (Procurement). These two unlock decision velocity.

---

### 2.15 Compliance Readiness — **55 / 100** · weight 2 · headroom 90

**Justification.** Compliance matrix doc, RLS, CMK, PII retention policy for conversations, GDPR-shaped data residency (Central US default, region-pinning documented), audit retention tiering, append-only audit. SOC 2 / ISO 27001 / HIPAA / FedRAMP attestations: **none** — explicitly deferred.

**Recommendation.** SOC 2 Type I readiness gap report this quarter. ISO 27001 / HIPAA / FedRAMP only when a buyer pulls.

---

### 2.16 Maintainability — **58 / 100** · weight 2 · headroom 84

**Justification.** Strong house style (Cursor rules for terseness, primary constructors, LINQ pipelines, switch expressions, expression-bodied members), one-class-per-file, ADRs, layered projects. Cost: **3554 C# files**, **644 docs**, two pipelines. Onboarding cognitive load is real.

**Recommendation.** Continue the consolidation proposals already filed (`PROJECT_CONSOLIDATION_PROPOSAL_PERSISTENCE.md`). Add an enforced **doc-size budget** in CI (warn > 500 lines, fail > 1500) to push splits.

---

### 2.17 Commercial Packaging Readiness — **58 / 100** · weight 2 · headroom 84

**Justification.** Three-tier model (Team / Professional / Enterprise) with platform-fee + seat + run-allowance, single source of truth for prices with CI guard, order form template, marketplace publication doc, Stripe checkout doc. Marketplace not yet live. Stripe not yet in production.

**Recommendation.** Stripe live in the next two-week iteration; marketplace fast-follow.

---

### 2.18 Data Consistency — **62 / 100** · weight 2 · headroom 76

**Justification.** Optimistic concurrency via `rowversion`, idempotency tables for run create + commit, dead-letter + quarantine table, RLS, transactional outbox for retrieval indexing and integration events, tenant-scoped table inventory doc. Concerns: dual-pipeline storage (coordinator vs authority manifest repos) and ADR 0010 dual contracts.

**Recommendation.** Same as 2.9 — collapse the dual pipeline.

---

### 2.19 Interoperability — **62 / 100** · weight 2 · headroom 76

**Justification.** OpenAPI snapshot + NSwag-generated `ArchLucid.Api.Client`, AsyncAPI 2.6 spec for integration events, JSON contract docs, integration event catalog with versioned schemas, schemathesis scheduled. JSON-only for now (no GraphQL, no gRPC), which is fine for the buyer profile.

**Recommendation.** Publish the OpenAPI spec at a public URL with a `Last-Modified` header so SDK auto-generators can poll.

---

### 2.20 Templates / Accelerator Richness — **30 / 100** · weight 1 · headroom 70

**Justification.** Only **two** templates (`templates/archlucid-finding-engine`, `templates/archlucid-api-endpoint`). No vertical templates (financial-services, healthcare, retail), no industry policy packs, no "starter brief" library.

**Recommendation.** Ship five vertical starter briefs + matching policy packs in the next iteration. Each is a small content artifact that disproportionately raises perceived breadth.

---

### 2.21 AI / Agent Readiness — **75 / 100** · weight 2 · headroom 50

**Justification.** Multi-vendor LLM with `ILlmProvider` + `FallbackAgentCompletionClient`, simulator + echo modes, agent quality gates, evaluator harness, prompt regression baselines, content-safety guard, cost estimator, retry+circuit-breaker on LLM calls. Solid.

**Recommendation.** Add an **agent-output evaluation dashboard** in operator UI (already have the harness). Surface quality scores per run.

---

### 2.22 Stickiness — **50 / 100** · weight 1 · headroom 50

**Justification.** Versioned manifests, append-only audit, governance approvals create operational lock-in over time, but the data is exportable (DOCX, JSON, CSV) by design — switching cost is moderate, not high.

**Recommendation.** Ship an **architecture-pattern library** that learns per tenant (per ADR-pending cross-tenant pattern feature) — proprietary corpus per tenant raises switching cost honestly.

---

### 2.23 Reliability — **70 / 100** · weight 2 · headroom 60

**Justification.** Resilience config, circuit breaker with audit bridge, retry with exponential backoff, Simmy chaos tests scheduled, three health endpoints (live/ready/full), fail-closed startup migration, durable audit retry on the critical path.

**Recommendation.** Publish a public status page (`status.archlucid.com`) backed by the synthetic probe workflow already running.

---

### 2.24 Traceability — **80 / 100** · weight 3 · headroom 60

**Justification.** Best-in-class — provenance graph, decision traces, manifest version lineage, `ExplainabilityTrace` on every finding, run→manifest→artifact chain, OpenTelemetry W3C trace ID persisted on runs.

**Recommendation.** Maintain.

---

### 2.25 Cognitive Load — **42 / 100** · weight 1 · headroom 58

**Justification.** Two pipelines, three product layers, 644 docs, multi-axis tier × authority composition, large config surface. The codebase is genuinely thoughtful but not light.

**Recommendation.** A single **architecture-on-one-page** poster at `docs/ARCHITECTURE_ON_ONE_PAGE.md` with C4 system context + container diagram + happy-path arrows. Replace many doc entry points with a single **operator atlas**.

---

### 2.26 Customer Self-Sufficiency — **58 / 100** · weight 1 · headroom 42 · Accessibility — **38 / 100** · headroom 62

Combined: documentation breadth and runbooks are strong; in-product help and accessibility are thin. `archlucid-ui` includes an `axe-helper.ts` for E2E but no enforced axe-core CI gate, no published WCAG conformance statement, no VPAT.

**Recommendation.** Make `axe` a CI gate on the Playwright suite. Publish a WCAG 2.2 AA conformance statement (even with known exceptions). Add a `?` keyboard-shortcut help overlay in the operator shell.

---

### 2.27 Other engineering qualities (low individual headroom)

| Quality | Score | Justification (one line) |
|--------|------:|--------------------------|
| Auditability | 82 | 96 typed event constants, append-only enforced, tier retention, search/export. |
| Explainability | 80 | `ExplainabilityTrace`, faithfulness checker, citations, structured explanations. |
| Testability | 80 | 22 test projects, hundreds of `[Fact]/[Theory]`, Stryker, Schemathesis, Simmy, ZAP, Playwright. |
| Observability | 78 | OTel + Prometheus + Serilog + business metrics + dashboards + scrape endpoint. |
| AI/Agent Readiness | 75 | Multi-vendor LLM, fallback, simulator, evaluator, prompt regression. |
| Documentation | 72 | 644 docs deeply linked; volume is its own cost. |
| Azure Ecosystem Fit | 72 | Entra, OpenAI, Service Bus, APIM, Front Door, Container Apps, Key Vault. |
| Policy & Governance Alignment | 72 | Policy packs, segregation, SLA tracking, pre-commit gate. |
| Supportability | 70 | Correlation IDs, support-bundle CLI, runbooks, doctor command, `/version`. |
| Modularity | 70 | Bounded `ArchLucid.*` projects, primary constructors, terse rules. |
| Extensibility | 70 | Plugin-discovery for finding engines, `ILlmProvider` abstraction. |
| Change Impact Clarity | 70 | Compare runs, drift, manifest delta PR comments, `BREAKING_CHANGES.md`. |
| Deployability | 70 | IaC modules, container compose, CD workflow, devcontainer, smoke scripts. |
| Azure SaaS Readiness | 68 | Terraform per service, Container Apps, Front Door, OpenAI, Service Bus, marketplace path. |
| Evolvability | 68 | URL-path API versioning, RFC 9745 deprecation triplet, breaking-change file. |
| Performance | 62 | k6 load, perf docs, page compression migrations, indexes, caching. |
| Scalability | 62 | Container Apps, Service Bus outbox, read replica, capacity playbook. |
| Manageability | 62 | Many config keys + feature gates + ops runbooks + options validation. |
| Cost-Effectiveness | 62 | Per-tenant cost model, simulator for CI, LLM cost estimator, page compression. |
| Availability | 58 | Health probes, multi-region docs, SQL failover module — no published SLA from real ops. |

---

## 3. Top 10 most important weaknesses

1. **No publishable reference customer** (every "proof" is the Contoso demo seed).
2. **Dual pipeline (coordinator + authority) not collapsed** — ADR 0021 Phase 3 explicitly blocked by ADR 0022.
3. **No external pen-test, no SOC 2 attestation, no PGP key** for `security@archlucid.dev`.
4. **No live commercial billing rail** — Stripe not in production, Marketplace not published.
5. **Workflow integration depth is shallow** — only GitHub + Azure DevOps; no Jira, Confluence, ServiceNow, Slack first-class.
6. **Probabilistic correctness with no continuously-running golden cohort** — drift can land silently between LLM provider releases.
7. **Accessibility is unenforced** — no axe CI gate, no published WCAG statement, no VPAT.
8. **Cognitive-load tax** — two pipelines + three layers + 644 docs; new contributors ramp slowly.
9. **Template / accelerator catalog is thin** (two templates, no vertical packs) — hurts the "out-of-box value" narrative.
10. **No live exec digest** — sponsor visibility depends on the operator clicking the share button.

---

## 4. Top 5 monetization blockers

1. **No live billing rail** (Stripe + Marketplace) → every deal is hand-rolled.
2. **No reference customer** → enterprise-buyer trust ceiling is low.
3. **No SOC 2 evidence on file** → security review stalls 60+ days per deal.
4. **No public ROI proof from a real tenant** → CFO conversations are theoretical.
5. **No category awareness** — "AI Architecture Intelligence" is a real category claim but unclaimed by analysts.

---

## 5. Top 5 enterprise adoption blockers

1. **SOC 2 Type I/II not in flight** — table-stakes for regulated buyers.
2. **No first-class ServiceNow / Jira / Confluence integration** — architecture work doesn't enter the existing CR/ticket flow.
3. **Operator-UI cognitive load** for tier × authority composition — seat-cost-per-second of an architect is high.
4. **No completed CAIQ / SIG questionnaire pre-fill** — procurement cycles drag.
5. **No published WCAG / VPAT statement** — public-sector and accessibility-conscious buyers are blocked.

---

## 6. Top 5 engineering risks

1. **Dual pipeline not collapsed** (ADR 0022) → manifest correctness drift between coordinator and authority code paths.
2. **LLM-output non-determinism** without a continuously-running golden cohort → silent regression on provider releases.
3. **Owner-conducted-only security assessment** → unknown unknowns in attack surface.
4. **In-process meter listener + many singletons** in observability layer → memory growth profile not validated under multi-week load.
5. **DbUp greenfield replays 001–050 then stamps `SchemaVersions`** — replays on cold catalogs are correct but slow; not a risk for V1, but a friction in CI matrix expansion.

---

## 7. Most Important Truth

> **ArchLucid has built the substrate of an enterprise-grade product before it has earned the trust signals that let enterprises buy it.** The audit, observability, explainability, and governance machinery is genuinely strong; the reference customer, external attestation, live billing, and analyst category recognition are not yet in place. The gap between *"is this a credible product?"* and *"is this a credible vendor?"* is the gap between **engineering excellence** and **commercial proof**. Closing it is bounded work — pen-test, SOC 2 readiness, first paying tenant case study, Marketplace listing — but it must be sequenced now, because the substrate keeps improving while the proof stack does not.

---

## 8. Six best improvements (paired with paste-ready Cursor prompts in [`CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21.md`](CURSOR_PROMPTS_QUALITY_ASSESSMENT_2026_04_21.md))

> **Extension (2026-04-21):** Ten next-best improvements (#7–#16) live in the same prompts file under the **"Ten next-best improvements (after the first six)"** section: differentiation video + screenshot pair; public `/demo/preview` sandbox; cmd-K command palette + task-mode templates; weekly exec digest email; five vertical starter briefs + policy packs; architecture-on-one-page + operator atlas; pre-filled CAIQ Lite + SIG Lite + standard MSA; public status page; agent-output evaluation dashboard; persistence consolidation + doc-size CI budget.

| # | Improvement | Moves the needle on |
|---|-------------|---------------------|
| 1 | **Publish first reference customer** + computed ROI from a real tenant. | Marketability, Trustworthiness, Proof-of-ROI, Decision Velocity |
| 2 | **Collapse dual pipeline (ADR 0021 Phase 3)** — parity runbook + `AuditEventTypes.Run` catalog + façade. | Architectural Integrity, Correctness, Cognitive Load, Maintainability |
| 3 | **Live Stripe checkout in production + Azure Marketplace SaaS listing live.** | Adoption Friction, Decision Velocity, Commercial Packaging, Marketability |
| 4 | **Commission external pen-test + start SOC 2 Type I readiness.** | Trustworthiness, Procurement, Compliance, Security |
| 5 | **Two enterprise workflow integrations: ServiceNow CR + Confluence page publishing.** | Workflow Embeddedness, Stickiness, Adoption Friction |
| 6 | **WCAG 2.2 AA conformance + axe-core CI gate + continuously-running golden LLM cohort.** | Accessibility, Usability, Correctness |

---

## 9. Pending owner questions (saved for later)

These improvements **cannot be completed without owner input**. They are mirrored into [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) so the next assistant turn that asks "what's pending?" finds the full list there.

1. **External pen-test** — which vendor, what budget, what scope (web app only / web + infra / web + infra + LLM threat model)?
2. **SOC 2 Type I readiness** — engage which assessor; what audit period start date?
3. **Reference customer designation** — when the first paying tenant arrives, who owns the case-study workflow (drafting → customer review → published in [`reference-customers/README.md`](go-to-market/reference-customers/README.md)) and what is the discount-for-reference offer?
4. **Marketplace publication go-live** — sign off the Azure Marketplace SaaS offer pricing, plan SKUs, and sample-scenario demo screenshots in [`MARKETPLACE_PUBLICATION.md`](go-to-market/MARKETPLACE_PUBLICATION.md)?
5. **Stripe production go-live** — confirm chargeback / refund / dunning policy and the legal entity that will appear on customer statements.
6. **PGP key for `security@archlucid.dev`** — owner generates key pair (or designates a key custodian) so [`SECURITY.md`](../SECURITY.md) TODO can close.
7. **Workflow integration order** — ServiceNow vs Jira vs Confluence first? (Two of three is the recommendation, sequence is a product call.)
8. **WCAG 2.2 AA conformance statement publication** — accept "AA with documented exceptions" or hold until full AA?
9. **Public price list publication on marketing site** — pricing exists in `PRICING_PHILOSOPHY.md`; publish publicly or remain quote-on-request?
10. **Cross-tenant pattern library ADR** — approved per `PENDING_QUESTIONS.md`, but the implementing ADR has not been drafted; who owns it?

---

## 10. Methodology notes

- **Score floors and ceilings.** Nothing scored 100 (no system is finished); nothing scored below 30 (the repository never lacks a starting point). Scores in the 60s–70s are "credibly working with known gaps"; scores in the 80s mean "best-in-class against credible peers"; scores below 50 mean a buyer-visible deficiency.
- **Independent observation only.** Source signals: `README.md`, `docs/EXECUTIVE_SPONSOR_BRIEF.md`, `docs/V1_SCOPE.md`, `docs/V1_DEFERRED.md`, `docs/PENDING_QUESTIONS.md`, `docs/AUDIT_COVERAGE_MATRIX.md`, `docs/ARCHITECTURE_CONTAINERS.md`, `docs/ARCHITECTURE_COMPONENTS.md`, `docs/CHANGELOG.md` (most recent 80 lines), `docs/go-to-market/POSITIONING.md`, `docs/go-to-market/ROI_MODEL.md`, `docs/go-to-market/PRICING_PHILOSOPHY.md`, `docs/go-to-market/COMPETITIVE_LANDSCAPE.md`, `docs/adr/0022-coordinator-phase3-deferred.md`, the 154 SQL migration files, the 22 test projects, the Terraform module list, the 25 GitHub Actions workflows, and the dependency graph in `Directory.Packages.props`.
- **Weights are taken verbatim** from the user's request and sum to **100**.
