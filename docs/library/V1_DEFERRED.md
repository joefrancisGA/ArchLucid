> **Scope:** Contributor-reference — ArchLucid V1 — deferred and exploratory (doc inventory) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid V1 — deferred and exploratory (doc inventory)

**Audience:** product, pilots, and engineering leads who read scattered docs and need one **intentional** story: what is **shipped for V1** vs what is **explicitly not promised yet**.

**Relationship:** [V1_SCOPE.md](V1_SCOPE.md) defines the **V1 contract** (in scope, non-goals, happy path). **This file** lists areas that docs describe as **partial, follow-up, gap, or Phase-7-style cleanup** so nothing reads as an open-ended roadmap by accident.

**Rules:** No code changes implied here. Items are **documentation-sourced**; treat as **V1.1+ candidates or internal backlog** unless your program promotes them.

**Architect workspace (V1 vs V1.1):** V1 proxy/types work and the V1.1-only UI architecture backlog are summarized in [UI_ARCHITECTURE_V1_1.md](UI_ARCHITECTURE_V1_1.md). Progressive disclosure Batch 3 (run-detail IA refactor) is tracked as **TB-401** in the V1.1 backlog.

---

## 1. Product and learning (signals, planning drafts, follow-ups)

| Item | Doc source | Note |
|------|------------|------|
| **First-tenant funnel SQL — retention / purge for `dbo.FirstTenantFunnelEvents`** | [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) item **40** (ii) | **V1:** **no** automatic row deletion and **no** scheduled prune job for this table. **V1.1:** owner picks retention window + purge or aggregate semantics (supersedes prior “90-day” draft wording for V1). |
| **Cross-tenant analytics** | `docs/archive/CHANGE_SET_58R.md` | Aggregation stays **within** tenant/workspace/project unless a future change explicitly adds cross-tenant analytics. |

**V1 (59R) — planning drafts:** Deterministic theme derivation and bounded plan materialization from ranked opportunities ship as **`POST /v1/learning/planning/materialize`** ([CHANGELOG.md](../CHANGELOG.md) §59R, [V1_SCOPE.md](V1_SCOPE.md) §2.8). Prior “deferred brains” wording for that slice is **superseded** as of **2026-05-10**.

---

## 2. Compliance narrative: durable audit vs other stores

The [AUDIT_COVERAGE_MATRIX.md](AUDIT_COVERAGE_MATRIX.md) **Known gaps** section currently tracks **zero** open durable-audit omissions for the previously listed mutating areas (analysis reports, export/comparison paths, conversations read-only note, governance via **`GovernanceWorkflowService`**). **2026-04-23:** demo trusted-baseline **`PersistCommittedChainAsync`** and replay commit paths also emit durable **`AuthorityCommittedChainPersisted`** (see matrix durable table). New routes should extend the matrix when **`AuditEventTypes`** grows.

| Area | Doc source |
|------|------------|
| Authority + coordinator + governance + exports + analysis + advisory + alerts + … | [AUDIT_COVERAGE_MATRIX.md](AUDIT_COVERAGE_MATRIX.md) — durable audit table + **Known gaps** notes |

**V1 stance:** Governance workflow **does** dual-write to durable audit (see matrix). Baseline mutation logging remains log-only for some orchestration paths; operators rely on **`IAuditService`** rows in **Audit** UI for the durable channel.

---

## 3. Rename and platform cleanup (Phase 7) — **closed (greenfield)**

**Owner decision (2026-07-22):** ArchLucid has **not shipped**; there are **no brownfield** Terraform states or customer deployments carrying historical **`archiforge`** resource addresses. Application rename (**ArchLucid** config keys, CLI, SQL DDL filename) closed **2026-04-19**; committed **`infra/**/*.tf`** uses **`archlucid`** labels only.

| Item | Status |
|------|--------|
| Legacy **ArchiForge** config / **`ARCHIFORGE_*`** env (application) | **Removed** — startup warns if legacy keys appear ([`BREAKING_CHANGES.md`](../../BREAKING_CHANGES.md) §2026-04-08) |
| Terraform **`archiforge`** resource addresses / **`state mv`** | **Not applicable** — greenfield applies only; use [`FIRST_AZURE_DEPLOYMENT.md`](FIRST_AZURE_DEPLOYMENT.md) |
| GitHub repo / Entra rename (Phase 7.6–7.7) | **Closed 2026-04-19** ([`CHANGELOG.md`](../CHANGELOG.md)) |

**Operator check:** `rg "archiforge" infra --glob "*.tf"` must return **zero** matches before merging Terraform changes.

---

## 4. Operator experience and CI honesty

| Item | Doc source |
|------|------------|
| **Periodic manual accessibility review** — scheduled screen-reader / assistive-technology validation beyond merge-blocking **`@axe-core/playwright`** baselines | Assessment boundary: participant AT studies are not a V1 **`(A)`** gate per **Assessment-Scope-V1_1**; **V2** candidate for an explicit review cadence. |
| **Baseline wizard — deferred enrichments (beyond ZIP-first V1)** | **[V1_SCOPE.md](V1_SCOPE.md)** baseline wizard / Azure extractor posture: V1 ships **extractor ZIP first**, then **system name + environment + cloud provider (Azure default)**; optional existing wizard steps stay non-blocking. **V1.1 candidates:** **AWS/GCP** as selectable target providers ([MULTI_CLOUD_ANALYSIS_V1_1.md](MULTI_CLOUD_ANALYSIS_V1_1.md), **§6n**); wizard steps that **gate** or strongly nudge governance tags, compliance constraints, and risk classification when org policy requires it; guided **datastore/service** review when extractor coverage is known incomplete. **V2 candidates:** **portfolio** onboarding (multi-system / program-level baseline in one flow); deep **framework-mapping** steps tied to industry SKUs. |
| **Playwright** operator smoke may use **mocked** `/api/proxy`; it does not replace **SQL-backed** API + UI validation for a given release | [RELEASE_SMOKE.md](RELEASE_SMOKE.md), [V1_SCOPE.md](V1_SCOPE.md) §3 |
| **Audit search** keyset cursor uses **`OccurredUtc` with optional `EventId` tie-break** (`GET /v1/audit/search?beforeUtc=…&beforeEventId=…`); clients must pass both when continuing past same-second events | [AuditController.cs](../../ArchLucid.Api/Controllers/Admin/AuditController.cs), operator audit UI “Load more” |
| **CI — merged line ≥ 95% + coverage ratchet** | **Interim (RC28, 2026-08):** **`.github/workflows/ci.yml`** (`dotnet-coverage-merge`) enforces **merged line ≥ 77%** (branch **62%**, per-product-package line **89%**; **`ArchLucid.Api`** package gate skipped until Integration HTTP tests collect Coverlet, plus RC interim package skips). The job is **warn-only** (`continue-on-error`). **`assert_coverage_floor_ratchet.py`** + **`.coverage-floor`** are **enabled**. **V1.1 target:** ratchet toward **95%** merged line. Keep **`docs/engineering/BUILD.md`**, **`docs/library/coverage-exclusions.md`**, and **`docs/COVERAGE_GAP_ANALYSIS.md`** aligned with **`ci.yml`**. |
| **Next.js major upgrade (`15.5.x` → `16.x`)** — isolated dependency/CI PR for `archlucid-ui` (`next`, `eslint-config-next`, codemods, full lint/Vitest/Playwright/standalone build) | **Done (2026-07-05, TB-641).** Landed **`next@^16.2.10`** + **`eslint-config-next@^16.2.10`**; Turbopack-default production build; ESLint flat config; Windows webpack-build-worker workaround removed. See [`UI_ARCHITECTURE_V1_1.md`](UI_ARCHITECTURE_V1_1.md) **§8** and `TECH_BACKLOG.md` **TB-641**. |
| **Buyer-facing route aliases — remove "manifest" from browser URLs** — permanent redirects from `/manifests/*` and `/reviews/{id}/manifest` to product-language paths; API/persistence unchanged | **Done.** `TECH_BACKLOG.md` TB-399 was already marked Done 2026-06-27 (this row was stale); a 2026-07-05 backlog review found and closed a residual gap — one hardcoded internal `/manifests/{id}` link builder and two stale live-API E2E selectors. See [`UI_ARCHITECTURE_V1_1.md`](UI_ARCHITECTURE_V1_1.md) **§9** and `TECH_BACKLOG.md` TB-399. |

