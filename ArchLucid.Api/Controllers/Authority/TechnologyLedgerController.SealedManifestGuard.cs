using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class TechnologyLedgerController
{
    private readonly IAuthorityQueryService _authorityQueryService =
        authorityQueryService ?? throw new ArgumentNullException(nameof(authorityQueryService));

    private async Task<IActionResult?> EnsureSealedManifestReadAllowedAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        RunDetailDto? detail =
            await _authorityQueryService.GetRunDetailAsync(scope, runId, cancellationToken);

        if (detail?.GoldenManifest is null)
            return null;

        try
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                detail.GoldenManifest,
                runId.ToString("D"),
                _manifestHashService);
        }
        catch (ConflictException ex)
        {
            return MapTechnologyLedgerSealedManifestConflict(ex);

        }

        return null;
    }

    /// <summary>
    ///     Maps technology ledger mutation <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapTechnologyLedgerSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
