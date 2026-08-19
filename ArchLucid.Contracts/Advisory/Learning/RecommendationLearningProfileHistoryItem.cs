namespace ArchLucid.Contracts.Advisory.Learning;

/// <summary>One persisted recommendation-learning profile version for a scope.</summary>
public sealed class RecommendationLearningProfileHistoryItem
{
    public Guid ProfileId
    {
        get;
        set;
    }

    public DateTime GeneratedUtc
    {
        get;
        set;
    }

    public int OutcomeCount
    {
        get;
        set;
    }

    public string AlgorithmVersion
    {
        get;
        set;
    } = RecommendationLearningAlgorithmVersions.V1;

    public string ProfileChecksum
    {
        get;
        set;
    } = string.Empty;

    public bool IsActive
    {
        get;
        set;
    }
}
