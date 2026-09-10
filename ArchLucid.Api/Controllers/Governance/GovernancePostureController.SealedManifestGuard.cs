using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance.Posture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernancePostureController
{
    private async Task<IActionResult?> EnsureGovernancePostureSealedManifestReadAllowedAsync(
        ScopeContext scope,
        Guid resolvedProjectId,
        CancellationToken cancellationToken)
    {
        try
        {
            await GovernancePostureSealedManifestHashGuard.EnsureLatestCommittedRunSealedOrThrowAsync(
                scope.TenantId,
                scope.WorkspaceId,
                resolvedProjectId,
                _runDetailQueryService,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapGovernancePostureSealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps governance posture read <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapGovernancePostureSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
