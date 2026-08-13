> **Scope:** Contributor-reference — ArchLucid V1 — scope contract - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid V1 — scope contract

**Audience:** Product, engineering, pilots, and operators who need a single, decisive boundary for what "V1" means in this repository.

**Status:** Contract for the current codebase and docs. It describes what is implemented and supportable today, not a roadmap of net-new capabilities.

This scope document lists in-scope capabilities, explicit out-of-scope items, the operator happy path, and minimum release checks. Naming and rename posture are summarized in **Related** below.

---

## Related

- **[README.md](../REPOSITORY_README.md)** — repo overview and install spine
- **[GLOSSARY.md](GLOSSARY.md)** — terms and naming
- **[BREAKING_CHANGES.md](../../BREAKING_CHANGES.md)** — breaking change trail
- **[V1_DEFERRED.md](V1_DEFERRED.md) Â§3** — remaining rename / Terraform brownfield cleanup (canonical pointer after checklist retirement)
- **[ARCHITECTURE_ON_ONE_PAGE.md](../ARCHITECTURE_ON_ONE_PAGE.md)** — architecture poster
- **[OPERATOR_ATLAS.md](OPERATOR_ATLAS.md)** — operator atlas
- **[V1_MAGIC_GUARDRAILS.md](V1_MAGIC_GUARDRAILS.md)** — bounded V1 AI experience affordances vs future-scope autonomy

---

## 1. What this document does

- States **what is in V1** (must work for a pilot).
- States **what is out of V1** (deferred, optional, or non-goals).
- Defines the **core operator happy path** and **minimum release checks** aligned with existing scripts and guides.

