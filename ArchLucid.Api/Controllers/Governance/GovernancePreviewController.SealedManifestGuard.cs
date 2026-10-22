using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance.Preview;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernancePreviewController
{
    private async Task<IActionResult?> EnsureGovernancePreviewRunSealedManifestReadAllowedAsync(
        string runId,
        ScopeContext scope,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParse(runId, out Guid parsedRunId) || parsedRunId == Guid.Empty)
            return null;

        RunDetailDto? detail =
            await _authorityQueryService.GetRunDetailForManifestCompareAsync(
                scope,
                parsedRunId,
                cancellationToken);

        // Unknown runs must reach PreviewActivationAsync so the route returns 404, not sealed-manifest 409.

        if (detail is null)
            return null;

        try
        {
            await GovernancePreviewSealedManifestHashGuard.EnsureRunSealedManifestHashOrThrowAsync(
                runId,
                scope,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapGovernancePreviewSealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps governance preview read <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapGovernancePreviewSealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
}
