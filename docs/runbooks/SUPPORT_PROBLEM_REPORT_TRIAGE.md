> **Scope:** Internal support engineering — triage in-product **Report problem** intake (`POST /v1/support/problem-reports`, **TB-788**). Not a customer-facing page.

# Report problem intake — support triage runbook

Use this runbook when a pilot or private-beta operator submits **Report problem** from a high-stakes error surface and you receive a **Report reference** id (in-app acknowledgement, submitter auto-ack email, or support inbox notification).

**Goal:** Reconstruct tenant scope, failure context, and correlated telemetry in **under five minutes** before drafting a customer reply.

**MVO miss check:** Before treating the report as novel, classify fleet P0 quiet vs expected support-path intake per [`SOLO_OPERATOR_PAGES_VS_SUPPORT_EMAIL_CONTRACT.md`](../operations/SOLO_OPERATOR_PAGES_VS_SUPPORT_EMAIL_CONTRACT.md) (**TB-989**). Structured triage enrichment: **TB-990**.

## Inputs you need

| Input | Where it appears |
| --- | --- |
| **Report reference** (`{referenceId}`) | Dialog acknowledgement, submitter email, support inbox subject `[ArchLucid] Report {referenceId}` |
| **Correlation ID** / **Request ID** | Same surfaces, `ContextJson`, API `X-Correlation-ID`, operator error UI |
| **Tenant / workspace** | `dbo.SupportProblemReports` row, `ContextJson`, Activity tags (`archlucid.tenant_id`, `archlucid.workspace_id`) |
| **Review id** (optional) | `ContextJson.reviewId`, route `/reviews/{runId}` |

**Response SLA (owner standard):** acknowledge same day when possible; **commit to reply by the next business day**. Copy this in customer-facing replies — not immediate chat or 24/7 monitoring.

## Five-minute triage order

1. **Lookup the report row** (SQL below) — confirm `Status`, scope, `OperatorNote`, `CorrelationId`, `ClientRequestId`, and whether `SupportBundleBlobPath` is set.
2. **Parse `ContextJson`** — `errorTitle`, `errorCode`, `httpStatus`, `routePath`, `productVersion`, `uiVersion`, `browserClient`.
3. **Correlate telemetry** — App Insights / Log Analytics queries (below) using `CorrelationId` first, then tenant + time window.
4. **Optional bundle** — when `SupportBundleBlobPath` is populated, fetch and run the [attached bundle checklist](#optional-attached-support-bundle) before forwarding externally.
5. **Draft reply** — reference the **Report reference**, what you found, next step for the operator, and the next-business-day commitment if work continues.

## Lookup by Report reference

`{referenceId}` is the row **`Id`** (`UNIQUEIDENTIFIER`) returned by intake.

```sql
-- Run against the tenant catalog for the customer's tenant (application-enforced scope).
SELECT
    Id,
    TenantId,
    WorkspaceId,
    ProjectId,
    SubmittedByActorId,
    Status,
    CreatedUtc,
    CorrelationId,
    ClientRequestId,
    SupportBundleBlobPath,
    OperatorNote,
    ContextJson
FROM dbo.SupportProblemReports
WHERE Id = '<referenceId>';
```

Recent open reports for a tenant (inbox sweep):

```sql
SELECT TOP 50
    Id,
    CreatedUtc,
    Status,
    CorrelationId,
    SubmittedByActorId,
    OperatorNote
FROM dbo.SupportProblemReports
WHERE TenantId = '<tenant-guid>'
ORDER BY CreatedUtc DESC;
```

**Privacy:** `ContextJson` is a redacted envelope (server scope wins over client-supplied tenant/workspace). Do not paste raw `ContextJson` or operator notes into external channels without review.

## Correlation ID / Request ID → App Insights

Reuse **TB-329** Activity tag conventions ([`OBSERVABILITY.md`](../library/OBSERVABILITY.md) § Mandatory Activity correlation tags).

**By correlation id (preferred):**

```kusto
traces
| where timestamp between (datetime(<report-created-utc>) - 1h) .. (datetime(<report-created-utc>) + 4h)
| where customDimensions["correlation.id"] == "<correlation-id>"
   or customDimensions["CorrelationId"] == "<correlation-id>"
| order by timestamp asc
```

**By tenant + review (when correlation is missing):**

```kusto
traces
| where timestamp between (datetime(<report-created-utc>) - 1h) .. (datetime(<report-created-utc>) + 4h)
| where customDimensions["archlucid.tenant_id"] == "<tenant-guid>"
| where customDimensions["archlucid.run_id"] == "<review-id>" // when ContextJson.reviewId is set
| order by timestamp desc
```

**Exceptions / failures in the same window:**

```kusto
exceptions
| where timestamp between (datetime(<report-created-utc>) - 1h) .. (datetime(<report-created-utc>) + 4h)
| where customDimensions["correlation.id"] == "<correlation-id>"
| project timestamp, type, outerMessage, problemId
| order by timestamp asc
```

**Audit search (architect workspace or API):** filter by correlation id or review id per [`FIRST_PILOT_SUPPORT_TRIAGE.md`](FIRST_PILOT_SUPPORT_TRIAGE.md) step 5.

## Optional attached support bundle

When the operator consented to attach a redacted bundle (**TB-787**), `SupportBundleBlobPath` points at stored blob content for that report id.

Before forwarding bundle contents externally:

1. Open **`redaction-manifest.json`** — confirm status **PASS** and review `sharingCaveats`.
2. Read **`README.txt`** triage order (matches [`SupportBundleReadme`](../../ArchLucid.Cli/Support/SupportBundleReadme.cs) layout).
3. Confirm **`references.json`** / **`manifest.json`** — no unexpected secret-bearing categories in `omittedCategories`.
4. Apply the same redaction rules documented in **`SupportBundleRedactor`** (`strip-authorization-bearer-secret`, JWT/API-key masks, etc.) if you extract excerpts manually.
5. Prefer citing **correlation id**, **report reference**, and **build identity** from `build.json` rather than attaching full zips to sponsors.

CLI parity for a fresh bundle from your workstation: `dotnet run --project ArchLucid.Cli -- support-bundle --zip` ([`TROUBLESHOOTING.md`](TROUBLESHOOTING.md#support-bundle-attach-to-tickets)).

## Private-beta escalation

| Channel | Owner |
| --- | --- |
| **Support inbox** (`Email:SupportInbox`, default **support@archlucid.net**) | Primary intake for `[ArchLucid] Report {referenceId}` notifications and manual escalations |
| **Security issues** | **security@archlucid.net** — do not route defect triage here |
| **In-product path** | Operator **Report problem** on registered high-stakes surfaces ([`REPORT_PROBLEM_V1_SCOPE.md`](../library/REPORT_PROBLEM_V1_SCOPE.md)) |

**Private-beta watch:** engineering/on-call rotation monitors **support@archlucid.net** for Report problem subjects during the invite wave. Triage with this runbook first; escalate to API/worker owners when correlation shows dependency or tenant-scope failures.

## Related

- [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) — engineering symptom index and support bundle collection
- [`FIRST_PILOT_SUPPORT_TRIAGE.md`](FIRST_PILOT_SUPPORT_TRIAGE.md) — runId / audit escalation order
- [`../library/OBSERVABILITY.md`](../library/OBSERVABILITY.md) — canonical App Insights queries (**TB-329** tags)
- [`../library/customer-facing/REPORT_A_PROBLEM.md`](../library/customer-facing/REPORT_A_PROBLEM.md) — operator-facing workflow copy (**TB-790**)
