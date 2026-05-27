> **Scope:** ArchLucid — Integration catalog — buyer-facing narrative, roadmap table, and links. Per-connector **status, direction, auth, secrets, code entry points, tests, and smoke** live in [`../library/CONNECTOR_READINESS_MATRIX.md`](../library/CONNECTOR_READINESS_MATRIX.md).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# ArchLucid — Integration catalog

**Audience:** Technical evaluators and integration engineers assessing how ArchLucid connects to their ecosystem.

**Last reviewed:** 2026-05-18 — First-party **Jira**, **ServiceNow**, **Slack**, **Confluence**, **Microsoft Teams** incoming webhooks, **CloudEvents** outbound webhooks, and copy-paste **recipes** are **V1.1 buyer-contract** commitments ([`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.8, §2.13–§2.15, §3; *Resolved 2026-05-18* in [`../PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)). **V1** buyer contract: **REST**, **CLI**, **operator UI**, **SCIM**, **Azure DevOps** / **GitHub** CI surfaces, **Azure extractor ZIP**, and other **V1 GA** capabilities enumerated in **§2** — not Teams/webhook/recipe **obligations**. **Engineering order (V1.1):** **ServiceNow** → **Confluence** → **Jira** — **Atlassian** paired, **Confluence** first (*Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)*).

**Philosophy:** ArchLucid connects to your tools — you do not run our agents in your infrastructure. Integrations operate via the hosted **REST**/**CLI**/**UI** surfaces for **V1** GA; **webhooks**, **Teams**, **Service Bus** fan-out, and managed/first-party connectors are **V1.1 buyer-contract** paths per [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md).

**Connector readiness matrix (implementers):** [../library/CONNECTOR_READINESS_MATRIX.md](../library/CONNECTOR_READINESS_MATRIX.md) — shipped vs recipe vs planned; **product** vs **customer-operated**; code paths and tests.

**Smoke recipes (first-party connectors):** [../integrations/CONNECTOR_SMOKE_INDEX.md](../integrations/CONNECTOR_SMOKE_INDEX.md)

---

## Commitment boundary

