using ArchLucid.Core.AiUsage;
using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.AiUsage;

public sealed class DemoExpensiveActionGate(
    ITenantAiBudgetPolicyResolver policyResolver,
    IOptionsMonitor<AiUsageControlsOptions> aiUsageOptions)
{
    private readonly ITenantAiBudgetPolicyResolver _policyResolver =
        policyResolver ?? throw new ArgumentNullException(nameof(policyResolver));

    private readonly IOptionsMonitor<AiUsageControlsOptions> _aiUsageOptions =
        aiUsageOptions ?? throw new ArgumentNullException(nameof(aiUsageOptions));

    public async Task EnsureExpensiveActionAllowedAsync(
        Guid tenantId,
        AiUsageFeature feature,
        CancellationToken cancellationToken = default)
    {
        if (!_aiUsageOptions.CurrentValue.DemoMode)
        {
            return;
        }

        AiUsageWorkspaceKind kind =
            await _policyResolver.ResolveWorkspaceKindAsync(tenantId, cancellationToken).ConfigureAwait(false);

        if (kind != AiUsageWorkspaceKind.PublicDemo)
        {
            return;
        }

        if (feature is AiUsageFeature.ArchitectureGeneration or AiUsageFeature.EvidenceIndexing)
        {
            throw new InvalidOperationException(
                "Large document ingestion and open-ended architecture generation are not available in the public demo workspace.");
        }
    }
}
