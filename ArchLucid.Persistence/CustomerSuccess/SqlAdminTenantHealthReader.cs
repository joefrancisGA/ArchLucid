using System.Diagnostics.CodeAnalysis;
using ArchLucid.Core.Tenancy;

using ArchLucid.Core.Audit;
using ArchLucid.Core.CustomerSuccess;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.CustomerSuccess;

[ExcludeFromCodeCoverage(Justification = "SQL Server–dependent reader.")]
[TenantScopeExempt(TenantScopeExemptReason.Operational, "Operator health snapshot reader aggregates per-tenant catalog metrics for platform dashboards.")]
public sealed class SqlAdminTenantHealthReader(ISqlConnectionFactory connectionFactory) : IAdminTenantHealthReader
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<IReadOnlyList<AdminTenantHealthSummaryRow>> ListSummariesAsync(CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT
                               th.TenantId,
                               th.WorkspaceId,
                               th.ProjectId,
                               th.EngagementScore,
                               th.GovernanceScore,
                               ISNULL(runAgg.RunsLast7d, 0) AS RunsLast7d,
                               ISNULL(runAgg.CommitsLast7d, 0) AS CommitsLast7d,
                               ISNULL(runAgg.TotalRuns, 0) AS TotalRuns,
                               ISNULL(runAgg.CommittedRuns, 0) AS CommittedRuns,
                               ISNULL(runAgg.ComparisonEventsLast30Days, 0) AS ComparisonEventsLast30Days,
                               runAgg.LastActivityUtc
                           FROM dbo.TenantHealthScores th
                           OUTER APPLY (
                               SELECT
                                   COUNT(*) AS TotalRuns,
                                   SUM(CASE
                                       WHEN (
                                           NULLIF(LTRIM(RTRIM(r.CurrentManifestVersion)), N'') IS NOT NULL
                                           OR r.GoldenManifestId IS NOT NULL
                                       ) THEN 1
                                       ELSE 0
                                   END) AS CommittedRuns,
                                   SUM(CASE
                                       WHEN r.CreatedUtc >= DATEADD(DAY, -7, SYSUTCDATETIME()) THEN 1
                                       ELSE 0
                                   END) AS RunsLast7d,
                                   SUM(CASE
                                       WHEN r.CreatedUtc >= DATEADD(DAY, -7, SYSUTCDATETIME())
                                            AND (
                                                NULLIF(LTRIM(RTRIM(r.CurrentManifestVersion)), N'') IS NOT NULL
                                                OR r.GoldenManifestId IS NOT NULL
                                            ) THEN 1
                                       ELSE 0
                                   END) AS CommitsLast7d,
                                   MAX(r.CreatedUtc) AS LastActivityUtc,
                                   (
                                       SELECT COUNT_BIG(1)
                                       FROM dbo.AuditEvents ae
                                       WHERE ae.TenantId = th.TenantId
                                         AND ae.WorkspaceId = th.WorkspaceId
                                         AND ae.ProjectId = th.ProjectId
                                         AND ae.OccurredUtc >= DATEADD(DAY, -30, SYSUTCDATETIME())
                                         AND ae.EventType = @Comparison
                                   ) AS ComparisonEventsLast30Days
                               FROM dbo.Runs r
                               WHERE r.TenantId = th.TenantId
                                 AND r.WorkspaceId = th.WorkspaceId
                                 AND r.ScopeProjectId = th.ProjectId
                                 AND r.ArchivedUtc IS NULL
                           ) runAgg
                           ORDER BY th.EngagementScore ASC, th.TenantId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<AdminTenantHealthSqlRow> rows = await connection.QueryAsync<AdminTenantHealthSqlRow>(
            new CommandDefinition(
                sql,
                new { Comparison = AuditEventTypes.ComparisonSummaryPersisted },
                cancellationToken: cancellationToken));

        return rows
            .Select(static row => new AdminTenantHealthSummaryRow(
                row.TenantId,
                row.WorkspaceId,
                row.ProjectId,
                row.EngagementScore,
                row.GovernanceScore,
                ToInt(row.RunsLast7d),
                ToInt(row.CommitsLast7d),
                ToInt(row.TotalRuns),
                ToInt(row.CommittedRuns),
                ToInt(row.ComparisonEventsLast30Days),
                ToNullableUtcOffset(row.LastActivityUtc)))
            .ToList();
    }

    private static int ToInt(long value) => (int)Math.Min(int.MaxValue, value);

    private static DateTimeOffset? ToNullableUtcOffset(DateTime? utc)
    {
        if (utc is null)
            return null;

        return new DateTimeOffset(DateTime.SpecifyKind(utc.Value, DateTimeKind.Utc), TimeSpan.Zero);
    }

    private sealed record AdminTenantHealthSqlRow(
        Guid TenantId,
        Guid WorkspaceId,
        Guid ProjectId,
        decimal EngagementScore,
        decimal GovernanceScore,
        long RunsLast7d,
        long CommitsLast7d,
        long TotalRuns,
        long CommittedRuns,
        long ComparisonEventsLast30Days,
        DateTime? LastActivityUtc);
}
