# ServiceNow incident create — customer-operated webhook recipe

**Disclaimer:** This is a **recipe template**, not a first-party ArchLucid ServiceNow connector. First-party ServiceNow is **V1.1**; see [V1_DEFERRED.md](../../../docs/library/V1_DEFERRED.md) §6.

**Contracts:** [catalog.json](../../../schemas/integration-events/catalog.json) · [INTEGRATION_EVENTS_AND_WEBHOOKS.md](../../../docs/library/INTEGRATION_EVENTS_AND_WEBHOOKS.md)

## 1. Expose HTTPS

Same as Jira: public TLS endpoint, secret vault for `ARCHLUCID_HMAC_SECRET` (ArchLucid `WebhookDelivery:HmacSha256SharedSecret` or your bridge secret).

## 2. Validate ArchLucid HMAC

Read the raw POST body as bytes; read header **`X-ArchLucid-Webhook-Signature`**; expect **`sha256=`** + lowercase hex HMAC-SHA256(secret, raw_body). Reject on mismatch (constant-time compare).

## 3. Parse CloudEvents; filter on catalog type

Worked example: envelope `type` **`com.archlucid.alert.fired`**, `data` per [alert-fired.v1.schema.json](../../../schemas/integration-events/alert-fired.v1.schema.json).

## 4. Map `data` → Table API `POST /api/now/table/incident`

| ArchLucid `data` | Incident column (example) |
|-------------------|---------------------------|
| `title` | `short_description` |
| `severity`, `category`, `alertId`, `deduplicationKey`, scope ids | `description` (plain text or your HTML template) |
| `deduplicationKey` | `correlation_id` (if within column length; else truncate + hash) |

Call `POST https://<instance>.service-now.com/api/now/table/incident` with `Authorization: Basic` (integration user) or OAuth token per ServiceNow docs. **Do not** widen ArchLucid rate limits—batch and backoff on your side.

## Worked example — `com.archlucid.alert.fired`

Inbound CloudEvents (same `data` as other recipes):

```json
{
  "specversion": "1.0",
  "type": "com.archlucid.alert.fired",
  "source": "/customer/bridge",
  "id": "11111111-1111-1111-1111-111111111111",
  "datacontenttype": "application/json",
  "data": {
    "schemaVersion": 1,
    "tenantId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "workspaceId": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    "projectId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
    "alertId": "dddddddd-dddd-dddd-dddd-dddddddddddd",
    "ruleId": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    "category": "policy",
    "severity": "high",
    "title": "Example alert title",
    "deduplicationKey": "tenant:…:rule:…"
  }
}
```

ServiceNow JSON body (template):

```json
{
  "short_description": "[ArchLucid] Example alert title",
  "description": "severity=high category=policy alertId=dddddddd-dddd-dddd-dddd-dddddddddddd tenant=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "correlation_id": "tenant:…:rule:…"
}
```

## Pinned samples (template only)

**Azure Functions:** Python 3.12 + `azure-functions>=1.20.0,<2`, HTTP trigger; outbound `httpx` or `urllib.request` to ServiceNow with secrets from Key Vault references. Pin Microsoft Learn doc revision you tested.

**AWS Lambda:** Python 3.12, API Gateway HTTP API; read Snow secret from Secrets Manager (`boto3` version pinned in your IaC). Use `urllib.request` or `httpx` for Table API POST.

Shared HMAC gate matches [jira-webhook-receiver.md](../jira/jira-webhook-receiver.md) (same `X-ArchLucid-Webhook-Signature` contract).
