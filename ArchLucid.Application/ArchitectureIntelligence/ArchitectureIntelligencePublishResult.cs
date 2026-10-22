namespace ArchLucid.Application.ArchitectureIntelligence;

public sealed class ArchitectureIntelligencePublishResult
{
    public bool Published
    {
        get;
        init;
    }

    public Guid? FindingsSnapshotId
    {
        get;
        init;
    }

    public int RecommendationCount
    {
        get;
        init;
    }

    public string? SkipReason
    {
        get;
        init;
    }
}
