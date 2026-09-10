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
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }
}
