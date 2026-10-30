namespace ArchLucid.Contracts.ValueReports;

/// <summary>
///     Canonical formatting for <c>dbo.Tenants.BaselineReviewCycleSource</c> when operators capture review-cycle hours via
///     <c>PUT /v1/tenant/baseline</c> vs trial signup prose.
/// </summary>
public static class BaselineReviewCycleSourceMarkers
{
    /// <summary>Exact marker persisted when operators save hours without an optional provenance note.</summary>
    public const string OperatorSettingsToken = "baseline_settings";

    /// <summary>Maximum length of <c>dbo.Tenants.BaselineReviewCycleSource</c>.</summary>
    public const int PersistedSourceMaxLength = 256;

    /// <summary>Maximum operator note length after <see cref="FormatOperatorSettingsPersistence" /> prefix.</summary>
    public static int MaxOperatorSettingsNoteLength =>
        PersistedSourceMaxLength - (OperatorSettingsToken + ":").Length;

    /// <summary>
    ///     Determines whether review-cycle provenance should read as tenant-maintained baseline settings rather than signup.
    /// </summary>
    public static bool IndicatesTenantCapturedViaOperatorSettings(string? source)
    {
        if (string.IsNullOrWhiteSpace(source))
            return false;

        string t = source.Trim();

        return string.Equals(t, OperatorSettingsToken, StringComparison.OrdinalIgnoreCase) || t.StartsWith(OperatorSettingsToken + ":", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    ///     Human-readable suffix after <see cref="OperatorSettingsToken" /> — when absent, returns signup/source prose unchanged.
    /// </summary>
    public static string? FormatReviewCycleSourceNoteForDisplay(string? source)
    {
        if (string.IsNullOrWhiteSpace(source))
            return null;

        string t = source.Trim();

        if (string.Equals(t, OperatorSettingsToken, StringComparison.OrdinalIgnoreCase))
            return null;

        const string prefix = OperatorSettingsToken + ":";

        if (!t.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
            return SanitizeOperatorSourceNoteForDisplay(t);

        string tail = t[prefix.Length..].Trim();

        return tail.Length == 0 ? null : SanitizeOperatorSourceNoteForDisplay(tail);

    }

    /// <summary>Collapses operator-entered line breaks so markdown/DOCX export cannot forge structure from baseline notes.</summary>
    internal static string SanitizeOperatorSourceNoteForDisplay(string note)
        => note.Replace("\r", " ", StringComparison.Ordinal).Replace("\n", " ", StringComparison.Ordinal).Trim();

    /// <summary>Persisted JSON shape for operator baseline wizard / settings saves.</summary>
    public static string FormatOperatorSettingsPersistence(string? optionalHumanNote)
    {
        if (string.IsNullOrWhiteSpace(optionalHumanNote))
            return OperatorSettingsToken;

        return OperatorSettingsToken + ":" + optionalHumanNote.Trim();
    }
}
