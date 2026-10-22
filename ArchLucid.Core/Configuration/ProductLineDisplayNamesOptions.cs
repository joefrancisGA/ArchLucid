namespace ArchLucid.Core.Configuration;

/// <summary>
///     Per-product consumer display names for outbound artifacts (<c>ProductLineDisplayNames:*</c>).
///     One API serves both Architecture and Security shells; do not set a process-wide <see cref="EmailNotificationOptions.ProductDisplayName" /> for SecureNow alone.
/// </summary>
public sealed class ProductLineDisplayNamesOptions
{
    public const string SectionName = "ProductLineDisplayNames";

    /// <summary>Architecture product label (default ArchLucid).</summary>
    public string? Architecture
    {
        get;
        init;
    }

    /// <summary>Security product label (default SecureNow).</summary>
    public string? Security
    {
        get;
        init;
    }
}
