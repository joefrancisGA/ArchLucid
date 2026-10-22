namespace ArchLucid.Retrieval.Graph;

/// <summary>LLM or deterministic summary payload for one detected community.</summary>
public sealed class GraphCommunitySummary
{
    public required string CommunityId
    {
        get;
        init;
    }

    public required IReadOnlyList<string> MemberNodeIds
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
