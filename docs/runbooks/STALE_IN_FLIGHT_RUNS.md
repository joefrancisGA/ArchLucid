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
3. Reconstruct that run with [`TRACE_A_RUN.md`](./TRACE_A_RUN.md) (`archlucid trace {runId}` or `GET /v1/architecture/review/{runId}`).
4. Check fleet P0s still green (`ArchLucidApiUnavailableTf`, dead letters, health). If fleet is green and only one tenant appears in the log samples, treat as **single-tenant degradation** (the MVO gap this alert closes).
5. If many tenants appear with rising `FleetStaleCount`, escalate as **worker / LLM / SQL** capacity — see [`SCALE_THRESHOLD_RUNBOOK.md`](../library/SCALE_THRESHOLD_RUNBOOK.md) and authority remediation in [`OBSERVABILITY.md`](../library/OBSERVABILITY.md#authority-pipeline-remediation-runbook).

## 3. Synthetic proof (acceptance)

With fleet health green:

1. Leave (or inject) one smoke-tenant run stuck in `WaitingForResults` for &gt;1h.
2. Confirm gauges: `archlucid_runs_stale_in_flight_count >= 1` and oldest age ≥ 3600s.
3. After 15m, critical action group should fire `ArchLucidStaleInFlightRunsTf`.
4. Log line must include that smoke tenant’s `TenantId` / `RunId`.

## 4. Operator remediation (soft-archive)

Stuck in-flight rows that already hold `GoldenManifestId` / `ArtifactBundleId` **cannot** be marked `Failed` (`CK_Runs_FailedNoManifest` / `CK_Runs_FailedNoArtifact`). Prefer soft-archive (`ArchivedUtc`) so they drop out of the stale probe and clear `/health/ready` `data_consistency` after the next reconciliation pass.

| Step | Call |
|------|------|
| Detect | `GET /v1/admin/diagnostics/data-consistency/stale-in-flight-runs` |
| Preview | `POST /v1/admin/diagnostics/data-consistency/stale-in-flight-runs?dryRun=true&maxRows=50` |
| Execute | `POST /v1/admin/diagnostics/data-consistency/stale-in-flight-runs?dryRun=false&maxRows=50` |

Execute audits `ManifestArchived` with `kind=staleInFlight` and runs `Archival_CascadeFromArchivedRuns` via `ArchiveRunsByIdsAsync`. Restart or wait for the next data-consistency reconciliation interval (minimum 15 minutes) for health to refresh.

Do **not** use `POST /v1/operations/run:{runId}/cancel` for these CHECK-blocked headers — cancel sets `Failed` and will fail the database UPDATE.

## 5. Related: missing ArchitectureRequest orphans (TB-2190)

Separate from stale in-flight: non-archived `dbo.Runs` whose `ArchitectureRequestId` is missing from `dbo.ArchitectureRequests` degrade `/health/ready` via reconciliation finding `runs_missing_architecture_request`.

| Step | Call |
|------|------|
| Detect | `GET /v1/admin/diagnostics/data-consistency/missing-architecture-request-runs` |
| Preview | `POST /v1/admin/diagnostics/data-consistency/missing-architecture-request-runs?dryRun=true&maxRows=50` |
| Execute | `POST /v1/admin/diagnostics/data-consistency/missing-architecture-request-runs?dryRun=false&maxRows=50` |

Grace default is **15 minutes** (`DataConsistency:AutoRemediateMissingArchitectureRequestRuns:MinAgeMinutes`). Development enables auto soft-archive on the same cadence as stale in-flight. Sync CreateRun persists the ArchitectureRequest **before** the run header to prevent new orphans.

## 6. Related

- MVO catalog: [`SOLO_OPERATOR_MVO_OBSERVABILITY.md`](../operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md)
- Metrics catalog: [`OBSERVABILITY.md`](../library/OBSERVABILITY.md)
- Terraform: `infra/terraform-monitoring/prometheus_p0_rules.tf`
- Collector: `StaleInFlightRunMetricsHostedService`
- Matrix: [`DATA_CONSISTENCY_MATRIX.md`](../library/DATA_CONSISTENCY_MATRIX.md)
