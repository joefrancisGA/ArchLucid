> **Scope:** ArchLucid V1 — deferred and exploratory (doc inventory) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid V1 — deferred and exploratory (doc inventory)

**Audience:** product, pilots, and engineering leads who read scattered docs and need one **intentional** story: what is **shipped for V1** vs what is **explicitly not promised yet**.

**Relationship:** [V1_SCOPE.md](V1_SCOPE.md) defines the **V1 contract** (in scope, non-goals, happy path). **This file** lists areas that docs describe as **partial, follow-up, gap, or Phase-7-style cleanup** so nothing reads as an open-ended roadmap by accident.

**Rules:** No code changes implied here. Items are **documentation-sourced**; treat as **V1.1+ candidates or internal backlog** unless your program promotes them.

**Operator UI (V1 vs V1.1):** V1 proxy/types work and the V1.1-only UI architecture backlog are summarized in [UI_ARCHITECTURE_V1_1.md](UI_ARCHITECTURE_V1_1.md).

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

## 3. Rename, keys, and platform cleanup (Phase 7)

Operational cleanup is **scheduled and gated**, not “unfinished V1 product.”

| Item | Doc source |
|------|------------|
| Remove legacy **ArchLucid** config / OIDC / env bridges; **ArchLucid.sql → ArchLucid.sql**; Terraform **state mv**; repo / workspace rename | [ARCHLUCID_RENAME_CHECKLIST.md](../archive/ARCHLUCID_RENAME_CHECKLIST.md) **Phase 7** (requires explicit go-ahead). |

---

## 4. Operator experience and CI honesty

| Item | Doc source |
|------|------------|
| **Periodic manual accessibility review** — scheduled screen-reader / assistive-technology validation beyond merge-blocking **`@axe-core/playwright`** baselines | Assessment boundary: participant AT studies are not a V1 **`(A)`** gate per **Assessment-Scope-V1_1**; **V2** candidate for an explicit review cadence. |
| **Baseline wizard — deferred enrichments (beyond ZIP-first V1)** | [`LATEST.md`](../assessments/LATEST.md) improvement **#8** (actionable): V1 ships **extractor ZIP first**, then **system name + environment + cloud provider (Azure default)**; optional existing wizard steps stay non-blocking. **V1.1 candidates:** wizard steps that **gate** or strongly nudge governance tags, compliance constraints, and risk classification when org policy requires it; guided **datastore/service** review when extractor coverage is known incomplete. **V2 candidates:** **portfolio** onboarding (multi-system / program-level baseline in one flow); deep **framework-mapping** steps tied to industry SKUs. |
| **Playwright** operator smoke may use **mocked** `/api/proxy`; it does not replace **SQL-backed** API + UI validation for a given release | [RELEASE_SMOKE.md](RELEASE_SMOKE.md), [V1_SCOPE.md](V1_SCOPE.md) §3 |
| **Audit search** keyset cursor uses **`OccurredUtc` with optional `EventId` tie-break** (`GET /v1/audit/search?beforeUtc=…&beforeEventId=…`); clients must pass both when continuing past same-second events | [AuditController.cs](../../ArchLucid.Api/Controllers/Admin/AuditController.cs), operator audit UI “Load more” |

---

## 5. Infrastructure and organizational polish

Docs describe **templates and gaps** that depend on **customer subscription and process**, not missing product code.

| Item | Doc source |
|------|------------|
| **ACR** / production image store, extending CI to **push** images | [CONTAINERIZATION.md](CONTAINERIZATION.md) |
| Subscription placement, naming, which Terraform roots to enable | Same doc — **organizational** follow-ups |

---

## 6. Atlassian documentation connector — Confluence in **V1 GA** (supersedes V1.1-only 2026-04-24 pinning)

**Confluence** first-party connector (publish finding or run summary pages to Confluence Cloud) is **in scope for V1 GA** per [V1_SCOPE.md](V1_SCOPE.md) **§2.15** — **owner scope update 2026-05-05**, superseding the prior **out of V1 / V1.1-window** table row and Improvement 3 deferral wording.

