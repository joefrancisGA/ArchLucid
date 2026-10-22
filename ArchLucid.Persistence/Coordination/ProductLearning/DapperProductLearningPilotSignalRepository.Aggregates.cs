using ArchLucid.Contracts.ProductLearning;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Coordination.ProductLearning;

public sealed partial class DapperProductLearningPilotSignalRepository
{
    public async Task<IReadOnlyList<FeedbackAggregate>> ListRunFeedbackAggregatesAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime? sinceUtc,
        int maxAggregates,
        CancellationToken cancellationToken)
    {
        int cap = ProductLearningPilotSignalRepositoryCore.ClampAggregateCap(maxAggregates);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<FeedbackAggregateSqlRow> rows = await connection.QueryAsync<FeedbackAggregateSqlRow>(
            new CommandDefinition(
                ProductLearningPilotSignalSql.ListRunFeedbackAggregates,
                new
                {
                    MaxAggregates = cap,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    SinceUtc = sinceUtc
                },
                cancellationToken: cancellationToken));

        return rows.Select(ProductLearningPilotSignalRepositoryCore.ToFeedbackAggregate).ToList();
    }

    public async Task<IReadOnlyList<ArtifactOutcomeTrend>> ListArtifactOutcomeTrendsAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime? sinceUtc,
        string? windowLabel,
        int maxTrends,
        CancellationToken cancellationToken)
    {
        int cap = ProductLearningPilotSignalRepositoryCore.ClampAggregateCap(maxTrends);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<ArtifactOutcomeTrendSqlRow> rows = await connection.QueryAsync<ArtifactOutcomeTrendSqlRow>(
            new CommandDefinition(
                ProductLearningPilotSignalSql.ListArtifactOutcomeTrends,
                new
                {
                    MaxTrends = cap,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    SinceUtc = sinceUtc
                },
                cancellationToken: cancellationToken));

        return rows
            .Select(r => ProductLearningPilotSignalRepositoryCore.ToArtifactOutcomeTrend(r, windowLabel))
            .ToList();
    }

    public async Task<IReadOnlyList<FeedbackAggregate>> ListTopRejectedRevisedArtifactRollupsAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime? sinceUtc,
        int take,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<FeedbackAggregate> all = await ListRunFeedbackAggregatesAsync(
            tenantId,
            workspaceId,
            projectId,
            sinceUtc,
            500,
            cancellationToken);

        int cap = ProductLearningPilotSignalRepositoryCore.ClampThemeTake(take);

        return all
            .OrderByDescending(static a => a.RejectedCount + a.RevisedCount)
            .ThenByDescending(static a => a.LastSignalRecordedUtc)
            .ThenBy(static a => a.AggregateKey, StringComparer.Ordinal)
            .Take(cap)
            .ToList();
    }

    public async Task<IReadOnlyList<RepeatedCommentTheme>> ListRepeatedCommentThemesAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime? sinceUtc,
        int minOccurrences,
        int take,
        CancellationToken cancellationToken)
    {
        int min = ProductLearningPilotSignalRepositoryCore.ClampMinOccurrences(minOccurrences);
        int cap = ProductLearningPilotSignalRepositoryCore.ClampThemeTake(take);

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<RepeatedCommentThemeSqlRow> rows = await connection.QueryAsync<RepeatedCommentThemeSqlRow>(
            new CommandDefinition(
                ProductLearningPilotSignalSql.RepeatedCommentTheme,
                new
                {
                    Take = cap,
                    MinOccurrences = min,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    SinceUtc = sinceUtc
                },
                cancellationToken: cancellationToken));

        return rows.Select(ProductLearningPilotSignalRepositoryCore.ToRepeatedCommentTheme).ToList();
    }

    public async Task<int> CountSignalsInScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime? sinceUtc,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        long n = await connection.ExecuteScalarAsync<long>(
            new CommandDefinition(
                ProductLearningPilotSignalSql.CountSignalsInScope,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    SinceUtc = sinceUtc
                },
                cancellationToken: cancellationToken));

        return n > int.MaxValue ? int.MaxValue : (int)n;
    }

    public async Task<int> CountDistinctArchitectureRunsWithSignalsAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime? sinceUtc,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        int n = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                ProductLearningPilotSignalSql.CountDistinctArchitectureRunsWithSignals,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    SinceUtc = sinceUtc
                },
                cancellationToken: cancellationToken));

        return n;
    }
}
