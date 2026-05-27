> **Scope:** Operator guide — import committed Grafana JSON, bind Prometheus/Loki datasources, apply Prometheus alert groups (including agent-output quality), and control RAG per-tenant metric cardinality.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Observability dashboard binding guide

**Last reviewed:** 2026-05-26

**Audience:** Platform operators provisioning observability for a new ArchLucid environment (self-hosted Grafana, Azure Managed Grafana, or Docker compose profile).

**Related runbook (legacy filename):** [`GRAFANA_DASHBOARD_BINDING_GUIDE.md`](./GRAFANA_DASHBOARD_BINDING_GUIDE.md) redirects here.

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| **Prometheus** (or Azure Monitor managed Prometheus) scraping API/worker **`/metrics`** or OTLP → Prometheus | See [`SLO_PROMETHEUS_GRAFANA.md`](./SLO_PROMETHEUS_GRAFANA.md) |
| **Optional Loki** | Log panels in `deploy/grafana/dashboards/dashboard-archlucid-llm-faithfulness-budget.json` |
| **Grafana ≥ 9** | Committed JSON uses schemaVersion **38** in sample dashboards |
| **OTel export path live** | At least one of App Insights connection string, OTLP endpoint, or Prometheus scrape — verify with `python scripts/report_observability_export_readiness.py` |

---

## Where dashboards and alerts live

