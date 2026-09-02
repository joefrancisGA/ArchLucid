using ArchLucid.Contracts.Roi;

namespace ArchLucid.Application.Pilots;

/// <summary>
///     Maps run-scoped extractor collection timestamps to sponsor badge freshness labels for first-value exports.
/// </summary>
public static class PilotCostEvidenceFreshnessBadgeResolver
{
    /// <summary>
    ///     Resolves <see cref="RoiCostEvidenceFreshness"/> for artifact evidence badges using the same stale window as
    ///     <see cref="Roi.RoiCostEvidenceFreshnessEvaluator"/>.
    /// </summary>
    public static string Resolve(
        DateTime? extractorCollectionTimestampUtc,
        bool isDemoTenant,
        DateTime evaluationUtc,
        int staleAfterDays)
    {
        if (isDemoTenant)
            return RoiCostEvidenceFreshness.Missing;

        if (extractorCollectionTimestampUtc is null)
            return RoiCostEvidenceFreshness.Missing;

        int thresholdDays = staleAfterDays <= 0 ? 90 : staleAfterDays;

        DateTime normalizedUtc = extractorCollectionTimestampUtc.Value.Kind == DateTimeKind.Utc
            ? extractorCollectionTimestampUtc.Value
            : extractorCollectionTimestampUtc.Value.ToUniversalTime();

        double ageDays = (evaluationUtc - normalizedUtc).TotalDays;

        return ageDays > thresholdDays
            ? RoiCostEvidenceFreshness.Stale
            : RoiCostEvidenceFreshness.Fresh;
    }
}
