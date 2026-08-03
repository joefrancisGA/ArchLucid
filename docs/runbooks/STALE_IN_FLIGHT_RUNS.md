> **Scope:** Operator runbook for fleet-wide stale in-flight architecture runs (TB-958) — pages on critical action group without per-tenant Prometheus cardinality.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Stale in-flight runs (TB-958)

## 1. What pages

| Alert (Terraform) | Expression | `for` |
|-------------------|------------|-------|
| `ArchLucidStaleInFlightRunsTf` | `archlucid_runs_stale_in_flight_count > 0` | 15m |

**Definition of stale:** non-archived `dbo.Runs` in `Created` / `TasksGenerated` / `WaitingForResults` / `Retrying` with `CreatedUtc` older than **1 hour** (same predicate as `DataConsistencyReconciliationSql.StaleInFlightRuns`).

**Cardinality budget:** gauges are **fleet-wide only** — no `tenant_id` Prom label. Tenant and run ids land in structured API/Worker logs:

```text
Stale in-flight run detected. TenantId=… RunId=… Status=… AgeSeconds=… FleetStaleCount=…
```

## 2. Confirm tenant impact vs noisy neighbor

1. Open App Insights / Log Analytics → filter last 30m for `Stale in-flight run detected`.
2. Note `TenantId` + `RunId` from the oldest sample.
3. Reconstruct that run with [`TRACE_A_RUN.md`](./TRACE_A_RUN.md) (`archlucid trace {runId}` or `GET /v1/architecture/run/{runId}`).
4. Check fleet P0s still green (`ArchLucidApiUnavailableTf`, dead letters, health). If fleet is green and only one tenant appears in the log samples, treat as **single-tenant degradation** (the MVO gap this alert closes).
5. If many tenants appear with rising `FleetStaleCount`, escalate as **worker / LLM / SQL** capacity — see [`SCALE_THRESHOLD_RUNBOOK.md`](../library/SCALE_THRESHOLD_RUNBOOK.md) and authority remediation in [`OBSERVABILITY.md`](../library/OBSERVABILITY.md#authority-pipeline-remediation-runbook).

## 3. Synthetic proof (acceptance)

With fleet health green:

1. Leave (or inject) one smoke-tenant run stuck in `WaitingForResults` for &gt;1h.
2. Confirm gauges: `archlucid_runs_stale_in_flight_count >= 1` and oldest age ≥ 3600s.
3. After 15m, critical action group should fire `ArchLucidStaleInFlightRunsTf`.
4. Log line must include that smoke tenant’s `TenantId` / `RunId`.

## 4. Related

- MVO catalog: [`SOLO_OPERATOR_MVO_OBSERVABILITY.md`](../operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md)
- Metrics catalog: [`OBSERVABILITY.md`](../library/OBSERVABILITY.md)
- Terraform: `infra/terraform-monitoring/prometheus_p0_rules.tf`
- Collector: `StaleInFlightRunMetricsHostedService`
