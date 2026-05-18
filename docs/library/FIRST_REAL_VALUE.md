> **Scope:** Evaluators who want the shipped `archlucid try` Docker stack to call their Azure OpenAI instead of the simulator; not production deployment architecture, cost governance beyond the noted token default, or ADR-level rationale (see the linked ADR).

**V1 alignment:** Pilot happy path supports **simulator or real** execution ([`V1_SCOPE.md`](V1_SCOPE.md), review lifecycle). **`AgentExecution:Mode=Simulator`** remains the **default** in templates and is what **dev/CI** should use unless you are deliberately exercising Azure OpenAI ([`GLOSSARY.md`](GLOSSARY.md) — *Simulator mode / Real mode*). This page describes the **opt-in real** path only.

# First real value (`archlucid try --real`)

**Audience:** Evaluators who want the same **demo stack** as `archlucid try`, but with **Azure OpenAI** completing agents instead of the deterministic simulator.

## What you need

1. **Shell gate (opt-in):** set **`ARCHLUCID_REAL_AOAI=1`** in the environment where you run the CLI. Without this, `--real` is ignored for safety (no surprise spend against a subscription you did not intend).
2. **Azure OpenAI credentials** in the environment (validated before compose):
   - `AZURE_OPENAI_ENDPOINT`
   - `AZURE_OPENAI_API_KEY`
   - `AZURE_OPENAI_DEPLOYMENT_NAME`
3. **Optional cost cap:** `AZURE_OPENAI_MAX_COMPLETION_TOKENS` (defaults to **1024** in the `docker-compose.real-aoai.yml` overlay when unset).

### Required Azure OpenAI configuration at the host (canonical keys)

When the API/Worker process runs with **`AgentExecution:Mode=Real`** and **`AgentExecution:CompletionClient`** is **not** **`Echo`**, startup validation requires all of:

| Setting | Typical sources |
|--------|-----------------|
| **`AzureOpenAI:Endpoint`** | `AzureOpenAI__Endpoint`, `AZURE_OPENAI_ENDPOINT` |
| **`AzureOpenAI:ApiKey`** | Key Vault / user secrets — never log; see [`CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md) |
| **`AzureOpenAI:DeploymentName`** | `AZURE_OPENAI__DeploymentName`, `AZURE_OPENAI_DEPLOYMENT_NAME` |

Optional: **`AzureOpenAI:MaxCompletionTokens`** — must be **0** (use product default, typically 4096) or **1–262144** inclusive; otherwise startup fails.

**`Echo` completion client:** If **`AgentExecution:CompletionClient=Echo`**, the host does **not** require Azure OpenAI keys (offline completion stack). That is distinct from **`Simulator`** mode but is still a non-production evaluator pattern.

Full operator key list: [`CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md) (`AzureOpenAI:*`, `AgentExecution:*`).

## What the CLI does

- Runs **`docker compose`** with **`docker-compose.demo.yml`** plus **`docker-compose.real-aoai.yml`**, which sets `AgentExecution__Mode=Real` and maps the Azure OpenAI settings into the API container.
- Sends **`X-ArchLucid-Pilot-Try-Real-Mode: 1`** on execute so the host can emit **`FirstRealValueRun*`** audit events and real-mode telemetry counters.
- If execute fails in real mode and you did **not** pass **`--strict-real`**, the CLI falls back to **`seed-fake-results`** with `pilotTryRealModeFellBack=true`, marks the run, and the first-value Markdown gains a **warning callout** plus an **Execution provenance** footer (see [`ExecutionProvenanceFooterRenderer`](../../ArchLucid.Application/Pilots/ExecutionProvenanceFooterRenderer.cs)).
- **`--strict-real`** is for smoke jobs that must **fail** instead of substituting simulator output (for example CI that is not allowed to mask AOAI outages).

## Operator triage

See **[`docs/runbooks/AGENT_EXECUTION_FAILURES.md`](../runbooks/AGENT_EXECUTION_FAILURES.md)** — real-mode and fallback behaviour are documented there.

### Host behavior: `AgentExecution:Mode=Real` validation

Rules live in **`ArchLucid.Host.Core`** → **`AgentExecutionRules`** (called from **`ArchLucidConfigurationRules.CollectErrors`**).

