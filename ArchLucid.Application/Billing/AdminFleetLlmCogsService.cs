using ArchLucid.Application.Budgeting;
using ArchLucid.Contracts.Billing;
using ArchLucid.Core.Budgeting;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Billing;

public interface IAdminFleetLlmCogsService
{
    Task<AdminFleetLlmCogsDashboardResponse> BuildDashboardAsync(CancellationToken cancellationToken = default);
}

public sealed class AdminFleetLlmCogsService(
    TimeProvider timeProvider,
    ITenantRepository tenantRepository,
    ILlmTenantBudgetRepository budgetRepository,
    IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> budgetOptionsMonitor,
    IOptionsMonitor<LlmCostEstimationOptions> costOptionsMonitor) : IAdminFleetLlmCogsService
{
    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ILlmTenantBudgetRepository _budgetRepository =
        budgetRepository ?? throw new ArgumentNullException(nameof(budgetRepository));

    private readonly IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> _budgetOptionsMonitor =
        budgetOptionsMonitor ?? throw new ArgumentNullException(nameof(budgetOptionsMonitor));

    private readonly IOptionsMonitor<LlmCostEstimationOptions> _costOptionsMonitor =
        costOptionsMonitor ?? throw new ArgumentNullException(nameof(costOptionsMonitor));

    public async Task<AdminFleetLlmCogsDashboardResponse> BuildDashboardAsync(
        CancellationToken cancellationToken = default)
    {
        DateTime utcNow = _timeProvider.GetUtcNow().UtcDateTime;
        string utcMonth = utcNow.ToString("yyyy-MM", System.Globalization.CultureInfo.InvariantCulture);
        LlmMonthlyTenantDollarBudgetOptions opts = _budgetOptionsMonitor.CurrentValue;
        LlmCostEstimationOptions costOpts = _costOptionsMonitor.CurrentValue;
        bool costRatesConfigured = CostRatesConfigured(costOpts);
        IReadOnlyList<TenantRecord> tenants = await _tenantRepository.ListAsync(cancellationToken).ConfigureAwait(false);
        List<AdminFleetLlmCogsRowResponse> rows = [];

        foreach (TenantRecord tenant in tenants.OrderBy(static t => t.Name, StringComparer.OrdinalIgnoreCase))
        {
            if (tenant.SuspendedUtc is not null || tenant.OffboardedUtc is not null)
                continue;

            LlmTenantBudgetStateReadModel state = await _budgetRepository
                .GetOrCreateAsync(tenant.Id, LlmBudgetPeriod.Monthly, utcMonth, cancellationToken)
                .ConfigureAwait(false);

            decimal hardCap = opts.Enabled ? opts.HardCutoffUsdPerUtcMonth + state.PurchasedCapBumpUsd : 0m;
            double? utilization = hardCap > 0m
                ? (double)(state.TotalUsdPressure / hardCap)
                : null;

            bool blocks = opts.Enabled
                          && hardCap > 0m
                          && state.TotalUsdPressure >= hardCap;
            decimal? included = opts.Enabled ? opts.IncludedUsdPerUtcMonth : null;
            decimal warnFraction = decimal.Clamp(opts.WarnFraction, 0.01m, 0.99m);
            decimal? warningAt = opts.Enabled ? opts.IncludedUsdPerUtcMonth * warnFraction : null;

            rows.Add(new AdminFleetLlmCogsRowResponse
            {
                TenantId = tenant.Id,
                TenantName = tenant.Name,
                EstimatedUsdPressureUtcMonth = state.TotalUsdPressure,
                HardCapUsdUtcMonth = hardCap > 0m ? hardCap : null,
                BlocksAdditionalLlmExecution = blocks,
                HardCapUtilizationFraction = utilization,
                GrossMarginRiskLabel = ClassifyRisk(utilization, blocks, state.TotalUsdPressure, warningAt),
                TrialFirstManifestCommittedUtc = tenant.TrialFirstManifestCommittedUtc,
                CostBasisLabel = "estimated",
                MonthlyBudgetMonitoringActive = opts.Enabled,
                CostRatesConfigured = costRatesConfigured,
                IncludedUsdUtcMonth = included,
                BudgetWarningUsdUtcMonth = warningAt,
                BudgetCompletionLabel = ClassifyBudgetCompletion(
                    opts.Enabled,
                    costRatesConfigured,
                    utilization,
                    blocks,
                    state.TotalUsdPressure,
                    warningAt),
            });
        }

        return new AdminFleetLlmCogsDashboardResponse
        {
            Rows = rows,
            UtcMonth = utcMonth,
            CostBasisLabel = "estimated",
            MonthlyBudgetMonitoringActive = opts.Enabled,
            CostRatesConfigured = costRatesConfigured,
            BudgetWarningTenantCount = rows.Count(static r => r.GrossMarginRiskLabel == "warn"),
            HardStopTenantCount = rows.Count(static r => r.BlocksAdditionalLlmExecution),
            MissingRateTenantCount = rows.Count(static r => !r.CostRatesConfigured),
        };
    }

    private static string ClassifyRisk(double? utilization, bool blocks, decimal pressureUsd, decimal? warningAtUsd)
    {
        if (blocks)
            return "risk";

        if (warningAtUsd is > 0m && pressureUsd >= warningAtUsd.Value)
            return "warn";

        if (utilization is >= 0.85)
            return "warn";

        return "healthy";
    }

    private static bool CostRatesConfigured(LlmCostEstimationOptions options)
    {
        if (options is null || !options.Enabled)
            return false;

        // EffectiveRates falls back to catalog defaults for any non-positive global I/O slot; a single positive
        // global rate still means estimation is intentionally configured (including reasoning-only rollback).

        if (options.InputUsdPerMillionTokens > 0m
            || options.OutputUsdPerMillionTokens > 0m
            || options.ReasoningUsdPerMillionTokens > 0m)
            return true;

        if (options.Deployments is null || options.Deployments.Count == 0)
            return false;

        return options.Deployments.Values.Any(static deployment =>
            deployment is not null
            && (deployment.InputUsdPerMillionTokens > 0m
                || deployment.OutputUsdPerMillionTokens > 0m
                || deployment.ReasoningUsdPerMillionTokens > 0m));
    }

    private static string ClassifyBudgetCompletion(
        bool monthlyBudgetActive,
        bool costRatesConfigured,
        double? utilization,
        bool blocks,
        decimal pressureUsd,
        decimal? warningAtUsd)
    {
        if (!costRatesConfigured)
            return "missing-cost-rates";

        if (!monthlyBudgetActive)
            return "monitoring-disabled";

        if (blocks)
            return "hard-stop";

        if (warningAtUsd is > 0m && pressureUsd >= warningAtUsd.Value)
            return "near-threshold";

        if (utilization is >= 0.85)
            return "near-threshold";

        return "complete";
    }
}