| Location | Purpose |
|----------|---------|
| **`infra/grafana/*.json`** and **`infra/grafana/dashboards/*.json`** | Primary committed dashboards when present in your checkout (authority, SLO, integrations, trial funnel, run lifecycle, …) |
| **`deploy/grafana/dashboards/*.json`** | Docker/compose-friendly copies (e.g. **`dashboard-archlucid-llm-faithfulness-budget.json`**) |
| **`deploy/grafana/provisioning/dashboards/dashboards.yml`** | File provider → mount JSON under `/etc/grafana/provisioning/dashboards` |
| **`docs/support/GRAFANA_DASHBOARD_TIER_1.json`** | Starter tier-1 pack (`uid`: **`archlucid-tier1-starter`**) |
| **`infra/prometheus/archlucid-alerts.yml`** | Threshold/backlog alerts including group **`archlucid-agent-output-quality`** (TB-004 / Improvement #22) |
| **`infra/prometheus/archlucid-slo-rules.yml`** | SLO recording rules + burn-rate alerts — pair with alerts file |

**Do not edit generated panel UIDs inside JSON** unless intentionally forking — prefer datasource **template variables** below.

---

## Datasource binding patterns

Committed dashboards use **template variables**, not hard-coded Grafana datasource UIDs:

| Variable | Query type | Binds to |
|----------|------------|----------|
| **`DS_PROMETHEUS`** | `datasource`, query `prometheus` | All Prometheus panels |
| **`DS_LOKI`** | `datasource`, query `loki` | Log panels (where present) |
| **`datasource`** | Legacy name on some authority/SLO boards | Prometheus |

Example panel reference (`deploy/grafana/dashboards/dashboard-archlucid-llm-faithfulness-budget.json`):

```json
"datasource": { "type": "prometheus", "uid": "${DS_PROMETHEUS}" }
```

### Import via Grafana UI

1. **Connections → Data sources** — create Prometheus (and Loki if needed). Note the **UID** Grafana assigned (or set an explicit UID when creating the source, e.g. `prometheus`).
2. **Dashboards → Import** — upload JSON from `infra/grafana/`, `deploy/grafana/dashboards/`, or `docs/support/`.
3. When prompted, map **`DS_PROMETHEUS`** (and **`DS_LOKI`**) to your datasources.
4. Open **Dashboard settings → Variables** — confirm **`DS_PROMETHEUS`** resolves (repeat after clone to a new org).

### Docker compose / file provisioning

1. Mount datasources under `/etc/grafana/provisioning/datasources` with stable **`uid`** fields (e.g. `prometheus`, `loki`).
2. Mount dashboard JSON into the path declared in `deploy/grafana/provisioning/dashboards/dashboards.yml`.
3. Restart Grafana; verify folder **ArchLucid** (or your provider folder) appears.

### Terraform (Azure Managed Grafana)

When **`infra/terraform-monitoring/`** is present in your deployment branch:

1. Apply for `azurerm_dashboard_grafana`.
2. Create a Grafana service account token; set provider env (`GRAFANA_URL`, `GRAFANA_AUTH`).
3. Enable `grafana_terraform_dashboards_enabled` and re-apply (see module README).
4. Re-import is idempotent by dashboard **`uid`** (e.g. **`archlucid-authority`**, **`archlucid-llm-faithfulness-budget`**).

---

## Prometheus alert rules (`archlucid-alerts.yml`)

Before Grafana import, validate and load alert groups:

```bash
promtool check rules infra/prometheus/archlucid-alerts.yml
promtool check rules infra/prometheus/archlucid-slo-rules.yml
```

| Group | Signals | TB-004 note |
|-------|---------|-------------|
| **`archlucid-agent-output-quality`** | Quality-gate rejects, semantic **p10/p50**, LLM faithfulness **p50**, parse failures, trace blob upload failures | Shipped with Terraform mirror **`prometheus_agent_output_rules.tf`** when managed Prometheus is enabled |
| **`archlucid-trial-funnel`** | Signup / first-run funnel | See [`TRIAL_FUNNEL.md`](./TRIAL_FUNNEL.md) |
| **`archlucid-explainability`** | Explanation cache / trace completeness | See [`OBSERVABILITY.md`](../library/OBSERVABILITY.md) |

Production-like hosts without managed Prometheus still commit the YAML as the **source of truth** for on-call thresholds; wire Alertmanager or Azure Monitor rule groups to the same expressions.

---

## Dashboard UID quick reference

| File | Dashboard `uid` | Primary signals |
|------|-----------------|-----------------|
| `infra/grafana/dashboard-archlucid-authority.json` | **`archlucid-authority`** | Authority outbox depth, stage duration, data consistency |
| `infra/grafana/dashboard-archlucid-slo.json` | (filename-based) | HTTP availability burn helpers |
| `infra/grafana/dashboard-archlucid-integrations.json` | — | Integration outbox / delivery |
| `infra/grafana/dashboard-archlucid-run-lifecycle.json` | — | Per-run variables (`runId`) |
| `infra/grafana/dashboard-archlucid-trial-funnel.json` | — | Trial funnel counters |
| `deploy/grafana/dashboards/dashboard-archlucid-llm-faithfulness-budget.json` | **`archlucid-llm-faithfulness-budget`** | LLM faithfulness + budget utilization |
| `docs/support/GRAFANA_DASHBOARD_TIER_1.json` | **`archlucid-tier1-starter`** | Starter tier-1 pack |

Operator runbooks paired with dashboards: [`AUTHORITY_PIPELINE_OBSERVABILITY.md`](./AUTHORITY_PIPELINE_OBSERVABILITY.md), [`SLO_PROMETHEUS_GRAFANA.md`](./SLO_PROMETHEUS_GRAFANA.md), [`INTEGRATION_EVENT_DLQ_RETRY_POLICY.md`](./INTEGRATION_EVENT_DLQ_RETRY_POLICY.md).

---

## Validation checklist (fresh Grafana)

1. **Datasource test** — Prometheus **Save & test** succeeds from Grafana host/network.
2. **Template variables** — `DS_PROMETHEUS` dropdown lists your Prometheus source; no *"datasource not found"* panel errors.
3. **Non-empty smoke query** — run `up` or `archlucid_runs_created_total` in Explore with the same datasource UID.
4. **Authority board** — `archlucid_authority_pipeline_work_pending` panel shows a number (zero is OK on idle env).
5. **Alert rules** — `promtool check rules` passes on `archlucid-alerts.yml` and `archlucid-slo-rules.yml`; deploy to Prometheus/Alertmanager or Azure Monitor equivalent.
6. **Agent-output metrics** — after one execute, confirm `archlucid_agent_output_quality_gate_total` and related series in Prometheus (see [`AGENT_OUTPUT_EVALUATION.md`](../library/AGENT_OUTPUT_EVALUATION.md) §9).
7. **Synthetic probe** (optional) — `.github/workflows/api-synthetic-probe.yml` external canary; not a substitute for in-cluster scrape.

---

## RAG metrics and per-tenant tag cardinality

RAG retrieval instruments (`archlucid_rag_retrieval_duration_ms`, `archlucid_rag_chunks_retrieved_total`) accept an optional **`tenant_id`** label when enabled.

| Config key | Default | Purpose |
|------------|---------|---------|
| **`RetrievalTelemetry:RecordPerTenantTags`** | **`false`** | Emit `tenant_id` on RAG metrics (assessment alias: *IncludeTenantIdInMetrics* — same flag) |
| **`RetrievalTelemetry:EstimatedTenantCount`** | **`0`** | Operator estimate for startup warnings |
| **`RetrievalTelemetry:MaxRecommendedTenantCountForPerTenantTags`** | **`100`** | Advisory ceiling |

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
| Alert rules fail `promtool check` | Syntax drift or missing recording rules | Fix YAML; ensure SLO rules load before dependent alerts |

---

## Related documents

| Doc | Use |
|-----|-----|
| [`OBSERVABILITY.md`](../library/OBSERVABILITY.md) | Full metric catalog |
| [`SLO_PROMETHEUS_GRAFANA.md`](./SLO_PROMETHEUS_GRAFANA.md) | SLO recording rules and burn alerts |
| [`AUTHORITY_PIPELINE_OBSERVABILITY.md`](./AUTHORITY_PIPELINE_OBSERVABILITY.md) | Authority backlog remediation |
| [`TECH_BACKLOG.md`](../library/TECH_BACKLOG.md) § TB-004 | Agent-output alert wiring history |
| [`OPERATOR_ATLAS.md`](../library/OPERATOR_ATLAS.md) | Operator action map (links here for observability) |