---

## 5. Infrastructure and organizational polish

Docs describe **templates and gaps** that depend on **customer subscription and process**, not missing product code.

| Item | Doc source |
|------|------------|
| **ACR** / production image store, extending CI to **push** images | **Done — engineering side.** `.github/workflows/cd.yml` already builds/pushes both API and UI images to ACR and deploys to Container Apps (digest verification, canary support), fully gated on `ACR_LOGIN_SERVER`/`ACR_NAME`/`AZURE_RESOURCE_GROUP` GitHub secrets (owner-verified 2026-07-05: already configured). Remaining posture is purely operational (secrets/subscription), not missing code. [CONTAINERIZATION.md](../engineering/CONTAINERIZATION.md) |
| Subscription placement, naming, which Terraform roots to enable | Same doc — **organizational** follow-ups |

---

## 6. First-party ITSM, Confluence, Slack, Teams, webhooks, and recipes — **Jira/ServiceNow/Confluence/Slack/Teams promoted to V1 GA (owner scope 2026-07-03)**; webhooks/recipes remain **V1.1**

**Promotion (2026-07-03):** **Jira**, **ServiceNow**, **Confluence**, **Slack**, and **Microsoft Teams** first-party connectors are **promoted from V1.1 to V1 GA** — **owner scope update 2026-07-03**, superseding the *Resolved 2026-05-18* V1.1-window pinning below. Rationale: [`CONNECTOR_READINESS_MATRIX.md`](CONNECTOR_READINESS_MATRIX.md) already shows all five as **Shipped** or **Shipped + manual vendor** — real product code, automated CI conformance tests, and (for Jira/ServiceNow/Confluence/Slack) manual live-vendor smoke runbooks exist today. Treating shipped-and-tested connectors as a "not V1" program window created a scope/docs gap identical in kind to the AWS/GCP and RAG-V2 gaps found the same day in this repo's assessment cycle — the engineering was done; only the contract label was stale. See **TB-599–TB-602** in [`TECH_BACKLOG.md`](TECH_BACKLOG.md) for the tightening work this promotion requires (OAuth upgrade, native-create default posture, live-validation parity, and buyer-copy sweep).

**Still V1.1 (not promoted — not named in the 2026-07-03 decision):** **CloudEvents** outbound **HTTPS webhooks** and **customer-operated** bridges under **[`docs/integrations/recipes/README.md`](../integrations/recipes/README.md)** remain **in scope for V1.1** as **buyer-contract** integration paths per **V1_SCOPE.md** **§2.8** and **§3** — **not** V1 GA commitments (implementation may ship earlier). **`(A)` headline assessments** treat absence of these two program surfaces as **non-deduction** for V1 GA. **`V1` integration posture for scoring now includes** **Jira**, **ServiceNow**, **Confluence**, **Slack**, and **Microsoft Teams** first-party connectors, alongside **REST**, **CLI**, **architect workspace**, **SCIM**, **Azure DevOps** / **GitHub** CI surfaces, and **§2.16+** HTTP paths per **V1_SCOPE.md**.

**V1.1 customer-owned bridges (optional, unchanged):** Power Automate and Logic Apps walkthroughs under **[`docs/integrations/recipes/README.md`](../integrations/recipes/README.md)** — align with the **V1.1** buyer contract. Summary hub: [ITSM_BRIDGE_V1_RECIPES.md](ITSM_BRIDGE_V1_RECIPES.md).

**Rules:**

- **First-party implementation priority (historical, now shipped):** **ServiceNow** → **Atlassian pair** — **Confluence** **before** **Jira**, engineered **together** in one workstream / release tranche (*Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)* in [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)) — recorded here for history; all five connectors have shipped.
- New ITSM/documentation connectors **must not** widen without their own owner decision — **Azure DevOps Work Items** stays `[Planned]` until separately promoted. **TB-398** (full enterprise connector: OAuth flows, field-mapping UI, custom workflow mapping, bidirectional status sync, tenant onboarding wizard) stays **V2** — this promotion covers the **first-party MVP** shape only, not the enterprise-tier stretch goal.
- Each connector **must** consume the same Authority-shaped event payloads the existing webhooks ship; no parallel finding-projection schema per target.

---

## 6a. Chat-ops — Microsoft Teams and Slack — **promoted to V1 GA (owner scope 2026-07-03)**

**Microsoft Teams** incoming-webhook delivery and **Slack** first-party **outbound** chat-ops (**`EnabledTriggersJson`** / trigger catalog parity, **Key Vault** secret-name references, Authority-shaped payloads) are **promoted from V1.1 to V1 GA** per [`V1_SCOPE.md`](V1_SCOPE.md) **§2.14** — **owner scope update 2026-07-03**, superseding the *Resolved 2026-05-18* V1.1-window posture. Both ship as **"Shipped + manual vendor"** per [`CONNECTOR_READINESS_MATRIX.md`](CONNECTOR_READINESS_MATRIX.md).

**V1.1+ / follow-on candidate (not separately promoted without owner row):** **In-Slack interactive** approvals / acknowledgements (**approve / ack** buttons on Slack messages surfaced by ArchLucid). This narrower interactive-actions slice is **not** part of the 2026-07-03 promotion.

**Still open / unpinned without separate promotion (no calendar dates implied):** Slack **App Directory** listing and OAuth installation UX marketed as **first-class** product onboarding.

**Rules:**

- Additional chat-ops surfaces (e.g. Discord, Mattermost) **must not** be added without their own owner decision row.
- Slack (and any other committed chat surface) must consume the same Authority-shaped event payloads the existing webhooks and the Microsoft Teams connector ship; no parallel notification schema per chat surface.

---

## 6b. Commercial — V1.1 candidates (Resolved 2026-04-23)

These commercial milestones are **explicitly release-window-pinned to V1.1** so V1 readiness is no longer measured against them. They were previously open obligations that quality assessments were treating as live V1 gaps; the 2026-04-23 owner decision in [PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md) **Resolved 2026-04-23 (Reference-customer publication scope)** moves them into a named release window so external messaging — and internal scoring — stops reading them as V1 deficits.

