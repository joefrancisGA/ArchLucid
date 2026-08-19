using ArchLucid.Persistence.Connections;
using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Value;

public sealed class DapperValueReportMetricsReader(IReadOnlyDbConnectionFactory connectionFactory) : IValueReportMetricsReader
{
    private static readonly string NonDemoRunsFilterRuns =
        " AND " + DemoRunSqlPredicates.ExcludeShowcaseDemoRuns("dbo.Runs");

    private static readonly string NonDemoRunsFilterRunsAliasR =
        " AND " + DemoRunSqlPredicates.ExcludeShowcaseDemoRuns("r");

    private static readonly string RunsByStatusSql =
        """
        SELECT COALESCE(LegacyRunStatus, '(unknown)') AS LegacyRunStatusLabel, COUNT_BIG(*) AS Cnt
        FROM dbo.Runs WITH (NOLOCK)
        WHERE TenantId = @TenantId
          AND WorkspaceId = @WorkspaceId
          AND ScopeProjectId = @ProjectId
          AND CreatedUtc >= @FromUtc
          AND CreatedUtc < @ToUtc
          AND ArchivedUtc IS NULL
        """
        + NonDemoRunsFilterRuns
        + """
        GROUP BY LegacyRunStatus
        """;

    private static readonly string RunsCompletedSql =
        """
        SELECT COUNT_BIG(*)
        FROM dbo.Runs WITH (NOLOCK)
        WHERE TenantId = @TenantId
          AND WorkspaceId = @WorkspaceId
          AND ScopeProjectId = @ProjectId
          AND CreatedUtc >= @FromUtc
          AND CreatedUtc < @ToUtc
          AND ArchivedUtc IS NULL
          AND CompletedUtc IS NOT NULL
        """
        + NonDemoRunsFilterRuns
        + ";";

    private static readonly string ManifestsSql =
        """
        SELECT COUNT_BIG(*)
        FROM dbo.GoldenManifests gm WITH (NOLOCK)
        INNER JOIN dbo.Runs r WITH (NOLOCK) ON r.RunId = gm.RunId
        WHERE gm.TenantId = @TenantId
          AND gm.WorkspaceId = @WorkspaceId
          AND gm.ProjectId = @ProjectId
          AND gm.CreatedUtc >= @FromUtc
          AND gm.CreatedUtc < @ToUtc
          AND (gm.ArchivedUtc IS NULL)
          AND (r.ArchivedUtc IS NULL)
        """
        + NonDemoRunsFilterRunsAliasR
        + ";";

    private static readonly string ReviewCycleSql =
        """
        SELECT
            AVG(CAST(DATEDIFF(SECOND, r.CreatedUtc, m.CreatedUtc) AS DECIMAL(18, 6))) / 3600.0 AS AvgHours,
            COUNT_BIG(*) AS Cnt
        FROM dbo.GoldenManifests m WITH (NOLOCK)
        INNER JOIN dbo.Runs r ON m.RunId = r.RunId
        WHERE m.TenantId = @TenantId
          AND m.WorkspaceId = @WorkspaceId
          AND m.ProjectId = @ProjectId
          AND m.CreatedUtc >= @FromUtc
          AND m.CreatedUtc < @ToUtc
          AND (m.ArchivedUtc IS NULL)
          AND (r.ArchivedUtc IS NULL)
        """
        + NonDemoRunsFilterRunsAliasR
        + ";";

    private static readonly string GovernanceSql =
        """
        SELECT COUNT_BIG(*)
        FROM dbo.AuditEvents WITH (NOLOCK)
        WHERE TenantId = @TenantId
          AND WorkspaceId = @WorkspaceId
          AND ProjectId = @ProjectId
          AND OccurredUtc >= @FromUtc
          AND OccurredUtc < @ToUtc
          AND EventType IN @GovTypes;
        """;

    private static readonly string DriftSql =
        """
        SELECT COUNT_BIG(*)
        FROM dbo.AuditEvents WITH (NOLOCK)
        WHERE TenantId = @TenantId
          AND WorkspaceId = @WorkspaceId
          AND ProjectId = @ProjectId
          AND OccurredUtc >= @FromUtc
          AND OccurredUtc < @ToUtc
          AND EventType IN @DriftTypes;
        """;

    private static readonly string FindingFeedbackSql =
        """
        SELECT COALESCE(SUM(CAST(Score AS BIGINT)), 0) AS NetScore, COUNT_BIG(*) AS VoteCount
        FROM dbo.FindingFeedback WITH (NOLOCK)
        WHERE TenantId = @TenantId
          AND WorkspaceId = @WorkspaceId
          AND ProjectId = @ProjectId
          AND CreatedUtc >= @FromUtc
          AND CreatedUtc < @ToUtc;
        """;

