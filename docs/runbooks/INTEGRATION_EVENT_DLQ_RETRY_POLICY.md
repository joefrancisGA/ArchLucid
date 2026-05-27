> **Scope:** Operator runbook — integration outbox publish retries, dead-letter auto-requeue (`IntegrationEventDlqRetryHostedService`), manual DLQ UI/API, and when to acknowledge vs retry. Does not cover Service Bus subscription DLQ (consumer abandon path) — see [`INTEGRATION_EVENTS_AND_WEBHOOKS.md`](../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Integration event DLQ retry policy

**Last reviewed:** 2026-05-26

**Audience:** Operators triaging failed outbound integration events (Service Bus publish failures from `dbo.IntegrationEventOutbox`).

---

## Two retry layers (do not conflate)

| Layer | What fails | Config | Terminal state |
|-------|------------|--------|----------------|
| **Outbox publish processor** | `IIntegrationEventPublisher.PublishAsync` throws | `IntegrationEvents:OutboxMaxPublishAttempts` (default **6**), `IntegrationEvents:OutboxMaxBackoffSeconds` (default **300**) | Row gets `DeadLetteredUtc` set when attempts exhausted |
| **DLQ auto-retry hosted service** | Row already dead-lettered; operator/system requeue | `IntegrationEventDlqRetryPolicy.MaxAutoRetryCount` = **5** (code constant) | `RetryCount >= 5` → permanent failure; manual acknowledgement required |

Backoff for **publish** retries: `IntegrationEventOutboxRetryCalculator` — delay ≈ **2^failureCount** seconds, capped by `OutboxMaxBackoffSeconds`.

Backoff for **DLQ auto-retry** eligibility: `IntegrationEventDlqRetryPolicy.ComputeBackoff(retryCount)` — **1, 2, 4, 8, … minutes**, minimum **1 minute**, cap **120 minutes**, keyed off the row's **`RetryCount`** at dead-letter time.

---

## Auto-retry hosted service

| Property | Value |
|----------|-------|
| Type | `IntegrationEventDlqRetryHostedService` (`ArchLucid.Host.Core`) |
| Election | Leader-elected lease `HostElectionLeaseNames.IntegrationEventDlqRetry` |
| Interval | **Every 15 minutes** |
| Batch size | Up to **100** dead-letter rows per pass (`ListDeadLettersAsync`) |
| Work | `ResetDeadLetterForRetryAsync` when eligible |

**Eligibility (`IsEligibleForAutoRetry`):**

- Row is **not** permanently failed (`RetryCount < 5`).
- `UtcNow >= DeadLetteredUtc + ComputeBackoff(RetryCount)`.

**Permanent failure (`IsPermanentlyFailed`):**

- `RetryCount >= MaxAutoRetryCount` (**5**).
- Incremented metric: **`archlucid_integration_event_dlq_permanent_failure_total`** (batch per pass).
- Log warning: *"skipped N permanently failed dead-letter row(s)"*.

---

## Operator surfaces

| Surface | Use |
|---------|-----|
| **UI** | `/operate/integration-events/dlq` — tenant, age, last error, single/bulk retry, suppress |
| **Admin API** | `GET /v1/admin/integration-outbox/dead-letters`, `POST …/dead-letters/{outboxId}/retry`, `POST …/dead-letters/{outboxId}/suppress`, bulk `POST /v1/admin/integrations/outbox/retry-dead-letter` |
| **CLI** | `archlucid integrations retry-dead-letter` (see OpenAPI / CLI help) |

Suppress/acknowledge paths emit durable audit events — prefer them over raw SQL deletes.

---

## Decision tree

```text
Row in DLQ list?
├─ RetryCount < 5 AND age < backoff window → "Waiting for auto-retry" (check again after 15m pass)
├─ RetryCount < 5 AND eligible → Auto-retry may requeue; or use manual Retry for immediate attempt
├─ RetryCount >= 5 → Permanent failure — fix root cause, then manual retry OR suppress after verification
└─ Poison payload / bad event_type → Suppress after documenting; do not infinite retry
```

---

## Configuration reference

```json
"IntegrationEvents": {
  "TransactionalOutboxEnabled": true,
  "OutboxMaxPublishAttempts": 6,
  "OutboxMaxBackoffSeconds": 300,
  "ServiceBusFullyQualifiedNamespace": "mysb.servicebus.windows.net",
  "QueueOrTopicName": "archlucid-integration-events"
}
```

| Key | Default | Notes |
|-----|---------|-------|
| `IntegrationEvents:OutboxMaxPublishAttempts` | **6** | Clamped **1–100** in processor |
| `IntegrationEvents:OutboxMaxBackoffSeconds` | **300** | Clamped **1–86400** |
| DLQ `MaxAutoRetryCount` | **5** | Code constant in `IntegrationEventDlqRetryPolicy` — change requires product approval + tests |

Validator: `IntegrationEventsOptionsValidator` (both numeric keys must be ≥ 1).

---

## Metrics and logs

| Signal | Source |
|--------|--------|
| `archlucid_integration_event_outbox_pending` / backlog gauges | OpenTelemetry `ArchLucid` meter — see [`OBSERVABILITY.md`](../library/OBSERVABILITY.md) |
| `archlucid_integration_event_delivery_failures_total` | Per failed publish attempt |
| `archlucid_integration_event_dlq_permanent_failure_total` | Auto-retry pass skipped exhausted rows |
| Structured logs | `IntegrationEventOutboxProcessor` — dead-letter after max attempts; DLQ hosted service — requeue counts |

Grafana: **`infra/grafana/dashboard-archlucid-integrations.json`** (import binding: [`GRAFANA_DASHBOARD_BINDING_GUIDE.md`](./GRAFANA_DASHBOARD_BINDING_GUIDE.md)).

---

## SQL inspection (support / DB owner)

Pending (not dead-lettered):

```sql
SELECT TOP 50 OutboxId, EventType, RetryCount, NextRetryUtc, LastErrorMessage, CreatedUtc
FROM dbo.IntegrationEventOutbox
WHERE ProcessedUtc IS NULL AND DeadLetteredUtc IS NULL
ORDER BY CreatedUtc;
```

Dead-lettered:

```sql
SELECT TOP 50 OutboxId, EventType, RetryCount, DeadLetteredUtc, LastErrorMessage, TenantId
FROM dbo.IntegrationEventOutbox
WHERE DeadLetteredUtc IS NOT NULL
ORDER BY DeadLetteredUtc DESC;
```

---

## When manual acknowledgement is appropriate

- Event type is retired or payload schema is invalid (poison message).
- Downstream Service Bus namespace was decommissioned and event is stale.
- Tenant was offboarded and delivery is no longer meaningful.
- Auto-retry exhausted (`RetryCount >= 5`) **and** root cause is understood — suppress after optional one-off manual retry post-fix.

**Avoid** suppressing rows still failing for transient Azure outages until Service Bus connectivity recovers.

---

## Related documents

| Doc | Use |
|-----|-----|
| [`INTEGRATION_EVENTS_AND_WEBHOOKS.md`](../library/INTEGRATION_EVENTS_AND_WEBHOOKS.md) | Outbox event catalog, Service Bus consumer DLQ |
| [`AUTHORITY_PIPELINE_OBSERVABILITY.md`](./AUTHORITY_PIPELINE_OBSERVABILITY.md) | Backlog alerts vs integration outbox |
| [`ALERT_DELIVERY_FAILURES.md`](./ALERT_DELIVERY_FAILURES.md) | Downstream webhook delivery (separate from outbox publish) |
| [`SLO_PROMETHEUS_GRAFANA.md`](./SLO_PROMETHEUS_GRAFANA.md) | Prometheus alert bundle |
