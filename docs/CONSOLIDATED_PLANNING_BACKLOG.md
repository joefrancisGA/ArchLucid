> **Scope:** Single owner-facing planning backlog — consolidates GTM, engineering refactor, tech backlog, assessment themes, AI roadmap, and deferred inventory. Source files remain authoritative for detail; this file records **reassessed decisions** from review sessions.
>
> **Spine:** [`START_HERE.md`](START_HERE.md) · **V1 contract:** [`library/V1_SCOPE.md`](library/V1_SCOPE.md) · **Deferred inventory:** [`library/V1_DEFERRED.md`](library/V1_DEFERRED.md)

# Consolidated planning backlog

**Last reviewed:** 2026-05-21 (session 1 — §3 CPB-A01–A02 **Keep**)

**How to use:** Each row has a stable `CPB-*` ID. **Decision** values: `Keep` · `Promote` · `Defer` · `Cut` · `Merge` · `Blocked`. **Horizon:** `V1-now` · `V1.1` · `V2` · `GTM-only` · `Principle`.

**Review status:** In progress — items below Item 1 are pending pairwise review unless marked **Decided**.

---

## §0 Principles (GTM and product posture)

| ID | Title | Decision | Horizon | Notes |
|----|-------|----------|---------|-------|
| CPB-P01 | **Wedge:** sell buyable **architecture review outcome** (evidence-backed report), not full platform breadth on first touch | **Keep** | Principle | Confirmed 2026-05-21. V1 product scope stays [`V1_SCOPE.md`](library/V1_SCOPE.md); copy/SOWs: pain → outcome → report. Source: [`GTM_BACKLOG.md`](go-to-market/GTM_BACKLOG.md) service-led baseline. |
| CPB-P02 | **ICP (first revenue):** mid-market CTO, fractional CTO, cloud consultant, regulated startup | **Keep** | Principle | Confirmed 2026-05-21. Fortune 50 only when sponsor already exists. |
| CPB-P03 | **Named SKUs:** canonical menu in [`SERVICE_LED_OFFERS.md`](go-to-market/SERVICE_LED_OFFERS.md) | **Keep** | Principle | Upwork (M-24–M-26), pilots (M-22–M-23), outreach (M-34) must use those names. |
| CPB-P04 | **Commerce un-hold** (Stripe live + Marketplace `Published`) | **Defer** | V1.1 | **Trigger (judgment, 2026-05-21):** flip when **both** (a) **≥2 closed paid engagements** using service-led SKUs *or* one paid pilot + one repeat buyer, **and** (b) owner confirms finance readiness (seller verification, payout, tax, production webhook secret). Calendar alone does not force flip. Engineering obligation unchanged per [`V1_DEFERRED.md`](library/V1_DEFERRED.md) §6b; aligns service-led GTM — prove motion before self-serve rails. |
| CPB-P05 | **V2 platform bets** (cross-tenant analytics, Redis baselines, etc.) | **Defer** | V2 | Candidate only until paid engagements show which buyers pay. Source: GTM baseline + `V1_DEFERRED`. |

---

## §1 Engineering refactor — active (`NEXT_REFACTORINGS`)

| ID | Title | Source | Decision | Horizon | Notes |
|----|-------|--------|----------|---------|-------|
| CPB-R01 | Unify Data and Persistence — merge `ArchLucid.Persistence.*` satellites | [`NEXT_REFACTORINGS.md`](library/NEXT_REFACTORINGS.md) #1, [`PERSISTENCE_CONSOLIDATION_PLAN.md`](library/PERSISTENCE_CONSOLIDATION_PLAN.md) | **Keep** | V1-now | Confirmed 2026-05-21. Project merge largely shipped (single csproj + feature folders); **remaining:** doc/reference hygiene (`PERFORMANCE.md`, `ARCHITECTURE_CONSTRAINTS.md`, trim stale plan checklist). |
| CPB-R02 | Connection factory alignment (`ISqlConnectionFactory` vs `IDbConnectionFactory`) | `NEXT_REFACTORINGS` #2 | **Keep** | V1-now | Confirmed 2026-05-21. Finish alignment beyond 2026-05-08 removal of unused `SqlConnectionFactory`. |
| CPB-R03 | Magic numbers / named bounds (MN-1 phase 2) | `NEXT_REFACTORINGS` #3 | **Keep** | V1-now | Confirmed 2026-05-21. NSwag client style, optional `IOptions` for commit backoff. |
| CPB-R04 | Error message sanitization (no Authority leak in HTTP errors) | `NEXT_REFACTORINGS` #4 | **Keep** | V1-now | Confirmed 2026-05-21. |
| CPB-R05 | Configuration boilerplate reduction (pilot-minimal `appsettings`) | `NEXT_REFACTORINGS` #5 | **Keep** | V1-now | Confirmed 2026-05-21. |

---

## §2 Tech backlog (`TECH_BACKLOG`)

