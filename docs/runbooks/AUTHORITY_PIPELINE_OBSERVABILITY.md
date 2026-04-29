> **Scope:** Grafana / Prometheus remediation for authority pipeline metering — dashboards, backlog, stale outbox rows, data-consistency signals; full procedural detail in sections below.

> **Spine doc:** [Five-document onboarding spine](../FIRST_5_DOCS.md).

# Authority pipeline metering and Grafana remediation

**Last reviewed:** 2026-04-29

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
  1. **Worker health:** confirm worker Container App / job is running, not crash-looping, and processing the **authority** queue profile.
  2. **SQL tier:** check DTU/vCore saturation, blocking sessions, and failover state (**`DATABASE_FAILOVER.md`** if geo event).
  3. **Scale out** worker replicas when SQL is healthy but **CPU** or **claim rate** lags demand (see **`infra/README.md`** → **`terraform-container-apps`** scaling levers).
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

## 9. Related documentation

- **`docs/library/OBSERVABILITY.md`** — canonical metric names.
- **`infra/prometheus/archlucid-alerts.yml`** — alert thresholds and **`for`** durations.
- **`docs/runbooks/SLO_PROMETHEUS_GRAFANA.md`** — broader Grafana / SLO context.
