> **Scope:** Contributor-reference — Resilience configuration (ArchLucid) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Resilience configuration (ArchLucid)

Operators can tune retry and circuit-breaker behavior without recompiling. This document lists configuration paths, defaults, the Azure OpenAI circuit breaker state machine, emitted OpenTelemetry metrics, and example Prometheus queries.

## Configurable knobs

### Azure OpenAI circuit breakers (completion and embedding)

| Setting | Config path | Default | Valid range |
|--------|-------------|---------|-------------|
| Completion failure threshold | `AzureOpenAI:CircuitBreaker:Completion:FailureThreshold` | `5` | ≥ 1 after binding (invalid values fall back) |
| Completion open duration (seconds) | `AzureOpenAI:CircuitBreaker:Completion:DurationOfBreakSeconds` | `30` | ≥ 1 after binding |
| Completion half-open success streak | `AzureOpenAI:CircuitBreaker:Completion:HalfOpenSuccessThreshold` | `1` | ≥ 1 after binding |
| Embedding failure threshold | `AzureOpenAI:CircuitBreaker:Embedding:FailureThreshold` | `5` | ≥ 1 |
| Embedding open duration (seconds) | `AzureOpenAI:CircuitBreaker:Embedding:DurationOfBreakSeconds` | `30` | ≥ 1 |
| Embedding half-open success streak | `AzureOpenAI:CircuitBreaker:Embedding:HalfOpenSuccessThreshold` | `1` | ≥ 1 |

**Fallback hierarchy**

1. Per-gate section: `AzureOpenAI:CircuitBreaker:Completion` or `AzureOpenAI:CircuitBreaker:Embedding` when the corresponding JSON key is present for each property.
2. Shared section: `AzureOpenAI:CircuitBreaker:FailureThreshold` and `AzureOpenAI:CircuitBreaker:DurationOfBreakSeconds` when a per-gate key is absent.
3. Code defaults: `CircuitBreakerOptions.DefaultFailureThreshold` / `DefaultDurationOfBreakSeconds`, then `ApplyDefaults()` clamps invalid values.

Deployed environments that only set the legacy flat `AzureOpenAI:CircuitBreaker` block continue to work for **both** gates.

**Threshold changes are picked up automatically via `IOptionsMonitor<CircuitBreakerOptions>` — no restart required.** Production keyed gates read current named options when evaluating failures (`RecordFailure`) and half-open success streaks (`RecordSuccess`); configuration reload updates **`FailureThreshold`**, **`DurationOfBreakSeconds`**, and **`HalfOpenSuccessThreshold`** for subsequent counts. Internal state (open/half-open, consecutive failures) is not reset by a reload. Tests may still construct **`CircuitBreakerGate`** with a frozen **`CircuitBreakerOptions`** instance.

### Hosted environment defaults (Improvement #15, 2026-05-25)

Parallel agent handlers during Azure OpenAI latency brownouts can produce several consecutive timeout failures before any call succeeds. Hosted **Production** and **Staging** override the Advanced defaults:

| Environment | Completion `FailureThreshold` | Completion `DurationOfBreakSeconds` | Completion `HalfOpenSuccessThreshold` | Rationale |
|-------------|------------------------------|-------------------------------------|---------------------------------------|-----------|
| Production (`appsettings.Production.json`) | `8` | `45` | `2` | Nominal hosted p95 completion latency ~18s; brownout bursts of 4–6 parallel handler timeouts should not open on the legacy threshold of `5`. Two successful half-open probes before closing reduces flapping. |
| Staging (`appsettings.Staging.json`) | `6` | `30` | `2` | Faster feedback while preserving the two-probe close pattern. |

Production also sets `AgentExecution:Resilience:LlmCallMaxRetryAttempts` to `4`, `LlmCallBaseDelayMilliseconds` to `750`, and `LlmCallMaxDelaySeconds` to `20` so transient latency spikes exhaust Polly backoff before the breaker records a failure.

