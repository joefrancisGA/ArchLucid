namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Per-async-flow completion request parameters from the most recent LLM chat completion on the current thread.
/// </summary>
public static class LlmCompletionRequestParamsAmbient
{
    private static readonly AsyncLocal<(float Temperature, int MaxOutputTokens, float? TopP)?> LastRequestParams = new();

    /// <summary>Clears any recorded request parameters for the current async flow.</summary>
    public static void Clear() => LastRequestParams.Value = null;

    /// <summary>Records the parameters actually sent to the provider for the completion call.</summary>
    public static void Record(float temperature, int maxOutputTokens, float? topP = null) =>
        LastRequestParams.Value = (temperature, maxOutputTokens, topP);

    /// <summary>
    ///     Sets sampling fields to <see langword="null" /> when no completion ran on this async flow.
    /// </summary>
    public static void TryConsume(out float? temperature, out int? maxOutputTokens, out float? topP)
    {
        (float Temperature, int MaxOutputTokens, float? TopP)? raw = LastRequestParams.Value;
        LastRequestParams.Value = null;

        if (raw is { } value)
        {
            temperature = value.Temperature;
            maxOutputTokens = value.MaxOutputTokens;
            topP = value.TopP;

            return;
        }

        temperature = null;
        maxOutputTokens = null;
        topP = null;
    }

    /// <summary>Test hook: seeds request params read by <see cref="TryConsume" /> on this async flow.</summary>
    internal static void TestingSeed(float temperature, int maxOutputTokens, float? topP = null) =>
        LastRequestParams.Value = (temperature, maxOutputTokens, topP);
}
