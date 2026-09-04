using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

public static partial class ArchLucidInstrumentation
{
    /// <summary>Aggregate explanation cache hits (<c>CachingRunExplanationSummaryService</c>).</summary>
    public static readonly Counter<long> ExplanationCacheHits =
        AppMeter.CreateCounter<long>(
            "archlucid_explanation_cache_hits_total",
            description: "Aggregate explanation cache hits (via CachingRunExplanationSummaryService).");

    /// <summary>Aggregate explanation cache misses (factory invoked; LLM work may follow).</summary>
    public static readonly Counter<long> ExplanationCacheMisses =
        AppMeter.CreateCounter<long>(
            "archlucid_explanation_cache_misses_total",
            description: "Aggregate explanation cache misses (LLM call required).");

    /// <summary>
    ///     Hits on the in-resolve <c>(packId, version)</c> deserialized content cache inside
    ///     <c>EffectiveGovernanceResolver</c>
    ///     (avoids duplicate JSON work when the same version appears on multiple assignments).
    /// </summary>
    public static readonly Counter<long> GovernancePackContentDeserializeCacheHits =
        AppMeter.CreateCounter<long>("archlucid_governance_pack_content_deserialize_cache_hits");

    /// <summary>Misses on that cache (JSON deserialize executed for a distinct pack version in the resolve call).</summary>
    public static readonly Counter<long> GovernancePackContentDeserializeCacheMisses =
        AppMeter.CreateCounter<long>("archlucid_governance_pack_content_deserialize_cache_misses");

    /// <summary>
    ///     Hot-path read cache concurrent misses coalesced onto an in-flight loader for the same key (TB-2160).
    /// </summary>
    public static readonly Counter<long> HotPathReadCacheInFlightDedupedTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_hot_path_read_cache_inflight_deduped_total",
            description:
            "Concurrent hot-path read cache misses that awaited an in-flight loader instead of invoking the factory again.");

    private static long _hotPathReadCacheHitsAggregate;

    private static long _hotPathReadCacheMissesAggregate;

    private static long _hotPathReadCacheInFlightDedupedAggregate;

    private static long _explanationCacheHitsAggregate;

    private static long _explanationCacheMissesAggregate;

    private static long _graphProjectionCacheHitsAggregate;

    private static long _graphProjectionCacheMissesAggregate;

    private static long _graphProjectionCacheOversizedBypassAggregate;

    /// <summary>Records one hot-path read cache hit (<c>IHotPathReadCache</c> / HybridCache).</summary>
    public static void RecordHotPathReadCacheHit()
    {
        _ = Interlocked.Increment(ref _hotPathReadCacheHitsAggregate);
    }

    /// <summary>Records one hot-path read cache miss (factory invoked).</summary>
    public static void RecordHotPathReadCacheMiss()
    {
        _ = Interlocked.Increment(ref _hotPathReadCacheMissesAggregate);
    }

    /// <summary>Records one hot-path read cache miss coalesced onto an in-flight loader for the same key.</summary>
    public static void RecordHotPathReadCacheInFlightDedupe()
    {
        _ = Interlocked.Increment(ref _hotPathReadCacheInFlightDedupedAggregate);
        HotPathReadCacheInFlightDedupedTotal.Add(1);
    }

    /// <summary>Records one aggregate explanation cache hit.</summary>
    public static void RecordExplanationCacheHit()
    {
        _ = Interlocked.Increment(ref _explanationCacheHitsAggregate);
        ExplanationCacheHits.Add(1);
    }

    /// <summary>Records one aggregate explanation cache miss.</summary>
    public static void RecordExplanationCacheMiss()
    {
        _ = Interlocked.Increment(ref _explanationCacheMissesAggregate);
        ExplanationCacheMisses.Add(1);
    }

    /// <summary>Records one graph snapshot projection cache hit.</summary>
    public static void RecordGraphProjectionCacheHit()
    {
        _ = Interlocked.Increment(ref _graphProjectionCacheHitsAggregate);
    }

    /// <summary>Records one graph snapshot projection cache miss.</summary>
    public static void RecordGraphProjectionCacheMiss()
    {
        _ = Interlocked.Increment(ref _graphProjectionCacheMissesAggregate);
    }

    /// <summary>Records one oversized graph projection that bypassed in-process cache storage.</summary>
    public static void RecordGraphProjectionCacheOversizedBypass()
    {
        _ = Interlocked.Increment(ref _graphProjectionCacheOversizedBypassAggregate);
    }

    /// <summary>Returns process-life cache counters for operator diagnostics.</summary>
    public static CacheTelemetrySnapshot GetCacheTelemetrySnapshot()
    {
        return new CacheTelemetrySnapshot
        {
            HotPathReadCacheHits = Interlocked.Read(ref _hotPathReadCacheHitsAggregate),
            HotPathReadCacheMisses = Interlocked.Read(ref _hotPathReadCacheMissesAggregate),
            HotPathReadCacheInFlightDeduped = Interlocked.Read(ref _hotPathReadCacheInFlightDedupedAggregate),
            ExplanationCacheHits = Interlocked.Read(ref _explanationCacheHitsAggregate),
            ExplanationCacheMisses = Interlocked.Read(ref _explanationCacheMissesAggregate),
            LlmCompletionCacheHits = Interlocked.Read(ref _llmCompletionCacheHitsAggregate),
            LlmCompletionCacheMisses = Interlocked.Read(ref _llmCompletionCacheMissesAggregate),
            GraphProjectionCacheHits = Interlocked.Read(ref _graphProjectionCacheHitsAggregate),
            GraphProjectionCacheMisses = Interlocked.Read(ref _graphProjectionCacheMissesAggregate),
        };
    }
}
