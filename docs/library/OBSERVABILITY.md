> **Scope:** Contributor-reference — Observability — telemetry export, correlation, metrics, traces, and structured logging for ArchLucid hosts. Full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Observability

**Audience:** Backend/UI developers adding instrumentation, and operators wiring or troubleshooting export.

**Normative source:** [ADR 0053](../architecture/adrs/0053-enterprise-diagnostic-logging-observability-posture.md) — enterprise diagnostic logging and observability posture. This doc is the implementation reference; the ADR is the decision record.

---

## Three-layer model

| Layer | Purpose | Canonical store / sink |
| --- | --- | --- |
| **Durable audit** | Compliance, governance, buyer-facing evidence trail | `dbo.AuditEvents` via `IAuditService` (`AuditEventTypes`) |
| **Distributed traces + metrics** | Latency, dependency failure, AI cost, pipeline stage timing | OpenTelemetry → Azure Monitor / OTLP / Prometheus |
| **Structured logs** | Human-readable triage, request logging, failure detail | Serilog console + App Insights log ingestion when configured |

These layers are complementary, not redundant: audit answers "what was recorded for compliance," traces answer "what was slow or failed," logs answer "what did the process say at the moment of failure." Owner analysis loop: [`TELEMETRY_ANALYSIS_AND_IMPROVEMENT.md`](../runbooks/TELEMETRY_ANALYSIS_AND_IMPROVEMENT.md). Worked one-run example: [`TRACE_A_RUN.md`](../runbooks/TRACE_A_RUN.md).

---

## Correlation dimensions

Set on every request-scoped `Activity` and log scope where the value is known ([`ArchLucid.Core/Diagnostics/ActivityScopeTags.cs`](../../ArchLucid.Core/Diagnostics/ActivityScopeTags.cs), [`CorrelationIdMiddleware.cs`](../../ArchLucid.Host.Core/Middleware/CorrelationIdMiddleware.cs)):

| Dimension | Activity tag | Response header | Notes |
| --- | --- | --- | --- |
| Correlation | `correlation.id` | `X-Correlation-ID` | Echoes client-supplied value when valid, else `HttpContext.TraceIdentifier` |
| Distributed trace | *(implicit — `Activity.TraceId`)* | `X-Trace-Id`, `traceparent` | Set by `TraceResponseHeaderMiddleware` on every response, even when the trace is later dropped by sampling |
| Review / run | `archlucid.run_id` | — | Bound from the `runId` route value when present |
| Tenant | `archlucid.tenant_id` | — | **TB-329** — tag only, never duplicated into log lines to limit PII/cardinality |
| Workspace | `archlucid.workspace_id` | — | **TB-329** |
| Evidence package | `archlucid.evidence_package_id` | — | **TB-331** — ingest paths only |

Serilog enriches with `CorrelationId` via `LogContext.PushProperty` (not tenant/workspace — those stay trace-only per the cardinality guidance above). Background jobs use synthetic correlation ids (`run:{RunId}`, `integration-outbox:{id}`) — see [`BACKGROUND_JOB_CORRELATION.md`](BACKGROUND_JOB_CORRELATION.md).

`dbo.Runs.OtelTraceId` persists the W3C trace id from run creation so operators can jump from a run record straight to a trace backend after the fact — see [`TRACE_A_RUN.md`](../runbooks/TRACE_A_RUN.md) and `archlucid trace {runId}` in [`CLI_USAGE.md`](CLI_USAGE.md).

---

## Telemetry export paths

Registered in [`ArchLucid.Host.Core/Startup/ObservabilityExtensions.cs`](../../ArchLucid.Host.Core/Startup/ObservabilityExtensions.cs) → `AddArchLucidOpenTelemetry`, called by `ArchLucid.Api`, `ArchLucid.Worker`, and `ArchLucid.Jobs.Cli`. Multiple exporters can be active **simultaneously** (dual/triple export):

