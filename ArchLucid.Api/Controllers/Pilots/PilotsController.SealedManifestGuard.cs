using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Pilots;

public sealed partial class PilotsController
{
    private async Task<IActionResult?> EnsureRunSealedManifestReadAllowedAsync(
        string runId,
        CancellationToken cancellationToken,
        bool careerExportConflictSchema = false)
    {
        if (!Guid.TryParse(runId, out Guid runGuid))
            return null;

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunDetailDto? detail;

        try
        {
            detail = await _authorityQueryService.GetRunDetailAsync(scope, runGuid, cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapPilotPackSealedManifestConflict(ex, careerExportConflictSchema);
        }

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
            return MapPilotPackSealedManifestConflict(ex, careerExportConflictSchema);
        }

        return null;
    }

    /// <summary>
    ///     Maps pilot pack read/export <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapPilotPackSealedManifestConflict(ConflictException ex, bool careerExportConflictSchema = false)
    {
        string problemType = ResolvePilotPackSealedManifestProblemType(ex);

        if (careerExportConflictSchema)
            return this.CareerArtifactBlockedProblem(ex.Message, problemType);

        return this.ConflictProblem(ex.Message, problemType);
    }

    private static string ResolvePilotPackSealedManifestProblemType(ConflictException ex) =>
        ex.Message.Contains("hash verification failed", StringComparison.OrdinalIgnoreCase)
            ? ProblemTypes.DecisionReceiptSealedHashMismatch
            : ex.Message.Contains("fields are incomplete", StringComparison.OrdinalIgnoreCase)
                ? ProblemTypes.DecisionReceiptSealedIncomplete
                : ProblemTypes.Conflict;

    private async Task<IActionResult?> EnsurePilotRecentDeltasSealedManifestReadAllowedAsync(
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        return await GovernanceScopePostureSealedManifestPreflight.TryGetConflictResultAsync(
            this,
            scope,
            _runDetailQueryService,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);
    }
}
