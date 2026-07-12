using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.AiUsage;

public sealed class SelfServiceTrialAiBudgetPolicyProvisioner(
    ITenantAiBudgetPolicyRepository policyRepository,
    IOptionsMonitor<AiUsageControlsOptions> aiUsageOptions) : ISelfServiceTrialAiBudgetPolicyProvisioner
{
    private readonly ITenantAiBudgetPolicyRepository _policyRepository =
        policyRepository ?? throw new ArgumentNullException(nameof(policyRepository));

    private readonly IOptionsMonitor<AiUsageControlsOptions> _aiUsageOptions =
        aiUsageOptions ?? throw new ArgumentNullException(nameof(aiUsageOptions));

    public Task<bool> EnsureDefaultTrialPolicyIfAbsentAsync(
        Guid tenantId,
        DateTimeOffset trialExpirationUtc,
        CancellationToken cancellationToken = default)
    {
        if (tenantId == Guid.Empty)
        {
            throw new ArgumentException("Tenant id is required.", nameof(tenantId));
        }

        decimal budgetAmountUsd = _aiUsageOptions.CurrentValue.DefaultTrialAiBudgetUsd;

        if (budgetAmountUsd <= 0m)
        {
            throw new InvalidOperationException(
                "AiUsageControls:DefaultTrialAiBudgetUsd must be positive for self-service trial provisioning.");
        }

        return _policyRepository.EnsureDefaultTrialPolicyIfAbsentAsync(
            tenantId,
            budgetAmountUsd,
            trialExpirationUtc,
            cancellationToken);
    }
}