**Jira** and **ServiceNow** remain per [V1_SCOPE.md](V1_SCOPE.md) §2.13; **Slack** per §2.14.

**V1 customer-owned bridges (optional):** Power Automate and Logic Apps walkthroughs under **[`docs/integrations/recipes/README.md`](../integrations/recipes/README.md)** — still valid for tenants that prefer Microsoft automation or interim coverage. Summary hub: [ITSM_BRIDGE_V1_RECIPES.md](ITSM_BRIDGE_V1_RECIPES.md).

**Rules:**

- **First-party implementation priority:** **ServiceNow** → **Atlassian pair** — **Confluence** **before** **Jira**, engineered **together** in one workstream / release tranche (*Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)* in [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)) unless an owner reorder is recorded.
- **Release-window** calendar dates are **not** implied unless [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) pins one.
- New ITSM/documentation connectors **must not** widen without their own owner decision — **Azure DevOps Work Items** stays `[Planned]` until separately promoted.
- Each connector **must** consume the same Authority-shaped event payloads the existing webhooks ship; no parallel finding-projection schema per target.

---

## 6a. Chat-ops — Slack scope note (supersedes 2026-04-23 V2-only row)

**Slack** first-party **outbound** chat-ops (notification sink parity with **Microsoft Teams** — same **`EnabledTriggersJson`** / trigger catalog, **Key Vault** secret-name references, Authority-shaped payloads) is **in scope for V1 GA** per [`V1_SCOPE.md`](V1_SCOPE.md) **§2.14** — **owner scope update 2026-05-05**, superseding the prior *Resolved 2026-04-23* posture that listed Slack as **V2-only**.

**V1.1 commitment:** **In-Slack interactive** approvals / acknowledgements (**approve / ack** buttons on Slack messages surfaced by ArchLucid) — scoped for **V1.1** so chat-ops can close governance loops without leaving Slack.

**Still open / unpinned without separate promotion (no calendar dates implied):** Slack **App Directory** listing and OAuth installation UX marketed as **first-class** product onboarding.

**Rules:**

- Additional chat-ops surfaces (e.g. Discord, Mattermost) **must not** be added without their own owner decision row.
- Slack (and any other committed chat surface) must consume the same Authority-shaped event payloads the existing webhooks and the Microsoft Teams connector ship; no parallel notification schema per chat surface.

---

## 6b. Commercial — V1.1 candidates (Resolved 2026-04-23)

These commercial milestones are **explicitly release-window-pinned to V1.1** so V1 readiness is no longer measured against them. They were previously open obligations that quality assessments were treating as live V1 gaps; the 2026-04-23 owner decision in [PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md) **Resolved 2026-04-23 (Reference-customer publication scope)** moves them into a named release window so external messaging — and internal scoring — stops reading them as V1 deficits.

