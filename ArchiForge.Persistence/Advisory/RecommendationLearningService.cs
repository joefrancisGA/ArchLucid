using ArchiForge.Decisioning.Advisory.Learning;
using ArchiForge.Decisioning.Advisory.Workflow;

namespace ArchiForge.Persistence.Advisory;

/// <summary>
/// Default <see cref="IRecommendationLearningService"/>: pulls recommendation history, builds a profile via <see cref="IRecommendationLearningAnalyzer"/>, and persists via <see cref="IRecommendationLearningProfileRepository"/>.
/// </summary>
/// <param name="recommendationRepository">Historical rows for the scope (capped batch).</param>
/// <param name="analyzer">Pure aggregation into <see cref="RecommendationLearningProfile"/>.</param>
/// <param name="profileRepository">Stores and loads latest profile.</param>
public sealed class RecommendationLearningService(
    IRecommendationRepository recommendationRepository,
    IRecommendationLearningAnalyzer analyzer,
    IRecommendationLearningProfileRepository profileRepository) : IRecommendationLearningService
{
    /// <inheritdoc />
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

    /// <inheritdoc />
    public Task<RecommendationLearningProfile?> GetLatestProfileAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct) =>
        profileRepository.GetLatestAsync(tenantId, workspaceId, projectId, ct);
}