For deeper flow detail, use **[First-run evidence checklist](../runbooks/FIRST_PILOT_OPERATOR_PATH.md#printable-first-run-evidence-checklist)** (`FIRST_RUN_EVIDENCE_CHECKLIST.md` alias), **[First architecture review walkthrough](CANONICAL_FIRST_RUN_PATH.md#first-architecture-review-walkthrough)**, [LIVE_E2E_HAPPY_PATH.md](LIVE_E2E_HAPPY_PATH.md), and [ARCHITECTURE_FLOWS.md](ARCHITECTURE_FLOWS.md).

**Deferred / exploratory inventory (doc-sourced):** [V1_DEFERRED.md](V1_DEFERRED.md) — consolidates partial stories so V1 does not read as open-ended.

---

## 2. In scope for V1 — organized by product layer

V1 capabilities map to **two** product layers (**Pilot** and **Operate**). See [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) for the full inventory, [CORE_PILOT.md](../CORE_PILOT.md) for the first-pilot walkthrough, and [OPERATOR_DECISION_GUIDE.md](OPERATOR_DECISION_GUIDE.md) for when to stay in **Pilot** versus expand into **Operate**.

---

### Layer 1 — Pilot

The minimum set every pilot must complete. Delivered by default; no additional configuration beyond API + SQL.

#### 2.1 Review lifecycle: request → execute → commit

- Create a **review** from a structured **architecture request** (`POST /v1/architecture/request`) **or** from the operator **guided intake** path (`POST /v1/architecture/draft` → admit → submit).
- Drive the **review** through **execution** so agent work completes under the configured **simulator or real** execution mode.
- **Finalize** an **architecture package** (API: golden manifest via `POST /v1/architecture/review/{runId}/finalize`), with documented state and conflict behavior ([API_CONTRACTS.md](API_CONTRACTS.md)).
- End-to-end request → execute → commit behavior, including convergence on manifests and artifacts, is described in [ARCHITECTURE_FLOWS.md](ARCHITECTURE_FLOWS.md).

#### 2.2 Manifest and artifact review

- **API:** list and download manifest-scoped artifacts; export-related endpoints per OpenAPI/Swagger.
- **CLI:** `artifacts`, `status` per [CLI_USAGE.md](CLI_USAGE.md).
- **Architect workspace:** reviews list, review detail (legacy labels may still say *Runs*), manifest summary, artifact review, and download ([operator-shell.md](operator-shell.md)).

#### 2.3 Export and package generation

- **Markdown/DOCX** exports and **replay** from persisted export records ([ARCHITECTURE_FLOWS.md](ARCHITECTURE_FLOWS.md)).
- **ZIP** downloads (bundle and run-export) from **review** detail.

#### 2.4 Deployability and supportability

- **Container images** and **docker compose** profiles ([../engineering/../engineering/CONTAINERIZATION.md](../engineering/CONTAINERIZATION.md)).
- **SQL Server** persistence via DbUp migrations; automatic on startup ([SQL_SCRIPTS.md](SQL_SCRIPTS.md)). **`SystemWithPerTenantCatalogs`** (**database-per-tenant** with **`TenantDatabaseBindings`** and a control-plane system catalog) is the **only supported multitenant isolation model for hosted workloads**, **including self-serve trial tenants** ([TENANT_DATABASE_TOPOLOGY.md](TENANT_DATABASE_TOPOLOGY.md)). **`SingleCatalog`** remains available for narrow **developer/CI ergonomics**, not as a substitute for tenant isolation on hosted SaaS.
- **Hosted SaaS LLM execution (real mode):** On **ArchLucid-operated** deployments, agent **real** execution uses **platform-provisioned Azure OpenAI** from environment configuration (**`AzureOpenAI:*`** / Key Vault-backed secrets — [CONFIGURATION_REFERENCE.md](CONFIGURATION_REFERENCE.md)). The **standard hosted and trial-tenant path** does **not** treat customer-supplied model endpoints as a prerequisite for normal operation, and **sales-engineer-assisted LLM onboarding is not a V1 gate** on that path. **Self-hosted** installs, deliberate **simulator** environments, or **bring-your-own** inference endpoints remain configuration-owned per [README.md](../REPOSITORY_README.md).
- **Health:** `/health/live`, `/health/ready`, `/health`; `GET /version` for support attribution.
- **Correlation IDs**, **CLI diagnostics** (`doctor`, `support-bundle`), and **Troubleshooting** runbooks.
- **Authentication modes:** development bypass, JWT bearer, API key ([README.md](../REPOSITORY_README.md)).
- **Infrastructure-as-code** examples (Terraform modules under `infra/`).

---

### Layer 2 — Operate

**Operate** is the second buyer-facing layer. It includes deeper investigation and comparison tools (available once you have at least one finalized **review**; in the architect workspace, enable via **Show more links** in the sidebar) **and** governance, auditability, and compliance tooling (configuration-driven; most features require explicit enablement; full surface visible after enabling extended/advanced links in the sidebar).

#### 2.5 Compare

- **Two-review** comparison: structured golden-manifest deltas + legacy diff + optional AI explanation ([COMPARISON_REPLAY.md](COMPARISON_REPLAY.md)).
- Architect workspace: **Compare two reviews** workflow ([operator-shell.md](operator-shell.md)).

#### 2.6 Replay

- **Comparison replay** (artifact vs regenerate vs verify modes) for persisted comparison records.
- **Authority replay** (authority chain re-validation; UI may still label *Run replay*) with validation flags surfaced in the architect workspace.

#### 2.7 Graph

- **Knowledge / provenance / architecture graph** for a single **review** in the architect workspace ([KNOWLEDGE_GRAPH.md](KNOWLEDGE_GRAPH.md)).

#### 2.8 Advisory, Q&A, and pilot signals

- **Ask** — natural-language queries against architecture context.
- **Advisory scans** — architecture digests and scheduled scans.
- **Pilot feedback** — rollup and triage of product learning signals.
- **Planning materialization (59R)** — bounded, deterministic drafting of improvement **themes** and **plans** from ranked pilot-feedback opportunities via **`POST /v1/learning/planning/materialize`** (**ExecuteAuthority**); operator-triggered; ties evidence with **pilot signal** links only; does **not** mutate prompts, agents, or governance packs ([`PRODUCT_LEARNING.md`](PRODUCT_LEARNING.md) Â§4.1–Â§4.2, [`LearningController.cs`](../../ArchLucid.Api/Controllers/Advisory/LearningController.cs)). **Planning bridge UX (V1 GA)** — dedicated in-shell flow on **`/product-learning`** ( **`PlanningBridgePanel`**) to align **`since`** / **`maxPlansToMaterialize`** with the dashboard, invoke **`POST /v1/learning/planning/materialize`**, surface **`ProductLearningPlanningMaterializeResult`**, and deep-link operators to **`/planning`** ([`PRODUCT_LEARNING.md`](PRODUCT_LEARNING.md) Â§4.2).
- **Recommendation learning** — learning profiles per **review**.
- **Cross-run sponsor ROI summary (V1 GA)** — tenant-scoped portfolio rollup for sponsor dashboards: **`GET /v1/roi/sponsor-summary`** ([`ExecutiveRoiSummaryService`](../../ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs), [`PILOT_SCORECARD_API.md`](PILOT_SCORECARD_API.md)); architect workspace panel on Home ([`ExecutiveRoiSummarySection`](../../archlucid-ui/src/app/(operator)/architecture/sponsor-dashboard/_sections/ExecutiveRoiSummarySection.tsx)). **Authoritative aggregation model (owner 2026-05-22, clarified 2026-06-06):** ROI is **not** one monolithic algorithm across every surface — it is a **layered model of single-source primitives plus explicitly-scoped totals**:
  - **Selection + dedup (single source):** include the **latest committed run per system** ([`ExecutiveRoiSummaryService.CollectLatestCommittedRunPerSystemAsync`](../../ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs)); when the same stable **`FindingId`** appears across included runs, **deduplicate by unique finding identity** ([`ExecutiveRoiFindingDeduplicator`](../../ArchLucid.Application/Roi/ExecutiveRoiFindingDeduplicator.cs)) before counting (do **not** raw-sum duplicate CI reruns; do **not** use max-only).
  - **Per-finding savings math (single source):** [`TenantAdjustedFindingsSavingsCalculator`](../../ArchLucid.Application/Roi/TenantAdjustedFindingsSavingsCalculator.cs) (tenant-rate + EA-discount adjusted; acceptance-gated). Per-run **`GET /v1/architecture/review/{runId}/roi`** and per-system rows both resolve through this via [`TenantEstimatedUsdSavingsResolver`](../../ArchLucid.Application/Roi/TenantEstimatedUsdSavingsResolver.cs).
  - **Authoritative portfolio headline = disposition-aware basis:** the sponsor-summary `TotalEstimatedUsdSavings` is **open + needs-evidence** estimated USD from [`DispositionAwareRoiBasisCalculator`](../../ArchLucid.Application/Roi/DispositionAwareRoiBasisCalculator.cs) (waived / accepted / deferred / realized / rejected are partitioned out), **not** a naive sum of per-system rows — so per-system `EstimatedUsdSavings` rows are pre-disposition components and **will not necessarily add up to the headline**. The **board-pack export** delegates to the same service and is identical by construction.
  - **Explicitly distinct scopes (not forced to match the portfolio headline):** the **value report** is a **30-day review-cycle window** ([`ValueReportSnapshot`](../../ArchLucid.Application/Value/ValueReportBuilder.cs)) answering "recent activity", and **per-run ROI** is a single-run component. These are labeled, scope-specific numbers by design.
  - **Cross-tenant portfolio (aligned 2026-06-06, T2-6):** [`GetCrossTenantPortfolioSummaryAsync`](../../ArchLucid.Application/Roi/ExecutiveRoiSummaryService.cs) sums the **same disposition-aware headline basis** per accessible tenant and emits `headlineSavingsScopeCode` / `portfolioScopeDescription` so multi-tenant totals cannot be misread next to single-tenant headlines or value-report windows.
- **Integration events** (optional Azure Service Bus, CloudEvents envelope, **outbound HTTPS webhook** subscriptions to customer collectors) — **In scope for V1.1** as a **buyer-contract** integration surface ([INTEGRATION_EVENTS_AND_WEBHOOKS.md](INTEGRATION_EVENTS_AND_WEBHOOKS.md)). **V1 GA** does **not** treat Service Bus fan-out, signed webhook delivery, or recipe-driven bridges as **committed** integration obligations — the **V1** buyer bar for automation remains **REST**, **CLI**, **architect workspace**, and **Â§2.16+** HTTP surfaces until **V1.1**.

Use these surfaces when the next question is analytical: what changed, why it changed, what the architecture or provenance graph shows, or how two **reviews** differ.

#### 2.9 Governance workflows

- **Approval workflow** with segregation of duties (self-approval blocked), SLA tracking, and webhook escalation on breach.
- **Pre-finalize governance gate** — `ArchLucid:Governance:PreCommitGateEnabled` blocks architecture-package finalize when findings exceed configured severity thresholds ([PRE_COMMIT_GOVERNANCE_GATE.md](PRE_COMMIT_GOVERNANCE_GATE.md)).
- **Policy packs** — versioned rule sets with scope assignments and effective governance resolution.
- **Governance dashboard** — cross-review pending approvals and policy change summary.

#### 2.10 Audit and compliance

- **78 typed audit events** in an append-only SQL store with CSV export ([AUDIT_COVERAGE_MATRIX.md](AUDIT_COVERAGE_MATRIX.md)).
- **Audit log** — filter by event type, actor, run ID, correlation ID, time window.
- **Tenant isolation: database-per-tenant catalogs (ADR 0037)** — `SystemWithPerTenantCatalogs` topology + app-layer scope predicates.
- **Compliance drift trend** — tracking and architect workspace chart.

#### 2.11 Alerts

- **Alert rules, routing, composite rules, tuning** — configurable alert pipeline.
- **Alert inbox** — open and acknowledged alerts with correlation to **reviews** and manifests.
- **Alert simulation** — evaluate rules against synthetic payloads.

#### 2.12 Trust and access

- **JWT bearer (`ArchLucidAuth:Mode=JwtBearer`) — OIDC issuers**
  - **Microsoft Entra ID** — reference Terraform sample (`infra/terraform-entra/`), app roles, audience wiring.
  - **Generic OIDC IdPs** — **In scope for V1 GA** (**owner 2026-05-09**): configure **`ArchLucidAuth:Authority`** (and related JWT/OIDC settings) against **any standards-compliant OIDC issuer** (metadata discovery + JWKS); map IdP claims to **`ArchLucidRoles`** per **[SECURITY.md](contributor-reference/SECURITY.md)** and **[CONFIGURATION_REFERENCE.md](CONFIGURATION_REFERENCE.md)**. Entra remains the **default documented path** for hosted SaaS; Okta / Auth0 / Ping / Keycloak-style integrations use the **same** **`JwtBearer`** surface with tenant-specific configuration.
- **Native SAML 2.0 Service Provider (workforce SSO)** — **In scope for V1 GA** (**owner 2026-05-15**): ArchLucid operates as a SAML **SP** against customer IdPs that mandate SAML Web SSO (**HTTP-Redirect / POST**, signed assertions, metadata exchange — profile details finalized in **`SECURITY.md`** / **`CONFIGURATION_REFERENCE.md`** at implementation). **Coexistence:** **`JwtBearer`** OIDC paths above remain **first-class**; tenants enable **either** SAML SP configuration **or** OIDC issuer wiring per environment (mutually exclusive primary workforce SSO mode per tenant deployment unless separately promoted for dual-stack). Mapped identities and **`ArchLucidRoles`** must meet the **same RBAC and tenant isolation bar** as JWT bearer authentication; SAML login emits durable audit parity with OIDC sign-in events.
- **API key** automation surface where environments allow it; **RBAC roles** (Admin / Operator / Reader / Auditor).
- **SCIM 2.0 inbound provisioning** — dedicated `ScimBearer` automation surface (`/scim/v2/*`) with per-tenant bearer tokens, group→role mapping, and enterprise seat accounting ([`docs/integrations/SCIM_PROVISIONING.md`](../integrations/SCIM_PROVISIONING.md), ADR [`0032`](../architecture/adrs/0032-scim-v2-service-provider.md)).
- **Private endpoints** and WAF Terraform modules; no SMB/445 public exposure.
- **DPA template, subprocessors register, SOC 2 roadmap** ([go-to-market/trust-center.md](../go-to-market/trust-center.md)).

Use these surfaces when the next question is governance or trust: approvals, policy enforcement, audit evidence, compliance drift, alerts, or operational control.

#### 2.13 First-party ITSM connectors (Jira, ServiceNow)

**In scope for V1 GA (promoted from V1.1 — owner scope 2026-07-03).** First-party **Jira** and **ServiceNow** connectors are **committed V1 GA product obligations**, superseding the *Resolved 2026-05-18* V1.1-window pinning: [`CONNECTOR_READINESS_MATRIX.md`](CONNECTOR_READINESS_MATRIX.md) shows both as **Shipped + manual vendor** — outbound create, inbound status sync, per-tenant credentials (**TB-392**), and settings write API (**TB-393**) all ship with automated conformance tests plus a live-vendor validation script (`scripts/integrations/validate-itsm-live.ps1`). **V1 GA** ITSM- / docs- / chat-shaped workflows now include **Jira** and **ServiceNow** first-party connectors **in addition to** **REST**, **CLI**, **architect workspace**, **SCIM**, **Azure DevOps** / **GitHub** PR and manifest decoration, **`GET /v1/compare`**-style CI surfaces, and the **Azure extractor ZIP** path (**Â§2.16**). **CloudEvents webhooks** and **customer-operated** recipes under [`docs/integrations/recipes/`](../integrations/recipes/README.md) remain **V1.1** (**Â§2.8**, **Â§3**) — not part of this promotion. **Implementation sequencing (historical, now shipped):** **ServiceNow** before the **Atlassian** first-party surfaces. **Atlassian pair** (**Jira** here + **Confluence** in Â§2.15): engineered as **one workstream** — **Confluence** publish **before** **Jira** issue depth (**owner policy 2026-05-05**). Historical *Resolved 2026-04-27* **ServiceNow-before-Jira** ordering was superseded for **Atlassian** by *Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)* in [PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md). Atlassian Marketplace and ServiceNow Store listings **may trail** functional connectors — listing publication is **not** a V1 GA gate. **Tightening backlog (V1 GA, not blocking):** OAuth 2.0 upgrade from the basic-auth/API-token MVP (**TB-600**). **TB-599** (native-create default posture) **Done 2026-07-03** — `Integrations:Itsm:NativeEnabled` defaults **`true`** with documented deployment opt-out. **TB-398** (full enterprise connector — OAuth flows, field-mapping UI, workflow mapping, tenant onboarding wizard) stays **V2**, out of this promotion's scope.

