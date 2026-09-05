using ArchLucid.Contracts.Governance;

using ArchLucid.Persistence.Sql;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Pilots;

public sealed partial class DapperPilotReportCardMetricsReader
{
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
                ExportKinds = ExportGeneratingAuditEvents,
                CanonicalShowcaseRunBaselineId = DemoRunSqlPredicates.CanonicalShowcaseRunBaselineId,
                CanonicalShowcaseRunHardenedId = DemoRunSqlPredicates.CanonicalShowcaseRunHardenedId,
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
                FROM dbo.GoldenManifests AS gmx WITH (NOLOCK)
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

        string followUpBatchSql =
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
            + CommittedRunsScopeFilterRuns
            + """

            GROUP BY fr.Severity
            ORDER BY fr.Severity;

            SELECT COUNT_BIG(*)
            FROM dbo.GovernanceApprovalRequests g WITH (NOLOCK)
            WHERE g.TenantId = @TenantId
              AND g.WorkspaceId = @WorkspaceId
              AND g.ProjectId = @ScopeProjectId
              AND g.Status IN @ApprovedStatuses;

            SELECT COUNT_BIG(*)
            FROM dbo.GovernanceApprovalRequests g WITH (NOLOCK)
            WHERE g.TenantId = @TenantId
              AND g.WorkspaceId = @WorkspaceId
              AND g.ProjectId = @ScopeProjectId
              AND g.Status = @RejectedStatus;

            SELECT COUNT_BIG(*)
            FROM dbo.AuditEvents ae WITH (NOLOCK)
            WHERE ae.TenantId = @TenantId
              AND ae.WorkspaceId = @WorkspaceId
              AND ae.ProjectId = @ScopeProjectId
              AND ae.EventType IN @ExportKinds;

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
            + CommittedRunsScopeFilterRunsInner
            + """

                       AND EXISTS (
                     SELECT 1
                     FROM dbo.GoldenManifests AS gmProbe WITH (NOLOCK)
                     WHERE gmProbe.ManifestId = abInner.ManifestId
                       AND gmProbe.RunId = abInner.RunId
                       AND gmProbe.TenantId = abInner.TenantId
                       AND gmProbe.WorkspaceId = abInner.WorkspaceId
                       AND gmProbe.ProjectId = abInner.ProjectId
                       AND gmProbe.ArchivedUtc IS NULL
                 )) AS abRow;
            """;

        await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
            new CommandDefinition(followUpBatchSql, parameters, cancellationToken: cancellationToken));

        List<PilotReportCardSeverityCountRow> severityBuckets =
            (await multi.ReadAsync<PilotReportCardSeverityCountRow>()).AsList();

        int governanceApproved = SafeToInt(await multi.ReadSingleAsync<object?>());
        int governanceRejected = SafeToInt(await multi.ReadSingleAsync<object?>());
        long exportsGenerated = await multi.ReadSingleAsync<long>();
        int artifactKinds = SafeToInt(await multi.ReadSingleAsync<object?>());

        int totalFindingRows = SafeToInt(summary.TotalFindingRowsSnapshot);

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
}
