> **Scope:** Single owner-facing planning backlog — consolidates GTM, engineering refactor, tech backlog, assessment themes, AI roadmap, and deferred inventory. Source files remain authoritative for detail; this file records **reassessed decisions** from review sessions.
>
> **Spine:** [`START_HERE.md`](START_HERE.md) · **V1 contract:** [`library/V1_SCOPE.md`](library/V1_SCOPE.md) · **Deferred inventory:** [`library/V1_DEFERRED.md`](library/V1_DEFERRED.md)

# Consolidated planning backlog

**Last reviewed:** 2026-05-22 (session 2 — complete)

**How to use:** Each row has a stable `CPB-*` ID. **Decision** values: `Keep` · `Promote` · `Defer` · `Cut` · `Merge` · `Blocked`. **Horizon:** `V1-now` · `V1.1` · `V2` · `GTM-only` · `Principle`.

**Review status:** Complete — all backlog source documents have been reviewed and consolidated.

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
| CPB-A11 | **Performance** — k6 CI smoke + p95 gate; replay diagnostics pruning | LATEST category 10; weakness #5, #11 | **Keep** | V1-now | Confirmed 2026-05-21. |
| CPB-A12 | **Scalability** — publish load-test baselines; bulk payload limits | LATEST category 11; weakness #5, #8 | **Keep** | V1-now | Confirmed 2026-05-21. |
| CPB-A13 | **Stickiness** — Saved Views (Audit, Graph) | LATEST category 12 | **Keep** | V1-now | Confirmed 2026-05-21. |
| CPB-A14 | **Supportability** — UI download support bundle | LATEST category 13 | **Keep** | V1-now | Confirmed 2026-05-21. |

---

## §4 AI leverage (`AI_LEVERAGE_ROADMAP`)

*To be filled during review — V1 / V1.1 / V2 slices.*

---

## §5 GTM backlog (`GTM_BACKLOG`)

Source: [`go-to-market/GTM_BACKLOG.md`](go-to-market/GTM_BACKLOG.md). **GTM-only** unless noted.