| Exporter | Enabled by | Configuration keys |
| --- | --- | --- |
| **Azure Monitor (App Insights)** — primary production sink per ADR 0053 | Any of `APPLICATIONINSIGHTS_CONNECTION_STRING`, `ApplicationInsights:ConnectionString`, `Observability:AzureMonitor:ApplicationInsightsConnectionString` being non-empty | Connection string only — no further tuning |
| **OTLP** | `Observability:Otlp:Endpoint` non-empty **and** `Observability:Otlp:Enabled` not explicitly `false` (kill-switch) | `Observability:Otlp:Endpoint`, `:Protocol` (`Grpc` default or `HttpProtobuf`), `:Headers` |
| **Prometheus** (scrape) | `Observability:Prometheus:Enabled` | `:ScrapePath` (default `/metrics`), `:RequireScrapeAuthentication`, `:ScrapeUsername`/`:ScrapePassword` — enforced by `PrometheusScrapeAuthMiddleware` |
| **Console** | `Observability:ConsoleExporter:Enabled` (defaults to `true` in Development) | — |

`/health` and sub-paths are excluded from ASP.NET Core trace instrumentation (`ObservabilityExtensions.IsHealthCheckRequest`) so liveness/readiness polling never floods any exporter.

**Worker and Jobs.Cli parity (TB-336):** `ArchLucid.Worker` and `ArchLucid.Jobs.Cli` register the same OpenTelemetry wiring as `ArchLucid.Api`, but do **not** share the Api host's configuration merge chain (`appsettings.Advanced.json` / `appsettings.SaaS.json` are Api-only). In production, every container/replica/job definition needs the **same** export settings — typically `APPLICATIONINSIGHTS_CONNECTION_STRING` on each, not only on the Api app.

**Fail-fast:** When `ProductionValidation:RequireTelemetryExport=true`, `ProductionDangerousMisconfigurationLint` refuses to start a production-like host with no exporter configured, so production cannot silently run blind. Injection runbook: **TB-333**.

**Readiness check:** `python scripts/report_observability_export_readiness.py` produces an offline Markdown summary of which exporters an environment's configuration would activate, without calling Azure or the network.

---

## Trace sampling

- `Observability:Tracing:SamplingRatio` (default `1.0`) drives a head-based `TraceIdRatioBasedSampler` for root spans when below `1.0`, wrapped in a `ParentBasedSampler` so remote parent decisions are respected. Unparseable values fall back to `1.0` so a config typo never fails startup.
- `Observability:Tracing:AlwaysSampleActivitySources` (list) keeps named sources — for example `ArchLucid.AuthorityRun` — at full fidelity even when `SamplingRatio` is below `1.0`. See `ObservabilityTraceSamplingConfigurator` / `AlwaysSampleActivitySourceSampler.cs`.
- The [OTel Collector](../../infra/terraform-otel-collector/README.md) applies **tail sampling** downstream, complementing in-process head sampling with retention rules that can key on error status or latency after the fact.
- If a trace is missing in your backend, it is very likely a sampling drop, not a broken pipeline — recover the id from the `X-Trace-Id` response header on the original request rather than assuming instrumentation is broken.

---

## ActivitySources (distributed tracing)

Registered on the shared `TracerProvider` in `ObservabilityExtensions`, defined in [`ArchLucid.Core/Diagnostics/ArchLucidActivitySources.cs`](../../ArchLucid.Core/Diagnostics/ArchLucidActivitySources.cs):

| Source | Domain |
| --- | --- |
| `AdvisoryScan` | Cloud inventory / advisory scan pipeline |
| `AuthorityRun` | End-to-end authority pipeline run — kept at full sampling fidelity by default |
| `RetrievalIndex` | RAG corpus indexing |
| `AgentHandler` / `AgentExecution` | Agent dispatch and handler execution |
| `AgentLlmCompletion` / `AgentLlmEmbedding` | LLM completion and embedding calls — carry `gen_ai.*` semantic-convention tags (token tallies, latency; prompts/completions omitted by default for PII) |
| `RetrievalIndexingOutbox`, `IntegrationEventOutbox` | Durable outbox processors |
| `DataArchival` | Cold-storage archival jobs |
| `EvidenceZipExpansion` | Evidence package ingest/expansion |
| `AzureExtractorUpload`, `CloudInventoryExtractorUpload` | Extractor package upload paths |

Plus built-in ASP.NET Core, `HttpClient`, and SqlClient instrumentation (`AddArchLucidSqlClientInstrumentation`, `RecordException = true`). New instrumentation must register its source in `AddArchLucidOpenTelemetry` per ADR 0053 §5.

