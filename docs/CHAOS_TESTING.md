# Chaos-style resilience tests

**Objective**: Catch regressions in retry and circuit-breaker wiring before production incidents.

**Approach in this repo**

1. **HTTP (CLI)**: `ArchLucid.Cli.Tests.CliRetryDelegatingHandlerTests` sends a **500** on the first attempt and **200** on the next, asserting Polly retries via `CliRetryDelegatingHandler`.
2. **SQL + blob (Polly Simmy)**: `ArchLucid.Persistence.Tests` — `SqlOpenResilienceSimmyTests` composes `SqlOpenResilienceDefaults` with Simmy `ChaosFault` (transient `SqlException`); `BlobStoreSimmyChaosTests` retries `IOException` on a synthetic `IArtifactBlobStore` write path. Test projects reference **`Polly.Extensions`** so Simmy builder extensions resolve (Simmy types live in `Polly.Core`; extensions are surfaced via that package).
3. **LLM latency (Simmy)**: `ArchLucid.AgentRuntime.Tests.SimmyChaosPipelineTests` — `ChaosLatency` under a short Polly **timeout** (fails fast), plus SQL-style retry + fault composition (mirrors completion client protection patterns).
4. **Agent execution bulkhead + timeout**: `ArchLucid.AgentRuntime.Tests.AgentExecutionResilienceTests` — process-wide `IAgentHandlerConcurrencyGate` (semaphore) and per-handler `ResiliencePipeline` timeout on `RealAgentExecutor` (configured under `AgentExecution:Resilience`).

**Operational chaos** (staging)

- Run controlled drills documented in `docs/runbooks/DATABASE_FAILOVER.md` and measure RTO/RPO; pair with Prometheus rules in `infra/prometheus/archlucid-alerts.yml` and `archlucid-slo-rules.yml`, and optional **Azure Monitor Prometheus rule groups** from `infra/terraform-monitoring/prometheus_slo_rules.tf` when `enable_prometheus_slo_rule_group` is set.
