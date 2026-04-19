# Workflow `incident-chatops`

**Objective:** Route **`com.archlucid.alert.fired`** and **`com.archlucid.alert.resolved`** to Teams or PagerDuty; adaptive card actions call **existing** ArchLucid alert APIs only (no new alert events from the workflow).

## Service Bus

1. In **`infra/terraform-servicebus/`**, set **`enable_logic_app_incident_chatops_subscription = true`** and wire **`incident_chatops_logic_app_managed_identity_principal_id`** after the Logic App exists (namespace **Data Receiver**).
2. Trigger on the subscription name from Terraform output **`logic_app_incident_chatops_subscription_name`**.

## User properties (for SQL filters and expressions)

| Property | When |
|----------|------|
| **`event_type`** | Always set by **`AzureServiceBusIntegrationEventPublisher`**. |
| **`severity`** | **`com.archlucid.alert.fired`** — lowercased from JSON `severity`. |
| **`deduplication_key`** | Fired and resolved when JSON includes **`deduplicationKey`** (resolved populated from **`AlertIntegrationEventPublishing`**). |

Example SQL for a **severity-only** fan-out (add as a **second rule** on a dedicated subscription if you split from the default module subscription):  
`event_type = 'com.archlucid.alert.fired' AND severity = 'critical'`  
(Confirm your **`AlertRecord.Severity`** vocabulary matches lowercased values.)

## HTTP callbacks (ArchLucid.Api)

| Intent | Method | Path | Auth |
|--------|--------|------|------|
| Acknowledge one | POST | `/v1/alerts/{alertId}/action` | Body `{ "action": "Acknowledge", "comment": "…" }` — **`ExecuteAuthority`**. |
| Acknowledge many | POST | `/v1/alerts/acknowledge-batch` | Body `{ "alertIds": ["…"], "comment": "…" }` — **`ExecuteAuthority`**. |
| Resolve / suppress | POST | `/v1/alerts/{alertId}/action` | Body `{ "action": "Resolve" \| "Suppress", … }`. |

Use **`alertId`** from the Service Bus message JSON. Pass **scope** (`X-ArchLucid-*` headers or your deployment’s equivalent) consistent with **`tenantId` / `workspaceId` / `projectId`** in the payload.

**Operator runbook (full):** `docs/runbooks/LOGIC_APPS_INCIDENT_CHATOPS.md`

## Still out of repo

`workflow.json`, OAuth connections, PagerDuty connector configuration, and Teams **update message** steps keyed by **`deduplication_key`**.