---

## Metric catalog

All custom metrics live on one meter, `ArchLucidInstrumentation.MeterName` (`"ArchLucid"`), defined in [`ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs`](../../ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs) — treat that file as the exhaustive source of truth; the table below is a map by domain, not a full enumeration.

| Domain | Representative metrics |
| --- | --- |
| **Authority pipeline / runs** | `archlucid_runs_created_total`, `archlucid_authority_runs_completed_total`, `archlucid_orchestrator_transition_total`, `archlucid_authority_pipeline_timeouts_total`, `archlucid_authority_pipeline_stage_duration_ms` (histogram, labels `stage`/`outcome`), `archlucid_authority_pipeline_work_pending`, `archlucid_authority_pipeline_work_oldest_pending_age_seconds`, `archlucid_authority_pipeline_work_dead_letter`, **`archlucid_runs_stale_in_flight_count`** / **`archlucid_runs_stale_in_flight_oldest_age_seconds`** (fleet-wide TB-958 gauges — **no** `tenant_id` label; triage via logs) |
| **Findings / quality** | `archlucid_findings_produced_total` (label `severity`), `archlucid_finding_engine_failures_total`, `archlucid_findings_engine_partial_failure_total`, `archlucid_explainability_trace_completeness_ratio`, `archlucid_explanation_faithfulness_ratio`, `archlucid_retrieval_faithfulness_ratio`, `archlucid_explanation_cache_hits_total`/`_misses_total`, `archlucid_hot_path_read_cache_inflight_deduped_total` (TB-2160 concurrent miss coalescing) |
| **LLM / RAG** | `archlucid_llm_prompt_tokens_total`, `archlucid_llm_completion_tokens_total`, `archlucid_llm_cached_prompt_tokens_total`, `archlucid_llm_prompt_cache_hit_ratio` (cached prompt tokens ÷ total prompt tokens — Azure automatic prefix cache, not app completion cache), `archlucid_llm_calls_per_run`, `archlucid_llm_cache_hits_total`/`_misses_total`, `archlucid_llm_quota_exceeded_total`, `archlucid_llm_call_retries_total`, `archlucid_llm_rate_limit_total`, `archlucid_rag_retrieval_duration_ms`, `archlucid_rag_chunks_retrieved_total`, `archlucid_rag_retrieval_fallback_total` |
| **Outboxes (durable)** | `archlucid_retrieval_indexing_outbox_oldest_pending_age_seconds`, `archlucid_integration_event_delivery_success_total`/`_failed_total`, `archlucid_integration_event_dlq_permanent_failure_total`, `archlucid_run_export_blob_push_outbox_*` (`processed_success_total`, `retry_scheduled_total`, `dead_lettered_total`), `archlucid_post_commit_projection_outbox_*` |
| **Resilience** | `archlucid_circuit_breaker_state_transitions_total`, `archlucid_circuit_breaker_rejections_total`, `archlucid_circuit_breaker_probe_outcomes_total` |
| **Data consistency** | `archlucid_data_consistency_orphans_detected_total`, `archlucid_data_consistency_alerts_total`, `archlucid_data_consistency_orphans_quarantined_total`, `archlucid_data_consistency_header_repoints_detected_total` (label `pointer`) — see [`DATA_CONSISTENCY_ENFORCEMENT.md`](../data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md) |
| **Required audit trail (INV-003 / TB-955)** | `archlucid_required_audit_write_abandons_total` (LogOrThrow abandon only; label `event_type`), `archlucid_required_audit_trail_orphans_detected_total` / `_orphan_alerts_total` (label `domain`) — pageable alerts `ArchLucidRequiredAuditWriteAbandon` / `ArchLucidRequiredAuditTrailOrphans`; triage [`REQUIRED_AUDIT_TRAIL_ORPHAN_TRIAGE.md`](../runbooks/REQUIRED_AUDIT_TRAIL_ORPHAN_TRIAGE.md). Informational `TryLogAsync` soft-fail stays on `archlucid_audit_write_failures_total` only. |
| **SQL / query performance** | `archlucid_query_p95_ms` (histogram, label `query_name`) via `RecordNamedQueryLatencyMilliseconds` — see **Named-query SQL latency gate** below |
| **Business / GTM** | `archlucid_tenant_estimated_savings_usd` (gauge, label `scope`), `archlucid_trial_signups_total`, `archlucid_trial_conversion_total`, `archlucid_trial_first_run_seconds`, `archlucid_tenant_time_to_first_commit_seconds`, `archlucid_pricing_quote_request_age_hours` (label `breach_status`), **`archlucid.pilot.wizard_to_committed_minutes`** (histogram, tags `execution_mode` / `preset_used` — legacy dotted name; wizard submit → first finalize) |
| **Startup / config safety** | `archlucid_startup_config_warnings_total` (label `rule_name`) — e.g. `retrieval_telemetry_per_tenant_tags_production_like` when the per-tenant tag circuit breaker suppresses high-cardinality labels |

