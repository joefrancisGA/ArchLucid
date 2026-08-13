> **Scope:** Internal support engineering — triage in-product **Report problem** intake (`POST /v1/support/problem-reports`, **TB-788**). Not a customer-facing page.

# Report problem intake — support triage runbook

Use this runbook when a pilot or private-beta operator submits **Report problem** from a high-stakes error surface and you receive a **Report reference** id (in-app acknowledgement, submitter auto-ack email, or support inbox notification).

**Goal:** Reconstruct tenant scope, failure context, and correlated telemetry in **under five minutes** before drafting a customer reply.

**MVO miss check (mandatory — TB-990):** Before treating the report as novel, complete [MVO quiet / firing classification](#mvo-quiet--firing-classification-tb-990) using [`SOLO_OPERATOR_PAGES_VS_SUPPORT_EMAIL_CONTRACT.md`](../operations/SOLO_OPERATOR_PAGES_VS_SUPPORT_EMAIL_CONTRACT.md) (**TB-989**). Record the outcome in `OperatorNote` or your private triage log.

## Inputs you need

| Input | Where it appears |
| --- | --- |
| **Report reference** (`{referenceId}`) | Dialog acknowledgement, submitter email, support inbox subject `[ArchLucid] Report {referenceId}` |
| **Correlation ID** / **Request ID** | Same surfaces, `ContextJson`, API `X-Correlation-ID`, operator error UI |
| **Tenant / workspace** | `dbo.SupportProblemReports` row, `ContextJson`, Activity tags (`archlucid.tenant_id`, `archlucid.workspace_id`) |
| **Review id** (optional) | `ContextJson.reviewId`, route `/reviews/{runId}` |

**Response SLA (owner standard):** acknowledge same day when possible; **commit to reply by the next business day**. Copy this in customer-facing replies — not immediate chat or 24/7 monitoring.

## Five-minute triage order

1. **Lookup the report row** (SQL below) — confirm `Status`, scope, `OperatorNote`, `CorrelationId`, `ClientRequestId`, and whether `SupportBundleBlobPath` is set. Note `CreatedUtc` for the MVO window.
2. **MVO quiet / firing classification (TB-990)** — mandatory before deep investigation; see [section below](#mvo-quiet--firing-classification-tb-990).
3. **Parse `ContextJson`** — `errorTitle`, `errorCode`, `httpStatus`, `routePath`, `productVersion`, `uiVersion`, `browserClient`.
4. **Correlate telemetry** — App Insights / Log Analytics queries (below) using `CorrelationId` first, then tenant + time window.
5. **Optional bundle** — when `SupportBundleBlobPath` is populated, fetch and run the [attached bundle checklist](#optional-attached-support-bundle) before forwarding externally.
6. **Draft reply** — reference the **Report reference**, what you found, next step for the operator, and the next-business-day commitment if work continues.

## MVO quiet / firing classification (TB-990)

**Window:** `CreatedUtc` ± 1 hour (extend to ± 4h only when the operator reports delayed discovery).

**Question:** Were **fleet MVO P0s** firing (or should they have fired) while this tenant reported failure? Report Problem is **support inbox by design** — absence of a page does not by itself mean MVO failed.

### Classification outcomes

| Outcome | When to use | Next action |
| --- | --- | --- |
| **A — Fleet P0 should have fired** | Critical action-group alerts fired **or** AMW signals show fleet-wide degradation in the window, but the operator still opened a ticket first | Treat as **MVO miss** or paging-path gap; run [`SOLO_OPERATOR_MVO_OBSERVABILITY.md`](../operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md) enablement + **M-120** drill notes; escalate to platform owner |
| **B — Single-tenant / product defect (expected support path)** | Fleet P0s **quiet**; failure is tenant-scoped, UX/config, or stuck-run signal not yet enabled (**TB-958**/**TB-959** owner checklists) | Continue standard triage below; cite contract row in reply if helpful |
| **C — User / config / expected support** | Misconfiguration, training, or operator mistake; no platform defect | Reply with guidance; no paging retro |

Record in `OperatorNote` (example): `MVO-TB990: B — fleet P0 quiet; stale-run gauge 0 at CreatedUtc`.

### Portal checklist (critical action group)

1. Azure Portal → **Monitor** → **Alerts** → **Alert history**.
2. Filter **Severity** = Sev0 / **Monitor condition** = Fired in `CreatedUtc` ± 1h.
3. Confirm whether any **MVO P0** rules from [`SOLO_OPERATOR_MVO_OBSERVABILITY.md`](../operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md) fired (`ArchLucidApiUnavailableTf`, `ArchLucidHealthCheckUnhealthyTf`, `ArchLucidSqlConnectionFailuresSustainedTf`, `ArchLucidCircuitBreakerOpenTf`, `ArchLucidAuthorityPipelineWorkDeadLettersTf`, `ArchLucidTrialSignupFailuresHighTf`, `ArchLucidStaleInFlightRunsTf`).
4. Review-path canary failures (**TB-959**) appear in GitHub Actions / PagerDuty — not AMW PromQL.

### AMW Metrics explore (copy-paste)

Run in the Azure Monitor workspace linked from [`infra/terraform-monitoring`](../../infra/terraform-monitoring/README.md). Replace `<report-created-utc>` with the SQL `CreatedUtc` instant; adjust range as needed.

```promql
# Fleet API scrape present in the report window (0 or absent ⇒ investigate outcome A)
max_over_time(up{job="archlucid-api"}[1h])

# Health probe unhealthy (any series > 0 in window ⇒ fleet degradation)
max_over_time(archlucid_health_check_status{status="Unhealthy"}[1h])

# Stale in-flight runs fleet gauge (TB-958) — correlate tenant/run from logs, not labels
max_over_time(archlucid_runs_stale_in_flight_count[1h])
```

**Do not** infer per-tenant paging from these fleet gauges alone — see [`SOLO_OPERATOR_PAGES_VS_SUPPORT_EMAIL_CONTRACT.md`](../operations/SOLO_OPERATOR_PAGES_VS_SUPPORT_EMAIL_CONTRACT.md).

### False-negative drill hook (**M-120**)

When outcome **A** repeats for the same environment, log a **M-120** false-negative entry (private founder notes): environment, alert rule, window, and whether scrape + critical action group Test passed last release cut.

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

- [`SOLO_OPERATOR_PAGES_VS_SUPPORT_EMAIL_CONTRACT.md`](../operations/SOLO_OPERATOR_PAGES_VS_SUPPORT_EMAIL_CONTRACT.md) — pages vs support-email matrix (**TB-989**) and MVO classification hook (**TB-990**)
- [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) — engineering symptom index and support bundle collection
- [`FIRST_PILOT_SUPPORT_TRIAGE.md`](FIRST_PILOT_SUPPORT_TRIAGE.md) — runId / audit escalation order
- [`../library/OBSERVABILITY.md`](../library/OBSERVABILITY.md) — canonical App Insights queries (**TB-329** tags)
- [`../operations/SOLO_OPERATOR_PAGES_VS_SUPPORT_EMAIL_CONTRACT.md`](../operations/SOLO_OPERATOR_PAGES_VS_SUPPORT_EMAIL_CONTRACT.md) — pages vs inbox matrix (**TB-989**); MVO triage step **TB-990**
- [`../operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md`](../operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md) — MVO P0 catalog and enablement (**TB-957** / **TB-958** / **TB-959**)
- [`../library/customer-facing/REPORT_A_PROBLEM.md`](../library/customer-facing/REPORT_A_PROBLEM.md) — operator-facing workflow copy (**TB-790**)
