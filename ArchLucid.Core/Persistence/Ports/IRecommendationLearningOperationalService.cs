using ArchLucid.Contracts.Advisory.Learning;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Internal operator workflows for recommendation-learning profile inspection and lifecycle.</summary>
public interface IRecommendationLearningOperationalService
{
    Task<RecommendationLearningOperationalStatusResponse> GetOperationalStatusAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string environmentName,
        CancellationToken ct);

    Task<RecommendationLearningPreviewResponse> PreviewRebuildAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string correlationId,
        CancellationToken ct);

    Task<IReadOnlyList<RecommendationLearningProfileHistoryItem>> ListHistoryAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken ct);

    Task<RecommendationLearningProfile> RollbackAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid profileId,
        CancellationToken ct);
}
