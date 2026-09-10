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
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private async Task<IActionResult?> EnsureSealedManifestReadAllowedAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(runId, out Guid runGuid))
            return null;

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        RunDetailDto? detail;

        try
        {
            detail = await _authorityQueryService.GetRunDetailAsync(scope, runGuid, cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapProductRunQuerySealedManifestConflict(ex);
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
            return MapProductRunQuerySealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps product run-query read/export <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapProductRunQuerySealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
