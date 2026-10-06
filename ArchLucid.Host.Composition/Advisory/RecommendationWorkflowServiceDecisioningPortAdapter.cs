using ArchLucid.Contracts.Advisory.Models;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Host.Composition.Advisory;

/// <summary>
///     Forwards <see cref="ArchLucid.Decisioning.Advisory.Workflow.IRecommendationWorkflowService" /> to the Core
///     persistence port implemented in <c>ArchLucid.Persistence.Advisory.RecommendationWorkflowService</c>.
/// </summary>
internal sealed class RecommendationWorkflowServiceDecisioningPortAdapter(
    ArchLucid.Core.Persistence.Ports.IRecommendationWorkflowService inner)
    : ArchLucid.Decisioning.Advisory.Workflow.IRecommendationWorkflowService
{
    private readonly ArchLucid.Core.Persistence.Ports.IRecommendationWorkflowService _inner =
        inner ?? throw new ArgumentNullException(nameof(inner));

    public Task PersistPlanAsync(
        ImprovementPlan plan,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct) =>
        _inner.PersistPlanAsync(plan, tenantId, workspaceId, projectId, ct);

    public Task<RecommendationRecord?> ApplyActionAsync(
        ScopeContext scope,
        Guid recommendationId,
        string userId,
        string userName,
        RecommendationActionRequest request,
        CancellationToken ct) =>
        _inner.ApplyActionAsync(scope, recommendationId, userId, userName, request, ct);
}
