> **Scope:** ADR 0036 — Graph-RAG embedding strategy (V2 prerequisite) — full detail in the sections below.

> **Spine doc:** [`START_HERE.md`](../../START_HERE.md).

# ADR 0036: Graph-RAG embedding strategy

- **Status:** Proposed
- **Date:** 2026-05-26
- **Supersedes:** *(none)*
- **Superseded by:** *(none)*
- **Amends:** *(none)*

## Context

`GraphSnapshot` at **SchemaVersion 1** is persisted, fingerprinted, and consumed by decisioning and the operator graph API. V2 **RAG-V2-001** (Graph-RAG) needs a pre-locked embedding and refresh strategy so implementation does not re-litigate storage, model choice, or manifest fingerprint rules.

Investigation (2026-05-26) confirmed the graph contract is functionally stable: JSON + MessagePack serialization, relational persistence, canonical fingerprint reuse, and 1-hop traversal via `GraphSnapshotExtensions`.

## Decision

1. **Schema stability:** `GraphSnapshot`, `GraphNode`, and `GraphEdge` at **SchemaVersion 1** are stable as of 2026-05-26. Changes must be additive (new optional fields) or bump `SchemaVersion` with a migration path. Field removals, type changes, and renames are breaking.

2. **Embedding model:** **Azure OpenAI `text-embedding-3-small`** via the existing `AzureOpenAiEmbeddingService` / `IOpenAiEmbeddingClient` wiring (no new subprocessors).

3. **Embedding unit:** One vector per **graph node**, embedding text composed from `NodeType + Label + Category + ReasoningTrace` (deterministic concatenation).

4. **Query-time expansion:** **1-hop** neighbor expansion at query time using existing `GraphSnapshotExtensions.GetOutgoingTargets` / `GetIncomingTargets` — no pre-materialized community summaries.

5. **Vector storage:** **`AzureAiSearchVectorIndex`** (same private-endpoint posture as Ask retrieval per ADR 0031 tenancy rules).

6. **Refresh cadence:** Re-embed on authority commit via the ADR 0004 outbox path (same cadence as RAG chunk indexing).

7. **Fingerprint exclusion:** Node embeddings are **excluded** from `GraphSnapshotCanonicalFingerprint` (same norm as RAG retrieval chunks in `RAG_QUALITY_TECHNICAL_BACKLOG.md`).

8. **Cost gate:** Per-tenant embedding spend remains subject to `LlmMonthlyTenantDollarBudgetTracker`.

9. **Reserved property prefix:** `GraphNode.Properties` keys prefixed with `embedding:` (e.g. `embedding:model`, `embedding:dim`, `embedding:hash`) are reserved for Graph-RAG metadata.

## Rejected alternatives

| Alternative | Reason rejected |
|-------------|-----------------|
| Microsoft GraphRAG community summarization | Per-snapshot LLM summarization cost incompatible with wallet / FinOps model |
| Structural-only embeddings (Node2Vec, GraphSAGE) | Poor fit for small semantic architecture graphs with rich labels |
| Direct Cohere embedding API | Violates V1 Azure-native subprocessor posture |

## Consequences

- **Positive:** V2 Graph-RAG can start without schema churn; embedding and index choices align with existing retrieval infrastructure.
- **Negative:** No Graph-RAG retrieval in V1; operators do not yet see graph-grounded Ask until **RAG-V2-001** ships.
- **Follow-ups:** Promote **RAG-V2-001** only after V1 RAG foundation + semantic reranker + faithfulness harness fail the golden-cohort floor for two consecutive weeks (see `RAG_QUALITY_TECHNICAL_BACKLOG.md`).

## Related

- [`docs/library/KNOWLEDGE_GRAPH.md`](../../library/KNOWLEDGE_GRAPH.md)
- [`docs/library/RAG_QUALITY_TECHNICAL_BACKLOG.md`](../../library/RAG_QUALITY_TECHNICAL_BACKLOG.md) — **RAG-V2-001**
- [ADR 0004](0004-transactional-outbox-retrieval-indexing.md) — outbox refresh
- [ADR 0031](0031-cross-tenant-pattern-library.md) — cross-tenant pattern library boundaries
