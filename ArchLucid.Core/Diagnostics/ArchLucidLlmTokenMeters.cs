namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     LLM token counters, histograms, and budget-exceeded instruments (pass-6 sub-meter; pass-16 partial split).
/// </summary>
public static partial class ArchLucidLlmMeters
{
    private static long _llmProviderPromptTokensAggregate;

    private static long _llmProviderCachedPromptTokensAggregate;

    private static readonly AsyncLocal<AgentExecutionLlmCallAccumulator?> LlmCallsPerRunAccumulator = new();

    internal static long ReadProviderPromptTokensAggregate() =>
        Interlocked.Read(ref _llmProviderPromptTokensAggregate);

    internal static long ReadProviderCachedPromptTokensAggregate() =>
        Interlocked.Read(ref _llmProviderCachedPromptTokensAggregate);

    internal static void TestingResetProviderPromptCacheAggregates()
    {
        Interlocked.Exchange(ref _llmProviderPromptTokensAggregate, 0);
        Interlocked.Exchange(ref _llmProviderCachedPromptTokensAggregate, 0);
    }
}
