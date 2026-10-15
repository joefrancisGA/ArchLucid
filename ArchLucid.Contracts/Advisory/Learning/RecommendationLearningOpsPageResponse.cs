using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Advisory.Learning;

/// <summary>Internal recommendation-learning ops page: status, latest profile, and history in one payload.</summary>
public sealed class RecommendationLearningOpsPageResponse
{
    public RecommendationLearningOperationalStatusResponse Status
    {
        get;
        init;
    } = new();

    public RecommendationLearningProfile? LatestProfile
    {
        get;
        init;
    }

    private IReadOnlyList<RecommendationLearningProfileHistoryItem> history = [];

    public IReadOnlyList<RecommendationLearningProfileHistoryItem> History
    {
        get => history;
        init => history = ContractCollectionDefaults.CoalesceReadOnly(value);
    }
}
