using System.Diagnostics;
using System.Diagnostics.Metrics;

using ArchLucid.Core.Retrieval;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Retrieval / RAG telemetry recording (vector search, rerank, Graph-RAG, index outbox signals).
/// </summary>
/// <remarks>
///     Instrument field declarations remain in <c>ArchLucidInstrumentation.cs</c> so the meter catalog stays one place;
///     this partial owns the recording helpers that mutate those instruments.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
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
