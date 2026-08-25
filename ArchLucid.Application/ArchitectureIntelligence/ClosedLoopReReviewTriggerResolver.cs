using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Maps a change-impact result to the incremental re-review trigger for closed-loop apply.
/// </summary>
public static class ClosedLoopReReviewTriggerResolver
{
    public static ReReviewTrigger? Resolve(
        ChangeImpactResult impact,
        ArchitectureRecommendation recommendation)
    {
        ArgumentNullException.ThrowIfNull(impact);
        ArgumentNullException.ThrowIfNull(recommendation);

        if (!impact.RequiresFullReReview)
            return null;

        string proposedChange = recommendation.ProposedChange ?? string.Empty;

        if (proposedChange.Contains("trust boundary", StringComparison.OrdinalIgnoreCase))
            return ReReviewTrigger.NewTrustBoundary;

        if (proposedChange.Contains("jurisdiction", StringComparison.OrdinalIgnoreCase)
            || proposedChange.Contains("residency", StringComparison.OrdinalIgnoreCase))
            return ReReviewTrigger.NewJurisdiction;

        if (proposedChange.Contains("data classification", StringComparison.OrdinalIgnoreCase))
            return ReReviewTrigger.NewDataClassification;

        return ReReviewTrigger.MajorTopologyChange;
    }
}