**Owner unblocker — ServiceNow engineering tenant (2026-05-15):** **V1 GA** validation includes bidirectional ServiceNow sync (**ServiceNow row below**). Engineering validation assumes the owner provisions a **cost-free** ServiceNow **Developer Program** / personal developer-style instance — **not** a paid sandbox SKU. Until that instance exists, connector validation may be **queued** — track owner / engineering status in **[PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md)**; **[V1_SCOPE.md](V1_SCOPE.md)** Â§2.13 stays authoritative unless explicitly amended there.

- **ServiceNow** — Incident creation from Authority-shaped findings (`incident` table) with correlation back-link; basic-auth patterns. **`cmdb_ci`** — when set — uses the **`cmdb_ci_appl`** class: match **`SystemName`** to CMDB **`name`**, set **`cmdb_ci`** to the matched **`sys_id`**, or leave empty when no match; optional tenant flag **`ServiceNow:AutoCreateCmdbCi`** (default **`false`**) may create an Application CI when no match exists. **Two-way status sync** (ServiceNow → ArchLucid finding state) **ships in V1 GA** — status-only sync using a configurable per-tenant mapping (default: `New`/`In Progress` → `Open`/`InProgress`; `Resolved`/`Closed` → `Resolved`); OAuth 2.0 is a **V1 GA tightening backlog item** (**TB-600**) (*Resolved 2026-05-06 (ITSM bidirectional sync — both connectors)* in [PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md)).
- **Jira** — Issue creation from findings with correlation back-link; **bi-directional status sync** (Jira → ArchLucid finding state) **ships in V1 GA** using a configurable per-tenant mapping (default: `To Do` → `Open`; `In Progress` → `InProgress`; `Done` → `Resolved`); OAuth 2.0 / API token auth (*Resolved 2026-05-06 (ITSM bidirectional sync — both connectors)*).

**First-party outbound create (minimal slice)** — operators with **ExecuteAuthority** call **`POST /v1/integrations/itsm/outbound/issues`** with `{ "provider": "Jira" | "ServiceNow", "findingId": "…" }` to open a ticket from the persisted **Authority-shaped** finding payload. Deployment defaults live under **`Integrations:ItsmOutbound`** in configuration; optional per-tenant overrides (e.g. Jira project key override, **`JiraSendInfoSeverity`**, issue-type-by-severity JSON, **`ServiceNowAutoCreateCmdbCi`**) are stored in **`dbo.TenantItsmOutboundSettings`**. Successful creates persist **`dbo.ItsmFindingCorrelations`** so inbound webhooks can sync status. Durable audit event types include **`Integration.JiraIssueCreateSucceeded`**, **`Integration.JiraIssueCreateSkipped`**, **`Integration.JiraIssueCreateFailed`**, and the ServiceNow **`Integration.ServiceNowIncidentCreate*`** counterparts. **Note (2026-07-03, TB-599):** the deployment flag **`Integrations:Itsm:NativeEnabled`** defaults **`true`** for V1 GA; set **`false`** only when a deployment needs outbound create disabled while clipboard export and correlations remain enabled.

