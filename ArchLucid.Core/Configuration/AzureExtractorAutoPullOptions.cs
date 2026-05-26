namespace ArchLucid.Core.Configuration;

/// <summary>
///     Tier-2 Azure extractor continuous pull worker. Polls configured tenants and runs hosted extraction when
///     <see cref="Enabled"/> is true (leader-elected; per-subscription session lock prevents concurrent runs).
/// </summary>
public sealed class AzureExtractorAutoPullOptions
{
    public const string SectionName = "AzureExtractor:AutoPull";

    /// <summary>Master switch for the worker loop (default off).</summary>
    public bool Enabled
    {
        get;
        set;
    }

    /// <summary>Polling interval when <see cref="Enabled"/> is true (clamped in the hosted service).</summary>
    public int IntervalMinutes
    {
        get;
        set;
    } = 360;
}
