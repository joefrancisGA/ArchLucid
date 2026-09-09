using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunsController
{
    private async Task<IActionResult?> EnsureArchitectureRequestSealedManifestReadAllowedAsync(
        string requestId,
        IManifestHashService manifestHashService,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        Guid? runGuid = await _runRepository.TryGetRepresentativeRunIdForArchitectureRequestInScopeAsync(
            scope,
            requestId,
            cancellationToken);

        if (runGuid is null)
            return null;

        RunDetailDto? detail = await authorityQuery.GetRunDetailAsync(scope, runGuid.Value, cancellationToken);

        if (detail?.GoldenManifest is null)
            return null;

        try
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                detail.GoldenManifest,
                runGuid.Value.ToString("D"),
                manifestHashService);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }
}
