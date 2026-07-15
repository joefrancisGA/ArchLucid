using ArchLucid.Contracts.Operations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;

namespace ArchLucid.Persistence.Tenancy.Diagnostics;

[TenantScopeExempt(TenantScopeExemptReason.Operational, "Trial funnel operational metrics aggregate within tenant catalog for monitoring.")]
public sealed class DapperTrialFunnelOperationalMetricsReader(
    ISqlConnectionFactory connectionFactory,
    IOptionsMonitor<LlmCostEstimationOptions> costOptionsMonitor,
    IOptionsMonitor<AiUsageControlsOptions> usageControlsOptionsMonitor)
    : ITrialFunnelOperationalMetricsReader
{
    private readonly ISqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly IOptionsMonitor<LlmCostEstimationOptions> _costOptionsMonitor =
        costOptionsMonitor ?? throw new ArgumentNullException(nameof(costOptionsMonitor));

    private readonly IOptionsMonitor<AiUsageControlsOptions> _usageControlsOptionsMonitor =
        usageControlsOptionsMonitor ?? throw new ArgumentNullException(nameof(usageControlsOptionsMonitor));

    public async Task<long> CountActiveSelfServiceTrialsAsync(CancellationToken cancellationToken = default)
    {
        string[] demoSlugs = ResolveDemoSlugs();

        const string sql = """
                           SELECT COUNT_BIG(1)
                           FROM dbo.Tenants
                           WHERE TrialExpiresUtc IS NOT NULL
                             AND TrialStatus = @Active
                             AND OffboardedUtc IS NULL
                             AND SuspendedUtc IS NULL
                             AND Slug NOT IN @DemoSlugs;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        long count = await connection.ExecuteScalarAsync<long>(
            new CommandDefinition(
                sql,
                new { TrialLifecycleStatus.Active, DemoSlugs = demoSlugs },
                cancellationToken: cancellationToken));

        return count;
    }

    public async Task<TrialFunnelOperationalSummaryResponse> GetOperationalSummaryAsync(
        int periodDays = 30,
        bool comparePreviousPeriod = false,
        CancellationToken cancellationToken = default)
    {
        int clampedDays = Math.Clamp(periodDays, 7, 90);
        long activeTrials = await CountActiveSelfServiceTrialsAsync(cancellationToken);
        DateTimeOffset utcNow = TimeProvider.System.GetUtcNow();
        DateTimeOffset since = utcNow.AddDays(-clampedDays);
        DateTimeOffset previousSince = utcNow.AddDays(-clampedDays * 2);
        DateTimeOffset previousUntil = since;
        bool costRatesConfigured = CostRatesConfigured(_costOptionsMonitor.CurrentValue);
        string[] demoSlugs = ResolveDemoSlugs();

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

        Dictionary<string, int> counts = await LoadEventCountsAsync(
            connection,
            since,
            eventTypes,
            demoSlugs,
            cancellationToken);

        List<double> signupToCommitSeconds = await LoadSignupToCommitSecondsAsync(
            connection,
            since,
            demoSlugs,
            cancellationToken);

        List<double> trialStartToConversionSeconds = await LoadTrialStartToConversionSecondsAsync(
            connection,
            since,
            demoSlugs,
            cancellationToken);

        IReadOnlyList<decimal> firstReviewCogsUsd = await LoadFirstReviewCogsSamplesAsync(
            connection,
            since,
            demoSlugs,
            cancellationToken);

        TrialFunnelOperationalSummaryBuilder.PeriodWindowCounts? previousPeriod = null;

        if (comparePreviousPeriod)
        {
            Dictionary<string, int> previousCounts = await LoadEventCountsBetweenAsync(
                connection,
                previousSince,
                previousUntil,
                eventTypes,
                demoSlugs,
                cancellationToken);

            previousPeriod = new TrialFunnelOperationalSummaryBuilder.PeriodWindowCounts
            {
                SignupAttempts = previousCounts.GetValueOrDefault(AuditEventTypes.TrialSignupAttempted),
                FirstCommits = previousCounts.GetValueOrDefault(AuditEventTypes.TrialFirstRunCompleted),
                Checkouts = previousCounts.GetValueOrDefault(AuditEventTypes.BillingCheckoutInitiated)
                             + previousCounts.GetValueOrDefault(AuditEventTypes.BillingCheckoutCompleted),
                Conversions = previousCounts.GetValueOrDefault(AuditEventTypes.TenantTrialConverted),
            };
        }

        IReadOnlyList<TrialFunnelCohortRowResponse> cohortRows = await LoadCohortRowsAsync(
            connection,
            since,
            demoSlugs,
            utcNow,
            costRatesConfigured,
            cancellationToken);

        int signupAttempts = counts.GetValueOrDefault(AuditEventTypes.TrialSignupAttempted);
        int signupFailures = counts.GetValueOrDefault(AuditEventTypes.TrialSignupFailed);
        int firstCommits = counts.GetValueOrDefault(AuditEventTypes.TrialFirstRunCompleted);
        int conversions = counts.GetValueOrDefault(AuditEventTypes.TenantTrialConverted);
        int checkouts = counts.GetValueOrDefault(AuditEventTypes.BillingCheckoutInitiated)
                        + counts.GetValueOrDefault(AuditEventTypes.BillingCheckoutCompleted);
        int budgetCutoffs = counts.GetValueOrDefault(AuditEventTypes.LlmTenantMonthlyDollarBudgetApproaching);

        TrialFunnelOperationalSummaryResponse summary = TrialFunnelOperationalSummaryBuilder.Build(
            activeTrials,
            clampedDays,
            comparePreviousPeriod,
            signupAttempts,
            signupFailures,
            firstCommits,
            conversions,
            checkouts,
            budgetCutoffs,
            signupToCommitSeconds,
            firstReviewCogsUsd,
            costRatesConfigured,
            cohortRows,
            previousPeriod,
            trialStartToConversionSeconds);

        return summary;
    }

    private string[] ResolveDemoSlugs() =>
        _usageControlsOptionsMonitor.CurrentValue.PublicDemoTenantSlugs ?? Array.Empty<string>();

    private static bool CostRatesConfigured(LlmCostEstimationOptions options)
    {
        if (options is null || !options.Enabled)
            return false;

        return options.InputUsdPerMillionTokens > 0m
               && options.OutputUsdPerMillionTokens > 0m;
    }

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

    private static async Task<IReadOnlyList<TrialFunnelCohortRowResponse>> LoadCohortRowsAsync(
        SqlConnection connection,
        DateTimeOffset sinceUtc,
        string[] demoSlugs,
        DateTimeOffset utcNow,
        bool costRatesConfigured,
        CancellationToken cancellationToken)
    {
        DateTime utcNowDate = utcNow.UtcDateTime;

        const string sql = """
                           SELECT
                               t.Id AS TenantId,
                               t.Name AS OrganizationName,
                               t.TrialStartUtc,
                               t.TrialExpiresUtc,
                               t.TrialStatus,
                               t.TrialFirstManifestCommittedUtc,
                               t.TrialRunsUsed,
                               activity.LastActivityUtc,
                               cost.EstimatedFirstReviewCostUsd
                           FROM dbo.Tenants t
                           OUTER APPLY (
                               SELECT MAX(r.CreatedUtc) AS LastActivityUtc
                               FROM dbo.Runs r
                               WHERE r.TenantId = t.Id
                                 AND r.ArchivedUtc IS NULL
                           ) activity
                           OUTER APPLY (
                               SELECT TOP (1) (s.SpentUsd + s.ReservedAssumedUsd) AS EstimatedFirstReviewCostUsd
                               FROM dbo.LlmMonthlyTenantBudgetState s
                               WHERE s.TenantId = t.Id
                                 AND s.UtcYear = @UtcYear
                                 AND s.UtcMonth = @UtcMonth
                                 AND t.TrialFirstManifestCommittedUtc IS NOT NULL
                           ) cost
                           WHERE t.TrialExpiresUtc IS NOT NULL
                             AND t.OffboardedUtc IS NULL
                             AND t.SuspendedUtc IS NULL
                             AND t.TrialStartUtc >= @SinceUtc
                             AND t.Slug NOT IN @DemoSlugs
                           ORDER BY t.TrialStartUtc DESC;
                           """;

        IEnumerable<TrialFunnelOperationalSummaryBuilder.TenantCohortSourceRow> rows =
            await connection.QueryAsync<TrialFunnelOperationalSummaryBuilder.TenantCohortSourceRow>(
                new CommandDefinition(
                    sql,
                    new
                    {
                        SinceUtc = sinceUtc.UtcDateTime,
                        UtcYear = utcNowDate.Year,
                        UtcMonth = utcNowDate.Month,
                        DemoSlugs = demoSlugs,
                    },
                    cancellationToken: cancellationToken));

        return rows
            .Select(row => MapCohortRow(row, utcNow, costRatesConfigured))
            .ToList();
    }

    private static TrialFunnelCohortRowResponse MapCohortRow(
        TrialFunnelOperationalSummaryBuilder.TenantCohortSourceRow row,
        DateTimeOffset utcNow,
        bool costRatesConfigured)
    {
        int? daysInTrial = row.TrialStartedUtc is null
            ? null
            : (int)Math.Max(0, (utcNow - row.TrialStartedUtc.Value).TotalDays);

        string firstReviewStatus = row.TrialFirstManifestCommittedUtc is not null
            ? "Finalized"
            : row.TrialRunsUsed > 0
                ? "In progress"
                : "Not started";

        string conversionStatus = string.Equals(row.TrialStatus, TrialLifecycleStatus.Converted, StringComparison.Ordinal)
            ? "Converted"
            : "Trial";

        decimal? estimatedCost = row.EstimatedFirstReviewCostUsd is > 0m && costRatesConfigured
            ? row.EstimatedFirstReviewCostUsd
            : null;

        return new TrialFunnelCohortRowResponse
        {
            TenantId = row.TenantId,
            OrganizationName = row.OrganizationName,
            TrialStartedUtc = row.TrialStartedUtc,
            CurrentStageId = TrialFunnelOperationalSummaryBuilder.ResolveCohortStageId(row),
            CurrentStageLabel = TrialFunnelOperationalSummaryBuilder.ResolveCohortStageLabel(row),
            DaysInTrial = daysInTrial,
            LastMeaningfulActivityUtc = row.LastActivityUtc,
            FirstReviewStatus = firstReviewStatus,
            EstimatedFirstReviewCostUsd = estimatedCost,
            ConversionStatus = conversionStatus,
            AttentionLabel = TrialFunnelOperationalSummaryBuilder.ResolveAttentionLabel(row, utcNow),
        };
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