    private static readonly string TenantBaselineSql =
        """
        SELECT BaselineReviewCycleHours,
               BaselineReviewCycleSource,
               BaselineReviewCycleCapturedUtc,
               BaselineManualPrepHoursPerReview,
               BaselinePeoplePerReview,
               ArchitectureTeamSize
        FROM dbo.Tenants WITH (NOLOCK)
        WHERE Id = @TenantId;
        """;

    private static readonly string BatchSql =
        RunsByStatusSql
        + "\n"
        + RunsCompletedSql
        + "\n"
        + ManifestsSql
        + "\n"
        + GovernanceSql
        + "\n"
        + DriftSql
        + "\n"
        + FindingFeedbackSql
        + "\n"
        + TenantBaselineSql
        + "\n"
        + ReviewCycleSql;

    private readonly IReadOnlyDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<ValueReportRawMetrics> ReadAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        DateTimeOffset fromUtcInclusive,
        DateTimeOffset toUtcExclusive,
        CancellationToken cancellationToken)
    {
        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        object parameters = new
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            FromUtc = fromUtcInclusive.UtcDateTime,
            ToUtc = toUtcExclusive.UtcDateTime,
            GovTypes = ValueReportMetricEventTypes.GovernanceEventTypes,
            DriftTypes = ValueReportMetricEventTypes.DriftAlertEventTypes,
            CanonicalShowcaseRunBaselineId = DemoRunSqlPredicates.CanonicalShowcaseRunBaselineId,
            CanonicalShowcaseRunHardenedId = DemoRunSqlPredicates.CanonicalShowcaseRunHardenedId,
        };

        await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
            new CommandDefinition(BatchSql, parameters, cancellationToken: cancellationToken));

        List<ValueReportRunStatusCount> statusCounts = (await multi.ReadAsync<RunStatusSqlRow>())
            .Select(static r =>
                new ValueReportRunStatusCount(r.LegacyRunStatusLabel, (int)Math.Min(int.MaxValue, r.Cnt)))
            .ToList();

        long runsCompleted = await multi.ReadSingleAsync<long>();
        long manifests = await multi.ReadSingleAsync<long>();
        long governance = await multi.ReadSingleAsync<long>();
        long drift = await multi.ReadSingleAsync<long>();
        FindingFeedbackAggRow feedbackAgg = await multi.ReadSingleAsync<FindingFeedbackAggRow>();
        TenantBaselineRow? tenantBaseline = await multi.ReadSingleOrDefaultAsync<TenantBaselineRow>();
        ReviewCycleMeasureRow measure = await multi.ReadSingleAsync<ReviewCycleMeasureRow>();

        decimal? measuredAvg = measure.Cnt == 0 ? null : measure.AvgHours;
        int sampleSize = measure.Cnt > int.MaxValue ? int.MaxValue : (int)measure.Cnt;

        return new ValueReportRawMetrics(
            statusCounts,
            (int)Math.Min(int.MaxValue, runsCompleted),
            (int)Math.Min(int.MaxValue, manifests),
            (int)Math.Min(int.MaxValue, governance),
            (int)Math.Min(int.MaxValue, drift),
            (int)Math.Clamp(feedbackAgg.NetScore, int.MinValue, int.MaxValue),
            (int)Math.Min(int.MaxValue, feedbackAgg.VoteCount),
            tenantBaseline?.BaselineReviewCycleHours,
            tenantBaseline?.BaselineReviewCycleSource,
            tenantBaseline?.BaselineReviewCycleCapturedUtc,
            measuredAvg,
            sampleSize,
            tenantBaseline?.BaselineManualPrepHoursPerReview,
            tenantBaseline?.BaselinePeoplePerReview,
            tenantBaseline?.ArchitectureTeamSize);
    }

    private sealed class FindingFeedbackAggRow
    {
        public long NetScore
        {
            get;
            init;
        }

        public long VoteCount
        {
            get;
            init;
        }
    }

    private sealed class TenantBaselineRow
    {
        public decimal? BaselineReviewCycleHours
        {
            get;
            init;
        }

        public string? BaselineReviewCycleSource
        {
            get;
            init;
        }

        public DateTimeOffset? BaselineReviewCycleCapturedUtc
        {
            get;
            init;
        }

        public decimal? BaselineManualPrepHoursPerReview
        {
            get;
            init;
        }

        public int? BaselinePeoplePerReview
        {
            get;
            init;
        }

        public int? ArchitectureTeamSize
        {
            get;
            init;
        }
    }

    private sealed class ReviewCycleMeasureRow
    {
        public decimal? AvgHours
        {
            get;
            init;
        }

        public long Cnt
        {
            get;
            init;
        }
    }

    private sealed class RunStatusSqlRow
    {
        public string LegacyRunStatusLabel
        {
            get;
            init;
        } = "";

        public long Cnt
        {
            get;
            init;
        }
    }
}
