namespace ArchLucid.Decisioning.Models;

public sealed class DataFlowTrustBoundaryFindingPayload
{
    public string ActorNodeId
    {
        get;
        set;
    } = null!;

    public string DatastoreNodeId
    {
        get;
        set;
    } = null!;

    public int HopCount
    {
        get;
        set;
    }

    public IReadOnlyList<string> PathNodeIds
    {
        get;
        set;
    } = [];

    public bool CrossedTrustBoundary
    {
        get;
        set;
    }
}
