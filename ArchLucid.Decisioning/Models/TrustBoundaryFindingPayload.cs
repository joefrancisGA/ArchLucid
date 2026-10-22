namespace ArchLucid.Decisioning.Models;

public sealed class TrustBoundaryFindingPayload
{
    public int ActorCount
    {
        get;
        set;
    }

    public int InternalActorCount
    {
        get;
        set;
    }

    public int ExternalActorCount
    {
        get;
        set;
    }
}
