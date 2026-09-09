using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Planning;

public sealed partial class FindingFeedbackController
{
    private readonly IManifestHashService _manifestHashService =
        manifestHashService ?? throw new ArgumentNullException(nameof(manifestHashService));

    private async Task<IActionResult?> EnsureRunScopedFindingFeedbackSealedManifestReadAllowedAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await _authorityQuery.GetRunDetailAsync(scope, runId, cancellationToken);

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
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }
}
