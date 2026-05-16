> **Scope:** ArchLucid — Integration catalog — buyer-facing narrative, roadmap table, and links. Per-connector **status, direction, auth, secrets, code entry points, tests, and smoke** live in [`../library/CONNECTOR_READINESS_MATRIX.md`](../library/CONNECTOR_READINESS_MATRIX.md).

> **Spine doc:** [`START_HERE.md`](../../docs/START_HERE.md).


# ArchLucid — Integration catalog

**Audience:** Technical evaluators and integration engineers assessing how ArchLucid connects to their ecosystem.

**Last reviewed:** 2026-05-05 — **Jira**, **ServiceNow**, **Slack**, and **Confluence** first-party surfaces in **V1** ([`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13–§2.15). V1 copy-paste recipes unchanged under `docs/integrations/recipes/`. **Engineering order:** **ServiceNow** → **Confluence** → **Jira** — **Atlassian** (**Confluence** + **Jira**) is **one workstream**, **Confluence** first (*Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)* in [`../PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)); supersedes prior ServiceNow → Jira → Confluence ordering.

**Philosophy:** ArchLucid connects to your tools — you do not run our agents in your infrastructure. All integrations operate via the hosted API, webhooks, or managed connectors.

**Connector readiness matrix (implementers):** [../library/CONNECTOR_READINESS_MATRIX.md](../library/CONNECTOR_READINESS_MATRIX.md) — shipped vs recipe vs planned; **product** vs **customer-operated**; code paths and tests.

**Smoke recipes (first-party connectors):** [../integrations/CONNECTOR_SMOKE_INDEX.md](../integrations/CONNECTOR_SMOKE_INDEX.md)

---

## 1. Available today (V1)

**Surfaces in production scope** include **REST API**, **.NET client**, **CLI**, **webhooks / CloudEvents**, optional **Azure Service Bus** integration events, **SCIM**, **Teams**, **Slack**, **Confluence**, **Jira**, **ServiceNow**, **Azure DevOps** PR/manifest decoration, **Azure extractor ZIP ingest**, and contracts (**OpenAPI**, **AsyncAPI**). See the **[connector readiness matrix](../library/CONNECTOR_READINESS_MATRIX.md)** for direction, auth, secret handling, **source entry points**, **primary tests**, and **smoke/runbook** links.

Also:

| Item | Note |
|------|------|
| **Procurement ZIP** | Reproducible `dist/procurement-pack.zip` via `scripts/build_procurement_pack.sh` / `.ps1`. See [TRUST_CENTER.md](TRUST_CENTER.md). |
| **AsyncAPI** | Async contract for webhook and Service Bus consumers (see matrix + [INTEGRATION_EVENTS_AND_WEBHOOKS.md](../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md)). |

### V1 committed — first-party ITSM connectors

