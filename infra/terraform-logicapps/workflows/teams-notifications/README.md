# Microsoft Teams notifications (Logic Apps Standard)

**Purpose:** fan out ArchLucid integration events from **Azure Service Bus** to a Microsoft Teams channel using an **Incoming Webhook** URL resolved at runtime from **Azure Key Vault** (never stored in ArchLucid SQL — see `POST /v1/integrations/teams/connections`).

## Terraform host

When `enable_teams_notifications_logic_app = true`, this module provisions a dedicated **Logic App (Standard)** site (`teams_notifications_logic_app_name`), backing storage, and WS1 plan — same shape as `trial-lifecycle-email` and `incident-chatops`.

## Workflow design (author in Designer)

1. **Service Bus trigger** — subscribe to the integration topic (see [`docs/INTEGRATION_EVENTS_AND_WEBHOOKS.md`](../../../docs/INTEGRATION_EVENTS_AND_WEBHOOKS.md)).
2. **Filter / switch** on `eventType` (catalog: [`schemas/integration-events/catalog.json`](../../../schemas/integration-events/catalog.json)):
   - `com.archlucid.authority.run.completed` — run committed path.
   - `com.archlucid.governance.approval.submitted` — governance approval requested.
   - `com.archlucid.alert.fired` — alert raised.
3. **HTTP GET** (optional) — `GET /v1/notifications/customer-channel-preferences` with managed identity or API key to respect tenant Teams toggles when fan-out is centralized.
4. **HTTP POST Incoming Webhook** — build an **Adaptive Card** JSON body; webhook URL from **Key Vault Get Secret** action using the secret **name** stored per tenant via the ArchLucid API.

## RBAC

Grant the Logic App’s **system-assigned managed identity** `Azure Service Bus Data Receiver` on the topic/subscription used for integration events, and **Get** on the Key Vault secrets referenced by operators.

## References

- [`docs/integrations/MICROSOFT_TEAMS_NOTIFICATIONS.md`](../../../docs/integrations/MICROSOFT_TEAMS_NOTIFICATIONS.md)
- [`docs/adr/0019-logic-apps-standard-edge-orchestration.md`](../../../docs/adr/0019-logic-apps-standard-edge-orchestration.md)