| Commercial milestone | V1 posture | V1.1 commitment |
|----------------------|------------|------------------|
| **First named, public reference customer** — at least one row in [`docs/go-to-market/reference-customers/README.md`](../go-to-market/reference-customers/README.md) at `Status: Published`, with a published case study, customer-permissioned logo on the marketing site, and (where the customer agrees) measured ROI delta. Triggers re-rate of the **−15% reference discount** in [`PRICING_PHILOSOPHY.md` § 5.3](../go-to-market/PRICING_PHILOSOPHY.md). | **Out of V1.** No public reference customer is required for V1 GA. The reference-customer table stays alive (rows in `Placeholder` / `Customer review`) and the CI guard [`scripts/ci/check_reference_customer_status.py`](../../scripts/ci/check_reference_customer_status.py) **stays in `continue-on-error: true` warn-mode** for the entire V1 window — it does **not** flip to merge-blocking by V1 GA. V1 quality assessments **do not** charge points against Marketability, Proof-of-ROI Readiness, Differentiability, Trustworthiness, or Procurement Readiness for the absence of a `Published` row. | **In scope for V1.1.** The minimum V1.1 commitment is: at least **one** row at `Status: Published` with a customer-approved case study and a customer-permissioned logo. The `−15%` reference discount becomes a candidate for re-rate at V1.1 per `PRICING_PHILOSOPHY.md` § 5.3. Calendar date is **not** pinned by this decision; pinning a date requires a follow-up owner entry. |
| **Signed design partner engagement** — first design-partner agreement (or equivalent early-adopter commercial terms) under [`PRICING_PHILOSOPHY.md`](../go-to-market/PRICING_PHILOSOPHY.md) / [`ORDER_FORM_TEMPLATE.md`](../go-to-market/ORDER_FORM_TEMPLATE.md), when the buyer accepts design-partner discount and case-study / reference-call deliverables | **Out of V1.** No signed or active design partner is required for V1 GA. V1 supports **sales-led pilots**, internal evaluation, and PLG-style trials without a formal design-partner contract. V1 quality assessments **do not** charge **`(A)`** points for Marketability, Proof-of-ROI, Stickiness, Differentiability, trust pillars, or pilot readiness solely because a design partner is not yet closed. **Do not** use “no design partner yet” as a recurring headline defect, improvement prerequisite, or default “open questions” batch unless the user **explicitly** asked for a GTM pipeline review — then treat as **`(B)` market-motion realism** only (zero weight on **`(A)`**). | **In scope for V1.1** as a commercial motion complementary to the published reference-customer row ([`reference-customers/README.md`](../go-to-market/reference-customers/README.md)). Calendar date is **not** pinned here; pinning requires [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md). |
| **Commerce un-hold (Stripe live keys flipped + Marketplace listing published)** — the external go-live of the self-serve transactability rails: (a) Stripe **live** API keys configured and the production webhook secret rotated (replacing TEST-mode keys for the production environment), (b) the Azure Marketplace SaaS offer transitioned to `Published` in Partner Center, with seller verification, payout account, and tax profile complete, (c) DNS cutover for `signup.archlucid.net` to the production Front Door custom domain. Until this milestone lands, the V1 commercial motion is **sales-led** — `/pricing` displays numbers, `ORDER_FORM_TEMPLATE.md` drives quote-to-cash, and the trial funnel runs in **Stripe TEST mode on staging** as a sales-engineer-led product evaluation (see Improvement 2 in [`QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md`](../archive/quality/2026-04-21-assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md) §3). | **Out of V1.** No live commerce un-hold is required for V1 GA. All wiring stays in place — `BillingStripeWebhookController`, `BillingMarketplaceWebhookController`, `BillingCheckoutController`, `BillingProductionSafetyRules`, `[RequiresCommercialTenantTier]` filter returning **402 Payment Required**, the Marketplace-alignment doc, the `/pricing` page, and the trial signup TEST-mode plumbing are V1-ready and V1-supported. **What is deferred is the act of flipping the live keys and publishing the Marketplace listing**, not the underlying engineering. V1 quality assessments **do not** charge points against Adoption Friction, Decision Velocity, or Commercial Packaging Readiness for the absence of live keys / a published listing. The trial funnel TEST-mode end-to-end work (Improvement 2) stays a live V1 obligation — only the "flip TEST → live" final gate is V1.1-deferred. | **In scope for V1.1.** Minimum V1.1 commitment: (a) Stripe live keys configured with production webhook secret rotated, (b) Marketplace SaaS offer at `Published` with seller verification + payout + tax profile complete, (c) DNS cutover for `signup.archlucid.net`, (d) the `BillingProductionSafetyRules` startup gate passes against the live configuration. Calendar date is **not** pinned by this decision. The Stripe-live-keys flip and the Marketplace `Published` state are both **owner-only** (Partner Center seller verification, tax profile, and payout account cannot be filed by the assistant). |

**Rules:**