**SQL connection pool:** a separate meter, `ArchLucid.SqlPool`, is populated from `Microsoft.Data.SqlClient.EventSource` EventCounters by `SqlConnectionPoolMetricsHostedService` / `SqlClientPoolEventCounterListener` — not part of the `ArchLucid` meter.

**Naming convention (ADR 0053 §6):** metric names use snake_case with an `archlucid_` prefix — `archlucid_{noun}_{unit}_total` for counters, `_ms` histograms for durations. A handful of legacy names use dotted form (`archlucid.webhook.deliveries`, `archlucid.rerank.latency_ms`) predating the convention; prefer the underscore form for new metrics.

**Cardinality discipline:** tenant/workspace identity stays on trace tags, not metric labels, except where explicitly reviewed (e.g. per-tenant LLM token counters gated by `LlmTelemetry:RecordPerTenantTokens`). `RetrievalTelemetryPerTenantTagCircuitBreaker` auto-suppresses per-tenant retrieval tags on production-like hosts above a tenant-count threshold and increments `archlucid_startup_config_warnings_total` when it does.

**TB-958 cardinality budget (stuck runs):** `archlucid_runs_stale_in_flight_*` are **single fleet series** only. Never add unbounded `tenant_id` labels to those gauges. When count &gt; 0, `StaleInFlightRunMetricsHostedService` logs up to five oldest samples with `TenantId` / `RunId` for triage. P0 alert: `ArchLucidStaleInFlightRunsTf` → critical action group. Runbook: [`STALE_IN_FLIGHT_RUNS.md`](../runbooks/STALE_IN_FLIGHT_RUNS.md).

**TB-961 worker drain (SIGTERM / scale-in):** `archlucid_worker_drain_started_total`, `archlucid_worker_drain_forced_kill_total`, histogram `archlucid_worker_drain_lease_release_duration_ms`. Drain gate blocks new execute ownership leases on `ApplicationStopping`; `RunExecuteOwnershipShutdownReleaseHostedService` releases held leases. Contract: [`ACA_WORKER_LLM_FAILURE_SEMANTICS.md`](../operations/ACA_WORKER_LLM_FAILURE_SEMANTICS.md), claim map [`WORKER_ROLLING_DEPLOY_DRAIN_HANDOFF_CLAIM_MAP.md`](WORKER_ROLLING_DEPLOY_DRAIN_HANDOFF_CLAIM_MAP.md).

---

## Named-query SQL latency gate (TB-003)

- **Metric:** `archlucid_query_p95_ms` (label `query_name`) via `ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds`.
- **Allowlist:** [`tests/performance/query-allowlist.json`](../../tests/performance/query-allowlist.json) — each row defines a stable `name` (must match a `NamedQueryTelemetryNames` constant value) and `p95ThresholdMs`.
- **CI gate:** `scripts/ci/assert_query_performance.py` — `--dry-run` (used on every PR today; synthesizes measurements at 50% of threshold, verifies the allowlist parses) or `--measurements-json path` for a production-style gate that fails on missing/over-threshold queries.
- **Adding a monitored query:** add a constant to `NamedQueryTelemetryNames`, wrap the SQL path in `try`/`finally` with a `Stopwatch` calling `RecordNamedQueryLatencyMilliseconds` (see `SqlRunRepository`, `DapperAuditRepository`), add a matching allowlist row justified by staging/load-test evidence, then run the dry-run script and `NamedQueryTelemetryAllowlistAlignmentTests`.

Full detail: [`tests/performance/README.md`](../../tests/performance/README.md).

