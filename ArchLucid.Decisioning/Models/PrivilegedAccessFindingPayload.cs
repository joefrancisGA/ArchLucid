namespace ArchLucid.Decisioning.Models;

public sealed class PrivilegedAccessFindingPayload
{
    public string ActorNodeId
    {
        get;
        set;
    } = string.Empty;

    public string ActorLabel
    {
        get;
        set;
    } = string.Empty;

    public string Kind
    {
        get;
        set;
    } = string.Empty;
}
