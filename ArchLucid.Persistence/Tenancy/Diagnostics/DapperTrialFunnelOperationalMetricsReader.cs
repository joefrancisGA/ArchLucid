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
public sealed partial class DapperTrialFunnelOperationalMetricsReader(
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
}
