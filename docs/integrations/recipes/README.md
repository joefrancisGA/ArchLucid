> **Scope:** Integrator entry for **OpenAPI**-aligned REST clients and **webhook** configuration, plus an index of **customer-owned** no-code recipes (Power Automate / Logic Apps) — **primary V1 path** for Jira / ServiceNow / Confluence–shaped workflows until **V1.1** first-party connectors ship ([`V1_SCOPE.md`](../../library/V1_SCOPE.md) §2.13–§2.15).

**Audience:** Integration engineers building **REST clients**, configuring **webhooks** (inbound or outbound), or preferring **customer-operated** Microsoft automation for ITSM/documentation bridges.

**Customer-owned means:** Step-by-step automation docs here are **reference recipes only**. They are **not** marketplace listings, vendor-certified apps, or ArchLucid-managed integrations. ArchLucid publishes CloudEvents (or Service Bus messages); **your** tenant wires webhooks and calls third-party REST APIs under **your** contracts with Microsoft, Atlassian, and ServiceNow.

**Why this folder?** **First-party** **Jira**, **ServiceNow**, **Slack**, and **Confluence** are **V1.1** product commitments ([`V1_SCOPE.md`](../../library/V1_SCOPE.md) §2.13–§2.15, [INTEGRATION_CATALOG.md](../../go-to-market/INTEGRATION_CATALOG.md)). Recipes below use the same [event catalog](../../../schemas/integration-events/catalog.json) and [webhook / HMAC contracts](../../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md) as any subscriber.

**Roadmap truth check:** Connector SKU status and “planned vs shipped” remain authoritative in [INTEGRATION_CATALOG.md](../../go-to-market/INTEGRATION_CATALOG.md).

---

## OpenAPI REST clients (`GET /openapi/v1.json`)

Use the **Microsoft OpenAPI** document only — **not** `/swagger/v1/swagger.json` (explorer-only; can drift). Full contract rules: [**API_CONTRACTS.md**](../../library/API_CONTRACTS.md) · drift / snapshot workflow: [**OPENAPI_CONTRACT_DRIFT.md**](../../library/OPENAPI_CONTRACT_DRIFT.md).

| Step | What to do |
|------|------------|
| **1. Fetch** | `GET https://<api-host>/openapi/v1.json` (requires auth consistent with your environment — API keys, JWT, etc.; see [**SECURITY.md**](../../library/SECURITY.md)). |
| **2. Generate** | Import into **OpenAPI Generator**, **Kiota**, **NSwag**, **openapi-typescript**, APIM, or your gateway’s OpenAPI importer. Maintainer snapshot/regen workflow: [**OPENAPI_CONTRACT_DRIFT.md**](../../library/OPENAPI_CONTRACT_DRIFT.md). |
| **3. Smoke manually** | Repo [**`contracts/bruno/`**](../../../contracts/bruno/) holds example HTTP requests (set `baseUrl` + credentials per environment). Interactive UI (when enabled): [**API_EXPLORER.md**](../../library/API_EXPLORER.md). |

**Minimal download (replace host and auth):**

```bash
curl -sS -o archlucid-openapi-v1.json "https://<api-host>/openapi/v1.json"
```

