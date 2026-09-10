using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Application.Governance.Posture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceCoverageController
{
    private async Task<IActionResult?> EnsureGovernanceScopeSealedManifestReadAllowedAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
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
            return MapGovernanceCoverageSealedManifestConflict(ex);
        }

        return null;
    }

    private async Task<IActionResult?> EnsureGovernanceCoveragePreviewSealedManifestReadAllowedAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        try
        {
            await GovernanceCoveragePreviewSealedManifestHashGuard.EnsureCoveragePreviewAllowedOrThrowAsync(
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
            return MapGovernanceCoverageSealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps governance coverage read <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapGovernanceCoverageSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
