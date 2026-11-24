using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Core.Scoping;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunDetailPageBundleController
{
    /// <summary>
    /// Apply the existing run-sharing decision before any buyer detail,
    /// timeline, comparison, or manifest-derived data is read.
    /// </summary>
    private Task<IActionResult?> EnsurePageBundleRunShareReadAllowedAsync(
        ScopeContext scope, Guid runId, CancellationToken cancellationToken) =>
        _architectureShareAccessGate.EnsureRunReadAllowedAsync(
            this, User, scope, runId, cancellationToken);

    private IActionResult? EnsureSealedManifestReadAllowed(RunDetailDto detail, Guid runId)
    {
        if (detail.GoldenManifest is null)
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
            return MapRunDetailPageBundleSealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps run detail page bundle read <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapRunDetailPageBundleSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);

    private static string MapRunDetailPageBundlePriorCompareSealedManifestBlockedReason(ConflictException ex) =>
        ex.Message;
}
