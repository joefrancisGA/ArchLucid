namespace ArchLucid.Contracts.Roi;

/// <summary>
///     Sponsor-handoff freshness rules for ROI savings claims (assessment improvement #6).
/// </summary>
public static class RoiMetricSourceFreshnessRules
{
    public static readonly TimeSpan StaleExtractorThreshold = TimeSpan.FromDays(30);

    public static string ResolveDisposition(
        DateTime? extractorCollectionTimestampUtc,
        bool isDemoTenant,
        decimal? estimatedUsdSavings,
        IReadOnlyList<RoiMetricSourceRow> sources,
        DateTime utcNow)
    {
        if (isDemoTenant)
            return "WARN";

        if (HasUnsourcedPositiveSavings(estimatedUsdSavings, sources))
            return "HOLD";

        if (HasStaleExtractorWithPositiveSavings(extractorCollectionTimestampUtc, estimatedUsdSavings, utcNow))
            return "HOLD";

        if (HasBenchmarkOnlySavingsClaim(estimatedUsdSavings, sources))
            return "WARN";

        return "PASS";
    }

    public static string BuildLimitationsLine(
        DateTime? extractorCollectionTimestampUtc,
        bool isDemoTenant,
        decimal? estimatedUsdSavings,
        IReadOnlyList<RoiMetricSourceRow> sources,
        DateTime utcNow)
    {
        string disposition = ResolveDisposition(
            extractorCollectionTimestampUtc,
            isDemoTenant,
            estimatedUsdSavings,
            sources,
            utcNow);

        return disposition switch
        {
            "HOLD" => "**ROI freshness:** HOLD — positive savings appear without current source classification or extractor data is stale.",
            "WARN" => "**ROI freshness:** WARN — savings lines rely on demo seed and/or benchmark assumptions; label before external send.",
            _ => string.Empty,
        };
    }

    internal static bool HasUnsourcedPositiveSavings(decimal? estimatedUsdSavings, IReadOnlyList<RoiMetricSourceRow> sources)
    {
        if (!HasPositiveEstimatedSavings(estimatedUsdSavings))
            return false;

        return sources.Count == 0;
    }

    internal static bool HasStaleExtractorWithPositiveSavings(
        DateTime? extractorCollectionTimestampUtc,
        decimal? estimatedUsdSavings,
        DateTime utcNow)
    {
        if (!HasPositiveEstimatedSavings(estimatedUsdSavings))
            return false;

        if (extractorCollectionTimestampUtc is null)
            return false;

        DateTime collectedUtc = extractorCollectionTimestampUtc.Value.Kind == DateTimeKind.Utc
            ? extractorCollectionTimestampUtc.Value
            : extractorCollectionTimestampUtc.Value.ToUniversalTime();

        return utcNow - collectedUtc > StaleExtractorThreshold;
    }

    internal static bool HasBenchmarkOnlySavingsClaim(decimal? estimatedUsdSavings, IReadOnlyList<RoiMetricSourceRow> sources)
    {
        if (!HasPositiveEstimatedSavings(estimatedUsdSavings))
            return false;

        if (sources.Count == 0)
            return false;

        foreach (RoiMetricSourceRow row in sources)
        {
            if (row.SourceKind is RoiMetricSourceKind.CustomerProvided
                or RoiMetricSourceKind.ExtractorZip
                or RoiMetricSourceKind.RetailPriceRow)
            {
                return false;
            }
        }

        return true;
    }

    private static bool HasPositiveEstimatedSavings(decimal? estimatedUsdSavings) =>
        estimatedUsdSavings is > 0m;
}
