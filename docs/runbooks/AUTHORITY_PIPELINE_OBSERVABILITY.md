> **Scope:** Grafana / Prometheus remediation for authority pipeline metering — dashboards, backlog, stale outbox rows, data-consistency signals; full procedural detail in sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Authority pipeline metering and Grafana remediation

**Last reviewed:** 2026-05-17

## 1. Objective

Turn **Grafana** panels and **Prometheus** alerts on authority-pipeline and data-consistency metrics into **actionable steps** (queue depth, SQL health, worker capacity) without changing product semantics.

## 2. Assumptions

- Metric names match **`docs/library/OBSERVABILITY.md`** (source **`ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs`**).
- **Prometheus** scrapes the API and worker **`/metrics`** (or OTLP fan-out) with stable label names (`stage`, `outcome`, `table`, `column`).
- Ops can open **`GET /v1/admin/diagnostics/outboxes`** (or equivalent admin surface) for row-level outbox detail when authorized.

## 3. Constraints

- **Do not** relax SQL RLS or tenant isolation to “clear” backlog faster.
- **Do not** delete orphan comparison rows without following **[`COMPARISON_RECORD_ORPHAN_REMEDIATION.md`](./COMPARISON_RECORD_ORPHAN_REMEDIATION.md)** (dry-run / approval path).
- Scale workers only after ruling out **SQL connectivity**, **deadlocks**, and **poison messages** (see **`AGENT_EXECUTION_FAILURES.md`** if agent stages fault repeatedly).

## 4. Architecture overview

**Nodes:** API + Worker processes → **`ArchLucid`** meter → Prometheus → **`infra/prometheus/archlucid-alerts.yml`** → Alertmanager / Azure Monitor → **Grafana** JSON **`infra/grafana/dashboard-archlucid-authority.json`** (uid **`archlucid-authority`**).

**Edges:** Observable **`archlucid_authority_pipeline_work_pending`** reflects **`dbo.AuthorityPipelineWorkOutbox`** depth; **`archlucid_authority_pipeline_work_oldest_pending_age_seconds`** reflects stuck rows; histogram **`archlucid_authority_pipeline_stage_duration_ms`** breaks down wall time by pipeline stage.

## 5. Component breakdown

| Panel / signal | Instrument | Primary owner |
|----------------|------------|---------------|
| Stage duration p95 | `archlucid_authority_pipeline_stage_duration_ms` | Authority pipeline executor / stage services |
| Outbox depth | `archlucid_authority_pipeline_work_pending` | Worker consumer + SQL outbox |
| Oldest row age | `archlucid_authority_pipeline_work_oldest_pending_age_seconds` | Same + scheduling |
| Orphans vs alerts | `archlucid_data_consistency_orphans_detected_total`, `archlucid_data_consistency_alerts_total` | `DataConsistencyOrphanProbeHostedService` + enforcement mode |

## 6. Data flow

1. Runs enqueue **authority pipeline** work into **`AuthorityPipelineWorkOutbox`**.
2. Worker(s) claim rows; stages record **histogram** durations with **`stage`** / **`outcome`**.
3. **Gauges** (`pending`, `oldest_pending_age`) update from SQL aggregates (see `EnsureOutboxDepthObservableGaugesRegistered` in code).
4. **Data consistency** probe increments **counters** when foreign keys to **`dbo.Runs`** are missing; **`alerts_total`** rises when enforcement mode + threshold say so.

## 7. Security model

- Admin diagnostics and **outbox inspection** require **appropriate authority** (do not share tokens in tickets).
- Orphan remediation may touch **tenant-scoped** rows — use approved maintenance windows and **`COMPARISON_RECORD_ORPHAN_REMEDIATION.md`**.

## 8. Operational considerations

### 8.1 Import the dashboard (Grafana UI)

1. Grafana → **Dashboards** → **Import** → upload **`infra/grafana/dashboard-archlucid-authority.json`**.
2. Assign template variable **`datasource`** to your **Prometheus** source.
3. Confirm the first row of panels populates; if **empty**, verify scrape targets and OTLP → Prometheus **histogram** naming (`*_bucket`).

**Optional (Terraform):** when **`grafana_terraform_dashboards_enabled = true`** in **`infra/terraform-monitoring`**, the same JSON is provisioned by **`grafana_dashboard.authority`** (see **`grafana_dashboards.tf`**).

