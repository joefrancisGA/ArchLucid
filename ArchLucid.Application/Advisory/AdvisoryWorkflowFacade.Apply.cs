using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Core.Scoping;

using RecommendationActionType = ArchLucid.Contracts.Advisory.Workflow.RecommendationActionType;

namespace ArchLucid.Application.Advisory;

public sealed partial class AdvisoryWorkflowFacade
{
    public async Task<ApplyRecommendationActionFacadeResult> ApplyRecommendationActionAsync(
        Guid recommendationId,
        string userId,
        string userName,
        RecommendationActionRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        RecommendationRecord? existing =
            await _recommendationRepository.GetByIdAsync(recommendationId, cancellationToken);

        if (existing is null)
        {
            return new ApplyRecommendationActionFacadeResult
            {
                Outcome = ApplyRecommendationActionOutcome.NotFound,
                RecommendationId = recommendationId,
            };
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        await AdvisoryApplySealedManifestHashGuard.EnsureRecommendationRunSealedOrThrowAsync(
            existing,
            request,
            scope,
            _authorityQueryService,
            _manifestHashService,
            cancellationToken);

        RecommendationRecord? updated = await _recommendationWorkflowService.ApplyActionAsync(
            recommendationId,
            userId,
            userName,
            request,
            cancellationToken);
        if (updated is null)
        {
            return new ApplyRecommendationActionFacadeResult
            {
                Outcome = ApplyRecommendationActionOutcome.NotFound,
                RecommendationId = recommendationId,
            };
        }

        RecommendationImproveLoopResult? improveLoop = null;
        if (_recommendationImproveLoopCoordinator is not null
            && request.Action is RecommendationActionType.Accept or RecommendationActionType.MarkImplemented)
        {
            improveLoop = await _recommendationImproveLoopCoordinator
                .TryApplyAsync(updated, cancellationToken)
                .ConfigureAwait(false);
            if (_recommendationImproveLoopEvidencePersister is not null)
            {
                await _recommendationImproveLoopEvidencePersister
                    .PersistAsync(scope, updated.RunId, improveLoop, improveLoop?.MergedFindingIds, cancellationToken)
                    .ConfigureAwait(false);
            }
        }

        return new ApplyRecommendationActionFacadeResult
        {
            Outcome = ApplyRecommendationActionOutcome.Success,
            RecommendationId = recommendationId,
            Updated = updated,
            ImproveLoop = improveLoop,
        };
    }
}
