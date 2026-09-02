using ArchLucid.Contracts.Advisory.Workflow;

namespace ArchLucid.Application.Advisory;

public interface IAdvisoryWorkflowFacade
{
    Task<ImprovementsPlanLoadResult> GetImprovementsAsync(
        Guid runId,
        Guid? compareToRunId,
        CancellationToken cancellationToken = default);

    Task PersistImprovementPlanAsync(
        ImprovementsPlanLoadResult loadedPlan,
        CancellationToken cancellationToken = default);

    Task<AdvisoryRecommendationsListResult> ListRecommendationsAsync(
        Guid runId,
        CancellationToken cancellationToken = default);

    Task<ApplyRecommendationActionFacadeResult> ApplyRecommendationActionAsync(
        Guid recommendationId,
        string userId,
        string userName,
        RecommendationActionRequest request,
        CancellationToken cancellationToken = default);
}