### 8.2 Queue backlog — `ArchLucidAuthorityPipelineWorkBacklog`

- **Rule:** `archlucid_authority_pipeline_work_pending > 50` for **15m** (`infra/prometheus/archlucid-alerts.yml`).
- **Remediation order:**
  1. **Worker health:** confirm worker Container App / job is running, not crash-looping, and draining **`AuthorityPipelineWorkOutbox`** (SQL consumer paths — not Azure Storage Queue unless durable export jobs are enabled).
  2. **SQL tier:** check DTU/vCore saturation, blocking sessions, and failover state (**`DATABASE_FAILOVER.md`** if geo event).
  3. **Scale capacity:** when SQL is healthy but processing lags sustained demand — raise **`worker_max_replicas`** / **`worker_min_replicas`** in **`infra/terraform-container-apps`** (**`infra/terraform-container-apps/README.md`** § Background services). When **`background_jobs_mode = "Durable"`**, enable **`worker_enable_queue_depth_scaling`** + **`worker_queue_scale_connection_string`** so KEDA **azure-queue** adds replicas as **Azure Storage Queue** backlog grows (**export/async jobs**, not SQL outbox row count). For **tenant noisy-neighbor isolation**, tune **`ArchLucid:AuthorityPipeline:Concurrency`** (per-tenant slot caps).
  4. **Deep inspection:** use admin outbox diagnostics for **stuck** `RunId`s; correlate with **`TRACE_A_RUN.md`**.

### 8.3 Stale oldest row — `ArchLucidAuthorityPipelineWorkStale`

- **Rule:** `archlucid_authority_pipeline_work_oldest_pending_age_seconds > 3600` for **20m**.
- **Interpretation:** rows are **not** being processed — prefer **poison message** or **dependency outage** over simple overload.
- **Remediation:** same as **8.2**, but prioritize **root-cause** on the oldest `WorkItem` (exception logs, SQL deadlock history, external LLM outage if stage blocks).

### 8.4 Data consistency — `ArchLucidDataConsistencyOrphansDetected` / `ArchLucidDataConsistencyAlertsRaised`

- **Rules:** non-zero **`rate`** over **1h** windows (see alert **expr** in **`archlucid-alerts.yml`**).
- **Remediation:**
  - **Orphans detected:** identification-only — trace **missing `dbo.Runs`** keys; follow **`COMPARISON_RECORD_ORPHAN_REMEDIATION.md`** for comparison / golden / findings snapshots.
  - **Alerts raised:** enforcement is **Alert** or **Quarantine** — read **`docs/data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md`** and align with **data owners** before destructive fixes.

### 8.5 Recommended `ArchLucid:AuthorityPipeline:Concurrency` by environment tier

Bindings live under **`ArchLucid:AuthorityPipeline:Concurrency`** (`AuthorityPipelineConcurrencyOptions` in product code). **`MaxConcurrentExecutionsPerTenant`** ≤ **0** disables SQL lease enforcement (gate becomes a no-op). **`LeaseRecognitionHorizon`** defaults to **48 hours** and **`WaitPollMilliseconds`** to **75** — change these only when tuning stale-lease cleanup or poll cadence after reviewing **`SqlAuthorityPipelineTenantExecutionLeaseRepository`**.

Tier names align with **[`RTO_RPO_TARGETS.md`](../library/RTO_RPO_TARGETS.md)**. Values below are **starting recommendations** for hosted SaaS posture; validate against worker replica count, SQL SKU, and pilot concurrency.

| Tier | **`MaxConcurrentExecutionsPerTenant`** | **`RejectInlineCreateWhenConcurrencyUnavailable`** | Notes |
|------|----------------------------------------|-----------------------------------------------------|-------|
| **Development** | **0** *(omit or explicit)* — enforcement **off** | **false** *(default)* | Matches shipped default when unset; avoids blocking parallel local runs. Set a **small positive** value only when intentionally testing the lease gate. |
| **Staging / pre-production** | **2**–**4** | **false** *(default)* unless validating fast-fail UX | Exercises **`dbo.AuthorityPipelineTenantExecutionLease`** and queue/offload paths before production; prefer **lower** bound on shared SQL. |
| **Production** | **4** *(initial)*; adjust **2**–**8** with capacity review | **false** by default; **true** when synchronous **`POST /v1/architecture/request`** must **429-style fail fast** instead of waiting for a slot | Caps per-tenant **heavy-stage** fan-out (graph / findings / decision / manifest). Raise slots only when **§8.2** backlog stays healthy, SQL has headroom, and **§8.6** lease counts stay bounded. Pair with **`worker_min_replicas` / `worker_max_replicas`** (`infra/terraform-container-apps`) rather than unbounded concurrency alone. |

