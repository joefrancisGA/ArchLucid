using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance.Posture;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Pilots;

public sealed partial class PilotsBoardPackController
{
    private async Task<IActionResult?> EnsureBoardPackSealedManifestReadAllowedAsync(
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
            return MapPilotBoardPackSealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps board-pack read/export <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapPilotBoardPackSealedManifestConflict(ConflictException ex)
    {
        string problemType = ex.Message.Contains("hash verification failed", StringComparison.OrdinalIgnoreCase)
            ? ProblemTypes.DecisionReceiptSealedHashMismatch
            : ex.Message.Contains("fields are incomplete", StringComparison.OrdinalIgnoreCase)
                ? ProblemTypes.DecisionReceiptSealedIncomplete
                : ProblemTypes.Conflict;

        return this.ConflictProblem(ex.Message, problemType);
    }
}