---

## Structured logging and Do Not Log policy

- **Serilog** enrichers add `CorrelationId`, OpenTelemetry `TraceId`/`SpanId`, and app/version fields ([`ArchLucidSerilogConfiguration.cs`](../../ArchLucid.Host.Core/Startup/ArchLucidSerilogConfiguration.cs)). `UseSerilogRequestLogging` logs the request path without query string.
- **Canonical structured event names (TB-332):** [`ArchLucid.Core/Diagnostics/DiagnosticEventNames.cs`](../../ArchLucid.Core/Diagnostics/DiagnosticEventNames.cs) — lowercase dot-separated lifecycle verbs (`review.created`, `evidence.ingest.failed`, `ai.budget.exceeded`, `export.succeeded`, `failure.dependency`, …) per ADR 0053 §6.
- **Do Not Log policy (TB-330):** [`ArchLucid.Core/Diagnostics/LoggingPolicy.cs`](../../ArchLucid.Core/Diagnostics/LoggingPolicy.cs) is the authoritative reference for PR review — categories that must never appear in unstructured logs, span tags, or metric labels (secrets, connection strings, bearer tokens, raw customer evidence, full LLM prompts/responses, embedding vectors, PII outside explicit audit paths). Enforcement lives in `LogSanitizer`, `PromptRedactor`, and support-bundle redaction helpers. `LlmTelemetry:CapturePromptResponseOnSpans` stays `false` in production-like configuration.
- **Log injection (CWE-117):** any user-derived `string` logged as a structured parameter must pass through `LogSanitizer.Sanitize()` first — see [`SECURE_LOGGING.md`](contributor-reference/SECURE_LOGGING.md).
- **Job telemetry:** `ArchLucid.Jobs.Cli` emits `JobStarted`/`JobCompleted`/`JobFailed` with `DurationMs` via [`JobRunTelemetry.cs`](../../ArchLucid.Host.Core/Jobs/JobRunTelemetry.cs).

---

## Health checks

- `/health/live`, `/health/ready` (summary), and `/health` (detailed, authenticated) are wired in `ArchLucid.Api/Startup/PipelineExtensions.cs`.
- The detailed payload includes `totalDurationMs` and a per-entry `durationMs`/`status`/`description` ([`DetailedHealthCheckResponseWriter.cs`](../../ArchLucid.Host.Core/Health/DetailedHealthCheckResponseWriter.cs)) — useful for triage, but these are **not** the primary latency SLI; HTTP OTel metrics and the SLO Prometheus rules are.
- Container Apps liveness/readiness probes point at these endpoints ([`infra/terraform-container-apps/`](../../infra/terraform-container-apps/)); the dependency matrix is in [`HEALTH_LIVE_READY_DEPENDENCY_MATRIX.md`](../operations/HEALTH_LIVE_READY_DEPENDENCY_MATRIX.md).
- An external synthetic probe hits `/health/live` and `/version` on a schedule — see [`API_SLOS.md`](API_SLOS.md).

---

## Frontend (Next.js) telemetry

