namespace ArchLucid.AgentRuntime.PromptInjection;

/// <summary>
///     Collapses line-break injection and neutralizes TB-949 marker literals in run/task header identifiers
///     rendered outside customer-content quarantine (TB-949).
/// </summary>
public static class AgentRunHeaderPromptSanitizer
{
    public static string SanitizeHeaderIdentifier(string? value) => SanitizeOutsideQuarantineField(value);

    /// <summary>Host list rows (allowed tools/sources) rendered outside TB-949 quarantine.</summary>
    public static string SanitizeHostListEntry(string? value) => SanitizeOutsideQuarantineField(value);

    private static string SanitizeOutsideQuarantineField(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        string escaped = AzureResourceTagPromptSanitizer.EscapeCustomerMarkersAfterControlStrip(value);

        return AzureResourceTagPromptSanitizer.SanitizeScalar(escaped);
    }
}
