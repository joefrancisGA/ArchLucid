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
}
