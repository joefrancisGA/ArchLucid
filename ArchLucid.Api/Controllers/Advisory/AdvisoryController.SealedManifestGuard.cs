using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Application.Advisory;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Advisory;

public sealed partial class AdvisoryController
{
    private readonly IRecommendationRepository _recommendationRepository =
        recommendationRepository ?? throw new ArgumentNullException(nameof(recommendationRepository));

    private async Task<IActionResult?> EnsureAdvisoryApplySealedManifestAllowedAsync(
        Guid recommendationId,
        RecommendationActionRequest request,
        CancellationToken cancellationToken)
    {
        RecommendationRecord? recommendation =
            await _recommendationRepository.GetByIdAsync(recommendationId, cancellationToken);

        if (recommendation is null)
            return null;

        ScopeContext scope = _scopeProvider.GetCurrentScope();

        try
        {
            await AdvisoryApplySealedManifestHashGuard.EnsureRecommendationRunSealedOrThrowAsync(
                recommendation,
                request,
                scope,
                _authorityQueryService,
                _manifestHashService,
                cancellationToken);
        }
        catch (ConflictException ex)
        {
            return MapAdvisorySealedManifestConflict(ex);
        }

        return null;
    }

    /// <summary>
    ///     Maps advisory workflow <see cref="ConflictException" /> raised via sealed-manifest guards to OpenAPI **409**.
    /// </summary>
    private IActionResult MapAdvisorySealedManifestConflict(ConflictException ex) =>
        this.ConflictProblem(ex.Message, ProblemTypes.Conflict);

    private async Task<IActionResult?> EnsureSealedManifestReadAllowedAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await _authorityQueryService.GetRunDetailAsync(scope, runId, cancellationToken);

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
            return MapAdvisorySealedManifestConflict(ex);
        }

        return null;
    }
}
