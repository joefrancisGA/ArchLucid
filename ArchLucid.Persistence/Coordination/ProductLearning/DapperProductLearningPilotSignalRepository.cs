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

    private const int MaxTake = 500;

    public async Task InsertAsync(ProductLearningPilotSignalRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);

        if (string.IsNullOrWhiteSpace(record.SubjectType))
            throw new ArgumentException("SubjectType is required.", nameof(record));


        if (string.IsNullOrWhiteSpace(record.Disposition))
            throw new ArgumentException("Disposition is required.", nameof(record));


        Guid signalId = record.SignalId == Guid.Empty ? Guid.NewGuid() : record.SignalId;
        DateTime recordedUtc = record.RecordedUtc == default ? TimeProvider.System.UtcNowDateTime() : record.RecordedUtc;
        string triage = string.IsNullOrWhiteSpace(record.TriageStatus)
            ? ProductLearningTriageStatusValues.Open
            : record.TriageStatus;


        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await connection.ExecuteAsync(
            new CommandDefinition(
                ProductLearningPilotSignalSql.Insert,
                new
                {
                    SignalId = signalId,
                    record.TenantId,
                    record.WorkspaceId,
                    record.ProjectId,
                    record.ArchitectureRunId,
                    record.AuthorityRunId,
                    record.ManifestVersion,
                    record.SubjectType,
                    record.Disposition,
                    record.PatternKey,
                    record.ArtifactHint,
                    record.CommentShort,
                    record.DetailJson,
                    record.RecordedByUserId,
                    record.RecordedByDisplayName,
                    RecordedUtc = recordedUtc,
                    TriageStatus = triage
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
        int capped = take < 1 ? 1 : Math.Min(take, MaxTake);


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
        int cap = maxAggregates < 1 ? 1 : Math.Min(maxAggregates, 500);


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

        return rows.Select(ToFeedbackAggregate).ToList();
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
        int cap = maxTrends < 1 ? 1 : Math.Min(maxTrends, 500);


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
            .Select(r => ToArtifactOutcomeTrend(r, windowLabel))
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

        int cap = take < 1 ? 1 : Math.Min(take, 200);

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
        int min = minOccurrences < 1 ? 1 : minOccurrences;
        int cap = take < 1 ? 1 : Math.Min(take, 200);

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

        return rows.Select(ToRepeatedCommentTheme).ToList();
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
        int minPoor = minPoorOutcomeSignals < 1 ? 1 : minPoorOutcomeSignals;
        int minRev = minRevisedSignals < 1 ? 1 : minRevisedSignals;
        int cap = take < 1 ? 1 : Math.Min(take, 100);

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

    private static FeedbackAggregate ToFeedbackAggregate(FeedbackAggregateSqlRow row)
    {
        string? pk = string.IsNullOrWhiteSpace(row.PatternKeyRaw) ? null : row.PatternKeyRaw.Trim();

        return new FeedbackAggregate
        {
            AggregateKey = row.AggregateKey,
            PatternKey = pk,
            SubjectTypeOrWorkflowArea = row.SubjectTypeOrWorkflowArea,
            DistinctRunCount = row.DistinctRunCount,
            TotalSignalCount = row.TotalSignalCount,
            TrustedCount = row.TrustedCount,
            RejectedCount = row.RejectedCount,
            RevisedCount = row.RevisedCount,
            NeedsFollowUpCount = row.NeedsFollowUpCount,
            AverageTrustScore = null,
            AverageUsefulnessScore = null,
            DominantThemeHint = string.IsNullOrWhiteSpace(row.DominantThemeHint)
                ? null
                : TruncateForDisplay(row.DominantThemeHint, 240),
            FirstSignalRecordedUtc = row.FirstSignalRecordedUtc,
            LastSignalRecordedUtc = row.LastSignalRecordedUtc
        };
    }

    private static ArtifactOutcomeTrend ToArtifactOutcomeTrend(ArtifactOutcomeTrendSqlRow row, string? windowLabel)
    {
        return new ArtifactOutcomeTrend
        {
            TrendKey = row.TrendKey,
            ArtifactTypeOrHint = row.ArtifactTypeOrHint,
            WindowLabel = windowLabel,
            AcceptedOrTrustedCount = row.AcceptedOrTrustedCount,
            RevisionCount = row.RevisionCount,
            RejectionCount = row.RejectionCount,
            NeedsFollowUpCount = row.NeedsFollowUpCount,
            DistinctRunCount = row.DistinctRunCount,
            AverageTrustScore = null,
            AverageUsefulnessScore = null,
            RepeatedThemeIndicator = string.IsNullOrWhiteSpace(row.RepeatedThemeIndicator)
                ? null
                : TruncateForDisplay(row.RepeatedThemeIndicator, 200),
            FirstSeenUtc = row.FirstSeenUtc,
            LastSeenUtc = row.LastSeenUtc
        };
    }

    private static RepeatedCommentTheme ToRepeatedCommentTheme(RepeatedCommentThemeSqlRow row)
    {
        long n = row.OccurrenceCount;
        int count = n > int.MaxValue ? int.MaxValue : (int)n;

        return new RepeatedCommentTheme
        {
            ThemeKey = row.ThemeKey,
            OccurrenceCount = count,
            FirstSeenUtc = row.FirstSeenUtc,
            LastSeenUtc = row.LastSeenUtc,
            SampleCommentShort = row.SampleCommentShort
        };
    }

    private static string TruncateForDisplay(string value, int maxChars)
    {
        return value.Length <= maxChars ? value : value[..maxChars];
    }
}
