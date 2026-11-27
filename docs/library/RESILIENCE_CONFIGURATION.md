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

### Azure OpenAI SDK network timeouts

| Setting | Config path | Default | Valid range |
|---------|-------------|---------|-------------|
| Chat completion network timeout (seconds) | `AzureOpenAI:CompletionNetworkTimeoutSeconds` | `60` | 5–180; rejected by `AzureOpenAiOptionsValidator` outside range |
| Embedding network timeout (seconds) | `Retrieval:QueryBudget:EmbeddingNetworkTimeoutSeconds` | `15` | 3–45 (existing clamped embedding policy) |

`AzureOpenAiCompletionClient` now always constructs `AzureOpenAIClientOptions` with `NetworkTimeout` for **both** API-key and managed-identity authentication. Cached deployments, regional fallbacks, judge-only completions and tenant BYO clients use the configured timeout; direct standalone clients use the 60-second default.

This setting limits **an individual SDK network operation**; it is **not** the overall time budget across Polly retries, HTTP 429 Retry-After delays, or provider fallback attempts. Keep higher-level cancellation/deadline policies in place. It also cannot guarantee that a server stops processing a request it has already accepted. SDK client configuration is captured when each client is constructed; changing the key requires replacing existing client instances (e.g. host restart), unlike monitored breaker thresholds.

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

### Schema remediation LLM path (TB-043)

| Setting | Config path | Effect |
|--------|-------------|--------|
| Max schema attempts | `AgentSchemaRemediation:MaxCompletionAttempts` | Clamped 1–5; each attempt may bill one completion when usage is returned. |
| Polly retries (primary only) | `AgentExecution:Resilience:LlmCallMaxRetryAttempts` (or `AzureOpenAI:MaxRetries` when &gt; 0) | Applies to the **first** schema attempt only via **`CircuitBreakingAgentCompletionClient`**. |
| Remediation client | DI: **`ISchemaRemediationAgentCompletionClient`** | Same economy deployment and accounting stack; **no** Polly retry wrapper (`BuildAzureOpenAiScopedCompletionChainWithoutPollyRetry`). |

**Max billed completions per agent task (worst case):** `(1 + LlmCallMaxRetryAttempts) + (MaxCompletionAttempts − 1)` when retry is enabled. See **`docs/LLM_RETRY_AND_CIRCUIT_BREAKER.md`** § Schema remediation completions (TB-043).

### Hosted public cloud pricing (FND-065)

All three hosted public pricing clients (Azure Retail Prices, AWS Pricing, and GCP Cloud Billing Catalog) use one registration and resilience policy. Each named client owns a separate circuit breaker and connection pool.

- Only bodyless GET and HEAD requests enter the retry policy. One HTTP call allows at most four attempts under the existing five-minute client timeout. This does not set a deadline for consuming a returned stream or for an entire paginated catalog scan.
- Local exponential delays start at one second with up to 25% positive jitter. A valid `Retry-After` delta or HTTP date on 429 or 503 sets a minimum wait. If the selected delay reaches or exceeds the remaining budget, return the last response and do not retry early. Caller cancellation interrupts retry waits.
- Each provider breaker samples completed calls, not individual attempts. It opens after at least five calls in a one-minute sample when all are handled failures, then allows a recovery probe after 30 seconds. A successful recovery probe closes it. An open or recovering provider does not change the other providers' circuit state.

- Each provider admits up to 50 concurrent logical calls per host process, including calls in retry backoff. Excess calls return a local 503 immediately without queuing, retrying, or affecting circuit state. A completed or canceled call releases its slot. Slots cover the HTTP handler call and retries, not subsequent response-body consumption.

The pricing tests cover both header formats on all three named clients, elapsed-budget exhaustion, cancellation, the attempt limit, non-replayed writes, cross-provider failures, recovery, and independent capacity under simulated saturation. They do not measure real vendor latency or establish a distributed concurrency limit.

This change expands adoption only for the hosted pricing clients. Azure Resource Manager, CLI/direct SDK clients, and non-pricing outbound integrations keep their own behavior. The shared external integration breaker already samples completed calls, Jira/ServiceNow health probes use independent clients, and the Jira, ServiceNow, and Azure Boards ticket paths do not automatically replay writes. Broader opt-in for read retry timing, concurrency limits beyond hosted pricing, and provider-specific idempotency verification for other mutation paths remain separate work. Do not adopt the pricing retry settings blindly for writes.

### Webhook and Marketplace delivery (FND-065)

The audit at `b4b23e5` found two independent named breakers, but all webhook destinations shared one and both paths could retry POSTs. The current behavior is:

