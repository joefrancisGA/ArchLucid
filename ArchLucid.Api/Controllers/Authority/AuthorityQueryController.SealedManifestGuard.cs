using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Manifest;
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
        ScopeContext scope,
        Guid requestedManifestId,
        ManifestSummaryDto result,
        ManifestDocument? requestedManifest,
        RunDetailDto? manifestDetail)
    {
        try
        {
            // The run must still exist in the same trusted scope, and its
            // current pinned manifest must be available as before.
            if (manifestDetail?.Run is null ||
                manifestDetail.Run.RunId != result.RunId ||
                manifestDetail.GoldenManifest is null ||
                manifestDetail.Run.GoldenManifestId != manifestDetail.GoldenManifest.ManifestId ||
                manifestDetail.GoldenManifest.RunId != result.RunId)
            {
                throw new ConflictException(
                    $"Manifest '{requestedManifestId}' cannot verify its associated committed run.");
            }

            // The exact manifest requested by the caller must independently
            // match its scoped lookup and summary, even if the run has since
            // pinned a newer golden manifest. Never hash a different manifest
            // and treat that as proof of the requested version's integrity.
            if (requestedManifest is null ||
                requestedManifest.ManifestId != requestedManifestId ||
                requestedManifest.RunId != result.RunId ||
                requestedManifest.TenantId != scope.TenantId ||
                requestedManifest.WorkspaceId != scope.WorkspaceId ||
                requestedManifest.ProjectId != scope.ProjectId ||
                !string.Equals(requestedManifest.ManifestHash, result.ManifestHash,
                    StringComparison.OrdinalIgnoreCase))
            {
                throw new ConflictException(
                    $"Manifest '{requestedManifestId}' exact-ID scope or run binding could not be verified.");
            }

            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                requestedManifest,
                result.RunId.ToString("D"),
                manifestHashService);

            // Keep the prior check on the pinned current manifest as well.
            // The identical loaded object needs only one hash computation.
            if (!ReferenceEquals(requestedManifest, manifestDetail.GoldenManifest))
            {
                if (requestedManifest.ManifestId == manifestDetail.GoldenManifest.ManifestId &&
                    !string.Equals(requestedManifest.ManifestHash,
                        manifestDetail.GoldenManifest.ManifestHash,
                        StringComparison.OrdinalIgnoreCase))
                {
                    throw new ConflictException(
                        $"Manifest '{requestedManifestId}' conflicts with the run's pinned manifest.");
                }

                SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                    manifestDetail.GoldenManifest,
                    result.RunId.ToString("D"),
                    manifestHashService);
            }
        }
        catch (ConflictException ex)
        {
            return MapRunQuerySealedManifestConflict(ex);
        }

        return null;
    }
}
