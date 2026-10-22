using ArchLucid.Contracts.Advisory.Learning;

namespace ArchLucid.Core.Persistence.Ports;

/// <summary>Persistence for <see cref="RecommendationLearningProfile" /> snapshots.</summary>
public interface IRecommendationLearningProfileRepository
{
    Task SaveAsync(RecommendationLearningProfile profile, CancellationToken ct);

    Task<RecommendationLearningProfile?> GetLatestAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);

    Task<RecommendationLearningProfileRecord?> GetLatestRecordAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct);

    Task<IReadOnlyList<RecommendationLearningProfileRecord>> ListHistoryAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken ct);

    Task<RecommendationLearningProfileRecord?> GetByProfileIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid profileId,
        CancellationToken ct);
}
