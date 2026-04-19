# Workflow `marketplace-fulfillment-handoff`

**Objective:** After ArchLucid has **already** verified the Marketplace JWT, persisted idempotency, and updated billing state (`POST /v1/billing/webhooks/marketplace` → `AzureMarketplaceBillingProvider`), consume **`com.archlucid.billing.marketplace.webhook.received.v1`** from Service Bus to fan out **non-authoritative** notifications (Teams sales channel, CRM connector, internal email). This workflow must **not** replace the HTTPS webhook or re-parse unsigned Marketplace payloads.

**Trust boundary:** ADR **0016** (billing) and ADR **0019** (Logic Apps). Logic Apps sit **downstream** of the integration event, not in front of the anonymous webhook.

## Service Bus

1. In **`infra/terraform-servicebus/`**, set **`enable_logic_app_marketplace_fulfillment_subscription = true`**.
2. After the Logic App (Standard) site exists, set **`marketplace_fulfillment_logic_app_managed_identity_principal_id`** to that host’s system-assigned (or user-assigned) principal id, then re-apply Service Bus so **Azure Service Bus Data Receiver** is granted at namespace scope (same pattern as governance / trial / ChatOps).
3. Trigger the workflow on the subscription name from Terraform output **`logic_app_marketplace_fulfillment_subscription_name`**.

The **`$Default`** rule filters **`event_type = 'com.archlucid.billing.marketplace.webhook.received.v1'`** (matches `IntegrationEventTypes.BillingMarketplaceWebhookReceivedV1`).

## Payload contract

| Source | Use |
|--------|-----|
| JSON Schema | `schemas/integration-events/billing-marketplace-webhook-received.v1.schema.json` |
| Catalog | `schemas/integration-events/catalog.json` |

Body is a **domain summary** (tenant/scope ids, `action`, `subscriptionId`, `providerDedupeKey`, `billingProvider`) — **no raw JWT** and not a full Marketplace POST replay.

## HTTP callbacks (optional)

Prefer **read-only** or **idempotent** routes already owned by billing or tenancy. Do **not** invent parallel “activate subscription” paths that bypass `AzureMarketplaceBillingProvider` unless product explicitly adds them. Typical pattern: Teams adaptive card with deep link to operator UI, or CRM upsert keyed by `providerDedupeKey` / `subscriptionId`.

## Still out of repo

`workflow.json`, OAuth connector bundles, and any CRM-specific mapping tables — author in Azure Portal or your CD pipeline, then attach to the Logic App file share per org change control.
