namespace ArchLucid.Decisioning.Configuration;

/// <summary>
///     Controls LLM retry attempts when typed finding payloads fail validation after generation.
/// </summary>
public sealed class FindingPayloadRemediationOptions
{
    /// <summary>Configuration path <c>Findings:PayloadRemediation</c>.</summary>
    public const string SectionPath = "Findings:PayloadRemediation";

    /// <summary>Hard ceiling so misconfiguration cannot amplify spend without bound.</summary>
    public const int MaxCompletionAttemptsCeiling = 5;

    /// <summary>
    ///     Total completion attempts allowed for one finding payload generation (minimum 1, capped at
    ///     <see cref="MaxCompletionAttemptsCeiling" />).
    /// </summary>
    public int MaxCompletionAttempts
    {
        get;
        set;
    } = 3;

    /// <summary>Clamps <see cref="MaxCompletionAttempts" /> into a safe interval.</summary>
    public void Normalize()
    {
        if (MaxCompletionAttempts < 1)
            MaxCompletionAttempts = 1;

        if (MaxCompletionAttempts > MaxCompletionAttemptsCeiling)
            MaxCompletionAttempts = MaxCompletionAttemptsCeiling;
    }
}