**Example — OpenAPI Generator (Docker, C# client):**

```bash
docker run --rm -v "${PWD}:/local" openapitools/openapi-generator-cli:latest generate \
  -i /local/archlucid-openapi-v1.json -g csharp -o /local/out/csharp-client --additional-properties=targetFramework=net8.0
```

Recipes that call ArchLucid from Power Automate often **Parse JSON** using DTO names from the same document (e.g. **`RunDetailDto`**) — see [ServiceNow (Power Automate)](SERVICENOW_INCIDENT_VIA_POWER_AUTOMATE.md) and [Jira (Power Automate)](JIRA_ISSUE_VIA_POWER_AUTOMATE.md).

---

## Webhook configuration

| Topic | Document |
|-------|----------|
| **Outbound** subscriber setup — CloudEvents envelope, delivery modes, **`X-ArchLucid-Webhook-Signature`** | [**INTEGRATION_EVENTS_AND_WEBHOOKS.md**](../../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md) |
| **Outbound** JSON payload shapes (quick reference + samples) | [**WEBHOOK_SCHEMAS.md**](../WEBHOOK_SCHEMAS.md) · [**INTEGRATION_EVENT_CATALOG.md**](../../library/INTEGRATION_EVENT_CATALOG.md) |
| **Outbound** AsyncAPI narrative | [`docs/contracts/archlucid-asyncapi-2.6.yaml`](../../contracts/archlucid-asyncapi-2.6.yaml) |
| **Inbound** ITSM HTTP bridges (shared-secret routes; shapes on OpenAPI) | [**API_CONTRACTS.md**](../../library/API_CONTRACTS.md) (search **`/v1/integrations/webhooks`**); developer-oriented [**JIRA_WEBHOOK_BRIDGE.md**](../JIRA_WEBHOOK_BRIDGE.md) |
| **Hardening** Event Grid / HTTPS subscribers | [Event Grid / webhook hardening checklist](recipe-event-grid-webhook-hardening-checklist.md) |
| **Machine-readable** event schemas | [`schemas/integration-events/catalog.json`](../../../schemas/integration-events/catalog.json) |

---

## No-code automation recipes

| Recipe | Target tool | Automation platform | Event type(s) |
|--------|-------------|---------------------|----------------|
| [Azure Logic Apps → Azure DevOps work item](recipe-azure-logic-apps-webhook-to-ado-work-item.md) | Azure DevOps (Boards) | Azure Logic Apps + APIM/Function (HMAC) | `com.archlucid.authority.run.completed`, `com.archlucid.alert.fired` |
| [ServiceNow incident via Logic Apps](SERVICENOW_INCIDENT_VIA_LOGIC_APPS.md) | ServiceNow | Azure Logic Apps (Standard) | `com.archlucid.authority.run.completed`, `com.archlucid.alert.fired` |
| [Jira issue via Logic Apps](JIRA_ISSUE_VIA_LOGIC_APPS.md) | Atlassian Jira Cloud | Azure Logic Apps (Standard) | `com.archlucid.authority.run.completed`, `com.archlucid.alert.fired` |
| [Event Grid / webhook hardening checklist](recipe-event-grid-webhook-hardening-checklist.md) | *(subscriber hardening)* | Event Grid, APIM, Logic Apps, Functions | *(delivery semantics — see checklist)* |
| [ServiceNow incident via Power Automate](SERVICENOW_INCIDENT_VIA_POWER_AUTOMATE.md) | ServiceNow | Microsoft Power Automate | `com.archlucid.authority.run.completed`, `com.archlucid.alert.fired` |
| [Jira issue via Power Automate](JIRA_ISSUE_VIA_POWER_AUTOMATE.md) | Atlassian Jira Cloud | Microsoft Power Automate | `com.archlucid.authority.run.completed`, `com.archlucid.alert.fired` |
| [Confluence page via Logic Apps](CONFLUENCE_PAGE_VIA_LOGIC_APPS.md) | Atlassian Confluence Cloud | Azure Logic Apps (Standard) | `com.archlucid.authority.run.completed`, `com.archlucid.advisory.scan.completed` |

---

## Event catalog (reference)

All recipes subscribe to event types defined in [`IntegrationEventTypes.cs`](../../../ArchLucid.Core/Integration/IntegrationEventTypes.cs). For narrative catalog, payload schemas, and delivery configuration:

| Resource | Path |
|----------|------|
| Event catalog (narrative) | [INTEGRATION_EVENT_CATALOG.md](../../library/INTEGRATION_EVENT_CATALOG.md) |
| **Webhooks, CloudEvents envelope, HMAC** | [INTEGRATION_EVENTS_AND_WEBHOOKS.md](../../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md) |
| **Connector roadmap (first-party vs customer bridge)** | [INTEGRATION_CATALOG.md](../../go-to-market/INTEGRATION_CATALOG.md) |
| Machine-readable schema catalog | [`schemas/integration-events/catalog.json`](../../../schemas/integration-events/catalog.json) |
| AsyncAPI contract | [`docs/contracts/archlucid-asyncapi-2.6.yaml`](../../contracts/archlucid-asyncapi-2.6.yaml) |

---

## Relationship to existing bridge templates

The [`templates/integrations/`](../../../templates/integrations/) folder contains **developer-oriented** bridge recipes (custom code, Azure Functions, HMAC verification) for Jira and ServiceNow. The recipes in **this** folder are the **no-code** equivalents — they use the same CloudEvents payloads but wire everything through Power Automate or Logic Apps designers.

| Audience | Folder |
|----------|--------|
| Developer writing custom bridge code | [`templates/integrations/jira/`](../../../templates/integrations/jira/jira-webhook-bridge-recipe.md) · **[`../JIRA_WEBHOOK_BRIDGE.md`](../JIRA_WEBHOOK_BRIDGE.md)** + [`scripts/integrations/jira/`](../../../scripts/integrations/jira/), [`templates/integrations/servicenow/`](../../../templates/integrations/servicenow/servicenow-incident-recipe.md) |
| Operator using no-code automation | `docs/integrations/recipes/` (this folder) |

---

## First-party roadmap vs these recipes

When you adopt **managed** ArchLucid connectors, prefer **[INTEGRATION_CATALOG.md](../../go-to-market/INTEGRATION_CATALOG.md)** §1 (**V1.1** first-party program). **V1** tenants rely on these recipes (and **Teams** / **webhooks**) as the **primary** path:

- **Jira** + **ServiceNow** + **Confluence** — **V1.1** first-party ships per [`V1_SCOPE.md`](../../library/V1_SCOPE.md) §2.13–§2.15 (**ServiceNow** → **Confluence** → **Jira**, **Atlassian paired**); recipes cover **V1** and hybrid topologies.

See [INTEGRATION_CATALOG.md](../../go-to-market/INTEGRATION_CATALOG.md) for connector SKU status.

---

*Last reviewed: 2026-05-17 — README reorganized to foreground OpenAPI client entry and webhook configuration; Atlassian sequencing unchanged.*
