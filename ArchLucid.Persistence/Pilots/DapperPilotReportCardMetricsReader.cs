using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Governance;

using ArchLucid.Core.Audit;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Pilots;

/// <inheritdoc cref="IPilotReportCardMetricsReader" />
[ExcludeFromCodeCoverage(Justification = "SQL-backed reader; exercised via integration workloads.")]
public sealed class DapperPilotReportCardMetricsReader(IReadOnlyDbConnectionFactory connectionFactory)
    : IPilotReportCardMetricsReader
{
    /// <remarks>
    ///     Durable exporter audit tails surfaced to sponsors/operators (subset excludes pure comparison bookkeeping rows).
    /// </remarks>
    private static readonly string[] ExportGeneratingAuditEvents =
    [
        AuditEventTypes.ArchitectureDocxExportGenerated,
        AuditEventTypes.RunExported,
        AuditEventTypes.ValueReportGenerated,
        AuditEventTypes.ReplayExportRecorded,
        AuditEventTypes.ArchitectureAnalysisReportGenerated
    ];

    private readonly IReadOnlyDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private const string CommittedRunsScopeFilterRuns = """

                                                          r.TenantId = @TenantId
                                                              AND r.WorkspaceId = @WorkspaceId
                                                              AND r.ScopeProjectId = @ScopeProjectId
                                                              AND r.ArchivedUtc IS NULL
                                                              AND (
                                                                  (NULLIF(LTRIM(RTRIM(r.CurrentManifestVersion)), N'') IS NOT NULL)
                                                                  OR (r.GoldenManifestId IS NOT NULL)
                                                              )

                                                          """;

    private const string CommittedRunsScopeFilterRunsInner = """

                                                               rInner.TenantId = @TenantId
                                                                   AND rInner.WorkspaceId = @WorkspaceId
                                                                   AND rInner.ScopeProjectId = @ScopeProjectId
                                                                   AND rInner.ArchivedUtc IS NULL
                                                                   AND (
                                                                       (NULLIF(LTRIM(RTRIM(rInner.CurrentManifestVersion)), N'') IS NOT NULL)
                                                                       OR (rInner.GoldenManifestId IS NOT NULL)
                                                                   )

                                                               """;

    /// <inheritdoc/>
    public async Task<PilotReportCardScopeMetrics> ReadAsync(Guid tenantId, Guid workspaceId, Guid scopeProjectId,
        CancellationToken cancellationToken)
    {
        object parameters =
            new
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ScopeProjectId = scopeProjectId,
                ApprovedStatuses =
                    new[]
                    {
                        GovernanceApprovalStatus.Approved, GovernanceApprovalStatus.Promoted,
                        GovernanceApprovalStatus.Activated
                    },
                RejectedStatus = GovernanceApprovalStatus.Rejected,
                ExportKinds = ExportGeneratingAuditEvents
            };

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        string summarySql =
            """

            SELECT COUNT_BIG(*) AS TotalRuns,
                   MIN(r.CreatedUtc) AS PeriodStartUtc,
                   MAX(
                       COALESCE(
                           mg.ManifestCommittedUtc,
                           r.CompletedUtc,
                           r.CreatedUtc)) AS PeriodEndUtc,
                   AVG(CAST(commitLag.CommitSeconds AS FLOAT)) AS AverageRequestToCommitSeconds,
                   (SELECT COUNT_BIG(*)
                    FROM dbo.FindingRecords AS frAgg WITH (NOLOCK)
                             INNER JOIN dbo.GoldenManifests AS gmAgg WITH (NOLOCK)
                                        ON gmAgg.FindingsSnapshotId = frAgg.FindingsSnapshotId
                             INNER JOIN dbo.Runs AS rAgg WITH (NOLOCK) ON rAgg.RunId = gmAgg.RunId
                    WHERE rAgg.ArchivedUtc IS NULL
                      AND gmAgg.ArchivedUtc IS NULL
                      AND rAgg.TenantId = @TenantId
                      AND rAgg.WorkspaceId = @WorkspaceId
                      AND rAgg.ScopeProjectId = @ScopeProjectId
                      AND (
                           (NULLIF(LTRIM(RTRIM(rAgg.CurrentManifestVersion)), N'') IS NOT NULL)
                        OR (rAgg.GoldenManifestId IS NOT NULL)
                       )) AS TotalFindingRowsSnapshot
            FROM dbo.Runs AS r WITH (NOLOCK)
                     OUTER APPLY (
                SELECT TOP (1)
                           DATEDIFF_BIG(SECOND, r.CreatedUtc, gm.CreatedUtc) AS CommitSeconds
                FROM dbo.GoldenManifests AS gm WITH (NOLOCK)
                WHERE gm.RunId = r.RunId
                  AND gm.TenantId = r.TenantId
                  AND gm.WorkspaceId = r.WorkspaceId
                  AND gm.ProjectId = r.ScopeProjectId
                  AND gm.ArchivedUtc IS NULL
                ORDER BY gm.CreatedUtc ASC
            ) AS commitLag
                     OUTER APPLY (
                SELECT MAX(gmx.CreatedUtc) AS ManifestCommittedUtc
                FROM dbo.GoldenManifests AS gm WITH (NOLOCK)x WITH (NOLOCK)
                WHERE gmx.RunId = r.RunId
                  AND gmx.TenantId = r.TenantId
                  AND gmx.WorkspaceId = r.WorkspaceId
                  AND gmx.ProjectId = r.ScopeProjectId
                  AND gmx.ArchivedUtc IS NULL
            ) AS mg
            WHERE 

            """

            +
            CommittedRunsScopeFilterRuns;

        SummaryRow summary = await connection.QuerySingleAsync<SummaryRow>(
            new CommandDefinition(summarySql, parameters, cancellationToken: cancellationToken));

        string findingSql =
            """

            SELECT COALESCE(fr.Severity, '(unknown)') AS Severity,
                   COUNT_BIG(*) AS SeverityBucketCount
            FROM dbo.FindingRecords AS fr WITH (NOLOCK)
                     INNER JOIN dbo.GoldenManifests AS gm WITH (NOLOCK)
                                ON gm.FindingsSnapshotId = fr.FindingsSnapshotId
                                   AND gm.ArchivedUtc IS NULL
                     INNER JOIN dbo.Runs AS r WITH (NOLOCK) ON r.RunId = gm.RunId

            WHERE 

            """

            +
            CommittedRunsScopeFilterRuns
            +
            """

            GROUP BY fr.Severity
            ORDER BY fr.Severity;

            """;

        List<PilotReportCardSeverityCountRow> severityBuckets =
            (await connection.QueryAsync<PilotReportCardSeverityCountRow>(
                    new CommandDefinition(findingSql, parameters, cancellationToken: cancellationToken)))
                .AsList();

        const string govApprovedSql =
            """

            SELECT COUNT_BIG(*)
            FROM dbo.GovernanceApprovalRequests g WITH (NOLOCK)
            WHERE g.TenantId = @TenantId
              AND g.WorkspaceId = @WorkspaceId
              AND g.ProjectId = @ScopeProjectId
              AND g.Status IN @ApprovedStatuses;

            """;

        const string govRejectedSql =
            """

            SELECT COUNT_BIG(*)
            FROM dbo.GovernanceApprovalRequests g WITH (NOLOCK)
            WHERE g.TenantId = @TenantId
              AND g.WorkspaceId = @WorkspaceId
              AND g.ProjectId = @ScopeProjectId
              AND g.Status = @RejectedStatus;

            """;

        const string exportAuditSql =
            """

            SELECT COUNT_BIG(*)
            FROM dbo.AuditEvents ae WITH (NOLOCK)
            WHERE ae.TenantId = @TenantId
              AND ae.WorkspaceId = @WorkspaceId
              AND ae.ProjectId = @ScopeProjectId
              AND ae.EventType IN @ExportKinds;

            """;


        string artifactTypeSql =
            """

            SELECT COUNT_BIG(DISTINCT abRow.ArtifactType)
            FROM (
                     SELECT DISTINCT
                            abInner.TenantId,
                            abInner.WorkspaceId,
                            abInner.ProjectId,
                            art.ArtifactType
                     FROM dbo.ArtifactBundleArtifacts AS art WITH (NOLOCK)
                              INNER JOIN dbo.ArtifactBundles AS abInner WITH (NOLOCK) ON abInner.BundleId = art.BundleId
                              INNER JOIN dbo.Runs AS rInner WITH (NOLOCK) ON rInner.RunId = abInner.RunId
                     WHERE abInner.ArchivedUtc IS NULL

                       AND 

            """

            +
            CommittedRunsScopeFilterRunsInner
            +
            """

                       AND EXISTS (
                     SELECT 1
                     FROM dbo.GoldenManifests AS gm WITH (NOLOCK)Probe WITH (NOLOCK)
                     WHERE gmProbe.ManifestId = abInner.ManifestId
                       AND gmProbe.RunId = abInner.RunId
                       AND gmProbe.TenantId = abInner.TenantId
                       AND gmProbe.WorkspaceId = abInner.WorkspaceId
                       AND gmProbe.ProjectId = abInner.ProjectId
                       AND gmProbe.ArchivedUtc IS NULL

                 )) AS abRow;

            """;

        int totalFindingRows = SafeToInt(summary.TotalFindingRowsSnapshot);

        int governanceApproved =
            SafeToInt(
                await connection.QuerySingleAsync<object?>(
                    new CommandDefinition(govApprovedSql, parameters, cancellationToken: cancellationToken)));

        int governanceRejected =
            SafeToInt(
                await connection.QuerySingleAsync<object?>(
                    new CommandDefinition(govRejectedSql, parameters, cancellationToken: cancellationToken)));

        long exportsGenerated =
            await connection.QuerySingleAsync<long>(
                new CommandDefinition(exportAuditSql, parameters, cancellationToken: cancellationToken));

        int artifactKinds =
            SafeToInt(
                await connection.QuerySingleAsync<object?>(
                    new CommandDefinition(artifactTypeSql, parameters, cancellationToken: cancellationToken)));

        int derivedSum =
            severityBuckets.Sum(static row =>
                row.SeverityBucketCount > int.MaxValue ? int.MaxValue : (int)Math.Min(row.SeverityBucketCount, int.MaxValue));

        return new PilotReportCardScopeMetrics
        {
            TotalCompletedRuns = SafeToInt(summary.TotalRuns),
            PeriodStartUtc = summary.PeriodStartUtc,
            PeriodEndUtc = summary.PeriodEndUtc,
            AverageRequestToCommitWallSeconds = NormalizeAverageSeconds(summary.AverageRequestToCommitSeconds),
            TotalFindings = Math.Max(totalFindingRows, derivedSum),
            FindingsBySeverity = severityBuckets,
            GovernanceApprovalActions = governanceApproved,
            GovernanceRejections = governanceRejected,
            ExportsGenerated = exportsGenerated,
            UniqueSynthesizedArtifactTypes = artifactKinds
        };
    }

    private static double? NormalizeAverageSeconds(double? raw)
    {
        if (raw is null)
            return null;

        double v = raw.Value;

        return double.IsNaN(v) || double.IsInfinity(v) ? null : v;
    }

    private static int SafeToInt(object? value)
    {
        switch (value)
        {
            case null:

                return 0;
            case int i:

                return i;
            case long l:

                return l > int.MaxValue ? int.MaxValue : (int)l;
            default:

                return Convert.ToInt32(value, System.Globalization.CultureInfo.InvariantCulture);
        }
    }

    private sealed class SummaryRow
    {
        public object? TotalRuns
        {
            get;
            init;
        }

        public DateTime? PeriodStartUtc
        {
            get;
            init;
        }

        public DateTime? PeriodEndUtc
        {
            get;
            init;
        }

        public double? AverageRequestToCommitSeconds
        {
            get;
            init;
        }

        public object? TotalFindingRowsSnapshot
        {
            get;
            init;
        }
    }
}