| Commercial milestone | V1 posture | V1.1 commitment |
|----------------------|------------|------------------|
| **First named, public reference customer** — at least one row in [`docs/go-to-market/reference-customers/README.md`](../go-to-market/reference-customers/README.md) at `Status: Published`, with a published case study, customer-permissioned logo on the marketing site, and (where the customer agrees) measured ROI delta. Triggers re-rate of the **−15% reference discount** in [`PRICING_PHILOSOPHY.md` § 5.3](../go-to-market/PRICING_PHILOSOPHY.md). | **Out of V1.** No public reference customer is required for V1 GA. The reference-customer table stays alive (rows in `Placeholder` / `Customer review`) and the CI guard [`scripts/ci/check_reference_customer_status.py`](../../scripts/ci/check_reference_customer_status.py) **stays in `continue-on-error: true` warn-mode** for the entire V1 window — it does **not** flip to merge-blocking by V1 GA. V1 quality assessments **do not** charge points against Marketability, Proof-of-ROI Readiness, Differentiability, Trustworthiness, or Procurement Readiness for the absence of a `Published` row. | **GTM backlog only** — [`GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) **M-32** (historical id **TB-164**; capture template Done via `NAMED_REFERENCE_CUSTOMER_CAPTURE.md`; not an open engineering item). The minimum V1.1 commitment is: at least **one** row at `Status: Published` with a customer-approved case study and a customer-permissioned logo. The `−15%` reference discount becomes a candidate for re-rate at V1.1 per `PRICING_PHILOSOPHY.md` § 5.3. Calendar date is **not** pinned by this decision; pinning a date requires a follow-up owner entry. |
| **Signed design partner engagement** — first design-partner agreement (or equivalent early-adopter commercial terms) under [`PRICING_PHILOSOPHY.md`](../go-to-market/PRICING_PHILOSOPHY.md) / [`ORDER_FORM_TEMPLATE.md`](../go-to-market/ORDER_FORM_TEMPLATE.md), when the buyer accepts design-partner discount and case-study / reference-call deliverables | **Out of V1.** No signed or active design partner is required for V1 GA. V1 supports **sales-led pilots**, internal evaluation, and PLG-style trials without a formal design-partner contract. V1 quality assessments **do not** charge **`(A)`** points for Marketability, Proof-of-ROI, Stickiness, Differentiability, trust pillars, or pilot readiness solely because a design partner is not yet closed. **Do not** use “no design partner yet” as a recurring headline defect, improvement prerequisite, or default “open questions” batch unless the user **explicitly** asked for a GTM pipeline review — then treat as **`(B)` market-motion realism** only (zero weight on **`(A)`**). | **In scope for V1.1** as a commercial motion complementary to the published reference-customer row ([`reference-customers/README.md`](../go-to-market/reference-customers/README.md)). Calendar date is **not** pinned here; pinning requires [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md). |
| **Commerce un-hold (Stripe live keys flipped + Marketplace listing published)** — the external go-live of the self-serve transactability rails: (a) Stripe **live** API keys configured and the production webhook secret rotated (replacing TEST-mode keys for the production environment), (b) the Azure Marketplace SaaS offer transitioned to `Published` in Partner Center, with seller verification, payout account, and tax profile complete, (c) DNS cutover for `signup.archlucid.net` to the production Front Door custom domain. Until this milestone lands, the V1 commercial motion is **sales-led** — `/pricing` displays numbers, `ORDER_FORM_TEMPLATE.md` drives quote-to-cash, and the trial funnel runs in **Stripe TEST mode on staging** as a sales-engineer-led product evaluation (see Improvement 2 in [`QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md`](../assessments/LATEST_GPT55.md) §3). | **Out of V1.** No live commerce un-hold is required for V1 GA. All wiring stays in place — `BillingStripeWebhookController`, `BillingMarketplaceWebhookController`, `BillingCheckoutController`, `BillingProductionSafetyRules`, `[RequiresCommercialTenantTier]` filter returning **402 Payment Required**, the Marketplace-alignment doc, the `/pricing` page, and the trial signup TEST-mode plumbing are V1-ready and V1-supported. **What is deferred is the act of flipping the live keys and publishing the Marketplace listing**, not the underlying engineering. V1 quality assessments **do not** charge points against Adoption Friction, Decision Velocity, or Commercial Packaging Readiness for the absence of live keys / a published listing. The trial funnel TEST-mode end-to-end work (Improvement 2) stays a live V1 obligation — only the "flip TEST → live" final gate is V1.1-deferred. | **In scope for V1.1.** Minimum V1.1 commitment: (a) Stripe live keys configured with production webhook secret rotated, (b) Marketplace SaaS offer at `Published` with seller verification + payout + tax profile complete, (c) DNS cutover for `signup.archlucid.net`, (d) the `BillingProductionSafetyRules` startup gate passes against the live configuration. Calendar date is **not** pinned by this decision. The Stripe-live-keys flip and the Marketplace `Published` state are both **owner-only** (Partner Center seller verification, tax profile, and payout account cannot be filed by the assistant). |
| **Real pilot proof packet cohort** — selected scenarios/environments producing a repeated set of buyer-safe proof packets with approved data boundaries and proof-gated rollout criteria. | **Out of V1.** V1 still owns reusable proof mechanics, source labels, release rollups, skip semantics, and first-screen proof status. V1 assessments **do not** charge points for absence of the cohort itself. | **GTM backlog only** — [`GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) **G-REAL-06** / **G-REAL-07** (historical id **TB-141**; not an open engineering item). **Scenarios resolved 2026-05-30:** AI / LLM workload governance; regulated SaaS procurement / SOC-style diligence; Azure cost / orphan / governance review. Minimum commitment when picked up: define environment boundaries, run the cohort, archive buyer-safe packets, and update claims only where supported by the cohort. **Data policy resolved 2026-05-30:** customer data, sanitized internal data, and demo-only data are all allowed input classes when authorization, redaction, source labeling, and buyer-safe caveats are satisfied. **Broader-claims threshold:** use [`GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) § *Proof-gated rollout criteria* as the source of truth. |
| **Market-facing demo asset production** — approved screenshots, video, sales copy, and channel-specific demo materials. | **Out of V1.** V1 still owns claim-language lint, starter proof packs, operator value paths, and proof artifact correctness. V1 assessments **do not** charge points for absence of final market-facing demo assets. | **GTM backlog only** — [`GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) **M-07** / **M-16** / **M-24–M-27** (historical id **TB-142**; not an open engineering item). **Channel resolved 2026-05-30:** optimize Upwork first; website, sales email, LinkedIn, and live demo can reuse/adapt later. Minimum commitment when picked up: select Upwork audience/format, produce assets, and run promise-language checks before publication. **Evidence policy resolved 2026-05-30:** real-mode output may be shown in public assets when authorized, redacted, source-labeled, and caveated; synthetic/demo-labeled assets remain allowed when real output is not approved or would imply unsupported proof. |

**Owner override (2026-07-12) — self-serve Stripe checkout split out of the commerce-un-hold gate:** The owner directed that **self-serve paid subscription checkout** (a tenant Admin buying/upgrading a plan) no longer waits on the full "Commerce un-hold" milestone above. This item is **split in two**:

- **In scope for V1, P0 (owner override):** in-app, tenant-bound Stripe Checkout Session creation (Stripe-hosted Checkout, not a marketing-site or custom card-collection flow), the Stripe Billing Portal for self-service payment-method updates/cancellation, and subscription-lifecycle webhook handling (renewal, dunning, cancellation) syncing tenant commercial tier. Tracked as **TB-763**–**TB-766** in [`TECH_BACKLOG.md`](TECH_BACKLOG.md). Rationale: the owner cannot ship a product with ongoing Azure cost without a way to charge for it; the backend spine (`BillingCheckoutController`, `BillingProductionSafetyRules`, `[RequiresCommercialTenantTier]`) already exists and is V1-ready, so wiring self-serve checkout to it is closing a UI gap, not building new infrastructure.
- **Dropped from V1 scope entirely, deferred to V2 pending demonstrated buyer demand:** the **Azure Marketplace** SaaS offer (seller verification, payout account, tax profile, `Published` listing in Partner Center). Owner rationale (2026-07-12): ArchLucid is not reasonably interpreted by buyers as an Azure-deployed-through product even though it happens to run on Azure infrastructure; Marketplace's real value (MACC/EA committed-spend billing, procurement-friendly invoicing for enterprises that can't use a credit card) has **no validated demand today**, and the owner does not currently have the Microsoft Partner Center information needed to list. The `BillingMarketplaceWebhookController` and existing Marketplace-alignment groundwork are **not removed** — they stay in place so the channel can be re-opened without rework if a buyer specifically requires it.
- **Still deferred as originally scoped:** the Stripe **live-key flip** itself (owner-only; readiness verified via **TB-766**) and the **`signup.archlucid.net` trial-signup DNS cutover** (**TB-221**, unaffected by this override — trial signup is a distinct concern from paid checkout).
- This override does **not** change the underlying safety posture: `BillingProductionSafetyRules` remains the required startup gate before any live-key deploy.

**Rules:**

