using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class ArtifactExportController
{
    /// <summary>Wave-21 suggestion 208: signed review record reads fail-closed when sealed manifest hash is missing or divergent.</summary>
    private IActionResult? EnsureSealedManifestHashOrConflict(ManifestDocument? manifest, string runIdLabel)
    {
        if (manifest is null)
        {
            return this.ConflictProblem(
                $"Signed review record read blocked for run '{runIdLabel}': committed golden manifest is missing for sealed manifest hash verification.",
                ProblemTypes.Conflict);
        }
        try
        {
            SealedManifestReadGuard.EnsureSealedManifestHashMatchesOrThrow(
                manifest,
                runIdLabel,
                manifestHashService);
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }

    private IActionResult? EnsureAuthorityLifecycleCompleteOrConflict(RunDetailDto runDetail, Guid runId)
    {
        try
        {
            AuthorityLifecycleCompareExportGuard.EnsureCompleteOrThrow(
                AuthorityRunLifecyclePhaseListResolver.ResolveFromRunHeader(runDetail.Run),
                runId.ToString("D"));
        }
        catch (ConflictException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }

    private async Task<IActionResult?> EnsureRunSealedManifestHashOrConflictAsync(
        ScopeContext scope,
        Guid runId,
        CancellationToken cancellationToken)
    {
        RunDetailDto? detail = await authorityQueryService.GetRunDetailForManifestCompareAsync(scope, runId, cancellationToken);

        if (detail?.GoldenManifest is null)
            return null;

        return EnsureSealedManifestHashOrConflict(detail.GoldenManifest, runId.ToString("D"));
    }
}
