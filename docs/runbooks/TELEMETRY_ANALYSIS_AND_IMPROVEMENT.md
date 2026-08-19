> **Scope:** Owner / on-call loop for analyzing ArchLucid telemetry to fix errors and drive improvements — catch → correlate → fix → verify.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Telemetry analysis and improvement

**Audience:** Platform owner, on-call, and operators who need a practical path from signals to fixes — not the full instrumentation catalog.

**Implementation reference:** [`OBSERVABILITY.md`](../library/OBSERVABILITY.md) (exporters, metrics, correlation). **Normative ADR:** [0053](../architecture/adrs/0053-enterprise-diagnostic-logging-observability-posture.md).

---

## Three-layer model

| Layer | Answers | Where |
| --- | --- | --- |
| Durable audit | What was recorded for compliance | `/governance/audit`, `GET /v1/audit/search`, `dbo.AuditEvents` |
| Traces + metrics | What was slow or failed; capacity / cost | OpenTelemetry → App Insights / OTLP / Prometheus + Grafana |
| Structured logs | What the process said at failure | Serilog → stdout / App Insights logs |

Correlate across layers with **`X-Correlation-ID` / `correlation.id`**, **`archlucid.run_id`**, **`dbo.Runs.OtelTraceId`**, and (on spans) **`archlucid.tenant_id` / `archlucid.workspace_id`**.

---

## Owner loop: catch → correlate → fix → verify

### 1. Catch new failures (daily)

Enable the **Ops: App Insights daily error report** GitHub Action. It emails only *new* exception / failed-request / failed-dependency signatures so recurring noise does not spam the inbox.

Setup and secrets: [`APP_INSIGHTS_DAILY_ERROR_REPORT.md`](./APP_INSIGHTS_DAILY_ERROR_REPORT.md).

### 2. Triage a bad run

Follow [`TRACE_A_RUN.md`](./TRACE_A_RUN.md) end-to-end. Quick CLI:

```text
archlucid doctor
archlucid health
archlucid trace {runId}
archlucid run-support-packet {runId}
archlucid support-bundle --zip
```

In-product:

| Surface | Use |
| --- | --- |
| `/administration/system-health` | Live/ready checks, needs-attention; deeper Admin diagnostics via `/internal/health` |
| Review detail (`/reviews/{runId}`) | Pipeline stages + OTel deep-link when `otelTraceId` is present |
| `/governance/audit` | Durable compliance trail for the run |
| Report Problem (high-stakes surfaces) | Customer-initiated packet → [`SUPPORT_PROBLEM_REPORT_TRIAGE.md`](./SUPPORT_PROBLEM_REPORT_TRIAGE.md) |

Map symptoms to [`COMMON_ERRORS.md`](./COMMON_ERRORS.md). First-line engineering triage: [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md). Agent / execute failures: [`AGENT_EXECUTION_FAILURES.md`](./AGENT_EXECUTION_FAILURES.md). Stuck runs: [`STALE_IN_FLIGHT_RUNS.md`](./STALE_IN_FLIGHT_RUNS.md).

### 3. Query App Insights / Log Analytics

1. Confirm export: `APPLICATIONINSIGHTS_CONNECTION_STRING` (or sibling keys) on **Api and Worker** — Worker blind export is a common gap.
2. Filter on `customDimensions["correlation.id"]`, `archlucid.run_id`, `archlucid.tenant_id`, or the W3C trace id from `otelTraceId` / `X-Trace-Id`.
3. Map failed requests, exceptions, and dependencies to the runbooks above.

Offline readiness (config only, no Azure call): `python scripts/report_observability_export_readiness.py`.

### 4. Improve from trends (metrics / Grafana)

1. Scrape `/metrics` or OTLP → Prometheus / Azure Monitor Workspace.
2. Dashboards under `infra/grafana/` (authority, run lifecycle, SLO, LLM, …); bind per [`OBSERVABILITY_DASHBOARD_BINDING.md`](./OBSERVABILITY_DASHBOARD_BINDING.md).
3. SLIs and burn-rate alerts: [`SLO_PROMETHEUS_GRAFANA.md`](./SLO_PROMETHEUS_GRAFANA.md).
4. Prove scrape: `pwsh scripts/ops/verify-amw-p0-metrics.ps1`.
5. Authority backlog remediation table: [`OBSERVABILITY.md`](../library/OBSERVABILITY.md) (authority pipeline section).

