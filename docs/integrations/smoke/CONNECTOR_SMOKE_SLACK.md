> **Scope:** Smoke validation — Slack incoming webhook notifications (parity with Teams alerting).

# Smoke — Slack webhook delivery

## Prerequisites

- Slack incoming webhook URL secret stored under the **Key Vault secret name** referenced by the tenant’s Slack connection configuration (same discipline as Teams).
- Alert or digest rule configured with a trigger that can fire in a **lower environment**.

## Happy path (operator)

1. Register/update the Slack connection via `GET/POST/DELETE /v1/integrations/slack/connections` (see OpenAPI for exact schema in your build).
2. Fire a **test alert** or use an existing low-risk trigger that should post to Slack.

## Verification

- **Slack:** message received on the expected channel; payload includes severity + deep link/reference to ArchLucid.
- **Audit:** delivery attempt row with success; failures include HTTP status / retry metadata where enabled.

## Troubleshooting

- **403 from Slack:** regenerate webhook; confirm workspace retention policies.
- **Missing triggers:** compare `EnabledTriggersJson` with Teams parity tables in [INTEGRATION_CATALOG.md](../../go-to-market/INTEGRATION_CATALOG.md).
