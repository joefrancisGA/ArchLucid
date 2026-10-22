using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernancePreCommitSimulationController
{
    private async Task<IActionResult?> EnsurePreCommitSimulationSealedManifestAllowedAsync(
        Guid runGuid,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        try
        {
            await PreCommitSimulationSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runGuid,
                scope,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapPreCommitSimulationSealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps pre-commit simulation <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapPreCommitSimulationSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
