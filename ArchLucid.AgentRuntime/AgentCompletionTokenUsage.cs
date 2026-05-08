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
    public static void TryConsume(out int? inputTokens, out int? outputTokens, out int? reasoningTokens)
    {
        if (AzureOpenAiCompletionClient.TryConsumeLastCompletionTokenUsage(out int p, out int c, out int r)
            && (p > 0 || c > 0 || r > 0))
        {
            inputTokens = p;
            outputTokens = c;
            reasoningTokens = r > 0 ? r : null;

            return;
        }

        inputTokens = null;
        outputTokens = null;
        reasoningTokens = null;
    }

    /// <summary>
    ///     Peeks <paramref name="inputTokens" /> and <paramref name="outputTokens" /> without consuming them.
    /// </summary>
    public static void TryPeek(out int? inputTokens, out int? outputTokens, out int? reasoningTokens)
    {
        if (AzureOpenAiCompletionClient.TryPeekLastCompletionTokenUsage(out int p, out int c, out int r)
            && (p > 0 || c > 0 || r > 0))
        {
            inputTokens = p;
            outputTokens = c;
            reasoningTokens = r > 0 ? r : null;

            return;
        }

        inputTokens = null;
        outputTokens = null;
        reasoningTokens = null;
    }
}
