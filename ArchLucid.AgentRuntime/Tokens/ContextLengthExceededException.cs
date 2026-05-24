namespace ArchLucid.AgentRuntime.Tokens;

/// <summary>
///     Thrown when an LLM prompt exceeds the configured model context budget.
/// </summary>
public sealed class ContextLengthExceededException : Exception
{
    public ContextLengthExceededException(int estimatedTokens, int maxContextTokens, int thresholdTokens)
        : base(
            $"Estimated prompt tokens ({estimatedTokens}) exceed the context threshold ({thresholdTokens}) "
            + $"for a model max of {maxContextTokens}.")
    {
        EstimatedTokens = estimatedTokens;
        MaxContextTokens = maxContextTokens;
        ThresholdTokens = thresholdTokens;
    }

    public int EstimatedTokens { get; }

    public int MaxContextTokens { get; }

    public int ThresholdTokens { get; }
}