**Health introspection:** `GET /health/detailed` and `GET /health/diagnostics` include a `circuit_breakers` entry with per-gate `provider` (`AzureOpenAI`), `role` (`completion` / `embedding` / `completion_fallback`), `openReason` (`consecutive_failures` or `half_open_probe_failed` while open), and `halfOpenSuccessThreshold`.

### SQL connection open retries

| Setting | Config path | Default | Notes |
|--------|-------------|---------|--------|
| Max retry attempts | `Persistence:SqlOpenResilience:MaxRetryAttempts` | `3` | `0` disables retries (first open only). Clamped to 0–32. |
| Base delay (ms) | `Persistence:SqlOpenResilience:BaseDelayMilliseconds` | `200` | Exponential backoff with jitter. Clamped to 1–120000. |

Used by `ResilientSqlConnectionFactory` via `SqlOpenResilienceDefaults.BuildSqlOpenRetryPipeline`.

### Agent execution handler resilience

Already bound via `IOptions<AgentExecutionResilienceOptions>` from `AgentExecution:Resilience` (`MaxConcurrentHandlers`, `PerHandlerTimeoutSeconds`). See `AgentExecutionResilienceOptions` in code for section name.

### CLI HTTP retries

| Setting | Source | Default | Notes |
|--------|--------|---------|--------|
| Max retry attempts | `archlucid.json` → `httpResilience.maxRetryAttempts` | `3` | Clamped to 0–10. `0` disables retries. |
| Initial delay (seconds) | `archlucid.json` → `httpResilience.initialDelaySeconds` | `1` | Clamped 0–300. Exponential backoff + jitter for 5xx, 429, timeouts. |

If `archlucid.json` is omitted, the CLI still attempts to load project config from the current directory for HTTP resilience when constructing `ArchLucidApiClient(string baseUrl)`.

## LLM model fallback

When **`ArchLucid:FallbackLlm:Enabled`** is **`true`**, the host builds a secondary Azure OpenAI chat client and wraps the scoped **`IAgentCompletionClient`** in **`FallbackAgentCompletionClient`**. This is **model-level failover** (different endpoint/deployment), not the same as Polly retry on the primary (see **`docs/LLM_RETRY_AND_CIRCUIT_BREAKER.md`**).

### Configuration

| Setting | Config path | Required when enabled |
|--------|-------------|------------------------|
| Enable fallback | `ArchLucid:FallbackLlm:Enabled` | — |
| Fallback resource endpoint | `ArchLucid:FallbackLlm:Endpoint` | Yes |
| Chat deployment name | `ArchLucid:FallbackLlm:DeploymentName` | Yes |
| API key | `ArchLucid:FallbackLlm:ApiKey` | Yes |

If **`Enabled`** is **`true`** but any of **Endpoint**, **DeploymentName**, or **ApiKey** is missing, the host fails at startup with a clear **`InvalidOperationException`**. **`ApiKey`** should be supplied from Key Vault in production (see **`docs/CONFIGURATION_KEY_VAULT.md`**).

**Max completion tokens** for the fallback client reuse **`AzureOpenAI:MaxCompletionTokens`** (same default as the primary **`AzureOpenAiCompletionClient`** when unset).

### When fallback runs

After the **primary** chain returns a terminal failure, **`FallbackAgentCompletionClient`** calls the **secondary** chain only when the primary surfaces:

- **`HttpRequestException`** with **`StatusCode`** **429** (Too Many Requests) or **5xx** (500–599), or
- **`ClientResultException`** (Azure OpenAI / `System.ClientModel`) with the same HTTP status semantics.

**User cancellation** (**`OperationCanceledException`**) is **not** eligible: the exception is rethrown and the secondary is not invoked. Other HTTP client errors (e.g. **400**) are rethrown without fallback.

### Decorator ordering

From the inside out, each chain is:

1. **`AzureOpenAiCompletionClient`** (primary or fallback resource)
2. **`LlmCompletionAccountingClient`** and optional **`CachingAgentCompletionClient`**
3. **`CircuitBreakingAgentCompletionClient`** (Polly retry **inside** this decorator, same as today)
4. **`FallbackAgentCompletionClient`** (**outermost** when enabled) — primary chain first, then secondary chain on eligible failures

