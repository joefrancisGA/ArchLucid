using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.ArchitectureIntelligence;

public sealed partial class ArchitectureIntelligenceController
{
    private async Task<IActionResult?> EnsureArchitectureIntelligenceRunCreateSealedManifestAllowedAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        try
        {
            await DraftIntakeSealedManifestReadGuard.EnsureDraftIntakeReadAllowedOrThrowAsync(
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
            return MapArchitectureIntelligenceSealedManifestConflict(ex);
        }

        return null;
    }

    private async Task<IActionResult?> EnsureRunSealedManifestReadAllowedAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(runId, out Guid runGuid))
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunDetailDto? detail = await _authorityQueryService.GetRunDetailAsync(scope, runGuid, cancellationToken);

        if (detail?.GoldenManifest is null)
            return null;

        try
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                detail.GoldenManifest,
                runGuid.ToString("D"),
                _manifestHashService);
        }
        catch (ConflictException ex)
        {
            return MapArchitectureIntelligenceSealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps architecture-intelligence read/mutation <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapArchitectureIntelligenceSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
