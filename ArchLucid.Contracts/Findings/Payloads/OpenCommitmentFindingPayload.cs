namespace ArchLucid.Contracts.Findings.Payloads;

public class OpenCommitmentFindingPayload
{
    public string SignalKind
    {
        get;
        set;
    } = null!;

    public string SourceFindingId
    {
        get;
        set;
    } = null!;

    public DateTimeOffset DueOrExpiryUtc
    {
        get;
        set;
    }

    public int DaysOverdueOrUntilExpiry
    {
        get;
        set;
    }

    /// <summary>
    ///     <see langword="true" /> when a topology node on the current graph was matched from the source finding text or
    ///     related-node hints.
    /// </summary>
    public bool TopologyMatch
    {
        get;
        set;
    }

    /// <summary>
    ///     When <see cref="TopologyMatch" /> is <see langword="true" /> and the deferred declaration theme is still unsafe
    ///     on the matched node, the commitment remains open on this review graph.
    /// </summary>
    public bool StillOpenOnCurrentGraph
    {
        get;
        set;
    }

    /// <summary>Matched <see cref="ArchLucid.Contracts.Persistence.Graph.GraphNode.NodeId" /> when <see cref="TopologyMatch" /> is set.</summary>
    public string? MatchedTopologyNodeId
    {
        get;
        set;
    }
}