**Inline vs queued:** When **`RejectInlineCreateWhenConcurrencyUnavailable`** is **true** and slots are full, **synchronous** creates fail fast with **`AuthorityTenantConcurrencyLimitExceededException`** (problem hints reference concurrency keys — see **`ProblemSupportHints`**). Work processed via the **authority pipeline work outbox** still **waits** for capacity (poll interval **`WaitPollMilliseconds`**).

### 8.6 Lease table growth — `dbo.AuthorityPipelineTenantExecutionLease`

**Purpose:** One row per **run** currently holding a **per-tenant execution slot** for authority heavy stages. Implementation: **`SqlAuthorityPipelineTenantExecutionLeaseRepository`** / **`SqlTenantAuthorityPipelineConcurrencyGate`**.

**Lifecycle (steady state):**

- **Insert** when a slot is acquired (**`TryAcquireLeaseAsync`**, serializable transaction).
- **Delete** when the pipeline releases the slot (**`ReleaseLeaseAsync`** on normal completion).
- **Stale cleanup:** On each acquire attempt for a **tenant**, rows with **`AcquiredUtc`** older than **`UTC now − LeaseRecognitionHorizon`** are deleted for **that tenant** before counting active leases — crashed workers eventually stop counting toward capacity once leases age past the horizon **and** that tenant has another acquire attempt.

**Why monitor row count:** Under healthy operation, total rows should stay **small** (order of **active concurrent pipelines** across all tenants). **Sustained growth** or **per-tenant counts persistently above `MaxConcurrentExecutionsPerTenant`** suggests stuck pipelines, crash loops without release, misconfigured horizon, or overload — correlate with **`archlucid_authority_pipeline_work_pending`**, **`AuthorityPipelineWorkOutbox`**, and **`TRACE_A_RUN.md`**.

**Suggested SQL checks** (read-only; run in maintenance window or via least-privilege auditor):

```sql
-- Fleet-wide lease cardinality (alert if baseline drifts upward without tenant growth).
SELECT COUNT_BIG(*) AS LeaseRowCount
FROM dbo.AuthorityPipelineTenantExecutionLease;

-- Noisy tenants or imbalance (compare to configured MaxConcurrentExecutionsPerTenant).
SELECT TenantId,
       COUNT_BIG(*) AS ActiveLeases,
       MIN(AcquiredUtc) AS OldestAcquireUtc,
       MAX(AcquiredUtc) AS NewestAcquireUtc
FROM dbo.AuthorityPipelineTenantExecutionLease
GROUP BY TenantId
ORDER BY ActiveLeases DESC;

-- Oldest holders — investigate stuck runs / missing releases first.
SELECT TOP (50) RunId, TenantId, AcquiredUtc
FROM dbo.AuthorityPipelineTenantExecutionLease
ORDER BY AcquiredUtc ASC;
```

**Remediation outline:**

1. Match outliers to **`RunId`** — **`GET /v1/admin/diagnostics/outboxes`** (authorized) and application logs for those runs.
2. If workers crash mid-pipeline, restore worker health first; rely on **`LeaseRecognitionHorizon`** + subsequent acquires for cleanup — **do not** shorten the horizon drastically without understanding longest legitimate pipeline duration.
3. If overload is legitimate, prefer **§8.5** slot tuning and **worker/SQL scale** over disabling enforcement entirely.

## 9. Related documentation

- **`docs/library/OBSERVABILITY.md`** — canonical metric names.
- **`infra/prometheus/archlucid-alerts.yml`** — alert thresholds and **`for`** durations.
- **`docs/runbooks/SLO_PROMETHEUS_GRAFANA.md`** — broader Grafana / SLO context.
- **`docs/library/RTO_RPO_TARGETS.md`** — environment tier naming (continuity); **`docs/runbooks/TRACE_A_RUN.md`** — single-run drill-down.
