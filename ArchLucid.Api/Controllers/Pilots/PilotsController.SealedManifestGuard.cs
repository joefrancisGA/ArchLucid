using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance.Posture;
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
            return MapPilotPackSealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps pilot pack read/export <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapPilotPackSealedManifestConflict(ConflictException ex)
    {
        string problemType = ex.Message.Contains("hash verification failed", StringComparison.OrdinalIgnoreCase)
            ? ProblemTypes.DecisionReceiptSealedHashMismatch
            : ex.Message.Contains("fields are incomplete", StringComparison.OrdinalIgnoreCase)
                ? ProblemTypes.DecisionReceiptSealedIncomplete
                : ProblemTypes.Conflict;

        return this.ConflictProblem(ex.Message, problemType);
    }

    private async Task<IActionResult?> EnsurePilotRecentDeltasSealedManifestReadAllowedAsync(
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

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
            return MapPilotPackSealedManifestConflict(ex);
        }

        return null;
    }
}
