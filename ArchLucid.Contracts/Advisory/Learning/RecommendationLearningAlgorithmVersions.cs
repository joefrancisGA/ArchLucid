namespace ArchLucid.Contracts.Advisory.Learning;

/// <summary>Stable algorithm identifiers surfaced to internal recommendation-learning operators.</summary>
public static class RecommendationLearningAlgorithmVersions
{
    public const string V1 = "recommendation-ranking-v1";

    public const string FeatureSchemaVersion = "outcome-stats-v1";

    public const int MinimumEligibleOutcomes = 1;

    public const int RebuildBatchCap = 5000;
}