| ID | Task | Priority | Source status | Decision | Horizon | Notes |
|----|------|----------|---------------|----------|---------|-------|
| CPB-M01 | Positioning tagline → `POSITIONING.md` | P0 | Done | **Keep** (done) | — | Already complete. |
| CPB-M02 | One-minute elevator pitch | P0 | Done | **Keep** (done) | — | `ELEVATOR_PITCH.md` written 2026-05-21: 30-sec, 1-min, 2-min, consulting-line variants. |
| CPB-M03 | Five-minute demo script | P0 | Done | **Keep** (done) | — | Five-minute live-call script added to `DEMO_VIDEO_SCRIPT.md` 2026-05-21; includes Q&A prompts. |
| CPB-M04 | Workspace A Playwright smoke sign-off | P0 | Not started | **Keep** | GTM-only | Confirmed 2026-05-21. QA sign-off only; #30 shipped. |
| CPB-M05 | Workspace B Playwright smoke sign-off | P0 | Not started | **Keep** | GTM-only | Confirmed 2026-05-21. |
| CPB-M06 | Review sample report from Workspace B | P0 | Not started | **Keep** | GTM-only | Confirmed 2026-05-21. Content review; #28 done. |
| CPB-M07 | 6–8 workflow screenshots | P0 | Not started | **Keep** | GTM-only | Confirmed 2026-05-21. Production asset; #30 done. |
| CPB-M08 | Align audit-chain differentiator copy | **P1** | Not started | **Keep** | GTM-only | Confirmed 2026-05-21. **Reprioritized P0→P1** until finding-confidence UI (#24); copy can draft earlier but not P0 gate. |
| CPB-M09 | Landing page full content | P1 | In progress | **Keep** (shipped in repo) | GTM-only | 2026-05-21: `WelcomeMarketingPage` + sections — wedge copy, problem/solution, workflow strip, WAF/CAF use cases + disclaimer. **Owner:** M-06 report review, M-07 screenshots, deploy sign-off. |
| CPB-M10-M14 | LinkedIn posts 1-5 | P1 | Done | **Keep** (done) | — | All five drafts in `LINKEDIN_CONTENT_V1.md` 2026-05-21; ready to publish one per week. |
| CPB-M15 | Long-form article (diagrams not evidence) | P1 | Done | **Keep** (done) | — | Full article in `LINKEDIN_CONTENT_V1.md` 2026-05-21 (~1,800 words); owner to publish. |
| CPB-M16 | Short demo video (Workspace A) | P1 | Not started | **Defer** | GTM-only | Confirmed 2026-05-21. Record after M-04 smoke sign-off + M-07 screenshots; async outreach (M-18) can use live demo or landing page until then. |
| CPB-M17 | Outreach list (20 contacts) | P2 | Not started | **Keep** | GTM-only | Confirmed 2026-05-21. Owner builds list; avoid employer/NDA conflicts. Feeds M-18/M-19. |
| CPB-M18 | 20 outreach messages | P2 | Not started | **Keep** | GTM-only | Confirmed 2026-05-21. 10-min demo + feedback (not hard pitch). Needs M-09 deploy + M-17 list; M-16 video optional until recorded (live demo OK). |
| CPB-M19 | 5–10 live demos | P2 | Not started | **Keep** | GTM-only | Confirmed 2026-05-21. Workspace A/B; `DEMO_VIDEO_SCRIPT.md` live script done. Recommend M-04/M-05 sign-off before external calls. Feeds M-20/M-21. |
| CPB-M20 | Refine positioning from demo objections | P2 | Not started | **Keep** | GTM-only | Confirmed 2026-05-21. After M-19; update `POSITIONING.md` + pitch/demo scripts from real objections. |
| CPB-M21 | Identify strongest buyer segment | P2 | Not started | **Keep** | GTM-only | Confirmed 2026-05-21. After M-20; narrows CPB-P02 ICP from demo evidence. Feeds M-22+ monetization focus. |
| CPB-M34 | SOWs / talk track → `SERVICE_LED_OFFERS.md` | P2 | Not started | **Keep** | GTM-only | Confirmed 2026-05-21. Align `ORDER_FORM_TEMPLATE.md` + outreach to named SKUs; recommended before M-22/M-23 paid signature. |
| CPB-M35 | ARC-AMPE policy pack #24 | P1 | Not started | **Keep** | **V1-now** | Confirmed 2026-05-21. CMS ACA / Medicaid Partner Entities per `POLICY_PACK_ARC_AMPE_DESIGN.md`; LLM → critic → human; bundle 23→24 + disclaimer test. Content + eng in V1 scope (not V1.1). |
| CPB-M22–M23 | Paid pilot offer drafts A/B | P3 | Not started | **Keep** | GTM-only | Confirmed 2026-05-21. M-22: review package (Readiness Review SKU); M-23: 30–60d pilot. Both from `ORDER_FORM_TEMPLATE.md` + `SERVICE_LED_OFFERS.md`; after M-34 recommended. |
| CPB-M24–M26 | Upwork listings (3 SKUs) | P2 | Not started | **Keep / Promote** | GTM-only | Confirmed 2026-05-21. Promoted to P2 to test production system ASAP. M-24 AI gov; M-25 Azure readiness; M-26 ADR cleanup. |
| CPB-M27 | One Upwork engagement | P2 | Not started | **Keep / Promote** | GTM-only | Confirmed 2026-05-21. Promoted to P2 to lean in and test the system in production early. |
| CPB-M36 | One paid pilot | P3 | Not started | **Keep** | GTM-only | Confirmed 2026-05-21. Validates service-led wedge and feeds commerce-un-hold (CPB-P04). |
| CPB-M28 | Testimonial request | P3 | Not started | **Keep** | GTM-only | Confirmed 2026-05-21. Social proof to validate service-led claims. After first Upwork or paid pilot engagement. |
| CPB-M29 | ServiceNow integration LinkedIn post | V1.1 | Deferred | **Defer** | V1.1 | Confirmed 2026-05-21. Waits on first-party ServiceNow integration. |
| CPB-M30 | CAF/LZ use case claim | V1 GA | Not started | **Keep** | **V1-now** | Confirmed 2026-05-21. Pulled into V1 deliverables. Disclaimer required. |
| CPB-M31 | Self-serve pricing + checkout page | V2 | Deferred | **Keep / Promote** | **V1-now** | Confirmed 2026-05-21. Promoted to V1 deliverables. Requires earlier alignment with CPB-P04 (commerce un-hold). |
| CPB-M32 | Reference customer case study | V1.1 | Deferred | **Defer** | V1.1 | Confirmed 2026-05-21. Depends on a completed, signed pilot. |
| CPB-M33 | Cross-tenant ROI marketing claim | V2 | Deferred | **Defer** | V2 | Confirmed 2026-05-21. Analytics deferred to V2. |

---

## §6 V1.1 / V2 deferred (`V1_DEFERRED`, MCP, policy packs, extractor)

| ID | Title | Source | Decision | Horizon | Notes |
|----|-------|--------|----------|---------|-------|
| CPB-D01 | First-party ITSM & Chat-ops (ServiceNow, Jira, Confluence, Slack, Teams) | `V1_DEFERRED.md` §6, §6a | **Keep** | V1.1 | Confirmed 2026-05-22. Includes inbound HTTPS webhooks (CloudEvents). |
| CPB-D02 | Inbound MCP server (membrane) with 7 read-only tools | `V1_DEFERRED.md` §6d | **Keep** | V1.1 | Confirmed 2026-05-22. Outbound client remains V2. |
| CPB-D03 | Multi-cloud architecture analysis (AWS, GCP targets) | `V1_DEFERRED.md` §6n | **Keep** | V1.1 | Confirmed 2026-05-22. Phases 1-4. ArchLucid stays on Azure. |
| CPB-D04 | Signed design partner engagement | `V1_DEFERRED.md` §6b | **Keep** | V1.1 | Confirmed 2026-05-22. Commercial milestone. |
| CPB-D05 | PGP key drop for coordinated disclosure | `V1_DEFERRED.md` §6c | **Keep** | V1.1 | Confirmed 2026-05-22. |
| CPB-D06 | First-tenant funnel SQL retention/purge | `V1_DEFERRED.md` §1 | **Keep** | V1.1 | Confirmed 2026-05-22. Window/purge for `dbo.FirstTenantFunnelEvents`. |
| CPB-D07 | Baseline wizard enrichments | `V1_DEFERRED.md` §4 | **Keep** | V1.1 | Confirmed 2026-05-22. AWS/GCP targets, guided datastore review, tag gates. |
| CPB-D08 | CI test coverage ratchet to 95% | `V1_DEFERRED.md` §4 | **Keep** | V1.1 | Confirmed 2026-05-22. |
| CPB-D09 | Hosted trials V1→V1.1 migration doc | `V1_DEFERRED.md` §6i | **Keep** | V1.1 | Confirmed 2026-05-22. Rollup memo of breaking changes. |
| CPB-D10 | Evidence Bulk Upload enhancements | `V1_DEFERRED.md` §6k | **Keep** | V1.1 | Confirmed 2026-05-22. >30 cap, ZIP expansion, folder recursion. |
| CPB-D11 | Executive ROI summary endpoint (cross-run dedup) | `V1_DEFERRED.md` §6o | **Keep** | V1.1 | Confirmed 2026-05-22. |
| CPB-D12 | Outbound MCP client (ArchLucid calls external) | `V1_DEFERRED.md` §6d | **Keep** | V2 | Confirmed 2026-05-22. Requires explicit allowlist and approval-class mapping. |
| CPB-D13 | Platform scale-out (Redis defaults, distributed graph) | `V1_DEFERRED.md` §6e | **Keep** | V2 | Confirmed 2026-05-22. Redis as expected baseline for scaled fleets. |
| CPB-D14 | Azure Container Apps Jobs + Durable Task Framework | `V1_DEFERRED.md` §6f | **Keep** | V2 | Confirmed 2026-05-22. Situational — only if pipeline complexity exceeds current limits. |
| CPB-D15 | Automated tenant erasure quarantine pipeline | `V1_DEFERRED.md` §6m | **Keep** | V2 | Confirmed 2026-05-22. |
| CPB-D16 | Multi-region active/active guarantees | `V1_DEFERRED.md` §6l | **Keep** | V2 | Confirmed 2026-05-22. |
| CPB-D17 | Third-party pen-test execution + redacted summary | `V1_DEFERRED.md` §6c | **Keep** | V2 | Confirmed 2026-05-22. |

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