- The CI guard's behaviour does **not** change in V1 — staying in warn-mode is the V1 contract. Flipping it to merge-blocking is a V1.1 task, not a V1 hardening task.
- The trial funnel TEST-mode end-to-end work (Improvement 2 in the open assessment) is **not** deferred — it is a V1 obligation and stays in §3 as actionable. Only the **owner-only flip to Stripe live keys** and the **Marketplace `Published` state** are V1.1-deferred.
- The `BillingProductionSafetyRules` startup guard (fails `ASPNETCORE_ENVIRONMENT=Production` when Stripe live key prefix `sk_live_` is configured without a webhook secret, or when Marketplace landing page URL is empty/localhost) stays **shipped in V1**. Its purpose is to make the V1.1 un-hold safe; do not remove it as part of the V1.1 work.
- Quality assessments produced **before** these decisions (e.g. [`QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md`](../archive/quality/2026-04-21-assessments/QUALITY_ASSESSMENT_2026_04_21_INDEPENDENT_68_60.md) before its 2026-04-23 re-score addenda) charged points against V1 for these gaps. Future assessments **must not** — see that file's §0.2 (reference-customer) and §0.3 (commerce-un-hold) re-score addenda for the score adjustments applied on 2026-04-23.
- **Design partner (Resolved 2026-05-03):** the same rule applies — future assessments **must not** treat absence of a signed design partner as an **`(A)`** defect or premise repeated “you lack a design partner” narrative; see [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) *Resolved 2026-05-03*.
- These decisions do **not** retract or downgrade other commercial / security milestones — **third-party** pen-test summary publication is **V2** per §6c (owner 2026-05-01); PGP key generation, board-pack PDF endpoint, etc. stay as documented unless a separate owner decision defers them.
- A new commercial milestone **must not** be added to this table without its own owner decision recorded in [PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md).
- **Commerce un-hold demand gate (planning 2026-05-17):** The **Stripe live / Marketplace `Published`** flip remains a **V1.1** engineering and owner obligation per the **Commerce un-hold** row above; **timing** should reflect **validated buyer motion** (e.g. repeated paid review or pilot pattern) in addition to finance readiness — see **`docs/assessments/LATEST.md` P4** and **`docs/go-to-market/GTM_BACKLOG.md`** service-led baseline. This does **not** remove the **`BillingProductionSafetyRules`** guard or TEST-mode trial obligations in **`V1`**.

---

## 6c. Security and assurance — SOC 2 CPA attestation (post–V1.1 gate), V1.1 (PGP), V2 (third-party pen test) (owner 2026-05-01; SOC scoring clarification 2026-05-03)