| ID | Title | Source | Decision | Horizon | Notes |
|----|-------|--------|----------|---------|-------|
| CPB-T10 | Invariant Wave A — INV-005 startup validator parity, INV-006 composition-root scan | TB-010 | **Keep** | V1-now | Confirmed 2026-05-21. INV-001 shipped 2026-05-09. Finish before Wave B/C unless security incident reprioritizes INV-015. |
| CPB-T11 | Invariant Wave B — INV-002, INV-004, INV-012, INV-013 | TB-011 | **Keep** | V1-now | Confirmed 2026-05-21. After CPB-T10; agree **Mixed** UX copy before UI ships. Size **L**. |
| CPB-T12 | Invariant Wave C — INV-007–INV-015 hygiene pack | TB-012 | **Keep** | V1-now | Confirmed 2026-05-21. Third in invariant sequence after CPB-T10/T11. Size **L**. |
| CPB-T04 | Wire OTel exporters + agent-output metrics + Azure alerts | TB-004 | **Keep** | V1-now | Confirmed 2026-05-21. ~1–2 h ops/Terraform; metrics already emitted in code. |
| CPB-T05 | AI-assisted owner pen-test support (Cursor agent) | TB-005 | **Keep** | V1-now | Confirmed 2026-05-21. Ongoing time-boxed sessions; ~2026-Q2 owner exercise; not V2 third-party substitute. |
| CPB-T07 | LLM correctness — cohort gate promotion (Gap A) + real-mode eval corpus (Gap C) | TB-007 | **Keep** | V1-now | Confirmed 2026-05-21. Gap B closed (EnforceOnReject prod). **Gap A:** **Blocked** — owner/Azure secret + branch protection. **Gap C:** active (~4 h eng). |
| CPB-T08 | Context ingestion connectors — Phases 3–4 | TB-008 | **Keep** | V1-now | Confirmed 2026-05-21. Phase 3: delta + enrichers; Phase 4: shared topology resolver. Phases 1–2 shipped. |
| CPB-T13 | Documentation audience split — Phases 2–3 | TB-013 | **Defer** | V1.1 | Confirmed 2026-05-21. Phase 1 shipped; Phases 2–3 after V1 GA focus. |
| CPB-T14 | LLM monthly budget top-up SKU (Stripe + webhook + UI) | TB-014 | **Keep** | V1-now | Confirmed 2026-05-21. **V1** (not V1.1): ship Stripe SKU + webhook + UI atop existing `PurchasedCapBumpUsd` column. **Note:** full Stripe **live** flip still gated by CPB-P04; TEST-mode top-up path acceptable for V1 if aligned with trial commerce posture. |
| CPB-T15 | Per-agent LLM token dimensions + CI export | TB-015 | **Keep** | V1-now | Confirmed 2026-05-21. Bounded metric labels + golden-cohort export; ~2–4 eng days Phases A–B. |
| CPB-T16 | ITSM + Slack vendor sandbox accounts for live smoke | TB-016 | **Defer** | V1.1 | Confirmed 2026-05-21. Aligns first-party connector V1.1 window; mocks suffice for V1 GA validation. |
| CPB-T17 | Trial orphaned-catalog teardown SOP | TB-017 | **Defer** | V1.1 | Confirmed 2026-05-21. Manual admin teardown OK at low volume; unattended purge + SOP when cardinality warrants. |
| CPB-T18 | Warm tenant catalogs in elastic pool | TB-018 | **Defer** | V1.1 | Confirmed 2026-05-21. Signup burst / SLA optimization when volume warrants. |
| CPB-T19 | Signup marketing attribution + server-side conversion | TB-019 | **Defer** | V1.1 | Confirmed 2026-05-21. UTM → provision conversion when paid acquisition scales. |
| CPB-T20 | Public marketing SEO JSON-LD + Clarity (remainder: DPIA, kill-switch) | TB-020 | **Keep** | V1-now | Confirmed 2026-05-21. Core JSON-LD + Clarity shipped; finish CONFIG kill-switch mirror; DPIA §2.4 when legal/EU traffic requires. |

*TB-009 doc land — **Done**; not listed for review.*

---

## §3 Assessment themes (`LATEST.md`)

Ordered by weighted deficiency (highest first). Source: [`assessments/LATEST.md`](assessments/LATEST.md) + [`library/AI_LEVERAGE_ROADMAP.md`](library/AI_LEVERAGE_ROADMAP.md) where noted.