UI field vitals before cutting UI work: [`FIELD_WEB_VITALS_TRIAGE.md`](./FIELD_WEB_VITALS_TRIAGE.md).

### 5. Verify the fix

Re-run the failing path (or the review-path canary if applicable — [`REVIEW_PATH_CANARY.md`](./REVIEW_PATH_CANARY.md)). Confirm the new error signature is gone from the next daily report artifact and that related Grafana / SLO panels recover.

---

## Prerequisites

| Need | Notes |
| --- | --- |
| App Insights on every production-like host | Preferred: `APPLICATIONINSIGHTS_CONNECTION_STRING` on **Api and Worker** (also `ApplicationInsights:ConnectionString` / `Observability:AzureMonitor:ApplicationInsightsConnectionString`) |
| Optional OTLP / Prometheus | `Observability:Otlp:*`, `Observability:Prometheus:Enabled` — see [`OBSERVABILITY.md`](../library/OBSERVABILITY.md) |
| Trace viewer deep-links | `ARCHLUCID_TRACE_VIEWER_URL_TEMPLATE` / `NEXT_PUBLIC_TRACE_VIEWER_URL_TEMPLATE` with `{traceId}` |
| Solo P0 paging | Repo YAML alone ≠ enabled alerts — apply scrape + critical action group + Portal Test per [`SOLO_OPERATOR_MVO_OBSERVABILITY.md`](../operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md) |
| Prod fail-fast when blind | `ProductionValidation:RequireTelemetryExport=true` |

Wiring lives in `ArchLucid.Host.Core/Startup/ObservabilityExtensions.cs`. Config keys: [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md). CLI detail: [`CLI_USAGE.md`](../library/CLI_USAGE.md).

---

## Scripts and automation

| Asset | Role |
| --- | --- |
| `.github/workflows/app-insights-daily-error-report.yml` | Scheduled new-signature report |
| `scripts/ci/report_app_insights_daily_errors.py` | Query + Markdown/JSON artifacts |
| `scripts/report_observability_export_readiness.py` | Offline exporter readiness summary |
| `scripts/ops/verify-amw-p0-metrics.ps1` | Prove AMW has `archlucid_*` series |
| `scripts/ops/wire-application-insights-env.ps1` | Wire App Insights into env |
| `.github/workflows/api-synthetic-probe.yml` | External `/health/live` + `/version` |

---

## Caveats (do not misread the signals)

- **Missing traces** often mean head/tail sampling, not a broken pipeline — recover the id from `X-Trace-Id` on the original response.
- **Background jobs** use synthetic `correlation.id` values (`run:{RunId}`, …); they may not match the browser’s creation request id — see [`BACKGROUND_JOB_CORRELATION.md`](../library/BACKGROUND_JOB_CORRELATION.md).
- **Prompts/completions** are omitted from spans by default in prod-like hosts (`LlmTelemetry:CapturePromptResponseOnSpans`).
- Admin diagnostics help is orientation, not a live health export — [`OPERATOR_ADMIN_DIAGNOSTICS.md`](../library/customer-facing/OPERATOR_ADMIN_DIAGNOSTICS.md).

---

## Related documents

| Doc | Use |
| --- | --- |
| [`OBSERVABILITY.md`](../library/OBSERVABILITY.md) | Full exporters, ActivitySources, metrics catalog |
| [`TRACE_A_RUN.md`](./TRACE_A_RUN.md) | One-run correlation walkthrough |
| [`APP_INSIGHTS_DAILY_ERROR_REPORT.md`](./APP_INSIGHTS_DAILY_ERROR_REPORT.md) | Daily new-signature email setup |
| [`TROUBLESHOOTING.md`](./TROUBLESHOOTING.md) | Engineering first-line triage |
| [`COMMON_ERRORS.md`](./COMMON_ERRORS.md) | Top operator failure modes |
| [`SUPPORT_PROBLEM_REPORT_TRIAGE.md`](./SUPPORT_PROBLEM_REPORT_TRIAGE.md) | Report Problem → SQL + App Insights |
| [`SOLO_OPERATOR_MVO_OBSERVABILITY.md`](../operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md) | Solo-operator P0 paging enablement |
| [`infra/terraform-monitoring/README.md`](../../infra/terraform-monitoring/README.md) | Terraform monitoring / Managed Grafana |
