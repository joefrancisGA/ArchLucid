namespace ArchLucid.Core.Retrieval;

/// <summary>Detected community partition over a <see cref="Contracts.Persistence.Graph.GraphSnapshot" />.</summary>
public sealed class GraphCommunity
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
}
