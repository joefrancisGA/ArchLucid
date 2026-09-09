using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
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
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }

        return null;
    }
}
