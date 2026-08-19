# RC6 dev — ephemeral Azure AI Search for ArchLucid RAG

**Owner decision (2026-07-05):** Azure AI Search in RC6 dev (`rg-archlucid-dev`) is not a standing resource. Steady state is `Retrieval:VectorIndex=InMemory` (no `Retrieval__AzureSearch__*` / related env vars on the Container Apps). The search service is created on demand and can be torn down automatically to avoid idle cost, then recreated the next time it's needed.

This applies to **RC6 dev only**. Staging/production use whatever retrieval configuration is set for those environments independently (no auto-heal, no nightly stash).

## Lifecycle

| Trigger | Script | Effect |
|---|---|---|
| Every CD deploy to `dev` | `scripts/deploy/Ensure-RC6AzureSearchRetrieval.ps1` (auto-heal step in `cd.yml`) | Creates the search service + index + OpenAI embedding deployment + Container App wiring **only if missing**. No-op otherwise. |
| Nightly, only when `RAG_STASH_NIGHTLY` repo variable is `true` | `scripts/deploy/Stash-RC6AzureSearchRetrieval.ps1` (`.github/workflows/rag-nightly-stash.yml`, cron) | If the search service looks idle (query volume over the last 24h below threshold), saves the index definition + document count to blob storage, deletes the search service, and reverts the Container Apps to `InMemory`. Skips (leaves it running) when not idle. |
| Manual wake-up | `scripts/deploy/Ensure-RC6AzureSearchRetrieval.ps1` | Same as the CD auto-heal step, run by hand. |
| Manual stash + teardown | `scripts/deploy/Stash-RC6AzureSearchRetrieval.ps1 -Force` | Skips the idle check, stashes, and deletes immediately. |

**Default is keep-alive.** The nightly workflow only acts when the repo variable `RAG_STASH_NIGHTLY` is set to `true`. Unset (or any other value) means the search service, once created, stays up indefinitely — the nightly job is a no-op notice in the Actions log.

```powershell
# Opt in to nightly idle-based stash + teardown
gh variable set RAG_STASH_NIGHTLY --body true

# Opt out (keep-alive, default)
gh variable set RAG_STASH_NIGHTLY --body false
```

## What gets stashed

Only the index *definition* (field schema, vector/semantic config) and the document count — not the indexed content itself. ArchLucid's corpus indexers rebuild content from the system of record on the next wake-up; re-embedding is cheap relative to keeping a search service running 24/7. The manifest is written to:

```
starchlucidevarts / rag-retrieval-stash / archlucid-retrieval-dev/<yyyy-MM-dd>.json
starchlucidevarts / rag-retrieval-stash / archlucid-retrieval-dev/latest.json
```

## Idle detection (known limitation)

The idle check sums the `SearchQueriesPerSecond` Azure Monitor metric over the lookback window. ArchLucid writes chunks via direct SDK push (`MergeOrUpload`), not pull-based indexers, so there is no separate Azure Monitor signal for indexing activity distinct from querying. A quiet query volume is treated as "not actively being used" for MVP purposes. If this proves too aggressive (e.g. a low-traffic but still-wanted index gets stashed), tighten `-IdleQueryThreshold` or `-IdleLookbackHours`, or move to an explicit keep-alive tag instead of metric-based inference.

## Env vars (when awake)

| Env var | Value | Set as |
|---|---|---|
| `Retrieval__VectorIndex` | `AzureSearch` | Literal |
| `Retrieval__AzureSearch__Endpoint` | `https://srch-archlucid-dev.search.windows.net` | Literal |
| `Retrieval__AzureSearch__IndexName` | `archlucid-retrieval-dev` | Literal |
| `Retrieval__AzureSearch__ApiKey` | Search admin key | Secret ref (`archlucid-azure-search-api-key`) |
| `Retrieval__Reranking__Enabled` | `false` (dev) | Literal |
| `AzureOpenAI__Endpoint` | `https://oai-archlucid-dev.cognitiveservices.azure.com/` | Literal |
| `AzureOpenAI__EmbeddingDeploymentName` | `text-embedding-3-small` | Literal |
| `AzureOpenAI__ApiKey` | OpenAI key | Secret ref (`archlucid-azure-openai-api-key`) |

`AzureOpenAI__*` vars are left in place by the nightly stash (the OpenAI account/deployment is not part of this ephemeral cycle — it doesn't accrue idle cost the way a standing Search service does).

## Index schema

`deploy/rc6/archlucid-retrieval-index.json` — field contract: `docs/library/AZURE_AI_SEARCH_INDEX_CONTRACT.md`.
