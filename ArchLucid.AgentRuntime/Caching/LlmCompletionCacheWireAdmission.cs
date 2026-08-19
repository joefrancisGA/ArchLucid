namespace ArchLucid.AgentRuntime.Caching;

/// <summary>
///     Cheap pre-schema gate: never admit empty or non-JSON wire bodies into the completion cache (TB-940).
/// </summary>
public static class LlmCompletionCacheWireAdmission
{
    /// <summary>
    ///     Returns true when <paramref name="jsonBody" /> is non-empty and looks like a JSON object or array.
    /// </summary>
    public static bool IsAdmissible(string? jsonBody)
    {
        if (string.IsNullOrWhiteSpace(jsonBody))
            return false;

        ReadOnlySpan<char> trimmed = jsonBody.AsSpan().Trim();

        if (trimmed.Length == 0)
            return false;

        char first = trimmed[0];

        return first is '{' or '[';
    }
}
