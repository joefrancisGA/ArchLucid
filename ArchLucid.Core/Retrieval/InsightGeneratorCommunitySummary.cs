namespace ArchLucid.Core.Retrieval;

/// <summary>Bounded community summary exposed to the insight generator when community summarization is enabled (DX-17).</summary>
public sealed class InsightGeneratorCommunitySummary
{
    public required string CommunityId
    {
        get;
        init;
    }

    public required string Summary
    {
        get;
        init;
    }
}
