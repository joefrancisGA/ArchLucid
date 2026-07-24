> **Scope:** Contributor-reference — Observability — metrics and tracing (ArchLucid) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Observability — metrics and tracing (ArchLucid)

**Audience:** SRE, platform engineers, and developers wiring Prometheus/Grafana, Application Insights, or OTLP exporters.

**Architectural decision:** Near-perfect diagnostic logging for V1 enterprise supportability is mandated by **[ADR 0053](../architecture/adrs/0053-enterprise-diagnostic-logging-observability-posture.md)**. Enforcement backlog: **TB-329–TB-336** in [`TECH_BACKLOG.md`](TECH_BACKLOG.md).

**Scope:** This doc lists **stable** custom instrumentation names owned in **`ArchLucid.Core.Diagnostics.ArchLucidInstrumentation`**. It is not an exhaustive inventory of ASP.NET Core, HTTP client, or SQL client auto-instrumentation.

**Solo-operator MVO (P0 page path):** catalog presence ≠ enabled paging. Founder enablement checklist, six critical PromQL rules, AMW scrape verify script, and Portal Test drill: [`SOLO_OPERATOR_MVO_OBSERVABILITY.md`](../operations/SOLO_OPERATOR_MVO_OBSERVABILITY.md) (**TB-957**). Owner drill cadence: GTM **M-120**.

---

## Export path configuration (OpenTelemetry)

Registration lives in **`ArchLucid.Host.Core`** → **`ObservabilityExtensions.AddArchLucidOpenTelemetry`**. Custom metrics (including **`archlucid_agent_output_*`**) only reach **Application Insights**, a **collector**, or **Prometheus** after you configure **at least one** export path:

| Mechanism | What to set |
|-----------|-------------|
| **Azure Monitor / Application Insights** | **`APPLICATIONINSIGHTS_CONNECTION_STRING`** (environment — typical on Azure), or **`ApplicationInsights:ConnectionString`**, or **`Observability:AzureMonitor:ApplicationInsightsConnectionString`**. Enables **`AddAzureMonitorMetricExporter`** and trace exporter. |
| **OTLP** | Non-empty **`Observability:Otlp:Endpoint`** (absolute URI). Optional: **`Observability:Otlp:Protocol`** (`Grpc` default, or `HttpProtobuf`), **`Observability:Otlp:Headers`** (auth), **`Observability:Otlp:Enabled`** `false` to kill-switch. Empty endpoint ⇒ OTLP off. |
| **Prometheus scrape** | **`Observability:Prometheus:Enabled`** `true`; **`Observability:Prometheus:ScrapePath`** (default **`/metrics`**). When **`RequireScrapeAuthentication`** is true, set **`ScrapeUsername`** and **`ScrapePassword`**. Expose scrape URL only on trusted networks or private link. |
| **Console** (local) | **`Observability:ConsoleExporter:Enabled`** — defaults **on** in **Development** only. |

If **none** of the above are active (typical bare **local** `dotnet run` without env vars), custom metrics exist **in-process only** until you add an exporter.

**Health-check trace suppression:** ASP.NET Core trace instrumentation filters out requests under **`/health`** (all sub-paths, e.g. **`/health/live`**, **`/health/ready`**) so recurring liveness/readiness polling — container orchestrator probes, the local **`Dockerfile HEALTHCHECK`** — never reaches the console, OTLP, or Azure Monitor trace exporters. See **`ObservabilityExtensions.IsHealthCheckRequest`**.

**Live vs ready dependency matrix (which check blocks traffic safety, ACA vs CD):** [`docs/operations/HEALTH_LIVE_READY_DEPENDENCY_MATRIX.md`](../operations/HEALTH_LIVE_READY_DEPENDENCY_MATRIX.md). UI process probe: **`GET /api/health`** (Next.js; not under `/health`).

**Repo-local readiness report (no Azure login, no network):** merge committed appsettings the same way the **Api** host does (`appsettings.json` → `appsettings.{Environment}.json` → `appsettings.Advanced.json` → `appsettings.SaaS.json`) and the **Worker** host does (`appsettings.json` → `appsettings.{Environment}.json`), then optionally overlay **process environment** keys (values are never printed). Warns with exact configuration keys when no Application Insights connection string, OTLP endpoint, or Prometheus scrape is active.

```bash
# Observability export readiness (repo-local) — regenerate:
python scripts/report_observability_export_readiness.py --environment Production --out artifacts/observability-export-readiness.md
# Release bundle (Production + Staging reports + preflight index):
pwsh ./scripts/Emit-ReleaseReadinessEvidence.ps1
# Strict gate when RequireTelemetryExport is enabled in merged Production JSON:
python scripts/report_observability_export_readiness.py --environment Production --honor-require-telemetry-export-config --strict-exit-code
```

`appsettings.Advanced.json` can override environment-specific `Observability` (for example it ships `Observability:Prometheus:Enabled` **false**), so the JSON-only report may show **no** durable exporter until deployment sets `APPLICATIONINSIGHTS_CONNECTION_STRING`, `Observability__Otlp__Endpoint`, or flips Prometheus via env. That matches runtime layering in **`ArchLucid.Api/Program.cs`**.

### Production warn vs fail (host startup)

| Layer | Behavior | When |
| --- | --- | --- |
| **Repo report** (`report_observability_export_readiness.py`) | **WARN** by default when merged Api/Worker JSON (and optional env overlay) show no exporter; **FAIL** with `--strict-exit-code` | Release checklist / CI artifact — no host boot required |
| **OTLP/Prometheus shape** | **FAIL** startup when enabled keys are inconsistent (for example OTLP enabled without endpoint) | `ObservabilityRules` in `ArchLucidConfigurationRules` |
| **`ProductionValidation:RequireTelemetryExport=true`** | **FAIL** startup on production-profile hosts when no Application Insights connection string, active OTLP endpoint, or Prometheus scrape is configured | `ProductionDangerousMisconfigurationLint` → `ArchLucidConfigurationRules.CollectErrors` (Api **and** Worker) |
| **Advisory only** | Missing export on non-production hosts, or when `RequireTelemetryExport` is **false** | Logged via `archlucid_startup_config_warnings_total` when other production-profile advisories fire — not a silent blind spot |

Dry-run the fail-fast rules locally: `archlucid config lint --simulate-production --hosting-advisor` (see [`DEPLOYMENT_RUNBOOK.md`](DEPLOYMENT_RUNBOOK.md)).

**Post-deploy smoke (agent-output metrics):** run one successful **`POST` … `/execute`**, then confirm the backend lists **`archlucid_agent_output_structural_completeness_ratio`**, **`archlucid_agent_output_semantic_score`**, **`archlucid_agent_output_quality_gate_total`**, **`archlucid_agent_output_parse_failures_total`**, and **`archlucid_agent_trace_blob_upload_failures_total`** (see generated report and **`docs/library/TECH_BACKLOG.md`** TB-004).

### Agent-output quality alerts (Prometheus / Grafana)

Example **Prometheus** alert rules (tune thresholds and `for` windows per environment) live in **`infra/prometheus/archlucid-alerts.yml`**, group **`archlucid-agent-output-quality`**:

| Alert (name) | Intent |
|----------------|--------|
| `ArchLucidAgentOutputQualityGateRejected` | Non-zero rate of **`outcome="rejected"`** on **`archlucid_agent_output_quality_gate_total`**. |
| `ArchLucidAgentOutputSemanticScoreP10Low` | **`histogram_quantile(0.1, …)`** on **`archlucid_agent_output_semantic_score_bucket`** below baseline. Interprets the same **heuristic / optional-judge** signal as the histogram description — not embedding similarity. |
| `ArchLucidAgentOutputSemanticScoreP50Low` | Median of the same signal below baseline (see above). |
| `ArchLucidAgentOutputLlmFaithfulnessScoreP50Low` | **`histogram_quantile(0.5, …)`** on **`archlucid_agent_output_llm_faithfulness_score_bucket`** below **0.5** (hosted Staging/Production default **`LlmFaithfulness:Enabled=true`**). |
| `ArchLucidAgentOutputParseFailures` | **`archlucid_agent_output_parse_failures_total`** rate above zero. |
| `ArchLucidAgentTraceBlobUploadFailures` | **`archlucid_agent_trace_blob_upload_failures_total`** rate above zero. |

