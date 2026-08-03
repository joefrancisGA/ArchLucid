using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Coordination.Diagnostics;

/// <summary>
/// Fleet-wide stale in-flight run metrics. Aligns with
/// <c>DataConsistencyReconciliationSql.StaleInFlightRuns</c> (Created / TasksGenerated / WaitingForResults / Retrying older than 1h).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL-dependent; integration environments exercise via host.")]
[TenantScopeExempt(
    TenantScopeExemptReason.Operational,
    "Operational stale-run gauges aggregate within the tenant catalog for fleet monitoring; triage samples are log-only.")]
public sealed class DapperStaleInFlightRunMetricsReader(ISqlConnectionFactory connectionFactory)
    : IStaleInFlightRunMetricsReader
{
    // Same status set and 1h threshold as DataConsistencyReconciliationSql.StaleInFlightRuns.
    private const string SnapshotSql = """
                                       SELECT
                                           COUNT_BIG(1) AS StaleCount,
                                           COALESCE(
                                               MAX(DATEDIFF_BIG(SECOND, r.CreatedUtc, SYSUTCDATETIME())),
                                               CAST(0 AS BIGINT)) AS OldestAgeSeconds
                                       FROM dbo.Runs r
                                       WHERE r.ArchivedUtc IS NULL
                                         AND r.LegacyRunStatus IN (N'Created', N'TasksGenerated', N'WaitingForResults', N'Retrying')
                                         AND r.CreatedUtc < DATEADD(HOUR, -1, SYSUTCDATETIME());

                                       SELECT TOP (5)
                                           r.TenantId,
                                           r.RunId,
                                           r.LegacyRunStatus AS Status,
                                           CAST(DATEDIFF_BIG(SECOND, r.CreatedUtc, SYSUTCDATETIME()) AS float) AS AgeSeconds
                                       FROM dbo.Runs r
                                       WHERE r.ArchivedUtc IS NULL
                                         AND r.LegacyRunStatus IN (N'Created', N'TasksGenerated', N'WaitingForResults', N'Retrying')
                                         AND r.CreatedUtc < DATEADD(HOUR, -1, SYSUTCDATETIME())
                                       ORDER BY r.CreatedUtc ASC;
                                       """;

    /// <inheritdoc />
    public async Task<StaleInFlightRunMetricsSnapshot> ReadSnapshotAsync(
        CancellationToken cancellationToken = default)
    {
        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
            new CommandDefinition(SnapshotSql, cancellationToken: cancellationToken));

        AggregateRow aggregate = (await multi.ReadAsync<AggregateRow>()).FirstOrDefault() ?? new AggregateRow();
        List<StaleInFlightRunTriageSample> samples =
            (await multi.ReadAsync<StaleInFlightRunTriageSample>()).ToList();

        return new StaleInFlightRunMetricsSnapshot
        {
            StaleInFlightCount = aggregate.StaleCount,
            OldestStaleAgeSeconds = aggregate.OldestAgeSeconds,
            TriageSamples = samples,
        };
    }

    private sealed class AggregateRow
    {
        public long StaleCount
        {
            get;
            init;
        }

        public long OldestAgeSeconds
        {
            get;
            init;
        }
    }
}
