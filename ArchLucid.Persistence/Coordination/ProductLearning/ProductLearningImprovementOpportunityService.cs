using ArchLucid.Contracts.Abstractions.ProductLearning;
using ArchLucid.Contracts.ProductLearning;

namespace ArchLucid.Persistence.Coordination.ProductLearning;

/// <inheritdoc />
public sealed class ProductLearningImprovementOpportunityService : IProductLearningImprovementOpportunityService
{
    public Task<IReadOnlyList<ImprovementOpportunity>> BuildRankedOpportunitiesAsync(
        ProductLearningAggregationSnapshot snapshot,
        ProductLearningTriageOptions options,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        ArgumentNullException.ThrowIfNull(options);

        HashSet<string> usedKeys = new(StringComparer.Ordinal);
        List<(int BadScore, string SortKey, ImprovementOpportunity Model)> work = [];
        work.AddRange(from aggregate in snapshot.FeedbackRollups where aggregate.TotalSignalCount >= options.MinSignalsPerAggregate let badScore = ProductLearningOpportunityScoring.ComputeAggregateBadScore(aggregate) let passesThreshold = badScore >= options.MinAggregateBadScoreForOpportunity || aggregate.RejectedCount + aggregate.NeedsFollowUpCount >= 2 || aggregate.RevisedCount >= 2 where passesThreshold where usedKeys.Add(aggregate.AggregateKey) let sortKey = "a:" + aggregate.AggregateKey select (badScore, sortKey, ProductLearningOpportunityScoring.MapAggregateToOpportunity(aggregate, badScore, 0)));

        work.AddRange(from trend in snapshot.ArtifactTrends where ProductLearningOpportunityScoring.TotalTrendSignals(trend) >= options.MinSignalsPerAggregate let negative = ProductLearningOpportunityScoring.ComputeTrendNegativeMass(trend) where negative >= options.MinNegativeOutcomesOnArtifactTrend let dedupeKey = "trend:" + trend.TrendKey where usedKeys.Add(dedupeKey) let badScore = negative * 3 + trend.RejectionCount let sortKey = "t:" + trend.TrendKey select (badScore, sortKey, ProductLearningOpportunityScoring.MapTrendToOpportunity(trend, badScore, 0)));

        int max = options.MaxImprovementOpportunities < 1 ? 1 : Math.Min(options.MaxImprovementOpportunities, 100);

        List<ImprovementOpportunity> ordered = work
            .OrderByDescending(static x => x.BadScore)
            .ThenByDescending(static x => x.Model.LastSeenUtc)
            .ThenBy(static x => x.SortKey, StringComparer.Ordinal)
            .Take(max)
            .Select(static x => x.Model)
            .ToList();

        List<ImprovementOpportunity> ranked = new(ordered.Count);
        ranked.AddRange(ordered.Select((t, i) => WithPriorityRank(t, i + 1)));

        return Task.FromResult<IReadOnlyList<ImprovementOpportunity>>(ranked);
    }

    private static ImprovementOpportunity WithPriorityRank(ImprovementOpportunity model, int rank)
    {
        return new ImprovementOpportunity
        {
            OpportunityId = model.OpportunityId,
            SourceAggregateKey = model.SourceAggregateKey,
            PatternKey = model.PatternKey,
            Title = model.Title,
            Summary = model.Summary,
            AffectedArtifactTypeOrWorkflowArea = model.AffectedArtifactTypeOrWorkflowArea,
            Severity = model.Severity,
            PriorityRank = rank,
            SuggestedOwnerRole = model.SuggestedOwnerRole,
            EvidenceSignalCount = model.EvidenceSignalCount,
            DistinctRunCount = model.DistinctRunCount,
            AverageTrustScore = model.AverageTrustScore,
            RepeatedThemeSnippet = model.RepeatedThemeSnippet,
            FirstSeenUtc = model.FirstSeenUtc,
            LastSeenUtc = model.LastSeenUtc
        };
    }
}
