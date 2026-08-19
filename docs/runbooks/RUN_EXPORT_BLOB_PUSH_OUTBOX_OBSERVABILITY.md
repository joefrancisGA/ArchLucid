> **Scope:** Operator — Run-export blob push outbox lag, dead-letter, and retry triage.

# Run-export blob push outbox observability

Durable deferred blob pushes enqueue into **`dbo.RunExportBlobPushOutbox`** and are processed by **`RunExportBlobPushOutboxHostedService`** on the elected API/worker host. This runbook covers Prometheus metrics, alerts, and operator triage when export pushes stall or dead-letter.

**Related:** [ADR 0043](../architecture/adrs/0043-durable-run-export-blob-push-outbox.md), [RELEASE_SMOKE.md](../library/RELEASE_SMOKE.md) Step 9, [OBSERVABILITY.md](../library/OBSERVABILITY.md).

---

## Metrics (OpenTelemetry meter `ArchLucid`)

| Metric | Type | Meaning |
|--------|------|---------|
| `archlucid_run_export_blob_push_outbox_pending` | Gauge | Actionable rows eligible for dequeue (excludes dead letters, active leases, backoff window). |
| `archlucid_run_export_blob_push_outbox_oldest_pending_age_seconds` | Gauge | Age of oldest actionable row. |
| `archlucid_run_export_blob_push_outbox_dead_letter` | Gauge | Rows with `DeadLetteredUtc` set and not processed. |
| `archlucid_run_export_blob_push_outbox_processed_success_total` | Counter | Rows marked processed (successful push or benign skip when run export no longer exists). |
| `archlucid_run_export_blob_push_outbox_retry_scheduled_total` | Counter | Transient failures that recorded backoff. |
| `archlucid_run_export_blob_push_outbox_dead_lettered_total` | Counter | Rows moved to dead-letter during processing. |

Depth gauges are refreshed every **30s** by **`OutboxOperationalMetricsHostedService`** from SQL (`DapperOutboxOperationalMetricsReader`). Processor counters increment in **`RunExportBlobPushOutboxProcessor`**.

**Cardinality:** no destination URLs, SAS tokens, or tenant labels on these series.

---

## Alerts (`infra/prometheus/archlucid-alerts.yml`, group `archlucid-authority`)

| Alert | Condition | Operator action |
|-------|-----------|-----------------|
| **ArchLucidRunExportBlobPushOutboxBacklog** | `pending > 25` for 20m | Confirm elected host runs `RunExportBlobPushOutboxHostedService`; check worker/API logs for processor exceptions. |
| **ArchLucidRunExportBlobPushOutboxStale** | `oldest_pending_age_seconds > 900` for 15m | Investigate lease contention, SQL connectivity, or blob push failures; inspect `LastAttemptError` on oldest rows. |
| **ArchLucidRunExportBlobPushOutboxDeadLetter** | `dead_letter > 0` for 10m | Inspect dead-letter rows; fix destination policy/SAS or export package issues; re-enqueue after remediation. |

Recording rule **`archlucid:slo:run_export_blob_push_outbox_oldest_age_seconds`** mirrors the oldest-age gauge for SLO dashboards.

**Grafana:** panels on **`infra/grafana/dashboard-archlucid-slo.json`** (run-export outbox section).

---

## SQL triage (tenant-scoped admin connection)

```sql
-- Actionable backlog
SELECT TOP (50) OutboxId, RunId, CreatedUtc, AttemptCount, NextAttemptUtc, LockedUntilUtc, LastAttemptError
FROM dbo.RunExportBlobPushOutbox
WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL
ORDER BY CreatedUtc;

-- Dead letters awaiting operator review
SELECT TOP (50) OutboxId, RunId, DeadLetteredUtc, LastAttemptError
FROM dbo.RunExportBlobPushOutbox
WHERE DeadLetteredUtc IS NOT NULL AND ProcessedUtc IS NULL
ORDER BY DeadLetteredUtc DESC;
```

Do not paste `DestinationSasUrl` values into tickets — they contain secrets.

---

## Audit signals

Dead-letter transitions emit audit event **`RunExportBlobPushDeadLettered`** (`AuditEventTypes.RunExportBlobPushDeadLettered`) with `RunId` only (no SAS URL in `DataJson`).

---

## Recovery checklist

1. Confirm **`archlucid_run_export_blob_push_outbox_pending`** returns toward zero after fix.
2. Confirm **`archlucid_run_export_blob_push_outbox_dead_letter`** returns to zero after clearing or reprocessing dead-letter rows.
3. Confirm counter **`archlucid_run_export_blob_push_outbox_processed_success_total`** increases on subsequent successful pushes.
4. Re-run **`scripts/release-smoke.ps1`** Step 9 (outbox gate) on a staging SQL environment when validating RC builds.
