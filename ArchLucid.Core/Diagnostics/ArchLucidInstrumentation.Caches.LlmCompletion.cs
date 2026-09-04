using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

public static partial class ArchLucidInstrumentation
{
    /// <summary>LLM completion response cache hits (<c>CachingLlmCompletionClient</c>, label <c>agent_type</c>).</summary>
    public static readonly Counter<long> LlmCompletionCacheHitsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_cache_hits_total",
            description: "LLM completion response cache hits (label: agent_type).");

    /// <summary>LLM completion response cache misses (<c>CachingLlmCompletionClient</c>, label <c>agent_type</c>).</summary>
    public static readonly Counter<long> LlmCompletionCacheMissesTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_cache_misses_total",
            description: "LLM completion response cache misses (label: agent_type).");

    /// <summary>
    ///     Completion-cache entries removed after a cache-served body failed wire/schema admission (TB-940 poison bust).
    /// </summary>
    public static readonly Counter<long> LlmCompletionCachePoisonBustsTotal =
        AppMeter.CreateCounter<long>(
            "archlucid_llm_cache_poison_busts_total",
            description: "LLM completion cache poison busts after cache-served admission failure (label: agent_type).");

    private static int _llmCompletionCacheObservableInstrumentsRegistered;

    private static int _llmPromptCacheObservableInstrumentsRegistered;

    private static long _llmCompletionCacheHitsAggregate;

    private static long _llmCompletionCacheMissesAggregate;

    private static long _llmCompletionCachePoisonBustsAggregate;

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
                long promptTokens = ArchLucidLlmMeters.ReadProviderPromptTokensAggregate();
                long cachedTokens = ArchLucidLlmMeters.ReadProviderCachedPromptTokensAggregate();

                double ratio = promptTokens == 0 ? 0 : cachedTokens / (double)promptTokens;

                return new Measurement<double>(ratio);
            },
            description:
            "Process-wide Azure OpenAI automatic prompt-cache hit ratio (cached prompt tokens / total prompt tokens).");
    }

    /// <summary>Resets provider prompt-cache aggregates for unit tests only.</summary>
    internal static void TestingResetProviderPromptCacheAggregates() =>
        ArchLucidLlmMeters.TestingResetProviderPromptCacheAggregates();

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
}