| Window | Buyer-contract surfaces | Not implied |
|--------|-------------------------|-------------|
| **V1 GA** | REST API / OpenAPI, .NET client, CLI, operator UI, SCIM provisioning, Azure DevOps / GitHub CI surfaces, Azure extractor ZIP ingest, procurement ZIP, SIEM-friendly audit export docs | First-party Jira / ServiceNow / Confluence / Slack / Teams obligations; CloudEvents webhook delivery as a buyer-contract path; customer-operated recipe support obligations |
| **V1.1 committed** | First-party ServiceNow, Confluence, Jira, Microsoft Teams, Slack, integration events / CloudEvents webhooks, and customer-operated bridge recipes as documented in [`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.8 and §2.13–§2.15 | Marketplace / store listings on day one; OAuth upgrades where the V1.1 MVP says basic auth or API token is enough; arbitrary connector expansion |
| **Later / unpinned** | Azure DevOps Work Items native connector, Structurizr DSL, ArchiMate XML, Terraform state import expansion, SIEM export productization beyond current methods | Any promise of a release window without a separate owner decision |

Use this table when answering procurement questions: implementation may exist early in the repo, but the buyer contract follows the window above unless `V1_SCOPE.md` is amended.

### What to use today (V1 pilots)

Use this table for **first-pilot and procurement “day one”** integrations. Do **not** plan a V1 go-live that **requires** a row marked **V1.1**.

| Need today | Use (V1) | Concrete entry point |
|------------|----------|----------------------|
| Create and commit an architecture review | REST + operator UI + CLI | `POST /v1/architecture/request` · `/runs/new` · `archlucid run create` — [`FIRST_PILOT_OPERATOR_PATH.md`](../runbooks/FIRST_PILOT_OPERATOR_PATH.md) |
| Azure subscription evidence (read-only, customer-run) | Azure extractor Tier 1 ZIP upload | [`AZURE_EXTRACTOR.md`](../library/AZURE_EXTRACTOR.md) · `POST /v1/azure-extractor/upload` |
| CI/CD manifest delta on pull requests | GitHub Actions + Azure DevOps pipeline task | [`integrations/CICD_INTEGRATION.md`](../integrations/CICD_INTEGRATION.md) · ADO PR decoration (server-side) [`AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md`](../integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md) |
| Identity provisioning | SCIM | [`integrations/SCIM_PROVISIONING.md`](../integrations/SCIM_PROVISIONING.md) |
| Automation / scripts | REST OpenAPI + .NET client + API keys | [`API_CONTRACTS.md`](../library/API_CONTRACTS.md) · [`SECURITY.md`](../library/contributor-reference/SECURITY.md) |
| Procurement / trust artifacts | Procurement ZIP build script | `scripts/build_procurement_pack.ps1` · [`TRUST_CENTER.md`](TRUST_CENTER.md) |
| Custom agent logic (advanced, in-repo) | Register `IAgentHandler` in host | [`CUSTOM_AGENT_HANDLER_GUIDE.md`](../library/CUSTOM_AGENT_HANDLER_GUIDE.md) |
| Custom agent logic (isolated service) | HTTPS webhook `AgentResult` contract | [`CUSTOM_AGENT_HANDLERS.md`](../library/CUSTOM_AGENT_HANDLERS.md) |
| Push finding → Jira / ServiceNow incident | **Not V1-required** | V1.1 first-party connectors · V1.1 recipes — §1 *V1.1 committed* below |
| Chat-ops (Teams / Slack) notifications | **Not V1-required** | V1.1 §2.14 — [`CONNECTOR_READINESS_MATRIX.md`](../library/CONNECTOR_READINESS_MATRIX.md) |
| Outbound CloudEvents / Service Bus fan-out | **Not V1-required** | V1.1 §2.8 — [`INTEGRATION_EVENTS_AND_WEBHOOKS.md`](../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md) |
| Confluence page publish | **Not V1-required** | V1.1 §2.15 |

**Accelerator walkthroughs (V1-only narratives):** [Azure SaaS readiness](../library/walkthroughs/AZURE_SAAS_READINESS_REVIEW.md) · [AI governance](../library/walkthroughs/AI_GOVERNANCE_REVIEW.md) · [Healthcare claims pilot](../library/walkthroughs/POLICY_PACK_HEALTHCARE_CLAIMS_PILOT.md).

---

## 1. Available today (code) — V1 GA buyer contract

**Surfaces in the V1 GA buyer contract** center on **REST API**, **.NET client**, **CLI**, **SCIM**, **Azure DevOps** / **GitHub** PR/manifest decoration, **Azure extractor ZIP ingest**, and contracts (**OpenAPI**). **Webhooks / CloudEvents**, optional **Azure Service Bus** integration events, **Microsoft Teams** incoming webhooks, copy-paste **recipes**, and **first-party** **Slack**, **Confluence**, **Jira**, and **ServiceNow** are **V1.1 program** obligations ([`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.8, §2.13–§2.15, §3) — see the **[connector readiness matrix](../library/CONNECTOR_READINESS_MATRIX.md)** for implementation status, tests, and smoke.

Also:

| Item | Note |
|------|------|
| **Procurement ZIP** | Reproducible `dist/procurement-pack.zip` via `scripts/build_procurement_pack.sh` / `.ps1`. See [TRUST_CENTER.md](TRUST_CENTER.md). |
| **AsyncAPI** | Async contract for webhook and Service Bus consumers (see matrix + [INTEGRATION_EVENTS_AND_WEBHOOKS.md](../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md)). |

### V1.1 committed — first-party ITSM connectors

