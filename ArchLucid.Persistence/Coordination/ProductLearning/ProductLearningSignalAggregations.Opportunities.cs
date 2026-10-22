using ArchLucid.Contracts.ProductLearning;

namespace ArchLucid.Persistence.Coordination.ProductLearning;

public static partial class ProductLearningSignalAggregations
{
    /// <summary>Maps a rollup to an opportunity row (shared by Dapper repository post-filtering).</summary>
    public static ImprovementOpportunity ToImprovementOpportunityCandidate(
        FeedbackAggregate aggregate,
        int priorityRank)
    {
        return MapAggregateToImprovementOpportunity(aggregate, priorityRank);
    }

    public static IReadOnlyList<ImprovementOpportunity> BuildImprovementOpportunityCandidates(
        IEnumerable<ProductLearningPilotSignalRecord> scoped,
        int minPoorOutcomeSignals,
        int minRevisedSignals,
        int take)
    {
        int minPoor = minPoorOutcomeSignals < 1 ? 1 : minPoorOutcomeSignals;
        int minRev = minRevisedSignals < 1 ? 1 : minRevisedSignals;
        int cap = take < 1 ? 1 : Math.Min(take, 100);

        List<ImprovementOpportunity> result = [];

        List<FeedbackAggregate> candidates = BuildRunFeedbackAggregates(scoped, 500)
            .Where(a =>
                a.RejectedCount + a.NeedsFollowUpCount >= minPoor ||
                a.RevisedCount >= minRev)
            .OrderByDescending(static a => a.RejectedCount + a.NeedsFollowUpCount + a.RevisedCount)
            .ThenByDescending(static a => a.LastSignalRecordedUtc)
            .ThenBy(static a => a.AggregateKey, StringComparer.Ordinal)
            .Take(cap)
            .ToList();

        int rank = 0;

        foreach (FeedbackAggregate aggregate in candidates)
        {
            rank++;

            result.Add(ToImprovementOpportunityCandidate(aggregate, rank));
        }

        return result;
    }

    private static ImprovementOpportunity MapAggregateToImprovementOpportunity(
        FeedbackAggregate aggregate,
        int priorityRank)
    {
        int poor = aggregate.RejectedCount + aggregate.NeedsFollowUpCount;
        int score = poor * 2 + aggregate.RevisedCount;
        string severity = score >= 10 ? "High" : score >= 4 ? "Medium" : "Low";

        string title = aggregate.PatternKey is not null
            ? "Repeated feedback: " + TruncateHint(aggregate.PatternKey, 120)
            : "Repeated feedback: " + TruncateHint(aggregate.SubjectTypeOrWorkflowArea, 120);

        string summary =
            $"Signals={aggregate.TotalSignalCount}, runs={aggregate.DistinctRunCount}, " +
            $"trusted={aggregate.TrustedCount}, rejected={aggregate.RejectedCount}, " +
            $"revised={aggregate.RevisedCount}, followUp={aggregate.NeedsFollowUpCount}.";

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
}