| Path | Resilience and recovery |
| --- | --- |
| Slack, Teams, and on-call webhooks | The 60-second named client maintains a separate process-local breaker per configured URL, including path and query. Registry keys are digests and are not logged. At 4,096 active or recent destinations the client refuses admission of new destinations until idle entries can be reclaimed. It does not evict recent state or combine unrelated destinations into a shared fallback breaker. The existing HTTP retry, signing, envelope, and transport settings are unchanged. |
| Azure Marketplace manual activation | GET subscription status on a distinct 30-second client before submitting. `Subscribed` needs no POST. An eligible pending subscription can claim one automatic dispatch through an atomic insert into the canonical billing ledger using the subscription ID. The activation client never retries POSTs or follows redirects. The status client can retry GET and stays available when the activation breaker is open. |
| Azure Marketplace plan and quantity updates | These handlers continue to mutate local billing and entitlement state. They do not use the activation submission client. |

[Microsoft's activation contract](https://learn.microsoft.com/en-us/partner-center/marketplace-offers/pc-saas-fulfillment-subscription-api#activate-a-subscription) distinguishes an accepted activation request from confirmed subscription state. After an ambiguous send, a status read showing `Subscribed` allows local fulfillment to continue. A pending status does not prove the submission failed. A later inbound delivery can check again but does not issue a second automatic POST for a claimed subscription. The claim survives a change in webhook payload and process restart when backed by SQL, but it is not delivery confirmation. No claim is required when the provider already reports `Subscribed`.

**Operator recovery:** If the worker stopped after recording a dispatch claim, the request may not have reached Marketplace. Check the subscription and the state of the original request on the provider side before manually completing activation. Do not clear claims as a standard retry mechanism. A hard stop can leave the pre-existing inbound receipt in `Received`; exact redelivery of that receipt is not a substitute for operator reconciliation. Drain workers running the previous activation path before mixing versions on the same workload.

The webhook registry isolates breaker state, not concurrency across hosts. There is still no documented receiver-wide deduplication guarantee for [Slack incoming webhooks](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/) or [Teams webhooks](https://learn.microsoft.com/microsoftteams/platform/webhooks-and-connectors/how-to/add-incoming-webhook). Stable receiver-aware webhook retry rules and broader outbound adoption remain separate work.

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
| Ordered endpoints | `ArchLucid:FallbackLlm:Endpoints` | Yes (canonical) |
| Endpoint URL | `ArchLucid:FallbackLlm:Endpoints[n]:Endpoint` | Yes |
| Chat deployment name | `ArchLucid:FallbackLlm:Endpoints[n]:DeploymentName` | Yes |
| Managed identity | `ArchLucid:FallbackLlm:Endpoints[n]:UseManagedIdentity` | Yes on hosted Container Apps (no API key) |
| API key | `ArchLucid:FallbackLlm:Endpoints[n]:ApiKey` | Yes when `UseManagedIdentity` is false |

If **`Enabled`** is **`true`** but no complete endpoint row exists, the host fails at startup with a clear **`InvalidOperationException`**. Hosted Terraform sets **`UseManagedIdentity=true`**. API-key rows should use Key Vault (see **`docs/CONFIGURATION_KEY_VAULT.md`**). Legacy flat `ArchLucid:FallbackLlm:Endpoint` / `ApiKey` / `DeploymentName` still bind when `Endpoints` is empty.

**Max completion tokens** for the fallback client reuse **`AzureOpenAI:MaxCompletionTokens`** (same default as the primary **`AzureOpenAiCompletionClient`** when unset).

### When fallback runs

After the **primary** chain returns a terminal failure, **`FallbackAgentCompletionClient`** calls the **secondary** chain only when the primary surfaces:

- **`HttpRequestException`** with **`StatusCode`** **429** or **5xx**, or **no status** (network/DNS),
- **`ClientResultException`** / **`RequestFailedException`** with the same HTTP status semantics,
- **`CircuitBreakerOpenException`** (primary gate already open — fallback uses **`OpenAiCompletionFallback`**),
- **`OperationCanceledException`** / **`TaskCanceledException`** when the **caller token is not canceled** (HTTP timeout after Polly retries).

**User cancellation** (`cancellationToken.IsCancellationRequested`) is **not** eligible. Other HTTP client errors (e.g. **400**) are rethrown without fallback. Cross-engine and BYO → ArchLucid-paid failover remain forbidden (ADR 0065 D12).

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
| `archlucid_circuit_breaker_probe_outcomes_total` | Counter | `gate`, `outcome` (`success` / `failure` / `canceled`) | Half-open probe completion paths only. |

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
