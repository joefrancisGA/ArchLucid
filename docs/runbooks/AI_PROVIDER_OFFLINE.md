> **Scope:** Operator runbook — Azure OpenAI / catalog-engine provider outage, circuit breaker, and same-family FallbackLlm.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Runbook: AI provider offline

**Last reviewed:** 2026-09-05

**Audience:** On-call operators and platform engineers when Real-mode reviews fail because Azure OpenAI (or a workspace customer connection) is unreachable, throttled, or circuit-open.

Use this runbook when the product cannot complete reviews because the **configured AI provider** is down. Do **not** fail over to Simulator in production, and do **not** silently switch engines or BYO → ArchLucid-paid capacity (ADR 0065 D12).

## What the product already does

| Layer | Behavior | Does not do |
|-------|----------|-------------|
| Polly retry (inside the circuit breaker) | Retries the **same** deployment on 429 / 5xx / network / HTTP timeout | Escape a regional outage |
| Circuit breaker | Opens after consecutive failures; rejects new calls until a half-open probe | Page humans by itself |
| **FallbackLlm** (optional, same family) | One attempt on a **second Azure OpenAI** endpoint/deployment after eligible primary failure, including **open primary circuit**, network errors, and timeouts | Cross-engine failover (Anthropic/Gemini/Ollama); BYO → platform-paid; **embeddings** |
| Workspace AI probe + UI | Blocks Real-mode execute while `GET /v1/diagnostics/workspace-ai-availability` reports unavailable | Invent a working model |

Embeddings stay on the ArchLucid-managed Azure OpenAI embedding deployment (ADR 0065 D8). A total primary-resource outage can still block retrieval even when chat FallbackLlm succeeds.

## Symptoms

- Review start / Re-run is blocked; shell banner **Live AI is not ready**.
- `GET /health` `circuit_breakers` gate `OpenAiCompletion` (and often `OpenAiEmbedding`) is **Open**.
- Alert **`ArchLucidCircuitBreakerOpenTf`**.
- Run `LastFailureReason.failureClass` = `circuitBreaker`, `timeout`, or `dependency`.
- Vendor probe detail: HTTP 429 / 5xx / timeout on `azure_openai_live_completion_probe`.

## Immediate triage (first 5 minutes)

1. **Confirm scope.** One workspace vs all tenants. Customer-connection (`aiSource=customer-connection`) is that workspace only — do not enable platform FallbackLlm for BYO.
2. **`GET /health`** (authenticated) → `circuit_breakers` gates: `completion`, `completion_fallback`, `embedding`.
3. **`GET /v1/diagnostics/workspace-ai-availability`** (or UI **Check AI availability**). Note `fallbackLlmEnabled` and `azure_openai_fallback_live_completion_probe` if present.
4. Azure Service Health / Azure OpenAI resource metrics (latency, 429, regional outage).
5. Capture **`X-Correlation-ID`** and a **`support-bundle --zip`**. Do not paste prompts.

## Operator actions by path

### A. FallbackLlm is enabled and fallback probe is OK

Reviews should proceed on the secondary deployment. Traces prefix the deployment name with `fallback:`.

- Watch `OpenAiCompletionFallback` — if it also opens, treat as dual-region outage (section C).
- Do **not** flip `AgentExecution:Mode` to Simulator.

### B. FallbackLlm is disabled (pilot / default)

Hosted Production/Staging ship **`ArchLucid:FallbackLlm:Enabled=false`**. Completions retry then fail closed.

1. Tell users: wait about **one minute** for the primary breaker (hosted production break duration is 45s), then Re-run.
2. If Azure reports a regional outage, enable same-family FallbackLlm (section D) or wait for Azure.
3. Do **not** tell users to change models on Administration → AI models — that does not fix a platform outage.

### C. Primary and fallback both down (or embeddings Open)

Fail closed. Block new Real executes. Communicate an incident.

- Selective re-execute after Azure recovers (`POST /v1/architecture/review/{runId}/execute/selective`).
- Embeddings have **no** regional fallback — if `OpenAiEmbedding` stays Open, RAG/Ask stay degraded even if chat fallback works.

### D. Enable hosted FallbackLlm (platform engineer)

Requires a **second Azure OpenAI** resource (typically another region) with the **same engine family** and structured-output capable chat deployment. Grant **Cognitive Services OpenAI User** to API and Worker identities.

Terraform (`infra/terraform-container-apps`):

```hcl
fallback_llm_enabled             = true
fallback_llm_endpoint            = "https://<fallback>.openai.azure.com/"
fallback_llm_deployment_name     = "<chat-deployment>"
fallback_llm_account_resource_id = "/subscriptions/.../providers/Microsoft.CognitiveServices/accounts/<fallback>"
```

That sets `ArchLucid__FallbackLlm__Enabled=true` plus `Endpoints__0` Endpoint / DeploymentName / `UseManagedIdentity=true`. Startup fails closed if Enabled is true but the endpoint row is incomplete.

API-key fallback rows remain valid for non-hosted profiles (`ArchLucid:FallbackLlm:Endpoints[n]:ApiKey` via Key Vault).

**Do not** point FallbackLlm at a different engine (ADR 0065 D12). **Do not** route BYO failures to ArchLucid-paid capacity unless the workspace has an explicit opt-in (not this runbook).

## User-facing behavior (already shipped)

- Real-mode sessions probe live AI and **block execute** while unavailable.
- Failed-review **Do this next** uses the live probe; outage copy says changing models will not help.
- Circuit-open recovery: wait about one minute, then Re-run; if it stays open, Report a problem.

## What we will not do

- Silent Simulator fallback for buyer/production Real runs (`archlucid try --real` without `--strict-real` is a local operator loop only).
- Silent cross-engine or BYO → paid failover.
- Disable content safety or quality gates to “keep reviews moving.”

## Related

- [`LLM_RETRY_AND_CIRCUIT_BREAKER.md`](../library/LLM_RETRY_AND_CIRCUIT_BREAKER.md)
- [`RESILIENCE_CONFIGURATION.md`](../library/RESILIENCE_CONFIGURATION.md) § LLM model fallback
- [`AGENT_EXECUTION_FAILURES.md`](AGENT_EXECUTION_FAILURES.md)
- [`FIRST_PILOT_TROUBLESHOOTING.md`](FIRST_PILOT_TROUBLESHOOTING.md) § Real-mode / Azure OpenAI
- [`COMMON_ERRORS.md`](COMMON_ERRORS.md) § Real-mode agent timeouts
- ADR [`0065-curated-multi-engine-model-catalog.md`](../architecture/adrs/0065-curated-multi-engine-model-catalog.md) D8 / D12
