> **Scope:** Buyers wiring outbound subscribers (Logic Apps, API gateways, partner buses) to ArchLucid HTTP webhooks and integration-event payloads — JSON shapes + canonical event strings; **not** Entra token-exchange tutorials.

> **See also:** [`INTEGRATION_EVENTS_AND_WEBHOOKS.md`](../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md) (CloudEvents envelope + `X-ArchLucid-Webhook-Signature`), [`schemas/integration-events/catalog.json`](../../schemas/integration-events/catalog.json).

# Webhook and integration-event JSON payloads

## Naming note: audit vs integration types

- **`GovernanceApprovalRequested`** appears as **`dbo.AuditEvents.EventType`** / buyer-facing audit timelines when operators request governance review (see [`AuditEventTypes`](../../ArchLucid.Core/Audit/AuditEventTypes.cs)).
- **`com.archlucid.governance.approval.submitted`** (`IntegrationEventTypes.GovernanceApprovalSubmittedV1`) is the **integration-event / webhook** string emitted after an approval request is persisted — use this constant when subscribing via Service Bus (`event_type` application property) or outbound webhook routers.

## HTTP webhook envelope

When `WebhookDelivery:UseCloudEventsEnvelope` is **true**, receivers obtain a **CloudEvents 1.0** wrapper (`specversion`, `type`, `source`, `id`, `time`, `datacontenttype`, `data`). The `data` object matches the payload schemas below. When **false**, POST bodies are the payload JSON directly (camelCase, UTF-8). **HMAC** (`X-ArchLucid-Webhook-Signature`) always signs the **exact UTF-8 bytes** transmitted — envelope on vs raw payload affects signature computation.

## Primary payloads

### `com.archlucid.authority.run.completed`

Canonical type constant: [`IntegrationEventTypes.AuthorityRunCompletedV1`](../../ArchLucid.Core/Integration/IntegrationEventTypes.cs).

Committed JSON Schema: [`schemas/integration-events/authority-run-completed.v1.schema.json`](../../schemas/integration-events/authority-run-completed.v1.schema.json).

Example **`data`** payload (CloudEvents on) or raw POST body (CloudEvents off):

```json
{
  "schemaVersion": 1,
  "runId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "manifestId": "21fffacb-e079-445e-a920-c986298823df",
  "tenantId": "93ba952e-f245-4f74-be59-e632abd07987",
  "workspaceId": "11111111-2222-3333-4444-555555555555",
  "projectId": "66666666-7777-8888-9999-aaaaaaaaaaaa",
  "previousRunId": null,
  "findings": [
    {
      "findingId": "FIND-001",
      "deepLinkUrl": "https://operator.example/runs/3fa85f64-5717-4562-b3fc-2c963f66afa6/findings/FIND-001",
      "severity": "High"
    }
  ]
}
```

`curl` smoke check against a receiver (**replace URL + signature workflow with your gateway secret**):

```bash
curl -sS -X POST "https://receiver.example/archlucid-hook" \
  -H "Content-Type: application/json" \
  --data-binary @authority-run-completed.sample.json
```

Keep **`schemaVersion: 1`** stable; additive fields are allowed per repository contract tests (`IntegrationEventPayloadContractTests`).

### Governance approval submitted (`GovernanceApprovalSubmittedV1`)

Canonical string: **`com.archlucid.governance.approval.submitted`**.

JSON Schema: [`schemas/integration-events/governance-approval-submitted.v1.schema.json`](../../schemas/integration-events/governance-approval-submitted.v1.schema.json).

Example payload:

```json
{
  "schemaVersion": 1,
  "tenantId": "93ba952e-f245-4f74-be59-e632abd07987",
  "workspaceId": "11111111-2222-3333-4444-555555555555",
  "projectId": "66666666-7777-8888-9999-aaaaaaaaaaaa",
  "approvalRequestId": "APR-2048",
  "runId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "manifestVersion": "v12",
  "sourceEnvironment": "dev",
  "targetEnvironment": "test",
  "requestedBy": "jamie@contoso.com"
}
```

Service Bus subscribers typically filter on application property **`event_type = com.archlucid.governance.approval.submitted`** (Logic Apps governance routing module).

## Additional schemas

All committed integration-event schemas live under [`schemas/integration-events/`](../../schemas/integration-events/). Prominent companions:

| Canonical `event_type` | Schema file |
|------------------------|-------------|
| `com.archlucid.manifest.finalized.v1` | `manifest-finalized.v1.schema.json` |
| `com.archlucid.alert.fired` | `alert-fired.v1.schema.json` |
| `com.archlucid.alert.resolved` | `alert-resolved.v1.schema.json` |
| `com.archlucid.governance.promotion.activated` | `governance-promotion-activated.v1.schema.json` |

## Verification hooks in-repo

- Contract snapshots — [`ArchLucid.Core.Tests/Integration/IntegrationEventPayloadContractTests.cs`](../../ArchLucid.Core.Tests/Integration/IntegrationEventPayloadContractTests.cs)
- Publisher field guards — [`PublisherIntegrationPayloadAndRecipeDocumentationGuardTests.cs`](../../ArchLucid.Core.Tests/Integration/PublisherIntegrationPayloadAndRecipeDocumentationGuardTests.cs)

These tests intentionally fail when required JSON property names drift without a deliberate breaking-change review.
