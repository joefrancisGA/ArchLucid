> **Scope:** Operator-configured **Microsoft Teams Incoming Webhook** delivery for selected integration events, with webhook material held in **Azure Key Vault** and only a **secret name reference** stored in ArchLucid SQL. Audience: tenant operators wiring a Teams channel + on-call engineers diagnosing fan-out. **Not** a two-way Teams app (no Bot Framework / M365 manifest in v1).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Microsoft Teams notification connector

## Architecture

| Node | Role |
|------|------|
| ArchLucid API | `POST /v1/integrations/teams/connections` stores `KeyVaultSecretName` + optional `Label` per tenant (`ExecuteAuthority`). |
| Azure Key Vault | Holds the actual Teams incoming webhook URL as a secret value. |
| Logic Apps Standard | Subscribes to Service Bus; resolves secret; POSTs Adaptive Card to Teams (see `infra/terraform-logicapps/workflows/teams-notifications/README.md`). |
| Service Bus | Topics per [`schemas/integration-events/catalog.json`](../../schemas/integration-events/catalog.json). |

## v1 default trigger set (twelve events)

The v1 production workflow subscribes to the following `eventType` values. Owner approved the expanded set on **2026-04-21** (PENDING_QUESTIONS.md item 32):

| `eventType` | When fired | Action link in card |
|-------------|-----------|---------------------|
| `com.archlucid.authority.run.completed` | A run reaches the committed manifest state | `/runs/{runId}` |
| `com.archlucid.manifest.finalized.v1` | The sealed review record is finalized | `/runs/{runId}` |
| `com.archlucid.governance.approval.submitted` | A governance approval has been requested or submitted | `/governance/approvals/{approvalId}` |
| `com.archlucid.governance.approval.approved` | A governance approval request was approved | `/governance/approvals/{approvalId}` |
| `com.archlucid.governance.approval.rejected` | A governance approval request was rejected | `/governance/approvals/{approvalId}` |
| `com.archlucid.governance.promotion.activated` | An approved review was authorized to advance in a governed environment | `/governance/promotions/{activationId}` |
| `com.archlucid.alert.fired` | An alert is raised | `/alerts/{alertId}` |
| `com.archlucid.alert.acknowledged` | An alert was acknowledged by an authorized user | `/alerts/{alertId}` |
| `com.archlucid.alert.resolved` | An alert was resolved | `/alerts/{alertId}` |
| `com.archlucid.compliance.drift.escalated` | Compliance drift breached its threshold and escalated | `/compliance/drift/{driftId}` |
| `com.archlucid.advisory.scan.completed` | An advisory finding scan committed a fresh result | `/advisories/{advisoryId}` |
| `com.archlucid.seat.reservation.released` | A trial seat reservation expired or was released | `/admin/trial-seats` |

**Scope decision (2026-04-21):** **Notification-only for v1** — no two-way (approve-from-Teams) flow. Two-way is a V1.1 candidate gated on registering an M365 admin app manifest (PENDING_QUESTIONS.md item 23).

## Per-trigger opt-in matrix (added 2026-04-21)

Each tenant row in `dbo.TenantTeamsIncomingWebhookConnections` carries an `EnabledTriggersJson` column — a JSON array of canonical event-type strings the tenant wants delivered to this Teams channel. Existing rows default to **all-on** so behavior does not change at migration time. The Logic Apps workflow filters server-side **before** resolving the Key Vault secret so a disabled trigger cannot reach Teams even if upstream routing misbehaves (see `infra/terraform-logicapps/workflows/teams-notifications/README.md` step 3). The canonical catalog lives in `ArchLucid.Core.Notifications.Teams.TeamsNotificationTriggerCatalog`; the API exposes it at `GET /v1/integrations/teams/triggers` so the UI never hard-codes the list.

## API

### List the canonical trigger catalog (Read+)

```bash
curl -sS "https://<api-host>/v1/integrations/teams/triggers" \
  -H "Authorization: Bearer <token>"
```

Returns a JSON array of canonical event-type strings (e.g. `["com.archlucid.authority.run.completed", ...]`).

### Configure (Execute+)

```bash
curl -sS -X POST "https://<api-host>/v1/integrations/teams/connections" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
        "keyVaultSecretName":"teams-incoming-webhook-prod",
        "label":"Architecture alerts",
        "enabledTriggers":[
          "com.archlucid.authority.run.completed",
          "com.archlucid.alert.fired"
        ]
      }'
```

**Validation:** `keyVaultSecretName` must **not** contain `://` — raw webhook URLs are rejected to keep secrets out of SQL. `enabledTriggers` must be a subset of the canonical catalog; unknown trigger names cause an HTTP 400 listing the offending values. Omitting `enabledTriggers` leaves the persisted opt-in matrix unchanged on update (and falls back to all-on for a brand-new row); sending an empty array is an explicit opt-out of every trigger.

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

## Architect workspace

**Path:** `/integrations/teams` (Operate (governance and trust) — extended tier). Writes use the same **`useEnterpriseMutationCapability()`** floor as other Enterprise surfaces.

## Screenshot stub

> Placeholder: capture the Teams configuration page after first pilot wiring; store under `docs/go-to-market/screenshots/` and link from the integration catalog when available.
