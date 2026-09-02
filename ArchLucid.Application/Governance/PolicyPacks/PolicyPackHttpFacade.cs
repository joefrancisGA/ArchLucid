using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Governance.PolicyPacks;

/// <inheritdoc cref="IPolicyPackHttpFacade" />
public sealed partial class PolicyPackHttpFacade(
    IPolicyPackWorkflowFacade workflow,
    IScopeContextProvider scopeProvider,
    ITenantRepository tenantRepository) : IPolicyPackHttpFacade
{
    private readonly IPolicyPackWorkflowFacade _workflow =
        workflow ?? throw new ArgumentNullException(nameof(workflow));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    private async Task<bool> EnsureScopeAsync(CancellationToken cancellationToken)
    {
        TenantWorkspaceScopeResult scopeResult = await TenantWorkspaceScopeGuard.RequireTenantAndWorkspaceAsync(
            _scopeProvider,
            _tenantRepository,
            cancellationToken).ConfigureAwait(false);

        return scopeResult.Outcome == TenantWorkspaceScopeOutcome.Success;
    }
}
