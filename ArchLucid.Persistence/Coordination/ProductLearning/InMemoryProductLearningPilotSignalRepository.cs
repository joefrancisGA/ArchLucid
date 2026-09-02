using ArchLucid.Contracts.ProductLearning;

namespace ArchLucid.Persistence.Coordination.ProductLearning;

/// <summary>
///     In-memory store for Development / tests (deterministic ordering by
///     <see cref="ProductLearningPilotSignalRecord.RecordedUtc" /> desc).
/// </summary>
public sealed class InMemoryProductLearningPilotSignalRepository : IProductLearningPilotSignalRepository
{
    private readonly List<ProductLearningPilotSignalRecord> _rows = [];
    private readonly Lock _sync = new();

    public Task InsertAsync(ProductLearningPilotSignalRecord record, CancellationToken cancellationToken)
    {
        ProductLearningPilotSignalRecord stored = ProductLearningPilotSignalRepositoryCore.NormalizeInsert(
            record,
            static () => TimeProvider.System.UtcNowDateTime());

        lock (_sync)
            _rows.Add(stored);

        return Task.CompletedTask;
    }

    public Task<IReadOnlyList<ProductLearningPilotSignalRecord>> ListRecentForScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken cancellationToken)
    {
        int capped = ProductLearningPilotSignalRepositoryCore.ClampListTake(take);

        List<ProductLearningPilotSignalRecord> list;

        lock (_sync)
            list = _rows
                .Where(r =>
                    r.TenantId == tenantId &&
                    r.WorkspaceId == workspaceId &&
                    r.ProjectId == projectId)
                .OrderByDescending(static r => r.RecordedUtc)
                .ThenBy(static r => r.SignalId)
                .Take(capped)
                .Select(static r => r with { })
                .ToList();

        return Task.FromResult<IReadOnlyList<ProductLearningPilotSignalRecord>>(list);
    }

    public Task<IReadOnlyList<FeedbackAggregate>> ListRunFeedbackAggregatesAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime? sinceUtc,
        int maxAggregates,
        CancellationToken cancellationToken)
    {
        IEnumerable<ProductLearningPilotSignalRecord> scoped = ProductLearningSignalAggregations.FilterScope(
            SnapshotRows(),
            tenantId,
            workspaceId,
            projectId,
            sinceUtc);

        IReadOnlyList<FeedbackAggregate> list =
            ProductLearningSignalAggregations.BuildRunFeedbackAggregates(scoped, maxAggregates);

        return Task.FromResult(list);
    }

    public Task<IReadOnlyList<ArtifactOutcomeTrend>> ListArtifactOutcomeTrendsAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime? sinceUtc,
        string? windowLabel,
        int maxTrends,
        CancellationToken cancellationToken)
    {
        IEnumerable<ProductLearningPilotSignalRecord> scoped = ProductLearningSignalAggregations.FilterScope(
            SnapshotRows(),
            tenantId,
            workspaceId,
            projectId,
            sinceUtc);

        IReadOnlyList<ArtifactOutcomeTrend> list =
            ProductLearningSignalAggregations.BuildArtifactOutcomeTrends(scoped, windowLabel, maxTrends);

        return Task.FromResult(list);
    }

    public Task<IReadOnlyList<FeedbackAggregate>> ListTopRejectedRevisedArtifactRollupsAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime? sinceUtc,
        int take,
        CancellationToken cancellationToken)
    {
        IEnumerable<ProductLearningPilotSignalRecord> scoped = ProductLearningSignalAggregations.FilterScope(
            SnapshotRows(),
            tenantId,
            workspaceId,
            projectId,
            sinceUtc);

        IReadOnlyList<FeedbackAggregate> list =
            ProductLearningSignalAggregations.BuildTopRejectedRevisedRollups(scoped, take);

        return Task.FromResult(list);
    }

    public Task<IReadOnlyList<RepeatedCommentTheme>> ListRepeatedCommentThemesAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime? sinceUtc,
        int minOccurrences,
        int take,
        CancellationToken cancellationToken)
    {
        IEnumerable<ProductLearningPilotSignalRecord> scoped = ProductLearningSignalAggregations.FilterScope(
            SnapshotRows(),
            tenantId,
            workspaceId,
            projectId,
            sinceUtc);

        IReadOnlyList<RepeatedCommentTheme> list =
            ProductLearningSignalAggregations.BuildRepeatedCommentThemes(scoped, minOccurrences, take);

        return Task.FromResult(list);
    }

    public Task<IReadOnlyList<ImprovementOpportunity>> ListImprovementOpportunityCandidatesAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime? sinceUtc,
        int minPoorOutcomeSignals,
        int minRevisedSignals,
        int take,
        CancellationToken cancellationToken)
    {
        IEnumerable<ProductLearningPilotSignalRecord> scoped = ProductLearningSignalAggregations.FilterScope(
            SnapshotRows(),
            tenantId,
            workspaceId,
            projectId,
            sinceUtc);

        IReadOnlyList<ImprovementOpportunity> list =
            ProductLearningSignalAggregations.BuildImprovementOpportunityCandidates(
                scoped,
                minPoorOutcomeSignals,
                minRevisedSignals,
                take);

        return Task.FromResult(list);
    }

    public Task<int> CountSignalsInScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime? sinceUtc,
        CancellationToken cancellationToken)
    {
        IEnumerable<ProductLearningPilotSignalRecord> scoped = ProductLearningSignalAggregations.FilterScope(
            SnapshotRows(),
            tenantId,
            workspaceId,
            projectId,
            sinceUtc);

        return Task.FromResult(scoped.Count());
    }

    public Task<int> CountDistinctArchitectureRunsWithSignalsAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime? sinceUtc,
        CancellationToken cancellationToken)
    {
        IEnumerable<ProductLearningPilotSignalRecord> scoped = ProductLearningSignalAggregations.FilterScope(
            SnapshotRows(),
            tenantId,
            workspaceId,
            projectId,
            sinceUtc);

        int n = scoped
            .Where(static r => !string.IsNullOrWhiteSpace(r.ArchitectureRunId))
            .Select(static r => r.ArchitectureRunId!)
            .Distinct(StringComparer.Ordinal)
            .Count();

        return Task.FromResult(n);
    }

    private IReadOnlyList<ProductLearningPilotSignalRecord> SnapshotRows()
    {
        lock (_sync)
            return _rows.Select(static r => r with { }).ToList();
    }
}
