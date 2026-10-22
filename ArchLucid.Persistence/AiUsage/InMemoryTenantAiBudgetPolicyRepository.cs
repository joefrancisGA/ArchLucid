using ArchLucid.Core.AiUsage;

namespace ArchLucid.Persistence.AiUsage;

public sealed class InMemoryTenantAiBudgetPolicyRepository : ITenantAiBudgetPolicyRepository
{
    private readonly Dictionary<Guid, TenantAiBudgetPolicyRow> _rows = new();

    public Task<TenantAiBudgetPolicyRow?> GetByTenantIdAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        _rows.TryGetValue(tenantId, out TenantAiBudgetPolicyRow? row);

        return Task.FromResult(row);
    }

    public Task<bool> EnsureDefaultTrialPolicyIfAbsentAsync(
        Guid tenantId,
        decimal budgetAmountUsd,
        DateTimeOffset trialExpirationUtc,
        CancellationToken cancellationToken = default)
    {
        if (_rows.ContainsKey(tenantId))
        {
            return Task.FromResult(false);
        }

        _rows[tenantId] = new TenantAiBudgetPolicyRow
        {
            TenantId = tenantId,
            BudgetAmountUsd = budgetAmountUsd,
            HardStopEnabled = true,
            AllowCustomerAiProvider = false,
            TrialExpirationUtc = trialExpirationUtc,
        };

        return Task.FromResult(true);
    }
}