- The CI guard's behavior does **not** change in V1 — staying in warn-mode is the V1 contract. Flipping it to merge-blocking is a V1.1 task, not a V1 hardening task.
- The trial funnel TEST-mode end-to-end work (Improvement 2 in the open assessment) is **not** deferred — it is a V1 obligation and stays in §3 as actionable. The **owner-only flip to Stripe live keys** remains owner-gated (readiness via **TB-766**). The **Marketplace `Published` state** is **deferred to V2** (owner 2026-07-12), not a V1.1 obligation.
- The `BillingProductionSafetyRules` startup guard (fails `ASPNETCORE_ENVIRONMENT=Production` when Stripe live key prefix `sk_live_` is configured without a webhook secret, or when Marketplace landing page URL is empty/localhost) stays **shipped in V1**. Its purpose is to make a future live-key / Marketplace re-open safe; do not remove it.
- Quality assessments produced **before** these decisions (e.g. [`QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md`](../assessments/LATEST_GPT55.md) before its 2026-04-23 re-score addenda) charged points against V1 for these gaps. Future assessments **must not** — see that file's §0.2 (reference-customer) and §0.3 (commerce-un-hold) re-score addenda for the score adjustments applied on 2026-04-23.
- **Design partner (Resolved 2026-05-03):** the same rule applies — future assessments **must not** treat absence of a signed design partner as an **`(A)`** defect or premise repeated “you lack a design partner” narrative; see [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) *Resolved 2026-05-03*.
- These decisions do **not** retract or downgrade other commercial / security milestones — **third-party** pen-test program is **V1.1 backlog** (**TB-136**, owner 2026-05-29); PGP key generation, board-pack PDF endpoint, etc. stay as documented unless a separate owner decision defers them.
- A new commercial milestone **must not** be added to this table without its own owner decision recorded in [PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md).
- **Commerce un-hold demand gate (planning 2026-05-17; Marketplace split 2026-07-12):** The **Stripe live-key flip** remains owner-gated; **timing** should reflect **validated buyer motion** (e.g. repeated paid review or pilot pattern) in addition to finance readiness — see **`docs/go-to-market/GTM_BACKLOG.md`** service-led baseline. In-app checkout wiring is **V1** (**TB-763–TB-766**). **Marketplace `Published`** is **V2**, not part of the Stripe un-hold. This does **not** remove the **`BillingProductionSafetyRules`** guard or TEST-mode trial obligations in **`V1`**.

---

## 6c. Security and assurance — SOC 2 CPA and third-party pen test on V1.1 backlog (owner 2026-05-01; V1.1 backlog promotion 2026-05-29)

**Owner decision (2026-05-29):** Assessment improvements **#23** (SOC 2 CPA) and **#25** (third-party pen test) were **V1.1 backlog** items tracked as **TB-135** and **TB-136** in [`TECH_BACKLOG.md`](TECH_BACKLOG.md). **Tech TB tracking closed 2026-07-19** (Done) — does **not** mean a CPA report or third-party pen-test publication exists. Owner-execution work remains open in [`GTM_BACKLOG.md`](../go-to-market/GTM_BACKLOG.md) as **G-REAL-05** / **G-ASSURANCE-02**.

**SOC 2 CPA attestation:** A **CPA-issued SOC 2 Type I or Type II examination report** is **not** a **V1** or **V1.1 headline readiness milestone** for weighted product assessments. **What is in V1:** honest trust-center rows, CAIQ/SIG/DPA/process templates, internally maintained SOC 2 **self-assessment** and roadmap (`docs/security/SOC2_SELF_ASSESSMENT_2026.md`, `docs/go-to-market/ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap`, [`trust-center.md`](../go-to-market/trust-center.md)). **Independent quality assessments must not** deduct **`(A)` V1.1 headline readiness** (see `.cursor/rules/Assessment-Scope-V1_1.mdc`) solely because CPA SOC 2 is not issued. **Still include SOC narrative** — under an explicit **procurement-realism / informational** section with **zero weight** on **`(A)`** — citing self-assessment, roadmap timing, and buyer friction honestly.

**V1 pen testing** is **owner-conducted** (tracked under [`2026-Q2-OWNER-CONDUCTED.md`](../security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md) and related self-assessment docs; engineering assist **TB-005**). There is **no** committed third-party assessor for V1. **Independent quality assessments must not** treat the absence of an **external** third-party pen test or redacted assessor summary as a V1 deficit.

**Third-party** pen-test execution, vendor SoW award, assessor deliverables, and optional Trust Center row refresh for that engagement were tracked as **V1.1 backlog (TB-136)** — **Done** (owner closed tracking 2026-07-19). Templates remain in [`2026-Q2-SOW.md`](../security/pen-test-summaries/2026-Q2-SOW.md) and [`2026-Q2-REDACTED-SUMMARY.md`](../security/pen-test-summaries/2026-Q2-REDACTED-SUMMARY.md) if a future engagement is funded. Prior **V2** framing for external pen test is **superseded** by this decision where it conflicts.

