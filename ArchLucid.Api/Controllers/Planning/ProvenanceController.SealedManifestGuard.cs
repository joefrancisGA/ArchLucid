using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Planning;

public sealed partial class ProvenanceController
{
    private async Task<IActionResult?> EnsureSealedManifestReadAllowedAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        if (runId == Guid.Empty)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        // Reuse the existing scoped share-access policy before reading a
        // run's provenance graph, decision nodes or neighborhood. Checking
        // sealed-manifest integrity does not authorize a restricted read.
        IActionResult? denied = await _architectureShareAccessGate.EnsureRunReadAllowedAsync(
            this, User, scope, runId, cancellationToken);
        if (denied is not null)
            return denied;

        RunDetailDto? detail;

        try
        {
            detail = await authorityQueryService.GetRunDetailAsync(scope, runId, cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapProvenanceSealedManifestConflict(ex);
        }

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
            return MapProvenanceSealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps provenance graph read <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapProvenanceSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
