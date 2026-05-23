namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Per-async-flow token counts from the most recent LLM chat completion on the current thread.
/// </summary>
/// <remarks>
///     Lives in Core so HTTP middleware can expose usage headers without referencing <c>ArchLucid.AgentRuntime</c>.
/// </remarks>
public static class LlmCompletionTokenUsageAmbient
{
    private static readonly AsyncLocal<(int Prompt, int Completion, int Reasoning)?> LastCompletionTokenUsage = new();

    /// <summary>Clears any recorded usage for the current async flow.</summary>
    public static void Clear() => LastCompletionTokenUsage.Value = null;

    /// <summary>Records token counts when at least one value is positive.</summary>
    public static void Record(int promptTokens, int completionTokens, int reasoningTokens)
    {
        if (promptTokens > 0 || completionTokens > 0 || reasoningTokens > 0)
            LastCompletionTokenUsage.Value = (promptTokens, completionTokens, reasoningTokens);
    }

    /// <summary>
    ///     Peeks <paramref name="inputTokens" /> and <paramref name="outputTokens" /> without consuming them.
    /// </summary>
    public static void TryPeek(out int? inputTokens, out int? outputTokens, out int? reasoningTokens)
    {
        if (TryPeekRaw(out int promptTokens, out int completionTokens, out int reasoningTokensRaw)
            && (promptTokens > 0 || completionTokens > 0 || reasoningTokensRaw > 0))
        {
            inputTokens = promptTokens;
            outputTokens = completionTokens;
            reasoningTokens = reasoningTokensRaw > 0 ? reasoningTokensRaw : null;

            return;
        }

        inputTokens = null;
        outputTokens = null;
        reasoningTokens = null;
    }

    /// <summary>
    ///     Sets <paramref name="inputTokens" /> and <paramref name="outputTokens" /> to <see langword="null" /> when
    ///     unavailable.
    /// </summary>
    public static void TryConsume(out int? inputTokens, out int? outputTokens, out int? reasoningTokens)
    {
        if (TryConsumeRaw(out int promptTokens, out int completionTokens, out int reasoningTokensRaw)
            && (promptTokens > 0 || completionTokens > 0 || reasoningTokensRaw > 0))
        {
            inputTokens = promptTokens;
            outputTokens = completionTokens;
            reasoningTokens = reasoningTokensRaw > 0 ? reasoningTokensRaw : null;

            return;
        }

        inputTokens = null;
        outputTokens = null;
        reasoningTokens = null;
    }

    /// <summary>Consumes raw token usage from the current async flow, if any.</summary>
    public static bool TryConsumeRaw(
        out int promptTokens,
        out int completionTokens,
        out int reasoningTokens)
    {
        (int Prompt, int Completion, int Reasoning)? raw = LastCompletionTokenUsage.Value;
        LastCompletionTokenUsage.Value = null;

        if (raw is { } value)
        {
            promptTokens = value.Prompt;
            completionTokens = value.Completion;
            reasoningTokens = value.Reasoning;

            return true;
        }

        promptTokens = 0;
        completionTokens = 0;
        reasoningTokens = 0;

        return false;
    }

    /// <summary>Peeks raw token usage from the current async flow without consuming it.</summary>
    public static bool TryPeekRaw(
        out int promptTokens,
        out int completionTokens,
        out int reasoningTokens)
    {
        (int Prompt, int Completion, int Reasoning)? raw = LastCompletionTokenUsage.Value;

        if (raw is { } value)
        {
            promptTokens = value.Prompt;
            completionTokens = value.Completion;
            reasoningTokens = value.Reasoning;

            return true;
        }

        promptTokens = 0;
        completionTokens = 0;
        reasoningTokens = 0;

        return false;
    }

    /// <summary>Test hook: seeds token usage read by peek/consume helpers on this async flow.</summary>
    internal static void TestingSeed(int promptTokens, int completionTokens, int reasoningTokens = 0) =>
        LastCompletionTokenUsage.Value = (promptTokens, completionTokens, reasoningTokens);
}
