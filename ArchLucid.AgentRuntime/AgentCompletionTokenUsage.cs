using ArchLucid.Core.Diagnostics;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Reads token counts from the last <see cref="AzureOpenAiCompletionClient.CompleteJsonAsync" /> on the async flow, if
///     any.
/// </summary>
public static class AgentCompletionTokenUsage
{
    /// <summary>
    ///     Sets <paramref name="inputTokens" /> and <paramref name="outputTokens" /> to <see langword="null" /> when
    ///     unavailable.
    /// </summary>
    public static void TryConsume(out int? inputTokens, out int? outputTokens, out int? reasoningTokens) =>
        LlmCompletionTokenUsageAmbient.TryConsume(out inputTokens, out outputTokens, out reasoningTokens);

    /// <summary>
    ///     Peeks <paramref name="inputTokens" /> and <paramref name="outputTokens" /> without consuming them.
    /// </summary>
    public static void TryPeek(out int? inputTokens, out int? outputTokens, out int? reasoningTokens) =>
        LlmCompletionTokenUsageAmbient.TryPeek(out inputTokens, out outputTokens, out reasoningTokens);
}
