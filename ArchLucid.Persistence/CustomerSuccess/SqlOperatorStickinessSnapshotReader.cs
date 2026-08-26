using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.CustomerSuccess;

[ExcludeFromCodeCoverage(Justification = "SQL Server–dependent reader.")]
public sealed class SqlOperatorStickinessSnapshotReader(
    IReadOnlyDbConnectionFactory connectionFactory)
    : IOperatorStickinessSnapshotReader
{
    private const string CommittedLegacyStatus = nameof(ArchitectureRunStatus.Committed);

    private readonly IReadOnlyDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<OperatorStickinessSignals> GetOperatorSignalsAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken)
    {
        string sql = $"""
                           SELECT
                               (SELECT COUNT(*)
                                FROM dbo.Runs r
                                WHERE r.TenantId = @TenantId
                                  AND r.WorkspaceId = @WorkspaceId
                                  AND r.ScopeProjectId = @ProjectId
                                  AND r.ArchivedUtc IS NULL) AS TotalRuns,
                               (SELECT COUNT(*)
                                FROM dbo.Runs r
                                WHERE r.TenantId = @TenantId
                                  AND r.WorkspaceId = @WorkspaceId
                                  AND r.ScopeProjectId = @ProjectId
                                  AND r.ArchivedUtc IS NULL
                                  AND {OperatorStickinessCommittedRunSql.CommittedRunsWhereClause}) AS CommittedRuns,
                               (SELECT TOP (1) r.RunId
                                FROM dbo.Runs r
                                WHERE r.TenantId = @TenantId
                                  AND r.WorkspaceId = @WorkspaceId
                                  AND r.ScopeProjectId = @ProjectId
                                  AND r.ArchivedUtc IS NULL
                                ORDER BY r.CreatedUtc DESC, r.RunId ASC) AS LatestRunId,
                               (SELECT COUNT_BIG(1)
                                FROM dbo.AuditEvents ae
                                WHERE ae.TenantId = @TenantId
                                  AND ae.WorkspaceId = @WorkspaceId
                                  AND ae.ProjectId = @ProjectId
                                  AND ae.OccurredUtc >= DATEADD(DAY, -30, SYSUTCDATETIME())
                                  AND ae.EventType = @Comparison) AS Comparisons30d,
                               (SELECT COUNT_BIG(1)
                                FROM dbo.GovernanceApprovalRequests g
                                WHERE g.TenantId = @TenantId
                                  AND g.WorkspaceId = @WorkspaceId
                                  AND g.ProjectId = @ProjectId
                                  AND g.Status NOT IN (N'Approved', N'Rejected')) AS GovPending;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        OperatorSignalsRow row = await connection.QuerySingleAsync<OperatorSignalsRow>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId, Comparison = AuditEventTypes.ComparisonSummaryPersisted, CommittedStatus = CommittedLegacyStatus },
                cancellationToken: cancellationToken));

        return new OperatorStickinessSignals(
            ToInt(row.TotalRuns),
            ToInt(row.CommittedRuns),
            row.LatestRunId,
            ToInt(row.Comparisons30D),
            ToInt(row.GovPending));
    }

    public async Task<PilotFunnelSnapshot> GetFunnelSnapshotAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken)
    {
        string sql = $"""
                           SELECT
                               (SELECT MIN(r.CreatedUtc)
                                FROM dbo.Runs r
                                WHERE r.TenantId = @TenantId
                                  AND r.WorkspaceId = @WorkspaceId
                                  AND r.ScopeProjectId = @ProjectId
                                  AND r.ArchivedUtc IS NULL) AS FirstRunUtc,
                               (SELECT MIN(gm.CreatedUtc)
                                FROM dbo.GoldenManifests gm
                                INNER JOIN dbo.Runs r ON r.RunId = gm.RunId
                                WHERE r.TenantId = @TenantId
                                  AND r.WorkspaceId = @WorkspaceId
                                  AND r.ScopeProjectId = @ProjectId
                                  AND r.ArchivedUtc IS NULL) AS FirstManifestUtc,
                               (SELECT MIN(ae.OccurredUtc)
                                FROM dbo.AuditEvents ae
                                WHERE ae.TenantId = @TenantId
                                  AND ae.WorkspaceId = @WorkspaceId
                                  AND ae.ProjectId = @ProjectId
                                  AND ae.EventType = @Comparison) AS FirstComparisonUtc,
                               (SELECT MIN(ae.OccurredUtc)
                                FROM dbo.AuditEvents ae
                                WHERE ae.TenantId = @TenantId
                                  AND ae.WorkspaceId = @WorkspaceId
                                  AND ae.ProjectId = @ProjectId
                                  AND ae.EventType IN (@ArtDl, @BundleDl)) AS FirstDownloadUtc,
                               (SELECT MIN(ae.OccurredUtc)
                                FROM dbo.AuditEvents ae
                                WHERE ae.TenantId = @TenantId
                                  AND ae.WorkspaceId = @WorkspaceId
                                  AND ae.ProjectId = @ProjectId
                                  AND ae.EventType = @Replay) AS FirstReplayUtc,
                               (SELECT COUNT(*)
                                FROM dbo.Runs r
                                WHERE r.TenantId = @TenantId
                                  AND r.WorkspaceId = @WorkspaceId
                                  AND r.ScopeProjectId = @ProjectId
                                  AND r.ArchivedUtc IS NULL) AS TotalRuns,
                               (SELECT COUNT(*)
                                FROM dbo.Runs r
                                WHERE r.TenantId = @TenantId
                                  AND r.WorkspaceId = @WorkspaceId
                                  AND r.ScopeProjectId = @ProjectId
                                  AND r.ArchivedUtc IS NULL
                                  AND {OperatorStickinessCommittedRunSql.CommittedRunsWhereClause}) AS CommittedRuns,
                               (SELECT COUNT_BIG(1)
                                FROM dbo.ProductLearningPilotSignals s
                                WHERE s.TenantId = @TenantId
                                  AND s.WorkspaceId = @WorkspaceId
                                  AND s.ProjectId = @ProjectId
                                  AND s.RecordedUtc >= DATEADD(DAY, -90, SYSUTCDATETIME())) AS PlSignals90d;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        FunnelRow row = await connection.QuerySingleAsync<FunnelRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    Comparison = AuditEventTypes.ComparisonSummaryPersisted,
                    ArtDl = AuditEventTypes.ArtifactDownloaded,
                    BundleDl = AuditEventTypes.BundleDownloaded,
                    Replay = AuditEventTypes.ReplayExecuted,
                    CommittedStatus = CommittedLegacyStatus
                },
                cancellationToken: cancellationToken));

        return new PilotFunnelSnapshot(
            ToNullableUtcDateTime(row.FirstRunUtc),
            ToNullableUtcDateTime(row.FirstManifestUtc),
            ToNullableUtcDateTime(row.FirstComparisonUtc),
            ToNullableUtcDateTime(row.FirstDownloadUtc),
            ToNullableUtcDateTime(row.FirstReplayUtc),
            ToInt(row.TotalRuns),
            ToInt(row.CommittedRuns),
            ToInt(row.PlSignals90D));
    }

    // COUNT_BIG returns bigint; cap to int range for domain model compatibility.
    private static int ToInt(long v) => v > int.MaxValue ? int.MaxValue : (int)v;

    internal static DateTime? ToNullableUtcDateTimeForTests(object? value) => ToNullableUtcDateTime(value);

    private static DateTime? ToNullableUtcDateTime(object? value)
    {
        if (value is null or DBNull)
            return null;

        if (value is DateTime dt)
            return DateTime.SpecifyKind(dt, DateTimeKind.Utc);

        return null;
    }

    private sealed class OperatorSignalsRow
    {
        public long TotalRuns { get; init; }

        public long CommittedRuns { get; init; }

        public Guid? LatestRunId { get; init; }

        public long Comparisons30D { get; init; }

        public long GovPending { get; init; }
    }

    private sealed class FunnelRow
    {
        public object? FirstRunUtc { get; init; }

        public object? FirstManifestUtc { get; init; }

        public object? FirstComparisonUtc { get; init; }

        public object? FirstDownloadUtc { get; init; }

        public object? FirstReplayUtc { get; init; }

        public long TotalRuns { get; init; }

        public long CommittedRuns { get; init; }

        public long PlSignals90D { get; init; }
    }
}
