using ArchLucid.Contracts.Advisory.Workflow;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Persists <see cref="RecommendationRecord" /> rows scoped by tenant, workspace, project, and run.</summary>
public interface IRecommendationRepository
{
    Task UpsertAsync(RecommendationRecord recommendation, CancellationToken ct);

    Task<RecommendationRecord?> GetByIdAsync(Guid recommendationId, CancellationToken ct);

    Task<IReadOnlyList<RecommendationRecord>> ListByRunAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid runId,
        CancellationToken ct);

    Task<IReadOnlyList<RecommendationRecord>> ListByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string? status,
        int take,
        CancellationToken ct);
}
