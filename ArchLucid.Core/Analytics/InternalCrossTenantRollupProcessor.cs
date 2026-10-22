using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Analytics;

/// <summary>Builds pseudonymized daily rollup rows and persists them to the system catalog.</summary>
public sealed class InternalCrossTenantRollupProcessor(
    IInternalCrossTenantMetricsCollector metricsCollector,
    IInternalCrossTenantRollupRepository rollupRepository,
    IOptionsMonitor<InternalCrossTenantAnalyticsOptions> optionsMonitor)
{
    private readonly IInternalCrossTenantMetricsCollector _metricsCollector =
        metricsCollector ?? throw new ArgumentNullException(nameof(metricsCollector));

    private readonly IInternalCrossTenantRollupRepository _rollupRepository =
        rollupRepository ?? throw new ArgumentNullException(nameof(rollupRepository));

    private readonly IOptionsMonitor<InternalCrossTenantAnalyticsOptions> _optionsMonitor =
        optionsMonitor ?? throw new ArgumentNullException(nameof(optionsMonitor));

    public async Task RefreshDailyRollupsAsync(DateOnly rollupDate, CancellationToken cancellationToken = default)
    {
        IAnalyticsTenantKeyDeriver deriver = CreateDeriver();
        IReadOnlyList<InternalCrossTenantTenantRunMetrics> tenantMetrics =
            await _metricsCollector.CollectTenantMetricsAsync(rollupDate, cancellationToken);

        DateTimeOffset computedUtc = TimeProvider.System.GetUtcNow();
        List<InternalCrossTenantRollupDailyRow> rows = new(tenantMetrics.Count);

        foreach (InternalCrossTenantTenantRunMetrics metrics in tenantMetrics)
        {
            double? averageSeconds = null;

            if (metrics.TotalCompletedRuns > 0)
                averageSeconds = metrics.SumCompletionSeconds / metrics.TotalCompletedRuns;

            rows.Add(
                new InternalCrossTenantRollupDailyRow
                {
                    RollupDate = rollupDate,
                    AnalyticsTenantKey = deriver.DeriveAnalyticsTenantKey(metrics.TenantId),
                    TotalRunsNonArchived = metrics.TotalRunsNonArchived,
                    TotalCompletedRuns = metrics.TotalCompletedRuns,
                    AverageCompletedRunDurationSeconds = averageSeconds,
                    EstimatedEngineeringHoursSaved = metrics.EstimatedEngineeringHoursSaved,
                    LlmTokensUsed = metrics.LlmTokensUsed,
                    ComputedUtc = computedUtc,
                });
        }

        await _rollupRepository.UpsertDailyRowsAsync(rows, cancellationToken);
    }

    private IAnalyticsTenantKeyDeriver CreateDeriver()
    {
        string? salt = _optionsMonitor.CurrentValue.PseudonymizationSalt;

        if (string.IsNullOrWhiteSpace(salt))
            throw new InvalidOperationException(
                $"{InternalCrossTenantAnalyticsOptions.SectionName}:PseudonymizationSalt must be configured for cross-tenant rollups.");

        return new AnalyticsTenantKeyDeriver(salt);
    }
}
