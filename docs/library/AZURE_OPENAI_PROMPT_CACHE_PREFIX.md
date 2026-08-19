> **Scope:** contributor-reference — Azure OpenAI automatic prompt-cache prefix ordering, telemetry, and authoring guardrails (TB-681, TB-2159).

# Azure OpenAI automatic prompt-cache prefix contract

**TB-681** (prefix ordering) and **TB-2159** (telemetry + authoring guardrails).

## Goal

Maximize Azure OpenAI **automatic prompt-cache** hits: identical input-token prefixes across calls receive discounted cached-input billing when the deployment supports prompt caching.

This is **not** the app-level `CachingLlmCompletionClient` cache (`archlucid_llm_cache_hit_ratio`).

## Assembly order (must not regress)

For quad-agent user prompts (`AgentUserPromptComposer`):

1. **Static prefix** — agent action line, cloud guidance, and `Important guidance:` rules (`AgentUserPromptStaticPrefix`).
2. **Per-run header** — `RunId`, `TaskId`, `AgentType` (`AgentUserPromptBuilder.AppendRunHeader`).
3. **Dynamic DATA** — architecture request, evidence package, retrieval hits (quarantined via `CustomerContentPromptDelimiters`).
4. **Technology ledger** — appended after composer output (`TechnologyLedgerUserPromptInjection.AppendLedgerContext`).

System prompts remain versioned templates in `ArchLucid.AgentRuntime/Prompts/*SystemPromptTemplate.cs` and are sent separately from user content.

## Forbidden in the static prefix

Do **not** interpolate per-run or per-request volatile values before the run header:

- timestamps, correlation IDs, trace IDs, GUIDs (except fixed template examples),
- tenant/workspace/project identifiers,
- retrieval hits or evidence excerpts.

## Telemetry

- Counter: `archlucid_llm_cached_prompt_tokens_total` (provider-reported cached input tokens).
- Gauge: `archlucid_llm_prompt_cache_hit_ratio` = cached prompt tokens ÷ total prompt tokens (process-wide).

Gate any buyer-facing latency or cost claim on measured hit ratio from a staging Real cohort — not on engineering estimates.

## Tests

- Ordering: `ArchLucid.AgentRuntime.Tests/AgentUserPromptPrefixOrderingTests.cs`
- Byte-stable static prefix hash across different `RunId` values (same request/evidence/task).
