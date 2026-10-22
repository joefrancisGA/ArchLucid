using ArchLucid.Contracts.ProductLearning;

namespace ArchLucid.Persistence.Coordination.ProductLearning;

/// <summary>
///     Explicit, deterministic scoring for product-learning triage (documented for operators).
/// </summary>
public static class ProductLearningOpportunityScoring
{
    /// <summary>
    ///     Weighted “bad” mass on a rollup: rejects and follow-ups weigh highest, revisions next.
    ///     Adds a small bonus when multiple signals exist with zero trusted outcomes (proxy for low trust until numeric scores
    ///     exist).
    /// </summary>
    public static int ComputeAggregateBadScore(FeedbackAggregate aggregate)
    {
        int score =
            aggregate.RejectedCount * 4 +
            aggregate.NeedsFollowUpCount * 3 +
            aggregate.RevisedCount * 2;

        if (aggregate is { TotalSignalCount: >= 2, TrustedCount: 0 })

            score += 2;


        return score;
    }

    public static int ComputeTrendNegativeMass(ArtifactOutcomeTrend trend)
    {
        return trend.RejectionCount + trend.RevisionCount + trend.NeedsFollowUpCount;
    }

    public static int TotalTrendSignals(ArtifactOutcomeTrend trend)
    {
        return trend.AcceptedOrTrustedCount + trend.RejectionCount + trend.RevisionCount + trend.NeedsFollowUpCount;
    }

    public static string SeverityFromBadScore(int badScore)
    {
        return badScore >= 12 ? "High" : badScore >= 6 ? "Medium" : "Low";
    }

    /// <summary>
    ///     Deterministic plan priority (aligned with dashboard triage banding + evidence mass) for 59R plan drafts.
    /// </summary>
    public static int ComputePlanPriorityScore(ImprovementOpportunity opportunity)
    {
        ArgumentNullException.ThrowIfNull(opportunity);

        int band = opportunity.Severity == "High" ? 1_000_000 : opportunity.Severity == "Medium" ? 600_000 : 200_000;

        int rankBoost = 10_000 - Math.Clamp(opportunity.PriorityRank, 0, 9_999);

        int evidence = Math.Clamp(opportunity.EvidenceSignalCount, 0, 99_999);

        return band + rankBoost + evidence;
    }

    /// <summary>Human-readable explanation for <see cref="ComputePlanPriorityScore" /> (audit / UI).</summary>
    public static string BuildPlanPriorityExplanation(ImprovementOpportunity opportunity)
    {
        ArgumentNullException.ThrowIfNull(opportunity);

        return "Deterministic score from severity band, dashboard-style rank boost, and capped evidence signal mass " +
            "(59R V1 derivation). severity=" + opportunity.Severity + "; opportunityRank=" + opportunity.PriorityRank +
            "; evidenceSignals=" + opportunity.EvidenceSignalCount + ".";
    }

    public static ImprovementOpportunity MapAggregateToOpportunity(FeedbackAggregate aggregate, int badScore,
        int priorityRank)
    {
        string severity = SeverityFromBadScore(badScore);
        string title = aggregate.PatternKey is not null
            ? "Feedback pattern: " + Truncate(aggregate.PatternKey, 120)
            : "Workflow friction: " + Truncate(aggregate.SubjectTypeOrWorkflowArea, 120);

        string summary =
            $"badScore={badScore}; signals={aggregate.TotalSignalCount}; runs={aggregate.DistinctRunCount}; " +
            $"trusted={aggregate.TrustedCount}, rejected={aggregate.RejectedCount}, revised={aggregate.RevisedCount}, followUp={aggregate.NeedsFollowUpCount}.";

        return new ImprovementOpportunity
        {
            OpportunityId = Guid.NewGuid(),
            SourceAggregateKey = aggregate.AggregateKey,
            PatternKey = aggregate.PatternKey,
            Title = title,
            Summary = summary,
            AffectedArtifactTypeOrWorkflowArea = aggregate.SubjectTypeOrWorkflowArea,
            Severity = severity,
            PriorityRank = priorityRank,
            SuggestedOwnerRole = "Product",
            EvidenceSignalCount = aggregate.TotalSignalCount,
            DistinctRunCount = aggregate.DistinctRunCount,
            AverageTrustScore = aggregate.AverageTrustScore,
            RepeatedThemeSnippet = aggregate.DominantThemeHint,
            FirstSeenUtc = aggregate.FirstSignalRecordedUtc,
            LastSeenUtc = aggregate.LastSignalRecordedUtc
        };
    }

    public static ImprovementOpportunity MapTrendToOpportunity(ArtifactOutcomeTrend trend, int badScore,
        int priorityRank)
    {
        string severity = SeverityFromBadScore(badScore);

        return new ImprovementOpportunity
        {
            OpportunityId = Guid.NewGuid(),
            SourceAggregateKey = "trend:" + trend.TrendKey,
            PatternKey = null,
            Title = "Artifact / workflow friction: " + Truncate(trend.ArtifactTypeOrHint, 120),
            Summary =
                $"badScore={badScore}; trendKey={trend.TrendKey}; trusted={trend.AcceptedOrTrustedCount}, " +
                $"rejected={trend.RejectionCount}, revised={trend.RevisionCount}, followUp={trend.NeedsFollowUpCount}; runs={trend.DistinctRunCount}.",
            AffectedArtifactTypeOrWorkflowArea = trend.ArtifactTypeOrHint,
            Severity = severity,
            PriorityRank = priorityRank,
            SuggestedOwnerRole = "Architecture",
            EvidenceSignalCount = TotalTrendSignals(trend),
            DistinctRunCount = trend.DistinctRunCount,
            AverageTrustScore = trend.AverageTrustScore,
            RepeatedThemeSnippet = trend.RepeatedThemeIndicator,
            FirstSeenUtc = trend.FirstSeenUtc,
            LastSeenUtc = trend.LastSeenUtc
        };
    }

    private static string Truncate(string value, int maxChars)
    {
        return value.Length <= maxChars ? value : value[..maxChars];
    }
}
