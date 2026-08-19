using ArchLucid.Contracts.Advisory.Models;
using ArchLucid.Contracts.Advisory.Workflow;

namespace ArchLucid.Core.Persistence.Ports;

public interface IRecommendationWorkflowService
{
    Task PersistPlanAsync(
        ImprovementPlan plan,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);

    Task<RecommendationRecord?> ApplyActionAsync(
        Guid recommendationId,
        string userId,
        string userName,
        RecommendationActionRequest request,
        CancellationToken ct);
}
