namespace ArchLucid.AgentRuntime.PromptInjection;

/// <summary>
///     Collapses line-break injection and neutralizes TB-949 marker literals in run/task header identifiers
///     rendered outside customer-content quarantine (TB-949).
/// </summary>
public static class AgentRunHeaderPromptSanitizer
{
    public static string SanitizeHeaderIdentifier(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        string escaped = CustomerContentPromptDelimiters.EscapeEmbeddedMarkers(value);

        return AzureResourceTagPromptSanitizer.SanitizeScalar(escaped);
    }
}