| ID | Title | Source | Decision | Horizon | Notes |
|----|-------|--------|----------|---------|-------|
| CPB-A01 | **AI/Agent Readiness** — templates-pack eval harness baseline + enforce path | LATEST §Top improvements #1; weakness #4 | **Keep** | V1-now | Confirmed 2026-05-21. **P0:** capture + commit 10 `recordings/*.findings.json`, tune anchors, optional `--enforce`. Harness shipped inform-only. |
| CPB-A02 | **AI/Agent Readiness** — V1 AI leverage bundle (roadmap #1, #2, #3, #6) | `AI_LEVERAGE_ROADMAP` V1 | **Keep** | V1-now | Confirmed 2026-05-21. Findings-to-IaC stubs, request drafter, per-finding explainer, Critic adversarial second-pass. Streaming Ask (#4) **shipped** 2026-05-21. Multi-model (#5) **shipped** 2026-05-20. |
| CPB-A03 | **Adoption Friction** — guided setup (policy, Entra ID), UI i18n extraction | LATEST category 2 | **Keep** | V1-now | Confirmed 2026-05-21. Wizards (minimal: Entra + one policy path) + `i18n.ts` extraction. |
| CPB-A04 | **Time-to-Value** — vertical sample run at trial signup; extractor resilient to missing RBAC | LATEST category 3 | **Keep** | V1-now | Confirmed 2026-05-21. Metric shipped; open: trial vertical seed run + graceful extractor on missing optional RBAC. |
| CPB-A05 | **Usability** — tooltips, guided tour, progressive disclosure (#19 engineering) | LATEST category 4 | **Keep** | V1-now | Confirmed 2026-05-21. Top weakness #1; supports live demos (M-19). |
| CPB-A06 | **Proof-of-ROI** — surface `EstimatedUsdSavings` in pilot deltas; customer baselines | LATEST category 5 | **Keep** | V1-now | Confirmed 2026-05-21. Empirical ROI narrative for service-led wedge. |
| CPB-A07 | **Executive Value Visibility** — UI discoverability for pilot exports; demo vs real indicators | LATEST category 6 | **Keep** | V1-now | Confirmed 2026-05-21. Executive summary API shipped; UI polish only. |
| CPB-A08 | **Reliability** — Dapper `CommandTimeout`, HttpClient timeouts, failover drill doc | LATEST category 7; weakness #7 | **Keep** | V1-now | Confirmed 2026-05-21. |
| CPB-A09 | **Maintainability** — `GovernanceConstants`; planning doc hygiene | LATEST category 8; weakness #10 | **Keep** | V1-now | Confirmed 2026-05-21. Constants extraction + treat this file as active planning spine (archive stays historical). |
| CPB-A10 | **Decision Velocity** — `POST /v1/governance/simulate` dry-run | LATEST category 9; enterprise blocker #6 | **Keep** | V1-now | Confirmed 2026-05-21. |
| CPB-A11 | **Performance** — k6 CI smoke + p95 gate; replay diagnostics pruning | LATEST category 10; weakness #5, #11 | *Pending review* | V1-now | |
| CPB-A12 | **Scalability** — publish load-test baselines; bulk payload limits | LATEST category 11; weakness #5, #8 | *Pending review* | V1-now | |
| CPB-A13 | **Stickiness** — Saved Views (Audit, Graph) | LATEST category 12 | *Pending review* | V1-now | |
| CPB-A14 | **Supportability** — UI download support bundle | LATEST category 13 | *Pending review* | V1-now | |

---

## §4 AI leverage (`AI_LEVERAGE_ROADMAP`)

*To be filled during review — V1 / V1.1 / V2 slices.*

---

## §5 GTM backlog (`GTM_BACKLOG`)

*To be filled during review — M-01–M-35.*

---

## §6 V1.1 / V2 deferred (`V1_DEFERRED`, MCP, policy packs, extractor)

*To be filled during review.*

---

## Source index (detail lives here)

| Document | Role |
|----------|------|
| [`go-to-market/GTM_BACKLOG.md`](go-to-market/GTM_BACKLOG.md) | Marketing tasks |
| [`library/NEXT_REFACTORINGS.md`](library/NEXT_REFACTORINGS.md) | Active refactors (top 5) |
| [`archive/NEXT_REFACTORINGS_ARCHIVE_2026_04_15.md`](archive/NEXT_REFACTORINGS_ARCHIVE_2026_04_15.md) | Historical refactor log |
| [`library/TECH_BACKLOG.md`](library/TECH_BACKLOG.md) | TB-* engineering deferred |
| [`library/V1_DEFERRED.md`](library/V1_DEFERRED.md) | V1.1+ doc inventory |
| [`assessments/LATEST.md`](assessments/LATEST.md) | `(A)` readiness + themes |
| [`library/AI_LEVERAGE_ROADMAP.md`](library/AI_LEVERAGE_ROADMAP.md) | 25 AI opportunities |
| [`library/MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md`](library/MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md) | MCP ranked backlog |
| [`library/POLICY_PACK_CONTENT_BACKLOG.md`](library/POLICY_PACK_CONTENT_BACKLOG.md) | Policy pack content |
| [`library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md`](library/AZURE_EXTRACTOR_TECHNICAL_BACKLOG.md) | Extractor follow-ups |
| [`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) | Owner gates |
