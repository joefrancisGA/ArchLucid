# Microsoft Teams notification connector

**Scope:** Operator-configured **Microsoft Teams Incoming Webhook** delivery for selected integration events, with webhook material held in **Azure Key Vault** and only a **secret name reference** stored in ArchLucid SQL.

## Architecture

| Node | Role |
|------|------|
| ArchLucid API | `POST /v1/integrations/teams/connections` stores `KeyVaultSecretName` + optional `Label` per tenant (`ExecuteAuthority`). |
| Azure Key Vault | Holds the actual Teams incoming webhook URL as a secret value. |
| Logic Apps Standard | Subscribes to Service Bus; resolves secret; POSTs Adaptive Card to Teams (see `infra/terraform-logicapps/workflows/teams-notifications/README.md`). |
| Service Bus | Topics per [`schemas/integration-events/catalog.json`](../../schemas/integration-events/catalog.json). |

## API

### Configure (Execute+)

```bash
curl -sS -X POST "https://<api-host>/v1/integrations/teams/connections" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"keyVaultSecretName":"teams-incoming-webhook-prod","label":"Architecture alerts"}'
```

**Validation:** `keyVaultSecretName` must **not** contain `://` — raw webhook URLs are rejected to keep secrets out of SQL.

### Read (Read+)

```bash
curl -sS "https://<api-host>/v1/integrations/teams/connections" \
  -H "Authorization: Bearer <token>"
```

### Remove (Execute+)

```bash
curl -sS -X DELETE "https://<api-host>/v1/integrations/teams/connections" \
  -H "Authorization: Bearer <token>"
```

## Operator UI

**Path:** `/integrations/teams` (Enterprise Controls — extended tier). Writes use the same **`useEnterpriseMutationCapability()`** floor as other Enterprise surfaces.

## Screenshot stub

> Placeholder: capture the Teams configuration page after first pilot wiring; store under `docs/go-to-market/screenshots/` and link from the integration catalog when available.
