namespace ArchLucid.AgentRuntime;

/// <summary>
///     Normalizes provider completion usage for USD estimates. OpenAI-compatible APIs report
///     <c>completion_tokens</c> as the full output count and
///     <c>completion_tokens_details.reasoning_tokens</c> as a subset included in that total — bill visible
///     completion minus reasoning at the output rate and reasoning at the reasoning rate.
/// </summary>
public static class LlmCompletionUsageBillingNormalization
{
    public readonly record struct BillableTokenCounts(int Prompt, int Output, int Reasoning);

    public static BillableTokenCounts NormalizeForCostEstimate(int promptTokens, int completionTokens, int reasoningTokens)
    {
        int prompt = Math.Max(0, promptTokens);
        int completion = Math.Max(0, completionTokens);
        int reasoning = Math.Max(0, reasoningTokens);

        if (reasoning > completion)
        {
            return new BillableTokenCounts(prompt, 0, reasoning);
        }

        int visibleCompletion = completion - reasoning;

        return new BillableTokenCounts(prompt, visibleCompletion, reasoning);
    }

    public static bool HasMeasurableUsage(BillableTokenCounts counts) =>
        counts.Prompt > 0 || counts.Output > 0 || counts.Reasoning > 0;

    /// <summary>
    ///     Daily token pressure uses provider-reported completion when present (it already includes reasoning);
    ///     otherwise counts standalone reasoning tokens.
    /// </summary>
    public static long DailyOutputTokenPressure(int completionTokens, int reasoningTokens)
    {
        int completion = Math.Max(0, completionTokens);
        int reasoning = Math.Max(0, reasoningTokens);

        if (completion > 0)
            return completion;

        return reasoning;
    }

    public static bool HasDailyMeasurableUsage(int promptTokens, int completionTokens, int reasoningTokens) =>
        promptTokens > 0
        || completionTokens > 0
        || reasoningTokens > 0;
}
