> **Scope:** Operator smoke — first-party Slack incoming-webhook delivery for alerts/digests; no webhook URLs or tenant ids.

# Smoke — Slack (first-party chat-ops)

## Purpose

Confirm **Slack incoming webhook** delivery with the same **Authority-shaped** text payloads and trigger opt-in model as Microsoft Teams per [V1_SCOPE.md](../../library/V1_SCOPE.md) §2.14 and [INTEGRATION_CATALOG.md](../../go-to-market/INTEGRATION_CATALOG.md). Slack uses **subscription rows** (alert routing and digest routing) that reference webhook destinations — there is **no** parallel “Slack JSON finding schema”; alerts/digests reuse the product’s canonical delivery payload shapes.

## Prerequisites

- Slack workspace with an **incoming webhook** URL for a **pilot channel** (rotate after smoke if the URL was exposed).
- **Standard** (or entitled) tenant tier where integration controllers apply; operator role can create routes.
- Optional: compare **`EnabledTriggersJson`-style** opt-ins with Teams using catalog tables (product-specific; see Teams documentation for trigger names).

## Auth and secret pattern

- **Alert routing:** Create or update an **`AlertRoutingSubscription`** with `channelType` **`SlackWebhook`** and `destination` set to the Slack incoming webhook URL. The destination is **sensitive** — restrict SQL access and operator exports; Treat like a secret even though the current shipped model persists the URI on the subscription row (unlike Teams **Key Vault secret-name-only** storage). **Teams** connector uses `GET/POST/DELETE /v1/integrations/teams/connections`; **Slack** readiness is tracked via alert routes (see **`ConnectorOperationsSummaryReader`** / operator integrations summary).
- **Weekly digests:** Optional **`POST /v1/digest-subscriptions`** with `channelType` **`SlackWebhook`** for the same webhook style.
- **Probe:** `POST /v1/integrations/webhooks/{routingSubscriptionId}/test` exercises transport with audit (**ExecuteAuthority**); does not substitute a full live alert.

## Test payload (Authority-shaped)

**Alert route (create subscription)** — minimal shape (exact property names in OpenAPI):

- `name`, `channelType`: `SlackWebhook`, `destination`: `https://hooks.slack.com/services/...` (placeholder in docs only), `minimumSeverity`, `isEnabled`.

Delivery uses **`AlertSlackWebhookDeliveryChannel`**, which posts a JSON body with a top-level **`text`** field built from the **AlertDeliveryPayload** (severity, title, category, trigger, description) — conformance tests lock “no destination echo in JSON body.”

**Digest route** — Digest subscription with `channelType` **`SlackWebhook`**; payloads follow **`DigestSlackWebhookDeliveryChannel`** (advisory Markdown / summary text per implementation).

Neither path introduces a Slack-specific “finding” schema — they consume the same structured delivery payloads as other channels.

## Expected ArchLucid audit events

| Action | Event type(s) |
|--------|----------------|
| Create alert route | `AlertRoutingSubscriptionCreated` (includes `channelType`, not destination URL) |
| Toggle route | `AlertRoutingSubscriptionToggled` |
| Create digest route | `DigestSubscriptionCreated` |
| Toggle digest route | `DigestSubscriptionToggled` |
| Successful alert post | `AlertDeliverySucceeded` |
| Failed alert post | `AlertDeliveryFailed` |
| Successful digest post | `DigestDeliverySucceeded` |
| Failed digest post | `DigestDeliveryFailed` |
| Webhook connectivity test | `AlertRoutingWebhookPingExecuted` (transport outcome, status code; subscription-scoped) |

Teams-specific **`TenantTeamsIncomingWebhookConnectionUpserted`** events do **not** apply to Slack.

## Expected external artifact

- **Slack:** chat message in the target channel; `text` includes severity label, title, and triage fields for the alert/digest (parity with Teams readability goals).
- **Optional:** attachment or link lines when the payload builder includes run/manifest URLs — verify against your environment’s markdown formatter.

## Rollback and cleanup

- Disable or delete the **alert** / **digest** subscription used for smoke (`isEnabled: false` or delete via API if supported).
- **Slack:** remove or rotate the incoming webhook if the URL might have leaked; delete test messages as workspace policy allows.

## Troubleshooting

- **403 from Slack:** regenerate the incoming webhook in Slack app settings; confirm the webhook still targets the pilot channel.
- **No message:** confirm subscription is **enabled**, severity meets **`minimumSeverity`**, and alert rules actually fire for the scope (use simulation where available).
- **Ping works, real delivery fails:** compare `AlertDeliveryFailed` payload with routing subscription id; inspect upstream alert pipeline vs. isolated poster mocks in CI.