| Assurance milestone | V1 posture | Release-window commitment |
|---------------------|------------|---------------------------|
| **SOC 2 Type I / II report (CPA-issued SOC examination)** — attestation tied to an independent CPA firm opinion; distinct from owner self-assessment. | **Out of V1** and **out of V1.1 as a headline scoring gate.** V1 posture is internally maintained **self-attested** SOC mapping + roadmap honesty + procurement templates (**do not imply** SOC 2 Type II is issued). **`(A)` assessments must not** treat absent CPA SOC 2 as a V1/V1.1 defect. Use **`(B)` procurement-realism`** (zero weight on **`(A)`**) when discussing enterprise RFP friction. | **TB-135 Done** (2026-07-19) — tech tracking closed; owner work open as **G-REAL-05**; no CPA report implied. Narrative timing still in [`ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap`](../go-to-market/ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap) and [`trust-center.md`](../go-to-market/trust-center.md). |
| **Third-party pen-test execution + redacted summary publication** — funded vendor engagement, SoW, assessor draft + final report, optional customer-shareable redacted summary and Trust Center metadata row. | **Out of V1** for **external** / third-party scope. V1 relies on **owner-conducted** testing + in-repo templates; see [`V1_SCOPE.md`](V1_SCOPE.md) §3. **Quality assessments:** do **not** penalize V1 readiness for lacking a third-party pen test. | **TB-136 Done** (2026-07-19) — tech tracking closed; owner work open as **G-ASSURANCE-02**; no third-party publication implied. |
| **PGP key drop for `security@archlucid.net` (coordinated-disclosure key)** — owner generates the keypair (or designates a custodian), drops the public key block at `archlucid-ui/public/.well-known/pgp-key.txt`, references it from [`SECURITY.md`](contributor-reference/SECURITY.md), and updates the marketing `/security` page in the **same single PR** (per owner Q14, 2026-04-23, sixth pass). | **Done (verified 2026-07-05; this row was stale).** `archlucid-ui/public/.well-known/pgp-key.txt` is committed (well-formed armored public key block); `SECURITY.md` §"PGP / encrypted email" documents the key ID (`A97CAFF5332CB516`) and full fingerprint (`982C C022 D91D 3C09 FE9B F4E0 A97C AFF5 332C B516`); custodian record in [`docs/security/PGP_KEY_GENERATION_RECIPE.md`](../security/PGP_KEY_GENERATION_RECIPE.md) shows first publish 2026-05-18, UID `ArchLucid Security <security@archlucid.net>` (domain confirmed acquired). No further action needed. | **Closed — was V1.1, superseded by shipped V1 posture above.** |

**Rules:**

- These are **release-window** promises, not dates. Pinning calendar dates requires a follow-up owner entry recorded in [PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md).
- **`(A)` / `(B)` scoring labels:** See `.cursor/rules/Assessment-Scope-V1_1.mdc` — **`(A)` V1.1 headline readiness must not drop** solely for absent **CPA SOC 2** or **ISO 27001 certification**; those belong in **`(B)` procurement realism** unless the user asks for an explicit blended score.
- V1 assessments **must not** penalize the solution for absent **third-party** pen-test publication; **TB-136** tracking is **Done** (closed 2026-07-19), so score its shipped owner-conducted-testing posture, not an unbuilt external engagement. The **PGP** row remains closed as shipped above. Pre-2026-05-01 docs that referenced a named third-party vendor for Q2 2026 are **superseded** by this owner decision where they conflict.
- These decisions do **not** retract or downgrade other V1 security obligations — owner-conducted testing and self-assessment, `BillingProductionSafetyRules`, RLS object-name discipline, OWASP ZAP baseline, Gitleaks, STRIDE-style threat modeling, audit-event coverage matrix, all remain V1 obligations.
- A new security or assurance milestone **must not** be added to this table without its own owner decision recorded in [PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md).

---

## 6d. Agent ecosystem / MCP — V1.1 candidates (scope documentation 2026-04-24)

This section **promotes MCP from backlog-only text to the named V1.1 release window**, aligned with [V1_SCOPE.md §3](V1_SCOPE.md) and the engineering intent in [`MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md`](MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md). **Tool count, transport, and allowlist are pinned** in that backlog **§5.1** (owner **2026-05-15**). This section does **not** pin calendar dates; pinning dates still requires an owner entry in [PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md).

| MCP milestone | V1 posture | V1.1 commitment |
|-----------------|------------|-----------------|
| **Inbound MCP server (membrane)** — **§5.1 pinned:** **Streamable HTTP** (production, private endpoint) with **seven** **read-only** tools (`GetRunStatus`, `GetManifestSummary`, `CompareRuns`, `GetProvenanceGraph`, `GetGovernanceStatus`, `ListArtifacts`, `GetAuditSlice`); optional **`stdio`** for local/self-hosted non-SLA harnesses only. Thin wrappers over **`ArchLucid.Application`**; **SQL Server + RLS** authoritative; **typed audit** per tool; **token / session caps** and **circuit breakers** per existing LLM accounting. | **Out of V1.** No MCP transport in the V1 shipping boundary; pilots and integrators use **REST**, **CLI**, and the **architect workspace**. | **In scope for V1.1** at the **§5.1** freeze ([`MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md`](MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md)). **Hard rule:** the authoritative solution **never** takes a compile-time dependency on MCP — the membrane is removable without changing business logic. |
| **Outbound MCP client (ArchLucid calls external tool servers)** | **Out of V1.** | **Out of V1.1** unless separately promoted — backlog default is **V2** with an explicit allowlist and approval-class mapping (see same backlog §5). |

**Rules:**

- Quality assessments **must not** treat absence of MCP as a V1 deficit after this alignment; MCP is a **V1.1** integration surface, not a pilot gate for V1 GA.
- Security posture for MCP matches **private API** assumptions in the backlog (no new public ports that violate the existing **private endpoint / WAF** story; no god-mode SQL principal).
- NuGet **MCP SDK** versioning remains **verify-at-implementation-time** per the backlog's uncertainty statement — pin only when the V1.1 engineering slice starts.

---

## 6e. Platform scale-out — distributed cache reinforcement (V2 enhancement) (engineering note 2026-05-06)

**V1 stance:** The host already supports optional **Redis** (`IDistributedCache` via StackExchange.Redis) for **hot-path read-through** (`IHotPathReadCache` → `DistributedHotPathReadCache`) when **`HotPathCache:Enabled=true`** and the effective provider resolves to **Redis** (`ArchLucid.Host.Composition/Configuration/ArchLucidStorageServiceCollectionExtensions.cs`). **`HotPathCache:Provider=Auto`** selects Redis when **`ExpectedApiReplicaCount` > 1** and **`RedisConnectionString`** is set. **LLM completion response reuse** can use **`LlmCompletionCache:Provider=Distributed`** with **`DistributedLlmCompletionResponseStore`**. **Knowledge graph** snapshot projections use **`GraphSnapshotProjectionMemoryCache` only** — there is no distributed implementation of **`IGraphSnapshotProjectionCache`** today.

**V2 enhancement (not a V1 pilot gate):**

| Platform item | V1 posture | V2 commitment (when promoted) |
|----------------|----------|------------------------------|
| **Redis as the default production substrate for scaled API fleets** | **Optional in V1.** Single-replica pilots and early production may use **Memory** providers; V1 GA does **not** require provisioning Azure Cache for Redis. | **Elevate** Redis (e.g. Azure Cache for Redis with **private** connectivity, Terraform parity, capacity and runbook guidance) as the **expected** baseline when horizontal scale (`max_replicas` > 1) and **cross-replica** cache coherence are required. |
| **Distributed graph snapshot projection cache** | **Out of V1.** Only in-process projection cache exists. | **Candidate:** an **`IGraphSnapshotProjectionCache`** implementation over **`IDistributedCache`** (or equivalent) with TTL and invalidation aligned to run/snapshot lifecycle; serialization size and eviction review. |
| **Operational hardening** | Relies on host configuration and existing validation rules (e.g. **`HotPathCacheRules`**, **`LlmCompletionCacheRules`**). | **Candidate:** Redis-oriented health probes, dashboards, and failover playbooks as fleet scale grows. |

**Rules:**

- Quality assessments **must not** treat absence of a provisioned Redis cluster as a **V1** defect when **single-replica** or **memory-only** configuration is documented and supported.
- Promoting any row above to a **dated** release promise requires [PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md).

---

## 6f. Azure Container Apps Jobs + Durable Task Framework (V2 backlog, situational) (engineering note 2026-05-07)

**V1 stance:** The **`ArchLucid.Worker`** host and **`AuthorityRunOrchestrator`** authority pipeline handle long-running analysis with retry, queuing, and state transitions. V1 does **not** adopt **Azure Container Apps Jobs** or embed the **Durable Task Framework (DTF)** as an orchestration engine.

**What it is:**

- **Container Apps Jobs** — event-driven or scheduled **one-shot** containers (no always-on replica required for bursty work).
- **Durable Task Framework** — the same orchestration model as **Azure Durable Functions**, usable **as a library** without the Functions host: checkpointed replay, retries, fan-out/fan-in, and human-in-the-loop patterns.

**Why it could matter later:** If orchestrations grow well beyond today’s complexity (multi-step agent pipelines, approval workflows with timeouts, compensation flows), DTF offers **checkpoint-based replay** and structured orchestration instead of hand-rolled state machines. Container Apps Jobs could run **one-shot heavy compute** (e.g. Terraform export batches, large context ingestion spikes) without keeping a permanent Worker replica sized for peaks.

**Trade-off:** High adoption cost — switching orchestration substrate touches reliability contracts, testing, and operations. The **current orchestrator pattern is intentional and well-tested**; this is **only** worth revisiting if pipeline complexity materially exceeds what exists today.

**Verdict:** **Backlog / V2 candidate**, situational — **not** required for current pipeline complexity.

### DTF adoption decision gate (TB-921)

Before scheduling **TB-924** (DTF cutover) or treating a new orchestration/outbox proposal as DTF-worthy, count how many of the following are **simultaneously true**. **Two or more** must be true before DTF adoption becomes a scheduled engineering item.

| # | Criterion | Fires when… | Does **not** fire when… |
|---|-----------|-------------|-------------------------|
| **(a)** | Durable timer **with action** | A product requirement needs a timer that **changes state** (escalate, reroute, auto-expire, auto-act) beyond `AuthorityPipelineOptions.PipelineTimeout` wall clock — not notify-only. | Notify-only SLA breach (**TB-923** candidate); SQL outbox resume after API crash; async agent execute via existing worker/outbox (**TB-1311** / **M-231**). |
| **(b)** | Compensation / saga | A workflow needs **undo or compensating steps**, not resume-from-checkpoint on the same hand-rolled state machine. | Idempotent retry of the same stage; dead-letter + manual replay; transactional outbox redelivery. |
| **(c)** | Novel outbox outside shared base | A proposed side-effect queue is **not** a trivial extension of the shared outbox base from **TB-920** (entry model + repository + processor + hosted service + metrics). | Another consumer of the shared outbox pattern; a new processor on an existing outbox table. |
| **(d)** | Checkpointed fan-out / fan-in at stage granularity | Pipeline parallelism needs **durable checkpointed** fan-out/fan-in **per authority stage**, not in-process `Task.WhenAll` inside one worker invocation. | Bounded in-process parallelism (**TB-586**); queue mode splitting API from worker completion. |

**Gate rule:** Record which criteria fired (with evidence links) in **TB-924** before implementation starts. One criterion alone — especially async agent execute — is **insufficient**.

**Rules:**

- Quality assessments **must not** treat absence of Container Apps Jobs or DTF as a **V1** defect.
- Promoting this row to a **dated** engineering commitment requires [PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md).
- Outbox/orchestration PRs should cite this checklist when proposing durable-execution substrate changes (see [CONTRIBUTOR_ON_ONE_PAGE.md](../CONTRIBUTOR_ON_ONE_PAGE.md)).

---

## 6r. Authority orchestration layer — lift out of Persistence (V1.1 backlog) (engineering note 2026-06-06)

**Status:** **Done** (2026-06-06, **TB-302**).

**Shipped:** `AuthorityRunOrchestrator`, pipeline stage execution, and committed-pipeline finalization live in **`ArchLucid.Application/Runs/Orchestration/`**. Persistence hosts SQL/work adapters only (`IAuthorityPipelineWorkRepository`, tenant concurrency gate, run-stage outcomes). Architecture tests **`Persistence_must_not_contain_authority_orchestrator`** and **`Application_must_not_reference_Persistence_assembly`** enforce the split.

**V1 stance:** Layer lift is complete for V1 GA; deferred queue + transactional outbox improvements (2026-06-06) harden durability without reversing the Application/Persistence boundary.

**Rules:**

- Quality assessments **must not** treat Persistence-resident orchestration as a current defect — it was remediated in **TB-302**.
- Full DTF replay and Worker/outbox mechanics remain **§6f** / V1.1 evaluation.

---

## 6g. Identity — generic OIDC **and native SAML SP** in **V1 GA** (OIDC owner **2026-05-09**; SAML owner **2026-05-15**)

**Generic OIDC** workforce sign-in — **`ArchLucidAuth:Mode=JwtBearer`** with **`ArchLucidAuth:Authority`** pointed at a **non-Microsoft OIDC issuer** (standard discovery + JWKS validation; claim mapping to **`ArchLucidRoles`** per **[SECURITY.md](contributor-reference/SECURITY.md)**) — is **in scope for V1 GA** per [V1_SCOPE.md §2.12](V1_SCOPE.md).

**Supersedes:** procurement copy and assessments that described generic OIDC as **roadmap-only** or implied Entra was the **only** first-class workforce IdP.

**Promoted to V1 GA (owner 2026-05-15):** **native SAML 2.0 Service Provider** workforce SSO — see [V1_SCOPE.md §2.12](V1_SCOPE.md).

**Still not automatic V1 without separate promotion:** turnkey **per-vendor** admin wizards beyond configuration docs (beyond SAML SP / OIDC configuration surfaces committed in §2.12).

**Rules:**

- Quality assessments **must not** treat “no generic OIDC” as a V1 defect — it is a **committed V1 integration surface** alongside Entra.
- **`(A)` V1 headline readiness** after **`V1_SCOPE.md` §2.12** SAML promotion (**owner 2026-05-15**) **must not** claim **broker-free SAML-direct GA** until SAML SP ships — track in **`PENDING_QUESTIONS.md`** / engineering backlog until closed.
- Claim-mapping and issuer allowlisting discipline stays **documented operator responsibility** — capture buyer IdP specifics in questionnaires ([BUYER_SECURITY_PROCUREMENT_PACKET.md#enterprise-procurement-faq](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#enterprise-procurement-faq)).

---

## 6h. Customer extensibility docs — custom agent handlers (**V1 GA** — promoted 2026-05-12)

**Supersedes:** product note 2026-05-10 that placed pattern-level custom handler documentation in **V2** only.

**Current stance:** **V1 GA** includes committed **documentation** (not necessarily a third-party plugin SDK or marketplace) for how an advanced integrator **authors and registers a custom agent handler** — expectations, prerequisites, boundaries, and a pattern-level workflow (registration, authority/safety posture, versioning) aligned to orchestration contracts. Canonical scope: [V1_SCOPE.md §2.18](V1_SCOPE.md).

| Deliverable | Posture |
|-------------|---------|
| **Documentation — how a customer would add a custom agent handler** | **In V1 GA documentation scope** ([V1_SCOPE.md §2.18](V1_SCOPE.md)). Scope remains **guides and clarity**; **public third-party plugin SDK**, marketplace listing, or new public HTTP contracts stay gated per [V1_SCOPE.md §3](V1_SCOPE.md) **speculative ecosystem** unless separately promoted. |

**Rules:**

- **Do not** confuse this slice with inbound **MCP** ([§6d](#6d-agent-ecosystem--mcp--v11-candidates-scope-documentation-2026-04-24)): MCP is a **V1.1** membrane over **existing** bounded HTTP-backed tools; **custom handler** documentation addresses **code-level** handler extension in **forked / self-hosted** or advanced-integration scenarios aligned to in-repo registration patterns.
- Until the guide ships, **Documentation** / **Extensibility** assessments may note a **delivery gap** against this **V1** commitment — distinct from the old rule that treated the absence as a non-scored deferral.

---

## 6i. Hosted trials — documented `V1` → `V1.1` migration path (V1.1 documentation) (product note 2026-05-10)

**Context:** Hosted **trial** tenants use the same **catalog-per-tenant** isolation story as paid tenants ([`TENANT_DATABASE_TOPOLOGY.md`](TENANT_DATABASE_TOPOLOGY.md)). **`V1`** ships ongoing schema evolution via migrations and publishes breaking guidance in-repo (`CHANGELOG`, **`BREAKING_CHANGES`**). This section pins the **rollup narrative** tenants need when **`V1.1`** ships **novel** outward-facing deltas (coordinate with commerce un-hold in [§6b](#6b-commercial--v11-candidates-resolved-2026-04-23), MCP in [§6d](#6d-agent-ecosystem--mcp--v11-candidates-scope-documentation-2026-04-24), and other promoted **`V1.1`** items).

**V1 stance — scoring:** **`(A)` headline readiness for `V1`** must **not** be reduced solely because buyer- or tenant-admin-facing prose has **not yet** summarized “what happens to my trial when ArchLucid moves **`V1` → `V1.1`**.” Missing that guide is **not** Evolvability, Documentation, Adoption Friction, or Customer Self-Sufficiency debt against **`V1`**.

| Deliverable | `V1` posture | `V1.1` commitment |
|-------------|----------------|-------------------|
| **Hosted trial tenants — consolidated `V1` → `V1.1` migration / expectations document** | **Out of `(A)` V1 readiness.** Operational truth remains: vendor-hosted upgrades, changelog discipline, pilot/trial support channels. | **Delivered (2026-05-15)** — rollup memo **[`HOSTED_TRIAL_V1_TO_V1_1_MIGRATION_GUIDE.md`](HOSTED_TRIAL_V1_TO_V1_1_MIGRATION_GUIDE.md)** (also link from **[`docs/runbooks/TRIAL_FUNNEL_END_TO_END.md`](../runbooks/TRIAL_FUNNEL_END_TO_END.md)** when that runbook next edits). Tenant-facing narrative covers **`V1.1`** relevance vs commerce (**[§6b](#6b-commercial--v11-candidates-resolved-2026-04-23)**), MCP (**[§6d](#6d-agent-ecosystem--mcp--v11-candidates-scope-documentation-2026-04-24)**), Slack interactivity (**[§6a](#6a-chat-ops--slack-scope-note-supersedes-2026-04-23-v2-only-row)**), vendor-managed upgrades vs admin actions, and **`BREAKING_CHANGES`** watch points. |

**Rules:**

- **`V1` quality assessments:** do **not** list “no trial **`V1`→`V1.1`** migration memo” as a weighted defect pillar against **`V1`**.
- **`V1.1`** scoring models may treat this artifact as normal **`V1.1`** rollout documentation when those assessments are authored — this file does **not** pin **`V1.1`** calendar dates (`PENDING_QUESTIONS.md`).
- Update [V1_SCOPE.md §3](V1_SCOPE.md) if the **non‑`V1` gate** wording above changes.

---

## 6j. Governance — default bundled policy packs (owner note 2026-05-16; updated 2026-05-18)

**Twenty-three** first-party starter bundles ship as seeded **`PlatformDefault`** policy packs provisioned alongside net-new tenants (manifest: **`ArchLucid.Application/Governance/DefaultPolicyPacks/Bundled/bundled-policy-packs-v1.manifest.json`**). Buyer-facing summaries appear in **[`DEFAULT_POLICY_PACKS_V1.md`](../go-to-market/DEFAULT_POLICY_PACKS_V1.md)**; framework appendices for AI and security remain in **[`POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md`](POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md)** and **[`POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md`](POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md)**.

| Deliverable | V1 GA posture | V1.1+ candidate |
|-------------|----------------|----------------|
| Bundled curated corpora (**23** packs — commercial top-20 + AI + security + Azure WAF) | **In scope.** Seeded via embedded manifest; enabled assignments; narratives in **`docs/samples/policy-packs/*-rules-v1.json`**. | SemVer uplift / narrative depth via content revisions and migrations (not silent row mutation). |
| **Exhaustive** framework **certification** automation (full CIS pass/fail, SOC 2 attestation, CAF/LZ conformance at Microsoft reference depth) | **Out of scope for V1 GA.** Starter rule keys are architecture-review prompts. | Optional deeper corpora, appendices, and automation when buyers fund expansion. |

**Rules:**

- Marketing and assessments must **not** describe **`V1` GA seeded packs** as statutory or third-party **certification**.
- Assessments gauging **`V1` GA completeness** anchor on **`DEFAULT_POLICY_PACKS_V1.md`** (23 bundles).

---

## 6k. Evidence Bulk Upload — Limits and Batching

**V1 GA stance (2026-05-30):** Bulk upload supports up to **200** multipart files per request (configurable via `ArchLucid:EvidenceBulkUploadMaxFiles`). **ZIP archive expansion** is supported server-side (one ZIP counts as one file; up to 1,000 expanded entries per archive). The architect workspace advertises ZIP support.

**Rejected (owner, 2026-07-05):** Native browser folder recursion (`webkitdirectory` / drag-drop folder preservation) was considered as a V1.1 candidate and **rejected outright** — manual file selection and ZIP upload already cover this need. Not tracked anywhere as future work.

**Rules:**

- Do not log absent browser folder recursion as a V1 GA defect, and do not re-propose it as a future item — it was evaluated and rejected, not merely deferred.
- Do not log the former 30-file cap or absent ZIP expansion as a V1 GA defect (both shipped in V1).

---

## 6l. Multi-region active/active guarantees (**V1.1**)

**V1 GA stance:** Single-region deployment is the intentional V1 baseline ([`V1_SCOPE.md`](V1_SCOPE.md) §3). Multi-region active/active product topology is **committed for V1.1**, not V1 GA.

**Rules:**
- **`(A)` V1 assessments** **must not** treat the absence of multi-region active/active guarantees as a defect or reduce headline readiness for it.
- Do **not** list multi-region active/active as an Enterprise Adoption Blocker or engineering risk for V1.
- **`(B)` procurement realism:** tier-1 DR RFP language may still ask for multi-region — answer with V1.1 commitment and [`RTO_RPO_TARGETS.md`](RTO_RPO_TARGETS.md) tier targets where helpful.

---

## 6m. Privacy — automated tenant erasure quarantine pipeline (**V2**) (product decision 2026-05-17)

**Scope:** A **fully automated** tenant erasure product path: verified request → **quarantine** (`TenantErasureRequestedUtc` or equivalent) → **30-day** (or policy-configured) delay → **legal hold** gate → orchestrated **hard purge** (per-tenant SQL catalog, tenant-scoped blobs, control-plane bindings, subject-identifiable audit) with durable audit.

**Owner decision (2026-05-22):** After hard purge, **retain irreversibly anonymized aggregates only** — no tenant id, no re-identification keys, **`k ≥ 5`** for any cross-tenant statistical surfaces — consistent with GDPR when data are truly anonymous (Art. 4(1) / Recital 26). Do **not** retain row-level tenant copies “for analytics.”

**V1 GA / `(A)` headline posture:** This automated pipeline is **not** a V1 weighted-readiness commitment. **Independent assessments must not** reduce **`(A)`** solely because automation is absent. **V1** ships **operator/trial offboarding** via `TenantDeletionService` / `ITenantHardPurgeService` under the policy above.

**`(B)` procurement / privacy realism:** Some buyers will still ask GDPR/CCPA deletion questions. Answer with **current** controls, **trust center** posture, and this **V2** roadmap pointer — zero weight on **`(A)`** unless an in-contract commitment supersedes this doc.

**Release-window commitment:** **V2** (calendar not pinned here). Promoting or reprioritizing requires an owner note in [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) if dates or contractual obligations change.

**Rules:**
- Do not imply V1 lacks **any** tenant data removal capability — distinguish **automated product pipeline** (deferred) from **existing** purge/offboarding paths.
- **Scoring:** treat this entire **§6m** block as **`Actionable: No`** for V1 headline batching until the automated pipeline ships — **V2** scope; **V1** offboarding paths above remain sufficient for stated posture.

---

## 6n. Multi-cloud architecture **analysis** — AWS and GCP targets (**V1.1**) (owner scope 2026-05-19)

**Scope:** Analyze **customer** architectures on **AWS** or **GCP** while ArchLucid **stays hosted on Azure** ([ADR 0020](../architecture/adrs/0020-azure-primary-platform-permanent.md)). Distinct from **§6l** (multi-region **product** HA) and from re-hosting the control plane on another public cloud.

**Correction (2026-07-12):** the row previously claiming `CloudProvider.Aws`/`CloudProvider.Gcp` selection was "Out of V1" is expunged — it was stale. **`CloudProvider`** selection (enum, wizard schema, cloud-specific default-pack baseline via `DefaultPolicyPackCloudBaselineApplicator`) already ships for Azure, AWS, and GCP today; this row's claim did not match shipped code.

| Milestone | V1 posture | V1.1 commitment |
|-----------|------------|-----------------|
| **Terraform ingest** for AWS/GCP (`terraform-show-json`, `simple-terraform`) | **Partial today:** parsers ingest any provider’s HCL/JSON but object-type resolution is Azure-skewed; cost copy assumes Azure. | **In scope for V1.1** — classification + illustrative AWS/GCP cost labels (Phases 1–2). |
| **Customer-controlled AWS/GCP inventory ZIP** + upload | **Out of V1.** V1 GA ships Azure extractor only (**§2.16**). | **In scope for V1.1** — parity with Tier 1 (no vendor credentials in customer cloud) per [MULTI_CLOUD_ANALYSIS_V1_1.md](MULTI_CLOUD_ANALYSIS_V1_1.md) Phase 3. |
| **Live AWS/GCP public pricing** in cost artifacts | **Out of V1.** Azure Retail API + illustrative fallback only. | **In scope for V1.1** Phase 4 — with illustrative fallback when probes fail. |
| **Cloud-aware agent / finding context** | **Out of V1** for AWS/GCP targets. | **In scope for V1.1** Phase 4. |
| **Re-host ArchLucid on AWS or GCP** | **Out of V1 and V1.1** per ADR 0020. | **Not committed** unless a future ADR supersedes. |

**Rules:**

- **V1 GA assessments** **must not** deduct **`(A)`** headline readiness solely because AWS/GCP **target** analysis is unavailable — same pattern as ITSM **§6** before V1.1 promotion.
- **V1.1 assessments** may treat missing **§2.19** minimum (Phases 1–2) as product gap **after** the V1.1 window is declared active for scoring.
- Engineering detail, phases, and acceptance criteria: **[MULTI_CLOUD_ANALYSIS_V1_1.md](MULTI_CLOUD_ANALYSIS_V1_1.md)**.
- Historical note: [`PENDING_QUESTIONS_RESOLVED_HISTORY.md`](../archive/PENDING_QUESTIONS_RESOLVED_HISTORY.md) — “AWS agents / multi-cloud deferred to V1.1”.

---

## 6o. Sponsor ROI summary endpoint — cross-run dedup (**promoted to V1**, owner 2026-05-22)

**Supersedes** the **V1.1** deferral recorded **2026-05-19**. Cross-run sponsor ROI aggregation is **in contract for V1 GA** — see [V1_SCOPE.md](V1_SCOPE.md) **§2.8**.

| Milestone | V1 posture |
|-----------|------------|
| **`GET /v1/roi/sponsor-summary`** + operator dashboard panel | **In V1.** Latest committed run per system; summed estimated USD savings; top systemic issues. **Overlapping findings:** deduplicate by stable **`FindingId`** before portfolio counts (owner decision **2026-05-22**). |

**Rules:**

- **`(A)` assessments** may score Sponsor Value Visibility and Proof-of-ROI Readiness against this surface when evaluating V1 GA readiness.
- Prefer extending **`ExecutiveRoiSummaryService`** / [`PILOT_SCORECARD_API.md`](PILOT_SCORECARD_API.md) over parallel ROI math unless a separate board-pack contract is required.

**Historical note:** Prior wording treated a dedicated CFO rollup route as **V1.1** until aggregation rules were pinned; those rules are now authoritative in **§2.8**.

---

## 6p. Azure extractor — ArchLucid-hosted automated Tier-2 continuous polling — **closed 2026-07-05 (core shipped; residual moved to V1 backlog)**

**Resolution:** The core capability this section tracked (`AzureExtractorAutoPullHostedService` leader-elected continuous pull, WIF-based credential exchange, on-demand hosted collection) is **shipped in V1 GA** — see [V1_SCOPE.md](V1_SCOPE.md) **§2.16**, which now also carries the two remaining residual items (hosted Cost Management merge, auto-pull cadence runbooks) as **V1 backlog** rather than a "V1.x/post-GA" deferral. This section is retained only as a pointer; do not re-open it as a separate deferred item.

**Architecture pattern (resolved, for reference):** Customer-provisioned read-only service principal (`Reader` + `Cost Management Reader`); ArchLucid's managed identity exchanges tokens via federated workload identity (`ClientAssertionCredential` / `api://AzureADTokenExchange`, `WorkloadIdentityHostedAzureExtractorCredentialFactory`) — never long-lived customer secrets. Canonical detail: [AZURE_EXTRACTOR.md](AZURE_EXTRACTOR.md).

---

## 6q. RAG quality — V1.1 and V2 expansion (engineering backlog 2026-05-23; remainder column corrected 2026-07-03)

**V1 GA posture:** Retrieval infrastructure **ships** (`ArchLucid.Retrieval`, `AskService` retrieval, ADR 0004 outbox). **V1 quality improvements** (corpus seam, policy-pack indexing, tenant prior-manifest chunks, Retail structured lookup, platform docs, faithfulness eval) are **engineering backlog** — **[`TECH_BACKLOG.md`](TECH_BACKLOG.md) TB-021** and **[`RAG_QUALITY_TECHNICAL_BACKLOG.md`](RAG_QUALITY_TECHNICAL_BACKLOG.md) RAG-V1-*** — schedulable from assessments; **not** separate V1 GA product-contract rows unless promoted via [`V1_SCOPE.md`](V1_SCOPE.md) change control.

**Correction (2026-07-03):** a code-level audit (triggered by a `docs/assessments/LATEST_GPT55.md` note) found the **"None" remainder** claim below was inaccurate for all three **RAG-V2-*** rows, and flatly false for **RAG-V2-003**. This table also conflicts with `docs/assessments/CuttingEdgeAITechnology_06022026.MD` (2026-06-02), which independently lists all three as "V2 by design" — a second unreconciled drift on the same three items, noted here for the next owner pass.

**V1 shipped / V1 scope (pull-forward from V1.1/V2 backlog):**

| ID | Title | V1 scope | V1.1/V2 remainder (corrected 2026-07-03) |
|----|-------|----------|----------------|
| **RAG-V1.1-001** | Reference-architecture exemplar retrieval | Exemplar indexer + Topology agent style-prior injection (fail-open) | Owner-curated exemplar library; fingerprint-based matching |
| **RAG-V1.1-002** | MCP read-only retrieval tools (3 tools) | HTTP bridge at `/v1/mcp/retrieval/*` (non-GA) | Streamable HTTP MCP membrane; **not** the seven governance tools in MCP §5.1 (**CPB-D02**) |
| **RAG-V2-001** | Graph-RAG over knowledge / provenance graph | `GraphRagNeighborExpander` ships bounded multi-hop neighbor expansion (cycle-safe BFS, hop budget default 2, `MaxGraphTraversalHops` config), DI-wired by default (**not** "None" remainder); **TB-597 closed 2026-07-03** | Bounded-multi-hop quality remains **"unproven without a production vector index"** per `GraphRagProductionLikeConfigurationLint` — see **TB-595**, **TB-596**. **Community summarization:** [ADR 0057](../architecture/adrs/0057-graph-rag-community-summarization-scope-decision.md) recommended deferral; **owner overrode to option (a)** 2026-07-05 — active V1 engineering as **TB-877** (default off; no buyer quality claim until ablation). |
| **RAG-V2-002** | Single-pass query expansion (HyDE, query rewrite, semantic rerank) | `AgenticRetrievalCompletionClient` ships real LLM-backed rewrite + HyDE with fail-open heuristic fallback; reranking via real Azure AI Search semantic ranker (**not** "None" remainder). Buyer-facing term: **single-pass query expansion + managed semantic reranking** — **TB-598 closed 2026-07-04** (owner chose relabel; iterative retrieve-critique-retry loop was deferred pending G-REAL-06 pilot signal, then **promoted V1** — **TB-878**) | **Single-shot** query rewrite + single-shot HyDE shipped. **Iterative** retrieve-critique-retry remainder: **TB-878** (owner override 2026-07-05; TB row 2026-07-19). Per-flag quality contribution isolated on golden fixtures via **TB-595**. Internal `Agentic*` type names retained for API stability. |
| **RAG-V2-003** | Online fine-tuning on accepted manifests | **Foundation shipped (2026-07-03, TB-594)** — ADR 0056, DPA addendum, consent-gated export, orchestration seam, registry, eval gate; **off by default** until tenant opt-in + promotion. Remainder: wire promoted deployment into live agent completion routing. | **Partial remainder** — engineering foundation complete; runtime routing + live Azure job hardening remain. See **TB-594**. |

**Promoted to V1 (owner decision 2026-07-05; TB rows 2026-07-19):**

| ID | Title | TB | Notes |
|----|-------|-----|-------|
| **RAG-V1.1-003** | Pilot-feedback retrieval for planning materialize | **TB-879** | [`PRODUCT_LEARNING.md`](PRODUCT_LEARNING.md) §4 |
| **RAG-V1.1-004** | Cross-tenant pattern library (ADR 0031) | **TB-880** | k-anon aggregates — **not** embedding-RAG |

**Rules:**

- **`(A)` V1 assessments** **must** deduct headline readiness for absence of **RAG-V2-*** items, as they have been pulled forward into the V1 scope.
- **`(A)` V1 assessments** **must not** deduct headline readiness solely for absence of **RAG-V1.1-*** items.
- **`(A)` assessments** **may** schedule **TB-021 / RAG-V1-*** when scoring **AI/Agent Readiness** faithfulness gaps — these are in-scope quality work, not scope creep.
- Cross-tenant **text** retrieval remains forbidden outside ADR 0031 materialised aggregates.

**Canonical detail:** [`RAG_QUALITY_TECHNICAL_BACKLOG.md`](RAG_QUALITY_TECHNICAL_BACKLOG.md). **First implementation design:** [`RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md`](RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md).

---

## 7. Engineering backlog (not a product roadmap)

| Item | Doc source |
|------|------------|
| Numbered refactors, test hygiene, doc tighten-ups | [NEXT_REFACTORINGS.md](NEXT_REFACTORINGS.md) |
| RAG quality — V1 foundation (TB-021) | [RAG_QUALITY_TECHNICAL_BACKLOG.md](RAG_QUALITY_TECHNICAL_BACKLOG.md) · [RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md](RAG_CORPUS_KIND_POLICY_PACK_DESIGN.md) (first slice) |

This file is **maintainer hygiene**. It is **not** a commitment to ship listed items to pilots.

---

## 8. When to update this file

- After a changelog entry marks something **“intentionally deferred”** or **“gap.”**
- When **AUDIT_COVERAGE_MATRIX** gains or loses a **Known gaps** row.
- When **Phase 7** rename items move (only with program approval).
- When **V2 platform** items (§6e–§6f) or **`V1.1` buyer-visible documentation** commitments (e.g. §6i) are recorded, add or update the matching **`V1_SCOPE.md` §3** row in the same change. (**§6h** custom handler docs are **V1 GA** — track under [V1_SCOPE.md §2.18](V1_SCOPE.md), not §3 deferrals.)
- When **identity scope** is promoted (see §6g pattern — update [V1_SCOPE.md](V1_SCOPE.md) §2.12 / §3 together / procurement FAQ as needed).

**Change control:** Prefer updating **this file** and [V1_SCOPE.md](V1_SCOPE.md) §3 together so external messaging stays aligned.
