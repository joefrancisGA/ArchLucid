> **Scope:** Operator guide — import or provision committed Grafana JSON from `infra/grafana/` and `deploy/grafana/` with correct Prometheus/Loki datasource UIDs, template variables, and RAG per-tenant tag cardinality controls. Does not require a specific managed-Grafana SKU.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Grafana dashboard binding guide

**Last reviewed:** 2026-05-26

**Audience:** Platform operators provisioning observability for a new ArchLucid environment (self-hosted Grafana, Azure Managed Grafana, or Docker compose profile).

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Prometheus** (or Azure Monitor managed Prometheus) scraping API/worker **`/metrics`** or OTLP → Prometheus | See [`SLO_PROMETHEUS_GRAFANA.md`](./SLO_PROMETHEUS_GRAFANA.md) |
| **Optional Loki** | Faithfulness / log panels in `deploy/grafana/dashboards/dashboard-archlucid-llm-faithfulness-budget.json` |
| **Grafana ≥ 9** | Committed JSON uses schemaVersion **38** in sample dashboards |

---

## Where dashboards live

| Location | Purpose |
|----------|---------|
| **`infra/grafana/*.json`** and **`infra/grafana/dashboards/*.json`** | Primary committed dashboards (authority, SLO, integrations, trial funnel, run lifecycle, …) |
| **`deploy/grafana/dashboards/*.json`** | Docker/compose-friendly copies (e.g. LLM faithfulness budget) |
| **`deploy/grafana/provisioning/dashboards/dashboards.yml`** | File provider → mount JSON under `/etc/grafana/provisioning/dashboards` |
| **`infra/terraform-monitoring/`** | Optional `grafana_dashboard` resources when `grafana_terraform_dashboards_enabled = true` |

**Do not edit generated panel UIDs inside JSON** unless you are intentionally forking a dashboard — prefer datasource **template variables** below.

---

## Datasource binding patterns

Committed dashboards use **template variables**, not hard-coded Grafana datasource UIDs:

| Variable | Query type | Binds to |
|----------|------------|----------|
| **`DS_PROMETHEUS`** | `datasource`, query `prometheus` | All Prometheus panels |
| **`DS_LOKI`** | `datasource`, query `loki` | Log panels (where present) |
| **`datasource`** | Legacy name on some `infra/grafana` authority/SLO boards | Prometheus |

Example panel reference (`deploy/grafana/dashboards/dashboard-archlucid-llm-faithfulness-budget.json`):

```json
"datasource": { "type": "prometheus", "uid": "${DS_PROMETHEUS}" }
```

### Import via Grafana UI

1. **Connections → Data sources** — create Prometheus (and Loki if needed). Note the **UID** Grafana assigned (or set an explicit UID when creating the source).
2. **Dashboards → Import** — upload JSON from `infra/grafana/` or `deploy/grafana/dashboards/`.
3. When prompted, map **`DS_PROMETHEUS`** (and **`DS_LOKI`**) to your datasources.
4. Open **Dashboard settings → Variables** — confirm **`DS_PROMETHEUS`** resolves (repeat after clone to a new org).

### Docker compose / file provisioning

1. Mount datasources under `/etc/grafana/provisioning/datasources` with stable **`uid`** fields (e.g. `prometheus`, `loki`).
2. Mount dashboard JSON into the path declared in `deploy/grafana/provisioning/dashboards/dashboards.yml` (`/etc/grafana/provisioning/dashboards`).
3. Restart Grafana; verify folder **ArchLucid** appears.

### Terraform (Azure Managed Grafana)

1. Apply `infra/terraform-monitoring` for `azurerm_dashboard_grafana`.
2. Create a Grafana service account token; set provider env (`GRAFANA_URL`, `GRAFANA_AUTH`).
3. Enable `grafana_terraform_dashboards_enabled` and re-apply (see module README).
4. Re-import is idempotent by dashboard **`uid`** (e.g. **`archlucid-authority`**, **`archlucid-llm-faithfulness-budget`**).

---

## Dashboard UID quick reference

