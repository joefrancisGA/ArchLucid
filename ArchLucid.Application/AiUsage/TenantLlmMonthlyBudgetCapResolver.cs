using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Budgeting;

namespace ArchLucid.Application.AiUsage;

public sealed class TenantLlmMonthlyBudgetCapResolver(ITenantAiBudgetPolicyResolver policyResolver)
    : ITenantLlmMonthlyBudgetCapResolver
{
    private readonly ITenantAiBudgetPolicyResolver _policyResolver =
        policyResolver ?? throw new ArgumentNullException(nameof(policyResolver));

    public async Task<decimal?> ResolveHardCapUsdAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        TenantAiBudgetPolicySnapshot policy =
            await _policyResolver.ResolveAsync(tenantId, cancellationToken).ConfigureAwait(false);

        return policy.BudgetAmountUsd > 0m ? policy.BudgetAmountUsd : null;
    }

    public async Task<bool> IsWalletOverageAllowedAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        TenantAiBudgetPolicySnapshot policy =
            await _policyResolver.ResolveAsync(tenantId, cancellationToken).ConfigureAwait(false);

        return policy.WalletOverageAllowed;
    }
}
