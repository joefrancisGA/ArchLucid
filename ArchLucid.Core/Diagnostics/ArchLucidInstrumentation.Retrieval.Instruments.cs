using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

public static partial class ArchLucidInstrumentation
{
    // Instrument catalog

    
    /// <summary>Azure Retail Prices structured lookup used a heuristic monthly USD estimate (Improvement #6).</summary>
    public static readonly Counter<long> AzureRetailPricesHeuristicFallbackTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_azure_retail_prices_heuristic_fallback_total",
            description: "Azure Retail Prices catalog miss resolved via heuristic SKU estimate.");

    
    /// <summary>Wall time for Graph-RAG neighbor expansion per retrieval query.</summary>
    public static readonly Histogram<double> GraphRagExpansionLatencyMilliseconds =
        AppMeter.CreateHistogram<double>(
            "graph_rag_expansion_latency_ms",
            "ms",
            "Wall time for Graph-RAG 1-hop neighbor expansion.");

    
    /// <summary>Graph-RAG 1-hop neighbor hits appended during retrieval expansion (V1 §2.20).</summary>
    public static readonly Counter<long> GraphRagNeighborsAddedTotal =
        AppMeter.CreateCounter<long>(
            "graph_rag_neighbors_added_total",
            description: "Graph-RAG neighbor chunks appended during retrieval expansion.");

    
    /// <summary>
    ///     Per provenance response: fraction of manifest decisions with finding, rule, and graph-context edges (0.0–1.0).
    /// </summary>
    public static readonly Histogram<double> ProvenanceCompleteness = AppMeter.CreateHistogram<double>(
        "archlucid_provenance_completeness_ratio",
        description: "Decision provenance traceability completeness ratio (0.0–1.0).");

    
    /// <summary>
    ///     Chunks returned per retrieval search grouped by <c>corpus_kind</c> (Improvement 7; histogram not counter
    ///     per assessment spec).
    /// </summary>
    public static readonly Histogram<int> RagChunksRetrieved =
        AppMeter.CreateHistogram<int>(
            "archlucid_rag_chunks_retrieved_total",
            "{chunk}",
            "Number of retrieval chunks returned per vector search (label corpus_kind).");

    
    /// <summary>
    ///     Wall time for vector retrieval search (embed + index query; labels <c>corpus_kind</c> = single kind,
    ///     <c>mixed</c>, or <c>none</c> when empty).
    /// </summary>
    public static readonly Histogram<double> RagRetrievalDurationMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid_rag_retrieval_duration_ms",
            "ms",
            "Wall time for RAG vector retrieval (embed + vector index search).");

    
    /// <summary>Ask path fell back to SQL findings/manifest text when vector retrieval failed.</summary>
    public static readonly Counter<long> RagRetrievalFallbackTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_rag_retrieval_fallback_total",
            description: "Ask retrieval fell back to SQL text search after vector index failure.");

    
    /// <summary>Startup corpus indexer failures (fail-open) by corpus kind (TB-046).</summary>
    public static readonly Counter<long> RetrievalCorpusStartupIndexerFailureTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_retrieval_corpus_startup_indexer_failure_total",
            description: "Startup corpus indexer failures by corpus kind.");

    
    /// <summary>Retrieval chunks skipped because stored/query embedding dimensions differ (TB-045).</summary>
    public static readonly Counter<long> RetrievalEmbeddingDimensionMismatchTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_retrieval_embedding_dimension_mismatch_total",
            description: "Retrieval chunks skipped because stored/query embedding dimensions differ.");

    
    /// <summary>
    ///     Fraction of retrieved RAG chunks cited in agent output (0.0–1.0).
    /// </summary>
    public static readonly Histogram<double> RetrievalFaithfulnessRatio = AppMeter.CreateHistogram<double>(
        "archlucid_retrieval_faithfulness_ratio",
        description: "Heuristic faithfulness of agent output vs retrieved RAG chunks (0.0–1.0).");

    
    /// <summary>Retrieval documents whose prior chunks were removed due to chunking fingerprint change (TB-047).</summary>
    public static readonly Counter<long> RetrievalIndexChunkingFingerprintInvalidatedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_retrieval_index_chunking_fingerprint_invalidated_total",
            description: "Retrieval documents whose chunks were removed before re-index due to chunking fingerprint change.");

    
    /// <summary>Retrieval documents re-indexed after content or chunking changes (TB-046 / TB-047).</summary>
    public static readonly Counter<long> RetrievalIndexDocumentReindexedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_retrieval_index_documents_reindexed_total",
            description: "Retrieval documents embedded and upserted.");

    
    /// <summary>Retrieval documents skipped because ContentHash and chunking fingerprint are unchanged (TB-046).</summary>
    public static readonly Counter<long> RetrievalIndexDocumentSkippedUnchangedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_retrieval_index_documents_skipped_unchanged_total",
            description: "Retrieval documents skipped because content hash and chunking fingerprint are unchanged.");

    
    /// <summary>Post-vector semantic rerank wall time (Improvement #23).</summary>
    public static readonly Histogram<double> RetrievalRerankLatencyMilliseconds =
        AppMeter.CreateHistogram<double>(
            "archlucid.rerank.latency_ms",
            "ms",
            "Wall time for retrieval rerank (semantic ranker or lexical fallback).");
}
