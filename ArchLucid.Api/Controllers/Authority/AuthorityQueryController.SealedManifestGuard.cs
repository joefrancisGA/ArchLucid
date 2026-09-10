using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class AuthorityQueryController
{
    private async Task<IActionResult?> EnsureRunInventorySealedManifestReadAllowedAsync(
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        try
        {
            await RunInventorySealedManifestReadGuard.EnsureRunInventoryReadAllowedOrThrowAsync(
                scope.TenantId,
                scope.WorkspaceId,
                scope.ProjectId,
                runDetailQueryService,
                queryService,
                manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapRunQuerySealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps authority query read <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapRunQuerySealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);

    private async Task<IActionResult?> EnsureRunSealedManifestReadAllowedAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await queryService.GetRunDetailAsync(scope, runId, cancellationToken);

        if (detail?.GoldenManifest is null)
            return null;

        try
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                detail.GoldenManifest,
                runId.ToString("D"),
                manifestHashService);
        }
        catch (ConflictException ex)
        {
            return MapRunQuerySealedManifestConflict(ex);
        }

        return null;
    }

    private IActionResult? EnsureGoldenManifestSealedReadAllowed(RunDetailDto detail, Guid runId)
    {
        if (detail.GoldenManifest is null)
            return null;

        try
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                detail.GoldenManifest,
                runId.ToString("D"),
                manifestHashService);
        }
        catch (ConflictException ex)
        {
            return MapRunQuerySealedManifestConflict(ex);
        }

        return null;
    }

    private IActionResult? EnsureManifestSummarySealedReadAllowed(
        ManifestSummaryDto result,
        RunDetailDto? manifestDetail)
    {
        try
        {
            if (manifestDetail?.GoldenManifest is null)
            {
                return MapRunQuerySealedManifestConflict(
                    new ConflictException(
                        $"Manifest '{result.ManifestId}' sealed hash verification is unavailable because the committed golden manifest is missing."));
            }

            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                manifestDetail.GoldenManifest,
                result.RunId.ToString("D"),
                manifestHashService);
        }
        catch (ConflictException ex)
        {
            return MapRunQuerySealedManifestConflict(ex);
        }

        return null;
    }
}
