
namespace ArchLucid.Persistence.Advisory;

public sealed class InMemoryRecommendationLearningProfileRepository : IRecommendationLearningProfileRepository
{
    private readonly List<StoredProfile> _profiles = [];
    private readonly Lock _gate = new();

    public Task SaveAsync(RecommendationLearningProfile profile, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(profile);
        RecommendationLearningProfile snapshot = Copy(profile);
        lock (_gate)
        {
            _profiles.Add(new StoredProfile(Guid.NewGuid(), snapshot));
            RecommendationLearningProfileRepositoryCore.TrimInMemoryEntries(_profiles);
        }

        return Task.CompletedTask;
    }

    public Task<RecommendationLearningProfile?> GetLatestAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            StoredProfile? latest = FindLatestForScope(tenantId, workspaceId, projectId);

            return Task.FromResult(latest is null ? null : Copy(latest.Profile));
        }
    }

    public Task<RecommendationLearningProfileRecord?> GetLatestRecordAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            StoredProfile? latest = FindLatestForScope(tenantId, workspaceId, projectId);

            return Task.FromResult(latest is null ? null : ToRecord(latest));
        }
    }

    public Task<IReadOnlyList<RecommendationLearningProfileRecord>> ListHistoryAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        int boundedTake = RecommendationLearningProfileRepositoryCore.ClampHistoryTake(take);

        lock (_gate)
        {
            List<RecommendationLearningProfileRecord> history = _profiles
                .Where(x => RecommendationLearningProfileRepositoryCore.MatchesScope(
                    x.Profile,
                    tenantId,
                    workspaceId,
                    projectId))
                .OrderByDescending(x => x.Profile.GeneratedUtc)
                .Take(boundedTake)
                .Select(ToRecord)
                .ToList();

            return Task.FromResult<IReadOnlyList<RecommendationLearningProfileRecord>>(history);
        }
    }

    public Task<RecommendationLearningProfileRecord?> GetByProfileIdAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid profileId,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            StoredProfile? match = _profiles.FirstOrDefault(x =>
                x.ProfileId == profileId
                && RecommendationLearningProfileRepositoryCore.MatchesScope(
                    x.Profile,
                    tenantId,
                    workspaceId,
                    projectId));

            return Task.FromResult(match is null ? null : ToRecord(match));
        }
    }

    private StoredProfile? FindLatestForScope(Guid tenantId, Guid workspaceId, Guid projectId)
    {
        return _profiles
            .Where(x => RecommendationLearningProfileRepositoryCore.MatchesScope(
                x.Profile,
                tenantId,
                workspaceId,
                projectId))
            .OrderByDescending(x => x.Profile.GeneratedUtc)
            .FirstOrDefault();
    }

    private static RecommendationLearningProfileRecord ToRecord(StoredProfile stored) =>
        RecommendationLearningProfileRepositoryCore.ToRecord(stored.ProfileId, Copy(stored.Profile));

    private static RecommendationLearningProfile Copy(RecommendationLearningProfile profile) => new()
    {
        TenantId = profile.TenantId,
        WorkspaceId = profile.WorkspaceId,
        ProjectId = profile.ProjectId,
        GeneratedUtc = profile.GeneratedUtc,
        CategoryStats = profile.CategoryStats.Select(Copy).ToList(),
        UrgencyStats = profile.UrgencyStats.Select(Copy).ToList(),
        SignalTypeStats = profile.SignalTypeStats.Select(Copy).ToList(),
        CategoryWeights = new(profile.CategoryWeights, profile.CategoryWeights.Comparer),
        UrgencyWeights = new(profile.UrgencyWeights, profile.UrgencyWeights.Comparer),
        SignalTypeWeights = new(profile.SignalTypeWeights, profile.SignalTypeWeights.Comparer),
        Notes = [..profile.Notes],
    };

    private static RecommendationOutcomeStats Copy(RecommendationOutcomeStats stats) => new()
    {
        Key = stats.Key,
        ProposedCount = stats.ProposedCount,
        AcceptedCount = stats.AcceptedCount,
        RejectedCount = stats.RejectedCount,
        DeferredCount = stats.DeferredCount,
        ImplementedCount = stats.ImplementedCount,
    };

    private sealed record StoredProfile(Guid ProfileId, RecommendationLearningProfile Profile);
}
