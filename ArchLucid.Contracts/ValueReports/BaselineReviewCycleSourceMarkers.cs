namespace ArchLucid.Contracts.ValueReports;

/// <summary>
///     Canonical formatting for <c>dbo.Tenants.BaselineReviewCycleSource</c> when operators capture review-cycle hours via
///     <c>PUT /v1/tenant/baseline</c> vs trial signup prose.
/// </summary>
public static class BaselineReviewCycleSourceMarkers
{
    /// <summary>Exact marker persisted when operators save hours without an optional provenance note.</summary>
    public const string OperatorSettingsToken = "baseline_settings";

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
            return t;

        string tail = t[prefix.Length..].Trim();

        return tail.Length == 0 ? null : tail;

    }

    /// <summary>Persisted JSON shape for operator baseline wizard / settings saves.</summary>
    public static string FormatOperatorSettingsPersistence(string? optionalHumanNote)
    {
        if (string.IsNullOrWhiteSpace(optionalHumanNote))
            return OperatorSettingsToken;

        return OperatorSettingsToken + ":" + optionalHumanNote.Trim();
    }
}
