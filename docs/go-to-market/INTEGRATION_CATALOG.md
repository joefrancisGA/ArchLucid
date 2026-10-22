> **Reviewed:** 2026-07-25

> **Scope:** ArchLucid — Integration catalog — buyer-facing narrative, roadmap table, and links. Per-connector **status, direction, auth, secrets, code entry points, tests, and smoke** live in [`../library/CONNECTOR_READINESS_MATRIX.md`](../library/CONNECTOR_READINESS_MATRIX.md).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid — Integration catalog

**Audience:** Technical evaluators and integration engineers assessing how ArchLucid connects to their ecosystem.

**Last reviewed:** 2026-07-25 — First-party **Jira**, **ServiceNow**, **Confluence**, **Slack**, and **Microsoft Teams** connectors are **promoted to V1 GA** (owner scope 2026-07-03), superseding the *Resolved 2026-05-18* V1.1-window pinning below — see [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13–§2.15 and [`../library/V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6/§6a. **CloudEvents** outbound webhooks, **MCP** agent-tool membrane, and customer-operated **recipes** remain **V1.1 buyer-contract** commitments ([`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.8, §3). **V1 GA** buyer contract now includes: **REST**, **CLI**, **architect workspace**, **SCIM**, **Azure DevOps** / **GitHub** CI surfaces, **Azure extractor ZIP**, **Jira**, **ServiceNow**, **Confluence**, **Slack**, **Microsoft Teams**, and other **V1-ready** capabilities enumerated in **§2** — not webhook/MCP/recipe **obligations**. **Remaining tightening work** for the promoted connectors (OAuth upgrade — **TB-600**): see [`../library/TECH_BACKLOG.md`](../library/TECH_BACKLOG.md). **TB-602 closed 2026-07-04** — §2 roadmap and §3 "Build your own" now distinguish **V1 GA first-party** connectors from **V1.1 customer-operated** recipe bridges.

**Engineering source of truth:** [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.8, §2.13–§2.15, and §3. This catalog is the procurement-facing summary; amend `V1_SCOPE.md` first when integration boundaries change. **First-run architects:** use only the **V1 GA** column in § Commitment boundary and § What to use today — do not plan day-one go-live on **V1.1** rows ([`../library/CANONICAL_FIRST_RUN_PATH.md`](../library/CANONICAL_FIRST_RUN_PATH.md)).

**Philosophy:** ArchLucid connects to your tools — you do not run our agents in your infrastructure. Integrations operate via the hosted **REST**/**CLI**/**UI** surfaces plus first-party **Jira**/**ServiceNow**/**Confluence**/**Slack**/**Teams** connectors for **V1 GA**; **CloudEvents webhooks**, **Service Bus** fan-out, and customer-operated recipe bridges remain **V1.1 buyer-contract** paths per [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md).

**V1 copyable recipes:** [`../library/V1_REST_CLI_INTEGRATION_RECIPES.md`](../library/V1_REST_CLI_INTEGRATION_RECIPES.md)

**V1 automation handoff pack (create → execute → finalize → export → compare → ROI):** [`../library/V1_AUTOMATION_HANDOFF_PACK.md`](../library/V1_AUTOMATION_HANDOFF_PACK.md) — REST, CLI, OpenAPI, idempotency, and V1 vs V1.1 boundaries for enterprise pilots that automate without customer-operated recipe bridges.

**Connector readiness matrix (implementers):** [../library/CONNECTOR_READINESS_MATRIX.md](../library/CONNECTOR_READINESS_MATRIX.md) — shipped vs recipe vs planned; **product** vs **customer-operated**; code paths and tests.

**Smoke recipes (first-party connectors):** [../integrations/CONNECTOR_SMOKE_INDEX.md](../integrations/CONNECTOR_SMOKE_INDEX.md)

---

## Commitment boundary

| Window | Buyer-contract surfaces | Not implied |
|--------|-------------------------|-------------|
| **V1 GA** | REST API / OpenAPI, .NET client, CLI, architect workspace, SCIM provisioning, Azure DevOps / GitHub CI surfaces, Azure extractor ZIP ingest, procurement ZIP, SIEM-friendly audit export docs, and first-party **Jira**, **ServiceNow**, **Confluence**, **Slack**, and **Microsoft Teams** connectors (promoted from V1.1 — owner scope 2026-07-03) | CloudEvents webhook delivery as a buyer-contract path; inbound agent-tool membrane obligations; outbound tool-client obligations; customer-operated recipe support obligations; OAuth upgrades for the promoted connectors (basic auth / API token ships today — see **TB-600**) |
| **V1.1 committed** | Integration events / CloudEvents webhooks, **MCP read-only membrane** (seven tools per [`MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md`](../library/MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md) §5.1), and customer-operated bridge recipes as documented in [`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.8 | Marketplace / store listings on day one; outbound MCP client calling external tool servers (default **V2**); arbitrary connector expansion |
| **Later / unpinned** | Azure DevOps Work Items native connector, Structurizr DSL, ArchiMate XML, Terraform state import expansion, SIEM export productization beyond current methods | Any promise of a release window without a separate owner decision |

Use this table when answering procurement questions: implementation may exist early in the repo, but the buyer contract follows the window above unless `V1_SCOPE.md` is amended.

### What to use today (V1 pilots)

Use this table for **first-pilot and procurement “day one”** integrations. Do **not** plan a V1 go-live that **requires** a row marked **V1.1**.

| Need today | Use (V1) | Concrete entry point |
|------------|----------|----------------------|
| Create and finalize an architecture review | REST + architect workspace + CLI | `POST /v1/architecture/request` · `/architecture/reviews/new` (retired bookmark) · `archlucid run create` — [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) |
| Azure subscription evidence (read-only, customer-run) | Azure extractor Tier 1 ZIP upload | [`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) · `POST /v1/azure-extractor/upload` |
| CI/CD manifest delta on pull requests | GitHub Actions + Azure DevOps pipeline task | [`integrations/CICD_INTEGRATION.md`](../integrations/CICD_INTEGRATION.md) · ADO PR decoration (server-side) [`AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md`](../integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md) |
| Identity provisioning | SCIM | [`integrations/SCIM_PROVISIONING.md`](../integrations/SCIM_PROVISIONING.md) |
| Automation / scripts | REST OpenAPI + .NET client + API keys | [`API_CONTRACTS.md`](../library/API_CONTRACTS.md) · [`SECURITY.md`](../library/contributor-reference/SECURITY.md) |
| Procurement / trust artifacts | Procurement ZIP build script | `scripts/build_procurement_pack.ps1` · [`trust-center.md`](trust-center.md) |
| Custom agent logic (advanced, in-repo) | Register `IAgentHandler` in host | [`CUSTOM_AGENT_HANDLER_GUIDE.md`](../library/CUSTOM_AGENT_HANDLER_GUIDE.md) |
| Custom agent logic (isolated service) | HTTPS webhook `AgentResult` contract | [`CUSTOM_AGENT_HANDLERS.md`](../library/CUSTOM_AGENT_HANDLERS.md) |
| Push finding → Jira / ServiceNow incident | First-party Jira / ServiceNow connectors (V1 GA) | `POST /v1/integrations/itsm/outbound/issues` — §1 *V1 GA* below; native create enabled by default via `Integrations:Itsm:NativeEnabled` (opt out with `false`) |
| Chat-ops (Teams / Slack) notifications | First-party Teams / Slack incoming webhooks (V1 GA) | §2.14 — [`CONNECTOR_READINESS_MATRIX.md`](../library/CONNECTOR_READINESS_MATRIX.md) |
| Outbound CloudEvents / Service Bus fan-out | **Not V1-required** | V1.1 §2.8 — [`INTEGRATION_EVENTS_AND_WEBHOOKS.md`](../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md) |
| Confluence page publish | First-party Confluence connector (V1 GA) | §2.15 |
| Agent tool access (MCP server membrane) | **Not V1-required** | V1.1 §5.1 — [`MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md`](../library/MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md) · [`V1_DEFERRED.md`](../library/V1_DEFERRED.md) §6d |
| Outbound MCP client (call external tool servers) | **Not V1-required** | Default **V2** unless separately promoted — same backlog |

**Buyer-job packaging (outcome-led, V1-only):** [Azure SaaS readiness](../library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md#buyer-job-packaging) (`buyer-jobs/AZURE_SAAS_READINESS.md` alias) · [AI governance](../library/walkthroughs/AI_GOVERNANCE_REVIEW.md#buyer-job-packaging) (`buyer-jobs/AI_GOVERNANCE_REVIEW.md` alias) · [Healthcare claims policy](../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md#buyer-job-packaging) (`buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md` alias).

**Operator walkthroughs (step-by-step):** index [`library/walkthroughs/README.md`](../library/walkthroughs/README.md) · [Azure SaaS readiness](../library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md) · [AI governance](../library/walkthroughs/AI_GOVERNANCE_REVIEW.md) · [Healthcare claims pilot](../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md).

---

## 1. Available today (code) — V1 GA buyer contract

**Surfaces in the V1 GA buyer contract** center on **REST API**, **.NET client**, **CLI**, **SCIM**, **Azure DevOps** / **GitHub** PR/manifest decoration, **Azure extractor ZIP ingest**, contracts (**OpenAPI**), and first-party **Jira**, **ServiceNow**, **Confluence**, **Slack**, and **Microsoft Teams** connectors (promoted from V1.1 — owner scope 2026-07-03). **Webhooks / CloudEvents**, optional **Azure Service Bus** integration events, and copy-paste **recipes** remain **V1.1 program** obligations ([`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.8, §3) — see the **[connector readiness matrix](../library/CONNECTOR_READINESS_MATRIX.md)** for implementation status, tests, and smoke.

Also:

| Item | Note |
|------|------|
| **Procurement ZIP** | Reproducible `dist/procurement-pack.zip` via `scripts/build_procurement_pack.sh` / `.ps1`. See [trust-center.md](trust-center.md). |
| **AsyncAPI** | Async contract for webhook and Service Bus consumers (see matrix + [INTEGRATION_EVENTS_AND_WEBHOOKS.md](../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md)). |

### V1 GA — integration seams (native create gated by config)

V1 ships **correlation register**, **copy-as-work-item**, **ITSM-aware findings export**, and **inbound webhook sync**. One-click outbound Jira/ServiceNow create is **on by default** via **`Integrations:Itsm:NativeEnabled=true`** ([`../library/CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md)); deployments that need a credential-first onboarding gate may set **`false`** to return **404** from outbound create while clipboard export and correlations remain enabled.

### V1 GA — first-party ITSM connectors (promoted from V1.1 — owner scope 2026-07-03)

Ships **V1 GA** ([`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13, superseding the *Resolved 2026-05-18* V1.1-window pinning).

| Connector | Shipped shape |
|-----------|----------------|
| **ServiceNow** | Finding → **`incident`** with correlation back-link; **basic auth** for the shipped MVP (OAuth 2.0 upgrade tracked as **TB-600**). **`cmdb_ci`** via **`cmdb_ci_appl`** name lookup on **`SystemName`** ([§ Sequencing and CMDB](#sequencing-and-cmdb) below). **Two-way** ServiceNow → ArchLucid **status-only** sync ships today (configurable mapping; see [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13). |
| **Jira** | Finding → issue with correlation back-link; **bi-directional** Jira → ArchLucid status sync ships today (configurable mapping; see [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13). API token auth (OAuth 2.0 upgrade tracked as **TB-600**). |

### V1 GA — Teams, Slack, and Confluence (promoted from V1.1 — owner scope 2026-07-03)

| Surface | Shipped shape |
|---------|----------------|
| **Microsoft Teams**, **Slack**, **Confluence** | **V1 GA** per [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.14–§2.15 (Teams/Slack notifications / Confluence page publish), promoted from V1.1 — owner scope 2026-07-03. **Code paths, tests, smoke:** [connector readiness matrix](../library/CONNECTOR_READINESS_MATRIX.md). |

### Sequencing and CMDB

- **Build order (historical, now shipped):** **ServiceNow** first. Then **Atlassian pair**: **Confluence** publish **before** **Jira** issue sync — **same** engineering workstream / release tranche ([`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13 / §2.15; [`../PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) *Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)*). All connectors in this sequence now ship as **V1 GA** first-party connectors; **customer-owned** recipes ([§3](#3-build-your-own) below) remain a separate **V1.1** buyer-contract path for teams that prefer a self-operated bridge instead of the first-party connector.
- **CMDB CI class:** **`cmdb_ci_appl`** (Application CI). Match ArchLucid **`SystemName`** to ServiceNow **`name`**; when a row is found, set incident **`cmdb_ci`** to that record’s **`sys_id`**. If no row matches, leave **`cmdb_ci`** empty. **Illustrative Table API lookup:** `GET /api/now/table/cmdb_ci_appl?sysparm_query=name={SystemName}&sysparm_limit=1` (escape/`encodeURIComponent` **`SystemName`** per instance rules).
- **`ServiceNow:AutoCreateCmdbCi`:** Tenant option, default **`false`**. When **`true`**, the connector may create a new **`cmdb_ci_appl`** row when lookup finds no match; when **`false`**, never auto-create.
- **Two-way status sync (ITSM → ArchLucid):** **ServiceNow** and **Jira** **status-only** inbound sync back into ArchLucid finding state **ships today as part of V1 GA** (per [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13 and *Resolved 2026-05-06 / 2026-05-18* in [`../PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)). OAuth 2.0 upgrades are a V1 GA tightening backlog item (**TB-600**), not a missing MVP feature.

### Authentication for integrations

| Method | Use case | Reference |
|--------|----------|-----------|
| **Entra ID (JWT)** | Production integrations, CI/CD pipelines with service principals | [SECURITY.md](../library/contributor-reference/SECURITY.md), [tenant isolation](BUYER_SECURITY_PROCUREMENT_PACKET.md#tenant-isolation-buyer-overview) |
| **API keys** | Automation, scripts, lightweight integrations | [SECURITY.md](../library/contributor-reference/SECURITY.md) (RBAC, key rotation) |

---

## 2. Planned connectors [Roadmap]

**ITSM + documentation sequencing (historical):** **ServiceNow** → **Confluence** → **Jira** — **Confluence** and **Jira** shipped **paired** (*Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)* in [`../PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)). All three now ship as **V1 GA** first-party connectors ([§1](#1-available-today-code--v1-ga-buyer-contract)).

### V1.1 aligned patterns (copy-paste recipes)

These are **customer-operated** integration patterns that consume CloudEvents-style payloads — a separate **V1.1 buyer-contract** bridge option for **Jira** / **ServiceNow** / **Confluence**-shaped workflows for teams that prefer a self-operated bridge instead of the **V1 GA** first-party connectors in [§1](#1-available-today-code--v1-ga-buyer-contract) ([`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.8, §3).

| Pattern | Document |
|---------|----------|
| Azure Logic Apps webhook → Azure DevOps work item | [recipe-azure-logic-apps-webhook-to-ado-work-item.md](../integrations/recipes/recipe-azure-logic-apps-webhook-to-ado-work-item.md) |
| ServiceNow incident → **Logic Apps** (Azure-first) | [SERVICENOW_INCIDENT_VIA_LOGIC_APPS.md](../integrations/recipes/SERVICENOW_INCIDENT_VIA_LOGIC_APPS.md) |
| Event Grid / HTTPS subscriber hardening checklist | [recipe-event-grid-webhook-hardening-checklist.md](../integrations/recipes/recipe-event-grid-webhook-hardening-checklist.md) |

Broader recipe hub: [ITSM_BRIDGE_V1_RECIPES.md](../library/ITSM_BRIDGE_V1_RECIPES.md) · No-code folder index: [integrations/recipes/README.md](../integrations/recipes/README.md).

| Category | Connector | Description | Status |
|----------|-----------|-------------|--------|
| **Identity** | SCIM provisioning | Sync users and groups from Okta, Entra ID, or other IdPs | **Available today** — see [`docs/integrations/SCIM_PROVISIONING.md`](../integrations/SCIM_PROVISIONING.md) |
| **Architecture import** | Structurizr DSL | Import architecture models from Structurizr workspace files | [Planned] |
| **Architecture import** | ArchiMate XML | Import from TOGAF / ArchiMate modeling tools | [Planned] |
| **Architecture import** | Terraform state | Parse `terraform show -json` output into ArchLucid context | [Planned] |
| **ITSM / Atlassian** | Jira | **V1 GA** first-party issue sync (§2.13); optional **V1.1** customer-operated Logic Apps / webhook bridge. | **[V1 GA — first-party]** — [§1](#1-available-today-code--v1-ga-buyer-contract), [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_SCOPE §2.13](../library/V1_SCOPE.md); **V1.1 recipe bridge:** [bridge template](../../templates/integrations/jira/jira-webhook-bridge-recipe.md) |
| **Documentation / Atlassian** | Confluence | **V1 GA** first-party page publish (§2.15); optional **V1.1** customer-operated Logic Apps recipe. | **[V1 GA — first-party]** — [§1](#1-available-today-code--v1-ga-buyer-contract), [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_SCOPE §2.15](../library/V1_SCOPE.md); **V1.1 recipe bridge:** [CONFLUENCE_PAGE_VIA_LOGIC_APPS.md](../integrations/recipes/CONFLUENCE_PAGE_VIA_LOGIC_APPS.md) |
| **ITSM** | ServiceNow | **V1 GA** first-party incident sync (§2.13); optional **V1.1** customer-operated bridge template. | **[V1 GA — first-party]** — [§1](#1-available-today-code--v1-ga-buyer-contract), [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_SCOPE §2.13](../library/V1_SCOPE.md), [CMDB / sequencing §1](#sequencing-and-cmdb); **V1.1 recipe bridge:** [bridge template](../../templates/integrations/servicenow/servicenow-incident-recipe.md) |
| **ITSM** | Azure DevOps Work Items | Native work-item connector (distinct from shipped PR decoration). | [Planned] — [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_DEFERRED](../library/V1_DEFERRED.md) |
| **Chat-ops** | Microsoft Teams | **V1 GA** first-party incoming webhook notifications (§2.14). | **[V1 GA — first-party]** — [§1](#1-available-today-code--v1-ga-buyer-contract), [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_SCOPE §2.14](../library/V1_SCOPE.md) |
| **Chat-ops** | Slack | **V1 GA** first-party chat-ops (§2.14). | **[V1 GA — first-party]** — [§1](#1-available-today-code--v1-ga-buyer-contract), [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_SCOPE §2.14](../library/V1_SCOPE.md) |
| **Observability** | SIEM export (CEF/syslog) | Native audit log export in SIEM-friendly formats | Partial — see [`../library/SIEM_EXPORT.md`](../library/SIEM_EXPORT.md) (`SIEM_EXPORT.md` pack alias) for current methods |
| **CI/CD** | GitHub Actions | Architecture review as a PR check | [Example available] — see [../integrations/CICD_INTEGRATION.md](../integrations/CICD_INTEGRATION.md) |
| **CI/CD** | Azure DevOps Pipelines | Architecture review as a pipeline task | [Example available] — see [../integrations/CICD_INTEGRATION.md](../integrations/CICD_INTEGRATION.md) |
| **CI/CD** | Azure DevOps Repos (pipelines) | Same `GET /v1/compare` Markdown as GitHub Actions — job summary + sticky PR thread (`integrations/azure-devops-task-manifest-delta*`) | [Shipped] — see [../integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md](../integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md) · [ADR 0024](../architecture/adrs/0024-azure-devops-pipeline-task-parity-with-github-action.md) |
| **CI/CD** | Azure DevOps Repos (Service Bus) | PR thread + status on manifest commit (`com.archlucid.authority.run.completed`) — **zero pipeline changes** | [Shipped] — opt-in Worker handler — see [../integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md](../integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md) |
| **Agent ecosystem** | MCP server (inbound membrane) | Tenant-scoped **read-only** tool surface over REST-equivalent reads — Streamable HTTP (production) | **[V1.1 — committed]** — [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_SCOPE](../library/V1_SCOPE.md), [MCP backlog §5.1](../library/MCP_AND_AGENT_ECOSYSTEM_BACKLOG.md), [V1_DEFERRED §6d](../library/V1_DEFERRED.md) |
| **Agent ecosystem** | MCP client (outbound) | ArchLucid calling external MCP tool servers | **[Later / V2 default]** — not a V1 or V1.1 pilot gate |

---

## 3. Build your own

Use this section when you need a **customer-operated** bridge — Logic Apps, Power Automate, or a webhook consumer you run — instead of the **V1 GA first-party** connectors in [§1](#1-available-today-code--v1-ga-buyer-contract).

| Vendor / workflow | V1 GA first-party (hosted by ArchLucid) | V1.1 customer-operated recipe bridge |
|-------------------|------------------------------------------|--------------------------------------|
| **Jira** issue from finding | Native connector — [§1](#v1-ga--first-party-itsm-connectors-promoted-from-v11--owner-scope-2026-07-03) | [Jira (Power Automate)](../../../integrations/recipes/JIRA_ISSUE_VIA_POWER_AUTOMATE.md) · [webhook bridge template](../../templates/integrations/jira/jira-webhook-bridge-recipe.md) |
| **ServiceNow** incident from finding | Native connector — [§1](#v1-ga--first-party-itsm-connectors-promoted-from-v11--owner-scope-2026-07-03) | [ServiceNow (Logic Apps)](../../../integrations/recipes/SERVICENOW_INCIDENT_VIA_LOGIC_APPS.md) · [ServiceNow (Power Automate)](../../../integrations/recipes/SERVICENOW_INCIDENT_VIA_POWER_AUTOMATE.md) · [webhook bridge template](../../templates/integrations/servicenow/servicenow-incident-recipe.md) |
| **Confluence** page publish | Native connector — [§1](#v1-ga--teams-slack-and-confluence-promoted-from-v11--owner-scope-2026-07-03) | [Confluence (Logic Apps)](../../../integrations/recipes/CONFLUENCE_PAGE_VIA_LOGIC_APPS.md) |
| **Microsoft Teams** / **Slack** notifications | Native connectors — [§1](#v1-ga--teams-slack-and-confluence-promoted-from-v11--owner-scope-2026-07-03) | Customer-operated webhook subscribers only when you need a bespoke fan-out pattern beyond the first-party connector ([`V1_SCOPE.md` §2.8](../library/V1_SCOPE.md)) |

**End-to-end recipe hub (Azure DevOps PR decoration, CloudEvents consumer outline, Power Automate / Logic Apps):** see **[ITSM_BRIDGE_V1_RECIPES.md](../library/ITSM_BRIDGE_V1_RECIPES.md)** — consolidated walkthroughs with exact doc and repo paths. **CloudEvents** outbound webhooks and **Service Bus** integration events remain **V1.1 buyer-contract** surfaces ([`V1_SCOPE.md` §2.8](../library/V1_SCOPE.md), §3); they are not substitutes for the **V1 GA** first-party connectors above.

ArchLucid's architecture is designed for extensibility:

- **Context connectors:** Implement `IContextConnector` to bring new data sources into the analysis pipeline. See the finding engine template: `dotnet new archlucid-finding-engine`.
- **Outbound consumers:** Subscribe to **V1.1** CloudEvents webhooks or **Service Bus** topics to trigger workflows in your systems ([`V1_SCOPE.md` §2.8](../library/V1_SCOPE.md)).
- **API automation:** Use the REST API or .NET client to build custom integrations.
- **ITSM + chat-ops + docs:** For **Jira**, **ServiceNow**, **Confluence**, **Microsoft Teams**, and **Slack**, use the **V1 GA** first-party connectors in [§1](#1-available-today-code--v1-ga-buyer-contract) unless procurement or operations requires a **customer-operated** bridge from the table above. Recipe walkthroughs under [`docs/integrations/recipes/`](../../../integrations/recipes/README.md) align with the **V1.1** bridge window — **Logic Apps–first:** [ServiceNow (Logic Apps)](../../../integrations/recipes/SERVICENOW_INCIDENT_VIA_LOGIC_APPS.md), [Confluence (Logic Apps)](../../../integrations/recipes/CONFLUENCE_PAGE_VIA_LOGIC_APPS.md); **Power Automate:** [ServiceNow](../../../integrations/recipes/SERVICENOW_INCIDENT_VIA_POWER_AUTOMATE.md), [Jira](../../../integrations/recipes/JIRA_ISSUE_VIA_POWER_AUTOMATE.md). Starter **fixture→mapping parity** for bridge authors (Node built-in **`--test`**) lives under [`templates/integrations/bridge-recipe-contract-tests/`](../../templates/integrations/bridge-recipe-contract-tests/README.md), matching CI. Event types: [schemas/integration-events/catalog.json](../../schemas/integration-events/catalog.json) and [INTEGRATION_EVENTS_AND_WEBHOOKS.md](../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md).

---

## 4. Request an integration

Contact your **ArchLucid account team** or the address on your **order form** with your use case. Integration requests inform the connector roadmap.

---

## Related documents

| Doc | Use |
|-----|-----|
| [../runbooks/FIRST_PILOT_OPERATOR_PATH.md](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) | Single V1 pilot path — storage through sponsor export |
| [../library/walkthroughs/README.md](../library/walkthroughs/README.md) | Accelerator pack index (Azure SaaS, AI governance, healthcare) |
| [../library/CUSTOM_AGENT_HANDLER_GUIDE.md](../library/CUSTOM_AGENT_HANDLER_GUIDE.md) | In-repo handler extension (not required for Pilot) |
| [../library/CONNECTOR_READINESS_MATRIX.md](../library/CONNECTOR_READINESS_MATRIX.md) | Shipped vs planned; auth/secrets; code + tests + smoke |
| [trust-center.md](trust-center.md) | Trust index |
| [POSITIONING.md](POSITIONING.md) | Product positioning |
| [../API_CONTRACTS.md](../library/API_CONTRACTS.md) | API surface detail |
| [`../library/SIEM_EXPORT.md`](../library/SIEM_EXPORT.md) · [`SIEM_EXPORT.md`](SIEM_EXPORT.md) (alias) | Audit export for SIEM |
| [../integrations/CICD_INTEGRATION.md](../integrations/CICD_INTEGRATION.md) | CI/CD pipeline examples |
| [`../library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md#buyer-job-packaging`](../library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md#buyer-job-packaging) · [buyer-jobs/AZURE_SAAS_READINESS.md](buyer-jobs/AZURE_SAAS_READINESS.md) (alias) | Outcome-led Azure SaaS pilot packaging |
| [`../library/walkthroughs/AI_GOVERNANCE_REVIEW.md#buyer-job-packaging`](../library/walkthroughs/AI_GOVERNANCE_REVIEW.md#buyer-job-packaging) · [buyer-jobs/AI_GOVERNANCE_REVIEW.md](buyer-jobs/AI_GOVERNANCE_REVIEW.md) (alias) | Outcome-led Responsible AI pilot packaging |
| [walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md#buyer-job-packaging](../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md#buyer-job-packaging) (`buyer-jobs/HEALTHCARE_CLAIMS_POLICY_REVIEW.md` alias) | Outcome-led healthcare claims pilot packaging |
