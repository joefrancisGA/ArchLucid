> **Scope:** Operator smoke — first-party Microsoft Teams incoming-webhook delivery for the canonical trigger catalog plus alert/digest routing parity with Slack; no webhook URLs or tenant ids.

# Smoke — Microsoft Teams (first-party chat-ops)

## Purpose

Confirm **Microsoft Teams incoming webhook** delivery for the canonical **integration-event trigger catalog** ([MICROSOFT_TEAMS_NOTIFICATIONS.md](../MICROSOFT_TEAMS_NOTIFICATIONS.md)) and, where alert/digest routing is used, the same **Authority-shaped** payloads and opt-in model shared with Slack per [V1_SCOPE.md](../../library/V1_SCOPE.md) §2.14. There is no parallel "Teams JSON finding schema" — Teams reuses the product's canonical delivery payload shapes (Adaptive-Card-style summary text built from severity, title, category, trigger, description).

## Prerequisites

- Microsoft Teams channel with an **Incoming Webhook** connector configured (rotate the URL after smoke if it was exposed).
- Access to store the webhook URL as an **Azure Key Vault** secret — ArchLucid persists only the **secret name**, never the raw URL, in `dbo.TenantTeamsIncomingWebhookConnections`.
- **Admin** (or entitled) tenant tier where integration controllers apply; operator role can create connections and alert/digest routes.
- Optional: compare the canonical trigger catalog (`GET /v1/integrations/teams/triggers`) with Slack's `EnabledTriggersJson`-style opt-ins for parity checks.

## Auth and secret pattern

- **Trigger-catalog connection:** `POST /v1/integrations/teams/connections` with `keyVaultSecretName` (must **not** contain `://` — raw webhook URLs are rejected) and optional `enabledTriggers` (subset of the canonical catalog; unknown names return HTTP 400). Read via `GET /v1/integrations/teams/connections`; remove via `DELETE /v1/integrations/teams/connections`.
- **Alert routing:** Create an **`AlertRoutingSubscription`** with `channelType` **`TeamsWebhook`** and `destination` set to the Teams incoming webhook URL — same discipline as Slack (see [CONNECTOR_SMOKE_SLACK.md](CONNECTOR_SMOKE_SLACK.md)).
- **Weekly digests:** Optional **`POST /v1/digest-subscriptions`** with `channelType` **`TeamsWebhook`** for the same webhook style.
- **Probe:** `POST /v1/integrations/webhooks/{routingSubscriptionId}/test` exercises transport with audit (**ExecuteAuthority**); does not substitute a full live alert.

## Test payload (Authority-shaped)

**Trigger-catalog connection** — minimal shape (exact property names in OpenAPI):

```json
{
  "keyVaultSecretName": "teams-incoming-webhook-pilot",
  "label": "Architecture alerts",
  "enabledTriggers": [
    "com.archlucid.authority.run.completed",
    "com.archlucid.alert.fired"
  ]
}
```

**Alert route (create subscription)** — minimal shape:

- `name`, `channelType`: `TeamsWebhook`, `destination`: `https://outlook.office.com/webhook/...` (placeholder in docs only), `minimumSeverity`, `isEnabled`.

Delivery uses **`AlertTeamsWebhookDeliveryChannel`**, which posts a JSON body built from the **AlertDeliveryPayload** (severity, title, category, trigger, description) — conformance tests lock "no destination echo in JSON body." Digest routes use **`DigestTeamsWebhookDeliveryChannel`** with the same payload discipline.

## Expected ArchLucid audit events

| Action | Event type(s) |
|--------|----------------|
| Create/update trigger-catalog connection | `TenantTeamsIncomingWebhookConnectionUpserted` (includes `keyVaultSecretName`, not the webhook URL) |
| Create alert route | `AlertRoutingSubscriptionCreated` (includes `channelType`, not destination URL) |
| Toggle route | `AlertRoutingSubscriptionToggled` |
| Create digest route | `DigestSubscriptionCreated` |
| Toggle digest route | `DigestSubscriptionToggled` |
| Successful alert post | `AlertDeliverySucceeded` |
| Failed alert post | `AlertDeliveryFailed` |
| Successful digest post | `DigestDeliverySucceeded` |
| Failed digest post | `DigestDeliveryFailed` |
| Webhook connectivity test | `AlertRoutingWebhookPingExecuted` (transport outcome, status code; subscription-scoped) |

Slack-specific alert/digest events apply identically to Teams (shared delivery-channel contract); only `TenantTeamsIncomingWebhookConnectionUpserted` is Teams-only.

## Expected external artifact

- **Teams:** message card in the target channel; body includes severity label, title, and triage fields for the alert/digest/trigger-catalog event (parity with Slack readability goals).
- **Optional:** action link lines when the payload builder includes run/manifest/approval/alert deep links (see [MICROSOFT_TEAMS_NOTIFICATIONS.md](../MICROSOFT_TEAMS_NOTIFICATIONS.md) v1 trigger table).

## Rollback and cleanup

- **Trigger-catalog connection:** `DELETE /v1/integrations/teams/connections`, or set `enabledTriggers: []` to opt out of every trigger without removing the connection.
- **Alert / digest route:** disable or delete the subscription used for smoke (`isEnabled: false` or delete via API if supported).
- **Teams:** rotate or remove the incoming webhook connector if the URL might have leaked; delete test messages as workspace policy allows.

## Troubleshooting

- **400 on connection create:** `keyVaultSecretName` contains `://` (raw URL rejected), or `enabledTriggers` includes a name outside the canonical catalog (`GET /v1/integrations/teams/triggers` lists valid values).
- **403 from Teams:** regenerate the incoming webhook connector in Teams channel settings; confirm it still targets the pilot channel.
- **No message:** confirm the connection/subscription is **enabled**, severity meets **`minimumSeverity`** (alert path), and the trigger is present in `enabledTriggers` (trigger-catalog path).
- **Ping works, real delivery fails:** compare `AlertDeliveryFailed` payload with routing subscription id; inspect upstream alert pipeline vs. isolated poster mocks in CI.
