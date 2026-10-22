> **Scope:** Operator smoke — first-party Jira outbound issue create and optional inbound status sync; no tenant secrets or live keys.

# Smoke — Jira (first-party ITSM)

## Purpose

Confirm that a persisted **Authority-shaped finding** drives a **Jira issue** with correlation suitable for **inbound status sync**, matching [V1_SCOPE.md](../../library/V1_SCOPE.md) §2.13. ArchLucid maps from the standard finding inspect surface; smoke does **not** introduce a Jira-only request schema beyond the single outbound API envelope.

## Prerequisites

- **Jira Cloud** (or supported variant in your build) with a **non-production** project for pilot use.
- A **committed** architecture run whose manifest includes at least one finding eligible for export (severity and connector rules per deployment).
- `Integrations:ItsmOutbound` Jira settings populated (cloud base URL, credentials or token path per host configuration) and optional **`dbo.TenantItsmOutboundSettings`** overrides as needed.
- For **inbound** sync smoke: Jira automation or operator can transition an issue; ArchLucid exposes `POST /v1/integrations/webhooks/jira` with shared-secret validation (see **Auth and secret pattern**).

## Auth and secret pattern

- **Outbound:** API token or OAuth as implemented for your environment; store material in **Key Vault** (or approved secret store). SQL and docs reference **secret names** or app configuration keys only — never raw tokens in repository-owned markdown.
- **Inbound webhook:** Request body is verified against configured secrets (`Integrations:ItsmInbound`), e.g. header token vs configured `JiraWebhookSecret` — see `ItsmInboundWebhooksController` in the API host. No JWT on the vendor POST; treat the shared secret like a bearer for that route only.

## Test payload (Authority-shaped)

**Outbound (operator API)** — `ExecuteAuthority`; stable route in OpenAPI (`GET /openapi/v1.json`):

```json
{
  "provider": "Jira",
  "findingId": "<persisted finding id from inspect/manifest surface>"
}
```

The service loads the finding via the Authority inspection path and maps summary, description, and severity to Jira **without** a parallel “Jira JSON” schema in ArchLucid — the finding is the canonical payload.

**Inbound (vendor → ArchLucid)** — Jira sends the webhook JSON your Jira admin configured; the sync service expects issue key and status fields per [INTEGRATION_CATALOG.md](../../go-to-market/INTEGRATION_CATALOG.md) / inbound options. Smoke verifies acceptance and mapping, not a fixed vendor schema copy in docs.

## Expected ArchLucid audit events

| Step | Event type(s) |
|------|----------------|
| Outbound happy path | `Integration.JiraIssueCreateSucceeded` (payload includes `findingId`, `issueKey`; no secrets). |
| Outbound skipped (unconfigured / rules) | `Integration.JiraIssueCreateSkipped` |
| Outbound vendor or correlation failure | `Integration.JiraIssueCreateFailed` (may include HTTP status in payload when known). |
| Inbound status mapped to finding | `Integration.JiraIssueStatusSynced` |

Filter the audit log or export by `EventType` and correlation id; full matrix lives in [AUDIT_COVERAGE_MATRIX.md](../../library/AUDIT_COVERAGE_MATRIX.md).

## Expected external artifact

- **Jira:** a new issue in the pilot project whose description or fields reference the ArchLucid run/finding identifiers per product mapping.
- **Datastore:** row in **`dbo.ItsmFindingCorrelations`** linking finding id to Jira issue key for webhook routing (after successful register).

## Rollback and cleanup

- **Jira:** close or delete the pilot issue; resolve or remove any automation that spams webhooks.
- **ArchLucid:** optional manual cleanup of correlation rows only if your process requires it — prefer leaving history for audit continuity in production-like pilots.

## Troubleshooting

- **401/403 from Jira:** rotate credentials in Key Vault; confirm IP allow lists if used.
- **Skipped create:** check `Integration.JiraIssueCreateSkipped` audit reason (missing project key, dropped informational severity, missing connector fields).
- **Inbound ignored:** verify webhook secret, Automation firing, and correlation row exists for the issue key.
- **Field mapping errors:** align required custom fields with project admin before re-smoke.