Ship tracks **V1 GA** ([`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13); marketplace/store listings may trail usable connectors.

| Connector | MVP commitment |
|-----------|----------------|
| **ServiceNow** | Finding → **`incident`** with correlation back-link; **basic auth** for V1 MVP (OAuth 2.0 follow-on per §2.13). **`cmdb_ci`** via **`cmdb_ci_appl`** name lookup on **`SystemName`** ([§ Sequencing and CMDB](#sequencing-and-cmdb) below). **Two-way** ServiceNow → ArchLucid **status-only** sync is **committed for V1 GA** (configurable mapping; see [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13). |
| **Jira** | Finding → issue with correlation back-link; **bi-directional** Jira → ArchLucid status sync is **committed for V1 GA** (configurable mapping; see [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13). OAuth 2.0 / API token auth. **Atlassian tranche:** ships **after** **Confluence** in the **same** paired workstream. |

### V1 committed — Slack and Confluence

| Surface | MVP commitment |
|---------|----------------|
| **Slack**, **Confluence** | **V1 GA** per [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.14–§2.15 (notifications / page publish). **Code paths, tests, smoke:** [connector readiness matrix](../library/CONNECTOR_READINESS_MATRIX.md). |

### Sequencing and CMDB

- **Build order:** **ServiceNow** first. Then **Atlassian pair**: **Confluence** publish **before** **Jira** issue sync — **same** engineering workstream / release tranche ([`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13 / §2.15; [`../PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md) *Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)*). Until connectors are enabled in your tenant, use **customer-owned** recipes ([§3](#3-build-your-own) below).
- **CMDB CI class:** **`cmdb_ci_appl`** (Application CI). Match ArchLucid **`SystemName`** to ServiceNow **`name`**; when a row is found, set incident **`cmdb_ci`** to that record’s **`sys_id`**. If no row matches, leave **`cmdb_ci`** empty. **Illustrative Table API lookup:** `GET /api/now/table/cmdb_ci_appl?sysparm_query=name={SystemName}&sysparm_limit=1` (escape/`encodeURIComponent` **`SystemName`** per instance rules).
- **`ServiceNow:AutoCreateCmdbCi`:** Tenant option, default **`false`**. When **`true`**, the connector may create a new **`cmdb_ci_appl`** row when lookup finds no match; when **`false`**, never auto-create.
- **Two-way status sync (ITSM → ArchLucid):** **ServiceNow** and **Jira** **status-only** inbound sync back into ArchLucid finding state is **in committed V1 GA scope** (per [`../library/V1_SCOPE.md`](../library/V1_SCOPE.md) §2.13 and *Resolved 2026-05-06 (ITSM bidirectional sync — both connectors)* in [`../PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)). OAuth 2.0 upgrades remain follow-ons where noted in scope.

### Authentication for integrations

| Method | Use case | Reference |
|--------|----------|-----------|
| **Entra ID (JWT)** | Production integrations, CI/CD pipelines with service principals | [../SECURITY.md](../library/SECURITY.md), [TENANT_ISOLATION.md](TENANT_ISOLATION.md) |
| **API keys** | Automation, scripts, lightweight integrations | [../SECURITY.md](../library/SECURITY.md) (RBAC, key rotation) |

---

## 2. Planned connectors [Roadmap]

**ITSM + documentation sequencing:** **ServiceNow** → **Confluence** → **Jira** for **V1** — **Confluence** and **Jira** are **paired** (*Resolved 2026-05-05 (Atlassian sequencing — Confluence before Jira)* in [`../PENDING_QUESTIONS.md`](../PENDING_QUESTIONS.md)).

### V1 supported patterns (copy-paste recipes)

These are **customer-operated** integration patterns that consume CloudEvents-style payloads — they **do not** replace **V1** first-party commitments for **Jira** / **ServiceNow** / **Confluence** ([§1](#1-available-today-v1)); they remain useful optional bridges.

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
| **ITSM / Atlassian** | Jira | First-party ITSM (§2.13); optional Logic Apps / webhook bridges in templates. | **[V1 — committed]** — [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_SCOPE §2.13](../library/V1_SCOPE.md), [bridge template](../../templates/integrations/jira/jira-webhook-bridge-recipe.md) |
| **Documentation / Atlassian** | Confluence | First-party publish (§2.15); optional Logic Apps recipe. | **[V1 — committed]** — [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_SCOPE §2.15](../library/V1_SCOPE.md), [PENDING_QUESTIONS Improvement 3](../PENDING_QUESTIONS.md), [V1_DEFERRED §6](../library/V1_DEFERRED.md), [CONFLUENCE_PAGE_VIA_LOGIC_APPS.md](../integrations/recipes/CONFLUENCE_PAGE_VIA_LOGIC_APPS.md) |
| **ITSM** | ServiceNow | First-party ITSM (§2.13); optional bridge template. | **[V1 — committed]** — [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_SCOPE §2.13](../library/V1_SCOPE.md), [CMDB / sequencing §1](#sequencing-and-cmdb), [bridge template](../../templates/integrations/servicenow/servicenow-incident-recipe.md) |
| **ITSM** | Azure DevOps Work Items | Native work-item connector (distinct from shipped PR decoration). | [Planned] — [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_DEFERRED](../library/V1_DEFERRED.md) |
| **Chat-ops** | Slack | First-party chat-ops (§2.14). | **[V1 — committed]** — [matrix](../library/CONNECTOR_READINESS_MATRIX.md), [V1_SCOPE §2.14](../library/V1_SCOPE.md) |
| **Observability** | SIEM export (CEF/syslog) | Native audit log export in SIEM-friendly formats | [Planned] — see [SIEM_EXPORT.md](SIEM_EXPORT.md) for current methods |
| **CI/CD** | GitHub Actions | Architecture review as a PR check | [Example available] — see [../integrations/CICD_INTEGRATION.md](../integrations/CICD_INTEGRATION.md) |
| **CI/CD** | Azure DevOps Pipelines | Architecture review as a pipeline task | [Example available] — see [../integrations/CICD_INTEGRATION.md](../integrations/CICD_INTEGRATION.md) |
| **CI/CD** | Azure DevOps Repos (pipelines) | Same `GET /v1/compare` Markdown as GitHub Actions — job summary + sticky PR thread (`integrations/azure-devops-task-manifest-delta*`) | [Shipped] — see [../integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md](../integrations/AZURE_DEVOPS_PIPELINE_TASK_MANIFEST_DELTA_PR_COMMENT.md) · [ADR 0024](../adr/0024-azure-devops-pipeline-task-parity-with-github-action.md) |
| **CI/CD** | Azure DevOps Repos (Service Bus) | PR thread + status on manifest commit (`com.archlucid.authority.run.completed`) — **zero pipeline changes** | [Shipped] — opt-in Worker handler — see [../integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md](../integrations/AZURE_DEVOPS_PR_DECORATION_SERVER_SIDE.md) |

---

## 3. Build your own

**End-to-end recipe hub (Azure DevOps PR decoration, CloudEvents consumer outline, Power Automate / Logic Apps):** see **[ITSM_BRIDGE_V1_RECIPES.md](../library/ITSM_BRIDGE_V1_RECIPES.md)** — consolidated walkthroughs with exact doc and repo paths. **First-party** **Jira**, **ServiceNow**, **Slack** (chat-ops), and **Confluence** are **V1 commitments** ([`V1_SCOPE.md` §2.13–§2.15](../library/V1_SCOPE.md)). Recipes stay **optional** customer-operated bridges.

ArchLucid's architecture is designed for extensibility:

- **Context connectors:** Implement `IContextConnector` to bring new data sources into the analysis pipeline. See the finding engine template: `dotnet new archlucid-finding-engine`.
- **Outbound consumers:** Subscribe to CloudEvents webhooks or Service Bus topics to trigger workflows in your systems.
- **API automation:** Use the REST API or .NET client to build custom integrations.
- **ITSM + chat-ops + docs:** **V1** ships first-party **Jira**, **ServiceNow**, **Slack**, and **Confluence** publish ([`V1_SCOPE.md` §2.13–§2.15](../library/V1_SCOPE.md)). Until enabled for your tenant — or when you prefer Microsoft automation — use **customer-owned** recipes under [`docs/integrations/recipes/`](../../integrations/recipes/README.md): **Logic Apps–first:** [ServiceNow (Logic Apps)](../../integrations/recipes/SERVICENOW_INCIDENT_VIA_LOGIC_APPS.md), [Confluence (Logic Apps)](../../integrations/recipes/CONFLUENCE_PAGE_VIA_LOGIC_APPS.md); **Power Automate:** [ServiceNow](../../integrations/recipes/SERVICENOW_INCIDENT_VIA_POWER_AUTOMATE.md), [Jira](../../integrations/recipes/JIRA_ISSUE_VIA_POWER_AUTOMATE.md); **webhook bridge** templates: [ServiceNow](../../templates/integrations/servicenow/servicenow-incident-recipe.md), [Jira](../../templates/integrations/jira/jira-webhook-bridge-recipe.md). Starter **fixture→mapping parity** for bridge authors (Node built-in **`--test`**) lives under [`templates/integrations/bridge-recipe-contract-tests/`](../../templates/integrations/bridge-recipe-contract-tests/README.md), matching CI. Event types: [schemas/integration-events/catalog.json](../../schemas/integration-events/catalog.json) and [INTEGRATION_EVENTS_AND_WEBHOOKS.md](../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md).

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
