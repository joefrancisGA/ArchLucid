using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Cache telemetry: LLM completion cache, Azure OpenAI prompt cache, hot-path read cache, explanation cache, and
///     graph projection cache.
/// </summary>
/// <remarks>
///     Hit-ratio gauges are observable, so the process-life aggregates below are the source of truth for both the OTel
///     callbacks and <see cref="GetCacheTelemetrySnapshot" />. Counters live in the instrument catalog
///     (<c>ArchLucidInstrumentation.cs</c>) because OTel exporters enumerate them from one <see cref="Meter" />.
/// </remarks>
public static partial class ArchLucidInstrumentation
{
    private static int _llmCompletionCacheObservableInstrumentsRegistered;

    private static int _llmPromptCacheObservableInstrumentsRegistered;

    private static long _llmCompletionCacheHitsAggregate;

    private static long _llmCompletionCacheMissesAggregate;

    private static long _llmCompletionCachePoisonBustsAggregate;

    private static long _llmProviderPromptTokensAggregate;

    private static long _llmProviderCachedPromptTokensAggregate;

    private static long _hotPathReadCacheHitsAggregate;

    private static long _hotPathReadCacheMissesAggregate;

    private static long _hotPathReadCacheInFlightDedupedAggregate;

    private static long _explanationCacheHitsAggregate;

    private static long _explanationCacheMissesAggregate;

    private static long _graphProjectionCacheHitsAggregate;

    private static long _graphProjectionCacheMissesAggregate;

    private static long _graphProjectionCacheOversizedBypassAggregate;

    /// <summary>
    ///     Registers observable LLM completion cache instruments once (<c>CachingLlmCompletionClient</c>).
    /// </summary>
    public static void EnsureLlmCompletionCacheObservableInstrumentsRegistered()
    {
        if (Interlocked.Exchange(ref _llmCompletionCacheObservableInstrumentsRegistered, 1) != 0)

            return;

        AppMeter.CreateObservableGauge(
            "archlucid_llm_cache_hit_ratio",
            () =>
            {
                long hits = Interlocked.Read(ref _llmCompletionCacheHitsAggregate);
                long misses = Interlocked.Read(ref _llmCompletionCacheMissesAggregate);
                long denominator = hits + misses;

                double ratio = denominator == 0 ? 0 : hits / (double)denominator;

                return new Measurement<double>(ratio);
            },
            description:
            "Process-wide LLM completion cache hit ratio (hits / (hits + misses)) from CachingLlmCompletionClient.");
    }

    /// <summary>
    ///     Registers observable Azure OpenAI automatic prompt-cache instruments once
    ///     (<see cref="LlmCachedPromptTokensTotal" /> / <see cref="LlmPromptTokensTotal" />).
    /// </summary>
    public static void EnsureLlmPromptCacheObservableInstrumentsRegistered()
    {
        if (Interlocked.Exchange(ref _llmPromptCacheObservableInstrumentsRegistered, 1) != 0)

            return;

        AppMeter.CreateObservableGauge(
            "archlucid_llm_prompt_cache_hit_ratio",
            () =>
            {
                long promptTokens = Interlocked.Read(ref _llmProviderPromptTokensAggregate);
                long cachedTokens = Interlocked.Read(ref _llmProviderCachedPromptTokensAggregate);

                double ratio = promptTokens == 0 ? 0 : cachedTokens / (double)promptTokens;

                return new Measurement<double>(ratio);
            },
            description:
            "Process-wide Azure OpenAI automatic prompt-cache hit ratio (cached prompt tokens / total prompt tokens).");
    }

    /// <summary>Resets provider prompt-cache aggregates for unit tests only.</summary>
    internal static void TestingResetProviderPromptCacheAggregates()
    {
        Interlocked.Exchange(ref _llmProviderPromptTokensAggregate, 0);
        Interlocked.Exchange(ref _llmProviderCachedPromptTokensAggregate, 0);
    }

    /// <summary>Records one LLM completion response cache hit (label <c>agent_type</c>).</summary>
    public static void RecordLlmCompletionCacheHit(string agentType)
    {
        string label = string.IsNullOrWhiteSpace(agentType) ? "unknown" : agentType.Trim();

        _ = Interlocked.Increment(ref _llmCompletionCacheHitsAggregate);

        TagList tags = [];
        tags.Add("agent_type", label);

        LlmCompletionCacheHitsTotal.Add(1, tags);
    }

    /// <summary>Records one LLM completion response cache miss (label <c>agent_type</c>).</summary>
    public static void RecordLlmCompletionCacheMiss(string agentType)
    {
        string label = string.IsNullOrWhiteSpace(agentType) ? "unknown" : agentType.Trim();

        _ = Interlocked.Increment(ref _llmCompletionCacheMissesAggregate);

        TagList tags = [];
        tags.Add("agent_type", label);

        LlmCompletionCacheMissesTotal.Add(1, tags);
    }

    /// <summary>Records a TB-940 poison bust (cache-served body failed admission / schema).</summary>
    public static void RecordLlmCompletionCachePoisonBust(string agentType)
    {
        string label = string.IsNullOrWhiteSpace(agentType) ? "unknown" : agentType.Trim();

        _ = Interlocked.Increment(ref _llmCompletionCachePoisonBustsAggregate);

        TagList tags = [];
        tags.Add("agent_type", label);

        LlmCompletionCachePoisonBustsTotal.Add(1, tags);
    }

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