A **separate** circuit breaker gate (**`OpenAiCompletionFallback`**) is registered for the fallback completion path so a tripped primary breaker does not block the fallback deployment.

### Logging

- **Primary** eligible failure: a **warning** is logged before the secondary is tried (includes the primary exception).
- **Secondary** failure: the exception propagates to callers; **`CircuitBreakingAgentCompletionClient`** on the secondary path still logs its usual **warning** after retries when recording breaker failure.

## Circuit breaker state machine

Independent gates exist for **completion**, **embedding**, and (when LLM fallback is enabled) **completion fallback** (keyed **`OpenAiCompletion`** / **`OpenAiEmbedding`** / **`OpenAiCompletionFallback`**).

```text
Closed --(N consecutive failures)--> Open --(after DurationOfBreakSeconds)--> HalfOpen (single probe)
   ^                                        |
   |                                        |
   +--(M successful half-open probes)-------+  (HalfOpenSuccessThreshold, default 1)
   |
   +--------(probe failure or cancel)------> Open
```

- **Closed**: normal traffic; successes do not emit state-transition metrics (avoids noise).
- **Open**: calls are rejected until the break duration elapses; then one caller may enter **HalfOpen** as the probe.
- **HalfOpen**: only one probe at a time; concurrent callers are rejected until the probe completes. **`HalfOpenSuccessThreshold`** successful probes (default `1`) are required before returning to **Closed**; partial successes release the probe slot for the next caller.

## OpenTelemetry metrics

All use meter name **`ArchLucid`** (see `ArchLucidInstrumentation.MeterName`). Circuit breaker counters use the **`archlucid_`** metric name prefix.

| Metric | Type | Labels | When incremented |
|--------|------|--------|------------------|
| `archlucid_circuit_breaker_state_transitions_total` | Counter | `gate`, `from_state`, `to_state` | Only on real transitions (e.g. `Closed`→`Open`, `Open`→`HalfOpen`, `HalfOpen`→`Closed`, `HalfOpen`→`Open`). |
| `archlucid_circuit_breaker_rejections_total` | Counter | `gate` | Each `ThrowIfBroken` that throws `CircuitBreakerOpenException`. |
| `archlucid_circuit_breaker_probe_outcomes_total` | Counter | `gate`, `outcome` (`success` / `failure` / `cancelled`) | Half-open probe completion paths only. |

**Cardinality**: `gate` is bounded (`OpenAiCompletion`, `OpenAiEmbedding`, and **`OpenAiCompletionFallback`** when fallback LLM is enabled). Do not add tenant or request identifiers to these series.

## Example Prometheus queries

```promql
# Rejection rate per gate (5m)
sum by (gate) (rate(archlucid_circuit_breaker_rejections_total[5m]))

# Transition rate into Open from Closed (completion gate)
rate(archlucid_circuit_breaker_state_transitions_total{
  gate="OpenAiCompletion",from_state="Closed",to_state="Open"
}[5m])

# Half-open probe failures (embedding)
rate(archlucid_circuit_breaker_probe_outcomes_total{
  gate="OpenAiEmbedding",outcome="failure"
}[5m])
```

## Related code

- `ArchLucid.Core.Resilience.CircuitBreakerGate`, `CircuitBreakerOptions`
- `ArchLucid.Core.Diagnostics.ArchLucidInstrumentation`
- `ArchLucid.Host.Composition.Startup.ServiceCollectionExtensions` (named options registration)
- `ArchLucid.Persistence.Connections.SqlOpenResilienceOptions`, `SqlOpenResilienceDefaults`
- `ArchLucid.Cli.CliResilienceOptions`, `CliRetryDelegatingHandler`
- `ArchLucid.Core.Configuration.FallbackLlmOptions`, `ArchLucid.AgentRuntime.FallbackAgentCompletionClient`
