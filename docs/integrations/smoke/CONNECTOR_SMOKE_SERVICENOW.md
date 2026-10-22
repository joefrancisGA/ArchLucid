> **Scope:** Operator smoke — first-party ServiceNow incident create and optional inbound status sync; no tenant secrets or live keys.

# Smoke — ServiceNow (first-party ITSM)

## Purpose

Confirm that a persisted **Authority-shaped finding** creates a **ServiceNow `incident`** with CMDB correlation rules and **inbound status-only sync** as committed in [V1_SCOPE.md](../../library/V1_SCOPE.md) §2.13. Mapping uses the standard finding inspect surface; smoke does **not** define a ServiceNow-only ArchLucid schema beyond the outbound API envelope.

## Prerequisites

- **ServiceNow** instance (pilot/non-prod) with Table API access and **`incident`** create permission for the integration user.
- A **committed** run with at least one finding suitable for outbound create.
- `Integrations:ItsmOutbound` ServiceNow block (instance URL, credentials) and optional **`dbo.TenantItsmOutboundSettings`** (`ServiceNowAutoCreateCmdbCi`, etc.).
- For **inbound** sync: `POST /v1/integrations/webhooks/servicenow` reachable from ServiceNow with shared-secret validation per deployment.

## Auth and secret pattern

- **Outbound:** Basic auth (MVP) or OAuth per catalog; secrets in **Key Vault** only — SQL stores configuration references, not passwords in clear.
- **Inbound webhook:** Validated against configured shared secret / headers per `ItsmInboundWebhooksController` — no customer JWT on vendor POST.

## Test payload (Authority-shaped)

**Outbound** — `ExecuteAuthority`; route and schema in OpenAPI:

```json
{
  "provider": "ServiceNow",
  "findingId": "<persisted finding id from inspect/manifest surface>"
}
```

The product resolves **CMDB** `cmdb_ci` via **`cmdb_ci_appl`** / `SystemName` per catalog; no separate “ServiceNow JSON” body is accepted at this API — the finding + run metadata drive the Table API payload.

**Inbound (vendor → ArchLucid)** — Business rules / webhook sends an incident identifier and state; ArchLucid matches **`dbo.ItsmFindingCorrelations`** and maps state to finding human-review status per **`Integrations:ItsmInbound`** maps.

## Expected ArchLucid audit events

| Step | Event type(s) |
|------|----------------|
| Outbound success | `Integration.ServiceNowIncidentCreateSucceeded` |
| Outbound skipped | `Integration.ServiceNowIncidentCreateSkipped` |
| Outbound failure (vendor, CMDB, correlation) | `Integration.ServiceNowIncidentCreateFailed` |
| Inbound status applied | `Integration.ServiceNowIncidentStatusSynced` |

If issue creation succeeds but correlation persistence throws, responses surface **503** with a dedicated audit path — see live OpenAPI / problem details for your build.

## Expected external artifact

- **ServiceNow:** new **incident** with short description/body linking back to ArchLucid run/finding context; **`cmdb_ci`** set when **`cmdb_ci_appl`** match succeeds (or CI auto-create when tenant flag allows).
- **Datastore:** correlation row for provider **`ServiceNow`** and external key (**`sys_id`** / number per implementation).

## Rollback and cleanup

- **ServiceNow:** cancel/close the pilot incident; revert any test business-rule-only webhooks.
- **ArchLucid:** keep audit history; delete correlation rows only if a scrub process demands it.

## Troubleshooting

- **CMDB stage failures:** inspect `Integration.ServiceNowIncidentCreateFailed` payload for `stage` / `statusCode`; validate `SystemName` vs **`cmdb_ci_appl.name`** before enabling **`ServiceNowAutoCreateCmdbCi`**.
- **Auth errors:** rotate integration user password or OAuth refresh; confirm **instance URL** has no stray path segments.
- **Inbound not firing:** verify webhook secret, outbound correlation exists, and state map in **`Integrations:ItsmInbound`** includes your ServiceNow state values.
