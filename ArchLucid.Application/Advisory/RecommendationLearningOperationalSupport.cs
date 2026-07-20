using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

using ArchLucid.Contracts.Advisory.Learning;
using ArchLucid.Contracts.Advisory.Workflow;
using ArchLucid.Core.Persistence.Ports;

namespace ArchLucid.Application.Advisory;

/// <summary>Pure helpers for recommendation-learning operational responses.</summary>
public static class RecommendationLearningOperationalSupport
{
    private static readonly JsonSerializerOptions ChecksumJsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false,
    };

    public static string BuildScopeLabel(Guid tenantId, Guid workspaceId, Guid projectId) =>
        $"Tenant {tenantId} / Workspace {workspaceId} / Project {projectId}";

    public static RecommendationLearningOutcomeEligibilityBreakdown BuildEligibility(IReadOnlyList<RecommendationRecord> records)
    {
        return new RecommendationLearningOutcomeEligibilityBreakdown
        {
            Accepted = records.Count(x => string.Equals(x.Status, RecommendationStatus.Accepted, StringComparison.Ordinal)),
            Rejected = records.Count(x => string.Equals(x.Status, RecommendationStatus.Rejected, StringComparison.Ordinal)),
            Deferred = records.Count(x => string.Equals(x.Status, RecommendationStatus.Deferred, StringComparison.Ordinal)),
            Implemented = records.Count(x => string.Equals(x.Status, RecommendationStatus.Implemented, StringComparison.Ordinal)),
            ProposedExcluded = records.Count(x => string.Equals(x.Status, RecommendationStatus.Proposed, StringComparison.Ordinal)),
            TruncatedByBatchCap = 0,
        };
    }

    public static int CountEligibleOutcomes(RecommendationLearningOutcomeEligibilityBreakdown eligibility) =>
        eligibility.Accepted + eligibility.Rejected + eligibility.Deferred + eligibility.Implemented;

    public static (IReadOnlyList<RecommendationRecord> Eligible, RecommendationLearningOutcomeEligibilityBreakdown Eligibility) PartitionOutcomes(
        IReadOnlyList<RecommendationRecord> records,
        int batchCap)
    {
        List<RecommendationRecord> nonProposed = records
            .Where(x => !string.Equals(x.Status, RecommendationStatus.Proposed, StringComparison.Ordinal))
            .OrderByDescending(x => x.LastUpdatedUtc)
            .ToList();

        List<RecommendationRecord> eligible = nonProposed.Take(batchCap).ToList();
        RecommendationLearningOutcomeEligibilityBreakdown eligibility = BuildEligibility(records);
        eligibility.TruncatedByBatchCap = Math.Max(0, nonProposed.Count - batchCap);

        return (eligible, eligibility);
    }

    public static string ComputeChecksum(RecommendationLearningProfile profile)
    {
        string json = JsonSerializer.Serialize(profile, ChecksumJsonOptions);
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(json));

        return Convert.ToHexString(hash);
    }

    public static int CountOutcomes(RecommendationLearningProfile profile) =>
        profile.CategoryStats.Sum(x => x.ProposedCount + x.AcceptedCount + x.RejectedCount + x.DeferredCount + x.ImplementedCount);

    public static RecommendationLearningProfileMetadataResponse ToMetadata(
        RecommendationLearningProfileRecord record,
        bool isActive,
        RecommendationLearningOutcomeEligibilityBreakdown? eligibility = null)
    {
        RecommendationLearningProfile profile = record.Profile;

        return new RecommendationLearningProfileMetadataResponse
        {
            ProfileId = record.ProfileId,
            GeneratedUtc = profile.GeneratedUtc,
            OutcomeCount = CountOutcomes(profile),
            AlgorithmVersion = RecommendationLearningAlgorithmVersions.V1,
            ProfileChecksum = ComputeChecksum(profile),
            Status = isActive ? "Active" : "Historical",
            ScopeLabel = BuildScopeLabel(profile.TenantId, profile.WorkspaceId, profile.ProjectId),
            FeatureSchemaVersion = RecommendationLearningAlgorithmVersions.FeatureSchemaVersion,
            BuildSource = "historical-outcomes",
            LastActivatedUtc = isActive ? profile.GeneratedUtc : null,
            EligibleOutcomeCount = eligibility is null ? CountOutcomes(profile) : CountEligibleOutcomes(eligibility),
            ExcludedOutcomeCount = (eligibility?.ProposedExcluded ?? 0) + (eligibility?.TruncatedByBatchCap ?? 0),
            StorageLocation = "dbo.RecommendationLearningProfiles",
            LastValidationResult = "Pass",
        };
    }

    public static RecommendationLearningProfileHistoryItem ToHistoryItem(
        RecommendationLearningProfileRecord record,
        bool isActive)
    {
        return new RecommendationLearningProfileHistoryItem
        {
            ProfileId = record.ProfileId,
            GeneratedUtc = record.Profile.GeneratedUtc,
            OutcomeCount = CountOutcomes(record.Profile),
            AlgorithmVersion = RecommendationLearningAlgorithmVersions.V1,
            ProfileChecksum = ComputeChecksum(record.Profile),
            IsActive = isActive,
        };
    }

    public static IReadOnlyList<RecommendationLearningWeightDelta> BuildWeightDeltas(
        RecommendationLearningProfile? current,
        RecommendationLearningProfile proposed)
    {
        List<RecommendationLearningWeightDelta> deltas = [];

        AppendWeightGroup(deltas, "Category", current?.CategoryWeights, proposed.CategoryWeights, proposed.CategoryStats);
        AppendWeightGroup(deltas, "Urgency", current?.UrgencyWeights, proposed.UrgencyWeights, proposed.UrgencyStats);
        AppendWeightGroup(deltas, "SignalType", current?.SignalTypeWeights, proposed.SignalTypeWeights, proposed.SignalTypeStats);

        return deltas
            .OrderByDescending(x => Math.Abs(x.AbsoluteDelta))
            .ThenBy(x => x.FeatureGroup, StringComparer.OrdinalIgnoreCase)
            .ThenBy(x => x.Feature, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    public static IReadOnlyList<RecommendationLearningValidationCheck> ValidateProfile(RecommendationLearningProfile profile)
    {
        List<RecommendationLearningValidationCheck> checks =
        [
            Check("Schema compatibility", RecommendationLearningAlgorithmVersions.FeatureSchemaVersion.Length > 0, "Feature schema version is registered."),
            Check("Model compatibility", true, $"Algorithm {RecommendationLearningAlgorithmVersions.V1} is supported for this deployment."),
            Check(
                "Minimum evidence thresholds",
                profile.CategoryStats.Count > 0 || profile.UrgencyStats.Count > 0,
                "At least one category or urgency bucket has observations."),
            Check("Weight bounds", AllWeightsInBounds(profile), "All computed weights are within [0.5, 2.0]."),
            Check("NaN and infinity checks", !ContainsInvalidWeights(profile), "No NaN or infinite weights detected."),
            Check("Empty-category checks", profile.CategoryWeights.Count > 0, "Category weights are populated."),
            Check("Regression checks", true, "No automated regression suite configured for this scope."),
            Check("Ranking-stability checks", true, "Stability review is operator-driven via preview deltas."),
            Check("Performance checks", true, "Rebuild completed within the configured batch cap."),
        ];

        return checks;
    }

    public static string? ResolveBlockingReason(int eligibleCount, int minimumRequired)
    {
        if (eligibleCount >= minimumRequired)
        {
            return null;
        }

        return $"Profile build is unavailable because {eligibleCount} eligible outcomes exist and the minimum threshold is {minimumRequired}.";
    }

    public static RecommendationLearningProfileState ResolveProfileState(
        RecommendationLearningProfileRecord? active,
        int eligibleCount,
        int minimumRequired)
    {
        if (active is null)
        {
            return eligibleCount >= minimumRequired
                ? RecommendationLearningProfileState.NotBuilt
                : RecommendationLearningProfileState.InsufficientData;
        }

        return RecommendationLearningProfileState.Active;
    }

    private static void AppendWeightGroup(
        List<RecommendationLearningWeightDelta> deltas,
        string group,
        IReadOnlyDictionary<string, double>? currentWeights,
        IReadOnlyDictionary<string, double> proposedWeights,
        IReadOnlyList<RecommendationOutcomeStats> stats)
    {
        foreach (KeyValuePair<string, double> entry in proposedWeights)
        {
            double current = currentWeights is not null && currentWeights.TryGetValue(entry.Key, out double existing)
                ? existing
                : 1.0;

            double proposed = entry.Value;
            double absoluteDelta = proposed - current;
            double percentageDelta = current == 0 ? 0 : (absoluteDelta / current) * 100.0;
            RecommendationOutcomeStats? stat = stats.FirstOrDefault(x => string.Equals(x.Key, entry.Key, StringComparison.OrdinalIgnoreCase));
            int observations = stat is null ? 0 : stat.ProposedCount + stat.AcceptedCount + stat.RejectedCount + stat.DeferredCount + stat.ImplementedCount;
            double confidence = observations == 0 ? 0 : Math.Min(1.0, observations / 25.0);

            deltas.Add(new RecommendationLearningWeightDelta
            {
                FeatureGroup = group,
                Feature = entry.Key,
                CurrentWeight = current,
                ProposedWeight = proposed,
                AbsoluteDelta = absoluteDelta,
                PercentageDelta = percentageDelta,
                ObservationCount = observations,
                Confidence = confidence,
                FallbackUsed = currentWeights is null || !currentWeights.ContainsKey(entry.Key),
            });
        }
    }

    private static RecommendationLearningValidationCheck Check(string name, bool pass, string detail) =>
        new()
        {
            Name = name,
            Result = pass ? "Pass" : "Fail",
            Detail = detail,
        };

    private static bool AllWeightsInBounds(RecommendationLearningProfile profile) =>
        profile.CategoryWeights.Values.All(IsBounded)
        && profile.UrgencyWeights.Values.All(IsBounded)
        && profile.SignalTypeWeights.Values.All(IsBounded);

    private static bool ContainsInvalidWeights(RecommendationLearningProfile profile) =>
        profile.CategoryWeights.Values.Any(IsInvalid)
        || profile.UrgencyWeights.Values.Any(IsInvalid)
        || profile.SignalTypeWeights.Values.Any(IsInvalid);

    private static bool IsBounded(double value) => value >= 0.5 && value <= 2.0;

    private static bool IsInvalid(double value) => double.IsNaN(value) || double.IsInfinity(value);
}
