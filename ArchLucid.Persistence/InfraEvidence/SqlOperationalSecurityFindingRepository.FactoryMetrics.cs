using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Connections;

using Dapper;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed partial class SqlOperationalSecurityFindingRepository
{
    public async Task<IReadOnlyDictionary<Guid, IReadOnlyList<Guid>>> ListFindingIdsBySnapshotInScopeAsync(
        ProjectScopeKey scope,
        Guid snapshotId,
        CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT f.PathId, f.FindingId
                           FROM dbo.OperationalSecurityFindings f
                           INNER JOIN dbo.SecurityEvidencePaths p
                               ON p.TenantId = f.TenantId
                               AND p.PathId = f.PathId
                           WHERE f.TenantId = @TenantId
                             AND f.WorkspaceId = @WorkspaceId
                             AND f.ProjectId = @ProjectId
                             AND p.SnapshotId = @SnapshotId
                             AND f.PathId IS NOT NULL
                           ORDER BY f.PathId, f.LastObservedUtc DESC, f.FindingId;
                           """;

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<PathFindingRow> rows = await conn.QueryAsync<PathFindingRow>(
            new CommandDefinition(
                sql,
                new
                {
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId,
                    SnapshotId = snapshotId,
                },
                cancellationToken: cancellationToken));

        Dictionary<Guid, List<Guid>> grouped = [];

        foreach (PathFindingRow row in rows)
        {
            if (!grouped.TryGetValue(row.PathId, out List<Guid>? findingIds))
            {
                findingIds = [];
                grouped[row.PathId] = findingIds;
            }

            findingIds.Add(row.FindingId);
        }

        return grouped.ToDictionary(
            pair => pair.Key,
            pair => (IReadOnlyList<Guid>)pair.Value);
    }

    public async Task<RemediationFactoryFindingMetricsAggregate> GetFactoryFindingMetricsAggregateInScopeAsync(
        ProjectScopeKey scope,
        DateTime weekStartUtc,
        DateTime utcNow,
        CancellationToken cancellationToken = default)
    {
        const string summarySql = """
                                  SELECT
                                      SUM(CASE WHEN Status IN (@OpenStatus, @RecurredStatus) THEN 1 ELSE 0 END) AS OpenFindings,
                                      SUM(CASE WHEN Status IN (@OpenStatus, @RecurredStatus)
                                          AND (
                                              LOWER(Severity) = 'critical'
                                              OR LOWER(Exposure) IN ('high', 'critical')
                                          ) THEN 1 ELSE 0 END) AS CriticalExposureCount,
                                      SUM(CASE WHEN CreatedUtc >= @WeekStartUtc THEN 1 ELSE 0 END) AS CreatedThisWeek,
                                      SUM(CASE WHEN Status = @RecurredStatus THEN 1 ELSE 0 END) AS RecurrenceCount,
                                      AVG(CASE WHEN Status IN (@OpenStatus, @RecurredStatus)
                                          THEN DATEDIFF(second, FirstObservedUtc, @UtcNow) / 86400.0
                                          ELSE NULL END) AS AverageAgeDays
                                  FROM dbo.OperationalSecurityFindings
                                  WHERE TenantId = @TenantId
                                    AND WorkspaceId = @WorkspaceId
                                    AND ProjectId = @ProjectId;
                                  """;

        const string topControlsSql = """
                                      SELECT TOP (5) ControlId AS [Key], COUNT(1) AS Count
                                      FROM dbo.OperationalSecurityFindings
                                      WHERE TenantId = @TenantId
                                        AND WorkspaceId = @WorkspaceId
                                        AND ProjectId = @ProjectId
                                        AND Status IN (@OpenStatus, @RecurredStatus)
                                        AND ControlId IS NOT NULL
                                        AND LTRIM(RTRIM(ControlId)) <> ''
                                      GROUP BY ControlId
                                      ORDER BY COUNT(1) DESC, ControlId;
                                      """;

        object parameters = new
        {
            scope.TenantId,
            scope.WorkspaceId,
            scope.ProjectId,
            WeekStartUtc = weekStartUtc,
            UtcNow = utcNow,
            OpenStatus = (int)OperationalSecurityFindingStatus.Open,
            RecurredStatus = (int)OperationalSecurityFindingStatus.Recurred,
        };

        using System.Data.IDbConnection conn = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        FindingMetricsSummaryRow? summary = await conn.QuerySingleOrDefaultAsync<FindingMetricsSummaryRow>(
            new CommandDefinition(summarySql, parameters, cancellationToken: cancellationToken));

        IEnumerable<RemediationFactoryMetricKeyCount> topControls = await conn.QueryAsync<RemediationFactoryMetricKeyCount>(
            new CommandDefinition(topControlsSql, parameters, cancellationToken: cancellationToken));

        return new RemediationFactoryFindingMetricsAggregate
        {
            OpenFindings = summary?.OpenFindings ?? 0,
            CriticalExposureCount = summary?.CriticalExposureCount ?? 0,
            CreatedThisWeek = summary?.CreatedThisWeek ?? 0,
            RecurrenceCount = summary?.RecurrenceCount ?? 0,
            AverageAgeDays = summary?.AverageAgeDays ?? 0,
            TopControlIds = topControls.ToList(),
        };
    }

    private sealed class PathFindingRow
    {
        public Guid PathId
        {
            get;
            init;
        }

        public Guid FindingId
        {
            get;
            init;
        }
    }

    private sealed class FindingMetricsSummaryRow
    {
        public int OpenFindings
        {
            get;
            init;
        }

        public int CriticalExposureCount
        {
            get;
            init;
        }

        public int CreatedThisWeek
        {
            get;
            init;
        }

        public int RecurrenceCount
        {
            get;
            init;
        }

        public double? AverageAgeDays
        {
            get;
            init;
        }
    }
}
