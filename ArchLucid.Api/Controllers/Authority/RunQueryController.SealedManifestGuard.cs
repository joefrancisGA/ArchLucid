using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunQueryController
{
<<<<<<< HEAD
=======
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

>>>>>>> origin/master
    private async Task<IActionResult?> EnsureSealedManifestReadAllowedAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(runId, out Guid runGuid))
            return null;

<<<<<<< HEAD
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await authorityQueryService.GetRunDetailAsync(scope, runGuid, cancellationToken);
=======
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await _authorityQueryService.GetRunDetailAsync(scope, runGuid, cancellationToken);
>>>>>>> origin/master

        if (detail?.GoldenManifest is null)
            return null;

        try
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                detail.GoldenManifest,
                runGuid.ToString("D"),
<<<<<<< HEAD
                manifestHashService);
=======
                _manifestHashService);
>>>>>>> origin/master
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }
}
