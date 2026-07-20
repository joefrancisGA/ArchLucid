using System.Diagnostics;

using ArchLucid.Contracts.Advisory.Learning;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Decisioning.Advisory.Learning;

namespace ArchLucid.Application.Advisory;

/// <summary>Internal operator workflows for recommendation-learning profile inspection and lifecycle.</summary>
public sealed class RecommendationLearningOperationalService(
    IRecommendationRepository recommendationRepository,
    IRecommendationLearningProfileRepository profileRepository,
    IRecommendationLearningAnalyzer analyzer,
    RecommendationLearningBuildGate buildGate) : IRecommendationLearningOperationalService
{
    public async Task<RecommendationLearningOperationalStatusResponse> GetOperationalStatusAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string environmentName,
        CancellationToken ct)
    {
        IReadOnlyList<RecommendationRecord> records = await recommendationRepository.ListByScopeAsync(
            tenantId,
            workspaceId,
            projectId,
            status: null,
            RecommendationLearningAlgorithmVersions.RebuildBatchCap,
            ct).ConfigureAwait(false);

        (IReadOnlyList<RecommendationRecord> eligible, RecommendationLearningOutcomeEligibilityBreakdown eligibility) =
            RecommendationLearningOperationalSupport.PartitionOutcomes(records, RecommendationLearningAlgorithmVersions.RebuildBatchCap);

        RecommendationLearningProfileRecord? active =
            await profileRepository.GetLatestRecordAsync(tenantId, workspaceId, projectId, ct).ConfigureAwait(false);

        int eligibleCount = RecommendationLearningOperationalSupport.CountEligibleOutcomes(eligibility);
        int minimumRequired = RecommendationLearningAlgorithmVersions.MinimumEligibleOutcomes;

        return new RecommendationLearningOperationalStatusResponse
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            EnvironmentName = environmentName,
            ScopeLabel = RecommendationLearningOperationalSupport.BuildScopeLabel(tenantId, workspaceId, projectId),
            ProfileState = RecommendationLearningOperationalSupport.ResolveProfileState(active, eligibleCount, minimumRequired),
            EligibleOutcomeCount = eligibleCount,
            ProposedOutcomeCount = eligibility.ProposedExcluded,
            MinimumRequiredOutcomes = minimumRequired,
            RebuildBatchCap = RecommendationLearningAlgorithmVersions.RebuildBatchCap,
            OldestEligibleOutcomeUtc = eligible.Count == 0 ? null : eligible.Min(x => x.LastUpdatedUtc),
            NewestEligibleOutcomeUtc = eligible.Count == 0 ? null : eligible.Max(x => x.LastUpdatedUtc),
            LastAttemptedBuildUtc = active?.Profile.GeneratedUtc,
            LastBuildResult = active is null ? null : "Succeeded",
            BlockingReason = RecommendationLearningOperationalSupport.ResolveBlockingReason(eligibleCount, minimumRequired),
            ActiveProfile = active is null
                ? null
                : RecommendationLearningOperationalSupport.ToMetadata(active, isActive: true, eligibility),
            Eligibility = eligibility,
        };
    }

    public async Task<RecommendationLearningPreviewResponse> PreviewRebuildAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string correlationId,
        CancellationToken ct)
    {
        await using IAsyncDisposable gate = await buildGate.AcquireAsync(tenantId, workspaceId, projectId, ct).ConfigureAwait(false);

        Stopwatch stopwatch = Stopwatch.StartNew();

        IReadOnlyList<RecommendationRecord> records = await recommendationRepository.ListByScopeAsync(
            tenantId,
            workspaceId,
            projectId,
            status: null,
            RecommendationLearningAlgorithmVersions.RebuildBatchCap,
            ct).ConfigureAwait(false);

        (IReadOnlyList<RecommendationRecord> eligible, RecommendationLearningOutcomeEligibilityBreakdown eligibility) =
            RecommendationLearningOperationalSupport.PartitionOutcomes(records, RecommendationLearningAlgorithmVersions.RebuildBatchCap);

        int eligibleCount = RecommendationLearningOperationalSupport.CountEligibleOutcomes(eligibility);

        if (eligibleCount < RecommendationLearningAlgorithmVersions.MinimumEligibleOutcomes)
        {
            throw new InvalidOperationException(
                RecommendationLearningOperationalSupport.ResolveBlockingReason(
                    eligibleCount,
                    RecommendationLearningAlgorithmVersions.MinimumEligibleOutcomes));
        }

        RecommendationLearningProfile? current =
            await profileRepository.GetLatestAsync(tenantId, workspaceId, projectId, ct).ConfigureAwait(false);

        RecommendationLearningProfile proposed = analyzer.BuildProfile(tenantId, workspaceId, projectId, eligible.ToList());
        stopwatch.Stop();

        return new RecommendationLearningPreviewResponse
        {
            ProposedProfile = proposed,
            WeightDeltas = RecommendationLearningOperationalSupport.BuildWeightDeltas(current, proposed),
            ValidationChecks = RecommendationLearningOperationalSupport.ValidateProfile(proposed),
            SourceRecordCount = records.Count,
            EligibleRecordCount = eligible.Count,
            SourceDataStartUtc = eligible.Count == 0 ? null : eligible.Min(x => x.LastUpdatedUtc),
            SourceDataEndUtc = eligible.Count == 0 ? null : eligible.Max(x => x.LastUpdatedUtc),
            BuildDurationMs = stopwatch.ElapsedMilliseconds,
            CorrelationId = correlationId,
        };
    }

    public async Task<IReadOnlyList<RecommendationLearningProfileHistoryItem>> ListHistoryAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        int take,
        CancellationToken ct)
    {
        IReadOnlyList<RecommendationLearningProfileRecord> history =
            await profileRepository.ListHistoryAsync(tenantId, workspaceId, projectId, take, ct).ConfigureAwait(false);

        if (history.Count == 0)
        {
            return [];
        }

        Guid activeProfileId = history[0].ProfileId;

        return history
            .Select(record => RecommendationLearningOperationalSupport.ToHistoryItem(record, record.ProfileId == activeProfileId))
            .ToList();
    }

    public async Task<RecommendationLearningProfile> RollbackAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid profileId,
        CancellationToken ct)
    {
        await using IAsyncDisposable gate = await buildGate.AcquireAsync(tenantId, workspaceId, projectId, ct).ConfigureAwait(false);

        RecommendationLearningProfileRecord? source =
            await profileRepository.GetByProfileIdAsync(tenantId, workspaceId, projectId, profileId, ct).ConfigureAwait(false);

        if (source is null)
        {
            throw new InvalidOperationException($"Profile {profileId} was not found for the current scope.");
        }

        RecommendationLearningProfile rollback = new()
        {
            TenantId = source.Profile.TenantId,
            WorkspaceId = source.Profile.WorkspaceId,
            ProjectId = source.Profile.ProjectId,
            GeneratedUtc = TimeProvider.System.UtcNowDateTime(),
            CategoryStats = source.Profile.CategoryStats,
            UrgencyStats = source.Profile.UrgencyStats,
            SignalTypeStats = source.Profile.SignalTypeStats,
            CategoryWeights = new Dictionary<string, double>(source.Profile.CategoryWeights, StringComparer.OrdinalIgnoreCase),
            UrgencyWeights = new Dictionary<string, double>(source.Profile.UrgencyWeights, StringComparer.OrdinalIgnoreCase),
            SignalTypeWeights = new Dictionary<string, double>(source.Profile.SignalTypeWeights, StringComparer.OrdinalIgnoreCase),
            Notes =
            [
                $"Rollback from profile {profileId} at {source.Profile.GeneratedUtc:O}.",
                ..source.Profile.Notes,
            ],
        };

        await profileRepository.SaveAsync(rollback, ct).ConfigureAwait(false);

        return rollback;
    }
}