- **App Insights Web** (`@microsoft/applicationinsights-web`) loads lazily and idle-deferred via [`AppInsightsTelemetryInit.tsx`](../../archlucid-ui/src/components/AppInsightsTelemetryInit.tsx) / [`app-insights-init-scheduler.ts`](../../archlucid-ui/src/lib/telemetry/app-insights-init-scheduler.ts), configured by `NEXT_PUBLIC_APPINSIGHTS_CONNECTION_STRING`, with automatic route tracking.
- **Web Vitals (TB-692):** [`web-vitals-reporter.ts`](../../archlucid-ui/src/lib/telemetry/web-vitals-reporter.ts) reports LCP/CLS/INP/TTFB/FCP to App Insights as a `WebVitalsMetric` event (`route`, `tenantTier`, `navigationType`, `effectiveConnectionType`, `sampleRate`). Default sample rate is **0.25** (session-stable); override with `NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE` (`0`–`1`). Field triage before the next bundle cut: [`FIELD_WEB_VITALS_TRIAGE.md`](../runbooks/FIELD_WEB_VITALS_TRIAGE.md) (**TB-2031**).
- **Client runtime diagnostics:** [`client-runtime-diagnostics.ts`](../../archlucid-ui/src/lib/client-runtime-diagnostics.ts) watches for main-thread stalls, long tasks, and stuck navigation and surfaces an in-app banner — this signal is not exported to App Insights by default.
- **Microsoft Clarity:** consent-gated, marketing/funnel pages only ([`MicrosoftClarityLoader.tsx`](../../archlucid-ui/src/components/MicrosoftClarityLoader.tsx)) — not full operator RUM.
- **Bundle/CWV budgets in CI:** [`performance/first-load-js-baseline.v1.json`](../../archlucid-ui/performance/first-load-js-baseline.v1.json) (`npm run check:first-load-js`) and [`performance/lighthouse-acceptance-routes.v1.json`](../../archlucid-ui/performance/lighthouse-acceptance-routes.v1.json).
- **Server / BFF timing:** [`src/instrumentation.ts`](../../archlucid-ui/src/instrumentation.ts) registers the Next.js instrumentation hook (`onRequestError` structured logs). The API proxy (`/api/proxy/*`) attaches **`Server-Timing: proxy;dur=…`** and logs slow/failed requests (`ARCHLUCID_UI_PROXY_SLOW_MS`, default 1000) via [`server-request-timing.ts`](../../archlucid-ui/src/lib/telemetry/server-request-timing.ts). Paths are cardinality-normalized. Full RSC middleware timing is still not instrumented.

---

## Authority pipeline remediation runbook

Operator triage for authority pipeline backlog, stale outbox rows, and data-consistency drift, paired with the **"ArchLucid — Authority pipeline"** Grafana dashboard ([`infra/grafana/dashboard-archlucid-authority.json`](../../infra/grafana/dashboard-archlucid-authority.json)) and Prometheus rules in [`infra/prometheus/archlucid-alerts.yml`](../../infra/prometheus/archlucid-alerts.yml).

| Symptom (panel / metric) | Likely cause | First response |
| --- | --- | --- |
| `archlucid_authority_pipeline_work_pending` elevated (gauge) | Worker under-provisioned or a stage is stalling | Check `archlucid_authority_pipeline_stage_duration_ms` p95 by `stage`/`outcome` for the slow stage; scale the worker role — see [`SCALE_THRESHOLD_RUNBOOK.md`](SCALE_THRESHOLD_RUNBOOK.md) |
| `archlucid_authority_pipeline_work_oldest_pending_age_seconds` climbing | Backlog is aging, not just deep | Confirm the elected worker host is actually processing (host role / lease); check for a poisoned message blocking the queue head |
| `archlucid_authority_pipeline_work_dead_letter` ≥ 1 (Prometheus `ArchLucidAuthorityPipelineWorkDeadLetters` fires after 30m) | Poison message repeatedly failing the pipeline | Inspect `AuthorityPipelineWorkOutbox` row via admin diagnostics; fix the payload/handler bug before manual retry; do not blind-retry a payload defect |
| `archlucid_authority_pipeline_stage_duration_ms` p95 dominated by `findings` or `artifacts` stage | CPU contention between API and worker roles on a shared process | Split worker role so outbox processing does not steal API interactive CPU |
| `archlucid_data_consistency_orphans_detected_total` rising without matching `_alerts_total` | `DataConsistency:Enforcement:Mode=Warn` (detection-only) | Expected in `Warn`; escalate to `Alert` mode only after operator runbook sign-off — see [`DATA_CONSISTENCY_ENFORCEMENT.md`](../data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md) |
| `archlucid_data_consistency_alerts_total` rising | Orphan count met `AlertThreshold` in `Alert`/`Quarantine` mode | Page on-call per [`DATA_CONSISTENCY_ENFORCEMENT.md`](../runbooks/DATA_CONSISTENCY_ENFORCEMENT.md) (operator quick-reference); do not treat quarantine rows as deletion — they are evidence + staging |
| `archlucid_required_audit_write_abandons_total` / `_orphan_alerts_total` rising | Required fail-closed audit abandon or domain↔audit orphan after grace | Page per [`REQUIRED_AUDIT_TRAIL_ORPHAN_TRIAGE.md`](../runbooks/REQUIRED_AUDIT_TRAIL_ORPHAN_TRIAGE.md); do not page informational `TryLogAsync` soft-fail |
| Authority run throughput (`archlucid_authority_runs_completed_total`) flat while pending backlog grows | Runs stuck mid-pipeline rather than not starting | Trace a representative stuck run via [`TRACE_A_RUN.md`](../runbooks/TRACE_A_RUN.md) to find the stalled stage/span |