**Grafana:** create panels from the same histogram (`heatmap` / **percentiles** by **`agent_type`**) and wire dashboards to your managed Prometheus or Mimir workspace.

**Azure Monitor (Terraform — Improvement #22 / TB-004):** when **`enable_prometheus_slo_rule_group`** and **`azure_monitor_workspace_id`** are set on **`infra/terraform-monitoring`**, **`prometheus_agent_output_rules.tf`** deploys **`azurerm_monitor_alert_prometheus_rule_group.archlucid_agent_output`** with the same PromQL as the table above (plus LLM faithfulness **p50**). Alerts route to **`azurerm_monitor_action_group.ops`** (email / webhook). **Staging verification:** `terraform apply` the monitoring stack, run one successful **`POST …/execute`**, confirm series in the workspace, then fire a test notification from the Azure Portal (**Monitor → Alerts → select rule → Test**). Output: **`prometheus_agent_output_rule_group_id`**.

**Self-hosted Prometheus only:** if you ingest via scrape rather than managed Prometheus, translate PromQL using workspace query tools — do not treat scrape endpoints as public; keep **`Observability:Prometheus:RequireScrapeAuthentication`** on for any edge-adjacent deployment (see export table above).

Optional Azure **OpenTelemetry Collector** (tail sampling): **`infra/terraform-otel-collector/README.md`**.

---

## Meter

| Name | Version | Registration |
|------|---------|----------------|
| **`ArchLucid`** | `1.0.0` | `AddMeter(ArchLucidInstrumentation.MeterName)` in `ObservabilityExtensions.AddArchLucidOpenTelemetry` |

---

## Histograms and counters (selected)

| Instrument | Type | Unit | Labels / notes |
|------------|------|------|----------------|
| **`archlucid_authority_pipeline_stage_duration_ms`** | Histogram | `ms` | **`stage`**: `context_ingestion`, `graph`, `findings`, `decisioning`, `artifacts`. **`outcome`**: `success`, `error`. Wall time per stage in **`AuthorityPipelineStagesExecutor`**. |
| **`archlucid_authority_runs_completed_total`** | Counter | — | Authority runs completed through finalization. |
| **`archlucid_authority_pipeline_work_pending`** | Observable gauge | — | Outbox depth (see `EnsureOutboxDepthObservableGaugesRegistered`). |
| **`archlucid_run_export_blob_push_outbox_pending`** | Observable gauge | — | Actionable **`dbo.RunExportBlobPushOutbox`** rows (excludes dead letters, leases, backoff). |
| **`archlucid_run_export_blob_push_outbox_oldest_pending_age_seconds`** | Observable gauge | `s` | Oldest actionable run-export outbox row age. |
| **`archlucid_run_export_blob_push_outbox_dead_letter`** | Observable gauge | — | Run-export outbox dead-letter depth. |
| **`archlucid_run_export_blob_push_outbox_processed_success_total`** | Counter | — | Rows marked processed by **`RunExportBlobPushOutboxProcessor`**. |
| **`archlucid_run_export_blob_push_outbox_retry_scheduled_total`** | Counter | — | Transient failures that recorded backoff. |
| **`archlucid_run_export_blob_push_outbox_dead_lettered_total`** | Counter | — | Rows dead-lettered during processing. |
| **`archlucid_alert_evaluation_duration_ms`** | Histogram | `ms` | Alert evaluation. |
| **`archlucid_governance_resolve_duration_ms`** | Histogram | `ms` | Effective governance resolution. |
| **`archlucid_explainability_trace_completeness_ratio`** | Histogram | — | Advisory scan trace completeness. |
| **`archlucid_explanation_faithfulness_ratio`** | Histogram | — | Heuristic overlap of aggregate explanation tokens vs finding **`ExplainabilityTrace`** text (**`ExplanationFaithfulnessChecker`** on **`RunExplanationSummaryService`**). |
| **`archlucid_circuit_breaker_*`** | Counter | — | State transitions, rejections, probe outcomes. |
| **`archlucid_llm_*`** | Counter | — | Token usage, retries (see `ArchLucidInstrumentation` source). |
| **`archlucid_rag_retrieval_duration_ms`** | Histogram | `ms` | **`corpus_kind`**. Optional **`tenant_id`** when **`RetrievalTelemetry:RecordPerTenantTags`** is **true** (default **false** — aggregate only; enable only for bounded tenant counts). |
| **`archlucid_rag_chunks_retrieved_total`** | Counter | — | **`corpus_kind`**. Optional **`tenant_id`** under the same **`RetrievalTelemetry:RecordPerTenantTags`** gate. |
| **`archlucid_tenant_estimated_savings_usd`** | Observable gauge | **`USD`** | **`scope`**: `platform` (default aggregate) or `tenant`. **`tenant_id`**: present only when `scope=tenant` and **`ExecutiveRoi:SavingsGauge:RecordPerTenantSavings`** is **true** (default **false** — platform aggregate only). Refreshed by leader-elected **`ExecutiveRoiSavingsGaugeHostedService`** using the same **`IExecutiveRoiSummaryService`** rollup as the Executive ROI API (cross-run dedup per §2.8). Each tenant refresh runs under **`ExecutiveRoiBackgroundTenantRollup`** with fail-closed scope validation. Interval: **`ExecutiveRoi:SavingsGauge:RefreshIntervalMinutes`** (default **15**). |
| **`archlucid_executive_roi_background_scope_violations_total`** | Counter | **`reason`** | Incremented when **`ExecutiveRoiBackgroundScopeGuard`** rejects a tenant scope during cache warmup or savings-gauge refresh (`tenant_id_empty`, `workspace_id_empty`, `project_id_empty`, `dev_default_scope_triple`). Should remain **zero** in production; investigate any sustained increase before scaling tenant count. |
| **`archlucid_llm_prompt_redactions_total`** | Counter | **`category`** | Deny-list replacements applied on the **LLM accounting** path before the model call. |
| **`archlucid_llm_prompt_redaction_skipped_total`** | Counter | — | Model calls observed while **`LlmPromptRedaction:Enabled`** is **false** (audit deliberate bypass). |
| **`archlucid_first_session_completed_total`** | Counter | — | Once per tenant on first successful golden-manifest commit (Core Pilot funnel; SQL **`TenantOnboardingState`**). |
| **`archlucid.pilot.wizard_to_committed_minutes`** | Histogram | `min` | **`execution_mode`**, **`preset_used`**. Wall-clock minutes from wizard run creation to first committed manifest when **`requestSource=wizard`** (TB-220). |
| **`archlucid_operator_task_success_total`** | Counter | `task` (`first_run_committed` \| `first_session_completed`) | Server-side onboarding milestones: first golden-manifest commit per tenant (`SqlFirstSessionLifecycleHook`) and successful self-service registration completion (`RegistrationController` **201**). Process-life in default Prometheus scrape; operator UI tile reads **`GET /v1/diagnostics/operator-task-success-rates`** (in-process listener snapshot — resets on API host restart). |
| **`archlucid_email_otp_challenge_requested_total`** | Counter | **`result`** (`accepted` \| `rate_limited` \| `sso_required` \| `disabled` \| `invalid_email` \| `bot_challenge_failed`) | Passwordless sign-in challenge requests (`EmailOtpAuthService`). Alerts: **`infra/prometheus/archlucid-alerts.yml`**; runbook: **`docs/runbooks/EMAIL_OTP_DELIVERY_AND_ABUSE.md`**. |
| **`archlucid_email_otp_challenge_verified_total`** | Counter | **`result`** (`success` \| `invalid` \| `expired` \| `rate_limited` \| `sso_required`) | Email OTP verify outcomes. |
| **`archlucid_email_otp_delivery_failed_total`** | Counter | — | Outbound sign-in code delivery failures. |
| **`archlucid_email_otp_rate_limit_triggered_total`** | Counter | **`scope`** | Email/IP hourly OTP rate limits. |
| **`archlucid_self_service_trial_abuse_denied_total`** | Counter | **`reason`** | Self-service trial/workspace abuse policy denials (`SelfServiceTrialAbusePolicy`). |
| **`archlucid_agent_output_structural_completeness_ratio`** | Histogram | — | **`agent_type`**: Topology, Cost, Compliance, Critic. Fraction of expected **`AgentResult`** JSON keys present on **`ParsedResultJson`** (see **`AgentOutputEvaluationRecorder`**). |
| **`archlucid_agent_output_parse_failures_total`** | Counter | — | **`agent_type`**. **`ParsedResultJson`** is not a JSON object or failed JSON parse when re-checked for metrics. |
| **`archlucid_agent_trace_blob_upload_failures_total`** | Counter | — | **`agent_type`**, **`blob_type`** (`system_prompt`, `user_prompt`, `response`). Incremented when a blob write exhausts all retry attempts. |
| **`archlucid_agent_trace_prompt_inline_fallback_total`** | Counter | — | **`agent_type`**, **`blob_type`**. **Real** execution: full text written to SQL **`Full*Inline`** when the blob key for that part is missing (see **`docs/AGENT_TRACE_FORENSICS.md`**). |
| **`archlucid_agent_trace_blob_persist_duration_ms`** | Histogram | — | **`agent_type`**. Wall-clock time for awaited full-prompt/blob persistence after trace row insert (includes retries; see **`AgentExecutionTraceRecorder`** and **`docs/AGENT_TRACE_FORENSICS.md`**). |
| **`archlucid_agent_output_semantic_score`** | Histogram | — | **`agent_type`**. **`OverallSemanticScore`** (0.0–1.0): **heuristic** completeness signal from persisted agent JSON (claim evidence refs, finding fields), optionally combined with an **LLM rubric** when enabled — **not** factual “truth”, **not** embedding cosine. Optional embedding alignment is **`archlucid_agent_output_embedding_faithfulness_mean_cosine`**. |
| **`archlucid_agent_output_embedding_faithfulness_mean_cosine`** | Histogram | — | **`agent_type`**. When embedding faithfulness is enabled and computed, mean cosine vs evidence mapped to **0–1** (see **`AgentResultEmbeddingFaithfulnessScorer`**). |
| **`archlucid_agent_output_quality_gate_total`** | Counter | — | **`agent_type`**, **`outcome`** (`accepted` / `warned` / `rejected`), **`gate_mode`**, **`reject_reason`** (`none` / `structural` / `semantic` / `faithfulness`), **`execution_mode`** (`simulator` / `real`). Emitted when **`ArchLucid:AgentOutput:QualityGate:Enabled`** is **true** (see **`AgentOutputEvaluationRecorder`**). |
| **`archlucid_agent_handler_degradations_total`** | Counter | — | **`agent_type_key`**, **`degradation_reason`** (`handler_timeout` / `circuit_open` / `resilience_failure`). Non-Critic handler resilience fallbacks that returned a zero-confidence placeholder (`RealAgentExecutor`). Span event: **`agent.handler.degraded`**. |
| **`archlucid_explanation_aggregate_faithfulness_fallback_total`** | Counter | — | Aggregate **`GET …/explain/runs/{runId}/aggregate`** replaced LLM narrative with deterministic manifest text after low faithfulness vs findings. |
| **`archlucid_data_consistency_orphans_detected_total`** | Counter | **`table`**, **`column`** | Rows counted by **`DataConsistencyOrphanProbeHostedService`** when **`dbo.GoldenManifests`**, **`dbo.FindingsSnapshots`**, **`dbo.ContextSnapshots`**, or **`dbo.GraphSnapshots`** reference a **`RunId`** missing from **`dbo.Runs`** (detection-only). **`dbo.ComparisonRecords`** is FK-backed and no longer probed for run orphans. |
| **`archlucid_data_consistency_alerts_total`** | Counter | **`table`**, **`column`** | Incremented when **`DataConsistency:Enforcement:Mode`** is **`Alert`** or **`Quarantine`** and orphan counts meet **`AlertThreshold`** for that slice. |
| **`archlucid_data_consistency_orphans_quarantined_total`** | Counter | **`table`**, **`column`** | Rows inserted into **`dbo.DataConsistencyQuarantine`** from the orphan probe when **`DataConsistency:Enforcement:Mode`** is **`Quarantine`** or **`AutoQuarantine`** is **true** (golden-manifest orphans only; labels mirror detection). |
| **`archlucid_explanation_citations_emitted_total`** | Counter | **`kind`** (`CitationKind` string) | Citation references attached to **`GET /v1/explain/runs/{runId}/aggregate`** for UI chips. |
| **`archlucid_startup_config_warnings_total`** | Counter | **`rule_name`** | Non-fatal startup configuration advisories: **`ProductionLikeHostingMisconfigurationAdvisor`**, **`ArchLucidLegacyConfigurationWarnings`**, **`AuthSafetyGuard`** (development bypass active), **`LlmPromptRedactionProductionWarningPostConfigure`**, **`RetrievalTelemetryProductionWarningPostConfigure`** (per-tenant RAG tags with high **`EstimatedTenantCount`** on production-like hosts), **`AgentResultSchemaValidationProductionWarningPostConfigure`** ( **`EnforceOnParse`** disabled on production-like hosts), **`RlsBypassPolicyBootstrap`**, **`ArchLucidPersistenceStartup`** (missing `ConnectionStrings:ArchLucid` when `StorageProvider=Sql`). Label values are bounded constants (**`LegacyConfigurationStartupWarningRuleNames`**, **`ProductionLikeHostingMisconfigurationAdvisorRuleNames`**, **`StartupValidationWarningRuleNames`**, TECH_BACKLOG **TB-002**). Pair with Grafana / alert rules when any increment appears on Production-class scrapes. |
| **`archlucid_query_p95_ms`** | Histogram | `ms` | **`query_name`**. TECH_BACKLOG **TB-003**: `ArchLucidInstrumentation.RecordNamedQueryLatencyMilliseconds`. Allowlist thresholds: **`tests/performance/query-allowlist.json`**; CI: **`scripts/ci/assert_query_performance.py`**; refresh process: **`tests/performance/README.md`**. |

Serilog log events also include OpenTelemetry correlation identifiers when a trace is active via `WithOpenTelemetryTraceId()` and `WithOpenTelemetrySpanId()` in host startup.

**Grafana dashboard:** committed JSON **`infra/grafana/dashboard-archlucid-authority.json`** (dashboard uid **`archlucid-authority`**) includes Prometheus panels for **`archlucid_authority_pipeline_stage_duration_ms`**, **`archlucid_authority_pipeline_work_pending`**, **`archlucid_authority_pipeline_work_oldest_pending_age_seconds`**, and **`archlucid_data_consistency_*_total`**, with thresholds described against the same alert bundle. Operator remediation: see **§ Authority pipeline remediation runbook** below and **[`docs/runbooks/OBSERVABILITY_DASHBOARD_BINDING.md`](../runbooks/OBSERVABILITY_DASHBOARD_BINDING.md)** (datasource UID import/provisioning). Former paths: [`docs/redirects.md`](../redirects.md).

For the full set, read **`ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs`**.

---

## Business-Level KPI Metrics

These instruments support **product and operator dashboards** (runs volume, findings mix, LLM batch intensity, explanation cache effectiveness). They use the same **`ArchLucid`** meter as operational metrics.

| Instrument | Type | Labels | What it measures | Suggested Grafana panel |
|------------|------|--------|------------------|-------------------------|
| **`archlucid_runs_created_total`** | Counter | — | Authority **`RunRecord`** rows inserted at orchestration start (pre-pipeline), including runs that later queue deferred work. | **Time series** — `rate()` or `increase()` over a window (e.g. runs/min). |
| **`archlucid_authority_pipeline_timeouts_total`** | Counter | — | Authority pipeline (sync or queued completion) cancelled because **`AuthorityPipeline:PipelineTimeout`** elapsed before commit. | **Time series** — alert if **`rate() > 0`** sustained; tune timeout vs. workload. |
| **`archlucid_findings_produced_total`** | Counter | **`severity`** (`FindingSeverity` enum name: `Info`, `Warning`, `Error`, `Critical`) | Findings persisted with the findings snapshot after the authority **findings** stage completes (one increment batch per severity bucket per run). | **Time series** — stacked or separate lines per `severity`, or **bar gauge** for share in window. |
| **`archlucid_llm_calls_per_run`** | Histogram (`int`, unit `{call}`) | — | Count of successful Azure OpenAI JSON completions during one **`RealAgentExecutor.ExecuteAsync`** batch (parallel handlers share one observation). | **Heatmap** (histogram over time) or **percentiles** via `histogram_quantile`; optional **stat** for last value. |
| **`archlucid_explanation_cache_hits_total`** | Counter | — | Aggregate explanation summary served from **`IHotPathReadCache`** without invoking the inner **`RunExplanationSummaryService`** factory. | **Time series** — `rate()` alongside misses. |
| **`archlucid_explanation_cache_misses_total`** | Counter | — | Cache factory invoked (inner summary built; may imply LLM work). | **Time series** — `rate()` alongside hits. |
| **`archlucid_agent_output_structural_completeness_ratio`** | Histogram | **`agent_type`** | Distribution of structural completeness for persisted agent **`ParsedResultJson`** (0.0–1.0). | **Heatmap** or **quantiles**; alert if p10 drops after a prompt or model change. |
| **`archlucid_agent_output_parse_failures_total`** | Counter | **`agent_type`** | JSON parse / root-kind failures when scoring trace payloads for metrics. | **Time series** — `rate()`; correlate with **`archlucid_agent_result_schema_validations_total`** (invalid). |
| **`archlucid_agent_trace_blob_upload_failures_total`** | Counter | **`agent_type`**, **`blob_type`** | Blob writes that exhausted all retry attempts for agent trace full-prompt persistence. | **Time series** — `rate()`; alert on sustained > 0. |
| **`archlucid_agent_trace_prompt_inline_fallback_total`** | Counter | **`agent_type`**, **`blob_type`** | Inline SQL fallback after blob miss (Real mode). | **Time series** — `rate()`; correlate with blob failures. |
| **`archlucid_agent_trace_blob_persist_duration_ms`** | Histogram | **`agent_type`** | End-to-end blob persistence latency after trace insert (timeout-bounded). | **Heatmap** / **p95**; spike with flat availability → storage saturation or timeout tuning. |
| **`archlucid_agent_output_semantic_score`** | Histogram | **`agent_type`** | Same **`OverallSemanticScore`** as the API: **heuristic** JSON checks (and optional judge), **not** embeddings or ground truth. | **Heatmap** or **quantiles**; trend regressions after prompt/model changes; label dashboards so operators do not read it as embedding similarity. |
| **`archlucid_agent_output_quality_gate_total`** | Counter | **`agent_type`**, **`outcome`**, **`gate_mode`**, **`reject_reason`**, **`execution_mode`** | Post-eval gate (on by default). Use **`reject_reason`** on **`outcome="rejected"`** to tune prompts vs evidence vs faithfulness floors; compare **`execution_mode=real`** vs **`simulator`**. | **Time series** — `rate()` by outcome and `reject_reason`; track **`warned`** after prompt changes. |
| **`archlucid_explanation_aggregate_faithfulness_fallback_total`** | Counter | — | Deterministic aggregate narrative substituted after low faithfulness vs findings. | **Time series** — correlate with model or prompt changes. |

### Explanation cache hit ratio (Prometheus)

Use a ratio of **hit rate** to **hit + miss** rates (avoid dividing raw counters):

```promql
rate(archlucid_explanation_cache_hits_total[5m])
/
(
  rate(archlucid_explanation_cache_hits_total[5m])
  + rate(archlucid_explanation_cache_misses_total[5m])
)
```

When the denominator is **zero** (no traffic), the result is undefined; dashboards may show gaps or you may wrap the denominator with **`clamp_min(..., 1e-9)`** for a defined 0–1 series.

A recording rule **`archlucid:explanation_cache_hit_ratio`** is defined in **`infra/prometheus/archlucid-slo-rules.yml`** for reuse in Grafana variables and alerts.

---

## Trial funnel (self-service product metrics)

**Purpose:** Quantify the self-service trial as a **funnel** aligned with durable audit types in `AuditEventTypes` (`TrialSignupAttempted`, `TrialSignupFailed`, `TrialFirstRunCompleted`, `BillingCheckoutInitiated`, `BillingCheckoutCompleted`). Operational detail: **`docs/runbooks/TRIAL_FUNNEL.md`**.

| Instrument | Type | Labels | Emitted when |
|------------|------|--------|----------------|
| **`archlucid_trial_signups_total`** | Counter | `source`, `mode` | Trial tenant successfully bootstrapped after registration (`TrialTenantBootstrapService`). |
| **`archlucid_trial_signup_failures_total`** | Counter | `stage`, `reason` | Duplicate slug, validation/provisioning failures, email policy block, or local identity errors. |
| **`archlucid_trial_first_run_seconds`** | Histogram | (histogram series) | First coordinator **commit** that persists a golden manifest for a trial tenant (`SqlTrialFunnelCommitHook`). |
| **`archlucid_trial_active_tenants`** | Observable gauge | — | Cached SQL count of active trials; updated from the operational metrics hosted service. |
| **`archlucid_trial_runs_used_ratio`** | Histogram | (histogram series) | Same hook as first-run latency: `TrialRunsUsed` / limit at first qualifying commit. |
| **`archlucid_trial_conversion_total`** | Counter | `from_state`, `to_tier` | Manual convert (`TenantTrialController`) or webhook activator path. |
| **`archlucid_trial_expirations_total`** | Counter | `reason` | **`TrialLifecycleTransitionEngine`** (worker) on lifecycle transitions. |
| **`archlucid_billing_checkouts_total`** | Counter | `provider`, `tier`, `outcome` | `BillingCheckoutController` validation/conflict/session/provider outcomes. |

**Dashboard:** `infra/grafana/dashboard-archlucid-trial-funnel.json` (Terraform `grafana_dashboard.trial_funnel`).  
**Alerts:** `infra/prometheus/archlucid-alerts.yml` group **`archlucid-trial-funnel`**.

**Founder read model (Batch B):** `GET /v1/admin/operational/trial-funnel-summary` (Admin authority) returns trailing-30-day signup/first-commit/conversion counts, median signup→first-commit latency from `TrialFirstRunCompleted` audit payloads, and **estimated** COGS basis labels (token-cost bands are null until agent-trace rollup is wired). Pair with Prometheus series above for dashboard panels.

---

## Activity sources (custom)

Registered via `tracing.AddSource(...)` in **`ObservabilityExtensions`** (including all names below):

| Source name | Typical use |
|-------------|-------------|
| **`ArchLucid.AuthorityRun`** | Authority run orchestration; **child** stage spans (`authority.*`) under the run span — see [BACKGROUND_JOB_CORRELATION.md](BACKGROUND_JOB_CORRELATION.md) §10. |
| **`ArchLucid.AdvisoryScan`** | Scheduled advisory scans. |
| **`ArchLucid.Retrieval.Index`** | Post-commit retrieval indexing. |
| **`ArchLucid.Agent.Handler`** | Production agent handler. |
| **`ArchLucid.Agent.LlmCompletion`** | LLM completion calls. |
| **`ArchLucid.RetrievalIndexing.Outbox`** | Retrieval indexing outbox processor. |
| **`ArchLucid.IntegrationEvent.Outbox`** | Integration event publish outbox. |
| **`ArchLucid.DataArchival`** | Data retention archival. |

---

## Trace tags (conventions)

- **`archlucid.run_id`** — run identifier on authority pipeline stages.
- **`archlucid.execution_mode`** — `simulator` or `real` on **`architecture.run.execute`** spans (`ArchitectureRunExecuteOrchestrator`). Verify in trace export pipelines with `span.attributes["archlucid.execution_mode"]` or your vendor's tag filter; quality-gate counters also label **`execution_mode`** on **`archlucid_agent_output_quality_gate_total`**.
- **`archlucid.stage.name`** — low-cardinality stage key (`context_ingestion`, `graph`, …) for dashboards and queries.
- **`correlation.id`** — logical correlation (`ActivityCorrelation.LogicalCorrelationIdTag`); aligns with Serilog `CorrelationId` where pushed.
- **`archlucid.tenant_id`** / **`archlucid.workspace_id`** — scope GUIDs when resolved (HTTP middleware + outbox processors); omitted when empty — see § Mandatory Activity correlation tags.
- **`archlucid.evidence_package_id`** — evidence ingest and ZIP expansion paths when package id is assigned.
- **`error.type`** — exception type name on failed spans when recorded.

---

## Persisted trace IDs

**`dbo.Runs.OtelTraceId`** stores the **W3C trace ID** captured at **run creation** (from the active **`Activity`** when the authority run record is first persisted — see migration **052**). It is **not** overwritten on later updates, so it remains a stable handle for **creation-time** distributed tracing.

Operators can use it for **post-hoc trace lookup** in two ways:

- **Run detail UI** — the operator shell shows a **Creation trace** link when a persisted id exists (distinct from the per-request **`X-Trace-Id`** / **`traceparent`** on the current page load). Configure **`NEXT_PUBLIC_TRACE_VIEWER_URL_TEMPLATE`** in **`archlucid-ui`** (same **`{traceId}`** placeholder as below).
- **CLI** — **`archlucid trace <runId>`** fetches run detail from the API, reads **`run.otelTraceId`**, and prints a trace viewer URL when **`ARCHLUCID_TRACE_VIEWER_URL_TEMPLATE`** is set (optional browser open via **`ARCHLUCID_TRACE_OPEN_BROWSER`**). See **[CLI_USAGE.md](CLI_USAGE.md)**.

For request-scoped correlation headers and sampling, see **Sampling strategy** and **Response headers** below.

---

## Agent execution trace blob storage + SQL inline fallback

**`AgentExecutionTraceRecorder`** uploads **full** (unsanitized) system prompt, user prompt, and raw model response to **`IArtifactBlobStore`** (container **`agent-traces`**, paths **`{runId}/{traceId}/system-prompt.txt`**, **`user-prompt.txt`**, **`response.txt`**) after the trace row insert for **Real** execution, subject to **`AgentExecution:TraceStorage:BlobPersistenceTimeoutSeconds`**. **Simulator** traces skip blob/inline full-text persistence. Failed or timed-out parts are mirrored into SQL **`FullSystemPromptInline`**, **`FullUserPromptInline`**, **`FullResponseInline`** when blob keys are missing. Histograms/counters: **`archlucid_agent_trace_blob_persist_duration_ms`**, **`archlucid_agent_trace_blob_upload_failures_total`**, **`archlucid_agent_trace_prompt_inline_fallback_total`**. Operational and privacy notes: **`docs/AGENT_TRACE_FORENSICS.md`**.

When **`RealAgentExecutor`** returns a **degraded placeholder** (handler timeout / circuit-open / resilience failure — see **`archlucid_agent_handler_degradations_total`**), **`AgentHandlerDegradedTraceRecorder`** inserts a **partial** trace row **before** the placeholder result: empty prompts, **`ParseSucceeded=false`**, **`FailureReasonCode`** set to the degradation reason, sentinel model metadata **`handler-degraded:no-llm-call`** / **`resilience-placeholder-1.0`**, and no blob upload. Trace insert is **best-effort** (failures are logged; degradation is not blocked). Field semantics: **`docs/AGENT_TRACE_FORENSICS.md`** (TB-034).

Optional reference-case scoring (**`AgentExecution:ReferenceEvaluation:Enabled`** — **false** in shipped **`appsettings.json`**) emits **`archlucid_agent_output_reference_case_evaluations_total`** (labels **`case_id`**, **`agent_type`**, **`outcome`**) and **`archlucid_agent_output_reference_case_score_ratio`**; rows may be appended to **`dbo.AgentOutputEvaluationResults`** (migration **063**). With **`Enabled: false`**, those histograms/counters are not produced on the hot path.

---

## Sampling strategy

| Environment   | `SamplingRatio` | Rationale |
|---------------|-------------------|-----------|
| Development   | `1.0` (default)   | Full fidelity for debugging. |
| Staging       | `1.0`             | Full fidelity for pre-prod verification. |
| Production    | `0.1` – `0.25`    | Reduces trace volume ~75–90% while maintaining statistical coverage. |

**Configuration:**

```json
{
  "Observability": {
    "Tracing": {
      "SamplingRatio": 0.1
    }
  }
}
```

Optional **`Observability:Tracing:AlwaysSampleActivitySources`** (array of `ActivitySource` names, e.g. `ArchLucid.AuthorityRun`) is bound into **`ObservabilityHostOptions`** for operators and future use. The in-process OpenTelemetry .NET SDK does not yet supply **ActivitySource** name on **`SamplingParameters`** (see [open-telemetry/opentelemetry-dotnet#4752](https://github.com/open-telemetry/opentelemetry-dotnet/issues/4752)), so **per-source always-on sampling is not applied in the API/worker**. Use an OTLP **collector** with tail-sampling (or backend rules) to keep high-value sources at full fidelity in production.

**Head-based vs. tail-based**

The built-in sampler is **head-based** (decision at trace start). Some interesting traces (errors, slow requests) may therefore be dropped before export. For **tail-based** sampling (retain errors, latency outliers, etc.), place an OTLP collector with a tail-sampling processor between the app and the trace backend.

**Authority run traces** (`ArchLucid.AuthorityRun`) are high-value and relatively low-volume — prefer retaining them at **1.0** in production via **collector** rules or tail sampling, or via future in-process support once the SDK exposes source-aware sampling.

**Response headers**

Every API response includes **`traceparent`** (W3C) and **`X-Trace-Id`** headers **regardless of sampling**. The values reflect the current **`Activity`** context even when the trace is not exported, so operators can copy an ID into a trace backend (a sampled-out trace may appear as “not found” rather than a mismatched id).

The **operator UI** run detail page (and coordinator **Provenance** page) read **`X-Trace-Id`** from the API response and show a **View trace** deep link when **`NEXT_PUBLIC_TRACE_VIEWER_URL_TEMPLATE`** is set in **`archlucid-ui`** (see [OPERATOR_QUICKSTART.md](OPERATOR_QUICKSTART.md) §Operator UI).

Wiring: **`ObservabilityTraceSamplingConfigurator.ConfigureTraceSampling`** runs **before** `AddAspNetCoreInstrumentation` in **`ObservabilityExtensions.AddArchLucidOpenTelemetry`**. Malformed **`SamplingRatio`** strings are treated as **`1.0`** (full sampling) so configuration typos do not prevent the host from starting.

---

## Health JSON (detailed)

**`GET /health`** (authenticated; **ReadAuthority**; detailed response writer) includes a **`circuit_breakers`** check whose **`data.gates`** array lists each OpenAI breaker with **`name`**, **`state`** (`Closed` / `Open` / `HalfOpen`), **`consecutiveFailures`**, **`failureThreshold`**, **`breakDurationSeconds`**, and **`lastStateChangeUtc`** (ISO-8601 or **`never`**). That gives operators the same operational shape as metrics-backed triage **without requiring Prometheus** for thresholds, failure counts, or last transition time. Still use **`archlucid_circuit_breaker_*`** counters for trends and dashboards. **`/health/live`** and **`/health/ready`** omit this check (it has no readiness/liveness tags).

---

## Committed Grafana dashboards (`infra/grafana/`)

| File | Purpose |
|------|---------|
| `dashboard-archlucid-authority.json` | Authority pipeline spans and throughput; **Sales ops** row (Improvement #6) — pricing quote request age histogram (`archlucid_pricing_quote_request_age_hours` by `breach_status`) and open warn/breach stats. Operator table: **`/admin/pricing-quote-aging`**. |
| `dashboard-archlucid-slo.json` | HTTP SLO / burn-rate style panels; integration outbox dead-letter gauge; run-export outbox pending/age/dead-letter and processing-rate panels. Runbook: [RUN_EXPORT_BLOB_PUSH_OUTBOX_OBSERVABILITY.md](../runbooks/RUN_EXPORT_BLOB_PUSH_OUTBOX_OBSERVABILITY.md). |
| `dashboard-archlucid-llm-usage.json` | LLM token rates. |
| `dashboards/archlucid-container-apps-overview.json` | Container Apps overview. |
| **`dashboard-archlucid-run-lifecycle.json`** | Run-lifecycle / traceability: template variable **`runId`**, links to API audit search, authority stage histograms, circuit breaker rates — use with [runbooks/TRACE_A_RUN.md](../runbooks/TRACE_A_RUN.md). |
| **`dashboard-archlucid-trial-funnel.json`** | Self-service trial funnel (signups, failures, first-run latency, billing, conversion) — use with [runbooks/TRIAL_FUNNEL.md](../runbooks/TRIAL_FUNNEL.md). |

Import paths and Terraform wiring: [runbooks/SLO_PROMETHEUS_GRAFANA.md](../runbooks/SLO_PROMETHEUS_GRAFANA.md).

---

## Authority pipeline remediation runbook

**Merged:** 2026-07-20 from the retired `docs/runbooks/AUTHORITY_PIPELINE_OBSERVABILITY.md` (see [`docs/redirects.md`](../redirects.md)). Turns the **`archlucid-authority`** Grafana dashboard and its Prometheus alerts into actionable steps (queue depth, SQL health, worker capacity) without changing product semantics.

**Assumptions:**

- Metric names match the tables above (source **`ArchLucid.Core/Diagnostics/ArchLucidInstrumentation.cs`**).
- **Prometheus** scrapes the API and worker **`/metrics`** (or OTLP fan-out) with stable label names (`stage`, `outcome`, `table`, `column`).
- Ops can open **`GET /v1/admin/diagnostics/outboxes`** (or equivalent admin surface) for row-level outbox detail when authorized.

**Constraints:**

- **Do not** relax SQL RLS or tenant isolation to “clear” backlog faster.
- **Do not** delete orphan comparison rows without following **[`docs/runbooks/COMPARISON_RECORD_ORPHAN_REMEDIATION.md`](../runbooks/COMPARISON_RECORD_ORPHAN_REMEDIATION.md)** (dry-run / approval path).
- Scale workers only after ruling out **SQL connectivity**, **deadlocks**, and **poison messages** (see **`docs/runbooks/AGENT_EXECUTION_FAILURES.md`** if agent stages fault repeatedly).

**Architecture:** API + Worker processes → **`ArchLucid`** meter → Prometheus → **`infra/prometheus/archlucid-alerts.yml`** → Alertmanager / Azure Monitor → **Grafana** JSON **`infra/grafana/dashboard-archlucid-authority.json`** (uid **`archlucid-authority`**). **`archlucid_authority_pipeline_work_pending`** reflects **`dbo.AuthorityPipelineWorkOutbox`** depth; **`archlucid_authority_pipeline_work_oldest_pending_age_seconds`** reflects stuck rows; the **`archlucid_authority_pipeline_stage_duration_ms`** histogram breaks down wall time by pipeline stage.

| Panel / signal | Instrument | Primary owner |
|----------------|------------|---------------|
| Stage duration p95 | `archlucid_authority_pipeline_stage_duration_ms` | Authority pipeline executor / stage services |
| Outbox depth | `archlucid_authority_pipeline_work_pending` | Worker consumer + SQL outbox |
| Oldest row age | `archlucid_authority_pipeline_work_oldest_pending_age_seconds` | Same + scheduling |
| Orphans vs alerts | `archlucid_data_consistency_orphans_detected_total`, `archlucid_data_consistency_alerts_total` | `DataConsistencyOrphanProbeHostedService` + enforcement mode |

**Data flow:**

1. Runs enqueue **authority pipeline** work into **`AuthorityPipelineWorkOutbox`**.
2. Worker(s) claim rows; stages record **histogram** durations with **`stage`** / **`outcome`**.
3. **Gauges** (`pending`, `oldest_pending_age`) update from SQL aggregates (see `EnsureOutboxDepthObservableGaugesRegistered` in code).
4. **Data consistency** probe increments **counters** when foreign keys to **`dbo.Runs`** are missing; **`alerts_total`** rises when enforcement mode + threshold say so.

**Security model:** Admin diagnostics and **outbox inspection** require **appropriate authority** (do not share tokens in tickets). Orphan remediation may touch **tenant-scoped** rows — use approved maintenance windows and **`docs/runbooks/COMPARISON_RECORD_ORPHAN_REMEDIATION.md`**.

### Import the dashboard (Grafana UI)

1. Grafana → **Dashboards** → **Import** → upload **`infra/grafana/dashboard-archlucid-authority.json`**.
2. Assign template variable **`datasource`** to your **Prometheus** source.
3. Confirm the first row of panels populates; if **empty**, verify scrape targets and OTLP → Prometheus **histogram** naming (`*_bucket`).

**Optional (Terraform):** when **`grafana_terraform_dashboards_enabled = true`** in **`infra/terraform-monitoring`**, the same JSON is provisioned by **`grafana_dashboard.authority`** (see **`grafana_dashboards.tf`**).

### Queue backlog — `ArchLucidAuthorityPipelineWorkBacklog`

- **Rule:** `archlucid_authority_pipeline_work_pending > 50` for **15m** (`infra/prometheus/archlucid-alerts.yml`).
- **Remediation order:**
  1. **Worker health:** confirm worker Container App / job is running, not crash-looping, and draining **`AuthorityPipelineWorkOutbox`** (SQL consumer paths — not Azure Storage Queue unless durable export jobs are enabled).
  2. **SQL tier:** check DTU/vCore saturation, blocking sessions, and failover state (**`docs/runbooks/DATABASE_FAILOVER.md`** if geo event).
  3. **Scale capacity:** when SQL is healthy but processing lags sustained demand — raise **`worker_max_replicas`** / **`worker_min_replicas`** in **`infra/terraform-container-apps`** (**`infra/terraform-container-apps/README.md`** § Background services). When **`background_jobs_mode = "Durable"`**, enable **`worker_enable_queue_depth_scaling`** + **`worker_queue_scale_connection_string`** so KEDA **azure-queue** adds replicas as **Azure Storage Queue** backlog grows (**export/async jobs**, not SQL outbox row count). For **tenant noisy-neighbor isolation**, tune **`ArchLucid:AuthorityPipeline:Concurrency`** (per-tenant slot caps) — starting tiers below.
  4. **Deep inspection:** use admin outbox diagnostics for **stuck** `RunId`s; correlate with **`docs/runbooks/TRACE_A_RUN.md`**.

### Stale oldest row — `ArchLucidAuthorityPipelineWorkStale`

- **Rule:** `archlucid_authority_pipeline_work_oldest_pending_age_seconds > 3600` for **20m**.
- **Interpretation:** rows are **not** being processed — prefer **poison message** or **dependency outage** over simple overload.
- **Remediation:** same as **queue backlog** above, but prioritize **root-cause** on the oldest `WorkItem` (exception logs, SQL deadlock history, external LLM outage if stage blocks).

### Data consistency — `ArchLucidDataConsistencyOrphansDetected` / `ArchLucidDataConsistencyAlertsRaised`

- **Rules:** non-zero **`rate`** over **1h** windows (see alert **expr** in **`archlucid-alerts.yml`**).
- **Remediation:**
  - **Orphans detected:** identification-only — trace **missing `dbo.Runs`** keys; follow **`docs/runbooks/COMPARISON_RECORD_ORPHAN_REMEDIATION.md`** for comparison / golden / findings snapshots.
  - **Alerts raised:** enforcement is **Alert** or **Quarantine** — read **`docs/data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md`** and align with **data owners** before destructive fixes.

### Recommended `ArchLucid:AuthorityPipeline:Concurrency` by environment tier

Bindings live under **`ArchLucid:AuthorityPipeline:Concurrency`** (`AuthorityPipelineConcurrencyOptions` in product code). **`MaxConcurrentExecutionsPerTenant`** ≤ **0** disables SQL lease enforcement (gate becomes a no-op). **`LeaseRecognitionHorizon`** defaults to **48 hours** and **`WaitPollMilliseconds`** to **75** — change these only when tuning stale-lease cleanup or poll cadence after reviewing **`SqlAuthorityPipelineTenantExecutionLeaseRepository`**.

Tier names align with **[`RTO_RPO_TARGETS.md`](RTO_RPO_TARGETS.md)**. Values below are **starting recommendations** for hosted SaaS posture; validate against worker replica count, SQL SKU, and pilot concurrency.

| Tier | **`MaxConcurrentExecutionsPerTenant`** | **`RejectInlineCreateWhenConcurrencyUnavailable`** | Notes |
|------|----------------------------------------|-----------------------------------------------------|-------|
| **Development** | **0** *(omit or explicit)* — enforcement **off** | **false** *(default)* | Matches shipped default when unset; avoids blocking parallel local runs. Set a **small positive** value only when intentionally testing the lease gate. |
| **Staging / pre-production** | **2**–**4** | **false** *(default)* unless validating fast-fail UX | Exercises **`dbo.AuthorityPipelineTenantExecutionLease`** and queue/offload paths before production; prefer **lower** bound on shared SQL. |
| **Production** | **4** *(initial)*; adjust **2**–**8** with capacity review | **false** by default; **true** when synchronous **`POST /v1/architecture/request`** must **429-style fail fast** instead of waiting for a slot | Caps per-tenant **heavy-stage** fan-out (graph / findings / decision / manifest). Raise slots only when the **queue backlog** section above stays healthy, SQL has headroom, and **lease table growth** below stays bounded. Pair with **`worker_min_replicas` / `worker_max_replicas`** (`infra/terraform-container-apps`) rather than unbounded concurrency alone. |

**Inline vs queued:** When **`RejectInlineCreateWhenConcurrencyUnavailable`** is **true** and slots are full, **synchronous** creates fail fast with **`AuthorityTenantConcurrencyLimitExceededException`** (problem hints reference concurrency keys — see **`ProblemSupportHints`**). Work processed via the **authority pipeline work outbox** still **waits** for capacity (poll interval **`WaitPollMilliseconds`**).

### Lease table growth — `dbo.AuthorityPipelineTenantExecutionLease`

**Purpose:** One row per **run** currently holding a **per-tenant execution slot** for authority heavy stages. Implementation: **`SqlAuthorityPipelineTenantExecutionLeaseRepository`** / **`SqlTenantAuthorityPipelineConcurrencyGate`**.

**Lifecycle (steady state):**

- **Insert** when a slot is acquired (**`TryAcquireLeaseAsync`**, serializable transaction).
- **Delete** when the pipeline releases the slot (**`ReleaseLeaseAsync`** on normal completion).
- **Stale cleanup:** On each acquire attempt for a **tenant**, rows with **`AcquiredUtc`** older than **`UTC now − LeaseRecognitionHorizon`** are deleted for **that tenant** before counting active leases — crashed workers eventually stop counting toward capacity once leases age past the horizon **and** that tenant has another acquire attempt.

**Why monitor row count:** Under healthy operation, total rows should stay **small** (order of **active concurrent pipelines** across all tenants). **Sustained growth** or **per-tenant counts persistently above `MaxConcurrentExecutionsPerTenant`** suggests stuck pipelines, crash loops without release, misconfigured horizon, or overload — correlate with **`archlucid_authority_pipeline_work_pending`**, **`AuthorityPipelineWorkOutbox`**, and **`docs/runbooks/TRACE_A_RUN.md`**.

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
3. If overload is legitimate, prefer **slot tuning** above and **worker/SQL scale** over disabling enforcement entirely.

---

## Prometheus alerts (explainability)

**`infra/prometheus/archlucid-alerts.yml`** — group **`archlucid-explainability`**:

- **`ArchLucidExplanationFaithfulnessFallbackTrend`** — spikes in aggregate faithfulness fallbacks (deterministic narrative substitution).
- **`ArchLucidExplainabilityTraceCompletenessP10Low`** — 10th percentile of **`archlucid_explainability_trace_completeness_ratio`** below **0.35** over a sustained window (tune per environment; requires histogram buckets in Prometheus).

See [EXPLAINABILITY_TRACE_COVERAGE.md](EXPLAINABILITY_TRACE_COVERAGE.md).

**`infra/prometheus/archlucid-alerts.yml`** — group **`archlucid-trial-funnel`** (signup failure rate page, first-run p95 ticket): see [runbooks/TRIAL_FUNNEL.md](../runbooks/TRIAL_FUNNEL.md).

---

## Azure Logic Apps (optional)

When **`infra/terraform-logicapps/`** hosts are enabled, send **platform + workflow logs** and **site metrics** to a **Log Analytics workspace** by setting **`enable_logic_app_diagnostic_settings = true`** and **`logic_app_diagnostic_log_analytics_workspace_id`** to the workspace resource ID. Terraform creates one **`azurerm_monitor_diagnostic_setting`** per deployed **`azurerm_logic_app_standard`** site (`enabled_log` category group **`allLogs`**, **`enabled_metric`** **`AllMetrics`**). Retention and workspace-based **Application Insights** (if used) are controlled on the workspace / classic AI resource — not in this module.

If you prefer the Portal for a one-off host, you can still add **Diagnostic settings** manually; keep destinations on **private** analytics paths consistent with org policy.

**Correlations:** Logic App run IDs with Service Bus **message** `messageId` / body **`approvalRequestId`** for governance approvals (`com.archlucid.governance.approval.submitted` on the dedicated subscription from `infra/terraform-servicebus` when `enable_logic_app_governance_approval_subscription` is true), and with body **`providerDedupeKey`** / **`subscriptionId`** for Marketplace fulfillment (`com.archlucid.billing.marketplace.webhook.received.v1` when `enable_logic_app_marketplace_fulfillment_subscription` is true). See [runbooks/LOGIC_APPS_STANDARD.md](../runbooks/LOGIC_APPS_STANDARD.md).

---

## Do Not Log (TB-330)

Canonical forbidden categories live in code: **`ArchLucid.Core/Diagnostics/LoggingPolicy.cs`** (`LoggingPolicy.NeverLogCategories`). Enforcement helpers: **`LogSanitizer`**, **`PromptRedactor`**, support-bundle redaction. Do not duplicate the category list here — PR reviewers cite the type and ADR 0053.

---

## Diagnostic event taxonomy (TB-332)

Canonical lifecycle event name constants: **`ArchLucid.Core/Diagnostics/DiagnosticEventNames.cs`**. Naming rules (ADR 0053): lowercase dot-separated `domain.verb` for log/activity event names; metrics remain `archlucid_*` snake_case.

| Domain | Constants (sample) |
| --- | --- |
| Review | `review.created`, `review.stage.completed`, `review.completed`, `review.failed` |
| Evidence | `evidence.ingest.started`, `evidence.ingest.succeeded`, `evidence.ingest.failed`, `evidence.expansion.completed` |
| AI | `ai.completion.started`, `ai.completion.succeeded`, `ai.completion.failed`, `ai.budget.exceeded` |
| Export | `export.started`, `export.succeeded`, `export.failed` |
| Failure | `failure.unhandled`, `failure.dependency`, `failure.validation` |

Migrate **new** log sites in touched files only; do not bulk-rewrite existing call sites in one batch.

---

## Mandatory Activity correlation tags (TB-329 / TB-331)

| Dimension | Activity tag | Serilog `LogContext` |
| --- | --- | --- |
| Correlation | `correlation.id` | `CorrelationId` |
| Run | `archlucid.run_id` | *(tag only)* |
| Tenant | `archlucid.tenant_id` | *(tag only — no log duplication)* |
| Workspace | `archlucid.workspace_id` | *(tag only)* |
| Evidence package | `archlucid.evidence_package_id` | `EvidencePackageId` (ingest paths) |

Helpers: **`ActivityScopeTags`** in `ArchLucid.Core/Diagnostics`. HTTP requests set tenant/workspace in **`CorrelationIdMiddleware`** (re-applied on response start after auth). Outbox processors propagate from payload scope.

**Example App Insights query (traces):**

```kusto
traces
| where customDimensions["archlucid.tenant_id"] == "<tenant-guid>"
| order by timestamp desc
```

---

## Production operator runbook (TB-333)

### 1. Inject Application Insights (Api + Worker + Jobs.Cli)

| Priority | Setting |
| --- | --- |
| 1 | **`APPLICATIONINSIGHTS_CONNECTION_STRING`** (Container Apps / App Service env) |
| 2 | **`ApplicationInsights:ConnectionString`** or **`Observability:AzureMonitor:ApplicationInsightsConnectionString`** in merged config |

**Host parity (TB-336):** **Api**, **Worker**, and **Jobs.Cli** must each export telemetry in production-like profiles. Inject the **same** connection string (or OTLP/Prometheus settings) on every container definition — not only the Api app. A configured Api with a blind Worker breaks background review lifecycle visibility (outbox processors, integration events, deferred authority work). Container Apps Jobs running **`ArchLucid.Jobs.Cli`** need the same injection or job-originated spans disappear from triage.

**Parity audit (repo-local, no secrets printed):**

```bash
python scripts/report_observability_export_readiness.py --environment Production --out artifacts/observability-export-readiness.md
```

The report Summary table lists per-host durable export status; the **Host configuration parity (TB-336)** table shows whether committed JSON includes an `Observability` section. Re-run **without** `--no-process-environment` on a shell that mirrors production env when validating deploy-time injection.

### 2. Verify export before sign-off

```bash
python scripts/report_observability_export_readiness.py --environment Production --honor-require-telemetry-export-config --strict-exit-code
```

When **`ProductionValidation:RequireTelemetryExport=true`**, hosts **fail startup** if no Application Insights connection string, active OTLP endpoint, or Prometheus scrape is configured (`ProductionDangerousMisconfigurationLint`). Staging/local may disable via explicit config — not a silent production default.

### 3. Smoke after deploy

- Confirm **Live Metrics** or incoming traces in Application Insights within 5 minutes of traffic.
- Send a request with **`X-Correlation-ID`**; locate the trace via response **`traceparent`** / **`X-Trace-Id`** headers.
- Run one successful review **`POST …/execute`** and confirm agent-output metrics (see export table above).

### 4. Canonical triage queries

```kusto
// By review run
traces
| where customDimensions["archlucid.run_id"] == "<run-guid>"

// By tenant (after TB-329)
traces
| where customDimensions["archlucid.tenant_id"] == "<tenant-guid>"

// Evidence ingest
traces
| where customDimensions["archlucid.evidence_package_id"] == "<package-guid>"
```

### 5. Sampling and cost

Production default guidance: **`Observability:Tracing:SamplingRatio`** **0.1–0.25** (see § Sampling strategy). Keep **`ArchLucid.AuthorityRun`** and LLM error paths at full fidelity via collector tail sampling or **`AlwaysSampleActivitySources`** where configured.

### 6. Disable export safely (non-production)

Set **`Observability:Otlp:Enabled`** / Prometheus / connection string empty **and** **`ProductionValidation:RequireTelemetryExport=false`** for the target profile. Do not ship production with export disabled and fail-fast enabled.

---

## Verification (TB-334)

Regression matrix: **`ArchLucid.Api.Tests/Middleware/ObservabilityCorrelationIntegrationTests.cs`** — correlation header, **`traceparent`**, Problem Details **`correlationId`**, tenant/workspace Activity tags. Unit coverage: **`CorrelationIdMiddlewareTests`** (Api + Host.Core), **`PostCommitProjectionOutboxProcessorTests`**, **`RetrievalIndexingOutboxProcessorCorrelationTests`**, **`RunExportBlobPushOutboxProcessorTests`**, **`ZipEvidenceExpanderServiceTests`**, **`LoggingPolicyTests`**, **`DiagnosticEventNamesTests`**, **`DiagnosticEventNamesArchitectureTests`**.

---

## Related documents

- [PERFORMANCE.md](PERFORMANCE.md) — hot-path caching (including aggregate explanation summary TTL and invalidation).
- [BACKGROUND_JOB_CORRELATION.md](BACKGROUND_JOB_CORRELATION.md) — background jobs + authority stage hierarchy.
- [TEST_EXECUTION_MODEL.md](TEST_EXECUTION_MODEL.md) — `Suite=Core` and observability-related tests.
- [RTO_RPO_TARGETS.md](RTO_RPO_TARGETS.md) — environment tier naming used by the authority pipeline concurrency table.
- [`docs/runbooks/TRACE_A_RUN.md`](../runbooks/TRACE_A_RUN.md) — single-run drill-down (paired with the authority pipeline remediation runbook above).
- [`docs/runbooks/COMPARISON_RECORD_ORPHAN_REMEDIATION.md`](../runbooks/COMPARISON_RECORD_ORPHAN_REMEDIATION.md) — dry-run/approval path for orphan comparison rows.
- [`docs/runbooks/AGENT_EXECUTION_FAILURES.md`](../runbooks/AGENT_EXECUTION_FAILURES.md) — agent stage fault triage.
- [`docs/data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md`](../data-consistency/DATA_CONSISTENCY_ENFORCEMENT.md) — enforcement mode design detail.
- `ArchLucid.Host.Core/Startup/ObservabilityExtensions.cs` — host wiring.
- `ArchLucid.Host.Core/Startup/ObservabilityTraceSamplingConfigurator.cs` — trace sampling from configuration.
