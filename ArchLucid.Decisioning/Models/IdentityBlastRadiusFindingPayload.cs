namespace ArchLucid.Decisioning.Models;

public sealed class IdentityBlastRadiusFindingPayload
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

    public string RoleName
    {
        get;
        set;
    } = null!;

    public int HopCount
    {
        get;
        set;
    }
}