Until **V1.1** surfaces in **Â§2.8** (integration events) and **Â§3** (CloudEvents webhooks, customer-operated recipes) are available in a given environment, the **V1 GA** buyer contract for comparable event-fan-out automation remains **REST**, **CLI**, **architect workspace**, **SCIM**, **Azure DevOps** / **GitHub** CI decoration, and other **V1 GA** paths enumerated in **Â§2** (which now includes **Jira**, **ServiceNow**, **Confluence**, **Slack**, and **Microsoft Teams** first-party connectors per **Â§2.13–Â§2.15**) — not generic **webhook** or **recipe** bridges.

#### 2.14 Microsoft Teams and Slack (first-party chat-ops)

**In scope for V1 GA (promoted from V1.1 — owner scope 2026-07-03).** **Microsoft Teams** incoming-webhook notification delivery for the canonical integration-event catalog (per-tenant connections, **Azure Key Vault** secret-name references, **`EnabledTriggersJson`**, Authority-shaped payloads, optional Logic Apps fan-out per deployment — [`MICROSOFT_TEAMS_NOTIFICATIONS.md`](../integrations/MICROSOFT_TEAMS_NOTIFICATIONS.md)) **and** first-party **Slack** outbound notification sink with **parity** to the Teams path: same per-tenant **`EnabledTriggersJson`** opt-in matrix (and canonical trigger / event-type catalog), secret material in **Azure Key Vault** with only a **secret-name** reference persisted in SQL, and the same Authority-shaped payloads used by existing webhook delivery (`DigestSlackWebhookDeliveryChannel`, `AlertSlackWebhookDeliveryChannel`, alert routing) are **committed V1 GA buyer-contract chat-ops surfaces**, superseding the *Resolved 2026-05-18* V1.1-window posture. Per [`CONNECTOR_READINESS_MATRIX.md`](CONNECTOR_READINESS_MATRIX.md) both ship **Shipped + manual vendor**. **Slack App Directory** listing, OAuth-based Slack app installation UX, and **in-Slack interactive actions** (acknowledge / approve) remain **not committed** for V1 GA or V1.1 unless a separate owner decision adds them (see [`V1_DEFERRED.md`](V1_DEFERRED.md) Â§6a). **Tightening backlog:** live-vendor validation script parity with Jira/ServiceNow's `scripts/integrations/validate-itsm-live.ps1` (**TB-601**).

#### 2.15 Confluence (first-party documentation publish)

