using System.Diagnostics.Metrics;

using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ArchLucid.Host.Core.Hosted;

/// <summary>
///     Refreshes cached Prometheus snapshots for monthly LLM dollar budget gauges: utilization fraction (
///     <c>archlucid_llm_budget_utilization_fraction</c>), remaining USD (<c>archlucid_llm_budget_remaining_usd</c>).
///     Tenant ids refresh at most every 60 seconds to bound <see cref="ITenantRepository.ListAsync(CancellationToken)" /> churn; budget rows are re-read on the same loop as gauge publication (five-minute delay between passes).
/// </summary>
public sealed class LlmTenantBudgetUtilizationMetricsHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> budgetOptionsMonitor,
    ILogger<LlmTenantBudgetUtilizationMetricsHostedService> logger,
    TimeProvider timeProvider) : BackgroundService
{
    private static readonly TimeSpan RepoSnapshotInterval = TimeSpan.FromMinutes(5);

    private static readonly TimeSpan TenantIdCacheDuration = TimeSpan.FromSeconds(60);

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> _budgetOptionsMonitor =
        budgetOptionsMonitor ?? throw new ArgumentNullException(nameof(budgetOptionsMonitor));

    private readonly ILogger<LlmTenantBudgetUtilizationMetricsHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly Lock _tenantIdsLock = new();

    /// <remarks>Mutate only while holding <see cref="_tenantIdsLock" />.</remarks>
    private Guid[] _cachedTenantIds = [];

    /// <remarks>Mutate only while holding <see cref="_tenantIdsLock" />.</remarks>
    private DateTimeOffset _tenantIdsRefreshAfterUtc;

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CollectOnceAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "LLM tenant budget utilization metrics collection failed; retaining last-known gauge values.");
            }

            try
            {
                await Task.Delay(RepoSnapshotInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private async Task CollectOnceAsync(CancellationToken ct)
    {
        LlmMonthlyTenantDollarBudgetOptions opts = _budgetOptionsMonitor.CurrentValue;

        if (!opts.Enabled || opts.HardCutoffUsdPerUtcMonth < 0.01m)
        {
            lock (_tenantIdsLock)
            {
                _cachedTenantIds = [];
                _tenantIdsRefreshAfterUtc = DateTimeOffset.MinValue;
            }

            ArchLucidInstrumentation.LlmTenantBudgetUtilizationGauge.PublishMeasurements([]);
            ArchLucidInstrumentation.LlmTenantBudgetRemainingGauge.PublishMeasurements([]);

            return;
        }

        using IServiceScope scope = _scopeFactory.CreateScope();
        ITenantRepository tenants = scope.ServiceProvider.GetRequiredService<ITenantRepository>();
        ILlmTenantBudgetRepository budgets = scope.ServiceProvider.GetRequiredService<ILlmTenantBudgetRepository>();

        await RefreshTenantIdsIfStaleAsync(tenants, ct);

        Guid[] tenantIds;

        lock (_tenantIdsLock)
            tenantIds = _cachedTenantIds.Length < 1 ? [] : _cachedTenantIds[..];

        if (tenantIds.Length < 1)
        {
            ArchLucidInstrumentation.LlmTenantBudgetUtilizationGauge.PublishMeasurements([]);
            ArchLucidInstrumentation.LlmTenantBudgetRemainingGauge.PublishMeasurements([]);

            return;
        }

        string periodKey = LlmBudgetTelemetry.CurrentUtcMonthlyPeriodKey();
        List<Measurement<double>> utilization = new(capacity: tenantIds.Length);
        List<Measurement<double>> remaining = new(capacity: tenantIds.Length);

        foreach (Guid tenantId in tenantIds)
        {
            if (tenantId == Guid.Empty)
                continue;

            LlmTenantBudgetStateReadModel state =
                await budgets.GetOrCreateAsync(tenantId, LlmBudgetPeriod.Monthly, periodKey, ct);

            utilization.Add(
                new Measurement<double>(
                    LlmBudgetTelemetry.MonthlyHardCapUtilizationFraction(
                        state.TotalUsdPressure,
                        opts.HardCutoffUsdPerUtcMonth,
                        state.PurchasedCapBumpUsd),
                    new KeyValuePair<string, object?>("tenant_id", tenantId.ToString("D"))));

            double remainingUsd =
                LlmBudgetTelemetry.MonthlyHardCapRemainingUsd(
                    state.TotalUsdPressure,
                    opts.HardCutoffUsdPerUtcMonth,
                    state.PurchasedCapBumpUsd);

            remaining.Add(
                new Measurement<double>(
                    remainingUsd,
                    new KeyValuePair<string, object?>("tenant_id", tenantId.ToString("D"))));
        }

        ArchLucidInstrumentation.LlmTenantBudgetUtilizationGauge.PublishMeasurements(utilization.ToArray());
        ArchLucidInstrumentation.LlmTenantBudgetRemainingGauge.PublishMeasurements(remaining.ToArray());
    }

    private async Task RefreshTenantIdsIfStaleAsync(ITenantRepository tenantsRepo, CancellationToken ct)
    {
        DateTimeOffset nowUtc = _timeProvider.GetUtcNow();

        lock (_tenantIdsLock)
        {
            if (_cachedTenantIds.Length > 0 && nowUtc < _tenantIdsRefreshAfterUtc)
                return;
        }

        try
        {
            IReadOnlyList<TenantRecord> rows = await tenantsRepo.ListAsync(ct);
            Guid[] extracted = ExtractTenantGuids(rows);

            lock (_tenantIdsLock)
            {
                _cachedTenantIds = extracted;
                _tenantIdsRefreshAfterUtc = nowUtc + TenantIdCacheDuration;
            }
        }
        catch (Exception ex) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning(
                ex,
                "LLM tenant budget metrics tenant-list refresh failed; using last-known tenant id cache when non-empty.");
        }
    }

    private static Guid[] ExtractTenantGuids(IReadOnlyList<TenantRecord> tenants)
    {
        if (tenants.Count < 1)
            return [];

        List<Guid> ids = new(capacity: tenants.Count);

        foreach (TenantRecord row in tenants)
        {
            if (row is null)
                continue;

            Guid tenantId = row.Id;

            if (tenantId == Guid.Empty)
                continue;

            ids.Add(tenantId);
        }

        return ids.Count < 1 ? [] : ids.ToArray();
    }
}
