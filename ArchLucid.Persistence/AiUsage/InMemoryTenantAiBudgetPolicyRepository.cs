using System.Collections.Concurrent;

using ArchLucid.Core.AiUsage;

namespace ArchLucid.Persistence.AiUsage;

public sealed class InMemoryTenantAiBudgetPolicyRepository : ITenantAiBudgetPolicyRepository
{
    private readonly ConcurrentDictionary<Guid, TenantAiBudgetPolicyRow> _rows = new();

    public Task<TenantAiBudgetPolicyRow?> GetByTenantIdAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        _rows.TryGetValue(tenantId, out TenantAiBudgetPolicyRow? row);

        return Task.FromResult(row);
    }

    public Task<bool> EnsureDefaultTrialPolicyIfAbsentAsync(
        Guid tenantId,
        decimal budgetAmountUsd,
        DateTimeOffset trialExpirationUtc,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        TenantAiBudgetPolicyRow policy = new()
        {
            TenantId = tenantId,
            BudgetAmountUsd = budgetAmountUsd,
            HardStopEnabled = true,
            AllowCustomerAiProvider = false,
            TrialExpirationUtc = trialExpirationUtc,
        };

        return Task.FromResult(_rows.TryAdd(tenantId, policy));
    }
}
