using ArchLucid.Core.Diagnostics;

namespace ArchLucid.AgentRuntime;

/// <summary>
///     Reads LLM completion request parameters from the last successful completion on the async flow, if any.
/// </summary>
public static class AgentCompletionRequestParams
{
    /// <summary>
    ///     Sets <paramref name="temperature" />, <paramref name="maxOutputTokens" />, and <paramref name="topP" /> to
    ///     <see langword="null" /> when unavailable.
    /// </summary>
    public static void TryConsume(out float? temperature, out int? maxOutputTokens, out float? topP) =>
        LlmCompletionRequestParamsAmbient.TryConsume(out temperature, out maxOutputTokens, out topP);
}
