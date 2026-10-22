using ArchLucid.Contracts.ProductLearning;

namespace ArchLucid.Persistence.Coordination.ProductLearning;

public sealed partial class DapperProductLearningPilotSignalRepository
{
    public async Task<IReadOnlyList<ImprovementOpportunity>> ListImprovementOpportunityCandidatesAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime? sinceUtc,
        int minPoorOutcomeSignals,
        int minRevisedSignals,
        int take,
        CancellationToken cancellationToken)
    {
        int minPoor = ProductLearningPilotSignalRepositoryCore.ClampMinOccurrences(minPoorOutcomeSignals);
        int minRev = ProductLearningPilotSignalRepositoryCore.ClampMinOccurrences(minRevisedSignals);
        int cap = ProductLearningPilotSignalRepositoryCore.ClampImprovementTake(take);

        IReadOnlyList<FeedbackAggregate> aggregates = await ListRunFeedbackAggregatesAsync(
            tenantId,
            workspaceId,
            projectId,
            sinceUtc,
            500,
            cancellationToken);

        List<ImprovementOpportunity> list = aggregates
            .Where(a =>
                a.RejectedCount + a.NeedsFollowUpCount >= minPoor ||
                a.RevisedCount >= minRev)
            .OrderByDescending(static a => a.RejectedCount + a.NeedsFollowUpCount + a.RevisedCount)
            .ThenByDescending(static a => a.LastSignalRecordedUtc)
            .ThenBy(static a => a.AggregateKey, StringComparer.Ordinal)
            .Take(cap)
            .Select((a, i) => ProductLearningSignalAggregations.ToImprovementOpportunityCandidate(a, i + 1))
            .ToList();

        return list;
    }
}
