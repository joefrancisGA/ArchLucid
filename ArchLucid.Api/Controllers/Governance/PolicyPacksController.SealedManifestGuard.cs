using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance.Posture;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class PolicyPacksController
{
    private async Task<IActionResult?> EnsurePolicyPackMutationSealedManifestAllowedAsync(
        CancellationToken cancellationToken)
    {
        ScopeContext? scope = _scopeContextProvider.GetCurrentScope();
        if (scope is null)
            return null;

        try
        {
            await GovernancePostureSealedManifestHashGuard.EnsureLatestCommittedRunSealedOrThrowAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                _runDetailQueryService,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapPolicyPackSealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps policy pack mutation/simulate <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapPolicyPackSealedManifestConflict(ConflictException ex) =>
        PolicyPackSealedManifestConflictMapping.MapPolicyPackSealedManifestConflict(this, ex);

}
