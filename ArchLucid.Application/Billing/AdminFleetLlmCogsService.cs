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
    IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> budgetOptionsMonitor) : IAdminFleetLlmCogsService
{
    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private readonly ILlmTenantBudgetRepository _budgetRepository =
        budgetRepository ?? throw new ArgumentNullException(nameof(budgetRepository));

    private readonly IOptionsMonitor<LlmMonthlyTenantDollarBudgetOptions> _budgetOptionsMonitor =
        budgetOptionsMonitor ?? throw new ArgumentNullException(nameof(budgetOptionsMonitor));

    public async Task<AdminFleetLlmCogsDashboardResponse> BuildDashboardAsync(
        CancellationToken cancellationToken = default)
    {
        DateTime utcNow = _timeProvider.GetUtcNow().UtcDateTime;
        string utcMonth = utcNow.ToString("yyyy-MM", System.Globalization.CultureInfo.InvariantCulture);
        LlmMonthlyTenantDollarBudgetOptions opts = _budgetOptionsMonitor.CurrentValue;
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

            rows.Add(new AdminFleetLlmCogsRowResponse
            {
                TenantId = tenant.Id,
                TenantName = tenant.Name,
                EstimatedUsdPressureUtcMonth = state.TotalUsdPressure,
                HardCapUsdUtcMonth = hardCap > 0m ? hardCap : null,
                BlocksAdditionalLlmExecution = blocks,
                HardCapUtilizationFraction = utilization,
                GrossMarginRiskLabel = ClassifyRisk(utilization, blocks),
                TrialFirstManifestCommittedUtc = tenant.TrialFirstManifestCommittedUtc,
                CostBasisLabel = "estimated",
            });
        }

        return new AdminFleetLlmCogsDashboardResponse
        {
            Rows = rows,
            UtcMonth = utcMonth,
            CostBasisLabel = "estimated",
        };
    }

    private static string ClassifyRisk(double? utilization, bool blocks)
    {
        if (blocks)
            return "risk";

        if (utilization is >= 0.85)
            return "warn";

        return "healthy";
    }
}