**In scope for V1 GA (promoted from V1.1 — owner scope 2026-07-03).** First-party **Confluence Cloud** connector to **publish** architecture findings or **review** summaries as pages in a customer space ships **Shipped + manual vendor** per [`CONNECTOR_READINESS_MATRIX.md`](CONNECTOR_READINESS_MATRIX.md), superseding the *Resolved 2026-05-18* V1.1-window posture. **Minimum viable shape:** **one-way** publish to a **single fixed `Confluence:DefaultSpaceKey`** per tenant configuration (**3a** — no multi-space or dynamic routing in the shipped shape unless an owner decision extends it). **Authentication** (**3b**): **Confluence API token** with **basic auth** for the shipped MVP; **OAuth 2.0** is a **V1 GA tightening backlog item** (**TB-600**) if a buyer requires it. **Implementation sequencing (historical, now shipped):** Same as Â§2.13 — **ServiceNow** first; then **Confluence** **before** **Jira** inside the **paired Atlassian** workstream (*Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)* in [`PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)). Atlassian Marketplace listing **may trail** a usable connector — listing publication is **not** a V1 GA gate.

#### 2.16 Customer-controlled Azure extractor (PowerShell + ZIP) and ingest

**In scope for V1 GA** — a customer-controlled Azure config and cost extraction path that requires **no ArchLucid credentials in the customer tenant** (*Resolved 2026-05-06 owner decision*).

- **`Get-ArchLucidAzurePackage.ps1`** — signed, auditable PowerShell script customers download, review, and run inside their own Azure environment. Collects ARM resource inventory (`-SubscriptionId`, optional `-ResourceGroupScope`), and optionally Azure Cost Management actual/amortized costs, Advisor cost recommendations, and orphan candidates (`-IncludeCost` switch). Appends public Azure Retail Prices API rows for collected SKUs for Retail-rate scenario citation. Never collects secrets, Key Vault contents, or certificate private keys.
- **Schema-versioned ZIP output** — `manifest.json` (schema version, script version, collection timestamp UTC, subscription id, switches used), `resources.json`, `cost-actual.json` / `cost-amortized.json` / `advisor-cost.json` / `orphan-candidates.json` (when cost enabled), `retail-prices.json`, `README.txt`.
- **Ingest endpoint** — `POST /v1/azure-extractor/upload`: validates schema version (rejects unknowns), stores the package, associates it with a **review** (`runId` in API/SQL), emits durable audit events. Requires ExecuteAuthority.
- **Citation contract** — cost or savings lines in the evidence bundle that derive from an uploaded ZIP must cite the `manifest.json` `collectionTimestamp` and schema version as the proof point, satisfying the exact + citation-backed cost doctrine.
- **Access posture** (document in trust center and extractor README):
  - **Tier 1 (default):** No vendor access to customer cloud whatsoever.
  - **Tier 2 (opt-in continuous):** Customer-provisioned service principal with `Reader` + `Cost Management Reader` scoped to subscription or management group; federated workload identity preferred over long-lived secrets. `AzureExtractorAutoPullHostedService` continuous pull already **shipped** (default off via `AzureExtractor:AutoPull:Enabled`).
  - **What ArchLucid will never request:** `Global Reader` (Entra ID directory role), `Owner`, `Contributor`, `User Access Administrator`, or any write/destructive role. Publish this list in the trust center.
- **V1 backlog (owner scope 2026-07-05; promoted from the prior "V1.x" framing, `V1_DEFERRED.md` Â§6p history):**
  - **ArchLucid-hosted Cost Management merge** on the GET-only ARM path for Tier 2 continuous polling (today's hosted poller collects resource inventory; cost-data merge into the same hosted flow is not yet implemented).
  - **Operational runbooks** for fleet-scale auto-pull cadence tuning (poll frequency, leader-election lock contention, per-subscription rate-limit guidance) once more than a handful of tenants enable `AzureExtractor:AutoPull:Enabled`.

#### 2.17 Terraform export and advisory emit

**In scope for V1 GA** — two Terraform capabilities sharing the **advisory-only, never-apply** constraint (*Resolved 2026-05-06 owner decision*).

- **Export current Azure state to Terraform:** wrap the official Microsoft `aztfexport` tool (https://github.com/Azure/aztfexport) — do not reimplement. CLI command or operator action produces a downloadable Terraform ZIP. Every generated file includes a generated `ADVISORY.md`: "This Terraform was generated by ArchLucid acting as your AI co-architect. Review before applying. ArchLucid never applies or destroys resources."
- **Advisory Terraform recommendation emit:** for findings that produce a right-sizing, removal, or configuration-change recommendation, emit a plan-only Terraform snippet alongside the finding. Every block is annotated `# ArchLucid advisory – review before apply` and cites the finding id, recommendation id, and (for cost/savings recommendations) the ZIP `manifest.json` `collectionTimestamp` and Retail price row.
- **Hard constraints (never regress):**
  - No `destroy` resource blocks without an explicit UI confirm gate; if orphan removal requires destroy, emit a reference + explanation comment only.
  - ArchLucid never calls `terraform apply` or `terraform destroy` on behalf of any customer. Test for absence of these code paths.
  - `terraform fmt` and `terraform validate` must pass in CI for representative generated snippets; snapshot tests required.

#### 2.18 Customer-facing documentation — custom agent handlers

**In scope for V1 GA** — pattern-level documentation for advanced integrators (buyer engineering or self-hosted operators) describing how to **add or register a custom agent handler** aligned with the product orchestration contracts: prerequisites, safety/authority posture, registration expectations, and versioning boundaries (*promoted 2026-05-12; supersedes prior V2-only deferral in [V1_DEFERRED.md Â§6h](V1_DEFERRED.md)*).

- **What this is:** guides and clarity — canonical guide [`CUSTOM_AGENT_HANDLER_GUIDE.md`](CUSTOM_AGENT_HANDLER_GUIDE.md) (in-repo registration, safety posture, tests, non-goals); out-of-process boundary in [`CUSTOM_AGENT_HANDLERS.md`](CUSTOM_AGENT_HANDLERS.md). Linked from [`START_HERE.md`](../START_HERE.md), [`onboarding/day-one-developer.md`](../onboarding/day-one-developer.md), and [`CONTRIBUTOR_CODE_MAP.md`](CONTRIBUTOR_CODE_MAP.md).
- **What this is not:** no **mandatory** third-party plugin SDK, marketplace listing, or new public HTTP contracts unless separately promoted (**speculative ecosystem** row in Â§3 below remains unchanged).

#### 2.19 Multi-cloud architecture **analysis** (AWS and GCP targets; Azure-hosted product) — **promoted to V1 (owner scope 2026-07-05)**

**Supersedes** the **V1.1** deferral recorded 2026-05-19. ArchLucid remains **hosted on Azure** per [ADR 0020](../architecture/adrs/0020-azure-primary-platform-permanent.md); the ability to **analyze customer architectures whose primary target cloud is AWS or GCP** is now **in contract for V1 GA**, not V1.1.

**Already shipped (verified in code, 2026-07-05):**

- **`CloudProvider.Aws`** and **`CloudProvider.Gcp`** exist on the `CloudProvider` enum (`ArchLucid.Contracts/Common/CloudProvider.cs`) alongside `None` and `Azure`.
- **Tier 2 hosted automated polling** for both AWS (**TB-402**) and GCP (**TB-403**) shipped 2026-06-27 — hosted poller with a minimal read-only credential (IAM role for AWS, Workload Identity Federation for GCP), scheduled re-poll, upload endpoints, and `/settings/cloud-connections` management UI, at **full parity with the Azure Tier 2 extractor** (Â§2.16). This exceeds the original Phase 3 "Tier 1, no ArchLucid credentials" plan below — Tier 2 was promoted and shipped separately, ahead of this section catching up in writing.

**Remaining work now committed for V1 (former Phases 1–2, 4):**

- **Terraform ingestion** for AWS/GCP declarations (`simple-terraform`, `terraform-show-json`) with resource classification into existing **`CanonicalObject`** types (`TopologyResource`, `SecurityBaseline`, `PolicyControl`) — parsers already ingest any provider's HCL/JSON; object-type resolution and cost copy need to stop assuming Azure.
- **Illustrative infrastructure cost** lines and human-readable service labels for AWS/GCP platforms (no false "Azure Retail" attribution when the request target is Aws/Gcp).
- **Live public pricing** enrichment where AWS Price List / GCP Cloud Billing Catalog probes succeed, with illustrative fallback rows when they do not.
- **Cloud-aware agent context** so findings and cost narratives reference the **target** provider when `CloudProvider` is Aws or Gcp.
- **Customer-controlled inventory ZIP** upload path (Tier 1 fallback, no ArchLucid credentials in customer account) for parity with **Â§2.16** Azure extractor posture, alongside the Tier 2 hosted path above.

**Explicit non-goals (unchanged hosting posture):**

- **Not in V1:** production hosting of ArchLucid on AWS or GCP; Entra ID replacement; Service Bus / Azure SQL / Blob / Azure AI Search replacement for the **product** control plane.
- **Not committed unless separately promoted:** single review merging Azure + AWS + GCP graphs in one run; AWS/GCP-native Well-Architected certification parity.

**V1 GA posture:** `CloudProvider.None` (evidence-only reviews), `CloudProvider.Azure` (Azure-target or Azure-extractor evidence), and `CloudProvider.Aws`/`CloudProvider.Gcp` (Tier 2 hosted polling shipped; full analysis-path parity — Terraform classification, costing, cloud-aware agent context, Tier 1 ZIP fallback — in active development) are all **in scope for V1 GA**. AWS/GCP-primary buyers are a **V1 GA** fit as of this promotion, not a V1.1 deferral.

#### 2.20 Advanced RAG (Graph-RAG, Single-Pass Query Expansion, Fine-Tuning)

**In scope for V1 GA; maturity corrected 2026-07-03** — Advanced retrieval and learning mechanisms pulled forward from the V2 backlog to maximize insight density and agent readiness. A code-level audit found this section previously overstated completeness (see [V1_DEFERRED.md Â§6q](V1_DEFERRED.md) for full evidence and backlog items **TB-594**, **TB-595**, **TB-596**; **TB-597 closed 2026-07-03**; **TB-598 closed 2026-07-04**).

- **Graph-RAG over knowledge/provenance graph (`RAG-V2-001`)**: Querying the stable schema (ADR 0036) to extract relational context beyond standard vector similarity. **Shipped scope:** bounded multi-hop neighbor expansion (`GraphRagNeighborExpander` + `GraphRagBoundedNeighborCollector`; default hop budget 2, cycle-safe breadth-first traversal, configurable via `Retrieval:Advanced:MaxGraphTraversalHops`), not community summarization; quality is explicitly flagged "unproven without a production vector index" by the feature's own config lint (**TB-597 closed 2026-07-03**). Community summarization scope options recorded in **[ADR 0057](../architecture/adrs/0057-graph-rag-community-summarization-scope-decision.md)** (2026-07-05) — recommendation is to keep it deferred pending G-REAL-06 pilot signal.
- **Single-pass query expansion + managed semantic reranking (`RAG-V2-002`)**: Hypothetical Document Embeddings (HyDE), LLM query rewriting, and Azure AI Search semantic reranking to improve recall over raw vector similarity. **Shipped scope:** one LLM completion for query rewrite, one for HyDE, then managed semantic rerank — real and LLM-backed, but **not** an iterative retrieve-critique-retry loop or query decomposition across multiple hops. Internal type names retain `Agentic*` for stability; buyer-facing and scope docs use **single-pass query expansion** (**TB-598 closed 2026-07-04** — owner chose relabel over iterative loop pending G-REAL-06 pilot signal; **TB-595** ablation quantifies per-flag contribution on golden fixtures).
- **Online fine-tuning (`RAG-V2-003`)**: Continuous learning on accepted manifests (requires explicit DPA and owner ADR). **Shipped foundation (2026-07-03, TB-594):** tenant-consent-gated export, Azure OpenAI job orchestration seam, model registry, and golden-cohort promotion gate — **disabled by default** until tenant enables `FineTuning.ManifestConsent` and eval promotion succeeds.

---

## 3. Out of scope for V1 (explicit non-goals or V1.1+)

**Procurement narrative:** [`../go-to-market/INTEGRATION_CATALOG.md`](../go-to-market/INTEGRATION_CATALOG.md) is the buyer-facing integration commitment summary. Update this engineering contract first, then refresh the catalog rather than duplicating commitment-boundary tables across docs.

| Area | Rationale |
|------|-----------|
| **Global Reader or write-role access to customer Azure tenants** | ArchLucid will never request `Global Reader` (Entra ID directory role), `Owner`, `Contributor`, `User Access Administrator`, or any write or destructive ARM role. Tier 1 ingestion requires no vendor access; Tier 2 opt-in uses `Reader` + `Cost Management Reader` only. Publish in trust center. |
| **`terraform apply` or `terraform destroy` on behalf of customers** | All Terraform emit is advisory and plan-only. ArchLucid never issues apply or destroy against customer infrastructure. Orphan removal that requires destroy surfaces as an annotated recommendation comment, not an executable block. Enforced and tested. |
| **Advanced autonomous planning** | Agents are **orchestrated** with explicit tasks and execution modes; V1 does not promise open-ended self-directed multi-step planning beyond what the implemented pipelines already do. |
| **Broad event-bus integrations** | Optional publish/consume paths exist; V1 does **not** include a guaranteed catalog of enterprise integrations, mapping tools, or "any message bus" adapters. Custom consumers are customer-owned. |
| **VS Code (or IDE) shell integration** | No committed product surface for a VS Code–native operator experience; CLI and HTTP remain the primary integration points outside the web UI. |
| **Multi-region active/active product guarantees** | Documentation may describe **tier targets** and failover runbooks ([RTO_RPO_TARGETS.md](RTO_RPO_TARGETS.md)); V1 does not promise a fully specified multi-region SaaS topology out of the box. |
| **Speculative ecosystem** | Marketplace plugins, third-party agent stores, and similar ecosystem features are **not** V1 commitments. **MCP** is **not** V1; it is explicitly a **V1.1** membrane surface — see the MCP row at the end of this table and [V1_DEFERRED.md Â§6d](V1_DEFERRED.md). |
| **CloudEvents webhook subscriptions** and **documented customer-operated bridges** under [`docs/integrations/recipes/`](../integrations/recipes/README.md) **as buyer-contract integration paths** | **V1.1** (owner scope clarification **2026-05-18**). **V1 GA** integration **commitments** for ITSM- / docs- / chat- / event-driven workflows are **REST**, **CLI**, **architect workspace**, **SCIM**, **Azure DevOps** / **GitHub** surfaces (**Â§2** Pilot/Operate + **Â§2.16**), plus first-party **Jira**, **ServiceNow**, **Confluence**, **Slack**, and **Microsoft Teams** connectors (**Â§2.13–Â§2.15**, promoted **2026-07-03** — see [`V1_DEFERRED.md`](V1_DEFERRED.md) Â§6/Â§6a) — not generic webhook/recipe obligations. Implementation may ship earlier; **support / SLA / procurement copy** for the remaining V1.1 channel (CloudEvents webhooks / recipes) follows **Â§2.8**. |
| **Full UI E2E against every live API configuration** | Playwright operator smoke may use **deterministic mocks**; passing it does not replace SQL-backed API validation ([RELEASE_SMOKE.md](RELEASE_SMOKE.md)). |
| **Net-new public HTTP routes that extend only the Coordinator repository family** | After [ADR 0030](../architecture/adrs/0030-coordinator-authority-pipeline-unification.md) closure, new externally-visible surfaces must converge on Authority semantics (or go through the unified read faÃ§ade) — do not add coordinator-only endpoints without an explicit superseding ADR. |
| **Commerce un-hold (Stripe live keys flipped + Marketplace listing published + `signup.archlucid.net` DNS cutover)** | **V1.1 candidate** (Resolved 2026-04-23). Not in V1: no live Stripe keys in production, no `Published` Marketplace SaaS offer, no production DNS cutover for `signup.archlucid.net`. **What is in V1:** all wiring (`BillingStripeWebhookController`, `BillingMarketplaceWebhookController`, `BillingCheckoutController`, `BillingProductionSafetyRules`, `[RequiresCommercialTenantTier]` 402 filter, Marketplace alignment doc, `/pricing` page) plus the trial funnel TEST-mode end-to-end on staging (Improvement 2 in [`LATEST_GPT55.md`](../assessments/LATEST_GPT55.md) Â§3). The V1 commercial motion is **sales-led**: `/pricing` displays numbers, `ORDER_FORM_TEMPLATE.md` drives quote-to-cash. The Stripe-live-keys flip and the Marketplace `Published` state are both **owner-only** (Partner Center seller verification, tax profile, and payout account cannot be filed by the assistant). Tracked under V1.1 in [V1_DEFERRED.md Â§6b](V1_DEFERRED.md). |
| **Signed design partner engagement** (first design-partner or equivalent early-adopter commercial agreement per [`PRICING_PHILOSOPHY.md`](../go-to-market/PRICING_PHILOSOPHY.md) and [`ORDER_FORM_TEMPLATE.md`](../go-to-market/ORDER_FORM_TEMPLATE.md)) | **V1.1 candidate** (Resolved 2026-05-03). Not in V1: no signed or active **design partner** is required for V1 GA or for **`(A)` headline readiness**. **What is in V1:** pricing rows, addendum templates, reference runbooks, and sales-led pilots without a formal design-partner slot. **Independent quality assessments must not** deduct **`(A)`** for absence of a design partner, list it as a headline defect, or bulk-expand “open questions” around design-partner pipeline unless the user explicitly asked for GTM pipeline review — then **`(B)` informational** only (zero weight on **`(A)`**). Tracked under V1.1 in [V1_DEFERRED.md Â§6b](V1_DEFERRED.md). |
| **SOC 2 Type I / II report (CPA-issued SOC examination)** | **Post–V1.1 readiness gate / not headline-scored for V1.1 product readiness** (clarification 2026-05-03). Not in V1 or V1.1 **`(A)` assessments:** no CPA SOC 2 report is required for V1 GA or for V1.1 headline delivery readiness. **What is in V1:** SOC 2 **self-attestation**, trust-center honesty, CAIQ/SIG/DPA/process templates, and roadmap narratives ([`SOC2_SELF_ASSESSMENT_2026.md`](../security/SOC2_SELF_ASSESSMENT_2026.md), [`ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap`](../go-to-market/ASSURANCE_STATUS_CANONICAL.md#soc-2-readiness-roadmap), [`trust-center.md`](../go-to-market/trust-center.md)). **Independent quality assessments must not** deduct **`(A)`** solely for lacking CPA SOC 2; SOC buyer friction stays under **`(B)` procurement-realism** (see `.cursor/rules/Assessment-Scope-V1_1.mdc`). Timing beyond V1.1 is owner-driven — [V1_DEFERRED.md Â§6c](V1_DEFERRED.md). |
| **Third-party pen-test summary publication (vendor redacted summary / Trust Center row)** | **V2 candidate** (owner 2026-05-01; supersedes prior V1.1 Aeronova framing). Not in V1: no **external** third-party pen test, no assessor redacted summary row tied to a vendor engagement. **What is in V1:** owner-conducted penetration-style exercise ([`2026-Q2-OWNER-CONDUCTED.md`](../security/pen-test-summaries/2026-Q2-OWNER-CONDUCTED.md)), self-assessment and CI security gates, SoW + redacted-summary **templates** at [`docs/security/pen-test-summaries/2026-Q2-SOW.md`](../security/pen-test-summaries/2026-Q2-SOW.md) and [`2026-Q2-REDACTED-SUMMARY.md`](../security/pen-test-summaries/2026-Q2-REDACTED-SUMMARY.md) reserved for a future **V2** vendor cycle. **Independent quality assessments must not** penalize V1 readiness for lacking third-party pen-test publication. Tracked under **V2** in [V1_DEFERRED.md Â§6c](V1_DEFERRED.md). |
| **PGP key drop for `security@archlucid.net` (coordinated-disclosure key)** | **V1.1 candidate** (Resolved 2026-04-23, sixth pass). Not in V1: no public PGP key block at `archlucid-ui/public/.well-known/pgp-key.txt`, no marketing `/security` page key reference, no `SECURITY.md` key-fingerprint update. **What is in V1:** the recipe at [`docs/security/PGP_KEY_GENERATION_RECIPE.md`](../security/PGP_KEY_GENERATION_RECIPE.md) and CI guard that turns green automatically when the key file appears. Key generation, custodian naming, and the same-day single PR that drops the key + updates `SECURITY.md` + updates the marketing `/security` page are all **V1.1**, gated on `archlucid.net` domain acquisition + `security@archlucid.net` mailbox provisioning. Tracked under V1.1 in [V1_DEFERRED.md Â§6c](V1_DEFERRED.md). |
| **Model Context Protocol (MCP) server — tenant-scoped agent tool surface** | **V1.1 candidate** (scope documentation 2026-04-24; **V1.1 slice pinned 2026-05-15** in [`MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md`](MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md) **Â§5.1**). Not in V1: no first-party MCP host in the shipping solution, no MCP SDK as a dependency of core libraries (`ArchLucid.Application` and below). **What is in V1:** REST API, CLI, and architect workspace remain the supported integration paths for humans and automation. **V1-only HTTP bridge (not GA MCP):** `POST /v1/mcp/retrieval/*` routes (`McpRetrievalToolsController`) expose read-only retrieval tools for route-registry parity and internal validation — treat them as **non-GA** and do not promise MCP marketplace or Streamable HTTP membrane in V1 pilots. **In scope for V1.1:** a **thin MCP membrane** (dedicated faÃ§ade project) exposing **exactly seven** **read-only** tools per **Â§5.1**; **Streamable HTTP** for production (private endpoint); optional **`stdio`** for local/self-hosted non-SLA use; same **RLS / `SESSION_CONTEXT`** guarantees as HTTP reads; typed **audit** events; **quota / circuit-breaker / observability** parity with the existing LLM completion pipeline; **no SMB/445** transport. Product intent, tool inventory, and non-goals (e.g. outbound ArchLucid-as-MCP-client to arbitrary third-party servers deferred past V1.1 unless separately promoted) are in [`MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md`](MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md) and summarized in [V1_DEFERRED.md Â§6d](V1_DEFERRED.md). |
| **Hosted trial tenants — documented `V1` → `V1.1` migration path** | **V1.1 candidate** (product note 2026-05-10). **Not required for `(A)` V1 headline readiness:** a consolidated tenant-admin / buyer-visible narrative for how **existing hosted trial tenants** should expect to cross the **`V1` → `V1.1`** boundary does **not** gate **V1 GA**. **What is in V1:** vendor-applied DbUp-forward migrations within the **`V1` contract**, `CHANGELOG` / **`BREAKING_CHANGES`** discipline, and incremental runbooks. **`V1.1`** documents the migration outlook as described in [V1_DEFERRED.md Â§6i](V1_DEFERRED.md). **Independent quality assessments must not** treat absence of this guide as a **`(A)` V1 defect** against Evolvability, Documentation, Adoption Friction, or related pillars — it is **`V1.1` documentation scope**, not latent **`V1` debt**. **Owner scope clarification 2026-05-15:** artifact is **explicitly excluded from V1 GA** and scheduled with **V1.1** rollout documentation (see **[PENDING_QUESTIONS.md](../PENDING_QUESTIONS.md)** when pinned).
| **Distributed cache — Redis baseline for scaled fleets + distributed graph projection cache** | **V2 candidate** (engineering note 2026-05-06). **What is in V1:** Optional Redis via **`HotPathCache`** (**`Auto`** picks Redis when replica count > 1 and connection string is set), optional **`LlmCompletionCache:Provider=Distributed`**, and in-process **`GraphSnapshotProjectionMemoryCache`**. **What is not a V1 contract:** mandatory Azure Cache for Redis in single-replica setups, IaC/private-endpoint baseline as a GA gate, or a distributed **`IGraphSnapshotProjectionCache`**. **V2 enhancement:** elevated Redis posture for multi-replica production defaults, Terraform/runbook parity, optional distributed graph projection implementation, and operational hardening — see [V1_DEFERRED.md Â§6e](V1_DEFERRED.md). |
| **Azure Container Apps Jobs + Durable Task Framework for worker orchestration** | **V2 backlog candidate, situational** (engineering note 2026-05-07). **What is in V1:** **`ArchLucid.Worker`** and **`AuthorityRunOrchestrator`** own long-running authority pipelines with retry, queuing, and state transitions. **What is not a V1 contract:** moving orchestration to **Durable Task Framework** (library orchestration with checkpoint/replay) or offloading bursty one-shot work to **Azure Container Apps Jobs**. **V2:** reconsider only if pipeline complexity (multi-step agents, approval/time-bound workflows, compensation) clearly outgrows the current pattern — see [V1_DEFERRED.md Â§6f](V1_DEFERRED.md). |
| **AWS / GCP architecture analysis** (target-cloud reviews while product stays Azure-hosted) | **Promoted to V1 (owner scope 2026-07-05).** See [Â§2.19](#219-multi-cloud-architecture-analysis-aws-and-gcp-targets-azure-hosted-product-promoted-to-v1-owner-scope-2026-07-05) above. `CloudProvider.Aws`/`.Gcp` and Tier 2 hosted polling (TB-402/TB-403) already shipped; Terraform classification, costing, cloud-aware agent context, and Tier 1 ZIP fallback are the remaining active-development items, now committed for V1 rather than V1.1. **Still out of scope:** re-hosting ArchLucid on AWS/GCP ([ADR 0020](../architecture/adrs/0020-azure-primary-platform-permanent.md)). |

---

## 4. Core architect happy path (V1)

### 4.1 Pilot path — start here

The **Pilot** path is the minimum journey every pilot must complete. It maps 1:1 to the **Core Pilot checklist** on the architect workspace Home page and to the four steps in [CORE_PILOT.md](../CORE_PILOT.md):

1. **Configure** storage (typically **Sql**), connection string, and auth for the environment ([customer-facing/customer-facing/PILOT_GUIDE.md](customer-facing/PILOT_GUIDE.md)).
2. **Start** the API; confirm **live/ready** and note **version** for any ticket.
3. **Create a review** from a structured request (`POST /v1/architecture/request`) — use the seven-step wizard in the architect workspace or the CLI.
4. **Execute** the **review** and wait until it is ready to finalize (watch the pipeline timeline in the UI or poll the API).
5. **Finalize** (`POST /v1/architecture/review/{runId}/finalize`) to produce an **architecture package** (API: golden manifest) and **artifacts**.
6. **Review** the architecture package and artifacts in the architect workspace (**review** detail → Artifacts table) or via API/CLI ([operator-shell.md](operator-shell.md) — legacy path name).

This is the complete first-pilot deliverable. Nothing beyond step 6 is required to call a pilot successful.

### 4.2 Operate (available but not required after Pilot)

**Operate** is optional until the team has a real analytical or governance question beyond the Pilot deliverable.

#### Analysis (Show more links)

Enable these once you have at least one finalized **review**. In the architect workspace, click **Show more links** in the sidebar.

- **Compare** two **reviews** (`/compare`) — structured architecture-package deltas + legacy diff.
- **Replay** a **review** (`/replay`) — re-validate the authority chain and surface drift flags.
- **Graph** (`/graph`) — visual provenance or architecture graph for a single **`runId`**.
- **Export** — download bundle ZIP and run-export ZIP from **review** detail → Artifacts.

Use these when the next question is analytical rather than operational: what changed, why it changed, or how to inspect the result more deeply.

#### Governance (extended and advanced links)

Enable extended and advanced links in the sidebar to surface governance, audit, and alerts.

- **Governance** — approval workflows, policy packs, pre-commit gate, governance dashboard.
- **Audit** — append-only audit log, CSV export, compliance drift tracking.
- **Alerts** — rules, routing, composite rules, simulation, tuning.

Use these when the next question is governance or trust: approvals, policy enforcement, audit, compliance, or operational control.

Optional: run **readiness** or **release-smoke** before a demo ([customer-facing/customer-facing/PILOT_GUIDE.md](customer-facing/PILOT_GUIDE.md), [RELEASE_SMOKE.md](RELEASE_SMOKE.md)).

---

## 5. Minimum release criteria (V1)

These are **practical gates** already encoded or described in-repo—not an exhaustive test matrix.

| Criterion | Evidence in repo |
|-----------|------------------|
| **Solution builds** in Release | CI and [../engineering/../engineering/BUILD.md](../engineering/BUILD.md) |
| **Core-tier tests** pass for the agreed filter (e.g. fast core / `Suite=Core` conventions) | [TEST_STRUCTURE.md](TEST_STRUCTURE.md), [RELEASE_SMOKE.md](RELEASE_SMOKE.md) |
| **API starts** against Sql configuration; **health/live** and **health/ready** succeed when dependencies are up | [README.md](../REPOSITORY_README.md), [customer-facing/customer-facing/PILOT_GUIDE.md](customer-facing/PILOT_GUIDE.md) |
| **One scripted end-to-end run** produces a committed manifest and **at least one** artifact descriptor | `scripts/release-smoke.ps1` expectations ([RELEASE_SMOKE.md](RELEASE_SMOKE.md)) |
| **Architect workspace** builds when Node is in use; Vitest/build steps as per readiness scripts | [RELEASE_SMOKE.md](RELEASE_SMOKE.md), [archlucid-ui/README.md](../../archlucid-ui/README.md) |
| **Version and diagnostics** available for handoff (`GET /version`, CLI `doctor`, support bundle discipline) | [customer-facing/customer-facing/PILOT_GUIDE.md](customer-facing/PILOT_GUIDE.md) |

**Not required** for every internal build: Playwright E2E, full integration matrix, performance benchmarks, or full Terraform apply to a live subscription—unless your program explicitly adds them as release gates.

---

## 6. Related documents

| Doc | Use |
|-----|-----|
| [PRODUCT_PACKAGING.md](PRODUCT_PACKAGING.md) | **Two-layer capability inventory:** Pilot Â· Operate |
| [CORE_PILOT.md](../CORE_PILOT.md) | First-pilot walkthrough (4 steps) |
| [OPERATOR_DECISION_GUIDE.md](OPERATOR_DECISION_GUIDE.md) | Practical guide for which layer to use next and what can be ignored for now |
| [V1_RELEASE_CHECKLIST.md](V1_RELEASE_CHECKLIST.md) | Actionable pre-handoff checklist (scope freeze, deploy, health, operator flow, exports, recovery) |
| [V1_DEFERRED.md](V1_DEFERRED.md) | Doc inventory: V1.1+ candidates, audit gaps, Phase 7 rename, infra polish, maintainer backlog |
| [customer-facing/customer-facing/PILOT_GUIDE.md](customer-facing/PILOT_GUIDE.md) | Pilot onboarding narrative |
| [PRODUCT_DOCUMENTATION_PRESENTATION.md](PRODUCT_DOCUMENTATION_PRESENTATION.md) | V1 rule: in-app help for product users; GitHub for engineering source only |
| [FIRST_PILOT_OPERATOR_PATH.md#printable-first-run-evidence-checklist](../runbooks/FIRST_PILOT_OPERATOR_PATH.md#printable-first-run-evidence-checklist) | Printable V1 pilot checklist (extractor ZIP through sponsor export; `FIRST_RUN_EVIDENCE_CHECKLIST.md` alias) |
| [customer-facing/customer-facing/OPERATOR_QUICKSTART.md](customer-facing/OPERATOR_QUICKSTART.md) | Command-oriented operator entry |
| [operator-shell.md](operator-shell.md) | UI workflows and API expectations |
| [ARCHITECTURE_FLOWS.md](ARCHITECTURE_FLOWS.md) | Export, comparison, replay sequences |
| [API_CONTRACTS.md](API_CONTRACTS.md) | HTTP behavior and policy references |
| [RELEASE_SMOKE.md](RELEASE_SMOKE.md) | Scripted smoke scope and limits |
| [V1_RC_DRILL.md](V1_RC_DRILL.md) | RC drill: full operator path against a running API (`v1-rc-drill.ps1`) |
| [V1_READINESS_SUMMARY.md](V1_READINESS_SUMMARY.md) | Short honest snapshot: done, deferred, risks, pilot bar, post-V1 priorities |
| [V1_REQUIREMENTS_TEST_TRACEABILITY.md](V1_REQUIREMENTS_TEST_TRACEABILITY.md) | Lightweight map from this scope doc to tests, scripts, and data-consistency runbooks |

---

**Change control:** When V1 boundaries shift, update **this file** first, then align [customer-facing/customer-facing/PILOT_GUIDE.md](customer-facing/PILOT_GUIDE.md) and [README.md](../REPOSITORY_README.md) so pilots do not see conflicting messages.
