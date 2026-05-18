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
///     Refreshes cached <c>archlucid_llm_budget_utilization_fraction</c> snapshots for Prometheus (SQL read cadence ≥5
///     minutes; scrape reads last-known values without hitting the repository).
/// </summary>
public sealed class LlmTenantBudgetUtilizationMetricsHostedService(
    IServiceScopeFactory scopeFactory,
    IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> budgetOptionsMonitor,
    ILogger<LlmTenantBudgetUtilizationMetricsHostedService> logger) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

    private readonly IServiceScopeFactory _scopeFactory =
        scopeFactory ?? throw new ArgumentNullException(nameof(scopeFactory));

    private readonly IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> _budgetOptionsMonitor =
        budgetOptionsMonitor ?? throw new ArgumentNullException(nameof(budgetOptionsMonitor));

    private readonly ILogger<LlmTenantBudgetUtilizationMetricsHostedService> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

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
                await Task.Delay(Interval, stoppingToken);
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
            ArchLucidInstrumentation.LlmTenantBudgetUtilizationGauge.PublishMeasurements([]);

            return;
        }

        using IServiceScope scope = _scopeFactory.CreateScope();
        ITenantRepository tenants = scope.ServiceProvider.GetRequiredService<ITenantRepository>();
        ILlmTenantBudgetRepository budgets = scope.ServiceProvider.GetRequiredService<ILlmTenantBudgetRepository>();

        IReadOnlyList<TenantRecord> allTenants = await tenants.ListAsync(ct);

        if (allTenants.Count < 1)
        {
            ArchLucidInstrumentation.LlmTenantBudgetUtilizationGauge.PublishMeasurements([]);

            return;
        }

        string periodKey = LlmBudgetTelemetry.CurrentUtcMonthlyPeriodKey();
        List<Measurement<double>> rows = new(capacity: allTenants.Count);

        foreach (TenantRecord tenant in allTenants)
        {
            if (tenant is null)
                continue;

            Guid tenantId = tenant.Id;

            if (tenantId == Guid.Empty)
                continue;

            LlmTenantBudgetStateReadModel state =
                await budgets.GetOrCreateAsync(tenantId, LlmBudgetPeriod.Monthly, periodKey, ct);

            double fraction = LlmBudgetTelemetry.MonthlyHardCapUtilizationFraction(
                state.TotalUsdPressure,
                opts.HardCutoffUsdPerUtcMonth,
                state.PurchasedCapBumpUsd);

            rows.Add(
                new Measurement<double>(
                    fraction,
                    new KeyValuePair<string, object?>("tenant_id", tenantId.ToString("D"))));
        }

        ArchLucidInstrumentation.LlmTenantBudgetUtilizationGauge.PublishMeasurements(rows.ToArray());
    }
}
