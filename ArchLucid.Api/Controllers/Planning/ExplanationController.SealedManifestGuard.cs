using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Planning;

public sealed partial class ExplanationController
{
    private async Task<IActionResult?> EnsureSealedManifestReadAllowedAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await query.GetRunDetailAsync(scope, runId, cancellationToken);

        if (detail?.GoldenManifest is null)
            return null;

        try
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                detail.GoldenManifest,
                runId.ToString("D"),
                manifestHashService);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }

    private async Task<IActionResult?> EnsureCompareRunsSealedManifestReadAllowedAsync(
        Guid baseRunId,
        Guid targetRunId,
        CancellationToken cancellationToken)
    {
        IActionResult? baseGuardResult = await EnsureSealedManifestReadAllowedAsync(baseRunId, cancellationToken);

        if (baseGuardResult is not null)
            return baseGuardResult;

        return await EnsureSealedManifestReadAllowedAsync(targetRunId, cancellationToken);
    }
}
