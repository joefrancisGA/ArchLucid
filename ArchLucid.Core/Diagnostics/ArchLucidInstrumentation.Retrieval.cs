using System.Diagnostics;
using System.Diagnostics.Metrics;

using ArchLucid.Core.Retrieval;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Retrieval / RAG telemetry recording (vector search, rerank, Graph-RAG, index outbox signals).
/// </summary>
/// <remarks>
///     Instrument field declarations for retrieval/RAG telemetry live in this partial on the shared
///     <see cref="Meter" />; this file also owns recording helpers and
///     this partial owns the recording helpers that mutate those instruments.
/// </remarks>
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

    private static Func<bool>? _retrievalTelemetryPerTenantTagCircuitBreaker;

    /// <summary>
    ///     Supplies the RAG per-tenant tag circuit breaker (drops <c>tenant_id</c> when tenant estimates exceed safe
    ///     thresholds).
    /// </summary>
    public static void SetRetrievalTelemetryPerTenantTagCircuitBreaker(Func<bool>? shouldSuppressTenantIdTags) =>
        Volatile.Write(ref _retrievalTelemetryPerTenantTagCircuitBreaker, shouldSuppressTenantIdTags);

    /// <summary>Records one Ask SQL retrieval fallback after vector search failure.</summary>
    public static void RecordRagRetrievalFallback()
    {
        RagRetrievalFallbackTotal.Add(1);
    }

    /// <summary>Records one retrieval embedding dimension mismatch skip (TB-045).</summary>
    public static void RecordRetrievalEmbeddingDimensionMismatch()
    {
        RetrievalEmbeddingDimensionMismatchTotal.Add(1);
    }

    /// <summary>Records one retrieval document skipped because ContentHash and chunking fingerprint are unchanged.</summary>
    public static void RecordRetrievalIndexDocumentSkippedUnchanged()
    {
        RetrievalIndexDocumentSkippedUnchangedTotal.Add(1);
    }

    /// <summary>Records one retrieval document re-indexed.</summary>
    public static void RecordRetrievalIndexDocumentReindexed()
    {
        RetrievalIndexDocumentReindexedTotal.Add(1);
    }

    /// <summary>Records chunk removal before re-index due to chunking fingerprint change.</summary>
    public static void RecordRetrievalIndexChunkingFingerprintInvalidated()
    {
        RetrievalIndexChunkingFingerprintInvalidatedTotal.Add(1);
    }

    /// <summary>Records one startup corpus indexer failure for the given corpus kind.</summary>
    public static void RecordRetrievalCorpusStartupIndexerFailure(string corpusKind)
    {
        KeyValuePair<string, object?> tag = new("corpus_kind", corpusKind);
        RetrievalCorpusStartupIndexerFailureTotal.Add(1, tag);
    }

    /// <summary>
    ///     Records RAG vector search latency and per-<paramref name="hits" /> corpus chunk counts (Improvement 7).
    ///     Omits <c>tenant_id</c> tags by default (high cardinality); callers pass <paramref name="recordPerTenant" />
    ///     only for bounded tenant counts.
    /// </summary>
    public static void RecordRagRetrievalSearch(
        double durationMilliseconds,
        IReadOnlyList<RetrievalHit> hits,
        Guid tenantId,
        bool recordPerTenant = false)
    {
        if (durationMilliseconds < 0 || double.IsNaN(durationMilliseconds) || double.IsInfinity(durationMilliseconds))
            return;

        string corpusKindLabel = ResolveRagRetrievalCorpusKindLabel(hits);

        bool emitTenantId = ShouldEmitRagRetrievalTenantIdTag(recordPerTenant, tenantId);

        TagList durationTags = new() { { "corpus_kind", corpusKindLabel } };

        if (emitTenantId)
            durationTags.Add("tenant_id", tenantId.ToString("D"));

        RagRetrievalDurationMilliseconds.Record(durationMilliseconds, durationTags);

        if (hits is null || hits.Count == 0)
        {
            TagList emptyTags = new() { { "corpus_kind", "none" } };

            if (emitTenantId)
                emptyTags.Add("tenant_id", tenantId.ToString("D"));

            RagChunksRetrieved.Record(0, emptyTags);

            return;
        }

        Dictionary<string, int> countsByCorpus = new(StringComparer.Ordinal);

        foreach (RetrievalHit hit in hits)
        {
            if (hit is null)
                continue;

            string kind = string.IsNullOrWhiteSpace(hit.CorpusKind) ? "unknown" : hit.CorpusKind.Trim();

            countsByCorpus.TryGetValue(kind, out int existing);
            countsByCorpus[kind] = existing + 1;
        }

        foreach (KeyValuePair<string, int> pair in countsByCorpus)
        {
            TagList chunkTags = new() { { "corpus_kind", pair.Key } };

            if (emitTenantId)
                chunkTags.Add("tenant_id", tenantId.ToString("D"));

            RagChunksRetrieved.Record(pair.Value, chunkTags);
        }
    }


    private static bool ShouldEmitRagRetrievalTenantIdTag(bool recordPerTenant, Guid tenantId)
    {
        if (!recordPerTenant || tenantId == Guid.Empty)
            return false;

        Func<bool>? circuitBreaker = Volatile.Read(ref _retrievalTelemetryPerTenantTagCircuitBreaker);

        if (circuitBreaker is not null && circuitBreaker.Invoke())
            return false;

        return true;
    }

    /// <summary>Records <see cref="RetrievalRerankLatencyMilliseconds" /> for a completed rerank call.</summary>
    public static void RecordRetrievalRerankLatency(double durationMilliseconds, int resultCount)
    {
        if (durationMilliseconds < 0 || double.IsNaN(durationMilliseconds) || double.IsInfinity(durationMilliseconds))
            return;

        TagList tags = new() { { "result_count", Math.Clamp(resultCount, 0, 50).ToString() } };
        RetrievalRerankLatencyMilliseconds.Record(durationMilliseconds, tags);
    }

    /// <summary>Records Graph-RAG neighbor expansion counters and latency (V1 §2.20).</summary>
    public static void RecordGraphRagExpansion(int neighborsAdded, double expansionLatencyMilliseconds)
    {
        if (neighborsAdded > 0)
            GraphRagNeighborsAddedTotal.Add(neighborsAdded);

        if (expansionLatencyMilliseconds < 0
            || double.IsNaN(expansionLatencyMilliseconds)
            || double.IsInfinity(expansionLatencyMilliseconds))
            return;

        GraphRagExpansionLatencyMilliseconds.Record(expansionLatencyMilliseconds);
    }


    private static string ResolveRagRetrievalCorpusKindLabel(IReadOnlyList<RetrievalHit>? hits)
    {
        if (hits is null || hits.Count == 0)
            return "none";

        HashSet<string> kinds = new(StringComparer.Ordinal);

        foreach (RetrievalHit hit in hits)
        {
            if (hit is null)
                continue;

            string kind = string.IsNullOrWhiteSpace(hit.CorpusKind) ? "unknown" : hit.CorpusKind.Trim();
            kinds.Add(kind);
        }

        if (kinds.Count == 0)
            return "none";

        if (kinds.Count == 1)
            return kinds.First();

        return "mixed";
    }

    /// <summary>Records <see cref="RetrievalFaithfulnessRatio" /> (clamped 0–1) with tenant and corpus tags.</summary>
    public static void RecordRetrievalFaithfulnessRatio(
        double ratio,
        Guid tenantId,
        IReadOnlyList<RetrievalHit>? hits)
    {
        double clamped = Math.Clamp(ratio, 0.0, 1.0);
        string corpusSource = ResolveRagRetrievalCorpusKindLabel(hits);
        TagList tags = new() { { "corpus_source", corpusSource } };

        if (tenantId != Guid.Empty)
            tags.Add("tenant_id", tenantId.ToString("D"));

        RetrievalFaithfulnessRatio.Record(clamped, tags);
    }

    /// <summary>Records one heuristic Azure Retail Prices fallback row (Improvement #6).</summary>
    public static void RecordAzureRetailPricesHeuristicFallback(string serviceName, string sku)
    {
        AzureRetailPricesHeuristicFallbackTotal.Add(
            1,
            new KeyValuePair<string, object?>("service_name", serviceName),
            new KeyValuePair<string, object?>("sku", sku));
    }
}