**Related outbox remediation runbooks:** [`RUN_EXPORT_BLOB_PUSH_OUTBOX_OBSERVABILITY.md`](../runbooks/RUN_EXPORT_BLOB_PUSH_OUTBOX_OBSERVABILITY.md), [`INTEGRATION_EVENT_DLQ_RETRY_POLICY.md`](../runbooks/INTEGRATION_EVENT_DLQ_RETRY_POLICY.md), [`PROVENANCE_INDEXING.md`](../runbooks/PROVENANCE_INDEXING.md).

---

## Solo-operator synthetics and stuck-run paging

| Signal | Backlog | Doc |
| --- | --- | --- |
| Fleet-wide stale in-flight runs → critical AG | **TB-958** | [`STALE_IN_FLIGHT_RUNS.md`](../runbooks/STALE_IN_FLIGHT_RUNS.md) |
| Create → execute → commit canary → PagerDuty / critical webhook | **TB-959** | [`REVIEW_PATH_CANARY.md`](../runbooks/REVIEW_PATH_CANARY.md) |
| MVO enablement checklist | **TB-957** | [`SOLO_OPERATOR_MVO_OBSERVABILITY.md`](../operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md) |

---

## Related documents

| Doc | Use |
| --- | --- |
| [ADR 0053](../architecture/adrs/0053-enterprise-diagnostic-logging-observability-posture.md) | Normative decision record for this doc |
| [`TELEMETRY_ANALYSIS_AND_IMPROVEMENT.md`](../runbooks/TELEMETRY_ANALYSIS_AND_IMPROVEMENT.md) | Owner loop: catch → correlate → fix → verify from telemetry |
| [`TRACE_A_RUN.md`](../runbooks/TRACE_A_RUN.md) | Worked example correlating audit, traces, and logs for one run |
| [`STALE_IN_FLIGHT_RUNS.md`](../runbooks/STALE_IN_FLIGHT_RUNS.md) | TB-958 P0 triage (fleet gauges + log samples) |
| [`REVIEW_PATH_CANARY.md`](../runbooks/REVIEW_PATH_CANARY.md) | TB-959 create→execute→commit canary |
| [`BACKGROUND_JOB_CORRELATION.md`](BACKGROUND_JOB_CORRELATION.md) | Synthetic correlation ids for workers/outboxes |
| [`SLO_PROMETHEUS_GRAFANA.md`](../runbooks/SLO_PROMETHEUS_GRAFANA.md) | SLO recording rules and burn-rate alerts |
| [`OBSERVABILITY_DASHBOARD_BINDING.md`](../runbooks/OBSERVABILITY_DASHBOARD_BINDING.md) | Importing Grafana dashboards and binding datasources |
| [`SCALE_THRESHOLD_RUNBOOK.md`](SCALE_THRESHOLD_RUNBOOK.md) | When metrics/latency signals justify enabling Redis, replicas, or worker split |
| [`API_SLOS.md`](API_SLOS.md) | Customer-facing HTTP SLOs and synthetic probe |
| [`API_PERFORMANCE_TARGETS.md`](API_PERFORMANCE_TARGETS.md) | Per-endpoint latency targets |
| [`PERFORMANCE.md`](PERFORMANCE.md) | Caching and hot-path behavior |
| [`DEGRADED_MODE.md`](DEGRADED_MODE.md) | Behavior when dependencies are unhealthy |
| [`SECURE_LOGGING.md`](contributor-reference/SECURE_LOGGING.md) | Log injection mitigation |
| [`TECH_BACKLOG.md`](TECH_BACKLOG.md) | TB-003, TB-329–TB-336, TB-692, TB-2031, TB-958, TB-959 |
| [`infra/terraform-monitoring/README.md`](../../infra/terraform-monitoring/README.md) | Terraform-managed alerting/Grafana flags |
| [`infra/terraform-otel-collector/README.md`](../../infra/terraform-otel-collector/README.md) | Tail-sampling collector |
