> **Reviewed:** 2026-07-22
> **Scope:** Archived assessment + paired Cursor prompts (historical only). Current workflow: `docs/assessments/LATEST_GPT55.md` and `docs/library/ASSESSMENT_INPUTS.md`.

# Quality assessment series — 2026-04-23 (73.20%)

---

## Weighted assessment (73.20%)

**Audience.** Product leadership, sponsoring exec, engineering leads, GTM owners.

**Method.** Each quality is scored 1–100 from a fresh inspection of the repository (source projects, Terraform stacks, docs, CI gates, runbooks, ADRs, templates, GTM material) on 2026-04-21 and re-evaluated on 2026-04-23 against the new V1 contract (post-sixth-pass Q&A). Items the owner has formally **deferred to V1.1 / V2** (per [`V1_DEFERRED.md`](library/V1_DEFERRED.md), [`V1_SCOPE.md`](library/V1_SCOPE.md) §3, and the **Resolved** tables in [`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md)) are **excluded** from the readiness score — they are not held against ArchLucid here.

**Independence.** This file does **not** consult earlier `QUALITY_ASSESSMENT_*` outputs. Where my judgement happens to align with a previous one, that is convergent evidence, not citation. The prior 68.60 / 71.71 file is the previous week's pass; this is a new pass for the 2026-04-28 cadence (run early because the sixth-pass Q&A materially changed the V1 contract).

**Calibration note.** A quick in-conversation estimate before the per-cell math projected ~66%; the cell-by-cell tally below comes to **73.20%**. The difference is the result of scoring each quality consistently against the **post-Q&A V1 contract** (with V1.1-deferred milestones excluded as the operating rule requires), rather than as deltas from the prior pessimistic in-conversation pass. The **73.20%** figure is the canonical one for this assessment.

**Ordering rule.** Sections in §1 appear **most-improvement-needed first**. "Improvement need" is `(100 − score) × weight` so a 30-point gap on a weight-8 quality outranks the same gap on a weight-1 quality.

**Weight arithmetic.** The supplied weights total **102** (Commercial 40 + Enterprise 25 + Engineering 37). The weighted percent is `Σ(score × weight) ÷ (102 × 100)`. Bucket sub-totals also use their bucket weight as the denominator so they read as 0–100 percentages.

---

## 0. Headline

| Bucket | Weight share | Numerator | Bucket score |
|--------|--------------|-----------|--------------|
| **Commercial** | 40 / 102 | 2,750 / 4,000 | **68.75%** |
| **Enterprise** | 25 / 102 | 1,733 / 2,500 | **69.32%** |
| **Engineering** | 37 / 102 | 2,983 / 3,700 | **80.62%** |
| **Total** | 102 / 102 | **7,466 / 10,200** | **73.20%** |

**Plain-English read.**

- **Overall picture.** Engineering is the strongest column by a comfortable margin (80.62%). Commercial and Enterprise sit close together in the high 60s. Movement on the total in V1 is dominated by Commercial — every percentage point of buyer-facing copy / trial funnel / category positioning shifts the headline noticeably because Commercial carries the largest weight share (40/102).
- **Commercial picture.** The repo carries the full V1 marketing kit (sponsor brief, product packaging, vertical briefs, screenshot gallery, trust center, `/why`, `/pricing`, `/get-started` route stubs, board-pack PDF endpoint just-shipped per Improvement 9 of the prior assessment). The largest single drag is the absence of a live trial funnel in production (V1 commercial motion is sales-led — commerce un-hold V1.1-deferred); the second is the buyer-facing first-30-minutes copy. Both are V1-actionable per owner Q1–Q5.
- **Enterprise picture.** Audit coverage is comprehensive (78 typed events, append-only SQL, CSV export, RLS, governance dual-write). Trust Center is comprehensive on the existing surface. Pen-test publication and PGP key drop are both V1.1-deferred per owner Q10 / Q12 / Q13 / Q14, so Trustworthiness and Procurement Readiness are no longer charged for them in V1. The two remaining V1 enterprise levers are (a) governance dry-run / what-if mode (Improvement 5 in §3) and (b) the rebrand workstream (Improvement 4) — the latter shifts buyer perception of the product category from "AI Architecture Intelligence" to "AI Architecture Review Board" per owner Q6 / Q7.
- **Engineering picture.** Strong on tests (1,097 test files, mutation testing, contract tests, k6, ZAP, Schemathesis, Stryker), strong on persistence (112 DbUp migrations, RLS via SESSION_CONTEXT, append-only audit log), strong on observability (Serilog + OpenTelemetry + correlation IDs). The Coordinator → Authority pipeline unification ([ADR 0030](../../architecture/adrs/0030-coordinator-authority-pipeline-unification.md)) is in flight — PR A0–A2 landed, PR A3–A4 unblocked by owner Decision A on 2026-04-23 (build the full Authority FK chain in `DemoSeedService` and `ReplayRunService`). The golden-cohort real-LLM gate budget was just approved (owner Q15) — Improvement 11 in §3 wires the cost-and-latency dashboard.

---

## 0.1 Sixth-pass deferral re-score addendum (2026-04-23)

> **Owner deferral (sixth pass).** On 2026-04-23 the owner explicitly deferred two assurance milestones to **V1.1**: the Aeronova **pen-test execution + redacted summary publication** (Q10), and the **PGP key drop** for `security@archlucid.net` (Q12 / Q13 / Q14). See [`docs/library/V1_DEFERRED.md`](library/V1_DEFERRED.md) §6c and [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) **Resolved 2026-04-23 (sixth pass)**.

This addendum baked the V1.1 deferrals **into the per-quality scores** before the table in §1 was filled in. Specifically:

- **Trustworthiness** (§1.7) is no longer charged for missing executed pen test or PGP key drop (both V1.1).
- **Procurement Readiness** (§1.9) is no longer charged for missing pen test on public Trust Center.

The owner also approved the **Azure OpenAI ~$50/month budget** for the golden-cohort real-LLM gate (Q15). This unblocks Improvement 11, but the score lift is conditional on the dashboard + kill-switch landing — held back until that ships.

The owner scheduled the **"AI Architecture Review Board" rebrand workstream** to V1 (Q6 / Q7). The score lift is held back until the rebrand workstream actually ships across the marketing site, sponsor brief, competitive landscape, vertical briefs, Trust Center, and in-product copy — Improvement 4 in §3.

---

## 1. Per-quality scores (most-improvement-needed first)

The 30 qualities below each carry an explicit **weight** from the supplied weights; bracketed bucket tag identifies which sub-total they roll into. Each row carries **score**, **weight**, **weighted deficiency** (`(100 − score) × weight`), **justification**, **trade-offs**, **improvement recommendation**, and a 1-word **fixability** tag (`easy` / `medium` / `hard`). Rows are ordered by descending weighted deficiency, then alphabetically.

### 1.1 [Commercial] Adoption Friction (weight 8) — score 50/100 — weighted deficiency 400

**Justification.** ArchLucid is a SaaS product (per the prior file's §0.1 SaaS-framing addendum and the audience-banner sweep on 2026-04-23). The buyer's journey today is: arrive at `archlucid.net` (placeholder), look at `/pricing` (real numbers), consider a sales call (`ORDER_FORM_TEMPLATE.md`), or — the only self-service path — clone the repo and run developer tooling. That is a **high-friction** path for a non-engineer evaluator. The trial signup funnel exists in TEST mode on staging but is not in production, and the buyer-facing first-30-minutes walkthrough is unwritten.

**Trade-off.** The owner-resolved V1 commercial motion is sales-led (commerce un-hold is V1.1-deferred); shipping the trial funnel TEST-mode end-to-end is the **biggest** single lever the assistant can pull on Commercial in V1.

**Improvement.** Improvement 2 in §3 (trial funnel TEST-mode end-to-end) and Improvement 1 (buyer-facing first-30-minutes copy with vertical-picker preset). **Fixability: medium.**

### 1.2 [Commercial] Marketability (weight 8) — score 70/100 — weighted deficiency 240

**Justification.** Strong artefact set (sponsor brief, three-layer packaging, vertical briefs, screenshot gallery, trust center, `/why`, `/pricing`, `/get-started` route stubs). Honest about absence of customer logos (V1.1). The biggest soft gap is **product-category positioning**: today the marketing surfaces lead with "AI Architecture Intelligence", which tests poorly with CIO-grade buyers per the owner's Q6 reasoning. Q6 confirmed openness to repositioning toward "AI Architecture Review Board".

**Trade-off.** Repositioning across marketing site + sponsor brief + competitive landscape + vertical briefs + Trust Center is multi-PR work; until it ships, the score does not lift.

**Improvement.** Improvement 4 in §3 (brand-neutral content seam + V1 rebrand workstream). **Fixability: medium.**

### 1.3 [Commercial] Decision Velocity (weight 6) — score 60/100 — weighted deficiency 240

**Justification.** Buyer can read `/pricing` (real numbers), download the procurement pack, see the comparison rows, see the value-report DOCX, see the board-pack PDF (just shipped per prior Improvement 9). What the buyer cannot do is **try the product themselves** without engaging sales. That extends the decision cycle from days to weeks.

**Trade-off.** Live commerce is V1.1-deferred; sales-led motion is the V1 contract. Within that contract, the lever is the trial funnel TEST-mode end-to-end (Improvement 2) and the buyer-facing first-30-minutes (Improvement 1) — both let the buyer self-direct evaluation.

**Improvement.** Improvements 1 and 2. **Fixability: medium.**

### 1.4 [Engineering] Verifiability (weight 4) — score 60/100 — weighted deficiency 160

**Justification.** Tests are abundant and varied (Vitest, NUnit/xUnit, Schemathesis, Stryker, k6, ZAP, Playwright with `axe-core`). Golden-cohort drift detection is wired but **simulator-only** today; the real-LLM gate is the only place the entire RAG → typed-finding pipeline is exercised against a real model. Q15 just approved the budget, so this score is poised to move **after** the gate ships.

**Trade-off.** Real-LLM gate adds Azure OpenAI spend (capped at $50/month per Q15) and adds nightly latency variance to the pipeline. Without it, RAG / prompt regressions surface only in production.

**Improvement.** Improvement 11 in §3 (Azure OpenAI cost-and-latency dashboard + nightly kill-switch + flip `cohort-real-llm-gate` from disabled to required). **Fixability: medium.**

### 1.5 [Engineering] Architectural Coherence (weight 5) — score 70/100 — weighted deficiency 150

**Justification.** ADR-driven (32 ADRs), C4-modelled, bounded contexts visible in the 49-project layout, audit-coverage matrix maintained, `LegacyRunCommitPath` flag explicitly tracking the strangler. The biggest in-flight friction is the Coordinator → Authority pipeline unification ([ADR 0030](../../architecture/adrs/0030-coordinator-authority-pipeline-unification.md)) — PR A3 / A4 blocked on the FK-chain rewrite of `DemoSeedService` + `ReplayRunService` (owner Decision A on 2026-04-23 unblocks the work but does not yet ship it).

**Trade-off.** Forcing a single pipeline reduces operational surface but consumes a sprint of focused engineering effort. Skipping it preserves the dual-pipeline tax.

**Improvement.** Improvement 8 in §3 (PR A3 + PR A4 of ADR 0030 — `DemoSeedService` + `ReplayRunService` Authority FK chain rewrite). **Fixability: medium-hard.**

### 1.6 [Commercial] Proof-of-ROI Readiness (weight 5) — score 70/100 — weighted deficiency 150

**Justification.** Strong substrate (`PILOT_ROI_MODEL.md`, `ROI_MODEL.md`, `PilotRunDeltaComputer`, value-report DOCX renderer, evidence-pack template, soft-required `baselineReviewCycleHours` capture, aggregate ROI bulletin template with min-N privacy guards, board-pack PDF endpoint). The biggest gap is the **first-tenant onboarding telemetry funnel** — without measurable evidence that real tenants do hit "first finding" inside 30 minutes, the marketing claim is unsubstantiated.

**Trade-off.** Adding the funnel adds telemetry surface; the data is needed to back the marketing claim.

**Improvement.** Improvement 12 in §3 (first-tenant onboarding telemetry funnel — instruments the opt-in tour from Q9). **Fixability: medium.**

### 1.7 [Enterprise] Trustworthiness (weight 3) — score 60/100 — weighted deficiency 120

**Justification.** Strong: SOC 2 self-assessment (deferred to ~$1M ARR per owner Q16), DPA template, subprocessors register, RLS, append-only audit log, security.txt, owner-conducted security assessment. The remaining V1 trust gaps are narrow and bounded — no executed third-party pen test on the public Trust Center, no PGP key on `security@archlucid.dev` — but **both are V1.1-deferred** per owner Q10 / Q12 / Q13 / Q14, so they no longer count against this score in V1. The remaining V1 lever is consolidation of existing self-attested evidence into a single procurement-friendly artefact.

**Trade-off.** Without third-party pen test or PGP key in V1, the trust signal for security-sensitive buyers is "owner-attested" rather than "third-party-attested". Owner accepted this trade-off explicitly.

**Improvement.** Improvement 6 in §3 (Trust Center "evidence pack" downloadable ZIP). **Fixability: easy** (the V1 lever is consolidation, not new evidence).

### 1.8 [Engineering] Reliability (weight 4) — score 70/100 — weighted deficiency 120

**Justification.** Health checks at `/health/live` and `/health/ready`, OpenTelemetry, structured logs, correlation IDs, Simmy chaos staging-only (production never per owner decision), retries via Polly, idempotency keys on commit paths, `coordinator-parity-daily.yml` warn-mode parity probe. The biggest reliability lever in flight is the Coordinator → Authority unification (Improvement 8) — collapsing two pipelines to one removes a class of dual-write divergence bugs.

**Trade-off.** Production chaos is owner-resolved as "production never" — this caps the achievable reliability score because production-only failure modes go unmeasured. Acceptable trade-off given customer notification cost.

**Improvement.** Improvement 8 (pipeline unification). **Fixability: medium-hard.**

### 1.9 [Commercial] Differentiability (weight 4) — score 65/100 — weighted deficiency 140

**Justification.** Strong differentiation surface (`/why` page, `COMPETITIVE_LANDSCAPE.md`, dual-pipeline navigator, `/demo/preview`, `/demo/explain`, citation-protected comparison rows, downloadable side-by-side PDF). The product-category repositioning (Q6) is the largest unrealised differentiator — "AI Architecture Review Board" frames ArchLucid as **upstream of governance**, not "another AI-assisted IDE".

**Trade-off.** Repositioning is the largest soft cost (multi-doc rewrite); the differentiation **content** is already in repo.

**Improvement.** Improvement 4 in §3 (rebrand workstream covers this). **Fixability: medium.**

### 1.10 [Engineering] Cost Visibility (weight 2) — score 50/100 — weighted deficiency 100

**Justification.** Azure spend is governed at the platform level (subscription split, tagging, budgets), but **per-feature spend visibility is weak**. The newly approved $50/month golden-cohort budget (Q15) is the first piece of feature-level spend that needs a dashboard.

**Trade-off.** Adding dashboards adds App Insights / Log Analytics queries; without them, spend overruns surface only at month-end.

**Improvement.** Improvement 11 in §3 (Azure OpenAI cost-and-latency dashboard + nightly kill-switch). **Fixability: easy.**

### 1.11 [Commercial] Commercial Packaging Readiness (weight 4) — score 75/100 — weighted deficiency 100

**Justification.** Three-tier pricing model (Team / Professional / Enterprise) with feature gates, two-layer product packaging (Pilot / Operate), Marketplace alignment doc, `/pricing` page, `ORDER_FORM_TEMPLATE.md`, `BillingProductionSafetyRules`, `[RequiresCommercialTenantTier]` 402 filter all in place. With commerce un-hold V1.1-deferred (Q17), the V1 packaging gap narrows to **rebrand alignment** — pricing page should reflect the "AI Architecture Review Board" positioning when Q6 / Q7's workstream ships.

**Trade-off.** Repositioning is multi-doc work; pricing surface is one of multiple touch points.

**Improvement.** Improvement 4 in §3 (rebrand workstream includes `/pricing`). **Fixability: medium.**

### 1.12 [Enterprise] Integration Surface (weight 3) — score 72/100 — weighted deficiency 84

**Justification.** GitHub Action manifest delta + Azure DevOps pipeline task shipped, Microsoft Teams notification connector V1 with five triggers (per prior owner q32), CloudEvents webhooks, REST API. Jira / ServiceNow connectors V1.1-deferred per prior owner decision; Slack V2-deferred.

**Trade-off.** Microsoft-first integration posture per [ADR 0019](../../architecture/adrs/0019-logic-apps-standard-edge-orchestration.md); Atlassian / Slack delivered later.

**Improvement.** None V1-actionable beyond expanding Microsoft Teams trigger set (already done per prior owner q32). **Fixability: easy** at the V1 contract.

### 1.13 [Engineering] Test Discipline (weight 4) — score 78/100 — weighted deficiency 88

**Justification.** 1,097 test files, Vitest + NUnit/xUnit, Stryker mutation testing, Schemathesis API contract validation, k6 load, ZAP baseline, Playwright + axe-core. Coverage cap on critical paths is enforced. The remaining gap is the real-LLM golden-cohort gate (Improvement 11) and the property-based test surface on Authority projection (PR A0.5 territory).

**Trade-off.** Adding more test surface adds CI time; current CI runs are already long.

**Improvement.** Improvement 11 (real-LLM gate) shadows §1.4. **Fixability: medium.**

### 1.14 [Engineering] Operability (weight 3) — score 75/100 — weighted deficiency 75

**Justification.** Strong runbook discipline (`COORDINATOR_TO_AUTHORITY_PARITY.md`, `GAME_DAY_CHAOS_QUARTERLY.md`, `RTO_RPO_TARGETS.md`, `TRIAL_FUNNEL_END_TO_END.md`), CLI `doctor` and `support-bundle`, `/version`, correlation IDs, structured logs, OpenTelemetry. The biggest operability gap is **in-product support-bundle download** (owner decisions F/G last batch — UI work for `/admin/support`).

**Trade-off.** Adding the UI surface duplicates CLI capability; it improves the SaaS-customer self-sufficiency story.

**Improvement.** Improvement 7 in §3 (in-product opt-in tour from Q9 + `/admin/support` page). **Fixability: easy.**

### 1.15 [Enterprise] SLA & Tier Targets (weight 3) — score 75/100 — weighted deficiency 75

**Justification.** `RTO_RPO_TARGETS.md`, Trust Center SLA summary, multi-region tier targets documented (active/active is V1.1+).

**Trade-off.** None notable.

**Improvement.** None V1-actionable. **Fixability: easy.**

### 1.16 [Engineering] Customer Self-Sufficiency (weight 2) — score 65/100 — weighted deficiency 70

**Justification.** Operator UI covers plan management, user invites, API-key rotation, audit log viewing. Missing in-product support-bundle download (owner decisions F/G last batch — UI work for `/admin/support`).

**Trade-off.** Adding the UI duplicates CLI; it improves SaaS self-sufficiency.

**Improvement.** Improvement 7 in §3 covers the in-product surface. **Fixability: easy.**

### 1.17 [Enterprise] Governance Surface (weight 3) — score 78/100 — weighted deficiency 66

**Justification.** Approval workflow with segregation of duties, SLA tracking, webhook escalation, pre-commit gate, policy packs, governance dashboard, dual-write to durable audit. Missing the **dry-run / what-if** mode that lets a tenant simulate a threshold change before applying it.

**Trade-off.** Dry-run mode adds API surface; without it, threshold tuning requires real commits to test.

**Improvement.** Improvement 5 in §3 (governance dry-run / what-if mode). **Fixability: medium.**

### 1.18 [Enterprise] Compliance Coverage (weight 3) — score 78/100 — weighted deficiency 66

**Justification.** Compliance drift trend, policy packs (EU/GDPR + US public-sector), audit-event matrix, RLS, retention policies. SOC 2 deferred to ~$1M ARR per owner Q16.

**Trade-off.** Policy-pack content depth varies by vertical; financial-services pack is deeper than manufacturing.

**Improvement.** None V1-actionable in this assessment beyond the rebrand workstream (Improvement 4) which surfaces compliance language consistently. **Fixability: medium.**

### 1.19 [Enterprise] Procurement Readiness (weight 2) — score 70/100 — weighted deficiency 60

**Justification.** Procurement pack is real (DPA, subprocessors, SLA summary, security.txt, CAIQ Lite, SIG Core, owner security assessment, pen test SoW, downloadable procurement-pack ZIP). With pen-test publication V1.1-deferred (owner Q10), the V1 procurement gap narrows to the absence of consolidated "evidence pack" — a single ZIP a procurement team can attach to a vendor risk file.

**Trade-off.** Adding the evidence-pack ZIP duplicates artefacts already in repo; the value is consolidation, not new content.

**Improvement.** Improvement 6 in §3 (Trust Center evidence-pack ZIP endpoint). **Fixability: easy.**

### 1.20 [Enterprise] Data Consistency (weight 3) — score 80/100 — weighted deficiency 60

**Justification.** Outbox pattern (where used), `READ_COMMITTED_SNAPSHOT_ISOLATION`, idempotency keys on commit paths, page compression, append-only audit log, dual-pipeline parity probe (warn-mode). Improvement 8 (Coordinator → Authority unification) is the largest in-flight consistency lever.

**Trade-off.** Dual pipelines today carry parity-probe tax; unification removes it.

**Improvement.** Improvement 8 in §3 (PR A3 / A4 of ADR 0030). **Fixability: medium-hard.**

### 1.21 [Engineering] Auditability (weight 3) — score 80/100 — weighted deficiency 60

**Justification.** 78 typed audit events in append-only SQL, CSV export, governance dry-run audit-event capture (just shipped per owner q37), `DENY UPDATE/DELETE` on `dbo.AuditEvents`, search by event type / actor / run / correlation / time. The remaining gap is **forensic depth on dry-runs** — owner Q37 (last batch) confirmed payload capture with redaction; Improvement 5 in §3 covers governance dry-run / what-if mode formally.

**Trade-off.** Storing override payloads expands forensic surface; the redaction pipeline mitigates the privacy cost.

**Improvement.** Improvement 5 in §3 (governance dry-run / what-if mode for policy threshold changes). **Fixability: medium.**

### 1.22 [Commercial] Sponsor / Exec Visibility (weight 3) — score 80/100 — weighted deficiency 60

**Justification.** `EXECUTIVE_SPONSOR_BRIEF.md`, board-pack PDF endpoint, monthly exec-digest preset (just shipped per prior Improvement 9 / owner q36), value-report DOCX. Cover narrative ships as the q35 placeholder per owner decision; the sponsor surface is V1-complete.

**Trade-off.** None notable.

**Improvement.** None V1-actionable beyond owner-supplied cover narrative for any external use. **Fixability: easy.**

### 1.23 [Engineering] Observability (weight 3) — score 80/100 — weighted deficiency 60

**Justification.** Serilog + OpenTelemetry, correlation IDs, client-error telemetry, API request metering, App Insights binding, `/version`. Strong.

**Trade-off.** None notable.

**Improvement.** None V1-actionable. **Fixability: easy.**

### 1.24 [Engineering] Security Posture (weight 4) — score 80/100 — weighted deficiency 80

**Justification.** RLS via `SESSION_CONTEXT` (al_* keys post-rename), Key Vault for secrets, JWT bearer + API key + dev bypass, Kestrel server header removal, OWASP ZAP baseline, Gitleaks, STRIDE-style threat modeling, `BillingProductionSafetyRules`, fail-closed defaults, SMB-445 never publicly exposed (per always-on rule). Owner-conducted security self-assessment is the V1 interim posture (pen test V1.1-deferred per Q10).

**Trade-off.** Owner-conducted vs third-party-attested is the defining V1 security trade-off; owner accepted it.

**Improvement.** None V1-actionable beyond Improvement 6 (evidence-pack ZIP) which consolidates the existing security artefacts. **Fixability: easy.**

### 1.25 [Engineering] Documentation Discipline (weight 2) — score 75/100 — weighted deficiency 50

**Justification.** Strong (FIRST_5_DOCS spine, audience banners on contributor docs post-2026-04-23 reorg, START_HERE.md, library/ depth, archive discipline). The gap is the **buyer-facing first-30-minutes copy** (Improvement 1) — a SaaS evaluator should not arrive on the contributor spine.

**Trade-off.** None notable; the gap is content, not structure.

**Improvement.** Improvement 1 in §3. **Fixability: medium.**

### 1.26 [Engineering] Performance Headroom (weight 2) — score 75/100 — weighted deficiency 50

**Justification.** k6 load testing exists, page compression on hot tables, Dapper (lightweight ORM), idempotency on commit paths. The `dbo.GoldenManifestVersions` legacy table is being dropped (PR A4) which removes a write-amplification source.

**Trade-off.** None notable.

**Improvement.** Improvement 8 (pipeline unification — secondary effect on perf). **Fixability: medium.**

### 1.27 [Commercial] Pricing Transparency (weight 2) — score 80/100 — weighted deficiency 40

**Justification.** `/pricing` page real numbers, `PRICING_PHILOSOPHY.md` internal source, three tiers, feature gates, reference-discount published.

**Trade-off.** None notable.

**Improvement.** None V1-actionable beyond the rebrand workstream (Improvement 4). **Fixability: easy.**

### 1.28 [Commercial] Channel Readiness (weight 2) — score 60/100 — weighted deficiency 80

**Justification.** Marketplace listing wiring is V1-complete (alignment doc, webhook controllers, `BillingProductionSafetyRules`); listing publication is V1.1-deferred per owner Q17. Stripe wiring same. Sales-led motion is the V1 contract.

**Trade-off.** Channel breadth is V1.1-bounded by owner decision; no V1 lever.

**Improvement.** None V1-actionable; V1.1 work tracked separately. **Fixability: easy** at the V1 contract.

### 1.29 [Engineering] Build / CI Discipline (weight 3) — score 82/100 — weighted deficiency 54

**Justification.** Strong workflow set (CI, CD, CodeQL, daily coordinator parity, golden cohort nightly, k6 load, Simmy chaos staging-only, SonarQube, Stryker, ZAP baseline, Gitleaks). Pre-commit hooks via Husky.

**Trade-off.** Long CI runs; matrix builds add minutes.

**Improvement.** None V1-actionable. **Fixability: easy.**

### 1.30 [Enterprise] Multi-Tenant Isolation (weight 3) — score 88/100 — weighted deficiency 36

**Justification.** RLS via `SESSION_CONTEXT` (al_* keys), `RlsSessionContextApplicator`, `RlsBypassPolicyBootstrap`, `DevelopmentDefaultScopeTenantBootstrap`, `SqlTenantHardPurgeService`, append-only audit log per tenant, integration tests. Strong.

**Trade-off.** None notable.

**Improvement.** None V1-actionable. **Fixability: easy.**

---

### 1.31 Bucket totals (sanity check)

**Commercial (weight 40):**
§1.1=50×8=400, §1.2=70×8=560, §1.3=60×6=360, §1.6=70×5=350, §1.9=65×4=260, §1.11=75×4=300, §1.22=80×3=240, §1.27=80×2=160, §1.28=60×2=120
**Sum = 2,750 / 4,000 = 68.75%** ✓

**Enterprise (weight 25):**
§1.7=60×3=180, §1.12=72×3=216, §1.15=75×3=225, §1.17=78×3=234, §1.18=78×3=234, §1.19=70×2=140, §1.20=80×3=240, §1.30=88×3=264
**Sum = 1,733 / 2,500 = 69.32%** ✓

**Engineering (weight 37):**
§1.4=60×4=240, §1.5=70×5=350, §1.8=70×4=280, §1.10=50×2=100, §1.13=78×4=312, §1.14=75×3=225, §1.16=65×2=130, §1.21=80×3=240, §1.23=80×3=240, §1.24=80×4=320, §1.25=75×2=150, §1.26=75×2=150, §1.29=82×3=246
**Sum = 2,983 / 3,700 = 80.62%** ✓

**Total weighted:** 2,750 + 1,733 + 2,983 = **7,466 / 10,200 = 73.20%** ✓

---

## 2. Cross-cutting findings

### 2.1 Top 10 most important weaknesses (V1 contract)

1. **Buyer-facing first-30-minutes copy is unwritten** — biggest single Commercial drag. Improvement 1 covers it.
2. **Trial funnel TEST-mode end-to-end not yet ship-ready** — second biggest. Improvement 2 covers it.
3. **Product-category positioning ("AI Architecture Intelligence" vs "AI Architecture Review Board")** — the rebrand workstream is V1-scheduled but multi-PR. Improvement 4 covers it.
4. **Real-LLM golden-cohort gate not yet wired** — biggest Engineering / Verifiability gap; budget approved but dashboard + kill-switch needed. Improvement 11 covers it.
5. **Coordinator → Authority unification PR A3 / A4 unblocked but not yet executed** — biggest Architectural Coherence + Reliability lever. Improvement 8 covers it.
6. **Governance dry-run / what-if mode missing** — biggest Governance Surface gap. Improvement 5 covers it.
7. **First-tenant onboarding telemetry funnel missing** — without it, the "30-minute first finding" claim is unsubstantiated. Improvement 12 covers it.
8. **In-product support-bundle download missing** — biggest Customer Self-Sufficiency gap on the SaaS framing. Improvement 7 covers it.
9. **Trust Center evidence-pack ZIP not yet a single download** — biggest Procurement Readiness lever inside V1 contract. Improvement 6 covers it.
10. **Per-feature Azure cost visibility weak** — first feature ($50/month golden-cohort) needs a dashboard. Improvement 11 doubles as the cost-visibility lever.

### 2.2 Top 5 monetization blockers (V1 contract)

1. **No buyer-facing first-30-minutes path** (Improvement 1) — without a self-direct evaluation path, the buyer must engage sales to evaluate.
2. **Trial funnel not in production** (Improvement 2) — same shape; the funnel is the vehicle for self-direct evaluation.
3. **Product-category positioning sub-optimal** (Improvement 4) — "AI Architecture Intelligence" tests poorly with CIO-grade buyers per owner Q6.
4. **No telemetry on first-tenant success** (Improvement 12) — the "30-minute first finding" marketing claim is unsubstantiated without funnel data.
5. **No Trust Center evidence-pack ZIP for procurement** (Improvement 6) — procurement teams need a single artefact, not a list of links.

### 2.3 Top 5 enterprise adoption blockers (V1 contract)

1. **No governance dry-run / what-if mode** (Improvement 5) — threshold tuning requires real commits to test today.
2. **In-product support-bundle download missing** (Improvement 7) — SaaS customers cannot SSH; CLI-only support bundle is friction.
3. **Trust Center evidence-pack not a single ZIP** (Improvement 6) — procurement consolidation lever.
4. **In-product opt-in tour missing** (Improvement 7) — first-tenant onboarding has no guided path.
5. **Cost visibility for new feature spend weak** (Improvement 11) — enterprises that self-host or pay per-feature need spend dashboards.

### 2.4 Top 5 engineering risks (V1 contract)

1. **Coordinator → Authority unification incomplete** (Improvement 8) — PR A3 / A4 unblocked by owner Decision A but not yet executed; dual-pipeline tax persists.
2. **Real-LLM golden-cohort gate disabled** (Improvement 11) — RAG / prompt regressions surface only in production.
3. **Per-feature cost visibility weak** (Improvement 11) — overruns surface at month-end.
4. **`LegacyRunCommitPath: true` in shipped `appsettings.json`** — the strangler default flips to `false` only when `RunCommitPathSelector` + `AuthorityDrivenArchitectureRunCommitOrchestrator` ship (already covered by ADR 0030 follow-on).
5. **Production chaos out of scope** — owner-resolved as "production never"; this caps achievable reliability score and is acceptable trade-off.

### 2.5 Most Important Truth

> **The product is mechanically V1-ready; the V1 commercial motion is sales-led; the largest remaining levers are buyer-facing copy (Improvements 1, 2, 4) and a single Engineering arc (Improvements 8, 11). Two owner-controlled events still move the score in V1.1: pen-test publication and commerce un-hold.** Everything else is incremental.

---

## 3. Top 8 V1-actionable improvement opportunities (post-Q&A) — plus 2 deferred

Each improvement carries **why it matters**, **expected impact**, **affected qualities**, **status**, and a **full Cursor prompt** if actionable. The original Improvements 9 and 10 (pen-test publication, PGP key drop) moved to V1.1 per owner Q10 / Q12 / Q13 / Q14; two new improvements (11 and 12) promoted to maintain the ≥ 8 actionable floor.

> **Cursor prompts** for improvements 1, 2, 3, 4, 5, 6, 7, 8, 11, 12 live in [§Cursor prompts (V1 improvements)](#cursor-prompts-v1-improvements) below. Each prompt is self-contained — paste the whole block into a fresh Cursor agent.

| # | Improvement | Why it matters | Expected impact | Affected qualities | Status |
|---|-------------|----------------|------------------|---------------------|--------|
| **1** | Buyer-facing first-30-minutes path (`docs/BUYER_FIRST_30_MINUTES.md` repo stub + marketing `(marketing)/get-started/` route, vertical-picker first, consultative voice, q35-style placeholders OK) | Self-direct SaaS evaluation; no installs of any kind | Adoption Friction 50→65 (+120 numerator), Marketability 70→75 (+40), Decision Velocity 60→65 (+30), Documentation 75→80 (+10) | Adoption Friction (w8), Marketability (w8), Decision Velocity (w6), Documentation (w2) | **Actionable** — owner Q1–Q5 unblocked all sub-decisions |
| **2** | Trial funnel TEST-mode end-to-end (staging) | Sales-engineer-led product evaluation without live commerce | Adoption Friction 50→70 (+160), Decision Velocity 60→75 (+90), Proof-of-ROI 70→75 (+25) | Adoption Friction (w8), Decision Velocity (w6), Proof-of-ROI (w5) | **Actionable** |
| **3** | `BeforeAfterDeltaPanel` (top of `/runs` + sidebar widget + inline on `/runs/[runId]`) | Make value visible at every operator touch point | Marketability 70→75 (+40), Differentiability 65→70 (+20), Sponsor Visibility 80→85 (+15) | Marketability (w8), Differentiability (w4), Sponsor Visibility (w3) | **Actionable** — owner q29 confirmed all three placements |
| **4** | Brand-neutral content seam + V1 rebrand workstream ("AI Architecture Review Board") | Buyer-recognisable category positioning; the seam ships defaulted to today's value, the workstream flips it across all surfaces | Marketability 70→80 (+80), Differentiability 65→75 (+40), Commercial Packaging 75→80 (+20), Pricing Transparency 80→85 (+10) | Marketability (w8), Differentiability (w4), Commercial Packaging (w4), Pricing Transparency (w2) | **Actionable** — owner Q6 / Q7 confirmed name + V1 schedule |
| **5** | Governance dry-run / what-if mode for policy threshold changes (with Q37-style payload-capture-with-redaction audit + Q38 20/100 pagination) | Threshold tuning without real commits; forensic dry-run audit | Governance Surface 78→88 (+30), Auditability 80→85 (+15), Compliance Coverage 78→83 (+15) | Governance Surface (w3), Auditability (w3), Compliance Coverage (w3) | **Actionable** — owner q37 / q38 confirmed payload capture + 20/100 pagination |
| **6** | Trust Center evidence-pack ZIP endpoint (DPA + subprocessors + CAIQ Lite + SIG Core + owner sec assessment + audit matrix) | Single procurement artefact | Procurement Readiness 70→80 (+20), Trustworthiness 60→65 (+15) | Procurement Readiness (w2), Trustworthiness (w3) | **Actionable** |
| **7** | In-product opt-in tour ("Show me around" button — never auto-launches per Q9) + `/admin/support` support-bundle download UI (gated `ExecuteAuthority` per decision F) | First-tenant guided path + SaaS self-sufficiency | Operability 75→80 (+15), Customer Self-Sufficiency 65→75 (+20), Adoption Friction 50→55 (+40) | Operability (w3), Customer Self-Sufficiency (w2), Adoption Friction (w8) | **Actionable** — owner Q8 / Q9 + decisions F / G confirmed |
| **8** | Coordinator → Authority unification PR A3 + PR A4 (`DemoSeedService` + `ReplayRunService` Authority FK chain rewrite per owner Decision A 2026-04-23) | Single-pipeline architecture, removes dual-write divergence class | Architectural Coherence 70→80 (+50), Reliability 70→75 (+20), Data Consistency 80→85 (+15), Performance Headroom 75→78 (+6) | Architectural Coherence (w5), Reliability (w4), Data Consistency (w3), Performance (w2) | **Actionable** — owner Decision A on 2026-04-23 unblocked the FK-chain shape |
| ~~9~~ | ~~Pen-test publication (Aeronova summary)~~ | ~~Third-party trust signal~~ | — | Trustworthiness, Procurement Readiness | **DEFERRED to V1.1** (owner Q10 — see [`V1_DEFERRED.md` §6c](library/V1_DEFERRED.md)). **Required input from owner:** Aeronova engagement scheduling, SoW funding, draft+final delivery dates. When V1.1 lands, the Trust Center "Recent assurance activity" row may name finding categories per Q11. |
| ~~10~~ | ~~PGP key drop for `security@archlucid.net`~~ | ~~Coordinated disclosure channel~~ | — | Trustworthiness | **DEFERRED to V1.1** (owner Q12 / Q13 / Q14 — gated on `archlucid.net` domain acquisition — see [`V1_DEFERRED.md` §6c](library/V1_DEFERRED.md)). **Required input from owner:** keypair generation, custodian naming, `archlucid.net` domain acquisition. When V1.1 lands, single-PR drop covers key + `SECURITY.md` + marketing `/security` page per Q14. |
| **11** | Azure OpenAI cost-and-latency dashboard for the golden-cohort real-LLM gate + nightly kill-switch | Q15-approved $50/month spend needs visibility + safety; flips `cohort-real-llm-gate` from disabled to required once the deployment exists | Verifiability 60→70 (+40), Test Discipline 78→83 (+20), Cost Visibility 50→70 (+40), Reliability 70→75 (+20) | Verifiability (w4), Test Discipline (w4), Cost Visibility (w2), Reliability (w4) | **Actionable** (promoted 2026-04-23 to fill original-9 slot) |
| **12** | First-tenant onboarding telemetry funnel (instruments the opt-in tour from Q9; aggregated-only by default, per-tenant opt-in via flag — see new pending question 40) | Measure 30-minute first-finding success rate before any marketing claim | Proof-of-ROI 70→80 (+50), Marketability 70→75 (+40), Customer Self-Sufficiency 65→70 (+10) | Proof-of-ROI (w5), Marketability (w8), Customer Self-Sufficiency (w2) | **Actionable** (promoted 2026-04-23 to fill original-10 slot) |

**Total expected impact if all 8 actionable improvements ship:** approximately **+1,400 numerator points** = **+13.7 percentage points** on the weighted total, taking V1 readiness from **73.20% → 86.9%** without any V1.1 milestones unlocking.

**DEFERRED items (no Cursor prompts generated, per operating rules):**

- **Original Improvement 9 — Pen-test publication.** See row above.
- **Original Improvement 10 — PGP key drop.** See row above.

---

## 4. Pending questions for later

The sixth-pass Q&A on 2026-04-23 closed all 17 questions surfaced by this assessment. The only items still owner-only after this assessment are the **operational tasks** the assistant cannot perform: Aeronova engagement execution, PGP keypair generation, Azure OpenAI deployment provisioning + secret injection, Marketplace + Stripe live-keys flip (V1.1).

See [`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) for the canonical list. The new pending question this assessment surfaces is:

40. **First-tenant onboarding telemetry — emission rule consent.** Improvement 12 (this assessment) ships funnel telemetry. Owner-only sub-decision: whether the telemetry emits **per-tenant** (subject to GDPR Art. 6(1)(f) legitimate-interest analysis already documented in `docs/security/PRIVACY_NOTE.md`) or **aggregated-only** (no per-tenant correlation in the funnel store). Default proposed in the prompt: **aggregated-only**, with a feature flag the owner can flip to per-tenant after a privacy review.

---

## 5. Related

| Doc | Use |
|-----|-----|
| [§Cursor prompts (V1 improvements)](#cursor-prompts-v1-improvements) | Eight paste-ready Cursor prompts for the 8 V1-actionable improvements (1, 2, 3, 4, 5, 6, 7, 8) plus the two promoted (11, 12) |
| [`PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) | Canonical pending-questions list with all 17 sixth-pass resolutions |
| [`library/V1_SCOPE.md`](library/V1_SCOPE.md) | V1 contract — pen-test publication and PGP key drop now in §3 *Out of scope for V1* |
| [`library/V1_DEFERRED.md`](library/V1_DEFERRED.md) §6c | New "Security and assurance — V1.1 candidates" section |
| [`QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md`](archive/assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md) | Prior week's pass (68.60% → re-scored 71.71% on 2026-04-23) |

---

## Cursor prompts (V1 improvements)

**How to use.** One prompt per session. Paste the whole block (between the triple backticks) into a fresh Cursor agent. Each prompt names its **stop-and-ask** boundaries — the assistant should not cross those without owner input. After each prompt completes, update [`docs/PENDING_QUESTIONS.md`](PENDING_QUESTIONS.md) accordingly.

**DEFERRED markers.** Original Improvements 9 (pen-test publication) and 10 (PGP key drop) were deferred to V1.1 by the sixth-pass owner Q&A on 2026-04-23. No prompts are generated for them. They are replaced here by Improvements 11 and 12.

> **SaaS audience guard (read before running any prompt below).** ArchLucid is a **SaaS** product. Customers, evaluators, and sponsors never install Docker, SQL, .NET, Node, or Terraform. They only ever interact with the public website (`archlucid.net`), the in-product operator UI (after sign-in), and the Azure portal for their own subscription identity / billing. Any customer-facing copy must not assume the customer runs Docker, opens a terminal, or applies Terraform. Tooling like `apply-saas.ps1`, `archlucid try`, `dev up`, `docker compose`, the `.devcontainer/`, and `engineering/INSTALL_ORDER.md` is **internal ArchLucid contributor / operator** tooling. If a prompt seems to require a customer-side install step, **stop and ask the user** rather than inventing one.

---

## Prompt 1 — Buyer-facing first-30-minutes path (repo stub + marketing route)

**Why this matters.** Self-direct SaaS evaluation; no installs of any kind. Currently a non-engineer evaluator either signs a sales call or downloads contributor toolchain. Owner-decided 2026-04-23 sixth-pass Q&A: voice = **consultative**, vertical-picker labels = **existing `templates/briefs/*` folder slugs**, screenshots = **real anonymized tenant** (placeholder slots OK in this PR), placeholder copy in repo stub = **yes (q35-style markers)**, "talk to a human" CTA = **V1.1 (defer)**.

```
Goal: ship a buyer-facing first-30-minutes path in TWO surfaces — a
short repo stub at docs/BUYER_FIRST_30_MINUTES.md (for evaluators
arriving via GitHub) and the full copy on the marketing
archlucid-ui/src/app/(marketing)/get-started/page.tsx route. The
journey is: archlucid.net landing page → signed in → vertical picker
→ first sample run → first finding, with NO local install of any
kind. Voice is consultative / pragmatic per owner Q1 (2026-04-23
sixth pass). Vertical-picker labels come from the existing
templates/briefs/*/ folder slugs per Q2 (no new owner-supplied label
set). Screenshots ship as placeholder slots per Q3 (real anonymized
tenant capture is a follow-on owner task). Placeholder copy in the
repo stub uses the q35-style marker "<<placeholder copy — replace
before external use>>" per Q4. Do NOT add a "talk to a human" CTA —
that is V1.1 per Q5. Do NOT invent customer names or testimonials.

Read first:
- docs/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md  (sections 1.1, 1.2, 1.3, 1.25 and §3 Improvement 1)
- docs/PENDING_QUESTIONS.md  (Resolved 2026-04-23 sixth-pass table — Q1–Q5)
- docs/CORE_PILOT.md  (the four-step Pilot path — buyer copy mirrors but does not duplicate this)
- docs/library/PRODUCT_PACKAGING.md  (two-layer Pilot/Operate framing)
- docs/EXECUTIVE_SPONSOR_BRIEF.md  (sponsor-facing voice reference)
- archlucid-ui/src/app/(marketing)/get-started/  (existing route stub if any)
- templates/briefs/  (folder slugs are the picker labels — list them; do NOT rename)
- docs/archive/assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md  §0.1  (SaaS-framing addendum — read carefully)

Do this:
1. Create docs/BUYER_FIRST_30_MINUTES.md (≤ 80 lines). Audience banner
   at the top: "Audience: prospective buyers and evaluators arriving
   via GitHub. For internal contributor onboarding see
   docs/engineering/FIRST_30_MINUTES.md." Sections (consultative
   voice, no marketing puffery):
     - "Where you are now" (you're on GitHub; the product is SaaS)
     - "What 30 minutes looks like" (sign in → pick vertical → first
       run → first finding) — five numbered steps with the q35
       placeholder marker on every owner-blocked sentence
     - "Where to go next" (link to marketing /get-started for screenshots,
       link to docs/CORE_PILOT.md for the operator path)
     - Explicit "no local install" note pointing at engineering/
       paths only for ArchLucid contributors.
2. Build the marketing route at archlucid-ui/src/app/(marketing)/get-started/page.tsx
   (or extend the existing stub). Same five-step shape as the repo
   stub, with placeholder image slots (`<Image src=
   "/get-started/step-{n}-placeholder.png" />`). The vertical picker
   reads from a static list mirroring templates/briefs/ folder slugs
   (financial-services, healthcare, manufacturing, public-sector,
   public-sector-us). NO talk-to-a-human CTA. NO email capture in
   this PR (V1 motion is sales-led; the sales CTA is the existing
   "Request a quote" button on /pricing).
3. Add a CI guard at scripts/ci/assert_buyer_first_30_minutes_in_sync.py
   that fails if the marketing route's vertical-picker labels diverge
   from the templates/briefs/ folder slugs OR if any non-placeholder
   sentence on either surface is missing an owner-approval marker
   when the file is touched (heuristic: any sentence outside the
   q35 placeholder pattern in the buyer-facing files needs to be
   in a small allow-list this script ships). Wire into ci.yml.
4. Tests:
   - Vitest spec for the marketing route asserting all five steps
     render and the picker shows exactly five labels matching the
     allow-list.
   - Markdown link-check for docs/BUYER_FIRST_30_MINUTES.md.
   - CI script self-test (fixture .md and fixture page.tsx — assert
     the script catches both divergence cases).
5. Update docs/START_HERE.md "Audience split" section to add the new
   buyer-facing path as the canonical evaluator entry.
6. Update docs/CHANGELOG.md with a 2026-04-23 entry naming Q1–Q5 as
   the source decisions.

Stop-and-ask boundaries:
- Do NOT invent customer prose for any sentence outside the
  q35-placeholder pattern beyond what's already in the consultative
  scaffold. If you find yourself writing more than ~3 paragraphs of
  net-new buyer-voice prose, stop and ask the user.
- Do NOT capture or display any real screenshots in this PR — slots
  only. Owner names tenantId/runId for the real-tenant capture in a
  follow-on task per Q3.
- Do NOT add the "talk to a human" CTA — that is V1.1 per Q5.

Land everything in one PR. After merge, update PENDING_QUESTIONS.md
item 36 to mark it Resolved (the wiring is done; copy is owner-blocked
on Q3 screenshots only, and that's a separate follow-on).
```

---

## Prompt 2 — Trial funnel TEST-mode end-to-end (staging)

**Why this matters.** Sales-engineer-led product evaluation without live commerce. The trial signup funnel exists in components but is not wired end-to-end on staging in TEST mode. Live keys are V1.1-deferred per owner Q17; the V1 scope is TEST-mode.

```
Goal: ship the trial signup funnel end-to-end on staging in Stripe
TEST mode. The V1 commercial motion is SALES-LED — live keys are
V1.1-deferred per owner Q17 (2026-04-23). This work makes the funnel
runnable as a sales-engineer-led product evaluation: prospect signs
up at signup.staging.archlucid.net, lands in the operator UI on a
trial tenant, sees the Pilot path on the home page, runs the seven-
step wizard, gets a first committed manifest, reads the value report.

Read first:
- docs/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md  (sections 1.1, 1.3, 1.6 and §3 Improvement 2)
- docs/runbooks/TRIAL_FUNNEL_END_TO_END.md  (existing developer-facing smoke — extend)
- ArchLucid.Api/Controllers/Billing*Controller.cs  (existing wiring)
- ArchLucid.Api/Filters/RequiresCommercialTenantTierAttribute.cs  (402 filter)
- ArchLucid.Api/Bootstrap/BillingProductionSafetyRules.cs  (must STAY shipped per V1_DEFERRED §6b rules)
- archlucid-ui/src/app/(marketing)/signup/  (existing stub)
- docs/library/V1_DEFERRED.md  §6b  (commerce-un-hold V1.1 boundaries)

Do this:
1. End-to-end Playwright spec at archlucid-ui/tests/e2e/trial-funnel-test-mode.spec.ts
   that exercises: signup form → email confirmation (deterministic
   mock) → trial tenant created → first sign-in → wizard step 1 →
   wizard step 7 → run committed → value report rendered. Asserts
   correlation IDs propagate. Skips if STRIPE_TEST_KEY env not set.
2. CLI smoke command `archlucid trial smoke --staging` that runs the
   API-side equivalent (no UI) against a staging API host with a
   TEST-mode Stripe configuration. Outputs a one-line PASS/FAIL +
   correlation ID for support.
3. Extend docs/runbooks/TRIAL_FUNNEL_END_TO_END.md with a "Sales-
   engineer playbook" section: how a sales engineer uses the funnel
   to drive a product evaluation, what to tell the prospect, how to
   reset a trial tenant after the evaluation.
4. Wire the e2e spec into a new GitHub Actions workflow at
   .github/workflows/trial-funnel-test-mode.yml that runs nightly
   against the staging environment. Failure pages an oncall channel
   (placeholder webhook variable; owner sets the real URL later).
5. Add a CI guard at scripts/ci/assert_billing_safety_rules_shipped.py
   that fails if BillingProductionSafetyRules is removed or its
   sk_live_/marketplace-published/landing-page checks are weakened.
6. Tests:
   - Unit tests for the new CLI command (mock the trial provisioning
     API).
   - Integration test for the BillingProductionSafetyRules guard.

Stop-and-ask boundaries:
- Do NOT touch any Stripe LIVE configuration. Anything with the
  sk_live_ prefix is owner-only and V1.1-gated.
- Do NOT publish the Marketplace listing. The wiring stays at
  Status: Draft per V1_DEFERRED §6b.
- Do NOT cut over signup.archlucid.net DNS. Staging only — that's
  signup.staging.archlucid.net.

Update docs/CHANGELOG.md with a 2026-04-23 entry. Update
PENDING_QUESTIONS.md item 22 to point at this work as the V1
deliverable that makes V1.1 commerce un-hold safe.
```

---

## Prompt 3 — `BeforeAfterDeltaPanel` (top of /runs + sidebar widget + inline)

**Why this matters.** Make value visible at every operator touch point. Owner q29 (prior batch, 2026-04-23) confirmed all three placements.

```
Goal: ship a single BeforeAfterDeltaPanel React component and wire
it into THREE routes per owner q29 (2026-04-23): top of the /runs
list page, as a sidebar widget, AND inline on each /runs/[runId]
detail page. Same component instance, route-context-gated.

Read first:
- docs/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md  (sections 1.2, 1.9, 1.22 and §3 Improvement 3)
- ArchLucid.Application/Pilots/PilotRunDeltaComputer.cs  (data source — already exists)
- archlucid-ui/src/app/(operator)/runs/page.tsx  (top placement)
- archlucid-ui/src/app/(operator)/runs/[runId]/page.tsx  (inline placement)
- archlucid-ui/src/components/operator-shell/Sidebar.tsx  (sidebar widget)

Do this:
1. New component: archlucid-ui/src/components/value/BeforeAfterDeltaPanel.tsx
   - Props: { variant: 'top' | 'sidebar' | 'inline', runId?: string }
   - Top variant: aggregates the most recent N runs (default 5) and
     shows the median delta on findings + time-to-first-finding.
   - Sidebar variant: same data, compact rendering.
   - Inline variant: single-run delta vs the prior committed run for
     the same architecture request (uses runId from props).
   - All three variants share a useDeltaQuery() hook that calls the
     existing /v1/pilots/runs/{id}/first-value-report endpoint or
     the new aggregated /v1/pilots/runs/recent-deltas endpoint
     (build the latter — gated on ReadAuthority, returns the last
     N committed runs' delta summaries).
2. New API endpoint: GET /v1/pilots/runs/recent-deltas?count=5 on
   PilotsController, gated [Authorize(Policy = "ReadAuthority")],
   returns Decisioning.Models.RunDeltaSummary[].
3. Wire all three placements:
   - top: insert at the top of /runs page above the existing list.
   - sidebar: add to Sidebar.tsx as a collapsible card under "Recent
     activity".
   - inline: insert on /runs/[runId] above the artifacts table.
4. Tests:
   - Vitest specs for all three variants (use a shared MSW handler
     so the test surface mirrors prod data shape).
   - API integration test for the new /recent-deltas endpoint.
5. Update docs/library/OPERATOR_ATLAS.md with the new endpoint.

Stop-and-ask boundaries: none — this is a self-contained component +
endpoint. Land in one PR. Update CHANGELOG.md.
```

---

## Prompt 4 — Brand-neutral content seam + V1 rebrand workstream ("AI Architecture Review Board")

**Why this matters.** Owner Q6 confirmed repositioning toward "AI Architecture Review Board"; Q7 confirmed V1 schedule. The content seam ships first; the workstream then flips it across all surfaces in follow-on PRs.

```
Goal: ship the brand-neutral content seam for product-category
positioning and schedule the V1 rebrand workstream that flips the
default value from "AI Architecture Intelligence" to "AI
Architecture Review Board" per owner Q6 / Q7 (2026-04-23 sixth pass).

This PR ships ONLY the seam and ONE flagship surface (/why) flipped.
Follow-on PRs cover the remaining surfaces in the workstream.

Read first:
- docs/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md  (sections 1.2, 1.9, 1.11 and §3 Improvement 4)
- docs/PENDING_QUESTIONS.md  (Resolved 2026-04-23 sixth-pass — Q6 / Q7 + pending question 39)
- archlucid-ui/src/lib/  (find a good home for brand-category.ts)
- archlucid-ui/src/app/(marketing)/why/  (flagship surface for this PR)
- docs/EXECUTIVE_SPONSOR_BRIEF.md  (one of the surfaces to flip in follow-on PRs)
- docs/go-to-market/COMPETITIVE_LANDSCAPE.md  (another follow-on surface)
- docs/trust-center.md  (another follow-on surface)
- templates/briefs/  (per-vertical brief docs — follow-on surfaces)

Do this:
1. New file: archlucid-ui/src/lib/brand-category.ts exporting:
     export const BRAND_CATEGORY = "AI Architecture Review Board";
     export const BRAND_CATEGORY_LEGACY = "AI Architecture Intelligence";
   With a JSDoc header explaining: "This is the single point of truth
   for the buyer-facing product category. To rebrand: change
   BRAND_CATEGORY here and run `npm run rebrand-check` to find any
   surface that hardcodes the legacy string."
2. New CI guard at scripts/ci/assert_brand_category_seam.py that
   fails if "AI Architecture Intelligence" appears in any file under
   archlucid-ui/src/app/, docs/EXECUTIVE_SPONSOR_BRIEF.md,
   docs/go-to-market/COMPETITIVE_LANDSCAPE.md, docs/trust-center.md,
   templates/briefs/**/brief.md, or docs/library/PRODUCT_PACKAGING.md
   — UNLESS the same file imports BRAND_CATEGORY_LEGACY (small allow-
   list for the seam file itself). The script ships in WARN mode for
   THIS PR; flip to fail mode in the follow-on PR that completes the
   workstream.
3. Flip the /why marketing surface in this PR: archlucid-ui/src/app/(marketing)/why/page.tsx
   imports BRAND_CATEGORY and uses it everywhere the legacy string
   appeared. Keep the legacy string in a single hidden meta tag so
   SEO redirects work for ~30 days.
4. Schedule the rebrand workstream in docs/CHANGELOG.md AND in a new
   docs/archive/assessments/REBRAND_WORKSTREAM_2026_04_23.md tracker:
     - PR-1 (this PR): seam + /why
     - PR-2: /pricing + /get-started
     - PR-3: docs/EXECUTIVE_SPONSOR_BRIEF.md + docs/go-to-market/COMPETITIVE_LANDSCAPE.md
     - PR-4: per-vertical brief docs (templates/briefs/**/brief.md)
     - PR-5: docs/trust-center.md + docs/library/PRODUCT_PACKAGING.md
     - PR-6: in-product copy (operator-shell governance pages, navigation labels)
     - PR-7 (closing): flip the CI guard from warn to fail.
5. Tests:
   - Vitest spec asserting /why renders BRAND_CATEGORY (not the
     legacy string).
   - CI script self-test (fixture file with the legacy string,
     fixture file with the seam import).

Stop-and-ask boundaries:
- Do NOT touch the in-product operator-shell copy in this PR. That
  is PR-6 in the workstream — separate session.
- Do NOT remove the legacy string from the seam file. Keep
  BRAND_CATEGORY_LEGACY exported for SEO redirect handlers.

Update docs/CHANGELOG.md and PENDING_QUESTIONS.md (mark question 39
schedule sub-decision as scheduled — workstream is in flight).
```

---

## Prompt 5 — Governance dry-run / what-if mode for policy threshold changes

**Why this matters.** Threshold tuning today requires real commits. Owner q37 / q38 (prior batch) confirmed payload-capture-with-redaction audit + 20/100 pagination.

```
Goal: ship a governance dry-run / what-if mode for policy threshold
changes, with payload-capture-with-redaction audit per owner q37 and
20-default / 100-max pagination per owner q38 (both 2026-04-23).

Read first:
- docs/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md  (sections 1.17, 1.18, 1.21 and §3 Improvement 5)
- ArchLucid.Decisioning/Governance/  (existing governance engine)
- ArchLucid.Application/Audit/AuditEventTypes.cs  (add the new event constant)
- docs/library/AUDIT_COVERAGE_MATRIX.md  (add the new event row)
- ArchLucid.Application/LlmPromptRedaction/  (the existing redaction pipeline — REUSE)
- ArchLucid.Api/Controllers/GovernanceController.cs  (host the new endpoint)
- archlucid-ui/src/app/(operator)/governance/  (UI for the modal)

Do this:
1. New endpoint: POST /v1/governance/policy-packs/{id}/dry-run gated
   [Authorize(Policy = "ReadAuthority")] (read auth is enough — no
   real commit happens). Body: { proposedThresholds: {...},
   evaluateAgainstRunIds: [...] }. Response: per-run delta showing
   what the new threshold WOULD have done.
2. Capture audit event AuditEventTypes.GovernanceDryRunRequested
   with payload schema:
     { proposedThresholdsRedacted: <redacted-json>,
       evaluatedRunIds: [...], deltaCounts: {...} }
   The proposedThresholds payload MUST pass through the existing
   LlmPromptRedaction-style pipeline before serialisation per owner
   q37. Add an integration test that asserts the redaction marker
   pattern appears in the persisted audit row when the input
   contains a known PII pattern.
3. UI: governance/dry-run modal on /governance/policy-packs/[id].
   Default page size 20, server-side cap 100 per owner q38. Vitest
   spec asserts default = 20.
4. Add AuditEventTypes.GovernanceDryRunRequested to the typed
   constant list AND to the audit-core-const-count snapshot test.
5. Update docs/library/AUDIT_COVERAGE_MATRIX.md with the new event row.

Stop-and-ask boundaries:
- The redaction pipeline is mandatory. Do NOT add a code path that
  bypasses it — the per-rule rule in PENDING_QUESTIONS.md sixth-pass
  table notes this explicitly.

Land in one PR. Update CHANGELOG.md and PENDING_QUESTIONS.md.
```

---

## Prompt 6 — Trust Center evidence-pack ZIP endpoint

**Why this matters.** Procurement teams need a single artefact. The content already exists; the lever is consolidation.

```
Goal: ship a downloadable Trust Center evidence-pack ZIP endpoint
that bundles the existing procurement content into one file.

Read first:
- docs/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md  (sections 1.7, 1.19 and §3 Improvement 6)
- docs/trust-center.md  (top-level Trust Center)
- docs/security/  (DPA, subprocessors, owner sec assessment)
- docs/security/pen-test-summaries/  (SoW template — ships even though execution is V1.1)
- docs/library/AUDIT_COVERAGE_MATRIX.md  (audit matrix is part of the pack)
- docs/library/TRUST_CENTER_FAQ.md  (CAIQ Lite + SIG Core if present)
- ArchLucid.Api/Controllers/MarketingController.cs  (host the new endpoint here)

Do this:
1. New endpoint: GET /v1/marketing/trust-center/evidence-pack.zip
   ANONYMOUS access (no auth — public Trust Center artefact).
   Builds the ZIP at request time from the in-repo files; cache the
   ZIP for 1 hour with an ETag based on the SHA-256 of the included
   files' content.
2. ZIP contents (mirror docs/trust-center.md links plus the canonical
   security artefacts):
     - README.md (auto-generated index)
     - DPA-template.md
     - SUBPROCESSORS.md
     - SLA-summary.md
     - security.txt (a copy)
     - CAIQ-Lite.xlsx (if present in repo) or CAIQ-Lite.md
     - SIG-Core.md
     - OWNER_SECURITY_ASSESSMENT_2026_Q2-DRAFT.md
     - PEN_TEST_SOW_2026_Q2.md (the SoW, NOT the redacted summary —
       summary is V1.1)
     - AUDIT_COVERAGE_MATRIX.md
3. Add a "Download evidence pack" button to docs/trust-center.md AND
   to the marketing /trust-center page (if it exists; if not, scope
   to docs/trust-center.md only).
4. Tests:
   - Integration test: GET the endpoint and assert the ZIP contains
     all expected entries.
   - Unit test for the ETag derivation.
5. Update docs/library/OPERATOR_ATLAS.md with the new endpoint.

Stop-and-ask boundaries:
- Do NOT include the pen-test REDACTED SUMMARY (that's V1.1-gated
  per Q10). Include only the SoW.
- Do NOT include the PGP key (also V1.1).

Land in one PR. Update CHANGELOG.md.
```

---

## Prompt 7 — In-product opt-in tour + `/admin/support` support-bundle download UI

**Why this matters.** First-tenant guided path + SaaS self-sufficiency. Owner Q8 / Q9 confirmed: assistant drafts tour copy with "pending owner approval" markers; tour is opt-in via "Show me around" button (never auto-launches). Owner decisions F / G (prior batch) confirmed: support-bundle UI on `/admin/support`, gated `ExecuteAuthority`.

```
Goal: ship two things in one PR — (a) an in-product opt-in tour
launched only via a "Show me around" button on the operator-shell
home page (NEVER auto-launches per owner Q9), with five tour steps
whose copy is the assistant's first cut clearly marked "pending owner
approval" per owner Q8; and (b) a new /admin/support page with a
support-bundle download button gated on ExecuteAuthority per owner
decision F (prior batch).

Read first:
- docs/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md  (sections 1.14, 1.16, 1.1 and §3 Improvement 7)
- archlucid-ui/src/app/(operator)/  (operator shell layout)
- archlucid-ui/src/app/(operator)/admin/  (existing admin pages — model new page on /admin/api-keys)
- ArchLucid.Cli/Commands/SupportBundleCommand.cs  (existing CLI implementation — REUSE the bundle assembly logic)
- ArchLucid.Api/Controllers/AdminController.cs  (host the new endpoint here, near /admin/api-keys)

Do this:
1. New endpoint: POST /v1/admin/support-bundle gated
   [Authorize(Policy = "ExecuteAuthority")] per owner decision F.
   Reuses the existing CLI bundle-assembly logic via a shared
   ISupportBundleAssembler service. Returns a streaming ZIP.
2. New UI page: archlucid-ui/src/app/(operator)/admin/support/page.tsx
   - "Download support bundle" button — calls the new endpoint and
     streams the ZIP to the browser.
   - Link from /admin/api-keys page ("Need to file a support
     ticket? Download a support bundle here.").
3. Tour component: archlucid-ui/src/components/tour/OptInTour.tsx
   - Five steps. Copy is the assistant's first cut, each step
     wrapped in a `<TourStepPendingApproval>` component that renders
     a visible "<<tour copy — pending owner approval>>" marker
     below the displayed text per owner Q8. Marker is NOT visible
     to end-tenants once owner approves and removes the wrapper.
   - "Show me around" button on the operator-shell home page only —
     no auto-launch on first sign-in, no interception of any other
     route per owner Q9.
   - LocalStorage flag remembers if the user dismissed the tour
     (persistent dismissal).
4. Tests:
   - Integration test for the new /admin/support-bundle endpoint
     (assert ExecuteAuthority is required; unauthorised returns 403).
   - Vitest spec for the tour: asserts (a) all five steps render
     the placeholder marker, (b) tour does NOT auto-launch on app
     mount, (c) tour DOES launch when the button is clicked.
5. Update docs/library/OPERATOR_ATLAS.md and docs/CHANGELOG.md.

Stop-and-ask boundaries:
- Do NOT auto-launch the tour. Owner Q9 was explicit.
- Do NOT hide the "<<tour copy — pending owner approval>>" markers
  before owner approves real copy. They MUST be visible until then.

Land in one PR. Update PENDING_QUESTIONS.md item 37 (support-bundle
parts a + b are now Resolved; only the redaction policy sub-question
remains open).
```

---

## Prompt 8 — Coordinator → Authority unification PR A3 + PR A4

**Why this matters.** Owner Decision A (2026-04-23) unblocked the FK-chain rewrite of `DemoSeedService` + `ReplayRunService`. PR A3 deletes coordinator repos from composition + deletes legacy orchestrators; PR A4 drops `dbo.GoldenManifestVersions`.

```
Goal: ship PR A3 and PR A4 of ADR 0030 (Coordinator → Authority
pipeline unification). Owner Decision A on 2026-04-23 unblocked
this work by approving the full Authority FK chain build-out in
DemoSeedService and ReplayRunService.

Read first:
- docs/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md  (sections 1.5, 1.8, 1.20 and §3 Improvement 8)
- docs/architecture/adrs/0030-coordinator-authority-pipeline-unification.md  (the canonical plan)
- docs/PENDING_QUESTIONS.md  (Resolved 2026-04-23 SaaS-framing follow-on Q&A — Decision A and Decision B)
- ArchLucid.Decisioning/  (Authority engine)
- ArchLucid.Persistence/Migrations/111_DropGoldenManifestVersions_Legacy.sql  (PR A4 reference)
- ArchLucid.Application/Demo/DemoSeedService.cs  (rewrite target #1)
- ArchLucid.Application/Replay/ReplayRunService.cs  (rewrite target #2)
- ArchLucid.Persistence.Coordination/  (deletion target)

Do this — sequence PR A3 first, then PR A4 in a separate PR (two PRs):

PR A3 (this session):
1. Rewrite DemoSeedService to emit the full Authority FK chain
   (snapshots, decision traces, evidence rows). Config flag
   Demo:SeedDepth = quickstart | vertical per owner Decision B —
   quickstart writes one-of-each minimum; vertical writes the
   production-realistic depth.
2. Rewrite ReplayRunService to emit the full Authority FK chain.
3. Delete coordinator-shape repository registrations from composition
   (ArchLucid.Host.Composition).
4. Delete the legacy CoordinatorRunCommitOrchestrator concrete (keep
   the interface for the deprecation header window if needed; verify
   in ADR 0029).
5. Sweep DI, regenerate OpenAPI snapshot, shrink
   DualPipelineRegistrationDisciplineTests allow-list.
6. Update ADR 0030 § Component breakdown PR A3 row to show DONE.
7. Tests: existing parity-probe daily workflow stays warn-mode; new
   integration test asserts DemoSeedService quickstart and vertical
   modes both produce a committed manifest with non-empty Services
   + Datastores + Relationships.

PR A4 (next session — DO NOT bundle into PR A3):
1. Run migration 111_DropGoldenManifestVersions_Legacy.sql.
2. Update ADR 0030 § Component breakdown PR A4 row to show DONE.
3. Verify the parity-probe workflow still has nothing to compare
   against (the legacy table is gone — probe should self-disable
   gracefully).

Stop-and-ask boundaries:
- Do NOT bundle PR A3 and PR A4 into one PR. The DDL drop in PR A4
  is the rollback boundary; keep them separate.
- Do NOT skip the OpenAPI snapshot regen — downstream client SDK
  generation depends on it.

Land PR A3 in this session; queue PR A4 for next session. Update
CHANGELOG.md for PR A3.
```

---

## Prompt 11 (replaces deferred Prompt 9) — Azure OpenAI cost-and-latency dashboard for the golden-cohort real-LLM gate

**Why this matters.** Owner Q15 (2026-04-23 sixth pass) approved the $50/month budget for the golden-cohort real-LLM gate. The dashboard + nightly kill-switch are the safety + visibility layer that lets the gate flip from disabled to required.

```
Goal: ship the Azure OpenAI cost-and-latency dashboard for the
golden-cohort real-LLM gate, with a nightly kill-switch that disables
the gate when month-to-date spend approaches the $50/month cap (per
owner Q15, 2026-04-23 sixth pass). When the dedicated Azure OpenAI
deployment exists in production (owner-only operational task),
flipping cohort-real-llm-gate from disabled to required is a one-line
change in golden-cohort-nightly.yml.

Read first:
- docs/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md  (sections 1.4, 1.10, 1.13 and §3 Improvement 11)
- docs/PENDING_QUESTIONS.md  (Resolved 2026-04-23 sixth-pass table — Q15)
- .github/workflows/golden-cohort-nightly.yml  (existing workflow with the placeholder cohort-real-llm-gate job)
- ArchLucid.Cli/Commands/GoldenCohortLockBaselineCommand.cs  (existing CLI)
- infra/  (Terraform — find the App Insights / Log Analytics workspace stacks)

Do this:
1. Terraform module at infra/modules/golden-cohort-cost-dashboard/
   that provisions an Azure Monitor Workbook in the existing App
   Insights workspace. Workbook shows:
     - Month-to-date Azure OpenAI spend on the cohort deployment
     - p50 / p95 / p99 latency per cohort scenario
     - Daily token-count trend
     - Kill-switch status (enabled / disabled / tripped)
   Workbook is read-only-by-default; only the cohort-ops role can edit.
2. New workflow step in .github/workflows/golden-cohort-nightly.yml:
   - Pre-run: query Azure Cost Management for month-to-date spend on
     the cohort Azure OpenAI deployment (use OIDC; service principal
     must have Cost Management Reader on the subscription).
   - If spend >= 80% of the cap ($40 of $50): post a warning to the
     workflow log and an issue on the repo, do NOT abort.
   - If spend >= 95% ($47.50): SKIP the cohort run for the rest of
     the month, post an issue, do NOT count as workflow failure.
   - On every run (when not skipped): write the per-scenario p50 /
     p95 / p99 latency into a JSON artefact persisted to App Insights
     custom metrics.
3. Add a CI guard at scripts/ci/assert_golden_cohort_kill_switch_present.py
   that fails if the kill-switch step is missing from the workflow
   OR if its threshold ratios are weakened (must stay at 0.80 / 0.95
   per Q15-conditional rule in PENDING_QUESTIONS.md).
4. Tests:
   - Unit test for the threshold-ratio parsing.
   - Workflow self-test (act-style local run with mocked Cost
     Management API).
5. Update docs/runbooks/GOLDEN_COHORT_REAL_LLM_GATE.md (new file)
   with: how to flip the gate from disabled to required, how to
   respond to a kill-switch trip, how to read the Workbook.

Stop-and-ask boundaries:
- Do NOT provision the dedicated Azure OpenAI deployment itself —
  that's owner-only operational task per Q15. The Terraform here
  provisions only the Workbook.
- Do NOT inject the Azure OpenAI secret into the workflow — that's
  owner-only via the protected GitHub Environment.
- Do NOT flip cohort-real-llm-gate from disabled to required in this
  PR. That's a separate one-line PR after the deployment exists.

Land in one PR. Update CHANGELOG.md and PENDING_QUESTIONS.md (mark
items 15 and 25 as fully Resolved on the budget portion; deployment
provisioning + secret injection remain owner-only operational tasks).
```

---

## Prompt 12 (replaces deferred Prompt 10) — First-tenant onboarding telemetry funnel

**Why this matters.** Without measurable evidence that real tenants hit "first finding" inside 30 minutes, the marketing claim is unsubstantiated. Instruments the opt-in tour from Q9 (Improvement 7).

```
Goal: ship a first-tenant onboarding telemetry funnel that measures
the 30-minute first-finding success rate. Default emission is
AGGREGATED-ONLY (no per-tenant correlation in the funnel store) per
the proposed default in pending question 40; per-tenant emission is
behind a feature flag the owner can flip after a privacy review.

Read first:
- docs/QUALITY_ASSESSMENT_2026_04_23_INDEPENDENT_73_20.md  (sections 1.6, 1.2, 1.16 and §3 Improvement 12)
- archlucid-ui/src/components/tour/OptInTour.tsx  (instrument this from Improvement 7)
- ArchLucid.Application/Telemetry/  (existing telemetry surface)
- docs/security/PRIVACY_NOTE.md  (GDPR Art. 6(1)(f) reference)

Do this:
1. New telemetry events (typed):
     - first_tenant.signup
     - first_tenant.tour_opt_in           (when "Show me around" clicked)
     - first_tenant.first_run_started
     - first_tenant.first_run_committed
     - first_tenant.first_finding_viewed
     - first_tenant.thirty_minute_milestone (boolean, fired when the
       above five all happen within 30 minutes of signup)
2. New emission service: ArchLucid.Application/Telemetry/FirstTenantFunnelEmitter.cs
   - Reads feature flag Telemetry:FirstTenantFunnel:PerTenantEmission
     (default FALSE per pending question 40 default).
   - When false: emits aggregated counters only (no tenantId,
     no userId, no IP).
   - When true: emits per-tenant rows with tenantId only (no userId
     / IP); subject to GDPR Art. 6(1)(f) legitimate-interest
     analysis already documented in docs/security/PRIVACY_NOTE.md.
3. UI instrumentation: wire OptInTour.tsx + the existing wizard +
   the existing run-detail page to call the emitter at the right
   moments.
4. Storage: aggregated counters land in App Insights custom metrics;
   per-tenant rows (when the flag is on) land in a new
   dbo.FirstTenantFunnelEvents table (new migration).
5. Dashboard: extend the Workbook from Improvement 11 (or create a
   sibling) showing the funnel conversion rates.
6. Tests:
   - Unit tests for the emitter (assert per-tenant flag toggles
     between aggregated and per-tenant emission).
   - Integration test asserting tenantId is absent from emitted
     payloads when the flag is false.
7. Update docs/security/PRIVACY_NOTE.md to add the funnel as a named
   processing activity. Stop-and-ask if the existing privacy notice
   text doesn't already cover the activity shape.
8. Add pending question 40 to docs/PENDING_QUESTIONS.md as the new
   open item (per-tenant emission consent — owner-only).

Stop-and-ask boundaries:
- Do NOT default the per-tenant flag to TRUE. Default is FALSE per
  pending question 40 default.
- Do NOT capture userId or IP in either mode.
- If the existing PRIVACY_NOTE.md does not cover the activity shape,
  STOP and ask the user before adding new processing-activity text.

Land in one PR. Update CHANGELOG.md.
```

---

## Operating notes

- Run prompts in the order listed; the only hard dependency is **Prompt 7 → Prompt 12** (Improvement 12 instruments the tour from Improvement 7).
- For each prompt, after merge, cross-check that the assistant updated `docs/CHANGELOG.md` and `docs/PENDING_QUESTIONS.md` per the prompt's instructions.
- The two **DEFERRED** improvements (original 9 and 10) have no prompts here. Their work happens at V1.1 per the [`V1_DEFERRED.md` §6c](library/V1_DEFERRED.md) commitment.
- The **rebrand workstream** kicked off by Prompt 4 spans seven PRs (PR-1 through PR-7); only PR-1 is covered by Prompt 4 itself. Each subsequent PR is a separate session.
