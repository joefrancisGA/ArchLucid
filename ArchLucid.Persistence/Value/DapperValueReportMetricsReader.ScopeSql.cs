using ArchLucid.Persistence.Sql;

namespace ArchLucid.Persistence.Value;

public sealed partial class DapperValueReportMetricsReader
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
}
