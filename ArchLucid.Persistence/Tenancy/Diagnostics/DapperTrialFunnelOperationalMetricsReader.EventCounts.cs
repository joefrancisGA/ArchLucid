using ArchLucid.Core.Audit;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy.Diagnostics;

public sealed partial class DapperTrialFunnelOperationalMetricsReader
{
    private static async Task<Dictionary<string, int>> LoadEventCountsAsync(
        SqlConnection connection,
        DateTimeOffset sinceUtc,
        string[] eventTypes,
        string[] demoSlugs,
        CancellationToken cancellationToken)
    {
        const string countsSql = """
                                 SELECT ae.EventType, COUNT_BIG(1) AS EventCount
                                 FROM dbo.AuditEvents ae
                                 INNER JOIN dbo.Tenants t ON t.Id = ae.TenantId
                                 WHERE ae.OccurredUtc >= @SinceUtc
                                   AND ae.EventType IN @EventTypes
                                   AND t.Slug NOT IN @DemoSlugs
                                   AND t.OffboardedUtc IS NULL
                                 GROUP BY ae.EventType;
                                 """;

        IEnumerable<EventTypeCountRow> countRows = await connection.QueryAsync<EventTypeCountRow>(
            new CommandDefinition(
                countsSql,
                new { SinceUtc = sinceUtc.UtcDateTime, EventTypes = eventTypes, DemoSlugs = demoSlugs },
                cancellationToken: cancellationToken));

        return countRows.ToDictionary(
            static row => row.EventType,
            static row => (int)Math.Min(int.MaxValue, row.EventCount),
            StringComparer.Ordinal);
    }

    private static async Task<Dictionary<string, int>> LoadEventCountsBetweenAsync(
        SqlConnection connection,
        DateTimeOffset sinceUtc,
        DateTimeOffset untilUtc,
        string[] eventTypes,
        string[] demoSlugs,
        CancellationToken cancellationToken)
    {
        const string countsSql = """
                                 SELECT ae.EventType, COUNT_BIG(1) AS EventCount
                                 FROM dbo.AuditEvents ae
                                 INNER JOIN dbo.Tenants t ON t.Id = ae.TenantId
                                 WHERE ae.OccurredUtc >= @SinceUtc
                                   AND ae.OccurredUtc < @UntilUtc
                                   AND ae.EventType IN @EventTypes
                                   AND t.Slug NOT IN @DemoSlugs
                                   AND t.OffboardedUtc IS NULL
                                 GROUP BY ae.EventType;
                                 """;

        IEnumerable<EventTypeCountRow> countRows = await connection.QueryAsync<EventTypeCountRow>(
            new CommandDefinition(
                countsSql,
                new
                {
                    SinceUtc = sinceUtc.UtcDateTime,
                    UntilUtc = untilUtc.UtcDateTime,
                    EventTypes = eventTypes,
                    DemoSlugs = demoSlugs,
                },
                cancellationToken: cancellationToken));

        return countRows.ToDictionary(
            static row => row.EventType,
            static row => (int)Math.Min(int.MaxValue, row.EventCount),
            StringComparer.Ordinal);
    }

    private static async Task<List<double>> LoadSignupToCommitSecondsAsync(
        SqlConnection connection,
        DateTimeOffset sinceUtc,
        string[] demoSlugs,
        CancellationToken cancellationToken)
    {
        const string latencySql = """
                                  SELECT ae.DataJson
                                  FROM dbo.AuditEvents ae
                                  INNER JOIN dbo.Tenants t ON t.Id = ae.TenantId
                                  WHERE ae.OccurredUtc >= @SinceUtc
                                    AND ae.EventType = @FirstRunCompleted
                                    AND t.Slug NOT IN @DemoSlugs
                                    AND t.OffboardedUtc IS NULL;
                                  """;

        IEnumerable<string?> latencyPayloads = await connection.QueryAsync<string?>(
            new CommandDefinition(
                latencySql,
                new
                {
                    SinceUtc = sinceUtc.UtcDateTime,
                    FirstRunCompleted = AuditEventTypes.TrialFirstRunCompleted,
                    DemoSlugs = demoSlugs,
                },
                cancellationToken: cancellationToken));

        List<double> signupToCommitSeconds = [];

        foreach (string? payload in latencyPayloads)
        {
            if (TrialFunnelOperationalSummaryBuilder.TryReadSignupToCommitSeconds(payload, out double seconds))
                signupToCommitSeconds.Add(seconds);
        }

        return signupToCommitSeconds;
    }

    private static async Task<List<double>> LoadTrialStartToConversionSecondsAsync(
        SqlConnection connection,
        DateTimeOffset sinceUtc,
        string[] demoSlugs,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT DATEDIFF_BIG(SECOND, t.TrialStartUtc, ae.OccurredUtc) AS ElapsedSeconds
                           FROM dbo.AuditEvents ae
                           INNER JOIN dbo.Tenants t ON t.Id = ae.TenantId
                           WHERE ae.OccurredUtc >= @SinceUtc
                             AND ae.EventType = @Converted
                             AND t.TrialStartUtc IS NOT NULL
                             AND t.Slug NOT IN @DemoSlugs
                             AND t.OffboardedUtc IS NULL;
                           """;

        IEnumerable<long?> rows = await connection.QueryAsync<long?>(
            new CommandDefinition(
                sql,
                new
                {
                    SinceUtc = sinceUtc.UtcDateTime,
                    Converted = AuditEventTypes.TenantTrialConverted,
                    DemoSlugs = demoSlugs,
                },
                cancellationToken: cancellationToken));

        List<double> samples = [];

        foreach (long? elapsed in rows)
        {
            if (elapsed is > 0 and <= int.MaxValue)
                samples.Add(elapsed.Value);
        }

        return samples;
    }

    private static async Task<IReadOnlyList<decimal>> LoadFirstReviewCogsSamplesAsync(
        SqlConnection connection,
        DateTimeOffset sinceUtc,
        string[] demoSlugs,
        CancellationToken cancellationToken)
    {
        DateTime utcNow = TimeProvider.System.UtcNowDateTime();

        const string sql = """
                           SELECT (s.SpentUsd + s.ReservedAssumedUsd) AS TotalPressureUsd
                           FROM dbo.Tenants t
                           INNER JOIN dbo.LlmMonthlyTenantBudgetState s
                             ON s.TenantId = t.Id
                            AND s.UtcYear = @UtcYear
                            AND s.UtcMonth = @UtcMonth
                           WHERE t.TrialFirstManifestCommittedUtc IS NOT NULL
                             AND t.TrialFirstManifestCommittedUtc >= @SinceUtc
                             AND (s.SpentUsd + s.ReservedAssumedUsd) > 0
                             AND t.Slug NOT IN @DemoSlugs
                             AND t.OffboardedUtc IS NULL;
                           """;

        IEnumerable<decimal> samples = await connection.QueryAsync<decimal>(
            new CommandDefinition(
                sql,
                new
                {
                    SinceUtc = sinceUtc.UtcDateTime,
                    UtcYear = utcNow.Year,
                    UtcMonth = utcNow.Month,
                    DemoSlugs = demoSlugs,
                },
                cancellationToken: cancellationToken));

        return samples.ToList();
    }

    private sealed class EventTypeCountRow
    {
        public string EventType { get; init; } = string.Empty;

        public long EventCount
        {
            get;
            init;
        }
    }
}
