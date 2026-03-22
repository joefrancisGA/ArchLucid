using ArchiForge.Decisioning.Advisory.Learning;
using ArchiForge.Decisioning.Advisory.Workflow;

namespace ArchiForge.Persistence.Advisory;

public sealed class RecommendationLearningService(
    IRecommendationRepository recommendationRepository,
    IRecommendationLearningAnalyzer analyzer,
    IRecommendationLearningProfileRepository profileRepository) : IRecommendationLearningService
{
    public async Task<RecommendationLearningProfile> RebuildProfileAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        var items = await recommendationRepository
            .ListByScopeAsync(tenantId, workspaceId, projectId, null, 5000, ct)
            .ConfigureAwait(false);

        var profile = analyzer.BuildProfile(tenantId, workspaceId, projectId, items);

        await profileRepository.SaveAsync(profile, ct).ConfigureAwait(false);
        return profile;
    }

    public Task<RecommendationLearningProfile?> GetLatestProfileAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct) =>
        profileRepository.GetLatestAsync(tenantId, workspaceId, projectId, ct);
}
