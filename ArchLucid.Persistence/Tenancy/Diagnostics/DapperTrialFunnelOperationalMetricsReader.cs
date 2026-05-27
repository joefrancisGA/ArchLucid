using ArchLucid.Contracts.Operations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Tenancy.Diagnostics;

public sealed class DapperTrialFunnelOperationalMetricsReader(ISqlConnectionFactory connectionFactory)
    : ITrialFunnelOperationalMetricsReader
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    public async Task<long> CountActiveSelfServiceTrialsAsync(CancellationToken cancellationToken = default)
    {
        const string sql = """
                           SELECT COUNT_BIG(1)
                           FROM dbo.Tenants
                           WHERE TrialExpiresUtc IS NOT NULL
                             AND TrialStatus = @Active;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        long count = await connection.ExecuteScalarAsync<long>(
            new CommandDefinition(
                sql,
                new { TrialLifecycleStatus.Active },
                cancellationToken: cancellationToken));

        return count;
    }

    public async Task<TrialFunnelOperationalSummaryResponse> GetOperationalSummaryAsync(
        CancellationToken cancellationToken = default)
    {
        long activeTrials = await CountActiveSelfServiceTrialsAsync(cancellationToken);
        DateTimeOffset since = TimeProvider.System.UtcNowDateTime().AddDays(-30);

        const string countsSql = """
                                 SELECT EventType, COUNT_BIG(1) AS EventCount
                                 FROM dbo.AuditEvents
                                 WHERE OccurredUtc >= @SinceUtc
                                   AND EventType IN @EventTypes
                                 GROUP BY EventType;
                                 """;

        string[] eventTypes =
        [
            AuditEventTypes.TrialSignupAttempted,
            AuditEventTypes.TrialSignupFailed,
            AuditEventTypes.TrialFirstRunCompleted,
            AuditEventTypes.TenantTrialConverted,
            AuditEventTypes.BillingCheckoutInitiated,
            AuditEventTypes.BillingCheckoutCompleted,
            AuditEventTypes.LlmTenantMonthlyDollarBudgetApproaching,
        ];

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IEnumerable<EventTypeCountRow> countRows = await connection.QueryAsync<EventTypeCountRow>(
            new CommandDefinition(
                countsSql,
                new { SinceUtc = since.UtcDateTime, EventTypes = eventTypes },
                cancellationToken: cancellationToken));

        Dictionary<string, int> counts = countRows.ToDictionary(
            static row => row.EventType,
            static row => (int)Math.Min(int.MaxValue, row.EventCount),
            StringComparer.Ordinal);

        const string latencySql = """
                                  SELECT DataJson
                                  FROM dbo.AuditEvents
                                  WHERE OccurredUtc >= @SinceUtc
                                    AND EventType = @FirstRunCompleted;
                                  """;

        IEnumerable<string?> latencyPayloads = await connection.QueryAsync<string?>(
            new CommandDefinition(
                latencySql,
                new { SinceUtc = since.UtcDateTime, FirstRunCompleted = AuditEventTypes.TrialFirstRunCompleted },
                cancellationToken: cancellationToken));

        List<double> signupToCommitSeconds = [];

        foreach (string? payload in latencyPayloads)
        {
            if (TrialFunnelOperationalSummaryBuilder.TryReadSignupToCommitSeconds(payload, out double seconds))
                signupToCommitSeconds.Add(seconds);
        }

        int signupAttempts = counts.GetValueOrDefault(AuditEventTypes.TrialSignupAttempted);
        int signupFailures = counts.GetValueOrDefault(AuditEventTypes.TrialSignupFailed);
        int firstCommits = counts.GetValueOrDefault(AuditEventTypes.TrialFirstRunCompleted);
        int conversions = counts.GetValueOrDefault(AuditEventTypes.TenantTrialConverted);
        int checkouts = counts.GetValueOrDefault(AuditEventTypes.BillingCheckoutInitiated)
                        + counts.GetValueOrDefault(AuditEventTypes.BillingCheckoutCompleted);
        int budgetCutoffs = counts.GetValueOrDefault(AuditEventTypes.LlmTenantMonthlyDollarBudgetApproaching);

        return TrialFunnelOperationalSummaryBuilder.Build(
            activeTrials,
            signupAttempts,
            signupFailures,
            firstCommits,
            conversions,
            checkouts,
            budgetCutoffs,
            signupToCommitSeconds,
            firstReviewCogsUsd: []);
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
