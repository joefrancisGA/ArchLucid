namespace ArchLucid.Core.Marketing;

/// <summary>Maps raw UTM tuples to low-cardinality telemetry buckets (TB-019).</summary>
public static class MarketingAttributionBucketMapper
{
    public static string MapCoarseMedium(string? utmMedium)
    {
        if (string.IsNullOrWhiteSpace(utmMedium))
            return "unknown";

        string medium = utmMedium.Trim().ToLowerInvariant();

        if (medium is "cpc" or "ppc" or "paid" or "paidsearch" or "display" or "retargeting")
            return "paid_direct";

        if (medium is "email" or "newsletter")
            return "referral";

        if (medium is "organic" or "seo")
            return "organic";

        if (medium is "social" or "social-paid")
            return "paid_direct";

        return "unknown";
    }

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
