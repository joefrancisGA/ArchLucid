using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Drafts;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunsController
{
    private async Task<IActionResult?> EnsureArchitectureRunCreateSealedManifestAllowedAsync(
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
                authorityQuery,
                _manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapRunsSealedManifestConflict(ex);
        }

        return null;
    }

    private async Task<IActionResult?> EnsureArchitectureRequestSealedManifestReadAllowedAsync(
        string requestId,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        Guid? runGuid = await _runRepository.TryGetRepresentativeRunIdForArchitectureRequestInScopeAsync(
            scope,
            requestId,
            cancellationToken);

        if (runGuid is null)
            return null;

        RunDetailDto? detail;

        try
        {
            detail = await authorityQuery.GetRunDetailAsync(scope, runGuid.Value, cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapRunsSealedManifestConflict(ex);
        }

        if (detail?.GoldenManifest is null)
            return null;

        try
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                detail.GoldenManifest,
                runGuid.Value.ToString("D"),
                manifestHashService);
        }
        catch (ConflictException ex)
        {
            return MapRunsSealedManifestConflict(ex);
        }

        return null;
    }

    private async Task<IActionResult?> EnsureRunSealedManifestReadAllowedAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunDetailDto? detail;

        try
        {
            detail = await authorityQuery.GetRunDetailAsync(scope, runId, cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapRunsSealedManifestConflict(ex);
        }

        if (detail?.GoldenManifest is null)
            return null;

        try
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                detail.GoldenManifest,
                runId.ToString("D"),
                _manifestHashService);
        }
        catch (ConflictException ex)
        {
            return MapRunsSealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps architecture run create/read <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapRunsSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