**SOC 2 CPA attestation:** A **CPA-issued SOC 2 Type I or Type II examination report** is **not** a **V1** or **V1.1** headline readiness milestone for weighted product assessments. **What is in V1:** honest trust-center rows, CAIQ/SIG/DPA/process templates, internally maintained SOC 2 **self-assessment** and roadmap (`docs/security/SOC2_SELF_ASSESSMENT_2026.md`, `docs/go-to-market/SOC2_ROADMAP.md`, [`TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md)). **Independent quality assessments must not** deduct **`(A)` V1.1 headline readiness** (see `.cursor/rules/Assessment-Scope-V1_1.mdc`) solely because CPA SOC 2 is not issued. **Still include SOC narrative** — under an explicit **procurement-realism / informational** section with **zero weight** on **`(A)`** — citing self-assessment, roadmap timing, and buyer friction honestly.

**V1 pen testing** is **owner-conducted** (tracked under [`2026-Q2-OWNER-CONDUCTED.md`](../security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md) and related self-assessment docs). There is **no** committed third-party assessor for V1. **Independent quality assessments must not** treat the absence of an **external** third-party pen test or redacted assessor summary as a V1 deficit.

**Third-party** pen-test execution, vendor SoW award, assessor deliverables, and optional Trust Center row refresh for that engagement are **V2** — use [`2026-Q2-SOW.md`](../security/pen-test-summaries/2026-Q2-SOW.md) and [`2026-Q2-REDACTED-SUMMARY.md`](../security/pen-test-summaries/2026-Q2-REDACTED-SUMMARY.md) as procurement templates when planning V2.

| Assurance milestone | V1 posture | Release-window commitment |
|---------------------|------------|---------------------------|
| **SOC 2 Type I / II report (CPA-issued SOC examination)** — attestation tied to an independent CPA firm opinion; distinct from owner self-assessment. | **Out of V1** and **out of V1.1 as a headline scoring gate.** V1 posture is internally maintained **self-attested** SOC mapping + roadmap honesty + procurement templates (**do not imply** SOC 2 Type II is issued). **`(A)` assessments must not** treat absent CPA SOC 2 as a V1/V1.1 defect. Use **`(B)` procurement-realism`** (zero weight on **`(A)`**) when discussing enterprise RFP friction. | **Post–V1.1** until an explicit owner promotion and calendar decision — track narrative timing in [`SOC2_ROADMAP.md`](../go-to-market/SOC2_ROADMAP.md) and [`TRUST_CENTER.md`](../go-to-market/TRUST_CENTER.md); pinning dates requires [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md). |
| **Third-party pen-test execution + redacted summary publication** — funded vendor engagement, SoW, assessor draft + final report, optional customer-shareable redacted summary and Trust Center metadata row. | **Out of V1** for **external** / third-party scope. V1 relies on **owner-conducted** testing + in-repo templates; see [`V1_SCOPE.md`](V1_SCOPE.md) §3. **Quality assessments:** do **not** penalize V1 readiness for lacking a third-party pen test. | **V2.** Minimum V2 commitment: select vendor, execute engagement, populate redacted summary working copy when applicable; update Trust Center when published. Calendar date is **not** pinned here. |
| **PGP key drop for `security@archlucid.net` (coordinated-disclosure key)** — owner generates the keypair (or designates a custodian), drops the public key block at `archlucid-ui/public/.well-known/pgp-key.txt`, references it from [`SECURITY.md`](../../SECURITY.md), and updates the marketing `/security` page in the **same single PR** (per owner Q14, 2026-04-23, sixth pass). | **Out of V1.** No PGP key drop required for V1 GA. The recipe at [`docs/security/PGP_KEY_GENERATION_RECIPE.md`](../security/PGP_KEY_GENERATION_RECIPE.md) stays in place; the CI guard that turns green when the key file appears stays in place. V1 quality assessments **do not** charge points against Trustworthiness for the absence of the PGP key. | **V1.1.** Minimum V1.1 commitment: public key block committed at `archlucid-ui/public/.well-known/pgp-key.txt`, `SECURITY.md` key-fingerprint reference updated, marketing `/security` page reference updated — all in the **same PR**. UID is gated on `archlucid.net` domain acquisition; default proposal is `ArchLucid Security <security@archlucid.net>`, but if the domain is never acquired the owner provides the alternate UID at V1.1 planning. Calendar date is **not** pinned by this decision. |

**Rules:**

- These are **release-window** promises, not dates. Pinning calendar dates requires a follow-up owner entry recorded in [PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md).
- **`(A)` / `(B)` scoring labels:** See `.cursor/rules/Assessment-Scope-V1_1.mdc` — **`(A)` V1.1 headline readiness must not drop** solely for absent **CPA SOC 2** or **ISO 27001 certification**; those belong in **`(B)` procurement realism** unless the user asks for an explicit blended score.
- V1 assessments **must not** penalize the solution for absent **third-party** pen-test publication; that work is **V2**. The **PGP** row remains **V1.1** as above. Pre-2026-05-01 docs that referenced a named third-party vendor for Q2 2026 are **superseded** by this owner decision where they conflict.
- These decisions do **not** retract or downgrade other V1 security obligations — owner-conducted testing and self-assessment, `BillingProductionSafetyRules`, RLS object-name discipline, OWASP ZAP baseline, Gitleaks, STRIDE-style threat modeling, audit-event coverage matrix, all remain V1 obligations.
- A new security or assurance milestone **must not** be added to this table without its own owner decision recorded in [PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md).

---

## 6d. Agent ecosystem / MCP — V1.1 candidates (scope documentation 2026-04-24)

This section **promotes MCP from backlog-only text to the named V1.1 release window**, aligned with [V1_SCOPE.md §3](V1_SCOPE.md) and the engineering intent in [`MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md`](MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md). **Tool count, transport, and allowlist are pinned** in that backlog **§5.1** (owner **2026-05-15**). This section does **not** pin calendar dates; pinning dates still requires an owner entry in [PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md).

| MCP milestone | V1 posture | V1.1 commitment |
|-----------------|------------|-----------------|
| **Inbound MCP server (membrane)** — **§5.1 pinned:** **Streamable HTTP** (production, private endpoint) with **seven** **read-only** tools (`GetRunStatus`, `GetManifestSummary`, `CompareRuns`, `GetProvenanceGraph`, `GetGovernanceStatus`, `ListArtifacts`, `GetAuditSlice`); optional **`stdio`** for local/self-hosted non-SLA harnesses only. Thin wrappers over **`ArchLucid.Application`**; **SQL Server + RLS** authoritative; **typed audit** per tool; **token / session caps** and **circuit breakers** per existing LLM accounting. | **Out of V1.** No MCP transport in the V1 shipping boundary; pilots and integrators use **REST**, **CLI**, and the **operator UI**. | **In scope for V1.1** at the **§5.1** freeze ([`MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md`](MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md)). **Hard rule:** the authoritative solution **never** takes a compile-time dependency on MCP — the membrane is removable without changing business logic. |
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

**Rules:**

- Quality assessments **must not** treat absence of Container Apps Jobs or DTF as a **V1** defect.
- Promoting this row to a **dated** engineering commitment requires [PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md).

---

## 6g. Identity — generic OIDC **and native SAML SP** in **V1 GA** (OIDC owner **2026-05-09**; SAML owner **2026-05-15**)

**Generic OIDC** workforce sign-in — **`ArchLucidAuth:Mode=JwtBearer`** with **`ArchLucidAuth:Authority`** pointed at a **non-Microsoft OIDC issuer** (standard discovery + JWKS validation; claim mapping to **`ArchLucidRoles`** per **[SECURITY.md](SECURITY.md)**) — is **in scope for V1 GA** per [V1_SCOPE.md §2.12](V1_SCOPE.md).

**Supersedes:** procurement copy and assessments that described generic OIDC as **roadmap-only** or implied Entra was the **only** first-class workforce IdP.

**Promoted to V1 GA (owner 2026-05-15):** **native SAML 2.0 Service Provider** workforce SSO — see [V1_SCOPE.md §2.12](V1_SCOPE.md).

**Still not automatic V1 without separate promotion:** turnkey **per-vendor** admin wizards beyond configuration docs (beyond SAML SP / OIDC configuration surfaces committed in §2.12).

**Rules:**

- Quality assessments **must not** treat “no generic OIDC” as a V1 defect — it is a **committed V1 integration surface** alongside Entra.
- **`(A)` V1 headline readiness** after **`V1_SCOPE.md` §2.12** SAML promotion (**owner 2026-05-15**) **must not** claim **broker-free SAML-direct GA** until SAML SP ships — track **`docs/assessments/LATEST.md`** improvement **#13** or equivalent engineering backlog identifier until closed.
- Claim-mapping and issuer allowlisting discipline stays **documented operator responsibility** — capture buyer IdP specifics in questionnaires ([PROCUREMENT_FAQ.md](../go-to-market/PROCUREMENT_FAQ.md)).

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

## 6j. Governance — default bundled policy packs vs Azure LZ / CAF curated pack (owner note 2026-05-16)

Two **first-party** starter bundles (AI Governance + Security baseline) ship as seeded **`PlatformDefault`** policy packs provisioned alongside net-new tenants. Buyer-facing summaries and disclaimers appear in **[`DEFAULT_POLICY_PACKS_V1.md`](../go-to-market/DEFAULT_POLICY_PACKS_V1.md)**, with framework appendices **[`POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md`](POLICY_PACK_APPENDIX_AI_GOVERNANCE_V1.md)** and **[`POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md`](POLICY_PACK_APPENDIX_SECURITY_BASELINE_V1.md)**.

| Deliverable | V1 GA posture | V1.1+ candidate |
|-------------|----------------|----------------|
| Bundled curated corpora (**AI gov** · **security baseline**) | **In scope.** Seeded packs, enabled assignments, operator UI readability, appendix tables tied to **`docs/samples/policy-packs/*.json`**. | Future catalog tuning / SemVer uplift via product migrations and release notes (not silent row mutation expectations). |
| **Azure landing-zone / Cloud Adoption Framework (CAF)-aligned curated pack** — subscription-factory narratives, corp/online/connectivity landing-zone vending, policy-initiative mapping as authored rule text | **Out of bundled V1 GA corpus.** Explicit deferral prevents pilots from reading **`V1` GA seeded packs** as exhaustive CAF/LZ conformance automation. | **Named V1.1 curated-pack slice** — distinct corpus + UX + procurement guardrails whenever promoted. |

**Rules:**

- Marketing and assessments must **not** describe **`V1` GA seeded packs** as an Azure LZ / CAF conformance pack absent a separate shipped corpus — that slice pins here as **V1.1**.
- Assessments gauging **`V1` GA completeness** anchor on exactly the **two bundles** enumerated in **`DEFAULT_POLICY_PACKS_V1.md`**.

---

## 6k. Evidence Bulk Upload — Limits and Batching (V1.1 candidates)

**V1 GA stance:** Bulk upload of evidence files is supported up to a configured cap (30 files by default). The V1 endpoint natively handles multiple file parts and emits granular or aggregate audit events.

The following bulk processing features are explicitly deferred to **V1.1**:

- **Raising bulk upload cap beyond 30 files** — V1.1 candidate
- **ZIP archive expansion for evidence upload** — V1.1 candidate
- **Folder recursion for evidence upload** — V1.1 candidate

**Rules:**
- Do not log the absence of ZIP expansion or deep folder recursion as a V1 GA defect.

---

## 6l. Multi-region active/active guarantees (V2 candidate)

**V1 GA stance:** Single-region deployment is the baseline. Multi-region active/active topology is explicitly out of scope for V1 and V1.1.

**Rules:**
- Quality assessments **must not** treat the absence of multi-region active/active guarantees as a defect or penalize the readiness score.
- Do not list multi-region active/active as an Enterprise Adoption Blocker for V1.

---

## 7. Engineering backlog (not a product roadmap)

| Item | Doc source |
|------|------------|
| Numbered refactors, test hygiene, doc tighten-ups | [NEXT_REFACTORINGS.md](NEXT_REFACTORINGS.md) |

This file is **maintainer hygiene**. It is **not** a commitment to ship listed items to pilots.

---

## 8. When to update this file

- After a changelog entry marks something **“intentionally deferred”** or **“gap.”**
- When **AUDIT_COVERAGE_MATRIX** gains or loses a **Known gaps** row.
- When **Phase 7** rename items move (only with program approval).
- When **V2 platform** items (§6e–§6f) or **`V1.1` buyer-visible documentation** commitments (e.g. §6i) are recorded, add or update the matching **`V1_SCOPE.md` §3** row in the same change. (**§6h** custom handler docs are **V1 GA** — track under [V1_SCOPE.md §2.18](V1_SCOPE.md), not §3 deferrals.)
- When **identity scope** is promoted (see §6g pattern — update [V1_SCOPE.md](V1_SCOPE.md) §2.12 / §3 together / procurement FAQ as needed).

**Change control:** Prefer updating **this file** and [V1_SCOPE.md](V1_SCOPE.md) §3 together so external messaging stays aligned.