Ship tracks **V1.1** ([`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13); marketplace/store listings may trail usable connectors.

| Connector | MVP commitment |
|-----------|----------------|
| **ServiceNow** | Finding → **`incident`** with correlation back-link; **basic auth** for **V1.1** MVP (OAuth 2.0 follow-on per §2.13). **`cmdb_ci`** via **`cmdb_ci_appl`** name lookup on **`SystemName`** ([§ Sequencing and CMDB](#sequencing-and-cmdb) below). **Two-way** ServiceNow → ArchLucid **status-only** sync is **committed for V1.1** (configurable mapping; see [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13). |
| **Jira** | Finding → issue with correlation back-link; **bi-directional** Jira → ArchLucid status sync is **committed for V1.1** (configurable mapping; see [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13). OAuth 2.0 / API token auth. **Atlassian tranche:** ships **after** **Confluence** in the **same** paired workstream. |

### V1.1 committed — Teams, Slack, and Confluence

| Surface | MVP commitment |
|---------|----------------|
| **Microsoft Teams**, **Slack**, **Confluence** | **V1.1** per [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.14–§2.15 (Teams/Slack notifications / Confluence page publish). **Code paths, tests, smoke:** [connector readiness matrix](../library/CONNECTOR_READINESS_MATRIX.md). |

### Sequencing and CMDB

- **Build order (V1.1):** **ServiceNow** first. Then **Atlassian pair**: **Confluence** publish **before** **Jira** issue sync — **same** engineering workstream / release tranche ([`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13 / §2.15; [`../PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) *Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)*). **Customer-owned** recipes ([§3](#3-build-your-own) below) align with the **V1.1** buyer contract alongside first-party connectors.
- **CMDB CI class:** **`cmdb_ci_appl`** (Application CI). Match ArchLucid **`SystemName`** to ServiceNow **`name`**; when a row is found, set incident **`cmdb_ci`** to that record’s **`sys_id`**. If no row matches, leave **`cmdb_ci`** empty. **Illustrative Table API lookup:** `GET /api/now/table/cmdb_ci_appl?sysparm_query=name={SystemName}&sysparm_limit=1` (escape/`encodeURIComponent` **`SystemName`** per instance rules).
- **`ServiceNow:AutoCreateCmdbCi`:** Tenant option, default **`false`**. When **`true`**, the connector may create a new **`cmdb_ci_appl`** row when lookup finds no match; when **`false`**, never auto-create.
- **Two-way status sync (ITSM → ArchLucid):** **ServiceNow** and **Jira** **status-only** inbound sync back into ArchLucid finding state is **in committed V1.1 scope** (per [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13 and *Resolved 2026-05-06 / 2026-05-18* in [`../PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)). OAuth 2.0 upgrades remain follow-ons where noted in scope.

### Authentication for integrations

| Method | Use case | Reference |
|--------|----------|-----------|
| **Entra ID (JWT)** | Production integrations, CI/CD pipelines with service principals | [../SECURITY.md](../library/contributor-reference/SECURITY.md), [TENANT_ISOLATION.md](TENANT_ISOLATION.md) |
| **API keys** | Automation, scripts, lightweight integrations | [../SECURITY.md](../library/contributor-reference/SECURITY.md) (RBAC, key rotation) |

---

## 2. Planned connectors [Roadmap]

**ITSM + documentation sequencing:** **ServiceNow** → **Confluence** → **Jira** for **V1.1** — **Confluence** and **Jira** are **paired** (*Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)* in [`../PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)).

### V1.1 aligned patterns (copy-paste recipes)

These are **customer-operated** integration patterns that consume CloudEvents-style payloads — **V1.1 buyer-contract** bridges for **Jira** / **ServiceNow** / **Confluence**-shaped workflows alongside ([§1](#1-available-today-code--v1-ga-buyer-contract)) first-party connectors ([`V1_SCOPE.md`](../library/V1_SCOPE.md) §2.8, §3).

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
| **ITSM / Atlassian** | Jira | First-party ITSM (§2.13); optional Logic Apps / webhook bridges in templates. | **[V1.1 — committed]** — [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_SCOPE §2.13](../library/V1_SCOPE.md), [bridge template](../../templates/integrations/jira/jira-webhook-bridge-recipe.md) |
| **Documentation / Atlassian** | Confluence | First-party publish (§2.15); optional Logic Apps recipe. | **[V1.1 — committed]** — [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_SCOPE §2.15](../library/V1_SCOPE.md), [PENDING_QUESTIONS Improvement 3](../PENDING_QUESTIONS.md), [V1_DEFERRED §6](../library/V1_DEFERRED.md), [CONFLUENCE_PAGE_VIA_LOGIC_APPS.md](../integrations/recipes/CONFLUENCE_PAGE_VIA_LOGIC_APPS.md) |
| **ITSM** | ServiceNow | First-party ITSM (§2.13); optional bridge template. | **[V1.1 — committed]** — [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_SCOPE §2.13](../library/V1_SCOPE.md), [CMDB / sequencing §1](#sequencing-and-cmdb), [bridge template](../../templates/integrations/servicenow/servicenow-incident-recipe.md) |
| **ITSM** | Azure DevOps Work Items | Native work-item connector (distinct from shipped PR decoration). | [Planned] — [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_DEFERRED](../library/V1_DEFERRED.md) |
| **Chat-ops** | Microsoft Teams | Incoming webhook notifications (**§2.14**). | **[V1.1 — committed]** — [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_SCOPE §2.14](../library/V1_SCOPE.md) |
| **Chat-ops** | Slack | First-party chat-ops (§2.14). | **[V1.1 — committed]** — [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_SCOPE §2.14](../library/V1_SCOPE.md) |
| **Observability** | SIEM export (CEF/syslog) | Native audit log export in SIEM-friendly formats | [Planned] — see [SIEM_EXPORT.md](SIEM_EXPORT.md) for current methods |
| **CI/CD** | GitHub Actions | Architecture review as a PR check | [Example available] — see [../integrations/CICD_INTEGRATION.md](../integrations/CICD_INTEGRATION.md) |
| **CI/CD** | Azure DevOps Pipelines | Architecture review as a pipeline task | [Example available] — see [../integrations/CICD_INTEGRATION.md](../integrations/CICD_INTEGRATION.md) |
| **CI/CD** | Azure DevOps Repos (pipelines) | Same `GET /v1/compare` Markdown as GitHub Actions — job summary + sticky PR thread (`integrations/azure-devops-task-manifest-delta*`) | [Shipped] — see [../integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md](../integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md) · [ADR 0024](../architecture/adrs/0024-azure-devops-pipeline-task-parity-with-github-action.md) |
| **CI/CD** | Azure DevOps Repos (Service Bus) | PR thread + status on manifest commit (`com.archlucid.authority.run.completed`) — **zero pipeline changes** | [Shipped] — opt-in Worker handler — see [../integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md](../integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md) |

---

## 3. Build your own

**End-to-end recipe hub (Azure DevOps PR decoration, CloudEvents consumer outline, Power Automate / Logic Apps):** see **[ITSM_BRIDGE_V1_RECIPES.md](../library/ITSM_BRIDGE_V1_RECIPES.md)** — consolidated walkthroughs with exact doc and repo paths. **First-party** **Jira**, **ServiceNow**, **Microsoft Teams**, **Slack** (chat-ops), **CloudEvents**/**Service Bus** integration events, and **Confluence** are **V1.1 commitments** ([`V1_SCOPE.md` §2.8, §2.13–§2.15](../library/V1_SCOPE.md), §3). **Customer-owned** recipes are **V1.1 buyer-contract** bridges alongside those surfaces.

ArchLucid's architecture is designed for extensibility:

- **Context connectors:** Implement `IContextConnector` to bring new data sources into the analysis pipeline. See the finding engine template: `dotnet new archlucid-finding-engine`.
- **Outbound consumers:** Subscribe to **V1.1** CloudEvents webhooks or **Service Bus** topics to trigger workflows in your systems ([`V1_SCOPE.md` §2.8](../library/V1_SCOPE.md)).
- **API automation:** Use the REST API or .NET client to build custom integrations.
- **ITSM + chat-ops + docs:** **V1.1** ships first-party **Jira**, **ServiceNow**, **Microsoft Teams**, **Slack**, **Confluence** publish, and **buyer-contract** webhook/Service Bus fan-out ([`V1_SCOPE.md` §2.8, §2.13–§2.15](../library/V1_SCOPE.md), §3). **Customer-owned** recipes under [`docs/integrations/recipes/`](../../integrations/recipes/README.md) align with that window — **Logic Apps–first:** [ServiceNow (Logic Apps)](../../integrations/recipes/SERVICENOW_INCIDENT_VIA_LOGIC_APPS.md), [Confluence (Logic Apps)](../../integrations/recipes/CONFLUENCE_PAGE_VIA_LOGIC_APPS.md); **Power Automate:** [ServiceNow](../../integrations/recipes/SERVICENOW_INCIDENT_VIA_POWER_AUTOMATE.md), [Jira](../../integrations/recipes/JIRA_ISSUE_VIA_POWER_AUTOMATE.md); **webhook bridge** templates: [ServiceNow](../../templates/integrations/servicenow/servicenow-incident-recipe.md), [Jira](../../templates/integrations/jira/jira-webhook-bridge-recipe.md). Starter **fixture→mapping parity** for bridge authors (Node built-in **`--test`**) lives under [`templates/integrations/bridge-recipe-contract-tests/`](../../templates/integrations/bridge-recipe-contract-tests/README.md), matching CI. Event types: [schemas/integration-events/catalog.json](../../schemas/integration-events/catalog.json) and [INTEGRATION_EVENTS_AND_WEBHOOKS.md](../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md).

---

## 4. Request an integration

Contact your **ArchLucid account team** or the address on your **order form** with your use case. Integration requests inform the connector roadmap.

---

## Related documents

| Doc | Use |
|-----|-----|
| [../library/CONNECTOR_READINESS_MATRIX.md](../library/CONNECTOR_READINESS_MATRIX.md) | Shipped vs planned; auth/secrets; code + tests + smoke |
| [TRUST_CENTER.md](TRUST_CENTER.md) | Trust index |
| [POSITIONING.md](POSITIONING.md) | Product positioning |
| [../API_CONTRACTS.md](../library/API_CONTRACTS.md) | API surface detail |
| [SIEM_EXPORT.md](SIEM_EXPORT.md) | Audit export for SIEM |
| [../integrations/CICD_INTEGRATION.md](../integrations/CICD_INTEGRATION.md) | CI/CD pipeline examples |
