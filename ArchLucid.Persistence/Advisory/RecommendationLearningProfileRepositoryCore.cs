using System.Text.Json;

using ArchLucid.Contracts.Advisory.Learning;

namespace ArchLucid.Persistence.Advisory;

/// <summary>
///     Shared recommendation-learning profile repository rules for SQL and in-memory implementations.
/// </summary>
internal static class RecommendationLearningProfileRepositoryCore
{
    public const int MaxHistoryTake = 100;
    public const int MaxInMemoryEntries = 500;

    public static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
        WriteIndented = false,
    };

    public static int ClampHistoryTake(int take) => Math.Clamp(take, 1, MaxHistoryTake);

    public static string SerializeProfile(RecommendationLearningProfile profile)
    {
        ArgumentNullException.ThrowIfNull(profile);

        return JsonSerializer.Serialize(profile, JsonOptions);
    }

    public static RecommendationLearningProfile DeserializeProfile(string profileJson, Guid profileId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(profileJson);

        RecommendationLearningProfile? profile;

        try
        {
            profile = JsonSerializer.Deserialize<RecommendationLearningProfile>(profileJson, JsonOptions);
        }
        catch (JsonException ex)
        {
            throw new InvalidOperationException(
                $"RecommendationLearningProfile JSON for profile={profileId} is corrupt.",
                ex);
        }

        if (profile is null)
        {
            throw new InvalidOperationException(
                $"RecommendationLearningProfile JSON for profile={profileId} was empty.");
        }

        return NormalizeDictionaryComparers(profile);
    }

    public static RecommendationLearningProfileRecord ToRecord(Guid profileId, RecommendationLearningProfile profile)
    {
        ArgumentNullException.ThrowIfNull(profile);

        return new RecommendationLearningProfileRecord
        {
            ProfileId = profileId,
            Profile = profile,
        };
    }

    public static bool MatchesScope(
        RecommendationLearningProfile profile,
        Guid tenantId,
        Guid workspaceId,
        Guid projectId)
    {
        ArgumentNullException.ThrowIfNull(profile);

        return profile.TenantId == tenantId
               && profile.WorkspaceId == workspaceId
               && profile.ProjectId == projectId;
    }

    public static RecommendationLearningProfile NormalizeDictionaryComparers(RecommendationLearningProfile profile)
    {
        ArgumentNullException.ThrowIfNull(profile);

        profile.CategoryWeights = new Dictionary<string, double>(profile.CategoryWeights, StringComparer.OrdinalIgnoreCase);
        profile.UrgencyWeights = new Dictionary<string, double>(profile.UrgencyWeights, StringComparer.OrdinalIgnoreCase);
        profile.SignalTypeWeights = new Dictionary<string, double>(profile.SignalTypeWeights, StringComparer.OrdinalIgnoreCase);

        return profile;
    }

    public static void TrimInMemoryEntries<T>(List<T> entries)
    {
        ArgumentNullException.ThrowIfNull(entries);

        if (entries.Count > MaxInMemoryEntries)
            entries.RemoveRange(0, entries.Count - MaxInMemoryEntries);
    }
}