| File (under `infra/grafana/` unless noted) | Dashboard `uid` | Primary signals |
|------------------------------------------|-----------------|-----------------|
| `dashboard-archlucid-authority.json` | **`archlucid-authority`** | Authority outbox depth, stage duration, data consistency |
| `dashboard-archlucid-slo.json` | (filename-based) | HTTP availability burn helpers |
| `dashboard-archlucid-integrations.json` | — | Integration outbox / delivery |
| `dashboard-archlucid-run-lifecycle.json` | — | Per-run variables (`runId`) |
| `dashboard-archlucid-trial-funnel.json` | — | Trial funnel counters |
| `deploy/grafana/dashboards/dashboard-archlucid-llm-faithfulness-budget.json` | **`archlucid-llm-faithfulness-budget`** | LLM faithfulness + budget utilization |
| `docs/support/GRAFANA_DASHBOARD_TIER_1.json` | **`archlucid-tier1-starter`** | Starter tier-1 pack |

Operator runbooks paired with dashboards: [`AUTHORITY_PIPELINE_OBSERVABILITY.md`](./AUTHORITY_PIPELINE_OBSERVABILITY.md), [`SLO_PROMETHEUS_GRAFANA.md`](./SLO_PROMETHEUS_GRAFANA.md), [`INTEGRATION_EVENT_DLQ_RETRY_POLICY.md`](./INTEGRATION_EVENT_DLQ_RETRY_POLICY.md).

---

## Validation checklist (fresh Grafana)

1. **Datasource test** — Prometheus **Save & test** succeeds from Grafana host/network.
2. **Template variables** — `DS_PROMETHEUS` dropdown lists your Prometheus source; no *"datasource not found"* panel errors.
3. **Non-empty smoke query** — run `up` or `archlucid_runs_created_total` in Explore with the same datasource UID.
4. **Authority board** — `archlucid_authority_pipeline_work_pending` panel shows a number (zero is OK on idle env).
5. **Alerts** — import `infra/prometheus/archlucid-alerts.yml` + `archlucid-slo-rules.yml`; run `promtool check rules` before deploy.
6. **Synthetic probe** (optional) — `.github/workflows/api-synthetic-probe.yml` external canary; not a substitute for in-cluster scrape.

---

## RAG metrics and per-tenant tag cardinality

RAG retrieval instruments (`archlucid_rag_retrieval_duration_ms`, `archlucid_rag_chunks_retrieved_total`) accept an optional **`tenant_id`** label when enabled.

| Config key | Default | Purpose |
|------------|---------|---------|
| `RetrievalTelemetry:RecordPerTenantTags` | **`false`** | Emit `tenant_id` on RAG metrics |
| `RetrievalTelemetry:EstimatedTenantCount` | **`0`** | Operator estimate for startup warnings |
| `RetrievalTelemetry:MaxRecommendedTenantCountForPerTenantTags` | **`100`** | Advisory ceiling |

**Production guidance:**

- Leave **`RecordPerTenantTags=false`** for multi-tenant hosted SaaS unless tenant count is bounded and Prometheus cardinality is budgeted.
- When enabled on production-like hosts with high `EstimatedTenantCount`, `RetrievalTelemetryPerTenantTagCircuitBreaker` **suppresses** tags and increments **`archlucid_startup_config_warnings_total`** (`rule_name=retrieval_telemetry_per_tenant_tags_production_like`).

Grafana impact: high-cardinality `tenant_id` labels explode panel cardinality and slow queries — prefer aggregated dashboards without per-tenant breakdown unless you operate a dedicated metrics tier.

See [`OBSERVABILITY.md`](../library/OBSERVABILITY.md) and [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) § `RetrievalTelemetry`.

---

## Common binding failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| All panels "No data" | Wrong datasource UID / variable not mapped | Re-import; set `DS_PROMETHEUS` explicitly |
| Histogram panels empty | OTel → Prometheus naming mismatch (`_bucket` suffix) | Compare scrape targets with panel expr in [`OBSERVABILITY.md`](../library/OBSERVABILITY.md) |
| `runId` variable empty | No recent runs in environment | Execute a smoke architecture run |
| Loki panels broken | `DS_LOKI` not provisioned | Add Loki datasource or remove log panels from fork |

---

## Related documents

| Doc | Use |
|-----|-----|
| [`OBSERVABILITY.md`](../library/OBSERVABILITY.md) | Full metric catalog |
| [`SLO_PROMETHEUS_GRAFANA.md`](./SLO_PROMETHEUS_GRAFANA.md) | SLO recording rules and burn alerts |
| [`AUTHORITY_PIPELINE_OBSERVABILITY.md`](./AUTHORITY_PIPELINE_OBSERVABILITY.md) | Authority backlog remediation |
| [`infra/terraform-monitoring/README.md`](../../infra/terraform-monitoring/README.md) | Managed Grafana Terraform flags |
