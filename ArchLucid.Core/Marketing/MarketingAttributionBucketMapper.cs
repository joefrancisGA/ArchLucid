namespace ArchLucid.Core.Marketing;

/// <summary>Maps raw UTM tuples to low-cardinality telemetry buckets (TB-019).</summary>
public static class MarketingAttributionBucketMapper
{
    public static string MapCoarseMedium(string? utmMedium)
    {
        if (string.IsNullOrWhiteSpace(utmMedium))
            return "unknown";

        string medium = utmMedium.Trim().ToLowerInvariant();
        string compact = NormalizeMediumToken(medium);

        if (compact is "cpc" or "ppc" or "paid" or "paidsearch" or "display" or "retargeting")
            return "paid_direct";

        if (compact is "email" or "newsletter")
            return "referral";

        if (compact is "organic" or "seo")
            return "organic";

        if (compact is "social" or "socialpaid")
            return "paid_direct";

        return "unknown";
    }

    private static string NormalizeMediumToken(string medium) =>
        medium.Replace("-", string.Empty, StringComparison.Ordinal)
            .Replace("_", string.Empty, StringComparison.Ordinal);

    public static string MapCoarsePlatform(string? utmSource)
    {
        if (string.IsNullOrWhiteSpace(utmSource))
            return "unknown";

        string source = utmSource.Trim().ToLowerInvariant();

        if (source.Contains("google", StringComparison.Ordinal))
            return "google";

        if (source.Contains("linkedin", StringComparison.Ordinal))
            return "linkedin";

        if (source.Contains("bing", StringComparison.Ordinal) || source.Contains("microsoft", StringComparison.Ordinal))
            return "bing";

        if (source is "archlucid" or "internal" or "product")
            return "internal";

        return "unknown";
    }
}