- **`AgentExecution:Mode`** must be **`Simulator`** or **`Real`** (case-insensitive). Any other value is a startup error.
- When **`Real`** and not **`Echo`**: missing **`AzureOpenAI:Endpoint`**, **`ApiKey`**, or **`DeploymentName`** adds an error whose text tells you to set **`AZURE_OPENAI_*`** or the colon configuration keys (same requirement as the table above).
- Invalid **`AgentExecution:CompletionClient`** (other than **`Echo`**, **`AzureOpenAi`**, or omitted) fails startup with a dedicated message.
- **`AzureOpenAI:MaxCompletionTokens`** out of range fails startup (see above).

On **Production** or **Staging** hosts (or **`ARCHLUCID_ENVIRONMENT`** Production/Staging), **`RealModeDeploymentFingerprintRules`** also rejects **`AzureOpenAI:DeploymentName`** that is blank or matches **`AgentExecutionTraceModelMetadata`** sentinels (**`unspecified-deployment`**, **`AgentExecution:Simulator`**, or names starting with **`fallback:`**). See **`docs/library/AGENT_TRACE_FORENSICS.md`**.

If any rule fails, **API** and **Worker** hosts **fail fast** after building the app: they log one **Error** line per problem, then throw **`InvalidOperationException`** with message **`ArchLucid configuration is invalid. Fix the settings listed in the logs above, then restart.`** (`ArchLucid.Api` / `ArchLucid.Worker` **`Program.cs`**).

When validation **passes** and you are in **Real** mode with Azure keys configured (and not **`Echo`**), the host logs a single **Information** line: **`AgentExecution:Mode is Real and Azure OpenAI settings (Endpoint, ApiKey, DeploymentName) are configured.`** — use it as a positive smoke check in container logs.

### Logs when Real mode is misconfigured

Look for:

1. **`Startup configuration error: {Error}`** — **Error** level; `{Error}` is sanitized. The Azure-incomplete case includes the string **`AgentExecution:Mode is 'Real' but Azure OpenAI is not fully configured`** and mentions **`AZURE_OPENAI_ENDPOINT`**, **`AZURE_OPENAI_API_KEY`**, **`AZURE_OPENAI_DEPLOYMENT_NAME`** (or **`AzureOpenAI:`** keys).
2. Process exit / crash: **`ArchLucid configuration is invalid. Fix the settings listed in the logs above, then restart.`**

No Azure call is attempted until configuration is valid and the process stays up.

### Quota, budgets, and caching — metrics to verify

Custom instruments are on meter **`ArchLucid`** (see **[`OBSERVABILITY.md`](OBSERVABILITY.md)** for exporters: Application Insights, OTLP, Prometheus). Names below match **`ArchLucid.Core.Diagnostics.ArchLucidInstrumentation`**.

| Concern | Metric(s) | Notes |
|---------|-----------|--------|
| **Pre-call quota / budget rejection** | **`archlucid_llm_quota_exceeded_total`** | Increments when a completion is rejected by sliding-window token quota or UTC-day / related budget logic before the outbound call ([`OPERATIONS_LLM_QUOTA.md`](OPERATIONS_LLM_QUOTA.md)). |
| **LLM completion response cache** | **`archlucid_llm_cache_hits_total`**, **`archlucid_llm_cache_misses_total`** | Label **`agent_type`**. Misses imply cache bypass or cold key; paired with hits shows cache effectiveness. |
| **LLM cache hit ratio (process)** | **`archlucid_llm_cache_hit_ratio`** | Observable gauge: **`hits / (hits + misses)`** for the LLM completion cache aggregate (0 when no traffic yet). |
| **Successful completions per run batch** | **`archlucid_llm_calls_per_run`** | Histogram (unit **`{call}`**): count of successful JSON completions in one **`RealAgentExecutor.ExecuteAsync`** batch. Stays flat in **Simulator** mode. |
| **Aggregate explanation cache** (separate from LLM completion cache) | **`archlucid_explanation_cache_hits_total`**, **`archlucid_explanation_cache_misses_total`** | For **`CachingRunExplanationSummaryService`**; PromQL hit ratio pattern in **[`OBSERVABILITY.md`](OBSERVABILITY.md)** under **Business-Level KPI Metrics**. |
| **Retries / circuit breaker** (LLM path) | **`archlucid_llm_call_retries_total`**, **`archlucid_circuit_breaker_rejections_total`**, **`archlucid_circuit_breaker_state`** | Correlate with AOAI throttling or gateway issues. |

Until an exporter is configured, these series exist **in-process only** ([`OBSERVABILITY.md`](OBSERVABILITY.md) — export path table).

## Architecture decision

ADR **[`docs/architecture/adrs/0033-first-real-value-single-env-var-flip.md`](../architecture/adrs/0033-first-real-value-single-env-var-flip.md)**.
