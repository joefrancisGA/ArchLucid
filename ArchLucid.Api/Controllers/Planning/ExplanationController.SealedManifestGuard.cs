using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Planning;

public sealed partial class ExplanationController
{
    private Task<IActionResult?> EnsureExplanationRunReadAllowedAsync(
        ScopeContext scope, Guid runId, CancellationToken ct) =>
        runId == Guid.Empty
            ? Task.FromResult<IActionResult?>(this.NotFoundProblem(
                $"Run '{runId}' was not found.", ProblemTypes.RunNotFound))
            : _architectureShareAccessGate.EnsureRunReadAllowedAsync(this, User, scope, runId, ct);

    private async Task<IActionResult?> EnsureSealedManifestReadAllowedAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        RunDetailDto? detail = await query.GetRunDetailAsync(scope, runId, cancellationToken);

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
            return MapExplanationSealedManifestConflict(ex);
        }

        return null;
    }

    private async Task<IActionResult?> EnsureCompareRunsSealedManifestReadAllowedAsync(
        ScopeContext scope,
        Guid baseRunId,
        Guid targetRunId,
        CancellationToken cancellationToken)
    {
        IActionResult? baseGuardResult = await EnsureSealedManifestReadAllowedAsync(scope, baseRunId, cancellationToken);

        if (baseGuardResult is not null)
            return baseGuardResult;

        return await EnsureSealedManifestReadAllowedAsync(scope, targetRunId, cancellationToken);
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
            return MapExplanationSealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps explanation run/finding/holistic <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapExplanationSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
