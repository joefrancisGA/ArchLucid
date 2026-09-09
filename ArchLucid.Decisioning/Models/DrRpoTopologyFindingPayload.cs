namespace ArchLucid.Decisioning.Models;

public sealed class DrRpoTopologyFindingPayload
{
    public string RequirementNodeId
    {
        get;
        set;
    } = null!;

    public string DatastoreNodeId
    {
        get;
        set;
    } = null!;

    public int? RpoMinutes
    {
        get;
        set;
    }

    public int? RtoMinutes
    {
        get;
        set;
    }
}
