# Manifest chunk summarization operations

**Last reviewed:** 2026-05-26

**Scope:** Post-retrieval token budgeting for tenant/prior manifest corpus hits before agent or Ask context assembly.

## What it does

When retrieved manifest chunks (`CorpusKind` = `TenantManifest` or `PriorManifest`) exceed the configured safe token budget, `ManifestChunkSummarizer` replaces the **lowest retrieval-score** manifest chunks first with a short LLM summary prefixed `[Summarized manifest chunk]`. Higher-score chunks stay verbatim until the budget is met.

Summaries are **evidence aids for prompt context only**. They do **not** change golden manifest hashes, commit payloads, or retrieval index documents.

## Configuration

| Key | Default | Purpose |
|-----|---------|---------|
| `Retrieval:ManifestChunkSummarization:Enabled` | `true` | Master switch; when `false`, hits pass through unchanged. |
| `Retrieval:ManifestChunkSummarization:SafeTokenLimit` | `12000` | Estimated input-token budget across **all** hits before summarization runs. |

Set `Enabled` to `false` to disable summarization entirely. Lower `SafeTokenLimit` to summarize sooner under token pressure; raise it when pilots have headroom and you prefer full verbatim excerpts.

Implementation: `ArchLucid.Retrieval.Summarization.ManifestChunkSummarizer` · options type `ManifestChunkSummarizationOptions`.

## Operator signals

1. **Prompt context:** Summarized chunks begin with `[Summarized manifest chunk]` in agent/Ask evidence text.
2. **No separate audit event (V1):** Summarization is deterministic from retrieval hits + config; correlate via run `archlucid.run_id` and retrieval spans.
3. **Telemetry:** Use retrieval duration/chunk histograms documented in [`OBSERVABILITY.md`](../library/OBSERVABILITY.md). After Batch 2, degraded handler fallbacks (distinct from summarization) emit `archlucid_agent_handler_degradations_total`.

## Tuning guidance

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| Agents miss details from large prior manifests | Token budget exceeded; low-score chunks summarized | Raise `SafeTokenLimit` or reduce top-K / corpus breadth; verify high-score chunks remain verbatim |
| LLM cost/latency spikes on retrieval-heavy runs | Summarizer calling completion client for many chunks | Raise `SafeTokenLimit` only if headroom allows; otherwise reduce manifest chunk count at index time |
| Unexpected placeholder agent output | Handler timeout/circuit (not summarization) | Query `archlucid_agent_handler_degradations_total` and run traces for `agent.handler.degraded` events |

## Disable for a deployment

```json
"Retrieval": {
  "ManifestChunkSummarization": {
    "Enabled": false
  }
}
```

Or set `SafeTokenLimit` very high (e.g. `1000000`) to effectively disable summarization without turning off the code path.

## Related docs

- [`CONFIGURATION_REFERENCE.md`](../library/CONFIGURATION_REFERENCE.md) — keys above
- [`DEGRADED_MODE.md`](../library/DEGRADED_MODE.md) — LLM/handler degradation (separate from summarization)
- [`OPERATIONS_LLM_QUOTA.md`](../library/OPERATIONS_LLM_QUOTA.md) — token quotas and LLM metrics
