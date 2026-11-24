using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class AuthorityQueryController
{
    /// <summary>
    /// A scoped run read can expose a restricted architecture even when its
    /// sealed manifest is valid. Reuse the established non-disclosing share
    /// authority before any query or run-derived projection is evaluated.
    /// </summary>
    private Task<IActionResult?> EnsureRunShareReadAllowedAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken) =>
        _architectureShareAccessGate.EnsureRunReadAllowedAsync(
            this, User, scope, runId, cancellationToken);

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
            SealedManifestReadGuard.EnsureManifestSummaryBindingAndHashesOrThrow(
                scope, requestedManifestId, result, requestedManifest,
                manifestDetail, manifestHashService);
        }
        catch (ConflictException ex)
        {
            return MapRunQuerySealedManifestConflict(ex);
        }

        return null;
    }
}
