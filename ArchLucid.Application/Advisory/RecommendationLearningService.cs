using ArchLucid.Contracts.Advisory.Learning;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Decisioning.Advisory.Learning;
using ArchLucid.Decisioning.Advisory.Workflow;

namespace ArchLucid.Application.Advisory;

/// <summary>
///     Default <see cref = "IRecommendationLearningService"/>: pulls recommendation history, builds a profile via
///     <see cref = "IRecommendationLearningAnalyzer"/>, and persists via
///     <see cref = "IRecommendationLearningProfileRepository"/>.
/// </summary>
/// <param name = "recommendationRepository">Historical rows for the scope (capped batch).</param>
/// <param name = "analyzer">Pure aggregation into <see cref = "RecommendationLearningProfile"/>.</param>
/// <param name = "profileRepository">Stores and loads latest profile.</param>
public sealed class RecommendationLearningService(
    IRecommendationRepository recommendationRepository,
    IRecommendationLearningAnalyzer analyzer,
    IRecommendationLearningProfileRepository profileRepository,
    RecommendationLearningBuildGate buildGate) : IRecommendationLearningService
{
    /// <summary>
    ///     Maximum number of historical recommendation rows loaded per profile rebuild.
    ///     Caps the working set to keep analysis latency predictable even for high-volume projects.
    /// </summary>
    private const int ProfileRebuildBatchCap = 5000;

    /// <inheritdoc/>
    public async Task<RecommendationLearningProfile> RebuildProfileAsync(Guid tenantId, Guid workspaceId, Guid projectId, CancellationToken ct)
    {
        await using IAsyncDisposable gate = await buildGate.AcquireAsync(tenantId, workspaceId, projectId, ct).ConfigureAwait(false);

        IReadOnlyList<RecommendationRecord> items =
            await recommendationRepository.ListByScopeAsync(tenantId, workspaceId, projectId, null, ProfileRebuildBatchCap, ct);
        (IReadOnlyList<RecommendationRecord> eligible, _) =
            RecommendationLearningOperationalSupport.PartitionOutcomes(items, ProfileRebuildBatchCap);

        int eligibleCount = eligible.Count;

        if (eligibleCount < RecommendationLearningAlgorithmVersions.MinimumEligibleOutcomes)
        {
            throw new InvalidOperationException(
                RecommendationLearningOperationalSupport.ResolveBlockingReason(
                    eligibleCount,
                    RecommendationLearningAlgorithmVersions.MinimumEligibleOutcomes));
        }

        RecommendationLearningProfile profile = analyzer.BuildProfile(tenantId, workspaceId, projectId, eligible.ToList());
        await profileRepository.SaveAsync(profile, ct);
        return profile;
    }

    /// <inheritdoc/>
    public Task<RecommendationLearningProfile?> GetLatestProfileAsync(Guid tenantId, Guid workspaceId, Guid projectId, CancellationToken ct)
    {
        return profileRepository.GetLatestAsync(tenantId, workspaceId, projectId, ct);
    }
}
