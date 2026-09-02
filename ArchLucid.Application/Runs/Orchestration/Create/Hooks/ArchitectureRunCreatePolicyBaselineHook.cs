using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application.Runs.Orchestration.Create.Hooks;

public interface IArchitectureRunCreatePolicyBaselineHook
{
    Task TryApplyCloudPolicyPackBaselineAsync(ArchitectureRequest request, CancellationToken cancellationToken);
}

public sealed class ArchitectureRunCreatePolicyBaselineHook(
    DefaultPolicyPackCloudBaselineApplicator defaultPolicyPackCloudBaselineApplicator,
    IScopeContextProvider scopeContextProvider,
    ILogger<ArchitectureRunCreatePolicyBaselineHook> logger) : IArchitectureRunCreatePolicyBaselineHook
{
    private readonly DefaultPolicyPackCloudBaselineApplicator _defaultPolicyPackCloudBaselineApplicator =
        defaultPolicyPackCloudBaselineApplicator
        ?? throw new ArgumentNullException(nameof(defaultPolicyPackCloudBaselineApplicator));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    private readonly ILogger<ArchitectureRunCreatePolicyBaselineHook> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task TryApplyCloudPolicyPackBaselineAsync(
        ArchitectureRequest request,
        CancellationToken cancellationToken)
    {
        if (request.CloudProvider is not (CloudProvider.Aws or CloudProvider.Gcp))
            return;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        if (scope.TenantId == Guid.Empty)
            return;

        try
        {
            await _defaultPolicyPackCloudBaselineApplicator.TryApplyAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                request.CloudProvider,
                cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            if (_logger.IsEnabled(LogLevel.Warning))
            {
                _logger.LogWarning(
                    ex,
                    "Cloud policy pack baseline adjustment failed for architecture run (CloudProvider={CloudProvider}).",
                    request.CloudProvider);
            }
        }
    }
}
