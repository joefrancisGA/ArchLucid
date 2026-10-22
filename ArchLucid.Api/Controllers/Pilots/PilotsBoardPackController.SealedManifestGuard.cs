using ArchLucid.Api.Attributes;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
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

        return await GovernanceScopePostureSealedManifestPreflight.TryGetConflictResultAsync(
            this,
            scope,
            _runDetailQueryService,
            _authorityQueryService,
            _manifestHashService,
            static (controller, exception) =>
                ((PilotsBoardPackController)controller).MapPilotBoardPackSealedManifestConflict(exception),
            cancellationToken);
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
