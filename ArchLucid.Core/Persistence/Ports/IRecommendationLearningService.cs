using ArchLucid.Contracts.Advisory.Learning;

namespace ArchLucid.Core.Persistence.Ports;

public interface IRecommendationLearningService
{
    Task<RecommendationLearningProfile> RebuildProfileAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);

    Task<RecommendationLearningProfile?> GetLatestProfileAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);
}
