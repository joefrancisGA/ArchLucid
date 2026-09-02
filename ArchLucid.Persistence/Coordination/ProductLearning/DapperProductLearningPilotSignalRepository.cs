using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Coordination.ProductLearning;

/// <summary>Dapper access to <c>dbo.ProductLearningPilotSignals</c>.</summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperProductLearningPilotSignalRepository(ISqlConnectionFactory connectionFactory)
    : IProductLearningPilotSignalRepository
{

    public async Task InsertAsync(ProductLearningPilotSignalRecord record, CancellationToken cancellationToken)
    {
        ProductLearningPilotSignalRecord normalized = ProductLearningPilotSignalRepositoryCore.NormalizeInsert(
            record,
            static () => TimeProvider.System.UtcNowDateTime());

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(
            new CommandDefinition(
                ProductLearningPilotSignalSql.Insert,
                new
                {
                    SignalId = normalized.SignalId,
                    normalized.TenantId,
                    normalized.WorkspaceId,
                    normalized.ProjectId,
                    normalized.ArchitectureRunId,
                    normalized.AuthorityRunId,
                    normalized.ManifestVersion,
                    normalized.SubjectType,
                    normalized.Disposition,
                    normalized.PatternKey,
                    normalized.ArtifactHint,
                    normalized.CommentShort,
                    normalized.DetailJson,
                    normalized.RecordedByUserId,
                    normalized.RecordedByDisplayName,
                    RecordedUtc = normalized.RecordedUtc,
                    TriageStatus = normalized.TriageStatus
                },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<ProductLearningPilotSignalRecord>> ListRecentForScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken cancellationToken)
    {
        int capped = ProductLearningPilotSignalRepositoryCore.ClampListTake(take);


        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<ProductLearningPilotSignalRecord> rows =
            await connection.QueryAsync<ProductLearningPilotSignalRecord>(
                new CommandDefinition(
                    ProductLearningPilotSignalSql.ListRecentForScope,
                    new
                    {
                        Take = capped,
                        TenantId = tenantId,
                        WorkspaceId = workspaceId,
                        ProjectId = projectId
                    },
                    cancellationToken: cancellationToken));

        return rows.ToList();
    }

    public async Task<IReadOnlyList<FeedbackAggregate>> ListRunFeedbackAggregatesAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime? sinceUtc,
        int maxAggregates,
        CancellationToken cancellationToken)
    {
        int cap = ProductLearningPilotSignalRepositoryCore.ClampAggregateCap(maxAggregates);


        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
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


        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
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

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
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

    public async Task<int> CountSignalsInScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTime? sinceUtc,
        CancellationToken cancellationToken)
    {

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
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

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
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
